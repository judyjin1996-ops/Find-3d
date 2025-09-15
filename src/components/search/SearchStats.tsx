import React from 'react';
import { Card, Badge, Icon } from '../ui';

interface SearchStatsData {
  totalSearches: number;
  uniqueQueries: number;
  averageResults: number;
  mostSearched: Array<{ query: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

interface SearchStatsProps {
  stats: SearchStatsData;
  className?: string;
}

export const SearchStats: React.FC<SearchStatsProps> = ({
  stats,
  className = ''
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const maxActivity = Math.max(...stats.recentActivity.map(a => a.count));

  return (
    <Card className={className}>
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center gap-2">
          <Icon name="star" size="sm" className="text-sketch-accent" />
          <h3 className="text-lg font-semibold text-sketch-text">搜索统计</h3>
        </div>

        {/* 总体统计 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-sketch-accent">
              {stats.totalSearches}
            </div>
            <div className="text-sm text-sketch-muted">总搜索次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sketch-accent">
              {stats.uniqueQueries}
            </div>
            <div className="text-sm text-sketch-muted">不同关键词</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sketch-accent">
              {stats.averageResults}
            </div>
            <div className="text-sm text-sketch-muted">平均结果数</div>
          </div>
        </div>

        {/* 热门搜索 */}
        {stats.mostSearched.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-sketch-text mb-3">热门搜索</h4>
            <div className="space-y-2">
              {stats.mostSearched.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm text-sketch-text">{item.query}</span>
                  </div>
                  <Badge variant="info" size="sm">
                    {item.count} 次
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 最近活动 */}
        {stats.recentActivity.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-sketch-text mb-3">最近活动</h4>
            <div className="space-y-2">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-sketch-text">
                    {formatDate(activity.date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-sketch-accent rounded-full"
                      style={{ 
                        width: `${Math.max(8, (activity.count / maxActivity) * 60)}px` 
                      }}
                    />
                    <span className="text-xs text-sketch-muted w-8 text-right">
                      {activity.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {stats.totalSearches === 0 && (
          <div className="text-center py-8 text-sketch-muted">
            <Icon name="search" size="lg" className="mx-auto mb-2 opacity-50" />
            <p>开始搜索来查看统计信息</p>
          </div>
        )}
      </div>
    </Card>
  );
};