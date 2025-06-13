# 阿里云部署指南

## 🎯 推荐配置方案

### 方案一：轻量应用服务器（推荐新手）
- **配置**: 2核2GB，40GB SSD
- **价格**: 约 ¥60-80/月
- **优势**: 
  - 简单易用，一键部署
  - 包含公网IP
  - 预装常用环境
  - 适合中小型应用

### 方案二：ECS云服务器（推荐进阶）
- **配置**: 2核4GB，40GB云盘
- **价格**: 约 ¥100-150/月
- **优势**:
  - 更灵活的配置
  - 更好的性能
  - 支持负载均衡
  - 适合大型应用

### 方案三：Serverless（最经济）
- **服务**: 函数计算 FC + 对象存储 OSS
- **价格**: 按使用量计费，约 ¥10-30/月
- **优势**:
  - 按需付费
  - 自动扩缩容
  - 无需运维
  - 适合流量不稳定的应用

## 🚀 部署步骤

### 步骤1：购买阿里云服务器

1. **登录阿里云控制台**
   - 访问 https://ecs.console.aliyun.com/
   - 选择"轻量应用服务器"或"ECS"

2. **选择配置**
   ```
   地域：选择离用户最近的（如华东1-杭州）
   镜像：Ubuntu 20.04 LTS 或 CentOS 8
   规格：2核2GB（最低配置）
   带宽：5Mbps（可后续升级）
   ```

3. **安全组设置**
   ```
   开放端口：
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)
   - 3001 (后端API，可选)
   ```

### 步骤2：服务器环境配置

1. **连接服务器**
   ```bash
   ssh root@your-server-ip
   ```

2. **安装Node.js**
   ```bash
   # 安装Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 验证安装
   node --version
   npm --version
   ```

3. **安装PM2（进程管理器）**
   ```bash
   npm install -g pm2
   ```

4. **安装Nginx（反向代理）**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

### 步骤3：部署后端代码

1. **克隆代码**
   ```bash
   cd /var/www
   git clone https://github.com/your-username/your-repo.git
   cd your-repo/houduan
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 创建 .env 文件
   nano .env
   ```
   
   ```env
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://your-domain.com
   ```

4. **启动应用**
   ```bash
   pm2 start server.js --name "pi-gomoku-backend"
   pm2 startup
   pm2 save
   ```

### 步骤4：配置Nginx

1. **创建Nginx配置**
   ```bash
   sudo nano /etc/nginx/sites-available/pi-gomoku
   ```

2. **配置内容**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 前端静态文件
       location / {
           root /var/www/your-repo/qianduan;
           index index.html;
           try_files $uri $uri/ /index.html;
       }
       
       # 后端API代理
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **启用配置**
   ```bash
   sudo ln -s /etc/nginx/sites-available/pi-gomoku /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 步骤5：配置HTTPS（可选但推荐）

1. **安装Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **获取SSL证书**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### 步骤6：配置域名

1. **购买域名**（如果没有）
   - 阿里云域名服务
   - 或其他域名注册商

2. **配置DNS解析**
   ```
   类型: A
   主机记录: @
   记录值: 你的服务器IP
   TTL: 600
   ```

## 🔧 代码修改

### 修改前端API地址

```javascript
// qianduan/index.html
const API_BASE_URL = 
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://your-domain.com/api"; // 改为你的域名
```

### 修改后端CORS配置

```javascript
// houduan/server.js
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://mrsong-ai.github.io",
    "https://your-domain.com" // 添加你的域名
  ],
  credentials: true
};
```

## 💰 成本估算

### 轻量应用服务器方案
- 服务器：¥60-80/月
- 域名：¥50-100/年
- SSL证书：免费（Let's Encrypt）
- **总计：约¥70-90/月**

### ECS方案
- 服务器：¥100-150/月
- 域名：¥50-100/年
- 带宽：包含在服务器费用中
- **总计：约¥110-160/月**

## 🎯 迁移优势

### 相比Render免费版
- ✅ **稳定性**: 24/7运行，不会休眠
- ✅ **性能**: 更好的CPU和内存
- ✅ **存储**: 持久化存储，数据不丢失
- ✅ **带宽**: 更大的流量限制
- ✅ **控制**: 完全控制服务器环境

### 相比GitHub Pages
- ✅ **动态内容**: 支持后端API
- ✅ **数据库**: 可以使用真实数据库
- ✅ **自定义域名**: 更专业的域名
- ✅ **HTTPS**: 免费SSL证书

## 📋 迁移检查清单

- [ ] 购买阿里云服务器
- [ ] 配置服务器环境
- [ ] 部署后端代码
- [ ] 配置Nginx
- [ ] 设置域名解析
- [ ] 配置HTTPS
- [ ] 修改前端API地址
- [ ] 测试所有功能
- [ ] 备份数据
- [ ] 监控服务状态

## 🆘 常见问题

### Q: 如何选择服务器配置？
A: 对于五子棋游戏，2核2GB足够支持几百个并发用户。

### Q: 需要数据库吗？
A: 目前的文件存储方案可以继续使用，后续可升级到MySQL。

### Q: 如何备份数据？
A: 定期备份 `/var/www/your-repo/houduan/data/` 目录。

### Q: 如何监控服务状态？
A: 使用 `pm2 monit` 或阿里云监控服务。
