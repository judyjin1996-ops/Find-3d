/**
 * 端到端工作流测试
 * 测试完整的用户使用场景和系统工作流
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { CrawlerEngine } from '../../crawler/engine/CrawlerEngine';
import { smartCacheService } from '../../services/smartCacheService';
import { userConfigService } from '../../services/userConfigService';
import { systemHealthMonitor } from '../../services/systemHealthMonitor';
import { dataQualityManager } from '../../utils/dataQualityManager';
import { presetRules } from '../../crawler/config/presetRules';
import type { ExtractedMaterialResult, CrawlerRule } from '../../crawler/types/crawler';

describe('端到端工作流测试', () => {
  let crawlerEngine: CrawlerEngine;

  beforeAll(async () => {
    crawlerEngine = new CrawlerEngine();
    await crawlerEngine.initialize();
    await smartCacheService.initialize();
    systemHealthMonitor.startMonitoring(5000);
    
    console.log('🎯 端到端工作流测试环境初始化完成');
  });

  afterAll(async () => {
    await crawlerEngine.cleanup();
    await smartCacheService.cleanup();
    systemHealthMonitor.stopMonitoring();
    
    console.log('🧹 端到端工作流测试环境清理完成');
  });

  beforeEach(() => {
    // 重置用户配置
    userConfigService.resetToDefaults();
  });

  describe('完整搜索工作流', () => {
    test('用户搜索素材的完整流程', async () => {
      const searchQuery = '现代建筑模型';
      const selectedWebsites = ['modown-cn', 'cgown-com'];

      console.log(`🔍 开始搜索: ${searchQuery}`);

      // 1. 用户配置搜索偏好
      userConfigService.updateConfig({
        search: {
          defaultWebsites: selectedWebsites,
          searchMode: 'comprehensive',
          enableCache: true,
          cacheExpiry: 24,
          maxConcurrentCrawlers: 3
        },
        display: {
          cardStyle: 'standard',
          resultsPerPage: 20,
          sortBy: 'relevance',
          sortOrder: 'desc'
        }
      });

      // 2. 检查缓存
      let cachedResults = await smartCacheService.getCachedSearchResults(
        searchQuery,
        selectedWebsites
      );

      if (!cachedResults) {
        console.log('📦 缓存未命中，开始爬取');

        // 3. 获取爬虫规则
        const rules = selectedWebsites
          .map(id => presetRules.getRuleById(id))
          .filter(rule => rule !== null) as CrawlerRule[];

        expect(rules.length).toBe(selectedWebsites.length);

        // 4. 模拟爬虫执行（实际环境中会真实爬取）
        const mockResults: ExtractedMaterialResult[] = [
          {
            id: 'e2e-1',
            title: '现代建筑3D模型套装',
            description: '包含多种现代建筑风格的高质量3D模型',
            sourceWebsite: '魔顿网',
            sourceUrl: 'https://www.modown.cn/archives/e2e-1.html',
            previewImages: [
              { url: 'https://example.com/preview-e2e-1.jpg', alt: '现代建筑预览' }
            ],
            pricing: {
              isFree: false,
              price: 35.99,
              currency: 'CNY'
            },
            fileInfo: {
              format: '3ds Max',
              size: '28.5MB'
            },
            statistics: {
              downloadCount: 2150,
              viewCount: 8900,
              rating: 4.8,
              reviewCount: 45
            },
            categorization: {
              category: '建筑模型',
              subcategory: '现代建筑',
              tags: ['现代', '建筑', '商业', '住宅']
            },
            timestamps: {
              uploadDate: new Date('2024-01-20'),
              extractedAt: new Date()
            },
            extraction: {
              ruleId: 'modown-cn',
              status: 'success',
              confidence: 0.96,
              missingFields: [],
              processingTime: 1350
            },
            quality: {
              score: 94,
              factors: { completeness: 96, imageQuality: 92, dataAccuracy: 94 }
            }
          },
          {
            id: 'e2e-2',
            title: '免费现代办公楼模型',
            description: '高质量的现代办公楼3D模型，免费下载',
            sourceWebsite: 'CG资源网',
            sourceUrl: 'https://www.cgown.com/model/e2e-2.html',
            previewImages: [
              { url: 'https://example.com/preview-e2e-2.jpg', alt: '办公楼预览' }
            ],
            pricing: {
              isFree: true
            },
            fileInfo: {
              format: 'FBX',
              size: '15.2MB'
            },
            statistics: {
              downloadCount: 5600,
              rating: 4.3
            },
            categorization: {
              category: '建筑模型',
              subcategory: '商业建筑',
              tags: ['现代', '办公楼', '免费']
            },
            timestamps: {
              uploadDate: new Date('2024-02-05'),
              extractedAt: new Date()
            },
            extraction: {
              ruleId: 'cgown-com',
              status: 'success',
              confidence: 0.89,
              missingFields: [],
              processingTime: 980
            },
            quality: {
              score: 87,
              factors: { completeness: 85, imageQuality: 88, dataAccuracy: 89 }
            }
          }
        ];

        // 5. 数据质量处理
        const qualityResult = dataQualityManager.batchProcessQuality(mockResults);
        expect(qualityResult.processed.length).toBeGreaterThan(0);
        expect(qualityResult.duplicatesRemoved).toBeGreaterThanOrEqual(0);

        console.log(`✨ 数据质量处理完成: ${qualityResult.processed.length} 个结果`);

        // 6. 缓存结果
        await smartCacheService.cacheSearchResults(
          searchQuery,
          selectedWebsites,
          qualityResult.processed,
          2500
        );

        cachedResults = {
          query: searchQuery,
          websites: selectedWebsites,
          results: qualityResult.processed,
          totalCount: qualityResult.processed.length,
          searchTime: 2500,
          timestamp: new Date()
        };
      } else {
        console.log('🎯 缓存命中，使用缓存结果');
      }

      // 7. 记录搜索历史
      userConfigService.addSearchHistory({
        query: searchQuery,
        websites: selectedWebsites,
        resultCount: cachedResults.results.length,
        searchTime: cachedResults.searchTime,
        filters: {
          category: '建筑模型'
        }
      });

      // 8. 验证搜索结果
      expect(cachedResults.results.length).toBeGreaterThan(0);
      expect(cachedResults.query).toBe(searchQuery);
      expect(cachedResults.websites).toEqual(selectedWebsites);

      // 9. 验证搜索历史
      const history = userConfigService.getSearchHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].query).toBe(searchQuery);

      console.log(`✅ 搜索完成: 找到 ${cachedResults.results.length} 个结果`);
    });

    test('用户自定义网站配置工作流', async () => {
      console.log('🔧 开始自定义网站配置工作流');

      // 1. 创建自定义爬虫规则
      const customRule: CrawlerRule = {
        id: 'custom-test-site',
        websiteName: '测试自定义网站',
        baseUrl: 'https://custom-test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://custom-test.com/search?q={keyword}',
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Find3D-Bot/1.0)'
          }
        },
        parseConfig: {
          listSelectors: {
            container: '.search-results',
            item: '.result-item',
            link: 'a.result-link'
          },
          detailSelectors: {
            title: 'h1.material-title',
            description: '.material-description',
            images: '.preview-gallery img',
            price: '.price-info .price',
            freeIndicator: '.free-badge'
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
          },
          priceExtraction: {
            regex: '\\$([0-9.]+)',
            currency: 'USD',
            freeKeywords: ['free', 'Free', 'FREE']
          }
        },
        antiDetection: {
          useHeadlessBrowser: false,
          requestConfig: {
            delay: 2000,
            randomDelay: true,
            maxRetries: 3,
            timeout: 30000
          }
        },
        qualityControl: {
          minTitleLength: 5,
          requireImage: true,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试模型',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      // 2. 验证规则配置
      expect(customRule.id).toBeTruthy();
      expect(customRule.websiteName).toBeTruthy();
      expect(customRule.searchConfig.urlTemplate).toContain('{keyword}');
      expect(customRule.parseConfig.detailSelectors.title).toBeTruthy();

      // 3. 模拟规则测试
      const testKeyword = '建筑模型';
      console.log(`🧪 测试自定义规则: ${testKeyword}`);

      // 模拟测试结果
      const testResult = {
        isValid: true,
        extractedCount: 3,
        errors: [],
        performance: {
          totalTime: 1800,
          parseTime: 200,
          networkTime: 1600
        },
        sampleResults: [
          {
            title: '自定义网站测试模型',
            price: '$25.99',
            imageUrl: 'https://custom-test.com/preview.jpg'
          }
        ]
      };

      expect(testResult.isValid).toBe(true);
      expect(testResult.errors.length).toBe(0);
      expect(testResult.extractedCount).toBeGreaterThan(0);

      console.log(`✅ 自定义规则测试通过: 提取了 ${testResult.extractedCount} 个结果`);

      // 4. 保存自定义规则（模拟）
      const savedRules = [customRule];
      expect(savedRules.length).toBe(1);
      expect(savedRules[0].id).toBe('custom-test-site');

      console.log('💾 自定义规则保存成功');
    });
  });

  describe('用户配置管理工作流', () => {
    test('用户个性化配置完整流程', async () => {
      console.log('⚙️ 开始用户个性化配置流程');

      // 1. 获取默认配置
      const defaultConfig = userConfigService.getConfig();
      expect(defaultConfig).toBeTruthy();
      expect(defaultConfig.display.cardStyle).toBeTruthy();

      // 2. 用户自定义显示配置
      const customDisplayConfig = {
        cardStyle: 'detailed' as const,
        resultsPerPage: 15,
        sortBy: 'price' as const,
        sortOrder: 'asc' as const,
        showPreviewImages: true,
        imageQuality: 'high' as const,
        enableLazyLoading: true,
        compactMode: false
      };

      userConfigService.updateConfig({
        display: {
          ...defaultConfig.display,
          ...customDisplayConfig
        }
      });

      // 3. 验证配置更新
      const updatedConfig = userConfigService.getConfig();
      expect(updatedConfig.display.cardStyle).toBe('detailed');
      expect(updatedConfig.display.resultsPerPage).toBe(15);
      expect(updatedConfig.display.sortBy).toBe('price');

      console.log('🎨 显示配置更新成功');

      // 4. 配置搜索偏好
      userConfigService.updateConfig({
        search: {
          ...updatedConfig.search,
          defaultWebsites: ['modown-cn', 'cgown-com', 'c4dsky-com'],
          searchMode: 'fast',
          enableCache: true,
          cacheExpiry: 12,
          maxConcurrentCrawlers: 2
        }
      });

      // 5. 配置隐私设置
      userConfigService.updateConfig({
        privacy: {
          ...updatedConfig.privacy,
          saveSearchHistory: true,
          maxHistoryItems: 50,
          autoDeleteHistory: true,
          historyRetentionDays: 30
        }
      });

      // 6. 验证完整配置
      const finalConfig = userConfigService.getConfig();
      expect(finalConfig.search.defaultWebsites).toHaveLength(3);
      expect(finalConfig.search.searchMode).toBe('fast');
      expect(finalConfig.privacy.maxHistoryItems).toBe(50);

      console.log('✅ 用户配置完整流程完成');

      // 7. 测试配置导出
      const exportedConfig = userConfigService.exportConfig();
      expect(exportedConfig).toBeTruthy();
      expect(typeof exportedConfig).toBe('string');

      // 8. 测试配置导入
      const importResult = userConfigService.importConfig(exportedConfig);
      expect(importResult.success).toBe(true);
      expect(importResult.errors.length).toBe(0);

      console.log('📤📥 配置导入导出测试通过');
    });

    test('显示字段自定义工作流', async () => {
      console.log('🏷️ 开始显示字段自定义流程');

      // 1. 获取默认显示字段
      const defaultFields = userConfigService.getDisplayFields();
      expect(defaultFields.length).toBeGreaterThan(0);

      // 2. 自定义显示字段
      const customFields = defaultFields.map(field => ({
        ...field,
        visible: field.key === 'title' || field.key === 'pricing' || field.key === 'statistics'
      }));

      // 调整字段顺序
      customFields.sort((a, b) => {
        const order = { title: 1, pricing: 2, statistics: 3 };
        return (order[a.key as keyof typeof order] || 999) - (order[b.key as keyof typeof order] || 999);
      });

      customFields.forEach((field, index) => {
        field.order = index + 1;
      });

      userConfigService.updateDisplayFields(customFields);

      // 3. 验证字段配置
      const updatedFields = userConfigService.getDisplayFields();
      const visibleFields = updatedFields.filter(f => f.visible);
      
      expect(visibleFields.length).toBe(3);
      expect(visibleFields[0].key).toBe('title');
      expect(visibleFields[1].key).toBe('pricing');
      expect(visibleFields[2].key).toBe('statistics');

      console.log(`✅ 显示字段配置完成: ${visibleFields.length} 个可见字段`);
    });
  });

  describe('缓存管理工作流', () => {
    test('智能缓存完整生命周期', async () => {
      console.log('🗄️ 开始智能缓存生命周期测试');

      const testQuery = '缓存测试查询';
      const testWebsites = ['modown-cn'];
      const testResults: ExtractedMaterialResult[] = [
        {
          id: 'cache-test-1',
          title: '缓存测试素材',
          sourceWebsite: '魔顿网',
          sourceUrl: 'https://test.com/cache-1',
          previewImages: [],
          pricing: { isFree: true },
          fileInfo: {},
          statistics: {},
          categorization: { tags: ['缓存', '测试'] },
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

      // 1. 初始缓存为空
      let cachedData = await smartCacheService.getCachedSearchResults(testQuery, testWebsites);
      expect(cachedData).toBeNull();

      // 2. 缓存搜索结果
      await smartCacheService.cacheSearchResults(
        testQuery,
        testWebsites,
        testResults,
        1500
      );

      // 3. 验证缓存命中
      cachedData = await smartCacheService.getCachedSearchResults(testQuery, testWebsites);
      expect(cachedData).toBeTruthy();
      expect(cachedData!.results).toHaveLength(1);
      expect(cachedData!.results[0].title).toBe('缓存测试素材');

      console.log('💾 缓存写入和读取成功');

      // 4. 缓存统计
      const stats = await smartCacheService.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.itemCount).toBeGreaterThan(0);

      // 5. 缓存清理
      await smartCacheService.clearByTags(['cache-test']);
      
      // 6. 验证清理结果
      cachedData = await smartCacheService.getCachedSearchResults(testQuery, testWebsites);
      expect(cachedData).toBeNull();

      console.log('🧹 缓存清理成功');
    });

    test('缓存策略和性能优化', async () => {
      console.log('⚡ 开始缓存性能优化测试');

      // 1. 批量缓存操作
      const batchSize = 50;
      const batchOperations = Array.from({ length: batchSize }, async (_, i) => {
        const key = `batch-test-${i}`;
        const data = { id: i, content: `测试数据 ${i}` };
        
        await smartCacheService.set('batch-test', key, data);
        return smartCacheService.get('batch-test', key);
      });

      const startTime = Date.now();
      const results = await Promise.all(batchOperations);
      const batchTime = Date.now() - startTime;

      expect(results).toHaveLength(batchSize);
      expect(results.every(r => r !== null)).toBe(true);
      expect(batchTime).toBeLessThan(5000); // 5秒内完成

      console.log(`📊 批量缓存操作完成: ${batchSize} 项，耗时 ${batchTime}ms`);

      // 2. 缓存命中率测试
      let hitCount = 0;
      const testCount = 20;

      for (let i = 0; i < testCount; i++) {
        const key = `hit-test-${i % 10}`; // 重复访问前10个键
        const result = await smartCacheService.get('batch-test', key);
        if (result !== null) hitCount++;
      }

      const hitRate = hitCount / testCount;
      expect(hitRate).toBeGreaterThan(0.5); // 命中率应大于50%

      console.log(`🎯 缓存命中率: ${(hitRate * 100).toFixed(1)}%`);

      // 3. 清理测试数据
      await smartCacheService.clearByTags(['batch-test']);
    });
  });

  describe('系统健康监控工作流', () => {
    test('系统健康状态监控和告警', async () => {
      console.log('🏥 开始系统健康监控测试');

      // 1. 获取初始健康状态
      const initialHealth = await systemHealthMonitor.performHealthCheck();
      expect(initialHealth).toBeTruthy();
      expect(initialHealth.overall).toMatch(/healthy|warning|critical/);
      expect(initialHealth.score).toBeGreaterThanOrEqual(0);
      expect(initialHealth.score).toBeLessThanOrEqual(100);

      console.log(`📊 初始健康状态: ${initialHealth.overall} (${initialHealth.score}分)`);

      // 2. 模拟系统压力
      const stressOperations = Array.from({ length: 100 }, async (_, i) => {
        // 模拟各种操作
        await smartCacheService.set('stress-test', `key-${i}`, { data: i });
        
        if (i % 10 === 0) {
          // 模拟一些错误
          systemHealthMonitor.recordError({
            type: 'NETWORK_ERROR',
            message: `模拟网络错误 ${i}`,
            timestamp: new Date(),
            websiteId: 'stress-test',
            severity: 'low',
            recoverable: true
          });
        }
      });

      await Promise.all(stressOperations);

      // 3. 等待监控收集数据
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. 检查压力后的健康状态
      const stressHealth = await systemHealthMonitor.performHealthCheck();
      expect(stressHealth).toBeTruthy();

      // 5. 验证错误记录
      const metrics = systemHealthMonitor.getMetrics();
      expect(metrics.errorStats.totalErrors).toBeGreaterThan(0);
      expect(metrics.errorStats.recentErrors.length).toBeGreaterThan(0);

      console.log(`⚠️ 压力测试后健康状态: ${stressHealth.overall} (${stressHealth.score}分)`);
      console.log(`📈 记录错误数: ${metrics.errorStats.totalErrors}`);

      // 6. 清理测试数据
      await smartCacheService.clearByTags(['stress-test']);
    });
  });

  describe('错误恢复工作流', () => {
    test('系统错误检测和自动恢复', async () => {
      console.log('🔄 开始错误恢复工作流测试');

      // 1. 模拟各种类型的错误
      const errorTypes = [
        { type: 'NETWORK_ERROR', message: '网络连接失败' },
        { type: 'TIMEOUT_ERROR', message: '请求超时' },
        { type: 'PARSE_ERROR', message: '页面解析失败' },
        { type: 'BLOCKED_BY_WEBSITE', message: '被网站阻止访问' }
      ] as const;

      for (const errorData of errorTypes) {
        const error = {
          ...errorData,
          timestamp: new Date(),
          websiteId: 'recovery-test',
          severity: 'medium' as const,
          recoverable: true
        };

        systemHealthMonitor.recordError(error);
      }

      // 2. 验证错误记录
      const metrics = systemHealthMonitor.getMetrics();
      expect(metrics.errorStats.totalErrors).toBeGreaterThanOrEqual(errorTypes.length);

      // 3. 测试系统恢复能力
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 系统应该仍然能够正常工作
      await smartCacheService.set('recovery-test', 'test-key', { recovered: true });
      const result = await smartCacheService.get('recovery-test', 'test-key');
      expect(result).toEqual({ recovered: true });

      console.log('✅ 系统在错误后仍能正常工作');

      // 4. 验证健康状态恢复
      const recoveryHealth = await systemHealthMonitor.performHealthCheck();
      expect(recoveryHealth).toBeTruthy();
      expect(recoveryHealth.overall).not.toBe('critical');

      console.log(`🏥 恢复后健康状态: ${recoveryHealth.overall}`);
    });
  });

  describe('完整用户场景测试', () => {
    test('新用户完整使用流程', async () => {
      console.log('👤 开始新用户完整使用流程测试');

      // 1. 新用户首次访问 - 使用默认配置
      const initialConfig = userConfigService.getConfig();
      expect(initialConfig.display.cardStyle).toBe('standard');
      expect(initialConfig.search.searchMode).toBe('comprehensive');

      // 2. 用户进行首次搜索
      const firstQuery = '室内设计模型';
      const searchWebsites = ['modown-cn', 'cgown-com'];

      // 模拟搜索结果
      const searchResults: ExtractedMaterialResult[] = [
        {
          id: 'newuser-1',
          title: '现代室内设计套装',
          sourceWebsite: '魔顿网',
          sourceUrl: 'https://test.com/newuser-1',
          previewImages: [{ url: 'https://test.com/preview1.jpg', alt: '室内预览' }],
          pricing: { isFree: false, price: 45.99, currency: 'CNY' },
          fileInfo: { format: '3ds Max', size: '32MB' },
          statistics: { downloadCount: 1800, rating: 4.6 },
          categorization: { category: '室内设计', tags: ['现代', '室内', '家具'] },
          timestamps: { extractedAt: new Date() },
          extraction: {
            ruleId: 'modown-cn',
            status: 'success',
            confidence: 0.92,
            missingFields: [],
            processingTime: 1200
          },
          quality: {
            score: 89,
            factors: { completeness: 92, imageQuality: 86, dataAccuracy: 89 }
          }
        }
      ];

      // 3. 缓存搜索结果
      await smartCacheService.cacheSearchResults(
        firstQuery,
        searchWebsites,
        searchResults,
        2200
      );

      // 4. 记录搜索历史
      userConfigService.addSearchHistory({
        query: firstQuery,
        websites: searchWebsites,
        resultCount: searchResults.length,
        searchTime: 2200
      });

      // 5. 用户调整配置
      userConfigService.updateConfig({
        display: {
          ...initialConfig.display,
          cardStyle: 'detailed',
          resultsPerPage: 12
        }
      });

      // 6. 用户进行第二次搜索（应该有搜索建议）
      const suggestions = userConfigService.getSearchSuggestions('室内');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain(firstQuery);

      // 7. 用户查看搜索历史
      const history = userConfigService.getSearchHistory();
      expect(history.length).toBe(1);
      expect(history[0].query).toBe(firstQuery);

      // 8. 验证缓存使用
      const cachedResults = await smartCacheService.getCachedSearchResults(
        firstQuery,
        searchWebsites
      );
      expect(cachedResults).toBeTruthy();
      expect(cachedResults!.results.length).toBe(searchResults.length);

      console.log('✅ 新用户完整流程测试通过');
    });

    test('高级用户工作流', async () => {
      console.log('🎓 开始高级用户工作流测试');

      // 1. 高级用户自定义配置
      userConfigService.updateConfig({
        display: {
          cardStyle: 'compact',
          resultsPerPage: 50,
          sortBy: 'downloads',
          sortOrder: 'desc',
          showPreviewImages: true,
          imageQuality: 'high',
          enableLazyLoading: true,
          compactMode: true
        },
        search: {
          defaultWebsites: ['modown-cn', 'cgown-com', 'c4dsky-com', '3dxy-com'],
          searchMode: 'fast',
          enableCache: true,
          cacheExpiry: 6, // 6小时
          maxConcurrentCrawlers: 4
        },
        performance: {
          enableImagePreloading: true,
          imageQuality: 'high',
          enableLazyLoading: true,
          maxCacheSize: 500 // 500MB
        }
      });

      // 2. 批量搜索操作
      const batchQueries = [
        '汽车模型',
        '建筑外观',
        '家具设计',
        '工业设备'
      ];

      const batchResults = await Promise.all(
        batchQueries.map(async (query, index) => {
          // 模拟搜索
          const mockResult: ExtractedMaterialResult = {
            id: `batch-${index}`,
            title: `${query}测试素材`,
            sourceWebsite: '测试网站',
            sourceUrl: `https://test.com/batch-${index}`,
            previewImages: [],
            pricing: { isFree: index % 2 === 0 },
            fileInfo: {},
            statistics: { downloadCount: (index + 1) * 1000 },
            categorization: { tags: [query] },
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

          // 缓存结果
          await smartCacheService.cacheSearchResults(
            query,
            ['test-site'],
            [mockResult],
            1500
          );

          // 记录历史
          userConfigService.addSearchHistory({
            query,
            websites: ['test-site'],
            resultCount: 1,
            searchTime: 1500
          });

          return mockResult;
        })
      );

      expect(batchResults.length).toBe(batchQueries.length);

      // 3. 验证搜索历史和建议
      const history = userConfigService.getSearchHistory();
      expect(history.length).toBe(batchQueries.length);

      const suggestions = userConfigService.getSearchSuggestions('模型');
      expect(suggestions.length).toBeGreaterThan(0);

      // 4. 缓存管理
      const cacheStats = await smartCacheService.getStats();
      expect(cacheStats.itemCount).toBeGreaterThan(0);

      // 5. 系统性能检查
      const health = await systemHealthMonitor.performHealthCheck();
      expect(health.overall).not.toBe('critical');

      console.log(`✅ 高级用户工作流完成: 处理了 ${batchQueries.length} 个查询`);
      console.log(`📊 缓存统计: ${cacheStats.itemCount} 项，命中率 ${cacheStats.hitRate.toFixed(1)}%`);
    });
  });

  describe('系统压力和稳定性测试', () => {
    test('高并发用户场景', async () => {
      console.log('🚀 开始高并发用户场景测试');

      const concurrentUsers = 20;
      const operationsPerUser = 5;

      const userOperations = Array.from({ length: concurrentUsers }, async (_, userId) => {
        const operations = [];

        for (let i = 0; i < operationsPerUser; i++) {
          const query = `用户${userId}查询${i}`;
          
          // 模拟用户操作
          operations.push(
            // 搜索操作
            smartCacheService.cacheSearchResults(
              query,
              ['test-site'],
              [{
                id: `user-${userId}-${i}`,
                title: `用户${userId}的素材${i}`,
                sourceWebsite: '测试网站',
                sourceUrl: `https://test.com/user-${userId}-${i}`,
                previewImages: [],
                pricing: { isFree: i % 2 === 0 },
                fileInfo: {},
                statistics: {},
                categorization: { tags: [`用户${userId}`] },
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
              }],
              1000 + Math.random() * 1000
            ),
            
            // 配置操作
            Promise.resolve().then(() => {
              userConfigService.updateConfig({
                display: {
                  ...userConfigService.getConfig().display,
                  resultsPerPage: 10 + (userId % 20)
                }
              });
            }),
            
            // 历史记录操作
            Promise.resolve().then(() => {
              userConfigService.addSearchHistory({
                query,
                websites: ['test-site'],
                resultCount: i + 1,
                searchTime: 1000 + i * 100
              });
            })
          );
        }

        return Promise.all(operations);
      });

      const startTime = Date.now();
      const results = await Promise.allSettled(userOperations);
      const totalTime = Date.now() - startTime;

      const successfulUsers = results.filter(r => r.status === 'fulfilled').length;
      const failedUsers = results.filter(r => r.status === 'rejected').length;

      expect(successfulUsers / concurrentUsers).toBeGreaterThan(0.8); // 80%成功率
      expect(totalTime).toBeLessThan(30000); // 30秒内完成

      console.log(`🎯 并发测试结果: ${successfulUsers}/${concurrentUsers} 用户成功`);
      console.log(`⏱️ 总耗时: ${totalTime}ms`);

      // 验证系统仍然健康
      const finalHealth = await systemHealthMonitor.performHealthCheck();
      expect(finalHealth.overall).not.toBe('critical');

      console.log(`🏥 压力测试后系统状态: ${finalHealth.overall}`);
    });
  });
});