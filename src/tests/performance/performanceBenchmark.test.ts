/**
 * 性能基准测试
 * 测试系统各组件的性能表现
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { smartCacheService } from '../../services/smartCacheService';
import { userConfigService } from '../../services/userConfigService';
import { performanceOptimizer } from '../../services/performanceOptimizer';
import { resourcePoolManager } from '../../services/resourcePoolManager';
import { dataQualityManager } from '../../utils/dataQualityManager';
import type { ExtractedMaterialResult } from '../../crawler/types/crawler';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  throughput: number; // 每秒操作数
}

describe('性能基准测试', () => {
  beforeAll(async () => {
    await smartCacheService.initialize();
    performanceOptimizer.startMonitoring(1000);
    console.log('🏃 性能基准测试环境初始化完成');
  });

  afterAll(async () => {
    await smartCacheService.cleanup();
    performanceOptimizer.stopMonitoring();
    await resourcePoolManager.cleanup();
    console.log('🏁 性能基准测试环境清理完成');
  });

  /**
   * 执行基准测试
   */
  async function runBenchmark(
    operation: string,
    testFunction: () => Promise<void>,
    iterations = 1000
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    
    console.log(`🔥 开始基准测试: ${operation} (${iterations} 次迭代)`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = Date.now();
      await testFunction();
      const iterationTime = Date.now() - iterationStart;
      times.push(iterationTime);
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = (iterations / totalTime) * 1000; // 每秒操作数
    
    const result: BenchmarkResult = {
      operation,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      throughput
    };
    
    console.log(`✅ ${operation} 基准测试完成:`, {
      平均时间: `${avgTime.toFixed(2)}ms`,
      最小时间: `${minTime}ms`,
      最大时间: `${maxTime}ms`,
      吞吐量: `${throughput.toFixed(2)} ops/sec`
    });
    
    return result;
  }

  describe('缓存性能基准测试', () => {
    test('内存缓存写入性能', async () => {
      const result = await runBenchmark(
        '内存缓存写入',
        async () => {
          const key = `bench-write-${Math.random()}`;
          const data = { test: true, timestamp: Date.now() };
          await smartCacheService.set('benchmark', key, data, { priority: 'high' });
        },
        1000
      );

      // 性能要求：平均写入时间应小于5ms
      expect(result.avgTime).toBeLessThan(5);
      // 吞吐量应大于200 ops/sec
      expect(result.throughput).toBeGreaterThan(200);
    });

    test('内存缓存读取性能', async () => {
      // 预先写入测试数据
      const testKeys: string[] = [];
      for (let i = 0; i < 100; i++) {
        const key = `bench-read-${i}`;
        await smartCacheService.set('benchmark', key, { data: i });
        testKeys.push(key);
      }

      const result = await runBenchmark(
        '内存缓存读取',
        async () => {
          const key = testKeys[Math.floor(Math.random() * testKeys.length)];
          await smartCacheService.get('benchmark', key);
        },
        1000
      );

      // 性能要求：平均读取时间应小于2ms
      expect(result.avgTime).toBeLessThan(2);
      // 吞吐量应大于500 ops/sec
      expect(result.throughput).toBeGreaterThan(500);
    });

    test('缓存清理性能', async () => {
      // 预先写入大量数据
      for (let i = 0; i < 1000; i++) {
        await smartCacheService.set('cleanup-test', `key-${i}`, { data: i });
      }

      const result = await runBenchmark(
        '缓存清理',
        async () => {
          await smartCacheService.clearByTags(['cleanup-test']);
        },
        10 // 较少的迭代次数，因为清理操作比较重
      );

      // 性能要求：清理操作应在合理时间内完成
      expect(result.avgTime).toBeLessThan(100);
    });
  });

  describe('数据质量处理性能基准测试', () => {
    const generateMockResult = (id: string): ExtractedMaterialResult => ({
      id,
      title: `测试素材 ${id}`,
      sourceWebsite: '测试网站',
      sourceUrl: `https://test.com/${id}`,
      previewImages: [{ url: `https://test.com/img${id}.jpg`, alt: `预览图${id}` }],
      pricing: { isFree: Math.random() > 0.5, price: Math.random() * 100 },
      fileInfo: { format: 'max', size: `${Math.floor(Math.random() * 50)}MB` },
      statistics: { downloadCount: Math.floor(Math.random() * 1000) },
      categorization: { tags: ['测试', '基准'] },
      timestamps: { extractedAt: new Date() },
      extraction: {
        ruleId: 'benchmark-rule',
        status: 'success',
        confidence: 0.8 + Math.random() * 0.2,
        missingFields: [],
        processingTime: Math.floor(Math.random() * 2000)
      },
      quality: {
        score: 70 + Math.random() * 30,
        factors: { completeness: 80, imageQuality: 75, dataAccuracy: 85 }
      }
    });

    test('重复检测性能', async () => {
      const existingResults = Array.from({ length: 100 }, (_, i) => 
        generateMockResult(`existing-${i}`)
      );

      const result = await runBenchmark(
        '重复检测',
        async () => {
          const newResult = generateMockResult(`new-${Math.random()}`);
          dataQualityManager.detectDuplicates(newResult, existingResults);
        },
        500
      );

      // 性能要求：重复检测平均时间应小于10ms
      expect(result.avgTime).toBeLessThan(10);
      // 吞吐量应大于100 ops/sec
      expect(result.throughput).toBeGreaterThan(100);
    });

    test('数据质量评估性能', async () => {
      const result = await runBenchmark(
        '数据质量评估',
        async () => {
          const testResult = generateMockResult(`quality-${Math.random()}`);
          dataQualityManager.assessQuality(testResult);
        },
        1000
      );

      // 性能要求：质量评估平均时间应小于5ms
      expect(result.avgTime).toBeLessThan(5);
      // 吞吐量应大于200 ops/sec
      expect(result.throughput).toBeGreaterThan(200);
    });

    test('数据清理性能', async () => {
      const result = await runBenchmark(
        '数据清理',
        async () => {
          const dirtyResult = generateMockResult(`dirty-${Math.random()}`);
          // 添加一些需要清理的数据
          dirtyResult.title = `  <b>${dirtyResult.title}</b>  `;
          dirtyResult.description = '<p>包含HTML标签的描述&nbsp;</p>';
          dirtyResult.categorization.tags = ['重复', '重复', '测试', ''];
          
          dataQualityManager.cleanData(dirtyResult);
        },
        500
      );

      // 性能要求：数据清理平均时间应小于15ms
      expect(result.avgTime).toBeLessThan(15);
      // 吞吐量应大于50 ops/sec
      expect(result.throughput).toBeGreaterThan(50);
    });

    test('批量数据处理性能', async () => {
      const batchSizes = [10, 50, 100, 200];
      
      for (const batchSize of batchSizes) {
        const testData = Array.from({ length: batchSize }, (_, i) => 
          generateMockResult(`batch-${i}`)
        );

        const result = await runBenchmark(
          `批量处理 (${batchSize} 项)`,
          async () => {
            dataQualityManager.batchProcessQuality(testData);
          },
          50 // 较少的迭代次数
        );

        // 性能要求：批量处理时间应与数据量成线性关系
        const expectedMaxTime = batchSize * 0.5; // 每项0.5ms
        expect(result.avgTime).toBeLessThan(expectedMaxTime);
        
        console.log(`📊 批量处理 ${batchSize} 项: ${result.avgTime.toFixed(2)}ms`);
      }
    });
  });

  describe('用户配置性能基准测试', () => {
    test('配置读取性能', async () => {
      const result = await runBenchmark(
        '配置读取',
        async () => {
          userConfigService.getConfig();
        },
        1000
      );

      // 性能要求：配置读取应该非常快
      expect(result.avgTime).toBeLessThan(1);
      expect(result.throughput).toBeGreaterThan(1000);
    });

    test('配置更新性能', async () => {
      const result = await runBenchmark(
        '配置更新',
        async () => {
          const config = userConfigService.getConfig();
          userConfigService.updateConfig({
            display: {
              ...config.display,
              resultsPerPage: Math.floor(Math.random() * 100) + 10
            }
          });
        },
        500
      );

      // 性能要求：配置更新应在合理时间内完成
      expect(result.avgTime).toBeLessThan(10);
      expect(result.throughput).toBeGreaterThan(50);
    });

    test('搜索历史添加性能', async () => {
      const result = await runBenchmark(
        '搜索历史添加',
        async () => {
          userConfigService.addSearchHistory({
            query: `测试查询 ${Math.random()}`,
            websites: ['test-site'],
            resultCount: Math.floor(Math.random() * 100),
            searchTime: Math.floor(Math.random() * 5000)
          });
        },
        500
      );

      // 性能要求：添加搜索历史应该快速
      expect(result.avgTime).toBeLessThan(5);
      expect(result.throughput).toBeGreaterThan(100);
    });

    test('搜索建议生成性能', async () => {
      // 预先添加一些搜索历史
      for (let i = 0; i < 50; i++) {
        userConfigService.addSearchHistory({
          query: `历史查询 ${i}`,
          websites: ['test-site'],
          resultCount: 10,
          searchTime: 1000
        });
      }

      const result = await runBenchmark(
        '搜索建议生成',
        async () => {
          userConfigService.getSearchSuggestions('历史');
        },
        1000
      );

      // 性能要求：搜索建议生成应该快速
      expect(result.avgTime).toBeLessThan(5);
      expect(result.throughput).toBeGreaterThan(200);
    });
  });

  describe('资源池性能基准测试', () => {
    beforeAll(() => {
      // 创建测试资源池
      resourcePoolManager.createPool(
        'benchmark-pool',
        '基准测试资源池',
        {
          maxSize: 10,
          minSize: 2,
          factory: async () => ({ 
            id: Math.random().toString(),
            created: Date.now()
          }),
          validator: async (resource) => !!resource.id,
          destroyer: async (resource) => { /* cleanup */ }
        }
      );

      // 创建并发限制器
      resourcePoolManager.createConcurrencyLimiter(
        'benchmark-limiter',
        '基准测试限制器',
        5
      );
    });

    test('资源获取和释放性能', async () => {
      const result = await runBenchmark(
        '资源获取和释放',
        async () => {
          const resource = await resourcePoolManager.acquireResource('benchmark-pool');
          await resourcePoolManager.releaseResource('benchmark-pool', 'test-resource');
        },
        500
      );

      // 性能要求：资源操作应该快速
      expect(result.avgTime).toBeLessThan(20);
      expect(result.throughput).toBeGreaterThan(50);
    });

    test('并发限制器性能', async () => {
      const result = await runBenchmark(
        '并发限制执行',
        async () => {
          await resourcePoolManager.executeWithLimit('benchmark-limiter', async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return Math.random();
          });
        },
        200
      );

      // 性能要求：并发限制应该有合理的开销
      expect(result.avgTime).toBeLessThan(50);
      expect(result.throughput).toBeGreaterThan(20);
    });
  });

  describe('系统整体性能测试', () => {
    test('端到端工作流性能', async () => {
      const mockResults = Array.from({ length: 20 }, (_, i) => ({
        id: `e2e-${i}`,
        title: `端到端测试素材 ${i}`,
        sourceWebsite: '测试网站',
        sourceUrl: `https://test.com/e2e-${i}`,
        previewImages: [{ url: `https://test.com/img${i}.jpg`, alt: `预览图${i}` }],
        pricing: { isFree: i % 2 === 0, price: i % 2 === 0 ? undefined : i * 10 },
        fileInfo: { format: 'max', size: `${i + 5}MB` },
        statistics: { downloadCount: i * 50 },
        categorization: { tags: ['端到端', '测试'] },
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'e2e-rule',
          status: 'success' as const,
          confidence: 0.9,
          missingFields: [],
          processingTime: 1000 + i * 100
        },
        quality: {
          score: 80 + i,
          factors: { completeness: 85, imageQuality: 80, dataAccuracy: 85 }
        }
      }));

      const result = await runBenchmark(
        '端到端工作流',
        async () => {
          // 1. 数据质量处理
          const qualityResult = dataQualityManager.batchProcessQuality(mockResults);
          
          // 2. 缓存结果
          await smartCacheService.cacheSearchResults(
            `e2e-test-${Math.random()}`,
            ['test-site'],
            qualityResult.processed,
            2000
          );
          
          // 3. 添加搜索历史
          userConfigService.addSearchHistory({
            query: `e2e-test-${Math.random()}`,
            websites: ['test-site'],
            resultCount: qualityResult.processed.length,
            searchTime: 2000
          });
        },
        50 // 较少的迭代次数，因为是完整工作流
      );

      // 性能要求：端到端工作流应在合理时间内完成
      expect(result.avgTime).toBeLessThan(100);
      expect(result.throughput).toBeGreaterThan(10);
      
      console.log(`🎯 端到端工作流性能: ${result.avgTime.toFixed(2)}ms 平均时间`);
    });

    test('内存使用监控', async () => {
      const initialMetrics = performanceOptimizer.getMetrics();
      const initialMemory = initialMetrics.memory.usage;
      
      // 执行一些内存密集型操作
      const largeDataSets = Array.from({ length: 100 }, (_, i) => 
        Array.from({ length: 1000 }, (_, j) => ({
          id: `memory-test-${i}-${j}`,
          data: 'x'.repeat(100)
        }))
      );

      // 缓存大量数据
      for (let i = 0; i < largeDataSets.length; i++) {
        await smartCacheService.set('memory-test', `dataset-${i}`, largeDataSets[i]);
      }

      // 等待一段时间让监控收集数据
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalMetrics = performanceOptimizer.getMetrics();
      const finalMemory = finalMetrics.memory.usage;
      
      console.log(`📊 内存使用变化: ${initialMemory.toFixed(1)}% -> ${finalMemory.toFixed(1)}%`);
      
      // 清理测试数据
      await smartCacheService.clearByTags(['memory-test']);
      
      // 内存使用应该在合理范围内
      expect(finalMemory).toBeLessThan(90); // 不应超过90%
    });
  });

  describe('性能回归测试', () => {
    test('性能基线验证', async () => {
      const benchmarks = [
        {
          name: '缓存写入',
          test: async () => {
            await smartCacheService.set('baseline', `key-${Math.random()}`, { test: true });
          },
          expectedMaxTime: 5
        },
        {
          name: '缓存读取',
          test: async () => {
            await smartCacheService.get('baseline', 'test-key');
          },
          expectedMaxTime: 2
        },
        {
          name: '配置读取',
          test: async () => {
            userConfigService.getConfig();
          },
          expectedMaxTime: 1
        },
        {
          name: '质量评估',
          test: async () => {
            const testResult = {
              id: 'baseline-test',
              title: '基线测试',
              sourceWebsite: '测试',
              sourceUrl: 'https://test.com',
              previewImages: [],
              pricing: { isFree: true },
              fileInfo: {},
              statistics: {},
              categorization: { tags: [] },
              timestamps: { extractedAt: new Date() },
              extraction: {
                ruleId: 'test',
                status: 'success' as const,
                confidence: 0.9,
                missingFields: [],
                processingTime: 1000
              },
              quality: {
                score: 85,
                factors: { completeness: 90, imageQuality: 80, dataAccuracy: 85 }
              }
            };
            dataQualityManager.assessQuality(testResult);
          },
          expectedMaxTime: 5
        }
      ];

      for (const benchmark of benchmarks) {
        const result = await runBenchmark(benchmark.name, benchmark.test, 100);
        
        // 验证性能没有回归
        expect(result.avgTime).toBeLessThan(benchmark.expectedMaxTime);
        
        console.log(`✅ ${benchmark.name} 性能基线验证通过: ${result.avgTime.toFixed(2)}ms (< ${benchmark.expectedMaxTime}ms)`);
      }
    });
  });
});