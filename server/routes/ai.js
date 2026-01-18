/**
 * ============================================================================
 * AI 智能填充路由模块
 * ============================================================================
 * 
 * 功能说明：
 * 使用 Kimi AI 的 Function Calling 功能，从用户输入的案情描述中
 * 自动提取信息并填充到法律表单字段中。
 * 
 * 技术要点：
 * 1. 流式传输 (stream: true) - 实时返回 AI 生成的内容
 * 2. Function Calling - 让 AI 按照预定义的 JSON Schema 返回结构化数据
 * 3. SSE (Server-Sent Events) - 后端向前端推送实时消息
 * 4. 增量 JSON 解析 - 在 AI 生成过程中提取已完成的字段
 * 
 * ============================================================================
 */

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 兼容低版本 Node.js（18以下）的 fetch
const fetch = globalThis.fetch || (await import('node-fetch')).default;

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// 第一部分：配置
// ============================================================================

/**
 * 文件上传配置（使用 multer 中间件）
 * - dest: 临时文件存储目录
 * - limits: 文件大小限制
 * - fileFilter: 文件类型过滤
 */
const upload = multer({
  dest: path.join(__dirname, "../uploads/temp"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 最大 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);  // 允许上传
    } else {
      cb(new Error("不支持的文件格式"));  // 拒绝上传
    }
  },
});

/**
 * Kimi AI API 配置
 * - url: API 端点地址
 * - model: 使用的模型名称
 * - getKey: 获取 API Key 的函数（从环境变量读取）
 * - maxTokens: 最大输出 token 数
 */
const KIMI_CONFIG = {
  url: "https://api.moonshot.cn/v1/chat/completions",
  model: "kimi-k2-turbo-preview",
  getKey: () => process.env.KIMI_API_KEY,
  maxTokens: 16384,
};

/**
 * AI 系统提示词
 * 这段文字会作为 AI 的"指令"，告诉它如何处理用户输入
 */
const SYSTEM_PROMPT = `你是一个精准的法律表单填充助手。

⚠️【最高优先级红线规则】⚠️

1. **自然人字段（含"自然人"、"-人"）**：
   - ✅ **只能填人名**（如"张三"、"李四"）。
   - ❌ **严禁填公司名**！如果在该字段填入"xx公司"、"xx行"、"xx社"，这是严重的错误！
   - **如果原告/被告是单位**：这里的自然人字段**必须留空**！

2. **法人字段（含"法人"）**：
   - ✅ **只能填机构/公司名称**。
   - ❌ **严禁填人名**。

3. **智能判断**：
   - **原告是公司时** -> 跳过所有"原告-人"字段，只填"原告-法人"。
   - **被告是个人时** -> 跳过所有"被告-法人"字段，只填"被告-人"。

其他规则：
- 日期格式：YYYY-MM-DD
- 金额：纯数字
- 多个当事人：
    - 第1个：使用原始key（如 28）
    - 第2个：使用_1后缀（如 28_1）
    - **注意**：如果不确定第2个当事人是否存在，不要臆造。

请仔细检查每个字段的 description 中的警告信息！`;

// ============================================================================
// 第二部分：工具函数
// ============================================================================

/**
 * 解析上传文件的内容
 * 支持 TXT、PDF、DOCX 格式
 * 
 * @param {string} filePath - 文件路径
 * @param {string} originalName - 原始文件名（用于判断扩展名）
 * @returns {Promise<string>} 文件文本内容
 */
