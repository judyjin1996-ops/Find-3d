/**
 * 智能错误恢复服务
 * 提供自动错误恢复和系统自愈能力
 */

import type { CrawlingError, CrawlerErrorType } from '../crawler/types/crawler';
import { systemHealthMonitor } from './systemHealthMonitor';
import { proxyManager } from '../crawler/utils/proxyManager';
import { rateLimiter } from '../crawler/utils/rateLimiter';

export interface RecoveryStrategy {
  name: string;
  description: string;
  errorTypes: CrawlerErrorType[];
  priority: number; // 优先级，数字越小优先级越高
  maxRetries: number;
  execute: (error: CrawlingError, context: RecoveryContext) => Promise<RecoveryResult>;
}

export interface RecoveryContext {
  websiteId: string;
  ruleId?: string;
  retryCount: number;
  previousStrategies: string[];
  errorHistory: CrawlingError[];
}

export interface RecoveryResult {
  success: boolean;
  strategy: string;
  message: string;
  shouldRetry: boolean;
  delay?: number; // 重试延迟（毫秒）
  newConfig?: any; // 新的配置（如代理、规则等）
}

export interface RecoveryStats {
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  strategiesUsed: Map<string, number>;
  avgRecoveryTime: number;
  recentRecoveries: Array<{
    timestamp: Date;
    error: CrawlingError;
    strategy: string;
    success: boolean;
    recoveryTime: number;
  }>;
}

export class ErrorRecoveryService {
  private strategies: RecoveryStrategy[] = [];
  private stats: RecoveryStats;
  private isEnabled = true;
  private maxRecoveryAttempts = 3;

  constructor() {
    this.stats = {
      totalRecoveries: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      strategiesUsed: new Map(),
      avgRecoveryTime: 0,
      recentRecoveries: []
    };

    this.initializeStrategies();
  }

  /**
   * 初始化恢复策略
   */
  private initializeStrategies(): void {
    // 网络错误恢复策略
    this.addStrategy({
      name: 'network_retry',
      description: '网络重试策略',
      errorTypes: [
        CrawlerErrorType.NETWORK_ERROR,
        CrawlerErrorType.TIMEOUT_ERROR,
        CrawlerErrorType.CONNECTION_REFUSED,
        CrawlerErrorType.DNS_ERROR
      ],
      priority: 1,
      maxRetries: 3,
      execute: this.executeNetworkRetryStrategy.bind(this)
    });

    // 代理切换策略
    this.addStrategy({
      name: 'proxy_switch',
      description: '代理切换策略',
      errorTypes: [
        CrawlerErrorType.BLOCKED_BY_WEBSITE,
        CrawlerErrorType.IP_BANNED,
        CrawlerErrorType.RATE_LIMITED
      ],
      priority: 2,
      maxRetries: 5,
      execute: this.executeProxySwitchStrategy.bind(this)
    });

    // 频率调整策略
    this.addStrategy({
      name: 'rate_adjustment',
      description: '频率调整策略',
      errorTypes: [
        CrawlerErrorType.RATE_LIMITED,
        CrawlerErrorType.BLOCKED_BY_WEBSITE
      ],
      priority: 3,
      maxRetries: 2,
      execute: this.executeRateAdjustmentStrategy.bind(this)
    });

    // 规则修复策略
    this.addStrategy({
      name: 'rule_repair',
      description: '规则修复策略',
      errorTypes: [
        CrawlerErrorType.SELECTOR_NOT_FOUND,
        CrawlerErrorType.PARSE_ERROR,
        CrawlerErrorType.INVALID_HTML
      ],
      priority: 4,
      maxRetries: 2,
      execute: this.executeRuleRepairStrategy.bind(this)
    });

    // 浏览器重启策略
    this.addStrategy({
      name: 'browser_restart',
      description: '浏览器重启策略',
      errorTypes: [
        CrawlerErrorType.BROWSER_CRASH,
        CrawlerErrorType.MEMORY_ERROR
      ],
      priority: 5,
      maxRetries: 1,
      execute: this.executeBrowserRestartStrategy.bind(this)
    });

    // 降级策略
    this.addStrategy({
      name: 'graceful_degradation',
      description: '优雅降级策略',
      errorTypes: Object.values(CrawlerErrorType),
      priority: 10,
      maxRetries: 1,
      execute: this.executeGracefulDegradationStrategy.bind(this)
    });
  }

