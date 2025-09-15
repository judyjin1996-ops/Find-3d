/**
 * 系统健康监控服务
 * 监控系统性能、资源使用和错误状态
 */

import { CrawlingError, CrawlerErrorType } from '../crawler/types/crawler';

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  components: {
    memory: ComponentHealth;
    network: ComponentHealth;
    crawler: ComponentHealth;
    cache: ComponentHealth;
    storage: ComponentHealth;
  };
  alerts: SystemAlert[];
  metrics: SystemMetrics;
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number; // 0-100
  message: string;
  lastCheck: Date;
  metrics?: any;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  component: string;
  acknowledged: boolean;
  autoResolve: boolean;
}

export interface SystemMetrics {
  uptime: number; // 毫秒
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cacheStats: {
    hitRate: number;
    size: number;
    itemCount: number;
  };
  errorStats: {
    totalErrors: number;
    errorsByType: Map<CrawlerErrorType, number>;
    recentErrors: CrawlingError[];
  };
}

export interface PerformanceThresholds {
  memory: {
    warning: number; // 百分比
    critical: number;
  };
  responseTime: {
    warning: number; // 毫秒
    critical: number;
  };
  errorRate: {
    warning: number; // 百分比
    critical: number;
  };
  cacheHitRate: {
    warning: number; // 百分比
    critical: number;
  };
}

