#!/bin/bash

# 🚀 Pi Network五子棋一键部署脚本
# 适用于全新的阿里云CentOS/Ubuntu服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 项目信息
GITHUB_REPO="https://github.com/mrsong-ai/pi-gomoku-backend.git"
PROJECT_DIR="/var/www/pi-gomoku"
SERVICE_NAME="pi-gomoku-backend"

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🎮 Pi Network 五子棋                      ║"
    echo "║                      一键部署脚本 v1.0                       ║"
    echo "║                                                              ║"
    echo "║  GitHub: https://github.com/mrsong-ai/pi-gomoku-backend     ║"
    echo "║  前端: https://mrsong-ai.github.io/                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检测操作系统
detect_os() {
    if [ -f /etc/redhat-release ]; then
        OS="centos"
        PKG_MANAGER="yum"
    elif [ -f /etc/debian_version ]; then
        OS="ubuntu"
        PKG_MANAGER="apt"
    else
        print_error "不支持的操作系统"
        exit 1
    fi
    print_success "检测到操作系统: $OS"
}

# 更新系统
update_system() {
    print_step "更新系统包..."
    if [ "$OS" = "centos" ]; then
        yum update -y
    else
        apt update && apt upgrade -y
    fi
    print_success "系统更新完成"
}

# 安装Node.js
install_nodejs() {
    print_step "安装Node.js 18..."
    
    if [ "$OS" = "centos" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    else
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    print_success "Node.js安装完成: $(node --version)"
}

# 安装其他依赖
install_dependencies() {
    print_step "安装系统依赖..."
    
    if [ "$OS" = "centos" ]; then
        yum install -y git nginx firewalld
        systemctl enable firewalld
        systemctl start firewalld
    else
        apt install -y git nginx ufw
        ufw --force enable
    fi
    
    # 安装PM2
    npm install -g pm2
    
    # 启动Nginx
    systemctl enable nginx
    systemctl start nginx
    
    print_success "依赖安装完成"
}

# 配置防火墙
setup_firewall() {
    print_step "配置防火墙..."
    
    if [ "$OS" = "centos" ]; then
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=3001/tcp
        firewall-cmd --reload
    else
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 3001/tcp
    fi
    
    print_success "防火墙配置完成"
}

# 克隆项目
clone_project() {
    print_step "克隆项目代码..."
    
    # 创建项目目录
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # 克隆代码
    git clone $GITHUB_REPO .
    
    print_success "项目代码克隆完成"
}

# 安装项目依赖
install_project_deps() {
    print_step "安装项目依赖..."
    
    cd $PROJECT_DIR
    npm install --production
    
    print_success "项目依赖安装完成"
}

# 配置环境变量
setup_env() {
    print_step "配置环境变量..."
    
    cd $PROJECT_DIR
    
    if [ ! -f .env ]; then
        cat > .env << EOF
PORT=3001
NODE_ENV=production
ADMIN_KEY=pi-gomoku-admin-$(date +%s)
PI_API_BASE=https://api.minepi.com
EOF
        print_success "环境变量配置完成"
    else
        print_warning "环境变量文件已存在，跳过配置"
    fi
}

# 配置Nginx
setup_nginx() {
    print_step "配置Nginx..."
    
    # 获取服务器IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "YOUR_SERVER_IP")
    
    cat > /etc/nginx/conf.d/pi-gomoku.conf << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # 前端代理到GitHub Pages
    location / {
        proxy_pass https://mrsong-ai.github.io/;
        proxy_set_header Host mrsong-ai.github.io;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS配置
        add_header Access-Control-Allow-Origin "https://mrsong-ai.github.io" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3001/health;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

    # 测试Nginx配置
    nginx -t
    systemctl reload nginx
    
    print_success "Nginx配置完成"
}

# 启动服务
start_service() {
    print_step "启动后端服务..."
    
    cd $PROJECT_DIR
    
    # 停止可能存在的服务
    pm2 stop $SERVICE_NAME 2>/dev/null || true
    pm2 delete $SERVICE_NAME 2>/dev/null || true
    
    # 启动新服务
    pm2 start server.js --name $SERVICE_NAME
    pm2 save
    pm2 startup
    
    print_success "后端服务启动完成"
}

# 生成SSH密钥
generate_ssh_key() {
    print_step "生成GitHub部署密钥..."
    
    if [ ! -f ~/.ssh/github_deploy ]; then
        ssh-keygen -t rsa -b 4096 -C "github-deploy-$(date +%s)" -f ~/.ssh/github_deploy -N ""
        cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
        chmod 600 ~/.ssh/authorized_keys
        chmod 700 ~/.ssh
        
        print_success "SSH密钥生成完成"
        echo -e "\n${YELLOW}📋 请将以下私钥添加到GitHub仓库的Secrets中 (ALIYUN_SSH_KEY):${NC}"
        echo "----------------------------------------"
        cat ~/.ssh/github_deploy
        echo "----------------------------------------"
    else
        print_warning "SSH密钥已存在，跳过生成"
    fi
}

# 健康检查
health_check() {
    print_step "执行健康检查..."
    
    sleep 5
    
    # 检查PM2服务状态
    if pm2 list | grep -q $SERVICE_NAME; then
        print_success "PM2服务运行正常"
    else
        print_error "PM2服务启动失败"
        return 1
    fi
    
    # 检查端口监听
    if netstat -tlnp | grep -q ":3001"; then
        print_success "后端端口3001监听正常"
    else
        print_error "后端端口3001未监听"
        return 1
    fi
    
    # 检查API响应
    if curl -f -s http://localhost:3001/health > /dev/null; then
        print_success "API健康检查通过"
    else
        print_warning "API健康检查失败，但服务可能仍在启动中"
    fi
}

# 显示部署结果
show_result() {
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "YOUR_SERVER_IP")
    
    echo -e "\n${GREEN}🎉 部署完成！${NC}\n"
    echo -e "${BLUE}📊 部署信息:${NC}"
    echo -e "  🌐 访问地址: http://$SERVER_IP"
    echo -e "  🔗 前端页面: http://$SERVER_IP/"
    echo -e "  🔌 后端API: http://$SERVER_IP/api/"
    echo -e "  💓 健康检查: http://$SERVER_IP/health"
    echo -e "  📁 项目目录: $PROJECT_DIR"
    
    echo -e "\n${YELLOW}🔧 管理命令:${NC}"
    echo -e "  查看服务状态: pm2 status"
    echo -e "  查看服务日志: pm2 logs $SERVICE_NAME"
    echo -e "  重启服务: pm2 restart $SERVICE_NAME"
    echo -e "  停止服务: pm2 stop $SERVICE_NAME"
    
    echo -e "\n${PURPLE}📝 下一步:${NC}"
    echo -e "  1. 将上面显示的SSH私钥添加到GitHub Secrets"
    echo -e "  2. 在GitHub仓库设置自动部署工作流"
    echo -e "  3. 测试前端是否能正常连接后端API"
    
    if [ "$SERVER_IP" != "YOUR_SERVER_IP" ]; then
        echo -e "\n${GREEN}🚀 现在可以访问: http://$SERVER_IP${NC}"
    fi
}

# 主函数
main() {
    print_banner
    
    # 检查是否为root用户
    if [[ $EUID -ne 0 ]]; then
        print_error "请使用root用户运行此脚本"
        exit 1
    fi
    
    echo -e "${YELLOW}即将开始一键部署，这将需要几分钟时间...${NC}"
    read -p "按Enter键继续，或Ctrl+C取消: "
    
    detect_os
    update_system
    install_nodejs
    install_dependencies
    setup_firewall
    clone_project
    install_project_deps
    setup_env
    setup_nginx
    start_service
    generate_ssh_key
    health_check
    show_result
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 运行主函数
main "$@"
