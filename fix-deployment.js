#!/usr/bin/env node

/**
 * 修复部署问题的脚本
 * 主要解决Netlify部署时的路径和MIME类型问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 开始修复部署问题...');

// 1. 修复index.html中的资源路径
const indexPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // 将绝对路径改为相对路径
  indexContent = indexContent.replace(/src="\/assets\//g, 'src="./assets/');
  indexContent = indexContent.replace(/href="\/assets\//g, 'href="./assets/');
  indexContent = indexContent.replace(/href="\/vite\.svg"/g, 'href="./vite.svg"');
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ 修复了index.html中的资源路径');
} else {
  console.log('❌ 找不到dist/index.html文件');
}

// 2. 创建_redirects文件用于Netlify SPA路由
const redirectsPath = path.join(__dirname, 'dist', '_redirects');
const redirectsContent = `/*    /index.html   200`;
fs.writeFileSync(redirectsPath, redirectsContent);
console.log('✅ 创建了_redirects文件');

// 3. 创建_headers文件设置正确的MIME类型
const headersPath = path.join(__dirname, 'dist', '_headers');
const headersContent = `/*.js
  Content-Type: application/javascript

/*.css
  Content-Type: text/css

/*.html
  Content-Type: text/html

/*.svg
  Content-Type: image/svg+xml

/*.png
  Content-Type: image/png

/*.jpg
  Content-Type: image/jpeg

/*.jpeg
  Content-Type: image/jpeg

/*.gif
  Content-Type: image/gif

/*.ico
  Content-Type: image/x-icon

/*.woff
  Content-Type: font/woff

/*.woff2
  Content-Type: font/woff2

/*.ttf
  Content-Type: font/ttf

/*.eot
  Content-Type: application/vnd.ms-fontobject`;

fs.writeFileSync(headersPath, headersContent);
console.log('✅ 创建了_headers文件');

console.log('🎉 部署修复完成！');
console.log('');
console.log('现在可以部署到Netlify了：');
console.log('1. 将dist文件夹的内容上传到Netlify');
console.log('2. 或者连接Git仓库并设置构建命令：npm run build && node fix-deployment.js');
console.log('3. 设置发布目录为：dist');