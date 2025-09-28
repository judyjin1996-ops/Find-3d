/**
 * 数据清洗工具
 * 负责清理和标准化爬取的数据
 */

import type { ExtractedMaterialResult, CrawlerRule } from '../types/crawler';

export class DataCleaner {
  /**
   * 清洗提取的结果数据
   */
  static cleanExtractedResult(result: ExtractedMaterialResult, rule: CrawlerRule): ExtractedMaterialResult {
    const cleaned = { ...result };

    // 清洗文本字段
    cleaned.title = this.cleanText(cleaned.title, rule.dataProcessing.textCleanup);
    cleaned.description = this.cleanText(cleaned.description, rule.dataProcessing.textCleanup);

    // 清洗图片数据
    cleaned.previewImages = this.cleanImages(cleaned.previewImages, rule);

    // 清洗价格数据
    cleaned.pricing = this.cleanPricing(cleaned.pricing, rule);

    // 清洗统计数据
    cleaned.statistics = this.cleanStatistics(cleaned.statistics);

    // 清洗标签数据
    cleaned.categorization.tags = this.cleanTags(cleaned.categorization.tags);

    // 清洗作者信息
    if (cleaned.author) {
      cleaned.author = this.cleanAuthor(cleaned.author);
    }

    // 清洗时间数据
    cleaned.timestamps = this.cleanTimestamps(cleaned.timestamps);

    return cleaned;
  }

  /**
   * 清洗文本内容
   */
  private static cleanText(text: string | undefined, config: CrawlerRule['dataProcessing']['textCleanup']): string | undefined {
    if (!text) return text;

    let cleaned = text;

    // 移除HTML标签
    if (config.removeHtml) {
      cleaned = cleaned.replace(/<[^>]*>/g, '');
      // 解码HTML实体
      cleaned = this.decodeHtmlEntities(cleaned);
    }

    // 清理空白字符
    if (config.trimWhitespace) {
      cleaned = cleaned.trim();
      // 将多个连续空格替换为单个空格
      cleaned = cleaned.replace(/\s+/g, ' ');
    }

    // 移除空行
    if (config.removeEmptyLines) {
      cleaned = cleaned.replace(/\n\s*\n/g, '\n');
    }

    // 移除特殊字符和控制字符
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

    // 移除常见的垃圾文本
    cleaned = this.removeJunkText(cleaned);

    return cleaned || undefined;
  }

  /**
   * 清洗图片数据
   */
  private static cleanImages(
    images: ExtractedMaterialResult['previewImages'], 
    rule: CrawlerRule
  ): ExtractedMaterialResult['previewImages'] {
    if (!images || images.length === 0) return [];

    return images
      .map(img => ({
        ...img,
        url: this.cleanImageUrl(img.url, rule.dataProcessing.imageProcessing.baseUrl),
        alt: this.cleanText(img.alt, { removeHtml: true, trimWhitespace: true, removeEmptyLines: false })
      }))
      .filter(img => this.isValidImageUrl(img.url))
      .slice(0, 10); // 限制图片数量
  }

  /**
   * 清洗价格数据
   */
  private static cleanPricing(
    pricing: ExtractedMaterialResult['pricing'], 
    rule: CrawlerRule
  ): ExtractedMaterialResult['pricing'] {
    const cleaned = { ...pricing };

    // 清洗价格文本
    if (cleaned.priceText) {
      cleaned.priceText = this.cleanText(cleaned.priceText, { 
        removeHtml: true, 
        trimWhitespace: true, 
        removeEmptyLines: false 
      });

      // 从价格文本中提取数字价格
      if (cleaned.price === undefined && cleaned.priceText) {
        const extractedPrice = this.extractPriceFromText(cleaned.priceText, rule.dataProcessing.priceExtraction);
        if (extractedPrice !== null) {
          cleaned.price = extractedPrice;
        }
      }

      // 检查免费关键词
      if (rule.dataProcessing.priceExtraction.freeKeywords) {
        const isFree = rule.dataProcessing.priceExtraction.freeKeywords.some(keyword =>
          cleaned.priceText?.toLowerCase().includes(keyword.toLowerCase())
        );
        if (isFree) {
          cleaned.isFree = true;
          cleaned.price = 0;
        }
      }
    }

    // 验证价格数据
    if (cleaned.price !== undefined) {
      cleaned.price = Math.max(0, cleaned.price); // 确保价格非负
      if (cleaned.price === 0) {
        cleaned.isFree = true;
      }
    }

    // 处理折扣信息
    if (cleaned.originalPrice && cleaned.price && cleaned.originalPrice > cleaned.price) {
      cleaned.discount = Math.round(((cleaned.originalPrice - cleaned.price) / cleaned.originalPrice) * 100);
    }

    return cleaned;
  }

