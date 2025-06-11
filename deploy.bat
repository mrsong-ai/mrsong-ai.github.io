@echo off
chcp 65001 >nul
echo 🚀 开始部署Pi五子棋游戏...
echo.

REM 检查Git是否已初始化
if not exist ".git" (
    echo 📁 初始化Git仓库...
    git init
)

REM 添加所有文件
echo 📝 添加文件到Git...
git add .

REM 提交更改
set /p commit_message="请输入提交信息 (默认: Update game): "
if "%commit_message%"=="" set commit_message=Update game
echo 💾 提交更改...
git commit -m "%commit_message%"

REM 检查是否已添加远程仓库
git remote | findstr "origin" >nul
if errorlevel 1 (
    echo 🔗 请输入你的GitHub仓库URL:
    set /p repo_url="GitHub仓库URL: "
    git remote add origin "%repo_url%"
)

REM 推送到GitHub
echo ⬆️ 推送到GitHub...
git push -u origin main

REM 部署到GitHub Pages
echo 🌐 部署到GitHub Pages...
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm未安装
    echo 请先安装Node.js和npm
    pause
    exit /b 1
) else (
    echo 📦 安装依赖...
    npm install
    echo 🚀 部署到GitHub Pages...
    npm run deploy
)

echo.
echo ✅ 部署完成！
echo 🎮 你的游戏现在可以在GitHub Pages上访问了
echo 📍 访问地址: https://your-username.github.io/pi-gomoku-game
echo.
pause
