/**
 * 爬虫任务调度器组件
 * 显示和管理爬虫任务的调度状态
 */

import React, { useState, useEffect } from 'react';
import { CrawlingTask } from '../../crawler/types/crawler';
import './CrawlerTaskScheduler.css';

interface TaskSchedulerStats {
  queuedTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

interface CrawlerTaskSchedulerProps {
  tasks: CrawlingTask[];
  stats: TaskSchedulerStats;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onCleanupTasks: () => void;
}

export const CrawlerTaskScheduler: React.FC<CrawlerTaskSchedulerProps> = ({
  tasks,
  stats,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onCleanupTasks
}) => {
  const [selectedTab, setSelectedTab] = useState<'active' | 'queued' | 'completed'>('active');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 按状态分组任务
  const activeTasks = tasks.filter(task => task.status === 'running' || task.status === 'paused');
  const queuedTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'failed');

  // 格式化时间
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: CrawlingTask['status']): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'paused': return '⏸️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: CrawlingTask['status']): string => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'running': return 'text-blue-600';
      case 'paused': return 'text-orange-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 计算进度百分比
  const getProgressPercentage = (task: CrawlingTask): number => {
    if (task.progress.total === 0) return 0;
    return Math.round(((task.progress.completed + task.progress.failed) / task.progress.total) * 100);
  };

  // 渲染任务卡片
  const renderTaskCard = (task: CrawlingTask) => {
    const progressPercentage = getProgressPercentage(task);
    const elapsed = Date.now() - task.startTime.getTime();
    const estimatedRemaining = task.estimatedEndTime ? 
      Math.max(0, task.estimatedEndTime.getTime() - Date.now()) : 0;

    return (
      <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getStatusIcon(task.status)}</span>
              <h3 className="font-medium text-gray-900 truncate">
                搜索: "{task.query}"
              </h3>
              <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                {task.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              任务ID: {task.id}
            </p>
            <p className="text-sm text-gray-600">
              网站数量: {task.websites.length} | 
              结果: {task.results.length} | 
              错误: {task.errors.length}
            </p>
          </div>
          
          <div className="flex gap-2 ml-4">
            {task.status === 'running' && (
              <button
                onClick={() => onPauseTask(task.id)}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                title="暂停任务"
              >
                ⏸️ 暂停
              </button>
            )}
            
            {task.status === 'paused' && (
              <button
                onClick={() => onResumeTask(task.id)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="恢复任务"
              >
                ▶️ 恢复
              </button>
            )}
            
            {(task.status === 'running' || task.status === 'paused' || task.status === 'pending') && (
              <button
                onClick={() => onCancelTask(task.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="取消任务"
              >
                ❌ 取消
              </button>
            )}
          </div>
        </div>

        {/* 进度条 */}
        {task.status !== 'pending' && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>进度: {task.progress.completed}/{task.progress.total}</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'failed' ? 'bg-red-500' :
                  task.status === 'paused' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* 时间信息 */}
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            开始时间: {task.startTime.toLocaleTimeString()}
          </span>
          {task.status === 'running' && (
            <span>
              已用时: {formatDuration(elapsed)}
              {estimatedRemaining > 0 && (
                <> | 预计剩余: {formatDuration(estimatedRemaining)}</>
              )}
            </span>
          )}
          {(task.status === 'completed' || task.status === 'failed') && task.estimatedEndTime && (
            <span>
              总用时: {formatDuration(task.estimatedEndTime.getTime() - task.startTime.getTime())}
            </span>
          )}
        </div>

        {/* 错误信息 */}
        {task.errors.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
            <p className="text-sm font-medium text-red-800 mb-1">
              错误信息 ({task.errors.length})
            </p>
            <div className="max-h-20 overflow-y-auto">
              {task.errors.slice(-3).map((error, index) => (
                <p key={index} className="text-xs text-red-700">
                  {error.message}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          🗂️ 任务调度器
        </h2>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自动刷新
          </label>
          
          <button
            onClick={onCleanupTasks}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="清理已完成的任务"
          >
            🧹 清理
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.queuedTasks}</div>
          <div className="text-sm text-gray-600">队列中</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.activeTasks}</div>
          <div className="text-sm text-gray-600">执行中</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
          <div className="text-sm text-gray-600">已完成</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{stats.totalProcessed}</div>
          <div className="text-sm text-gray-600">总处理</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {stats.averageProcessingTime > 0 ? formatDuration(stats.averageProcessingTime) : '-'}
          </div>
          <div className="text-sm text-gray-600">平均用时</div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setSelectedTab('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'active'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          执行中 ({activeTasks.length})
        </button>
        
        <button
          onClick={() => setSelectedTab('queued')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'queued'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          队列中 ({queuedTasks.length})
        </button>
        
        <button
          onClick={() => setSelectedTab('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'completed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          已完成 ({completedTasks.length})
        </button>
      </div>

      {/* 任务列表 */}
      <div className="space-y-4">
        {selectedTab === 'active' && (
          <>
            {activeTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💤</div>
                <p>暂无执行中的任务</p>
              </div>
            ) : (
              activeTasks.map(renderTaskCard)
            )}
          </>
        )}

        {selectedTab === 'queued' && (
          <>
            {queuedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>任务队列为空</p>
              </div>
            ) : (
              queuedTasks.map(renderTaskCard)
            )}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            {completedTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>暂无已完成的任务</p>
              </div>
            ) : (
              completedTasks.slice().reverse().map(renderTaskCard)
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CrawlerTaskScheduler;