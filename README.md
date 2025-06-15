# 🎮 五子棋游戏项目

一个完整的五子棋游戏项目，支持Pi Network集成、用户认证、游戏统计和排行榜功能。

## 📁 项目结构

```
wuziqi/
├── qianduan/                         # 前端文件夹
│   ├── index.html                    # 主游戏页面
│   ├── admin.html                    # 管理员页面
│   ├── package.json                  # 前端配置
│   ├── pi-app.json                   # Pi Network应用配置
│   ├── README.md                     # 前端说明
│   └── public/                       # 静态资源
│       ├── sounds/                   # 游戏音效
│       ├── privacy-policy.html       # 隐私政策
│       └── terms-of-service.html     # 服务条款
├── houduan/                          # 后端文件夹
│   ├── server.js                     # 主服务器文件
│   ├── package.json                  # 后端配置和依赖
│   ├── lib/
│   │   └── database.js               # 数据库操作
│   ├── routes/                       # API路由
│   │   ├── auth.js                   # 认证接口
│   │   ├── users.js                  # 用户接口
│   │   ├── games.js                  # 游戏接口
│   │   ├── leaderboard.js            # 排行榜接口
│   │   ├── payment.js                # 支付接口
│   │   └── admin.js                  # 管理员接口
│   ├── deploy.sh                     # 自动部署脚本
│   ├── ecosystem.config.js           # PM2配置
│   ├── nginx.conf                    # Nginx配置
│   ├── Dockerfile                    # Docker配置
│   ├── docker-compose.yml            # Docker Compose配置
│   ├── .env.example                  # 环境变量模板
│   ├── .gitignore                    # Git忽略文件
│   └── README.md                     # 后端API文档
├── DEPLOYMENT_GUIDE.md               # 完整部署指南
├── PROJECT_SUMMARY.md                # 项目详细总结
└── README.md                         # 项目说明（本文件）
```

## 🎮 游戏特性

- **人机对战**: 与AI进行五子棋对战
- **Pi Network集成**: 支持Pi用户登录和身份验证
- **用户统计**: 游戏胜率、排名等统计数据
- **排行榜系统**: 实时排行榜和用户排名
- **多语言支持**: 中文/英文界面
- **响应式设计**: 适配移动端和桌面端
- **音效系统**: 游戏音效和背景音乐
- **管理员功能**: 用户管理和数据统计

## 🚀 快速开始

### 前端运行
```bash
# 直接打开前端文件
cd qianduan
# 使用浏览器打开 index.html
```

### 后端部署
```bash
# 进入后端目录
cd houduan

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动服务器
npm start

# 或使用部署脚本
chmod +x deploy.sh
./deploy.sh production
```

### 完整部署
详细的部署指南请参考 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🎯 游戏玩法

1. **登录**: 使用Pi Network账户登录或本地游客模式
2. **开始游戏**: 点击"开始游戏"按钮
3. **下棋**: 点击棋盘上的空位下棋
4. **获胜条件**: 率先连成5子者获胜
5. **查看排行榜**: 查看实时排行榜和个人统计

## 🔧 技术栈

### 前端
- HTML5/CSS3/JavaScript
- Pi Network SDK
- Canvas API
- Web Audio API
- LocalStorage

### 后端
- Node.js + Express
- 文件系统数据库
- PM2 进程管理
- Nginx 反向代理
- 排行榜数据基于本地存储生成
- 无需后端服务器支持

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **存储**: localStorage
- **集成**: Pi Network SDK
- **部署**: 静态网站托管

## 📝 更新日志

### v2.0.0 (当前版本)
- 移除后端依赖，改为纯前端架构
- 实现本地排行榜系统
- 修复重复用户ID问题
- 优化用户体验

## 📄 许可证

本项目采用开源许可证，详见 `qianduan/开源许可证.txt`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！
