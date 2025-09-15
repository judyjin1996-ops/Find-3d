/**
 * 内容提取器
 * 负责从网页中提取结构化数据
 */

import { Page } from 'puppeteer';
import { CrawlerRule } from '../types/crawler';
import { DataCleaner } from '../utils/dataCleaner';
import { DataValidator } from '../utils/dataValidator';
import { SmartExtractor } from './SmartExtractor';
import { ImageProcessor } from '../utils/imageProcessor';

export interface ExtractedData {
  title?: string;
  description?: string;
  images?: Array<{
    url: string;
    alt?: string;
    size?: 'thumbnail' | 'medium' | 'large';
  }>;
  price?: number;
  isFree?: boolean;
  priceText?: string;
  fileFormat?: string;
  fileSize?: string;
  downloadCount?: number;
  viewCount?: number;
  rating?: number;
  reviewCount?: number;
  category?: string;
  tags?: string[];
  author?: string;
  authorUrl?: string;
  authorAvatar?: string;
  uploadDate?: Date;
}

export class ContentExtractor {
  private smartExtractor: SmartExtractor;
  private imageProcessor: ImageProcessor;

  constructor() {
    this.smartExtractor = new SmartExtractor();
    this.imageProcessor = new ImageProcessor();
  }

  /**
   * 从页面提取数据
   */
  async extractFromPage(page: Page, rule: CrawlerRule): Promise<ExtractedData | null> {
    try {
      console.log('🔍 开始内容提取...');
      
      // 尝试智能提取
      const smartResult = await this.smartExtractor.smartExtract(page, rule);
      if (smartResult && smartResult.confidence > 0.6) {
        console.log(`✅ 智能提取成功，置信度: ${(smartResult.confidence * 100).toFixed(1)}%`);
        return this.convertSmartResultToExtractedData(smartResult);
      }

      // 回退到传统提取方法
      console.log('🔄 回退到传统提取方法...');
      const selectors = rule.parseConfig.detailSelectors;
      
      const extractedData = await page.evaluate((selectors, processing) => {
        const data: any = {};

        // 提取标题
        if (selectors.title) {
          const titleElement = document.querySelector(selectors.title);
          if (titleElement) {
            data.title = titleElement.textContent?.trim();
          }
        }

        // 提取描述
        if (selectors.description) {
          const descElement = document.querySelector(selectors.description);
          if (descElement) {
            data.description = descElement.textContent?.trim();
          }
        }

        // 提取图片
        if (selectors.images) {
          const imageElements = document.querySelectorAll(selectors.images);
          data.images = Array.from(imageElements).map((img: any) => ({
            url: img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy'),
            alt: img.alt || '',
            size: 'medium' as const
          })).filter(img => img.url);
        }

        // 提取价格信息
        if (selectors.price) {
          const priceElement = document.querySelector(selectors.price);
          if (priceElement) {
            data.priceText = priceElement.textContent?.trim();
          }
        }

        // 检查免费标识
        if (selectors.freeIndicator) {
          const freeElement = document.querySelector(selectors.freeIndicator);
          data.isFree = !!freeElement;
        }

        // 提取文件信息
        if (selectors.fileInfo?.format) {
          const formatElement = document.querySelector(selectors.fileInfo.format);
          if (formatElement) {
            data.fileFormat = formatElement.textContent?.trim();
          }
        }

        if (selectors.fileInfo?.size) {
          const sizeElement = document.querySelector(selectors.fileInfo.size);
          if (sizeElement) {
            data.fileSize = sizeElement.textContent?.trim();
          }
        }

        // 提取统计信息
        if (selectors.stats?.downloads) {
          const downloadsElement = document.querySelector(selectors.stats.downloads);
          if (downloadsElement) {
            const downloadsText = downloadsElement.textContent?.trim();
            data.downloadCount = this.extractNumber(downloadsText);
          }
        }

        if (selectors.stats?.views) {
          const viewsElement = document.querySelector(selectors.stats.views);
          if (viewsElement) {
            const viewsText = viewsElement.textContent?.trim();
            data.viewCount = this.extractNumber(viewsText);
          }
        }

        if (selectors.stats?.rating) {
          const ratingElement = document.querySelector(selectors.stats.rating);
          if (ratingElement) {
            const ratingText = ratingElement.textContent?.trim();
            data.rating = this.extractRating(ratingText);
          }
        }

        // 提取元数据
        if (selectors.metadata?.author) {
          const authorElement = document.querySelector(selectors.metadata.author);
          if (authorElement) {
            data.author = authorElement.textContent?.trim();
          }
        }

        if (selectors.metadata?.tags) {
          const tagsElements = document.querySelectorAll(selectors.metadata.tags);
          data.tags = Array.from(tagsElements).map((tag: any) => 
            tag.textContent?.trim()
          ).filter(Boolean);
        }

        if (selectors.metadata?.category) {
          const categoryElement = document.querySelector(selectors.metadata.category);
          if (categoryElement) {
            data.category = categoryElement.textContent?.trim();
          }
        }

        // 辅助函数：提取数字
        function extractNumber(text: string | undefined): number | undefined {
          if (!text) return undefined;
          const match = text.match(/[\d,]+/);
          if (match) {
            return parseInt(match[0].replace(/,/g, ''), 10);
          }
          return undefined;
        }

        // 辅助函数：提取评分
        function extractRating(text: string | undefined): number | undefined {
          if (!text) return undefined;
          const match = text.match(/[\d.]+/);
          if (match) {
            return parseFloat(match[0]);
          }
          return undefined;
        }

        return data;
      }, selectors, rule.dataProcessing);

      // 后处理数据
      const processedData = this.postProcessData(extractedData, rule);
      
      // 数据清洗
      const cleanedData = this.cleanExtractedData(processedData, rule);
      
      // 处理图片
      if (cleanedData.images && cleanedData.images.length > 0) {
        const imageUrls = cleanedData.images.map(img => img.url);
        const processedImages = await this.imageProcessor.processImages(imageUrls, rule);
        
        // 更新图片信息
        cleanedData.images = processedImages.map(processed => ({
          url: processed.processedUrl,
          alt: '',
          size: processed.quality === 'high' ? 'large' : processed.quality === 'medium' ? 'medium' : 'thumbnail'
        }));
      }
      
      return cleanedData;
    } catch (error) {
      console.error('数据提取失败:', error);
      return null;
    }
  }

