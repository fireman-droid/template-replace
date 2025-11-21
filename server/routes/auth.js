/**
 * 认证路由
 * 处理用户注册、登录等认证相关的请求
 */
import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写所有必填字段' })
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要 6 个字符' })
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findByUsername(username)
    if (existingUsername) {
      return res.status(400).json({ message: '用户名已被使用' })
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findByEmail(email)
    if (existingEmail) {
      return res.status(400).json({ message: '邮箱已被注册' })
    }

    // 创建用户（默认角色为 user）
    const user = await User.create({ username, email, password, role: 'user' })

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '注册失败', error: error.message })
  }
})

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({ message: '请填写邮箱和密码' })
    }

    // 查找用户
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    // 验证密码
    const isPasswordValid = await User.comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' })
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '登录失败', error: error.message })
  }
})

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 需要认证
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  })
})

export default router
