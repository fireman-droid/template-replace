import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 文件上传配置
const upload = multer({
  dest: path.join(__dirname, "../uploads/temp"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件格式"));
    }
  },
});

// AI API 配置
const AI_CONFIG = {
  kimi: {
    url: "https://api.moonshot.cn/v1/chat/completions",
    model: "moonshot-v1-8k",
    getKey: () => process.env.KIMI_API_KEY,
  },
  qwen: {
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    model: "qwen-turbo",
    getKey: () => process.env.QWEN_API_KEY,
  },
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    getKey: () => process.env.DEEPSEEK_API_KEY,
  },
};

// 解析文件内容
async function parseFileContent(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  if (ext === ".pdf") {
    try {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error("PDF 解析错误:", error);
      throw new Error("PDF 文件解析失败");
    }
  }

  if (ext === ".docx" || ext === ".doc") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error("Word 解析错误:", error);
      throw new Error("Word 文件解析失败");
    }
  }

  throw new Error("不支持的文件格式");
}

// 根据字段列表动态生成 Tool Schema
function generateFillTableTool(fieldList) {
  const properties = {};
  
  for (const field of fieldList) {
    properties[field.fieldKey] = {
      type: "string",
      description: field.fieldLabel || `字段${field.fieldKey}`
    };
  }

  return {
    type: "function",
    function: {
      name: "fillTable",
      description: "填充表单中的字段，根据案情描述提取相关信息",
      parameters: {
        type: "object",
        properties,
        required: [] // 所有字段都是可选的
      }
    }
  };
}

// 调用 AI API（使用 Function Calling）
async function callAIWithTools(config, content, fieldList) {
  const apiKey = config.getKey();
  if (!apiKey) {
    throw new Error(`未配置 API Key`);
  }

  // 生成 tool schema
  const fillTableTool = generateFillTableTool(fieldList);

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "你是一个法律文书信息提取助手。根据用户提供的案情描述，调用 fillTable 工具填充表单字段。如果某个字段无法从文本中提取到信息，就不要填写该字段。"
        },
        {
          role: "user",
          content: content
        }
      ],
      tools: [fillTableTool],
      tool_choice: { type: "function", function: { name: "fillTable" } }, // 强制调用 fillTable
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  const data = await response.json();
  console.log("AI 完整响应:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(data.error?.message || "AI 接口调用失败");
  }

  // 提取 tool call 结果
  const message = data.choices[0].message;
  
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    if (toolCall.function.name === "fillTable") {
      try {
        const result = JSON.parse(toolCall.function.arguments);
        console.log("Function Calling 解析结果:", result);
        return result;
      } catch (e) {
        console.error("解析 tool call 参数失败:", toolCall.function.arguments);
        throw new Error("解析 AI 返回结果失败");
      }
    }
  }

  // 如果没有 tool call，尝试从 content 中解析（兼容旧方式）
  if (message.content) {
    console.log("未使用 tool call，尝试从 content 解析");
    const jsonMatch = message.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }

  throw new Error("AI 未返回有效的填充数据");
}

// AI 解析接口
router.post("/parse", upload.single("file"), async (req, res) => {
  let tempFilePath = null;

  try {
    const { text, fields, model = "kimi" } = req.body;
    const file = req.file;

    // 解析 fields
    let fieldList = [];
    try {
      fieldList = JSON.parse(fields);
    } catch (e) {
      return res
        .status(400)
        .json({ success: false, message: "fields 格式错误" });
    }

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

    // 获取 AI 配置
    const aiConfig = AI_CONFIG[model];
    if (!aiConfig) {
      return res.status(400).json({ success: false, message: "不支持的模型" });
    }

    // 调用 AI（使用 Function Calling）
    const result = await callAIWithTools(aiConfig, content, fieldList);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("AI 解析错误:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    // 清理临时文件
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

export default router;
