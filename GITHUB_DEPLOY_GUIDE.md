# 🚀 GitHub自动部署到阿里云指南

## 📋 概述

本指南将帮你设置从GitHub仓库自动部署后端到阿里云服务器的完整流程。

## 🏗️ 部署架构

```
GitHub仓库 → GitHub Actions → 阿里云ECS服务器
    ↓              ↓              ↓
  代码推送      自动构建部署      后端服务运行
```

## 🔧 配置步骤

### 1. 阿里云服务器准备

#### 1.1 安装必要软件
```bash
# 更新系统
sudo yum update -y

# 安装Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Git
sudo yum install -y git

# 安装Nginx
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 1.2 创建项目目录
```bash
sudo mkdir -p /var/www/pi-gomoku
sudo chown -R $USER:$USER /var/www/pi-gomoku
cd /var/www/pi-gomoku
```

#### 1.3 初始化Git仓库
```bash
git clone https://github.com/你的用户名/你的仓库名.git .
```

### 2. GitHub仓库配置

#### 2.1 设置GitHub Secrets
在GitHub仓库的 Settings → Secrets and variables → Actions 中添加：

| Secret名称 | 说明 | 示例值 |
|-----------|------|--------|
| `ALIYUN_HOST` | 阿里云服务器IP | `123.456.789.0` |
| `ALIYUN_USERNAME` | SSH用户名 | `root` 或 `ubuntu` |
| `ALIYUN_SSH_KEY` | SSH私钥 | 完整的私钥内容 |
| `ALIYUN_PORT` | SSH端口 | `22` (默认) |

#### 2.2 生成SSH密钥对
在本地执行：
```bash
# 生成密钥对
ssh-keygen -t rsa -b 4096 -C "github-deploy"

# 查看公钥（添加到服务器）
cat ~/.ssh/id_rsa.pub

# 查看私钥（添加到GitHub Secrets）
cat ~/.ssh/id_rsa
```

#### 2.3 配置服务器SSH
```bash
# 在服务器上添加公钥
mkdir -p ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. 服务器环境配置

#### 3.1 配置Nginx
```bash
sudo nano /etc/nginx/conf.d/pi-gomoku.conf
```

添加配置：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
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
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

重启Nginx：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.2 配置PM2
```bash
cd /var/www/pi-gomoku/houduan
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. 测试部署

#### 4.1 手动触发部署
1. 进入GitHub仓库
2. 点击 Actions 标签
3. 选择 "Deploy Backend to Aliyun"
4. 点击 "Run workflow"

#### 4.2 验证部署
```bash
# 检查服务状态
pm2 status

# 检查日志
pm2 logs pi-gomoku-backend

# 测试API
curl http://localhost:3001/api/health
```

## 🔄 自动部署流程

1. **代码推送**: 推送代码到GitHub main分支
2. **触发构建**: GitHub Actions自动检测houduan文件夹变化
3. **构建应用**: 安装依赖，运行测试
4. **部署到服务器**: SSH连接服务器，更新代码，重启服务
5. **健康检查**: 验证服务是否正常运行

## 🛠️ 故障排除

### 常见问题

1. **SSH连接失败**
   - 检查服务器防火墙设置
   - 验证SSH密钥配置
   - 确认服务器IP和端口

2. **部署失败**
   - 查看GitHub Actions日志
   - 检查服务器磁盘空间
   - 验证Node.js和PM2安装

3. **服务启动失败**
   - 检查环境变量配置
   - 查看PM2日志
   - 验证端口占用情况

### 调试命令
```bash
# 查看GitHub Actions日志
# 在GitHub仓库的Actions页面查看

# 服务器端调试
pm2 logs --lines 50
sudo journalctl -u nginx -f
netstat -tlnp | grep :3001
```

## 📚 相关文档

- [GitHub Actions文档](https://docs.github.com/en/actions)
- [PM2文档](https://pm2.keymetrics.io/docs/)
- [Nginx配置指南](https://nginx.org/en/docs/)
- [阿里云ECS文档](https://help.aliyun.com/product/25365.html)
