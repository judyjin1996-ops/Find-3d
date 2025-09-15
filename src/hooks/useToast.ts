import { useState, useCallback } from 'react';
import type { NotificationConfig } from '../types/ui';

interface ToastItem extends NotificationConfig {
  id: string;
}

/**
 * Toast 通知管理钩子
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 添加 toast
  const addToast = useCallback((config: NotificationConfig) => {
    const id = generateId();
    const toast: ToastItem = { ...config, id };
    
    setToasts(prev => [toast, ...prev]);
    
    return id;
  }, [generateId]);

  // 移除 toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 清除所有 toast
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 便捷方法
  const success = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    return addToast({
      type: 'success',
      message,
      ...options
    });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    return addToast({
      type: 'error',
      message,
      duration: 6000, // 错误消息显示更久
      ...options
    });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    return addToast({
      type: 'warning',
      message,
      ...options
    });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  // 显示加载中的 toast
  const loading = useCallback((message: string, options?: Partial<NotificationConfig>) => {
    return addToast({
      type: 'info',
      message,
      duration: 0, // 不自动关闭
      closable: false,
      ...options
    });
  }, [addToast]);

  // 更新 toast
  const updateToast = useCallback((id: string, config: Partial<NotificationConfig>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...config } : toast
    ));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    updateToast,
    success,
    error,
    warning,
    info,
    loading
  };
};

export default useToast;