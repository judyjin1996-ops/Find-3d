#!/bin/bash

# Find 3D 项目发布脚本
# 用于创建新版本并发布到GitHub

set -e  # 遇到错误立即退出

echo "🚀 Find 3D 项目发布脚本"
echo "========================"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查Git状态
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 错误: 工作目录不干净，请先提交所有更改"
    git status --short
    exit 1
fi

# 检查当前分支
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    echo "⚠️ 警告: 当前不在主分支 ($current_branch)"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消发布"
        exit 1
    fi
fi

# 获取当前版本
current_version=$(node -p "require('./package.json').version")
echo "📋 当前版本: $current_version"

# 询问新版本类型
echo ""
echo "请选择版本类型:"
echo "1) patch (修复版本: $current_version -> $(npm version patch --dry-run | cut -d'v' -f2))"
echo "2) minor (功能版本: $current_version -> $(npm version minor --dry-run | cut -d'v' -f2))"
echo "3) major (重大版本: $current_version -> $(npm version major --dry-run | cut -d'v' -f2))"
echo "4) 自定义版本"
echo "5) 取消"

read -p "请选择 (1-5): " choice

case $choice in
    1)
        version_type="patch"
        ;;
    2)
        version_type="minor"
        ;;
    3)
        version_type="major"
        ;;
    4)
        read -p "请输入新版本号 (例如: 2.1.0): " custom_version
        if [[ ! $custom_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "❌ 错误: 版本号格式无效"
            exit 1
        fi
        version_type=$custom_version
        ;;
    5)
        echo "取消发布"
        exit 0
        ;;
    *)
        echo "❌ 错误: 无效选择"
        exit 1
        ;;
esac

# 运行测试
echo ""
echo "🧪 运行测试..."
if npm run test --if-present > /dev/null 2>&1; then
    npm run test
else
    echo "⚠️ 跳过测试（未配置测试脚本）"
fi

# 运行代码检查
echo ""
echo "🔍 运行代码检查..."
if npm run lint --if-present > /dev/null 2>&1; then
    npm run lint
else
    echo "⚠️ 跳过代码检查（未配置lint脚本）"
fi

# 构建项目
echo ""
echo "🏗️ 构建项目..."
npm run build

# 检查构建结果
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ 错误: 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 更新版本号
echo ""
echo "📝 更新版本号..."
if [[ $version_type =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # 自定义版本号
    npm version $version_type --no-git-tag-version
    new_version=$version_type
else
    # 使用npm version命令
    new_version=$(npm version $version_type --no-git-tag-version | cut -d'v' -f2)
fi

echo "✅ 版本已更新到: $new_version"

# 生成更新日志
echo ""
echo "📝 生成更新日志..."

# 获取上一个标签
last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$last_tag" ]; then
    echo "## v$new_version ($(date +%Y-%m-%d))" > CHANGELOG_TEMP.md
    echo "" >> CHANGELOG_TEMP.md
    
    # 获取提交记录
    git log $last_tag..HEAD --pretty=format:"- %s" --no-merges >> CHANGELOG_TEMP.md
    
    echo "" >> CHANGELOG_TEMP.md
    echo "" >> CHANGELOG_TEMP.md
    
    # 如果存在CHANGELOG.md，则合并
    if [ -f "CHANGELOG.md" ]; then
        cat CHANGELOG.md >> CHANGELOG_TEMP.md
        mv CHANGELOG_TEMP.md CHANGELOG.md
    else
        mv CHANGELOG_TEMP.md CHANGELOG.md
    fi
    
    echo "✅ 更新日志已生成"
else
    echo "⚠️ 未找到上一个标签，跳过更新日志生成"
fi

# 提交更改
echo ""
echo "📤 提交更改..."
git add .
git commit -m "chore: release v$new_version

- Update version to $new_version
- Update changelog
- Build production assets"

# 创建标签
echo ""
echo "🏷️ 创建标签..."
git tag -a "v$new_version" -m "Release v$new_version

$(if [ -f "CHANGELOG.md" ]; then head -20 CHANGELOG.md | tail -n +3; else echo "Version $new_version release"; fi)"

# 推送到远程仓库
echo ""
echo "🚀 推送到远程仓库..."
git push origin $current_branch
git push origin "v$new_version"

# 创建GitHub Release（如果安装了gh CLI）
if command -v gh &> /dev/null; then
    echo ""
    echo "📦 创建GitHub Release..."
    
    release_notes=""
    if [ -f "CHANGELOG.md" ]; then
        # 提取当前版本的更新日志
        release_notes=$(sed -n "/## v$new_version/,/## v/p" CHANGELOG.md | head -n -1)
    fi
    
    if [ -z "$release_notes" ]; then
        release_notes="Release v$new_version"
    fi
    
    gh release create "v$new_version" \
        --title "Find 3D v$new_version" \
        --notes "$release_notes" \
        --latest
    
    echo "✅ GitHub Release 已创建"
else
    echo "⚠️ 未安装 GitHub CLI，请手动创建 Release"
    echo "   访问: https://github.com/judyjin1996-ops/Find-3d/releases/new"
    echo "   标签: v$new_version"
fi

# 显示部署信息
echo ""
echo "🎉 发布完成！"
echo "========================"
echo "📦 版本: v$new_version"
echo "🏷️ 标签: v$new_version"
echo "🌐 在线地址: https://judyjin1996-ops.github.io/Find-3d/"
echo "📊 GitHub Actions: https://github.com/judyjin1996-ops/Find-3d/actions"
echo "📦 Releases: https://github.com/judyjin1996-ops/Find-3d/releases"
echo ""
echo "💡 提示:"
echo "- GitHub Actions 将自动部署到 GitHub Pages"
echo "- 部署通常需要 2-5 分钟完成"
echo "- 可以在 Actions 页面查看部署进度"
echo ""
echo "🎊 恭喜！Find 3D v$new_version 发布成功！"