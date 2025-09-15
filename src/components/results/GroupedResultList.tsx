import React, { useState } from 'react';
import { Card, Badge, Icon, Button } from '../ui';
import { ResultCard } from './ResultCard';
import type { SearchResultGroup, MaterialResult } from '../../types';

interface GroupedResultListProps {
  groups: SearchResultGroup[];
  onResultClick: (result: MaterialResult) => void;
  className?: string;
}

export const GroupedResultList: React.FC<GroupedResultListProps> = ({
  groups,
  onResultClick,
  className = ''
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAllResults, setShowAllResults] = useState(false);

  const toggleGroup = (websiteId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(websiteId)) {
      newExpanded.delete(websiteId);
    } else {
      newExpanded.add(websiteId);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.website)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const getStatusBadge = (status: SearchResultGroup['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" size="sm">成功</Badge>;
      case 'error':
        return <Badge variant="error" size="sm">失败</Badge>;
      case 'loading':
        return <Badge variant="info" size="sm">搜索中</Badge>;
      default:
        return <Badge variant="default" size="sm">等待</Badge>;
    }
  };

  const getStatusIcon = (status: SearchResultGroup['status']) => {
    switch (status) {
      case 'success':
        return <Icon name="check" size="sm" className="text-green-600" />;
      case 'error':
        return <Icon name="x" size="sm" className="text-red-600" />;
      case 'loading':
        return <Icon name="refresh" size="sm" className="text-blue-600 animate-spin" />;
      default:
        return <Icon name="refresh" size="sm" className="text-gray-400" />;
    }
  };

  // 获取所有成功的结果
  const allResults = groups
    .filter(group => group.status === 'success')
    .flatMap(group => group.results);

  if (showAllResults && allResults.length > 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-sketch-text">
            所有搜索结果 ({allResults.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllResults(false)}
          >
            按网站分组
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allResults.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onClick={() => onResultClick(result)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 控制按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-sketch-text">
          搜索结果分组 ({groups.length} 个网站)
        </h3>
        
        <div className="flex items-center gap-2">
          {allResults.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllResults(true)}
            >
              查看所有结果 ({allResults.length})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={expandedGroups.size === groups.length ? collapseAll : expandAll}
          >
            {expandedGroups.size === groups.length ? '全部收起' : '全部展开'}
          </Button>
        </div>
      </div>

      {/* 分组结果 */}
      <div className="space-y-4">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.website);
          const hasResults = group.results.length > 0;
          
          return (
            <Card key={group.website} className="overflow-hidden">
              {/* 分组头部 */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-sketch-hover transition-colors"
                onClick={() => toggleGroup(group.website)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(group.status)}
                  <div>
                    <h4 className="font-semibold text-sketch-text">
                      {group.websiteName}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-sketch-muted">
                      <span>{group.totalCount} 个结果</span>
                      {group.searchTime && (
                        <span>• {group.searchTime.toFixed(0)}ms</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(group.status)}
                  <Icon
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size="sm"
                    className="text-sketch-muted"
                  />
                </div>
              </div>

              {/* 错误信息 */}
              {group.status === 'error' && group.error && (
                <div className="px-4 pb-4">
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded-sketch border border-red-200">
                    {group.error}
                  </div>
                </div>
              )}

              {/* 搜索结果 */}
              {isExpanded && hasResults && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.results.map((result) => (
                      <ResultCard
                        key={result.id}
                        result={result}
                        onClick={() => onResultClick(result)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 空状态 */}
              {isExpanded && !hasResults && group.status === 'success' && (
                <div className="px-4 pb-4">
                  <div className="text-center py-8 text-sketch-muted">
                    <Icon name="search" size="lg" className="mx-auto mb-2 opacity-50" />
                    <p>该网站暂无相关结果</p>
                  </div>
                </div>
              )}

              {/* 加载状态 */}
              {group.status === 'loading' && (
                <div className="px-4 pb-4">
                  <div className="text-center py-8 text-sketch-muted">
                    <Icon name="refresh" size="lg" className="mx-auto mb-2 animate-spin" />
                    <p>正在搜索中...</p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 总结信息 */}
      {groups.length > 0 && (
        <Card className="mt-6">
          <div className="p-4">
            <h4 className="font-semibold text-sketch-text mb-2">搜索总结</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-lg font-semibold text-sketch-text">
                  {groups.filter(g => g.status === 'success').length}
                </div>
                <div className="text-sketch-muted">成功网站</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-sketch-text">
                  {allResults.length}
                </div>
                <div className="text-sketch-muted">总结果数</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-sketch-text">
                  {groups.filter(g => g.status === 'error').length}
                </div>
                <div className="text-sketch-muted">失败网站</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-sketch-text">
                  {groups.reduce((sum, g) => sum + (g.searchTime || 0), 0).toFixed(0)}ms
                </div>
                <div className="text-sketch-muted">总搜索时间</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};