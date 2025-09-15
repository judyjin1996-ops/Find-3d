/**
 * 生产环境配置
 * 包含生产环境的所有配置参数和优化设置
 */

export interface ProductionConfig {
  // 应用基础配置
  app: {
    name: string;
    version: string;
    environment: 'production';
    debug: boolean;
    logLevel: 'error' | 'warn' | 'info';
  };

  // API配置
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    rateLimit: {
      maxRequests: number;
      windowMs: number;
    };
  };

  // 爬虫配置
  crawler: {
    maxConcurrentTasks: number;
    defaultDelay: number;
    maxRetries: number;
    timeout: number;
    userAgentRotation: boolean;
    proxyRotation: boolean;
    respectRobotsTxt: boolean;
  };

  // 缓存配置
  cache: {
    defaultTTL: number; // 24小时
    maxSize: number; // 500MB
    cleanupInterval: number; // 1小时
    compressionEnabled: boolean;
    persistToDisk: boolean;
  };

  // 性能配置
  performance: {
    enableServiceWorker: boolean;
    enableGzip: boolean;
    enableBrotli: boolean;
    imageOptimization: boolean;
    lazyLoading: boolean;
    prefetchEnabled: boolean;
    bundleSplitting: boolean;
  };

  // 监控配置
  monitoring: {
    enableHealthCheck: boolean;
    healthCheckInterval: number;
    enableMetrics: boolean;
    metricsInterval: number;
    enableErrorTracking: boolean;
    maxErrorsPerMinute: number;
  };

  // 安全配置
  security: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableXSSProtection: boolean;
    enableFrameGuard: boolean;
    corsOrigins: string[];
    rateLimiting: boolean;
  };

  // CDN配置
  cdn: {
    enabled: boolean;
    baseUrl?: string;
    staticAssets: boolean;
    imageProxy: boolean;
    cacheControl: string;
  };

  // 数据库配置
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    enableQueryLogging: boolean;
    enableSlowQueryLogging: boolean;
    slowQueryThreshold: number;
  };
}

/**
 * 生产环境配置实例
 */
export const productionConfig: ProductionConfig = {
  app: {
    name: 'Find3D Material Search',
    version: '1.0.0',
    environment: 'production',
    debug: false,
    logLevel: 'warn'
  },

  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.find3d.com',
    timeout: 30000,
    retries: 3,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000 // 1分钟
    }
  },

  crawler: {
    maxConcurrentTasks: 5,
    defaultDelay: 2000,
    maxRetries: 3,
    timeout: 30000,
    userAgentRotation: true,
    proxyRotation: true,
    respectRobotsTxt: true
  },

  cache: {
    defaultTTL: 24 * 60 * 60 * 1000, // 24小时
    maxSize: 500 * 1024 * 1024, // 500MB
    cleanupInterval: 60 * 60 * 1000, // 1小时
    compressionEnabled: true,
    persistToDisk: true
  },

  performance: {
    enableServiceWorker: true,
    enableGzip: true,
    enableBrotli: true,
    imageOptimization: true,
    lazyLoading: true,
    prefetchEnabled: true,
    bundleSplitting: true
  },

  monitoring: {
    enableHealthCheck: true,
    healthCheckInterval: 30000, // 30秒
    enableMetrics: true,
    metricsInterval: 60000, // 1分钟
    enableErrorTracking: true,
    maxErrorsPerMinute: 10
  },

  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableFrameGuard: true,
    corsOrigins: [
      'https://find3d.com',
      'https://www.find3d.com',
      'https://app.find3d.com'
    ],
    rateLimiting: true
  },

  cdn: {
    enabled: true,
    baseUrl: process.env.VITE_CDN_BASE_URL || 'https://cdn.find3d.com',
    staticAssets: true,
    imageProxy: true,
    cacheControl: 'public, max-age=31536000' // 1年
  },

  database: {
    connectionPoolSize: 20,
    queryTimeout: 10000,
    enableQueryLogging: false,
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000 // 1秒
  }
};

/**
 * 环境变量验证
 */
