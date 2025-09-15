/**
 * 智能缓存管理器组件
 * 提供缓存监控、管理和配置功能
 */

import React, { useState, useEffect } from 'react';
import { CacheStats, CacheCategoryStats } from '../../services/smartCacheService';
import './SmartCacheManager.css';

interface SmartCacheManagerProps {
  cacheStats: CacheStats;
  onClearCache: (type: 'all' | 'searchResults' | 'images' | 'websiteData' | 'rules') => Promise<void>;
  onClearExpired: () => Promise<void>;
  onClearByTags: (tags: string[]) => Promise<void>;
  onRefreshStats: () => Promise<void>;
  className?: string;
}

export const SmartCacheManager: React.FC<SmartCacheManagerProps> = ({
  cacheStats,
  onClearCache,
  onClearExpired,
  onClearByTags,
  onRefreshStats,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'searchResults' | 'images' | 'websiteData' | 'rules'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 自动刷新统计信息
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      onRefreshStats();
    }, 30000); // 每30秒刷新

    return () => clearInterval(interval);
  }, [autoRefresh, onRefreshStats]);

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 格式化百分比
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // 处理清理缓存
  const handleClearCache = async (type: typeof selectedCategory) => {
    setIsLoading(true);
    try {
      await onClearCache(type);
      await onRefreshStats();
    } catch (error) {
      console.error('清理缓存失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理清理过期缓存
  const handleClearExpired = async () => {
    setIsLoading(true);
    try {
      await onClearExpired();
      await onRefreshStats();
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理按标签清理
  const handleClearByTags = async () => {
    if (selectedTags.length === 0) return;
    
    setIsLoading(true);
    try {
      await onClearByTags(selectedTags);
      await onRefreshStats();
      setSelectedTags([]);
    } catch (error) {
      console.error('按标签清理缓存失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取类别统计信息
  const getCategoryStats = (category: keyof CacheStats['categories']): CacheCategoryStats => {
    return cacheStats.categories[category];
  };

  // 获取类别图标
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'searchResults': return '🔍';
      case 'images': return '🖼️';
      case 'websiteData': return '🌐';
      case 'rules': return '⚙️';
      default: return '📦';
    }
  };

  // 获取类别名称
  const getCategoryName = (category: string): string => {
    switch (category) {
      case 'searchResults': return '搜索结果';
      case 'images': return '图片缓存';
      case 'websiteData': return '网站数据';
      case 'rules': return '规则配置';
      default: return '全部';
    }
  };

  // 常用标签
  const commonTags = ['search', 'results', 'image', 'media', 'website', 'config', 'rules'];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 标题和控制 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          🗄️ 智能缓存管理器
        </h2>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自动刷新
          </label>
          
          <button
            onClick={onRefreshStats}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 总体统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{formatSize(cacheStats.totalSize)}</div>
          <div className="text-sm text-gray-600">总缓存大小</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{cacheStats.itemCount}</div>
          <div className="text-sm text-gray-600">缓存项数量</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{formatPercentage(cacheStats.hitRate)}</div>
          <div className="text-sm text-gray-600">命中率</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {formatTime(cacheStats.performance.avgAccessTime)}
          </div>
          <div className="text-sm text-gray-600">平均访问时间</div>
        </div>
      </div>

      {/* 性能指标 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">📊 性能指标</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">缓存命中</span>
              <span className="text-lg font-bold text-green-600">
                {cacheStats.performance.cacheHits}
              </span>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-800">缓存未命中</span>
              <span className="text-lg font-bold text-red-600">
                {cacheStats.performance.cacheMisses}
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">总请求数</span>
              <span className="text-lg font-bold text-blue-600">
                {cacheStats.performance.totalRequests}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 分类统计 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">📂 分类统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(cacheStats.categories).map(([category, stats]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{getCategoryIcon(category)}</span>
                <span className="font-medium text-gray-900">
                  {getCategoryName(category)}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">大小:</span>
                  <span className="font-medium">{formatSize(stats.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">数量:</span>
                  <span className="font-medium">{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">命中率:</span>
                  <span className="font-medium">{formatPercentage(stats.hitRate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 缓存操作 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">🛠️ 缓存操作</h3>
        
        {/* 按类别清理 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">按类别清理</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {['all', 'searchResults', 'images', 'websiteData', 'rules'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category as any)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getCategoryIcon(category)} {getCategoryName(category)}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handleClearCache(selectedCategory)}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '🔄 清理中...' : `🗑️ 清理${getCategoryName(selectedCategory)}`}
          </button>
        </div>

        {/* 按标签清理 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">按标签清理</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {commonTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              已选择: {selectedTags.length} 个标签
            </span>
            <button
              onClick={handleClearByTags}
              disabled={isLoading || selectedTags.length === 0}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '🔄 清理中...' : '🏷️ 按标签清理'}
            </button>
          </div>
        </div>

        {/* 其他操作 */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleClearExpired}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '🔄 清理中...' : '⏰ 清理过期缓存'}
          </button>
          
          <button
            onClick={() => handleClearCache('all')}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '🔄 清理中...' : '🗑️ 清理全部缓存'}
          </button>
        </div>
      </div>

      {/* 缓存健康状态 */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">💊 缓存健康状态</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 命中率健康度 */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              cacheStats.hitRate > 0.8 ? 'bg-green-500' :
              cacheStats.hitRate > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">命中率</div>
              <div className="text-xs text-gray-600">
                {cacheStats.hitRate > 0.8 ? '优秀' :
                 cacheStats.hitRate > 0.6 ? '良好' : '需要优化'}
              </div>
            </div>
          </div>

          {/* 响应时间健康度 */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              cacheStats.performance.avgAccessTime < 100 ? 'bg-green-500' :
              cacheStats.performance.avgAccessTime < 500 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">响应时间</div>
              <div className="text-xs text-gray-600">
                {cacheStats.performance.avgAccessTime < 100 ? '优秀' :
                 cacheStats.performance.avgAccessTime < 500 ? '良好' : '需要优化'}
              </div>
            </div>
          </div>

          {/* 存储使用率健康度 */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              cacheStats.totalSize < 50 * 1024 * 1024 ? 'bg-green-500' :
              cacheStats.totalSize < 100 * 1024 * 1024 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">存储使用</div>
              <div className="text-xs text-gray-600">
                {cacheStats.totalSize < 50 * 1024 * 1024 ? '正常' :
                 cacheStats.totalSize < 100 * 1024 * 1024 ? '较高' : '过高'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCacheManager;