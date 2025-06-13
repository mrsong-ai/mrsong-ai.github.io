#!/bin/bash

# 修复Nginx 403错误的快速脚本
# 使用方法: chmod +x fix-nginx-403.sh && ./fix-nginx-403.sh

set -e

echo "🔧 修复Nginx 403错误..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用root用户运行此脚本${NC}"
    echo "使用命令: sudo ./fix-nginx-403.sh"
    exit 1
fi

# 步骤1：创建nginx目录
echo -e "${YELLOW}1. 创建nginx目录...${NC}"
mkdir -p /var/www/html
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 步骤2：创建临时测试页面
echo -e "${YELLOW}2. 创建测试页面...${NC}"
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pi五子棋 - 服务器测试</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .status {
            background: rgba(0,255,0,0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .info {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        .next-steps {
            background: rgba(255,165,0,0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Pi五子棋服务器</h1>
        
        <div class="status">
            <h2>✅ 服务器状态正常</h2>
            <p>Nginx配置成功，403错误已修复！</p>
        </div>

        <div class="info">
            <h3>📋 服务器信息</h3>
            <p><strong>服务器时间:</strong> <span id="serverTime"></span></p>
            <p><strong>访问地址:</strong> http://172.17.32.172</p>
            <p><strong>状态:</strong> 运行中</p>
        </div>

        <div class="next-steps">
            <h3>🚀 下一步操作</h3>
            <ol>
                <li>上传前端文件到 /var/www/html/</li>
                <li>配置后端API服务</li>
                <li>测试完整功能</li>
            </ol>
        </div>

        <div class="info">
            <h3>🔧 管理命令</h3>
            <p><code>sudo systemctl status nginx</code> - 查看Nginx状态</p>
            <p><code>sudo systemctl restart nginx</code> - 重启Nginx</p>
            <p><code>sudo tail -f /var/log/nginx/error.log</code> - 查看错误日志</p>
        </div>
    </div>

    <script>
        // 显示服务器时间
        document.getElementById('serverTime').textContent = new Date().toLocaleString('zh-CN');
        
        // 每秒更新时间
        setInterval(() => {
            document.getElementById('serverTime').textContent = new Date().toLocaleString('zh-CN');
        }, 1000);
    </script>
</body>
</html>
EOF

# 步骤3：设置权限
echo -e "${YELLOW}3. 设置文件权限...${NC}"
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 步骤4：测试nginx配置
echo -e "${YELLOW}4. 测试Nginx配置...${NC}"
nginx -t

# 步骤5：重启nginx
echo -e "${YELLOW}5. 重启Nginx服务...${NC}"
systemctl restart nginx

# 步骤6：检查服务状态
echo -e "${YELLOW}6. 检查服务状态...${NC}"
systemctl status nginx --no-pager

# 步骤7：测试访问
echo -e "${YELLOW}7. 测试网站访问...${NC}"
sleep 2
curl -I http://localhost

echo ""
echo -e "${GREEN}🎉 修复完成！${NC}"
echo -e "${GREEN}现在可以通过 http://172.17.32.172 访问测试页面${NC}"
echo ""
echo -e "${YELLOW}接下来的步骤：${NC}"
echo "1. 测试访问: curl http://172.17.32.172"
echo "2. 上传前端文件替换测试页面"
echo "3. 配置后端服务"
echo ""