export class SystemHealthMonitor {
  private startTime = Date.now();
  private metrics: SystemMetrics;
  private alerts: SystemAlert[] = [];
  private thresholds: PerformanceThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      memory: { warning: 70, critical: 90 },
      responseTime: { warning: 5000, critical: 10000 },
      errorRate: { warning: 10, critical: 25 },
      cacheHitRate: { warning: 60, critical: 40 },
      ...thresholds
    };

    this.metrics = {
      uptime: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      cacheStats: { hitRate: 0, size: 0, itemCount: 0 },
      errorStats: {
        totalErrors: 0,
        errorsByType: new Map(),
        recentErrors: []
      }
    };
  }

  /**
   * 启动健康监控
   */
  startMonitoring(intervalMs = 30000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🏥 启动系统健康监控...');

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    // 立即执行一次检查
    this.performHealthCheck();
  }

  /**
   * 停止健康监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🏥 系统健康监控已停止');
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const now = new Date();
    
    // 更新运行时间
    this.metrics.uptime = Date.now() - this.startTime;

    // 检查各个组件
    const components = {
      memory: await this.checkMemoryHealth(),
      network: await this.checkNetworkHealth(),
      crawler: await this.checkCrawlerHealth(),
      cache: await this.checkCacheHealth(),
      storage: await this.checkStorageHealth()
    };

    // 计算总体健康分数
    const scores = Object.values(components).map(c => c.score);
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // 确定总体状态
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (overallScore < 50) {
      overallStatus = 'critical';
    } else if (overallScore < 80) {
      overallStatus = 'warning';
    }

    // 检查并生成告警
    this.checkAndGenerateAlerts(components);

    const health: SystemHealth = {
      overall: overallStatus,
      score: Math.round(overallScore),
      components,
      alerts: this.getActiveAlerts(),
      metrics: { ...this.metrics }
    };

    return health;
  }

  /**
   * 检查内存健康状态
   */
  private async checkMemoryHealth(): Promise<ComponentHealth> {
    try {
      // 获取内存使用情况
      const memoryUsage = this.getMemoryUsage();
      this.metrics.memoryUsage = memoryUsage;

      let status: ComponentHealth['status'] = 'healthy';
      let score = 100;
      let message = '内存使用正常';

      if (memoryUsage.percentage >= this.thresholds.memory.critical) {
        status = 'critical';
        score = 20;
        message = `内存使用过高: ${memoryUsage.percentage.toFixed(1)}%`;
      } else if (memoryUsage.percentage >= this.thresholds.memory.warning) {
        status = 'warning';
        score = 60;
        message = `内存使用较高: ${memoryUsage.percentage.toFixed(1)}%`;
      } else {
        score = Math.max(20, 100 - memoryUsage.percentage);
        message = `内存使用: ${memoryUsage.percentage.toFixed(1)}%`;
      }

      return {
        status,
        score,
        message,
        lastCheck: new Date(),
        metrics: memoryUsage
      };
    } catch (error) {
      return {
        status: 'unknown',
        score: 0,
        message: '无法获取内存信息',
        lastCheck: new Date()
      };
    }
  }

  /**
   * 检查网络健康状态
   */
  private async checkNetworkHealth(): Promise<ComponentHealth> {
    try {
      const errorRate = this.calculateErrorRate();
      const avgResponseTime = this.metrics.avgResponseTime;

      let status: ComponentHealth['status'] = 'healthy';
      let score = 100;
      let message = '网络连接正常';

      // 检查错误率
      if (errorRate >= this.thresholds.errorRate.critical) {
        status = 'critical';
        score = Math.min(score, 20);
        message = `网络错误率过高: ${errorRate.toFixed(1)}%`;
      } else if (errorRate >= this.thresholds.errorRate.warning) {
        status = 'warning';
        score = Math.min(score, 60);
        message = `网络错误率较高: ${errorRate.toFixed(1)}%`;
      }

      // 检查响应时间
      if (avgResponseTime >= this.thresholds.responseTime.critical) {
        status = 'critical';
        score = Math.min(score, 20);
        message = `网络响应过慢: ${avgResponseTime.toFixed(0)}ms`;
      } else if (avgResponseTime >= this.thresholds.responseTime.warning) {
        status = status === 'critical' ? 'critical' : 'warning';
        score = Math.min(score, 60);
        message = `网络响应较慢: ${avgResponseTime.toFixed(0)}ms`;
      }

      if (status === 'healthy') {
        score = Math.max(20, 100 - errorRate * 2 - avgResponseTime / 100);
        message = `错误率: ${errorRate.toFixed(1)}%, 响应时间: ${avgResponseTime.toFixed(0)}ms`;
      }

      return {
        status,
        score,
        message,
        lastCheck: new Date(),
        metrics: { errorRate, avgResponseTime }
      };
    } catch (error) {
      return {
        status: 'unknown',
        score: 0,
        message: '无法获取网络状态',
        lastCheck: new Date()
      };
    }
  }

  /**
   * 检查爬虫健康状态
   */
  private async checkCrawlerHealth(): Promise<ComponentHealth> {
    try {
      const recentErrors = this.metrics.errorStats.recentErrors.slice(-10);
      const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length;
      const totalRequests = this.metrics.totalRequests;
      const successRate = totalRequests > 0 ? (this.metrics.successfulRequests / totalRequests) * 100 : 100;

      let status: ComponentHealth['status'] = 'healthy';
      let score = 100;
      let message = '爬虫运行正常';

      if (criticalErrors > 3) {
        status = 'critical';
        score = 20;
        message = `爬虫出现多个严重错误: ${criticalErrors}个`;
      } else if (criticalErrors > 1 || successRate < 70) {
        status = 'warning';
        score = 60;
        message = `爬虫性能下降，成功率: ${successRate.toFixed(1)}%`;
      } else {
        score = Math.max(20, successRate);
        message = `爬虫成功率: ${successRate.toFixed(1)}%`;
      }

      return {
        status,
        score,
        message,
        lastCheck: new Date(),
        metrics: { successRate, criticalErrors, recentErrors: recentErrors.length }
      };
    } catch (error) {
      return {
        status: 'unknown',
        score: 0,
        message: '无法获取爬虫状态',
        lastCheck: new Date()
      };
    }
  }

  /**
   * 检查缓存健康状态
   */
  private async checkCacheHealth(): Promise<ComponentHealth> {
    try {
      const cacheStats = this.metrics.cacheStats;
      const hitRate = cacheStats.hitRate * 100;

      let status: ComponentHealth['status'] = 'healthy';
      let score = 100;
      let message = '缓存运行正常';

      if (hitRate < this.thresholds.cacheHitRate.critical) {
        status = 'critical';
        score = 30;
        message = `缓存命中率过低: ${hitRate.toFixed(1)}%`;
      } else if (hitRate < this.thresholds.cacheHitRate.warning) {
        status = 'warning';
        score = 60;
        message = `缓存命中率较低: ${hitRate.toFixed(1)}%`;
      } else {
        score = Math.max(30, hitRate);
        message = `缓存命中率: ${hitRate.toFixed(1)}%`;
      }

      return {
        status,
        score,
        message,
        lastCheck: new Date(),
        metrics: cacheStats
      };
    } catch (error) {
      return {
        status: 'unknown',
        score: 0,
        message: '无法获取缓存状态',
        lastCheck: new Date()
      };
    }
  }

  /**
   * 检查存储健康状态
   */
  private async checkStorageHealth(): Promise<ComponentHealth> {
    try {
      // 检查localStorage可用性
      const storageAvailable = this.checkStorageAvailability();
      
      if (!storageAvailable) {
        return {
          status: 'critical',
          score: 0,
          message: '本地存储不可用',
          lastCheck: new Date()
        };
      }

      // 检查存储空间使用情况
      const storageUsage = this.getStorageUsage();
      
      let status: ComponentHealth['status'] = 'healthy';
      let score = 100;
      let message = '存储空间充足';

      if (storageUsage.percentage > 90) {
        status = 'critical';
        score = 20;
        message = `存储空间不足: ${storageUsage.percentage.toFixed(1)}%`;
      } else if (storageUsage.percentage > 80) {
        status = 'warning';
        score = 60;
        message = `存储空间较满: ${storageUsage.percentage.toFixed(1)}%`;
      } else {
        score = Math.max(20, 100 - storageUsage.percentage);
        message = `存储使用: ${storageUsage.percentage.toFixed(1)}%`;
      }

      return {
        status,
        score,
        message,
        lastCheck: new Date(),
        metrics: storageUsage
      };
    } catch (error) {
      return {
        status: 'unknown',
        score: 0,
        message: '无法获取存储状态',
        lastCheck: new Date()
      };
    }
  }

  /**
   * 记录请求结果
   */
  recordRequest(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // 更新平均响应时间
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2;
  }

  /**
   * 记录错误
   */
  recordError(error: CrawlingError): void {
    this.metrics.errorStats.totalErrors++;
    
    // 更新错误类型统计
    const currentCount = this.metrics.errorStats.errorsByType.get(error.type) || 0;
    this.metrics.errorStats.errorsByType.set(error.type, currentCount + 1);
    
    // 添加到最近错误列表
    this.metrics.errorStats.recentErrors.unshift(error);
    
    // 限制最近错误数量
    if (this.metrics.errorStats.recentErrors.length > 100) {
      this.metrics.errorStats.recentErrors = this.metrics.errorStats.recentErrors.slice(0, 100);
    }
  }

  /**
   * 更新缓存统计
   */
  updateCacheStats(hitRate: number, size: number, itemCount: number): void {
    this.metrics.cacheStats = { hitRate, size, itemCount };
  }

  /**
   * 检查并生成告警
   */
  private checkAndGenerateAlerts(components: SystemHealth['components']): void {
    for (const [componentName, health] of Object.entries(components)) {
      if (health.status === 'critical' || health.status === 'warning') {
        this.generateAlert(
          health.status === 'critical' ? 'critical' : 'warning',
          `${componentName}组件异常`,
          health.message,
          componentName
        );
      }
    }
  }

  /**
   * 生成告警
   */
  private generateAlert(
    type: SystemAlert['type'],
    title: string,
    message: string,
    component: string,
    autoResolve = true
  ): void {
    const alertId = `${component}_${type}_${Date.now()}`;
    
    // 检查是否已存在相同的告警
    const existingAlert = this.alerts.find(alert => 
      alert.component === component && 
      alert.type === type && 
      !alert.acknowledged
    );

    if (existingAlert) {
      // 更新现有告警
      existingAlert.message = message;
      existingAlert.timestamp = new Date();
    } else {
      // 创建新告警
      const alert: SystemAlert = {
        id: alertId,
        type,
        title,
        message,
        timestamp: new Date(),
        component,
        acknowledged: false,
        autoResolve
      };

      this.alerts.unshift(alert);
      
      // 限制告警数量
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(0, 50);
      }

      console.warn(`🚨 系统告警 [${type.toUpperCase()}]: ${title} - ${message}`);
    }
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * 确认告警
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * 清除所有告警
   */
  clearAllAlerts(): void {
    this.alerts = [];
  }

  /**
   * 获取系统指标
   */
  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * 计算错误率
   */
  private calculateErrorRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): SystemMetrics['memoryUsage'] {
    try {
      // 在浏览器环境中，我们只能估算内存使用
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        };
      }
      
      // 估算值
      return {
        used: 50 * 1024 * 1024, // 50MB
        total: 100 * 1024 * 1024, // 100MB
        percentage: 50
      };
    } catch {
      return {
        used: 0,
        total: 0,
        percentage: 0
      };
    }
  }

  /**
   * 检查存储可用性
   */
  private checkStorageAvailability(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取存储使用情况
   */
  private getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      
      // 计算localStorage使用量
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }

      // 估算总容量（通常为5-10MB）
      const total = 5 * 1024 * 1024; // 5MB
      const percentage = (used / total) * 100;

      return { used, total, percentage };
    } catch {
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopMonitoring();
    this.alerts = [];
    console.log('🧹 系统健康监控器资源清理完成');
  }
}

// 创建全局系统健康监控器实例
export const systemHealthMonitor = new SystemHealthMonitor();

// 默认导出
export default systemHealthMonitor;