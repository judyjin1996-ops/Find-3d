// UI组件相关类型定义

import type { ReactNode } from 'react';

// 基础组件Props
export interface BaseProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

// 按钮变体和尺寸
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 输入框类型
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
export type InputSize = 'sm' | 'md' | 'lg';

// 卡片变体
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

// 加载状态
export interface LoadingState {
  loading: boolean;
  progress?: number;
  message?: string;
}

// 模态框配置
export interface ModalConfig {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  centered?: boolean;
}

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 表单字段状态
export interface FieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
}

// 表单验证规则
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

// 主题配置
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// 响应式断点
export const Breakpoints = {
  xs: '320px',
  sm: '640px', 
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

export type Breakpoint = keyof typeof Breakpoints;

// 动画配置
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// 虚拟滚动配置
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollToIndex?: number;
}

// 无限滚动配置
export interface InfiniteScrollConfig {
  threshold?: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

// 拖拽配置
export interface DragConfig {
  draggable: boolean;
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
}

// 键盘快捷键
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

// 可访问性配置
export interface A11yConfig {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  role?: string;
  tabIndex?: number;
}