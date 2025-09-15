/**
 * 用户配置服务
 * 管理用户个性化设置和偏好
 */

export interface DisplayField {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  width?: number;
  format?: 'text' | 'image' | 'price' | 'date' | 'number' | 'badge' | 'link';
}

export interface UserConfig {
  // 显示配置
  display: {
    cardStyle: 'compact' | 'standard' | 'detailed';
    fieldsToShow: DisplayField[];
    resultsPerPage: number;
    sortBy: 'relevance' | 'date' | 'price' | 'downloads' | 'rating';
    sortOrder: 'asc' | 'desc';
    showPreviewImages: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    enableLazyLoading: boolean;
    gridColumns: number; // 网格列数
    compactMode: boolean; // 紧凑模式
  };
  
  // 搜索配置
  search: {
    defaultWebsites: string[];
    searchMode: 'fast' | 'comprehensive';
    enableCache: boolean;
    cacheExpiry: number; // 小时
    maxConcurrentCrawlers: number;
    autoSearch: boolean; // 输入时自动搜索
    searchDelay: number; // 搜索延迟（毫秒）
    enableFilters: boolean;
    defaultFilters: {
      priceRange?: [number, number];
      category?: string;
      fileFormat?: string[];
      isFree?: boolean;
    };
  };
  
  // 界面配置
  interface: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    showAdvancedOptions: boolean;
    enableAnimations: boolean;
    fontSize: 'small' | 'medium' | 'large';
    sidebarCollapsed: boolean;
    showTooltips: boolean;
    enableKeyboardShortcuts: boolean;
  };
  
  // 隐私配置
  privacy: {
    saveSearchHistory: boolean;
    maxHistoryItems: number;
    autoDeleteHistory: boolean;
    historyRetentionDays: number;
    enableAnalytics: boolean;
    shareUsageData: boolean;
  };
  
  // 性能配置
  performance: {
    enableImagePreloading: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    enableLazyLoading: boolean;
    maxCacheSize: number; // MB
    enableServiceWorker: boolean;
    prefetchResults: boolean;
  };

  // 通知配置
  notifications: {
    enableDesktopNotifications: boolean;
    enableSoundNotifications: boolean;
    notifyOnSearchComplete: boolean;
    notifyOnErrors: boolean;
    notificationDuration: number; // 秒
  };

  // 快捷键配置
  shortcuts: {
    search: string;
    clearSearch: string;
    toggleFilters: string;
    nextPage: string;
    prevPage: string;
    toggleView: string;
  };

  // 个性化推荐
  personalization: {
    enableRecommendations: boolean;
    trackSearchHistory: boolean;
    recommendBasedOnHistory: boolean;
    favoriteCategories: string[];
    favoriteWebsites: string[];
    recentSearches: string[];
  };
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  websites: string[];
  resultCount: number;
  filters?: any;
  searchTime: number;
}

export interface UserPreferences {
  favoriteResults: string[];
  bookmarkedSearches: string[];
  customCategories: string[];
  hiddenWebsites: string[];
  preferredLanguages: string[];
}

export class UserConfigService {
  private config: UserConfig;
  private searchHistory: SearchHistoryItem[] = [];
  private preferences: UserPreferences;
  private configKey = 'find3d_user_config';
  private historyKey = 'find3d_search_history';
  private preferencesKey = 'find3d_user_preferences';

