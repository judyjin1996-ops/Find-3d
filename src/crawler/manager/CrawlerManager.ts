/**
 * 爬虫管理器
 * 统一管理爬虫引擎、规则配置和任务调度
 */

import { CrawlerEngine } from '../engine/CrawlerEngine';
import type { CrawlerRule, CrawlerSearchRequest, CrawlerSearchResponse, CrawlingTask, ExtractedMaterialResult } from '../types/crawler';
import { presetRules, getActivePresetRules, validateRuleConfig } from '../config/presetRules';
import { ErrorHandler } from '../utils/errorHandler';
import { TaskScheduler, TaskSchedulerConfig } from './TaskScheduler';
import { webSocketService } from '../../services/websocketService';

export class CrawlerManager {
  private engine: CrawlerEngine;
  private customRules: CrawlerRule[] = [];
  private errorHandler: ErrorHandler;
  private taskScheduler: TaskScheduler;
  private isInitialized = false;

  constructor(schedulerConfig?: Partial<TaskSchedulerConfig>) {
    this.engine = new CrawlerEngine();
    this.errorHandler = new ErrorHandler();
    this.taskScheduler = new TaskScheduler(schedulerConfig);
    
    // 设置任务调度器事件监听
    this.setupTaskSchedulerEvents();
  }

  /**
   * 初始化爬虫管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ 爬虫管理器已经初始化');
      return;
    }

    try {
      console.log('🚀 初始化爬虫管理器...');
      
      // 初始化爬虫引擎
      await this.engine.initialize();
      
      // 加载自定义规则
      await this.loadCustomRules();
      
      // 启动任务调度器
      this.taskScheduler.start();
      
      // 连接WebSocket服务
      try {
        await webSocketService.connect();
      } catch (error) {
        console.warn('⚠️ WebSocket连接失败，将使用轮询模式:', error);
      }
      
      this.isInitialized = true;
      console.log('✅ 爬虫管理器初始化完成');
      console.log(`📋 已加载 ${this.getAllRules().length} 个爬虫规则`);
    } catch (error) {
      console.error('❌ 爬虫管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行搜索
   */
  async search(request: CrawlerSearchRequest): Promise<CrawlerSearchResponse> {
    if (!this.isInitialized) {
      throw new Error('爬虫管理器未初始化，请先调用 initialize()');
    }

    console.log(`🔍 开始搜索: "${request.query}"`);
    
    // 获取要使用的规则
    const rules = this.getSearchRules(request.websites);
    
    if (rules.length === 0) {
      throw new Error('没有可用的爬虫规则');
    }

    console.log(`📋 使用 ${rules.length} 个爬虫规则: ${rules.map(r => r.websiteName).join(', ')}`);

    // 将任务添加到调度器
    const taskId = this.taskScheduler.addTask(request, rules);
    
    // 返回任务信息
    return {
      taskId,
      status: 'started',
      progress: {
        total: rules.length,
        completed: 0,
        failed: 0
      },
      websiteStatus: {},
      estimatedTime: rules.length * 30 // 预估每个网站30秒
    };
  }

  /**
   * 获取搜索任务状态
   */
  getTaskStatus(taskId: string): CrawlingTask | null {
    return this.taskScheduler.getTaskStatus(taskId);
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): CrawlingTask[] {
    return this.taskScheduler.getActiveTasks();
  }

  /**
   * 获取队列中的任务
   */
  getQueuedTasks(): CrawlingTask[] {
    return this.taskScheduler.getQueuedTasks();
  }

  /**
   * 获取已完成的任务
   */
  getCompletedTasks(): CrawlingTask[] {
    return this.taskScheduler.getCompletedTasks();
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId: string): boolean {
    return this.taskScheduler.pauseTask(taskId);
  }

  /**
   * 恢复任务
   */
  resumeTask(taskId: string): boolean {
    return this.taskScheduler.resumeTask(taskId);
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    return this.taskScheduler.cancelTask(taskId);
  }

  /**
   * 获取所有规则（预设 + 自定义）
   */
  getAllRules(): CrawlerRule[] {
    return [...presetRules, ...this.customRules];
  }

  /**
   * 获取预设规则
   */
  getPresetRules(): CrawlerRule[] {
    return presetRules;
  }

