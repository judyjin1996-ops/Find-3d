/**
 * 智能缓存管理演示页面
 * 展示缓存管理器的完整功能
 */

import React, { useState, useEffect } from 'react';
import { SmartCacheManager } from './SmartCacheManager';
import { CachePerformanceMonitor } from './CachePerformanceMonitor';
import { CacheStrategyConfig } from './CacheStrategyConfig';
import { useSmartCache } from '../../hooks/useSmartCache';
import type { ExtractedMaterialResult } from '../../crawler/types/crawler';
import { CacheConfig } from '../../services/smartCacheService';

export const SmartCacheDemo: React.FC = () => {
  const {
    stats,
    isLoading,
    error,
    cacheSearchResults,
    getCachedSearchResults,
    cacheImage,
    getCachedImage,
    cacheWebsiteData,
    getCachedWebsiteData,
    clearCache,
    clearExpired,
    clearByTags,
    refreshStats,
    formatSize,
    formatPercentage,
    getCacheHealth
  } = useSmartCache({
    autoRefresh: true,
    refreshInterval: 10000 // 10秒刷新一次用于演示
  });

  const [demoData, setDemoData] = useState({
    searchQuery: '手机模型',
    websites: ['modown', 'cgown'],
    imageUrl: 'https://example.com/demo-image.jpg',
    websiteId: 'demo-website'
  });

  const [operationStatus, setOperationStatus] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'management' | 'config'>('overview');
  const [cacheConfig, setCacheConfig] = useState<CacheConfig>({
    maxMemorySize: 50,
    maxIndexedDBSize: 500,
    maxLocalStorageSize: 10,
    defaultTTL: 24 * 60 * 60 * 1000,
    cleanupInterval: 30 * 60 * 1000,
    compressionEnabled: true,
    encryptionEnabled: false
  });

  // 生成模拟搜索结果
  const generateMockResults = (): ExtractedMaterialResult[] => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `demo-result-${i}`,
      title: `演示素材 ${i + 1}`,
      description: `这是第 ${i + 1} 个演示素材的描述`,
      sourceWebsite: i % 2 === 0 ? '魔顿网' : 'CG资源网',
      sourceUrl: `https://example.com/material/${i + 1}`,
      previewImages: [{
        url: `https://example.com/preview/${i + 1}.jpg`,
        alt: `预览图 ${i + 1}`,
        size: 'medium' as const
      }],
      pricing: {
        isFree: i % 3 === 0,
        price: i % 3 === 0 ? undefined : (i + 1) * 10,
        currency: 'CNY'
      },
      fileInfo: {
        format: 'max',
        size: `${(i + 1) * 5}MB`
      },
      statistics: {
        downloadCount: (i + 1) * 100,
        viewCount: (i + 1) * 500,
        rating: 4 + (i * 0.2)
      },
      categorization: {
        category: '3D模型',
        tags: [`标签${i + 1}`, '演示', '测试'],
        keywords: []
      },
      timestamps: {
        uploadDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        extractedAt: new Date()
      },
      extraction: {
        ruleId: `demo-rule-${i % 2}`,
        status: 'success' as const,
        confidence: 0.9,
        missingFields: [],
        processingTime: 1000 + i * 100
      },
      quality: {
        score: 80 + i * 4,
        factors: {
          completeness: 85,
          imageQuality: 80,
          dataAccuracy: 90
        }
      }
    }));
  };

  // 生成模拟图片Blob
  const generateMockImageBlob = (): Blob => {
    // 创建一个简单的SVG图片
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16">
          演示图片
        </text>
        <text x="100" y="120" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12">
          ${new Date().toLocaleTimeString()}
        </text>
      </svg>
    `;
    return new Blob([svg], { type: 'image/svg+xml' });
  };

  // 测试搜索结果缓存
  const testSearchResultsCache = async () => {
    try {
      setOperationStatus('正在测试搜索结果缓存...');
      
      const mockResults = generateMockResults();
      const searchTime = 2500;
      
      // 缓存搜索结果
      await cacheSearchResults(
        demoData.searchQuery,
        demoData.websites,
        mockResults,
        searchTime,
        { category: '3D模型', priceRange: [0, 100] }
      );
      
      // 获取缓存的搜索结果
      const cachedResults = await getCachedSearchResults(
        demoData.searchQuery,
        demoData.websites,
        { category: '3D模型', priceRange: [0, 100] }
      );
      
      setTestResults({
        type: 'searchResults',
        cached: !!cachedResults,
        resultCount: cachedResults?.results?.length || 0,
        searchTime: cachedResults?.searchTime || 0
      });
      
      setOperationStatus('搜索结果缓存测试完成');
    } catch (err) {
      setOperationStatus(`搜索结果缓存测试失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 测试图片缓存
  const testImageCache = async () => {
    try {
      setOperationStatus('正在测试图片缓存...');
      
      const mockBlob = generateMockImageBlob();
      
      // 缓存图片
      await cacheImage(demoData.imageUrl, mockBlob);
      
      // 获取缓存的图片
      const cachedImage = await getCachedImage(demoData.imageUrl);
      
      setTestResults({
        type: 'image',
        cached: !!cachedImage,
        size: cachedImage?.size || 0,
        type: cachedImage?.type || 'unknown'
      });
      
      setOperationStatus('图片缓存测试完成');
    } catch (err) {
      setOperationStatus(`图片缓存测试失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 测试网站数据缓存
  const testWebsiteDataCache = async () => {
    try {
      setOperationStatus('正在测试网站数据缓存...');
      
      const mockConfig = {
        name: '演示网站',
        baseUrl: 'https://demo.example.com',
        searchTemplate: 'https://demo.example.com/search?q={keyword}',
        selectors: {
          title: '.title',
          image: '.preview img',
          price: '.price'
        },
        lastUpdated: new Date().toISOString()
      };
      
      // 缓存网站数据
      await cacheWebsiteData(demoData.websiteId, mockConfig);
      
      // 获取缓存的网站数据
      const cachedData = await getCachedWebsiteData(demoData.websiteId);
      
      setTestResults({
        type: 'websiteData',
        cached: !!cachedData,
        websiteName: cachedData?.name || 'unknown',
        selectorsCount: Object.keys(cachedData?.selectors || {}).length
      });
      
      setOperationStatus('网站数据缓存测试完成');
    } catch (err) {
      setOperationStatus(`网站数据缓存测试失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 批量生成测试数据
  const generateTestData = async () => {
    try {
      setOperationStatus('正在生成测试数据...');
      
      // 生成多个搜索结果缓存
      const queries = ['手机', '汽车', '建筑', '家具', '电器'];
      for (const query of queries) {
        const results = generateMockResults();
        await cacheSearchResults(query, ['demo1', 'demo2'], results, Math.random() * 3000 + 1000);
      }
      
      // 生成多个图片缓存
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.png',
        'https://example.com/image3.gif'
      ];
      for (const url of imageUrls) {
        const blob = generateMockImageBlob();
        await cacheImage(url, blob);
      }
      
      // 生成多个网站数据缓存
      const websites = ['site1', 'site2', 'site3'];
      for (const siteId of websites) {
        const config = {
          name: `网站 ${siteId}`,
          baseUrl: `https://${siteId}.example.com`,
          selectors: { title: '.title', price: '.price' }
        };
        await cacheWebsiteData(siteId, config);
      }
      
      setOperationStatus('测试数据生成完成');
    } catch (err) {
      setOperationStatus(`生成测试数据失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 获取健康状态颜色
  const getHealthColor = (health: 'excellent' | 'good' | 'poor') => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 获取健康状态文本
  const getHealthText = (health: 'excellent' | 'good' | 'poor' | 'normal' | 'high' | 'critical') => {
    switch (health) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'poor': return '较差';
      case 'normal': return '正常';
      case 'high': return '较高';
      case 'critical': return '严重';
      default: return '未知';
    }
  };

  // 应用缓存配置
  const handleApplyConfig = async () => {
    // 这里应该调用缓存服务的配置更新方法
    console.log('应用缓存配置:', cacheConfig);
    // 实际实现中需要重新初始化缓存服务
  };

  const cacheHealth = getCacheHealth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗄️ 智能缓存管理演示
          </h1>
          <p className="text-gray-600">
            展示多层缓存架构、智能缓存策略和实时监控功能
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-red-500">❌</span>
              <span className="text-red-800 font-medium">错误</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* 操作状态 */}
        {operationStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">ℹ️</span>
              <span className="text-blue-800 font-medium">状态</span>
            </div>
            <p className="text-blue-700 mt-1">{operationStatus}</p>
          </div>
        )}

        {/* 标签导航 */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: '概览', icon: '📊' },
                { key: 'performance', label: '性能监控', icon: '⚡' },
                { key: 'management', label: '缓存管理', icon: '🗄️' },
                { key: 'config', label: '策略配置', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 概览标签 */}
        {activeTab === 'overview' && (
          <>
            {/* 缓存健康状态概览 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                💊 缓存健康状态概览
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getHealthColor(cacheHealth.hitRate)}`}>
                    {formatPercentage(stats.hitRate)}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">命中率</div>
                  <div className={`text-xs ${getHealthColor(cacheHealth.hitRate)}`}>
                    {getHealthText(cacheHealth.hitRate)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getHealthColor(cacheHealth.responseTime)}`}>
                    {stats.performance.avgAccessTime.toFixed(1)}ms
                  </div>
                  <div className="text-sm text-gray-600 mb-1">平均响应时间</div>
                  <div className={`text-xs ${getHealthColor(cacheHealth.responseTime)}`}>
                    {getHealthText(cacheHealth.responseTime)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    cacheHealth.storageUsage === 'normal' ? 'text-green-600' :
                    cacheHealth.storageUsage === 'high' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formatSize(stats.totalSize)}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">存储使用量</div>
                  <div className={`text-xs ${
                    cacheHealth.storageUsage === 'normal' ? 'text-green-600' :
                    cacheHealth.storageUsage === 'high' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {getHealthText(cacheHealth.storageUsage)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 测试操作面板 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🧪 缓存功能测试
          </h2>
          
          {/* 测试参数配置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜索关键词
              </label>
              <input
                type="text"
                value={demoData.searchQuery}
                onChange={(e) => setDemoData({ ...demoData, searchQuery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片URL
              </label>
              <input
                type="text"
                value={demoData.imageUrl}
                onChange={(e) => setDemoData({ ...demoData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网站ID
              </label>
              <input
                type="text"
                value={demoData.websiteId}
                onChange={(e) => setDemoData({ ...demoData, websiteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateTestData}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                🎲 生成测试数据
              </button>
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={testSearchResultsCache}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              🔍 测试搜索结果缓存
            </button>
            
            <button
              onClick={testImageCache}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              🖼️ 测试图片缓存
            </button>
            
            <button
              onClick={testWebsiteDataCache}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              🌐 测试网站数据缓存
            </button>
          </div>

          {/* 测试结果 */}
          {testResults && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">测试结果</h3>
              <div className="text-sm text-gray-700">
                <div>类型: {testResults.type}</div>
                <div>缓存状态: {testResults.cached ? '✅ 已缓存' : '❌ 未缓存'}</div>
                {testResults.resultCount !== undefined && (
                  <div>结果数量: {testResults.resultCount}</div>
                )}
                {testResults.searchTime !== undefined && (
                  <div>搜索时间: {testResults.searchTime}ms</div>
                )}
                {testResults.size !== undefined && (
                  <div>文件大小: {testResults.size} bytes</div>
                )}
                {testResults.websiteName && (
                  <div>网站名称: {testResults.websiteName}</div>
                )}
                {testResults.selectorsCount !== undefined && (
                  <div>选择器数量: {testResults.selectorsCount}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 性能监控标签 */}
        {activeTab === 'performance' && (
          <CachePerformanceMonitor
            stats={stats}
            onRefresh={refreshStats}
          />
        )}

        {/* 缓存管理标签 */}
        {activeTab === 'management' && (
          <SmartCacheManager
            cacheStats={stats}
            onClearCache={clearCache}
            onClearExpired={clearExpired}
            onClearByTags={clearByTags}
            onRefreshStats={refreshStats}
          />
        )}

        {/* 策略配置标签 */}
        {activeTab === 'config' && (
          <CacheStrategyConfig
            config={cacheConfig}
            onConfigChange={setCacheConfig}
            onApplyConfig={handleApplyConfig}
          />
        )}

        {/* 功能说明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 智能缓存功能特性
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">🏗️ 多层缓存架构</h4>
              <ul className="space-y-1">
                <li>• 内存缓存 - 高速访问热数据</li>
                <li>• IndexedDB - 大容量持久化存储</li>
                <li>• LocalStorage - 轻量级本地存储</li>
                <li>• 智能数据分层和提升</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🧠 智能缓存策略</h4>
              <ul className="space-y-1">
                <li>• LRU淘汰算法</li>
                <li>• 数据压缩和加密</li>
                <li>• 自动过期清理</li>
                <li>• 优先级管理</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">📊 实时监控统计</h4>
              <ul className="space-y-1">
                <li>• 命中率和响应时间监控</li>
                <li>• 存储使用量统计</li>
                <li>• 分类数据分析</li>
                <li>• 健康状态评估</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🛠️ 灵活管理工具</h4>
              <ul className="space-y-1">
                <li>• 按类别清理缓存</li>
                <li>• 按标签批量操作</li>
                <li>• 过期数据自动清理</li>
                <li>• 可视化管理界面</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCacheDemo;