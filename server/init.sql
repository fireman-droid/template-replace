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
  category VARCHAR(50) NOT NULL COMMENT '模板分类',
  fields JSON COMMENT '字段配置 JSON (Schema)',
  mapping JSON COMMENT '映射配置 JSON (Tag ↔ Key)',
  file_path VARCHAR(255) COMMENT 'Word 模板文件路径',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category)
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
INSERT INTO templates (name, description, category, fields) VALUES 
('离婚协议书', '标准离婚协议书模板', 'divorce', '[{"name":"husband_name","label":"男方姓名","type":"text"},{"name":"wife_name","label":"女方姓名","type":"text"},{"name":"marriage_date","label":"结婚日期","type":"date"}]'),
('买卖合同', '商品买卖合同模板', 'sales', '[{"name":"buyer","label":"买方","type":"text"},{"name":"seller","label":"卖方","type":"text"},{"name":"amount","label":"金额","type":"number"}]'),
('租赁合同', '房屋租赁合同模板', 'house', '[{"name":"landlord","label":"出租方","type":"text"},{"name":"tenant","label":"承租方","type":"text"},{"name":"address","label":"房屋地址","type":"text"}]')
ON DUPLICATE KEY UPDATE name=name;

-- 插入示例案卷数据
INSERT INTO cases (title, template_id, user_id, status, form_data) VALUES 
('张三诉李四离婚纠纷案', 1, 2, 'draft', '{"husband_name":"张三","wife_name":"李四"}'),
('某公司房屋买卖合同', 2, 2, 'completed', '{"buyer":"某公司","seller":"王五"}'),
('民间借贷纠纷诉讼', 3, 2, 'draft', '{"landlord":"赵六","tenant":"孙七"}')
ON DUPLICATE KEY UPDATE title=title;
