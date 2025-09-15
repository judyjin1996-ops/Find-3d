// 搜索功能相关类型定义

import type { MaterialResult } from './index';

// 搜索建议类型
export interface SearchSuggestion {
  text: string;
  type: 'history' | 'popular' | 'category';
  count?: number;
  category?: string;
}

// 搜索自动完成响应
export interface AutocompleteResponse {
  suggestions: SearchSuggestion[];
  categories: string[];
  popularTags: string[];
}

// 搜索统计信息
export interface SearchStats {
  totalSearches: number;
  averageResultCount: number;
  mostSearchedTerms: Array<{
    term: string;
    count: number;
  }>;
  searchSuccessRate: number;
  averageSearchTime: number;
}

// 实时搜索状态
export interface LiveSearchState {
  isSearching: boolean;
  currentQuery: string;
  partialResults: MaterialResult[];
  completedWebsites: string[];
  failedWebsites: string[];
  progress: number; // 0-100
}

// 搜索会话信息
export interface SearchSession {
  id: string;
  startTime: Date;
  queries: string[];
  results: MaterialResult[];
  filters: any[];
  endTime?: Date;
  duration?: number;
}

// 高级搜索选项
export interface AdvancedSearchOptions {
  exactMatch?: boolean;
  excludeTerms?: string[];
  includeTerms?: string[];
  searchInTitle?: boolean;
  searchInDescription?: boolean;
  searchInTags?: boolean;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  fileTypes?: string[];
  uploadDateRange?: {
    start: Date;
    end: Date;
  };
}

// 搜索结果分组
export interface SearchResultGroup {
  website: string;
  websiteName: string;
  results: MaterialResult[];
  totalCount: number;
  status: 'loading' | 'success' | 'error';
  error?: string;
  searchTime?: number;
}

// 搜索性能指标
export interface SearchPerformanceMetrics {
  totalTime: number;
  networkTime: number;
  parseTime: number;
  renderTime: number;
  cacheHitRate: number;
  websiteResponseTimes: Record<string, number>;
}

// 搜索缓存策略
export interface SearchCacheStrategy {
  enabled: boolean;
  ttl: number; // 缓存时间（毫秒）
  maxSize: number; // 最大缓存项数
  keyGenerator: (query: string, filters?: any) => string;
}

// 搜索配置
export interface SearchConfiguration {
  timeout: number;
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  cacheStrategy: SearchCacheStrategy;
  enableAutoComplete: boolean;
  enableSearchSuggestions: boolean;
  minQueryLength: number;
  debounceDelay: number;
}

// 搜索事件类型
export const SearchEventType = {
  SEARCH_START: 'search_start',
  SEARCH_PROGRESS: 'search_progress', 
  SEARCH_COMPLETE: 'search_complete',
  SEARCH_ERROR: 'search_error',
  SEARCH_CANCEL: 'search_cancel',
  RESULT_CLICK: 'result_click',
  FILTER_CHANGE: 'filter_change'
} as const;

export type SearchEventType = typeof SearchEventType[keyof typeof SearchEventType];

// 搜索事件数据
export interface SearchEvent {
  type: SearchEventType;
  timestamp: Date;
  query?: string;
  filters?: any;
  results?: MaterialResult[];
  error?: string;
  metadata?: Record<string, any>;
}

// 搜索分析数据
export interface SearchAnalytics {
  query: string;
  timestamp: Date;
  resultCount: number;
  clickedResults: string[];
  searchTime: number;
  userAgent: string;
  filters?: any;
}