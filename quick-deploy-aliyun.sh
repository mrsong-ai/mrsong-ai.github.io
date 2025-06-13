#!/bin/bash

echo "🚀 快速部署Pi五子棋到阿里云..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用root用户运行此脚本: sudo ./quick-deploy-aliyun.sh"
    exit 1
fi

# 1. 安装Node.js（如果未安装）
echo "=== 安装Node.js ==="
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js版本: $(node --version)"

# 2. 安装PM2（如果未安装）
echo "=== 安装PM2 ==="
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 3. 创建项目目录
echo "=== 创建项目目录 ==="
mkdir -p /var/www/pi-gomoku
cd /var/www/pi-gomoku

# 4. 克隆或更新代码
echo "=== 获取代码 ==="
if [ -d ".git" ]; then
    echo "更新现有代码..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "克隆新代码..."
    git clone https://github.com/mrsong-ai/pi-gomoku-backend.git .
fi

# 5. 安装后端依赖
echo "=== 安装后端依赖 ==="
cd houduan
npm install --production

# 6. 创建环境变量文件
echo "=== 配置环境变量 ==="
cat > .env << EOF
NODE_ENV=production
PORT=3001
CORS_ORIGIN=*
EOF

# 7. 停止旧服务并启动新服务
echo "=== 启动后端服务 ==="
pm2 delete pi-gomoku-backend 2>/dev/null || true
pm2 start server.js --name "pi-gomoku-backend"
pm2 startup
pm2 save

# 8. 配置防火墙
echo "=== 配置防火墙 ==="
ufw allow 3001
ufw --force enable

# 9. 测试服务
echo "=== 测试服务 ==="
sleep 3
curl -s http://localhost:3001/health

echo "=== 部署完成 ==="
echo "后端服务地址: http://47.82.3.211:3001"
echo "管理后台: http://47.82.3.211:3001/admin.html"
echo "健康检查: http://47.82.3.211:3001/health"

echo "查看服务状态: pm2 status"
echo "查看服务日志: pm2 logs pi-gomoku-backend"
