/**
 * 智能内容提取器
 * 提供更高级的内容提取功能，包括智能选择器、内容识别和数据推断
 */

import { Page } from 'puppeteer';
import { CrawlerRule } from '../types/crawler';
import { ExtractedData } from './ContentExtractor';

export interface SmartExtractionResult extends ExtractedData {
  confidence: number; // 提取置信度 0-1
  extractionMethod: string; // 提取方法描述
  fallbackUsed: boolean; // 是否使用了备用方案
  metadata: {
    pageTitle: string;
    pageUrl: string;
    extractedAt: Date;
    processingTime: number;
  };
}

export class SmartExtractor {
  /**
   * 智能提取页面内容
   */
  async smartExtract(page: Page, rule: CrawlerRule): Promise<SmartExtractionResult | null> {
    const startTime = Date.now();
    
    try {
      console.log('🧠 开始智能内容提取...');
      
      // 获取页面基本信息
      const pageInfo = await this.getPageInfo(page);
      
      // 尝试多种提取策略
      const extractionResult = await this.tryMultipleStrategies(page, rule);
      
      if (!extractionResult) {
        console.warn('⚠️ 所有提取策略都失败了');
        return null;
      }

      // 智能数据增强
      const enhancedData = await this.enhanceExtractedData(page, extractionResult, rule);
      
      // 计算置信度
      const confidence = this.calculateConfidence(enhancedData, rule);
      
      const processingTime = Date.now() - startTime;
      
      const result: SmartExtractionResult = {
        ...enhancedData,
        confidence,
        extractionMethod: extractionResult.method,
        fallbackUsed: extractionResult.fallbackUsed,
        metadata: {
          pageTitle: pageInfo.title,
          pageUrl: pageInfo.url,
          extractedAt: new Date(),
          processingTime
        }
      };

      console.log(`✅ 智能提取完成，置信度: ${(confidence * 100).toFixed(1)}%`);
      return result;
      
    } catch (error) {
      console.error('❌ 智能提取失败:', error);
      return null;
    }
  }

  /**
   * 尝试多种提取策略
   */
  private async tryMultipleStrategies(page: Page, rule: CrawlerRule): Promise<{
    data: ExtractedData;
    method: string;
    fallbackUsed: boolean;
  } | null> {
    const strategies = [
      { name: '配置选择器', method: () => this.extractByConfiguredSelectors(page, rule) },
      { name: '智能选择器', method: () => this.extractBySmartSelectors(page) },
      { name: '语义分析', method: () => this.extractBySemanticAnalysis(page) },
      { name: '结构化数据', method: () => this.extractStructuredData(page) },
      { name: '通用模式', method: () => this.extractByCommonPatterns(page) }
    ];

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      
      try {
        console.log(`🔍 尝试策略: ${strategy.name}`);
        const data = await strategy.method();
        
        if (data && this.isValidExtraction(data)) {
          return {
            data,
            method: strategy.name,
            fallbackUsed: i > 0
          };
        }
      } catch (error) {
        console.warn(`⚠️ 策略 ${strategy.name} 失败:`, error);
      }
    }

