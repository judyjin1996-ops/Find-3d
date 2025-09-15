/**
 * 代理管理器
 * 管理代理IP池，实现智能轮换和健康检查
 */

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  country?: string;
  provider?: string;
}

export interface ProxyStatus {
  proxy: ProxyConfig;
  isActive: boolean;
  lastUsed: Date;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  lastError?: string;
  healthScore: number; // 0-100
}

export interface ProxyTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  ipAddress?: string;
  location?: string;
}

export class ProxyManager {
  private proxies: Map<string, ProxyStatus> = new Map();
  private currentProxyIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthChecking = false;

  constructor() {
    this.startHealthCheck();
  }

  /**
   * 添加代理
   */
  addProxy(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    
    if (!this.proxies.has(key)) {
      const status: ProxyStatus = {
        proxy,
        isActive: true,
        lastUsed: new Date(0),
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
        healthScore: 100
      };
      
      this.proxies.set(key, status);
      console.log(`🌐 添加代理: ${proxy.host}:${proxy.port}`);
    }
  }

  /**
   * 批量添加代理
   */
  addProxies(proxies: ProxyConfig[]): void {
    proxies.forEach(proxy => this.addProxy(proxy));
  }

  /**
   * 移除代理
   */
  removeProxy(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    if (this.proxies.delete(key)) {
      console.log(`🗑️ 移除代理: ${proxy.host}:${proxy.port}`);
    }
  }

  /**
   * 获取下一个可用代理
   */
  getNextProxy(): ProxyConfig | null {
    const activeProxies = Array.from(this.proxies.values())
      .filter(status => status.isActive)
      .sort((a, b) => {
        // 按健康分数和最后使用时间排序
        const scoreA = a.healthScore - (Date.now() - a.lastUsed.getTime()) / 1000 / 60; // 减去分钟数
        const scoreB = b.healthScore - (Date.now() - b.lastUsed.getTime()) / 1000 / 60;
        return scoreB - scoreA;
      });

    if (activeProxies.length === 0) {
      console.warn('⚠️ 没有可用的代理');
      return null;
    }

    // 轮换策略：优先选择健康分数高且最近未使用的代理
    const selectedProxy = activeProxies[0];
    selectedProxy.lastUsed = new Date();
    
    console.log(`🔄 选择代理: ${selectedProxy.proxy.host}:${selectedProxy.proxy.port} (健康分数: ${selectedProxy.healthScore})`);
    return selectedProxy.proxy;
  }

  /**
   * 获取随机代理
   */
  getRandomProxy(): ProxyConfig | null {
    const activeProxies = Array.from(this.proxies.values())
      .filter(status => status.isActive);

    if (activeProxies.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * activeProxies.length);
    const selectedProxy = activeProxies[randomIndex];
    selectedProxy.lastUsed = new Date();
    
    return selectedProxy.proxy;
  }

  /**
   * 报告代理使用结果
   */
  reportProxyResult(proxy: ProxyConfig, success: boolean, responseTime?: number, error?: string): void {
    const key = this.getProxyKey(proxy);
    const status = this.proxies.get(key);
    
    if (!status) return;

    if (success) {
      status.successCount++;
      if (responseTime) {
        status.avgResponseTime = (status.avgResponseTime + responseTime) / 2;
      }
      // 成功时提升健康分数
      status.healthScore = Math.min(100, status.healthScore + 2);
    } else {
      status.failureCount++;
      status.lastError = error;
      // 失败时降低健康分数
      status.healthScore = Math.max(0, status.healthScore - 10);
      
      // 连续失败过多时暂时禁用
      if (status.failureCount > 5 && status.healthScore < 20) {
        status.isActive = false;
        console.warn(`❌ 代理暂时禁用: ${proxy.host}:${proxy.port} (健康分数: ${status.healthScore})`);
      }
    }

    this.proxies.set(key, status);
  }

  /**
   * 测试代理连通性
   */
  async testProxy(proxy: ProxyConfig): Promise<ProxyTestResult> {
    const startTime = Date.now();
    
    try {
      // 使用代理请求测试URL
      const testUrl = 'http://httpbin.org/ip';
      const proxyUrl = this.buildProxyUrl(proxy);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        // @ts-ignore - Node.js环境下的代理配置
        agent: proxyUrl,
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime,
        ipAddress: data.origin,
        location: data.country || 'Unknown'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 健康检查
   */
  async performHealthCheck(): Promise<void> {
    if (this.isHealthChecking) return;
    
    this.isHealthChecking = true;
    console.log('🔍 开始代理健康检查...');

    const promises = Array.from(this.proxies.entries()).map(async ([key, status]) => {
      const result = await this.testProxy(status.proxy);
      
      if (result.success) {
        status.isActive = true;
        status.healthScore = Math.min(100, status.healthScore + 5);
        status.avgResponseTime = result.responseTime;
      } else {
        status.healthScore = Math.max(0, status.healthScore - 15);
        status.lastError = result.error;
        
        // 健康分数过低时禁用
        if (status.healthScore < 30) {
          status.isActive = false;
        }
      }
      
      this.proxies.set(key, status);
    });

    await Promise.allSettled(promises);
    
    const activeCount = Array.from(this.proxies.values()).filter(s => s.isActive).length;
    console.log(`✅ 健康检查完成: ${activeCount}/${this.proxies.size} 个代理可用`);
    
    this.isHealthChecking = false;
  }

  /**
   * 启动定期健康检查
   */
  private startHealthCheck(): void {
    // 每5分钟检查一次
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * 获取代理统计信息
   */
  getProxyStats(): {
    total: number;
    active: number;
    inactive: number;
    avgHealthScore: number;
    avgResponseTime: number;
    topProxies: ProxyStatus[];
  } {
    const statuses = Array.from(this.proxies.values());
    const activeProxies = statuses.filter(s => s.isActive);
    
    const avgHealthScore = statuses.length > 0 
      ? statuses.reduce((sum, s) => sum + s.healthScore, 0) / statuses.length 
      : 0;
      
    const avgResponseTime = activeProxies.length > 0
      ? activeProxies.reduce((sum, s) => sum + s.avgResponseTime, 0) / activeProxies.length
      : 0;

    const topProxies = statuses
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 5);

    return {
      total: statuses.length,
      active: activeProxies.length,
      inactive: statuses.length - activeProxies.length,
      avgHealthScore: Math.round(avgHealthScore),
      avgResponseTime: Math.round(avgResponseTime),
      topProxies
    };
  }

  /**
   * 重置代理状态
   */
  resetProxy(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    const status = this.proxies.get(key);
    
    if (status) {
      status.isActive = true;
      status.successCount = 0;
      status.failureCount = 0;
      status.healthScore = 100;
      status.lastError = undefined;
      this.proxies.set(key, status);
      
      console.log(`🔄 重置代理状态: ${proxy.host}:${proxy.port}`);
    }
  }

  /**
   * 重置所有代理状态
   */
  resetAllProxies(): void {
    for (const [key, status] of this.proxies.entries()) {
      status.isActive = true;
      status.successCount = 0;
      status.failureCount = 0;
      status.healthScore = 100;
      status.lastError = undefined;
      this.proxies.set(key, status);
    }
    
    console.log('🔄 重置所有代理状态');
  }

  /**
   * 导入代理列表
   */
  importProxies(proxyList: string[]): number {
    let importedCount = 0;
    
    for (const proxyStr of proxyList) {
      try {
        const proxy = this.parseProxyString(proxyStr);
        if (proxy) {
          this.addProxy(proxy);
          importedCount++;
        }
      } catch (error) {
        console.warn(`解析代理失败: ${proxyStr}`, error);
      }
    }
    
    console.log(`📥 导入代理: ${importedCount}/${proxyList.length} 个成功`);
    return importedCount;
  }

  /**
   * 导出代理列表
   */
  exportProxies(): string[] {
    return Array.from(this.proxies.values()).map(status => {
      const proxy = status.proxy;
      const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : '';
      return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
    });
  }

  /**
   * 清理无效代理
   */
  cleanupInactiveProxies(): number {
    const before = this.proxies.size;
    
    for (const [key, status] of this.proxies.entries()) {
      if (!status.isActive && status.healthScore < 10) {
        this.proxies.delete(key);
      }
    }
    
    const removed = before - this.proxies.size;
    if (removed > 0) {
      console.log(`🧹 清理无效代理: ${removed} 个`);
    }
    
    return removed;
  }

  /**
   * 获取代理键值
   */
  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.protocol}://${proxy.host}:${proxy.port}`;
  }

  /**
   * 构建代理URL
   */
  private buildProxyUrl(proxy: ProxyConfig): string {
    const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : '';
    return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
  }

  /**
   * 解析代理字符串
   */
  private parseProxyString(proxyStr: string): ProxyConfig | null {
    try {
      // 支持格式: protocol://[username:password@]host:port
      const url = new URL(proxyStr);
      
      return {
        protocol: url.protocol.slice(0, -1) as ProxyConfig['protocol'],
        host: url.hostname,
        port: parseInt(url.port),
        username: url.username || undefined,
        password: url.password || undefined
      };
    } catch {
      // 支持格式: host:port
      const parts = proxyStr.split(':');
      if (parts.length >= 2) {
        return {
          protocol: 'http',
          host: parts[0],
          port: parseInt(parts[1])
        };
      }
      return null;
    }
  }

  /**
   * 获取所有代理状态
   */
  getAllProxies(): ProxyStatus[] {
    return Array.from(this.proxies.values());
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopHealthCheck();
    this.proxies.clear();
    console.log('🧹 代理管理器资源清理完成');
  }
}

// 创建全局代理管理器实例
export const proxyManager = new ProxyManager();

// 默认导出
export default proxyManager;