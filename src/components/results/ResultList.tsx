import React from 'react';
import { Card, Button, Icon } from '../ui';
import { ResultCard } from './ResultCard';
import type { MaterialResult, SortOption } from '../../types';

interface ResultListProps {
  results: MaterialResult[];
  loading?: boolean;
  totalCount: number;
  currentPage?: number;
  itemsPerPage?: number;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  onPageChange?: (page: number) => void;
  onResultClick?: (result: MaterialResult) => void;
  className?: string;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'relevance', label: '相关性' },
  { value: 'date_desc', label: '最新发布' },
  { value: 'date_asc', label: '最早发布' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
  { value: 'rating_desc', label: '评分最高' }
];

export const ResultList: React.FC<ResultListProps> = ({
  results,
  loading = false,
  totalCount,
  currentPage = 1,
  itemsPerPage = 12,
  sortBy = 'relevance',
  onSortChange,
  onPageChange,
  onResultClick,
  className = ''
}) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  const handleResultClick = (result: MaterialResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // 默认行为：在新标签页打开
      window.open(result.sourceUrl, '_blank');
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 上一页按钮
    if (currentPage > 1) {
      pages.push(
        <Button
          key="prev"
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(currentPage - 1)}
          icon={<Icon name="chevron-left" size="xs" />}
        >
          上一页
        </Button>
      );
    }

    // 页码按钮
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onPageChange?.(i)}
        >
          {i}
        </Button>
      );
    }

    // 下一页按钮
    if (currentPage < totalPages) {
      pages.push(
        <Button
          key="next"
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(currentPage + 1)}
          icon={<Icon name="chevron-right" size="xs" />}
          iconPosition="right"
        >
          下一页
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        {pages}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-sketch-border border-t-sketch-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sketch-muted">正在加载搜索结果...</p>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center py-12">
          <Icon name="search" size="xl" className="mx-auto mb-4 text-sketch-muted opacity-50" />
          <h3 className="text-lg font-medium text-sketch-text mb-2">
            没有找到相关结果
          </h3>
          <p className="text-sketch-muted">
            尝试使用不同的关键词或检查网站配置
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* 结果统计和排序 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sketch-text">
              <span className="font-semibold">{totalCount}</span> 个结果
            </div>
            <div className="text-sm text-sketch-muted">
              显示第 {startIndex}-{endIndex} 个
            </div>
          </div>
          
          {onSortChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-sketch-muted">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="sketch-input text-sm py-1 px-2 min-w-0"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* 结果网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            onClick={handleResultClick}
          />
        ))}
      </div>

      {/* 分页 */}
      {renderPagination()}
    </div>
  );
};