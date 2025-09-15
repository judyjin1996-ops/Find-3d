/**
 * 测试运行器
 * 统一管理和执行所有测试套件
 */

import { describe, test, expect } from 'vitest';

// 测试套件导入
import './integration/systemIntegration.test';
import './performance/performanceBenchmark.test';
import './quality/qualityAssurance.test';
import './crawler/crawlerRuleValidation.test';
import './crawler/antiCrawlerMechanism.test';
import './ui/userExperience.test';
import './e2e/endToEndWorkflow.test';

/**
 * 测试配置和统计
 */
export interface TestSuiteConfig {
  name: string;
  description: string;
  timeout: number;
  retries: number;
  parallel: boolean;
}

export interface TestResults {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: number;
}

export class TestRunner {
  private suites: Map<string, TestSuiteConfig> = new Map();
  private results: TestResults[] = [];

  constructor() {
    this.initializeTestSuites();
  }

  private initializeTestSuites() {
    // 系统集成测试
    this.suites.set('integration', {
      name: '系统集成测试',
      description: '测试系统各组件之间的集成和协作',
      timeout: 30000,
      retries: 2,
      parallel: false
    });

    // 性能基准测试
    this.suites.set('performance', {
      name: '性能基准测试',
      description: '测试系统性能指标和基准',
      timeout: 60000,
      retries: 1,
      parallel: false
    });

    // 质量保证测试
    this.suites.set('quality', {
      name: '质量保证测试',
      description: '验证系统质量和稳定性',
      timeout: 45000,
      retries: 2,
      parallel: true
    });

    // 爬虫规则验证测试
    this.suites.set('crawler-rules', {
      name: '爬虫规则验证测试',
      description: '验证爬虫规则的有效性和准确性',
      timeout: 20000,
      retries: 3,
      parallel: true
    });

    // 反爬虫机制测试
    this.suites.set('anti-crawler', {
      name: '反爬虫机制测试',
      description: '测试反爬虫检测和应对策略',
      timeout: 25000,
      retries: 2,
      parallel: false
    });

    // 用户体验测试
    this.suites.set('user-experience', {
      name: '用户体验测试',
      description: '测试用户界面和交互体验',
      timeout: 15000,
      retries: 1,
      parallel: true
    });

    // 端到端工作流测试
    this.suites.set('e2e-workflow', {
      name: '端到端工作流测试',
      description: '测试完整的用户使用场景',
      timeout: 40000,
      retries: 1,
      parallel: false
    });
  }

  /**
   * 运行指定的测试套件
   */
  async runSuite(suiteName: string): Promise<TestResults> {
    const config = this.suites.get(suiteName);
    if (!config) {
      throw new Error(`测试套件不存在: ${suiteName}`);
    }

    console.log(`🧪 开始运行测试套件: ${config.name}`);
    console.log(`📝 描述: ${config.description}`);

    const startTime = Date.now();
    
    try {
      // 这里实际上会由 Vitest 运行器执行
      // 我们只是模拟结果收集
      const result: TestResults = {
        suiteName: config.name,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: Date.now() - startTime,
        coverage: 0
      };

      this.results.push(result);
      return result;
    } catch (error) {
      console.error(`❌ 测试套件执行失败: ${config.name}`, error);
      throw error;
    }
  }

  /**
   * 运行所有测试套件
   */
  async runAllSuites(): Promise<TestResults[]> {
    console.log('🚀 开始运行所有测试套件');
    
    const results: TestResults[] = [];
    
    for (const [suiteName] of this.suites) {
      try {
        const result = await this.runSuite(suiteName);
        results.push(result);
      } catch (error) {
        console.error(`测试套件失败: ${suiteName}`, error);
      }
    }

    this.generateSummaryReport(results);
    return results;
  }

