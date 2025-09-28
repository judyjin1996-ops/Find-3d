/**
 * 图片处理和缓存工具
 * 负责图片的下载、处理、缓存和优化
 */

import type { CrawlerRule } from '../types/crawler';

export interface ProcessedImage {
  originalUrl: string;
  processedUrl: string;
  localPath?: string;
  width?: number;
  height?: number;
  size: number; // 文件大小（字节）
  format: string;
  quality: 'low' | 'medium' | 'high';
  cached: boolean;
  processingTime: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'jpeg' | 'png' | 'webp';
  enableCache?: boolean;
  cacheExpiry?: number; // 毫秒
}

export class ImageProcessor {
  private cache: Map<string, ProcessedImage> = new Map();
  private readonly defaultOptions: ImageProcessingOptions = {
    maxWidth: 800,
    maxHeight: 600,
    quality: 80,
    format: 'jpeg',
    enableCache: true,
    cacheExpiry: 24 * 60 * 60 * 1000 // 24小时
  };

  /**
   * 处理图片列表
   */
  async processImages(
    imageUrls: string[], 
    rule: CrawlerRule, 
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ProcessedImage[]> {
    const processingOptions = { ...this.defaultOptions, ...options };
    const results: ProcessedImage[] = [];

    console.log(`🖼️ 开始处理 ${imageUrls.length} 张图片`);

    for (const url of imageUrls) {
      try {
        const processed = await this.processImage(url, rule, processingOptions);
        if (processed) {
          results.push(processed);
        }
      } catch (error) {
        console.warn(`⚠️ 图片处理失败: ${url}`, error);
      }
    }

    console.log(`✅ 图片处理完成: ${results.length}/${imageUrls.length} 成功`);
    return results;
  }

  /**
   * 处理单张图片
   */
  async processImage(
    imageUrl: string, 
    rule: CrawlerRule, 
    options: ImageProcessingOptions
  ): Promise<ProcessedImage | null> {
    const startTime = Date.now();
    
    try {
      // 标准化URL
      const normalizedUrl = this.normalizeImageUrl(imageUrl, rule);
      
      // 检查缓存
      if (options.enableCache && this.cache.has(normalizedUrl)) {
        const cached = this.cache.get(normalizedUrl)!;
        if (this.isCacheValid(cached, options.cacheExpiry!)) {
          console.log(`📋 使用缓存图片: ${normalizedUrl}`);
          return { ...cached, processingTime: Date.now() - startTime };
        } else {
          this.cache.delete(normalizedUrl);
        }
      }

      // 验证图片URL
      if (!this.isValidImageUrl(normalizedUrl)) {
        console.warn(`⚠️ 无效的图片URL: ${normalizedUrl}`);
        return null;
      }

      // 获取图片信息
      const imageInfo = await this.getImageInfo(normalizedUrl);
      if (!imageInfo) {
        return null;
      }

      // 处理图片
      const processed: ProcessedImage = {
        originalUrl: imageUrl,
        processedUrl: normalizedUrl,
        width: imageInfo.width,
        height: imageInfo.height,
        size: imageInfo.size,
        format: imageInfo.format,
        quality: this.determineQuality(imageInfo),
        cached: false,
        processingTime: Date.now() - startTime
      };

      // 缓存结果
      if (options.enableCache) {
        this.cache.set(normalizedUrl, { ...processed, cached: true });
      }

      return processed;
      
    } catch (error) {
      console.error(`❌ 图片处理失败: ${imageUrl}`, error);
      return null;
    }
  }

  /**
   * 标准化图片URL
   */
  private normalizeImageUrl(url: string, rule: CrawlerRule): string {
    let normalized = url.trim();

    // 处理相对URL
    const baseUrl = rule.dataProcessing.imageProcessing.baseUrl || rule.baseUrl;
    
    if (normalized.startsWith('//')) {
      normalized = 'https:' + normalized;
    } else if (normalized.startsWith('/')) {
      normalized = baseUrl.replace(/\/$/, '') + normalized;
    } else if (!normalized.startsWith('http')) {
      normalized = baseUrl.replace(/\/$/, '') + '/' + normalized;
    }

    // 移除不必要的参数
    try {
      const urlObj = new URL(normalized);
      
      // 保留重要的图片参数
      const importantParams = ['w', 'h', 'width', 'height', 'size', 'quality', 'format', 'resize'];
      const newParams = new URLSearchParams();
      
      importantParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          newParams.set(param, urlObj.searchParams.get(param)!);
        }
      });

