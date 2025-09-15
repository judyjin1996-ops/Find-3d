#!/bin/bash

echo "🚀 GitHub Pages完整设置和部署脚本"
echo "=================================="
echo ""

# 检查是否已经是Git仓库
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    echo "✅ Git仓库初始化完成"
else
    echo "✅ Git仓库已存在"
fi

# 检查是否已添加远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 添加GitHub远程仓库..."
    git remote add origin https://github.com/judyjin1996-ops/Find-3d.git
    echo "✅ 已添加远程仓库"
else
    echo "✅ 远程仓库已存在"
fi

# 显示将要提交的文件
echo ""
echo "📁 准备提交的文件:"
ls -la *.html *.md *.js 2>/dev/null | head -10
echo ""

# 添加所有文件
echo "📝 添加文件到Git..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "🚨 GitHub Pages紧急修复 - 解决空白页问题

🎯 修复目标: https://judyjin1996-ops.github.io/Find-3d/

✅ 修复内容:
- 创建简化版index.html主页面
- 添加simple.html简单测试页面  
- 添加test-page.html功能测试页面
- 添加backup.html备用主页面
- 添加diagnostic.html诊断工具
- 备份原始文件

🔧 技术改进:
- 移除复杂依赖，使用纯HTML+CSS+JS
- 内嵌所有样式和脚本
- 确保GitHub Pages兼容性
- 添加多层备用方案

修复时间: $(date)
修复工具: emergency-fix.js + setup-and-deploy.sh"

# 推送到GitHub
echo "🌐 推送到GitHub..."
git push -u origin main

echo ""
echo "🎉 部署完成！"
echo ""
echo "⏰ GitHub Pages更新时间: 3-5分钟"
echo ""
echo "🔍 测试计划:"
echo ""
echo "第1步 - 简单测试 (最重要):"
echo "https://judyjin1996-ops.github.io/Find-3d/simple.html"
echo "👆 如果这个页面显示绿色背景和'GitHub Pages 工作正常'，说明部署成功"
echo ""
echo "第2步 - 功能测试:"
echo "https://judyjin1996-ops.github.io/Find-3d/test-page.html"
echo "👆 测试更多功能和样式"
echo ""
echo "第3步 - 主页面:"
echo "https://judyjin1996-ops.github.io/Find-3d/"
echo "👆 访问修复后的主页面"
echo ""
echo "第4步 - 诊断工具 (如果有问题):"
echo "https://judyjin1996-ops.github.io/Find-3d/diagnostic.html"
echo "👆 检查详细的技术信息"
echo ""
echo "✅ 成功标志:"
echo "- 看到彩色背景 (不是白色)"
echo "- 看到'Find 3D'标题"
echo "- 看到'GitHub Pages 工作正常'或类似信息"
echo "- 所有链接可以点击"
echo ""
echo "🆘 如果仍然空白:"
echo "1. 等待10-15分钟 (GitHub Pages有时更新较慢)"
echo "2. 强制刷新: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)"
echo "3. 清除浏览器缓存"
echo "4. 尝试不同浏览器"
echo "5. 检查GitHub仓库的Actions标签查看部署状态"
echo ""
echo "📱 移动端测试:"
echo "- 在手机浏览器中也测试一下"
echo "- 确保响应式设计正常工作"
echo ""
echo "🔗 相关链接:"
echo "- GitHub仓库: https://github.com/judyjin1996-ops/Find-3d"
echo "- GitHub Pages设置: https://github.com/judyjin1996-ops/Find-3d/settings/pages"
echo "- 部署状态: https://github.com/judyjin1996-ops/Find-3d/actions"