import { useState, useEffect } from 'react';
import {
  getWindowWidth,
  getWindowHeight,
  getCurrentBreakpoint,
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  isTouchDevice,
  createResizeObserver,
  type Breakpoint
} from '../utils/responsive';

interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
}

/**
 * 响应式设计钩子
 * 提供当前屏幕尺寸、断点和设备类型信息
 */
export const useResponsive = (debounceMs: number = 150) => {
  const [state, setState] = useState<ResponsiveState>(() => ({
    width: getWindowWidth(),
    height: getWindowHeight(),
    breakpoint: getCurrentBreakpoint(),
    deviceType: getDeviceType(),
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    isTouchDevice: isTouchDevice()
  }));

  useEffect(() => {
    const cleanup = createResizeObserver((width, height) => {
      setState({
        width,
        height,
        breakpoint: getCurrentBreakpoint(),
        deviceType: getDeviceType(),
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
        isTouchDevice: isTouchDevice()
      });
    }, debounceMs);

    return cleanup;
  }, [debounceMs]);

  return state;
};

/**
 * 断点匹配钩子
 * 检查当前是否匹配指定断点
 */
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const { breakpoint: currentBreakpoint } = useResponsive();
  
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const targetIndex = breakpointOrder.indexOf(breakpoint);
  
  return currentIndex >= targetIndex;
};

/**
 * 媒体查询钩子
 * 监听指定的媒体查询条件
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 设置初始值
    setMatches(mediaQuery.matches);

    // 监听变化
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // 兼容旧版本浏览器
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

/**
 * 响应式值钩子
 * 根据当前断点返回对应的值
 */
export const useResponsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>
): T | undefined => {
  const { breakpoint } = useResponsive();
  
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  // 从当前断点开始，向下查找第一个有值的断点
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
};

/**
 * 容器查询钩子
 * 监听指定容器元素的尺寸变化
 */
export const useContainerQuery = (
  containerRef: React.RefObject<HTMLElement>
) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // 使用 ResizeObserver 监听容器尺寸变化
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setSize({ width, height });
        }
      });

      resizeObserver.observe(element);
      return () => resizeObserver.disconnect();
    } else {
      // 降级方案：使用 window resize 事件
      const updateSize = () => {
        const rect = element.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [containerRef]);

  return size;
};

/**
 * 方向变化钩子
 * 监听设备方向变化
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

/**
 * 首选颜色方案钩子
 * 监听系统主题偏好变化
 */
export const usePreferredColorScheme = () => {
  const [scheme, setScheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setScheme(event.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  return scheme;
};

export default useResponsive;