import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Icon } from '../ui';
import { SearchSuggestions } from './SearchSuggestions';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import type { SearchEventHandler, SearchHistoryItem } from '../../types';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: SearchEventHandler;
  loading?: boolean;
  placeholder?: string;
  className?: string;
  showHistory?: boolean;
  onToggleHistory?: () => void;
  searchHistory?: SearchHistoryItem[];
  showSuggestions?: boolean;
  /** 自动搜索延迟（毫秒） */
  autoSearchDelay?: number;
  /** 是否启用自动搜索 */
  enableAutoSearch?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  onSearch,
  loading = false,
  placeholder = '搜索三维素材...',
  className = '',
  showHistory = false,
  onToggleHistory,
  searchHistory = [],
  showSuggestions = true,
  autoSearchDelay = 500,
  enableAutoSearch = false
}) => {
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      if (query.trim() && enableAutoSearch) {
        onSearch(query.trim());
      }
    },
    autoSearchDelay
  );

  // 点击外部关闭建议面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestionsPanel(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setShowSuggestionsPanel(false);
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setShowSuggestionsPanel(false);
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestionsPanel(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (showSuggestions) {
      setShowSuggestionsPanel(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (showSuggestions && !showSuggestionsPanel) {
      setShowSuggestionsPanel(true);
    }
    
    // 触发防抖搜索
    if (enableAutoSearch) {
      debouncedSearch(newValue);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    setShowSuggestionsPanel(false);
    setIsFocused(false);
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            icon={<Icon name="search" size="sm" />}
            clearable
            onClear={handleClear}
            inputSize="lg"
            className={isFocused ? 'ring-2 ring-sketch-accent' : ''}
          />
          
          {/* 搜索建议面板 */}
          <SearchSuggestions
            query={value}
            history={searchHistory}
            onSelectSuggestion={handleSelectSuggestion}
            visible={showSuggestionsPanel && showSuggestions}
          />
        </div>
        
        <div className="flex gap-2">
          {onToggleHistory && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onToggleHistory}
              icon={<Icon name="history" size="sm" />}
              className={showHistory ? 'bg-sketch-accent text-white' : ''}
            >
              历史
            </Button>
          )}
          
          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={!value.trim() || loading}
            icon={<Icon name="search" size="sm" />}
          >
            搜索
          </Button>
        </div>
      </form>
    </div>
  );
};