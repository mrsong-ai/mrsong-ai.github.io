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

#### 1.1 快速安装（推荐）
使用自动化脚本快速配置服务器：
```bash
# 下载并运行服务器配置脚本
curl -fsSL https://raw.githubusercontent.com/mrsong-ai/pi-gomoku-backend/main/houduan/setup-server.sh | bash
```

#### 1.2 手动安装（如果自动脚本失败）
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

# 配置防火墙
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

#### 1.3 创建项目目录
```bash
sudo mkdir -p /var/www/pi-gomoku
sudo chown -R $USER:$USER /var/www/pi-gomoku
cd /var/www/pi-gomoku
```

#### 1.4 初始化Git仓库
```bash
git clone https://github.com/mrsong-ai/pi-gomoku-backend.git .
```

#### 1.5 运行部署前检查
```bash
cd /var/www/pi-gomoku/houduan
chmod +x pre-deploy-check.sh
./pre-deploy-check.sh
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
有两种Nginx配置可选：

**基础配置（推荐新手）：**
```bash
sudo cp /var/www/pi-gomoku/houduan/nginx-site.conf /etc/nginx/conf.d/pi-gomoku.conf
```

**增强配置（推荐生产环境）：**
```bash
sudo cp /var/www/pi-gomoku/houduan/nginx-enhanced.conf /etc/nginx/conf.d/pi-gomoku.conf
```

编辑配置文件，替换域名：
```bash
sudo nano /etc/nginx/conf.d/pi-gomoku.conf
# 将 "your-domain.com" 替换为你的实际域名或IP地址
```

测试并重启Nginx：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.2 配置环境变量
```bash
cd /var/www/pi-gomoku/houduan
cp .env.production .env
# 根据需要编辑 .env 文件
nano .env
```

#### 3.3 配置PM2
```bash
cd /var/www/pi-gomoku/houduan
npm install --production
pm2 start ecosystem.config.js --env production
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
# 运行完整验证脚本
cd /var/www/pi-gomoku/houduan
chmod +x post-deploy-verify.sh
./post-deploy-verify.sh

# 或手动检查
pm2 status
pm2 logs pi-gomoku-backend --lines 20
curl http://localhost:3001/health
curl http://localhost/health
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
