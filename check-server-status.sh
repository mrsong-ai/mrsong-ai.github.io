#!/bin/bash

echo "🔍 检查阿里云服务器状态..."

echo "=== 1. 检查Node.js是否安装 ==="
node --version
npm --version

echo "=== 2. 检查PM2状态 ==="
pm2 status

echo "=== 3. 检查端口占用 ==="
netstat -tlnp | grep :3001

echo "=== 4. 检查项目目录 ==="
ls -la /var/www/pi-gomoku/

echo "=== 5. 检查后端目录 ==="
ls -la /var/www/pi-gomoku/houduan/

echo "=== 6. 检查PM2日志 ==="
pm2 logs pi-gomoku-backend --lines 20

echo "=== 7. 测试健康检查 ==="
curl -s http://localhost:3001/health || echo "健康检查失败"

echo "=== 8. 检查防火墙 ==="
ufw status

echo "检查完成！"
