/**
 * 爬虫性能监控工具
 * 监控爬虫性能指标和系统资源使用情况
 */

export interface PerformanceMetrics {
  taskId: string;
  websiteId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  
  // 网络指标
  networkMetrics: {
    requestCount: number;
    successCount: number;
    failureCount: number;
    avgResponseTime: number;
    totalDataTransferred: number;
  };
  
  // 解析指标
  parseMetrics: {
    pagesProcessed: number;
    elementsExtracted: number;
    parseErrors: number;
    avgParseTime: number;
  };
  
  // 结果指标
  resultMetrics: {
    totalResults: number;
    validResults: number;
    duplicateResults: number;
    qualityScore: number;
  };
  
  // 资源使用
  resourceUsage: {
    memoryUsage: number;
    cpuUsage: number;
    browserInstances: number;
  };
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private systemMetrics: SystemMetrics = {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgTaskDuration: 0,
    totalDataProcessed: 0,
    systemUptime: Date.now()
  };

  /**
   * 开始监控任务
   */
  startTask(taskId: string, websiteId: string): void {
    const metrics: PerformanceMetrics = {
      taskId,
      websiteId,
      startTime: Date.now(),
      networkMetrics: {
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        avgResponseTime: 0,
        totalDataTransferred: 0
      },
      parseMetrics: {
        pagesProcessed: 0,
        elementsExtracted: 0,
        parseErrors: 0,
        avgParseTime: 0
      },
      resultMetrics: {
        totalResults: 0,
        validResults: 0,
        duplicateResults: 0,
        qualityScore: 0
      },
      resourceUsage: {
        memoryUsage: 0,
        cpuUsage: 0,
        browserInstances: 0
      }
    };

    this.metrics.set(taskId, metrics);
    this.systemMetrics.totalTasks++;
    this.systemMetrics.activeTasks++;
  }

  /**
   * 记录网络请求
   */
  recordNetworkRequest(taskId: string, success: boolean, responseTime: number, dataSize: number = 0): void {
    const metrics = this.metrics.get(taskId);
    if (!metrics) return;

    metrics.networkMetrics.requestCount++;
    if (success) {
      metrics.networkMetrics.successCount++;
    } else {
      metrics.networkMetrics.failureCount++;
    }

    // 更新平均响应时间
    const totalTime = metrics.networkMetrics.avgResponseTime * (metrics.networkMetrics.requestCount - 1) + responseTime;
    metrics.networkMetrics.avgResponseTime = totalTime / metrics.networkMetrics.requestCount;
    
    metrics.networkMetrics.totalDataTransferred += dataSize;
  }

  /**
   * 记录页面解析
   */
  recordPageParse(taskId: string, parseTime: number, elementsExtracted: number, hasError: boolean = false): void {
    const metrics = this.metrics.get(taskId);
    if (!metrics) return;

    metrics.parseMetrics.pagesProcessed++;
    metrics.parseMetrics.elementsExtracted += elementsExtracted;
    
    if (hasError) {
      metrics.parseMetrics.parseErrors++;
    }

    // 更新平均解析时间
    const totalTime = metrics.parseMetrics.avgParseTime * (metrics.parseMetrics.pagesProcessed - 1) + parseTime;
    metrics.parseMetrics.avgParseTime = totalTime / metrics.parseMetrics.pagesProcessed;
  }

  /**
   * 记录结果
   */
  recordResults(taskId: string, totalResults: number, validResults: number, duplicates: number, qualityScore: number): void {
    const metrics = this.metrics.get(taskId);
    if (!metrics) return;

    metrics.resultMetrics.totalResults = totalResults;
    metrics.resultMetrics.validResults = validResults;
    metrics.resultMetrics.duplicateResults = duplicates;
    metrics.resultMetrics.qualityScore = qualityScore;
  }

  /**
   * 记录资源使用情况
   */
  recordResourceUsage(taskId: string, memoryUsage: number, cpuUsage: number, browserInstances: number): void {
    const metrics = this.metrics.get(taskId);
    if (!metrics) return;

    metrics.resourceUsage.memoryUsage = memoryUsage;
    metrics.resourceUsage.cpuUsage = cpuUsage;
    metrics.resourceUsage.browserInstances = browserInstances;
  }

