# FastReplace 项目亮点文档

> 个人独立全栈项目 · AI 应用方向 · Vue 3 + Express + MySQL
> 
> 一句话简介：基于 AI 大模型 Function Calling 的法律文书自动生成平台——上传案情 → AI 结构化抽取 → 实时流式填充 → 一键导出 Word。

---

## 一、核心亮点总览

| 序号 | 亮点方向 | 关键词 |
|:---:|---------|--------|
| 1 | AI 工程化 | Function Calling · 字段白名单 · 重试 · 取消 · requestId |
| 2 | SSE 流式填充 | Generator 增量解析 · AbortController · 超时 · 变更追踪 |
| 3 | Word XML 引擎 | JSZip · DOMParser · 行复制 · Checkbox 替换 · 合并单元格 |
| 4 | Web Worker | docx 处理引擎剥离 · 主线程零阻塞 · 进度反馈 |
| 5 | 动态表单协议 | 自研 markData JSON · Word 表格→Vue 折叠面板 |
| 6 | 安全与限流 | JWT 鉴权 · 滑动窗口限流 · 环境变量管理 |
| 7 | 请求层一致性 | axios/fetch 共享 baseURL+token · dev/prod 行为一致 |
| 8 | 一键部署 | Docker Compose 三容器 · Nginx 反代 · SSE/WebSocket 代理 |
| 9 | 可观测性 | 全局错误监听 · 事件队列 · 性能埋点 |

---

## 二、逐项展开

### 1. AI 工程化与可靠性

**问题**：直接调用大模型 API，返回的字段可能包含幻觉 key、请求可能超时或失败、用户无法中途取消。

**解决方案**：
- **Function Calling + JSON Schema**：为每个表单字段生成严格的 Tool Schema，强制 AI 按预定义结构返回数据，而非自由文本。
- **字段白名单校验**：后端在推送字段前，校验 AI 返回的 key 是否在 `fieldList` 白名单中，拒绝非法字段（如 AI 幻觉生成的 key），并记录 `rejectedCount`。
- **失败自动重试**：AI 调用失败时自动重试（最多 2 次），并通过 SSE 通知前端重试状态。
- **requestId 全链路追踪**：每次 AI 请求生成 UUID，贯穿后端日志和前端事件，便于定位问题。
- **客户端断开检测**：监听 `req.on('close')`，用户取消时立即停止 AI 推送，节省 token 消耗。

**涉及文件**：`server/routes/ai.js`

---

### 2. SSE 流式填充

**问题**：一次性等待 AI 返回全部字段，体验差且无法中途干预。

**解决方案**：
- **后端 Generator**：使用 `async function*` 读取 AI 流式响应，增量解析 JSON（正则匹配 `"key": "value"`），每提取到一个完整字段立即 `yield`。
- **SSE 事件推送**：通过 `text/event-stream` 实时推送 `progress`、`field`、`complete`、`error` 四类事件。
- **前端 AbortController**：支持用户点击"取消填充"按钮中断请求，内部合并外部 signal 与 3 分钟超时 signal。
- **健壮的 SSE 解析**：前端缓冲未完整的 SSE 行，处理 chunk 拆分/合并边界问题。
- **429 限流处理**：前端识别 `429` 状态码并读取 `Retry-After` 头，给出友好提示。
- **变更追踪**：每个被 AI 填充的字段记录 `{key, oldValue, newValue, fieldLabel}`，支持后续回溯。
- **自动展开/滚动**：AI 每填充一个字段，自动展开所在折叠面板并滚动定位到该输入框。

**涉及文件**：`server/routes/ai.js`、`client/src/api/ai.js`、`client/src/components/project/ProjectForm.vue`

---

### 3. 浏览器端 Word XML 引擎

**问题**：需要在浏览器端直接生成填充后的 `.docx` 文件，不依赖后端。

**解决方案**：
- `.docx` 本质是 ZIP 包，内含 `word/document.xml`。通过 **JSZip** 解压，用 **DOMParser** 解析 XML DOM。
- 遍历 WPS 自定义标签 `<wpsCustomData:docfieldStart>`，通过 `docfieldname` 属性中的 JSON 找到 `markKey`，再映射到用户表单的 `fieldKey`。
- **行复制逻辑**：多当事人场景下，根据 `rowRepeatCountMap` 克隆 `<w:tr>` 行，左侧标题单元格使用 `<w:vMerge>` 合并，右侧内容行的 `subindex` 递增。
- **Checkbox 替换**：将选中项替换为 Wingdings 2 字体的勾选符号 `&#x0052;`。
- **格式保留**：填充文本继承 SimSun 字体；日期自动转为"YYYY年M月D日"中文格式。
- 处理完成后用 `XMLSerializer` 序列化回 XML，重新打包为 Blob 供下载/预览。

