import type { CacheItem } from '../types';

/**
 * 缓存服务
 * 提供内存缓存和本地存储缓存功能
 */
class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>();
  private maxMemorySize = 100; // 最大内存缓存项数
  private defaultTTL = 5 * 60 * 1000; // 默认5分钟过期

  /**
   * 生成缓存键
   */
  private generateKey(prefix: string, params: any): string {
    const paramStr = typeof params === 'string' ? params : JSON.stringify(params);
    return `${prefix}:${btoa(paramStr)}`;
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expiration;
  }

  /**
   * 清理过期的内存缓存
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiration) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * 限制内存缓存大小
   */
  private limitMemoryCacheSize(): void {
    if (this.memoryCache.size > this.maxMemorySize) {
      // 删除最旧的缓存项
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - this.maxMemorySize);
      toDelete.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * 设置内存缓存
   */
  setMemoryCache<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiration: Date.now() + ttl,
      key
    };

    this.memoryCache.set(key, cacheItem);
    this.limitMemoryCacheSize();
  }

  /**
   * 获取内存缓存
   */
  getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 设置本地存储缓存
   */
  setLocalCache<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiration: Date.now() + ttl,
        key
      };

      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('无法设置本地存储缓存:', error);
    }
  }

  /**
   * 获取本地存储缓存
   */
  getLocalCache<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) {
        return null;
      }

      const item: CacheItem<T> = JSON.parse(itemStr);
      
      if (this.isExpired(item)) {
        localStorage.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('无法获取本地存储缓存:', error);
      return null;
    }
  }

  /**
   * 搜索结果缓存
   */
  cacheSearchResults(query: string, filters: any, results: any, ttl?: number): void {
    const key = this.generateKey('search', { query, filters });
    
    // 同时缓存到内存和本地存储
    this.setMemoryCache(key, results, ttl);
    this.setLocalCache(key, results, ttl);
  }

  /**
   * 获取搜索结果缓存
   */
  getCachedSearchResults(query: string, filters: any): any | null {
    const key = this.generateKey('search', { query, filters });
    
    // 优先从内存缓存获取
    let cached = this.getMemoryCache(key);
    if (cached) {
      return cached;
    }

    // 从本地存储获取
    cached = this.getLocalCache(key);
    if (cached) {
      // 同时设置到内存缓存
      this.setMemoryCache(key, cached);
      return cached;
    }

    return null;
  }

  /**
   * 网站配置缓存
   */
  cacheWebsiteConfig(config: any, ttl?: number): void {
    const key = 'website_config';
    this.setMemoryCache(key, config, ttl);
    this.setLocalCache(key, config, ttl);
  }

  /**
   * 获取网站配置缓存
   */
  getCachedWebsiteConfig(): any | null {
    const key = 'website_config';
    
    let cached = this.getMemoryCache(key);
    if (cached) {
      return cached;
    }

    cached = this.getLocalCache(key);
    if (cached) {
      this.setMemoryCache(key, cached);
      return cached;
    }

    return null;
  }

  /**
   * 图片缓存（使用 URL 作为键）
   */
  cacheImage(url: string, blob: Blob, ttl?: number): void {
    const key = this.generateKey('image', url);
    this.setMemoryCache(key, blob, ttl);
  }

  /**
   * 获取图片缓存
   */
  getCachedImage(url: string): Blob | null {
    const key = this.generateKey('image', url);
    return this.getMemoryCache(key);
  }

  /**
   * 清理所有缓存
   */
  clearAllCache(): void {
    // 清理内存缓存
    this.memoryCache.clear();

    // 清理本地存储缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('search:') || key.startsWith('image:') || key === 'website_config') {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('无法清理本地存储缓存:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache(): void {
    // 清理内存缓存
    this.cleanupMemoryCache();

    // 清理本地存储缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (item.expiration && Date.now() > item.expiration) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // 忽略解析错误，可能不是缓存项
        }
      });
    } catch (error) {
      console.warn('无法清理本地存储缓存:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    memorySize: number;
    localStorageSize: number;
    hitRate: number;
  } {
    let localStorageSize = 0;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          localStorageSize += item.length;
        }
      });
    } catch (error) {
      console.warn('无法获取本地存储大小:', error);
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize,
      hitRate: 0 // TODO: 实现命中率统计
    };
  }

  /**
   * 预加载缓存
   */
  async preloadCache(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          this.cacheImage(url, blob);
        }
      } catch (error) {
        console.warn(`预加载缓存失败: ${url}`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 设置缓存配置
   */
  configure(options: {
    maxMemorySize?: number;
    defaultTTL?: number;
  }): void {
    if (options.maxMemorySize !== undefined) {
      this.maxMemorySize = options.maxMemorySize;
    }
    if (options.defaultTTL !== undefined) {
      this.defaultTTL = options.defaultTTL;
    }
  }
}

// 创建全局实例
export const cacheService = new CacheService();

// 定期清理过期缓存
setInterval(() => {
  cacheService.cleanupExpiredCache();
}, 10 * 60 * 1000); // 每10分钟清理一次

export default cacheService;