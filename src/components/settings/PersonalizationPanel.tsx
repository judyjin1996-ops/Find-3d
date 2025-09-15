/**
 * 个性化推荐面板
 * 基于用户搜索历史和偏好提供个性化推荐
 */

import React, { useState, useEffect } from 'react';
import { userConfigService, SearchHistoryItem } from '../../services/userConfigService';
import { ExtractedMaterialResult } from '../../crawler/types/crawler';

interface PersonalizationPanelProps {
  onSearchRecommendation?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
  className?: string;
}

interface Recommendation {
  type: 'query' | 'category' | 'website' | 'result';
  title: string;
  description: string;
  confidence: number; // 推荐置信度 0-1
  data: any;
}

export const PersonalizationPanel: React.FC<PersonalizationPanelProps> = ({
  onSearchRecommendation,
  onCategorySelect,
  className = ''
}) => {
  const [config, setConfig] = useState(userConfigService.getConfig());
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [preferences, setPreferences] = useState(userConfigService.getPreferences());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // 加载数据
  const loadData = () => {
    const history = userConfigService.getSearchHistory();
    setSearchHistory(history);
    generateRecommendations(history);
  };

  // 生成个性化推荐
  const generateRecommendations = (history: SearchHistoryItem[]) => {
    if (!config.personalization.enableRecommendations) {
      setRecommendations([]);
      return;
    }

    const recs: Recommendation[] = [];

    // 基于搜索频率的关键词推荐
    const queryRecommendations = generateQueryRecommendations(history);
    recs.push(...queryRecommendations);

    // 基于搜索模式的网站推荐
    const websiteRecommendations = generateWebsiteRecommendations(history);
    recs.push(...websiteRecommendations);

    // 基于时间模式的分类推荐
    const categoryRecommendations = generateCategoryRecommendations(history);
    recs.push(...categoryRecommendations);

    // 基于搜索结果的相关推荐
    const relatedRecommendations = generateRelatedRecommendations(history);
    recs.push(...relatedRecommendations);

    // 按置信度排序
    recs.sort((a, b) => b.confidence - a.confidence);
    setRecommendations(recs.slice(0, 10)); // 最多显示10个推荐
  };

  // 生成查询推荐
  const generateQueryRecommendations = (history: SearchHistoryItem[]): Recommendation[] => {
    const queryCount = new Map<string, number>();
    const queryResults = new Map<string, number>();

    history.forEach(item => {
      const query = item.query.toLowerCase();
      queryCount.set(query, (queryCount.get(query) || 0) + 1);
      queryResults.set(query, (queryResults.get(query) || 0) + item.resultCount);
    });

    const recommendations: Recommendation[] = [];

    // 推荐搜索频率高但最近没搜索的关键词
    const recentQueries = new Set(history.slice(0, 5).map(h => h.query.toLowerCase()));
    
    for (const [query, count] of queryCount.entries()) {
      if (count >= 2 && !recentQueries.has(query)) {
        const avgResults = queryResults.get(query)! / count;
        const confidence = Math.min(0.9, (count / 10) * (avgResults / 50));
        
        if (confidence > 0.3) {
          recommendations.push({
            type: 'query',
            title: `再次搜索 "${query}"`,
            description: `您之前搜索过 ${count} 次，平均找到 ${Math.round(avgResults)} 个结果`,
            confidence,
            data: { query, count, avgResults }
          });
        }
      }
    }

    return recommendations;
  };

  // 生成网站推荐
  const generateWebsiteRecommendations = (history: SearchHistoryItem[]): Recommendation[] => {
    const websiteStats = new Map<string, { count: number; totalResults: number }>();

    history.forEach(item => {
      item.websites.forEach(website => {
        const stats = websiteStats.get(website) || { count: 0, totalResults: 0 };
        stats.count++;
        stats.totalResults += item.resultCount;
        websiteStats.set(website, stats);
      });
    });

    const recommendations: Recommendation[] = [];
    const currentWebsites = new Set(config.search.defaultWebsites);

    for (const [website, stats] of websiteStats.entries()) {
      if (!currentWebsites.has(website) && stats.count >= 3) {
        const avgResults = stats.totalResults / stats.count;
        const confidence = Math.min(0.8, (stats.count / 20) * (avgResults / 30));
        
        if (confidence > 0.4) {
          recommendations.push({
            type: 'website',
            title: `添加 ${website} 到默认搜索`,
            description: `您经常在此网站找到结果，平均每次 ${Math.round(avgResults)} 个`,
            confidence,
            data: { website, stats }
          });
        }
      }
    }

    return recommendations;
  };

  // 生成分类推荐
  const generateCategoryRecommendations = (history: SearchHistoryItem[]): Recommendation[] => {
    // 分析搜索关键词中的分类模式
    const categoryKeywords = {
      '建筑': ['建筑', '房屋', '楼房', '别墅', '办公楼', '商场'],
      '交通工具': ['汽车', '车辆', '飞机', '船舶', '火车', '摩托车'],
      '家具': ['桌子', '椅子', '沙发', '床', '柜子', '家具'],
      '电子产品': ['手机', '电脑', '电视', '音响', '相机', '电器'],
      '人物角色': ['人物', '角色', '人体', '动物', '卡通'],
      '装饰用品': ['装饰', '摆件', '花瓶', '画框', '灯具']
    };

    const categoryCount = new Map<string, number>();

    history.forEach(item => {
      const query = item.query.toLowerCase();
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => query.includes(keyword))) {
          categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        }
      }
    });

    const recommendations: Recommendation[] = [];
    const favoriteCategories = new Set(config.personalization.favoriteCategories);

    for (const [category, count] of categoryCount.entries()) {
      if (!favoriteCategories.has(category) && count >= 2) {
        const confidence = Math.min(0.7, count / 10);
        
        recommendations.push({
          type: 'category',
          title: `关注 ${category} 分类`,
          description: `您经常搜索此类内容，添加到收藏分类可获得更好的推荐`,
          confidence,
          data: { category, count }
        });
      }
    }

    return recommendations;
  };

  // 生成相关推荐
  const generateRelatedRecommendations = (history: SearchHistoryItem[]): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // 基于搜索时间模式推荐
    const timePatterns = analyzeTimePatterns(history);
    if (timePatterns.peakHour !== -1) {
      recommendations.push({
        type: 'query',
        title: '定时搜索提醒',
        description: `您通常在 ${timePatterns.peakHour}:00 左右搜索，要设置提醒吗？`,
        confidence: 0.5,
        data: { peakHour: timePatterns.peakHour }
      });
    }

    // 基于搜索结果数量推荐搜索策略
    const avgResults = history.reduce((sum, h) => sum + h.resultCount, 0) / history.length;
    if (avgResults < 10) {
      recommendations.push({
        type: 'query',
        title: '优化搜索策略',
        description: '您的搜索结果较少，建议使用更通用的关键词或启用全面搜索模式',
        confidence: 0.6,
        data: { avgResults }
      });
    }

    return recommendations;
  };

  // 分析时间模式
  const analyzeTimePatterns = (history: SearchHistoryItem[]) => {
    const hourCount = new Array(24).fill(0);
    
    history.forEach(item => {
      const hour = item.timestamp.getHours();
      hourCount[hour]++;
    });

    const maxCount = Math.max(...hourCount);
    const peakHour = maxCount > 2 ? hourCount.indexOf(maxCount) : -1;

    return { peakHour, hourCount };
  };

  // 应用推荐
  const applyRecommendation = (recommendation: Recommendation) => {
    switch (recommendation.type) {
      case 'query':
        if (recommendation.data.query) {
          onSearchRecommendation?.(recommendation.data.query);
        }
        break;
      
      case 'category':
        if (recommendation.data.category) {
          // 添加到收藏分类
          const newCategories = [...config.personalization.favoriteCategories, recommendation.data.category];
          userConfigService.updateConfig({
            personalization: {
              ...config.personalization,
              favoriteCategories: newCategories
            }
          });
          setConfig(userConfigService.getConfig());
          onCategorySelect?.(recommendation.data.category);
        }
        break;
      
      case 'website':
        if (recommendation.data.website) {
          // 添加到默认网站
          const newWebsites = [...config.search.defaultWebsites, recommendation.data.website];
          userConfigService.updateConfig({
            search: {
              ...config.search,
              defaultWebsites: newWebsites
            }
          });
          setConfig(userConfigService.getConfig());
        }
        break;
    }

    // 移除已应用的推荐
    setRecommendations(prev => prev.filter(r => r !== recommendation));
  };

  // 忽略推荐
  const dismissRecommendation = (recommendation: Recommendation) => {
    setRecommendations(prev => prev.filter(r => r !== recommendation));
  };

  // 获取推荐图标
  const getRecommendationIcon = (type: string): string => {
    switch (type) {
      case 'query': return '🔍';
      case 'category': return '📂';
      case 'website': return '🌐';
      case 'result': return '📄';
      default: return '💡';
    }
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          🎯 个性化推荐
        </h3>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.personalization.enableRecommendations}
              onChange={(e) => {
                userConfigService.updateConfig({
                  personalization: {
                    ...config.personalization,
                    enableRecommendations: e.target.checked
                  }
                });
                setConfig(userConfigService.getConfig());
                if (e.target.checked) {
                  generateRecommendations(searchHistory);
                } else {
                  setRecommendations([]);
                }
              }}
              className="rounded"
            />
            启用推荐
          </label>
          
          <button
            onClick={() => generateRecommendations(searchHistory)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            🔄 刷新推荐
          </button>
        </div>
      </div>

      {!config.personalization.enableRecommendations ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-lg font-medium mb-1">个性化推荐已关闭</div>
          <div className="text-sm">启用后将基于您的搜索历史提供个性化建议</div>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-lg font-medium mb-1">暂无推荐</div>
          <div className="text-sm">
            {searchHistory.length === 0 
              ? '开始搜索后将为您生成个性化推荐'
              : '继续使用以获得更准确的推荐'
            }
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getRecommendationIcon(recommendation.type)}</span>
                    <span className="font-medium text-gray-900">{recommendation.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getConfidenceColor(recommendation.confidence)}`}>
                      {Math.round(recommendation.confidence * 100)}% 匹配
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {recommendation.description}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyRecommendation(recommendation)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      应用
                    </button>
                    <button
                      onClick={() => dismissRecommendation(recommendation)}
                      className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      忽略
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 收藏分类 */}
      {config.personalization.favoriteCategories.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">📂 收藏分类</h4>
          <div className="flex flex-wrap gap-2">
            {config.personalization.favoriteCategories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => onCategorySelect?.(category)}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 最近搜索 */}
      {config.personalization.recentSearches.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">🕒 最近搜索</h4>
          <div className="flex flex-wrap gap-2">
            {config.personalization.recentSearches.slice(0, 5).map((query, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => onSearchRecommendation?.(query)}
              >
                {query}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizationPanel;