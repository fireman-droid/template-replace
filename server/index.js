import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool, { testConnection } from './config/db.js'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '后端连接成功！',
    timestamp: new Date().toISOString()
  })
})

app.get('/api', (req, res) => {
  res.json({ message: 'FastReplace API 正在运行' })
})

// 测试数据库连接
app.get('/api/db/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result')
    res.json({ 
      success: true,
      message: 'MySQL 数据库连接成功',
      result: rows[0].result
    })
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: '数据库连接失败',
      error: error.message
    })
  }
})

// 认证路由
app.use('/api/auth', authRoutes)

// 管理员路由
import adminRoutes from './routes/admin.js'
app.use('/api/admin', adminRoutes)

// 案卷路由
import casesRoutes from './routes/cases.js'
app.use('/api/cases', casesRoutes)

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  await testConnection()
})
