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
import os from "os";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import Case from "../models/Case.js";
import Template from "../models/Template.js";

// 兼容低版本 Node.js（18以下）的 fetch
const fetch = globalThis.fetch || (await import("node-fetch")).default;

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
const uploadTempDir = path.join(os.tmpdir(), "fastreplace-uploads");
if (!fs.existsSync(uploadTempDir)) {
  fs.mkdirSync(uploadTempDir, { recursive: true });
}

const upload = multer({
  dest: uploadTempDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 最大 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true); // 允许上传
    } else {
      cb(new Error("不支持的文件格式")); // 拒绝上传
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
  model: "kimi-k2.5",
  getKey: () => process.env.KIMI_API_KEY,
  maxTokens: 16384,
};

const CLAUDE_CONFIG = {
  url: () =>
    process.env.CLAUDE_API_URL ||
    "https://sakuradori.dpdns.org/v1/chat/completions",
  model: "claude-sonnet-4-5-20250929-thinking",
  getKey: () => process.env.CLAUDE_API_KEY,
  maxTokens: 65536,
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
- **主观意愿类字段**（如"是否了解调解"、"是否考虑先行调解"、"了解/不了解"等当事人个人意愿选择）：如果案情资料中没有明确提及，**必须跳过，不要填充**。这些字段只有当事人本人才能决定，AI 不能代为选择。
- **不确定的信息不要臆造**：如果资料中没有提供某个字段的信息（如电话、地址、身份证号等），直接跳过该字段，不要填"不详"。

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
  const MAX_REPEAT = 2; // 最多支持 2 个人员（减少 token 消耗）

  for (const field of fieldList) {
    // 字段描述，用于告诉 AI 这个字段应该填什么内容
    let baseDesc = field.fieldLabel || `字段${field.fieldKey}`;

    // 🔥 动态注入警告（对抗 AI 的幻觉）
    if (baseDesc.includes("自然人") || baseDesc.includes("-人")) {
      baseDesc += "【⚠️ 绝对禁止填公司名！只能填人名！】";
    } else if (baseDesc.includes("法人") || baseDesc.includes("-法人")) {
      baseDesc += "【⚠️ 只能填公司/机构名称】";
    }

    // 基础字段（支持 options 字段的 enum 约束）
    properties[field.fieldKey] = buildFieldSchema(field, baseDesc);

    // 如果字段可重复（比如多个被告），添加 _1 后缀版本
    if (field.canRepeat) {
      for (let i = 1; i < MAX_REPEAT; i++) {
        properties[`${field.fieldKey}_${i}`] = buildFieldSchema(
          field,
          `${baseDesc}(第${i + 1}人)`,
        );
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
        required: [], // 所有字段都是可选的
      },
    },
  };
}

/**
 * 规范化选项列表（只保留 label 字符串）
 * @param {Array} rawOptions
 * @returns {string[]}
 */
function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((opt) => {
      if (typeof opt === "string") return opt;
      if (opt && typeof opt === "object") return opt.label;
      return null;
    })
    .filter(Boolean);
}

/**
 * 根据字段类型构建 JSON Schema
 * - options 字段：添加 enum 约束，防止 AI 输出不匹配值
 * - 其他字段：保持 string
 */