  /**
   * 完成任务监控
   */
  finishTask(taskId: string, success: boolean): PerformanceMetrics | null {
    const metrics = this.metrics.get(taskId);
    if (!metrics) return null;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    // 更新系统指标
    this.systemMetrics.activeTasks--;
    if (success) {
      this.systemMetrics.completedTasks++;
    } else {
      this.systemMetrics.failedTasks++;
    }

    // 更新平均任务持续时间
    const completedTasks = this.systemMetrics.completedTasks + this.systemMetrics.failedTasks;
    if (completedTasks > 0) {
      const totalDuration = this.systemMetrics.avgTaskDuration * (completedTasks - 1) + metrics.duration;
      this.systemMetrics.avgTaskDuration = totalDuration / completedTasks;
    }

    this.systemMetrics.totalDataProcessed += metrics.networkMetrics.totalDataTransferred;

    return metrics;
  }

  /**
   * 获取任务指标
   */
  getTaskMetrics(taskId: string): PerformanceMetrics | null {
    return this.metrics.get(taskId) || null;
  }

  /**
   * 获取所有任务指标
   */
  getAllTaskMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 获取系统指标
   */
  getSystemMetrics(): SystemMetrics {
    return {
      ...this.systemMetrics,
      systemUptime: Date.now() - this.systemMetrics.systemUptime
    };
  }

  /**
   * 获取网站性能统计
   */
  getWebsiteStats(websiteId: string): WebsiteStats {
    const websiteMetrics = Array.from(this.metrics.values()).filter(m => m.websiteId === websiteId);
    
    if (websiteMetrics.length === 0) {
      return {
        websiteId,
        totalTasks: 0,
        successRate: 0,
        avgResponseTime: 0,
        avgParseTime: 0,
        avgQualityScore: 0,
        totalResults: 0,
        errorRate: 0
      };
    }

    const completedTasks = websiteMetrics.filter(m => m.endTime).length;
    const successfulTasks = websiteMetrics.filter(m => 
      m.endTime && m.networkMetrics.successCount > m.networkMetrics.failureCount
    ).length;

    const totalResponseTime = websiteMetrics.reduce((sum, m) => sum + m.networkMetrics.avgResponseTime, 0);
    const totalParseTime = websiteMetrics.reduce((sum, m) => sum + m.parseMetrics.avgParseTime, 0);
    const totalQualityScore = websiteMetrics.reduce((sum, m) => sum + m.resultMetrics.qualityScore, 0);
    const totalResults = websiteMetrics.reduce((sum, m) => sum + m.resultMetrics.totalResults, 0);
    const totalErrors = websiteMetrics.reduce((sum, m) => sum + m.parseMetrics.parseErrors + m.networkMetrics.failureCount, 0);
    const totalRequests = websiteMetrics.reduce((sum, m) => sum + m.networkMetrics.requestCount, 0);

    return {
      websiteId,
      totalTasks: websiteMetrics.length,
      successRate: completedTasks > 0 ? successfulTasks / completedTasks : 0,
      avgResponseTime: websiteMetrics.length > 0 ? totalResponseTime / websiteMetrics.length : 0,
      avgParseTime: websiteMetrics.length > 0 ? totalParseTime / websiteMetrics.length : 0,
      avgQualityScore: websiteMetrics.length > 0 ? totalQualityScore / websiteMetrics.length : 0,
      totalResults,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0
    };
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): PerformanceReport {
    const allMetrics = this.getAllTaskMetrics();
    const completedMetrics = allMetrics.filter(m => m.endTime);
    
    const report: PerformanceReport = {
      generatedAt: new Date(),
      systemMetrics: this.getSystemMetrics(),
      taskSummary: {
        totalTasks: allMetrics.length,
        completedTasks: completedMetrics.length,
        activeTasks: allMetrics.length - completedMetrics.length,
        avgDuration: completedMetrics.length > 0 
          ? completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / completedMetrics.length 
          : 0
      },
      networkSummary: {
        totalRequests: allMetrics.reduce((sum, m) => sum + m.networkMetrics.requestCount, 0),
        successRate: this.calculateOverallSuccessRate(allMetrics),
        avgResponseTime: this.calculateAvgResponseTime(allMetrics),
        totalDataTransferred: allMetrics.reduce((sum, m) => sum + m.networkMetrics.totalDataTransferred, 0)
      },
      qualitySummary: {
        totalResults: allMetrics.reduce((sum, m) => sum + m.resultMetrics.totalResults, 0),
        avgQualityScore: this.calculateAvgQualityScore(allMetrics),
        duplicateRate: this.calculateDuplicateRate(allMetrics)
      },
      websiteStats: this.getUniqueWebsiteIds().map(id => this.getWebsiteStats(id)),
      recommendations: this.generateRecommendations(allMetrics)
    };

    return report;
  }

