# 🚀 后端迁移指南

## 📋 迁移计划

### 当前状态
- ✅ 前端文件已清理完成
- ✅ 重复文件已删除
- ✅ 文档已精简
- ⏳ 后端文件待迁移到新仓库

### 后端文件清单
需要迁移到新仓库 `wuziqi-backend` 的文件：

```
houduan/
├── server.js                    # 主服务器文件
├── package.json                 # 依赖配置
├── package-lock.json            # 锁定版本
├── ecosystem.config.js          # PM2配置
├── routes/                      # API路由
├── lib/                         # 工具库
├── data/                        # 数据目录
├── logs/                        # 日志目录
├── deploy.sh                    # 部署脚本
├── nginx.conf                   # Nginx配置
├── Dockerfile                   # Docker配置
├── docker-compose.yml           # Docker Compose
└── 其他配置文件
```

## 🎯 下一步操作

### 1. 创建后端私有仓库
```bash
# 在GitHub创建新仓库
仓库名：wuziqi-backend
可见性：Private
描述：五子棋游戏后端API服务
```

### 2. 迁移后端文件
```bash
# 复制houduan目录到新仓库
cp -r houduan/* /path/to/wuziqi-backend/

# 在新仓库中初始化Git
cd /path/to/wuziqi-backend
git init
git add .
git commit -m "初始化后端代码"
git remote add origin https://github.com/mrsong-ai/wuziqi-backend.git
git push -u origin main
```

### 3. 设置自动部署
```bash
# 在服务器克隆后端仓库
git clone https://github.com/mrsong-ai/wuziqi-backend.git
cd wuziqi-backend
npm install
pm2 start ecosystem.config.js
```

### 4. 清理当前仓库
```bash
# 删除houduan目录
rm -rf houduan/

# 提交清理后的前端仓库
git add .
git commit -m "清理项目结构，移除后端文件"
git push origin main
```

## 📊 迁移后的架构

### 前端仓库：mrsong-ai.github.io
```
├── index.html                   # 主页面
├── styles.css                   # 主样式
├── styles_fixed.css             # 修复样式
├── public/                      # 静态资源
├── README.md                    # 项目说明
├── LICENSE                      # 许可证
└── .gitignore                   # Git忽略
```

### 后端仓库：wuziqi-backend（私有）
```
├── server.js                    # 主服务器
├── package.json                 # 依赖配置
├── ecosystem.config.js          # PM2配置
├── routes/                      # API路由
├── lib/                         # 工具库
├── deploy/                      # 部署脚本
├── .env.example                 # 环境变量模板
├── .gitignore                   # Git忽略
└── README.md                    # API文档
```

## ✅ 迁移完成检查清单

- [ ] 创建后端私有仓库
- [ ] 迁移后端文件
- [ ] 配置自动部署
- [ ] 测试后端API
- [ ] 更新前端API地址
- [ ] 清理当前仓库
- [ ] 测试前端功能
- [ ] 更新文档

## 🔗 相关链接

- 前端仓库：https://github.com/mrsong-ai/mrsong-ai.github.io
- 后端仓库：https://github.com/mrsong-ai/wuziqi-backend（待创建）
- 在线游戏：https://mrsong-ai.github.io/