      urlObj.search = newParams.toString();
      normalized = urlObj.toString();
    } catch {
      // 如果URL解析失败，保持原样
    }

    return normalized;
  }

  /**
   * 验证图片URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      
      // 检查文件扩展名
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const urlLower = url.toLowerCase();
      
      return imageExtensions.some(ext => urlLower.includes(ext)) ||
             urlLower.includes('image') ||
             urlLower.includes('img') ||
             urlLower.includes('thumb') ||
             urlLower.includes('preview') ||
             urlLower.includes('photo');
    } catch {
      return false;
    }
  }

  /**
   * 获取图片信息
   */
  private async getImageInfo(url: string): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
  } | null> {
    try {
      // 在浏览器环境中，我们只能通过Image对象获取基本信息
      return new Promise((resolve) => {
        const img = new Image();
        let resolved = false;
        
        // 设置跨域属性 - 但不强制要求
        try {
          img.crossOrigin = 'anonymous';
        } catch (e) {
          // 忽略跨域设置错误
        }
        
        const resolveWithInfo = (width: number, height: number) => {
          if (resolved) return;
          resolved = true;
          resolve({
            width: width || 300,
            height: height || 200,
            size: 0, // 无法在浏览器中直接获取文件大小
            format: this.getImageFormat(url)
          });
        };
        
        img.onload = () => {
          const width = img.naturalWidth || img.width || 300;
          const height = img.naturalHeight || img.height || 200;
          console.log(`✅ 图片加载成功: ${url} (${width}x${height})`);
          resolveWithInfo(width, height);
        };
        
        img.onerror = (error) => {
          console.warn(`⚠️ 图片加载失败，使用默认尺寸: ${url}`);
          // 即使加载失败，也返回基本信息，让前端可以显示占位图
          resolveWithInfo(300, 200);
        };
        
        // 设置超时 - 减少等待时间
        setTimeout(() => {
          if (!resolved) {
            console.warn(`⏰ 图片加载超时，使用默认尺寸: ${url}`);
            resolveWithInfo(300, 200);
          }
        }, 3000); // 减少超时时间到3秒
        
        // 开始加载图片
        try {
          img.src = url;
        } catch (e) {
          console.warn(`❌ 图片URL无效: ${url}`);
          resolveWithInfo(300, 200);
        }
      });
    } catch (error) {
      console.error('获取图片信息失败:', error);
      // 返回默认信息而不是null
      return {
        width: 300,
        height: 200,
        size: 0,
        format: this.getImageFormat(url)
      };
    }
  }

  /**
   * 获取图片格式
   */
  private getImageFormat(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'jpeg';
    if (urlLower.includes('.png')) return 'png';
    if (urlLower.includes('.gif')) return 'gif';
    if (urlLower.includes('.webp')) return 'webp';
    if (urlLower.includes('.svg')) return 'svg';
    if (urlLower.includes('.bmp')) return 'bmp';
    
    return 'unknown';
  }

  /**
   * 确定图片质量等级
   */
  private determineQuality(imageInfo: { width: number; height: number; size: number }): 'low' | 'medium' | 'high' {
    const { width, height } = imageInfo;
    const pixels = width * height;

    if (pixels < 100000) { // 小于 100k 像素
      return 'low';
    } else if (pixels < 500000) { // 小于 500k 像素
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cached: ProcessedImage, expiry: number): boolean {
    // 在实际应用中，这里应该检查缓存时间戳
    // 由于我们在内存中缓存，这里简单返回true
    return true;
  }

  /**
   * 优化图片列表
   */
  optimizeImageList(images: ProcessedImage[], maxCount: number = 10): ProcessedImage[] {
    // 按质量和尺寸排序
    const sorted = images.sort((a, b) => {
      // 优先选择高质量图片
      const qualityScore = { high: 3, medium: 2, low: 1 };
      const aScore = qualityScore[a.quality];
      const bScore = qualityScore[b.quality];
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // 其次按像素数排序
      const aPixels = (a.width || 0) * (a.height || 0);
      const bPixels = (b.width || 0) * (b.height || 0);
      
      return bPixels - aPixels;
    });

    return sorted.slice(0, maxCount);
  }

  /**
   * 生成缩略图URL
   */
  generateThumbnailUrl(originalUrl: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizeMap = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    try {
      const url = new URL(originalUrl);
      const { width, height } = sizeMap[size];
      
      // 添加缩略图参数
      url.searchParams.set('w', width.toString());
      url.searchParams.set('h', height.toString());
      url.searchParams.set('fit', 'crop');
      
      return url.toString();
    } catch {
      return originalUrl;
    }
  }

  /**
   * 批量生成不同尺寸的图片
   */
  generateMultipleSizes(image: ProcessedImage): {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: this.generateThumbnailUrl(image.processedUrl, 'small'),
      medium: this.generateThumbnailUrl(image.processedUrl, 'medium'),
      large: this.generateThumbnailUrl(image.processedUrl, 'large'),
      original: image.processedUrl
    };
  }

  /**
   * 预加载图片
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // 即使失败也继续
        img.src = url;
      });
    });

    await Promise.all(promises);
    console.log(`📥 预加载完成: ${urls.length} 张图片`);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 图片缓存已清理');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    totalImages: number;
    cacheSize: number;
    hitRate: number;
  } {
    const totalImages = this.cache.size;
    const cachedImages = Array.from(this.cache.values()).filter(img => img.cached).length;
    
    return {
      totalImages,
      cacheSize: cachedImages,
      hitRate: totalImages > 0 ? cachedImages / totalImages : 0
    };
  }

  /**
   * 验证图片可访问性
   */
  async validateImageAccessibility(urls: string[]): Promise<{
    accessible: string[];
    inaccessible: string[];
  }> {
    const accessible: string[] = [];
    const inaccessible: string[] = [];

    for (const url of urls) {
      try {
        const isAccessible = await this.checkImageAccessibility(url);
        if (isAccessible) {
          accessible.push(url);
        } else {
          inaccessible.push(url);
        }
      } catch {
        inaccessible.push(url);
      }
    }

    return { accessible, inaccessible };
  }

  /**
   * 检查单个图片的可访问性
   */
  private async checkImageAccessibility(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      img.src = url;
    });
  }

  /**
   * 图片懒加载支持
   */
  createLazyLoadConfig(images: ProcessedImage[]): Array<{
    src: string;
    dataSrc: string;
    alt: string;
    loading: 'lazy' | 'eager';
  }> {
    return images.map((img, index) => ({
      src: index < 3 ? img.processedUrl : '', // 前3张立即加载
      dataSrc: img.processedUrl,
      alt: `预览图 ${index + 1}`,
      loading: index < 3 ? 'eager' : 'lazy'
    }));
  }
}