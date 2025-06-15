# 🔄 Pi Network五子棋重新部署指南

## 📋 当前状况
- **前端**: https://mrsong-ai.github.io/ ✅ 正常运行
- **后端仓库**: https://github.com/mrsong-ai/pi-gomoku-backend ✅ 代码完整
- **需要**: 重新部署后端服务

## 🎯 推荐部署方案

### 方案A: 阿里云轻量应用服务器 (推荐)

#### 💰 成本预估
- **轻量应用服务器**: 24元/月起
- **带宽**: 1M-5M (够用)
- **存储**: 20GB-40GB

#### 🛒 购买步骤
1. 访问 [阿里云轻量应用服务器](https://www.aliyun.com/product/swas)
2. 选择配置：
   - **地域**: 选择离用户近的（如华东、华南）
   - **镜像**: CentOS 7.6 或 Ubuntu 20.04
   - **套餐**: 1核2GB内存（24元/月）足够
3. 购买并等待创建完成

#### 🔧 服务器配置

##### 1. 连接服务器
```bash
# 使用阿里云控制台的远程连接，或者SSH
ssh root@你的服务器IP
```

##### 2. 一键环境配置
```bash
# 下载配置脚本
curl -fsSL https://raw.githubusercontent.com/mrsong-ai/pi-gomoku-backend/main/setup-server.sh -o setup.sh

# 如果上面的链接不可用，手动创建脚本
cat > setup.sh << 'EOF'
#!/bin/bash
echo "🚀 开始配置Pi Network五子棋服务器..."

# 更新系统
yum update -y

# 安装Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装PM2
npm install -g pm2

# 安装Git
yum install -y git

# 安装Nginx
yum install -y nginx
systemctl enable nginx
systemctl start nginx

# 创建项目目录
mkdir -p /var/www/pi-gomoku
cd /var/www/pi-gomoku

# 克隆后端代码
git clone https://github.com/mrsong-ai/pi-gomoku-backend.git .

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env

echo "✅ 基础环境配置完成！"
echo "📝 请编辑 .env 文件配置环境变量"
echo "🚀 然后运行: pm2 start server.js --name pi-gomoku"
EOF

# 运行配置脚本
chmod +x setup.sh
./setup.sh
```

##### 3. 配置环境变量
```bash
cd /var/www/pi-gomoku
nano .env
```

添加配置：
```env
PORT=3001
NODE_ENV=production
ADMIN_KEY=your-secure-admin-key-here
PI_API_BASE=https://api.minepi.com
```

##### 4. 启动服务
```bash
# 启动后端服务
pm2 start server.js --name pi-gomoku-backend

# 保存PM2配置
pm2 save
pm2 startup
```

##### 5. 配置Nginx
```bash
# 创建Nginx配置
cat > /etc/nginx/conf.d/pi-gomoku.conf << 'EOF'
server {
    listen 80;
    server_name 你的服务器IP;

    # 前端代理到GitHub Pages
    location / {
        proxy_pass https://mrsong-ai.github.io/;
        proxy_set_header Host mrsong-ai.github.io;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS配置
        add_header Access-Control-Allow-Origin "https://mrsong-ai.github.io" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF

# 重启Nginx
nginx -t
systemctl reload nginx
```

##### 6. 配置防火墙
```bash
# 开放端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

#### 🔄 设置GitHub自动部署

##### 1. 生成SSH密钥
```bash
# 在服务器上生成密钥
ssh-keygen -t rsa -b 4096 -C "github-deploy" -f ~/.ssh/github_deploy -N ""

# 查看公钥（添加到服务器authorized_keys）
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# 查看私钥（添加到GitHub Secrets）
cat ~/.ssh/github_deploy
```

##### 2. 在GitHub仓库设置Secrets
访问 `https://github.com/mrsong-ai/pi-gomoku-backend/settings/secrets/actions`

添加以下Secrets：
- `ALIYUN_HOST`: 你的服务器IP
- `ALIYUN_USERNAME`: `root`
- `ALIYUN_SSH_KEY`: 上面生成的私钥内容
- `ALIYUN_PORT`: `22`

##### 3. 创建GitHub Actions工作流
在你的后端仓库创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Aliyun

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.ALIYUN_HOST }}
        username: ${{ secrets.ALIYUN_USERNAME }}
        key: ${{ secrets.ALIYUN_SSH_KEY }}
        port: ${{ secrets.ALIYUN_PORT }}
        script: |
          cd /var/www/pi-gomoku
          git pull origin main
          npm install --production
          pm2 restart pi-gomoku-backend
          echo "🎉 部署完成！"
```

### 方案B: 免费云平台部署

#### Vercel部署 (推荐免费方案)

1. **准备代码**
   - 确保你的后端仓库有 `vercel.json` 配置

2. **部署步骤**
   ```bash
   # 安装Vercel CLI
   npm i -g vercel
   
   # 登录并部署
   vercel login
   vercel --prod
   ```

3. **配置环境变量**
   在Vercel控制台设置环境变量

## 🧪 测试部署

### 1. 健康检查
```bash
# 测试后端API
curl http://你的服务器IP/api/health

# 测试前端代理
curl http://你的服务器IP/
```

### 2. 前端连接测试
修改前端代码中的API地址为你的新服务器地址

## 📊 部署后的架构

```
用户访问
    ↓
http://你的服务器IP
    ↓
Nginx (阿里云服务器)
    ├── / → GitHub Pages (前端)
    └── /api/ → Node.js (后端)
```

## 💡 建议

1. **域名**: 考虑购买域名，更专业
2. **SSL**: 配置HTTPS证书
3. **监控**: 设置服务监控和告警
4. **备份**: 定期备份数据和配置

## 🆘 如需帮助

如果在部署过程中遇到问题，可以：
1. 查看服务器日志: `pm2 logs`
2. 检查Nginx状态: `systemctl status nginx`
3. 查看防火墙: `firewall-cmd --list-all`

选择哪个方案？我推荐先试试阿里云方案，成本不高且完全可控！
