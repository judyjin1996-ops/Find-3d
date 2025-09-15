/**
 * 质量保证测试套件
 * 验证系统的数据准确性、稳定性和用户体验
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { smartCacheService } from '../../services/smartCacheService';
import { userConfigService } from '../../services/userConfigService';
import { systemHealthMonitor } from '../../services/systemHealthMonitor';
import { dataQualityManager } from '../../utils/dataQualityManager';
import type { ExtractedMaterialResult } from '../../crawler/types/crawler';

describe('质量保证测试套件', () => {
  beforeAll(async () => {
    await smartCacheService.initialize();
    systemHealthMonitor.startMonitoring(5000);
    console.log('🔍 质量保证测试环境初始化完成');
  });

  afterAll(async () => {
    await smartCacheService.cleanup();
    systemHealthMonitor.stopMonitoring();
    console.log('🧹 质量保证测试环境清理完成');
  });

  describe('数据准确性测试', () => {
    test('应该正确提取和验证素材信息', () => {
      const testResult: ExtractedMaterialResult = {
        id: 'accuracy-test-1',
        title: '准确性测试素材',
        description: '这是一个用于测试数据准确性的3D素材',
        sourceWebsite: '魔顿网',
        sourceUrl: 'https://www.modown.cn/archives/123456.html',
        previewImages: [
          { url: 'https://www.modown.cn/preview1.jpg', alt: '主预览图' },
          { url: 'https://www.modown.cn/preview2.jpg', alt: '侧视图' }
        ],
        pricing: {
          isFree: false,
          price: 29.99,
          currency: 'CNY',
          originalPrice: 39.99
        },
        fileInfo: {
          format: '3ds Max',
          size: '15.6MB',
          sizeBytes: 15600000
        },
        statistics: {
          downloadCount: 1250,
          viewCount: 5600,
          rating: 4.7,
          reviewCount: 23
        },
        categorization: {
          category: '建筑模型',
          subcategory: '住宅建筑',
          tags: ['现代', '别墅', '建筑', '住宅'],
          keywords: ['modern', 'villa', 'architecture']
        },
        author: {
          name: '设计师张三',
          profileUrl: 'https://www.modown.cn/user/zhangsan'
        },
        timestamps: {
          uploadDate: new Date('2024-01-15'),
          lastUpdated: new Date('2024-02-01'),
          extractedAt: new Date()
        },
        extraction: {
          ruleId: 'modown-rule-v1',
          status: 'success',
          confidence: 0.95,
          missingFields: [],
          processingTime: 1200
        },
        quality: {
          score: 92,
          factors: {
            completeness: 95,
            imageQuality: 90,
            dataAccuracy: 91
          }
        }
      };

      // 验证数据结构完整性
      expect(testResult.id).toBeTruthy();
      expect(testResult.title).toBeTruthy();
      expect(testResult.sourceUrl).toMatch(/^https?:\/\//);
      expect(testResult.previewImages.length).toBeGreaterThan(0);
      expect(testResult.extraction.confidence).toBeGreaterThanOrEqual(0);
      expect(testResult.extraction.confidence).toBeLessThanOrEqual(1);
      expect(testResult.quality.score).toBeGreaterThanOrEqual(0);
      expect(testResult.quality.score).toBeLessThanOrEqual(100);

      // 验证价格逻辑
      if (!testResult.pricing.isFree) {
        expect(testResult.pricing.price).toBeGreaterThan(0);
        expect(testResult.pricing.currency).toBeTruthy();
      }

      // 验证时间逻辑
      if (testResult.timestamps.uploadDate && testResult.timestamps.lastUpdated) {
        expect(testResult.timestamps.lastUpdated.getTime())
          .toBeGreaterThanOrEqual(testResult.timestamps.uploadDate.getTime());
      }

      // 验证统计数据
      if (testResult.statistics.rating) {
        expect(testResult.statistics.rating).toBeGreaterThanOrEqual(0);
        expect(testResult.statistics.rating).toBeLessThanOrEqual(5);
      }
    });

    test('应该正确处理不完整的数据', () => {
      const incompleteResult: ExtractedMaterialResult = {
        id: 'incomplete-test',
        title: '不完整数据测试',
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/incomplete',
        previewImages: [], // 缺少预览图
        pricing: { isFree: false }, // 缺少价格信息
        fileInfo: {}, // 缺少文件信息
        statistics: {}, // 缺少统计信息
        categorization: { tags: [] }, // 缺少标签
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'test-rule',
          status: 'partial', // 部分成功
          confidence: 0.6,
          missingFields: ['previewImages', 'price', 'fileFormat'],
          processingTime: 800
        },
        quality: {
          score: 45, // 低质量分数
          factors: { completeness: 40, imageQuality: 30, dataAccuracy: 65 }
        }
      };

      // 评估数据质量
      const quality = dataQualityManager.assessQuality(incompleteResult);
      
      // 不完整数据的质量分数应该较低
      expect(quality.overall).toBeLessThan(70);
      expect(quality.completeness).toBeLessThan(60);
      
      // 清理数据应该能够改善质量
      const cleaningResult = dataQualityManager.cleanData(incompleteResult);
      expect(cleaningResult.qualityImprovement).toBeGreaterThanOrEqual(0);
    });

    test('应该正确处理异常数据', () => {
      const anomalousResult: ExtractedMaterialResult = {
        id: 'anomaly-test',
        title: '', // 空标题
        sourceWebsite: '测试网站',
        sourceUrl: 'invalid-url', // 无效URL
        previewImages: [
          { url: 'invalid-image-url', alt: '无效图片' }
        ],
        pricing: {
          isFree: true,
          price: 100 // 逻辑矛盾：免费但有价格
        },
        fileInfo: {
          format: 'unknown',
          size: '-5MB' // 无效大小
        },
        statistics: {
          downloadCount: -10, // 负数下载量
          rating: 6.5 // 超出范围的评分
        },
        categorization: { tags: [''] }, // 空标签
        timestamps: {
          uploadDate: new Date('2025-01-01'), // 未来日期
          lastUpdated: new Date('2024-01-01'), // 更新时间早于上传时间
          extractedAt: new Date()
        },
        extraction: {
          ruleId: 'test-rule',
          status: 'failed',
          confidence: 1.5, // 超出范围
          missingFields: [],
          processingTime: -100 // 负数处理时间
        },
        quality: {
          score: 150, // 超出范围
          factors: { completeness: 0, imageQuality: 0, dataAccuracy: 0 }
        }
      };

      // 数据清理应该能够处理异常数据
      const cleaningResult = dataQualityManager.cleanData(anomalousResult);
      
      // 验证清理后的数据
      expect(cleaningResult.cleaned.title).toBeTruthy(); // 应该有标题
      expect(cleaningResult.cleaned.pricing.isFree).toBe(true); // 价格逻辑应该修正
      expect(cleaningResult.cleaned.categorization.tags).not.toContain(''); // 不应包含空标签
      expect(cleaningResult.changes.length).toBeGreaterThan(0); // 应该有变更记录
    });
  });

  describe('系统稳定性测试', () => {
    test('应该能够处理高并发操作', async () => {
      const concurrentOperations = 100;
      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        // 混合不同类型的操作
        const operationType = i % 4;
        
        switch (operationType) {
          case 0:
            // 缓存操作
            await smartCacheService.set('stress-test', `key-${i}`, { data: i });
            return smartCacheService.get('stress-test', `key-${i}`);
          
          case 1:
            // 配置操作
            const config = userConfigService.getConfig();
            userConfigService.updateConfig({
              display: { ...config.display, resultsPerPage: 10 + (i % 50) }
            });
            return userConfigService.getConfig();
          
          case 2:
            // 搜索历史操作
            userConfigService.addSearchHistory({
              query: `并发测试 ${i}`,
              websites: ['test-site'],
              resultCount: i % 20,
              searchTime: 1000 + (i % 1000)
            });
            return userConfigService.getSearchHistory();
          
          case 3:
            // 数据质量操作
            const testResult = {
              id: `concurrent-${i}`,
              title: `并发测试素材 ${i}`,
              sourceWebsite: '测试网站',
              sourceUrl: `https://test.com/${i}`,
              previewImages: [],
              pricing: { isFree: i % 2 === 0 },
              fileInfo: {},
              statistics: {},
              categorization: { tags: [`tag-${i}`] },
              timestamps: { extractedAt: new Date() },
              extraction: {
                ruleId: 'concurrent-rule',
                status: 'success' as const,
                confidence: 0.8,
                missingFields: [],
                processingTime: 1000
              },
              quality: {
                score: 75,
                factors: { completeness: 80, imageQuality: 70, dataAccuracy: 75 }
              }
            };
            return dataQualityManager.assessQuality(testResult);
          
          default:
            return Promise.resolve(null);
        }
      });

      // 执行所有并发操作
      const startTime = Date.now();
      const results = await Promise.allSettled(operations);
      const endTime = Date.now();

      // 验证结果
      const successfulOperations = results.filter(r => r.status === 'fulfilled').length;
      const failedOperations = results.filter(r => r.status === 'rejected').length;
      
      console.log(`🚀 并发操作结果: ${successfulOperations} 成功, ${failedOperations} 失败, 耗时: ${endTime - startTime}ms`);
      
      // 大部分操作应该成功
      expect(successfulOperations / concurrentOperations).toBeGreaterThan(0.9);
      
      // 系统应该仍然健康
      const health = await systemHealthMonitor.performHealthCheck();
      expect(health.overall).not.toBe('critical');
    });

    test('应该能够从错误中恢复', async () => {
      // 模拟一系列错误
      const errors = [
        { type: 'NETWORK_ERROR' as const, message: '网络错误1' },
        { type: 'TIMEOUT_ERROR' as const, message: '超时错误1' },
        { type: 'PARSE_ERROR' as const, message: '解析错误1' },
        { type: 'BLOCKED_BY_WEBSITE' as const, message: '被网站阻止1' }
      ];

      for (const errorData of errors) {
        const error = {
          ...errorData,
          timestamp: new Date(),
          websiteId: 'recovery-test',
          severity: 'medium' as const,
          recoverable: true
        };

        systemHealthMonitor.recordError(error);
      }

      // 等待系统处理错误
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 验证系统仍然可以正常工作
      await smartCacheService.set('recovery-test', 'test-key', { recovered: true });
      const result = await smartCacheService.get('recovery-test', 'test-key');
      expect(result).toEqual({ recovered: true });

      // 验证错误被正确记录
      const metrics = systemHealthMonitor.getMetrics();
      expect(metrics.errorStats.totalErrors).toBeGreaterThanOrEqual(errors.length);
    });

    test('应该能够处理内存压力', async () => {
      const initialHealth = await systemHealthMonitor.performHealthCheck();
      const initialMemoryScore = initialHealth.components.memory.score;

      // 创建内存压力
      const largeDataItems = Array.from({ length: 500 }, (_, i) => ({
        id: `memory-pressure-${i}`,
        data: Array.from({ length: 1000 }, () => Math.random().toString(36)).join('')
      }));

      // 缓存大量数据
      for (let i = 0; i < largeDataItems.length; i++) {
        try {
          await smartCacheService.set('memory-pressure', `item-${i}`, largeDataItems[i]);
        } catch (error) {
          // 预期可能会有内存限制错误
          console.log(`内存压力测试在第 ${i} 项时遇到限制`);
          break;
        }
      }

      // 等待系统响应
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 验证系统仍然响应
      const finalHealth = await systemHealthMonitor.performHealthCheck();
      expect(finalHealth).toBeTruthy();

      // 系统应该能够检测到内存压力
      if (finalHealth.components.memory.score < initialMemoryScore) {
        console.log(`✅ 系统正确检测到内存压力: ${initialMemoryScore} -> ${finalHealth.components.memory.score}`);
      }

      // 清理测试数据
      await smartCacheService.clearByTags(['memory-pressure']);
      
      // 等待内存恢复
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 验证内存恢复
      const recoveredHealth = await systemHealthMonitor.performHealthCheck();
      expect(recoveredHealth.components.memory.score).toBeGreaterThanOrEqual(initialMemoryScore * 0.8);
    });
  });

  describe('用户体验质量测试', () => {
    test('配置更改应该立即生效', () => {
      const originalConfig = userConfigService.getConfig();
      
      // 更改显示配置
      userConfigService.updateConfig({
        display: {
          ...originalConfig.display,
          cardStyle: 'detailed',
          resultsPerPage: 25,
          sortBy: 'price'
        }
      });

      // 验证更改立即生效
      const updatedConfig = userConfigService.getConfig();
      expect(updatedConfig.display.cardStyle).toBe('detailed');
      expect(updatedConfig.display.resultsPerPage).toBe(25);
      expect(updatedConfig.display.sortBy).toBe('price');
    });

    test('搜索建议应该相关且有用', () => {
      // 添加一些有意义的搜索历史
      const searchQueries = [
        '现代建筑模型',
        '现代家具设计',
        '建筑外观渲染',
        '室内设计素材',
        '汽车模型下载'
      ];

      searchQueries.forEach((query, index) => {
        userConfigService.addSearchHistory({
          query,
          websites: ['test-site'],
          resultCount: 10 + index * 5,
          searchTime: 1500 + index * 200
        });
      });

      // 测试相关搜索建议
      const suggestions1 = userConfigService.getSearchSuggestions('现代');
      expect(suggestions1.length).toBeGreaterThan(0);
      expect(suggestions1.some(s => s.includes('现代'))).toBe(true);

      const suggestions2 = userConfigService.getSearchSuggestions('建筑');
      expect(suggestions2.length).toBeGreaterThan(0);
      expect(suggestions2.some(s => s.includes('建筑'))).toBe(true);

      const suggestions3 = userConfigService.getSearchSuggestions('xyz不存在');
      expect(suggestions3.length).toBe(0);
    });

    test('数据显示应该符合用户配置', () => {
      const config = userConfigService.getConfig();
      const displayFields = userConfigService.getDisplayFields();

      // 验证显示字段配置
      expect(displayFields.length).toBeGreaterThan(0);
      
      // 验证字段排序
      const orders = displayFields.map(f => f.order);
      const sortedOrders = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sortedOrders);

      // 验证可见字段
      const visibleFields = displayFields.filter(f => f.visible);
      expect(visibleFields.length).toBeGreaterThan(0);
      expect(visibleFields.length).toBeLessThanOrEqual(displayFields.length);
    });
  });

  describe('数据一致性测试', () => {
    test('缓存数据应该与原始数据一致', async () => {
      const originalData = {
        query: '一致性测试',
        websites: ['site1', 'site2'],
        results: [
          {
            id: 'consistency-1',
            title: '一致性测试素材',
            sourceWebsite: '测试网站',
            sourceUrl: 'https://test.com/consistency',
            previewImages: [],
            pricing: { isFree: true },
            fileInfo: {},
            statistics: {},
            categorization: { tags: ['一致性'] },
            timestamps: { extractedAt: new Date() },
            extraction: {
              ruleId: 'consistency-rule',
              status: 'success' as const,
              confidence: 0.9,
              missingFields: [],
              processingTime: 1000
            },
            quality: {
              score: 85,
              factors: { completeness: 90, imageQuality: 80, dataAccuracy: 85 }
            }
          }
        ],
        totalCount: 1,
        searchTime: 2000
      };

      // 缓存数据
      await smartCacheService.cacheSearchResults(
        originalData.query,
        originalData.websites,
        originalData.results,
        originalData.searchTime
      );

      // 获取缓存数据
      const cachedData = await smartCacheService.getCachedSearchResults(
        originalData.query,
        originalData.websites
      );

      // 验证数据一致性
      expect(cachedData).toBeTruthy();
      expect(cachedData!.query).toBe(originalData.query);
      expect(cachedData!.websites).toEqual(originalData.websites);
      expect(cachedData!.searchTime).toBe(originalData.searchTime);
      expect(cachedData!.results[0].title).toBe(originalData.results[0].title);
      expect(cachedData!.results[0].id).toBe(originalData.results[0].id);
    });

    test('用户配置应该持久化', () => {
      const testConfig = {
        display: {
          cardStyle: 'compact' as const,
          resultsPerPage: 15,
          sortBy: 'downloads' as const,
          sortOrder: 'asc' as const
        }
      };

      // 更新配置
      userConfigService.updateConfig(testConfig);

      // 模拟页面刷新（重新创建服务实例）
      const newConfigService = new (userConfigService.constructor as any)();
      const persistedConfig = newConfigService.getConfig();

      // 验证配置持久化
      expect(persistedConfig.display.cardStyle).toBe(testConfig.display.cardStyle);
      expect(persistedConfig.display.resultsPerPage).toBe(testConfig.display.resultsPerPage);
      expect(persistedConfig.display.sortBy).toBe(testConfig.display.sortBy);
      expect(persistedConfig.display.sortOrder).toBe(testConfig.display.sortOrder);
    });
  });

  describe('边界条件测试', () => {
    test('应该正确处理空数据', async () => {
      // 测试空搜索结果
      await smartCacheService.cacheSearchResults('空测试', [], [], 1000);
      const emptyResults = await smartCacheService.getCachedSearchResults('空测试', []);
      
      expect(emptyResults).toBeTruthy();
      expect(emptyResults!.results).toHaveLength(0);
      expect(emptyResults!.totalCount).toBe(0);

      // 测试空搜索历史
      userConfigService.clearSearchHistory();
      const emptyHistory = userConfigService.getSearchHistory();
      expect(emptyHistory).toHaveLength(0);

      // 测试空搜索建议
      const emptySuggestions = userConfigService.getSearchSuggestions('不存在的查询');
      expect(emptySuggestions).toHaveLength(0);
    });

    test('应该正确处理极大数据量', async () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `large-${i}`,
        title: `大数据集测试 ${i}`,
        sourceWebsite: '测试网站',
        sourceUrl: `https://test.com/large-${i}`,
        previewImages: [],
        pricing: { isFree: i % 2 === 0 },
        fileInfo: {},
        statistics: { downloadCount: i },
        categorization: { tags: [`tag-${i % 10}`] },
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'large-rule',
          status: 'success' as const,
          confidence: 0.8,
          missingFields: [],
          processingTime: 1000
        },
        quality: {
          score: 75,
          factors: { completeness: 80, imageQuality: 70, dataAccuracy: 75 }
        }
      }));

      // 测试批量质量处理
      const startTime = Date.now();
      const qualityResult = dataQualityManager.batchProcessQuality(largeDataSet);
      const processingTime = Date.now() - startTime;

      expect(qualityResult.processed.length).toBeLessThanOrEqual(largeDataSet.length);
      expect(processingTime).toBeLessThan(10000); // 应在10秒内完成
      
      console.log(`📊 处理 ${largeDataSet.length} 项数据耗时: ${processingTime}ms`);
    });

    test('应该正确处理无效输入', async () => {
      // 测试无效缓存键
      await expect(smartCacheService.get('test', null as any)).resolves.toBeNull();
      await expect(smartCacheService.get('test', undefined as any)).resolves.toBeNull();

      // 测试无效配置更新
      expect(() => {
        userConfigService.updateConfig(null as any);
      }).not.toThrow();

      // 测试无效搜索历史
      expect(() => {
        userConfigService.addSearchHistory({
          query: '',
          websites: [],
          resultCount: -1,
          searchTime: -1000
        });
      }).not.toThrow();
    });
  });

  describe('性能回归测试', () => {
    test('关键操作性能不应退化', async () => {
      const performanceBaselines = {
        cacheWrite: 5, // ms
        cacheRead: 2, // ms
        configRead: 1, // ms
        qualityAssessment: 5, // ms
        duplicateDetection: 10 // ms
      };

      // 缓存写入性能
      const writeStart = Date.now();
      await smartCacheService.set('perf-test', 'write-test', { test: true });
      const writeTime = Date.now() - writeStart;
      expect(writeTime).toBeLessThan(performanceBaselines.cacheWrite);

      // 缓存读取性能
      const readStart = Date.now();
      await smartCacheService.get('perf-test', 'write-test');
      const readTime = Date.now() - readStart;
      expect(readTime).toBeLessThan(performanceBaselines.cacheRead);

      // 配置读取性能
      const configStart = Date.now();
      userConfigService.getConfig();
      const configTime = Date.now() - configStart;
      expect(configTime).toBeLessThan(performanceBaselines.configRead);

      console.log(`⚡ 性能测试结果: 写入${writeTime}ms, 读取${readTime}ms, 配置${configTime}ms`);
    });
  });
});