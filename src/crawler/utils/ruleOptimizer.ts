/**
 * 爬虫规则优化工具
 * 自动分析和优化爬虫规则配置
 */

import { CrawlerRule } from '../types/crawler';
import { DetailedTestResult } from './ruleTester';

export interface OptimizationSuggestion {
  type: 'selector' | 'timing' | 'quality' | 'performance' | 'antibot';
  priority: 'low' | 'medium' | 'high' | 'critical';
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  expectedImprovement: string;
}

export interface OptimizationReport {
  ruleId: string;
  ruleName: string;
  currentScore: number;
  potentialScore: number;
  suggestions: OptimizationSuggestion[];
  autoFixable: OptimizationSuggestion[];
  manualReview: OptimizationSuggestion[];
}

export class RuleOptimizer {
  /**
   * 分析规则并生成优化建议
   */
  static analyzeRule(rule: CrawlerRule, testResult?: DetailedTestResult): OptimizationReport {
    const suggestions: OptimizationSuggestion[] = [];

    // 分析选择器配置
    this.analyzeSelectors(rule, testResult, suggestions);

    // 分析时间配置
    this.analyzeTiming(rule, testResult, suggestions);

    // 分析质量控制
    this.analyzeQualityControl(rule, testResult, suggestions);

    // 分析性能配置
    this.analyzePerformance(rule, testResult, suggestions);

    // 分析反爬虫配置
    this.analyzeAntiBot(rule, testResult, suggestions);

    // 计算当前和潜在评分
    const currentScore = this.calculateRuleScore(rule, testResult);
    const potentialScore = this.calculatePotentialScore(currentScore, suggestions);

    // 分类建议
    const autoFixable = suggestions.filter(s => this.isAutoFixable(s));
    const manualReview = suggestions.filter(s => !this.isAutoFixable(s));

    return {
      ruleId: rule.id,
      ruleName: rule.websiteName,
      currentScore,
      potentialScore,
      suggestions,
      autoFixable,
      manualReview
    };
  }

  /**
   * 分析选择器配置
   */
  private static analyzeSelectors(
    rule: CrawlerRule, 
    testResult: DetailedTestResult | undefined, 
    suggestions: OptimizationSuggestion[]
  ): void {
    const selectors = rule.parseConfig.detailSelectors;

    // 检查必要选择器
    if (!selectors.title) {
      suggestions.push({
        type: 'selector',
        priority: 'critical',
        field: 'parseConfig.detailSelectors.title',
        currentValue: undefined,
        suggestedValue: 'h1, .title, .post-title',
        reason: '缺少标题选择器',
        expectedImprovement: '确保能够提取页面标题'
      });
    }

    if (!selectors.images) {
      suggestions.push({
        type: 'selector',
        priority: 'high',
        field: 'parseConfig.detailSelectors.images',
        currentValue: undefined,
        suggestedValue: 'img, .preview img, .gallery img',
        reason: '缺少图片选择器',
        expectedImprovement: '提高图片提取成功率'
      });
    }

    // 基于测试结果分析选择器效果
    if (testResult && !testResult.success) {
      if (testResult.errors.some(e => e.includes('selector') || e.includes('选择器'))) {
        suggestions.push({
          type: 'selector',
          priority: 'high',
          field: 'parseConfig.listSelectors',
          currentValue: rule.parseConfig.listSelectors,
          suggestedValue: '建议使用更通用的选择器',
          reason: '当前选择器可能失效',
          expectedImprovement: '提高页面解析成功率'
        });
      }
    }

    // 检查选择器复杂度
    Object.entries(selectors).forEach(([key, selector]) => {
      if (selector && typeof selector === 'string') {
        if (selector.split(' ').length > 5) {
          suggestions.push({
            type: 'selector',
            priority: 'medium',
            field: `parseConfig.detailSelectors.${key}`,
            currentValue: selector,
            suggestedValue: '简化选择器路径',
            reason: '选择器过于复杂，可能不稳定',
            expectedImprovement: '提高选择器稳定性'
          });
        }
      }
    });
  }

