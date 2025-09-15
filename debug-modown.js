/**
 * 调试魔顿网页面结构的脚本
 * 用于分析实际的HTML结构并更新爬虫规则
 */

const puppeteer = require('puppeteer');

async function debugModownStructure() {
  console.log('🔍 开始分析魔顿网页面结构...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // 设为false以便观察
    devtools: true 
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 访问搜索页面
    const searchUrl = 'https://www.modown.cn/?s=手机';
    console.log(`📍 访问搜索页面: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 分析页面结构
    const pageStructure = await page.evaluate(() => {
      const structure = {
        title: document.title,
        url: window.location.href,
        searchResults: {
          containers: [],
          items: [],
          links: []
        },
        possibleSelectors: {
          containers: [],
          items: [],
          links: [],
          titles: [],
          images: []
        }
      };
      
      // 查找可能的容器元素
      const possibleContainers = [
        '.posts-wrapper', '.post-list', '.search-results', '.content', 
        '#main', '#content', '.main-content', '.posts', '.articles',
        '[class*="post"]', '[class*="article"]', '[class*="content"]'
      ];
      
      possibleContainers.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          structure.possibleSelectors.containers.push({
            selector,
            exists: true,
            childCount: element.children.length,
            innerHTML: element.innerHTML.substring(0, 200) + '...'
          });
        }
      });
      
      // 查找可能的文章项目
      const possibleItems = [
        '.post-item', '.post', '.article', '.entry', '.item',
        '[class*="post"]', '[class*="article"]', '[class*="entry"]'
      ];
      
      possibleItems.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          structure.possibleSelectors.items.push({
            selector,
            count: elements.length,
            firstItemHTML: elements[0].innerHTML.substring(0, 300) + '...'
          });
        }
      });
      
      // 查找可能的链接
      const possibleLinks = [
        '.post-title a', '.entry-title a', '.title a', 'h2 a', 'h3 a',
        '.post a[href*="archives"]', 'a[href*="archives"]'
      ];
      
      possibleLinks.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const links = Array.from(elements).map(el => ({
            href: el.href,
            text: el.textContent?.trim().substring(0, 50)
          })).slice(0, 3);
          
          structure.possibleSelectors.links.push({
            selector,
            count: elements.length,
            sampleLinks: links
          });
        }
      });
      
      // 查找图片
      const possibleImages = [
        '.post-thumbnail img', '.entry-thumbnail img', '.featured-image img',
        '.post img', '.entry img', 'img[src*="wp-content"]'
      ];
      
      possibleImages.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const images = Array.from(elements).map(el => ({
            src: el.src,
            alt: el.alt
          })).slice(0, 3);
          
          structure.possibleSelectors.images.push({
            selector,
            count: elements.length,
            sampleImages: images
          });
        }
      });
      
      return structure;
    });
    
    console.log('📊 页面结构分析结果:');
    console.log(JSON.stringify(pageStructure, null, 2));
    
    // 如果找到了文章链接，访问第一个详情页
    const linkSelectors = pageStructure.possibleSelectors.links;
    if (linkSelectors.length > 0 && linkSelectors[0].sampleLinks.length > 0) {
      const firstLink = linkSelectors[0].sampleLinks[0].href;
      console.log(`\n🔗 访问第一个详情页: ${firstLink}`);
      
      await page.goto(firstLink, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // 分析详情页结构
      const detailStructure = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          possibleSelectors: {
            titles: [],
            descriptions: [],
            images: [],
            prices: [],
            downloads: [],
            fileInfo: []
          }
        };
      });
      
      console.log('\n📄 详情页结构分析结果:');
      console.log(JSON.stringify(detailStructure, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  } finally {
    await browser.close();
  }
}

// 运行调试
debugModownStructure().catch(console.error);