import React from 'react';
import { Modal, Button, Badge, Icon, Card } from '../ui';
import type { MaterialResult } from '../../types';

interface ResultDetailModalProps {
  result: MaterialResult | null;
  open: boolean;
  onClose: () => void;
}

export const ResultDetailModal: React.FC<ResultDetailModalProps> = ({
  result,
  open,
  onClose
}) => {
  if (!result) return null;

  const handleOpenOriginal = () => {
    window.open(result.sourceUrl, '_blank');
  };

  const formatDate = (date?: Date) => {
    if (!date) return '未知';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const renderRating = () => {
    if (!result.rating) return null;
    
    const stars = Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name="star"
        size="sm"
        className={i < result.rating! ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-sketch-muted ml-2">
          {result.rating}/5
        </span>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="素材详情"
      size="lg"
    >
      <div className="space-y-6">
        {/* 预览图 */}
        <div className="aspect-video bg-sketch-background rounded-sketch overflow-hidden">
          <img
            src={result.previewImage}
            alt={result.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/600x400?text=No+Image';
            }}
          />
        </div>

        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-sketch-text mb-2">
              {result.title}
            </h2>
            
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="info" size="md">
                {result.sourceWebsite}
              </Badge>
              
              {result.fileFormat && (
                <Badge variant="default" size="md">
                  {result.fileFormat.toUpperCase()}
                </Badge>
              )}
              
              {result.isFree ? (
                <Badge variant="success" size="md">
                  免费
                </Badge>
              ) : result.price !== undefined ? (
                <Badge variant="warning" size="md">
                  ¥{result.price}
                </Badge>
              ) : null}
            </div>

            {renderRating()}
          </div>

          {/* 描述 */}
          {result.description && (
            <Card variant="outlined" padding="md">
              <h3 className="font-semibold text-sketch-text mb-2">描述</h3>
              <p className="text-sketch-muted leading-relaxed">
                {result.description}
              </p>
            </Card>
          )}

          {/* 详细信息 */}
          <Card variant="outlined" padding="md">
            <h3 className="font-semibold text-sketch-text mb-4">详细信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sketch-muted">文件大小:</span>
                  <span className="text-sketch-text">
                    {result.fileSize || '未知'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sketch-muted">上传日期:</span>
                  <span className="text-sketch-text">
                    {formatDate(result.uploadDate)}
                  </span>
                </div>
                
                {result.author && (
                  <div className="flex items-center justify-between">
                    <span className="text-sketch-muted">作者:</span>
                    <span className="text-sketch-text">{result.author}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {result.downloadCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sketch-muted">下载次数:</span>
                    <span className="text-sketch-text">
                      {result.downloadCount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sketch-muted">价格:</span>
                  <span className="text-sketch-text">
                    {result.isFree ? '免费' : result.price ? `¥${result.price}` : '未知'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sketch-muted">货币:</span>
                  <span className="text-sketch-text">
                    {result.currency || 'CNY'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* 标签 */}
          {result.tags && result.tags.length > 0 && (
            <Card variant="outlined" padding="md">
              <h3 className="font-semibold text-sketch-text mb-3">标签</h3>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    size="sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-sketch-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            关闭
          </Button>
          <Button
            onClick={handleOpenOriginal}
            icon={<Icon name="external-link" size="sm" />}
          >
            查看原页面
          </Button>
        </div>
      </div>
    </Modal>
  );
};