/**
 * 完整测试执行脚本
 * 按顺序执行所有测试套件并生成报告
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  description: string;
  pattern: string;
  timeout: number;
  critical: boolean; // 是否为关键测试，失败时停止后续测试
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class TestRunner {
  private testSuites: TestSuite[] = [
    {
      name: '爬虫规则验证',
      description: '验证爬虫规则的有效性和数据提取准确性',
      pattern: 'src/tests/crawler/crawlerRuleValidation.test.ts',
      timeout: 60000,
      critical: true
    },
    {
      name: '反爬虫机制',
      description: '测试反爬虫检测和应对策略',
      pattern: 'src/tests/crawler/antiCrawlerMechanism.test.ts',
      timeout: 90000,
      critical: true
    },
    {
      name: '数据质量保证',
      description: '验证数据准确性和质量控制',
      pattern: 'src/tests/quality/qualityAssurance.test.ts',
      timeout: 45000,
      critical: true
    },
    {
      name: '性能基准测试',
      description: '测试系统性能指标和基准',
      pattern: 'src/tests/performance/performanceBenchmark.test.ts',
      timeout: 120000,
      critical: false
    },
    {
      name: '用户体验测试',
      description: '测试用户界面和交互体验',
      pattern: 'src/tests/ui/userExperience.test.ts',
      timeout: 60000,
      critical: false
    },
    {
      name: '系统集成测试',
      description: '测试系统各组件之间的集成',
      pattern: 'src/tests/integration/systemIntegration.test.ts',
      timeout: 90000,
      critical: true
    },
    {
      name: '端到端工作流',
      description: '测试完整的用户使用场景',
      pattern: 'src/tests/e2e/endToEndWorkflow.test.ts',
      timeout: 120000,
      critical: true
    }
  ];

  private results: TestResult[] = [];

  /**
   * 运行单个测试套件
   */
  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    console.log(`\n🧪 开始运行: ${suite.name}`);
    console.log(`📝 描述: ${suite.description}`);
    console.log(`⏱️  超时: ${suite.timeout / 1000}秒`);

    const startTime = Date.now();
    
    try {
      const command = `npx vitest run ${suite.pattern} --reporter=verbose --timeout=${suite.timeout}`;
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: suite.timeout + 10000, // 额外10秒缓冲
        maxBuffer: 1024 * 1024 * 10 // 10MB缓冲区
      });

      const duration = Date.now() - startTime;
      
      console.log(`✅ ${suite.name} 通过 (${duration}ms)`);
      
      return {
        suite: suite.name,
        passed: true,
        duration,
        output
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.log(`❌ ${suite.name} 失败 (${duration}ms)`);
      console.log(`错误: ${error.message}`);
      
      return {
        suite: suite.name,
        passed: false,
        duration,
        output: error.stdout || '',
        error: error.message
      };
    }
  }

  /**
   * 运行所有测试套件
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行完整测试套件');
    console.log(`📊 总计 ${this.testSuites.length} 个测试套件`);
    console.log('='.repeat(60));

    let criticalFailure = false;

    for (const suite of this.testSuites) {
      if (criticalFailure && suite.critical) {
        console.log(`⏭️  跳过 ${suite.name} (由于关键测试失败)`);
        continue;
      }

      const result = await this.runTestSuite(suite);
      this.results.push(result);

      if (!result.passed && suite.critical) {
        criticalFailure = true;
        console.log(`🚨 关键测试失败: ${suite.name}`);
      }

      // 测试间隔，避免资源冲突
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.generateReport();
  }

  /**
   * 生成测试报告
   */
  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试执行报告');
    console.log('='.repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    // 控制台报告
    console.log(`\n📈 总体统计:`);
    console.log(`   测试套件: ${totalTests}`);
    console.log(`   通过: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   失败: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   总耗时: ${(totalDuration / 1000).toFixed(1)}秒`);

    console.log(`\n📋 详细结果:`);
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(1);
      console.log(`   ${status} ${result.suite} (${duration}s)`);
      
      if (!result.passed && result.error) {
        console.log(`      错误: ${result.error.split('\n')[0]}`);
      }
    });

    // 生成HTML报告
    this.generateHtmlReport();

    // 生成JSON报告
    this.generateJsonReport();

    // 最终状态
    const overallSuccess = failedTests === 0;
    console.log(`\n🎯 测试结果: ${overallSuccess ? '✅ 全部通过' : '❌ 存在失败'}`);

    if (!overallSuccess) {
      console.log(`⚠️  需要修复 ${failedTests} 个失败的测试套件`);
      process.exit(1);
    }
  }

  /**
   * 生成HTML报告
   */
  private generateHtmlReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试报告 - 3D素材搜索平台</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .results { padding: 0 30px 30px; }
        .result-item { display: flex; align-items: center; padding: 15px; margin-bottom: 10px; border-radius: 6px; background: #f8f9fa; }
        .result-item.passed { border-left: 4px solid #28a745; }
        .result-item.failed { border-left: 4px solid #dc3545; }
        .result-icon { font-size: 1.2em; margin-right: 15px; }
        .result-content { flex: 1; }
        .result-name { font-weight: 600; margin-bottom: 5px; }
        .result-duration { color: #666; font-size: 0.9em; }
        .result-error { color: #dc3545; font-size: 0.9em; margin-top: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 测试报告</h1>
            <p>3D素材搜索平台 - 全面测试和质量保证</p>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${totalTests}</div>
                <div class="stat-label">测试套件</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${passedTests}</div>
                <div class="stat-label">通过</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${failedTests}</div>
                <div class="stat-label">失败</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${(totalDuration / 1000).toFixed(1)}s</div>
                <div class="stat-label">总耗时</div>
            </div>
        </div>
        
        <div class="results">
            <h2>📋 详细结果</h2>
            ${this.results.map(result => `
                <div class="result-item ${result.passed ? 'passed' : 'failed'}">
                    <div class="result-icon">${result.passed ? '✅' : '❌'}</div>
                    <div class="result-content">
                        <div class="result-name">${result.suite}</div>
                        <div class="result-duration">耗时: ${(result.duration / 1000).toFixed(1)}秒</div>
                        ${result.error ? `<div class="result-error">错误: ${result.error.split('\n')[0]}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>🎯 测试结果: ${failedTests === 0 ? '✅ 全部通过' : '❌ 存在失败'}</p>
            <p>通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(process.cwd(), 'test-report.html');
    writeFileSync(reportPath, html, 'utf8');
    console.log(`📄 HTML报告已生成: ${reportPath}`);
  }

  /**
   * 生成JSON报告
   */
  private generateJsonReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        duration: this.results.reduce((sum, r) => sum + r.duration, 0),
        passRate: (this.results.filter(r => r.passed).length / this.results.length) * 100
      },
      results: this.results,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    const reportPath = path.join(process.cwd(), 'test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`📄 JSON报告已生成: ${reportPath}`);
  }

  /**
   * 运行特定测试套件
   */
  async runSpecificTest(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => s.name.includes(suiteName));
    if (!suite) {
      console.log(`❌ 未找到测试套件: ${suiteName}`);
      console.log(`可用的测试套件:`);
      this.testSuites.forEach(s => console.log(`  - ${s.name}`));
      return;
    }

    const result = await this.runTestSuite(suite);
    this.results = [result];
    this.generateReport();
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const testRunner = new TestRunner();

  if (args.length > 0) {
    const suiteName = args[0];
    await testRunner.runSpecificTest(suiteName);
  } else {
    await testRunner.runAllTests();
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

export { TestRunner };