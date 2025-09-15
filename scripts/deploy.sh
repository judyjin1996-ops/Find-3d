#!/bin/bash

# Find 3D 一键部署脚本

echo "🚀 Find 3D 一键部署脚本"
echo "=========================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到Node.js，请先安装Node.js"
    echo "   下载地址：https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到npm"
    exit 1
fi

echo "✅ Node.js和npm已安装"

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 项目构建失败"
    exit 1
fi

echo "✅ 项目构建完成"

# 检查dist目录
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：未找到dist目录"
    exit 1
fi

echo "📁 构建文件已生成在 dist/ 目录"
echo ""
echo "🎉 项目准备完成！"
echo ""
echo "📋 接下来选择部署方式："
echo "1. Vercel（推荐）："
echo "   - 访问 https://vercel.com"
echo "   - 注册账号并创建新项目"
echo "   - 上传整个项目文件夹或连接GitHub"
echo ""
echo "2. Netlify："
echo "   - 访问 https://netlify.com"
echo "   - 将 dist/ 文件夹拖拽到部署区域"
echo ""
echo "3. 本地预览："
echo "   - 运行：npm run preview"
echo "   - 在浏览器打开显示的地址"
echo ""
echo "📱 部署完成后，你将获得一个网址，可以直接分享给其他人使用！"