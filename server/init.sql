-- 创建数据库
CREATE DATABASE IF NOT EXISTS fastreplace DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fastreplace;

-- 删除旧表（按依赖顺序）
DROP TABLE IF EXISTS cases;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 模板表
CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '模板名称',
  description TEXT COMMENT '模板描述',
  icon VARCHAR(50) DEFAULT 'Document' COMMENT '图标名称',
  features JSON COMMENT '特性列表 JSON',
  fields JSON COMMENT '字段配置 JSON (Schema)',
  mapping JSON COMMENT '映射配置 JSON (Tag ↔ Key)',
  file_path VARCHAR(255) COMMENT 'Word 模板文件路径',
  enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试账号
-- 管理员账号：admin@test.com / admin123
-- 普通用户账号：user@test.com / user123
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@test.com', '$2a$10$Kx//SCdZt15G7fy9XC3pf.dYIBgeYwGqhBUQYuq3FYfQH3o7cVlrK', 'admin'),
('testuser', 'user@test.com', '$2a$10$DESD/rLo7eE0bnZd4Xasr.pjEGJssdIJPswaefByCfvHRmuPwoYQi', 'user')
ON DUPLICATE KEY UPDATE username=username;

-- 案卷表
CREATE TABLE IF NOT EXISTS cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '案卷标题',
  template_id INT COMMENT '关联的模板ID',
  user_id INT NOT NULL COMMENT '创建用户ID',
  status ENUM('draft', 'completed', 'archived') DEFAULT 'draft' COMMENT '状态：草稿/已完成/已归档',
  form_data JSON COMMENT '表单数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_template_id (template_id),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入示例模板
INSERT INTO templates (name, description, icon, features, fields, enabled) VALUES 
('离婚纠纷协议', '适用于双方自愿离婚，需处理子女抚养及财产分割。', 'UserFilled', '["抚养权判定", "房产分割", "债务处理"]', '{}', TRUE),
('买卖合同纠纷', '适用于动产/不动产交易违约、货款拖欠等商事纠纷。', 'Money', '["违约金计算", "风险转移", "质量异议"]', '{}', TRUE),
('房屋租赁/纠纷', '适用于房屋租赁违约、押金退还、腾房等居住权纠纷。', 'House', '["装修折旧", "免租期条款", "优先购买权"]', '{}', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- 插入示例案卷数据
INSERT INTO cases (title, template_id, user_id, status, form_data) VALUES 
('张三诉李四离婚纠纷案', 1, 2, 'draft', '{"husband_name":"张三","wife_name":"李四"}'),
('某公司房屋买卖合同', 2, 2, 'completed', '{"buyer":"某公司","seller":"王五"}'),
('民间借贷纠纷诉讼', 3, 2, 'draft', '{"landlord":"赵六","tenant":"孙七"}')
ON DUPLICATE KEY UPDATE title=title;
