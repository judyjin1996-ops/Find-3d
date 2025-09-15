import React, { useState } from 'react';
import { SmartResultCard } from './SmartResultCard';
import { Button, Card, Badge } from '../ui';
import { createMockResultsByQuality } from '../../utils/resultTransformer';
import type { CardStyle, DisplayFieldConfig } from '../../types';

export const SmartResultCardDemo: React.FC = () => {
  const [cardStyle, setCardStyle] = useState<CardStyle>('standard');
  const [showQualityComparison, setShowQualityComparison] = useState(false);
  
  // 创建不同质量等级的模拟数据
  const mockResults = createMockResultsByQuality();
  
  // 默认显示字段配置
  const defaultDisplayFields: DisplayFieldConfig[] = [
    { key: 'title', label: '标题', visible: true, order: 1 },
    { key: 'description', label: '描述', visible: true, order: 2 },
    { key: 'previewImages', label: '预览图', visible: true, order: 3 },
    { key: 'pricing', label: '价格', visible: true, order: 4 },
    { key: 'statistics', label: '统计', visible: true, order: 5 },
    { key: 'categorization', label: '分类', visible: true, order: 6 },
    { key: 'author', label: '作者', visible: true, order: 7 },
    { key: 'timestamps', label: '时间', visible: true, order: 8 }
  ];

  const handleCardClick = (url: string) => {
    console.log('Card clicked:', url);
    // 在实际应用中，这里会打开新标签页
    window.open(url, '_blank');
  };

  const handleImageError = (imageUrl: string) => {
    console.log('Image error:', imageUrl);
  };

  const cardStyles: { value: CardStyle; label: string; description: string }[] = [
    { value: 'compact', label: '紧凑', description: '适合列表视图，信息密集' },
    { value: 'standard', label: '标准', description: '平衡的信息展示' },
    { value: 'detailed', label: '详细', description: '完整的信息展示' }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* 标题和说明 */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-sketch-text">
          智能结果卡片组件演示
        </h1>
        <p className="text-sketch-muted max-w-2xl mx-auto">
          展示不同样式的智能结果卡片，支持丰富的信息展示、多种卡片样式、
          图片懒加载和数据提取状态指示。
        </p>
      </div>

      {/* 控制面板 */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sketch-text">控制面板</h3>
          
          {/* 卡片样式选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-sketch-text">
              卡片样式
            </label>
            <div className="flex gap-2">
              {cardStyles.map((style) => (
                <Button
                  key={style.value}
                  variant={cardStyle === style.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCardStyle(style.value)}
                >
                  {style.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-sketch-muted">
              {cardStyles.find(s => s.value === cardStyle)?.description}
            </p>
          </div>

          {/* 质量对比开关 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="quality-comparison"
              checked={showQualityComparison}
              onChange={(e) => setShowQualityComparison(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="quality-comparison" className="text-sm text-sketch-text">
              显示质量对比（高、中、低质量数据）
            </label>
          </div>
        </div>
      </Card>

      {/* 卡片展示区域 */}
      {showQualityComparison ? (
        /* 质量对比展示 */
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-sketch-text text-center">
            数据质量对比展示
          </h3>
          
          {/* 高质量数据 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="success">高质量</Badge>
              <span className="text-sm text-sketch-muted">
                完整数据，高置信度，优秀质量评分
              </span>
            </div>
            <div className={`grid gap-4 ${
              cardStyle === 'compact' ? 'grid-cols-1' : 
              cardStyle === 'standard' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2'
            }`}>
              <SmartResultCard
                result={mockResults.high}
                displayFields={defaultDisplayFields}
                cardStyle={cardStyle}
                onCardClick={handleCardClick}
                onImageError={handleImageError}
              />
            </div>
          </div>

          {/* 中等质量数据 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="warning">中等质量</Badge>
              <span className="text-sm text-sketch-muted">
                部分数据缺失，中等置信度
              </span>
            </div>
            <div className={`grid gap-4 ${
              cardStyle === 'compact' ? 'grid-cols-1' : 
              cardStyle === 'standard' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2'
            }`}>
              <SmartResultCard
                result={mockResults.medium}
                displayFields={defaultDisplayFields}
                cardStyle={cardStyle}
                onCardClick={handleCardClick}
                onImageError={handleImageError}
              />
            </div>
          </div>

          {/* 低质量数据 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="error">低质量</Badge>
              <span className="text-sm text-sketch-muted">
                大量数据缺失，低置信度，提取失败
              </span>
            </div>
            <div className={`grid gap-4 ${
              cardStyle === 'compact' ? 'grid-cols-1' : 
              cardStyle === 'standard' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2'
            }`}>
              <SmartResultCard
                result={mockResults.low}
                displayFields={defaultDisplayFields}
                cardStyle={cardStyle}
                onCardClick={handleCardClick}
                onImageError={handleImageError}
              />
            </div>
          </div>
        </div>
      ) : (
        /* 标准展示 */
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-sketch-text text-center">
            {cardStyles.find(s => s.value === cardStyle)?.label}模式展示
          </h3>
          
          <div className={`grid gap-4 ${
            cardStyle === 'compact' ? 'grid-cols-1' : 
            cardStyle === 'standard' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2'
          }`}>
            <SmartResultCard
              result={mockResults.high}
              displayFields={defaultDisplayFields}
              cardStyle={cardStyle}
              onCardClick={handleCardClick}
              onImageError={handleImageError}
            />
            
            {cardStyle !== 'detailed' && (
              <>
                <SmartResultCard
                  result={mockResults.medium}
                  displayFields={defaultDisplayFields}
                  cardStyle={cardStyle}
                  onCardClick={handleCardClick}
                  onImageError={handleImageError}
                />
                
                <SmartResultCard
                  result={mockResults.low}
                  displayFields={defaultDisplayFields}
                  cardStyle={cardStyle}
                  onCardClick={handleCardClick}
                  onImageError={handleImageError}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* 功能说明 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">
          组件功能特性
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sketch-text">显示功能</h4>
            <ul className="text-sm text-sketch-muted space-y-1">
              <li>• 丰富的信息展示（预览图、价格、下载数等）</li>
              <li>• 多种卡片样式（紧凑、标准、详细）</li>
              <li>• 智能图片懒加载和错误处理</li>
              <li>• 数据提取状态指示</li>
              <li>• 质量评分可视化</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sketch-text">交互功能</h4>
            <ul className="text-sm text-sketch-muted space-y-1">
              <li>• 响应式设计适配各种屏幕</li>
              <li>• 悬停动画效果</li>
              <li>• 点击跳转到原始页面</li>
              <li>• 工具提示显示详细信息</li>
              <li>• 无障碍访问支持</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 技术说明 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">
          技术实现
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium text-sketch-text">数据结构</h4>
            <p className="text-sm text-sketch-muted">
              使用ExtractedMaterialResult接口，支持丰富的元数据、
              提取状态和质量评分。
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sketch-text">性能优化</h4>
            <p className="text-sm text-sketch-muted">
              图片懒加载、组件缓存、防抖处理，
              确保流畅的用户体验。
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sketch-text">可扩展性</h4>
            <p className="text-sm text-sketch-muted">
              模块化设计、类型安全、
              支持自定义显示字段和样式。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};