**涉及文件**：`client/src/stores/template.js`、`client/src/workers/docxEngine.js`

---

### 4. Web Worker 离线生成

**问题**：docx 解压 → XML 解析 → 字段替换 → ZIP 重打包 全在主线程执行，大模板会导致 UI 卡顿。

**解决方案**：
- 将全部 docx 处理逻辑抽离为 **纯函数引擎**（`docxEngine.js`），无任何 Vue/Pinia 依赖，可同时在主线程和 Worker 中运行。
- 创建 **`docxWorker.js`** Web Worker，通过 `postMessage` 接收 `{templateBuffer, formData, rowRepeatCountMap, markData}`。
- 处理过程中通过 `postMessage` 回报 7 个阶段的进度百分比（mapping → unzip → parse → duplicate → replace → serialize → zip）。
- Store 中的 `generateFilledBlob` 改为 Worker 调度：`Blob → ArrayBuffer → 传给 Worker → 接收 Blob 结果`，主线程完全不阻塞。
- 暴露 `generateProgress` 响应式 ref（0-100），可直接绑定进度条 UI。

**涉及文件**：`client/src/workers/docxEngine.js`、`client/src/workers/docxWorker.js`、`client/src/stores/template.js`

---

### 5. 自研 markData 动态表单协议

**问题**：Word 法律文书的表格结构复杂（嵌套分类、合并单元格、多当事人行），需要在前端精确还原为可交互表单。

**解决方案**：
- 设计 **`markData` JSON 协议**：用 `table > table-row > table-col > table-title / field / inline-fields` 树状结构描述 Word 表格。
- `DynamicForm.vue` 通过 `categories` 计算属性将扁平数据转为 **分类→子分类→字段** 三级结构，渲染为 Element Plus 折叠面板。
- 支持 `canRepeatSubjectRow`：动态增减当事人行数，前端 `rowRepeatCountMap` 控制数量，下载时自动复制 Word 行。
- 字段类型映射：`text`、`date`（日期选择器）、`number`、`select`（多选/单选）等自动匹配 UI 组件。
- 每个字段通过 `marks` 数组关联一个或多个 Word 占位符（`markKey`），支持一对多映射（如同一值填多处）。

**涉及文件**：`client/src/components/DynamicForm.vue`、`client/src/stores/editor.js`

---

### 6. 安全与限流

**问题**：AI 接口调用成本高，无鉴权则任何人可滥用；数据库密码硬编码在代码中。

**解决方案**：
- **JWT 鉴权**：AI 路由挂载 `authenticate` 中间件，验证 Bearer token → 查询用户 → 附加 `req.user`。未登录返回 401。
- **滑动窗口限流**：自研内存限流中间件（`rateLimiter.js`），按用户 ID 或 IP 限制请求频率，每用户每分钟最多 10 次 AI 调用。超限返回 `429` + `Retry-After` 头。定时清理过期记录，防止内存泄漏。
- **凭据安全**：`schema.prisma` 改用 `env("DATABASE_URL")`；创建 `.env.example` 模板文件；`.env` 已在 `.gitignore` 中。

**涉及文件**：`server/middleware/auth.js`、`server/middleware/rateLimiter.js`、`server/prisma/schema.prisma`、`server/.env.example`

---

### 7. 统一请求层

**问题**：项目中 axios 实例、raw fetch、直接 localStorage 取 token 三种模式并存，baseURL 在不同文件中硬编码，生产/开发行为不一致。

**解决方案**：
- `request.js` 导出 `getApiBaseUrl()` 和 `getAuthHeaders()` 两个工具函数，供 SSE（fetch）和文件下载等非 axios 请求使用。
- `baseURL` 统一读取 `import.meta.env.VITE_API_BASE_URL`，默认 `/api`——开发环境走 Vite proxy，Docker 生产环境走 Nginx 反代，行为完全一致。
- 消除了 `SystemLogs.vue` 中独立的 axios 实例 + `API_BASE` + 手动 token，改为调用统一 `getSystemLogs` API 函数。
- 消除了 `TemplateManagement.vue` 中直接从 `localStorage` 取 token 的代码。

**涉及文件**：`client/src/utils/request.js`、`client/src/api/ai.js`、`client/src/api/admin.js`、`client/src/views/Admin/SystemLogs.vue`、`client/src/views/Admin/TemplateManagement.vue`

---

### 8. Docker 一键部署

**问题**：项目依赖 MySQL + Node + 前端构建，环境搭建步骤多，面试官无法快速体验。

