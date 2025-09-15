import React, { useState, useEffect } from 'react';
import { Card, Icon, Badge } from '../ui';
import type { SearchHistoryItem } from '../../types';

interface SearchSuggestionsProps {
  query: string;
  history: SearchHistoryItem[];
  onSelectSuggestion: (suggestion: string) => void;
  visible: boolean;
  className?: string;
}

// 热门搜索关键词
const POPULAR_SEARCHES = [
  '汽车模型',
  '建筑模型',
  '人物模型',
  '动物模型',
  '家具模型',
  '武器模型',
  '植物模型',
  '机械模型'
];

// 搜索分类
const SEARCH_CATEGORIES = [
  { name: '交通工具', keywords: ['汽车', '飞机', '船舶', '火车', '摩托车'] },
  { name: '建筑场景', keywords: ['房屋', '桥梁', '城市', '室内', '景观'] },
  { name: '角色动画', keywords: ['人物', '动物', '怪物', '机器人', '卡通'] },
  { name: '道具物品', keywords: ['家具', '武器', '工具', '装饰', '电器'] }
];

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  history,
  onSelectSuggestion,
  visible,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions(POPULAR_SEARCHES.slice(0, 6));
      setFilteredHistory(history.slice(0, 5));
      return;
    }

    // 过滤历史记录
    const historyMatches = history
      .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);
    setFilteredHistory(historyMatches);

    // 生成搜索建议
    const queryLower = query.toLowerCase();
    const matchingSuggestions = POPULAR_SEARCHES
      .filter(search => search.toLowerCase().includes(queryLower))
      .slice(0, 4);

    // 添加分类关键词建议
    const categoryMatches: string[] = [];
    SEARCH_CATEGORIES.forEach(category => {
      category.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(queryLower) && 
            !matchingSuggestions.includes(keyword) &&
            categoryMatches.length < 2) {
          categoryMatches.push(keyword);
        }
      });
    });

    setSuggestions([...matchingSuggestions, ...categoryMatches]);
  }, [query, history]);

  if (!visible) {
    return null;
  }

  const hasContent = suggestions.length > 0 || filteredHistory.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={`absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto ${className}`}>
      <div className="p-2">
        {/* 历史搜索匹配 */}
        {filteredHistory.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Icon name="history" size="xs" className="text-sketch-muted" />
              <span className="text-xs font-medium text-sketch-muted">搜索历史</span>
            </div>
            <div className="space-y-1">
              {filteredHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-sketch hover:bg-sketch-hover cursor-pointer transition-colors"
                  onClick={() => onSelectSuggestion(item.query)}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="search" size="xs" className="text-sketch-muted" />
                    <span className="text-sm text-sketch-text">{item.query}</span>
                  </div>
                  <Badge variant="info" size="xs">
                    {item.resultCount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 搜索建议 */}
        {suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-2">
              <Icon name="star" size="xs" className="text-sketch-muted" />
              <span className="text-xs font-medium text-sketch-muted">
                {query.trim() ? '相关建议' : '热门搜索'}
              </span>
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-sketch hover:bg-sketch-hover cursor-pointer transition-colors"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  <Icon name="search" size="xs" className="text-sketch-muted" />
                  <span className="text-sm text-sketch-text">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 搜索分类 */}
        {!query.trim() && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Icon name="grid" size="xs" className="text-sketch-muted" />
              <span className="text-xs font-medium text-sketch-muted">搜索分类</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SEARCH_CATEGORIES.map((category, index) => (
                <div
                  key={index}
                  className="p-2 rounded-sketch border border-sketch-border hover:bg-sketch-hover cursor-pointer transition-colors"
                  onClick={() => onSelectSuggestion(category.keywords[0])}
                >
                  <div className="text-sm font-medium text-sketch-text mb-1">
                    {category.name}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {category.keywords.slice(0, 3).map((keyword, kidx) => (
                      <Badge key={kidx} variant="default" size="xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};