/**
 * 智能搜索组件
 * 提供智能搜索界面，包括实时爬虫状态显示和搜索控制
 */

import React, { useState, useEffect, useCallback } from 'react';
import { crawlerService } from '../../services/crawlerService';
import { CrawlingTask } from '../../crawler/types/crawler';
import './SmartSearchComponent.css';

export interface SmartSearchComponentProps {
  onSearchResults?: (results: any[]) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export interface SearchState {
  query: string;
  selectedWebsites: string[];
  searchMode: 'fast' | 'comprehensive';
  isSearching: boolean;
  currentTask: CrawlingTask | null;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  results: any[];
  errors: string[];
}

export const SmartSearchComponent: React.FC<SmartSearchComponentProps> = ({
  onSearchResults,
  onSearchStart,
  onSearchComplete,
  onError,
  className = ''
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    selectedWebsites: [],
    searchMode: 'comprehensive',
    isSearching: false,
    currentTask: null,
    progress: { total: 0, completed: 0, failed: 0 },
    results: [],
    errors: []
  });

  const [availableWebsites, setAvailableWebsites] = useState<Array<{
    id: string;
    name: string;
    icon?: string;
    isActive: boolean;
  }>>([]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  // 初始化组件
  useEffect(() => {
    initializeComponent();
  }, []);

  // 监控搜索进度
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (searchState.isSearching && searchState.currentTask) {
      intervalId = setInterval(() => {
        updateSearchProgress();
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [searchState.isSearching, searchState.currentTask]);

  /**
   * 初始化组件
   */
  const initializeComponent = async () => {
    try {
      await crawlerService.initialize();
      const websites = crawlerService.getAvailableWebsites();
      setAvailableWebsites(websites);
      
      // 默认选择所有激活的网站
      const activeWebsites = websites.filter(w => w.isActive).map(w => w.id);
      setSearchState(prev => ({
        ...prev,
        selectedWebsites: activeWebsites
      }));
    } catch (error) {
      console.error('初始化搜索组件失败:', error);
      onError?.('搜索组件初始化失败');
    }
  };

  /**
   * 更新搜索进度
   */
  const updateSearchProgress = () => {
    if (!searchState.currentTask) return;

    const task = crawlerService.getSearchTaskStatus(searchState.currentTask.id);
    if (task) {
      setSearchState(prev => ({
        ...prev,
        currentTask: task,
        progress: task.progress,
        results: task.results,
        errors: task.errors.map(e => e.message)
      }));

      // 检查搜索是否完成
      if (task.status === 'completed' || task.status === 'failed') {
        handleSearchComplete(task);
      }
    }
  };

  /**
   * 处理搜索完成
   */
  const handleSearchComplete = (task: CrawlingTask) => {
    setSearchState(prev => ({
      ...prev,
      isSearching: false,
      currentTask: null
    }));

    if (task.status === 'completed') {
      onSearchResults?.(task.results);
      onSearchComplete?.();
    } else {
      onError?.('搜索失败');
    }
  };

  /**
   * 开始搜索
   */
  const handleSearch = async () => {
    if (!searchState.query.trim()) {
      onError?.('请输入搜索关键词');
      return;
    }

    if (searchState.selectedWebsites.length === 0) {
      onError?.('请选择至少一个网站');
      return;
    }

    try {
      setSearchState(prev => ({
        ...prev,
        isSearching: true,
        results: [],
        errors: [],
        progress: { total: 0, completed: 0, failed: 0 }
      }));

      onSearchStart?.();

      const response = await crawlerService.searchMaterials(searchState.query, {
        websites: searchState.selectedWebsites,
        mode: searchState.searchMode,
        maxResults: 50
      });

      const task = crawlerService.getSearchTaskStatus(response.taskId);
      if (task) {
        setSearchState(prev => ({
          ...prev,
          currentTask: task,
          progress: task.progress
        }));
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        currentTask: null
      }));
      onError?.('搜索失败，请重试');
    }
  };

  /**
   * 取消搜索
   */
  const handleCancelSearch = () => {
    setSearchState(prev => ({
      ...prev,
      isSearching: false,
      currentTask: null
    }));
  };

  /**
   * 处理网站选择
   */
  const handleWebsiteToggle = (websiteId: string) => {
    setSearchState(prev => ({
      ...prev,
      selectedWebsites: prev.selectedWebsites.includes(websiteId)
        ? prev.selectedWebsites.filter(id => id !== websiteId)
        : [...prev.selectedWebsites, websiteId]
    }));
  };

  /**
   * 全选/取消全选网站
   */
  const handleSelectAllWebsites = () => {
    const activeWebsites = availableWebsites.filter(w => w.isActive);
    const allSelected = activeWebsites.every(w => searchState.selectedWebsites.includes(w.id));
    
    setSearchState(prev => ({
      ...prev,
      selectedWebsites: allSelected ? [] : activeWebsites.map(w => w.id)
    }));
  };

  /**
   * 计算搜索进度百分比
   */
  const getProgressPercentage = (): number => {
    if (searchState.progress.total === 0) return 0;
    return Math.round(((searchState.progress.completed + searchState.progress.failed) / searchState.progress.total) * 100);
  };

  return (
    <div className={`smart-search-component ${className}`}>
      {/* 搜索输入区域 */}
      <div className="search-input-section">
        <div className="search-input-container">
          <input
            type="text"
            value={searchState.query}
            onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
            placeholder="输入搜索关键词，如：手机、建筑、汽车..."
            className="search-input"
            disabled={searchState.isSearching}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={searchState.isSearching ? handleCancelSearch : handleSearch}
            className={`search-button ${searchState.isSearching ? 'cancel' : 'search'}`}
            disabled={!searchState.query.trim() && !searchState.isSearching}
          >
            {searchState.isSearching ? '取消' : '搜索'}
          </button>
        </div>

        {/* 快速选项 */}
        <div className="search-options">
          <div className="search-mode-selector">
            <label className="mode-option">
              <input
                type="radio"
                value="fast"
                checked={searchState.searchMode === 'fast'}
                onChange={(e) => setSearchState(prev => ({ ...prev, searchMode: e.target.value as 'fast' | 'comprehensive' }))}
                disabled={searchState.isSearching}
              />
              <span>快速模式</span>
            </label>
            <label className="mode-option">
              <input
                type="radio"
                value="comprehensive"
                checked={searchState.searchMode === 'comprehensive'}
                onChange={(e) => setSearchState(prev => ({ ...prev, searchMode: e.target.value as 'fast' | 'comprehensive' }))}
                disabled={searchState.isSearching}
              />
              <span>全面模式</span>
            </label>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="advanced-toggle"
            disabled={searchState.isSearching}
          >
            高级选项 {showAdvanced ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* 高级选项 */}
      {showAdvanced && (
        <div className="advanced-options">
          <div className="website-selector">
            <div className="selector-header">
              <h4>选择搜索网站</h4>
              <button
                onClick={handleSelectAllWebsites}
                className="select-all-button"
                disabled={searchState.isSearching}
              >
                {availableWebsites.filter(w => w.isActive).every(w => searchState.selectedWebsites.includes(w.id)) ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="website-list">
              {availableWebsites.map(website => (
                <label key={website.id} className={`website-option ${!website.isActive ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={searchState.selectedWebsites.includes(website.id)}
                    onChange={() => handleWebsiteToggle(website.id)}
                    disabled={searchState.isSearching || !website.isActive}
                  />
                  {website.icon && <img src={website.icon} alt="" className="website-icon" />}
                  <span className="website-name">{website.name}</span>
                  {!website.isActive && <span className="inactive-badge">未激活</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 搜索状态显示 */}
      {searchState.isSearching && (
        <div className="search-status">
          <div className="status-header">
            <h4>正在搜索中...</h4>
            <div className="progress-info">
              {searchState.progress.completed + searchState.progress.failed} / {searchState.progress.total} 网站
            </div>
          </div>

          {/* 进度条 */}
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <span className="progress-text">{getProgressPercentage()}%</span>
          </div>

          {/* 详细状态 */}
          <div className="status-details">
            <div className="status-item success">
              <span className="status-label">已完成:</span>
              <span className="status-value">{searchState.progress.completed}</span>
            </div>
            <div className="status-item error">
              <span className="status-label">失败:</span>
              <span className="status-value">{searchState.progress.failed}</span>
            </div>
            <div className="status-item total">
              <span className="status-label">找到结果:</span>
              <span className="status-value">{searchState.results.length}</span>
            </div>
          </div>

          {/* 当前正在处理的网站 */}
          {searchState.currentTask && (
            <div className="current-website">
              正在处理: {searchState.selectedWebsites.map(id => 
                availableWebsites.find(w => w.id === id)?.name
              ).filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {searchState.errors.length > 0 && (
        <div className="search-errors">
          <h4>搜索过程中遇到的问题:</h4>
          <ul>
            {searchState.errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 搜索结果预览 */}
      {searchState.results.length > 0 && !searchState.isSearching && (
        <div className="search-results-preview">
          <h4>搜索完成，找到 {searchState.results.length} 个结果</h4>
          <div className="results-summary">
            {searchState.results.slice(0, 3).map((result, index) => (
              <div key={index} className="result-preview">
                {result.previewImages?.[0] && (
                  <img src={result.previewImages[0].url} alt={result.title} className="preview-image" />
                )}
                <div className="result-info">
                  <div className="result-title">{result.title}</div>
                  <div className="result-source">{result.sourceWebsite}</div>
                </div>
              </div>
            ))}
            {searchState.results.length > 3 && (
              <div className="more-results">
                还有 {searchState.results.length - 3} 个结果...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};