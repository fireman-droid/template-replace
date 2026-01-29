import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool, { testConnection } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
} from "./middleware/errorLogger.js";

// websocket 的引入
import { createServer } from "http";
import { Server } from "socket.io";  

// AI 路由
import aiRoutes from "./routes/ai.js";

dotenv.config();

const app = express();
const httpServer = createServer(app); // [新增] 用 app 创建 http 服务器
const io = new Server(httpServer, {   // [新增] 初始化 socket.io
  cors: {
    origin: "*", // 开发环境允许所有跨域，生产环境建议指定域名
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/ai", aiRoutes);

// 请求日志中间件
app.use(requestLogger);

io.on('connection', (socket) => {
  socket.on('join_room', (roomName) => {
    socket.join(roomName)
    console.log(`➕ 加入房间: ${roomName}`);
  })

  socket.on('send_message', (data) => {
    const { targetRoom, ...msgContent } = data
    console.log(`📨 消息 -> ${targetRoom}:`, msgContent.content);
    socket.to(targetRoom).emit('receive_message', msgContent)
  })

  socket.on('disconnect', (socket) => {
    console.log(`用户断开连接: ${socket.id}`)
  })
})

// 路由
app.get("/api/test", (req, res) => {
  res.json({
    message: "后端连接成功！",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({ message: "FastReplace API 正在运行" });
});

// 测试数据库连接
app.get("/api/db/test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({
      success: true,
      message: "MySQL 数据库连接成功",
      result: rows[0].result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "数据库连接失败",
      error: error.message,
    });
  }
});

// 认证路由
app.use("/api/auth", authRoutes);

// 管理员路由
import adminRoutes from "./routes/admin.js";
app.use("/api/admin", adminRoutes);

// 案卷路由
import casesRoutes from "./routes/cases.js";
app.use("/api/cases", casesRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 启动服务器
httpServer.listen(PORT, async () => {
  console.log(`🚀 FastReplace 服务器启动成功`);
  await testConnection();
});
