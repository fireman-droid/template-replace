@echo off
chcp 65001
echo 正在初始化数据库...
mysql -u root -pLin20050201 --default-character-set=utf8mb4 < server\init.sql
if %errorlevel% equ 0 (
    echo 数据库初始化成功！
) else (
    echo 数据库初始化失败，请检查 MySQL 是否已启动
)
pause
