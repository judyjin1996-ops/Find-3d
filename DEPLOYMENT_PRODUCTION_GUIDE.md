# Find3D Material Search - 生产环境部署指南

## 概述

本指南详细说明了如何将 Find3D Material Search 平台部署到生产环境。系统支持多种部署方式，包括 Docker Compose、Docker Swarm 和 Kubernetes。

## 系统要求

### 最低硬件要求
- **CPU**: 4 核心
- **内存**: 8GB RAM
- **存储**: 100GB SSD
- **网络**: 1Gbps 带宽

### 推荐硬件配置
- **CPU**: 8 核心或更多
- **内存**: 16GB RAM 或更多
- **存储**: 500GB SSD 或更多
- **网络**: 10Gbps 带宽

### 软件要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.25+
- **Node.js**: 18+ (用于构建)

## 部署前准备

### 1. 环境配置

创建生产环境配置文件：

```bash
# 复制环境配置模板
cp .env.production.example .env.production

# 编辑配置文件
vim .env.production
```

### 2. 必需的环境变量

```bash
# 数据库配置
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://find3d:${POSTGRES_PASSWORD}@postgres:5432/find3d

# 安全密钥
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key

# 监控配置
SENTRY_DSN=your_sentry_dsn
SLACK_WEBHOOK_URL=your_slack_webhook

# 邮件配置
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_USER=your_email_user
EMAIL_SMTP_PASS=your_email_password

# AWS配置（用于备份）
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 3. SSL证书配置

```bash
# 创建SSL证书目录
mkdir -p ssl

# 放置SSL证书文件
cp your_certificate.crt ssl/find3d.crt
cp your_private_key.key ssl/find3d.key

# 设置正确的权限
chmod 600 ssl/find3d.key
chmod 644 ssl/find3d.crt
```

## 部署方式

### 方式一：Docker Compose 部署

适用于单机部署或小规模环境。

```bash
# 1. 克隆项目
git clone https://github.com/find3d/material-search.git
cd material-search

# 2. 构建和部署
./scripts/deploy.sh deploy -e production

# 3. 验证部署
./scripts/deploy.sh status -e production
```

### 方式二：Docker Swarm 部署

适用于多节点集群部署。

```bash
# 1. 初始化Swarm集群
docker swarm init --advertise-addr <MANAGER-IP>

# 2. 添加工作节点
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# 3. 创建Docker secrets
echo "your_postgres_password" | docker secret create postgres_password -
echo "your_jwt_secret" | docker secret create jwt_secret -
echo "your_sentry_dsn" | docker secret create sentry_dsn -

# 4. 部署Stack
DEPLOY_TARGET=swarm ./scripts/deploy.sh deploy -e production

# 5. 查看服务状态
docker stack services find3d
```

### 方式三：Kubernetes 部署

适用于大规模生产环境。

```bash
# 1. 创建命名空间
kubectl apply -f k8s/namespace.yaml

# 2. 创建Secrets
kubectl create secret generic find3d-secrets \
  --from-literal=database-url="postgresql://find3d:password@postgres:5432/find3d" \
  --from-literal=jwt-secret="your_jwt_secret" \
  --from-literal=sentry-dsn="your_sentry_dsn" \
  -n find3d

# 3. 应用配置
kubectl apply -f k8s/

# 4. 查看部署状态
kubectl get pods -n find3d
kubectl get services -n find3d
```

## 监控和日志

### 1. 启用监控服务

```bash
# 启动监控Stack
docker-compose --profile monitoring up -d

# 访问监控界面
# Grafana: http://your-domain:3001
# Prometheus: http://your-domain:9090
```

### 2. 日志收集

```bash
# 启动日志收集
docker-compose --profile logging up -d

# 查看应用日志
./scripts/deploy.sh logs -e production
```

### 3. 健康检查

系统提供多个健康检查端点：

- **应用健康**: `GET /health`
- **API健康**: `GET /api/health`
- **详细状态**: `GET /api/status`

## 备份和恢复

### 1. 自动备份配置

系统支持自动备份到AWS S3：

```bash
# 配置备份环境变量
BACKUP_SCHEDULE="0 2 * * *"  # 每天凌晨2点
BACKUP_S3_BUCKET=find3d-backups
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 2. 手动备份

```bash
# 备份数据库
docker exec find3d_postgres pg_dump -U find3d find3d > backup_$(date +%Y%m%d).sql

# 备份Redis数据
docker exec find3d_redis redis-cli BGSAVE
docker cp find3d_redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb

# 备份应用配置
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env.production ssl/
```

