/**
 * 爬虫任务调度和监控演示页面
 * 展示任务调度器和状态监控的完整功能
 */

import React, { useState, useEffect } from 'react';
import { CrawlerTaskScheduler } from './CrawlerTaskScheduler';
import { SearchStatusMonitor } from '../search/SearchStatusMonitor';
import { CrawlingTask } from '../../crawler/types/crawler';
import { crawlerService } from '../../services/crawlerService';
import { webSocketService } from '../../services/websocketService';

interface TaskSchedulerStats {
  queuedTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

export const CrawlerTaskDemo: React.FC = () => {
  const [tasks, setTasks] = useState<CrawlingTask[]>([]);
  const [stats, setStats] = useState<TaskSchedulerStats>({
    queuedTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalProcessed: 0,
    averageProcessingTime: 0
  });
  const [currentTask, setCurrentTask] = useState<CrawlingTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('手机');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // 初始化服务
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        
        // 初始化爬虫服务
        await crawlerService.initialize();
        
        // 连接WebSocket
        await webSocketService.connect();
        setConnectionStatus('connected');
        
        // 加载初始数据
        await refreshData();
        
      } catch (error) {
        console.error('服务初始化失败:', error);
        setConnectionStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();

    // 清理函数
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  // 设置WebSocket事件监听
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // 监听任务进度更新
    unsubscribers.push(
      webSocketService.subscribeToTaskProgress((progress) => {
        console.log('任务进度更新:', progress);
        refreshData();
      })
    );

    // 监听任务完成
    unsubscribers.push(
      webSocketService.subscribeToTaskCompletion((task) => {
        console.log('任务完成:', task);
        refreshData();
      })
    );

    // 监听任务结果
    unsubscribers.push(
      webSocketService.subscribeToTaskResults((result) => {
        console.log('新结果:', result);
        refreshData();
      })
    );

    // 监听任务错误
    unsubscribers.push(
      webSocketService.subscribeToTaskErrors((error) => {
        console.log('任务错误:', error);
        refreshData();
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // 定期刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        refreshData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  // 刷新数据
  const refreshData = async () => {
    try {
      // 获取系统统计
      const systemStats = crawlerService.getSystemStats();
      
      // 获取所有任务
      const allTasks = crawlerService.getAllSearchTasks();

      setTasks(allTasks);
      setStats({
        queuedTasks: systemStats.queuedSearchTasks,
        activeTasks: systemStats.activeSearchTasks,
        completedTasks: systemStats.completedSearchTasks,
        totalProcessed: systemStats.completedSearchTasks,
        averageProcessingTime: 0 // 需要从调度器获取
      });

      // 更新当前任务状态
      if (currentTask) {
        const updatedTask = allTasks.find(task => task.id === currentTask.id);
        if (updatedTask) {
          setCurrentTask(updatedTask);
        }
      }

    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  };

  // 开始新搜索
  const handleStartSearch = async () => {
    if (!searchQuery.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await crawlerService.searchMaterials(searchQuery, {
        mode: 'comprehensive',
        maxResults: 20
      });

      console.log('搜索任务已启动:', response);
      
      // 获取任务状态
      const task = crawlerService.getSearchTaskStatus(response.taskId);
      if (task) {
        setCurrentTask(task);
      }

      await refreshData();
      
    } catch (error) {
      console.error('启动搜索失败:', error);
      alert('启动搜索失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 暂停任务
  const handlePauseTask = async (taskId: string) => {
    try {
      const success = crawlerService.pauseSearchTask(taskId);
      if (success) {
        console.log('任务已暂停:', taskId);
      } else {
        console.warn('暂停任务失败:', taskId);
      }
      await refreshData();
    } catch (error) {
      console.error('暂停任务失败:', error);
    }
  };

  // 恢复任务
  const handleResumeTask = async (taskId: string) => {
    try {
      const success = crawlerService.resumeSearchTask(taskId);
      if (success) {
        console.log('任务已恢复:', taskId);
      } else {
        console.warn('恢复任务失败:', taskId);
      }
      await refreshData();
    } catch (error) {
      console.error('恢复任务失败:', error);
    }
  };

  // 取消任务
  const handleCancelTask = async (taskId: string) => {
    try {
      const success = crawlerService.cancelSearchTask(taskId);
      if (success) {
        console.log('任务已取消:', taskId);
        
        // 如果取消的是当前任务，清除当前任务状态
        if (currentTask && currentTask.id === taskId) {
          setCurrentTask(null);
        }
      } else {
        console.warn('取消任务失败:', taskId);
      }
      
      await refreshData();
    } catch (error) {
      console.error('取消任务失败:', error);
    }
  };

  // 清理已完成任务
  const handleCleanupTasks = async () => {
    try {
      // 这里需要实现清理任务的方法
      console.log('清理已完成任务');
      await refreshData();
    } catch (error) {
      console.error('清理任务失败:', error);
    }
  };

  // 获取连接状态图标
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">正在初始化爬虫服务...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🚀 爬虫任务调度和监控演示
              </h1>
              <p className="text-gray-600">
                展示智能爬虫任务的调度、执行和实时监控功能
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span>{getConnectionIcon()}</span>
                <span className="text-gray-600">
                  WebSocket: {connectionStatus === 'connected' ? '已连接' : 
                            connectionStatus === 'connecting' ? '连接中' : '未连接'}
                </span>
              </div>
              
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                disabled={isLoading}
              >
                🔄 刷新
              </button>
            </div>
          </div>
        </div>

        {/* 搜索控制面板 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 启动新搜索任务
          </h2>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索关键词
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入要搜索的3D素材关键词..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleStartSearch();
                  }
                }}
              />
            </div>
            
            <button
              onClick={handleStartSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '🔄 启动中...' : '🚀 开始搜索'}
            </button>
          </div>
        </div>

        {/* 当前任务监控 */}
        {currentTask && (
          <div className="mb-6">
            <SearchStatusMonitor
              task={currentTask}
              onCancel={() => handleCancelTask(currentTask.id)}
              onPause={() => handlePauseTask(currentTask.id)}
              onResume={() => handleResumeTask(currentTask.id)}
            />
          </div>
        )}

        {/* 任务调度器 */}
        <CrawlerTaskScheduler
          tasks={tasks}
          stats={stats}
          onPauseTask={handlePauseTask}
          onResumeTask={handleResumeTask}
          onCancelTask={handleCancelTask}
          onCleanupTasks={handleCleanupTasks}
        />

        {/* 功能说明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 功能说明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">🗂️ 任务调度器</h4>
              <ul className="space-y-1">
                <li>• 智能任务队列管理</li>
                <li>• 并发任务控制</li>
                <li>• 任务优先级调度</li>
                <li>• 自动重试机制</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">📊 实时监控</h4>
              <ul className="space-y-1">
                <li>• 任务进度实时更新</li>
                <li>• WebSocket实时通信</li>
                <li>• 错误监控和报告</li>
                <li>• 性能指标统计</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🎛️ 任务控制</h4>
              <ul className="space-y-1">
                <li>• 暂停/恢复任务</li>
                <li>• 取消正在执行的任务</li>
                <li>• 任务状态管理</li>
                <li>• 批量操作支持</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🔧 系统管理</h4>
              <ul className="space-y-1">
                <li>• 资源使用监控</li>
                <li>• 自动清理机制</li>
                <li>• 配置热更新</li>
                <li>• 日志记录和分析</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrawlerTaskDemo;