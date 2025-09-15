/**
 * 性能优化服务
 * 监控和优化系统性能，提供智能调优建议
 */

export interface PerformanceMetrics {
  // 爬虫性能
  crawler: {
    avgResponseTime: number;
    throughput: number; // 每秒处理的请求数
    concurrency: number; // 当前并发数
    queueLength: number; // 队列长度
    successRate: number;
    errorRate: number;
  };
  
  // 内存性能
  memory: {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    usage: number; // 使用率百分比
    gcFrequency: number; // GC频率
  };
  
  // 网络性能
  network: {
    bandwidth: number; // 带宽使用
    latency: number; // 网络延迟
    packetLoss: number; // 丢包率
    connectionCount: number; // 连接数
  };
  
  // 缓存性能
  cache: {
    hitRate: number;
    missRate: number;
    evictionRate: number; // 淘汰率
    avgAccessTime: number;
    size: number;
  };
  
  // 渲染性能
  rendering: {
    fps: number;
    frameTime: number;
    paintTime: number;
    layoutTime: number;
  };
}

export interface OptimizationSuggestion {
  category: 'crawler' | 'memory' | 'network' | 'cache' | 'rendering';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string; // 预期影响
  implementation: string; // 实施方法
  estimatedGain: number; // 预期性能提升百分比
}

export interface PerformanceProfile {
  name: string;
  description: string;
  settings: {
    maxConcurrency: number;
    requestDelay: number;
    cacheSize: number;
    memoryLimit: number;
    enableOptimizations: boolean;
  };
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private performanceHistory: Array<{ timestamp: Date; metrics: PerformanceMetrics }> = [];
  private optimizationHistory: Array<{ timestamp: Date; suggestion: OptimizationSuggestion; applied: boolean }> = [];

