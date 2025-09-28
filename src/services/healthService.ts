/**
 * 健康检查和监控服务
 * 用于监控应用状态和性能
 */

import { PRODUCTION_CONFIG, getRuntimeInfo } from '../config/production';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  metrics: PerformanceMetrics;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
  timestamp: string;
}

export interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timing: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  resources: {
    totalRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
  cache: {
    hitRate: number;
    size: number;
    entries: number;
  };
}

export class HealthService {
  private startTime: number;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private performanceObserver?: PerformanceObserver;
  private resourceMetrics: { requests: number; failures: number; totalTime: number } = {
    requests: 0,
    failures: 0,
    totalTime: 0
  };

  constructor() {
    this.startTime = Date.now();
    this.initializePerformanceMonitoring();
    this.scheduleHealthChecks();
  }

  /**
   * 获取应用健康状态
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await this.runHealthChecks();
    const metrics = await this.getPerformanceMetrics();
    
    // 确定整体状态
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasFailures) {
      status = 'unhealthy';
    } else if (hasWarnings) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      version: PRODUCTION_CONFIG.app.version,
      uptime: Date.now() - this.startTime,
      checks,
      metrics
    };
  }

  /**
   * 运行所有健康检查
   */
  private async runHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // 检查本地存储
    checks.push(await this.checkLocalStorage());
    
    // 检查网络连接
    checks.push(await this.checkNetworkConnection());
    
    // 检查缓存服务
    checks.push(await this.checkCacheService());
    
    // 检查爬虫服务
    checks.push(await this.checkCrawlerService());
    
    // 检查内存使用
    checks.push(await this.checkMemoryUsage());

