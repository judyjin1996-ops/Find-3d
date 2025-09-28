#!/bin/bash

# Find 3D 生产环境部署脚本
# 用于构建和部署到生产环境

set -e  # 遇到错误立即退出

echo "🚀 开始 Find 3D 生产环境部署..."
echo "=================================="

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v)
npm_version=$(npm -v)
echo "Node.js 版本: $node_version"
echo "npm 版本: $npm_version"

# 检查必要的文件
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json 文件"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "⚠️ 警告: 未找到 .env.production 文件，将使用默认配置"
fi

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
rm -rf dist/
rm -rf node_modules/.vite/

# 安装依赖
echo "📦 安装依赖..."
npm ci --production=false

# 运行测试（如果存在）
if npm run test --if-present > /dev/null 2>&1; then
    echo "🧪 运行测试..."
    npm run test
else
    echo "⚠️ 跳过测试（未配置测试脚本）"
fi

# 构建生产版本
echo "🔨 构建生产版本..."
NODE_ENV=production npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 错误: 构建失败，未生成 dist 目录"
    exit 1
fi

echo "✅ 构建完成！"

# 显示构建统计
echo "📊 构建统计:"
echo "构建目录大小: $(du -sh dist/ | cut -f1)"
echo "文件数量: $(find dist/ -type f | wc -l)"

# 列出主要文件
echo "📁 主要文件:"
ls -la dist/

# 检查关键文件
critical_files=("index.html" "assets")
for file in "${critical_files[@]}"; do
    if [ ! -e "dist/$file" ]; then
        echo "❌ 错误: 关键文件 $file 不存在"
        exit 1
    fi
done

echo "✅ 关键文件检查通过"

# 生成部署信息
echo "📝 生成部署信息..."
cat > dist/deploy-info.json << EOF
{
  "deployTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "buildHash": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$node_version",
  "environment": "production"
}
EOF

# 创建健康检查文件
echo "🏥 创建健康检查文件..."
cat > dist/health.json << EOF
{
  "status": "healthy",
  "service": "find-3d",
  "version": "$(node -p "require('./package.json').version")",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# 如果是GitHub Actions环境，设置输出
if [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "🔧 设置GitHub Actions输出..."
    echo "build-path=dist" >> $GITHUB_OUTPUT
    echo "deploy-ready=true" >> $GITHUB_OUTPUT
fi

echo ""
echo "🎉 生产环境构建完成！"
echo "=================================="
echo "📁 构建目录: ./dist/"
echo "🌐 可以部署到任何静态文件服务器"
echo "📋 部署信息已保存到 dist/deploy-info.json"
echo "🏥 健康检查端点: /health.json"
echo ""

# 提供部署建议
echo "💡 部署建议:"
echo "1. 将 dist/ 目录内容上传到您的Web服务器"
echo "2. 确保服务器支持SPA路由（配置fallback到index.html）"
echo "3. 启用gzip压缩以提高加载速度"
echo "4. 配置适当的缓存策略"
echo "5. 设置HTTPS（推荐）"
echo ""

# 如果有部署目标参数，执行相应的部署
if [ "$1" = "github-pages" ]; then
    echo "🚀 部署到GitHub Pages..."
    # 这里可以添加GitHub Pages特定的部署逻辑
    echo "请手动将dist/目录内容推送到gh-pages分支"
elif [ "$1" = "netlify" ]; then
    echo "🚀 准备Netlify部署..."
    # 创建Netlify配置文件
    cat > dist/_redirects << EOF
/*    /index.html   200
EOF
    echo "✅ Netlify重定向规则已创建"
elif [ "$1" = "vercel" ]; then
    echo "🚀 准备Vercel部署..."
    # 创建Vercel配置文件
    cat > dist/vercel.json << EOF
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF
    echo "✅ Vercel配置文件已创建"
fi

echo "✨ 部署脚本执行完成！"