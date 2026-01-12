# 🚀 AI 智能法律文书生成系统 (FastReplace)

> **项目代号**: FastReplace  
> **核心功能**: 基于 AI 大模型（Kimi/DeepSeek/Qwen）的法律与案情分析，自动提取关键信息并填充至 Word 文档模版，实现文书批量生成。

## 🌟 项目亮点

*   **智能解析**: 集成多种国产大模型，自动从案情描述或上传的文件（PDF/Word/TXT）中提取表单数据。
*   **动态表单**: 独创的 `markData` 协议，将 Word 表格结构反向解析为 Vue 动态折叠面板表单（支持合并单元格逻辑）。
*   **所见即所得**: 实时预览填充效果，支持浏览器端直接操作 Word XML。
*   **全栈架构**: 采用 Vue 3 + Express + MySQL 经典工业级架构。

---

## 🛠 技术栈

### 前端 (Client)
*   **框架**: Vue 3 (Composition API)
*   **构建工具**: Vite 5
*   **UI 组件库**: Element Plus
*   **状态管理**: Pinia
*   **核心库**: `jszip` (处理 docx), `axios`

### 后端 (Server)
*   **运行环境**: Node.js
*   **Web 框架**: Express
*   **数据库**: MySQL 8.0
*   **AI 接入**: Fetch API (支持流式/Function Calling)
*   **ORM/Driver**: `mysql2`

---

## 🏎️ 快速开始

### 1. 环境准备
*   Node.js >= 16.0
*   MySQL >= 5.7
*   pnpm (推荐) 或 npm

### 2. 安装依赖

```bash
# 全局安装 pnpm (如果没有)
npm install -g pnpm

# 在根目录一键安装前后端所有依赖
pnpm install
```

### 3. 配置文件 (.env)

在 `server/` 目录下新建 `.env` 文件，并在其中配置你的密钥：

```env
# 服务器端口
PORT=5000

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fast_replace

# AI 模型 API Key (根据需要配置)
KIMI_API_KEY=sk-xxxxxx
QWEN_API_KEY=sk-xxxxxx
DEEPSEEK_API_KEY=sk-xxxxxx
```

### 4. 启动项目

```bash
# 方式 A：一键启动前后端（开发模式）
pnpm dev

# 方式 B：分别启动
pnpm dev:server  # 启动后端 (默认端口 5000)
pnpm dev:client  # 启动前端 (默认端口 3001)
```

> **注意**: 前端默认运行在 `http://localhost:3001`，后端运行在 `http://localhost:5000`。

---

## 📂 项目结构导游

给新加入的学弟学妹们的快速指引：

```
FastReplace/
├── client/                 # 🟢 前端主战场
│   ├── src/
│   │   ├── components/
│   │   │   └── DynamicForm.vue  # 🔥 核心：动态表单渲染器（逻辑最复杂，改动请小心）
│   │   ├── stores/
│   │   │   └── template.js      # 🔥 核心：Word XML 解析与填充逻辑
│   │   └── utils/
│   │       └── request.js       # Axios 封装 (已配置 2分钟 超时)
│   └── vite.config.js      # Vite 配置 (包含反向代理)
│
└── server/                 # 🔵 后端引擎
    ├── routes/
    │   └── ai.js           # 🤖 AI 核心逻辑：Prompt 提示词在这里调整
    ├── config/
    │   └── db.js           # 数据库连接池
    └── uploads/            # 临时文件存储区
```

## 📝 开发规范 (Team Guide)

1.  **分支管理**: 开发新功能请切出新分支（如 `feature/login-ui`），不要直接在 `main` 分支提交。
2.  **核心逻辑**: 
    *   `DynamicForm.vue` 中的 `categories` 计算属性负责将扁平的表格数据转化为层级结构，修改前请务必理解 "合并单元格" 的处理逻辑。
    *   `ai.js` 中的 System Prompt 决定了 AI 的提取质量，修改提示词后请多找几个测试用例验证。
3.  **内网穿透**: 
    *   如果需要手机调试，可使用 `ngrok` 或 `localtunnel`。
    *   已在 `vite.config.js` 配置 `allowedHosts: true` 支持穿透访问。

## ⚠️ 常见问题

*   **AI 解析超时 (504)**: 目前前端超时已设为 120s。如果使用服务器反代，请检查 Nginx 的 `proxy_read_timeout`。
*   **字段无法显示**: 检查 `DynamicForm.vue` 中是否误删了 `else` 分支（处理有子标题的字段）。
*   **Word 填充错位**: 确保 Word 模板中的标签是 `{{key}}` 格式，且在 `markData` 中有对应定义。

---

*Happy Coding! 🚀*