async function parseFileContent(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  // TXT 文件：直接读取
  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  // PDF 文件：使用 pdf-parse 库解析
  if (ext === ".pdf") {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  // Word 文件：使用 mammoth 库解析
  if (ext === ".docx" || ext === ".doc") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error("不支持的文件格式");
}

/**
 * 根据表单字段列表生成 Function Calling 的 Tool Schema
 * 
 * 什么是 Function Calling？
 * - 这是 OpenAI 风格 API 的一个功能
 * - 让 AI 以特定的 JSON 格式返回数据，而不是自由文本
 * - 我们定义好每个字段的名称和描述，AI 就会按这个格式填充数据
 * 
 * @param {Array} fieldList - 字段列表 [{fieldKey, fieldLabel, canRepeat}, ...]
 * @returns {Object} Tool Schema 对象
 */
function generateFillTableTool(fieldList) {
  const properties = {};
  const MAX_REPEAT = 2;  // 最多支持 2 个人员（减少 token 消耗）
  
  for (const field of fieldList) {
    // 字段描述，用于告诉 AI 这个字段应该填什么内容
    let baseDesc = field.fieldLabel || `字段${field.fieldKey}`;
    
    // 🔥 动态注入警告（对抗 AI 的幻觉）
    if (baseDesc.includes("自然人") || baseDesc.includes("-人")) {
      baseDesc += "【⚠️ 绝对禁止填公司名！只能填人名！】";
    } else if (baseDesc.includes("法人") || baseDesc.includes("-法人")) {
      baseDesc += "【⚠️ 只能填公司/机构名称】";
    }

    // 基础字段
    properties[field.fieldKey] = {
      type: "string",
      description: baseDesc
    };
    
    // 如果字段可重复（比如多个被告），添加 _1 后缀版本
    if (field.canRepeat) {
      for (let i = 1; i < MAX_REPEAT; i++) {
        properties[`${field.fieldKey}_${i}`] = {
          type: "string",
          description: `${baseDesc}(第${i + 1}人)`
        };
      }
    }
  }

  // 返回符合 OpenAI Function Calling 规范的 Tool Schema
  return {
    type: "function",
    function: {
      name: "fillTable",
      description: "填充表单。多人员用_1后缀（如28_1表示第2个被告姓名）",
      parameters: {
        type: "object",
        properties,
        required: []  // 所有字段都是可选的
      }
    }
  };
}

// ============================================================================
// 第三部分：核心 AI 调用函数（流式）
// ============================================================================

/**
 * 流式调用 Kimi AI 并实时返回字段
 * 
 * 工作原理：
 * 1. 向 Kimi API 发送请求，开启 stream: true
 * 2. Kimi 以 SSE (Server-Sent Events) 格式返回数据流
 * 3. 每个数据块包含 AI 生成的一小段内容
 * 4. 我们累加这些内容，并尝试从中提取已完成的字段
 * 5. 每发现一个完整字段，就立即 yield 出去
 * 
 * 什么是 Generator 函数 (async function*)?
 * - 使用 yield 关键字可以"暂停"函数，返回一个值
 * - 调用者使用 for await...of 循环来逐个获取 yield 的值
 * - 非常适合流式处理场景
 * 
 * @param {string} content - 用户输入的案情描述
 * @param {Array} fieldList - 表单字段列表
 * @yields {{key: string, value: string}} 提取到的字段
 */
async function* streamAIWithTools(content, fieldList) {
  // 1. 检查 API Key
  const apiKey = KIMI_CONFIG.getKey();
  if (!apiKey) {
    throw new Error("未配置 KIMI_API_KEY，请在 .env 文件中设置");
  }

  // 2. 生成 Tool Schema
  const fillTableTool = generateFillTableTool(fieldList);
  console.log("🚀 开始流式 AI 调用...");
  console.log("📦 使用模型:", KIMI_CONFIG.model);

  // 3. 发送请求到 Kimi API
  const response = await fetch(KIMI_CONFIG.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,  // API Key 认证
    },
    body: JSON.stringify({
      model: KIMI_CONFIG.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },  // 系统指令
        { role: "user", content: content }            // 用户输入
      ],
      tools: [fillTableTool],                          // Function Calling 工具
      tool_choice: { type: "function", function: { name: "fillTable" } },  // 强制使用 fillTable
      temperature: 0.3,                                // 温度越低，输出越稳定
      max_tokens: KIMI_CONFIG.maxTokens,
      stream: true,                                    // 🔥 关键：开启流式传输
    }),
  });

  // 4. 检查响应状态
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ API 错误:", response.status, errorText);
    throw new Error(`AI 接口调用失败 (HTTP ${response.status})`);
  }

  // 5. 准备解析流式响应
  let argumentsBuffer = "";           // 累加 AI 返回的 JSON 字符串
  const yieldedKeys = new Set();      // 已经返回过的字段 key（避免重复）

  // 6. 创建流读取器
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";  // 用于存储未完整的行

  // 7. 循环读取流数据
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;  // 流结束

    // 解码二进制数据为文本
    buffer += decoder.decode(value, { stream: true });
    
    // 按换行符分割成多行
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";  // 最后一行可能不完整，保留到下次

    // 处理每一行
    for (const line of lines) {
      // SSE 格式的数据以 "data: " 开头
      if (!line.startsWith("data: ")) continue;
      
      const data = line.slice(6).trim();  // 去掉 "data: " 前缀
      
      // "[DONE]" 表示流结束
      if (data === "[DONE]") {
        console.log("✅ 流式传输完成");
        break;
      }

      try {
        // 解析 JSON 格式的数据块
        const chunk = JSON.parse(data);
        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;
        if (!delta?.tool_calls) continue;

        // 累加 tool_calls 中的 arguments
        for (const tc of delta.tool_calls) {
          if (tc.function?.arguments) {
            argumentsBuffer += tc.function.arguments;
          }
        }

        // 🔥 增量解析：尝试从 buffer 中提取已完成的字段
        // 使用正则匹配 "key": "value" 格式
        const fieldPattern = /"(\d+(?:_\d+)?)": *"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        let match;
        while ((match = fieldPattern.exec(argumentsBuffer)) !== null) {
          const [, key, value] = match;
          
          // 如果这个字段还没有返回过
          if (!yieldedKeys.has(key)) {
            yieldedKeys.add(key);
            
            // 处理 JSON 转义字符
            const decodedValue = value
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            console.log(`📤 推送字段: ${key}`);
            yield { key, value: decodedValue };  // 🎯 实时返回字段
          }
        }
      } catch (e) {
        // JSON 解析失败，可能是不完整的数据，跳过
      }
    }
  }

  // 8. 流结束后，解析完整 JSON 补充可能遗漏的字段
  console.log("📊 最终数据长度:", argumentsBuffer.length, "字符");
  try {
    const result = JSON.parse(argumentsBuffer);
    for (const [key, value] of Object.entries(result)) {
      if (value && !yieldedKeys.has(key)) {
        console.log(`📤 补充推送: ${key}`);
        yield { key, value };
      }
    }
  } catch (e) {
    console.warn("⚠️ 最终 JSON 解析失败，部分字段可能未推送");
  }
}