    return checks;
  }

  /**
   * 检查本地存储
   */
  private async checkLocalStorage(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // 测试localStorage读写
      const testKey = '__health_check_test__';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved !== testValue) {
        throw new Error('localStorage读写不一致');
      }

      return {
        name: 'localStorage',
        status: 'pass',
        message: 'localStorage正常工作',
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'localStorage',
        status: 'fail',
        message: `localStorage检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查网络连接
   */
  private async checkNetworkConnection(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // 检查navigator.onLine
      if (!navigator.onLine) {
        return {
          name: 'network',
          status: 'fail',
          message: '网络连接不可用',
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // 尝试发送一个轻量级请求
      const response = await fetch('/health.json', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        name: 'network',
        status: 'pass',
        message: '网络连接正常',
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'network',
        status: 'warn',
        message: `网络检查警告: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查缓存服务
   */
  private async checkCacheService(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // 检查缓存配置
      if (!PRODUCTION_CONFIG.cache.enabled) {
        return {
          name: 'cache',
          status: 'warn',
          message: '缓存服务已禁用',
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // 检查缓存大小
      const cacheSize = this.estimateCacheSize();
      const maxSize = PRODUCTION_CONFIG.cache.maxSize * 1024 * 1024; // 转换为字节
      
      if (cacheSize > maxSize * 0.9) {
        return {
          name: 'cache',
          status: 'warn',
          message: `缓存使用率过高: ${Math.round(cacheSize / maxSize * 100)}%`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      return {
        name: 'cache',
        status: 'pass',
        message: `缓存服务正常 (${Math.round(cacheSize / 1024 / 1024)}MB)`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'fail',
        message: `缓存检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查爬虫服务
   */
  private async checkCrawlerService(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      if (!PRODUCTION_CONFIG.crawler.enabled) {
        return {
          name: 'crawler',
          status: 'warn',
          message: '爬虫服务已禁用',
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // 这里可以添加爬虫服务的具体检查逻辑
      // 例如检查爬虫任务队列、活跃连接数等
      
      return {
        name: 'crawler',
        status: 'pass',
        message: '爬虫服务正常',
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'crawler',
        status: 'fail',
        message: `爬虫服务检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查内存使用
   */
  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // 检查内存使用情况（如果支持）
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 90) {
          return {
            name: 'memory',
            status: 'fail',
            message: `内存使用率过高: ${usedPercent.toFixed(1)}%`,
            duration: performance.now() - startTime,
            timestamp: new Date().toISOString()
          };
        } else if (usedPercent > 70) {
          return {
            name: 'memory',
            status: 'warn',
            message: `内存使用率较高: ${usedPercent.toFixed(1)}%`,
            duration: performance.now() - startTime,
            timestamp: new Date().toISOString()
          };
        }
        
        return {
          name: 'memory',
          status: 'pass',
          message: `内存使用正常: ${usedPercent.toFixed(1)}%`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      return {
        name: 'memory',
        status: 'warn',
        message: '内存信息不可用',
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'fail',
        message: `内存检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取性能指标
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const memory = this.getMemoryMetrics();
    const timing = this.getTimingMetrics();
    const resources = this.getResourceMetrics();
    const cache = this.getCacheMetrics();

    return {
      memory,
      timing,
      resources,
      cache
    };
  }

  /**
   * 获取内存指标
   */
  private getMemoryMetrics() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * 获取时间指标
   */
  private getTimingMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      loadComplete: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    };
  }

  /**
   * 获取资源指标
   */
  private getResourceMetrics() {
    return {
      totalRequests: this.resourceMetrics.requests,
      failedRequests: this.resourceMetrics.failures,
      averageResponseTime: this.resourceMetrics.requests > 0 
        ? this.resourceMetrics.totalTime / this.resourceMetrics.requests 
        : 0
    };
  }

  /**
   * 获取缓存指标
   */
  private getCacheMetrics() {
    const cacheSize = this.estimateCacheSize();
    const cacheEntries = this.estimateCacheEntries();
    
    return {
      hitRate: 0, // 需要实际的缓存服务来提供
      size: cacheSize,
      entries: cacheEntries
    };
  }

  /**
   * 估算缓存大小
   */
  private estimateCacheSize(): number {
    try {
      let totalSize = 0;
      
      // 估算localStorage大小
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      // 估算sessionStorage大小
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          totalSize += sessionStorage[key].length + key.length;
        }
      }
      
      return totalSize * 2; // 粗略估算，考虑UTF-16编码
    } catch {
      return 0;
    }
  }

  /**
   * 估算缓存条目数
   */
  private estimateCacheEntries(): number {
    try {
      return localStorage.length + sessionStorage.length;
    } catch {
      return 0;
    }
  }

  /**
   * 初始化性能监控
   */
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.resourceMetrics.requests++;
            this.resourceMetrics.totalTime += entry.duration;
            
            // 检查是否是失败的请求
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
              this.resourceMetrics.failures++;
            }
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * 定期健康检查
   */
  private scheduleHealthChecks(): void {
    if (PRODUCTION_CONFIG.monitoring.healthCheck.enabled) {
      setInterval(async () => {
        try {
          const status = await this.getHealthStatus();
          
          // 如果状态不健康，可以触发告警
          if (status.status === 'unhealthy') {
            console.error('🚨 应用健康检查失败:', status);
            this.reportHealthIssue(status);
          } else if (status.status === 'degraded') {
            console.warn('⚠️ 应用性能降级:', status);
          }
        } catch (error) {
          console.error('健康检查执行失败:', error);
        }
      }, PRODUCTION_CONFIG.monitoring.healthCheck.interval);
    }
  }

  /**
   * 报告健康问题
   */
  private reportHealthIssue(status: HealthStatus): void {
    // 这里可以集成错误报告服务
    // 例如发送到监控系统、日志服务等
    
    const issue = {
      type: 'health_check_failure',
      status: status.status,
      timestamp: status.timestamp,
      version: status.version,
      uptime: status.uptime,
      failedChecks: status.checks.filter(check => check.status === 'fail'),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // 发送到控制台（生产环境中应该发送到监控服务）
    console.error('健康检查问题报告:', issue);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// 创建全局健康服务实例
export const healthService = new HealthService();

// 默认导出
export default healthService;