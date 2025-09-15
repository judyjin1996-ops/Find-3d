/**
 * 爬虫任务调度器
 * 负责管理爬虫任务的队列、调度和执行
 */

import { CrawlingTask, CrawlerSearchRequest, CrawlerRule, ExtractedMaterialResult, CrawlingError, CrawlerErrorType } from '../types/crawler';
import { EventEmitter } from 'events';

export interface TaskSchedulerConfig {
  maxConcurrentTasks: number;
  maxQueueSize: number;
  taskTimeout: number; // 任务超时时间（毫秒）
  retryAttempts: number;
  retryDelay: number;
}

export interface TaskProgress {
  taskId: string;
  status: CrawlingTask['status'];
  progress: CrawlingTask['progress'];
  currentWebsite?: string;
  estimatedTimeRemaining?: number;
}

export class TaskScheduler extends EventEmitter {
  private config: TaskSchedulerConfig;
  private taskQueue: CrawlingTask[] = [];
  private activeTasks: Map<string, CrawlingTask> = new Map();
  private completedTasks: Map<string, CrawlingTask> = new Map();
  private taskTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(config: Partial<TaskSchedulerConfig> = {}) {
    super();
    
    this.config = {
      maxConcurrentTasks: 3,
      maxQueueSize: 50,
      taskTimeout: 300000, // 5分钟
      retryAttempts: 3,
      retryDelay: 5000,
      ...config
    };

    console.log('📋 任务调度器初始化完成', this.config);
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ 任务调度器已经在运行');
      return;
    }

    this.isRunning = true;
    console.log('🚀 任务调度器启动');
    this.processQueue();
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // 暂停所有活跃任务
    for (const task of this.activeTasks.values()) {
      this.pauseTask(task.id);
    }

    // 清理超时定时器
    for (const timeout of this.taskTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.taskTimeouts.clear();

    console.log('⏹️ 任务调度器已停止');
  }

  /**
   * 添加新任务到队列
   */
  addTask(request: CrawlerSearchRequest, rules: CrawlerRule[]): string {
    if (this.taskQueue.length >= this.config.maxQueueSize) {
      throw new Error(`任务队列已满，最大容量: ${this.config.maxQueueSize}`);
    }

    const taskId = this.generateTaskId();
    const task: CrawlingTask = {
      id: taskId,
      query: request.query,
      websites: rules.map(r => r.id),
      status: 'pending',
      progress: {
        total: rules.length,
        completed: 0,
        failed: 0
      },
      startTime: new Date(),
      results: [],
      errors: []
    };

    this.taskQueue.push(task);
    
    console.log(`📝 新任务已添加到队列: ${taskId} (${request.query})`);
    this.emit('taskAdded', task);

    // 如果调度器正在运行，尝试处理队列
    if (this.isRunning) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): CrawlingTask | null {
    // 检查活跃任务
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      return { ...activeTask };
    }

    // 检查已完成任务
    const completedTask = this.completedTasks.get(taskId);
    if (completedTask) {
      return { ...completedTask };
    }

    // 检查队列中的任务
    const queuedTask = this.taskQueue.find(task => task.id === taskId);
    if (queuedTask) {
      return { ...queuedTask };
    }