  /**
   * 获取自定义规则
   */
  getCustomRules(): CrawlerRule[] {
    return this.customRules;
  }

  /**
   * 获取激活的规则
   */
  getActiveRules(): CrawlerRule[] {
    return this.getAllRules().filter(rule => rule.isActive);
  }

  /**
   * 添加自定义规则
   */
  async addCustomRule(rule: Omit<CrawlerRule, 'id'>): Promise<string> {
    // 生成唯一ID
    const id = this.generateRuleId(rule.websiteName);
    
    const newRule: CrawlerRule = {
      ...rule,
      id,
      isPreset: false
    };

    // 验证规则配置
    const validation = validateRuleConfig(newRule);
    if (!validation.isValid) {
      throw new Error(`规则配置无效: ${validation.errors.join(', ')}`);
    }

    // 添加到自定义规则列表
    this.customRules.push(newRule);
    
    // 保存到本地存储
    await this.saveCustomRules();
    
    console.log(`✅ 已添加自定义规则: ${newRule.websiteName}`);
    return id;
  }

  /**
   * 更新自定义规则
   */
  async updateCustomRule(id: string, updates: Partial<CrawlerRule>): Promise<void> {
    const ruleIndex = this.customRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      throw new Error(`未找到ID为 ${id} 的自定义规则`);
    }

    // 更新规则
    const updatedRule = { ...this.customRules[ruleIndex], ...updates, id };
    
    // 验证更新后的规则
    const validation = validateRuleConfig(updatedRule);
    if (!validation.isValid) {
      throw new Error(`规则配置无效: ${validation.errors.join(', ')}`);
    }

    this.customRules[ruleIndex] = updatedRule;
    
    // 保存到本地存储
    await this.saveCustomRules();
    
