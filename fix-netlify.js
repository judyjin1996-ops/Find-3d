#!/usr/bin/env node

/**
 * Netlify部署修复脚本
 * 自动检测和修复常见的Netlify部署问题
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Netlify部署问题自动修复工具');
console.log('=====================================\n');

// 检查项目结构
function checkProjectStructure() {
    console.log('📁 检查项目结构...');
    
    const requiredFiles = [
        'package.json',
        'index.html',
        'dist/index.html'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        console.log('❌ 缺少必要文件:', missingFiles.join(', '));
        return false;
    }
    
    console.log('✅ 项目结构检查通过\n');
    return true;
}

// 修复netlify.toml配置
function fixNetlifyConfig() {
    console.log('⚙️ 修复Netlify配置...');
    
    const netlifyConfig = `[build]
  # 使用静态文件部署，不需要构建
  publish = "dist"

# 单页应用路由配置
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# 静态文件缓存配置
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`;

    fs.writeFileSync('netlify.toml', netlifyConfig);
    console.log('✅ 已创建/更新 netlify.toml 配置文件\n');
}

// 检查dist目录
function checkDistDirectory() {
    console.log('📦 检查构建输出...');
    
    if (!fs.existsSync('dist')) {
        console.log('❌ dist目录不存在');
        return false;
    }
    
    if (!fs.existsSync('dist/index.html')) {
        console.log('❌ dist/index.html 不存在');
        return false;
    }
    
    // 检查index.html内容
    const indexContent = fs.readFileSync('dist/index.html', 'utf8');
    if (indexContent.length < 100) {
        console.log('❌ dist/index.html 内容异常（文件过小）');
        return false;
    }
    
    console.log('✅ 构建输出检查通过\n');
    return true;
}

// 生成部署说明
function generateDeployInstructions() {
    console.log('📋 生成部署说明...');
    
    const instructions = `# Netlify部署说明

## 🚀 快速部署步骤

### 方法一：拖拽部署（推荐）
1. 访问 https://app.netlify.com/
2. 点击 "Add new site" → "Deploy manually"
3. 将整个 \`dist\` 文件夹拖拽到部署区域
4. 等待部署完成

### 方法二：Git部署
1. 将项目推送到GitHub
2. 在Netlify中连接GitHub仓库
3. 设置构建配置：
   - Build command: 留空
   - Publish directory: \`dist\`
4. 点击部署

## ✅ 部署成功标志
- 网站可以正常访问
- 搜索功能正常工作
- 页面样式显示正确

## 🔧 常见问题
- 如果页面空白：检查浏览器控制台错误信息
- 如果样式丢失：确认CSS文件路径正确
- 如果功能异常：检查JavaScript是否正常加载

生成时间: ${new Date().toLocaleString()}
`;

    fs.writeFileSync('NETLIFY_DEPLOY.md', instructions);
    console.log('✅ 已生成部署说明文件: NETLIFY_DEPLOY.md\n');
}

// 主函数
function main() {
    try {
        // 检查项目结构
        if (!checkProjectStructure()) {
            console.log('❌ 项目结构检查失败，请确保在正确的项目目录中运行此脚本');
            process.exit(1);
        }
        
        // 修复配置
        fixNetlifyConfig();
        
        // 检查构建输出
        if (!checkDistDirectory()) {
            console.log('⚠️ 构建输出检查失败，但配置已修复');
            console.log('💡 建议：手动将 dist 文件夹拖拽到Netlify进行部署');
        }
        
        // 生成部署说明
        generateDeployInstructions();
        
        console.log('🎉 修复完成！');
        console.log('📖 请查看 NETLIFY_DEPLOY.md 文件了解详细部署步骤');
        
    } catch (error) {
        console.error('❌ 修复过程中出现错误:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main();