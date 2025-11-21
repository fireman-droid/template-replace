/**
 * 模板数据模型
 * 定义模板相关的数据库操作
 */
import pool from '../config/db.js'

class Template {
  /**
   * 创建新模板
   * @param {Object} templateData - 模板数据
   * @returns {Object} 创建的模板信息
   */
  static async create({ name, description, category, fields }) {
    const [result] = await pool.query(
      'INSERT INTO templates (name, description, category, fields) VALUES (?, ?, ?, ?)',
      [name, description, category, JSON.stringify(fields)]
    )
    
    return {
      id: result.insertId,
      name,
      description,
      category,
      fields
    }
  }

  /**
   * 获取所有模板（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} keyword - 搜索关键词
   * @returns {Object} 模板列表和总数
   */
  static async getAll(page = 1, pageSize = 10, keyword = '') {
    const offset = (page - 1) * pageSize
    
    let query = 'SELECT * FROM templates'
    let countQuery = 'SELECT COUNT(*) as total FROM templates'
    const params = []
    
    if (keyword) {
      query += ' WHERE name LIKE ? OR description LIKE ? OR category LIKE ?'
      countQuery += ' WHERE name LIKE ? OR description LIKE ? OR category LIKE ?'
      const searchTerm = `%${keyword}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const [rows] = await pool.query(query, [...params, pageSize, offset])
    const [countResult] = await pool.query(countQuery, params)
    
    // 解析 JSON 字段
    const templates = rows.map(row => {
      let parsedFields = []
      try {
        // 如果 fields 是字符串，解析它；如果已经是对象，直接使用
        if (typeof row.fields === 'string') {
          parsedFields = JSON.parse(row.fields)
        } else if (Array.isArray(row.fields)) {
          parsedFields = row.fields
        }
      } catch (e) {
        console.error('解析模板字段失败:', e)
        parsedFields = []
      }
      
      return {
        ...row,
        fields: parsedFields
      }
    })
    
    return {
      list: templates,
      total: countResult[0].total,
      page,
      pageSize
    }
  }

  /**
   * 根据 ID 查找模板
   * @param {number} id - 模板 ID
   * @returns {Object|null} 模板信息
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM templates WHERE id = ?',
      [id]
    )
    
    if (rows[0]) {
      return {
        ...rows[0],
        fields: JSON.parse(rows[0].fields || '[]')
      }
    }
    
    return null
  }

  /**
   * 更新模板
   * @param {number} id - 模板 ID
   * @param {Object} data - 更新的数据
   */
  static async update(id, { name, description, category, fields }) {
    const updates = []
    const params = []
    
    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (category !== undefined) {
      updates.push('category = ?')
      params.push(category)
    }
    if (fields !== undefined) {
      updates.push('fields = ?')
      params.push(JSON.stringify(fields))
    }
    
    params.push(id)
    
    await pool.query(
      `UPDATE templates SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
  }

  /**
   * 删除模板
   * @param {number} id - 模板 ID
   */
  static async delete(id) {
    await pool.query('DELETE FROM templates WHERE id = ?', [id])
  }
}

export default Template
