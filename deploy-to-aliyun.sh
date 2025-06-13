#!/bin/bash

# 阿里云自动部署脚本
# 使用方法: chmod +x deploy-to-aliyun.sh && ./deploy-to-aliyun.sh

set -e

echo "🚀 开始部署Pi五子棋到阿里云..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量（请根据实际情况修改）
DOMAIN="your-domain.com"  # 替换为你的域名
PROJECT_DIR="/var/www/pi-gomoku"
BACKEND_PORT="3001"
GIT_REPO="https://github.com/mrsong-ai/wuziqi.git"  # 默认使用您的仓库

# 交互式配置
echo -e "${YELLOW}请确认部署配置：${NC}"
read -p "GitHub仓库地址 [$GIT_REPO]: " input_repo
GIT_REPO=${input_repo:-$GIT_REPO}

echo -e "${YELLOW}域名配置选项：${NC}"
echo "1. 使用IP地址访问（免费，立即可用）"
echo "2. 使用自定义域名（需要购买域名）"
read -p "请选择 (1/2) [1]: " domain_choice
domain_choice=${domain_choice:-1}

if [ "$domain_choice" = "2" ]; then
    read -p "请输入您的域名 [$DOMAIN]: " input_domain
    DOMAIN=${input_domain:-$DOMAIN}
    USE_DOMAIN=true
else
    # 获取服务器公网IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "your-server-ip")
    DOMAIN=$SERVER_IP
    USE_DOMAIN=false
    echo -e "${GREEN}将使用IP地址: $SERVER_IP${NC}"
fi

read -p "后端端口 [$BACKEND_PORT]: " input_port
BACKEND_PORT=${input_port:-$BACKEND_PORT}

echo -e "${GREEN}配置确认：${NC}"
echo "仓库地址: $GIT_REPO"
if [ "$USE_DOMAIN" = true ]; then
    echo "访问方式: 域名 - https://$DOMAIN"
else
    echo "访问方式: IP地址 - http://$DOMAIN"
fi
echo "后端端口: $BACKEND_PORT"
echo ""
read -p "确认开始部署？(y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 0
fi

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用root用户运行此脚本${NC}"
    echo "使用命令: sudo ./deploy-to-aliyun.sh"
    exit 1
fi

# 函数：打印步骤
print_step() {
    echo -e "${GREEN}=== $1 ===${NC}"
}

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 步骤1：更新系统
print_step "更新系统包"
apt update && apt upgrade -y

# 步骤2：安装Node.js
print_step "安装Node.js 18"
if ! command_exists node; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}Node.js 安装完成: $(node --version)${NC}"
else
    echo -e "${YELLOW}Node.js 已安装: $(node --version)${NC}"
fi

# 步骤3：安装PM2
print_step "安装PM2进程管理器"
if ! command_exists pm2; then
    npm install -g pm2
    echo -e "${GREEN}PM2 安装完成${NC}"
else
    echo -e "${YELLOW}PM2 已安装${NC}"
fi

# 步骤4：安装Nginx
print_step "安装Nginx"
if ! command_exists nginx; then
    apt install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx 安装完成${NC}"
else
    echo -e "${YELLOW}Nginx 已安装${NC}"
fi

# 步骤5：安装Git
print_step "安装Git"
if ! command_exists git; then
    apt install -y git
    echo -e "${GREEN}Git 安装完成${NC}"
else
    echo -e "${YELLOW}Git 已安装${NC}"
fi

# 步骤6：克隆项目代码
print_step "克隆项目代码"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}项目目录已存在，更新代码...${NC}"
    cd $PROJECT_DIR

    # 检查是否为Git仓库
    if [ -d ".git" ]; then
        echo "拉取最新代码..."
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    else
        echo "目录存在但不是Git仓库，重新克隆..."
        cd ..
        rm -rf $PROJECT_DIR
        git clone $GIT_REPO $PROJECT_DIR
        cd $PROJECT_DIR
    fi
else
    echo -e "${GREEN}克隆新项目...${NC}"
    mkdir -p $(dirname $PROJECT_DIR)
    git clone $GIT_REPO $PROJECT_DIR
    cd $PROJECT_DIR
fi

# 检查克隆是否成功
if [ ! -f "houduan/server.js" ]; then
    echo -e "${RED}错误：项目结构不正确，请检查仓库地址${NC}"
    exit 1
fi

echo -e "${GREEN}代码获取成功！${NC}"

# 步骤7：安装后端依赖
print_step "安装后端依赖"
cd $PROJECT_DIR/houduan
npm install --production

# 步骤8：创建数据目录
print_step "创建数据目录"
mkdir -p $PROJECT_DIR/houduan/data
chown -R www-data:www-data $PROJECT_DIR/houduan/data

# 步骤9：配置环境变量
print_step "配置环境变量"
cat > $PROJECT_DIR/houduan/.env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
CORS_ORIGIN=https://$DOMAIN
EOF

