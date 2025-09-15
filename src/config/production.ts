/**
 * 生产环境配置
 */

export const productionConfig = {
  // API配置
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.find3d.com',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // 缓存配置
  cache: {
    maxMemorySize: 200,
    defaultTTL: 10 * 60 * 1000, // 10分钟
    searchResultsTTL: 5 * 60 * 1000, // 5分钟
    imagesTTL: 30 * 60 * 1000, // 30分钟
    websiteConfigTTL: 60 * 60 * 1000 // 1小时
  },

  // 搜索配置
  search: {
    maxConcurrentSearches: 8,
    searchTimeout: 30000,
    maxRetryAttempts: 3,
    debounceDelay: 300,
    maxResultsPerPage: 50,
    maxHistoryItems: 50
  },

  // 性能配置
  performance: {
    enableVirtualScrolling: true,
    virtualScrollItemHeight: 200,
    virtualScrollOverscan: 10,
    enableImageLazyLoading: true,
    imageLazyLoadingThreshold: 0.1,
    imageLazyLoadingRootMargin: '100px'
  },

  // 错误处理配置
  errorHandling: {
    enableErrorReporting: true,
    maxErrorHistory: 100,
    enableRetry: true,
    enableFallback: true
  },

  // 用户体验配置
  ux: {
    enableAnimations: true,
    enableSoundEffects: false,
    enableHapticFeedback: false,
    enableDarkMode: true,
    enableHighContrast: false
  },

  // 安全配置
  security: {
    enableCSP: true,
    enableHTTPS: true,
    enableCORS: true,
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },

  // 分析配置
  analytics: {
    enableTracking: false, // 生产环境中根据需要启用
    trackingId: process.env.VITE_ANALYTICS_ID,
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableUserBehaviorTracking: false
  },

  // CDN配置
  cdn: {
    baseUrl: process.env.VITE_CDN_BASE_URL || 'https://cdn.find3d.com',
    enableImageOptimization: true,
    imageFormats: ['webp', 'avif', 'jpeg'],
    imageSizes: [200, 400, 800, 1200]
  },

  // 功能开关
  features: {
    enableRealTimeSearch: false,
    enableGroupedResults: true,
    enableSearchSuggestions: true,
    enableSearchHistory: true,
    enableWebsiteManagement: true,
    enableDisplayFieldConfig: true,
    enableExport: false,
    enableShare: true,
    enableFavorites: false
  },

  // 限制配置
  limits: {
    maxSearchQueryLength: 200,
    maxSearchHistoryItems: 100,
    maxCachedSearches: 50,
    maxWebsiteConfigs: 20,
    maxConcurrentRequests: 10
  },

  // 国际化配置
  i18n: {
    defaultLocale: 'zh-CN',
    supportedLocales: ['zh-CN', 'en-US'],
    enableAutoDetection: true,
    fallbackLocale: 'zh-CN'
  },

  // PWA配置
  pwa: {
    enableServiceWorker: true,
    enableOfflineMode: false,
    enablePushNotifications: false,
    enableBackgroundSync: false
  },

  // 监控配置
  monitoring: {
    enableHealthCheck: true,
    healthCheckInterval: 60000, // 1分钟
    enablePerformanceMonitoring: true,
    performanceThresholds: {
      searchTime: 5000, // 5秒
      renderTime: 1000, // 1秒
      memoryUsage: 100 * 1024 * 1024 // 100MB
    }
  }
};

/**
 * 获取环境特定的配置
 */
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return {
        ...productionConfig,
        analytics: {
          ...productionConfig.analytics,
          enableTracking: false
        },
        errorHandling: {
          ...productionConfig.errorHandling,
          enableErrorReporting: false
        }
      };
    case 'development':
    default:
      return {
        ...productionConfig,
        api: {
          ...productionConfig.api,
          baseUrl: 'http://localhost:3001'
        },
        cache: {
          ...productionConfig.cache,
          defaultTTL: 60 * 1000 // 1分钟，便于开发测试
        },
        analytics: {
          ...productionConfig.analytics,
          enableTracking: false
        },
        errorHandling: {
          ...productionConfig.errorHandling,
          enableErrorReporting: false
        }
      };
  }
};

/**
 * 验证配置
 */
export const validateConfig = (config: typeof productionConfig): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // 验证必需的配置项
  if (!config.api.baseUrl) {
    errors.push('API base URL is required');
  }

  if (config.api.timeout <= 0) {
    errors.push('API timeout must be positive');
  }

  if (config.cache.maxMemorySize <= 0) {
    errors.push('Cache max memory size must be positive');
  }

  if (config.search.maxConcurrentSearches <= 0) {
    errors.push('Max concurrent searches must be positive');
  }

  // 验证URL格式
  try {
    new URL(config.api.baseUrl);
  } catch {
    errors.push('Invalid API base URL format');
  }

  if (config.cdn.baseUrl) {
    try {
      new URL(config.cdn.baseUrl);
    } catch {
      errors.push('Invalid CDN base URL format');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default productionConfig;