# GitHub Secrets 配置指南

## 🔐 配置自动部署密钥

为了让GitHub Actions能够自动部署到阿里云，需要配置以下密钥：

### 步骤1：生成SSH密钥对

在您的本地电脑上运行：

```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "github-deploy@aliyun" -f ~/.ssh/aliyun_deploy

# 这会生成两个文件：
# ~/.ssh/aliyun_deploy      (私钥)
# ~/.ssh/aliyun_deploy.pub  (公钥)
```

### 步骤2：配置阿里云服务器

```bash
# 1. 连接到阿里云服务器
ssh root@your-server-ip

# 2. 将公钥添加到授权文件
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 3. 将公钥内容添加到authorized_keys
# 复制本地的 ~/.ssh/aliyun_deploy.pub 内容，然后在服务器上运行：
echo "ssh-rsa AAAAB3NzaC1yc2E... github-deploy@aliyun" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 步骤3：配置GitHub Secrets

1. **打开GitHub仓库设置**
   - 访问：https://github.com/mrsong-ai/wuziqi
   - 点击：Settings → Secrets and variables → Actions

2. **添加以下Secrets**

   | Secret名称 | 值 | 说明 |
   |------------|----|----|
   | `ALIYUN_HOST` | `123.456.789.123` | 阿里云服务器IP地址 |
   | `ALIYUN_USERNAME` | `root` | 服务器用户名 |
   | `ALIYUN_SSH_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | SSH私钥内容 |
   | `ALIYUN_PORT` | `22` | SSH端口（可选，默认22） |

3. **获取SSH私钥内容**
   ```bash
   # 在本地运行，复制输出的全部内容
   cat ~/.ssh/aliyun_deploy
   ```

### 步骤4：测试SSH连接

```bash
# 在本地测试SSH连接
ssh -i ~/.ssh/aliyun_deploy root@your-server-ip

# 如果连接成功，说明密钥配置正确
```

## 🚀 自动部署工作流程

配置完成后，自动部署流程如下：

1. **代码推送** → GitHub仓库main分支
2. **触发Actions** → 自动运行部署工作流
3. **代码检出** → 下载最新代码
4. **依赖安装** → 安装Node.js依赖
5. **连接服务器** → 通过SSH连接阿里云
6. **更新代码** → 在服务器上拉取最新代码
7. **重启服务** → 重启后端服务和Nginx
8. **健康检查** → 验证服务是否正常运行

## 🔧 手动触发部署

除了代码推送自动触发，您也可以手动触发部署：

1. 访问：https://github.com/mrsong-ai/wuziqi/actions
2. 选择："Deploy to Aliyun"工作流
3. 点击："Run workflow"按钮
4. 选择分支并点击"Run workflow"

## 📊 部署状态监控

### 查看部署日志
1. GitHub Actions页面可以查看详细的部署日志
2. 每个步骤的执行结果都会显示
3. 如果部署失败，可以查看具体错误信息

### 服务器端监控
```bash
# 连接服务器查看服务状态
ssh root@your-server-ip

# 查看PM2服务状态
pm2 status
pm2 logs pi-gomoku-backend

# 查看Nginx状态
systemctl status nginx
tail -f /var/log/nginx/error.log
```

## 🛠️ 故障排除

### 常见问题1：SSH连接失败
```bash
# 检查SSH密钥权限
chmod 600 ~/.ssh/aliyun_deploy
chmod 700 ~/.ssh

# 测试SSH连接
ssh -i ~/.ssh/aliyun_deploy -v root@your-server-ip
```

### 常见问题2：权限不足
```bash
# 在服务器上检查文件权限
ls -la /var/www/pi-gomoku
chown -R root:root /var/www/pi-gomoku
```

### 常见问题3：服务启动失败
```bash
# 检查Node.js进程
ps aux | grep node

# 手动启动服务
cd /var/www/pi-gomoku/houduan
pm2 start server.js --name pi-gomoku-backend
```

## 🔒 安全最佳实践

### 1. SSH密钥安全
- ✅ 使用专用的部署密钥
- ✅ 定期轮换SSH密钥
- ✅ 限制密钥权限（只读取必要文件）

### 2. 服务器安全
- ✅ 禁用密码登录，只允许密钥登录
- ✅ 配置防火墙规则
- ✅ 定期更新系统补丁

### 3. GitHub安全
- ✅ 使用GitHub Secrets存储敏感信息
- ✅ 限制Actions权限
- ✅ 定期审查访问日志

## 📋 配置检查清单

部署前请确认：

- [ ] 阿里云服务器已购买并配置
- [ ] SSH密钥对已生成
- [ ] 公钥已添加到服务器authorized_keys
- [ ] GitHub Secrets已正确配置
- [ ] SSH连接测试成功
- [ ] 项目代码已推送到GitHub
- [ ] GitHub Actions工作流文件已添加

## 🎯 配置完成后的优势

✅ **自动化部署**：代码推送后自动部署到阿里云
✅ **版本控制**：每次部署都有完整的版本记录
✅ **回滚能力**：可以快速回滚到之前的版本
✅ **监控告警**：部署失败会有邮件通知
✅ **团队协作**：团队成员都可以看到部署状态

配置完成后，您只需要：
1. 在本地修改代码
2. 推送到GitHub
3. 等待自动部署完成
4. 访问阿里云服务器查看更新

这样就实现了从GitHub到阿里云的完全自动化部署！
