/**
 * 请求频率控制器
 * 实现智能延迟和请求频率管理
 */

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstSize: number; // 突发请求数量
  adaptiveDelay: boolean; // 自适应延迟
  respectRetryAfter: boolean; // 遵守Retry-After头
}

export interface RequestRecord {
  timestamp: Date;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  retryAfter?: number;
}

export interface RateLimitStatus {
  canMakeRequest: boolean;
  waitTime: number; // 需要等待的毫秒数
  requestsInLastSecond: number;
  requestsInLastMinute: number;
  requestsInLastHour: number;
  avgResponseTime: number;
  successRate: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requestHistory: RequestRecord[] = [];
  private websiteRateLimits = new Map<string, RateLimitConfig>();
  private lastRequestTime = new Map<string, Date>();
  private adaptiveDelays = new Map<string, number>();

  constructor(defaultConfig?: Partial<RateLimitConfig>) {
    this.config = {
      requestsPerSecond: 1,
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      burstSize: 3,
      adaptiveDelay: true,
      respectRetryAfter: true,
      ...defaultConfig
    };
  }

  /**
   * 设置网站特定的频率限制
   */
  setWebsiteRateLimit(websiteId: string, config: Partial<RateLimitConfig>): void {
    const websiteConfig = { ...this.config, ...config };
    this.websiteRateLimits.set(websiteId, websiteConfig);
    console.log(`⚙️ 设置网站频率限制: ${websiteId}`, websiteConfig);
  }

  /**
   * 获取网站的频率限制配置
   */
  private getWebsiteConfig(websiteId: string): RateLimitConfig {
    return this.websiteRateLimits.get(websiteId) || this.config;
  }

  /**
   * 检查是否可以发起请求
   */
  async canMakeRequest(websiteId: string): Promise<RateLimitStatus> {
    const config = this.getWebsiteConfig(websiteId);
    const now = new Date();
    
    // 清理过期的请求记录
    this.cleanupOldRecords();
    
    // 获取各时间段的请求数量
    const requestsInLastSecond = this.getRequestCount(1000);
    const requestsInLastMinute = this.getRequestCount(60 * 1000);
    const requestsInLastHour = this.getRequestCount(60 * 60 * 1000);
    
    // 计算平均响应时间和成功率
    const recentRequests = this.requestHistory.slice(-50);
    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length
      : 0;
    const successRate = recentRequests.length > 0
      ? recentRequests.filter(r => r.success).length / recentRequests.length
      : 1;

    // 检查各种限制
    let waitTime = 0;
    let canMakeRequest = true;

    // 检查每秒限制
    if (requestsInLastSecond >= config.requestsPerSecond) {
      waitTime = Math.max(waitTime, 1000);
      canMakeRequest = false;
    }

    // 检查每分钟限制
    if (requestsInLastMinute >= config.requestsPerMinute) {
      waitTime = Math.max(waitTime, 60 * 1000);
      canMakeRequest = false;
    }

    // 检查每小时限制
    if (requestsInLastHour >= config.requestsPerHour) {
      waitTime = Math.max(waitTime, 60 * 60 * 1000);
      canMakeRequest = false;
    }

    // 检查最小间隔
    const lastRequest = this.lastRequestTime.get(websiteId);
    if (lastRequest) {
      const timeSinceLastRequest = now.getTime() - lastRequest.getTime();
      const minInterval = 1000 / config.requestsPerSecond;
      
      if (timeSinceLastRequest < minInterval) {
        waitTime = Math.max(waitTime, minInterval - timeSinceLastRequest);
        canMakeRequest = false;
      }
    }

    // 自适应延迟
    if (config.adaptiveDelay) {
      const adaptiveWait = this.calculateAdaptiveDelay(websiteId, successRate, avgResponseTime);
      waitTime = Math.max(waitTime, adaptiveWait);
      if (adaptiveWait > 0) {
        canMakeRequest = false;
      }
    }

    return {
      canMakeRequest,
      waitTime,
      requestsInLastSecond,
      requestsInLastMinute,
      requestsInLastHour,
      avgResponseTime,
      successRate
    };
  }

