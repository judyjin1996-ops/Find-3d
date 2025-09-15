/**
 * 搜索历史管理组件
 * 管理用户的搜索历史记录（后台存储，不在前端显示）
 */

import React, { useState, useEffect } from 'react';
import { SearchHistoryItem, userConfigService } from '../../services/userConfigService';
import './SearchHistoryManager.css';

export interface SearchHistoryManagerProps {
  onHistorySelect?: (item: SearchHistoryItem) => void;
  maxItems?: number;
  className?: string;
}



export const SearchHistoryManager: React.FC<SearchHistoryManagerProps> = ({
  onHistorySelect,
  maxItems = 20,
  className = ''
}) => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  /**
   * 加载历史记录
   */
  const loadHistory = () => {
    const historyData = userConfigService.getSearchHistory();
    setHistory(historyData.slice(0, maxItems));
    
    const stats = getSearchStatistics(historyData);
    setStatistics(stats);
  };

  /**
   * 清除历史记录
   */
  const handleClearHistory = () => {
    if (window.confirm('确定要清除所有搜索历史吗？此操作不可撤销。')) {
      userConfigService.clearSearchHistory();
      loadHistory();
    }
  };

  /**
   * 删除单条记录
   */
  const handleDeleteRecord = (id: string) => {
    // 实现删除单条记录的逻辑
    const history = userConfigService.getSearchHistory();
    const filtered = history.filter(item => item.id !== id);
    // 这里需要在userConfigService中添加批量设置历史的方法
    loadHistory();
  };

  /**
   * 获取搜索统计
   */
  const getSearchStatistics = (history: SearchHistoryItem[]) => {
    if (history.length === 0) {
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        avgResultCount: 0,
        avgDuration: 0,
        mostSearchedQueries: [],
        searchTrends: []
      };
    }

    // 统计查询频率
    const queryCount = new Map<string, number>();
    history.forEach(item => {
      const query = item.query.toLowerCase();
      queryCount.set(query, (queryCount.get(query) || 0) + 1);
    });

    const mostSearchedQueries = Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // 计算平均值
    const avgResultCount = history.reduce((sum, item) => sum + item.resultCount, 0) / history.length;
    const avgDuration = history.reduce((sum, item) => sum + item.searchTime, 0) / history.length;

    // 搜索趋势（按天统计）
    const trendMap = new Map<string, number>();
    history.forEach(item => {
      const date = item.timestamp.toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    const searchTrends = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return {
      totalSearches: history.length,
      uniqueQueries: queryCount.size,
      avgResultCount: Math.round(avgResultCount),
      avgDuration: Math.round(avgDuration),
      mostSearchedQueries,
      searchTrends
    };
  };

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今天 ' + timestamp.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days === 1) {
      return '昨天 ' + timestamp.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return timestamp.toLocaleDateString('zh-CN');
    }
  };

  /**
   * 格式化持续时间
   */
  const formatDuration = (duration: number): string => {
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${Math.round(duration / 1000)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.round((duration % 60000) / 1000);
      return `${minutes}m${seconds}s`;
    }
  };

  if (history.length === 0) {
    return (
      <div className={`search-history-manager empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <div className="empty-text">暂无搜索历史</div>
          <div className="empty-description">
            您的搜索记录会自动保存在这里，方便您查看搜索统计信息
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`search-history-manager ${className}`}>
      {/* 头部控制 */}
      <div className="history-header">
        <div className="header-info">
          <h3>搜索历史</h3>
          <span className="history-count">{history.length} 条记录</span>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className="stats-button"
          >
            {showStatistics ? '隐藏统计' : '查看统计'}
          </button>
          <button
            onClick={handleClearHistory}
            className="clear-button"
          >
            清除历史
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      {showStatistics && statistics && (
        <div className="statistics-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{statistics.totalSearches}</div>
              <div className="stat-label">总搜索次数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.uniqueQueries}</div>
              <div className="stat-label">不同关键词</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{statistics.avgResultCount}</div>
              <div className="stat-label">平均结果数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatDuration(statistics.avgDuration)}</div>
              <div className="stat-label">平均耗时</div>
            </div>
          </div>

          {/* 热门搜索 */}
          {statistics.mostSearchedQueries.length > 0 && (
            <div className="popular-queries">
              <h4>热门搜索</h4>
              <div className="query-list">
                {statistics.mostSearchedQueries.slice(0, 5).map((item, index) => (
                  <div key={index} className="query-item">
                    <span className="query-text">{item.query}</span>
                    <span className="query-count">{item.count}次</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 历史记录列表 */}
      <div className="history-list">
        {history.map(item => (
          <div key={item.id} className="history-item">
            <div 
              className="item-content"
              onClick={() => onHistorySelect?.(item)}
            >
              <div className="item-main">
                <div className="query-text">{item.query}</div>
                <div className="item-meta">
                  <span className="result-count">{item.resultCount} 个结果</span>
                  <span className="search-mode">{item.mode === 'fast' ? '快速' : '全面'}</span>
                  <span className="duration">{formatDuration(item.searchTime)}</span>
                  <span className="website-count">{item.websites.length} 个网站</span>
                </div>
              </div>
              <div className="item-time">
                {formatTime(item.timestamp)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRecord(item.id);
              }}
              className="delete-button"
              title="删除此记录"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 底部信息 */}
      <div className="history-footer">
        <div className="footer-text">
          搜索历史仅保存在本地，最多保留 100 条记录
        </div>
      </div>
    </div>
  );
};