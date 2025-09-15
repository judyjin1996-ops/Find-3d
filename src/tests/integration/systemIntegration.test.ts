/**
 * 系统集成测试
 * 测试整个系统的端到端功能
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { smartCacheService } from '../../services/smartCacheService';
import { userConfigService } from '../../services/userConfigService';
import { systemHealthMonitor } from '../../services/systemHealthMonitor';
import { errorRecoveryService } from '../../services/errorRecoveryService';
import { performanceOptimizer } from '../../services/performanceOptimizer';
import { resourcePoolManager } from '../../services/resourcePoolManager';
import { proxyManager } from '../../crawler/utils/proxyManager';
import { rateLimiter } from '../../crawler/utils/rateLimiter';
import { dataQualityManager } from '../../utils/dataQualityManager';
import type { ExtractedMaterialResult } from '../../crawler/types/crawler';

describe('系统集成测试', () => {
  beforeAll(async () => {
    // 初始化所有服务
    await smartCacheService.initialize();
    systemHealthMonitor.startMonitoring(1000); // 1秒间隔用于测试
    performanceOptimizer.startMonitoring(1000);
    
    console.log('🧪 系统集成测试环境初始化完成');
  });

  afterAll(async () => {
    // 清理所有服务
    await smartCacheService.cleanup();
    systemHealthMonitor.stopMonitoring();
    performanceOptimizer.stopMonitoring();
    await resourcePoolManager.cleanup();
    proxyManager.cleanup();
    rateLimiter.cleanup();
    errorRecoveryService.cleanup();
    
    console.log('🧹 系统集成测试环境清理完成');
  });

  beforeEach(() => {
    // 每个测试前重置状态
    rateLimiter.resetAll();
  });

  describe('缓存系统集成测试', () => {
    test('应该能够缓存和检索搜索结果', async () => {
      const mockResults: ExtractedMaterialResult[] = [
        {
          id: 'test-1',
          title: '测试素材1',
          sourceWebsite: '测试网站',
          sourceUrl: 'https://test.com/1',
          previewImages: [{ url: 'https://test.com/img1.jpg', alt: '预览图1' }],
          pricing: { isFree: true },
          fileInfo: { format: 'max' },
          statistics: { downloadCount: 100 },
          categorization: { tags: ['测试'] },
          timestamps: { extractedAt: new Date() },
          extraction: {
            ruleId: 'test-rule',
            status: 'success',
            confidence: 0.9,
            missingFields: [],
            processingTime: 1000
          },
          quality: {
            score: 85,
            factors: { completeness: 90, imageQuality: 80, dataAccuracy: 85 }
          }
        }
      ];

      // 缓存搜索结果
      await smartCacheService.cacheSearchResults(
        '测试查询',
        ['test-website'],
        mockResults,
        2000
      );

      // 检索缓存的结果
      const cachedResults = await smartCacheService.getCachedSearchResults(
        '测试查询',
        ['test-website']
      );

      expect(cachedResults).toBeTruthy();
      expect(cachedResults!.results).toHaveLength(1);
      expect(cachedResults!.results[0].title).toBe('测试素材1');
      expect(cachedResults!.searchTime).toBe(2000);
    });

    test('应该能够处理缓存过期', async () => {
      // 使用很短的TTL进行测试
      await smartCacheService.set('test', 'expire-test', 'test-data', { ttl: 100 });
      
      // 立即获取应该成功
      let result = await smartCacheService.get('test', 'expire-test');
      expect(result).toBe('test-data');
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 过期后获取应该返回null
      result = await smartCacheService.get('test', 'expire-test');
      expect(result).toBeNull();
    });
  });

  describe('用户配置系统集成测试', () => {
    test('应该能够保存和加载用户配置', () => {
      const originalConfig = userConfigService.getConfig();
      
      // 修改配置
      userConfigService.updateConfig({
        display: {
          ...originalConfig.display,
          cardStyle: 'detailed',
          resultsPerPage: 50
        }
      });

      // 验证配置已更新
      const updatedConfig = userConfigService.getConfig();
      expect(updatedConfig.display.cardStyle).toBe('detailed');
      expect(updatedConfig.display.resultsPerPage).toBe(50);
    });

    test('应该能够管理搜索历史', () => {
      // 清除现有历史
      userConfigService.clearSearchHistory();
      
      // 添加搜索历史
      userConfigService.addSearchHistory({
        query: '测试搜索',
        websites: ['test-site'],
        resultCount: 10,
        searchTime: 1500,
        filters: { category: '3D模型' }
      });

      // 验证历史记录
      const history = userConfigService.getSearchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe('测试搜索');
      expect(history[0].resultCount).toBe(10);
    });

    test('应该能够提供搜索建议', () => {
      // 添加一些搜索历史
      userConfigService.addSearchHistory({
        query: '手机模型',
        websites: ['test-site'],
        resultCount: 15,
        searchTime: 2000
      });

      userConfigService.addSearchHistory({
        query: '手机壳设计',
        websites: ['test-site'],
        resultCount: 8,
        searchTime: 1800
      });

      // 获取搜索建议
      const suggestions = userConfigService.getSearchSuggestions('手机');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('手机模型');
      expect(suggestions).toContain('手机壳设计');
    });
  });

  describe('系统健康监控集成测试', () => {
    test('应该能够监控系统健康状态', async () => {
      // 等待监控收集数据
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const health = await systemHealthMonitor.performHealthCheck();
      
      expect(health).toBeTruthy();
      expect(health.overall).toMatch(/healthy|warning|critical/);
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(health.components).toHaveProperty('memory');
      expect(health.components).toHaveProperty('network');
      expect(health.components).toHaveProperty('crawler');
      expect(health.components).toHaveProperty('cache');
      expect(health.components).toHaveProperty('storage');
    });

    test('应该能够记录和处理错误', () => {
      const testError = {
        type: 'NETWORK_ERROR' as const,
        message: '测试网络错误',
        timestamp: new Date(),
        websiteId: 'test-website',
        severity: 'medium' as const,
        recoverable: true
      };

      systemHealthMonitor.recordError(testError);
      
      const metrics = systemHealthMonitor.getMetrics();
      expect(metrics.errorStats.totalErrors).toBeGreaterThan(0);
      expect(metrics.errorStats.recentErrors).toContainEqual(
        expect.objectContaining({
          type: 'NETWORK_ERROR',
          message: '测试网络错误'
        })
      );
    });
  });

  describe('错误恢复系统集成测试', () => {
    test('应该能够尝试错误恢复', async () => {
      const testError = {
        type: 'NETWORK_ERROR' as const,
        message: '网络连接失败',
        timestamp: new Date(),
        websiteId: 'test-website',
        severity: 'medium' as const,
        recoverable: true
      };

      const context = {
        websiteId: 'test-website',
        retryCount: 0,
        previousStrategies: [],
        errorHistory: [testError]
      };

      const result = await errorRecoveryService.attemptRecovery(testError, context);
      
      expect(result).toBeTruthy();
      expect(result.strategy).toBeTruthy();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.shouldRetry).toBe('boolean');
    });

    test('应该能够分析错误模式', () => {
      // 记录一些错误恢复尝试
      const stats = errorRecoveryService.getStats();
      const analysis = errorRecoveryService.analyzeErrorPatterns();
      
      expect(analysis).toHaveProperty('mostCommonErrors');
      expect(analysis).toHaveProperty('mostEffectiveStrategies');
      expect(analysis).toHaveProperty('recommendations');
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
  });

  describe('性能优化系统集成测试', () => {
    test('应该能够监控性能指标', async () => {
      // 等待性能监控收集数据
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const metrics = performanceOptimizer.getMetrics();
      
      expect(metrics).toHaveProperty('crawler');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('cache');
      expect(metrics).toHaveProperty('rendering');
      
      expect(typeof metrics.memory.usage).toBe('number');
      expect(typeof metrics.rendering.fps).toBe('number');
    });

    test('应该能够生成优化建议', () => {
      const suggestions = performanceOptimizer.generateOptimizationSuggestions();
      
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('implementation');
        expect(suggestion).toHaveProperty('estimatedGain');
      });
    });

    test('应该能够应用性能配置文件', () => {
      const profiles = performanceOptimizer.getPerformanceProfiles();
      expect(profiles.length).toBeGreaterThan(0);
      
      const balancedProfile = profiles.find(p => p.name === 'balanced');
      expect(balancedProfile).toBeTruthy();
      
      const result = performanceOptimizer.applyPerformanceProfile('balanced');
      expect(result).toBe(true);
    });
  });

  describe('资源池管理集成测试', () => {
    test('应该能够创建和管理资源池', async () => {
      // 创建测试资源池
      resourcePoolManager.createPool(
        'test-pool',
        '测试资源池',
        {
          maxSize: 3,
          minSize: 1,
          factory: async () => ({ id: Math.random().toString() }),
          validator: async (resource) => !!resource.id,
          destroyer: async (resource) => { /* cleanup */ }
        }
      );

      // 获取资源
      const resource1 = await resourcePoolManager.acquireResource('test-pool');
      expect(resource1).toBeTruthy();
      expect(resource1.id).toBeTruthy();

      // 释放资源
      await resourcePoolManager.releaseResource('test-pool', 'test-resource-1');

      // 获取统计信息
      const stats = resourcePoolManager.getPoolStats('test-pool');
      expect(stats).toBeTruthy();
      expect(stats!.totalCreated).toBeGreaterThan(0);
    });

    test('应该能够创建和使用并发限制器', async () => {
      resourcePoolManager.createConcurrencyLimiter('test-limiter', '测试限制器', 2);

      const results: number[] = [];
      const tasks = Array.from({ length: 5 }, (_, i) =>
        resourcePoolManager.executeWithLimit('test-limiter', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          results.push(i);
          return i;
        })
      );

      const taskResults = await Promise.all(tasks);
      expect(taskResults).toHaveLength(5);
      expect(results).toHaveLength(5);

      const stats = resourcePoolManager.getLimiterStats('test-limiter');
      expect(stats).toBeTruthy();
      expect(stats!.totalExecuted).toBe(5);
    });
  });

  describe('数据质量管理集成测试', () => {
    test('应该能够检测重复数据', () => {
      const result1: ExtractedMaterialResult = {
        id: 'test-1',
        title: '重复测试素材',
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/duplicate',
        previewImages: [],
        pricing: { isFree: true },
        fileInfo: {},
        statistics: {},
        categorization: { tags: [] },
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'test-rule',
          status: 'success',
          confidence: 0.9,
          missingFields: [],
          processingTime: 1000
        },
        quality: {
          score: 85,
          factors: { completeness: 90, imageQuality: 80, dataAccuracy: 85 }
        }
      };

      const result2: ExtractedMaterialResult = {
        ...result1,
        id: 'test-2'
      };

      const duplicateCheck = dataQualityManager.detectDuplicates(result2, [result1]);
      
      expect(duplicateCheck.isDuplicate).toBe(true);
      expect(duplicateCheck.similarity).toBeGreaterThan(0.8);
      expect(duplicateCheck.duplicateId).toBe('test-1');
    });

    test('应该能够评估数据质量', () => {
      const testResult: ExtractedMaterialResult = {
        id: 'quality-test',
        title: '质量测试素材',
        description: '这是一个用于测试数据质量的素材',
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/quality',
        previewImages: [{ url: 'https://test.com/preview.jpg', alt: '预览图' }],
        pricing: { isFree: false, price: 29.99, currency: 'CNY' },
        fileInfo: { format: 'max', size: '15MB' },
        statistics: { downloadCount: 500, rating: 4.5 },
        categorization: { tags: ['测试', '质量', '3D模型'] },
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'test-rule',
          status: 'success',
          confidence: 0.95,
          missingFields: [],
          processingTime: 800
        },
        quality: {
          score: 90,
          factors: { completeness: 95, imageQuality: 85, dataAccuracy: 90 }
        }
      };

      const quality = dataQualityManager.assessQuality(testResult);
      
      expect(quality.overall).toBeGreaterThan(80);
      expect(quality.completeness).toBeGreaterThan(80);
      expect(quality.accuracy).toBeGreaterThan(80);
      expect(quality.consistency).toBeGreaterThan(80);
    });

    test('应该能够清理和优化数据', () => {
      const dirtyResult: ExtractedMaterialResult = {
        id: 'dirty-test',
        title: '  <b>脏数据测试</b>  ',
        description: '<p>包含HTML标签的描述&nbsp;&amp;特殊字符</p>',
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/dirty',
        previewImages: [],
        pricing: { isFree: false, price: 0 }, // 逻辑矛盾
        fileInfo: {},
        statistics: {},
        categorization: { tags: ['重复', '重复', '测试', ''] }, // 包含重复和空标签
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'test-rule',
          status: 'success',
          confidence: 0.7,
          missingFields: [],
          processingTime: 1200
        },
        quality: {
          score: 60,
          factors: { completeness: 70, imageQuality: 50, dataAccuracy: 60 }
        }
      };

      const cleaningResult = dataQualityManager.cleanData(dirtyResult);
      
      expect(cleaningResult.cleaned.title).toBe('脏数据测试');
      expect(cleaningResult.cleaned.description).not.toContain('<');
      expect(cleaningResult.cleaned.pricing.isFree).toBe(true);
      expect(cleaningResult.cleaned.categorization.tags).not.toContain('');
      expect(cleaningResult.changes.length).toBeGreaterThan(0);
      expect(cleaningResult.qualityImprovement).toBeGreaterThanOrEqual(0);
    });
  });

  describe('端到端工作流测试', () => {
    test('完整的搜索-缓存-质量检查工作流', async () => {
      // 1. 模拟搜索结果
      const mockResults: ExtractedMaterialResult[] = [
        {
          id: 'workflow-1',
          title: '工作流测试素材1',
          sourceWebsite: '测试网站A',
          sourceUrl: 'https://test-a.com/1',
          previewImages: [{ url: 'https://test-a.com/img1.jpg', alt: '预览图1' }],
          pricing: { isFree: true },
          fileInfo: { format: 'max', size: '10MB' },
          statistics: { downloadCount: 200 },
          categorization: { tags: ['工作流', '测试'] },
          timestamps: { extractedAt: new Date() },
          extraction: {
            ruleId: 'test-rule-a',
            status: 'success',
            confidence: 0.9,
            missingFields: [],
            processingTime: 1500
          },
          quality: {
            score: 88,
            factors: { completeness: 90, imageQuality: 85, dataAccuracy: 90 }
          }
        },
        {
          id: 'workflow-2',
          title: '工作流测试素材2',
          sourceWebsite: '测试网站B',
          sourceUrl: 'https://test-b.com/2',
          previewImages: [{ url: 'https://test-b.com/img2.jpg', alt: '预览图2' }],
          pricing: { isFree: false, price: 19.99, currency: 'CNY' },
          fileInfo: { format: 'fbx', size: '25MB' },
          statistics: { downloadCount: 150, rating: 4.2 },
          categorization: { tags: ['工作流', '付费'] },
          timestamps: { extractedAt: new Date() },
          extraction: {
            ruleId: 'test-rule-b',
            status: 'success',
            confidence: 0.85,
            missingFields: [],
            processingTime: 1800
          },
          quality: {
            score: 82,
            factors: { completeness: 85, imageQuality: 80, dataAccuracy: 85 }
          }
        }
      ];

      // 2. 数据质量检查和清理
      const qualityResult = dataQualityManager.batchProcessQuality(mockResults);
      expect(qualityResult.processed.length).toBeLessThanOrEqual(mockResults.length);
      expect(qualityResult.duplicatesRemoved).toBeGreaterThanOrEqual(0);

      // 3. 缓存处理后的结果
      await smartCacheService.cacheSearchResults(
        '工作流测试',
        ['test-a', 'test-b'],
        qualityResult.processed,
        2500
      );

      // 4. 验证缓存
      const cachedResults = await smartCacheService.getCachedSearchResults(
        '工作流测试',
        ['test-a', 'test-b']
      );

      expect(cachedResults).toBeTruthy();
      expect(cachedResults!.results.length).toBe(qualityResult.processed.length);

      // 5. 记录用户搜索历史
      userConfigService.addSearchHistory({
        query: '工作流测试',
        websites: ['test-a', 'test-b'],
        resultCount: cachedResults!.results.length,
        searchTime: 2500
      });

      // 6. 验证搜索历史
      const history = userConfigService.getSearchHistory();
      const latestSearch = history[0];
      expect(latestSearch.query).toBe('工作流测试');
      expect(latestSearch.resultCount).toBe(cachedResults!.results.length);

      // 7. 更新性能指标
      performanceOptimizer.updateCrawlerMetrics({
        avgResponseTime: 2500,
        throughput: cachedResults!.results.length / 2.5,
        successRate: 100,
        errorRate: 0
      });

      // 8. 验证系统健康状态
      const health = await systemHealthMonitor.performHealthCheck();
      expect(health.overall).toMatch(/healthy|warning|critical/);
    });
  });

  describe('压力测试', () => {
    test('应该能够处理大量并发缓存操作', async () => {
      const concurrentOperations = 50;
      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        const testData = {
          id: `stress-test-${i}`,
          data: `测试数据 ${i}`,
          timestamp: new Date()
        };

        await smartCacheService.set('stress-test', `key-${i}`, testData);
        return smartCacheService.get('stress-test', `key-${i}`);
      });

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(concurrentOperations);
      results.forEach((result, i) => {
        expect(result).toBeTruthy();
        expect(result.id).toBe(`stress-test-${i}`);
      });
    });

    test('应该能够处理大量并发请求限制', async () => {
      resourcePoolManager.createConcurrencyLimiter('stress-limiter', '压力测试限制器', 5);

      const concurrentTasks = 100;
      const startTime = Date.now();
      
      const tasks = Array.from({ length: concurrentTasks }, (_, i) =>
        resourcePoolManager.executeWithLimit('stress-limiter', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return i;
        })
      );

      const results = await Promise.all(tasks);
      const endTime = Date.now();
      
      expect(results).toHaveLength(concurrentTasks);
      expect(results).toEqual(Array.from({ length: concurrentTasks }, (_, i) => i));
      
      // 验证并发限制生效（应该比无限制慢）
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThan(100); // 至少100ms，因为有并发限制
      
      const stats = resourcePoolManager.getLimiterStats('stress-limiter');
      expect(stats!.totalExecuted).toBe(concurrentTasks);
    });
  });

  describe('错误处理和恢复测试', () => {
    test('应该能够优雅处理各种错误情况', async () => {
      // 测试缓存错误处理
      const invalidKey = null as any;
      await expect(smartCacheService.get('test', invalidKey)).resolves.toBeNull();

      // 测试资源池错误处理
      await expect(
        resourcePoolManager.acquireResource('non-existent-pool')
      ).rejects.toThrow('资源池不存在');

      // 测试并发限制器错误处理
      await expect(
        resourcePoolManager.executeWithLimit('non-existent-limiter', async () => 'test')
      ).rejects.toThrow('并发限制器不存在');

      // 验证系统仍然健康
      const health = await systemHealthMonitor.performHealthCheck();
      expect(health).toBeTruthy();
    });

    test('应该能够从系统故障中恢复', async () => {
      // 模拟内存压力
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(1000)
      }));

      // 尝试缓存大量数据
      for (let i = 0; i < 100; i++) {
        try {
          await smartCacheService.set('memory-test', `large-${i}`, largeData);
        } catch (error) {
          // 预期可能会有内存错误
        }
      }

      // 验证系统仍然可以正常工作
      await smartCacheService.set('recovery-test', 'small-data', { test: true });
      const result = await smartCacheService.get('recovery-test', 'small-data');
      expect(result).toEqual({ test: true });

      // 清理测试数据
      await smartCacheService.clearByTags(['memory-test', 'recovery-test']);
    });
  });
});