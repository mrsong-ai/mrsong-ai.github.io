#!/bin/bash

# 更新阿里云部署脚本
echo "🚀 更新阿里云部署..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVER_IP="47.82.3.211"
PROJECT_DIR="/var/www/pi-gomoku"
BACKEND_PORT="3001"

# 函数：打印步骤
print_step() {
    echo -e "${GREEN}=== $1 ===${NC}"
}

print_step "1. 连接到阿里云服务器并更新代码"

# 创建SSH连接脚本
cat > temp_ssh_commands.sh << 'EOF'
#!/bin/bash

echo "🔍 检查当前服务器状态..."

# 检查项目目录
if [ -d "/var/www/pi-gomoku" ]; then
    echo "✅ 项目目录存在"
    cd /var/www/pi-gomoku
    
    # 检查Git状态
    if [ -d ".git" ]; then
        echo "📥 拉取最新代码..."
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    else
        echo "⚠️ 不是Git仓库，重新克隆..."
        cd /var/www
        rm -rf pi-gomoku
        git clone https://github.com/mrsong-ai/wuziqi.git pi-gomoku
        cd pi-gomoku
    fi
else
    echo "📁 创建项目目录..."
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/mrsong-ai/wuziqi.git pi-gomoku
    cd pi-gomoku
fi

echo "📦 安装后端依赖..."
cd houduan
npm install --production

echo "🔧 配置环境变量..."
cat > .env << ENVEOF
NODE_ENV=production
PORT=3001
CORS_ORIGIN=*
ENVEOF

echo "🔄 重启后端服务..."
pm2 delete pi-gomoku-backend 2>/dev/null || true
pm2 start server.js --name "pi-gomoku-backend"
pm2 startup
pm2 save

echo "📋 检查服务状态..."
pm2 status
pm2 logs pi-gomoku-backend --lines 10

echo "🏥 测试健康检查..."
sleep 3
curl -s http://localhost:3001/health

echo "✅ 更新完成！"
EOF

echo "📤 上传并执行更新脚本..."
echo "请手动执行以下命令连接到服务器："
echo ""
echo -e "${YELLOW}ssh root@47.82.3.211${NC}"
echo ""
echo "然后复制并执行以下命令："
echo ""
echo -e "${GREEN}# 进入项目目录并更新代码${NC}"
echo "cd /var/www/pi-gomoku && git pull origin main"
echo ""
echo -e "${GREEN}# 安装依赖${NC}"
echo "cd houduan && npm install --production"
echo ""
echo -e "${GREEN}# 重启服务${NC}"
echo "pm2 restart pi-gomoku-backend"
echo ""
echo -e "${GREEN}# 检查状态${NC}"
echo "pm2 status && curl http://localhost:3001/health"

echo ""
echo "🔧 或者使用自动部署脚本："
echo -e "${YELLOW}./deploy-to-aliyun.sh${NC}"

# 清理临时文件
rm -f temp_ssh_commands.sh

echo ""
print_step "2. 验证部署结果"
echo "等待30秒后检查服务状态..."
sleep 5

echo "检查后端服务..."
curl -s http://$SERVER_IP:3001/health | grep -q "Alibaba Cloud" && echo "✅ 后端已更新为阿里云" || echo "⚠️ 后端仍显示旧平台信息"

echo ""
echo "🎉 部署更新完成！"
echo ""
echo "📋 服务地址："
echo "- 前端: https://mrsong-ai.github.io/"
echo "- 后端: http://47.82.3.211:3001"
echo "- 健康检查: http://47.82.3.211:3001/health"
echo ""
echo "🔧 管理命令："
echo "- 查看状态: ssh root@47.82.3.211 'pm2 status'"
echo "- 查看日志: ssh root@47.82.3.211 'pm2 logs pi-gomoku-backend'"
echo "- 重启服务: ssh root@47.82.3.211 'pm2 restart pi-gomoku-backend'"
