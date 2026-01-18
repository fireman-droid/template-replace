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

/**
 * 自动迁移：检查并创建必要的数据库表
 */
const runMigrations = async () => {
  try {
    // 创建 system_logs 表（如果不存在）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL COMMENT '操作用户ID，系统操作时为NULL',
        username VARCHAR(100) NULL COMMENT '操作用户名快照',
        action VARCHAR(50) NOT NULL COMMENT '操作类型: CREATE, UPDATE, DELETE, LOGIN, LOGOUT等',
        resource_type VARCHAR(50) NULL COMMENT '资源类型: USER, TEMPLATE, CASE等',
        resource_id INT NULL COMMENT '资源ID',
        details JSON NULL COMMENT '操作详情，如修改内容、错误信息等',
        ip VARCHAR(45) NULL COMMENT '操作者IP地址',
        user_agent VARCHAR(255) NULL COMMENT '浏览器信息',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_resource_type (resource_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表'
    `)
    console.log('✅ 数据库迁移完成：system_logs 表已就绪')
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message)
  }
}

// 测试数据库连接
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ MySQL 数据库连接成功')
    connection.release()
    
    // 运行数据库迁移
    await runMigrations()
    
    return true
  } catch (error) {
    console.error('❌ MySQL 数据库连接失败:', error.message)
    return false
  }
}

export default pool

