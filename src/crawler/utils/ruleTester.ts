/**
 * 爬虫规则测试工具
 * 用于测试和验证爬虫规则的有效性
 */

import type { CrawlerRule, ExtractedMaterialResult, TestResult } from '../types/crawler';
import { CrawlerEngine } from '../engine/CrawlerEngine';
import { DataValidator } from './dataValidator';

export interface RuleTestConfig {
  testKeywords: string[];
  maxResults: number;
  timeout: number;
  enableValidation: boolean;
}

export interface DetailedTestResult extends TestResult {
  ruleId: string;
  ruleName: string;
  testKeyword: string;
  validationResults?: {
    totalResults: number;
    validResults: number;
    avgScore: number;
    commonIssues: string[];
  };
  networkMetrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
  };
  recommendations: string[];
}

export class RuleTester {
  private engine: CrawlerEngine;

  constructor() {
    this.engine = new CrawlerEngine();
  }

  /**
   * 初始化测试器
   */
  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  /**
   * 测试单个规则
   */
  async testRule(
    rule: CrawlerRule, 
    config: Partial<RuleTestConfig> = {}
  ): Promise<DetailedTestResult> {
    const testConfig: RuleTestConfig = {
      testKeywords: [rule.testing.testKeyword],
      maxResults: 5,
      timeout: 30000,
      enableValidation: true,
      ...config
    };

    console.log(`🧪 开始测试规则: ${rule.websiteName}`);
    
    const startTime = Date.now();
    let testResult: DetailedTestResult = {
      ruleId: rule.id,
      ruleName: rule.websiteName,
      testKeyword: testConfig.testKeywords[0],
      success: false,
      results: [],
      errors: [],
      performance: {
        totalTime: 0,
        parseTime: 0,
        networkTime: 0
      },
      networkMetrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0
      },
      recommendations: []
    };

    try {
      // 执行搜索测试
      for (const keyword of testConfig.testKeywords) {
        console.log(`🔍 测试关键词: "${keyword}"`);
        
        const searchResponse = await this.engine.search({
          query: keyword,
          websites: [rule.id],
          mode: 'fast',
          maxResults: testConfig.maxResults
        }, [rule]);

        // 等待任务完成
        let task = this.engine.getTaskStatus(searchResponse.taskId);
        const maxWaitTime = testConfig.timeout;
        const waitStart = Date.now();

        while (task && task.status === 'running' && (Date.now() - waitStart) < maxWaitTime) {
          await this.delay(1000);
          task = this.engine.getTaskStatus(searchResponse.taskId);
        }

        if (task) {
          testResult.results.push(...task.results);
          testResult.errors.push(...task.errors.map(e => e.message));
          
          // 更新网络指标
          testResult.networkMetrics.totalRequests += task.results.length + task.errors.length;
          testResult.networkMetrics.successfulRequests += task.results.length;
          testResult.networkMetrics.failedRequests += task.errors.length;
        }
      }

      const totalTime = Date.now() - startTime;
      testResult.performance.totalTime = totalTime;
      testResult.performance.networkTime = totalTime * 0.7; // 估算网络时间
      testResult.performance.parseTime = totalTime * 0.3; // 估算解析时间

      // 计算平均响应时间
      if (testResult.networkMetrics.totalRequests > 0) {
        testResult.networkMetrics.avgResponseTime = totalTime / testResult.networkMetrics.totalRequests;
      }

      // 判断测试是否成功
      testResult.success = testResult.results.length > 0 && testResult.errors.length === 0;

      // 数据验证
      if (testConfig.enableValidation && testResult.results.length > 0) {
        testResult.validationResults = this.validateResults(testResult.results, rule);
      }

      // 生成建议
      testResult.recommendations = this.generateRecommendations(testResult, rule);

      console.log(`${testResult.success ? '✅' : '❌'} 规则测试完成: ${rule.websiteName}`);
      console.log(`📊 结果: ${testResult.results.length} 个，错误: ${testResult.errors.length} 个`);

    } catch (error) {
      testResult.success = false;
      testResult.errors.push(error instanceof Error ? error.message : String(error));
      testResult.performance.totalTime = Date.now() - startTime;
      
      console.error(`❌ 规则测试失败: ${rule.websiteName}`, error);
    }