  /**
   * 清理旧指标
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    const keysToRemove: string[] = [];

    this.metrics.forEach((metrics, taskId) => {
      if (metrics.startTime < cutoffTime) {
        keysToRemove.push(taskId);
      }
    });

    keysToRemove.forEach(key => this.metrics.delete(key));
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 已清理 ${keysToRemove.length} 个过期性能指标`);
    }
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics.clear();
    this.systemMetrics = {
      totalTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgTaskDuration: 0,
      totalDataProcessed: 0,
      systemUptime: Date.now()
    };
  }

  // 私有辅助方法

  private calculateOverallSuccessRate(metrics: PerformanceMetrics[]): number {
    const totalRequests = metrics.reduce((sum, m) => sum + m.networkMetrics.requestCount, 0);
    const totalSuccess = metrics.reduce((sum, m) => sum + m.networkMetrics.successCount, 0);
    return totalRequests > 0 ? totalSuccess / totalRequests : 0;
  }

  private calculateAvgResponseTime(metrics: PerformanceMetrics[]): number {
    const validMetrics = metrics.filter(m => m.networkMetrics.requestCount > 0);
    if (validMetrics.length === 0) return 0;
    
    const totalTime = validMetrics.reduce((sum, m) => sum + m.networkMetrics.avgResponseTime, 0);
    return totalTime / validMetrics.length;
  }

  private calculateAvgQualityScore(metrics: PerformanceMetrics[]): number {
    const validMetrics = metrics.filter(m => m.resultMetrics.totalResults > 0);
    if (validMetrics.length === 0) return 0;
    
    const totalScore = validMetrics.reduce((sum, m) => sum + m.resultMetrics.qualityScore, 0);
    return totalScore / validMetrics.length;
  }

  private calculateDuplicateRate(metrics: PerformanceMetrics[]): number {
    const totalResults = metrics.reduce((sum, m) => sum + m.resultMetrics.totalResults, 0);
    const totalDuplicates = metrics.reduce((sum, m) => sum + m.resultMetrics.duplicateResults, 0);
    return totalResults > 0 ? totalDuplicates / totalResults : 0;
  }

  private getUniqueWebsiteIds(): string[] {
    const websiteIds = new Set<string>();
    this.metrics.forEach(metrics => websiteIds.add(metrics.websiteId));
    return Array.from(websiteIds);
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    
    // 分析响应时间
    const avgResponseTime = this.calculateAvgResponseTime(metrics);
    if (avgResponseTime > 5000) {
      recommendations.push('平均响应时间较长，建议增加请求超时时间或检查网络连接');
    }

    // 分析成功率
    const successRate = this.calculateOverallSuccessRate(metrics);
    if (successRate < 0.8) {
      recommendations.push('请求成功率较低，建议检查反爬虫策略或增加重试次数');
    }

    // 分析质量评分
    const avgQualityScore = this.calculateAvgQualityScore(metrics);
    if (avgQualityScore < 60) {
      recommendations.push('数据质量评分较低，建议优化选择器配置或数据清洗规则');
    }

    // 分析重复率
    const duplicateRate = this.calculateDuplicateRate(metrics);
    if (duplicateRate > 0.2) {
      recommendations.push('重复结果较多，建议启用去重功能或优化搜索策略');
    }

    return recommendations;
  }
}

// 相关接口定义

interface SystemMetrics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgTaskDuration: number;
  totalDataProcessed: number;
  systemUptime: number;
}

interface WebsiteStats {
  websiteId: string;
  totalTasks: number;
  successRate: number;
  avgResponseTime: number;
  avgParseTime: number;
  avgQualityScore: number;
  totalResults: number;
  errorRate: number;
}

interface PerformanceReport {
  generatedAt: Date;
  systemMetrics: SystemMetrics;
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    avgDuration: number;
  };
  networkSummary: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    totalDataTransferred: number;
  };
  qualitySummary: {
    totalResults: number;
    avgQualityScore: number;
    duplicateRate: number;
  };
  websiteStats: WebsiteStats[];
  recommendations: string[];
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();