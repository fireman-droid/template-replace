import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 增加最大数据包大小限制，支持大型 JSON 数据（64MB）
  maxAllowedPacket: 67108864
})

// 测试数据库连接
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ MySQL 数据库连接成功')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ MySQL 数据库连接失败:', error.message)
    return false
  }
}

export default pool