    return null;
  }

  /**
   * 使用配置的选择器提取
   */
  private async extractByConfiguredSelectors(page: Page, rule: CrawlerRule): Promise<ExtractedData> {
    const selectors = rule.parseConfig.detailSelectors;
    
    return await page.evaluate((selectors) => {
      const data: any = {};

      // 提取标题
      if (selectors.title) {
        const titleEl = document.querySelector(selectors.title);
        if (titleEl) {
          data.title = titleEl.textContent?.trim();
        }
      }

      // 提取描述
      if (selectors.description) {
        const descEl = document.querySelector(selectors.description);
        if (descEl) {
          data.description = descEl.textContent?.trim();
        }
      }

      // 提取图片
      if (selectors.images) {
        const imgElements = document.querySelectorAll(selectors.images);
        data.images = Array.from(imgElements).map((img: any) => ({
          url: img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy'),
          alt: img.alt || '',
          size: 'medium' as const
        })).filter(img => img.url);
      }

      // 提取价格
      if (selectors.price) {
        const priceEl = document.querySelector(selectors.price);
        if (priceEl) {
          data.priceText = priceEl.textContent?.trim();
        }
      }

      // 提取其他字段...
      return data;
    }, selectors);
  }

  /**
   * 使用智能选择器提取
   */
  private async extractBySmartSelectors(page: Page): Promise<ExtractedData> {
    return await page.evaluate(() => {
      const data: any = {};

      // 智能标题提取
      const titleSelectors = [
        'h1',
        '.title',
        '.post-title',
        '.entry-title',
        '.product-title',
        '.detail-title',
        '[class*="title"]',
        '[id*="title"]'
      ];

      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent && el.textContent.trim().length > 3) {
          data.title = el.textContent.trim();
          break;
        }
      }

      // 智能图片提取
      const imageSelectors = [
        '.preview img',
        '.gallery img',
        '.product-image img',
        '.main-image img',
        '.content img',
        'img[src*="preview"]',
        'img[src*="thumb"]',
        'img[alt*="预览"]'
      ];

      const images: any[] = [];
      imageSelectors.forEach(selector => {
        const imgElements = document.querySelectorAll(selector);
        Array.from(imgElements).forEach((img: any) => {
          const url = img.src || img.getAttribute('data-src');
          if (url && !images.some(existing => existing.url === url)) {
            images.push({
              url,
              alt: img.alt || '',
              size: 'medium' as const
            });
          }
        });
      });
      data.images = images.slice(0, 10); // 限制数量

      // 智能价格提取
      const priceSelectors = [
        '.price',
        '.cost',
        '.amount',
        '[class*="price"]',
        '[class*="cost"]',
        '[id*="price"]'
      ];

      for (const selector of priceSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent) {
          const text = el.textContent.trim();
          if (/[\d¥$￥]/.test(text)) {
            data.priceText = text;
            break;
          }
        }
      }

      // 智能描述提取
      const descSelectors = [
        '.description',
        '.content p:first-of-type',
        '.summary',
        '.intro',
        '[class*="desc"]',
        '.post-content p:first-of-type'
      ];

      for (const selector of descSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent && el.textContent.trim().length > 20) {
          data.description = el.textContent.trim();
          break;
        }
      }

      return data;
    });
  }

  /**
   * 使用语义分析提取
   */
  private async extractBySemanticAnalysis(page: Page): Promise<ExtractedData> {
    return await page.evaluate(() => {
      const data: any = {};

      // 分析页面结构，寻找语义化标签
      const article = document.querySelector('article');
      const main = document.querySelector('main');
      const content = document.querySelector('.content, #content');
      
      const container = article || main || content || document.body;

      // 在容器中寻找标题
      const headings = container.querySelectorAll('h1, h2, h3');
      if (headings.length > 0) {
        // 选择最大的标题作为主标题
        let mainHeading = headings[0];
        for (const heading of Array.from(headings)) {
          if (heading.textContent && heading.textContent.length > (mainHeading.textContent?.length || 0)) {
            mainHeading = heading;
          }
        }
        data.title = mainHeading.textContent?.trim();
      }

      // 寻找图片容器
      const imageContainers = container.querySelectorAll('.gallery, .images, .photos, [class*="image"]');
      const images: any[] = [];
      
      imageContainers.forEach(container => {
        const imgs = container.querySelectorAll('img');
        Array.from(imgs).forEach((img: any) => {
          const url = img.src || img.getAttribute('data-src');
          if (url) {
            images.push({
              url,
              alt: img.alt || '',
              size: 'medium' as const
            });
          }
        });
      });

      // 如果没有找到图片容器，直接查找所有图片
      if (images.length === 0) {
        const allImages = container.querySelectorAll('img');
        Array.from(allImages).forEach((img: any) => {
          const url = img.src || img.getAttribute('data-src');
          if (url && this.isContentImage(img)) {
            images.push({
              url,
              alt: img.alt || '',
              size: 'medium' as const
            });
          }
        });
      }

      data.images = images.slice(0, 8);

      // 寻找描述性文本
      const paragraphs = container.querySelectorAll('p');
      for (const p of Array.from(paragraphs)) {
        const text = p.textContent?.trim();
        if (text && text.length > 50 && text.length < 500) {
          data.description = text;
          break;
        }
      }

      return data;
    });
  }

  /**
   * 提取结构化数据 (JSON-LD, microdata等)
   */
  private async extractStructuredData(page: Page): Promise<ExtractedData> {
    return await page.evaluate(() => {
      const data: any = {};

      // 提取JSON-LD数据
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of Array.from(jsonLdScripts)) {
        try {
          const jsonData = JSON.parse(script.textContent || '');
          
          if (jsonData['@type'] === 'Product' || jsonData['@type'] === 'CreativeWork') {
            if (jsonData.name) data.title = jsonData.name;
            if (jsonData.description) data.description = jsonData.description;
            if (jsonData.image) {
              const imageUrl = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
              data.images = [{ url: imageUrl, alt: '', size: 'medium' as const }];
            }
            if (jsonData.offers && jsonData.offers.price) {
              data.price = parseFloat(jsonData.offers.price);
              data.priceText = jsonData.offers.price + ' ' + (jsonData.offers.priceCurrency || '');
            }
          }
        } catch (e) {
          // 忽略JSON解析错误
        }
      }

      // 提取Open Graph数据
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');

      if (!data.title && ogTitle) {
        data.title = ogTitle.getAttribute('content');
      }
      if (!data.description && ogDescription) {
        data.description = ogDescription.getAttribute('content');
      }
      if (!data.images && ogImage) {
        data.images = [{ 
          url: ogImage.getAttribute('content') || '', 
          alt: '', 
          size: 'medium' as const 
        }];
      }

      return data;
    });
  }

  /**
   * 使用通用模式提取
   */
  private async extractByCommonPatterns(page: Page): Promise<ExtractedData> {
    return await page.evaluate(() => {
      const data: any = {};

      // 通用标题模式
      const titlePatterns = [
        () => document.title,
        () => document.querySelector('meta[name="title"]')?.getAttribute('content'),
        () => document.querySelector('h1')?.textContent,
        () => document.querySelector('.title, #title')?.textContent
      ];

      for (const pattern of titlePatterns) {
        try {
          const title = pattern()?.trim();
          if (title && title.length > 3) {
            data.title = title;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // 通用图片模式
      const images: any[] = [];
      const allImages = document.querySelectorAll('img');
      
      Array.from(allImages).forEach((img: any) => {
        const url = img.src || img.getAttribute('data-src');
        if (url && this.isLikelyContentImage(img)) {
          images.push({
            url,
            alt: img.alt || '',
            size: 'medium' as const
          });
        }
      });

      data.images = images.slice(0, 5);

      // 通用描述模式
      const descPatterns = [
        () => document.querySelector('meta[name="description"]')?.getAttribute('content'),
        () => document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        () => {
          const paragraphs = document.querySelectorAll('p');
          for (const p of Array.from(paragraphs)) {
            const text = p.textContent?.trim();
            if (text && text.length > 30 && text.length < 300) {
              return text;
            }
          }
          return null;
        }
      ];

      for (const pattern of descPatterns) {
        try {
          const desc = pattern();
          if (desc && desc.length > 10) {
            data.description = desc;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      return data;
    });
  }

  /**
   * 增强提取的数据
   */
  private async enhanceExtractedData(page: Page, data: ExtractedData, rule: CrawlerRule): Promise<ExtractedData> {
    const enhanced = { ...data };

    // 智能价格解析
    if (enhanced.priceText && !enhanced.price) {
      enhanced.price = this.parsePrice(enhanced.priceText);
      enhanced.isFree = enhanced.price === 0;
    }

    // 智能免费检测
    if (!enhanced.isFree && enhanced.priceText) {
      const freeKeywords = ['免费', 'free', '0元', '0.00', '无需付费'];
      enhanced.isFree = freeKeywords.some(keyword => 
        enhanced.priceText?.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 图片URL处理
    if (enhanced.images) {
      enhanced.images = enhanced.images
        .map(img => ({
          ...img,
          url: this.resolveImageUrl(img.url, rule.dataProcessing.imageProcessing.baseUrl || rule.baseUrl)
        }))
        .filter(img => this.isValidImageUrl(img.url));
    }

    // 智能标签提取
    if (!enhanced.tags || enhanced.tags.length === 0) {
      enhanced.tags = await this.extractSmartTags(page);
    }

    // 智能文件格式检测
    if (!enhanced.fileFormat) {
      enhanced.fileFormat = this.detectFileFormat(enhanced.title, enhanced.description);
    }

    return enhanced;
  }

  /**
   * 智能标签提取
   */
  private async extractSmartTags(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const tags: string[] = [];

      // 从标签元素提取
      const tagSelectors = [
        '.tags a',
        '.tag-list a',
        '.keywords a',
        '[class*="tag"] a',
        '.post-tags a'
      ];

      tagSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        Array.from(elements).forEach((el: any) => {
          const tag = el.textContent?.trim();
          if (tag && tag.length > 1 && tag.length < 20) {
            tags.push(tag);
          }
        });
      });

      // 从meta keywords提取
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        const keywords = metaKeywords.getAttribute('content')?.split(',') || [];
        keywords.forEach(keyword => {
          const tag = keyword.trim();
          if (tag && tag.length > 1) {
            tags.push(tag);
          }
        });
      }

      // 去重并限制数量
      return Array.from(new Set(tags)).slice(0, 15);
    });
  }

  /**
   * 检测文件格式
   */
  private detectFileFormat(title?: string, description?: string): string | undefined {
    const text = `${title || ''} ${description || ''}`.toLowerCase();
    
    const formatPatterns = [
      { pattern: /\.?3ds\b|3d\s*studio/i, format: '3DS' },
      { pattern: /\.?obj\b|wavefront/i, format: 'OBJ' },
      { pattern: /\.?fbx\b|filmbox/i, format: 'FBX' },
      { pattern: /\.?max\b|3ds\s*max/i, format: 'MAX' },
      { pattern: /\.?c4d\b|cinema\s*4d/i, format: 'C4D' },
      { pattern: /\.?blend\b|blender/i, format: 'BLEND' },
      { pattern: /\.?ma\b|\.?mb\b|maya/i, format: 'MAYA' },
      { pattern: /\.?skp\b|sketchup/i, format: 'SKP' },
      { pattern: /\.?dae\b|collada/i, format: 'DAE' },
      { pattern: /\.?stl\b|stereolithography/i, format: 'STL' }
    ];

    for (const { pattern, format } of formatPatterns) {
      if (pattern.test(text)) {
        return format;
      }
    }

    return undefined;
  }

  /**
   * 解析价格
   */
  private parsePrice(priceText: string): number | undefined {
    const pricePatterns = [
      /¥\s*(\d+(?:\.\d+)?)/,
      /￥\s*(\d+(?:\.\d+)?)/,
      /\$\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)\s*元/,
      /(\d+(?:\.\d+)?)\s*币/,
      /(\d+(?:\.\d+)?)/
    ];

    for (const pattern of pricePatterns) {
      const match = priceText.match(pattern);
      if (match) {
        const price = parseFloat(match[1]);
        if (!isNaN(price)) {
          return price;
        }
      }
    }

    return undefined;
  }

  /**
   * 解析图片URL
   */
  private resolveImageUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    if (url.startsWith('/')) {
      return baseUrl.replace(/\/$/, '') + url;
    }
    return baseUrl.replace(/\/$/, '') + '/' + url;
  }

  /**
   * 验证图片URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      return imageExtensions.some(ext => url.toLowerCase().includes(ext)) ||
             url.toLowerCase().includes('image') ||
             url.toLowerCase().includes('img');
    } catch {
      return false;
    }
  }

  /**
   * 获取页面基本信息
   */
  private async getPageInfo(page: Page): Promise<{ title: string; url: string }> {
    return await page.evaluate(() => ({
      title: document.title,
      url: window.location.href
    }));
  }

  /**
   * 验证提取结果
   */
  private isValidExtraction(data: ExtractedData): boolean {
    return !!(data.title && data.title.length > 2);
  }

  /**
   * 计算提取置信度
   */
  private calculateConfidence(data: ExtractedData, rule: CrawlerRule): number {
    let score = 0;
    let maxScore = 0;

    // 标题 (30分)
    maxScore += 30;
    if (data.title) {
      if (data.title.length >= rule.qualityControl.minTitleLength) {
        score += 30;
      } else {
        score += 15;
      }
    }

    // 图片 (25分)
    maxScore += 25;
    if (data.images && data.images.length > 0) {
      score += Math.min(25, data.images.length * 5);
    }

    // 描述 (20分)
    maxScore += 20;
    if (data.description) {
      if (data.description.length > 50) {
        score += 20;
      } else {
        score += 10;
      }
    }

    // 价格信息 (15分)
    maxScore += 15;
    if (data.price !== undefined || data.isFree) {
      score += 15;
    } else if (data.priceText) {
      score += 8;
    }

    // 其他信息 (10分)
    maxScore += 10;
    if (data.tags && data.tags.length > 0) score += 3;
    if (data.fileFormat) score += 3;
    if (data.author) score += 2;
    if (data.downloadCount !== undefined) score += 2;

    return maxScore > 0 ? score / maxScore : 0;
  }
}