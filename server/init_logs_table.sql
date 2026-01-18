-- 系统日志表
-- 用于记录管理员的操作行为，便于审计和追溯

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表';
