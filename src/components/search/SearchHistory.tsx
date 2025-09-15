import React from 'react';
import { Card, Button, Icon, Badge } from '../ui';
import type { SearchHistoryItem } from '../../types';

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  visible: boolean;
  onSelectHistory: (query: string) => void;
  onClearHistory: () => void;
  onRemoveHistory?: (query: string) => void;
  className?: string;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  visible,
  onSelectHistory,
  onClearHistory,
  onRemoveHistory,

  className = ''
}) => {
  if (!visible || history.length === 0) {
    return null;
  }

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={`mt-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-sketch-text flex items-center gap-2">
          <Icon name="history" size="sm" />
          搜索历史
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          icon={<Icon name="trash" size="xs" />}
        >
          清空
        </Button>
      </div>

      <div className="space-y-2">
        {history.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-sketch border border-sketch-border hover:bg-sketch-background transition-colors group"
          >
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => onSelectHistory(item.query)}
            >
              <Icon name="search" size="xs" className="text-sketch-muted" />
              <span className="text-sketch-text font-medium">{item.query}</span>
              <Badge variant="info" size="sm">
                {item.resultCount} 个结果
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-xs text-sketch-muted">
                {formatDate(item.timestamp)}
              </div>
              
              {onRemoveHistory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveHistory(item.query);
                  }}
                  icon={<Icon name="x" size="xs" />}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {history.length === 0 && (
        <div className="text-center py-8 text-sketch-muted">
          <Icon name="history" size="lg" className="mx-auto mb-2 opacity-50" />
          <p>暂无搜索历史</p>
        </div>
      )}
    </Card>
  );
};