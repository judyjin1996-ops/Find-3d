// 素材搜索结果类型
export interface MaterialResult {
  id: string;
  title: string;
  previewImage: string;
  sourceWebsite: string;
  sourceUrl: string;
  price?: number;
  currency?: string;
  isFree: boolean;
  fileFormat?: string;
  fileSize?: string;
  tags: string[];
  description?: string;
  rating?: number;
  downloadCount?: number;
  uploadDate?: Date;
  author?: string;
}

// 网站配置类型
export interface WebsiteConfig {
  id: string;
  name: string;
  baseUrl: string;
  searchEndpoint: string;
  apiKey?: string;
  isActive: boolean;
  searchParams: {
    queryParam: string;
    limitParam?: string;
    formatParam?: string;
  };
  resultMapping: {
    titlePath: string;
    imagePath: string;
    urlPath: string;
    pricePath?: string;
    freePath?: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    concurrent: number;
  };
}

// 搜索状态类型
export interface SearchState {
  query: string;
  loading: boolean;
  results: MaterialResult[];
  error?: string;
  totalCount: number;
  searchTime: number;
  websiteStatus: Record<string, 'success' | 'error' | 'timeout' | 'cancelled'>;
  websiteStatuses?: WebsiteSearchStatus[];
  performanceMetrics?: SearchPerformanceMetrics;
  resultGroups?: SearchResultGroup[];
}

// 搜索历史类型
export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount: number;
}

// 用户配置类型
export interface UserConfig {
  displayFields: DisplayField[];
  searchHistory: SearchHistoryItem[];
  historyVisible: boolean;
  theme: 'light' | 'dark';
  resultsPerPage: number;
  autoSearch: boolean;
}

// 显示字段配置类型
export interface DisplayField {
  key: keyof MaterialResult;
  label: string;
  visible: boolean;
  order: number;
}

// 错误类型
export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  source?: string;
}

// API响应类型
export interface SearchResponse {
  results: MaterialResult[];
  totalCount: number;
  searchTime: number;
  websiteStatus: Record<string, 'success' | 'error' | 'timeout' | 'cancelled'>;
  websiteStatuses?: WebsiteSearchStatus[];
  performanceMetrics?: SearchPerformanceMetrics;
  resultGroups?: SearchResultGroup[];
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

export interface SearchRequest {
  query: string;
  websites?: string[];
  limit?: number;
  offset?: number;
}

// 搜索过滤器类型
export interface SearchFilters {
  priceRange?: {
    min?: number;
    max?: number;
  };
  isFree?: boolean;
  fileFormats?: string[];
  websites?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
}

// 搜索排序选项
export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'rating_desc';

// 搜索参数
export interface SearchParams {
  query: string;
  filters?: SearchFilters;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

// 分页信息
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 网站搜索状态
export interface WebsiteSearchStatus {
  websiteId: string;
  websiteName?: string;
  status: 'pending' | 'loading' | 'success' | 'error' | 'timeout' | 'cancelled';
  resultCount?: number;
  error?: string;
  searchTime?: number;
}

// 完整的搜索响应
export interface SearchResponseComplete extends SearchResponse {
  pagination: PaginationInfo;
  filters: SearchFilters;
  sort: SortOption;
  query: string;
}

// 本地存储键名常量
export const STORAGE_KEYS = {
  WEBSITE_CONFIG: 'find3d_website_config',
  USER_CONFIG: 'find3d_user_config',
  SEARCH_HISTORY: 'find3d_search_history',
  SEARCH_CACHE: 'find3d_search_cache'
} as const;

// 应用配置
export interface AppConfig {
  maxSearchHistory: number;
  searchTimeout: number;
  cacheExpiration: number;
  maxConcurrentRequests: number;
  defaultResultsPerPage: number;
}

// 缓存项
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiration: number;
  key: string;
}

// 网站适配器接口
export interface WebsiteAdapter {
  id: string;
  name: string;
  search: (params: SearchParams) => Promise<MaterialResult[]>;
  validateConfig: (config: WebsiteConfig) => boolean;
  transformResult: (rawResult: any) => MaterialResult;
}

// 组件Props类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 事件处理器类型
export type SearchEventHandler = (query: string, filters?: SearchFilters) => void;
export type ResultClickHandler = (result: MaterialResult) => void;
export type WebsiteConfigHandler = (config: WebsiteConfig) => void;

// 状态更新类型
export type SearchStateUpdate = Partial<SearchState>;
export type UserConfigUpdate = Partial<UserConfig>;

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// API错误响应
export interface ApiErrorResponse {
  error: true;
  message: string;
  code?: string;
  details?: any;
}

// 成功响应包装器
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 重新导出其他类型模块
export * from './errors';
export * from './search';
export * from './ui';