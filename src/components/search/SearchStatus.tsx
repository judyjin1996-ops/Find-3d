import React, { useState } from 'react';
import { Card, Badge, Icon, Loading } from '../ui';
import type { WebsiteSearchStatus, SearchPerformanceMetrics } from '../../types';

interface SearchStatusProps {
  statuses: WebsiteSearchStatus[];
  totalResults: number;
  searchTime: number;
  performanceMetrics?: SearchPerformanceMetrics;
  showDetails?: boolean;
  className?: string;
}

export const SearchStatus: React.FC<SearchStatusProps> = ({
  statuses,
  totalResults,
  searchTime,
  performanceMetrics,
  showDetails = false,
  className = ''
}) => {
  const [showDetailedView, setShowDetailedView] = useState(showDetails);
  const getStatusIcon = (status: WebsiteSearchStatus['status']) => {
    switch (status) {
      case 'success':
        return <Icon name="check" size="xs" className="text-green-600" />;
      case 'error':
        return <Icon name="x" size="xs" className="text-red-600" />;
      case 'timeout':
        return <Icon name="refresh" size="xs" className="text-yellow-600" />;
      case 'cancelled':
        return <Icon name="x" size="xs" className="text-gray-600" />;
      case 'loading':
        return <Loading size="sm" text="" />;
      default:
        return <Icon name="refresh" size="xs" className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: WebsiteSearchStatus['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" size="sm">成功</Badge>;
      case 'error':
        return <Badge variant="error" size="sm">错误</Badge>;
      case 'timeout':
        return <Badge variant="warning" size="sm">超时</Badge>;
      case 'cancelled':
        return <Badge variant="default" size="sm">已取消</Badge>;
      case 'loading':
        return <Badge variant="info" size="sm">搜索中</Badge>;
      default:
        return <Badge variant="default" size="sm">等待</Badge>;
    }
  };

  const successCount = statuses.filter(s => s.status === 'success').length;
  const errorCount = statuses.filter(s => s.status === 'error').length;
  const timeoutCount = statuses.filter(s => s.status === 'timeout').length;
  const cancelledCount = statuses.filter(s => s.status === 'cancelled').length;
  const loadingCount = statuses.filter(s => s.status === 'loading').length;

  return (
    <Card className={`${className}`}>
      <div className="space-y-4">
        {/* 总体统计 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-sketch-text">
              搜索结果: {totalResults} 个
            </div>
            <div className="text-sm text-sketch-muted">
              用时: {searchTime.toFixed(2)}s
            </div>
            {performanceMetrics && (
              <button
                onClick={() => setShowDetailedView(!showDetailedView)}
                className="text-xs text-sketch-muted hover:text-sketch-text transition-colors"
              >
                {showDetailedView ? '隐藏详情' : '显示详情'}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {loadingCount > 0 && (
              <Badge variant="info" size="sm">
                {loadingCount} 搜索中
              </Badge>
            )}
            {successCount > 0 && (
              <Badge variant="success" size="sm">
                {successCount} 成功
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="error" size="sm">
                {errorCount} 失败
              </Badge>
            )}
            {timeoutCount > 0 && (
              <Badge variant="warning" size="sm">
                {timeoutCount} 超时
              </Badge>
            )}
            {cancelledCount > 0 && (
              <Badge variant="default" size="sm">
                {cancelledCount} 已取消
              </Badge>
            )}
          </div>
        </div>

        {/* 网站状态详情 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-sketch-text">网站状态</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {statuses.map((status) => (
              <div
                key={status.websiteId}
                className="flex items-center justify-between p-3 rounded-sketch border border-sketch-border bg-sketch-background hover:bg-sketch-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.status)}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-sketch-text">
                      {status.websiteName || status.websiteId}
                    </span>
                    {showDetailedView && status.searchTime && (
                      <span className="text-xs text-sketch-muted">
                        {status.searchTime.toFixed(0)}ms
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {status.resultCount !== undefined && (
                    <span className="text-xs text-sketch-muted">
                      {status.resultCount}
                    </span>
                  )}
                  {getStatusBadge(status.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 性能指标详情 */}
        {showDetailedView && performanceMetrics && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-sketch-text">性能指标</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-sketch border border-sketch-border bg-sketch-background">
              <div className="text-center">
                <div className="text-lg font-semibold text-sketch-text">
                  {performanceMetrics.totalTime.toFixed(2)}s
                </div>
                <div className="text-xs text-sketch-muted">总时间</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-sketch-text">
                  {performanceMetrics.networkTime.toFixed(2)}s
                </div>
                <div className="text-xs text-sketch-muted">网络时间</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-sketch-text">
                  {performanceMetrics.parseTime.toFixed(2)}s
                </div>
                <div className="text-xs text-sketch-muted">解析时间</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-sketch-text">
                  {performanceMetrics.cacheHitRate.toFixed(1)}%
                </div>
                <div className="text-xs text-sketch-muted">缓存命中率</div>
              </div>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {statuses.some(s => s.error) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600">错误详情</h4>
            <div className="space-y-1">
              {statuses
                .filter(s => s.error)
                .map((status) => (
                  <div
                    key={status.websiteId}
                    className="text-xs text-red-600 bg-red-50 p-2 rounded-sketch border border-red-200"
                  >
                    <strong>{status.websiteId}:</strong> {status.error}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};