/**
 * 日志记录工具函数
 * 简化在路由中记录操作日志的流程
 */
import SystemLog from '../models/SystemLog.js'

/**
 * 记录操作日志
 * @param {Object} req - Express 请求对象
 * @param {string} action - 操作类型
 * @param {string|null} resourceType - 资源类型
 * @param {number|null} resourceId - 资源ID
 * @param {Object|null} details - 操作详情
 */
export async function logAction(req, action, resourceType = null, resourceId = null, details = null) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    await SystemLog.create({
      userId: req.user?.id || null,
      username: req.user?.email || req.user?.username || 'System',
      action,
      resourceType,
      resourceId,
      details,
      ip: typeof ip === 'string' ? ip.split(',')[0].trim() : ip,
      userAgent: userAgent.substring(0, 255) // 截断过长的 user-agent
    })
  } catch (error) {
    // 日志记录失败不应影响主业务流程，仅打印错误
    console.error('[Logger] 记录日志失败:', error.message)
  }
}

/**
 * 常用操作类型常量
 */
export const ActionTypes = {
  // 用户相关
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  
  // CRUD 操作
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  
  // 特殊操作
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  ROLE_CHANGE: 'ROLE_CHANGE',
  
  // 系统操作
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  AI_ANALYZE: 'AI_ANALYZE'
}

/**
 * 资源类型常量
 */
export const ResourceTypes = {
  USER: 'USER',
  TEMPLATE: 'TEMPLATE',
  CASE: 'CASE',
  PROJECT: 'PROJECT'
}
