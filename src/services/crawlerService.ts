/**
 * 爬虫服务
 * 为前端应用提供爬虫功能的接口
 */

import { crawlerManager } from '../crawler/manager/CrawlerManager';
import { CrawlerSearchRequest, CrawlerSearchResponse, CrawlingTask, ExtractedMaterialResult, CrawlerRule } from '../crawler/types/crawler';

export class CrawlerService {
  private isInitialized = false;

  /**
   * 初始化爬虫服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await crawlerManager.initialize();
      this.isInitialized = true;
      console.log('✅ 爬虫服务初始化完成');
    } catch (error) {
      console.error('❌ 爬虫服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 搜索3D素材
   */
  async searchMaterials(
    query: string,
    options: {
      websites?: string[];
      mode?: 'fast' | 'comprehensive';
      maxResults?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<CrawlerSearchResponse> {
    await this.ensureInitialized();

    const request: CrawlerSearchRequest = {
      query,
      websites: options.websites,
      mode: options.mode || 'comprehensive',
      maxResults: options.maxResults || 50,
      forceRefresh: options.forceRefresh || false
    };

    return await crawlerManager.search(request);
  }

  /**
   * 获取搜索任务状态
   */
  getSearchTaskStatus(taskId: string): CrawlingTask | null {
    return crawlerManager.getTaskStatus(taskId);
  }

  /**
   * 获取所有活跃的搜索任务
   */
  getActiveSearchTasks(): CrawlingTask[] {
    return crawlerManager.getActiveTasks();
  }

  /**
   * 获取队列中的搜索任务
   */
  getQueuedSearchTasks(): CrawlingTask[] {
    return crawlerManager.getQueuedTasks();
  }

  /**
   * 获取已完成的搜索任务
   */
  getCompletedSearchTasks(): CrawlingTask[] {
    return crawlerManager.getCompletedTasks();
  }

  /**
   * 获取所有搜索任务
   */
  getAllSearchTasks(): CrawlingTask[] {
    return [
      ...this.getActiveSearchTasks(),
      ...this.getQueuedSearchTasks(),
      ...this.getCompletedSearchTasks()
    ];
  }

  /**
   * 暂停搜索任务
   */
  pauseSearchTask(taskId: string): boolean {
    return crawlerManager.pauseTask(taskId);
  }

  /**
   * 恢复搜索任务
   */
  resumeSearchTask(taskId: string): boolean {
    return crawlerManager.resumeTask(taskId);
  }

  /**
   * 取消搜索任务
   */
  cancelSearchTask(taskId: string): boolean {
    return crawlerManager.cancelTask(taskId);
  }

  /**
   * 获取可用的网站列表
   */
  getAvailableWebsites(): Array<{
    id: string;
    name: string;
    icon?: string;
    isActive: boolean;
    isPreset: boolean;
  }> {
    const rules = crawlerManager.getAllRules();
    return rules.map(rule => ({
      id: rule.id,
      name: rule.websiteName,
      icon: rule.websiteIcon,
      isActive: rule.isActive,
      isPreset: rule.isPreset
    }));
  }

  /**
   * 获取激活的网站列表
   */
  getActiveWebsites(): Array<{
    id: string;
    name: string;
    icon?: string;
  }> {
    const rules = crawlerManager.getActiveRules();
    return rules.map(rule => ({
      id: rule.id,
      name: rule.websiteName,
      icon: rule.websiteIcon
    }));
  }

  /**
   * 测试网站规则
   */
  async testWebsiteRule(websiteId: string, testKeyword?: string): Promise<{
    success: boolean;
    results: ExtractedMaterialResult[];
    errors: string[];
    performance: {
      totalTime: number;
      resultCount: number;
    };
  }> {
    await this.ensureInitialized();
    return await crawlerManager.testRule(websiteId, testKeyword);
  }

  /**
   * 添加自定义网站
   */
  async addCustomWebsite(config: {
    websiteName: string;
    baseUrl: string;
    searchUrlTemplate: string;
    selectors: {
      listContainer: string;
      listItem: string;
      listLink: string;
      detailTitle: string;
      detailImages?: string;
      detailPrice?: string;
      detailDescription?: string;
    };
    antiDetection?: {
      delay?: number;
      useHeadlessBrowser?: boolean;
    };
  }): Promise<string> {
    await this.ensureInitialized();

    const rule: Omit<CrawlerRule, 'id'> = {
      websiteName: config.websiteName,
      baseUrl: config.baseUrl,
      isActive: true,
      isPreset: false,
      
      searchConfig: {
        urlTemplate: config.searchUrlTemplate,
        method: 'GET',
        encoding: 'utf-8'
      },
      
      parseConfig: {
        listSelectors: {
          container: config.selectors.listContainer,
          item: config.selectors.listItem,
          link: config.selectors.listLink
        },
        detailSelectors: {
          title: config.selectors.detailTitle,
          images: config.selectors.detailImages || 'img',
          description: config.selectors.detailDescription,
          price: config.selectors.detailPrice
        }
      },
      
      dataProcessing: {
        textCleanup: {
          removeHtml: true,
          trimWhitespace: true,
          removeEmptyLines: true
        },
        priceExtraction: {
          currency: 'CNY',
          freeKeywords: ['免费', 'free', '0元']
        },
        dateProcessing: {
          format: 'YYYY-MM-DD',
          locale: 'zh-CN'
        },
        imageProcessing: {
          baseUrl: config.baseUrl,
          preferredSize: 'medium'
        }
      },
      
      antiDetection: {
        useHeadlessBrowser: config.antiDetection?.useHeadlessBrowser ?? true,
        browserConfig: {
          viewport: { width: 1920, height: 1080 },
          enableJavaScript: true,
          waitTime: 2000
        },
        requestConfig: {
          delay: config.antiDetection?.delay ?? 2000,
          randomDelay: true,
          maxRetries: 3,
          timeout: 30000
        }
      },
      
      qualityControl: {
        minTitleLength: 3,
        requireImage: false,
        requirePrice: false,
        maxResultsPerPage: 20,
        duplicateDetection: true
      },
      
      testing: {
        testKeyword: '测试',
        successRate: 0,
        avgResponseTime: 0
      }
    };

    return await crawlerManager.addCustomRule(rule);
  }

  /**
   * 更新自定义网站配置
   */
  async updateCustomWebsite(websiteId: string, updates: Partial<CrawlerRule>): Promise<void> {
    await this.ensureInitialized();
    await crawlerManager.updateCustomRule(websiteId, updates);
  }

  /**
   * 删除自定义网站
   */
  async deleteCustomWebsite(websiteId: string): Promise<void> {
    await this.ensureInitialized();
    await crawlerManager.deleteCustomRule(websiteId);
  }

  /**
   * 导出网站配置
   */
  exportWebsiteConfigs(websiteIds?: string[]): string {
    return crawlerManager.exportRules(websiteIds);
  }

  /**
   * 导入网站配置
   */
  async importWebsiteConfigs(configData: string, overwrite = false): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    await this.ensureInitialized();
    return await crawlerManager.importRules(configData, overwrite);
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats(): {
    totalWebsites: number;
    activeWebsites: number;
    presetWebsites: number;
    customWebsites: number;
    activeSearchTasks: number;
    queuedSearchTasks: number;
    completedSearchTasks: number;
  } {
    const stats = crawlerManager.getSystemStats();
    return {
      totalWebsites: stats.totalRules,
      activeWebsites: stats.activeRules,
      presetWebsites: stats.presetRules,
      customWebsites: stats.customRules,
      activeSearchTasks: stats.activeTasks,
      queuedSearchTasks: stats.queuedTasks,
      completedSearchTasks: stats.completedTasks
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await crawlerManager.cleanup();
    this.isInitialized = false;
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// 创建全局爬虫服务实例
export const crawlerService = new CrawlerService();

// 默认导出
export default crawlerService;