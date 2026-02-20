FROM node:18-alpine
WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 先复制依赖描述文件以利用 Docker 缓存
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 生成 Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# 复制源码
COPY . .

# 创建上传目录
RUN mkdir -p uploads/templates uploads/temp

EXPOSE 5000
CMD ["node", "index.js"]
