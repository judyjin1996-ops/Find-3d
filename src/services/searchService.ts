import type { 
  SearchParams, 
  SearchResponse, 
  MaterialResult, 
  WebsiteConfig,
  WebsiteSearchStatus,
  AppError,
  ErrorType,
  SearchResultGroup,
  SearchPerformanceMetrics
} from '../types';
import { getActiveWebsites } from '../utils/defaultWebsites';
import { cacheService } from './cacheService';

// 搜索配置常量
const SEARCH_DELAY = 1000;
const SEARCH_TIMEOUT = 30000;
const MAX_CONCURRENT_SEARCHES = 5;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000;

// 模拟搜索结果数据
const generateMockResults = (query: string, websiteId: string, count: number = 5): MaterialResult[] => {
  const results: MaterialResult[] = [];
  
  for (let i = 0; i < count; i++) {
    results.push({
      id: `${websiteId}_${query}_${i}`,
      title: `${query} 三维模型 ${i + 1}`,
      previewImage: `https://dummyimage.com/300x200/667eea/ffffff&text=${encodeURIComponent(query)}+${i + 1}`,
      sourceWebsite: websiteId,
      sourceUrl: `https://www.${websiteId === 'modown' ? 'modown.cn' : websiteId === 'cgown' ? 'cgown.com' : 'c4dsky.com'}/item/${i}`,
      price: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 10 : undefined,
      currency: 'CNY',
      isFree: Math.random() > 0.7,
      fileFormat: ['obj', 'fbx', 'max', 'blend'][Math.floor(Math.random() * 4)],
      fileSize: `${Math.floor(Math.random() * 50) + 1}MB`,
      tags: [`${query}`, '三维', '模型', 'CG'],
      description: `这是一个高质量的${query}三维模型，适用于游戏开发、动画制作等场景。`,
      rating: Math.floor(Math.random() * 5) + 1,
      downloadCount: Math.floor(Math.random() * 1000),
      uploadDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      author: `设计师${i + 1}`
    });
  }
  
  return results;
};

// 搜索重试逻辑
const retrySearch = async <T>(
  searchFn: () => Promise<T>,
  maxAttempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await searchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误');
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// 模拟单个网站搜索（带重试机制）
const searchWebsite = async (
  website: WebsiteConfig, 
  params: SearchParams,
  signal?: AbortSignal
): Promise<{ results: MaterialResult[]; status: WebsiteSearchStatus }> => {
  const startTime = Date.now();
  
  try {
    // 检查是否已取消
    if (signal?.aborted) {
      throw new Error('搜索已取消');
    }
    
    const searchFn = async () => {
      // 模拟网络延迟
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, SEARCH_DELAY + Math.random() * 2000);
        
        // 监听取消信号
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('搜索已取消'));
          });
        }
      });
      
      // 再次检查是否已取消
      if (signal?.aborted) {
        throw new Error('搜索已取消');
      }
      
      // 模拟随机失败（降低失败率）
      if (Math.random() < 0.05) {
        throw new Error(`网站 ${website.name} 暂时无法访问`);
      }
      
      // 模拟超时（降低超时率）
      if (Math.random() < 0.02) {
        throw new Error('TIMEOUT');
      }
      
      const resultCount = Math.floor(Math.random() * 15) + 3; // 增加结果数量
      return generateMockResults(params.query, website.id, resultCount);
    };
    
    // 使用重试机制执行搜索
    const results = await retrySearch(searchFn);
    const searchTime = Date.now() - startTime;
    
    return {
      results,
      status: {
        websiteId: website.id,
        websiteName: website.name,
        status: 'success',
        resultCount: results.length,
        searchTime
      }
    };
  } catch (error) {
    const searchTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    // 判断错误类型
    let status: 'error' | 'timeout' | 'cancelled' = 'error';
    if (errorMessage === 'TIMEOUT' || searchTime >= SEARCH_TIMEOUT) {
      status = 'timeout';
    } else if (errorMessage === '搜索已取消') {
      status = 'cancelled';
    }
    
    return {
      results: [],
      status: {
        websiteId: website.id,
        websiteName: website.name,
        status,
        error: status === 'timeout' ? '搜索超时' : 
               status === 'cancelled' ? '搜索已取消' : errorMessage,
        searchTime
      }
    };
  }
};

