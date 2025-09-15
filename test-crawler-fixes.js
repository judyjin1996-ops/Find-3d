/**
 * 测试爬虫修复效果的脚本
 * 验证搜索结果链接和图片显示是否正常
 */

const { crawlerService } = require('./src/services/crawlerService');

async function testCrawlerFixes() {
  console.log('🧪 开始测试爬虫修复效果...');
  
  try {
    // 初始化爬虫服务
    console.log('📋 初始化爬虫服务...');
    await crawlerService.initialize();
    
    // 测试搜索功能
    console.log('🔍 测试搜索功能...');
    const searchResponse = await crawlerService.searchMaterials('手机', {
      websites: ['modown'], // 只测试魔顿网
      mode: 'comprehensive',
      maxResults: 5
    });
    
    console.log(`✅ 搜索任务已启动，任务ID: ${searchResponse.taskId}`);
    
    // 等待搜索完成
    let task = crawlerService.getSearchTaskStatus(searchResponse.taskId);
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60秒
    
    while (task && task.status === 'running' && attempts < maxAttempts) {
      console.log(`⏳ 等待搜索完成... (${attempts + 1}/${maxAttempts})`);
      console.log(`📊 进度: ${task.progress.completed}/${task.progress.total}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      task = crawlerService.getSearchTaskStatus(searchResponse.taskId);
      attempts++;
    }
    
    if (!task) {
      console.error('❌ 无法获取任务状态');
      return;
    }
    
    if (task.status === 'completed') {
      console.log('✅ 搜索完成！');
      console.log(`📊 结果统计:`);
      console.log(`  - 总结果数: ${task.results.length}`);
      console.log(`  - 成功网站: ${task.progress.completed}`);
      console.log(`  - 失败网站: ${task.progress.failed}`);
      console.log(`  - 错误数: ${task.errors.length}`);
      
      // 分析结果质量
      if (task.results.length > 0) {
        console.log('\n📋 结果质量分析:');
        
        let validLinks = 0;
        let validImages = 0;
        let validTitles = 0;
        let validPrices = 0;
        
        task.results.forEach((result, index) => {
          console.log(`\n📄 结果 ${index + 1}:`);
          console.log(`  标题: ${result.title || '❌ 缺失'}`);
          console.log(`  链接: ${result.sourceUrl || '❌ 缺失'}`);
          console.log(`  图片数: ${result.previewImages?.length || 0}`);
          console.log(`  价格: ${result.pricing?.isFree ? '免费' : (result.pricing?.price ? `¥${result.pricing.price}` : '未知')}`);
          console.log(`  质量评分: ${result.quality?.score || 0}/100`);
          
          // 验证链接
          if (result.sourceUrl && result.sourceUrl.includes('archives')) {
            validLinks++;
            console.log(`  ✅ 链接格式正确`);
          } else {
            console.log(`  ❌ 链接格式异常`);
          }
          
          // 验证图片
          if (result.previewImages && result.previewImages.length > 0) {
            validImages++;
            console.log(`  ✅ 包含预览图`);
            result.previewImages.forEach((img, imgIndex) => {
              console.log(`    图片${imgIndex + 1}: ${img.url}`);
            });
          } else {
            console.log(`  ❌ 缺少预览图`);
          }
          
          // 验证标题
          if (result.title && result.title.length > 3) {
            validTitles++;
            console.log(`  ✅ 标题有效`);
          } else {
            console.log(`  ❌ 标题无效`);
          }
          
          // 验证价格信息
          if (result.pricing && (result.pricing.isFree || result.pricing.price !== undefined)) {
            validPrices++;
            console.log(`  ✅ 价格信息有效`);
          } else {
            console.log(`  ❌ 价格信息缺失`);
          }
        });
        
        console.log('\n📊 质量统计:');
        console.log(`  有效链接: ${validLinks}/${task.results.length} (${(validLinks/task.results.length*100).toFixed(1)}%)`);
        console.log(`  有效图片: ${validImages}/${task.results.length} (${(validImages/task.results.length*100).toFixed(1)}%)`);
        console.log(`  有效标题: ${validTitles}/${task.results.length} (${(validTitles/task.results.length*100).toFixed(1)}%)`);
        console.log(`  有效价格: ${validPrices}/${task.results.length} (${(validPrices/task.results.length*100).toFixed(1)}%)`);
        
        // 评估修复效果
        const overallScore = (validLinks + validImages + validTitles + validPrices) / (task.results.length * 4) * 100;
        console.log(`\n🎯 总体质量评分: ${overallScore.toFixed(1)}%`);
        
        if (overallScore >= 80) {
          console.log('🎉 修复效果优秀！');
        } else if (overallScore >= 60) {
          console.log('👍 修复效果良好，还有改进空间');
        } else {
          console.log('⚠️ 修复效果一般，需要进一步优化');
        }
        
      } else {
        console.log('❌ 没有获取到任何结果');
      }
      
      // 显示错误信息
      if (task.errors.length > 0) {
        console.log('\n❌ 错误信息:');
        task.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.message}`);
        });
      }
      
    } else {
      console.log(`❌ 搜索失败，状态: ${task.status}`);
      if (task.errors.length > 0) {
        console.log('错误信息:');
        task.errors.forEach(error => {
          console.log(`  - ${error.message}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 清理资源
    await crawlerService.cleanup();
  }
}

// 运行测试
testCrawlerFixes().catch(console.error);