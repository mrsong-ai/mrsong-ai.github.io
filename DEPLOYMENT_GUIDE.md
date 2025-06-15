# 五子棋项目部署指南

本指南将帮助你将五子棋项目完整部署到阿里云轻量应用服务器。

## 🏗️ 项目架构

```
五子棋项目
├── qianduan/          # 前端文件
│   ├── index.html     # 主游戏页面
│   └── admin.html     # 管理员页面
├── houduan/           # 后端服务器
│   ├── server.js      # 主服务器文件
│   ├── routes/        # API路由
│   ├── lib/           # 数据库和工具
│   └── data/          # 数据存储目录
└── 部署文件
```

## 🚀 阿里云轻量应用服务器部署

### 1. 服务器准备

#### 1.1 购买和配置服务器
- 登录阿里云控制台
- 购买轻量应用服务器（推荐配置：2核4GB，40GB SSD）
- 选择操作系统：Ubuntu 20.04 LTS 或 CentOS 8
- 配置安全组，开放端口：22, 80, 443, 3001

#### 1.2 连接服务器
```bash
ssh root@your-server-ip
```

#### 1.3 更新系统
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 2. 安装必要软件

#### 2.1 安装Node.js
```bash
# 使用NodeSource仓库安装Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 2.2 安装PM2
```bash
npm install -g pm2
```

#### 2.3 安装Nginx
```bash
# Ubuntu/Debian
apt install nginx -y

# CentOS/RHEL
yum install nginx -y

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx
```

#### 2.4 安装Git
```bash
apt install git -y
```

### 3. 部署后端服务

#### 3.1 上传代码
```bash
# 方法1：使用Git克隆
cd /opt
git clone https://github.com/your-username/wuziqi.git
cd wuziqi

# 方法2：使用SCP上传
# 在本地执行：
# scp -r ./houduan root@your-server-ip:/opt/wuziqi/
```

#### 3.2 配置后端
```bash
cd /opt/wuziqi/houduan

# 安装依赖
npm install --production

# 复制环境配置
cp .env.example .env

# 编辑环境配置
nano .env
```

编辑 `.env` 文件：
```env
PORT=3001
NODE_ENV=production
ADMIN_KEY=your-secure-admin-key
PI_API_BASE=https://api.minepi.com
```

#### 3.3 启动后端服务
```bash
# 使用部署脚本（推荐）
chmod +x deploy.sh
./deploy.sh production

# 或手动启动
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 3.4 验证后端服务
```bash
# 检查服务状态
pm2 status

# 测试API
curl http://localhost:3001/health

# 查看日志
pm2 logs wuziqi-backend
```

### 4. 配置Nginx反向代理

#### 4.1 配置Nginx
```bash
# 复制配置文件
cp /opt/wuziqi/houduan/nginx.conf /etc/nginx/sites-available/wuziqi

# 编辑配置文件，替换域名
nano /etc/nginx/sites-available/wuziqi

# 创建软链接
ln -s /etc/nginx/sites-available/wuziqi /etc/nginx/sites-enabled/

# 删除默认配置
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

#### 4.2 配置前端文件
```bash
# 创建前端目录
mkdir -p /opt/wuziqi/qianduan

# 复制前端文件
cp /opt/wuziqi/index.html /opt/wuziqi/qianduan/
cp /opt/wuziqi/admin.html /opt/wuziqi/qianduan/

# 设置权限
chown -R www-data:www-data /opt/wuziqi/qianduan
chmod -R 755 /opt/wuziqi/qianduan
```

### 5. 配置域名和SSL（可选）

#### 5.1 配置域名
- 在域名提供商处添加A记录，指向服务器IP
- 等待DNS生效（通常几分钟到几小时）

#### 5.2 安装SSL证书（使用Let's Encrypt）
```bash
# 安装Certbot
apt install certbot python3-certbot-nginx -y

# 获取SSL证书
certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. 配置防火墙