  /**
   * 清洗统计数据
   */
  private static cleanStatistics(statistics: ExtractedMaterialResult['statistics']): ExtractedMaterialResult['statistics'] {
    const cleaned = { ...statistics };

    // 确保数值类型正确且非负
    if (cleaned.downloadCount !== undefined) {
      cleaned.downloadCount = Math.max(0, Math.floor(Number(cleaned.downloadCount) || 0));
    }

    if (cleaned.viewCount !== undefined) {
      cleaned.viewCount = Math.max(0, Math.floor(Number(cleaned.viewCount) || 0));
    }

    if (cleaned.likeCount !== undefined) {
      cleaned.likeCount = Math.max(0, Math.floor(Number(cleaned.likeCount) || 0));
    }

    if (cleaned.reviewCount !== undefined) {
      cleaned.reviewCount = Math.max(0, Math.floor(Number(cleaned.reviewCount) || 0));
    }

    // 清洗评分数据
    if (cleaned.rating !== undefined) {
      cleaned.rating = Math.max(0, Math.min(5, Number(cleaned.rating) || 0));
      // 保留一位小数
      cleaned.rating = Math.round(cleaned.rating * 10) / 10;
    }

    return cleaned;
  }

  /**
   * 清洗标签数据
   */
  private static cleanTags(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];

