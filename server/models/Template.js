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
  static async create({ name, description, markData, file_path }) {
    const now = new Date()
    const [result] = await pool.query(
      'INSERT INTO templates (name, description, mark_data, file_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name,
        description,
        JSON.stringify(markData || {}),
        file_path || null,
        now,
        now
      ]
    )
    
    return {
      id: result.insertId,
      name,
      description,
      markData,
      file_path
    }
  }

  /**
   * 获取所有启用的模板（用于前端选择）
   * @returns {Array} 启用的模板列表
   */
  static async getEnabled() {
    const [rows] = await pool.query(
      "SELECT id, name, description as `desc`, icon, features, enabled FROM templates WHERE enabled = TRUE ORDER BY created_at DESC"
    );

    // 解析 JSON 字段
    return rows.map((row) => ({
      ...row,
      features:
        typeof row.features === "string"
          ? JSON.parse(row.features || "[]")
          : row.features,
    }));
  }

  /**
   * 获取所有模板（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} keyword - 搜索关键词
   * @returns {Object} 模板列表和总数
   */
  static async getAll(page = 1, pageSize = 10, keyword = "") {
    const offset = (page - 1) * pageSize;

    let query = "SELECT * FROM templates";
    let countQuery = "SELECT COUNT(*) as total FROM templates";
    const params = [];

    if (keyword) {
      query += " WHERE name LIKE ? OR description LIKE ?";
      countQuery += " WHERE name LIKE ? OR description LIKE ?";
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";

    const [rows] = await pool.query(query, [...params, pageSize, offset]);
    const [countResult] = await pool.query(countQuery, params);

    // 解析 JSON 字段
    const templates = rows.map((row) => {
      let parsedMarkData = {};

      try {
        // 解析 fields
        if (typeof row.mark_data === "string") {
          parsedMarkData = JSON.parse(row.mark_data);
        } else if (
          typeof row.mark_data === "object" &&
          row.mark_data !== null
        ) {
          parsedMarkData = row.mark_data;
        }
      } catch (e) {
        console.error("解析模板 mark_data 失败:", e);
      }

      return {
        ...row,
        markData: parsedMarkData,
      };
    });

    return {
      list: templates,
      total: countResult[0].total,
      page,
      pageSize,
    };
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
        markData: typeof row.mark_data === 'string' ? JSON.parse(row.mark_data || '{}') : row.mark_data
      }
    }
    return null
  }

  /**
   * 更新模板
   * @param {number} id - 模板 ID
   * @param {Object} data - 更新的数据
   */
  static async update(id, { name, description, markData, file_path }) {
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
    if (markData !== undefined) {
      updates.push('mark_data = ?')
      params.push(JSON.stringify(markData))
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
    await pool.query("DELETE FROM templates WHERE id = ?", [id]);
  }
}

export default Template
