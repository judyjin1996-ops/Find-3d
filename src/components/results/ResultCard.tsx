import React from 'react';
import { Card, Badge, Icon, Tooltip, LazyImage } from '../ui';
import type { MaterialResult } from '../../types';

interface ResultCardProps {
  result: MaterialResult;
  onClick?: (result: MaterialResult) => void;
  compact?: boolean;
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onClick,
  compact = false,
  className = ''
}) => {
  const [, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleCardClick = () => {
    onClick?.(result);
  };

  const formatFileSize = (size?: string) => {
    if (!size) return '';
    return size.toUpperCase();
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const renderPrice = () => {
    if (result.isFree) {
      return (
        <Badge variant="success" size="sm">
          免费
        </Badge>
      );
    }
    
    if (result.price !== undefined) {
      return (
        <span className="text-sketch-accent font-semibold">
          ¥{result.price}
        </span>
      );
    }
    
    return (
      <span className="text-sketch-muted text-sm">
        价格未知
      </span>
    );
  };

  const renderRating = () => {
    if (!result.rating) return null;
    
    const stars = Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="star"
        size="xs"
        className={i < result.rating! ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-xs text-sketch-muted ml-1">
          ({result.rating})
        </span>
      </div>
    );
  };

  // 紧凑模式渲染
  if (compact) {
    return (
      <Card
        hoverable
        className={`cursor-pointer transition-all duration-200 ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex gap-3">
          {/* 紧凑预览图 */}
          <div className="relative w-20 h-20 bg-sketch-background rounded-sketch overflow-hidden flex-shrink-0">
            <LazyImage
              src={result.previewImage}
              alt={result.title}
              width="100%"
              height="100%"
              objectFit="cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              enableCache={true}
              errorComponent={
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="eye-off" size="sm" className="text-sketch-muted opacity-50" />
                </div>
              }
              className="rounded-sketch"
            />
            
            {result.isFree && (
              <div className="absolute top-1 left-1">
                <Badge variant="success" size="xs">免费</Badge>
              </div>
            )}
          </div>

          {/* 紧凑内容 */}
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-medium text-sketch-text line-clamp-1 text-sm">
              {result.title}
            </h4>
            
            <div className="flex items-center gap-2 text-xs text-sketch-muted">
              <span className="truncate">{result.sourceWebsite}</span>
              {result.fileFormat && (
                <Badge variant="info" size="xs">
                  {result.fileFormat.toUpperCase()}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>{renderPrice()}</div>
              {result.downloadCount !== undefined && (
                <div className="flex items-center gap-1 text-xs text-sketch-muted">
                  <Icon name="download" size="xs" />
                  <span>{result.downloadCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 标准模式渲染
  return (
    <Card
      hoverable
      className={`cursor-pointer transition-all duration-200 ${className}`}
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        {/* 预览图 */}
        <div className="relative aspect-video bg-sketch-background rounded-sketch overflow-hidden">
          <LazyImage
            src={result.previewImage}
            alt={result.title}
            width="100%"
            height="100%"
            objectFit="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            enableCache={true}
            errorComponent={
              <div className="w-full h-full flex items-center justify-center bg-sketch-background">
                <div className="text-center text-sketch-muted">
                  <Icon name="eye-off" size="lg" className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">图片加载失败</p>
                </div>
              </div>
            }
            className="transition-transform duration-200 hover:scale-105 rounded-sketch"
          />
          
          {/* 文件格式标签 */}
          {result.fileFormat && (
            <div className="absolute top-2 right-2">
              <Badge variant="info" size="sm">
                {result.fileFormat.toUpperCase()}
              </Badge>
            </div>
          )}
          
          {/* 免费标签 */}
          {result.isFree && (
            <div className="absolute top-2 left-2">
              <Badge variant="success" size="sm">
                免费
              </Badge>
            </div>
          )}
        </div>

        {/* 内容信息 */}
        <div className="space-y-2">
          {/* 标题 */}
          <Tooltip content={result.title}>
            <h3 className="font-semibold text-sketch-text line-clamp-2 leading-tight">
              {result.title}
            </h3>
          </Tooltip>

          {/* 描述 */}
          {result.description && (
            <p className="text-sm text-sketch-muted line-clamp-2">
              {result.description}
            </p>
          )}

          {/* 评分 */}
          {renderRating()}

          {/* 元信息 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-sketch-muted">
              <Icon name="external-link" size="xs" />
              <span className="truncate">{result.sourceWebsite}</span>
            </div>
            
            {result.fileSize && (
              <span className="text-sketch-muted">
                {formatFileSize(result.fileSize)}
              </span>
            )}
          </div>

          {/* 价格和统计信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderPrice()}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-sketch-muted">
              {result.downloadCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Icon name="download" size="xs" />
                  <span>{result.downloadCount}</span>
                </div>
              )}
              
              {result.uploadDate && (
                <span>{formatDate(result.uploadDate)}</span>
              )}
            </div>
          </div>

          {/* 标签 */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="default"
                  size="sm"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 3 && (
                <Badge variant="default" size="sm" className="text-xs">
                  +{result.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 作者信息 */}
          {result.author && (
            <div className="flex items-center gap-1 text-xs text-sketch-muted">
              <Icon name="user" size="xs" />
              <span>by {result.author}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};