  /**
   * 分析时间配置
   */
  private static analyzeTiming(
    rule: CrawlerRule, 
    testResult: DetailedTestResult | undefined, 
    suggestions: OptimizationSuggestion[]
  ): void {
    const timing = rule.antiDetection.requestConfig;

    // 检查延迟设置
    if (timing.delay < 1000) {
      suggestions.push({
        type: 'timing',
        priority: 'medium',
        field: 'antiDetection.requestConfig.delay',
        currentValue: timing.delay,
        suggestedValue: 2000,
        reason: '请求延迟过短，可能被识别为机器人',
        expectedImprovement: '降低被封禁的风险'
      });
    } else if (timing.delay > 10000) {
      suggestions.push({
        type: 'timing',
        priority: 'low',
        field: 'antiDetection.requestConfig.delay',
        currentValue: timing.delay,
        suggestedValue: 5000,
        reason: '请求延迟过长，影响效率',
        expectedImprovement: '提高爬取效率'
      });
    }

    // 检查超时设置
    if (timing.timeout < 15000) {
      suggestions.push({
        type: 'timing',
        priority: 'medium',
        field: 'antiDetection.requestConfig.timeout',
        currentValue: timing.timeout,
        suggestedValue: 30000,
        reason: '超时时间过短，可能导致请求失败',
        expectedImprovement: '减少超时错误'
      });
    }

    // 基于测试结果调整时间配置
    if (testResult) {
      if (testResult.errors.some(e => e.includes('timeout') || e.includes('超时'))) {
        suggestions.push({
          type: 'timing',
          priority: 'high',
          field: 'antiDetection.requestConfig.timeout',
          currentValue: timing.timeout,
          suggestedValue: timing.timeout * 1.5,
          reason: '检测到超时错误',
          expectedImprovement: '减少超时失败'
        });
      }

      if (testResult.performance.totalTime > 30000) {
        suggestions.push({
          type: 'timing',
          priority: 'medium',
          field: 'antiDetection.requestConfig.delay',
          currentValue: timing.delay,
          suggestedValue: Math.max(1000, timing.delay * 0.8),
          reason: '响应时间过长',
          expectedImprovement: '提高爬取速度'
        });
      }
    }
  }

  /**
   * 分析质量控制
   */
  private static analyzeQualityControl(
    rule: CrawlerRule, 
    testResult: DetailedTestResult | undefined, 
    suggestions: OptimizationSuggestion[]
  ): void {
    const quality = rule.qualityControl;

    // 检查标题长度要求
    if (quality.minTitleLength < 3) {
      suggestions.push({
        type: 'quality',
        priority: 'medium',
        field: 'qualityControl.minTitleLength',
        currentValue: quality.minTitleLength,
        suggestedValue: 5,
        reason: '最小标题长度过短，可能接受低质量数据',
        expectedImprovement: '提高数据质量'
      });
    }

    // 检查结果数量限制
    if (quality.maxResultsPerPage > 50) {
      suggestions.push({
        type: 'quality',
        priority: 'low',
        field: 'qualityControl.maxResultsPerPage',
        currentValue: quality.maxResultsPerPage,
        suggestedValue: 30,
        reason: '单页结果数量过多，可能影响性能',
        expectedImprovement: '提高处理效率'
      });
    }

    // 基于测试结果调整质量控制
    if (testResult && testResult.validationResults) {
      const validRate = testResult.validationResults.validResults / testResult.validationResults.totalResults;
      
      if (validRate < 0.6) {
        suggestions.push({
          type: 'quality',
          priority: 'high',
          field: 'qualityControl',
          currentValue: quality,
          suggestedValue: '加强质量控制规则',
          reason: '数据有效率较低',
          expectedImprovement: '提高数据质量'
        });
      }

      if (testResult.validationResults.avgScore < 60) {
        suggestions.push({
          type: 'quality',
          priority: 'medium',
          field: 'parseConfig.detailSelectors',
          currentValue: '当前选择器配置',
          suggestedValue: '添加更多字段选择器',
          reason: '数据完整性评分较低',
          expectedImprovement: '提高数据完整性'
        });
      }
    }
  }