function buildFieldSchema(field, baseDesc) {
  const options = normalizeOptions(field.options);
  let desc = baseDesc;

  if (field?.type === "options" && options.length > 0) {
    // 仅在描述里提示（避免过长）
    if (options.length <= 10) {
      desc += `（仅可选：${options.join(" / ")}）`;
    } else {
      desc += "（仅可在给定选项中选择）";
    }

    if (field.isMultiple) {
      return {
        type: "array",
        description: desc,
        items: { type: "string", enum: options },
        uniqueItems: true,
      };
    }

    return {
      type: "string",
      description: desc,
      enum: options,
    };
  }

  return {
    type: "string",
    description: desc,
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
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 180000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(`AI 请求超时（${timeoutMs}ms）`);
  }, timeoutMs);

  // 1. 检查 API Key
  const apiKey = KIMI_CONFIG.getKey();
  if (!apiKey) {
    throw new Error("未配置 KIMI_API_KEY，请在 .env 文件中设置");
  }

  try {
    // 2. 生成 Tool Schema
    const fillTableTool = generateFillTableTool(fieldList);
    console.log("🚀 开始流式 AI 调用...");
    console.log("📦 使用模型:", KIMI_CONFIG.model);

    // 3. 发送请求到 Kimi API
    const response = await fetch(KIMI_CONFIG.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`, // API Key 认证
      },
      body: JSON.stringify({
        model: KIMI_CONFIG.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT }, // 系统指令
          { role: "user", content: content }, // 用户输入
        ],
        tools: [fillTableTool], // Function Calling 工具
        tool_choice: "auto", // kimi-k2.5 thinking 模式不支持强制指定 tool_choice
        temperature: 1, // kimi-k2.5 只允许 temperature=1
        max_tokens: KIMI_CONFIG.maxTokens,
        stream: true, // 🔥 关键：开启流式传输
      }),
      signal: controller.signal,
    });

    // 4. 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Kimi API 错误:", response.status, errorText);
      let detail = "";
      try {
        detail = JSON.parse(errorText).error?.message || errorText;
      } catch {
        detail = errorText;
      }
      throw new Error(`Kimi AI 调用失败 (${response.status}): ${detail}`);
    }

    // 5. 准备解析流式响应
    let argumentsBuffer = ""; // 累加 AI 返回的 JSON 字符串
    const yieldedKeys = new Set(); // 已经返回过的字段 key（避免重复）

    // 6. 创建流读取器
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; // 用于存储未完整的行

    // 7. 循环读取流数据
    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // 流结束

      // 解码二进制数据为文本
      buffer += decoder.decode(value, { stream: true });

      // 按换行符分割成多行
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 最后一行可能不完整，保留到下次

      // 处理每一行
      for (const line of lines) {
        // SSE 格式的数据以 "data: " 开头
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6).trim(); // 去掉 "data: " 前缀

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
          if (delta.reasoning_content) {
            yield { type: "thinking", content: delta.reasoning_content };
          }
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
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");

              yield { key, value: decodedValue }; // 🎯 实时返回字段
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
          yield { key, value };
        }
      }
    } catch (e) {
      console.warn("⚠️ 最终 JSON 解析失败，部分字段可能未推送");
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`AI 请求超时（${Math.round(timeoutMs / 1000)}秒）`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// 第三部分（续）：Claude AI 调用函数（JSON 输出模式）
// ============================================================================

/**
 * 为 Claude 构建系统提示词（JSON 输出模式）
 * Claude 不支持 Function Calling，通过 prompt 指示直接输出 JSON
 */
function buildClaudeSystemPrompt(fieldList) {
  const MAX_REPEAT = 2;
  const fieldDescriptions = [];
  for (const field of fieldList) {
    let desc = field.fieldLabel || `字段${field.fieldKey}`;
    if (desc.includes("自然人") || desc.includes("-人")) {
      desc += "【绝对禁止填公司名！只能填人名！】";
    } else if (desc.includes("法人") || desc.includes("-法人")) {
      desc += "【只能填公司/机构名称】";
    }
    const opts = normalizeOptions(field.options);
    if (field.type === "options" && opts.length > 0) {
      desc += `（仅可选：${opts.join(" / ")}）`;
    }
    fieldDescriptions.push(`  "${field.fieldKey}": "${desc}"`);
    if (field.canRepeat) {
      for (let i = 1; i < MAX_REPEAT; i++) {
        fieldDescriptions.push(
          `  "${field.fieldKey}_${i}": "${desc}(第${i + 1}人)"`,
        );
      }
    }
  }

  return `${SYSTEM_PROMPT}

【输出格式要求 - 最高优先级】
你必须直接输出一个 JSON 对象。严格遵守以下规则：
1. 不要使用 markdown 代码块（禁止使用 \`\`\`json 或 \`\`\`）
2. 不要使用 function calling
3. 不要输出任何解释文字、注释或前后缀
4. 直接以 { 开头，以 } 结尾
5. 所有值必须是字符串类型，不要使用 null

正确示例：{"28": "张三", "29": "李四"}
错误示例：\`\`\`json\\n{"28": "张三"}\\n\`\`\`

可用字段列表（key: description）：
{
${fieldDescriptions.join(",\n")}
}

只填写你能从用户输入中确定的字段，不确定的不要填。值为字符串类型。`;
}

/**
 * 流式调用 Claude AI 并实时返回字段（JSON 输出模式）
 *
 * 与 streamAIWithTools 的区别：
 * - 不使用 Function Calling
 * - 通过 system prompt 指示 Claude 直接输出 JSON
 * - 从 delta.content 中提取字段
 * - 需要跳过 Claude 的 <think>...</think> 标签
 */
async function* streamAIWithJSON(content, fieldList) {
  const apiKey = CLAUDE_CONFIG.getKey();
  if (!apiKey) {
    throw new Error("未配置 CLAUDE_API_KEY，请在 .env 文件中设置");
  }

  const claudePrompt = buildClaudeSystemPrompt(fieldList);
  console.log("🚀 开始流式 Claude AI 调用...");
  console.log("📦 使用模型:", CLAUDE_CONFIG.model);

  const apiUrl =
    typeof CLAUDE_CONFIG.url === "function"
      ? CLAUDE_CONFIG.url()
      : CLAUDE_CONFIG.url;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CLAUDE_CONFIG.model,
      messages: [
        { role: "system", content: claudePrompt },
        {
          role: "user",
          content: `【任务】请根据以下案情内容提取信息，按要求输出JSON对象。\n\n案情内容：\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Claude API 错误:", response.status, errorText);
    throw new Error(`Claude AI 接口调用失败 (HTTP ${response.status})`);
  }

  let contentBuffer = "";
  const yieldedKeys = new Set();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        console.log("✅ Claude 流式传输完成");
        break;
      }

      try {
        const chunk = JSON.parse(data);
        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;

        // 思考过程：通过 reasoning_content 字段传递
        if (delta?.reasoning_content) {
          yield { type: "thinking", content: delta.reasoning_content };
        }

        // 实际内容：通过 content 字段传递
        if (!delta?.content) continue;
        let text = delta.content;

        // 兼容：如果某些代理仍用 <think> 标签，也做处理
        const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          if (thinkMatch[1]) yield { type: "thinking", content: thinkMatch[1] };
          text = text.replace(/<think>[\s\S]*?<\/think>/g, "");
        }

        if (!text) continue;
        contentBuffer += text;

        // 增量解析前，清理 markdown 代码块标记（Claude 有时会用 ```json 包裹输出）
        const cleanBuffer = contentBuffer.replace(/```(?:json)?\s*/g, "");

        // 增量解析：与 Kimi 使用相同的正则
        const fieldPattern = /"(\d+(?:_\d+)?)": *"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        let match;
        while ((match = fieldPattern.exec(cleanBuffer)) !== null) {
          const [, key, value] = match;
          if (!yieldedKeys.has(key)) {
            yieldedKeys.add(key);
            const decodedValue = value
              .replace(/\\n/g, "\n")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, "\\");
            yield { key, value: decodedValue };
          }
        }
      } catch (e) {
        // JSON 解析失败，跳过
      }
    }
  }

  // 流结束后，解析完整 JSON 补充遗漏字段
  console.log("📊 Claude 最终数据长度:", contentBuffer.length, "字符");
  console.log("📊 Claude 原始内容:", contentBuffer.substring(0, 500));
  try {
    // 清理 markdown 代码块标记
    const cleanContent = contentBuffer.replace(/```(?:json)?\s*/g, "");
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      for (const [key, value] of Object.entries(result)) {
        if (value && !yieldedKeys.has(key)) {
          yield { key, value };
        }
      }
    } else {
      console.warn("⚠️ Claude 输出中未找到 JSON 对象");
    }
  } catch (e) {
    console.warn("⚠️ Claude 最终 JSON 解析失败，部分字段可能未推送", e.message);
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
  const requestId = randomUUID();

  // 1. 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("X-Request-Id", requestId);

  // 立即发送响应头，避免 SSE 被缓冲
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  // 辅助函数：发送 SSE 事件（附带 requestId）
  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, requestId, ...data })}\n\n`);
    if (typeof res.flush === "function") {
      res.flush();
    }
  };

  console.log(`✅ [${requestId}] SSE 连接已建立`);

  // 监听客户端断开（支持前端取消）
  let aborted = false;
  res.on("close", () => {
    if (!res.writableFinished) {
      aborted = true;
      console.log(`🔌 [${requestId}] SSE 客户端已断开`);
    }
  });
  console.log(`✅ [${requestId}] SSE 连接已建立`);

  // SSE 心跳，防止中间代理超时断开
  const keepAliveTimer = setInterval(() => {
    if (res.writableEnded) return;
    res.write(":keep-alive\n\n");
    if (typeof res.flush === "function") {
      res.flush();
    }
  }, 3000);

  try {
    const { text, fields, model } = req.body;
    const file = req.file;
    const isClaudeModel = model === "claude";
    //
    sendEvent("progress", { message: "正在解析请求参数..." });
    console.log(
      `🤖 [${requestId}] 使用模型: ${isClaudeModel ? "Claude" : "Kimi"}`,
    );

    // 2. 解析字段列表
    let fieldList = [];
    try {
      fieldList = JSON.parse(fields);
      console.log(`📝 [${requestId}] 收到 ${fieldList.length} 个字段定义`);
      console.log(
        `📝 [${requestId}] 前10个字段:`,
        fieldList.slice(0, 10).map((f) => `${f.fieldKey}:${f.fieldLabel}`),
      );
    } catch (e) {
      sendEvent("error", { message: "字段列表格式错误" });
      return res.end();
    }

    // 构建字段白名单（只允许 fieldList 中的 key 及其 _N 后缀）
    const allowedKeys = new Set();
    const MAX_REPEAT = 2;
    for (const f of fieldList) {
      allowedKeys.add(String(f.fieldKey));
      if (f.canRepeat) {
        for (let i = 1; i < MAX_REPEAT; i++) {
          allowedKeys.add(`${f.fieldKey}_${i}`);
        }
      }
    }

    console.log(
      `📋 [${requestId}] 字段白名单 (共 ${allowedKeys.size} 个):`,
      Array.from(allowedKeys).slice(0, 20),
      "...",
    );

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
      console.log(
        `📄 [${requestId}] 文件解析结果 (前500字符):`,
        fileContent.substring(0, 500),
      );
      console.log(`📊 [${requestId}] 文件内容长度: ${fileContent.length} 字符`);
      content = content ? `${content}\n\n${fileContent}` : fileContent;
    }

    console.log(
      `📝 [${requestId}] 最终发送给 AI 的内容长度: ${content.length} 字符`,
    );

    // 5. 调用流式 AI 并推送结果（带重试）
    sendEvent("progress", {
      message: `${isClaudeModel ? "Claude" : "Kimi"} AI 正在分析案情，字段将逐个填充...`,
    });
    let fieldCount = 0;
    let rejectedCount = 0;
    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 [${requestId}] 重试第 ${attempt} 次...`);
          sendEvent("progress", {
            message: `AI 重试中（第 ${attempt} 次）...`,
          });
        }

        const generator = isClaudeModel
          ? streamAIWithJSON(content, fieldList)
          : streamAIWithTools(content, fieldList);

        for await (const field of generator) {
          if (aborted) {
            console.log(`⛔ [${requestId}] 客户端已断开，停止推送`);
            return;
          }

          // Claude 思考过程事件
          if (field.type === "thinking") {
            sendEvent("thinking", { content: field.content });
            continue;
          }

          // 字段白名单校验：只允许 fieldList 中的 key
          if (!allowedKeys.has(field.key)) {
            rejectedCount++;
            console.warn(
              `🚫 [${requestId}] 拒绝未知字段: ${field.key} (不在白名单中)`,
            );
            continue;
          }

          fieldCount++;
          sendEvent("field", {
            key: field.key,
            value: field.value,
            index: fieldCount,
          });
        }

        lastError = null;
        break; // 成功，跳出重试循环
      } catch (err) {
        lastError = err;
        console.error(
          `❌ [${requestId}] AI 调用失败 (attempt ${attempt}):`,
          err.message,
        );
        if (attempt < MAX_RETRIES) continue;
      }
    }

    if (lastError) {
      sendEvent("error", {
        message: `AI 调用失败（已重试 ${MAX_RETRIES} 次）：${lastError.message}`,
      });
    } else {
      // 6. 完成
      sendEvent("complete", {
        message: "填充完成",
        total: fieldCount,
        rejected: rejectedCount,
        requestId,
      });
      console.log(
        `✅ [${requestId}] 完成：${fieldCount} 字段已填充，${rejectedCount} 字段被拒绝`,
      );
    }
  } catch (error) {
    console.error(`❌ [${requestId}] AI 解析错误:`, error);
    sendEvent("error", { message: error.message, requestId });
  } finally {
    clearInterval(keepAliveTimer);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (!res.writableEnded) {
      res.end();
    }
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
    const { text, fields, model } = req.body;
    const file = req.file;
    const isClaudeModel = model === "claude";

    // 解析字段列表
    let fieldList = [];
    try {
      fieldList = JSON.parse(fields);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, message: "字段列表格式错误" });
    }

    // 验证输入
    if (!text && !file) {
      return res
        .status(400)
        .json({ success: false, message: "请提供文本或上传文件" });
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
    const generator = isClaudeModel
      ? streamAIWithJSON(content, fieldList)
      : streamAIWithTools(content, fieldList);
    for await (const field of generator) {
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

// ============================================================================
// 第五部分：AI 法律助手聊天（Agent 模式）
// ============================================================================

const CHAT_SYSTEM_PROMPT = `你是 FastReplace 平台的 AI 法律助手。你可以：
1. 回答法律知识问题（民事诉讼、合同纠纷、劳动争议等）
2. 回答平台使用问题
3. 帮用户执行操作（创建案卷、查询案卷、查询可用模板、打开案卷编辑页面）

⚠️【工具调用红线规则 - 最高优先级】⚠️
- 当用户要求执行任何平台操作（创建、查询、删除、打开案卷/模板）时，你 **必须调用对应的工具函数**。
- **绝对禁止** 在文本回复中编造工具调用的结果（如虚构案卷ID、模板列表等）。
- 如果你不确定该调用哪个工具，请先询问用户，而不是伪造结果。
- 即使历史消息中有类似的操作记录，你也必须 **重新调用工具** 获取最新数据，不能复用旧结果。
- **绝对禁止** 从历史消息中复制或引用错误信息（如"请求失败"、"Failed to fetch"等）。每次都必须重新调用工具。
- 当用户要求查看案卷详情时，必须调用 getCaseDetail 获取完整数据，不能仅凭 listCases 的结果直接回复。
- 当用户要求删除案卷时，**直接调用 deleteCase 工具**，不要在文字中自行询问确认。系统会自动弹出确认框。
- 只有在回答纯知识问题（法律咨询、平台使用说明）时，才可以直接文本回复。

其他规则：
- 回答要简洁专业。
- 用户提到的案卷标识通常是名称而非ID。操作前先用 listCases 搜索确认案卷ID，再执行后续操作。
- 如果用户想创建案卷但没指定模板，先用 listTemplates 查询可用模板让用户选择。
- 不确定的法律问题请提醒用户咨询专业律师。`;

const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "listTemplates",
      description: "查询平台可用的文书模板列表",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "listCases",
      description: "查询当前用户的案卷列表",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "createCase",
      description: "为用户创建新案卷",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "案卷标题" },
          template_id: { type: "number", description: "模板ID" },
        },
        required: ["title", "template_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openCase",
      description: "打开指定案卷的编辑页面",
      parameters: {
        type: "object",
        properties: {
          case_id: { type: "number", description: "案卷ID" },
        },
        required: ["case_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteCase",
      description: "删除指定的案卷（危险操作，需确认）",
      parameters: {
        type: "object",
        properties: {
          case_id: { type: "number", description: "要删除的案卷ID" },
        },
        required: ["case_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirmDeleteCase",
      description:
        "用户确认后真正执行删除案卷操作。只有在 deleteCase 返回 needConfirm 且用户确认后才能调用",
      parameters: {
        type: "object",
        properties: {
          case_id: { type: "number", description: "要删除的案卷ID" },
        },
        required: ["case_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCaseDetail",
      description: "获取案卷数据详情",
      parameters: {
        type: "object",
        properties: {
          case_id: { type: "number", description: "案卷数据的ID" },
        },
        required: ["case_id"],
      },
    },
  },
];

async function executeToolCall(name, args, userId) {
  switch (name) {
    case "listTemplates": {
      const templates = await Template.getEnabled();
      return templates.map((t) => ({ id: t.id, name: t.name, desc: t.desc }));
    }
    case "listCases": {
      const result = await Case.getUserCases(userId, 1, 10);
      return result.list.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        template: c.template_name,
      }));
    }
    case "createCase": {
      const caseData = await Case.create({
        title: args.title,
        template_id: args.template_id,
        user_id: userId,
      });
      return {
        id: caseData.id,
        title: caseData.title,
        message: "案卷创建成功",
      };
    }
    case "openCase": {
      return {
        case_id: args.case_id,
        action: "navigate",
        message: "正在打开案卷编辑页面",
      };
    }
    case "deleteCase": {
      // 只返回确认信息，不真正删除
      const caseItem = await Case.findById(args.case_id);
      if (!caseItem) return { error: "案卷不存在" };
      if (caseItem.user_id !== userId) return { error: "无权操作此案卷" };
      return {
        needConfirm: true,
        message: `确认要删除案卷 "${caseItem.title}" 吗？此操作不可撤销。`,
        case_id: args.case_id,
        title: caseItem.title,
      };
    }
    case "confirmDeleteCase": {
      const caseItem = await Case.findById(args.case_id);
      if (!caseItem) return { error: "案卷不存在" };
      if (caseItem.user_id !== userId) return { error: "无权操作此案卷" };
      await Case.delete(args.case_id);
      return {
        message: `案卷 "${caseItem.title}" 已成功删除`,
        case_id: args.case_id,
      };
    }
    case "getCaseDetail": {
      const data = await Case.findById(args.case_id);
      console.log("🔍 getCaseDetail 原始数据:", data);
      if (!data) return { error: "案卷不存在" };
      if (data.user_id !== userId) return { error: "无权查看此案卷" };
      return {
        id: data.id,
        title: data.title,
        status: data.status,
        template_id: data.template_id,
        form_data: data.form_data,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
    default:
      return { error: "未知工具" };
  }
}

/**
 * AI 法律助手聊天接口（SSE 流式 + Agent 工具调用）
 * POST /api/ai/chat
 */
router.post("/chat", express.json(), async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const send = (type, data) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    if (typeof res.flush === "function") res.flush();
  };

  let aborted = false;
  res.on("close", () => {
    if (!res.writableFinished) aborted = true;
  });

  const keepAlive = setInterval(() => {
    if (!res.writableEnded) res.write(":keep-alive\n\n");
  }, 3000);

  const chatStartTime = Date.now();

  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      send("error", { content: "请输入消息" });
      return res.end();
    }

    const apiKey = KIMI_CONFIG.getKey();
    if (!apiKey) {
      send("error", { content: "AI 服务未配置" });
      return res.end();
    }

    const apiUrl = KIMI_CONFIG.url;
    const userId = req.user.id;

    // ==================== 详细日志 ====================
    console.log("\n" + "=".repeat(80));
    console.log("🤖 [Agent Chat] 新请求");
    console.log("=".repeat(80));
    console.log(`👤 用户ID: ${userId}`);
    console.log(`💬 用户消息: ${message}`);
    console.log(`📜 历史消息数: ${history.length}`);
    if (history.length > 0) {
      console.log("📜 最近3条历史:");
      history.slice(-3).forEach((h, i) => {
        const preview = (h.content || "").slice(0, 80);
        console.log(
          `   [${h.role}] ${preview}${preview.length >= 80 ? "..." : ""}`,
        );
      });
    }
    console.log(
      `🔧 可用工具: ${CHAT_TOOLS.map((t) => t.function.name).join(", ")}`,
    );
    console.log("-".repeat(80));

    // 构建消息列表（system + 历史 + 当前）
    const messages = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...history.slice(-20),
      { role: "user", content: message },
    ];
    console.log(`📨 发送给AI的消息总数: ${messages.length}`);

    // Agent 循环：最多 5 轮工具调用
    for (let round = 0; round < 5; round++) {
      if (aborted) {
        console.log("⛔ [Agent] 客户端已断开，终止循环");
        return;
      }

      const roundStartTime = Date.now();
      console.log(`\n🔄 ===== Agent Round ${round + 1}/5 =====`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "kimi-k2.5",
          messages,
          tools: CHAT_TOOLS,
          tool_choice: "auto",
          temperature: 1,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(
          `❌ [Round ${round + 1}] AI Chat 上游错误 (${response.status}):`,
          errBody,
        );
        send("error", { content: `AI 服务错误 (${response.status})` });
        return res.end();
      }

      console.log(`📡 [Round ${round + 1}] API 响应 OK，开始流式读取...`);
      const { content, toolCalls, reasoning } = await streamChatRound(
        response,
        send,
        aborted,
      );
      const roundMs = Date.now() - roundStartTime;

      console.log(`⏱️  [Round ${round + 1}] 耗时: ${roundMs}ms`);
      console.log(
        `💭 [Round ${round + 1}] 思考内容长度: ${reasoning.length} 字符`,
      );
      if (reasoning)
        console.log(
          `💭 [Round ${round + 1}] 思考预览: ${reasoning.slice(0, 200)}...`,
        );
      console.log(
        `📝 [Round ${round + 1}] 回复内容长度: ${content.length} 字符`,
      );
      if (content)
        console.log(
          `📝 [Round ${round + 1}] 回复预览: ${content.slice(0, 200)}${content.length > 200 ? "..." : ""}`,
        );
      console.log(`🔧 [Round ${round + 1}] 工具调用数: ${toolCalls.length}`);
      if (toolCalls.length > 0) {
        toolCalls.forEach((tc, i) => {
          console.log(
            `   🔧 工具${i + 1}: ${tc.function.name}(${tc.function.arguments})`,
          );
        });
      }

      // 没有工具调用 → 本轮是最终回复，结束
      if (toolCalls.length === 0) {
        console.log(
          `✅ [Round ${round + 1}] 无工具调用，Agent 循环结束（最终回复）`,
        );
        break;
      }

      // 有工具调用 → 执行并继续
      console.log(`🔄 [Round ${round + 1}] 检测到工具调用，开始执行...`);
      messages.push({
        role: "assistant",
        content: content || null,
        reasoning_content: reasoning || undefined,
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        console.log(`\n   ▶️ 执行工具: ${tc.function.name}`);
        console.log(`     参数: ${JSON.stringify(args)}`);
        console.log(`     tool_call_id: ${tc.id}`);

        send("action", { tool: tc.function.name, args });

        const toolStartTime = Date.now();
        const result = await executeToolCall(tc.function.name, args, userId);
        const toolMs = Date.now() - toolStartTime;

        console.log(`     ✅ 执行完成 (${toolMs}ms)`);
        console.log(`     返回结果: ${JSON.stringify(result).slice(0, 300)}`);

        send("action", { tool: tc.function.name, result });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      console.log(`\n🔄 [Round ${round + 1}] 工具执行完毕，继续下一轮...`);
    }

    const totalMs = Date.now() - chatStartTime;
    console.log("\n" + "=".repeat(80));
    console.log(`✅ [Agent Chat] 完成 | 总耗时: ${totalMs}ms`);
    console.log("=".repeat(80) + "\n");

    send("done", {});
  } catch (err) {
    const totalMs = Date.now() - chatStartTime;
    console.error("\n" + "=".repeat(80));
    console.error(`❌ [Agent Chat] 错误 | 耗时: ${totalMs}ms`);
    console.error(`   错误信息: ${err.message}`);
    console.error(`   堆栈: ${err.stack}`);
    console.error("=".repeat(80) + "\n");
    send("error", { content: err.message });
  } finally {
    clearInterval(keepAlive);
    if (!res.writableEnded) res.end();
  }
});

