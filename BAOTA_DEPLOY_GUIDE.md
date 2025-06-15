# 🎛️ 宝塔面板部署五子棋后端指南

## 📋 概述
使用宝塔面板图形化界面部署Pi Network五子棋后端，无需复杂命令行操作。

## 🚀 部署步骤

### 第一步：安装宝塔面板

#### 1.1 购买阿里云服务器
- 选择：轻量应用服务器
- 配置：1核2G内存，40G硬盘
- 系统：CentOS 7.x 或 Ubuntu 20.04

#### 1.2 连接服务器
1. 登录阿里云控制台
2. 找到你的服务器实例
3. 点击"远程连接" → "Workbench远程连接"
4. 输入服务器密码登录

#### 1.3 安装宝塔面板
在终端中复制粘贴以下命令：
```bash
# CentOS系统
wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec

# Ubuntu系统
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

安装完成后记录：
- 面板地址：http://你的服务器IP:8888
- 用户名：随机生成
- 密码：随机生成

### 第二步：配置宝塔面板

#### 2.1 登录宝塔面板
1. 在浏览器打开面板地址
2. 输入用户名和密码登录
3. 首次登录会要求安装软件

#### 2.2 安装必需软件
在"软件商店"中安装：
- ✅ **Nginx** 1.20+（选择编译安装）
- ✅ **Node.js版本管理器**
- ✅ **PM2管理器**
- ✅ **Git**（在系统工具中）

#### 2.3 配置Node.js
1. 点击"软件商店" → "已安装"
2. 找到"Node.js版本管理器"，点击"设置"
3. 安装Node.js 18.x版本
4. 设置为默认版本

### 第三步：部署项目

#### 3.1 创建网站
1. 点击"网站" → "添加站点"
2. 填写信息：
   - 域名：你的服务器IP或域名
   - 根目录：`/www/wwwroot/pi-gomoku`
   - PHP版本：纯静态
3. 点击"提交"

#### 3.2 下载项目代码
1. 点击"文件"进入文件管理
2. 进入 `/www/wwwroot/pi-gomoku` 目录
3. 点击"终端"按钮
4. 执行命令：
```bash
# 删除默认文件
rm -rf *

# 克隆项目
git clone https://github.com/mrsong-ai/pi-gomoku-backend.git .

# 进入后端目录
cd houduan

# 安装依赖
npm install --production
```

#### 3.3 配置环境变量
1. 在文件管理中进入 `houduan` 目录
2. 复制 `.env.production` 为 `.env`
3. 编辑 `.env` 文件，根据需要修改配置

#### 3.4 配置PM2
1. 点击"软件商店" → "已安装"
2. 找到"PM2管理器"，点击"设置"
3. 点击"添加项目"
4. 填写信息：
   - 项目名称：`pi-gomoku-backend`
   - 运行目录：`/www/wwwroot/pi-gomoku/houduan`
   - 启动文件：`server.js`
   - 运行模式：`cluster`
   - 实例数量：`1`
5. 点击"提交"并启动

### 第四步：配置Nginx

#### 4.1 修改网站配置
1. 点击"网站"
2. 找到你的网站，点击"设置"
3. 点击"配置文件"
4. 替换为以下配置：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # 前端代理到GitHub Pages
    location / {
        proxy_pass https://mrsong-ai.github.io/;
        proxy_set_header Host mrsong-ai.github.io;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 后端API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS配置
        add_header Access-Control-Allow-Origin "https://mrsong-ai.github.io" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://mrsong-ai.github.io";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }
}
```

5. 点击"保存"

### 第五步：测试部署

#### 5.1 检查服务状态
1. 在PM2管理器中查看项目状态
2. 确保状态为"online"
3. 查看日志确认无错误

#### 5.2 测试API
在浏览器中访问：
- `http://你的服务器IP/health` - 健康检查
- `http://你的服务器IP/api/games` - 游戏API
- `http://你的服务器IP/` - 前端页面

## 🔧 日常管理

### 更新代码
1. 进入文件管理 → `pi-gomoku/houduan`
2. 点击"终端"
3. 执行：
```bash
git pull origin main
npm install --production
```
4. 在PM2管理器中重启项目

### 查看日志
1. 点击"日志" → "网站日志"
2. 或在PM2管理器中查看应用日志

### 监控状态
1. 在"监控"中查看服务器状态
2. 在PM2管理器中监控应用状态

## 🛡️ 安全设置

### 防火墙配置
1. 点击"安全"
2. 开放端口：80, 443
3. 关闭不必要的端口

### SSL证书（可选）
1. 点击网站"设置" → "SSL"
2. 申请Let's Encrypt免费证书
3. 强制HTTPS

## 🆘 故障排除

### 常见问题
1. **服务启动失败**：检查PM2日志
2. **API无法访问**：检查Nginx配置
3. **前端无法加载**：检查代理配置

### 有用的功能
- **文件管理**：可视化编辑文件
- **终端**：必要时使用命令行
- **监控**：实时查看系统状态
- **计划任务**：自动化维护

## 🎉 完成

恭喜！你已经成功使用宝塔面板部署了五子棋后端！

访问地址：
- 前端：`http://你的服务器IP/`
- API：`http://你的服务器IP/api/`
- 健康检查：`http://你的服务器IP/health`
