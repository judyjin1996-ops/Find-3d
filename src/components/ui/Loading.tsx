import React from 'react';
import type { BaseProps } from '../../types/ui';

interface LoadingProps extends BaseProps {
  /** 加载器尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 加载文本 */
  text?: string;
  /** 加载类型 */
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  /** 进度百分比 (0-100) */
  progress?: number;
  /** 是否显示进度文本 */
  showProgress?: boolean;
  /** 是否全屏显示 */
  fullscreen?: boolean;
  /** 背景遮罩透明度 */
  overlay?: boolean;
  /** 自定义颜色 */
  color?: string;
}

/**
 * 增强的加载状态组件
 * 支持多种加载样式和进度显示
 */
export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = '加载中...',
  type = 'spinner',
  progress,
  showProgress = false,
  fullscreen = false,
  overlay = false,
  color,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // 渲染不同类型的加载器
  const renderLoader = () => {
    const baseColor = color || 'border-sketch-accent';
    console.log('Loading color:', baseColor); // 使用变量避免警告
    
    switch (type) {
      case 'spinner':
        return (
          <div 
            className={`animate-spin rounded-full border-4 border-sketch-border border-t-sketch-accent ${sizeClasses[size]}`}
          />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`rounded-full bg-sketch-accent animate-pulse ${
                  size === 'xs' ? 'w-1 h-1' :
                  size === 'sm' ? 'w-2 h-2' :
                  size === 'md' ? 'w-3 h-3' :
                  size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
                }`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  backgroundColor: color
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div 
            className={`rounded-full bg-sketch-accent animate-pulse ${sizeClasses[size]}`}
            style={{ backgroundColor: color }}
          />
        );
      
      case 'skeleton':
        return (
          <div className="space-y-2 w-full max-w-xs">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        );
      
      default:
        return (
          <div 
            className={`animate-spin rounded-full border-4 border-sketch-border border-t-sketch-accent ${sizeClasses[size]}`}
          />
        );
    }
  };

  // 渲染进度条
  const renderProgress = () => {
    if (typeof progress !== 'number') return null;

    return (
      <div className="w-full max-w-xs mt-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-sketch-accent h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, Math.max(0, progress))}%`,
              backgroundColor: color 
            }}
          />
        </div>
        {showProgress && (
          <p className="text-xs sketch-text-secondary text-center mt-1">
            {Math.round(progress)}%
          </p>
        )}
      </div>
    );
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`} {...props}>
      {renderLoader()}
      
      {text && type !== 'skeleton' && (
        <p className={`sketch-text-secondary font-sketch text-center ${textSizes[size]}`}>
          {text}
        </p>
      )}
      
      {renderProgress()}
    </div>
  );

  // 全屏模式
  if (fullscreen) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          overlay ? 'bg-black bg-opacity-50' : 'bg-sketch-background'
        }`}
      >
        {content}
      </div>
    );
  }

  return content;
};