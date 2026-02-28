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
  mark_data LONGTEXT COMMENT '标记数据 JSON (包含表单结构和映射配置)',
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

