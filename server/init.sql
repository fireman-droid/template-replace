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

-- 插入测试账号
-- 管理员账号：admin@test.com / admin123
-- 普通用户账号：user@test.com / user123
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@test.com', '$2a$10$Kx//SCdZt15G7fy9XC3pf.dYIBgeYwGqhBUQYuq3FYfQH3o7cVlrK', 'admin'),
('testuser', 'user@test.com', '$2a$10$DESD/rLo7eE0bnZd4Xasr.pjEGJssdIJPswaefByCfvHRmuPwoYQi', 'user')
ON DUPLICATE KEY UPDATE username=username;
