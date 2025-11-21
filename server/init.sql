-- 创建数据库
CREATE DATABASE IF NOT EXISTS fastreplace DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fastreplace;

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
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  fields JSON,
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

-- 插入示例模板
INSERT INTO templates (name, description, category, fields) VALUES 
('离婚协议书', '标准离婚协议书模板', 'divorce', '[{"name":"husband_name","label":"男方姓名","type":"text"},{"name":"wife_name","label":"女方姓名","type":"text"},{"name":"marriage_date","label":"结婚日期","type":"date"}]'),
('买卖合同', '商品买卖合同模板', 'sales', '[{"name":"buyer","label":"买方","type":"text"},{"name":"seller","label":"卖方","type":"text"},{"name":"amount","label":"金额","type":"number"}]'),
('租赁合同', '房屋租赁合同模板', 'house', '[{"name":"landlord","label":"出租方","type":"text"},{"name":"tenant","label":"承租方","type":"text"},{"name":"address","label":"房屋地址","type":"text"}]')
ON DUPLICATE KEY UPDATE name=name;
