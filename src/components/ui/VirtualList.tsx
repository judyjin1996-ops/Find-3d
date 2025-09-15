import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { BaseProps } from '../../types/ui';

interface VirtualListProps<T> extends BaseProps {
  /** 数据列表 */
  items: T[];
  /** 每项的高度 */
  itemHeight: number;
  /** 容器高度 */
  height: number;
  /** 渲染项的函数 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 预渲染的项数（上下各多渲染几项） */
  overscan?: number;
  /** 滚动到指定索引 */
  scrollToIndex?: number;
  /** 滚动事件回调 */
  onScroll?: (scrollTop: number) => void;
  /** 到达底部的回调 */
  onReachBottom?: () => void;
  /** 底部阈值 */
  bottomThreshold?: number;
}

/**
 * 虚拟滚动列表组件
 * 用于优化大量数据的渲染性能
 */
export const VirtualList = <T,>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 5,
  scrollToIndex,
  onScroll,
  onReachBottom,
  bottomThreshold = 100,
  className = '',
  ...props
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const containerHeight = height;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, height, items.length, overscan]);

  // 可见项
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  // 总高度
  const totalHeight = items.length * itemHeight;

  // 偏移量
  const offsetY = visibleRange.start * itemHeight;

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // 检查是否到达底部
    if (onReachBottom) {
      const { scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - newScrollTop - clientHeight <= bottomThreshold) {
        onReachBottom();
      }
    }

    // 标记正在滚动
    isScrollingRef.current = true;
    
    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 设置滚动结束定时器
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, [onScroll, onReachBottom, bottomThreshold]);

  // 滚动到指定索引
  useEffect(() => {
    if (typeof scrollToIndex === 'number' && containerRef.current) {
      const targetScrollTop = scrollToIndex * itemHeight;
      containerRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [scrollToIndex, itemHeight]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{
        height,
        overflowY: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
      {...props}
    >
      {/* 总高度占位符 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可见项容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={actualIndex}
                style={{
                  height: itemHeight,
                  overflow: 'hidden'
                }}
                className="virtual-list-item"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 动态高度虚拟列表组件
 * 支持不同高度的项
 */
interface DynamicVirtualListProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  /** 估算的项高度 */
  estimatedItemHeight: number;
  /** 获取项高度的函数 */
  getItemHeight?: (item: T, index: number) => number;
}

export const DynamicVirtualList = <T,>({
  items,
  estimatedItemHeight,
  getItemHeight,
  height,
  renderItem,
  overscan = 5,
  scrollToIndex,
  onScroll,
  onReachBottom,
  bottomThreshold = 100,
  className = '',
  ...props
}: DynamicVirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 计算项的累积高度
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    for (let i = 0; i < items.length; i++) {
      const itemHeight = itemHeights[i] || 
        (getItemHeight ? getItemHeight(items[i], i) : estimatedItemHeight);
      heights.push(heights[i] + itemHeight);
    }
    return heights;
  }, [items, itemHeights, getItemHeight, estimatedItemHeight]);

  // 查找可见范围
  const visibleRange = useMemo(() => {
    const findIndex = (targetHeight: number) => {
      let left = 0;
      let right = cumulativeHeights.length - 1;
      
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (cumulativeHeights[mid] < targetHeight) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      
      return Math.max(0, left - 1);
    };

    const startIndex = findIndex(scrollTop);
    const endIndex = findIndex(scrollTop + height);

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, height, cumulativeHeights, items.length, overscan]);

  // 可见项
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  // 总高度
  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1];

  // 偏移量
  const offsetY = cumulativeHeights[visibleRange.start];

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // 检查是否到达底部
    if (onReachBottom) {
      const { scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - newScrollTop - clientHeight <= bottomThreshold) {
        onReachBottom();
      }
    }
  }, [onScroll, onReachBottom, bottomThreshold]);

  // 测量项高度
  useEffect(() => {
    const newHeights = [...itemHeights];
    let hasChanges = false;

    itemRefs.current.forEach((ref, index) => {
      if (ref) {
        const actualIndex = visibleRange.start + index;
        const height = ref.offsetHeight;
        if (newHeights[actualIndex] !== height) {
          newHeights[actualIndex] = height;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setItemHeights(newHeights);
    }
  }, [visibleItems, visibleRange.start, itemHeights]);

  return (
    <div
      ref={containerRef}
      className={`dynamic-virtual-list-container ${className}`}
      style={{
        height,
        overflowY: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
      {...props}
    >
      {/* 总高度占位符 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可见项容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={actualIndex}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className="dynamic-virtual-list-item"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualList;