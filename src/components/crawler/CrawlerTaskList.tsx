import React, { useState } from 'react';
import { Card, Button, Icon, Badge, Tooltip, Loading } from '../ui';
import type { CrawlingTask } from '../../crawler/types/crawler';

interface CrawlerTaskListProps {
  tasks: CrawlingTask[];
  selectedTasks: string[];
  onSelectTask: (taskId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onRetryTask: (taskId: string) => void;
}

export const CrawlerTaskList: React.FC<CrawlerTaskListProps> = ({
  tasks,
  selectedTasks,
  onSelectTask,
  onSelectAll,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onDeleteTask,
  onRetryTask
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 切换任务展开状态
  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };

  // 格式化持续时间
  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - new Date(startTime).getTime();
    const seconds = Math.floor(duration / 1000);
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

  // 获取状态徽章
  const getStatusBadge = (status: CrawlingTask['status']) => {
    const statusConfig = {
      pending: { variant: 'warning' as const, label: '等待中', icon: 'clock' },
      running: { variant: 'info' as const, label: '运行中', icon: 'play' },
      completed: { variant: 'success' as const, label: '已完成', icon: 'check' },
      failed: { variant: 'error' as const, label: '失败', icon: 'x' },
      paused: { variant: 'default' as const, label: '已暂停', icon: 'pause' }
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} size="sm">
        <Icon name={config.icon as any} size="xs" className="mr-1" />
        {config.label}
      </Badge>
    );
  };

