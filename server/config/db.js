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
  queueLimit: 0
  // 注意：maxAllowedPacket 需要在 MySQL 服务器端配置，而不是客户端
  // 如果需要增大限制，请在 MySQL 配置文件 (my.cnf) 中设置：
  // [mysqld]
  // max_allowed_packet=64M
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
