import React, { useState, useCallback } from 'react';
import { Card, Badge, Icon, Tooltip, LazyImage } from '../ui';
import type { ExtractedMaterialResult, CardStyle, DisplayFieldConfig } from '../../types';

interface SmartResultCardProps {
  result: ExtractedMaterialResult;
  displayFields: DisplayFieldConfig[];
  cardStyle: CardStyle;
  onCardClick: (url: string) => void;
  onImageError: (imageUrl: string) => void;
  className?: string;
}

export const SmartResultCard: React.FC<SmartResultCardProps> = ({
  result,
  displayFields,
  cardStyle,
  onCardClick,
  onImageError,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // 处理图片错误
  const handleImageError = useCallback((imageUrl: string) => {
    setImageError(true);
    setImageLoading(false);
    onImageError(imageUrl);
  }, [onImageError]);

  // 处理图片加载完成
  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setImageLoading(false);
  }, []);

  // 处理卡片点击
  const handleCardClick = useCallback(() => {
    onCardClick(result.sourceUrl);
  }, [onCardClick, result.sourceUrl]);

  // 获取主预览图
  const getPrimaryImage = () => {
    if (result.previewImages && result.previewImages.length > 0) {
      return result.previewImages[0];
    }
    return null;
  };

  // 格式化文件大小
  const formatFileSize = (size?: string) => {
    if (!size) return '';
    return size.toUpperCase();
  };

  // 格式化日期
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  // 格式化数字
  const formatNumber = (num?: number) => {
    if (num === undefined) return '';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 渲染价格信息
  const renderPrice = () => {
    const { pricing } = result;
    
    if (pricing.isFree) {
      return (
        <Badge variant="success" size="sm">
          免费
        </Badge>
      );
    }
    
    if (pricing.price !== undefined) {
      const currency = pricing.currency || '¥';
      return (
        <div className="flex items-center gap-1">
          {pricing.originalPrice && pricing.originalPrice > pricing.price && (
            <span className="text-xs text-sketch-muted line-through">
              {currency}{pricing.originalPrice}
            </span>
          )}
          <span className="text-sketch-accent font-semibold">
            {currency}{pricing.price}
          </span>
          {pricing.discount && (
            <Badge variant="warning" size="xs">
              -{pricing.discount}%
            </Badge>
          )}
        </div>
      );
    }
    
    return (
      <span className="text-sketch-muted text-sm">
        价格未知
      </span>
    );
  };

  // 渲染评分
  const renderRating = () => {
    const rating = result.statistics.rating;
    if (!rating) return null;
    
    const stars = Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="star"
        size="xs"
        className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-xs text-sketch-muted ml-1">
          ({rating})
        </span>
        {result.statistics.reviewCount && (
          <span className="text-xs text-sketch-muted">
            · {formatNumber(result.statistics.reviewCount)}评价
          </span>
        )}
      </div>
    );
  };

  // 渲染提取状态指示器
  const renderExtractionStatus = () => {
    const { extraction } = result;
    
    let statusColor = 'text-green-500';
    let statusIcon = 'check-circle';
    let statusText = '完整';
    
    if (extraction.status === 'partial') {
      statusColor = 'text-yellow-500';
      statusIcon = 'alert-circle';
      statusText = '部分';
    } else if (extraction.status === 'failed') {
      statusColor = 'text-red-500';
      statusIcon = 'x-circle';
      statusText = '失败';
    }
    
    return (
      <Tooltip content={`数据提取${statusText} (置信度: ${Math.round(extraction.confidence * 100)}%)`}>
        <div className={`flex items-center gap-1 ${statusColor}`}>
          <Icon name={statusIcon} size="xs" />
          <span className="text-xs">{statusText}</span>
        </div>
      </Tooltip>
    );
  };

  // 渲染质量评分
  const renderQualityScore = () => {
    const { quality } = result;
    
    let scoreColor = 'text-green-500';
    if (quality.score < 60) scoreColor = 'text-red-500';
    else if (quality.score < 80) scoreColor = 'text-yellow-500';
    
    return (
      <Tooltip content={`质量评分: ${quality.score}/100`}>
        <div className={`flex items-center gap-1 ${scoreColor}`}>
          <Icon name="award" size="xs" />
          <span className="text-xs font-medium">{quality.score}</span>
        </div>
      </Tooltip>
    );
  };

  // 渲染统计信息
  const renderStatistics = () => {
    const { statistics } = result;
    const stats = [];
    
    if (statistics.downloadCount !== undefined) {
      stats.push(
        <div key="downloads" className="flex items-center gap-1 text-xs text-sketch-muted">
          <Icon name="download" size="xs" />
          <span>{formatNumber(statistics.downloadCount)}</span>
        </div>
      );
    }
    
    if (statistics.viewCount !== undefined) {
      stats.push(
        <div key="views" className="flex items-center gap-1 text-xs text-sketch-muted">
          <Icon name="eye" size="xs" />
          <span>{formatNumber(statistics.viewCount)}</span>
        </div>
      );
    }
    
    if (statistics.likeCount !== undefined) {
      stats.push(
        <div key="likes" className="flex items-center gap-1 text-xs text-sketch-muted">
          <Icon name="heart" size="xs" />
          <span>{formatNumber(statistics.likeCount)}</span>
        </div>
      );
    }
    
    return stats;
  };

  const primaryImage = getPrimaryImage();

  // 紧凑模式渲染
  if (cardStyle === 'compact') {
    return (
      <Card
        hoverable
        className={`cursor-pointer transition-all duration-200 ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex gap-3">
          {/* 紧凑预览图 */}
          <div className="relative w-20 h-20 bg-sketch-background rounded-sketch overflow-hidden flex-shrink-0">
            {primaryImage ? (
              <LazyImage
                src={primaryImage.url}
                alt={primaryImage.alt || result.title}
                width="100%"
                height="100%"
                objectFit="cover"
                onError={() => handleImageError(primaryImage.url)}
                onLoad={handleImageLoad}
                enableCache={true}
                errorComponent={
                  <div className="w-full h-full flex items-center justify-center bg-sketch-background">
                    <div className="text-center text-sketch-muted">
                      <Icon name="image" size="sm" className="opacity-50 mb-1" />
                      <div className="text-xs">预览图</div>
                    </div>
                  </div>
                }
                loadingComponent={
                  <div className="w-full h-full flex items-center justify-center bg-sketch-background">
                    <div className="text-center text-sketch-muted">
                      <div className="animate-pulse">
                        <Icon name="image" size="sm" className="opacity-30" />
                      </div>
                    </div>
                  </div>
                }
                className="rounded-sketch"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sketch-background">
                <div className="text-center text-sketch-muted">
                  <Icon name="image" size="sm" className="opacity-50 mb-1" />
                  <div className="text-xs">暂无图片</div>
                </div>
              </div>
            )}
            
            {/* 状态指示器 */}
            <div className="absolute top-1 left-1 flex gap-1">
              {result.pricing.isFree && (
                <Badge variant="success" size="xs">免费</Badge>
              )}
            </div>
            
            {/* 质量评分 */}
            <div className="absolute bottom-1 right-1">
              {renderQualityScore()}
            </div>
          </div>

          {/* 紧凑内容 */}
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-medium text-sketch-text line-clamp-1 text-sm">
              {result.title}
            </h4>
            
            <div className="flex items-center gap-2 text-xs text-sketch-muted">
              <span className="truncate">{result.sourceWebsite}</span>
              {result.fileInfo.format && (
                <Badge variant="info" size="xs">
                  {result.fileInfo.format.toUpperCase()}
                </Badge>
              )}
              {renderExtractionStatus()}
            </div>
            
            <div className="flex items-center justify-between">
              <div>{renderPrice()}</div>
              <div className="flex items-center gap-2">
                {renderStatistics().slice(0, 1)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 详细模式渲染
  if (cardStyle === 'detailed') {
    return (
      <Card
        hoverable
        className={`cursor-pointer transition-all duration-200 ${className}`}
        onClick={handleCardClick}
      >
        <div className="space-y-4">
          {/* 预览图 */}
          <div className="relative aspect-video bg-sketch-background rounded-sketch overflow-hidden">
            {primaryImage ? (
              <LazyImage
                src={primaryImage.url}
                alt={primaryImage.alt || result.title}
                width="100%"
                height="100%"
                objectFit="cover"
                onError={() => handleImageError(primaryImage.url)}
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
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sketch-background">
                <div className="text-center text-sketch-muted">
                  <Icon name="image" size="lg" className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无预览图</p>
                </div>
              </div>
            )}
            
            {/* 多图指示器 */}
            {result.previewImages.length > 1 && (
              <div className="absolute top-2 left-2">
                <Badge variant="info" size="sm">
                  +{result.previewImages.length - 1}
                </Badge>
              </div>
            )}
            
            {/* 文件格式标签 */}
            {result.fileInfo.format && (
              <div className="absolute top-2 right-2">
                <Badge variant="info" size="sm">
                  {result.fileInfo.format.toUpperCase()}
                </Badge>
              </div>
            )}
            
            {/* 免费标签 */}
            {result.pricing.isFree && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="success" size="sm">
                  免费
                </Badge>
              </div>
            )}
            
            {/* 状态指示器 */}
            <div className="absolute bottom-2 right-2 flex gap-2">
              {renderExtractionStatus()}
              {renderQualityScore()}
            </div>
          </div>

          {/* 详细内容信息 */}
          <div className="space-y-3">
            {/* 标题和描述 */}
            <div>
              <Tooltip content={result.title}>
                <h3 className="font-semibold text-sketch-text line-clamp-2 leading-tight text-lg">
                  {result.title}
                </h3>
              </Tooltip>
              
              {result.description && (
                <p className="text-sm text-sketch-muted line-clamp-3 mt-2">
                  {result.description}
                </p>
              )}
            </div>

            {/* 评分 */}
            {renderRating()}

            {/* 价格和文件信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderPrice()}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-sketch-muted">
                {result.fileInfo.size && (
                  <span>{formatFileSize(result.fileInfo.size)}</span>
                )}
                {result.categorization.category && (
                  <Badge variant="default" size="sm">
                    {result.categorization.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {renderStatistics()}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-sketch-muted">
                <Icon name="external-link" size="xs" />
                <span className="truncate">{result.sourceWebsite}</span>
              </div>
            </div>

            {/* 标签 */}
            {result.categorization.tags && result.categorization.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.categorization.tags.slice(0, 5).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    size="sm"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {result.categorization.tags.length > 5 && (
                  <Badge variant="default" size="sm" className="text-xs">
                    +{result.categorization.tags.length - 5}
                  </Badge>
                )}
              </div>
            )}

            {/* 作者和时间信息 */}
            <div className="flex items-center justify-between text-xs text-sketch-muted">
              <div className="flex items-center gap-2">
                {result.author && (
                  <div className="flex items-center gap-1">
                    <Icon name="user" size="xs" />
                    <span>by {result.author.name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {result.timestamps.uploadDate && (
                  <span>{formatDate(result.timestamps.uploadDate)}</span>
                )}
                <span>提取于 {formatDate(result.timestamps.extractedAt)}</span>
              </div>
            </div>

            {/* 提取详情 */}
            {result.extraction.missingFields.length > 0 && (
              <div className="text-xs text-sketch-muted">
                <span>缺失字段: {result.extraction.missingFields.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // 标准模式渲染（默认）
  return (
    <Card
      hoverable
      className={`cursor-pointer transition-all duration-200 ${className}`}
      onClick={handleCardClick}
    >
      <div className="space-y-3">
        {/* 预览图 */}
        <div className="relative aspect-video bg-sketch-background rounded-sketch overflow-hidden">
          {primaryImage ? (
            <LazyImage
              src={primaryImage.url}
              alt={primaryImage.alt || result.title}
              width="100%"
              height="100%"
              objectFit="cover"
              onError={() => handleImageError(primaryImage.url)}
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
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-sketch-background">
              <div className="text-center text-sketch-muted">
                <Icon name="image" size="lg" className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无预览图</p>
              </div>
            </div>
          )}
          
          {/* 文件格式标签 */}
          {result.fileInfo.format && (
            <div className="absolute top-2 right-2">
              <Badge variant="info" size="sm">
                {result.fileInfo.format.toUpperCase()}
              </Badge>
            </div>
          )}
          
          {/* 免费标签 */}
          {result.pricing.isFree && (
            <div className="absolute top-2 left-2">
              <Badge variant="success" size="sm">
                免费
              </Badge>
            </div>
          )}
          
          {/* 状态指示器 */}
          <div className="absolute bottom-2 right-2">
            {renderExtractionStatus()}
          </div>
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
            
            {result.fileInfo.size && (
              <span className="text-sketch-muted">
                {formatFileSize(result.fileInfo.size)}
              </span>
            )}
          </div>

          {/* 价格和统计信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderPrice()}
            </div>
            
            <div className="flex items-center gap-3">
              {renderStatistics().slice(0, 2)}
            </div>
          </div>

          {/* 标签 */}
          {result.categorization.tags && result.categorization.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.categorization.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="default"
                  size="sm"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {result.categorization.tags.length > 3 && (
                <Badge variant="default" size="sm" className="text-xs">
                  +{result.categorization.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 作者和时间信息 */}
          <div className="flex items-center justify-between text-xs text-sketch-muted">
            {result.author && (
              <div className="flex items-center gap-1">
                <Icon name="user" size="xs" />
                <span>by {result.author.name}</span>
              </div>
            )}
            
            {result.timestamps.uploadDate && (
              <span>{formatDate(result.timestamps.uploadDate)}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};