// 结果聚合和排序逻辑
const aggregateAndSortResults = (
  searchResults: Array<{ results: MaterialResult[]; status: WebsiteSearchStatus }>,
  query: string
): MaterialResult[] => {
  const allResults: MaterialResult[] = [];
  
  // 收集所有结果
  searchResults.forEach(({ results }) => {
    allResults.push(...results);
  });
  
  // 去重（基于标题和来源网站）
  const uniqueResults = allResults.filter((result, index, array) => {
    return array.findIndex(r => 
      r.title.toLowerCase() === result.title.toLowerCase() && 
      r.sourceWebsite === result.sourceWebsite
    ) === index;
  });
  
  // 智能排序算法
  const queryLower = query.toLowerCase();
  uniqueResults.sort((a, b) => {
    // 1. 标题完全匹配优先
    const aExactMatch = a.title.toLowerCase() === queryLower;
    const bExactMatch = b.title.toLowerCase() === queryLower;
    if (aExactMatch !== bExactMatch) return bExactMatch ? 1 : -1;
    
    // 2. 标题包含关键词优先
    const aContains = a.title.toLowerCase().includes(queryLower);
    const bContains = b.title.toLowerCase().includes(queryLower);
    if (aContains !== bContains) return bContains ? 1 : -1;
    
    // 3. 免费资源优先
    if (a.isFree !== b.isFree) return b.isFree ? 1 : -1;
    
    // 4. 评分高的优先
    const aRating = a.rating || 0;
    const bRating = b.rating || 0;
    if (aRating !== bRating) return bRating - aRating;
    
    // 5. 下载量高的优先
    const aDownloads = a.downloadCount || 0;
    const bDownloads = b.downloadCount || 0;
    if (aDownloads !== bDownloads) return bDownloads - aDownloads;
    
    // 6. 最新上传的优先
    const aDate = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
    const bDate = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
    return bDate - aDate;
  });
  
  return uniqueResults;
};

// 生成搜索性能指标
const generatePerformanceMetrics = (
  searchResults: Array<{ results: MaterialResult[]; status: WebsiteSearchStatus }>,
  totalTime: number
): SearchPerformanceMetrics => {
  const websiteResponseTimes: Record<string, number> = {};
  let totalResponseTime = 0;
  let successfulSearches = 0;
  
  searchResults.forEach(({ status }) => {
    websiteResponseTimes[status.websiteId] = status.searchTime || 0;
    if (status.status === 'success') {
      totalResponseTime += status.searchTime || 0;
      successfulSearches++;
    }
  });
  
  return {
    totalTime,
    networkTime: successfulSearches > 0 ? totalResponseTime / successfulSearches : 0,
    parseTime: totalTime * 0.1, // 估算解析时间
    renderTime: 0, // 前端渲染时间
    cacheHitRate: 0, // 缓存命中率（暂未实现）
    websiteResponseTimes
  };
};

// 主搜索函数（增强版）
export const searchMaterials = async (
  params: SearchParams,
  signal?: AbortSignal
): Promise<SearchResponse> => {
  const startTime = Date.now();
  
  // 检查缓存
  const cachedResults = cacheService.getCachedSearchResults(params.query, params.filters);
  if (cachedResults) {
    console.log('使用缓存的搜索结果:', params.query);
    return {
      ...cachedResults,
      searchTime: 0.1, // 缓存命中时间很短
      performanceMetrics: {
        ...cachedResults.performanceMetrics,
        cacheHitRate: 100
      }
    };
  }
  
  const websites = getActiveWebsites();
  
  if (websites.length === 0) {
    throw new Error('没有可用的搜索网站');
  }
  
  // 限制并发搜索数量
  const concurrentWebsites = websites.slice(0, MAX_CONCURRENT_SEARCHES);
  
  // 创建搜索Promise数组，每个都有独立的超时控制
  const searchPromises = concurrentWebsites.map(website => 
    Promise.race([
      searchWebsite(website, params, signal),
      // 独立的超时处理
      new Promise<{ results: MaterialResult[]; status: WebsiteSearchStatus }>((_, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), SEARCH_TIMEOUT);
        
        // 监听取消信号
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('搜索已取消'));
          });
        }
      })
    ]).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return {
        results: [],
        status: {
          websiteId: website.id,
          websiteName: website.name,
          status: errorMessage === 'TIMEOUT' ? 'timeout' as const : 
                  errorMessage === '搜索已取消' ? 'cancelled' as const : 'error' as const,
          error: errorMessage === 'TIMEOUT' ? '搜索超时' : 
                 errorMessage === '搜索已取消' ? '搜索已取消' : errorMessage,
          searchTime: SEARCH_TIMEOUT
        }
      };
    })
  );
  
  // 等待所有搜索完成
  const searchResults = await Promise.all(searchPromises);
  
  // 检查是否被取消
  if (signal?.aborted) {
    throw new Error('搜索已取消');
  }
  
  // 聚合和排序结果
  const aggregatedResults = aggregateAndSortResults(searchResults, params.query);
  
  // 构建网站状态映射
  const websiteStatus: Record<string, 'success' | 'error' | 'timeout' | 'cancelled'> = {};
  const websiteStatuses: WebsiteSearchStatus[] = [];
  
  searchResults.forEach(({ status }) => {
    // 过滤掉不支持的状态类型
    if (status.status === 'success' || status.status === 'error' || status.status === 'timeout' || status.status === 'cancelled') {
      websiteStatus[status.websiteId] = status.status;
    }
    websiteStatuses.push(status);
  });
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  // 生成性能指标
  const performanceMetrics = generatePerformanceMetrics(searchResults, totalTime);
  
  const response: SearchResponse = {
    results: aggregatedResults,
    totalCount: aggregatedResults.length,
    searchTime: totalTime,
    websiteStatus,
    websiteStatuses,
    performanceMetrics
  };
  
  // 缓存搜索结果（只缓存成功的搜索）
  if (aggregatedResults.length > 0) {
    cacheService.cacheSearchResults(params.query, params.filters, response, 5 * 60 * 1000); // 缓存5分钟
  }
  
  return response;
};