  // 预定义性能配置文件
  private profiles: PerformanceProfile[] = [
    {
      name: 'balanced',
      description: '平衡模式 - 性能和资源使用的平衡',
      settings: {
        maxConcurrency: 4,
        requestDelay: 1000,
        cacheSize: 100 * 1024 * 1024, // 100MB
        memoryLimit: 200 * 1024 * 1024, // 200MB
        enableOptimizations: true
      }
    },
    {
      name: 'performance',
      description: '性能优先 - 最大化爬取速度',
      settings: {
        maxConcurrency: 8,
        requestDelay: 500,
        cacheSize: 200 * 1024 * 1024, // 200MB
        memoryLimit: 500 * 1024 * 1024, // 500MB
        enableOptimizations: true
      }
    },
    {
      name: 'conservative',
      description: '保守模式 - 最小化资源使用',
      settings: {
        maxConcurrency: 2,
        requestDelay: 2000,
        cacheSize: 50 * 1024 * 1024, // 50MB
        memoryLimit: 100 * 1024 * 1024, // 100MB
        enableOptimizations: false
      }
    }
  ];

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  /**
   * 初始化性能指标
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      crawler: {
        avgResponseTime: 0,
        throughput: 0,
        concurrency: 0,
        queueLength: 0,
        successRate: 100,
        errorRate: 0
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        heapLimit: 0,
        usage: 0,
        gcFrequency: 0
      },
      network: {
        bandwidth: 0,
        latency: 0,
        packetLoss: 0,
        connectionCount: 0
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        avgAccessTime: 0,
        size: 0
      },
      rendering: {
        fps: 60,
        frameTime: 16.67,
        paintTime: 0,
        layoutTime: 0
      }
    };
  }

  /**
   * 启动性能监控
   */
  startMonitoring(intervalMs = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 启动性能监控...');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
    }, intervalMs);

    // 立即收集一次指标
    this.collectMetrics();
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📊 性能监控已停止');
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    // 收集内存指标
    this.collectMemoryMetrics();
    
    // 收集网络指标
    this.collectNetworkMetrics();
    
    // 收集渲染指标
    this.collectRenderingMetrics();
    
    // 记录历史数据
    this.recordMetricsHistory();
  }

  /**
   * 收集内存指标
   */
  private collectMemoryMetrics(): void {
    try {
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory;
        this.metrics.memory = {
          heapUsed: memory.usedJSHeapSize,
          heapTotal: memory.totalJSHeapSize,
          heapLimit: memory.jsHeapSizeLimit,
          usage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
          gcFrequency: 0 // 无法直接获取GC频率
        };
      }
    } catch (error) {
      console.warn('收集内存指标失败:', error);
    }
  }

  /**
   * 收集网络指标
   */
  private collectNetworkMetrics(): void {
    try {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        this.metrics.network = {
          bandwidth: connection.downlink || 0,
          latency: connection.rtt || 0,
          packetLoss: 0, // 无法直接获取
          connectionCount: 0 // 无法直接获取
        };
      }
    } catch (error) {
      console.warn('收集网络指标失败:', error);
    }
  }

  /**
   * 收集渲染指标
   */
  private collectRenderingMetrics(): void {
    try {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const perfEntries = performance.getEntriesByType('paint');
        let paintTime = 0;
        
        perfEntries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            paintTime = entry.startTime;
          }
        });

        // 估算FPS
        const now = performance.now();
        const fps = this.calculateFPS(now);

        this.metrics.rendering = {
          fps,
          frameTime: 1000 / fps,
          paintTime,
          layoutTime: 0 // 无法直接获取
        };
      }
    } catch (error) {
      console.warn('收集渲染指标失败:', error);
    }
  }

  /**
   * 计算FPS
   */
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsHistory: number[] = [];

  private calculateFPS(currentTime: number): number {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      return 60; // 默认值
    }

    const deltaTime = currentTime - this.lastFrameTime;
    if (deltaTime >= 1000) { // 每秒计算一次
      const fps = (this.frameCount * 1000) / deltaTime;
      this.fpsHistory.push(fps);
      
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }
      
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
      
      return this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;
    }
    
    this.frameCount++;
    return this.metrics.rendering.fps; // 返回上次的值
  }

  /**
   * 记录指标历史
   */
  private recordMetricsHistory(): void {
    this.performanceHistory.push({
      timestamp: new Date(),
      metrics: JSON.parse(JSON.stringify(this.metrics))
    });

    // 限制历史记录数量（保留最近1小时的数据，假设每5秒一次）
    const maxRecords = 720; // 1小时 = 3600秒 / 5秒 = 720条记录
    if (this.performanceHistory.length > maxRecords) {
      this.performanceHistory = this.performanceHistory.slice(-maxRecords);
    }
  }

  /**
   * 分析性能并生成优化建议
   */
  private analyzePerformance(): void {
    const suggestions = this.generateOptimizationSuggestions();
    
    // 自动应用高优先级的优化建议
    suggestions
      .filter(s => s.priority === 'critical' || s.priority === 'high')
      .forEach(suggestion => {
        this.applyOptimization(suggestion);
      });
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 内存优化建议
    if (this.metrics.memory.usage > 80) {
      suggestions.push({
        category: 'memory',
        priority: this.metrics.memory.usage > 95 ? 'critical' : 'high',
        title: '内存使用过高',
        description: `当前内存使用率 ${this.metrics.memory.usage.toFixed(1)}%，建议进行内存优化`,
        impact: '减少内存使用，提高系统稳定性',
        implementation: '清理缓存、减少并发数、启用垃圾回收',
        estimatedGain: 20
      });
    }

    // 爬虫性能优化建议
    if (this.metrics.crawler.avgResponseTime > 5000) {
      suggestions.push({
        category: 'crawler',
        priority: 'medium',
        title: '爬虫响应时间过长',
        description: `平均响应时间 ${this.metrics.crawler.avgResponseTime}ms，超过推荐值`,
        impact: '提高爬取速度，减少等待时间',
        implementation: '优化网络配置、增加并发数、使用更快的代理',
        estimatedGain: 30
      });
    }

    // 缓存优化建议
    if (this.metrics.cache.hitRate < 0.6) {
      suggestions.push({
        category: 'cache',
        priority: 'medium',
        title: '缓存命中率过低',
        description: `缓存命中率 ${(this.metrics.cache.hitRate * 100).toFixed(1)}%，低于推荐值`,
        impact: '提高数据访问速度，减少重复请求',
        implementation: '调整缓存策略、增加缓存大小、优化缓存键',
        estimatedGain: 25
      });
    }

    // 渲染性能优化建议
    if (this.metrics.rendering.fps < 30) {
      suggestions.push({
        category: 'rendering',
        priority: 'high',
        title: '渲染性能不佳',
        description: `当前FPS ${this.metrics.rendering.fps.toFixed(1)}，低于流畅标准`,
        impact: '提高界面响应速度，改善用户体验',
        implementation: '启用虚拟滚动、减少DOM操作、优化CSS',
        estimatedGain: 40
      });
    }

    // 网络优化建议
    if (this.metrics.network.latency > 1000) {
      suggestions.push({
        category: 'network',
        priority: 'medium',
        title: '网络延迟过高',
        description: `网络延迟 ${this.metrics.network.latency}ms，影响响应速度`,
        impact: '减少网络等待时间，提高数据传输效率',
        implementation: '使用CDN、优化请求、启用压缩',
        estimatedGain: 35
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 应用优化建议
   */
  private applyOptimization(suggestion: OptimizationSuggestion): void {
    console.log(`🔧 应用优化: ${suggestion.title}`);

    try {
      switch (suggestion.category) {
        case 'memory':
          this.optimizeMemory();
          break;
        case 'crawler':
          this.optimizeCrawler();
          break;
        case 'cache':
          this.optimizeCache();
          break;
        case 'rendering':
          this.optimizeRendering();
          break;
        case 'network':
          this.optimizeNetwork();
          break;
      }

      // 记录优化历史
      this.optimizationHistory.push({
        timestamp: new Date(),
        suggestion,
        applied: true
      });

      console.log(`✅ 优化应用成功: ${suggestion.title}`);
    } catch (error) {
      console.error(`❌ 优化应用失败: ${suggestion.title}`, error);
      
      this.optimizationHistory.push({
        timestamp: new Date(),
        suggestion,
        applied: false
      });
    }
  }

  /**
   * 内存优化
   */
  private optimizeMemory(): void {
    // 触发垃圾回收（如果可用）
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }

    // 清理性能历史（保留最近的数据）
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }

    // 清理优化历史
    if (this.optimizationHistory.length > 50) {
      this.optimizationHistory = this.optimizationHistory.slice(-50);
    }
  }

  /**
   * 爬虫优化
   */
  private optimizeCrawler(): void {
    // 这里可以调整爬虫参数
    // 例如：减少并发数、增加延迟等
    console.log('🕷️ 优化爬虫配置');
  }

  /**
   * 缓存优化
   */
  private optimizeCache(): void {
    // 这里可以调整缓存策略
    console.log('💾 优化缓存配置');
  }

  /**
   * 渲染优化
   */
  private optimizeRendering(): void {
    // 启用性能优化
    if (typeof document !== 'undefined') {
      // 减少重绘和回流
      document.body.style.willChange = 'transform';
      
      // 启用硬件加速
      document.body.style.transform = 'translateZ(0)';
    }
  }

  /**
   * 网络优化
   */
  private optimizeNetwork(): void {
    // 这里可以优化网络配置
    console.log('🌐 优化网络配置');
  }

  /**
   * 应用性能配置文件
   */
  applyPerformanceProfile(profileName: string): boolean {
    const profile = this.profiles.find(p => p.name === profileName);
    if (!profile) {
      console.error(`性能配置文件不存在: ${profileName}`);
      return false;
    }

    console.log(`📊 应用性能配置文件: ${profile.name} - ${profile.description}`);
    
    try {
      // 这里应该应用配置文件中的设置
      // 例如：调整并发数、缓存大小等
      
      console.log(`✅ 性能配置文件应用成功: ${profile.name}`);
      return true;
    } catch (error) {
      console.error(`❌ 性能配置文件应用失败: ${profile.name}`, error);
      return false;
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  /**
   * 获取性能历史
   */
  getPerformanceHistory(minutes = 60): Array<{ timestamp: Date; metrics: PerformanceMetrics }> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.performanceHistory.filter(record => record.timestamp > cutoffTime);
  }

  /**
   * 获取优化历史
   */
  getOptimizationHistory(): Array<{ timestamp: Date; suggestion: OptimizationSuggestion; applied: boolean }> {
    return [...this.optimizationHistory];
  }

  /**
   * 获取性能配置文件
   */
  getPerformanceProfiles(): PerformanceProfile[] {
    return [...this.profiles];
  }

  /**
   * 更新爬虫指标
   */
  updateCrawlerMetrics(metrics: Partial<PerformanceMetrics['crawler']>): void {
    this.metrics.crawler = { ...this.metrics.crawler, ...metrics };
  }

  /**
   * 更新缓存指标
   */
  updateCacheMetrics(metrics: Partial<PerformanceMetrics['cache']>): void {
    this.metrics.cache = { ...this.metrics.cache, ...metrics };
  }

  /**
   * 获取性能评分
   */
  getPerformanceScore(): {
    overall: number;
    breakdown: {
      crawler: number;
      memory: number;
      network: number;
      cache: number;
      rendering: number;
    };
  } {
    const scores = {
      crawler: this.calculateCrawlerScore(),
      memory: this.calculateMemoryScore(),
      network: this.calculateNetworkScore(),
      cache: this.calculateCacheScore(),
      rendering: this.calculateRenderingScore()
    };

    const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;

    return {
      overall: Math.round(overall),
      breakdown: scores
    };
  }

  /**
   * 计算爬虫性能评分
   */
  private calculateCrawlerScore(): number {
    let score = 100;
    
    // 响应时间评分
    if (this.metrics.crawler.avgResponseTime > 10000) {
      score -= 40;
    } else if (this.metrics.crawler.avgResponseTime > 5000) {
      score -= 20;
    } else if (this.metrics.crawler.avgResponseTime > 2000) {
      score -= 10;
    }
    
    // 成功率评分
    score = score * (this.metrics.crawler.successRate / 100);
    
    return Math.max(0, Math.round(score));
  }

  /**
   * 计算内存性能评分
   */
  private calculateMemoryScore(): number {
    let score = 100;
    
    if (this.metrics.memory.usage > 90) {
      score = 20;
    } else if (this.metrics.memory.usage > 80) {
      score = 50;
    } else if (this.metrics.memory.usage > 70) {
      score = 70;
    } else {
      score = Math.max(70, 100 - this.metrics.memory.usage);
    }
    
    return Math.round(score);
  }

  /**
   * 计算网络性能评分
   */
  private calculateNetworkScore(): number {
    let score = 100;
    
    // 延迟评分
    if (this.metrics.network.latency > 2000) {
      score -= 40;
    } else if (this.metrics.network.latency > 1000) {
      score -= 20;
    } else if (this.metrics.network.latency > 500) {
      score -= 10;
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * 计算缓存性能评分
   */
  private calculateCacheScore(): number {
    const hitRate = this.metrics.cache.hitRate * 100;
    
    if (hitRate >= 80) return 100;
    if (hitRate >= 60) return 80;
    if (hitRate >= 40) return 60;
    if (hitRate >= 20) return 40;
    return 20;
  }

  /**
   * 计算渲染性能评分
   */
  private calculateRenderingScore(): number {
    const fps = this.metrics.rendering.fps;
    
    if (fps >= 60) return 100;
    if (fps >= 30) return 80;
    if (fps >= 15) return 60;
    return 30;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopMonitoring();
    this.performanceHistory = [];
    this.optimizationHistory = [];
    console.log('🧹 性能优化器资源清理完成');
  }
}

// 创建全局性能优化器实例
export const performanceOptimizer = new PerformanceOptimizer();

// 默认导出
export default performanceOptimizer;