import { useState, useCallback, useRef } from 'react';
import type { 
  SearchState, 
  SearchParams, 
  SearchHistoryItem,
  WebsiteSearchStatus,
  AppError
} from '../types';
import { 
  searchMaterials, 
  searchMaterialsByWebsite,
  searchMaterialsLive,
  createSearchError 
} from '../services/searchService';
import { SearchHistoryService } from '../services/searchHistoryService';
import { ErrorType } from '../types';

interface UseSearchOptions {
  onSearchComplete?: (results: any) => void;
  onSearchError?: (error: AppError) => void;
  onSearchProgress?: (progress: { completedWebsites: string[]; results: any[]; totalProgress: number }) => void;
  onSuccess?: (resultCount: number) => void;
  onError?: (error: AppError) => void;
  enableLiveSearch?: boolean;
  enableGroupedResults?: boolean;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const { 
    onSearchComplete, 
    onSearchError, 
    onSearchProgress,
    onSuccess,
    onError,
    enableLiveSearch = false,
    enableGroupedResults = false
  } = options;
  
  // 搜索状态
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    loading: false,
    results: [],
    totalCount: 0,
    searchTime: 0,
    websiteStatus: {},
    websiteStatuses: [],
    resultGroups: []
  });
  
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    return SearchHistoryService.getDisplayHistory();
  });
  
  // 网站状态
  const [websiteStatuses, setWebsiteStatuses] = useState<WebsiteSearchStatus[]>([]);
  
  // 历史记录可见性
  const [historyVisible, setHistoryVisible] = useState(false);
  
  // 搜索取消控制
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 添加搜索历史
  const addToHistory = useCallback((query: string, resultCount: number) => {
    SearchHistoryService.addSearch(query, resultCount);
    setSearchHistory(SearchHistoryService.getDisplayHistory());
  }, []);
  
  // 清空搜索历史
  const clearHistory = useCallback(() => {
    SearchHistoryService.clearHistory();
    setSearchHistory([]);
  }, []);

  // 删除单个搜索记录
  const removeFromHistory = useCallback((query: string) => {
    SearchHistoryService.removeSearch(query);
    setSearchHistory(SearchHistoryService.getDisplayHistory());
  }, []);

  // 获取搜索统计
  const getSearchStats = useCallback(() => {
    return SearchHistoryService.getSearchStats();
  }, []);
  
  // 切换历史记录可见性
  const toggleHistory = useCallback(() => {
    setHistoryVisible(prev => !prev);
  }, []);
  
  // 执行搜索
  const performSearch = useCallback(async (query: string, filters?: any) => {
    // 取消之前的搜索
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的取消控制器
    abortControllerRef.current = new AbortController();
    
    // 更新搜索状态
    setSearchState(prev => ({
      ...prev,
      query,
      loading: true,
      error: undefined,
      results: [],
      resultGroups: []
    }));
    
    // 重置网站状态
    setWebsiteStatuses([]);
    
    try {
      const params: SearchParams = {
        query: query.trim(),
        filters,
        limit: 50
      };
      
      let response;
      
      if (enableLiveSearch) {
        // 实时搜索模式
        response = await searchMaterialsLive(
          params,
          (progress) => {
            // 更新实时进度
            setSearchState(prev => ({
              ...prev,
              results: progress.results,
              totalCount: progress.results.length
            }));
            
            onSearchProgress?.(progress);
          },
          abortControllerRef.current.signal
        );
      } else if (enableGroupedResults) {
        // 分组搜索模式
        const groups = await searchMaterialsByWebsite(params, abortControllerRef.current.signal);
        
        // 聚合所有结果
        const allResults = groups.flatMap(group => group.results);
        const websiteStatus: Record<string, 'success' | 'error' | 'timeout' | 'cancelled'> = {};
        const websiteStatuses: WebsiteSearchStatus[] = [];
        
        groups.forEach(group => {
          websiteStatus[group.website] = group.status === 'success' ? 'success' : 'error';
          websiteStatuses.push({
            websiteId: group.website,
            websiteName: group.websiteName,
            status: group.status === 'success' ? 'success' : 'error',
            resultCount: group.results.length,
            error: group.error,
            searchTime: group.searchTime
          });
        });
        
        response = {
          results: allResults,
          totalCount: allResults.length,
          searchTime: Math.max(...groups.map(g => g.searchTime || 0)),
          websiteStatus,
          websiteStatuses,
          resultGroups: groups
        };
      } else {
        // 标准搜索模式
        response = await searchMaterials(params, abortControllerRef.current.signal);
      }
      
      // 检查是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // 更新搜索状态
      setSearchState(prev => ({
        ...prev,
        loading: false,
        results: response.results,
        totalCount: response.totalCount,
        searchTime: response.searchTime,
        websiteStatus: response.websiteStatus,
        websiteStatuses: response.websiteStatuses,
        performanceMetrics: response.performanceMetrics,
        resultGroups: response.resultGroups
      }));
      
      // 更新网站状态
      if (response.websiteStatuses) {
        setWebsiteStatuses(response.websiteStatuses);
      } else {
        const statuses: WebsiteSearchStatus[] = Object.entries(response.websiteStatus).map(([websiteId, status]) => ({
          websiteId,
          status,
          resultCount: response.results.filter(r => r.sourceWebsite === websiteId).length
        }));
        setWebsiteStatuses(statuses);
      }
      
      // 添加到搜索历史
      addToHistory(query, response.totalCount);
      
      // 调用完成回调
      onSearchComplete?.(response);
      
      // 调用成功回调
      onSuccess?.(response.totalCount);
      
    } catch (error) {
      // 检查是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const appError = createSearchError(
        ErrorType.API_ERROR,
        error instanceof Error ? error.message : '搜索失败',
        error
      );
      
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: appError.message
      }));
      
      onSearchError?.(appError);
      onError?.(appError);
    }
  }, [addToHistory, onSearchComplete, onSearchError, onSearchProgress, enableLiveSearch, enableGroupedResults]);
  
  // 取消搜索
  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setSearchState(prev => ({
      ...prev,
      loading: false
    }));
  }, []);
  
  // 清空搜索结果
  const clearResults = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      results: [],
      totalCount: 0,
      error: undefined,
      resultGroups: [],
      performanceMetrics: undefined
    }));
    setWebsiteStatuses([]);
  }, []);
  
  // 从历史记录搜索
  const searchFromHistory = useCallback((query: string) => {
    performSearch(query);
    setHistoryVisible(false);
  }, [performSearch]);
  
  return {
    // 状态
    searchState,
    searchHistory,
    websiteStatuses,
    historyVisible,
    
    // 操作
    performSearch,
    cancelSearch,
    clearResults,
    searchFromHistory,
    
    // 历史记录操作
    clearHistory,
    removeFromHistory,
    toggleHistory,
    getSearchStats,
    
    // 便捷属性
    isLoading: searchState.loading,
    hasResults: searchState.results.length > 0,
    hasError: !!searchState.error
  };
};