  /**
   * 生成测试摘要报告
   */
  private generateSummaryReport(results: TestResults[]) {
    console.log('\n📊 测试执行摘要报告');
    console.log('='.repeat(50));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    results.forEach(result => {
      totalTests += result.totalTests;
      totalPassed += result.passedTests;
      totalFailed += result.failedTests;
      totalSkipped += result.skippedTests;
      totalDuration += result.duration;

      const passRate = result.totalTests > 0 
        ? ((result.passedTests / result.totalTests) * 100).toFixed(1)
        : '0.0';

      console.log(`\n📋 ${result.suiteName}`);
      console.log(`   总计: ${result.totalTests} | 通过: ${result.passedTests} | 失败: ${result.failedTests} | 跳过: ${result.skippedTests}`);
      console.log(`   通过率: ${passRate}% | 耗时: ${result.duration}ms`);
      if (result.coverage !== undefined) {
        console.log(`   覆盖率: ${result.coverage.toFixed(1)}%`);
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log('📈 总体统计');
    console.log(`   测试套件: ${results.length}`);
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   通过: ${totalPassed} (${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0'}%)`);
    console.log(`   失败: ${totalFailed} (${totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : '0.0'}%)`);
    console.log(`   跳过: ${totalSkipped} (${totalTests > 0 ? ((totalSkipped / totalTests) * 100).toFixed(1) : '0.0'}%)`);
    console.log(`   总耗时: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);

    // 生成测试状态
    const overallSuccess = totalFailed === 0 && totalTests > 0;
    console.log(`\n🎯 测试结果: ${overallSuccess ? '✅ 全部通过' : '❌ 存在失败'}`);

    if (!overallSuccess && totalFailed > 0) {
      console.log(`⚠️  需要修复 ${totalFailed} 个失败的测试`);
    }
  }

  /**
   * 获取测试配置
   */
  getTestConfig(suiteName: string): TestSuiteConfig | undefined {
    return this.suites.get(suiteName);
  }

  /**
   * 获取所有测试套件名称
   */
  getAllSuiteNames(): string[] {
    return Array.from(this.suites.keys());
  }

  /**
   * 获取测试结果
   */
  getResults(): TestResults[] {
    return [...this.results];
  }
}

// 导出测试运行器实例
export const testRunner = new TestRunner();

// 测试运行器自身的测试
describe('测试运行器', () => {
  test('应该正确初始化测试套件', () => {
    const suiteNames = testRunner.getAllSuiteNames();
    
    expect(suiteNames).toContain('integration');
    expect(suiteNames).toContain('performance');
    expect(suiteNames).toContain('quality');
    expect(suiteNames).toContain('crawler-rules');
    expect(suiteNames).toContain('anti-crawler');
    expect(suiteNames).toContain('user-experience');
    expect(suiteNames).toContain('e2e-workflow');
  });

  test('应该能够获取测试配置', () => {
    const integrationConfig = testRunner.getTestConfig('integration');
    
    expect(integrationConfig).toBeTruthy();
    expect(integrationConfig!.name).toBe('系统集成测试');
    expect(integrationConfig!.timeout).toBe(30000);
  });

  test('应该能够处理不存在的测试套件', () => {
    const nonExistentConfig = testRunner.getTestConfig('non-existent');
    expect(nonExistentConfig).toBeUndefined();
  });
});

/**
 * 测试工具函数
 */
export class TestUtils {
  /**
   * 创建模拟数据
   */
  static createMockData<T>(factory: () => T, count: number): T[] {
    return Array.from({ length: count }, factory);
  }

  /**
   * 等待指定时间
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 测试性能
   */
  static async measurePerformance<T>(
    operation: () => Promise<T>,
    expectedMaxTime: number
  ): Promise<{ result: T; duration: number; withinLimit: boolean }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    const withinLimit = duration <= expectedMaxTime;

    return { result, duration, withinLimit };
  }

  /**
   * 批量测试
   */
  static async batchTest<T>(
    operations: (() => Promise<T>)[],
    maxConcurrency: number = 5
  ): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
    const results: Array<{ success: boolean; result?: T; error?: Error }> = [];
    
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      const batchResults = await Promise.allSettled(
        batch.map(op => op())
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push({ success: true, result: result.value });
        } else {
          results.push({ success: false, error: result.reason });
        }
      });
    }

    return results;
  }

  /**
   * 验证数据结构
   */
  static validateStructure<T>(
    data: any,
    schema: Record<string, string>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in data)) {
        errors.push(`缺少必需字段: ${key}`);
        continue;
      }

      const actualType = typeof data[key];
      if (actualType !== expectedType) {
        errors.push(`字段 ${key} 类型错误: 期望 ${expectedType}, 实际 ${actualType}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

// 导出测试工具
export { TestUtils as testUtils };