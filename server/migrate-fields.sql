-- 迁移脚本：将 templates 表的 fields 和 mapping 字段合并为 mark_data
-- 执行方式：在 MySQL 命令行或工具中运行此脚本

USE fastreplace;

-- 添加新字段
ALTER TABLE templates ADD COLUMN mark_data LONGTEXT COMMENT '标记数据 JSON (包含表单结构和映射配置)' AFTER features;

-- 迁移数据：将 fields 和 mapping 合并到 mark_data
UPDATE templates SET mark_data = JSON_OBJECT('fields', IFNULL(fields, '{}'), 'mapping', IFNULL(mapping, '{}'));

-- 删除旧字段
ALTER TABLE templates DROP COLUMN fields;
ALTER TABLE templates DROP COLUMN mapping;

-- 验证修改
DESCRIBE templates;
