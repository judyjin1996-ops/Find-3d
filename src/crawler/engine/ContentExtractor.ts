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
      
      const extractedData = await page.evaluate((selectors, processing, baseUrl) => {
        const data: any = {};

        // 提取标题 - 尝试多个选择器
        if (selectors.title) {
          const titleSelectors = selectors.title.split(',').map(s => s.trim());
          for (const selector of titleSelectors) {
            const titleElement = document.querySelector(selector);
            if (titleElement && titleElement.textContent?.trim()) {
              data.title = titleElement.textContent.trim();
              break;
            }
          }
        }

        // 提取描述 - 尝试多个选择器
        if (selectors.description) {
          const descSelectors = selectors.description.split(',').map(s => s.trim());
          for (const selector of descSelectors) {
            const descElement = document.querySelector(selector);
            if (descElement && descElement.textContent?.trim()) {
              data.description = descElement.textContent.trim();
              break;
            }
          }
        }

        // 提取图片 - 改进的图片提取逻辑
        if (selectors.images) {
          const imageSelectors = selectors.images.split(',').map(s => s.trim());
          const allImages: any[] = [];
          
          for (const selector of imageSelectors) {
            const imageElements = document.querySelectorAll(selector);
            Array.from(imageElements).forEach((img: any) => {
              let imageUrl = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original');
              
              if (imageUrl) {
                // 处理相对URL
                if (imageUrl.startsWith('/')) {
                  imageUrl = baseUrl + imageUrl;
                } else if (imageUrl.startsWith('./')) {
                  imageUrl = baseUrl + imageUrl.substring(1);
                } else if (!imageUrl.startsWith('http')) {
                  imageUrl = baseUrl + '/' + imageUrl;
                }
                
                // 过滤掉明显不是预览图的图片
                const isValidPreview = !imageUrl.includes('avatar') && 
                                     !imageUrl.includes('icon') && 
                                     !imageUrl.includes('logo') &&
                                     !imageUrl.includes('emoji') &&
                                     (imageUrl.includes('wp-content') || 
                                      imageUrl.includes('upload') || 
                                      imageUrl.includes('image') ||
                                      imageUrl.includes('thumb'));
                
                if (isValidPreview) {
                  allImages.push({
                    url: imageUrl,
                    alt: img.alt || '',
                    size: 'medium' as const
                  });
                }
              }
            });
          }
          
          // 去重并限制数量
          const uniqueImages = allImages.filter((img, index, self) => 
            index === self.findIndex(i => i.url === img.url)
          );
          
          data.images = uniqueImages.slice(0, 5); // 最多5张图片
        }

        // 提取价格信息 - 改进的价格提取
        if (selectors.price) {
          const priceSelectors = selectors.price.split(',').map(s => s.trim());
          for (const selector of priceSelectors) {
            const priceElement = document.querySelector(selector);
            if (priceElement && priceElement.textContent?.trim()) {
              data.priceText = priceElement.textContent.trim();
              break;
            }
          }
        }

        // 检查免费标识 - 多种方式检测免费内容
        data.isFree = false;
        
        // 1. 通过专门的免费标识元素
        if (selectors.freeIndicator) {
          const freeSelectors = selectors.freeIndicator.split(',').map(s => s.trim());
          for (const selector of freeSelectors) {
            const freeElement = document.querySelector(selector);
            if (freeElement) {
              data.isFree = true;
              break;
            }
          }
        }
        
        // 2. 通过价格文本判断
        if (!data.isFree && data.priceText) {
          const freeKeywords = ['免费', 'free', '0元', '0.00', '免费下载'];
          data.isFree = freeKeywords.some(keyword => 
            data.priceText.toLowerCase().includes(keyword.toLowerCase())
          );
        }
        
        // 3. 通过页面内容判断
        if (!data.isFree) {
          const pageText = document.body.textContent || '';
          const freeIndicators = ['免费下载', '免费资源', 'free download'];
          data.isFree = freeIndicators.some(indicator => 
            pageText.toLowerCase().includes(indicator.toLowerCase())
          );
        }

        // 提取文件信息 - 改进的文件信息提取
        if (selectors.fileInfo?.format) {
          const formatSelectors = selectors.fileInfo.format.split(',').map(s => s.trim());
          for (const selector of formatSelectors) {
            const formatElement = document.querySelector(selector);
            if (formatElement && formatElement.textContent?.trim()) {
              data.fileFormat = formatElement.textContent.trim();
              break;
            }
          }
        }

        if (selectors.fileInfo?.size) {
          const sizeSelectors = selectors.fileInfo.size.split(',').map(s => s.trim());
          for (const selector of sizeSelectors) {
            const sizeElement = document.querySelector(selector);
            if (sizeElement && sizeElement.textContent?.trim()) {
              data.fileSize = sizeElement.textContent.trim();
              break;
            }
          }
        }

        // 如果没有找到明确的文件信息，尝试从页面内容中提取
        if (!data.fileFormat || !data.fileSize) {
          const contentText = document.body.textContent || '';
          
          // 提取文件格式
          if (!data.fileFormat) {
            const formatMatch = contentText.match(/格式[：:]\s*([A-Za-z0-9]+)|文件格式[：:]\s*([A-Za-z0-9]+)|\.([A-Za-z0-9]{2,4})\s*文件/i);
            if (formatMatch) {
              data.fileFormat = (formatMatch[1] || formatMatch[2] || formatMatch[3]).toUpperCase();
            }
          }
          
          // 提取文件大小
          if (!data.fileSize) {
            const sizeMatch = contentText.match(/大小[：:]\s*([\d.]+\s*[KMGT]?B)|文件大小[：:]\s*([\d.]+\s*[KMGT]?B)|([\d.]+\s*[KMGT]B)/i);
            if (sizeMatch) {
              data.fileSize = (sizeMatch[1] || sizeMatch[2] || sizeMatch[3]).trim();
            }
          }
        }

        // 提取统计信息 - 改进的统计信息提取
        if (selectors.stats?.downloads) {
          const downloadSelectors = selectors.stats.downloads.split(',').map(s => s.trim());
          for (const selector of downloadSelectors) {
            const downloadsElement = document.querySelector(selector);
            if (downloadsElement) {
              const downloadsText = downloadsElement.textContent?.trim();
              const count = extractNumber(downloadsText);
              if (count !== undefined) {
                data.downloadCount = count;
                break;
              }
            }
          }
        }

        if (selectors.stats?.views) {
          const viewSelectors = selectors.stats.views.split(',').map(s => s.trim());
          for (const selector of viewSelectors) {
            const viewsElement = document.querySelector(selector);
            if (viewsElement) {
              const viewsText = viewsElement.textContent?.trim();
              const count = extractNumber(viewsText);
              if (count !== undefined) {
                data.viewCount = count;
                break;
              }
            }
          }
        }

        if (selectors.stats?.rating) {
          const ratingSelectors = selectors.stats.rating.split(',').map(s => s.trim());
          for (const selector of ratingSelectors) {
            const ratingElement = document.querySelector(selector);
            if (ratingElement) {
              const ratingText = ratingElement.textContent?.trim();
              const rating = extractRating(ratingText);
              if (rating !== undefined) {
                data.rating = rating;
                break;
              }
            }
          }
        }

        // 如果没有找到明确的统计信息，尝试从页面内容中提取
        if (data.downloadCount === undefined || data.viewCount === undefined) {
          const contentText = document.body.textContent || '';
          
          if (data.downloadCount === undefined) {
            const downloadMatch = contentText.match(/下载[：:]?\s*([\d,]+)|下载次数[：:]?\s*([\d,]+)|已下载\s*([\d,]+)/i);
            if (downloadMatch) {
              data.downloadCount = extractNumber(downloadMatch[1] || downloadMatch[2] || downloadMatch[3]);
            }
          }
          
          if (data.viewCount === undefined) {
            const viewMatch = contentText.match(/浏览[：:]?\s*([\d,]+)|查看次数[：:]?\s*([\d,]+)|已浏览\s*([\d,]+)/i);
            if (viewMatch) {
              data.viewCount = extractNumber(viewMatch[1] || viewMatch[2] || viewMatch[3]);
            }
          }
        }

        // 提取元数据 - 改进的元数据提取
        if (selectors.metadata?.author) {
          const authorSelectors = selectors.metadata.author.split(',').map(s => s.trim());
          for (const selector of authorSelectors) {
            const authorElement = document.querySelector(selector);
            if (authorElement && authorElement.textContent?.trim()) {
              data.author = authorElement.textContent.trim();
              break;
            }
          }
        }

        if (selectors.metadata?.tags) {
          const tagSelectors = selectors.metadata.tags.split(',').map(s => s.trim());
          const allTags: string[] = [];
          
          for (const selector of tagSelectors) {
            const tagsElements = document.querySelectorAll(selector);
            Array.from(tagsElements).forEach((tag: any) => {
              const tagText = tag.textContent?.trim();
              if (tagText && !allTags.includes(tagText)) {
                allTags.push(tagText);
              }
            });
          }
          
          data.tags = allTags.slice(0, 10); // 限制标签数量
        }

        if (selectors.metadata?.category) {
          const categorySelectors = selectors.metadata.category.split(',').map(s => s.trim());
          for (const selector of categorySelectors) {
            const categoryElement = document.querySelector(selector);
            if (categoryElement && categoryElement.textContent?.trim()) {
              data.category = categoryElement.textContent.trim();
              break;
            }
          }
        }

        // 辅助函数：提取数字
        function extractNumber(text: string | undefined): number | undefined {
          if (!text) return undefined;
          // 匹配数字，支持逗号分隔符
          const match = text.match(/([\d,]+)/);
          if (match) {
            const num = parseInt(match[1].replace(/,/g, ''), 10);
            return isNaN(num) ? undefined : num;
          }
          return undefined;
        }

        // 辅助函数：提取评分
        function extractRating(text: string | undefined): number | undefined {
          if (!text) return undefined;
          // 匹配小数评分
          const match = text.match(/([\d.]+)/);
          if (match) {
            const rating = parseFloat(match[1]);
            return isNaN(rating) ? undefined : Math.min(rating, 5); // 限制最大评分为5
          }
          return undefined;
        }

        return data;
      }, selectors, rule.dataProcessing, rule.baseUrl);

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