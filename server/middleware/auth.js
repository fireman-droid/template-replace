/**
 * 认证中间件
 * 用于验证 JWT token 和用户权限
 */
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * 验证 JWT token
 * 从请求头中提取 token 并验证，将用户信息附加到 req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // 从 Authorization 头获取 token
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' })
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 查找用户
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' })
    }

    // 将用户信息附加到请求对象
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的令牌' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期' })
    }
    res.status(500).json({ message: '认证失败', error: error.message })
  }
}

/**
 * 验证管理员权限
 * 必须在 authenticate 中间件之后使用
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' })
  }
  next()
}
