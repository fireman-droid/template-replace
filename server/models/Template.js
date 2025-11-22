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
  static async create({ name, description, fields, mapping, file_path }) {
    const [result] = await pool.query(
      'INSERT INTO templates (name, description, fields, mapping, file_path) VALUES (?, ?, ?, ?, ?)',
      [
        name, 
        description, 
        JSON.stringify(fields || {}),
        JSON.stringify(mapping || {}),
        file_path || null
      ]
    )
    
    return {
      id: result.insertId,
      name,
      description,
      fields,
      mapping,
      file_path
    }
  }

  /**
   * 获取所有启用的模板（用于前端选择）
   * @returns {Array} 启用的模板列表
   */
  static async getEnabled() {
    const [rows] = await pool.query(
      'SELECT id, name, description as `desc`, icon, features, enabled FROM templates WHERE enabled = TRUE ORDER BY created_at DESC'
    )
    
    // 解析 JSON 字段
    return rows.map(row => ({
      ...row,
      features: typeof row.features === 'string' ? JSON.parse(row.features || '[]') : row.features
    }))
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
      query += ' WHERE name LIKE ? OR description LIKE ?'
      countQuery += ' WHERE name LIKE ? OR description LIKE ?'
      const searchTerm = `%${keyword}%`
      params.push(searchTerm, searchTerm)
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    
    const [rows] = await pool.query(query, [...params, pageSize, offset])
    const [countResult] = await pool.query(countQuery, params)
    
    // 解析 JSON 字段
    const templates = rows.map(row => {
      let parsedFields = {}
      let parsedMapping = {}
      
      try {
        // 解析 fields
        if (typeof row.fields === 'string') {
          parsedFields = JSON.parse(row.fields)
        } else if (typeof row.fields === 'object' && row.fields !== null) {
          parsedFields = row.fields
        }
        
        // 解析 mapping
        if (typeof row.mapping === 'string') {
          parsedMapping = JSON.parse(row.mapping)
        } else if (typeof row.mapping === 'object' && row.mapping !== null) {
          parsedMapping = row.mapping
        }
      } catch (e) {
        console.error('解析模板字段失败:', e)
      }
      
      return {
        ...row,
        fields: parsedFields,
        mapping: parsedMapping
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
      const row = rows[0]
      return {
        ...row,
        fields: typeof row.fields === 'string' ? JSON.parse(row.fields || '{}') : row.fields,
        mapping: typeof row.mapping === 'string' ? JSON.parse(row.mapping || '{}') : row.mapping
      }
    }
    
    return null
  }

  /**
   * 更新模板
   * @param {number} id - 模板 ID
   * @param {Object} data - 更新的数据
   */
  static async update(id, { name, description, fields, mapping, file_path }) {
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
    if (fields !== undefined) {
      updates.push('fields = ?')
      params.push(JSON.stringify(fields))
    }
    if (mapping !== undefined) {
      updates.push('mapping = ?')
      params.push(JSON.stringify(mapping))
    }
    if (file_path !== undefined) {
      updates.push('file_path = ?')
      params.push(file_path)
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