/**
 * 流式读取一轮响应，提取 content、reasoning 和 tool_calls
 */
async function streamChatRound(response, send, aborted) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "",
    content = "",
    toolCalls = [], //决定调用的工具
    reasoning = ""; //思考过程
  let streamDone = false; //收到done变为true，用来结束循环

  while (true) {
    if (aborted || streamDone) break;
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const chunk = JSON.parse(raw);
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        // 思考过程
        if (delta.reasoning_content) {
          reasoning += delta.reasoning_content; // 新增
          send("thinking", { content: delta.reasoning_content });
        }

        // 文本内容 → 实时推送
        if (delta.content) {
          content += delta.content;
          send("content", { content: delta.content });
        }

        // 工具调用（增量拼接）
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index !== undefined) {
              while (toolCalls.length <= tc.index)
                toolCalls.push({
                  id: "",
                  function: { name: "", arguments: "" },
                });
              const slot = toolCalls[tc.index];
              if (tc.id) slot.id = tc.id;
              if (tc.function?.name) slot.function.name = tc.function.name;
              if (tc.function?.arguments)
                slot.function.arguments += tc.function.arguments;
            }
          }
        }
      } catch (e) {
        console.warn(
          "⚠️ 流式 chunk 解析失败:",
          e.message,
          "| raw:",
          raw?.slice(0, 200),
        );
      }
    }
  }

  return {
    content,
    reasoning,
    toolCalls: toolCalls.filter((tc) => tc.function.name),
  };
}

export default router;
