# ============ 构建阶段 ============
FROM node:18-alpine AS build
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 先复制依赖描述文件以利用 Docker 缓存
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 复制源码并构建
COPY . .
RUN pnpm build

# ============ 运行阶段（Nginx 静态托管） ============
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
