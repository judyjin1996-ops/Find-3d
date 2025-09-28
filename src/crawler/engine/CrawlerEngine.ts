/**
 * 爬虫引擎核心类
 * 负责协调整个爬虫流程
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import type { CrawlerRule, CrawlingTask, ExtractedMaterialResult, CrawlerSearchRequest, CrawlerSearchResponse, CrawlingError, CrawlerErrorType } from '../types/crawler';
import { ContentExtractor } from './ContentExtractor';
import { AntiDetection } from './AntiDetection';
import { ErrorHandler } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/performanceMonitor';

export class CrawlerEngine {
  private browser: Browser | null = null;
  private activeTasks: Map<string, CrawlingTask> = new Map();
  private contentExtractor: ContentExtractor;
  private antiDetection: AntiDetection;
  private errorHandler: ErrorHandler;

  constructor() {
    this.contentExtractor = new ContentExtractor();
    this.antiDetection = new AntiDetection();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * 初始化爬虫引擎
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 初始化爬虫引擎...');
      
      // 启动浏览器实例
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      console.log('✅ 爬虫引擎初始化完成');
    } catch (error) {
      console.error('❌ 爬虫引擎初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行搜索任务
   */
  async search(request: CrawlerSearchRequest, rules: CrawlerRule[]): Promise<CrawlerSearchResponse> {
    const taskId = this.generateTaskId();
    const task: CrawlingTask = {
      id: taskId,
      query: request.query,
      websites: request.websites || rules.map(r => r.id),
      status: 'pending',
      progress: {
        total: 0,
        completed: 0,
        failed: 0
      },
      startTime: new Date(),
      results: [],
      errors: []
    };

    this.activeTasks.set(taskId, task);

    // 异步执行爬取任务
    this.executeCrawlingTask(task, rules, request).catch(error => {
      console.error('爬取任务执行失败:', error);
      task.status = 'failed';
      task.errors.push(this.errorHandler.createError(
        CrawlerErrorType.NETWORK_ERROR,
        '爬取任务执行失败',
        { error: error.message }
      ));
    });

    return {
      taskId,
      status: 'started',
      progress: task.progress,
      websiteStatus: {},
      estimatedTime: this.estimateCompletionTime(rules.length)
    };
  }

  /**
   * 执行爬取任务
   */
  private async executeCrawlingTask(
    task: CrawlingTask, 
    rules: CrawlerRule[], 
    request: CrawlerSearchRequest
  ): Promise<void> {
    task.status = 'running';
    
    // 过滤激活的规则
    const activeRules = rules.filter(rule => 
      rule.isActive && 
      (!request.websites || request.websites.includes(rule.id))
    );

    task.progress.total = activeRules.length;

    console.log(`🔍 开始搜索 "${request.query}"，目标网站: ${activeRules.length} 个`);

    // 并发爬取多个网站
    const crawlPromises = activeRules.map(rule => 
      this.crawlWebsite(task, rule, request.query, request.maxResults)
    );

    await Promise.allSettled(crawlPromises);

    task.status = 'completed';
    task.estimatedEndTime = new Date();
    
    console.log(`✅ 搜索完成，共获取 ${task.results.length} 个结果`);
  }

  /**
   * 爬取单个网站
   */
  private async crawlWebsite(
    task: CrawlingTask,
    rule: CrawlerRule,
    query: string,
    maxResults?: number
  ): Promise<void> {
    let page: Page | null = null;
    const taskMetricId = `${task.id}_${rule.id}`;
    
    // 开始性能监控
    performanceMonitor.startTask(taskMetricId, rule.id);
    
    try {
      console.log(`🌐 开始爬取 ${rule.websiteName}...`);

      if (!this.browser) {
        throw new Error('浏览器实例未初始化');
      }

      // 创建新页面
      page = await this.browser.newPage();
      
      // 应用反爬虫策略
      await this.antiDetection.setupPage(page, rule.antiDetection);

      // 构建搜索URL
      const searchUrl = this.buildSearchUrl(rule.searchConfig.urlTemplate, query);
      console.log(`📍 访问搜索页面: ${searchUrl}`);

      // 访问搜索页面
      const requestStart = Date.now();
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: rule.antiDetection.requestConfig.timeout 
      });
      const requestTime = Date.now() - requestStart;
      
      // 记录网络请求性能
      performanceMonitor.recordNetworkRequest(taskMetricId, true, requestTime);

      // 等待页面加载
      if (rule.antiDetection.browserConfig?.waitForSelector) {
        await page.waitForSelector(rule.antiDetection.browserConfig.waitForSelector, {
          timeout: 10000
        });
      }

      // 提取搜索结果链接
      const resultLinks = await this.extractResultLinks(page, rule);
      console.log(`🔗 找到 ${resultLinks.length} 个结果链接`);

      // 限制结果数量
      const linksToProcess = maxResults ? resultLinks.slice(0, maxResults) : resultLinks;

      // 爬取详情页面
      let validResults = 0;
      for (const link of linksToProcess) {
        try {
          const parseStart = Date.now();
          const result = await this.crawlDetailPage(page, link, rule);
          const parseTime = Date.now() - parseStart;
          
          if (result) {
            task.results.push(result);
            validResults++;
          }
          
          // 记录解析性能
          performanceMonitor.recordPageParse(taskMetricId, parseTime, result ? 1 : 0, !result);
          
          // 添加延迟避免被封
          await this.delay(rule.antiDetection.requestConfig.delay);
        } catch (error) {
          console.warn(`⚠️ 爬取详情页失败: ${link}`, error);
          
          // 记录网络请求失败
          performanceMonitor.recordNetworkRequest(taskMetricId, false, 0);
          
          task.errors.push(this.errorHandler.createError(
            CrawlerErrorType.PARSE_ERROR,
            `爬取详情页失败: ${link}`,
            { url: link, error: error instanceof Error ? error.message : String(error) }
          ));
        }
      }

      // 记录结果指标
      const qualityScore = this.calculateOverallQualityScore(task.results.slice(-validResults));
      performanceMonitor.recordResults(taskMetricId, linksToProcess.length, validResults, 0, qualityScore);

      task.progress.completed++;
      console.log(`✅ ${rule.websiteName} 爬取完成，获取 ${validResults} 个有效结果`);

    } catch (error) {
      task.progress.failed++;
      console.error(`❌ ${rule.websiteName} 爬取失败:`, error);
      
      // 记录网络请求失败
      performanceMonitor.recordNetworkRequest(taskMetricId, false, 0);
      
      task.errors.push(this.errorHandler.createError(
        CrawlerErrorType.NETWORK_ERROR,
        `${rule.websiteName} 爬取失败`,
        { 
          websiteId: rule.id,
          error: error instanceof Error ? error.message : String(error)
        }
      ));
      
      // 完成性能监控（失败）
      performanceMonitor.finishTask(taskMetricId, false);
    } finally {
      if (page) {
        await page.close();
      }
      
      // 如果没有在catch中调用，则在这里完成性能监控（成功）
      if (task.progress.failed === 0) {
        performanceMonitor.finishTask(taskMetricId, true);
      }
    }
  }

  /**
   * 提取搜索结果链接
   */
  private async extractResultLinks(page: Page, rule: CrawlerRule): Promise<string[]> {
    try {
      const links = await page.evaluate((selectors, baseUrl, websiteName) => {
        console.log(`开始提取 ${websiteName} 的搜索结果链接`);
        console.log('选择器配置:', selectors);
        
        // 尝试多个容器选择器
        const containerSelectors = selectors.container.split(',').map(s => s.trim());
        let container = null;
        
        for (const selector of containerSelectors) {
          try {
            container = document.querySelector(selector);
            if (container) {
              console.log(`找到容器元素: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`容器选择器无效: ${selector}`);
          }
        }
        
        if (!container) {
          console.log('未找到指定容器，使用整个页面作为容器');
          container = document.body;
        }

        // 尝试多个项目选择器
        const itemSelectors = selectors.item.split(',').map(s => s.trim());
        let items: NodeListOf<Element> | null = null;
        
        for (const selector of itemSelectors) {
          try {
            items = container.querySelectorAll(selector);
            if (items.length > 0) {
              console.log(`找到 ${items.length} 个项目元素: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`项目选择器无效: ${selector}`);
          }
        }
        
        if (!items || items.length === 0) {
          console.log('未找到文章项目元素，尝试通用选择器');
          // 尝试通用的文章选择器
          const fallbackSelectors = [
            'article',
            '.post',
            '.entry',
            '[class*="post"]',
            '[class*="entry"]',
            '[class*="item"]',
            'h2 a[href*="archives"]',
            'h3 a[href*="archives"]',
            'a[href*="archives"]'
          ];
          
          for (const fallback of fallbackSelectors) {
            try {
              items = container.querySelectorAll(fallback);
              if (items.length > 0) {
                console.log(`通过通用选择器找到 ${items.length} 个元素: ${fallback}`);
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        if (!items || items.length === 0) {
          console.log('完全未找到任何项目元素');
          return [];
        }

        const links: string[] = [];
        const linkSelectors = selectors.link.split(',').map(s => s.trim());
        
        // 添加通用链接选择器作为备选
        const fallbackLinkSelectors = [
          'a[href*="archives"]',
          'h2 a',
          'h3 a',
          '.title a',
          '.entry-title a',
          '.post-title a',
          'a'
        ];
        
        const allLinkSelectors = [...linkSelectors, ...fallbackLinkSelectors];

        items.forEach((item, index) => {
          let foundLink = false;
          
          for (const linkSelector of allLinkSelectors) {
            if (foundLink) break;
            
            try {
              const linkElements = item.querySelectorAll(linkSelector) as NodeListOf<HTMLAnchorElement>;
              
              for (const linkElement of linkElements) {
                let href = linkElement.href || linkElement.getAttribute('href');
                
                if (href) {
                  // 处理相对链接
                  if (href.startsWith('/')) {
                    href = baseUrl.replace(/\/$/, '') + href;
                  } else if (href.startsWith('./')) {
                    href = baseUrl.replace(/\/$/, '') + href.substring(1);
                  } else if (!href.startsWith('http')) {
                    href = baseUrl.replace(/\/$/, '') + '/' + href;
                  }
                  
                  // 验证链接是否有效
                  const isValidLink = href.startsWith('http') && (
                    href.includes('/archives/') || 
                    href.includes('archives') ||
                    href.includes('/post/') ||
                    href.includes('/item/') ||
                    href.includes('/detail/') ||
                    (href.includes(baseUrl.replace(/https?:\/\//, '').replace(/\/$/, '')) && 
                     href !== baseUrl && 
                     !href.includes('#') && 
                     !href.includes('javascript:') &&
                     !href.includes('mailto:'))
                  );
                  
                  if (isValidLink && !links.includes(href)) {
                    console.log(`找到有效链接 [${index}]: ${href}`);
                    links.push(href);
                    foundLink = true;
                    break;
                  }
                }
              }
            } catch (e) {
              console.log(`链接选择器错误: ${linkSelector}`, e);
            }
          }
        });

        console.log(`总共找到 ${links.length} 个有效链接`);
        return links;
      }, rule.parseConfig.listSelectors, rule.baseUrl, rule.websiteName);

      // 进一步过滤和验证链接
      const validLinks = links.filter(link => {
        if (!link || !link.startsWith('http')) return false;
        
        try {
          const url = new URL(link);
          const baseUrl = new URL(rule.baseUrl);
          
          // 确保是目标网站的链接
          if (url.hostname !== baseUrl.hostname) return false;
          
          // 排除一些明显不是内容页的链接
          const excludePatterns = [
            '/category/',
            '/tag/',
            '/author/',
            '/page/',
            '/search',
            '/login',
            '/register',
            '/admin',
            '#comment',
            '#respond'
          ];
          
          return !excludePatterns.some(pattern => link.includes(pattern));
        } catch {
          return false;
        }
      });

      console.log(`✅ 最终提取到 ${validLinks.length} 个有效链接`);
      
      // 去重并限制数量
      const uniqueLinks = [...new Set(validLinks)];
      return uniqueLinks.slice(0, 20);
    } catch (error) {
      console.error('提取搜索结果链接失败:', error);
      return [];
    }
  }

  /**
   * 爬取详情页面
   */
  private async crawlDetailPage(
    page: Page,
    url: string,
    rule: CrawlerRule
  ): Promise<ExtractedMaterialResult | null> {
    try {
      console.log(`📄 爬取详情页: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: rule.antiDetection.requestConfig.timeout 
      });

      // 使用内容提取器提取数据
      const extractedData = await this.contentExtractor.extractFromPage(page, rule);
      
      if (!extractedData) {
        return null;
      }

      // 构建结果对象
      const result: ExtractedMaterialResult = {
        id: this.generateResultId(url),
        title: extractedData.title || '未知标题',
        description: extractedData.description,
        sourceWebsite: rule.websiteName,
        sourceUrl: url,
        previewImages: extractedData.images || [],
        pricing: {
          isFree: extractedData.isFree || false,
          price: extractedData.price,
          currency: rule.dataProcessing.priceExtraction.currency || 'CNY',
          priceText: extractedData.priceText
        },
        fileInfo: {
          format: extractedData.fileFormat,
          size: extractedData.fileSize
        },
        statistics: {
          downloadCount: extractedData.downloadCount,
          viewCount: extractedData.viewCount,
          rating: extractedData.rating,
          reviewCount: extractedData.reviewCount
        },
        categorization: {
          category: extractedData.category,
          tags: extractedData.tags || [],
          keywords: []
        },
        author: extractedData.author ? {
          name: extractedData.author,
          profileUrl: extractedData.authorUrl,
          avatar: extractedData.authorAvatar
        } : undefined,
        timestamps: {
          uploadDate: extractedData.uploadDate,
          extractedAt: new Date()
        },
        extraction: {
          ruleId: rule.id,
          status: 'success',
          confidence: this.calculateConfidence(extractedData),
          missingFields: this.findMissingFields(extractedData),
          processingTime: 0 // TODO: 实际计算处理时间
        },
        quality: {
          score: this.calculateQualityScore(extractedData),
          factors: {
            completeness: this.calculateCompleteness(extractedData),
            imageQuality: extractedData.images?.length ? 80 : 0,
            dataAccuracy: 85 // TODO: 实际计算数据准确性
          }
        }
      };

      return result;
    } catch (error) {
      console.error(`爬取详情页失败: ${url}`, error);
      return null;
    }
  }

  /**
   * 构建搜索URL
   */
  private buildSearchUrl(template: string, query: string): string {
    return template.replace('{keyword}', encodeURIComponent(query));
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成结果ID
   */
  private generateResultId(url: string): string {
    return `result_${Date.now()}_${url.split('/').pop() || 'unknown'}`;
  }

  /**
   * 估算完成时间
   */
  private estimateCompletionTime(websiteCount: number): number {
    // 每个网站预计30秒
    return websiteCount * 30;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 计算提取置信度
   */
  private calculateConfidence(data: any): number {
    let score = 0;
    let total = 0;

    // 检查关键字段
    const keyFields = ['title', 'images', 'price'];
    keyFields.forEach(field => {
      total++;
      if (data[field]) score++;
    });

    return total > 0 ? score / total : 0;
  }

  /**
   * 查找缺失字段
   */
  private findMissingFields(data: any): string[] {
    const requiredFields = ['title', 'images'];
    return requiredFields.filter(field => !data[field]);
  }

  /**
   * 计算质量评分
   */
  private calculateQualityScore(data: any): number {
    let score = 0;
    
    // 标题质量 (30分)
    if (data.title && data.title.length > 5) score += 30;
    
    // 图片质量 (25分)
    if (data.images && data.images.length > 0) score += 25;
    
    // 价格信息 (20分)
    if (data.price !== undefined || data.isFree) score += 20;
    
    // 描述信息 (15分)
    if (data.description && data.description.length > 10) score += 15;
    
    // 其他信息 (10分)
    if (data.fileFormat || data.downloadCount || data.rating) score += 10;
    
    return score;
  }

  /**
   * 计算完整性
   */
  private calculateCompleteness(data: any): number {
    const allFields = ['title', 'description', 'images', 'price', 'fileFormat', 'downloadCount'];
    const presentFields = allFields.filter(field => data[field] !== undefined);
    return (presentFields.length / allFields.length) * 100;
  }

  /**
   * 计算整体质量评分
   */
  private calculateOverallQualityScore(results: ExtractedMaterialResult[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.quality.score, 0);
    return totalScore / results.length;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): CrawlingTask | null {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): CrawlingTask[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * 爬取单个网站（用于任务调度器）
   */
  async crawlSingleSite(request: CrawlerSearchRequest, rule: CrawlerRule): Promise<ExtractedMaterialResult[]> {
    let page: Page | null = null;
    const results: ExtractedMaterialResult[] = [];
    
    try {
      console.log(`🌐 开始爬取单个网站: ${rule.websiteName}`);

      if (!this.browser) {
        throw new Error('浏览器实例未初始化');
      }

      // 创建新页面
      page = await this.browser.newPage();
      
      // 应用反爬虫策略
      await this.antiDetection.setupPage(page, rule.antiDetection);

      // 构建搜索URL
      const searchUrl = this.buildSearchUrl(rule.searchConfig.urlTemplate, request.query);
      console.log(`📍 访问搜索页面: ${searchUrl}`);

      // 访问搜索页面
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: rule.antiDetection.requestConfig.timeout 
      });

      // 等待页面加载
      if (rule.antiDetection.browserConfig?.waitForSelector) {
        await page.waitForSelector(rule.antiDetection.browserConfig.waitForSelector, {
          timeout: 10000
        });
      }

      // 提取搜索结果链接
      const resultLinks = await this.extractResultLinks(page, rule);
      console.log(`🔗 找到 ${resultLinks.length} 个结果链接`);

      // 限制结果数量
      const linksToProcess = request.maxResults ? resultLinks.slice(0, request.maxResults) : resultLinks;

      // 爬取详情页面
      for (const link of linksToProcess) {
        try {
          const result = await this.crawlDetailPage(page, link, rule);
          if (result) {
            results.push(result);
          }
          
          // 添加延迟避免被封
          await this.delay(rule.antiDetection.requestConfig.delay);
        } catch (error) {
          console.warn(`⚠️ 爬取详情页失败: ${link}`, error);
        }
      }

      console.log(`✅ ${rule.websiteName} 单站爬取完成，获取 ${results.length} 个有效结果`);
      return results;

    } catch (error) {
      console.error(`❌ ${rule.websiteName} 单站爬取失败:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.activeTasks.clear();
    console.log('🧹 爬虫引擎资源清理完成');
  }
}