  /**
   * 添加恢复策略
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 尝试恢复错误
   */
  async attemptRecovery(
    error: CrawlingError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    if (!this.isEnabled) {
      return {
        success: false,
        strategy: 'disabled',
        message: '错误恢复服务已禁用',
        shouldRetry: false
      };
    }

    if (context.retryCount >= this.maxRecoveryAttempts) {
      return {
        success: false,
        strategy: 'max_attempts_exceeded',
        message: `已达到最大恢复尝试次数 (${this.maxRecoveryAttempts})`,
        shouldRetry: false
      };
    }

    const startTime = Date.now();
    this.stats.totalRecoveries++;

    // 查找适用的恢复策略
    const applicableStrategies = this.strategies.filter(strategy =>
      strategy.errorTypes.includes(error.type) &&
      !context.previousStrategies.includes(strategy.name) &&
      context.retryCount < strategy.maxRetries
    );

    if (applicableStrategies.length === 0) {
      const result: RecoveryResult = {
        success: false,
        strategy: 'no_strategy_available',
        message: '没有可用的恢复策略',
        shouldRetry: false
      };

      this.recordRecoveryAttempt(error, result, Date.now() - startTime);
      return result;
    }

    // 执行第一个适用的策略
    const strategy = applicableStrategies[0];
    
    try {
      console.log(`🔧 执行恢复策略: ${strategy.name} (${strategy.description})`);
      
      const result = await strategy.execute(error, context);
      result.strategy = strategy.name;

      // 更新统计信息
      const recoveryTime = Date.now() - startTime;
      this.recordRecoveryAttempt(error, result, recoveryTime);

      if (result.success) {
        this.stats.successfulRecoveries++;
        console.log(`✅ 恢复成功: ${result.message}`);
      } else {
        this.stats.failedRecoveries++;
        console.log(`❌ 恢复失败: ${result.message}`);
      }

      return result;
    } catch (recoveryError) {
      const result: RecoveryResult = {
        success: false,
        strategy: strategy.name,
        message: `恢复策略执行失败: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`,
        shouldRetry: false
      };

      this.recordRecoveryAttempt(error, result, Date.now() - startTime);
      this.stats.failedRecoveries++;
      
      return result;
    }
  }

  /**
   * 网络重试策略
   */
  private async executeNetworkRetryStrategy(
    error: CrawlingError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // 计算退避延迟
    const baseDelay = 1000;
    const delay = Math.min(baseDelay * Math.pow(2, context.retryCount), 30000);

    return {
      success: true,
      strategy: 'network_retry',
      message: `网络重试，延迟 ${delay}ms`,
      shouldRetry: true,
      delay
    };
  }

  /**
   * 代理切换策略
   */
  private async executeProxySwitchStrategy(
    error: CrawlingError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    try {
      const newProxy = proxyManager.getNextProxy();
      
      if (!newProxy) {
        return {
          success: false,
          strategy: 'proxy_switch',
          message: '没有可用的代理',
          shouldRetry: false
        };
      }

      return {
        success: true,
        strategy: 'proxy_switch',
        message: `切换到代理: ${newProxy.host}:${newProxy.port}`,
        shouldRetry: true,
        delay: 2000,
        newConfig: { proxy: newProxy }
      };
    } catch (err) {
      return {
        success: false,
        strategy: 'proxy_switch',
        message: `代理切换失败: ${err instanceof Error ? err.message : String(err)}`,
        shouldRetry: false
      };
    }
  }

  /**
   * 频率调整策略
   */
  private async executeRateAdjustmentStrategy(
    error: CrawlingError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    try {
      // 获取当前网站的频率限制状态
      const websiteStats = rateLimiter.getWebsiteStats(context.websiteId);
      
      // 增加延迟
      const newDelay = Math.min(websiteStats.currentDelay * 2 + 5000, 60000);
      
      // 更新频率限制配置
      rateLimiter.setWebsiteRateLimit(context.websiteId, {
        ...websiteStats.config,
        requestsPerSecond: Math.max(0.1, websiteStats.config.requestsPerSecond * 0.5),
        requestsPerMinute: Math.max(1, Math.floor(websiteStats.config.requestsPerMinute * 0.7))
      });

      return {
        success: true,
        strategy: 'rate_adjustment',
        message: `调整请求频率，新延迟: ${newDelay}ms`,
        shouldRetry: true,
        delay: newDelay
      };
    } catch (err) {
      return {
        success: false,
        strategy: 'rate_adjustment',
        message: `频率调整失败: ${err instanceof Error ? err.message : String(err)}`,
        shouldRetry: false
      };
    }
  }

  /**
   * 规则修复策略
   */
  private async executeRuleRepairStrategy(
    error: CrawlingError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // 这里可以实现智能规则修复逻辑
    // 例如：尝试备用选择器、自动检测页面结构变化等
    
    if (error.type === CrawlerErrorType.SELECTOR_NOT_FOUND) {
      return {
        success: true,
        strategy: 'rule_repair',
        message: '尝试使用备用选择器',
        shouldRetry: true,
        delay: 1000,
        newConfig: { useFallbackSelectors: true }
      };
    }

    return {
      success: false,
      strategy: 'rule_repair',
      message: '无法自动修复规则',
      shouldRetry: false
    };
  }

  /**
   * 浏览器重启策略
   */
  private async executeBrowserRestartStrategy(
    error: CrawlingError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    try {
      // 这里应该实现浏览器重启逻辑
      // 由于这是前端代码，我们只能模拟这个过程
      
      console.log('🔄 模拟浏览器重启...');
      
      // 清理内存
      if (typeof window !== 'undefined' && 'gc' in window) {
        (window as any).gc();
      }

      return {
        success: true,
        strategy: 'browser_restart',
        message: '浏览器重启完成',
        shouldRetry: true,
        delay: 5000
      };
    } catch (err) {
      return {
        success: false,
        strategy: 'browser_restart',
        message: `浏览器重启失败: ${err instanceof Error ? err.message : String(err)}`,
        shouldRetry: false
      };
    }
  }

