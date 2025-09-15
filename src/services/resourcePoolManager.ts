/**
 * 资源池管理器
 * 管理并发控制、连接池和资源分配
 */

export interface ResourcePool<T> {
  id: string;
  name: string;
  maxSize: number;
  currentSize: number;
  available: T[];
  inUse: Map<string, { resource: T; acquiredAt: Date; usageCount: number }>;
  waitingQueue: Array<{
    id: string;
    resolve: (resource: T) => void;
    reject: (error: Error) => void;
    requestedAt: Date;
    timeout?: NodeJS.Timeout;
  }>;
  factory: () => Promise<T>;
  validator: (resource: T) => Promise<boolean>;
  destroyer: (resource: T) => Promise<void>;
  stats: ResourcePoolStats;
}

export interface ResourcePoolStats {
  totalCreated: number;
  totalDestroyed: number;
  totalAcquired: number;
  totalReleased: number;
  currentWaiting: number;
  avgWaitTime: number;
  avgUsageTime: number;
  peakUsage: number;
  errorCount: number;
}

export interface ConcurrencyLimiter {
  id: string;
  name: string;
  maxConcurrency: number;
  currentConcurrency: number;
  queue: Array<{
    id: string;
    execute: () => Promise<any>;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    priority: number;
    requestedAt: Date;
  }>;
  stats: {
    totalExecuted: number;
    totalQueued: number;
    avgExecutionTime: number;
    avgQueueTime: number;
  };
}

export interface LoadBalancer<T> {
  id: string;
  name: string;
  resources: T[];
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  currentIndex: number;
  weights?: Map<T, number>;
  connections?: Map<T, number>;
  stats: Map<T, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    lastUsed: Date;
  }>;
}