  /**
   * 等待直到可以发起请求
   */
  async waitForRequest(websiteId: string): Promise<void> {
    const status = await this.canMakeRequest(websiteId);
    
    if (!status.canMakeRequest && status.waitTime > 0) {
      console.log(`⏳ 等待 ${status.waitTime}ms 后发起请求到 ${websiteId}`);
      await this.delay(status.waitTime);
    }
    
    // 记录请求时间
    this.lastRequestTime.set(websiteId, new Date());
  }

  /**
   * 记录请求结果
   */
  recordRequest(
    websiteId: string,
    success: boolean,
    responseTime: number,
    statusCode?: number,
    retryAfter?: number
  ): void {
    const record: RequestRecord = {
      timestamp: new Date(),
      success,
      responseTime,
      statusCode,
      retryAfter
    };

    this.requestHistory.push(record);
    
    // 限制历史记录数量
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-500);
    }

    // 处理Retry-After头
    if (retryAfter && this.getWebsiteConfig(websiteId).respectRetryAfter) {
      const delay = retryAfter * 1000; // 转换为毫秒
      this.adaptiveDelays.set(websiteId, delay);
      console.log(`⏰ 服务器要求等待 ${retryAfter}s: ${websiteId}`);
    }

    // 更新自适应延迟
    if (this.getWebsiteConfig(websiteId).adaptiveDelay) {
      this.updateAdaptiveDelay(websiteId, success, responseTime, statusCode);
    }
  }

  /**
   * 计算自适应延迟
   */
  private calculateAdaptiveDelay(websiteId: string, successRate: number, avgResponseTime: number): number {
    const currentDelay = this.adaptiveDelays.get(websiteId) || 0;
    
    // 如果有服务器指定的延迟，优先使用
    if (currentDelay > 0) {
      return currentDelay;
    }

    // 基于成功率和响应时间计算延迟
    let adaptiveDelay = 0;

    // 成功率过低时增加延迟
    if (successRate < 0.8) {
      adaptiveDelay += (0.8 - successRate) * 10000; // 最多10秒
    }

    // 响应时间过长时增加延迟
    if (avgResponseTime > 5000) {
      adaptiveDelay += (avgResponseTime - 5000) * 0.5; // 响应时间越长，延迟越大
    }

    return Math.min(adaptiveDelay, 30000); // 最大30秒延迟
  }

  /**
   * 更新自适应延迟
   */
  private updateAdaptiveDelay(
    websiteId: string,
    success: boolean,
    responseTime: number,
    statusCode?: number
  ): void {
    const currentDelay = this.adaptiveDelays.get(websiteId) || 0;
    let newDelay = currentDelay;

    if (success) {
      // 成功时逐渐减少延迟
      newDelay = Math.max(0, currentDelay * 0.9);
    } else {
      // 失败时增加延迟
      if (statusCode === 429) {
        // 请求过多
        newDelay = Math.min(60000, currentDelay * 2 + 5000);
      } else if (statusCode === 503 || statusCode === 502) {
        // 服务器错误
        newDelay = Math.min(30000, currentDelay + 3000);
      } else if (statusCode && statusCode >= 400) {
        // 其他客户端错误
        newDelay = Math.min(10000, currentDelay + 1000);
      }
    }

    this.adaptiveDelays.set(websiteId, newDelay);
  }

  /**
   * 获取指定时间段内的请求数量
   */
  private getRequestCount(timeWindowMs: number): number {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.requestHistory.filter(record => record.timestamp > cutoff).length;
  }

  /**
   * 清理过期的请求记录
   */
  private cleanupOldRecords(): void {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 保留1小时内的记录
    this.requestHistory = this.requestHistory.filter(record => record.timestamp > cutoff);
  }

  /**
   * 获取网站统计信息
   */
  getWebsiteStats(websiteId: string): {
    config: RateLimitConfig;
    currentDelay: number;
    lastRequestTime?: Date;
    recentRequests: RequestRecord[];
    status: RateLimitStatus;
  } {
    const config = this.getWebsiteConfig(websiteId);
    const currentDelay = this.adaptiveDelays.get(websiteId) || 0;
    const lastRequestTime = this.lastRequestTime.get(websiteId);
    
    // 获取最近的请求记录
    const recentRequests = this.requestHistory.slice(-20);
    
    // 获取当前状态（不等待）
    const status = this.canMakeRequestSync(websiteId);

    return {
      config,
      currentDelay,
      lastRequestTime,
      recentRequests,
      status
    };
  }

  /**
   * 同步检查是否可以发起请求（不等待）
   */
  private canMakeRequestSync(websiteId: string): RateLimitStatus {
    const config = this.getWebsiteConfig(websiteId);
    const now = new Date();
    
    const requestsInLastSecond = this.getRequestCount(1000);
    const requestsInLastMinute = this.getRequestCount(60 * 1000);
    const requestsInLastHour = this.getRequestCount(60 * 60 * 1000);
    
    const recentRequests = this.requestHistory.slice(-50);
    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length
      : 0;
    const successRate = recentRequests.length > 0
      ? recentRequests.filter(r => r.success).length / recentRequests.length
      : 1;

    let waitTime = 0;
    let canMakeRequest = true;

    // 各种检查逻辑（与canMakeRequest相同）
    if (requestsInLastSecond >= config.requestsPerSecond) {
      waitTime = Math.max(waitTime, 1000);
      canMakeRequest = false;
    }

    if (requestsInLastMinute >= config.requestsPerMinute) {
      waitTime = Math.max(waitTime, 60 * 1000);
      canMakeRequest = false;
    }

    if (requestsInLastHour >= config.requestsPerHour) {
      waitTime = Math.max(waitTime, 60 * 60 * 1000);
      canMakeRequest = false;
    }

    const lastRequest = this.lastRequestTime.get(websiteId);
    if (lastRequest) {
      const timeSinceLastRequest = now.getTime() - lastRequest.getTime();
      const minInterval = 1000 / config.requestsPerSecond;
      
      if (timeSinceLastRequest < minInterval) {
        waitTime = Math.max(waitTime, minInterval - timeSinceLastRequest);
        canMakeRequest = false;
      }
    }

    if (config.adaptiveDelay) {
      const adaptiveWait = this.calculateAdaptiveDelay(websiteId, successRate, avgResponseTime);
      waitTime = Math.max(waitTime, adaptiveWait);
      if (adaptiveWait > 0) {
        canMakeRequest = false;
      }
    }

    return {
      canMakeRequest,
      waitTime,
      requestsInLastSecond,
      requestsInLastMinute,
      requestsInLastHour,
      avgResponseTime,
      successRate
    };
  }

  /**
   * 重置网站的频率限制状态
   */
  resetWebsite(websiteId: string): void {
    this.lastRequestTime.delete(websiteId);
    this.adaptiveDelays.delete(websiteId);
    console.log(`🔄 重置网站频率限制: ${websiteId}`);
  }

  /**
   * 重置所有状态
   */
  resetAll(): void {
    this.requestHistory = [];
    this.lastRequestTime.clear();
    this.adaptiveDelays.clear();
    console.log('🔄 重置所有频率限制状态');
  }

  /**
   * 获取全局统计信息
   */
  getGlobalStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    successRate: number;
    activeWebsites: number;
  } {
    const totalRequests = this.requestHistory.length;
    const successfulRequests = this.requestHistory.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const avgResponseTime = totalRequests > 0
      ? this.requestHistory.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests
      : 0;
    
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 1;
    const activeWebsites = this.lastRequestTime.size;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      activeWebsites
    };
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.requestHistory = [];
    this.lastRequestTime.clear();
    this.adaptiveDelays.clear();
    this.websiteRateLimits.clear();
    console.log('🧹 频率控制器资源清理完成');
  }
}

// 创建全局频率控制器实例
export const rateLimiter = new RateLimiter();

// 默认导出
export default rateLimiter;