    return null;
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): CrawlingTask[] {
    return Array.from(this.activeTasks.values()).map(task => ({ ...task }));
  }

  /**
   * 获取队列中的任务
   */
  getQueuedTasks(): CrawlingTask[] {
    return this.taskQueue.map(task => ({ ...task }));
  }

  /**
   * 获取已完成的任务
   */
  getCompletedTasks(): CrawlingTask[] {
    return Array.from(this.completedTasks.values()).map(task => ({ ...task }));
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      console.warn(`⚠️ 未找到活跃任务: ${taskId}`);
      return false;
    }

    if (task.status === 'paused') {
      console.warn(`⚠️ 任务已经暂停: ${taskId}`);
      return false;
    }

    task.status = 'paused';
    
    // 清理超时定时器
    const timeout = this.taskTimeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.taskTimeouts.delete(taskId);
    }

    console.log(`⏸️ 任务已暂停: ${taskId}`);
    this.emit('taskPaused', task);
    
    return true;
  }

  /**
   * 恢复任务
   */
  resumeTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      console.warn(`⚠️ 未找到活跃任务: ${taskId}`);
      return false;
    }

    if (task.status !== 'paused') {
      console.warn(`⚠️ 任务未暂停，无法恢复: ${taskId}`);
      return false;
    }

    task.status = 'running';
    
    // 重新设置超时定时器
    this.setTaskTimeout(task);

    console.log(`▶️ 任务已恢复: ${taskId}`);
    this.emit('taskResumed', task);
    
    return true;
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    // 检查活跃任务
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      activeTask.status = 'failed';
      activeTask.errors.push({
        type: CrawlerErrorType.NETWORK_ERROR,
        message: '任务被用户取消',
        timestamp: new Date(),
        websiteId: 'system',
        severity: 'low',
        recoverable: false
      });

      this.completeTask(activeTask);
      console.log(`❌ 活跃任务已取消: ${taskId}`);
      return true;
    }

    // 检查队列中的任务
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.status = 'failed';
      task.errors.push({
        type: CrawlerErrorType.NETWORK_ERROR,
        message: '任务被用户取消',
        timestamp: new Date(),
        websiteId: 'system',
        severity: 'low',
        recoverable: false
      });

      this.completedTasks.set(taskId, task);
      console.log(`❌ 队列任务已取消: ${taskId}`);
      this.emit('taskCancelled', task);
      return true;
    }

    console.warn(`⚠️ 未找到可取消的任务: ${taskId}`);
    return false;
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(taskId: string, progress: Partial<CrawlingTask['progress']>, currentWebsite?: string): void {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return;
    }

    // 更新进度
    Object.assign(task.progress, progress);

    // 计算预计完成时间
    if (task.progress.completed > 0) {
      const elapsed = Date.now() - task.startTime.getTime();
      const avgTimePerWebsite = elapsed / task.progress.completed;
      const remaining = task.progress.total - task.progress.completed;
      task.estimatedEndTime = new Date(Date.now() + (avgTimePerWebsite * remaining));
    }

    // 发送进度更新事件
    this.emit('taskProgress', {
      taskId,
      status: task.status,
      progress: task.progress,
      currentWebsite,
      estimatedTimeRemaining: task.estimatedEndTime ? 
        task.estimatedEndTime.getTime() - Date.now() : undefined
    } as TaskProgress);

    // 检查任务是否完成
    if (task.progress.completed + task.progress.failed >= task.progress.total) {
      task.status = task.progress.failed === task.progress.total ? 'failed' : 'completed';
      this.completeTask(task);
    }
  }

  /**
   * 添加任务结果
   */
  addTaskResult(taskId: string, result: ExtractedMaterialResult): void {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return;
    }

    task.results.push(result);
    this.emit('taskResult', { taskId, result });
  }

  /**
   * 添加任务错误
   */
  addTaskError(taskId: string, error: CrawlingError): void {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return;
    }

    task.errors.push(error);
    this.emit('taskError', { taskId, error });
  }

  /**
   * 获取调度器统计信息
   */
  getStats(): {
    queuedTasks: number;
    activeTasks: number;
    completedTasks: number;
    totalProcessed: number;
    averageProcessingTime: number;
  } {
    const completedTasksArray = Array.from(this.completedTasks.values());
    const totalProcessed = completedTasksArray.length;
    
    let totalProcessingTime = 0;
    for (const task of completedTasksArray) {
      if (task.estimatedEndTime) {
        totalProcessingTime += task.estimatedEndTime.getTime() - task.startTime.getTime();
      }
    }

    return {
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks.size,
      totalProcessed,
      averageProcessingTime: totalProcessed > 0 ? totalProcessingTime / totalProcessed : 0
    };
  }

  /**
   * 清理已完成的任务
   */
  cleanupCompletedTasks(olderThanHours = 24): number {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [taskId, task] of this.completedTasks.entries()) {
      if (task.startTime.getTime() < cutoffTime) {
        this.completedTasks.delete(taskId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 已清理 ${cleaned} 个过期的已完成任务`);
    }

    return cleaned;
  }

  /**
   * 处理任务队列
   */
  private processQueue(): void {
    if (!this.isRunning) {
      return;
    }

    // 检查是否可以启动新任务
    while (
      this.activeTasks.size < this.config.maxConcurrentTasks &&
      this.taskQueue.length > 0
    ) {
      const task = this.taskQueue.shift()!;
      this.startTask(task);
    }

    // 如果还有任务在队列中或正在执行，继续处理
    if (this.taskQueue.length > 0 || this.activeTasks.size > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * 启动任务
   */
  private startTask(task: CrawlingTask): void {
    task.status = 'running';
    task.startTime = new Date();
    
    this.activeTasks.set(task.id, task);
    this.setTaskTimeout(task);

    console.log(`🚀 任务开始执行: ${task.id} (${task.query})`);
    this.emit('taskStarted', task);
  }

  /**
   * 完成任务
   */
  private completeTask(task: CrawlingTask): void {
    // 从活跃任务中移除
    this.activeTasks.delete(task.id);
    
    // 清理超时定时器
    const timeout = this.taskTimeouts.get(task.id);
    if (timeout) {
      clearTimeout(timeout);
      this.taskTimeouts.delete(task.id);
    }

    // 添加到已完成任务
    this.completedTasks.set(task.id, task);

    const statusIcon = task.status === 'completed' ? '✅' : '❌';
    console.log(`${statusIcon} 任务${task.status === 'completed' ? '完成' : '失败'}: ${task.id}`);
    console.log(`📊 结果数量: ${task.results.length}, 错误数量: ${task.errors.length}`);
    
    this.emit('taskCompleted', task);

    // 继续处理队列
    this.processQueue();
  }

  /**
   * 设置任务超时
   */
  private setTaskTimeout(task: CrawlingTask): void {
    const timeout = setTimeout(() => {
      console.warn(`⏰ 任务超时: ${task.id}`);
      
      task.status = 'failed';
      task.errors.push({
        type: CrawlerErrorType.TIMEOUT_ERROR,
        message: `任务执行超时 (${this.config.taskTimeout}ms)`,
        timestamp: new Date(),
        websiteId: 'system',
        severity: 'high',
        recoverable: true
      });

      this.completeTask(task);
    }, this.config.taskTimeout);

    this.taskTimeouts.set(task.id, timeout);
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}