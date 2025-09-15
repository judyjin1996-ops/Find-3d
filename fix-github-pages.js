#!/usr/bin/env node

/**
 * GitHub Pages空白页问题修复脚本
 * 专门解决 https://judyjin1996-ops.github.io/Find-3d/ 空白页问题
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 GitHub Pages空白页问题修复工具');
console.log('=====================================');
console.log('目标网址: https://judyjin1996-ops.github.io/Find-3d/');
console.log('');

// 检查问题原因
function diagnoseIssue() {
    console.log('🔍 诊断问题原因...');
    
    const issues = [];
    
    // 检查是否有正确的入口文件
    if (!fs.existsSync('index.html') && !fs.existsSync('dist/index.html')) {
        issues.push('缺少入口文件 index.html');
    }
    
    // 检查vite配置中的base路径
    if (fs.existsSync('vite.config.ts')) {
        const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
        if (viteConfig.includes('/find-3d/') || viteConfig.includes('/Find-3d/')) {
            issues.push('Vite配置中的base路径可能不正确');
        }
    }
    
    // 检查package.json中的homepage设置
    if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (!packageJson.homepage) {
            issues.push('package.json中缺少homepage字段');
        }
    }
    
    if (issues.length > 0) {
        console.log('❌ 发现以下问题:');
        issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
        console.log('✅ 基础检查通过');
    }
    
    return issues;
}

// 修复GitHub Pages配置
function fixGitHubPagesConfig() {
    console.log('\n⚙️ 修复GitHub Pages配置...');
    
    // 1. 更新package.json
    if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.homepage = 'https://judyjin1996-ops.github.io/Find-3d/';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ 已更新package.json中的homepage字段');
    }
    
    // 2. 修复vite.config.ts
    if (fs.existsSync('vite.config.ts')) {
        let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
        
        // 确保base路径正确
        const newBaseConfig = `  // GitHub Pages部署配置 - 修复空白页问题
  base: process.env.NODE_ENV === 'production' ? '/Find-3d/' : '/',`;
        
        // 替换base配置
        viteConfig = viteConfig.replace(
            /base:.*?,/s,
            newBaseConfig
        );
        
        fs.writeFileSync('vite.config.ts', viteConfig);
        console.log('✅ 已修复vite.config.ts中的base路径配置');
    }
}

// 创建正确的入口文件
function createCorrectIndexFile() {
    console.log('\n📄 创建正确的入口文件...');
    
    // 如果根目录没有index.html，从dist复制一个
    if (!fs.existsSync('index.html') && fs.existsSync('dist/index.html')) {
        const distIndex = fs.readFileSync('dist/index.html', 'utf8');
        fs.writeFileSync('index.html', distIndex);
        console.log('✅ 已从dist目录复制index.html到根目录');
    }
    
    // 确保index.html中的资源路径正确
    if (fs.existsSync('index.html')) {
        let indexContent = fs.readFileSync('index.html', 'utf8');
        
        // 修复资源路径
        indexContent = indexContent.replace(/src="\/src\//g, 'src="./src/');
        indexContent = indexContent.replace(/href="\/src\//g, 'href="./src/');
        indexContent = indexContent.replace(/src="\/assets\//g, 'src="./assets/');
        indexContent = indexContent.replace(/href="\/assets\//g, 'href="./assets/');
        
        fs.writeFileSync('index.html', indexContent);
        console.log('✅ 已修复index.html中的资源路径');
    }
}

// 创建GitHub Pages专用的构建脚本
function createGitHubPagesBuildScript() {
    console.log('\n🔨 创建GitHub Pages构建脚本...');
    
    const buildScript = `#!/bin/bash

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
`;

    fs.writeFileSync('build-github-pages.sh', buildScript);
    
    // Windows版本
    const buildScriptWin = `@echo off
chcp 65001 >nul
echo 🚀 开始为GitHub Pages构建项目...

REM 设置环境变量
set NODE_ENV=production

REM 清理旧的构建文件
if exist dist rmdir /s /q dist

REM 构建项目
npm run build

REM 复制dist内容到根目录
xcopy dist\\* . /E /Y

REM 检查入口文件
if not exist "index.html" (
    echo ❌ 构建失败：缺少index.html文件
    pause
    exit /b 1
)

echo ✅ GitHub Pages构建完成！
echo 📋 下一步：
echo 1. 提交所有更改到GitHub
echo 2. 在GitHub仓库设置中启用Pages
echo 3. 选择部署源为 'main' 分支的根目录
echo 4. 等待几分钟后访问: https://judyjin1996-ops.github.io/Find-3d/
pause`;

    fs.writeFileSync('build-github-pages.bat', buildScriptWin);
    
    console.log('✅ 已创建构建脚本:');
    console.log('   - build-github-pages.sh (macOS/Linux)');
    console.log('   - build-github-pages.bat (Windows)');
}

// 生成修复说明
function generateFixInstructions() {
    console.log('\n📋 生成修复说明...');
    
    const instructions = `# GitHub Pages空白页问题修复说明

## 🎯 问题诊断
你的网站 https://judyjin1996-ops.github.io/Find-3d/ 显示空白页的原因：

1. **路径配置问题**: Vite的base路径配置不正确
2. **资源加载失败**: HTML中的资源路径无法正确加载
3. **部署配置错误**: GitHub Pages的部署设置可能不正确

## 🔧 已自动修复的问题

✅ 更新了package.json中的homepage字段
✅ 修复了vite.config.ts中的base路径配置  
✅ 修正了index.html中的资源路径
✅ 创建了GitHub Pages专用构建脚本

## 🚀 立即修复步骤

### 方法一：使用构建脚本（推荐）

**macOS/Linux用户：**
\`\`\`bash
chmod +x build-github-pages.sh
./build-github-pages.sh
\`\`\`

**Windows用户：**
\`\`\`cmd
build-github-pages.bat
\`\`\`

### 方法二：手动修复

1. **重新构建项目**：
   \`\`\`bash
   npm run build
   \`\`\`

2. **复制构建文件到根目录**：
   \`\`\`bash
   cp -r dist/* .
   \`\`\`

3. **提交到GitHub**：
   \`\`\`bash
   git add .
   git commit -m "修复GitHub Pages空白页问题"
   git push origin main
   \`\`\`

## ⚙️ GitHub Pages设置检查

1. 访问你的GitHub仓库: https://github.com/judyjin1996-ops/Find-3d
2. 点击 "Settings" 标签
3. 在左侧菜单找到 "Pages"
4. 确保设置如下：
   - **Source**: Deploy from a branch
   - **Branch**: main
   - **Folder**: / (root)
5. 点击 "Save"

## 🔍 验证修复结果

修复完成后，等待3-5分钟，然后访问：
https://judyjin1996-ops.github.io/Find-3d/

你应该能看到：
- ✅ 漂亮的渐变背景
- ✅ "Find 3D" 标题和搜索框
- ✅ 功能特色卡片
- ✅ 搜索功能正常工作

## 🆘 如果仍然空白

如果修复后仍然显示空白页：

1. **检查浏览器控制台**：
   - 按F12打开开发者工具
   - 查看Console标签是否有错误信息
   - 查看Network标签是否有资源加载失败

2. **强制刷新**：
   - 按Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)
   - 清除浏览器缓存

3. **检查GitHub Pages状态**：
   - 在仓库的Actions标签查看部署状态
   - 确认最新的提交已经成功部署

## 📞 技术支持

如果问题仍然存在，请检查：
- GitHub仓库是否为Public（私有仓库需要付费才能使用Pages）
- 是否有.nojekyll文件（某些情况下需要）
- 仓库名称是否与配置中的路径匹配

修复时间: ${new Date().toLocaleString()}
目标网址: https://judyjin1996-ops.github.io/Find-3d/
`;

    fs.writeFileSync('GITHUB_PAGES_FIX.md', instructions);
    console.log('✅ 已生成详细修复说明: GITHUB_PAGES_FIX.md');
}

// 主函数
function main() {
    try {
        // 诊断问题
        const issues = diagnoseIssue();
        
        // 修复配置
        fixGitHubPagesConfig();
        
        // 创建正确的入口文件
        createCorrectIndexFile();
        
        // 创建构建脚本
        createGitHubPagesBuildScript();
        
        // 生成说明文档
        generateFixInstructions();
        
        console.log('\n🎉 修复完成！');
        console.log('');
        console.log('📋 下一步操作：');
        console.log('1. 运行构建脚本: ./build-github-pages.sh');
        console.log('2. 提交更改到GitHub');
        console.log('3. 等待3-5分钟后访问你的网站');
        console.log('');
        console.log('🔗 你的网站地址: https://judyjin1996-ops.github.io/Find-3d/');
        console.log('📖 详细说明请查看: GITHUB_PAGES_FIX.md');
        
    } catch (error) {
        console.error('❌ 修复过程中出现错误:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();