  // 获取进度百分比
  const getProgressPercentage = (progress: CrawlingTask['progress']) => {
    if (progress.total === 0) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  // 获取可用操作
  const getAvailableActions = (task: CrawlingTask) => {
    const actions = [];
    
    if (task.status === 'running') {
      actions.push({
        key: 'pause',
        label: '暂停',
        icon: 'pause',
        onClick: () => onPauseTask(task.id),
        variant: 'outline' as const
      });
      actions.push({
        key: 'cancel',
        label: '取消',
        icon: 'x',
        onClick: () => onCancelTask(task.id),
        variant: 'outline' as const,
        className: 'text-red-600 hover:text-red-700'
      });
    }
    
    if (task.status === 'paused') {
      actions.push({
        key: 'resume',
        label: '恢复',
        icon: 'play',
        onClick: () => onResumeTask(task.id),
        variant: 'outline' as const
      });
      actions.push({
        key: 'cancel',
        label: '取消',
        icon: 'x',
        onClick: () => onCancelTask(task.id),
        variant: 'outline' as const,
        className: 'text-red-600 hover:text-red-700'
      });
    }
    
    if (task.status === 'pending') {
      actions.push({
        key: 'cancel',
        label: '取消',
        icon: 'x',
        onClick: () => onCancelTask(task.id),
        variant: 'outline' as const,
        className: 'text-red-600 hover:text-red-700'
      });
    }
    
    if (task.status === 'failed') {
      actions.push({
        key: 'retry',
        label: '重试',
        icon: 'refresh-cw',
        onClick: () => onRetryTask(task.id),
        variant: 'outline' as const
      });
    }
    
    if (task.status === 'completed' || task.status === 'failed') {
      actions.push({
        key: 'delete',
        label: '删除',
        icon: 'trash-2',
        onClick: () => {
          if (window.confirm('确定要删除这个任务吗？')) {
            onDeleteTask(task.id);
          }
        },
        variant: 'outline' as const,
        className: 'text-red-600 hover:text-red-700'
      });
    }
    
    return actions;
  };

  const allSelected = tasks.length > 0 && selectedTasks.length === tasks.length;
  const someSelected = selectedTasks.length > 0 && selectedTasks.length < tasks.length;

  return (
    <div className="space-y-4">
      {/* 表头 */}
      {tasks.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-sketch-text">
                {tasks.length} 个任务
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-sketch-muted">
              <span>状态</span>
              <span>进度</span>
              <span>时间</span>
              <span>操作</span>
            </div>
          </div>
        </Card>
      )}

      {/* 任务列表 */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isSelected = selectedTasks.includes(task.id);
          const isExpanded = expandedTasks.has(task.id);
          const progressPercentage = getProgressPercentage(task.progress);
          const availableActions = getAvailableActions(task);

          return (
            <Card key={task.id} className={`transition-all duration-200 ${
              isSelected ? 'ring-2 ring-sketch-accent' : ''
            }`}>
              <div className="p-4">
                {/* 主要信息行 */}
                <div className="flex items-center gap-4">
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectTask(task.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />

                  {/* 任务信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-sketch-text truncate">
                        {task.query}
                      </h3>
                      {getStatusBadge(task.status)}
                      {task.priority && task.priority > 0 && (
                        <Badge variant="info" size="xs">
                          优先级 {task.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-sketch-muted">
                      <span>网站: {task.websites.join(', ')}</span>
                      <span>开始: {formatTime(task.startTime)}</span>
                      {task.estimatedEndTime && (
                        <span>
                          耗时: {formatDuration(task.startTime, task.estimatedEndTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 进度信息 */}
                  <div className="text-center min-w-24">
                    <div className="text-sm font-medium text-sketch-text">
                      {progressPercentage}%
                    </div>
                    <div className="w-20 h-2 bg-sketch-background rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'failed' ? 'bg-red-500' :
                          task.status === 'running' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-sketch-muted mt-1">
                      {task.progress.completed} / {task.progress.total}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    {availableActions.map((action) => (
                      <Tooltip key={action.key} content={action.label}>
                        <Button
                          variant={action.variant}
                          size="sm"
                          onClick={action.onClick}
                          icon={<Icon name={action.icon as any} size="sm" />}
                          className={action.className}
                        />
                      </Tooltip>
                    ))}
                    
                    <Tooltip content={isExpanded ? '收起详情' : '展开详情'}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(task.id)}
                        icon={<Icon 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size="sm" 
                        />}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* 展开的详细信息 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-sketch-border">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* 任务详情 */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sketch-text">任务详情</h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">任务ID:</span>
                            <span className="text-sketch-text font-mono text-xs">
                              {task.id}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">搜索关键词:</span>
                            <span className="text-sketch-text">
                              {task.query}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">目标网站:</span>
                            <span className="text-sketch-text">
                              {task.websites.join(', ')}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">开始时间:</span>
                            <span className="text-sketch-text">
                              {formatTime(task.startTime)}
                            </span>
                          </div>
                          
                          {task.estimatedEndTime && (
                            <div className="flex justify-between">
                              <span className="text-sketch-muted">预计结束:</span>
                              <span className="text-sketch-text">
                                {formatTime(task.estimatedEndTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 执行状态 */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sketch-text">执行状态</h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">总进度:</span>
                            <span className="text-sketch-text">
                              {task.progress.completed} / {task.progress.total}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">成功:</span>
                            <span className="text-green-600">
                              {task.progress.completed - task.progress.failed}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">失败:</span>
                            <span className="text-red-600">
                              {task.progress.failed}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">结果数量:</span>
                            <span className="text-sketch-text">
                              {task.results.length}
                            </span>
                          </div>
                          
                          {task.errors.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sketch-muted">错误数量:</span>
                              <span className="text-red-600">
                                {task.errors.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 错误信息 */}
                    {task.errors.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-sketch-border">
                        <h4 className="font-medium text-sketch-text mb-3">错误信息</h4>
                        
                        <div className="space-y-2">
                          {task.errors.slice(0, 3).map((error, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Icon name="alert-circle" size="sm" className="text-red-600 mt-0.5" />
                                <div className="flex-1">
                                  <div className="font-medium text-red-800">
                                    {error.website}
                                  </div>
                                  <div className="text-red-700 text-sm mt-1">
                                    {error.message}
                                  </div>
                                  <div className="text-red-600 text-xs mt-1">
                                    {error.type} - {formatTime(error.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {task.errors.length > 3 && (
                            <div className="text-sm text-sketch-muted text-center">
                              还有 {task.errors.length - 3} 个错误...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 最新结果预览 */}
                    {task.results.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-sketch-border">
                        <h4 className="font-medium text-sketch-text mb-3">最新结果</h4>
                        
                        <div className="space-y-2">
                          {task.results.slice(0, 3).map((result, index) => (
                            <div key={index} className="bg-sketch-background rounded-lg p-3">
                              <div className="flex items-start gap-3">
                                {result.previewImages.length > 0 && (
                                  <img
                                    src={result.previewImages[0].url}
                                    alt={result.title}
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sketch-text truncate">
                                    {result.title}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-sketch-muted">
                                      {result.sourceWebsite}
                                    </span>
                                    {result.pricing.isFree ? (
                                      <Badge variant="success" size="xs">免费</Badge>
                                    ) : result.pricing.price && (
                                      <Badge variant="info" size="xs">
                                        {result.pricing.currency}{result.pricing.price}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {task.results.length > 3 && (
                            <div className="text-sm text-sketch-muted text-center">
                              还有 {task.results.length - 3} 个结果...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {tasks.length === 0 && (
        <Card className="p-8 text-center">
          <Icon name="inbox" size="lg" className="mx-auto text-sketch-muted mb-4" />
          <h3 className="text-lg font-medium text-sketch-text mb-2">
            暂无任务
          </h3>
          <p className="text-sketch-muted">
            点击"创建任务"开始新的爬虫任务
          </p>
        </Card>
      )}
    </div>
  );
};