  constructor() {
    this.config = this.getDefaultConfig();
    this.preferences = this.getDefaultPreferences();
    this.loadConfig();
    this.loadSearchHistory();
    this.loadPreferences();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): UserConfig {
    return {
      display: {
        cardStyle: 'standard',
        fieldsToShow: [
          { key: 'title', label: '标题', visible: true, order: 1, format: 'text' },
          { key: 'previewImages', label: '预览图', visible: true, order: 2, format: 'image' },
          { key: 'price', label: '价格', visible: true, order: 3, format: 'price' },
          { key: 'isFree', label: '免费', visible: true, order: 4, format: 'badge' },
          { key: 'sourceWebsite', label: '来源', visible: true, order: 5, format: 'text' },
          { key: 'downloadCount', label: '下载数', visible: true, order: 6, format: 'number' },
          { key: 'fileFormat', label: '格式', visible: true, order: 7, format: 'text' },
          { key: 'fileSize', label: '大小', visible: true, order: 8, format: 'text' },
          { key: 'rating', label: '评分', visible: false, order: 9, format: 'number' },
          { key: 'uploadDate', label: '上传日期', visible: false, order: 10, format: 'date' },
          { key: 'tags', label: '标签', visible: false, order: 11, format: 'text' },
          { key: 'author', label: '作者', visible: false, order: 12, format: 'text' }
        ],
        resultsPerPage: 20,
        sortBy: 'relevance',
        sortOrder: 'desc',
        showPreviewImages: true,
        imageQuality: 'medium',
        enableLazyLoading: true,
        gridColumns: 3,
        compactMode: false
      },
      search: {
        defaultWebsites: ['modown', 'cgown', 'c4dsky', '3dxy'],
        searchMode: 'comprehensive',
        enableCache: true,
        cacheExpiry: 24,
        maxConcurrentCrawlers: 4,
        autoSearch: false,
        searchDelay: 500,
        enableFilters: true,
        defaultFilters: {}
      },
      interface: {
        theme: 'auto',
        language: 'zh-CN',
        showAdvancedOptions: false,
        enableAnimations: true,
        fontSize: 'medium',
        sidebarCollapsed: false,
        showTooltips: true,
        enableKeyboardShortcuts: true
      },
      privacy: {
        saveSearchHistory: true,
        maxHistoryItems: 100,
        autoDeleteHistory: false,
        historyRetentionDays: 30,
        enableAnalytics: false,
        shareUsageData: false
      },
      performance: {
        enableImagePreloading: true,
        imageQuality: 'medium',
        enableLazyLoading: true,
        maxCacheSize: 100,
        enableServiceWorker: true,
        prefetchResults: false
      },
      notifications: {
        enableDesktopNotifications: false,
        enableSoundNotifications: false,
        notifyOnSearchComplete: true,
        notifyOnErrors: true,
        notificationDuration: 5
      },
      shortcuts: {
        search: 'Ctrl+K',
        clearSearch: 'Ctrl+L',
        toggleFilters: 'Ctrl+F',
        nextPage: 'ArrowRight',
        prevPage: 'ArrowLeft',
        toggleView: 'Ctrl+V'
      },
      personalization: {
        enableRecommendations: true,
        trackSearchHistory: true,
        recommendBasedOnHistory: true,
        favoriteCategories: [],
        favoriteWebsites: [],
        recentSearches: []
      }
    };
  }

  /**
   * 获取默认偏好设置
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      favoriteResults: [],
      bookmarkedSearches: [],
      customCategories: [],
      hiddenWebsites: [],
      preferredLanguages: ['zh-CN', 'en']
    };
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        const savedConfig = JSON.parse(saved);
        this.config = this.mergeConfig(this.config, savedConfig);
      }
    } catch (error) {
      console.warn('加载用户配置失败:', error);
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('保存用户配置失败:', error);
    }
  }

  /**
   * 合并配置（深度合并）
   */
  private mergeConfig(defaultConfig: any, savedConfig: any): any {
    const merged = { ...defaultConfig };
    
    for (const key in savedConfig) {
      if (savedConfig[key] && typeof savedConfig[key] === 'object' && !Array.isArray(savedConfig[key])) {
        merged[key] = this.mergeConfig(defaultConfig[key] || {}, savedConfig[key]);
      } else {
        merged[key] = savedConfig[key];
      }
    }
    
    return merged;
  }

