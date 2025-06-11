@echo off
echo 🔐 提交安全改进到Git
echo ========================

cd /d "%~dp0"
echo 当前目录: %cd%

echo.
echo 📋 添加所有更改...
git add .

echo.
echo 📋 提交更改...
git commit -m "🔐 安全改进：移除硬编码密钥，使用环境变量管理敏感信息"

echo.
echo 📋 推送到GitHub...
git push

echo.
echo ✅ 安全改进已提交并推送！
echo.
echo 📋 下一步：
echo 1. 手动编辑 .env.local 文件，填入真实的API密钥
echo 2. 如需要，创建 .well-known/validation-key.txt 文件
echo 3. 测试网站功能是否正常
echo.
pause