export class ResourcePoolManager {
  private pools = new Map<string, ResourcePool<any>>();
  private limiters = new Map<string, ConcurrencyLimiter>();
  private balancers = new Map<string, LoadBalancer<any>>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.startMonitoring();
  }

  /**
   * 创建资源池
   */
  createPool<T>(
    id: string,
    name: string,
    options: {
      maxSize: number;
      minSize?: number;
      factory: () => Promise<T>;
      validator?: (resource: T) => Promise<boolean>;
      destroyer?: (resource: T) => Promise<void>;
      acquireTimeout?: number;
      idleTimeout?: number;
    }
  ): void {
    if (this.pools.has(id)) {
      throw new Error(`资源池已存在: ${id}`);
    }

    const pool: ResourcePool<T> = {
      id,
      name,
      maxSize: options.maxSize,
      currentSize: 0,
      available: [],
      inUse: new Map(),
      waitingQueue: [],
      factory: options.factory,
      validator: options.validator || (() => Promise.resolve(true)),
      destroyer: options.destroyer || (() => Promise.resolve()),
      stats: {
        totalCreated: 0,
        totalDestroyed: 0,
        totalAcquired: 0,
        totalReleased: 0,
        currentWaiting: 0,
        avgWaitTime: 0,
        avgUsageTime: 0,
        peakUsage: 0,
        errorCount: 0
      }
    };

    this.pools.set(id, pool);

    // 预创建最小数量的资源
    const minSize = options.minSize || Math.min(2, options.maxSize);
    this.preCreateResources(pool, minSize);

    console.log(`📦 创建资源池: ${name} (${id}), 最大大小: ${options.maxSize}`);
  }

  /**
   * 预创建资源
   */
  private async preCreateResources<T>(pool: ResourcePool<T>, count: number): Promise<void> {
    const promises = Array.from({ length: count }, () => this.createResource(pool));
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn(`预创建资源失败: ${pool.name}`, error);
    }
  }

  /**
   * 创建资源
   */
  private async createResource<T>(pool: ResourcePool<T>): Promise<T> {
    try {
      const resource = await pool.factory();
      pool.available.push(resource);
      pool.currentSize++;
      pool.stats.totalCreated++;
      
      console.log(`✅ 创建资源成功: ${pool.name}, 当前大小: ${pool.currentSize}`);
      return resource;
    } catch (error) {
      pool.stats.errorCount++;
      console.error(`❌ 创建资源失败: ${pool.name}`, error);
      throw error;
    }
  }

  /**
   * 获取资源
   */
  async acquireResource<T>(poolId: string, timeout = 30000): Promise<T> {
    const pool = this.pools.get(poolId) as ResourcePool<T>;
    if (!pool) {
      throw new Error(`资源池不存在: ${poolId}`);
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // 尝试从可用资源中获取
    if (pool.available.length > 0) {
      const resource = pool.available.shift()!;
      
      // 验证资源有效性
      try {
        const isValid = await pool.validator(resource);
        if (isValid) {
          pool.inUse.set(requestId, {
            resource,
            acquiredAt: new Date(),
            usageCount: 1
          });
          
          pool.stats.totalAcquired++;
          pool.stats.peakUsage = Math.max(pool.stats.peakUsage, pool.inUse.size);
          
          return resource;
        } else {
          // 资源无效，销毁并重新创建
          await this.destroyResource(pool, resource);
        }
      } catch (error) {
        console.warn(`资源验证失败: ${pool.name}`, error);
        await this.destroyResource(pool, resource);
      }
    }

    // 如果池未满，尝试创建新资源
    if (pool.currentSize < pool.maxSize) {
      try {
        const resource = await this.createResource(pool);
        pool.inUse.set(requestId, {
          resource,
          acquiredAt: new Date(),
          usageCount: 1
        });
        
        pool.stats.totalAcquired++;
        pool.stats.peakUsage = Math.max(pool.stats.peakUsage, pool.inUse.size);
        
        return resource;
      } catch (error) {
        // 创建失败，继续等待
      }
    }

    // 需要等待资源释放
    return new Promise<T>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        // 从等待队列中移除
        const index = pool.waitingQueue.findIndex(item => item.id === requestId);
        if (index >= 0) {
          pool.waitingQueue.splice(index, 1);
        }
        
        reject(new Error(`获取资源超时: ${pool.name} (${timeout}ms)`));
      }, timeout);

      pool.waitingQueue.push({
        id: requestId,
        resolve: (resource: T) => {
          clearTimeout(timeoutHandle);
          
          pool.inUse.set(requestId, {
            resource,
            acquiredAt: new Date(),
            usageCount: 1
          });
          
          pool.stats.totalAcquired++;
          pool.stats.avgWaitTime = (pool.stats.avgWaitTime + (Date.now() - startTime)) / 2;
          pool.stats.peakUsage = Math.max(pool.stats.peakUsage, pool.inUse.size);
          
          resolve(resource);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        },
        requestedAt: new Date(),
        timeout: timeoutHandle
      });

      pool.stats.currentWaiting = pool.waitingQueue.length;
    });
  }

  /**
   * 释放资源
   */
  async releaseResource(poolId: string, resourceId: string): Promise<void> {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`资源池不存在: ${poolId}`);
    }

    const resourceInfo = pool.inUse.get(resourceId);
    if (!resourceInfo) {
      console.warn(`资源不在使用中: ${poolId}/${resourceId}`);
      return;
    }

    const { resource, acquiredAt } = resourceInfo;
    pool.inUse.delete(resourceId);
    pool.stats.totalReleased++;
    
    // 更新平均使用时间
    const usageTime = Date.now() - acquiredAt.getTime();
    pool.stats.avgUsageTime = (pool.stats.avgUsageTime + usageTime) / 2;

    // 验证资源是否仍然有效
    try {
      const isValid = await pool.validator(resource);
      if (!isValid) {
        await this.destroyResource(pool, resource);
        return;
      }
    } catch (error) {
      console.warn(`资源验证失败，销毁资源: ${pool.name}`, error);
      await this.destroyResource(pool, resource);
      return;
    }

    // 如果有等待的请求，直接分配给它们
    if (pool.waitingQueue.length > 0) {
      const waiting = pool.waitingQueue.shift()!;
      waiting.resolve(resource);
      pool.stats.currentWaiting = pool.waitingQueue.length;
    } else {
      // 放回可用资源池
      pool.available.push(resource);
    }
  }

  /**
   * 销毁资源
   */
  private async destroyResource<T>(pool: ResourcePool<T>, resource: T): Promise<void> {
    try {
      await pool.destroyer(resource);
      pool.currentSize--;
      pool.stats.totalDestroyed++;
      
      console.log(`🗑️ 销毁资源: ${pool.name}, 当前大小: ${pool.currentSize}`);
    } catch (error) {
      console.error(`销毁资源失败: ${pool.name}`, error);
    }
  }

  /**
   * 创建并发限制器
   */
  createConcurrencyLimiter(
    id: string,
    name: string,
    maxConcurrency: number
  ): void {
    if (this.limiters.has(id)) {
      throw new Error(`并发限制器已存在: ${id}`);
    }

    const limiter: ConcurrencyLimiter = {
      id,
      name,
      maxConcurrency,
      currentConcurrency: 0,
      queue: [],
      stats: {
        totalExecuted: 0,
        totalQueued: 0,
        avgExecutionTime: 0,
        avgQueueTime: 0
      }
    };

    this.limiters.set(id, limiter);
    console.log(`🚦 创建并发限制器: ${name} (${id}), 最大并发: ${maxConcurrency}`);
  }

  /**
   * 执行任务（受并发限制）
   */
  async executeWithLimit<T>(
    limiterId: string,
    task: () => Promise<T>,
    priority = 0
  ): Promise<T> {
    const limiter = this.limiters.get(limiterId);
    if (!limiter) {
      throw new Error(`并发限制器不存在: ${limiterId}`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // 如果当前并发数未达到限制，直接执行
    if (limiter.currentConcurrency < limiter.maxConcurrency) {
      return this.executeTask(limiter, task, taskId, startTime);
    }

    // 需要排队等待
    return new Promise<T>((resolve, reject) => {
      limiter.queue.push({
        id: taskId,
        execute: task,
        resolve,
        reject,
        priority,
        requestedAt: new Date()
      });

      // 按优先级排序队列
      limiter.queue.sort((a, b) => b.priority - a.priority);
      limiter.stats.totalQueued++;
    });
  }

  /**
   * 执行任务
   */
  private async executeTask<T>(
    limiter: ConcurrencyLimiter,
    task: () => Promise<T>,
    taskId: string,
    startTime: number
  ): Promise<T> {
    limiter.currentConcurrency++;
    limiter.stats.totalExecuted++;

    try {
      const result = await task();
      
      // 更新统计信息
      const executionTime = Date.now() - startTime;
      limiter.stats.avgExecutionTime = (limiter.stats.avgExecutionTime + executionTime) / 2;
      
      return result;
    } finally {
      limiter.currentConcurrency--;
      
      // 处理队列中的下一个任务
      if (limiter.queue.length > 0) {
        const nextTask = limiter.queue.shift()!;
        const queueTime = Date.now() - nextTask.requestedAt.getTime();
        limiter.stats.avgQueueTime = (limiter.stats.avgQueueTime + queueTime) / 2;
        
        // 异步执行下一个任务
        this.executeTask(limiter, nextTask.execute, nextTask.id, Date.now())
          .then(nextTask.resolve)
          .catch(nextTask.reject);
      }
    }
  }

  /**
   * 创建负载均衡器
   */
  createLoadBalancer<T>(
    id: string,
    name: string,
    resources: T[],
    strategy: LoadBalancer<T>['strategy'] = 'round-robin'
  ): void {
    if (this.balancers.has(id)) {
      throw new Error(`负载均衡器已存在: ${id}`);
    }

    const balancer: LoadBalancer<T> = {
      id,
      name,
      resources: [...resources],
      strategy,
      currentIndex: 0,
      weights: new Map(),
      connections: new Map(),
      stats: new Map()
    };

    // 初始化统计信息
    resources.forEach(resource => {
      balancer.stats.set(resource, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        lastUsed: new Date()
      });
      
      if (strategy === 'least-connections') {
        balancer.connections!.set(resource, 0);
      }
    });

    this.balancers.set(id, balancer);
    console.log(`⚖️ 创建负载均衡器: ${name} (${id}), 策略: ${strategy}`);
  }

  /**
   * 获取负载均衡的资源
   */
  getBalancedResource<T>(balancerId: string): T | null {
    const balancer = this.balancers.get(balancerId) as LoadBalancer<T>;
    if (!balancer || balancer.resources.length === 0) {
      return null;
    }

    let selectedResource: T;

    switch (balancer.strategy) {
      case 'round-robin':
        selectedResource = balancer.resources[balancer.currentIndex];
        balancer.currentIndex = (balancer.currentIndex + 1) % balancer.resources.length;
        break;

      case 'least-connections':
        selectedResource = Array.from(balancer.connections!.entries())
          .sort((a, b) => a[1] - b[1])[0][0];
        break;

      case 'weighted':
        selectedResource = this.selectWeightedResource(balancer);
        break;

      case 'random':
        selectedResource = balancer.resources[Math.floor(Math.random() * balancer.resources.length)];
        break;

      default:
        selectedResource = balancer.resources[0];
    }

    // 更新统计信息
    const stats = balancer.stats.get(selectedResource)!;
    stats.totalRequests++;
    stats.lastUsed = new Date();

    if (balancer.connections) {
      const connections = balancer.connections.get(selectedResource) || 0;
      balancer.connections.set(selectedResource, connections + 1);
    }

    return selectedResource;
  }

  /**
   * 选择加权资源
   */
  private selectWeightedResource<T>(balancer: LoadBalancer<T>): T {
    const totalWeight = Array.from(balancer.weights!.values()).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [resource, weight] of balancer.weights!.entries()) {
      random -= weight;
      if (random <= 0) {
        return resource;
      }
    }

    return balancer.resources[0]; // fallback
  }

  /**
   * 报告资源使用结果
   */
  reportResourceResult<T>(
    balancerId: string,
    resource: T,
    success: boolean,
    responseTime: number
  ): void {
    const balancer = this.balancers.get(balancerId) as LoadBalancer<T>;
    if (!balancer) return;

    const stats = balancer.stats.get(resource);
    if (!stats) return;

    if (success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;

    // 更新连接数
    if (balancer.connections) {
      const connections = balancer.connections.get(resource) || 0;
      balancer.connections.set(resource, Math.max(0, connections - 1));
    }
  }

  /**
   * 获取资源池统计信息
   */
  getPoolStats(poolId: string): ResourcePoolStats | null {
    const pool = this.pools.get(poolId);
    return pool ? { ...pool.stats } : null;
  }

  /**
   * 获取并发限制器统计信息
   */
  getLimiterStats(limiterId: string): ConcurrencyLimiter['stats'] | null {
    const limiter = this.limiters.get(limiterId);
    return limiter ? { ...limiter.stats } : null;
  }

  /**
   * 获取负载均衡器统计信息
   */
  getBalancerStats<T>(balancerId: string): Map<T, any> | null {
    const balancer = this.balancers.get(balancerId);
    return balancer ? new Map(balancer.stats) : null;
  }

  /**
   * 启动监控
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // 每30秒检查一次
  }

  /**
   * 执行健康检查
   */
  private performHealthCheck(): void {
    // 检查资源池健康状态
    for (const [poolId, pool] of this.pools.entries()) {
      // 清理超时的等待请求
      const now = Date.now();
      pool.waitingQueue = pool.waitingQueue.filter(item => {
        if (now - item.requestedAt.getTime() > 60000) { // 60秒超时
          item.reject(new Error('等待资源超时'));
          return false;
        }
        return true;
      });

      // 更新等待队列统计
      pool.stats.currentWaiting = pool.waitingQueue.length;

      // 如果池使用率过低，考虑缩减大小
      const usageRate = pool.inUse.size / pool.maxSize;
      if (usageRate < 0.2 && pool.available.length > 2) {
        // 销毁一些空闲资源
        const toDestroy = Math.min(2, pool.available.length - 1);
        for (let i = 0; i < toDestroy; i++) {
          const resource = pool.available.pop();
          if (resource) {
            this.destroyResource(pool, resource);
          }
        }
      }
    }

    // 检查并发限制器
    for (const [limiterId, limiter] of this.limiters.entries()) {
      // 清理可能的僵尸任务
      if (limiter.queue.length > 100) {
        console.warn(`并发限制器队列过长: ${limiter.name} (${limiter.queue.length})`);
      }
    }
  }

  /**
   * 获取所有资源池概览
   */
  getAllPoolsOverview(): Array<{
    id: string;
    name: string;
    currentSize: number;
    maxSize: number;
    inUse: number;
    available: number;
    waiting: number;
    stats: ResourcePoolStats;
  }> {
    return Array.from(this.pools.entries()).map(([id, pool]) => ({
      id,
      name: pool.name,
      currentSize: pool.currentSize,
      maxSize: pool.maxSize,
      inUse: pool.inUse.size,
      available: pool.available.length,
      waiting: pool.waitingQueue.length,
      stats: { ...pool.stats }
    }));
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;

    // 清理所有资源池
    for (const [poolId, pool] of this.pools.entries()) {
      // 销毁所有资源
      const allResources = [
        ...pool.available,
        ...Array.from(pool.inUse.values()).map(info => info.resource)
      ];

      for (const resource of allResources) {
        try {
          await pool.destroyer(resource);
        } catch (error) {
          console.error(`销毁资源失败: ${pool.name}`, error);
        }
      }

      // 拒绝所有等待的请求
      pool.waitingQueue.forEach(item => {
        item.reject(new Error('资源池已关闭'));
      });
    }

    this.pools.clear();
    this.limiters.clear();
    this.balancers.clear();

    console.log('🧹 资源池管理器资源清理完成');
  }
}

// 创建全局资源池管理器实例
export const resourcePoolManager = new ResourcePoolManager();

// 默认导出
export default resourcePoolManager;