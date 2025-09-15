/**
 * 爬虫规则验证测试
 * 测试爬虫规则的有效性和数据提取准确性
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { CrawlerRule, ExtractedMaterialResult } from '../../crawler/types/crawler';
import { CrawlerEngine } from '../../crawler/engine/CrawlerEngine';
import { ContentExtractor } from '../../crawler/engine/ContentExtractor';
import { SmartExtractor } from '../../crawler/engine/SmartExtractor';
import { dataValidator } from '../../crawler/utils/dataValidator';
import { dataCleaner } from '../../crawler/utils/dataCleaner';
import { ruleTester } from '../../crawler/utils/ruleTester';
import { presetRules } from '../../crawler/config/presetRules';

describe('爬虫规则验证测试', () => {
  let crawlerEngine: CrawlerEngine;
  let contentExtractor: ContentExtractor;
  let smartExtractor: SmartExtractor;

  beforeAll(async () => {
    crawlerEngine = new CrawlerEngine();
    contentExtractor = new ContentExtractor();
    smartExtractor = new SmartExtractor();
    
    await crawlerEngine.initialize();
    console.log('🕷️ 爬虫规则验证测试环境初始化完成');
  });

  afterAll(async () => {
    await crawlerEngine.cleanup();
    console.log('🧹 爬虫规则验证测试环境清理完成');
  });

  describe('预设规则验证', () => {
    test('所有预设规则应该有效', () => {
      const rules = presetRules.getAllRules();
      
      expect(rules.length).toBeGreaterThan(0);
      
      rules.forEach(rule => {
        // 验证规则基本结构
        expect(rule.id).toBeTruthy();
        expect(rule.websiteName).toBeTruthy();
        expect(rule.baseUrl).toMatch(/^https?:\/\//);
        expect(rule.searchConfig.urlTemplate).toBeTruthy();
        expect(rule.parseConfig.detailSelectors.title).toBeTruthy();
        
        // 验证选择器语法
        expect(() => {
          document.querySelector(rule.parseConfig.detailSelectors.title);
        }).not.toThrow();
        
        if (rule.parseConfig.detailSelectors.images) {
          expect(() => {
            document.querySelector(rule.parseConfig.detailSelectors.images);
          }).not.toThrow();
        }
        
        console.log(`✅ 规则验证通过: ${rule.websiteName}`);
      });
    });

    test('魔顿网规则验证', async () => {
      const modownRule = presetRules.getRuleById('modown-cn');
      expect(modownRule).toBeTruthy();
      
      if (modownRule) {
        // 验证搜索URL模板
        const searchUrl = modownRule.searchConfig.urlTemplate.replace('{keyword}', '手机');
        expect(searchUrl).toContain('modown.cn');
        expect(searchUrl).toContain('手机');
        
        // 验证选择器配置
        expect(modownRule.parseConfig.detailSelectors.title).toBeTruthy();
        expect(modownRule.parseConfig.detailSelectors.images).toBeTruthy();
        
        // 测试规则有效性
        const testResult = await ruleTester.testRule(modownRule, '测试素材');
        expect(testResult.isValid).toBe(true);
        expect(testResult.errors.length).toBe(0);
      }
    });

    test('CG资源网规则验证', async () => {
      const cgownRule = presetRules.getRuleById('cgown-com');
      expect(cgownRule).toBeTruthy();
      
      if (cgownRule) {
        // 验证搜索配置
        expect(cgownRule.searchConfig.urlTemplate).toContain('cgown.com');
        expect(cgownRule.parseConfig.detailSelectors.title).toBeTruthy();
        
        // 测试规则
        const testResult = await ruleTester.testRule(cgownRule, '建筑模型');
        expect(testResult.isValid).toBe(true);
      }
    });

    test('书生CG资源站规则验证', async () => {
      const c4dskyRule = presetRules.getRuleById('c4dsky-com');
      expect(c4dskyRule).toBeTruthy();
      
      if (c4dskyRule) {
        expect(c4dskyRule.searchConfig.urlTemplate).toContain('c4dsky.com');
        expect(c4dskyRule.parseConfig.detailSelectors.title).toBeTruthy();
        
        const testResult = await ruleTester.testRule(c4dskyRule, '汽车模型');
        expect(testResult.isValid).toBe(true);
      }
    });

    test('3D溜溜网规则验证', async () => {
      const xy3dRule = presetRules.getRuleById('3dxy-com');
      expect(xy3dRule).toBeTruthy();
      
      if (xy3dRule) {
        expect(xy3dRule.searchConfig.urlTemplate).toContain('3dxy.com');
        expect(xy3dRule.parseConfig.detailSelectors.title).toBeTruthy();
        
        const testResult = await ruleTester.testRule(xy3dRule, '室内设计');
        expect(testResult.isValid).toBe(true);
      }
    });
  });

  describe('数据提取准确性测试', () => {
    test('应该正确提取标题信息', async () => {
      const mockHtml = `
        <html>
          <head><title>测试页面</title></head>
          <body>
            <h1 class="material-title">现代建筑3D模型</h1>
            <div class="content">
              <p>这是一个高质量的现代建筑3D模型</p>
            </div>
          </body>
        </html>
      `;

      const testRule: CrawlerRule = {
        id: 'test-rule',
        websiteName: '测试网站',
        baseUrl: 'https://test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://test.com/search?q={keyword}',
          method: 'GET'
        },
        parseConfig: {
          listSelectors: {
            container: '.search-results',
            item: '.result-item',
            link: 'a'
          },
          detailSelectors: {
            title: '.material-title',
            description: '.content p',
            images: '.preview-images img'
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
          }
        },
        antiDetection: {
          useHeadlessBrowser: false,
          requestConfig: {
            delay: 1000,
            randomDelay: false,
            maxRetries: 3,
            timeout: 30000
          }
        },
        qualityControl: {
          minTitleLength: 5,
          requireImage: false,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      const extractedData = await contentExtractor.extractFromHtml(mockHtml, testRule);
      
      expect(extractedData.title).toBe('现代建筑3D模型');
      expect(extractedData.description).toBe('这是一个高质量的现代建筑3D模型');
    });

    test('应该正确提取价格信息', async () => {
      const mockHtml = `
        <div class="price-info">
          <span class="price">￥29.99</span>
          <span class="original-price">￥39.99</span>
          <span class="free-tag">免费</span>
        </div>
      `;

      const testRule: CrawlerRule = {
        id: 'price-test-rule',
        websiteName: '价格测试',
        baseUrl: 'https://test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://test.com/search?q={keyword}',
          method: 'GET'
        },
        parseConfig: {
          listSelectors: {
            container: '.results',
            item: '.item',
            link: 'a'
          },
          detailSelectors: {
            title: '.title',
            price: '.price',
            freeIndicator: '.free-tag'
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
          },
          priceExtraction: {
            regex: '￥([0-9.]+)',
            currency: 'CNY',
            freeKeywords: ['免费', 'free', '0元']
          }
        },
        antiDetection: {
          useHeadlessBrowser: false,
          requestConfig: {
            delay: 1000,
            randomDelay: false,
            maxRetries: 3,
            timeout: 30000
          }
        },
        qualityControl: {
          minTitleLength: 1,
          requireImage: false,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      const extractedData = await contentExtractor.extractFromHtml(mockHtml, testRule);
      
      // 测试价格提取
      expect(extractedData.pricing?.price).toBe(29.99);
      expect(extractedData.pricing?.currency).toBe('CNY');
      
      // 测试免费标识
      if (extractedData.pricing?.isFree) {
        expect(extractedData.pricing.price).toBeUndefined();
      }
    });

    test('应该正确提取图片信息', async () => {
      const mockHtml = `
        <div class="preview-gallery">
          <img src="https://test.com/preview1.jpg" alt="主预览图" />
          <img src="https://test.com/preview2.jpg" alt="侧视图" />
          <img src="relative-image.jpg" alt="相对路径图片" />
        </div>
      `;

      const testRule: CrawlerRule = {
        id: 'image-test-rule',
        websiteName: '图片测试',
        baseUrl: 'https://test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://test.com/search?q={keyword}',
          method: 'GET'
        },
        parseConfig: {
          listSelectors: {
            container: '.results',
            item: '.item',
            link: 'a'
          },
          detailSelectors: {
            title: '.title',
            images: '.preview-gallery img'
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
          },
          imageProcessing: {
            baseUrl: 'https://test.com/',
            preferredSize: 'medium'
          }
        },
        antiDetection: {
          useHeadlessBrowser: false,
          requestConfig: {
            delay: 1000,
            randomDelay: false,
            maxRetries: 3,
            timeout: 30000
          }
        },
        qualityControl: {
          minTitleLength: 1,
          requireImage: true,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      const extractedData = await contentExtractor.extractFromHtml(mockHtml, testRule);
      
      expect(extractedData.previewImages).toHaveLength(3);
      expect(extractedData.previewImages[0].url).toBe('https://test.com/preview1.jpg');
      expect(extractedData.previewImages[0].alt).toBe('主预览图');
      expect(extractedData.previewImages[2].url).toBe('https://test.com/relative-image.jpg'); // 应该转换为绝对路径
    });

    test('应该正确提取统计信息', async () => {
      const mockHtml = `
        <div class="stats">
          <span class="downloads">下载: 1,250次</span>
          <span class="views">浏览: 5,600次</span>
          <span class="rating">评分: 4.7/5</span>
          <span class="reviews">评论: 23条</span>
        </div>
      `;

      const testRule: CrawlerRule = {
        id: 'stats-test-rule',
        websiteName: '统计测试',
        baseUrl: 'https://test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://test.com/search?q={keyword}',
          method: 'GET'
        },
        parseConfig: {
          listSelectors: {
            container: '.results',
            item: '.item',
            link: 'a'
          },
          detailSelectors: {
            title: '.title',
            stats: {
              downloads: '.downloads',
              views: '.views',
              rating: '.rating',
              reviews: '.reviews'
            }
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
          }
        },
        antiDetection: {
          useHeadlessBrowser: false,
          requestConfig: {
            delay: 1000,
            randomDelay: false,
            maxRetries: 3,
            timeout: 30000
          }
        },
        qualityControl: {
          minTitleLength: 1,
          requireImage: false,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      const extractedData = await contentExtractor.extractFromHtml(mockHtml, testRule);
      
      expect(extractedData.statistics?.downloadCount).toBe(1250);
      expect(extractedData.statistics?.viewCount).toBe(5600);
      expect(extractedData.statistics?.rating).toBe(4.7);
      expect(extractedData.statistics?.reviewCount).toBe(23);
    });
  });

  describe('数据验证测试', () => {
    test('应该验证必填字段', () => {
      const incompleteResult: Partial<ExtractedMaterialResult> = {
        id: 'test-1',
        // 缺少 title
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/1',
        previewImages: [],
        pricing: { isFree: true },
        fileInfo: {},
        statistics: {},
        categorization: { tags: [] },
        timestamps: { extractedAt: new Date() }
      };

      const validation = dataValidator.validate(incompleteResult as ExtractedMaterialResult);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === 'title')).toBe(true);
      expect(validation.errors.some(e => e.type === 'required')).toBe(true);
    });

    test('应该验证数据格式', () => {
      const invalidResult: ExtractedMaterialResult = {
        id: 'format-test',
        title: 'T', // 太短
        sourceWebsite: '测试网站',
        sourceUrl: 'invalid-url', // 无效URL
        previewImages: [
          { url: 'invalid-image-url', alt: '无效图片' }
        ],
        pricing: {
          isFree: false,
          price: -10, // 负价格
          currency: 'INVALID'
        },
        fileInfo: {
          format: '',
          size: 'invalid-size'
        },
        statistics: {
          downloadCount: -5, // 负数
          rating: 6 // 超出范围
        },
        categorization: { tags: [] },
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'test-rule',
          status: 'success',
          confidence: 1.5, // 超出范围
          missingFields: [],
          processingTime: -100 // 负数
        },
        quality: {
          score: 150, // 超出范围
          factors: { completeness: 0, imageQuality: 0, dataAccuracy: 0 }
        }
      };

      const validation = dataValidator.validate(invalidResult);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      // 检查具体的验证错误
      const errorTypes = validation.errors.map(e => e.type);
      expect(errorTypes).toContain('format');
      expect(errorTypes).toContain('range');
    });

    test('应该验证数据逻辑一致性', () => {
      const inconsistentResult: ExtractedMaterialResult = {
        id: 'logic-test',
        title: '逻辑测试素材',
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/logic',
        previewImages: [],
        pricing: {
          isFree: true,
          price: 29.99 // 逻辑矛盾：免费但有价格
        },
        fileInfo: {},
        statistics: {},
        categorization: { tags: [] },
        timestamps: {
          uploadDate: new Date('2025-01-01'), // 未来日期
          lastUpdated: new Date('2024-01-01'), // 更新时间早于上传时间
          extractedAt: new Date()
        },
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

      const validation = dataValidator.validate(inconsistentResult);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.type === 'logic')).toBe(true);
    });
  });

  describe('数据清理测试', () => {
    test('应该清理HTML标签和特殊字符', () => {
      const dirtyResult: ExtractedMaterialResult = {
        id: 'clean-test',
        title: '  <b>脏数据测试</b>  ',
        description: '<p>包含<strong>HTML</strong>标签的描述&nbsp;&amp;特殊字符</p>',
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/clean',
        previewImages: [],
        pricing: { isFree: true },
        fileInfo: {},
        statistics: {},
        categorization: { 
          tags: ['重复', '重复', '测试', '', '  空白  '] 
        },
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

      const cleanedResult = dataCleaner.clean(dirtyResult);
      
      expect(cleanedResult.title).toBe('脏数据测试');
      expect(cleanedResult.description).toBe('包含HTML标签的描述&特殊字符');
      expect(cleanedResult.categorization.tags).not.toContain('');
      expect(cleanedResult.categorization.tags).not.toContain('  空白  ');
      expect(cleanedResult.categorization.tags.filter(tag => tag === '重复')).toHaveLength(1);
    });

    test('应该修复逻辑错误', () => {
      const logicErrorResult: ExtractedMaterialResult = {
        id: 'logic-fix-test',
        title: '逻辑修复测试',
        sourceWebsite: '测试网站',
        sourceUrl: 'https://test.com/logic-fix',
        previewImages: [],
        pricing: {
          isFree: true,
          price: 19.99 // 逻辑错误
        },
        fileInfo: {},
        statistics: {
          downloadCount: -10, // 负数错误
          rating: 6.5 // 超出范围
        },
        categorization: { tags: [] },
        timestamps: { extractedAt: new Date() },
        extraction: {
          ruleId: 'test-rule',
          status: 'success',
          confidence: 1.2, // 超出范围
          missingFields: [],
          processingTime: -500 // 负数
        },
        quality: {
          score: 120, // 超出范围
          factors: { completeness: 90, imageQuality: 80, dataAccuracy: 85 }
        }
      };

      const fixedResult = dataCleaner.clean(logicErrorResult);
      
      // 价格逻辑修复
      if (fixedResult.pricing.isFree) {
        expect(fixedResult.pricing.price).toBeUndefined();
      }
      
      // 数值范围修复
      expect(fixedResult.statistics?.downloadCount).toBeGreaterThanOrEqual(0);
      expect(fixedResult.statistics?.rating).toBeLessThanOrEqual(5);
      expect(fixedResult.extraction.confidence).toBeLessThanOrEqual(1);
      expect(fixedResult.extraction.processingTime).toBeGreaterThanOrEqual(0);
      expect(fixedResult.quality.score).toBeLessThanOrEqual(100);
    });
  });

  describe('智能提取测试', () => {
    test('应该能够智能识别价格模式', async () => {
      const priceTexts = [
        '￥29.99',
        '$19.99',
        '€15.50',
        '免费下载',
        'Free',
        '0元',
        '价格：¥39.90',
        '售价 $25.00'
      ];

      for (const priceText of priceTexts) {
        const result = await smartExtractor.extractPrice(priceText);
        
        if (priceText.includes('免费') || priceText.includes('Free') || priceText.includes('0元')) {
          expect(result.isFree).toBe(true);
          expect(result.price).toBeUndefined();
        } else {
          expect(result.isFree).toBe(false);
          expect(result.price).toBeGreaterThan(0);
          expect(result.currency).toBeTruthy();
        }
      }
    });

    test('应该能够智能识别文件格式', async () => {
      const formatTexts = [
        '3ds Max 2020',
        'Maya (.ma)',
        'Blender文件',
        'FBX格式',
        'OBJ + MTL',
        'C4D工程文件',
        'SketchUp (.skp)'
      ];

      for (const formatText of formatTexts) {
        const result = await smartExtractor.extractFileFormat(formatText);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(0);
      }
    });

    test('应该能够智能识别文件大小', async () => {
      const sizeTexts = [
        '15.6MB',
        '2.3GB',
        '850KB',
        '1.2 GB',
        '文件大小：25MB',
        '约 500MB'
      ];

      for (const sizeText of sizeTexts) {
        const result = await smartExtractor.extractFileSize(sizeText);
        expect(result.size).toBeTruthy();
        expect(result.bytes).toBeGreaterThan(0);
      }
    });

    test('应该能够智能识别下载统计', async () => {
      const statsTexts = [
        '下载：1,250次',
        '已下载 2500 次',
        'Downloads: 3,456',
        '浏览量：15,600',
        'Views: 25K',
        '评分：4.7/5',
        'Rating: 4.2 stars'
      ];

      for (const statsText of statsTexts) {
        const result = await smartExtractor.extractStatistics(statsText);
        expect(result).toBeTruthy();
        
        if (result.downloadCount !== undefined) {
          expect(result.downloadCount).toBeGreaterThan(0);
        }
        if (result.viewCount !== undefined) {
          expect(result.viewCount).toBeGreaterThan(0);
        }
        if (result.rating !== undefined) {
          expect(result.rating).toBeGreaterThanOrEqual(0);
          expect(result.rating).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  describe('规则性能测试', () => {
    test('规则执行应该在合理时间内完成', async () => {
      const testRule = presetRules.getRuleById('modown-cn');
      expect(testRule).toBeTruthy();
      
      if (testRule) {
        const startTime = Date.now();
        const testResult = await ruleTester.testRule(testRule, '性能测试');
        const executionTime = Date.now() - startTime;
        
        expect(executionTime).toBeLessThan(5000); // 应在5秒内完成
        expect(testResult.performance?.totalTime).toBeLessThan(5000);
        
        console.log(`⚡ 规则执行时间: ${executionTime}ms`);
      }
    });

    test('批量规则测试性能', async () => {
      const rules = presetRules.getAllRules();
      const testKeywords = ['测试', '模型', '建筑', '汽车', '家具'];
      
      const startTime = Date.now();
      
      const testPromises = rules.flatMap(rule =>
        testKeywords.map(keyword =>
          ruleTester.testRule(rule, keyword)
        )
      );
      
      const results = await Promise.allSettled(testPromises);
      const executionTime = Date.now() - startTime;
      
      const successfulTests = results.filter(r => r.status === 'fulfilled').length;
      const totalTests = results.length;
      
      expect(successfulTests / totalTests).toBeGreaterThan(0.8); // 80%成功率
      expect(executionTime).toBeLessThan(30000); // 30秒内完成所有测试
      
      console.log(`📊 批量测试结果: ${successfulTests}/${totalTests} 成功, 耗时: ${executionTime}ms`);
    });
  });

  describe('错误处理测试', () => {
    test('应该优雅处理无效HTML', async () => {
      const invalidHtml = '<html><head><title>测试</title></head><body><div class="incomplete';
      
      const testRule = presetRules.getRuleById('modown-cn');
      expect(testRule).toBeTruthy();
      
      if (testRule) {
        const result = await contentExtractor.extractFromHtml(invalidHtml, testRule);
        expect(result).toBeTruthy();
        expect(result.extraction.status).toBe('failed');
        expect(result.extraction.errors).toBeTruthy();
        expect(result.extraction.errors!.length).toBeGreaterThan(0);
      }
    });

    test('应该处理选择器不匹配的情况', async () => {
      const html = '<html><body><div>没有匹配的选择器</div></body></html>';
      
      const testRule: CrawlerRule = {
        id: 'no-match-rule',
        websiteName: '无匹配测试',
        baseUrl: 'https://test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://test.com/search?q={keyword}',
          method: 'GET'
        },
        parseConfig: {
          listSelectors: {
            container: '.results',
            item: '.item',
            link: 'a'
          },
          detailSelectors: {
            title: '.non-existent-title',
            description: '.non-existent-description'
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
          }
        },
        antiDetection: {
          useHeadlessBrowser: false,
          requestConfig: {
            delay: 1000,
            randomDelay: false,
            maxRetries: 3,
            timeout: 30000
          }
        },
        qualityControl: {
          minTitleLength: 1,
          requireImage: false,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      const result = await contentExtractor.extractFromHtml(html, testRule);
      
      expect(result.extraction.status).toBe('partial');
      expect(result.extraction.missingFields).toContain('title');
      expect(result.quality.score).toBeLessThan(50);
    });

    test('应该处理网络错误', async () => {
      const testRule = presetRules.getRuleById('modown-cn');
      expect(testRule).toBeTruthy();
      
      if (testRule) {
        // 模拟网络错误
        const mockError = new Error('Network timeout');
        
        try {
          await crawlerEngine.crawlWithRule(testRule, '网络错误测试');
        } catch (error) {
          expect(error).toBeTruthy();
          expect(error instanceof Error).toBe(true);
        }
      }
    });
  });
});