/**
 * 爬虫相关类型定义
 */

// 爬虫规则配置
export interface CrawlerRule {
  id: string;
  websiteName: string;
  websiteIcon?: string;
  baseUrl: string;
  isActive: boolean;
  isPreset: boolean;
  
  // 搜索配置
  searchConfig: {
    urlTemplate: string; // 搜索URL模板，如 "https://example.com/search?q={keyword}"
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    params?: Record<string, string>;
    encoding?: string;
  };
  
  // 页面解析配置
  parseConfig: {
    // 搜索结果列表页
    listSelectors: {
      container: string; // 结果容器选择器
      item: string; // 单个结果项选择器
      link: string; // 详情页链接选择器
      title?: string; // 列表页标题（可选）
    };
    
    // 详情页解析
    detailSelectors: {
      title: string;
      description?: string;
      images: string; // 支持多图选择器
      price?: string;
      freeIndicator?: string;
      fileInfo?: {
        format?: string;
        size?: string;
      };
      stats?: {
        downloads?: string;
        views?: string;
        rating?: string;
        reviews?: string;
      };
      metadata?: {
        author?: string;
        uploadDate?: string;
        tags?: string;
        category?: string;
      };
    };
  };
  
  // 数据处理规则
  dataProcessing: {
    textCleanup: {
      removeHtml: boolean;
      trimWhitespace: boolean;
      removeEmptyLines: boolean;
    };
    priceExtraction: {
      regex?: string;
      currency?: string;
      freeKeywords?: string[];
    };
    dateProcessing: {
      format?: string;
      locale?: string;
    };
    imageProcessing: {
      baseUrl?: string;
      preferredSize?: 'small' | 'medium' | 'large';
      fallbackImage?: string;
    };
  };
  
  // 反爬虫策略
  antiDetection: {
    useHeadlessBrowser: boolean;
    browserConfig?: {
      viewport?: { width: number; height: number };
      userAgent?: string;
      enableJavaScript: boolean;
      waitForSelector?: string;
      waitTime?: number;
    };
    requestConfig: {
      delay: number; // 请求间隔（毫秒）
      randomDelay: boolean;
      maxRetries: number;
      timeout: number;
    };
    proxyConfig?: {
      enabled: boolean;
      rotateProxies: boolean;
      proxyList?: string[];
    };
  };
  
  // 质量控制
  qualityControl: {
    minTitleLength: number;
    requireImage: boolean;
    requirePrice: boolean;
    maxResultsPerPage: number;
    duplicateDetection: boolean;
  };
  
  // 测试和监控
  testing: {
    testKeyword: string;
    lastTested?: Date;
    testResults?: TestResult;
    successRate: number;
    avgResponseTime: number;
  };
}

// 提取的素材结果
export interface ExtractedMaterialResult {
  // 基础信息
  id: string;
  title: string;
  description?: string;
  sourceWebsite: string;
  sourceUrl: string;
  
  // 媒体内容
  previewImages: Array<{
    url: string;
    alt?: string;
    size?: 'thumbnail' | 'medium' | 'large';
  }>;
  
  // 价格信息
  pricing: {
    isFree: boolean;
    price?: number;
    currency?: string;
    originalPrice?: number;
    discount?: number;
    priceText?: string;
  };
  
  // 文件信息
  fileInfo: {
    format?: string;
    size?: string;
    sizeBytes?: number;
    downloadUrl?: string;
  };
  
  // 统计信息
  statistics: {
    downloadCount?: number;
    viewCount?: number;
    likeCount?: number;
    rating?: number;
    reviewCount?: number;
  };
  
  // 分类和标签
  categorization: {
    category?: string;
    subcategory?: string;
    tags: string[];
    keywords?: string[];
  };
  
  // 作者信息
  author?: {
    name: string;
    profileUrl?: string;
    avatar?: string;
  };
  
  // 时间信息
  timestamps: {
    uploadDate?: Date;
    lastUpdated?: Date;
    extractedAt: Date;
  };
  
  // 提取元数据
  extraction: {
    ruleId: string;
    status: 'success' | 'partial' | 'failed';
    confidence: number; // 提取置信度 0-1
    missingFields: string[];
    errors?: string[];
    processingTime: number;
  };
  
  // 质量评分
  quality: {
    score: number; // 0-100
    factors: {
      completeness: number;
      imageQuality: number;
      dataAccuracy: number;
    };
  };
}

// 爬虫任务
export interface CrawlingTask {
  id: string;
  query: string;
  websites: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  startTime: Date;
  estimatedEndTime?: Date;
  results: ExtractedMaterialResult[];
  errors: CrawlingError[];
}

// 爬虫错误类型
export enum CrawlerErrorType {
  // 网络相关错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  DNS_ERROR = 'DNS_ERROR',
  
  // 反爬虫相关错误
  BLOCKED_BY_WEBSITE = 'BLOCKED_BY_WEBSITE',
  CAPTCHA_REQUIRED = 'CAPTCHA_REQUIRED',
  IP_BANNED = 'IP_BANNED',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // 解析相关错误
  PARSE_ERROR = 'PARSE_ERROR',
  SELECTOR_NOT_FOUND = 'SELECTOR_NOT_FOUND',
  INVALID_HTML = 'INVALID_HTML',
  ENCODING_ERROR = 'ENCODING_ERROR',
  
  // 数据相关错误
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  
  // 系统相关错误
  MEMORY_ERROR = 'MEMORY_ERROR',
  DISK_SPACE_ERROR = 'DISK_SPACE_ERROR',
  BROWSER_CRASH = 'BROWSER_CRASH',
  
  // 配置相关错误
  INVALID_RULE_CONFIG = 'INVALID_RULE_CONFIG',
  MISSING_SELECTOR = 'MISSING_SELECTOR',
  INVALID_URL_TEMPLATE = 'INVALID_URL_TEMPLATE'
}

export interface CrawlingError {
  type: CrawlerErrorType;
  message: string;
  details?: {
    url?: string;
    selector?: string;
    statusCode?: number;
    responseTime?: number;
    retryCount?: number;
  };
  timestamp: Date;
  websiteId: string;
  ruleId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

// 测试结果
export interface TestResult {
  success: boolean;
  results: ExtractedMaterialResult[];
  errors: string[];
  performance: {
    totalTime: number;
    parseTime: number;
    networkTime: number;
  };
}

// 爬虫状态
export interface CrawlingStatus {
  totalWebsites: number;
  completedWebsites: number;
  currentWebsite?: string;
  errors: CrawlingError[];
}

// 网站爬取状态
export interface WebsiteCrawlStatus {
  status: 'pending' | 'crawling' | 'parsing' | 'completed' | 'failed' | 'blocked';
  resultCount: number;
  error?: string;
  lastAttempt: Date;
}

// 搜索请求
export interface CrawlerSearchRequest {
  query: string;
  websites?: string[];
  mode: 'fast' | 'comprehensive';
  maxResults?: number;
  forceRefresh?: boolean;
}

// 搜索响应
export interface CrawlerSearchResponse {
  taskId: string;
  status: 'started' | 'completed';
  results?: ExtractedMaterialResult[];
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  websiteStatus: Record<string, WebsiteCrawlStatus>;
  estimatedTime?: number;
}