import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool, { testConnection, prisma } from "./config/db.js";
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
const io = new Server(httpServer, {
  // [新增] 初始化 socket.io
  cors: {
    origin: "*", // 开发环境允许所有跨域，生产环境建议指定域名
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5002;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// AI 路由：需要登录 + 限流（每用户每分钟最多 10 次）
import { authenticate } from "./middleware/auth.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});
app.use("/api/ai", authenticate, aiRateLimiter, aiRoutes);

// 请求日志中间件
app.use(requestLogger);

io.on("connection", (socket) => {
  socket.on("join_room", async (roomName) => {
    socket.join(roomName);
    console.log(`➕ 加入房间: ${roomName}`);

    // 如果是用户房间，发送历史记录
    if (roomName.startsWith("user_")) {
      try {
        const userId = parseInt(roomName.split("_")[1]);
        if (!isNaN(userId)) {
          const history = await prisma.chatMessage.findMany({
            where: {
              OR: [
                { targetRoom: roomName }, // 管理员发给这个用户的
                { senderId: userId, targetRoom: "admin_room" }, // 这个用户发给管理员的
              ],
            },
            orderBy: { createdAt: "asc" },
            take: 50,
          });
          socket.emit("load_history", history);
        }
      } catch (e) {
        console.error("加载历史记录失败:", e.message);
      }
    }
  });

  // 标记消息已读
  socket.on("mark_read", async (userId) => {
    try {
      await prisma.chatMessage.updateMany({
        where: {
          senderId: userId,
          targetRoom: "admin_room",
          isRead: false,
        },
        data: { isRead: true },
      });
      console.log(`✅ 已标记用户 ${userId} 的消息为已读`);
    } catch (e) {
      console.error("标记已读失败:", e.message);
    }
  });

  socket.on("send_message", async (data) => {
    const { targetRoom, content, sender, senderId } = data;
    console.log(`📨 [${sender}] -> ${targetRoom}:`, content);
    // 判断发送者类型
    const isUserToAdmin = targetRoom === "admin_room";
    const senderType = isUserToAdmin ? "user" : "admin";

    // 处理id
    const safeSenderId =
      senderId && !isNaN(parseInt(senderId)) ? parseInt(senderId) : null;

    // 处理会话
    let sessionUserId = null;
    if (senderType === "user") {
      sessionUserId = safeSenderId; // 用户发的消息，用用户的 ID
    } else {
      // 管理员发给用户 (targetRoom = 'user_123')
      if (targetRoom.startsWith("user_")) {
        const parsedId = parseInt(targetRoom.split("_")[1]);
        if (!isNaN(parsedId)) sessionUserId = parsedId;
      }
    }

    let sessionId = null;
    if (sessionUserId) {
      try {
        let session = await prisma.chatSession.findFirst({
          where: { userId: sessionUserId },
        });
        if (session) {
          await prisma.chatSession.update({
            where: { id: session.id },
            data: { updatedAt: new Date() },
          });
          sessionId = session.id;
        } else {
          const newSession = await prisma.chatSession.create({
            data: {
              userId: sessionUserId,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          sessionId = newSession.id;
        }
      } catch (error) {
        console.log(error);
      }
    }
    // 保存到数据库
    try {
      await prisma.chatMessage.create({
        data: {
          senderType,
          senderId: safeSenderId,
          senderName: sender,
          targetRoom,
          content,
          sessionId,
        },
      });
    } catch (e) {
      console.error("❌ 保存消息失败:", e.message);
    }

    socket.to(targetRoom).emit("receive_message", data);

    if (!isUserToAdmin) {
      socket.to("admin_room").emit("receive_message", data);
    }
  });

  socket.on("disconnect", (socket) => {
    console.log(`用户断开连接: ${socket.id}`);
  });
});

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
