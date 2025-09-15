import React from 'react';
import { Card, Button } from './index';
import type { BaseProps } from '../../types/ui';

interface EmptyStateProps extends BaseProps {
  /** 空状态类型 */
  type?: 'search' | 'error' | 'no-data' | 'network' | 'permission';
  /** 标题 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 图标名称或自定义图标 */
  icon?: string | React.ReactNode;
  /** 主要操作按钮 */
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  /** 次要操作按钮 */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** 是否显示在卡片中 */
  showCard?: boolean;
  /** 自定义样式 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 空状态组件
 * 用于显示各种空状态场景
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  showCard = true,
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  // 根据类型获取默认配置
  const getDefaultConfig = () => {
    switch (type) {
      case 'search':
        return {
          icon: '🔍',
          title: '暂无搜索结果',
          description: '尝试使用不同的关键词或调整搜索条件'
        };
      case 'error':
        return {
          icon: '😵',
          title: '出现错误',
          description: '加载数据时发生错误，请稍后重试'
        };
      case 'network':
        return {
          icon: '📡',
          title: '网络连接异常',
          description: '请检查网络连接后重试'
        };
      case 'permission':
        return {
          icon: '🔒',
          title: '权限不足',
          description: '您没有访问此内容的权限'
        };
      default:
        return {
          icon: '📭',
          title: '暂无数据',
          description: '这里还没有任何内容'
        };
    }
  };

  const defaultConfig = getDefaultConfig();
  const finalTitle = title || defaultConfig.title;
  const finalDescription = description || defaultConfig.description;
  const finalIcon = icon || defaultConfig.icon;

  // 尺寸样式
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizes = {
    sm: 'text-4xl',
    md: 'text-6xl',
    lg: 'text-8xl'
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const content = (
    <div 
      className={`text-center ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {/* 图标 */}
      <div className={`mb-4 ${iconSizes[size]}`}>
        {typeof finalIcon === 'string' ? (
          <div>{finalIcon}</div>
        ) : (
          finalIcon
        )}
      </div>

      {/* 标题 */}
      <h3 className={`font-bold sketch-text-primary mb-2 font-sketch ${titleSizes[size]}`}>
        {finalTitle}
      </h3>

      {/* 描述 */}
      <p className="sketch-text-secondary font-sketch mb-6 max-w-md mx-auto">
        {finalDescription}
      </p>

      {/* 自定义内容 */}
      {children}

      {/* 操作按钮 */}
      {(primaryAction || secondaryAction) && (
        <div className="flex gap-3 justify-center flex-wrap">
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant="primary"
              onClick={primaryAction.onClick}
              loading={primaryAction.loading}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (showCard) {
    return <Card>{content}</Card>;
  }

  return content;
};

export default EmptyState;