  /**
   * 获取配置
   */
  getConfig(): UserConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<UserConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.saveConfig();
  }

  /**
   * 重置配置
   */
  resetConfig(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
  }

  /**
   * 获取显示字段配置
   */
  getDisplayFields(): DisplayField[] {
    return [...this.config.display.fieldsToShow].sort((a, b) => a.order - b.order);
  }

  /**
   * 更新显示字段配置
   */
  updateDisplayFields(fields: DisplayField[]): void {
    this.config.display.fieldsToShow = fields;
    this.saveConfig();
  }

  /**
   * 加载搜索历史
   */
  private loadSearchHistory(): void {
    if (!this.config.privacy.saveSearchHistory) return;

    try {
      const saved = localStorage.getItem(this.historyKey);
      if (saved) {
        const history = JSON.parse(saved);
        this.searchHistory = history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        
        // 清理过期历史
        this.cleanupSearchHistory();
      }
    } catch (error) {
      console.warn('加载搜索历史失败:', error);
    }
  }

  /**
   * 保存搜索历史
   */
  private saveSearchHistory(): void {
    if (!this.config.privacy.saveSearchHistory) return;

    try {
      localStorage.setItem(this.historyKey, JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }

  /**
   * 添加搜索历史
   */
  addSearchHistory(item: Omit<SearchHistoryItem, 'id' | 'timestamp'>): void {
    if (!this.config.privacy.saveSearchHistory) return;

    const historyItem: SearchHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    // 检查是否已存在相同的搜索
    const existingIndex = this.searchHistory.findIndex(h => 
      h.query === item.query && 
      JSON.stringify(h.websites) === JSON.stringify(item.websites)
    );

    if (existingIndex >= 0) {
      // 更新现有记录
      this.searchHistory[existingIndex] = historyItem;
    } else {
      // 添加新记录
      this.searchHistory.unshift(historyItem);
    }

    // 限制历史记录数量
    if (this.searchHistory.length > this.config.privacy.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.config.privacy.maxHistoryItems);
    }

    // 更新最近搜索
    this.updateRecentSearches(item.query);

    this.saveSearchHistory();
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory(): SearchHistoryItem[] {
    return [...this.searchHistory];
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveSearchHistory();
    localStorage.removeItem(this.historyKey);
  }

  /**
   * 清理过期搜索历史
   */
  private cleanupSearchHistory(): void {
    if (!this.config.privacy.autoDeleteHistory) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.privacy.historyRetentionDays);

    this.searchHistory = this.searchHistory.filter(item => item.timestamp > cutoffDate);
    this.saveSearchHistory();
  }

  /**
   * 更新最近搜索
   */
  private updateRecentSearches(query: string): void {
    const recentSearches = this.config.personalization.recentSearches;
    const index = recentSearches.indexOf(query);
    
    if (index >= 0) {
      recentSearches.splice(index, 1);
    }
    
    recentSearches.unshift(query);
    
    // 限制数量
    if (recentSearches.length > 10) {
      recentSearches.splice(10);
    }
    
    this.saveConfig();
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(query: string): string[] {
    if (!query.trim()) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // 从历史记录中获取建议
    this.searchHistory.forEach(item => {
      if (item.query.toLowerCase().includes(queryLower)) {
        suggestions.add(item.query);
      }
    });

    // 从最近搜索中获取建议
    this.config.personalization.recentSearches.forEach(search => {
      if (search.toLowerCase().includes(queryLower)) {
        suggestions.add(search);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * 加载偏好设置
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem(this.preferencesKey);
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('加载用户偏好失败:', error);
    }
  }

  /**
   * 保存偏好设置
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(this.preferencesKey, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('保存用户偏好失败:', error);
    }
  }

  /**
   * 获取偏好设置
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * 更新偏好设置
   */
  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  /**
   * 添加收藏结果
   */
  addFavoriteResult(resultId: string): void {
    if (!this.preferences.favoriteResults.includes(resultId)) {
      this.preferences.favoriteResults.push(resultId);
      this.savePreferences();
    }
  }

  /**
   * 移除收藏结果
   */
  removeFavoriteResult(resultId: string): void {
    const index = this.preferences.favoriteResults.indexOf(resultId);
    if (index >= 0) {
      this.preferences.favoriteResults.splice(index, 1);
      this.savePreferences();
    }
  }

  /**
   * 检查是否为收藏结果
   */
  isFavoriteResult(resultId: string): boolean {
    return this.preferences.favoriteResults.includes(resultId);
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    const exportData = {
      config: this.config,
      preferences: this.preferences,
      searchHistory: this.config.privacy.saveSearchHistory ? this.searchHistory : [],
      exportTime: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(configData: string): boolean {
    try {
      const importData = JSON.parse(configData);
      
      if (importData.config) {
        this.config = this.mergeConfig(this.getDefaultConfig(), importData.config);
        this.saveConfig();
      }
      
      if (importData.preferences) {
        this.preferences = { ...this.getDefaultPreferences(), ...importData.preferences };
        this.savePreferences();
      }
      
      if (importData.searchHistory && this.config.privacy.saveSearchHistory) {
        this.searchHistory = importData.searchHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        this.saveSearchHistory();
      }
      
      return true;
    } catch (error) {
      console.error('导入配置失败:', error);
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSearches: number;
    favoriteResults: number;
    configSize: number;
    lastSearchTime?: Date;
    mostSearchedQuery?: string;
  } {
    const totalSearches = this.searchHistory.length;
    const favoriteResults = this.preferences.favoriteResults.length;
    const configSize = JSON.stringify(this.config).length;
    const lastSearchTime = this.searchHistory[0]?.timestamp;
    
    // 统计最常搜索的关键词
    const queryCount = new Map<string, number>();
    this.searchHistory.forEach(item => {
      queryCount.set(item.query, (queryCount.get(item.query) || 0) + 1);
    });
    
    const mostSearchedQuery = Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      totalSearches,
      favoriteResults,
      configSize,
      lastSearchTime,
      mostSearchedQuery
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 清理过期历史
    this.cleanupSearchHistory();
    console.log('🧹 用户配置服务资源清理完成');
  }
}

// 创建全局用户配置服务实例
export const userConfigService = new UserConfigService();

// 默认导出
export default userConfigService;