### 3. 数据恢复

```bash
# 恢复数据库
docker exec -i find3d_postgres psql -U find3d find3d < backup_20241201.sql

# 恢复Redis数据
docker cp redis_backup_20241201.rdb find3d_redis:/data/dump.rdb
docker restart find3d_redis
```

## 安全配置

### 1. 防火墙设置

```bash
# 允许HTTP和HTTPS流量
ufw allow 80/tcp
ufw allow 443/tcp

# 允许SSH（如果需要）
ufw allow 22/tcp

# 启用防火墙
ufw enable
```

### 2. SSL/TLS配置

确保使用有效的SSL证书：

```nginx
# Nginx SSL配置示例
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
```

### 3. 安全头配置

系统自动配置以下安全头：

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS)
- `Content-Security-Policy`

## 性能优化

### 1. 缓存配置

```bash
# Redis集群配置
REDIS_CLUSTER_ENABLED=true
REDIS_MAX_MEMORY=2gb
REDIS_MAX_MEMORY_POLICY=allkeys-lru
```

### 2. 数据库优化

```sql
-- PostgreSQL优化配置
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

### 3. 应用优化

```bash
# 启用性能优化功能
ENABLE_GZIP=true
ENABLE_BROTLI=true
ENABLE_IMAGE_OPTIMIZATION=true
ENABLE_SERVICE_WORKER=true
```

## 故障排除

### 1. 常见问题

**问题**: 应用无法启动
```bash
# 检查容器状态
docker-compose ps

# 查看容器日志
docker-compose logs app

# 检查配置文件
docker-compose config
```

**问题**: 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready

# 测试连接
docker-compose exec app curl -f http://localhost:8080/health
```

**问题**: 内存不足
```bash
# 检查内存使用
docker stats

# 调整资源限制
# 编辑 docker-compose.yml 中的 resources 配置
```

### 2. 日志分析

```bash
# 查看应用日志
docker-compose logs -f app

# 查看Nginx访问日志
docker-compose exec app tail -f /var/log/nginx/access.log

# 查看错误日志
docker-compose exec app tail -f /var/log/nginx/error.log
```

### 3. 性能监控

```bash
# 查看系统资源使用
htop
iotop
nethogs

# 查看Docker资源使用
docker stats

# 查看应用性能指标
curl http://localhost:8080/metrics
```

## 维护和更新

### 1. 应用更新

```bash
# 拉取最新代码
git pull origin main

# 构建新版本
./scripts/deploy.sh build -v 1.1.0

# 滚动更新
./scripts/deploy.sh deploy -e production -v 1.1.0
```

### 2. 回滚操作

```bash
# 回滚到上一个版本
./scripts/deploy.sh rollback -e production

# 回滚到指定版本
APP_VERSION=1.0.0 ./scripts/deploy.sh deploy -e production
```

### 3. 定期维护

```bash
# 清理未使用的Docker资源
./scripts/deploy.sh cleanup

# 更新系统包
apt update && apt upgrade -y

# 重启服务（如果需要）
docker-compose restart
```

## 扩展和高可用

### 1. 水平扩展

```bash
# 增加应用实例
docker-compose up -d --scale app=5

# Kubernetes扩展
kubectl scale deployment find3d-app --replicas=5 -n find3d
```

### 2. 负载均衡

```bash
# 启用Nginx负载均衡
docker-compose --profile production up -d nginx-lb
```

### 3. 数据库高可用

```bash
# PostgreSQL主从复制配置
# 参考官方文档配置流复制
```

## 联系支持

如果在部署过程中遇到问题，请联系技术支持：

- **邮箱**: support@find3d.com
- **文档**: https://docs.find3d.com
- **GitHub Issues**: https://github.com/find3d/material-search/issues

## 附录

### A. 端口列表

| 服务 | 端口 | 描述 |
|------|------|------|
| 前端应用 | 8080 | 主应用端口 |
| API服务 | 3000 | 后端API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存服务 |
| Prometheus | 9090 | 监控指标 |
| Grafana | 3001 | 监控面板 |

### B. 环境变量完整列表

参考 `.env.production` 文件中的完整配置列表。

### C. 安全检查清单

- [ ] SSL证书已正确配置
- [ ] 数据库密码已设置为强密码
- [ ] 防火墙规则已配置
- [ ] 备份策略已实施
- [ ] 监控告警已配置
- [ ] 日志收集已启用
- [ ] 安全头已配置
- [ ] 访问控制已设置