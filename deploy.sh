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

# 部署到Vercel
echo "🌐 部署到Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "❌ Vercel CLI未安装"
    echo "请运行: npm install -g vercel"
    echo "然后重新运行此脚本"
fi

echo "✅ 部署完成！"
echo "🎮 你的游戏现在可以在Vercel提供的URL上访问了"