export function validateEnvironmentVariables(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_CDN_BASE_URL'
  ];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`缺少必需的环境变量: ${varName}`);
    }
  });

  // 验证URL格式
  if (process.env.VITE_API_BASE_URL && !isValidUrl(process.env.VITE_API_BASE_URL)) {
    errors.push('VITE_API_BASE_URL 格式无效');
  }

  if (process.env.VITE_CDN_BASE_URL && !isValidUrl(process.env.VITE_CDN_BASE_URL)) {
    errors.push('VITE_CDN_BASE_URL 格式无效');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * URL格式验证
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取运行时配置
 */
export function getRuntimeConfig(): ProductionConfig {
  // 在生产环境中，某些配置可能需要从环境变量或远程配置服务获取
  const config = { ...productionConfig };

  // 动态调整配置
  if (process.env.VITE_CRAWLER_MAX_CONCURRENT) {
    config.crawler.maxConcurrentTasks = parseInt(process.env.VITE_CRAWLER_MAX_CONCURRENT, 10);
  }

  if (process.env.VITE_CACHE_MAX_SIZE) {
    config.cache.maxSize = parseInt(process.env.VITE_CACHE_MAX_SIZE, 10) * 1024 * 1024; // MB转字节
  }

  if (process.env.VITE_LOG_LEVEL) {
    config.app.logLevel = process.env.VITE_LOG_LEVEL as 'error' | 'warn' | 'info';
  }

  return config;
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitoringConfig {
  enableRealUserMonitoring: boolean;
  enableSyntheticMonitoring: boolean;
  metricsEndpoint: string;
  sampleRate: number;
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableNavigationTiming: boolean;
}

export const performanceMonitoringConfig: PerformanceMonitoringConfig = {
  enableRealUserMonitoring: true,
  enableSyntheticMonitoring: true,
  metricsEndpoint: process.env.VITE_METRICS_ENDPOINT || 'https://metrics.find3d.com/collect',
  sampleRate: 0.1, // 10%采样率
  enableWebVitals: true,
  enableResourceTiming: true,
  enableNavigationTiming: true
};

/**
 * 错误追踪配置
 */
export interface ErrorTrackingConfig {
  enabled: boolean;
  dsn: string;
  environment: string;
  sampleRate: number;
  enableSourceMaps: boolean;
  enableUserFeedback: boolean;
  enablePerformanceMonitoring: boolean;
}

export const errorTrackingConfig: ErrorTrackingConfig = {
  enabled: true,
  dsn: process.env.VITE_SENTRY_DSN || '',
  environment: 'production',
  sampleRate: 1.0,
  enableSourceMaps: true,
  enableUserFeedback: true,
  enablePerformanceMonitoring: true
};

/**
 * 功能标志配置
 */
export interface FeatureFlags {
  enableNewSearchUI: boolean;
  enableAdvancedFilters: boolean;
  enableBulkDownload: boolean;
  enableUserAccounts: boolean;
  enablePremiumFeatures: boolean;
  enableAnalytics: boolean;
  enableA11yFeatures: boolean;
}

export const featureFlags: FeatureFlags = {
  enableNewSearchUI: true,
  enableAdvancedFilters: true,
  enableBulkDownload: false, // 待开发
  enableUserAccounts: false, // 待开发
  enablePremiumFeatures: false, // 待开发
  enableAnalytics: true,
  enableA11yFeatures: true
};

/**
 * 获取功能标志
 */
export function getFeatureFlag(flagName: keyof FeatureFlags): boolean {
  // 可以从远程配置服务获取
  const envFlag = process.env[`VITE_FEATURE_${flagName.toUpperCase()}`];
  if (envFlag !== undefined) {
    return envFlag === 'true';
  }
  
  return featureFlags[flagName];
}

/**
 * 部署信息
 */
export interface DeploymentInfo {
  version: string;
  buildTime: string;
  commitHash: string;
  branch: string;
  environment: string;
  region: string;
}

export function getDeploymentInfo(): DeploymentInfo {
  return {
    version: process.env.VITE_APP_VERSION || '1.0.0',
    buildTime: process.env.VITE_BUILD_TIME || new Date().toISOString(),
    commitHash: process.env.VITE_COMMIT_HASH || 'unknown',
    branch: process.env.VITE_BRANCH || 'main',
    environment: 'production',
    region: process.env.VITE_DEPLOY_REGION || 'global'
  };
}