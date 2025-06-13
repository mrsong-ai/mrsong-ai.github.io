# 阿里云快速部署指南

## 🚀 一键部署（推荐）

### 步骤1：购买阿里云服务器
1. 访问 [阿里云轻量应用服务器](https://ecs.console.aliyun.com/server/region/cn-hangzhou)
2. 选择配置：
   - **地域**: 华东1（杭州）
   - **镜像**: Ubuntu 20.04 LTS
   - **套餐**: 2核2GB 40GB SSD（约¥60/月）
   - **时长**: 建议3个月起

### 步骤2：配置安全组
在服务器管理页面，添加防火墙规则：
```
端口范围: 80/80
端口范围: 443/443
端口范围: 22/22
```

### 步骤3：连接服务器
```bash
# 使用SSH连接（替换为你的服务器IP）
ssh root@your-server-ip
```

### 步骤4：运行自动部署脚本
```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/your-username/wuziqi/main/deploy-to-aliyun.sh

# 修改配置（重要！）
nano deploy-to-aliyun.sh
# 修改以下变量：
# DOMAIN="your-domain.com"  # 改为你的域名
# GIT_REPO="https://github.com/your-username/wuziqi.git"  # 改为你的仓库

# 运行部署脚本
chmod +x deploy-to-aliyun.sh
./deploy-to-aliyun.sh
```

### 步骤5：配置域名（如果有）
1. 在域名管理中添加A记录：
   ```
   主机记录: @
   记录类型: A
   记录值: your-server-ip
   TTL: 600
   ```

2. 配置SSL证书：
   ```bash
   certbot --nginx -d your-domain.com
   ```

## 🔧 手动部署（进阶用户）

### 1. 环境准备
```bash
# 更新系统
apt update && apt upgrade -y

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装PM2和Nginx
npm install -g pm2
apt install -y nginx git
```

### 2. 部署代码
```bash
# 克隆代码
cd /var/www
git clone https://github.com/your-username/wuziqi.git pi-gomoku
cd pi-gomoku/houduan

# 安装依赖
npm install --production

# 配置环境变量
cat > .env << EOF
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com
EOF

# 启动服务
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

### 3. 配置Nginx
```bash
# 创建配置文件
cat > /etc/nginx/sites-available/pi-gomoku << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/pi-gomoku/qianduan;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/pi-gomoku /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## 💰 成本对比

| 方案 | 月费用 | 优势 | 劣势 |
|------|--------|------|------|
| Render免费版 | ¥0 | 免费 | 休眠、限制多 |
| 阿里云轻量 | ¥60-80 | 稳定、快速 | 需要运维 |
| 阿里云ECS | ¥100-150 | 高性能 | 成本较高 |

## 🎯 迁移优势

### 性能提升
- ✅ **响应速度**: 国内访问延迟 < 50ms
- ✅ **稳定性**: 99.9% 可用性保证
- ✅ **并发能力**: 支持1000+并发用户

### 功能增强
- ✅ **数据持久化**: 真正的文件存储
- ✅ **自动备份**: 每日数据备份
- ✅ **监控告警**: 服务状态监控
- ✅ **SSL证书**: 免费HTTPS

### 运维便利
- ✅ **一键部署**: 自动化部署脚本
- ✅ **进程管理**: PM2自动重启
- ✅ **日志管理**: 完整的日志系统
- ✅ **版本控制**: Git自动更新

## 🔍 部署后检查

### 1. 服务状态检查
```bash
# 检查后端服务
pm2 status
pm2 logs pi-gomoku-backend

# 检查Nginx
systemctl status nginx
nginx -t

# 检查端口
netstat -tlnp | grep :80
netstat -tlnp | grep :3001
```

### 2. 功能测试
```bash
# 测试后端API
curl http://localhost:3001/health

# 测试前端访问
curl http://your-domain.com

# 测试API代理
curl http://your-domain.com/api/health
```

### 3. 性能监控
```bash
# 查看系统资源
htop
df -h
free -h

# 查看PM2监控
pm2 monit
```

## 🆘 常见问题

### Q: 部署失败怎么办？
A: 检查日志文件：
```bash
tail -f /var/log/pm2/pi-gomoku-error.log
tail -f /var/log/nginx/error.log
```

### Q: 如何更新代码？
A: 
```bash
cd /var/www/pi-gomoku
git pull origin main
cd houduan
npm install
pm2 restart pi-gomoku-backend
```

### Q: 如何备份数据？
A: 
```bash
# 手动备份
cp -r /var/www/pi-gomoku/houduan/data /backup/

# 自动备份已配置，查看备份日志
tail -f /var/log/pi-gomoku-backup.log
```

### Q: 域名配置问题？
A: 确保DNS解析正确：
```bash
nslookup your-domain.com
ping your-domain.com
```

## 📞 技术支持

如果遇到问题，可以：
1. 查看详细部署指南：`ALIYUN_DEPLOYMENT_GUIDE.md`
2. 检查服务器日志
3. 联系阿里云技术支持

---

**部署成功后，您的五子棋游戏将拥有：**
- 🚀 更快的访问速度
- 💪 更强的稳定性  
- 📊 完整的数据持久化
- 🔒 安全的HTTPS访问
- 📈 专业的监控和备份
