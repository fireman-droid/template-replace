/**
 * 用户数据模型
 * 定义用户相关的数据库操作
 */
import pool from '../config/db.js'
import bcrypt from 'bcryptjs'

class User {
  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码（明文）
   * @param {string} userData.role - 角色（admin/user）
   * @returns {Object} 创建的用户信息
   */
  static async create({ username, email, password, role = 'user' }) {
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    )
    
    return {
      id: result.insertId,
      username,
      email,
      role
    }
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱
   * @returns {Object|null} 用户信息
   */
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    return rows[0] || null
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Object|null} 用户信息
   */
  static async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    return rows[0] || null
  }

  /**
   * 根据 ID 查找用户
   * @param {number} id - 用户 ID
   * @returns {Object|null} 用户信息（不含密码）
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [id]
    )
    return rows[0] || null
  }

  /**
   * 验证密码
   * @param {string} plainPassword - 明文密码
   * @param {string} hashedPassword - 加密后的密码
   * @returns {boolean} 是否匹配
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }
}

export default User
