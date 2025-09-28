/**
 * 生产环境配置
 * 包含监控、错误报告、性能优化等配置
 */

// 应用信息
export const APP_CONFIG = {
  name: 'Find 3D',
  version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  description: '专为三维设计师打造的智能素材搜索平台',
  buildTime: __BUILD_TIME__,
  isProduction: __IS_PRODUCTION__
};

// API配置
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  retryAttempts: 3,
  retryDelay: 1000
};

// 爬虫配置
export const CRAWLER_CONFIG = {
  enabled: import.meta.env.VITE_CRAWLER_ENABLED === 'true',
  maxConcurrent: parseInt(import.meta.env.VITE_CRAWLER_MAX_CONCURRENT || '3'),
  requestDelay: parseInt(import.meta.env.VITE_CRAWLER_REQUEST_DELAY || '2000'),
  timeout: parseInt(import.meta.env.VITE_CRAWLER_TIMEOUT || '30000'),
  userAgent: 'Find3D-Bot/2.0 (+https://find3d.com/bot)',
  respectRobotsTxt: true
};

// 缓存配置
export const CACHE_CONFIG = {
  enabled: import.meta.env.VITE_CACHE_ENABLED === 'true',
  expiry: parseInt(import.meta.env.VITE_CACHE_EXPIRY || '300000'), // 5分钟
  maxSize: parseInt(import.meta.env.VITE_CACHE_MAX_SIZE || '50'), // 50MB
  compression: true,
  encryption: false // 生产环境可考虑启用
};

// 性能配置
export const PERFORMANCE_CONFIG = {
  lazyLoading: import.meta.env.VITE_PERFORMANCE_LAZY_LOADING === 'true',
  imageOptimization: import.meta.env.VITE_PERFORMANCE_IMAGE_OPTIMIZATION === 'true',
  bundleAnalysis: import.meta.env.VITE_PERFORMANCE_BUNDLE_ANALYSIS === 'true',
  preloadCriticalResources: true,
  enableServiceWorker: true,
  enableWebVitals: true
};

// 功能开关
export const FEATURE_FLAGS = {
  advancedSearch: import.meta.env.VITE_FEATURE_ADVANCED_SEARCH === 'true',
  customWebsites: import.meta.env.VITE_FEATURE_CUSTOM_WEBSITES === 'true',
  exportImport: import.meta.env.VITE_FEATURE_EXPORT_IMPORT === 'true',
  realTimeSearch: import.meta.env.VITE_FEATURE_REAL_TIME_SEARCH === 'true',
  darkMode: true,
  multiLanguage: false, // 暂未实现
  offlineMode: false // 暂未实现
};

// 安全配置
export const SECURITY_CONFIG = {
  cspEnabled: import.meta.env.VITE_SECURITY_CSP_ENABLED === 'true',
  httpsOnly: import.meta.env.VITE_SECURITY_HTTPS_ONLY === 'true',
  sanitizeInput: true,
  validateUrls: true,
  rateLimiting: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000 // 1分钟
  }
};

// 监控配置
export const MONITORING_CONFIG = {
  analytics: {
    enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
    trackPageViews: true,
    trackUserInteractions: true,
    trackErrors: true,
    trackPerformance: true
  },
  errorReporting: {
    enabled: import.meta.env.VITE_ERROR_REPORTING_ENABLED === 'true',
    includeStackTrace: true,
    includeUserAgent: true,
    includeUrl: true,
    maxErrorsPerSession: 10
  },
  healthCheck: {
    enabled: true,
    interval: 30000, // 30秒
    endpoints: [
      '/health.json',
      '/api/health'
    ]
  }
};

// 日志配置
export const LOGGING_CONFIG = {
  level: __IS_PRODUCTION__ ? 'warn' : 'debug',
  enableConsole: !__IS_PRODUCTION__,
  enableRemote: __IS_PRODUCTION__,
  maxLogSize: 1000, // 最大日志条数
  categories: {
    crawler: true,
    api: true,
    ui: false,
    performance: true,
    error: true
  }
};

// 用户体验配置
export const UX_CONFIG = {
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out'
  },
  loading: {
    showSpinner: true,
    showProgress: true,
    minimumDuration: 500 // 最小显示时间，避免闪烁
  },
  notifications: {
    position: 'top-right',
    duration: 5000,
    maxVisible: 3
  },
  search: {
    debounceDelay: 300,
    minQueryLength: 2,
    maxSuggestions: 10,
    highlightMatches: true
  }
};

// 开发工具配置
export const DEV_TOOLS_CONFIG = {
  enabled: !__IS_PRODUCTION__,
  showPerformanceMetrics: !__IS_PRODUCTION__,
  showDebugInfo: !__IS_PRODUCTION__,
  enableHotReload: !__IS_PRODUCTION__,
  mockData: !__IS_PRODUCTION__
};

// 导出所有配置
export const PRODUCTION_CONFIG = {
  app: APP_CONFIG,
  api: API_CONFIG,
  crawler: CRAWLER_CONFIG,
  cache: CACHE_CONFIG,
  performance: PERFORMANCE_CONFIG,
  features: FEATURE_FLAGS,
  security: SECURITY_CONFIG,
  monitoring: MONITORING_CONFIG,
  logging: LOGGING_CONFIG,
  ux: UX_CONFIG,
  devTools: DEV_TOOLS_CONFIG
};

// 配置验证函数
export function validateProductionConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必要的环境变量
  if (!import.meta.env.VITE_APP_VERSION) {
    warnings.push('VITE_APP_VERSION 未设置，使用默认版本');
  }

  // 检查爬虫配置
  if (CRAWLER_CONFIG.enabled) {
    if (CRAWLER_CONFIG.maxConcurrent < 1 || CRAWLER_CONFIG.maxConcurrent > 10) {
      warnings.push('爬虫并发数建议设置在1-10之间');
    }
    if (CRAWLER_CONFIG.requestDelay < 1000) {
      warnings.push('请求延迟建议不少于1000ms以避免被封禁');
    }
  }

  // 检查缓存配置
  if (CACHE_CONFIG.enabled) {
    if (CACHE_CONFIG.maxSize > 100) {
      warnings.push('缓存大小超过100MB可能影响性能');
    }
  }

  // 检查安全配置
  if (__IS_PRODUCTION__) {
    if (!SECURITY_CONFIG.httpsOnly) {
      errors.push('生产环境必须启用HTTPS');
    }
    if (!SECURITY_CONFIG.cspEnabled) {
      warnings.push('建议在生产环境启用CSP');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// 初始化生产环境配置
export function initializeProductionConfig(): void {
  const validation = validateProductionConfig();
  
  if (!validation.isValid) {
    console.error('❌ 生产环境配置验证失败:', validation.errors);
    throw new Error('生产环境配置无效');
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ 生产环境配置警告:', validation.warnings);
  }
  
  console.log('✅ 生产环境配置初始化完成');
  
  // 在生产环境中隐藏开发工具
  if (__IS_PRODUCTION__) {
    // 禁用右键菜单
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // 禁用开发者工具快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    });
  }
}

// 获取运行时信息
export function getRuntimeInfo(): {
  environment: string;
  version: string;
  buildTime: string;
  userAgent: string;
  timestamp: string;
} {
  return {
    environment: __IS_PRODUCTION__ ? 'production' : 'development',
    version: APP_CONFIG.version,
    buildTime: APP_CONFIG.buildTime,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
}

// 默认导出
export default PRODUCTION_CONFIG;