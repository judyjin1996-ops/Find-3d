import React, { useEffect, useState } from 'react';
import { Icon, Button } from './index';
import type { NotificationConfig } from '../../types/ui';

type IconName = 
  | 'search'
  | 'close'
  | 'loading'
  | 'heart'
  | 'star'
  | 'download'
  | 'external-link'
  | 'settings'
  | 'history'
  | 'filter'
  | 'grid'
  | 'list'
  | 'eye'
  | 'eye-off'
  | 'check'
  | 'x'
  | 'plus'
  | 'minus'
  | 'edit'
  | 'trash'
  | 'refresh'
  | 'user'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'reload'
  | 'check-circle'
  | 'x-circle'
  | 'exclamation-triangle'
  | 'information-circle';

interface ToastProps extends NotificationConfig {
  id: string;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Toast 通知组件
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  closable = true,
  action,
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // 等待退出动画完成
  };

  // 获取类型对应的样式和图标
  const getTypeConfig = (): {
    bgColor: string;
    textColor: string;
    iconColor: string;
    icon: IconName;
  } => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          icon: 'check-circle' as IconName
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: 'x-circle' as IconName
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: 'exclamation-triangle' as IconName
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: 'information-circle' as IconName
        };
    }
  };

  const typeConfig = getTypeConfig();

  // 获取位置样式
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'top-center':
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  return (
    <div
      className={`
        ${getPositionClasses()}
        max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-2 opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        ${typeConfig.bgColor} 
        border rounded-lg shadow-lg p-4
        ${typeConfig.textColor}
      `}>
        <div className="flex items-start">
          {/* 图标 */}
          <div className={`flex-shrink-0 ${typeConfig.iconColor} mr-3`}>
            <Icon name={typeConfig.icon} size="md" />
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-medium mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm">
              {message}
            </p>

            {/* 操作按钮 */}
            {action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={action.onClick}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              </div>
            )}
          </div>

          {/* 关闭按钮 */}
          {closable && (
            <div className="flex-shrink-0 ml-3">
              <button
                onClick={handleClose}
                className={`
                  inline-flex rounded-md p-1.5 
                  ${typeConfig.textColor} 
                  hover:bg-black hover:bg-opacity-10
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
                  transition-colors duration-200
                `}
              >
                <Icon name="x" size="sm" />
              </button>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {duration > 0 && (
          <div className="mt-3 -mb-1 -mx-4">
            <div className="h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
              <div 
                className="h-full bg-current opacity-30 rounded-b-lg"
                style={{
                  animation: `toast-progress ${duration}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Toast 容器组件
 */
interface ToastContainerProps {
  toasts: (NotificationConfig & { id: string })[];
  onClose: (id: string) => void;
  position?: ToastProps['position'];
  maxToasts?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
  maxToasts = 5
}) => {
  // 限制显示的 toast 数量
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <>
      {visibleToasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          position={position}
          onClose={onClose}
        />
      ))}
      
      {/* CSS 动画通过Tailwind类实现 */}
    </>
  );
};

export default Toast;