    return testResult;
  }

  /**
   * 批量测试规则
   */
  async testRules(
    rules: CrawlerRule[], 
    config: Partial<RuleTestConfig> = {}
  ): Promise<DetailedTestResult[]> {
    console.log(`🧪 开始批量测试 ${rules.length} 个规则`);
    
    const results: DetailedTestResult[] = [];
    
    for (const rule of rules) {
      if (!rule.isActive) {
        console.log(`⏭️ 跳过未激活的规则: ${rule.websiteName}`);
        continue;
      }

      try {
        const result = await this.testRule(rule, config);
        results.push(result);
        
        // 添加延迟避免过于频繁的请求
        await this.delay(2000);
      } catch (error) {
        console.error(`❌ 测试规则失败: ${rule.websiteName}`, error);
        
        results.push({
          ruleId: rule.id,
          ruleName: rule.websiteName,
          testKeyword: rule.testing.testKeyword,
          success: false,
          results: [],
          errors: [error instanceof Error ? error.message : String(error)],
          performance: { totalTime: 0, parseTime: 0, networkTime: 0 },
          networkMetrics: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, avgResponseTime: 0 },
          recommendations: ['规则测试过程中发生异常，建议检查规则配置']
        });
      }
    }

    console.log(`✅ 批量测试完成，成功: ${results.filter(r => r.success).length}/${results.length}`);
    
    return results;
  }

  /**
   * 生成测试报告
   */
  generateTestReport(results: DetailedTestResult[]): TestReport {
    const totalRules = results.length;
    const successfulRules = results.filter(r => r.success).length;
    const failedRules = totalRules - successfulRules;
    
    const totalResults = results.reduce((sum, r) => sum + r.results.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const avgResponseTime = results.length > 0 
      ? results.reduce((sum, r) => sum + r.networkMetrics.avgResponseTime, 0) / results.length 
      : 0;

    // 统计最常见的问题
    const allErrors = results.flatMap(r => r.errors);
    const errorCounts = new Map<string, number>();
    allErrors.forEach(error => {
      const count = errorCounts.get(error) || 0;
      errorCounts.set(error, count + 1);
    });

    const commonIssues = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    // 性能统计
    const performanceStats = {
      avgTotalTime: results.length > 0 
        ? results.reduce((sum, r) => sum + r.performance.totalTime, 0) / results.length 
        : 0,
      avgNetworkTime: results.length > 0 
        ? results.reduce((sum, r) => sum + r.performance.networkTime, 0) / results.length 
        : 0,
      avgParseTime: results.length > 0 
        ? results.reduce((sum, r) => sum + r.performance.parseTime, 0) / results.length 
        : 0
    };

    // 质量统计
    const qualityStats = results
      .filter(r => r.validationResults)
      .map(r => r.validationResults!)
      .reduce((acc, v) => ({
        totalResults: acc.totalResults + v.totalResults,
        validResults: acc.validResults + v.validResults,
        avgScore: (acc.avgScore + v.avgScore) / 2
      }), { totalResults: 0, validResults: 0, avgScore: 0 });

    // 生成总体建议
    const overallRecommendations = this.generateOverallRecommendations(results);

    return {
      generatedAt: new Date(),
      summary: {
        totalRules,
        successfulRules,
        failedRules,
        successRate: totalRules > 0 ? successfulRules / totalRules : 0,
        totalResults,
        totalErrors,
        avgResponseTime
      },
      performanceStats,
      qualityStats,
      commonIssues,
      ruleResults: results,
      recommendations: overallRecommendations
    };
  }

  /**
   * 验证测试结果
   */
  private validateResults(results: ExtractedMaterialResult[], rule: CrawlerRule) {
    const validation = DataValidator.validateBatchResults(results, rule);
    return {
      totalResults: validation.totalResults,
      validResults: validation.validResults,
      avgScore: validation.avgScore,
      commonIssues: validation.commonIssues
    };
  }

  /**
   * 生成单个规则的建议
   */
  private generateRecommendations(result: DetailedTestResult, rule: CrawlerRule): string[] {
    const recommendations: string[] = [];

    // 基于成功率的建议
    if (!result.success) {
      if (result.errors.some(e => e.includes('timeout') || e.includes('超时'))) {
        recommendations.push('请求超时，建议增加超时时间或检查网络连接');
      }
      if (result.errors.some(e => e.includes('selector') || e.includes('选择器'))) {
        recommendations.push('选择器可能失效，建议检查页面结构变化');
      }
      if (result.errors.some(e => e.includes('blocked') || e.includes('封禁'))) {
        recommendations.push('可能被网站封禁，建议调整反爬虫策略');
      }
    }

    // 基于结果数量的建议
    if (result.results.length === 0) {
      recommendations.push('未获取到任何结果，建议检查搜索URL模板和选择器配置');
    } else if (result.results.length < 3) {
      recommendations.push('结果数量较少，可能需要优化搜索策略或选择器');
    }

    // 基于性能的建议
    if (result.performance.totalTime > 30000) {
      recommendations.push('响应时间较长，建议优化请求策略或增加并发控制');
    }

    // 基于验证结果的建议
    if (result.validationResults) {
      const validRate = result.validationResults.validResults / result.validationResults.totalResults;
      if (validRate < 0.8) {
        recommendations.push('数据质量较低，建议优化数据提取和清洗规则');
      }
      if (result.validationResults.avgScore < 70) {
        recommendations.push('数据完整性不足，建议添加更多字段的选择器');
      }
    }

    return recommendations;
  }

  /**
   * 生成总体建议
   */
  private generateOverallRecommendations(results: DetailedTestResult[]): string[] {
    const recommendations: string[] = [];
    
    const successRate = results.filter(r => r.success).length / results.length;
    if (successRate < 0.7) {
      recommendations.push('整体成功率较低，建议重点检查失败的规则配置');
    }

    const avgResponseTime = results.reduce((sum, r) => sum + r.performance.totalTime, 0) / results.length;
    if (avgResponseTime > 20000) {
      recommendations.push('平均响应时间较长，建议优化网络配置和并发策略');
    }

    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    if (totalErrors > results.length * 2) {
      recommendations.push('错误数量较多，建议加强错误处理和重试机制');
    }

    return recommendations;
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
  async cleanup(): Promise<void> {
    await this.engine.cleanup();
  }
}

// 测试报告接口
export interface TestReport {
  generatedAt: Date;
  summary: {
    totalRules: number;
    successfulRules: number;
    failedRules: number;
    successRate: number;
    totalResults: number;
    totalErrors: number;
    avgResponseTime: number;
  };
  performanceStats: {
    avgTotalTime: number;
    avgNetworkTime: number;
    avgParseTime: number;
  };
  qualityStats: {
    totalResults: number;
    validResults: number;
    avgScore: number;
  };
  commonIssues: Array<{
    error: string;
    count: number;
  }>;
  ruleResults: DetailedTestResult[];
  recommendations: string[];
}