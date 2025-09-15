import type { SearchHistoryItem } from '../types';

// 搜索历史服务
export class SearchHistoryService {
  private static readonly STORAGE_KEY = 'find3d_search_history';
  private static readonly MAX_HISTORY_ITEMS = 50; // 增加存储容量
  private static readonly DISPLAY_LIMIT = 10; // 显示限制

  // 获取搜索历史
  static getHistory(): SearchHistoryItem[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];
      
      const history = JSON.parse(saved) as SearchHistoryItem[];
      // 转换日期字符串为Date对象
      return history.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  // 保存搜索历史
  static saveHistory(history: SearchHistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  // 添加搜索记录
  static addSearch(query: string, resultCount: number): SearchHistoryItem[] {
    const history = this.getHistory();
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: new Date(),
      resultCount
    };

    // 移除重复项
    const filtered = history.filter(item => item.query !== newItem.query);
    
    // 添加新项到开头，限制总数量
    const updated = [newItem, ...filtered].slice(0, this.MAX_HISTORY_ITEMS);
    
    this.saveHistory(updated);
    return updated;
  }

  // 获取显示用的历史记录
  static getDisplayHistory(): SearchHistoryItem[] {
    return this.getHistory().slice(0, this.DISPLAY_LIMIT);
  }

  // 清空历史记录
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }

  // 删除特定搜索记录
  static removeSearch(query: string): SearchHistoryItem[] {
    const history = this.getHistory();
    const updated = history.filter(item => item.query !== query);
    this.saveHistory(updated);
    return updated;
  }

  // 获取搜索统计
  static getSearchStats() {
    const history = this.getHistory();
    
    if (history.length === 0) {
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        averageResults: 0,
        mostSearched: [],
        recentActivity: []
      };
    }

    // 统计查询频率
    const queryCount: Record<string, number> = {};
    let totalResults = 0;

    history.forEach(item => {
      queryCount[item.query] = (queryCount[item.query] || 0) + 1;
      totalResults += item.resultCount;
    });

    // 最常搜索的关键词
    const mostSearched = Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    // 最近活动（按天分组）
    const recentActivity = this.getRecentActivity(history);

    return {
      totalSearches: history.length,
      uniqueQueries: Object.keys(queryCount).length,
      averageResults: Math.round(totalResults / history.length),
      mostSearched,
      recentActivity
    };
  }

  // 获取最近活动统计
  private static getRecentActivity(history: SearchHistoryItem[]) {
    const now = new Date();
    const activity: Record<string, number> = {};

    // 统计最近7天的搜索活动
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      activity[dateKey] = 0;
    }

    history.forEach(item => {
      const dateKey = item.timestamp.toISOString().split('T')[0];
      if (activity.hasOwnProperty(dateKey)) {
        activity[dateKey]++;
      }
    });

    return Object.entries(activity)
      .map(([date, count]) => ({ date, count }))
      .reverse(); // 最新的在前
  }

  // 搜索历史中的关键词建议
  static getHistoryBasedSuggestions(query: string, limit: number = 5): string[] {
    const history = this.getHistory();
    const queryLower = query.toLowerCase();
    
    return history
      .filter(item => 
        item.query.toLowerCase().includes(queryLower) && 
        item.query.toLowerCase() !== queryLower
      )
      .map(item => item.query)
      .slice(0, limit);
  }

  // 导出搜索历史
  static exportHistory(): string {
    const history = this.getHistory();
    const stats = this.getSearchStats();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      statistics: stats,
      history: history
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // 导入搜索历史
  static importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.history && Array.isArray(data.history)) {
        // 验证数据格式
        const validHistory = data.history.filter((item: any) => 
          item.query && 
          item.timestamp && 
          typeof item.resultCount === 'number'
        );
        
        this.saveHistory(validHistory.slice(0, this.MAX_HISTORY_ITEMS));
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to import search history:', error);
      return false;
    }
  }
}