    return tags
      .map(tag => this.cleanText(tag, { removeHtml: true, trimWhitespace: true, removeEmptyLines: false }))
      .filter(tag => tag && tag.length > 0 && tag.length <= 50) // 过滤空标签和过长标签
      .map(tag => tag!.toLowerCase()) // 转换为小写
      .filter((tag, index, array) => array.indexOf(tag) === index) // 去重
      .slice(0, 20); // 限制标签数量
  }

  /**
   * 清洗作者信息
   */
  private static cleanAuthor(author: ExtractedMaterialResult['author']): ExtractedMaterialResult['author'] {
    if (!author) return undefined;

    const cleaned = { ...author };

    // 清洗作者名称
    cleaned.name = this.cleanText(cleaned.name, { 
      removeHtml: true, 
      trimWhitespace: true, 
      removeEmptyLines: false 
    });

    // 验证和清洗URL
    if (cleaned.profileUrl && !this.isValidUrl(cleaned.profileUrl)) {
      cleaned.profileUrl = undefined;
    }

    if (cleaned.avatar && !this.isValidImageUrl(cleaned.avatar)) {
      cleaned.avatar = undefined;
    }

    // 如果名称为空，返回undefined
    if (!cleaned.name) {
      return undefined;
    }

    return cleaned;
  }

  /**
   * 清洗时间数据
   */
  private static cleanTimestamps(timestamps: ExtractedMaterialResult['timestamps']): ExtractedMaterialResult['timestamps'] {
    const cleaned = { ...timestamps };

    // 验证上传日期
    if (cleaned.uploadDate && !(cleaned.uploadDate instanceof Date)) {
      const parsed = this.parseDate(cleaned.uploadDate);
      cleaned.uploadDate = parsed;
    }

    // 验证更新日期
    if (cleaned.lastUpdated && !(cleaned.lastUpdated instanceof Date)) {
      const parsed = this.parseDate(cleaned.lastUpdated);
      cleaned.lastUpdated = parsed;
    }

    // 确保日期逻辑正确
    if (cleaned.uploadDate && cleaned.lastUpdated && cleaned.lastUpdated < cleaned.uploadDate) {
      cleaned.lastUpdated = cleaned.uploadDate;
    }

    // 确保日期不是未来时间
    const now = new Date();
    if (cleaned.uploadDate && cleaned.uploadDate > now) {
      cleaned.uploadDate = undefined;
    }
    if (cleaned.lastUpdated && cleaned.lastUpdated > now) {
      cleaned.lastUpdated = undefined;
    }

    return cleaned;
  }

  /**
   * 解码HTML实体
   */
  private static decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };

    return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity);
  }

  /**
   * 移除垃圾文本
   */
  private static removeJunkText(text: string): string {
    // 移除常见的垃圾文本模式
    const junkPatterns = [
      /点击.*?下载/gi,
      /立即.*?下载/gi,
      /免费.*?注册/gi,
      /更多.*?资源/gi,
      /关注.*?获取/gi,
      /扫码.*?关注/gi,
      /微信.*?公众号/gi,
      /QQ.*?群/gi,
      /广告/gi,
      /推广/gi
    ];

    let cleaned = text;
    junkPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned.trim();
  }

  /**
   * 清洗图片URL
   */
  private static cleanImageUrl(url: string, baseUrl?: string): string {
    if (!url) return '';

    let cleaned = url.trim();

    // 处理相对URL
    if (baseUrl) {
      if (cleaned.startsWith('//')) {
        cleaned = 'https:' + cleaned;
      } else if (cleaned.startsWith('/')) {
        cleaned = baseUrl.replace(/\/$/, '') + cleaned;
      } else if (!cleaned.startsWith('http')) {
        cleaned = baseUrl.replace(/\/$/, '') + '/' + cleaned;
      }
    }

    // 移除URL中的多余参数（保留重要参数）
    try {
      const urlObj = new URL(cleaned);
      const importantParams = ['w', 'h', 'width', 'height', 'size', 'quality', 'format'];
      const newParams = new URLSearchParams();
      
      importantParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          newParams.set(param, urlObj.searchParams.get(param)!);
        }
      });

      urlObj.search = newParams.toString();
      cleaned = urlObj.toString();
    } catch {
      // 如果URL解析失败，保持原样
    }

    return cleaned;
  }

  /**
   * 从文本中提取价格
   */
  private static extractPriceFromText(text: string, config: CrawlerRule['dataProcessing']['priceExtraction']): number | null {
    if (!text) return null;

    // 使用配置的正则表达式
    if (config.regex) {
      const match = text.match(new RegExp(config.regex));
      if (match) {
        const price = parseFloat(match[1] || match[0]);
        return isNaN(price) ? null : price;
      }
    }

    // 默认价格提取逻辑
    const pricePatterns = [
      /¥\s*(\d+(?:\.\d+)?)/,
      /￥\s*(\d+(?:\.\d+)?)/,
      /\$\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)\s*元/,
      /(\d+(?:\.\d+)?)\s*币/,
      /价格[：:]\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)/
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseFloat(match[1]);
        if (!isNaN(price)) {
          return price;
        }
      }
    }

    return null;
  }

  /**
   * 解析日期
   */
  private static parseDate(dateInput: any): Date | undefined {
    if (dateInput instanceof Date) {
      return dateInput;
    }

    if (typeof dateInput === 'string') {
      // 尝试多种日期格式
      const dateFormats = [
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{4})年(\d{1,2})月(\d{1,2})日/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{1,2})-(\d{1,2})-(\d{4})/
      ];

      for (const format of dateFormats) {
        const match = dateInput.match(format);
        if (match) {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      // 尝试直接解析
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    if (typeof dateInput === 'number') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return undefined;
  }

  /**
   * 验证URL格式
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证图片URL
   */
  private static isValidImageUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const urlLower = url.toLowerCase();

    return imageExtensions.some(ext => urlLower.includes(ext)) ||
           urlLower.includes('image') ||
           urlLower.includes('img') ||
           urlLower.includes('thumb') ||
           urlLower.includes('preview');
  }

  /**
   * 批量清洗结果
   */
  static cleanBatchResults(results: ExtractedMaterialResult[], rule: CrawlerRule): ExtractedMaterialResult[] {
    const cleaned = results.map(result => this.cleanExtractedResult(result, rule));
    
    // 去重处理
    return this.removeDuplicates(cleaned, rule.qualityControl.duplicateDetection);
  }

  /**
   * 去除重复结果
   */
  private static removeDuplicates(results: ExtractedMaterialResult[], enableDeduplication: boolean): ExtractedMaterialResult[] {
    if (!enableDeduplication) return results;

    const seen = new Set<string>();
    const unique: ExtractedMaterialResult[] = [];

    for (const result of results) {
      // 使用标题和来源URL作为去重标识
      const key = `${result.title?.toLowerCase()}_${result.sourceUrl}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    console.log(`🔄 去重处理: ${results.length} -> ${unique.length} (移除 ${results.length - unique.length} 个重复项)`);
    
    return unique;
  }
}