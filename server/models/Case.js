/**
 * 案卷数据模型
 * 定义案卷相关的数据库操作
 */
import pool from '../config/db.js'

class Case {
  /**
   * 创建新案卷
   * @param {Object} caseData - 案卷数据
   * @returns {Object} 创建的案卷信息
   */
  static async create({ title, template_id, user_id, status = 'draft', form_data }) {
    const now = new Date()
    const [result] = await pool.query(
      'INSERT INTO cases (title, template_id, user_id, status, form_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, template_id, user_id, status, JSON.stringify(form_data || {}), now, now]
    )
    
    return {
      id: result.insertId,
      title,
      template_id,
      user_id,
      status,
      form_data
    }
  }

  /**
   * 获取用户的案卷列表（分页）
   * @param {number} userId - 用户 ID
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} keyword - 搜索关键词
   * @param {string} status - 状态筛选
   * @returns {Object} 案卷列表和总数
   */
  static async getUserCases(userId, page = 1, pageSize = 10, keyword = '', status = '') {
    const offset = (page - 1) * pageSize
    
    let query = `
      SELECT c.*, t.name as template_name, u.username 
      FROM cases c 
      LEFT JOIN templates t ON c.template_id = t.id 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE c.user_id = ?
    `
    let countQuery = 'SELECT COUNT(*) as total FROM cases WHERE user_id = ?'
    const params = [userId]
    
    if (keyword) {
      query += ' AND c.title LIKE ?'
      countQuery += ' AND title LIKE ?'
      params.push(`%${keyword}%`)
    }
    
    if (status) {
      query += ' AND c.status = ?'
      countQuery += ' AND status = ?'
      params.push(status)
    }
    
    query += ' ORDER BY c.updated_at DESC LIMIT ? OFFSET ?'
    
    const [rows] = await pool.query(query, [...params, pageSize, offset])
    const [countResult] = await pool.query(countQuery, params)
    
    // 解析 JSON 字段
    const cases = rows.map(row => ({
      ...row,
      form_data: typeof row.form_data === 'string' ? JSON.parse(row.form_data || '{}') : row.form_data
    }))
    
    return {
      list: cases,
      total: countResult[0].total,
      page,
      pageSize
    }
  }

  /**
   * 根据 ID 查找案卷
   * @param {number} id - 案卷 ID
   * @returns {Object|null} 案卷信息
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM cases WHERE id = ?',
      [id]
    )
    
    if (rows[0]) {
      return {
        ...rows[0],
        form_data: typeof rows[0].form_data === 'string' ? JSON.parse(rows[0].form_data || '{}') : rows[0].form_data
      }
    }
    
    return null
  }

  /**
   * 更新案卷
   * @param {number} id - 案卷 ID
   * @param {Object} data - 更新的数据
   */
  static async update(id, { title, template_id, status, form_data }) {
    const updates = []
    const params = []
    
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    if (template_id !== undefined) {
      updates.push('template_id = ?')
      params.push(template_id)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (form_data !== undefined) {
      updates.push('form_data = ?')
      params.push(JSON.stringify(form_data))
    }
    
    params.push(id)
    
    await pool.query(
      `UPDATE cases SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
  }

  /**
   * 删除案卷
   * @param {number} id - 案卷 ID
   */
  static async delete(id) {
    await pool.query('DELETE FROM cases WHERE id = ?', [id])
  }
}

export default Case
