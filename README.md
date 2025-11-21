# FastReplace

Vue3 + Element Plus + Express 全栈项目

## 项目结构

```
FastReplace/
├── client/          # Vue3 前端
│   ├── src/
│   │   ├── views/      # 页面组件
│   │   ├── stores/     # Pinia 状态管理
│   │   ├── router/     # Vue Router
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── server/          # Express 后端
    ├── index.js
    ├── .env
    └── package.json
```

## 技术栈

### 前端
- Vue 3
- Vue Router
- Pinia
- Element Plus
- Axios
- Vite

### 后端
- Node.js
- Express
- CORS

## 安装依赖

本项目使用 pnpm 作为包管理器。

```bash
# 安装 pnpm (如果还没安装)
npm install -g pnpm

# 在项目根目录安装所有依赖
pnpm install
```

## 运行项目

### 开发环境

```bash
# 方式1: 同时启动前后端 (推荐)
pnpm dev

# 方式2: 分别启动
# 启动后端 (端口 5000)
pnpm dev:server

# 启动前端 (端口 3000)
pnpm dev:client
```

### 访问

- 前端: http://localhost:3000
- 后端: http://localhost:5000

## 构建

```bash
pnpm build
```

## pnpm 常用命令

```bash
# 安装所有依赖
pnpm install

# 给特定包添加依赖
pnpm --filter fast-replace-client add axios
pnpm --filter fast-replace-server add express

# 同时运行前后端
pnpm dev

# 单独运行
pnpm dev:server  # 只运行后端
pnpm dev:client  # 只运行前端
```
