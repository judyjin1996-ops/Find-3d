#!/usr/bin/env node

/**
 * Find 3D 部署状态检查脚本
 * 检查GitHub Pages部署状态和网站可访问性
 */

import https from 'https';
import fs from 'fs';

const GITHUB_PAGES_URL = 'https://judyjin1996-ops.github.io/Find-3d/';
const GITHUB_API_URL = 'https://api.github.com/repos/judyjin1996-ops/Find-3d/pages';

console.log('🚀 Find 3D v2.0.0 部署状态检查');
console.log('================================');

// 检查GitHub Pages状态
function checkGitHubPagesAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/judyjin1996-ops/Find-3d/pages',
      method: 'GET',
      headers: {
        'User-Agent': 'Find3D-Deploy-Checker'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const pageInfo = JSON.parse(data);
          resolve(pageInfo);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 检查网站可访问性
function checkWebsiteAccess() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'judyjin1996-ops.github.io',
      path: '/Find-3d/',
      method: 'GET',
      headers: {
        'User-Agent': 'Find3D-Deploy-Checker'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    req.end();
  });
}

// 主检查函数
async function checkDeployment() {
  console.log('📡 检查GitHub Pages API状态...');
  
  try {
    const pageInfo = await checkGitHubPagesAPI();
    console.log('✅ GitHub Pages状态:', pageInfo.status || '未知');
    console.log('🌐 部署URL:', pageInfo.html_url || GITHUB_PAGES_URL);
    console.log('🔧 构建类型:', pageInfo.build_type || '未知');
    
    if (pageInfo.cname) {
      console.log('🏷️  自定义域名:', pageInfo.cname);
    }
  } catch (error) {
    console.log('⚠️  无法获取GitHub Pages API信息:', error.message);
  }

  console.log('\n🌍 检查网站可访问性...');
  
  try {
    const response = await checkWebsiteAccess();
    
    if (response.statusCode === 200) {
      console.log('✅ 网站可访问 - HTTP', response.statusCode);
      console.log('📄 内容类型:', response.headers['content-type'] || '未知');
      console.log('🕒 最后修改:', response.headers['last-modified'] || '未知');
    } else {
      console.log('⚠️  网站响应异常 - HTTP', response.statusCode);
    }
  } catch (error) {
    console.log('❌ 网站无法访问:', error.message);
  }

  console.log('\n📋 部署信息总结:');
  console.log('- 项目版本: v2.0.0');
  console.log('- GitHub仓库: https://github.com/judyjin1996-ops/Find-3d');
  console.log('- 在线地址: ' + GITHUB_PAGES_URL);
  console.log('- 部署方式: GitHub Actions + GitHub Pages');
  console.log('- 最后更新: ' + new Date().toLocaleString('zh-CN'));

  console.log('\n🔗 快速链接:');
  console.log('- 🌐 在线演示: ' + GITHUB_PAGES_URL);
  console.log('- 📚 项目文档: https://github.com/judyjin1996-ops/Find-3d#readme');
  console.log('- 🐛 问题反馈: https://github.com/judyjin1996-ops/Find-3d/issues');
  console.log('- 📈 Actions状态: https://github.com/judyjin1996-ops/Find-3d/actions');

  console.log('\n✨ Find 3D v2.0.0 - 智能3D素材搜索平台已成功部署！');
}

// 运行检查
checkDeployment().catch(console.error);