#!/bin/bash

echo "🚀 部署GitHub Pages修复版本..."
echo "目标网址: https://judyjin1996-ops.github.io/Find-3d/"
echo ""

# 检查Git状态
if [ ! -d ".git" ]; then
    echo "❌ 错误：当前目录不是Git仓库"
    echo "请先运行: git init"
    exit 1
fi

# 添加所有更改
echo "📝 添加文件更改..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "🔧 修复GitHub Pages空白页问题

- 替换为完整的静态HTML版本
- 修复资源路径问题
- 添加GitHub链接
- 优化移动端显示
- 确保所有功能正常工作

修复时间: $(date)"

# 推送到GitHub
echo "🌐 推送到GitHub..."
git push origin main

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 等待3-5分钟让GitHub Pages更新"
echo "2. 访问你的网站: https://judyjin1996-ops.github.io/Find-3d/"
echo "3. 如果仍然空白，请强制刷新页面 (Ctrl+F5 或 Cmd+Shift+R)"
echo ""
echo "✅ 修复后你应该看到："
echo "   - 漂亮的渐变背景"
echo "   - Find 3D 标题和搜索功能"
echo "   - 功能特色卡片"
echo "   - 完整的搜索演示"
echo ""
echo "🔗 GitHub仓库: https://github.com/judyjin1996-ops/Find-3d"