# FastReplace — AI 智能法律文书生成系统

> 基于 AI 大模型 Function Calling 的法律文书自动生成平台。  
> 上传案情描述 → AI 结构化抽取 → 实时流式填充 → 一键导出 Word。

## 项目亮点

- **AI 工程化**：Function Calling + 字段白名单校验 + 失败自动重试（最多 2 次） + 可取消的流式回填 + requestId 全链路追踪
- **SSE 流式填充**：后端 Generator 增量解析 AI 输出，前端逐字段回填并自动展开/滚动定位，支持 AbortController 取消与 3 分钟超时
- **Word XML 引擎**：浏览器端通过 JSZip + DOMParser 直接操作 `.docx` 内部 XML，支持行复制（多当事人）、Checkbox 符号替换、合并单元格
- **Web Worker 离线生成**：将 docx 解析/填充/打包迁移至 Web Worker，主线程零阻塞，附带进度反馈（0-100%）
- **动态表单协议**：自研 `markData` JSON 协议，将 Word 表格结构反向映射为 Vue 动态折叠面板表单
- **安全与限流**：AI 路由 JWT 鉴权 + 内存滑动窗口限流（每用户每分钟 10 次）；DB 凭据全部走环境变量
- **统一请求层**：axios 与 fetch（SSE/文件下载）共享 baseURL + token 注入，dev/prod 行为一致
- **一键部署**：Docker Compose 三容器编排（MySQL + Node API + Nginx），开箱即用

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 (Composition API) · Vite 5 · Pinia · Element Plus · JSZip · Web Worker |
| 后端 | Node.js · Express · Prisma · mysql2 · Socket.IO · SSE |
| AI | Kimi API · Function Calling · 流式增量 JSON 解析 |
| 部署 | Docker Compose · Nginx 反向代理 |

---

## 快速开始

### 方式一：Docker 一键启动（推荐）

```bash
# 1. 克隆项目
git clone <repo-url> && cd template-replace

# 2. 配置 AI Key（可选，不配则 AI 功能不可用）
export KIMI_API_KEY=sk-xxxxxx

# 3. 启动全部服务
docker compose up -d

# 4. 访问
# 前端：http://localhost
# API ：http://localhost:5000/api
```

> 首次启动会自动建库建表（通过 `init.sql`）。MySQL 映射到宿主机 `3307` 端口。

### 方式二：本地开发

```bash
# 环境要求：Node.js >= 18, MySQL >= 5.7, pnpm

# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env 填入数据库密码和 AI Key

# 3. 初始化数据库
mysql -u root -p < server/init.sql

# 4. 生成 Prisma Client
cd server && npx prisma generate && cd ..

# 5. 启动开发服务器
pnpm dev
# 前端：http://localhost:3001
# 后端：http://localhost:5000
```

---

## 项目结构

```
FastReplace/
├── client/                      # 前端
│   ├── src/
│   │   ├── api/                 # 统一 API 层（axios + fetch 共享配置）
│   │   ├── components/
│   │   │   └── DynamicForm.vue  # 核心：markData 驱动的动态表单
│   │   ├── stores/
│   │   │   └── template.js      # 核心：Word XML 填充 → Web Worker 调度
│   │   ├── workers/
│   │   │   ├── docxEngine.js    # 纯函数 docx 处理引擎
│   │   │   └── docxWorker.js    # Web Worker 入口
│   │   └── utils/
│   │       └── request.js       # Axios 封装 + getApiBaseUrl / getAuthHeaders
│   ├── Dockerfile
│   └── nginx.conf               # Nginx 反代配置（API + WebSocket + SSE）
│
├── server/                      # 后端
│   ├── routes/
│   │   └── ai.js                # AI 核心：Function Calling + 流式 SSE + 重试
│   ├── middleware/
│   │   ├── auth.js              # JWT 鉴权
│   │   └── rateLimiter.js       # 滑动窗口限流
│   ├── prisma/schema.prisma     # 数据模型（DATABASE_URL 环境变量）
│   ├── .env.example             # 环境变量模板
│   └── Dockerfile
│
└── docker-compose.yml           # 三容器编排
```

---

## 常见问题

- **AI 解析超时 (504)**：前端超时 3 分钟，Nginx `proxy_read_timeout` 已设为 300s
- **字段无法显示**：检查 `DynamicForm.vue` 的 `categories` 计算属性是否正确处理合并单元格
- **Word 填充错位**：确保 markData 中的 `markKey` 与 Word 模板中的 `docfieldname` 一致
- **Docker 端口冲突**：MySQL 映射为 3307；前端映射为 80；如冲突请修改 `docker-compose.yml`
