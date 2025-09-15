/**
 * 搜索状态监控组件
 * 实时显示搜索任务的执行状态和进度
 */

import React, { useState, useEffect } from 'react';
import { CrawlingTask, CrawlingError, ExtractedMaterialResult } from '../../crawler/types/crawler';
import './SearchStatusMonitor.css';

interface SearchStatusMonitorProps {
  task: CrawlingTask | null;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

export const SearchStatusMonitor: React.FC<SearchStatusMonitorProps> = ({
  task,
  onCancel,
  onPause,
  onResume,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 更新当前时间用于计算实时进度
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!task) {
    return null;
  }

  // 计算进度
  const totalWebsites = task.progress.total;
  const completedWebsites = task.progress.completed;
  const failedWebsites = task.progress.failed;
  const processedWebsites = completedWebsites + failedWebsites;
  const progressPercentage = totalWebsites > 0 ? Math.round((processedWebsites / totalWebsites) * 100) : 0;

  // 计算时间
  const elapsedTime = currentTime - task.startTime.getTime();
  const estimatedRemaining = task.estimatedEndTime ? 
    Math.max(0, task.estimatedEndTime.getTime() - currentTime) : 0;

  // 格式化时间
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }
  };

  // 获取状态信息
  const getStatusInfo = () => {
    switch (task.status) {
      case 'pending':
        return {
          icon: '⏳',
          text: '等待开始',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'running':
        return {
          icon: '🔄',
          text: '正在搜索',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'paused':
        return {
          icon: '⏸️',
          text: '已暂停',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'completed':
        return {
          icon: '✅',
          text: '搜索完成',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: '❌',
          text: '搜索失败',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: '❓',
          text: '未知状态',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor} p-4 ${className}`}>
      {/* 状态头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{statusInfo.icon}</span>
          <div>
            <h3 className={`font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </h3>
            <p className="text-sm text-gray-600">
              搜索关键词: "{task.query}"
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {task.status === 'running' && onPause && (
            <button
              onClick={onPause}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              title="暂停搜索"
            >
              ⏸️ 暂停
            </button>
          )}
          
          {task.status === 'paused' && onResume && (
            <button
              onClick={onResume}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="恢复搜索"
            >
              ▶️ 恢复
            </button>
          )}
          
          {(task.status === 'running' || task.status === 'paused' || task.status === 'pending') && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="取消搜索"
            >
              ❌ 取消
            </button>
          )}
        </div>
      </div>

      {/* 进度信息 */}
      {task.status !== 'pending' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>网站进度: {processedWebsites}/{totalWebsites}</span>
            <span>{progressPercentage}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div className="flex h-3 rounded-full overflow-hidden">
              {/* 成功进度 */}
              <div
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${totalWebsites > 0 ? (completedWebsites / totalWebsites) * 100 : 0}%` }}
              />
              {/* 失败进度 */}
              <div
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${totalWebsites > 0 ? (failedWebsites / totalWebsites) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              成功: {completedWebsites}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              失败: {failedWebsites}
            </span>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{task.results.length}</div>
          <div className="text-xs text-gray-600">找到结果</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{task.errors.length}</div>
          <div className="text-xs text-gray-600">错误数量</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{formatTime(elapsedTime)}</div>
          <div className="text-xs text-gray-600">已用时间</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {task.status === 'running' && estimatedRemaining > 0 ? formatTime(estimatedRemaining) : '-'}
          </div>
          <div className="text-xs text-gray-600">预计剩余</div>
        </div>
      </div>

      {/* 最新结果预览 */}
      {task.results.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            最新结果 (共 {task.results.length} 个)
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {task.results.slice(-3).reverse().map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-100">
                {result.previewImages.length > 0 && (
                  <img
                    src={result.previewImages[0].url}
                    alt={result.title}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    来源: {result.sourceWebsite}
                    {result.pricing.isFree ? (
                      <span className="ml-2 text-green-600">免费</span>
                    ) : result.pricing.price ? (
                      <span className="ml-2 text-blue-600">
                        ¥{result.pricing.price}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {task.errors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">
            错误信息 ({task.errors.length})
          </h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {task.errors.slice(-3).reverse().map((error, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <span className="font-medium">{error.websiteId}:</span> {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 任务详情 */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
        <div className="flex justify-between">
          <span>任务ID: {task.id}</span>
          <span>开始时间: {task.startTime.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default SearchStatusMonitor;