    console.log(`✅ 已更新自定义规则: ${updatedRule.websiteName}`);
  }

  /**
   * 删除自定义规则
   */
  async deleteCustomRule(id: string): Promise<void> {
    const ruleIndex = this.customRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      throw new Error(`未找到ID为 ${id} 的自定义规则`);
    }

    const deletedRule = this.customRules.splice(ruleIndex, 1)[0];
    
    // 保存到本地存储
    await this.saveCustomRules();
    
    console.log(`✅ 已删除自定义规则: ${deletedRule.websiteName}`);
  }

  /**
   * 测试规则
   */
  async testRule(ruleId: string, testKeyword?: string): Promise<{
    success: boolean;
    results: ExtractedMaterialResult[];
    errors: string[];
    performance: {
      totalTime: number;
      resultCount: number;
    };
  }> {
    const rule = this.getAllRules().find(r => r.id === ruleId);
    if (!rule) {
      throw new Error(`未找到ID为 ${ruleId} 的规则`);
    }

    const keyword = testKeyword || rule.testing.testKeyword;
    const startTime = Date.now();

    try {
      console.log(`🧪 测试规则 ${rule.websiteName}，关键词: ${keyword}`);
      
      const response = await this.engine.search({
        query: keyword,
        websites: [ruleId],
        mode: 'fast',
        maxResults: 5
      }, [rule]);

      // 等待任务完成
      let task = this.engine.getTaskStatus(response.taskId);
      while (task && task.status === 'running') {
        await this.delay(1000);
        task = this.engine.getTaskStatus(response.taskId);
      }

      const totalTime = Date.now() - startTime;
      const success = task?.status === 'completed' && task.results.length > 0;
      
      console.log(`${success ? '✅' : '❌'} 规则测试${success ? '成功' : '失败'}: ${rule.websiteName}`);
      
      return {
        success,
        results: task?.results || [],
        errors: task?.errors.map(e => e.message) || [],
        performance: {
          totalTime,
          resultCount: task?.results.length || 0
        }
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ 规则测试失败: ${rule.websiteName}`, error);
      
      return {
        success: false,
        results: [],
        errors: [error instanceof Error ? error.message : String(error)],
        performance: {
          totalTime,
          resultCount: 0
        }
      };
    }
  }

  /**
   * 导出规则配置
   */
  exportRules(ruleIds?: string[]): string {
    const rulesToExport = ruleIds 
      ? this.getAllRules().filter(rule => ruleIds.includes(rule.id))
      : this.getCustomRules();

    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      rules: rulesToExport
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入规则配置
   */
  async importRules(configData: string, overwrite = false): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const importData = JSON.parse(configData);
      const rules = importData.rules as CrawlerRule[];
      
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const rule of rules) {
        try {
          // 检查是否已存在
          const existingRule = this.customRules.find(r => r.id === rule.id);
          
          if (existingRule && !overwrite) {
            skipped++;
            continue;
          }

          // 验证规则
          const validation = validateRuleConfig(rule);
          if (!validation.isValid) {
            errors.push(`规则 ${rule.websiteName}: ${validation.errors.join(', ')}`);
            continue;
          }

          // 添加或更新规则
          if (existingRule) {
            await this.updateCustomRule(rule.id, rule);
          } else {
            // 确保不是预设规则
            rule.isPreset = false;
            this.customRules.push(rule);
          }
          
          imported++;
        } catch (error) {
          errors.push(`规则 ${rule.websiteName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // 保存更改
      if (imported > 0) {
        await this.saveCustomRules();
      }

      console.log(`📥 导入完成: 成功 ${imported} 个，跳过 ${skipped} 个，错误 ${errors.length} 个`);

      return { imported, skipped, errors };
    } catch (error) {
      throw new Error(`导入失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats(): {
    totalRules: number;
    activeRules: number;
    presetRules: number;
    customRules: number;
    activeTasks: number;
    queuedTasks: number;
    completedTasks: number;
  } {
    const allRules = this.getAllRules();
    const schedulerStats = this.taskScheduler.getStats();
    
    return {
      totalRules: allRules.length,
      activeRules: allRules.filter(r => r.isActive).length,
      presetRules: presetRules.length,
      customRules: this.customRules.length,
      activeTasks: schedulerStats.activeTasks,
      queuedTasks: schedulerStats.queuedTasks,
      completedTasks: schedulerStats.completedTasks
    };
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    // 停止任务调度器
    this.taskScheduler.stop();
    
    // 断开WebSocket连接
    webSocketService.disconnect();
    
    // 清理爬虫引擎
    await this.engine.cleanup();
    
    this.isInitialized = false;
    console.log('🧹 爬虫管理器资源清理完成');
  }

  /**
   * 获取搜索使用的规则
   */
  private getSearchRules(websiteIds?: string[]): CrawlerRule[] {
    const allRules = this.getActiveRules();
    
    if (!websiteIds || websiteIds.length === 0) {
      return allRules;
    }
    
    return allRules.filter(rule => websiteIds.includes(rule.id));
  }

  /**
   * 生成规则ID
   */
  private generateRuleId(websiteName: string): string {
    const baseId = websiteName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    
    let id = baseId;
    let counter = 1;
    
    while (this.getAllRules().some(rule => rule.id === id)) {
      id = `${baseId}_${counter}`;
      counter++;
    }
    
    return id;
  }

  /**
   * 加载自定义规则
   */
  private async loadCustomRules(): Promise<void> {
    try {
      const stored = localStorage.getItem('crawler_custom_rules');
      if (stored) {
        this.customRules = JSON.parse(stored);
        console.log(`📋 已加载 ${this.customRules.length} 个自定义规则`);
      }
    } catch (error) {
      console.warn('⚠️ 加载自定义规则失败:', error);
      this.customRules = [];
    }
  }

  /**
   * 保存自定义规则
   */
  private async saveCustomRules(): Promise<void> {
    try {
      localStorage.setItem('crawler_custom_rules', JSON.stringify(this.customRules));
    } catch (error) {
      console.error('❌ 保存自定义规则失败:', error);
      throw error;
    }
  }

  /**
   * 设置任务调度器事件监听
   */
  private setupTaskSchedulerEvents(): void {
    // 任务开始事件
    this.taskScheduler.on('taskStarted', (task: CrawlingTask) => {
      console.log(`🚀 任务开始: ${task.id}`);
      webSocketService.send({
        type: 'task_started',
        taskId: task.id,
        data: task
      });
      
      // 开始执行实际的爬虫任务
      this.executeTask(task);
    });

    // 任务进度更新事件
    this.taskScheduler.on('taskProgress', (progress: any) => {
      webSocketService.send({
        type: 'task_progress',
        taskId: progress.taskId,
        data: progress
      });
    });

    // 任务完成事件
    this.taskScheduler.on('taskCompleted', (task: CrawlingTask) => {
      console.log(`✅ 任务完成: ${task.id}`);
      webSocketService.send({
        type: 'task_completed',
        taskId: task.id,
        data: task
      });
    });

    // 任务暂停事件
    this.taskScheduler.on('taskPaused', (task: CrawlingTask) => {
      console.log(`⏸️ 任务暂停: ${task.id}`);
      webSocketService.send({
        type: 'task_paused',
        taskId: task.id,
        data: task
      });
    });

    // 任务恢复事件
    this.taskScheduler.on('taskResumed', (task: CrawlingTask) => {
      console.log(`▶️ 任务恢复: ${task.id}`);
      webSocketService.send({
        type: 'task_resumed',
        taskId: task.id,
        data: task
      });
    });

    // 任务取消事件
    this.taskScheduler.on('taskCancelled', (task: CrawlingTask) => {
      console.log(`❌ 任务取消: ${task.id}`);
      webSocketService.send({
        type: 'task_cancelled',
        taskId: task.id,
        data: task
      });
    });

    // 任务结果事件
    this.taskScheduler.on('taskResult', (data: any) => {
      webSocketService.send({
        type: 'task_result',
        taskId: data.taskId,
        data: data
      });
    });

    // 任务错误事件
    this.taskScheduler.on('taskError', (data: any) => {
      webSocketService.send({
        type: 'task_error',
        taskId: data.taskId,
        data: data
      });
    });
  }

  /**
   * 执行爬虫任务
   */
  private async executeTask(task: CrawlingTask): Promise<void> {
    try {
      // 获取任务对应的规则
      const rules = this.getSearchRules(task.websites);
      
      // 创建搜索请求
      const request: CrawlerSearchRequest = {
        query: task.query,
        websites: task.websites,
        mode: 'comprehensive',
        maxResults: 50
      };

      // 逐个网站执行爬虫
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        
        // 检查任务是否被暂停或取消
        const currentTask = this.taskScheduler.getTaskStatus(task.id);
        if (!currentTask || currentTask.status === 'paused') {
          console.log(`⏸️ 任务暂停，停止执行: ${task.id}`);
          return;
        }
        if (currentTask.status === 'failed') {
          console.log(`❌ 任务已取消，停止执行: ${task.id}`);
          return;
        }

        try {
          console.log(`🔍 正在爬取网站: ${rule.websiteName}`);
          
          // 更新当前处理的网站
          this.taskScheduler.updateTaskProgress(task.id, {}, rule.websiteName);
          
          // 执行单个网站的爬虫
          const siteResults = await this.engine.crawlSingleSite(request, rule);
          
          // 添加结果到任务
          for (const result of siteResults) {
            this.taskScheduler.addTaskResult(task.id, result);
          }
          
          // 更新进度
          this.taskScheduler.updateTaskProgress(task.id, {
            completed: i + 1
          });
          
          console.log(`✅ 网站爬取完成: ${rule.websiteName}, 结果数: ${siteResults.length}`);
          
        } catch (error) {
          console.error(`❌ 网站爬取失败: ${rule.websiteName}`, error);
          
          // 添加错误到任务
          this.taskScheduler.addTaskError(task.id, {
            type: 'NETWORK_ERROR' as any,
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
            websiteId: rule.id,
            ruleId: rule.id,
            severity: 'medium',
            recoverable: true
          });
          
          // 更新失败进度
          this.taskScheduler.updateTaskProgress(task.id, {
            failed: (currentTask?.progress.failed || 0) + 1
          });
        }
        
        // 添加延迟避免过于频繁的请求
        if (i < rules.length - 1) {
          await this.delay(rule.antiDetection.requestConfig.delay);
        }
      }
      
    } catch (error) {
      console.error(`❌ 任务执行失败: ${task.id}`, error);
      
      // 添加系统错误
      this.taskScheduler.addTaskError(task.id, {
        type: 'NETWORK_ERROR' as any,
        message: `任务执行失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        websiteId: 'system',
        severity: 'critical',
        recoverable: false
      });
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建全局爬虫管理器实例
export const crawlerManager = new CrawlerManager();