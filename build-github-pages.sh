#!/bin/bash

# GitHub Pages构建脚本
echo "🚀 开始为GitHub Pages构建项目..."

# 设置环境变量
export NODE_ENV=production

# 清理旧的构建文件
rm -rf dist

# 构建项目
npm run build

# 复制dist内容到根目录（GitHub Pages需要）
cp -r dist/* .

# 确保有正确的入口文件
if [ ! -f "index.html" ]; then
    echo "❌ 构建失败：缺少index.html文件"
    exit 1
fi

echo "✅ GitHub Pages构建完成！"
echo "📋 下一步："
echo "1. 提交所有更改到GitHub"
echo "2. 在GitHub仓库设置中启用Pages"
echo "3. 选择部署源为 'main' 分支的根目录"
echo "4. 等待几分钟后访问: https://judyjin1996-ops.github.io/Find-3d/"