// ============================================================================
// 第四部分：API 路由
// ============================================================================

/**
 * 流式 AI 解析接口
 * POST /api/ai/parse-stream
 * 
 * 使用 SSE (Server-Sent Events) 实时推送结果给前端
 */
router.post("/parse-stream", upload.single("file"), async (req, res) => {
  let tempFilePath = null;
  
  // 1. 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");  // SSE 内容类型
  res.setHeader("Cache-Control", "no-cache");           // 禁用缓存
  res.setHeader("Connection", "keep-alive");            // 保持连接
  res.setHeader("X-Accel-Buffering", "no");            // 禁用 Nginx 缓冲

  // 辅助函数：发送 SSE 事件
  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    const { text, fields } = req.body;
    const file = req.file;

    sendEvent("progress", { message: "正在解析请求参数..." });

    // 2. 解析字段列表
    let fieldList = [];
    try {
      fieldList = JSON.parse(fields);
    } catch (e) {
      sendEvent("error", { message: "字段列表格式错误" });
      return res.end();
    }

    // 3. 验证输入
    if (!text && !file) {
      sendEvent("error", { message: "请提供文本或上传文件" });
      return res.end();
    }

    // 4. 获取文本内容
    sendEvent("progress", { message: "正在处理输入内容..." });
    let content = text || "";
    if (file) {
      tempFilePath = file.path;
      sendEvent("progress", { message: `正在解析文件: ${file.originalname}` });
      const fileContent = await parseFileContent(file.path, file.originalname);
      content = content ? `${content}\n\n${fileContent}` : fileContent;
    }

    // 5. 调用流式 AI 并推送结果
    sendEvent("progress", { message: "AI 正在分析案情，字段将逐个填充..." });
    
    let fieldCount = 0;
    for await (const field of streamAIWithTools(content, fieldList)) {
      fieldCount++;
      sendEvent("field", {
        key: field.key,
        value: field.value,
        index: fieldCount
      });
    }

    // 6. 完成
    sendEvent("complete", { message: "填充完成", total: fieldCount });

  } catch (error) {
    console.error("❌ AI 解析错误:", error);
    sendEvent("error", { message: error.message });
  } finally {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    res.end();
  }
});

/**
 * 非流式 AI 解析接口（备用）
 * POST /api/ai/parse
 * 
 * 一次性返回所有结果，适合不需要实时更新的场景
 */
router.post("/parse", upload.single("file"), async (req, res) => {
  let tempFilePath = null;

  try {
    const { text, fields } = req.body;
    const file = req.file;

    // 解析字段列表
    let fieldList = [];
    try {
      fieldList = JSON.parse(fields);
    } catch (e) {
      return res.status(400).json({ success: false, message: "字段列表格式错误" });
    }

    // 验证输入
    if (!text && !file) {
      return res.status(400).json({ success: false, message: "请提供文本或上传文件" });
    }

    // 获取文本内容
    let content = text || "";
    if (file) {
      tempFilePath = file.path;
      const fileContent = await parseFileContent(file.path, file.originalname);
      content = content ? `${content}\n\n${fileContent}` : fileContent;
    }

    // 收集所有字段
    const result = {};
    for await (const field of streamAIWithTools(content, fieldList)) {
      result[field.key] = field.value;
    }

    res.json({ success: true, data: result });

  } catch (error) {
    console.error("❌ AI 解析错误:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

export default router;
