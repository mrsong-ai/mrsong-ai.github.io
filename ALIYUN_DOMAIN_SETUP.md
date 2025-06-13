# 阿里云域名配置指南

## 🌐 域名方案对比

### 方案一：直接使用 IP（免费，但有限制）

```
后端API: http://123.456.789.123:3001
前端访问: http://123.456.789.123
```

**优势**：

- ✅ 完全免费
- ✅ 立即可用
- ✅ 无需额外配置

**劣势**：

- ❌ 没有 HTTPS（Pi Network 可能要求）
- ❌ IP 地址难记
- ❌ 不够专业

### 方案二：购买域名（推荐）

```
后端API: https://your-domain.com/api
前端访问: https://your-domain.com
```

**优势**：

- ✅ 专业的域名
- ✅ 免费 HTTPS 证书
- ✅ 更好的 SEO
- ✅ 用户信任度高

**成本**：

- 域名：¥50-100/年
- SSL 证书：免费（Let's Encrypt）

## 💰 域名购买选项

### 阿里云域名（推荐）

| 域名后缀 | 首年价格 | 续费价格 | 适用场景     |
| -------- | -------- | -------- | ------------ |
| .com     | ¥55/年   | ¥78/年   | 最通用，推荐 |
| .cn      | ¥29/年   | ¥35/年   | 中国用户     |
| .top     | ¥9/年    | ¥32/年   | 便宜选择     |
| .xyz     | ¥8/年    | ¥68/年   | 个性化       |
| .online  | ¥6/年    | ¥88/年   | 在线服务     |

### 其他域名注册商

- **腾讯云**：价格类似阿里云
- **GoDaddy**：国际知名，稍贵
- **Namecheap**：便宜，但需要海外支付

## 🚀 域名配置步骤

### 步骤 1：购买域名

1. **访问阿里云域名服务**

   - 网址：https://wanwang.aliyun.com/
   - 搜索想要的域名
   - 选择后缀并购买

2. **推荐域名示例**
   ```
   pi-gomoku.com
   wuziqi-game.com
   gomoku-pi.top
   your-name-gomoku.cn
   ```

### 步骤 2：配置 DNS 解析

1. **进入域名控制台**

   - 阿里云控制台 → 域名 → 解析设置

2. **添加 A 记录**

   ```
   记录类型: A
   主机记录: @
   解析线路: 默认
   记录值: 你的阿里云服务器IP
   TTL: 600
   ```

3. **添加 www 记录（可选）**
   ```
   记录类型: A
   主机记录: www
   解析线路: 默认
   记录值: 你的阿里云服务器IP
   TTL: 600
   ```

### 步骤 3：配置 SSL 证书

```bash
# 在阿里云服务器上运行
sudo apt install certbot python3-certbot-nginx

# 获取免费SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加这行：
0 12 * * * /usr/bin/certbot renew --quiet
```

### 步骤 4：更新 Nginx 配置

```nginx
# /etc/nginx/sites-available/pi-gomoku
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端静态文件
    location / {
        root /var/www/pi-gomoku/qianduan;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🆓 免费域名替代方案

### 方案 A：免费子域名服务

1. **Freenom**（免费.tk/.ml/.ga 域名）

   - 网址：https://www.freenom.com/
   - 免费 1 年，可续期
   - 适合测试使用

2. **No-IP**（免费动态域名）
   - 网址：https://www.noip.com/
   - 免费子域名：your-app.ddns.net
   - 需要每 30 天确认一次

### 方案 B：使用阿里云提供的临时域名

阿里云轻量应用服务器提供临时域名：

```
格式：123456.cn-hangzhou.alicloudapi.com
有效期：通常6个月
```

**获取方式**：

1. 阿里云控制台 → 轻量应用服务器
2. 实例详情 → 网络信息
3. 查看"临时域名"

## 🔧 代码配置更新

### 更新前端 API 地址

```javascript
// qianduan/index.html
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  if (hostname === "localhost") {
    return "http://localhost:3001";
  } else if (hostname.includes("github.io")) {
    return "http://47.82.3.211:3001";
  } else {
    // 阿里云部署 - 使用相同域名
    return `${protocol}//${hostname}/api`;
  }
})();
```

### 更新后端 CORS 配置

```javascript
// houduan/server.js
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://mrsong-ai.github.io",
    "https://your-domain.com", // 添加你的域名
    "https://www.your-domain.com", // 添加www版本
    /\.your-domain\.com$/, // 支持子域名
  ],
  credentials: true,
};
```

## 💡 最佳实践建议

### 对于您的项目，我建议：

#### 阶段一：快速部署（立即）

```bash
# 使用IP地址先部署测试
API_BASE_URL = "http://your-server-ip:3001"
```

#### 阶段二：购买域名（1-2 天内）

```bash
# 购买便宜域名，如 .top 或 .cn
# 配置DNS解析和SSL证书
API_BASE_URL = "https://your-domain.com/api"
```

#### 阶段三：优化配置（后续）

```bash
# 配置CDN加速
# 添加监控告警
# 优化SEO设置
```

## 📊 成本对比

| 方案      | 域名成本 | SSL 证书 | 总成本/年 |
| --------- | -------- | -------- | --------- |
| 直接 IP   | ¥0       | 无       | ¥0        |
| .top 域名 | ¥9       | 免费     | ¥9        |
| .cn 域名  | ¥29      | 免费     | ¥29       |
| .com 域名 | ¥55      | 免费     | ¥55       |

## 🎯 推荐方案

考虑到成本和效果，我推荐：

1. **立即部署**：先用 IP 地址快速部署测试
2. **购买域名**：选择 .top 或 .cn 域名（便宜）
3. **配置 HTTPS**：使用免费的 Let's Encrypt 证书
4. **后续优化**：根据用户反馈决定是否升级

这样既能快速解决问题，又能保持较低的成本！