  /**
   * 分析性能配置
   */
  private static analyzePerformance(
    rule: CrawlerRule, 
    testResult: DetailedTestResult | undefined, 
    suggestions: OptimizationSuggestion[]
  ): void {
    const antiDetection = rule.antiDetection;

    // 检查浏览器配置
    if (antiDetection.useHeadlessBrowser && !antiDetection.browserConfig?.enableJavaScript) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        field: 'antiDetection.browserConfig.enableJavaScript',
        currentValue: false,
        suggestedValue: true,
        reason: '禁用JavaScript可能导致动态内容无法加载',
        expectedImprovement: '提高动态内容提取成功率'
      });
    }

    // 检查重试配置
    if (antiDetection.requestConfig.maxRetries < 2) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        field: 'antiDetection.requestConfig.maxRetries',
        currentValue: antiDetection.requestConfig.maxRetries,
        suggestedValue: 3,
        reason: '重试次数过少，可能错过临时失败的请求',
        expectedImprovement: '提高请求成功率'
      });
    } else if (antiDetection.requestConfig.maxRetries > 5) {
      suggestions.push({
        type: 'performance',
        priority: 'low',
        field: 'antiDetection.requestConfig.maxRetries',
        currentValue: antiDetection.requestConfig.maxRetries,
        suggestedValue: 3,
        reason: '重试次数过多，可能影响效率',
        expectedImprovement: '提高处理效率'
      });
    }

    // 基于测试结果优化性能
    if (testResult) {
      const errorRate = testResult.errors.length / (testResult.results.length + testResult.errors.length);
      
      if (errorRate > 0.3) {
        suggestions.push({
          type: 'performance',
          priority: 'high',
          field: 'antiDetection.requestConfig.maxRetries',
          currentValue: antiDetection.requestConfig.maxRetries,
          suggestedValue: Math.min(5, antiDetection.requestConfig.maxRetries + 1),
          reason: '错误率较高，建议增加重试次数',
          expectedImprovement: '降低失败率'
        });
      }
    }
  }

  /**
   * 分析反爬虫配置
   */
  private static analyzeAntiBot(
    rule: CrawlerRule, 
    testResult: DetailedTestResult | undefined, 
    suggestions: OptimizationSuggestion[]
  ): void {
    const antiDetection = rule.antiDetection;

    // 检查User-Agent配置
    if (!antiDetection.browserConfig?.userAgent) {
      suggestions.push({
        type: 'antibot',
        priority: 'medium',
        field: 'antiDetection.browserConfig.userAgent',
        currentValue: undefined,
        suggestedValue: '设置真实浏览器User-Agent',
        reason: '未设置User-Agent，可能被识别为机器人',
        expectedImprovement: '降低被检测的风险'
      });
    }

    // 检查随机延迟
    if (!antiDetection.requestConfig.randomDelay) {
      suggestions.push({
        type: 'antibot',
        priority: 'medium',
        field: 'antiDetection.requestConfig.randomDelay',
        currentValue: false,
        suggestedValue: true,
        reason: '固定延迟容易被识别为机器人行为',
        expectedImprovement: '增加行为随机性'
      });
    }

    // 检查代理配置
    if (!antiDetection.proxyConfig?.enabled) {
      suggestions.push({
        type: 'antibot',
        priority: 'low',
        field: 'antiDetection.proxyConfig.enabled',
        currentValue: false,
        suggestedValue: true,
        reason: '未启用代理，IP可能被封禁',
        expectedImprovement: '降低IP封禁风险'
      });
    }

    // 基于测试结果调整反爬虫策略
    if (testResult) {
      if (testResult.errors.some(e => e.includes('blocked') || e.includes('封禁') || e.includes('403'))) {
        suggestions.push({
          type: 'antibot',
          priority: 'critical',
          field: 'antiDetection',
          currentValue: '当前反爬虫配置',
          suggestedValue: '加强反爬虫策略',
          reason: '检测到被封禁或阻止',
          expectedImprovement: '提高访问成功率'
        });
      }
    }
  }

  /**
   * 计算规则评分
   */
  private static calculateRuleScore(rule: CrawlerRule, testResult?: DetailedTestResult): number {
    let score = 100;

    // 基础配置评分 (40分)
    if (!rule.parseConfig.detailSelectors.title) score -= 10;
    if (!rule.parseConfig.detailSelectors.images) score -= 5;
    if (!rule.parseConfig.listSelectors.container) score -= 10;
    if (!rule.parseConfig.listSelectors.item) score -= 10;
    if (!rule.parseConfig.listSelectors.link) score -= 5;

    // 反爬虫配置评分 (20分)
    if (rule.antiDetection.requestConfig.delay < 1000) score -= 5;
    if (!rule.antiDetection.requestConfig.randomDelay) score -= 3;
    if (!rule.antiDetection.browserConfig?.userAgent) score -= 5;
    if (rule.antiDetection.requestConfig.maxRetries < 2) score -= 3;
    if (rule.antiDetection.requestConfig.timeout < 15000) score -= 4;

    // 质量控制评分 (20分)
    if (rule.qualityControl.minTitleLength < 3) score -= 5;
    if (!rule.qualityControl.duplicateDetection) score -= 5;
    if (rule.qualityControl.maxResultsPerPage > 50) score -= 3;
    if (rule.qualityControl.maxResultsPerPage < 5) score -= 7;

    // 测试结果评分 (20分)
    if (testResult) {
      if (!testResult.success) {
        score -= 15;
      } else {
        if (testResult.results.length === 0) score -= 10;
        else if (testResult.results.length < 3) score -= 5;
        
        if (testResult.performance.totalTime > 30000) score -= 3;
        if (testResult.errors.length > 0) score -= 2;
        
        if (testResult.validationResults) {
          const validRate = testResult.validationResults.validResults / testResult.validationResults.totalResults;
          if (validRate < 0.8) score -= 5;
          if (testResult.validationResults.avgScore < 70) score -= 3;
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算潜在评分
   */
  private static calculatePotentialScore(currentScore: number, suggestions: OptimizationSuggestion[]): number {
    let improvement = 0;
    
    suggestions.forEach(suggestion => {
      switch (suggestion.priority) {
        case 'critical':
          improvement += 15;
          break;
        case 'high':
          improvement += 10;
          break;
        case 'medium':
          improvement += 5;
          break;
        case 'low':
          improvement += 2;
          break;
      }
    });

    return Math.min(100, currentScore + improvement);
  }

  /**
   * 判断建议是否可以自动修复
   */
  private static isAutoFixable(suggestion: OptimizationSuggestion): boolean {
    const autoFixableTypes = ['timing', 'quality'];
    const autoFixableFields = [
      'antiDetection.requestConfig.delay',
      'antiDetection.requestConfig.timeout',
      'antiDetection.requestConfig.maxRetries',
      'antiDetection.requestConfig.randomDelay',
      'qualityControl.minTitleLength',
      'qualityControl.maxResultsPerPage',
      'qualityControl.duplicateDetection'
    ];

    return autoFixableTypes.includes(suggestion.type) || 
           autoFixableFields.includes(suggestion.field);
  }

  /**
   * 自动应用可修复的建议
   */
  static applyAutoFixes(rule: CrawlerRule, suggestions: OptimizationSuggestion[]): CrawlerRule {
    const optimizedRule = JSON.parse(JSON.stringify(rule)); // 深拷贝

    suggestions
      .filter(s => this.isAutoFixable(s))
      .forEach(suggestion => {
        this.applySuggestion(optimizedRule, suggestion);
      });

    return optimizedRule;
  }

  /**
   * 应用单个建议
   */
  private static applySuggestion(rule: CrawlerRule, suggestion: OptimizationSuggestion): void {
    const fieldPath = suggestion.field.split('.');
    let current: any = rule;

    // 导航到目标字段的父对象
    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) {
        current[fieldPath[i]] = {};
      }
      current = current[fieldPath[i]];
    }

    // 设置新值
    const finalField = fieldPath[fieldPath.length - 1];
    current[finalField] = suggestion.suggestedValue;
  }

  /**
   * 批量优化规则
   */
  static optimizeRules(
    rules: CrawlerRule[], 
    testResults?: DetailedTestResult[]
  ): Array<{
    original: CrawlerRule;
    optimized: CrawlerRule;
    report: OptimizationReport;
  }> {
    return rules.map(rule => {
      const testResult = testResults?.find(t => t.ruleId === rule.id);
      const report = this.analyzeRule(rule, testResult);
      const optimized = this.applyAutoFixes(rule, report.autoFixable);

      return {
        original: rule,
        optimized,
        report
      };
    });
  }
}