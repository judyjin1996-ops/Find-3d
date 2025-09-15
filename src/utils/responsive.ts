/**
 * 响应式设计工具类
 * 提供断点检测、设备类型判断等功能
 */

// 断点定义
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * 获取当前窗口宽度
 */
export const getWindowWidth = (): number => {
  if (typeof window === 'undefined') return 1024; // SSR 默认值
  return window.innerWidth;
};

/**
 * 获取当前窗口高度
 */
export const getWindowHeight = (): number => {
  if (typeof window === 'undefined') return 768; // SSR 默认值
  return window.innerHeight;
};

/**
 * 检查是否匹配指定断点
 */
export const matchesBreakpoint = (breakpoint: Breakpoint): boolean => {
  const width = getWindowWidth();
  return width >= breakpoints[breakpoint];
};

/**
 * 获取当前匹配的最大断点
 */
export const getCurrentBreakpoint = (): Breakpoint => {
  const width = getWindowWidth();
  
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

/**
 * 检查是否为移动设备
 */
export const isMobile = (): boolean => {
  return !matchesBreakpoint('md');
};

/**
 * 检查是否为平板设备
 */
export const isTablet = (): boolean => {
  const width = getWindowWidth();
  return width >= breakpoints.md && width < breakpoints.lg;
};

/**
 * 检查是否为桌面设备
 */
export const isDesktop = (): boolean => {
  return matchesBreakpoint('lg');
};

/**
 * 检查是否为触摸设备
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * 获取设备类型
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

/**
 * 响应式值选择器
 * 根据当前断点选择对应的值
 */
export const responsive = <T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
  const currentBreakpoint = getCurrentBreakpoint();
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  
  // 从当前断点开始，向下查找第一个有值的断点
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
};

/**
 * 创建响应式类名
 */
export const responsiveClass = (classes: Partial<Record<Breakpoint, string>>): string => {
  const classNames: string[] = [];
  
  Object.entries(classes).forEach(([bp, className]) => {
    if (className) {
      if (bp === 'xs') {
        classNames.push(className);
      } else {
        classNames.push(`${bp}:${className}`);
      }
    }
  });
  
  return classNames.join(' ');
};

/**
 * 媒体查询钩子
 */
export const createMediaQuery = (breakpoint: Breakpoint): string => {
  return `(min-width: ${breakpoints[breakpoint]}px)`;
};

/**
 * 检查是否支持 CSS Grid
 */
export const supportsGrid = (): boolean => {
  if (typeof window === 'undefined') return true;
  return CSS.supports('display', 'grid');
};

/**
 * 检查是否支持 CSS Flexbox
 */
export const supportsFlexbox = (): boolean => {
  if (typeof window === 'undefined') return true;
  return CSS.supports('display', 'flex');
};

/**
 * 获取安全区域内边距（用于处理刘海屏等）
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
  };
};

/**
 * 响应式网格列数计算
 */
export const getGridColumns = (
  itemWidth: number,
  containerWidth?: number,
  gap: number = 16
): number => {
  const width = containerWidth || getWindowWidth();
  const availableWidth = width - gap;
  const itemWithGap = itemWidth + gap;
  return Math.max(1, Math.floor(availableWidth / itemWithGap));
};

/**
 * 防抖的窗口大小变化监听器
 */
export const createResizeObserver = (
  callback: (width: number, height: number) => void,
  debounceMs: number = 150
) => {
  if (typeof window === 'undefined') return () => {};

  let timeoutId: NodeJS.Timeout;
  
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(getWindowWidth(), getWindowHeight());
    }, debounceMs);
  };

  window.addEventListener('resize', handleResize);
  
  // 立即执行一次
  callback(getWindowWidth(), getWindowHeight());
  
  // 返回清理函数
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
  };
};

/**
 * 响应式字体大小计算
 */
export const getResponsiveFontSize = (
  baseSizePx: number,
  minSizePx: number = baseSizePx * 0.8,
  maxSizePx: number = baseSizePx * 1.2
): string => {
  const width = getWindowWidth();
  const minWidth = breakpoints.xs;
  const maxWidth = breakpoints.xl;
  
  if (width <= minWidth) return `${minSizePx}px`;
  if (width >= maxWidth) return `${maxSizePx}px`;
  
  // 线性插值
  const ratio = (width - minWidth) / (maxWidth - minWidth);
  const fontSize = minSizePx + (maxSizePx - minSizePx) * ratio;
  
  return `${Math.round(fontSize)}px`;
};

/**
 * 检查是否为高分辨率屏幕
 */
export const isHighDPI = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.devicePixelRatio > 1;
};

/**
 * 获取设备像素比
 */
export const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
};