import React, { useState, useRef, useEffect } from 'react';
import { Loading } from './Loading';
import { cacheService } from '../../services/cacheService';
import type { BaseProps } from '../../types/ui';

interface LazyImageProps extends BaseProps {
  /** 图片源地址 */
  src: string;
  /** 替代文本 */
  alt: string;
  /** 占位图片 */
  placeholder?: string;
  /** 图片宽度 */
  width?: number | string;
  /** 图片高度 */
  height?: number | string;
  /** 对象适应方式 */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 加载失败时的回调 */
  onError?: () => void;
  /** 加载成功时的回调 */
  onLoad?: () => void;
  /** 自定义加载组件 */
  loadingComponent?: React.ReactNode;
  /** 自定义错误组件 */
  errorComponent?: React.ReactNode;
  /** 懒加载阈值 */
  threshold?: number;
  /** 根边距 */
  rootMargin?: string;
}

/**
 * 懒加载图片组件
 * 支持缓存、占位符、错误处理等功能
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  width,
  height,
  objectFit = 'cover',
  enableCache = true,
  onError,
  onLoad,
  loadingComponent,
  errorComponent,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer 用于懒加载
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // 加载图片
  useEffect(() => {
    if (!isInView || !src) return;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // 检查缓存
        if (enableCache) {
          const cachedBlob = cacheService.getCachedImage(src);
          if (cachedBlob) {
            const url = URL.createObjectURL(cachedBlob);
            setImageSrc(url);
            setIsLoading(false);
            onLoad?.();
            return;
          }
        }

        // 尝试直接使用图片URL（避免CORS问题）
        const testImage = new Image();
        testImage.crossOrigin = 'anonymous';
        
        const imageLoadPromise = new Promise<void>((resolve, reject) => {
          testImage.onload = () => {
            // 图片可以直接加载，使用原始URL
            setImageSrc(src);
            setIsLoading(false);
            onLoad?.();
            resolve();
          };
          
          testImage.onerror = () => {
            // 图片直接加载失败，尝试通过fetch
            reject(new Error('Direct load failed'));
          };
          
          // 设置超时
          setTimeout(() => {
            reject(new Error('Load timeout'));
          }, 8000);
        });
        
        testImage.src = src;
        
        try {
          await imageLoadPromise;
        } catch {
          // 如果直接加载失败，尝试不同的加载策略
          console.warn('图片直接加载失败，尝试其他方式:', src);
          
          // 策略1: 尝试不设置crossOrigin
          try {
            const fallbackImage = new Image();
            const fallbackPromise = new Promise<void>((resolve, reject) => {
              fallbackImage.onload = () => {
                setImageSrc(src);
                setIsLoading(false);
                onLoad?.();
                resolve();
              };
              fallbackImage.onerror = () => reject(new Error('Fallback failed'));
              setTimeout(() => reject(new Error('Fallback timeout')), 5000);
            });
            
            fallbackImage.src = src;
            await fallbackPromise;
          } catch {
            // 策略2: 尝试通过fetch（可能有CORS限制）
            try {
              const response = await fetch(src, {
                mode: 'no-cors', // 改为no-cors模式
                credentials: 'omit'
              });
              
              // no-cors模式下无法检查状态，直接使用原URL
              setImageSrc(src);
              setIsLoading(false);
              onLoad?.();
            } catch (fetchError) {
              // 策略3: 最后的备用方案 - 直接使用原URL并让img元素处理错误
              console.warn('所有加载策略都失败，使用原URL:', src);
              setImageSrc(src);
              setIsLoading(false);
              // 不设置hasError，让img元素的onError处理
            }
          }
        }

      } catch (error) {
        console.warn('图片加载失败:', src, error);
        // 最后的备用方案：直接使用原URL
        setImageSrc(src);
        setIsLoading(false);
        // 不设置hasError，让图片元素自己处理
      }
    };

    loadImage();
  }, [isInView, src, enableCache, onLoad, onError]);

  // 清理 blob URL
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    transition: 'opacity 0.3s ease-in-out'
  };

  return (
    <div
      ref={containerRef}
      className={`lazy-image-container ${className}`}
      style={containerStyle}
      {...props}
    >
      {/* 占位符 */}
      {!isInView && placeholder && (
        <img
          src={placeholder}
          alt={alt}
          style={imageStyle}
          className="lazy-image-placeholder"
        />
      )}

      {/* 加载状态 */}
      {isInView && isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {loadingComponent || (
            <Loading size="sm" text="" type="spinner" />
          )}
        </div>
      )}

      {/* 错误状态 */}
      {isInView && hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          {errorComponent || (
            <div className="text-center">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-xs">加载失败</div>
            </div>
          )}
        </div>
      )}

      {/* 实际图片 */}
      {isInView && imageSrc && !hasError && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          style={{
            ...imageStyle,
            opacity: isLoading ? 0 : 1
          }}
          className="lazy-image"
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
          }}
        />
      )}
    </div>
  );
};

export default LazyImage;