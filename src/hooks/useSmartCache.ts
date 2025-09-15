/**
 * 智能缓存管理Hook
 * 提供缓存操作和状态管理的便捷接口
 */

import { useState, useEffect, useCallback } from 'react';
import { smartCacheService, CacheStats } from '../services/smartCacheService';
import { ExtractedMaterialResult } from '../crawler/types/crawler';

export interface UseSmartCacheOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseSmartCacheReturn {
  // 状态
  stats: CacheStats;
  isLoading: boolean;
  error: string | null;
  
  // 缓存操作
  cacheSearchResults: (
    query: string,
    websites: string[],
    results: ExtractedMaterialResult[],
    searchTime: number,
    filters?: any
  ) => Promise<void>;
  getCachedSearchResults: (
    query: string,
    websites: string[],
    filters?: any
  ) => Promise<any | null>;
  cacheImage: (url: string, blob: Blob) => Promise<void>;
  getCachedImage: (url: string) => Promise<Blob | null>;
  cacheWebsiteData: (websiteId: string, config: any) => Promise<void>;
  getCachedWebsiteData: (websiteId: string) => Promise<any | null>;
  
  // 管理操作
  clearCache: (type: 'all' | 'searchResults' | 'images' | 'websiteData' | 'rules') => Promise<void>;
  clearExpired: () => Promise<void>;
  clearByTags: (tags: string[]) => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // 工具方法
  formatSize: (bytes: number) => string;
  formatPercentage: (value: number) => string;
  getCacheHealth: () => {
    hitRate: 'excellent' | 'good' | 'poor';
    responseTime: 'excellent' | 'good' | 'poor';
    storageUsage: 'normal' | 'high' | 'critical';
  };
}

export const useSmartCache = (options: UseSmartCacheOptions = {}): UseSmartCacheReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000 // 30秒
  } = options;

  const [stats, setStats] = useState<CacheStats>({
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
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化缓存服务
  useEffect(() => {
    const initializeCache = async () => {
      try {
        setIsLoading(true);
        await smartCacheService.initialize();
        await refreshStats();
      } catch (err) {
        setError(err instanceof Error ? err.message : '缓存服务初始化失败');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCache();

    // 清理函数
    return () => {
      smartCacheService.cleanup();
    };
  }, []);

  // 自动刷新统计信息
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // 刷新统计信息
  const refreshStats = useCallback(async () => {
    try {
      const newStats = smartCacheService.getStats();
      setStats(newStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缓存统计失败');
    }
  }, []);

  // 缓存搜索结果
  const cacheSearchResults = useCallback(async (
    query: string,
    websites: string[],
    results: ExtractedMaterialResult[],
    searchTime: number,
    filters?: any
  ) => {
    try {
      setError(null);
      await smartCacheService.cacheSearchResults(query, websites, results, searchTime, filters);
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '缓存搜索结果失败');
      throw err;
    }
  }, [refreshStats]);

  // 获取缓存的搜索结果
  const getCachedSearchResults = useCallback(async (
    query: string,
    websites: string[],
    filters?: any
  ) => {
    try {
      setError(null);
      const result = await smartCacheService.getCachedSearchResults(query, websites, filters);
      await refreshStats();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缓存搜索结果失败');
      return null;
    }
  }, [refreshStats]);

  // 缓存图片
  const cacheImage = useCallback(async (url: string, blob: Blob) => {
    try {
      setError(null);
      await smartCacheService.cacheImage(url, blob);
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '缓存图片失败');
      throw err;
    }
  }, [refreshStats]);

  // 获取缓存的图片
  const getCachedImage = useCallback(async (url: string) => {
    try {
      setError(null);
      const result = await smartCacheService.getCachedImage(url);
      await refreshStats();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缓存图片失败');
      return null;
    }
  }, [refreshStats]);

  // 缓存网站数据
  const cacheWebsiteData = useCallback(async (websiteId: string, config: any) => {
    try {
      setError(null);
      await smartCacheService.cacheWebsiteData(websiteId, config);
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '缓存网站数据失败');
      throw err;
    }
  }, [refreshStats]);

  // 获取缓存的网站数据
  const getCachedWebsiteData = useCallback(async (websiteId: string) => {
    try {
      setError(null);
      const result = await smartCacheService.getCachedWebsiteData(websiteId);
      await refreshStats();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缓存网站数据失败');
      return null;
    }
  }, [refreshStats]);

  // 清理缓存
  const clearCache = useCallback(async (type: 'all' | 'searchResults' | 'images' | 'websiteData' | 'rules') => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (type === 'all') {
        // 清理所有缓存
        await smartCacheService.clearByTags(['search', 'image', 'website', 'rules']);
      } else {
        // 按类型清理
        const tagMap = {
          searchResults: ['search', 'results'],
          images: ['image', 'media'],
          websiteData: ['website', 'config'],
          rules: ['rules', 'config']
        };
        
        await smartCacheService.clearByTags(tagMap[type]);
      }
      
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理缓存失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStats]);

  // 清理过期缓存
  const clearExpired = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await smartCacheService.cleanupExpired();
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '清理过期缓存失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStats]);

  // 按标签清理缓存
  const clearByTags = useCallback(async (tags: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      await smartCacheService.clearByTags(tags);
      await refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : '按标签清理缓存失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshStats]);

  // 格式化文件大小
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  // 格式化百分比
  const formatPercentage = useCallback((value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  // 获取缓存健康状态
  const getCacheHealth = useCallback(() => {
    const hitRateHealth = stats.hitRate > 0.8 ? 'excellent' : stats.hitRate > 0.6 ? 'good' : 'poor';
    const responseTimeHealth = stats.performance.avgAccessTime < 100 ? 'excellent' : 
                              stats.performance.avgAccessTime < 500 ? 'good' : 'poor';
    const storageUsageHealth = stats.totalSize < 50 * 1024 * 1024 ? 'normal' :
                              stats.totalSize < 100 * 1024 * 1024 ? 'high' : 'critical';

    return {
      hitRate: hitRateHealth as 'excellent' | 'good' | 'poor',
      responseTime: responseTimeHealth as 'excellent' | 'good' | 'poor',
      storageUsage: storageUsageHealth as 'normal' | 'high' | 'critical'
    };
  }, [stats]);

  return {
    // 状态
    stats,
    isLoading,
    error,
    
    // 缓存操作
    cacheSearchResults,
    getCachedSearchResults,
    cacheImage,
    getCachedImage,
    cacheWebsiteData,
    getCachedWebsiteData,
    
    // 管理操作
    clearCache,
    clearExpired,
    clearByTags,
    refreshStats,
    
    // 工具方法
    formatSize,
    formatPercentage,
    getCacheHealth
  };
};