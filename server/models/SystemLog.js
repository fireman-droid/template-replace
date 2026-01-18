/**
 * 系统日志模型
 * 用于记录和查询系统操作日志
 */
import pool from '../config/db.js'

class SystemLog {
  /**
   * 创建一条日志记录
   * @param {Object} logData - 日志数据
   * @param {number|null} logData.userId - 操作用户ID
   * @param {string|null} logData.username - 操作用户名
   * @param {string} logData.action - 操作类型 (CREATE, UPDATE, DELETE, LOGIN, LOGOUT等)
   * @param {string|null} logData.resourceType - 资源类型 (USER, TEMPLATE, CASE等)
   * @param {number|null} logData.resourceId - 资源ID
   * @param {Object|null} logData.details - 操作详情
   * @param {string|null} logData.ip - 操作者IP
   * @param {string|null} logData.userAgent - 浏览器信息
   */
  static async create(logData) {
    const {
      userId = null,
      username = null,
      action,
      resourceType = null,
      resourceId = null,
      details = null,
      ip = null,
      userAgent = null
    } = logData

    const [result] = await pool.query(
      `INSERT INTO system_logs (user_id, username, action, resource_type, resource_id, details, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        username,
        action,
        resourceType,
        resourceId,
        details ? JSON.stringify(details) : null,
        ip,
        userAgent
      ]
    )

    return result.insertId
  }

  /**
   * 获取日志列表（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页条数
   * @param {Object} filters - 筛选条件
   * @param {string|null} filters.action - 操作类型筛选
   * @param {string|null} filters.resourceType - 资源类型筛选
   * @param {string|null} filters.keyword - 关键词搜索（用户名或详情）
   */
  static async getAll(page = 1, pageSize = 20, filters = {}) {
    const offset = (page - 1) * pageSize
    const { action = null, resourceType = null, keyword = null } = filters

    let whereClause = '1=1'
    const params = []

    if (action) {
      whereClause += ' AND action = ?'
      params.push(action)
    }

    if (resourceType) {
      whereClause += ' AND resource_type = ?'
      params.push(resourceType)
    }

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR JSON_EXTRACT(details, "$.message") LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM system_logs WHERE ${whereClause}`,
      params
    )
    const total = countResult[0].total

    // 获取数据（按时间倒序）
    const [rows] = await pool.query(
      `SELECT * FROM system_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    return {
      list: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 获取操作类型统计
   */
  static async getActionStats() {
    const [rows] = await pool.query(
      `SELECT action, COUNT(*) as count FROM system_logs GROUP BY action ORDER BY count DESC`
    )
    return rows
  }

  /**
   * 清理过期日志（可选功能，默认保留90天）
   * @param {number} days - 保留天数
   */
  static async cleanOldLogs(days = 90) {
    const [result] = await pool.query(
      `DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    )
    return result.affectedRows
  }
}

export default SystemLog
