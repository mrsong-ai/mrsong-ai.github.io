#!/bin/bash

# Pi五子棋游戏部署脚本
# 使用方法: ./deploy.sh

echo "🚀 开始部署Pi五子棋游戏..."

# 检查Git是否已初始化
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
fi

# 添加所有文件
echo "📝 添加文件到Git..."
git add .

# 提交更改
echo "💾 提交更改..."
read -p "请输入提交信息 (默认: Update game): " commit_message
commit_message=${commit_message:-"Update game"}
git commit -m "$commit_message"

# 检查是否已添加远程仓库
if ! git remote | grep -q "origin"; then
    echo "🔗 请输入你的GitHub仓库URL:"
    read -p "GitHub仓库URL: " repo_url
    git remote add origin "$repo_url"
fi

# 推送到GitHub
echo "⬆️ 推送到GitHub..."
git push -u origin main

# 部署到GitHub Pages
echo "🌐 部署到GitHub Pages..."
if command -v npm &> /dev/null; then
    echo "📦 安装依赖..."
    npm install
    echo "🚀 部署到GitHub Pages..."
    npm run deploy
else
    echo "❌ npm未安装"
    echo "请先安装Node.js和npm"
fi

echo "✅ 部署完成！"
echo "🎮 你的游戏现在可以在GitHub Pages上访问了"
echo "📍 访问地址: https://your-username.github.io/pi-gomoku-game"
