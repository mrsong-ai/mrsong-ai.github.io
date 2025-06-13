#!/bin/bash

# 阿里云部署更新脚本
echo "🚀 开始更新阿里云部署..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVER_IP="47.82.3.211"

# 函数：打印步骤
print_step() {
    echo -e "${GREEN}=== $1 ===${NC}"
}

print_step "1. 检查本地Git状态"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}发现未提交的更改，正在提交...${NC}"
    git add .
    git commit -m "Update deployment configuration for Alibaba Cloud"
    git push origin main
    echo -e "${GREEN}代码已推送到GitHub${NC}"
else
    echo -e "${GREEN}代码已是最新状态${NC}"
fi

print_step "2. 连接服务器并更新部署"

echo -e "${YELLOW}正在连接到阿里云服务器 $SERVER_IP...${NC}"
echo -e "${YELLOW}请确保您的SSH密钥已正确配置${NC}"
echo ""

# 创建远程执行脚本
cat > remote_update.sh << 'EOF'
#!/bin/bash

echo "🔍 检查服务器环境..."

# 检查必要的工具
command -v git >/dev/null 2>&1 || { echo "Git未安装"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js未安装"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "PM2未安装"; exit 1; }

echo "✅ 环境检查通过"

# 进入项目目录
PROJECT_DIR="/var/www/pi-gomoku"

if [ -d "$PROJECT_DIR" ]; then
    echo "📁 进入项目目录: $PROJECT_DIR"
    cd $PROJECT_DIR
    
    # 检查Git状态
    if [ -d ".git" ]; then
        echo "📥 拉取最新代码..."
        git fetch origin
        git reset --hard origin/main
        git pull origin main
        echo "✅ 代码更新完成"
    else
        echo "⚠️ 目录不是Git仓库，重新克隆..."
        cd /var/www
        rm -rf pi-gomoku
        git clone https://github.com/mrsong-ai/wuziqi.git pi-gomoku
        cd pi-gomoku
        echo "✅ 代码克隆完成"
    fi
else
    echo "📁 创建项目目录..."
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/mrsong-ai/wuziqi.git pi-gomoku
    cd pi-gomoku
    echo "✅ 项目初始化完成"
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd houduan
npm install --production

# 配置环境变量
echo "🔧 配置环境变量..."
cat > .env << ENVEOF
NODE_ENV=production
PORT=3001
CORS_ORIGIN=*
ENVEOF

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data
chown -R www-data:www-data data 2>/dev/null || true

# 重启后端服务
echo "🔄 重启后端服务..."
pm2 delete pi-gomoku-backend 2>/dev/null || true
pm2 start server.js --name "pi-gomoku-backend"
pm2 startup
pm2 save

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "📋 检查服务状态..."
pm2 status

# 测试健康检查
echo "🏥 测试健康检查..."
curl -s http://localhost:3001/health

echo ""
echo "✅ 服务器更新完成！"
EOF

# 上传并执行脚本
echo "📤 上传更新脚本到服务器..."
scp remote_update.sh root@$SERVER_IP:/tmp/

echo "🚀 执行远程更新..."
ssh root@$SERVER_IP 'chmod +x /tmp/remote_update.sh && /tmp/remote_update.sh'

# 清理临时文件
rm -f remote_update.sh

print_step "3. 验证部署结果"

echo "⏳ 等待服务稳定..."
sleep 10

echo "🏥 检查健康状态..."
HEALTH_CHECK=$(curl -s http://$SERVER_IP:3001/health)
echo "$HEALTH_CHECK"

if echo "$HEALTH_CHECK" | grep -q "Alibaba Cloud"; then
    echo -e "${GREEN}✅ 后端已成功更新为阿里云平台${NC}"
else
    echo -e "${YELLOW}⚠️ 后端平台信息可能未更新，请检查${NC}"
fi

echo ""
echo "🎉 部署更新完成！"
echo ""
echo -e "${GREEN}📋 服务地址：${NC}"
echo "- 前端: https://mrsong-ai.github.io/"
echo "- 后端: http://$SERVER_IP:3001"
echo "- 健康检查: http://$SERVER_IP:3001/health"
echo "- API文档: http://$SERVER_IP:3001/api"
echo ""
echo -e "${GREEN}🔧 管理命令：${NC}"
echo "- 查看状态: ssh root@$SERVER_IP 'pm2 status'"
echo "- 查看日志: ssh root@$SERVER_IP 'pm2 logs pi-gomoku-backend'"
echo "- 重启服务: ssh root@$SERVER_IP 'pm2 restart pi-gomoku-backend'"
echo "- 更新代码: ssh root@$SERVER_IP 'cd /var/www/pi-gomoku && git pull && cd houduan && npm install && pm2 restart pi-gomoku-backend'"
echo ""
echo -e "${GREEN}🎮 测试游戏：${NC}"
echo "访问 https://mrsong-ai.github.io/ 开始游戏！"
