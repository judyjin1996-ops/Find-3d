import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 防抖值钩子
 * 延迟更新值直到指定时间内没有新的更新
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 防抖回调钩子
 * 延迟执行回调函数直到指定时间内没有新的调用
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay, ...(deps || [])]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * 防抖搜索钩子
 * 专门用于搜索场景的防抖处理
 */
export const useDebouncedSearch = (
  searchFunction: (query: string) => void | Promise<void>,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, delay);
  const previousQueryRef = useRef('');

  // 当防抖后的查询改变时执行搜索
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();
    
    // 避免重复搜索相同的查询
    if (trimmedQuery && trimmedQuery !== previousQueryRef.current) {
      previousQueryRef.current = trimmedQuery;
      setIsSearching(true);
      
      const result = searchFunction(trimmedQuery);
      
      // 如果返回 Promise，等待完成
      if (result instanceof Promise) {
        result.finally(() => setIsSearching(false));
      } else {
        setIsSearching(false);
      }
    } else if (!trimmedQuery) {
      previousQueryRef.current = '';
      setIsSearching(false);
    }
  }, [debouncedQuery, searchFunction]);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching
  };
};

/**
 * 节流钩子
 * 限制函数执行频率
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        // 立即执行
        lastCallRef.current = now;
        callback(...args);
      } else {
        // 延迟执行
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [callback, delay]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * 防抖状态钩子
 * 管理防抖状态和加载状态
 */
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
) => {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    setIsPending(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
      setIsPending(false);
    }, delay);
  }, [delay]);

  // 立即更新（跳过防抖）
  const updateValueImmediate = useCallback((newValue: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setValue(newValue);
    setDebouncedValue(newValue);
    setIsPending(false);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    debouncedValue,
    isPending,
    updateValue,
    updateValueImmediate
  };
};

export default useDebounce;