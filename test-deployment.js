#!/usr/bin/env node

/**
 * 部署测试脚本
 * 检查GitHub Pages部署状态和文件可访问性
 */

import https from 'https';
import http from 'http';

// 测试URL列表
const testUrls = [
  {
    name: '主页',
    url: 'https://judyjin1996-ops.github.io/Find-3d/',
    expected: 'Find 3D'
  },
  {
    name: '生产版本页面',
    url: 'https://judyjin1996-ops.github.io/Find-3d/production.html',
    expected: '生产版本'
  },
  {
    name: '测试页面',
    url: 'https://judyjin1996-ops.github.io/Find-3d/test.html',
    expected: 'test'
  }
];

// 测试单个URL
function testUrl(testCase) {
  return new Promise((resolve) => {
    const client = testCase.url.startsWith('https:') ? https : http;
    
    console.log(`🔍 测试: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    
    const req = client.get(testCase.url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const success = res.statusCode === 200 && data.includes(testCase.expected);
        
        if (success) {
          console.log(`   ✅ 成功 (状态码: ${res.statusCode})`);
        } else {
          console.log(`   ❌ 失败 (状态码: ${res.statusCode})`);
          if (res.statusCode !== 200) {
            console.log(`   错误: HTTP ${res.statusCode}`);
          } else {
            console.log(`   错误: 页面内容不包含 "${testCase.expected}"`);
          }
        }
        
        resolve({
          name: testCase.name,
          url: testCase.url,
          success: success,
          statusCode: res.statusCode,
          hasExpectedContent: data.includes(testCase.expected)
        });
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ 网络错误: ${error.message}`);
      resolve({
        name: testCase.name,
        url: testCase.url,
        success: false,
        error: error.message
      });
    });
    
    // 设置超时
    req.setTimeout(10000, () => {
      console.log(`   ⏰ 超时`);
      req.destroy();
      resolve({
        name: testCase.name,
        url: testCase.url,
        success: false,
        error: '请求超时'
      });
    });
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试 Find 3D 部署状态...\n');
  
  const results = [];
  
  for (const testCase of testUrls) {
    const result = await testUrl(testCase);
    results.push(result);
    console.log(''); // 空行分隔
    
    // 等待1秒避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 输出总结
  console.log('📊 测试总结:');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.url}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  console.log('='.repeat(50));
  console.log(`总计: ${successCount}/${totalCount} 个测试通过`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有测试通过！部署成功！');
    console.log('\n🔗 可用链接:');
    console.log('- 主页: https://judyjin1996-ops.github.io/Find-3d/');
    console.log('- 生产版本: https://judyjin1996-ops.github.io/Find-3d/production.html');
    console.log('- GitHub项目: https://github.com/judyjin1996-ops/Find-3d');
  } else {
    console.log('⚠️ 部分测试失败，请检查部署状态');
    console.log('\n💡 可能的原因:');
    console.log('1. GitHub Actions还在部署中，请等待2-5分钟');
    console.log('2. 网络连接问题');
    console.log('3. 文件路径或配置问题');
    console.log('\n🔧 建议操作:');
    console.log('1. 检查GitHub Actions状态: https://github.com/judyjin1996-ops/Find-3d/actions');
    console.log('2. 等待几分钟后重新运行测试');
    console.log('3. 检查GitHub Pages设置');
  }
  
  return successCount === totalCount;
}

// 运行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 测试运行失败:', error);
  process.exit(1);
});

export { runTests, testUrl };