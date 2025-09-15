#!/bin/bash

echo "🚨 部署GitHub Pages紧急修复..."
echo "================================"
echo ""

# 检查Git状态
if [ ! -d ".git" ]; then
    echo "❌ 错误：当前目录不是Git仓库"
    exit 1
fi

# 显示将要提交的文件
echo "📁 准备提交的文件:"
echo "- index.html (修复后的主页面)"
echo "- simple.html (简单测试页面)"
echo "- test-page.html (功能测试页面)"
echo "- backup.html (备用主页面)"
echo "- diagnostic.html (诊断工具)"
echo "- EMERGENCY_FIX_REPORT.md (修复报告)"
echo ""

# 添加所有文件
echo "📝 添加文件到Git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "🚨 紧急修复GitHub Pages空白页问题

✅ 修复内容:
- 创建简化版index.html主页面
- 添加simple.html简单测试页面
- 添加test-page.html功能测试页面
- 添加backup.html备用主页面
- 添加diagnostic.html诊断工具
- 备份原始index.html为index.html.backup

🎯 目标: 确保 https://judyjin1996-ops.github.io/Find-3d/ 正常显示

修复时间: $(date)
修复工具: emergency-fix.js"

# 推送到GitHub
echo "🌐 推送到GitHub..."
git push origin main

echo ""
echo "🎉 紧急修复部署完成！"
echo ""
echo "⏰ 等待时间: 3-5分钟让GitHub Pages更新"
echo ""
echo "🔍 测试步骤:"
echo "1. 等待3-5分钟"
echo "2. 首先访问简单测试页面:"
echo "   https://judyjin1996-ops.github.io/Find-3d/simple.html"
echo "3. 如果简单测试正常，再访问主页面:"
echo "   https://judyjin1996-ops.github.io/Find-3d/"
echo "4. 使用诊断工具检查问题:"
echo "   https://judyjin1996-ops.github.io/Find-3d/diagnostic.html"
echo ""
echo "✅ 成功标志:"
echo "- 能看到彩色背景和标题"
echo "- 显示部署成功信息"
echo "- 所有链接都能正常工作"
echo ""
echo "🆘 如果仍然空白:"
echo "- 强制刷新浏览器 (Ctrl+F5 或 Cmd+Shift+R)"
echo "- 清除浏览器缓存"
echo "- 等待10-15分钟"
echo "- 检查浏览器控制台错误信息"
echo ""
echo "📞 技术支持:"
echo "- GitHub仓库: https://github.com/judyjin1996-ops/Find-3d"
echo "- 查看Actions标签了解部署状态"