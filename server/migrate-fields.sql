-- 迁移脚本：将 templates 表的 fields 和 mapping 字段从 JSON 改为 LONGTEXT
-- 执行方式：在 MySQL 命令行或工具中运行此脚本

USE fastreplace;

-- 修改 fields 字段类型
ALTER TABLE templates MODIFY COLUMN fields LONGTEXT COMMENT '字段配置 JSON (Schema) - 使用 LONGTEXT 支持大型 JSON';

-- 修改 mapping 字段类型
ALTER TABLE templates MODIFY COLUMN mapping LONGTEXT COMMENT '映射配置 JSON (Tag ↔ Key) - 使用 LONGTEXT 支持大型 JSON';

-- 验证修改
DESCRIBE templates;
