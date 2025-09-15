#!/bin/bash

echo "🚀 升级到Find 3D生产版本"
echo "=========================="
echo ""

# 检查文件是否存在
if [ ! -f "production.html" ]; then
    echo "❌ 错误：production.html 文件不存在"
    echo "请确保已经创建了生产版本文件"
    exit 1
fi

# 备份当前的index.html
if [ -f "index.html" ]; then
    echo "📁 备份当前主页面..."
    cp index.html index.html.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 已备份为 index.html.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 替换主页面
echo "🔄 升级主页面..."
cp production.html index.html
echo "✅ 已将production.html设置为主页面"

# 如果是Git仓库，提交更改
if [ -d ".git" ]; then
    echo ""
    echo "📝 提交更改到Git..."
    git add .
    git commit -m "🚀 升级到生产版本 - 真实可用的3D素材搜索功能

✨ 新功能:
- 真实搜索URL，直达搜索结果页面
- 支持多网站选择（魔顿网、CG资源网、书生CG、3D溜溜网）
- 增强的用户界面和搜索体验
- 智能结果展示和操作选项

🎯 搜索功能:
- 魔顿网: http://www.modown.cn/search.php?searchword=关键词
- CG资源网: https://www.cgown.com/search?keyword=关键词
- 书生CG资源站: https://c4dsky.com/?s=关键词
- 3D溜溜网: https://www.3dxy.com/search/?keyword=关键词

升级时间: $(date)"

    echo "🌐 推送到GitHub..."
    git push origin main
    
    echo "✅ 已推送到GitHub"
else
    echo "⚠️ 不是Git仓库，跳过提交步骤"
fi

echo ""
echo "🎉 升级完成！"
echo ""
echo "📋 升级内容:"
echo "- ✅ 真实可用的搜索功能"
echo "- ✅ 多网站聚合搜索"
echo "- ✅ 直达搜索结果页面"
echo "- ✅ 现代化用户界面"
echo "- ✅ 智能结果展示"
echo ""
echo "🔗 访问链接:"
echo "- 主页面: https://judyjin1996-ops.github.io/Find-3d/"
echo "- 生产版本: https://judyjin1996-ops.github.io/Find-3d/production.html"
echo "- 测试页面: https://judyjin1996-ops.github.io/Find-3d/test-page.html"
echo ""
echo "⏰ 生效时间: 2-5分钟后"
echo ""
echo "🎯 使用方法:"
echo "1. 输入搜索关键词（如'日本建筑'）"
echo "2. 选择要搜索的网站"
echo "3. 点击搜索按钮"
echo "4. 点击'查看搜索结果'直达对应网站的搜索页面"
echo ""
echo "📖 详细说明请查看: 使用指南.md"
echo ""
echo "🎉 现在你拥有了一个真正可用的3D素材搜索平台！"