// 搜索建议
export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  // 模拟搜索建议
  const suggestions = [
    '汽车模型',
    '建筑模型', 
    '人物模型',
    '动物模型',
    '家具模型',
    '武器模型',
    '植物模型',
    '机械模型'
  ];
  
  if (!query) return suggestions.slice(0, 5);
  
  return suggestions
    .filter(s => s.includes(query))
    .slice(0, 5);
};

// 热门搜索
export const getPopularSearches = async (): Promise<string[]> => {
  return [
    '汽车',
    '建筑',
    '人物',
    '动物',
    '家具',
    '武器',
    '植物',
    '机械'
  ];
};

// 按网站分组搜索结果
export const searchMaterialsByWebsite = async (
  params: SearchParams,
  signal?: AbortSignal
): Promise<SearchResultGroup[]> => {
  const websites = getActiveWebsites();
  
  if (websites.length === 0) {
    throw new Error('没有可用的搜索网站');
  }
  
  // 创建搜索Promise数组
  const searchPromises = websites.map(async (website): Promise<SearchResultGroup> => {
    try {
      const { results, status } = await Promise.race([
        searchWebsite(website, params, signal),
        new Promise<{ results: MaterialResult[]; status: WebsiteSearchStatus }>((_, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), SEARCH_TIMEOUT);
          
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error('搜索已取消'));
            });
          }
        })
      ]);
      
      return {
        website: website.id,
        websiteName: website.name,
        results,
        totalCount: results.length,
        status: status.status === 'success' ? 'success' : 'error',
        error: status.error,
        searchTime: status.searchTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return {
        website: website.id,
        websiteName: website.name,
        results: [],
        totalCount: 0,
        status: 'error',
        error: errorMessage === 'TIMEOUT' ? '搜索超时' : 
               errorMessage === '搜索已取消' ? '搜索已取消' : errorMessage,
        searchTime: SEARCH_TIMEOUT
      };
    }
  });
  
  // 等待所有搜索完成
  const results = await Promise.all(searchPromises);
  
  // 检查是否被取消
  if (signal?.aborted) {
    throw new Error('搜索已取消');
  }
  
  return results;
};

// 实时搜索（流式返回结果）
export const searchMaterialsLive = async (
  params: SearchParams,
  onProgress: (progress: {
    completedWebsites: string[];
    results: MaterialResult[];
    totalProgress: number;
  }) => void,
  signal?: AbortSignal
): Promise<SearchResponse> => {
  const websites = getActiveWebsites();
  const completedWebsites: string[] = [];
  const allResults: MaterialResult[] = [];
  const websiteStatuses: WebsiteSearchStatus[] = [];
  
  // 并发搜索所有网站
  const searchPromises = websites.map(async (website) => {
    try {
      const { results, status } = await searchWebsite(website, params, signal);
      
      // 更新进度
      completedWebsites.push(website.id);
      allResults.push(...results);
      websiteStatuses.push(status);
      
      onProgress({
        completedWebsites: [...completedWebsites],
        results: [...allResults],
        totalProgress: (completedWebsites.length / websites.length) * 100
      });
      
      return { results, status };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const status: WebsiteSearchStatus = {
        websiteId: website.id,
        websiteName: website.name,
        status: 'error',
        error: errorMessage,
        searchTime: 0
      };
      
      completedWebsites.push(website.id);
      websiteStatuses.push(status);
      
      onProgress({
        completedWebsites: [...completedWebsites],
        results: [...allResults],
        totalProgress: (completedWebsites.length / websites.length) * 100
      });
      
      return { results: [], status };
    }
  });
  
  // 等待所有搜索完成
  const searchResults = await Promise.all(searchPromises);
  
  // 最终聚合结果
  const finalResults = aggregateAndSortResults(searchResults, params.query);
  
  const websiteStatus: Record<string, 'success' | 'error' | 'timeout' | 'cancelled'> = {};
  websiteStatuses.forEach(status => {
    // 过滤掉不支持的状态类型
    if (status.status === 'success' || status.status === 'error' || status.status === 'timeout' || status.status === 'cancelled') {
      websiteStatus[status.websiteId] = status.status;
    }
  });
  
  return {
    results: finalResults,
    totalCount: finalResults.length,
    searchTime: 0, // 实时搜索不计算总时间
    websiteStatus,
    websiteStatuses
  };
};

// 创建错误
export const createSearchError = (type: ErrorType, message: string, details?: any): AppError => {
  return {
    type,
    message,
    timestamp: new Date(),
    source: 'searchService',
    details
  };
};