  /**
   * 后处理提取的数据
   */
  private postProcessData(data: any, rule: CrawlerRule): ExtractedData {
    const processed: ExtractedData = { ...data };

    // 处理文本清理
    if (rule.dataProcessing.textCleanup.removeHtml) {
      processed.title = this.removeHtml(processed.title);
      processed.description = this.removeHtml(processed.description);
    }

    if (rule.dataProcessing.textCleanup.trimWhitespace) {
      processed.title = processed.title?.trim();
      processed.description = processed.description?.trim();
    }

    // 处理价格提取
    if (processed.priceText && rule.dataProcessing.priceExtraction.regex) {
      const priceMatch = processed.priceText.match(new RegExp(rule.dataProcessing.priceExtraction.regex));
      if (priceMatch) {
        processed.price = parseFloat(priceMatch[1] || priceMatch[0]);
      }
    }

    // 检查免费关键词
    if (processed.priceText && rule.dataProcessing.priceExtraction.freeKeywords) {
      const freeKeywords = rule.dataProcessing.priceExtraction.freeKeywords;
      processed.isFree = freeKeywords.some(keyword => 
        processed.priceText?.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // 处理图片URL
    if (processed.images && rule.dataProcessing.imageProcessing.baseUrl) {
      processed.images = processed.images.map(img => ({
        ...img,
        url: this.resolveImageUrl(img.url, rule.dataProcessing.imageProcessing.baseUrl!)
      }));
    }

    // 处理日期
    if (data.uploadDateText && rule.dataProcessing.dateProcessing.format) {
      processed.uploadDate = this.parseDate(data.uploadDateText, rule.dataProcessing.dateProcessing.format);
    }

    return processed;
  }

  /**
   * 移除HTML标签
   */
  private removeHtml(text?: string): string | undefined {
    if (!text) return text;
    return text.replace(/<[^>]*>/g, '').trim();
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
   * 解析日期
   */
  private parseDate(dateText: string, format: string): Date | undefined {
    try {
      // 简单的日期解析，可以根据需要扩展
      const date = new Date(dateText);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * 清洗提取的数据
   */
  private cleanExtractedData(data: ExtractedData, rule: CrawlerRule): ExtractedData {
    // 使用数据清洗工具清洗文本
    if (data.title) {
      data.title = DataCleaner['cleanText'](data.title, rule.dataProcessing.textCleanup);
    }
    
    if (data.description) {
      data.description = DataCleaner['cleanText'](data.description, rule.dataProcessing.textCleanup);
    }

    // 清洗标签
    if (data.tags) {
      data.tags = data.tags
        .map(tag => DataCleaner['cleanText'](tag, rule.dataProcessing.textCleanup))
        .filter(tag => tag && tag.length > 0)
        .slice(0, 20); // 限制标签数量
    }

    return data;
  }

  /**
   * 验证提取的数据质量
   */
  validateExtractedData(data: ExtractedData, rule: CrawlerRule): boolean {
    const quality = rule.qualityControl;

    // 检查标题长度
    if (quality.minTitleLength && (!data.title || data.title.length < quality.minTitleLength)) {
      return false;
    }

    // 检查是否需要图片
    if (quality.requireImage && (!data.images || data.images.length === 0)) {
      return false;
    }

    // 检查是否需要价格
    if (quality.requirePrice && data.price === undefined && !data.isFree) {
      return false;
    }

    return true;
  }

  /**
   * 转换智能提取结果为标准格式
   */
  private convertSmartResultToExtractedData(smartResult: any): ExtractedData {
    return {
      title: smartResult.title,
      description: smartResult.description,
      images: smartResult.images,
      price: smartResult.price,
      isFree: smartResult.isFree,
      priceText: smartResult.priceText,
      fileFormat: smartResult.fileFormat,
      fileSize: smartResult.fileSize,
      downloadCount: smartResult.downloadCount,
      viewCount: smartResult.viewCount,
      rating: smartResult.rating,
      reviewCount: smartResult.reviewCount,
      category: smartResult.category,
      tags: smartResult.tags,
      author: smartResult.author,
      authorUrl: smartResult.authorUrl,
      authorAvatar: smartResult.authorAvatar,
      uploadDate: smartResult.uploadDate
    };
  }

  /**
   * 验证并评估数据质量
   */
  validateAndScoreData(result: any, rule: CrawlerRule): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    // 使用数据验证工具
    const validation = DataValidator.validateExtractedResult(result, rule);
    
    return {
      isValid: validation.isValid,
      score: validation.score,
      issues: [
        ...validation.errors.map(e => e.message),
        ...validation.warnings.map(w => w.message)
      ]
    };
  }
}