**解决方案**：
- **三容器编排**（`docker-compose.yml`）：
  - `db`：MySQL 8.0，首次启动自动执行 `init.sql` 建库建表，健康检查就绪后才启动后端。
  - `server`：Node 18 Alpine，自动 `prisma generate` + 启动 Express。
  - `client`：多阶段构建（Vite build → Nginx Alpine），静态托管 + 反向代理。
- **Nginx 配置**（`nginx.conf`）：Vue Router history 模式 fallback、API 反代、SSE 禁用缓冲（`proxy_buffering off`）、WebSocket 升级。
- 所有敏感配置通过环境变量注入，`docker compose up -d` 一条命令启动全部服务。

**涉及文件**：`docker-compose.yml`、`client/Dockerfile`、`client/nginx.conf`、`server/Dockerfile`

---

### 9. 前端可观测性

**问题**：线上出错时缺少上下文，难以复现和定位。

**解决方案**：
- **`tracker.js`**：轻量事件追踪器，支持 `action`（用户行为）、`error`（错误）、`perf`（性能）三类事件，内存环形队列（最多 200 条）。
- **全局错误监听**：在 `main.js` 一次性安装——捕获 Vue 组件错误（`app.config.errorHandler`）、未处理的 Promise 拒绝（`unhandledrejection`）、全局 JS 错误（`window.onerror`）。
- **关键流程埋点**：AI 解析 start/complete/cancel/error 全覆盖，附带 `performance.now()` 耗时统计。
- 开发环境自动输出到控制台（带分类 emoji），生产环境可对接后端日志接口或 Sentry。

**涉及文件**：`client/src/utils/tracker.js`、`client/src/main.js`、`client/src/components/project/ProjectForm.vue`

---

## 三、简历 Bullets（可直接使用）

### 风格 A：技术细节型

> **FastReplace — AI 智能法律文书生成系统**（个人全栈项目）
> - 基于 Kimi Function Calling + 字段白名单校验 + 失败自动重试，实现案情文本→结构化表单数据的可靠抽取，SSE 流式逐字段回填，支持用户中途取消
> - 自研 markData JSON 协议驱动动态表单渲染；浏览器端通过 JSZip + DOMParser 操作 Word XML，支持行复制、Checkbox 替换与合并单元格
> - 将 docx 解析/填充/打包迁移至 Web Worker，主线程零阻塞，附 7 阶段进度反馈
> - 统一 axios/fetch 请求层（共享 baseURL + token 注入）；AI 路由增加 JWT 鉴权 + 滑动窗口限流
> - Docker Compose 三容器一键部署（MySQL + Express + Nginx），Nginx 代理 SSE/WebSocket

### 风格 B：成果导向型

> **FastReplace — AI 法律文书自动生成平台**（独立开发，前后端全栈）
> - 集成大模型 Function Calling，从案情描述中自动提取 30+ 字段并实时流式填充到 Word 模板，替代人工逐项录入
> - 设计 markData 协议将 Word 表格结构映射为 Vue 动态表单，支持多当事人行复制与 Checkbox 自动勾选
> - 通过 Web Worker 将文档生成移出主线程，消除大模板导出时的 UI 卡顿
> - 实现字段白名单校验 + 重试 + 限流，保障 AI 输出可靠性并控制调用成本
> - Docker Compose 一键部署，面试官可直接访问在线 Demo

---

## 四、2 分钟项目介绍（口述参考）

> 这个项目叫 FastReplace，是我独立开发的一个 AI 法律文书生成系统，技术栈是 Vue 3 + Express + MySQL。
>
> **核心场景**是：用户上传一段案情描述，AI 自动从中提取出当事人信息、日期、金额等几十个字段，实时逐个填充到 Word 模板里，最后一键导出。
>
> **AI 这块**，我用的是 Kimi 的 Function Calling，给每个表单字段生成 JSON Schema 约束 AI 输出格式。后端用 Generator 增量解析 AI 的流式响应，每提取到一个字段就通过 SSE 推给前端。为了保证可靠性，我加了字段白名单校验——AI 返回的 key 如果不在预期列表里就直接拒绝，还有失败自动重试和 requestId 追踪。前端支持 AbortController 取消和 3 分钟超时。
>
> **Word 处理**这块，我直接在浏览器里用 JSZip 解压 docx，DOMParser 解析里面的 XML，找到占位符进行替换。比较复杂的是多当事人场景——需要动态复制表格行并处理合并单元格。这些计算量比较大，所以我把整个 docx 引擎抽成了纯函数，放到 Web Worker 里跑，主线程完全不阻塞。
>
> **工程化**方面，我统一了请求层，axios 和 fetch 共享 baseURL 和 token 注入；AI 接口加了 JWT 鉴权和滑动窗口限流；数据库密码走环境变量，不硬编码。最后用 Docker Compose 做了三容器一键部署，MySQL、Node 后端和 Nginx 前端全自动启动。