# 步骤10：启动后端服务
print_step "启动后端服务"
cd $PROJECT_DIR/houduan
pm2 delete pi-gomoku-backend 2>/dev/null || true
pm2 start server.js --name "pi-gomoku-backend"
pm2 startup
pm2 save

# 步骤11：配置Nginx
print_step "配置Nginx"

if [ "$USE_DOMAIN" = true ]; then
    # 域名模式配置
    cat > /etc/nginx/sites-available/pi-gomoku << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 前端静态文件
    location / {
        root $PROJECT_DIR/qianduan;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        access_log off;
    }
}
EOF
else
    # IP模式配置
    cat > /etc/nginx/sites-available/pi-gomoku << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 前端静态文件
    location / {
        root $PROJECT_DIR/qianduan;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        access_log off;
    }

    # 直接访问后端（兼容模式）
    location :$BACKEND_PORT/ {
        proxy_pass http://localhost:$BACKEND_PORT/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi

# 启用Nginx配置
ln -sf /etc/nginx/sites-available/pi-gomoku /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t
systemctl restart nginx

# 步骤12：配置防火墙
print_step "配置防火墙"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# 步骤13：配置SSL证书（可选）
if [ "$USE_DOMAIN" = true ]; then
    print_step "配置SSL证书"
    if command_exists certbot; then
        echo -e "${YELLOW}Certbot 已安装${NC}"
    else
        apt install -y certbot python3-certbot-nginx
    fi

    echo -e "${YELLOW}要配置SSL证书，请运行：${NC}"
    echo -e "${GREEN}certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
else
    print_step "跳过SSL配置（IP模式）"
    echo -e "${YELLOW}使用IP地址访问，跳过SSL证书配置${NC}"
    echo -e "${YELLOW}如需HTTPS，请购买域名并重新运行脚本${NC}"
fi

# 步骤14：创建监控脚本
print_step "创建监控脚本"
cat > /usr/local/bin/pi-gomoku-monitor.sh << 'EOF'
#!/bin/bash
# Pi五子棋服务监控脚本

# 检查后端服务
if ! pm2 list | grep -q "pi-gomoku-backend.*online"; then
    echo "$(date): 后端服务异常，正在重启..." >> /var/log/pi-gomoku-monitor.log
    pm2 restart pi-gomoku-backend
fi

# 检查Nginx
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx服务异常，正在重启..." >> /var/log/pi-gomoku-monitor.log
    systemctl restart nginx
fi

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): 磁盘使用率过高: ${DISK_USAGE}%" >> /var/log/pi-gomoku-monitor.log
fi
EOF

chmod +x /usr/local/bin/pi-gomoku-monitor.sh

# 添加到crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/pi-gomoku-monitor.sh") | crontab -

# 步骤15：创建备份脚本
print_step "创建备份脚本"
cat > /usr/local/bin/pi-gomoku-backup.sh << EOF
#!/bin/bash
# Pi五子棋数据备份脚本

BACKUP_DIR="/var/backups/pi-gomoku"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# 备份用户数据
cp -r $PROJECT_DIR/houduan/data \$BACKUP_DIR/data_\$DATE

# 保留最近7天的备份
find \$BACKUP_DIR -name "data_*" -mtime +7 -delete

echo "\$(date): 备份完成 - \$BACKUP_DIR/data_\$DATE" >> /var/log/pi-gomoku-backup.log
EOF

chmod +x /usr/local/bin/pi-gomoku-backup.sh

# 添加每日备份任务
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/pi-gomoku-backup.sh") | crontab -

# 完成部署
print_step "部署完成"
echo -e "${GREEN}🎉 Pi五子棋部署成功！${NC}"
echo ""
echo -e "${YELLOW}接下来的步骤：${NC}"
echo "1. 配置域名DNS解析指向此服务器IP"
echo "2. 运行 SSL 证书配置: certbot --nginx -d $DOMAIN"
echo "3. 修改前端代码中的API地址为: https://$DOMAIN/api"
echo "4. 测试访问: http://$DOMAIN"
echo ""
echo -e "${YELLOW}服务管理命令：${NC}"
echo "查看后端状态: pm2 status"
echo "查看后端日志: pm2 logs pi-gomoku-backend"
echo "重启后端: pm2 restart pi-gomoku-backend"
echo "查看Nginx状态: systemctl status nginx"
echo ""
echo -e "${YELLOW}监控和备份：${NC}"
echo "监控日志: tail -f /var/log/pi-gomoku-monitor.log"
echo "备份日志: tail -f /var/log/pi-gomoku-backup.log"
echo "手动备份: /usr/local/bin/pi-gomoku-backup.sh"
echo ""
echo -e "${GREEN}部署完成！祝您使用愉快！${NC}"
