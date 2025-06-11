#!/bin/bash

echo "🔐 Pi五子棋项目安全迁移脚本"
echo "================================"

echo ""
echo "📋 第一步：提交当前的安全清理"
git add .
git commit -m "🔐 安全清理：移除所有敏感信息"

echo ""
echo "📋 第二步：创建备份分支"
git branch backup-before-cleanup

echo ""
echo "📋 第三步：重写Git历史（移除敏感信息）"
echo "⚠️  警告：这将重写整个Git历史！"
echo ""
read -p "确认要继续吗？(y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 1
fi

echo ""
echo "🔄 正在重写Git历史..."
git filter-branch --force --index-filter \
    'git rm --cached --ignore-unmatch .well-known/validation-key.txt' \
    --prune-empty --tag-name-filter cat -- --all

echo ""
echo "🔄 清理引用..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now

echo ""
echo "📋 第四步：强制推送到GitHub"
echo "⚠️  这将覆盖远程仓库的历史！"
echo ""
read -p "确认要强制推送吗？(y/N): " confirm2
if [[ ! "$confirm2" =~ ^[Yy]$ ]]; then
    echo "推送已取消，你可以稍后手动推送"
    echo "使用命令：git push --force-with-lease origin main"
    exit 0
fi

echo ""
echo "🚀 强制推送到GitHub..."
git push --force-with-lease origin main

echo ""
echo "✅ 安全迁移完成！"
echo ""
echo "📋 后续步骤："
echo "1. 去Pi Network开发者控制台重新生成API密钥"
echo "2. 更新代码中的新密钥"
echo "3. 创建.env.local文件存储敏感信息"
echo "4. 测试网站功能是否正常"
echo ""
echo "🌐 你的网站地址保持不变：https://mrsong-ai.github.io/"
echo ""
