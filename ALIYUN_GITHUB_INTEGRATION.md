# 阿里云GitHub集成部署指南

## 🎯 GitHub到阿里云部署方案

### 方案一：直接Git部署（推荐新手）

#### 特点
- ✅ 最简单的方式
- ✅ 支持公开和私有仓库
- ✅ 手动控制部署时机
- ✅ 无需额外配置

#### 部署步骤
```bash
# 1. 连接阿里云服务器
ssh root@your-server-ip

# 2. 直接克隆GitHub仓库
cd /var/www
git clone https://github.com/mrsong-ai/wuziqi.git pi-gomoku

# 3. 后续更新代码
cd /var/www/pi-gomoku
git pull origin main
pm2 restart pi-gomoku-backend
```

### 方案二：阿里云云效 + GitHub（推荐进阶）

#### 特点
- ✅ 自动化CI/CD流水线
- ✅ GitHub代码变更自动部署
- ✅ 支持多环境部署
- ✅ 完整的部署日志

#### 配置步骤

1. **开通云效服务**
   - 访问：https://devops.aliyun.com/
   - 免费开通云效服务

2. **关联GitHub仓库**
   ```
   云效控制台 → 代码管理 → 代码库 → 关联外部代码库
   选择：GitHub
   授权：允许云效访问GitHub
   选择仓库：mrsong-ai/wuziqi
   ```

3. **创建流水线**
   ```yaml
   # .aliyun/pipeline.yml
   version: '1.0'
   name: pi-gomoku-deploy
   
   stages:
     - name: 构建阶段
       jobs:
         - name: 安装依赖
           steps:
             - name: 安装Node.js依赖
               run: |
                 cd houduan
                 npm install --production
   
     - name: 部署阶段
       jobs:
         - name: 部署到服务器
           steps:
             - name: 部署后端
               run: |
                 pm2 restart pi-gomoku-backend
             - name: 重载Nginx
               run: |
                 nginx -s reload
   ```

### 方案三：GitHub Actions + 阿里云（最专业）

#### 特点
- ✅ 完全自动化部署
- ✅ 支持多环境（开发/生产）
- ✅ 自动测试和部署
- ✅ 部署失败自动回滚

#### 配置GitHub Actions

1. **创建部署密钥**
   ```bash
   # 在本地生成SSH密钥
   ssh-keygen -t rsa -b 4096 -C "deploy@aliyun"
   
   # 将公钥添加到阿里云服务器
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   
   # 将私钥添加到GitHub Secrets
   # GitHub仓库 → Settings → Secrets → New repository secret
   # Name: ALIYUN_SSH_KEY
   # Value: 私钥内容
   ```

2. **创建GitHub Actions工作流**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Aliyun
   
   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       
       steps:
       - name: 检出代码
         uses: actions/checkout@v3
       
       - name: 设置Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           
       - name: 安装依赖
         run: |
           cd houduan
           npm ci --only=production
           
       - name: 部署到阿里云
         uses: appleboy/ssh-action@v0.1.5
         with:
           host: ${{ secrets.ALIYUN_HOST }}
           username: ${{ secrets.ALIYUN_USERNAME }}
           key: ${{ secrets.ALIYUN_SSH_KEY }}
           script: |
             cd /var/www/pi-gomoku
             git pull origin main
             cd houduan
             npm install --production
             pm2 restart pi-gomoku-backend
             nginx -s reload
   ```

3. **配置GitHub Secrets**
   ```
   ALIYUN_HOST: 你的服务器IP
   ALIYUN_USERNAME: root
   ALIYUN_SSH_KEY: SSH私钥内容
   ```

### 方案四：阿里云容器服务（高级）

#### 特点
- ✅ Docker容器化部署
- ✅ 自动扩缩容
- ✅ 负载均衡
- ✅ 适合大规模应用

#### 配置步骤

1. **创建Dockerfile**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY houduan/package*.json ./
   RUN npm ci --only=production
   
   COPY houduan/ .
   COPY qianduan/ ./public/
   
   EXPOSE 3001
   CMD ["node", "server.js"]
   ```

2. **配置容器镜像服务**
   ```bash
   # 构建并推送到阿里云镜像仓库
   docker build -t pi-gomoku .
   docker tag pi-gomoku registry.cn-hangzhou.aliyuncs.com/your-namespace/pi-gomoku
   docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/pi-gomoku
   ```

## 🚀 推荐部署流程

### 对于您的项目，我推荐以下流程：

#### 阶段一：快速部署（立即可用）
```bash
# 1. 购买阿里云服务器
# 2. 运行一键部署脚本
wget https://raw.githubusercontent.com/mrsong-ai/wuziqi/main/deploy-to-aliyun.sh
chmod +x deploy-to-aliyun.sh
./deploy-to-aliyun.sh

# 3. 脚本会自动从GitHub克隆代码并部署
```

#### 阶段二：自动化部署（后续优化）
```bash
# 配置GitHub Actions自动部署
# 每次推送代码到main分支时自动部署到阿里云
```

## 🔧 部署脚本优化

让我更新部署脚本，使其更好地支持GitHub集成：

```bash
# deploy-to-aliyun.sh 关键部分
GIT_REPO="https://github.com/mrsong-ai/wuziqi.git"
PROJECT_DIR="/var/www/pi-gomoku"

# 克隆或更新代码
if [ -d "$PROJECT_DIR" ]; then
    echo "更新现有代码..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "克隆新代码..."
    git clone $GIT_REPO $PROJECT_DIR
fi

# 自动检测并安装依赖
cd $PROJECT_DIR/houduan
npm install --production

# 重启服务
pm2 restart pi-gomoku-backend || pm2 start server.js --name pi-gomoku-backend
```

## 💡 最佳实践建议

### 1. 代码管理
- ✅ 保持GitHub仓库为主要代码源
- ✅ 使用分支管理（main分支用于生产）
- ✅ 定期备份重要数据

### 2. 部署策略
- ✅ 先使用方案一快速部署
- ✅ 稳定后升级到GitHub Actions自动部署
- ✅ 配置监控和告警

### 3. 安全考虑
- ✅ 使用SSH密钥而非密码
- ✅ 定期更新服务器系统
- ✅ 配置防火墙规则

## 📊 方案对比

| 方案 | 复杂度 | 自动化程度 | 适用场景 |
|------|--------|------------|----------|
| 直接Git | ⭐ | 手动 | 快速部署 |
| 云效集成 | ⭐⭐ | 半自动 | 中型项目 |
| GitHub Actions | ⭐⭐⭐ | 全自动 | 专业项目 |
| 容器服务 | ⭐⭐⭐⭐ | 全自动 | 大型项目 |

## 🎯 针对您项目的建议

考虑到您的五子棋项目特点，我建议：

1. **立即部署**：使用方案一（直接Git）快速部署到阿里云
2. **稳定运行**：验证功能正常后，配置域名和SSL
3. **后续优化**：添加GitHub Actions实现自动部署

这样既能快速解决当前Render的问题，又为后续扩展留下了空间。