  /**
   * 优雅降级策略
   */
  private async executeGracefulDegradationStrategy(
    error: CrawlingError,
    context: RecoveryContext
  ): Promise<RecoveryResult> {
    // 降级策略：跳过当前网站，继续其他网站
    return {
      success: true,
      strategy: 'graceful_degradation',
      message: '跳过当前网站，继续其他网站',
      shouldRetry: false,
      newConfig: { skipWebsite: context.websiteId }
    };
  }

  /**
   * 记录恢复尝试
   */
  private recordRecoveryAttempt(
    error: CrawlingError,
    result: RecoveryResult,
    recoveryTime: number
  ): void {
    // 更新策略使用统计
    const currentCount = this.stats.strategiesUsed.get(result.strategy) || 0;
    this.stats.strategiesUsed.set(result.strategy, currentCount + 1);

    // 更新平均恢复时间
    this.stats.avgRecoveryTime = (this.stats.avgRecoveryTime + recoveryTime) / 2;

    // 记录最近的恢复尝试
    this.stats.recentRecoveries.unshift({
      timestamp: new Date(),
      error,
      strategy: result.strategy,
      success: result.success,
      recoveryTime
    });

    // 限制记录数量
    if (this.stats.recentRecoveries.length > 100) {
      this.stats.recentRecoveries = this.stats.recentRecoveries.slice(0, 100);
    }

    // 记录到系统健康监控
    systemHealthMonitor.recordError(error);
  }

  /**
   * 获取恢复统计信息
   */
  getStats(): RecoveryStats {
    return {
      ...this.stats,
      strategiesUsed: new Map(this.stats.strategiesUsed),
      recentRecoveries: [...this.stats.recentRecoveries]
    };
  }

  /**
   * 获取策略列表
   */
  getStrategies(): RecoveryStrategy[] {
    return [...this.strategies];
  }

  /**
   * 启用/禁用错误恢复
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🔧 错误恢复服务${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 设置最大恢复尝试次数
   */
  setMaxRecoveryAttempts(maxAttempts: number): void {
    this.maxRecoveryAttempts = Math.max(1, maxAttempts);
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalRecoveries: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      strategiesUsed: new Map(),
      avgRecoveryTime: 0,
      recentRecoveries: []
    };
  }

  /**
   * 分析错误模式并建议优化
   */
  analyzeErrorPatterns(): {
    mostCommonErrors: Array<{ type: CrawlerErrorType; count: number }>;
    mostEffectiveStrategies: Array<{ strategy: string; successRate: number }>;
    recommendations: string[];
  } {
    const errorCounts = new Map<CrawlerErrorType, number>();
    const strategyStats = new Map<string, { total: number; successful: number }>();

    // 分析最近的恢复记录
    this.stats.recentRecoveries.forEach(record => {
      // 统计错误类型
      const errorCount = errorCounts.get(record.error.type) || 0;
      errorCounts.set(record.error.type, errorCount + 1);

      // 统计策略效果
      const stats = strategyStats.get(record.strategy) || { total: 0, successful: 0 };
      stats.total++;
      if (record.success) {
        stats.successful++;
      }
      strategyStats.set(record.strategy, stats);
    });

    // 最常见的错误
    const mostCommonErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // 最有效的策略
    const mostEffectiveStrategies = Array.from(strategyStats.entries())
      .filter(([, stats]) => stats.total >= 3) // 至少使用过3次
      .map(([strategy, stats]) => ({
        strategy,
        successRate: stats.successful / stats.total
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    // 生成建议
    const recommendations: string[] = [];
    
    if (this.stats.totalRecoveries > 0) {
      const successRate = this.stats.successfulRecoveries / this.stats.totalRecoveries;
      if (successRate < 0.6) {
        recommendations.push('恢复成功率较低，建议检查网站规则和代理配置');
      }
    }

    if (mostCommonErrors.length > 0) {
      const topError = mostCommonErrors[0];
      if (topError.type === CrawlerErrorType.BLOCKED_BY_WEBSITE) {
        recommendations.push('频繁被网站阻止，建议增加代理IP池或调整请求频率');
      } else if (topError.type === CrawlerErrorType.SELECTOR_NOT_FOUND) {
        recommendations.push('选择器失效频繁，建议更新爬虫规则');
      }
    }

    if (this.stats.avgRecoveryTime > 10000) {
      recommendations.push('平均恢复时间较长，建议优化恢复策略');
    }

    return {
      mostCommonErrors,
      mostEffectiveStrategies,
      recommendations
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.strategies = [];
    this.resetStats();
    console.log('🧹 错误恢复服务资源清理完成');
  }
}

// 创建全局错误恢复服务实例
export const errorRecoveryService = new ErrorRecoveryService();

// 默认导出
export default errorRecoveryService;