#### 6.1 使用UFW（Ubuntu）
```bash
# 启用UFW
ufw enable

# 允许SSH
ufw allow ssh

# 允许HTTP和HTTPS
ufw allow 80
ufw allow 443

# 允许后端端口（仅本地访问）
ufw allow from 127.0.0.1 to any port 3001

# 查看状态
ufw status
```

#### 6.2 阿里云安全组
在阿里云控制台配置安全组规则：
- 入方向：允许 22, 80, 443 端口
- 出方向：允许所有

### 7. 监控和维护

#### 7.1 设置日志轮转
```bash
# 创建日志轮转配置
cat > /etc/logrotate.d/wuziqi << EOF
/opt/wuziqi/houduan/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reload wuziqi-backend
    endscript
}
EOF
```

#### 7.2 设置监控脚本
```bash
# 创建监控脚本
cat > /opt/wuziqi/monitor.sh << 'EOF'
#!/bin/bash
# 检查服务状态并自动重启

SERVICE_NAME="wuziqi-backend"
API_URL="http://localhost:3001/health"

# 检查PM2进程
if ! pm2 list | grep -q "$SERVICE_NAME.*online"; then
    echo "$(date): $SERVICE_NAME 进程不在线，正在重启..."
    pm2 restart $SERVICE_NAME
fi

# 检查API响应
if ! curl -f -s "$API_URL" > /dev/null; then
    echo "$(date): API无响应，正在重启服务..."
    pm2 restart $SERVICE_NAME
fi
EOF

chmod +x /opt/wuziqi/monitor.sh

# 添加到crontab
crontab -e
# 添加以下行（每5分钟检查一次）：
# */5 * * * * /opt/wuziqi/monitor.sh >> /var/log/wuziqi-monitor.log 2>&1
```

#### 7.3 数据备份
```bash
# 创建备份脚本
cat > /opt/wuziqi/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/wuziqi"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据文件
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" -C /opt/wuziqi/houduan data/

# 保留最近30天的备份
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +30 -delete

echo "$(date): 数据备份完成 - $BACKUP_DIR/data_$DATE.tar.gz"
EOF

chmod +x /opt/wuziqi/backup.sh

# 添加到crontab（每天凌晨2点备份）
# 0 2 * * * /opt/wuziqi/backup.sh >> /var/log/wuziqi-backup.log 2>&1
```

## 🐳 Docker部署（可选）

如果你更喜欢使用Docker：

```bash
# 进入后端目录
cd /opt/wuziqi/houduan

# 构建镜像
docker build -t wuziqi-backend .

# 使用docker-compose启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f wuziqi-backend
```

## 🔧 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查看端口占用
netstat -tlnp | grep :3001
# 或
lsof -i :3001
```

2. **权限问题**
```bash
# 设置正确的文件权限
chown -R root:root /opt/wuziqi
chmod -R 755 /opt/wuziqi
chmod 644 /opt/wuziqi/houduan/.env
```

3. **服务无法启动**
```bash
# 查看详细日志
pm2 logs wuziqi-backend --lines 50

# 检查配置文件
pm2 show wuziqi-backend
```

4. **Nginx配置错误**
```bash
# 测试Nginx配置
nginx -t

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log
```

### 性能优化

1. **启用Gzip压缩**（在Nginx配置中已包含）
2. **设置适当的缓存策略**
3. **使用CDN加速静态资源**
4. **定期清理日志文件**

## 📊 访问应用

部署完成后，你可以通过以下方式访问：

- **游戏主页**: `http://your-domain.com` 或 `http://your-server-ip`
- **管理员页面**: `http://your-domain.com/admin.html`
- **API健康检查**: `http://your-domain.com/health`
- **API文档**: `http://your-domain.com/api`

## 🎉 完成！

恭喜！你已经成功将五子棋项目部署到阿里云轻量应用服务器。现在用户可以通过你的域名或IP地址访问游戏了。

记住定期检查服务状态、更新依赖包，并备份重要数据。
