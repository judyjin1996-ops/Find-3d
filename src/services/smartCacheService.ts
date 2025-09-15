/**
 * 智能缓存服务
 * 实现多层缓存架构（内存、磁盘、远程）和智能缓存管理
 */

import { ExtractedMaterialResult } from '../crawler/types/crawler';
import { dataQualityManager, QualityMetrics } from '../utils/dataQualityManager';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  expiry: Date;
  size: number;
  accessCount: number;
  lastAccessed: Date;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  source: 'memory' | 'indexeddb' | 'localstorage' | 'remote';
}

export interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  categories: {
    searchResults: CacheCategoryStats;
    images: CacheCategoryStats;
    websiteData: CacheCategoryStats;
    rules: CacheCategoryStats;
  };
  performance: {
    avgAccessTime: number;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

export interface CacheCategoryStats {
  size: number;
  count: number;
  oldestItem: Date;
  newestItem: Date;
  hitRate: number;
}

export interface CacheConfig {
  maxMemorySize: number; // MB
  maxIndexedDBSize: number; // MB
  maxLocalStorageSize: number; // MB
  defaultTTL: number; // 毫秒
  cleanupInterval: number; // 毫秒
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface SearchCache extends CacheEntry {
  data: {
    query: string;
    websites: string[];
    results: ExtractedMaterialResult[];
    totalCount: number;
    searchTime: number;
    filters?: any;
  };
}

export interface ImageCache extends CacheEntry {
  data: {
    originalUrl: string;
    blob: Blob;
    mimeType: string;
    dimensions: { width: number; height: number };
  };
}

export interface WebsiteDataCache extends CacheEntry {
  data: {
    websiteId: string;
    config: any;
    lastUpdated: Date;
    version: string;
  };
}

export class SmartCacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private indexedDB: IDBDatabase | null = null;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxMemorySize: 50, // 50MB
      maxIndexedDBSize: 500, // 500MB
      maxLocalStorageSize: 10, // 10MB
      defaultTTL: 24 * 60 * 60 * 1000, // 24小时
      cleanupInterval: 30 * 60 * 1000, // 30分钟
      compressionEnabled: true,
      encryptionEnabled: false,
      ...config
    };

    this.stats = {
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      categories: {
        searchResults: { size: 0, count: 0, oldestItem: new Date(), newestItem: new Date(), hitRate: 0 },
        images: { size: 0, count: 0, oldestItem: new Date(), newestItem: new Date(), hitRate: 0 },
        websiteData: { size: 0, count: 0, oldestItem: new Date(), newestItem: new Date(), hitRate: 0 },
        rules: { size: 0, count: 0, oldestItem: new Date(), newestItem: new Date(), hitRate: 0 }
      },
      performance: {
        avgAccessTime: 0,
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0
      }
    };
  }

  /**
   * 初始化缓存服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 初始化智能缓存服务...');
      
      // 初始化IndexedDB
      await this.initIndexedDB();
      
      // 加载现有缓存统计
      await this.loadCacheStats();
      
      // 启动清理定时器
      this.startCleanupTimer();
      
      this.isInitialized = true;
      console.log('✅ 智能缓存服务初始化完成');
    } catch (error) {
      console.error('❌ 智能缓存服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SmartCacheDB', 1);

      request.onerror = () => {
        console.warn('⚠️ IndexedDB不可用，将使用LocalStorage');
        resolve();
      };

      request.onsuccess = (event) => {
        this.indexedDB = (event.target as IDBOpenDBRequest).result;
        console.log('✅ IndexedDB初始化完成');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expiry', 'expiry', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });
  }

  /**
   * 生成缓存键
   */
  private generateKey(category: string, identifier: string | object): string {
    const id = typeof identifier === 'string' ? identifier : JSON.stringify(identifier);
    return `${category}:${btoa(encodeURIComponent(id)).replace(/[+/=]/g, '')}`;
  }

  /**
   * 计算数据大小（字节）
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // 估算UTF-16字符大小
    }
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiry;
  }

  /**
   * 压缩数据
   */
  private async compressData(data: any): Promise<string> {
    if (!this.config.compressionEnabled) {
      return JSON.stringify(data);
    }

    try {
      // 使用简单的压缩算法（实际项目中可以使用更好的压缩库）
      const jsonStr = JSON.stringify(data);
      const compressed = btoa(jsonStr);
      return compressed.length < jsonStr.length ? compressed : jsonStr;
    } catch {
      return JSON.stringify(data);
    }
  }

  /**
   * 解压数据
   */
  private async decompressData(compressedData: string): Promise<any> {
    try {
      // 尝试解压
      const decompressed = atob(compressedData);
      return JSON.parse(decompressed);
    } catch {
      // 如果解压失败，尝试直接解析
      return JSON.parse(compressedData);
    }
  }

  /**
   * 设置缓存（智能选择存储层）
   */
  async set<T>(
    category: string,
    identifier: string | object,
    data: T,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
    } = {}
  ): Promise<void> {
    const key = this.generateKey(category, identifier);
    const size = this.calculateSize(data);
    const now = new Date();
    const ttl = options.ttl || this.config.defaultTTL;

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      expiry: new Date(now.getTime() + ttl),
      size,
      accessCount: 0,
      lastAccessed: now,
      tags: options.tags || [category],
      priority: options.priority || 'medium',
      source: 'memory'
    };

    try {
      // 优先存储到内存
      if (this.shouldStoreInMemory(entry)) {
        await this.setMemoryCache(entry);
      }
      // 大数据或低优先级存储到IndexedDB
      else if (this.indexedDB && this.shouldStoreInIndexedDB(entry)) {
        await this.setIndexedDBCache(entry);
      }
      // 最后选择LocalStorage
      else {
        await this.setLocalStorageCache(entry);
      }

      // 更新统计信息
      this.updateStats(category, 'set', size);
      
    } catch (error) {
      console.error('❌ 设置缓存失败:', error);
      throw error;
    }
  }

  /**
   * 获取缓存（智能查找）
   */
  async get<T>(category: string, identifier: string | object): Promise<T | null> {
    const key = this.generateKey(category, identifier);
    const startTime = Date.now();

    try {
      // 按优先级查找：内存 -> IndexedDB -> LocalStorage
      let entry = await this.getMemoryCache<T>(key);
      
      if (!entry && this.indexedDB) {
        entry = await this.getIndexedDBCache<T>(key);
        if (entry && !this.isExpired(entry)) {
          // 热数据提升到内存
          await this.promoteToMemory(entry);
        }
      }

      if (!entry) {
        entry = await this.getLocalStorageCache<T>(key);
        if (entry && !this.isExpired(entry)) {
          // 热数据提升到内存
          await this.promoteToMemory(entry);
        }
      }

      const accessTime = Date.now() - startTime;

      if (entry && !this.isExpired(entry)) {
        // 更新访问统计
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        this.updateStats(category, 'hit', 0, accessTime);
        return entry.data;
      } else {
        // 清理过期缓存
        if (entry) {
          await this.delete(key);
        }
        
        this.updateStats(category, 'miss', 0, accessTime);
        return null;
      }
    } catch (error) {
      console.error('❌ 获取缓存失败:', error);
      this.updateStats(category, 'miss', 0, Date.now() - startTime);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      // 从所有存储层删除
      this.memoryCache.delete(key);
      
      if (this.indexedDB) {
        const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.delete(key);
      }

      localStorage.removeItem(key);
    } catch (error) {
      console.error('❌ 删除缓存失败:', error);
    }
  }

  /**
   * 按标签清理缓存
   */
  async clearByTags(tags: string[]): Promise<number> {
    let clearedCount = 0;

    try {
      // 清理内存缓存
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags.some(tag => tags.includes(tag))) {
          this.memoryCache.delete(key);
          clearedCount++;
        }
      }

      // 清理IndexedDB
      if (this.indexedDB) {
        const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('tags');
        
        for (const tag of tags) {
          const request = index.openCursor(IDBKeyRange.only(tag));
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              cursor.delete();
              clearedCount++;
              cursor.continue();
            }
          };
        }
      }

      console.log(`🧹 已清理 ${clearedCount} 个缓存项`);
      return clearedCount;
    } catch (error) {
      console.error('❌ 按标签清理缓存失败:', error);
      return clearedCount;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpired(): Promise<number> {
    let clearedCount = 0;
    const now = new Date();

    try {
      // 清理内存缓存
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now > entry.expiry) {
          this.memoryCache.delete(key);
          clearedCount++;
        }
      }

      // 清理IndexedDB
      if (this.indexedDB) {
        const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('expiry');
        const request = index.openCursor(IDBKeyRange.upperBound(now));
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            clearedCount++;
            cursor.continue();
          }
        };
      }

      // 清理LocalStorage
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const entry = JSON.parse(item);
            if (entry.expiry && new Date(entry.expiry) < now) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch {
          // 忽略非缓存项
        }
      }

      if (clearedCount > 0) {
        console.log(`🧹 已清理 ${clearedCount} 个过期缓存项`);
      }
      
      return clearedCount;
    } catch (error) {
      console.error('❌ 清理过期缓存失败:', error);
      return clearedCount;
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 搜索结果缓存（带数据质量处理）
   */
  async cacheSearchResults(
    query: string,
    websites: string[],
    results: ExtractedMaterialResult[],
    searchTime: number,
    filters?: any
  ): Promise<void> {
    // 数据质量处理
    const qualityResult = dataQualityManager.batchProcessQuality(results);
    
    const searchData = {
      query,
      websites,
      results: qualityResult.processed,
      totalCount: qualityResult.processed.length,
      originalCount: results.length,
      searchTime,
      filters,
      qualityMetrics: {
        duplicatesRemoved: qualityResult.duplicatesRemoved,
        qualityImproved: qualityResult.qualityImproved,
        totalChanges: qualityResult.totalChanges
      }
    };

    await this.set('searchResults', { query, websites, filters }, searchData, {
      ttl: 2 * 60 * 60 * 1000, // 2小时
      priority: 'high',
      tags: ['search', 'results', 'quality-processed']
    });

    console.log(`🔍 缓存搜索结果: ${qualityResult.processed.length}/${results.length} 项 (去重: ${qualityResult.duplicatesRemoved}, 优化: ${qualityResult.qualityImproved})`);
  }

  /**
   * 获取搜索结果缓存
   */
  async getCachedSearchResults(
    query: string,
    websites: string[],
    filters?: any
  ): Promise<SearchCache['data'] | null> {
    return await this.get('searchResults', { query, websites, filters });
  }

  /**
   * 图片缓存
   */
  async cacheImage(url: string, blob: Blob): Promise<void> {
    const imageData = {
      originalUrl: url,
      blob,
      mimeType: blob.type,
      dimensions: { width: 0, height: 0 } // TODO: 获取实际尺寸
    };

    await this.set('images', url, imageData, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7天
      priority: 'low',
      tags: ['image', 'media']
    });
  }

  /**
   * 获取图片缓存
   */
  async getCachedImage(url: string): Promise<Blob | null> {
    const imageData = await this.get<ImageCache['data']>('images', url);
    return imageData?.blob || null;
  }

  /**
   * 网站数据缓存
   */
  async cacheWebsiteData(websiteId: string, config: any): Promise<void> {
    const websiteData = {
      websiteId,
      config,
      lastUpdated: new Date(),
      version: '1.0'
    };

    await this.set('websiteData', websiteId, websiteData, {
      ttl: 24 * 60 * 60 * 1000, // 24小时
      priority: 'medium',
      tags: ['website', 'config']
    });
  }

  /**
   * 获取网站数据缓存
   */
  async getCachedWebsiteData(websiteId: string): Promise<any | null> {
    const websiteData = await this.get<WebsiteDataCache['data']>('websiteData', websiteId);
    return websiteData?.config || null;
  }

  // 私有方法实现...

  private shouldStoreInMemory(entry: CacheEntry): boolean {
    const memoryUsage = this.calculateMemoryUsage();
    const maxSize = this.config.maxMemorySize * 1024 * 1024; // 转换为字节
    
    return (
      entry.priority === 'high' ||
      entry.size < 1024 * 1024 || // 小于1MB
      memoryUsage + entry.size < maxSize
    );
  }

  private shouldStoreInIndexedDB(entry: CacheEntry): boolean {
    return entry.size > 1024 * 1024 || entry.priority === 'low';
  }

  private calculateMemoryUsage(): number {
    let total = 0;
    for (const entry of this.memoryCache.values()) {
      total += entry.size;
    }
    return total;
  }

  private async setMemoryCache<T>(entry: CacheEntry<T>): Promise<void> {
    // 检查内存限制
    await this.enforceMemoryLimit();
    
    entry.source = 'memory';
    this.memoryCache.set(entry.key, entry);
  }

  private async getMemoryCache<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.memoryCache.get(key);
    return entry as CacheEntry<T> || null;
  }

  private async setIndexedDBCache<T>(entry: CacheEntry<T>): Promise<void> {
    if (!this.indexedDB) return;

    const transaction = this.indexedDB.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    // 压缩数据
    const compressedData = await this.compressData(entry.data);
    const dbEntry = { ...entry, data: compressedData, source: 'indexeddb' };
    
    store.put(dbEntry);
  }

  private async getIndexedDBCache<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.indexedDB) return null;

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = async () => {
        const entry = request.result;
        if (entry) {
          // 解压数据
          const decompressedData = await this.decompressData(entry.data);
          resolve({ ...entry, data: decompressedData });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  private async setLocalStorageCache<T>(entry: CacheEntry<T>): Promise<void> {
    try {
      const compressedData = await this.compressData(entry.data);
      const storageEntry = { ...entry, data: compressedData, source: 'localstorage' };
      localStorage.setItem(entry.key, JSON.stringify(storageEntry));
    } catch (error) {
      console.warn('⚠️ LocalStorage存储失败:', error);
    }
  }

  private async getLocalStorageCache<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const entry = JSON.parse(item);
      const decompressedData = await this.decompressData(entry.data);
      return { ...entry, data: decompressedData };
    } catch {
      return null;
    }
  }

  private async promoteToMemory<T>(entry: CacheEntry<T>): Promise<void> {
    if (this.shouldStoreInMemory(entry)) {
      await this.setMemoryCache(entry);
    }
  }

  private async enforceMemoryLimit(): Promise<void> {
    const maxSize = this.config.maxMemorySize * 1024 * 1024;
    let currentSize = this.calculateMemoryUsage();

    if (currentSize > maxSize) {
      // 按LRU策略清理
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

      for (const [key] of entries) {
        this.memoryCache.delete(key);
        currentSize = this.calculateMemoryUsage();
        if (currentSize <= maxSize * 0.8) break; // 清理到80%
      }
    }
  }

  private updateStats(
    category: string,
    operation: 'set' | 'hit' | 'miss',
    size: number,
    accessTime?: number
  ): void {
    const categoryStats = this.stats.categories[category as keyof typeof this.stats.categories];
    
    if (operation === 'set') {
      categoryStats.size += size;
      categoryStats.count++;
      this.stats.totalSize += size;
      this.stats.itemCount++;
    } else if (operation === 'hit') {
      this.stats.performance.cacheHits++;
      this.stats.performance.totalRequests++;
      if (accessTime) {
        this.stats.performance.avgAccessTime = 
          (this.stats.performance.avgAccessTime + accessTime) / 2;
      }
    } else if (operation === 'miss') {
      this.stats.performance.cacheMisses++;
      this.stats.performance.totalRequests++;
    }

    // 更新命中率
    if (this.stats.performance.totalRequests > 0) {
      this.stats.hitRate = this.stats.performance.cacheHits / this.stats.performance.totalRequests;
      categoryStats.hitRate = this.stats.hitRate; // 简化处理
    }
  }

  private async loadCacheStats(): Promise<void> {
    // TODO: 从持久化存储加载统计信息
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.indexedDB) {
      this.indexedDB.close();
      this.indexedDB = null;
    }

    this.memoryCache.clear();
    console.log('🧹 智能缓存服务资源清理完成');
  }
}

// 创建全局智能缓存服务实例
export const smartCacheService = new SmartCacheService();

// 默认导出
export default smartCacheService;