#!/bin/bash

# 检查阿里云服务器当前状态
echo "🔍 检查阿里云服务器 47.82.3.211 的当前状态..."

SERVER_IP="47.82.3.211"

echo "=== 1. 检查服务器连通性 ==="
ping -c 3 $SERVER_IP

echo ""
echo "=== 2. 检查后端服务健康状态 ==="
curl -s http://$SERVER_IP:3001/health | jq . 2>/dev/null || curl -s http://$SERVER_IP:3001/health

echo ""
echo "=== 3. 检查API端点 ==="
curl -s http://$SERVER_IP:3001/api | jq . 2>/dev/null || curl -s http://$SERVER_IP:3001/api

echo ""
echo "=== 4. 检查端口开放状态 ==="
echo "检查端口 3001..."
nc -zv $SERVER_IP 3001 2>&1

echo "检查端口 80..."
nc -zv $SERVER_IP 80 2>&1

echo "检查端口 443..."
nc -zv $SERVER_IP 443 2>&1

echo ""
echo "=== 5. 检查HTTP服务 ==="
echo "尝试访问根路径..."
curl -I http://$SERVER_IP 2>/dev/null || echo "HTTP服务未响应"

echo ""
echo "=== 6. 检查前端GitHub Pages状态 ==="
echo "检查前端服务..."
curl -I https://mrsong-ai.github.io/ 2>/dev/null | head -5

echo ""
echo "检查完成！"
echo ""
echo "📋 总结："
echo "- 后端服务地址: http://$SERVER_IP:3001"
echo "- 前端服务地址: https://mrsong-ai.github.io/"
echo "- 如果后端显示 'Render.com'，说明需要更新部署"
echo "- 如果端口80未开放，说明需要配置Nginx"
