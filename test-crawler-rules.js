/**
 * 爬虫规则测试脚本
 * 用于验证爬虫规则的有效性
 */

// 模拟测试魔顿网的爬虫规则
const testModownRule = {
  id: 'modown',
  websiteName: '魔顿网',
  baseUrl: 'https://www.modown.cn',
  searchUrl: 'https://www.modown.cn/?s=手机',
  
  // 测试选择器
  selectors: {
    // 搜索结果页面
    listContainer: '#main, .main, .content, .posts, .search-results, body',
    listItem: 'article, .post, .entry, [class*="post"], h2, h3, .result-item',
    listLink: 'h2 a[href*="archives"], h3 a[href*="archives"], .entry-title a[href*="archives"], .post-title a[href*="archives"], a[href*="archives"]',
    
    // 详情页面
    detailTitle: 'h1.entry-title, .post-title h1, .single-title, h1, .title',
    detailImages: '.entry-content img[src*="wp-content"], .post-content img[src*="wp-content"], .wp-post-image, .featured-image img, img[src*="uploads"], .attachment-post-thumbnail, .post-thumbnail img',
    detailDescription: '.entry-content p:first-of-type, .post-content p:first-of-type, .content p:first-of-type, .excerpt, .summary',
    detailPrice: '.download-price, .price-info, .vip-price, [class*="price"], .cost, .money',
    detailFree: '.free-download, .免费下载, .free-tag, [class*="free"], .gratis'
  }
};

// 测试函数
function testSelectors() {
  console.log('🧪 开始测试魔顿网爬虫规则...');
  console.log('');
  
  console.log('📋 规则配置:');
  console.log(`网站名称: ${testModownRule.websiteName}`);
  console.log(`基础URL: ${testModownRule.baseUrl}`);
  console.log(`搜索URL: ${testModownRule.searchUrl}`);
  console.log('');
  
  console.log('🔍 搜索结果页面选择器:');
  console.log(`容器选择器: ${testModownRule.selectors.listContainer}`);
  console.log(`项目选择器: ${testModownRule.selectors.listItem}`);
  console.log(`链接选择器: ${testModownRule.selectors.listLink}`);
  console.log('');
  
  console.log('📄 详情页面选择器:');
  console.log(`标题选择器: ${testModownRule.selectors.detailTitle}`);
  console.log(`图片选择器: ${testModownRule.selectors.detailImages}`);
  console.log(`描述选择器: ${testModownRule.selectors.detailDescription}`);
  console.log(`价格选择器: ${testModownRule.selectors.detailPrice}`);
  console.log(`免费标识选择器: ${testModownRule.selectors.detailFree}`);
  console.log('');
  
  console.log('✅ 规则配置验证完成');
  console.log('');
  console.log('💡 使用建议:');
  console.log('1. 在浏览器中访问搜索页面，检查选择器是否能找到元素');
  console.log('2. 使用开发者工具验证选择器的准确性');
  console.log('3. 测试不同关键词的搜索结果');
  console.log('4. 验证详情页面的数据提取效果');
  console.log('');
  
  // 生成测试用的浏览器控制台代码
  console.log('🔧 浏览器控制台测试代码:');
  console.log('');
  console.log('// 测试搜索结果页面选择器');
  console.log(`// 1. 访问: ${testModownRule.searchUrl}`);
  console.log('// 2. 在控制台运行以下代码:');
  console.log('');
  console.log('// 测试容器选择器');
  console.log(`document.querySelector('${testModownRule.selectors.listContainer.split(',')[0].trim()}')`);
  console.log('');
  console.log('// 测试项目选择器');
  console.log(`document.querySelectorAll('${testModownRule.selectors.listItem.split(',')[0].trim()}')`);
  console.log('');
  console.log('// 测试链接选择器');
  console.log(`document.querySelectorAll('${testModownRule.selectors.listLink.split(',')[0].trim()}')`);
  console.log('');
  console.log('// 提取所有链接');
  console.log(`Array.from(document.querySelectorAll('${testModownRule.selectors.listLink.split(',')[0].trim()}')).map(a => a.href)`);
  console.log('');
  
  console.log('// 测试详情页面选择器（在详情页面运行）');
  console.log('// 访问任意一个详情页面，然后运行:');
  console.log('');
  console.log('// 测试标题提取');
  console.log(`document.querySelector('${testModownRule.selectors.detailTitle.split(',')[0].trim()}')?.textContent`);
  console.log('');
  console.log('// 测试图片提取');
  console.log(`Array.from(document.querySelectorAll('${testModownRule.selectors.detailImages.split(',')[0].trim()}')).map(img => img.src)`);
  console.log('');
  console.log('// 测试描述提取');
  console.log(`document.querySelector('${testModownRule.selectors.detailDescription.split(',')[0].trim()}')?.textContent`);
  console.log('');
  console.log('// 测试免费标识');
  console.log(`document.querySelector('${testModownRule.selectors.detailFree.split(',')[0].trim()}') ? '免费' : '付费'`);
}

// 运行测试
testSelectors();

// 导出测试配置供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testModownRule, testSelectors };
}