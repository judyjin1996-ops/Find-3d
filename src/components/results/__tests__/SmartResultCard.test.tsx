import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartResultCard } from '../SmartResultCard';
import { createMockExtractedResult } from '../../../utils/resultTransformer';
import type { DisplayFieldConfig } from '../../../types';

// Mock UI components
jest.mock('../../ui', () => ({
  Card: ({ children, onClick, className }: any) => (
    <div className={className} onClick={onClick} data-testid="card">
      {children}
    </div>
  ),
  Badge: ({ children, variant, size }: any) => (
    <span data-testid="badge" data-variant={variant} data-size={size}>
      {children}
    </span>
  ),
  Icon: ({ name, size, className }: any) => (
    <span data-testid="icon" data-name={name} data-size={size} className={className}>
      {name}
    </span>
  ),
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  ),
  LazyImage: ({ src, alt, onError, onLoad, errorComponent }: any) => (
    <img
      src={src}
      alt={alt}
      data-testid="lazy-image"
      onError={() => onError?.(src)}
      onLoad={onLoad}
    />
  )
}));

describe('SmartResultCard', () => {
  const mockDisplayFields: DisplayFieldConfig[] = [
    { key: 'title', label: '标题', visible: true, order: 1 },
    { key: 'description', label: '描述', visible: true, order: 2 },
    { key: 'previewImages', label: '预览图', visible: true, order: 3 },
    { key: 'pricing', label: '价格', visible: true, order: 4 },
    { key: 'statistics', label: '统计', visible: true, order: 5 }
  ];

  const mockOnCardClick = jest.fn();
  const mockOnImageError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染标准模式的卡片', () => {
      const mockResult = createMockExtractedResult();
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText(mockResult.title)).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('应该正确渲染紧凑模式的卡片', () => {
      const mockResult = createMockExtractedResult();
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="compact"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText(mockResult.title)).toBeInTheDocument();
      // 紧凑模式应该有不同的布局
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('应该正确渲染详细模式的卡片', () => {
      const mockResult = createMockExtractedResult();
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="detailed"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText(mockResult.title)).toBeInTheDocument();
      if (mockResult.description) {
        expect(screen.getByText(mockResult.description)).toBeInTheDocument();
      }
    });
  });

  describe('价格显示', () => {
    it('应该正确显示免费标签', () => {
      const mockResult = createMockExtractedResult({
        pricing: {
          isFree: true,
          price: undefined,
          currency: '¥',
          originalPrice: undefined,
          discount: undefined,
          priceText: undefined
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('免费')).toBeInTheDocument();
    });

    it('应该正确显示付费价格', () => {
      const mockResult = createMockExtractedResult({
        pricing: {
          isFree: false,
          price: 29.99,
          currency: '¥',
          originalPrice: undefined,
          discount: undefined,
          priceText: '¥29.99'
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('¥29.99')).toBeInTheDocument();
    });

    it('应该正确显示折扣价格', () => {
      const mockResult = createMockExtractedResult({
        pricing: {
          isFree: false,
          price: 29.99,
          currency: '¥',
          originalPrice: 39.99,
          discount: 25,
          priceText: '¥29.99'
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('¥29.99')).toBeInTheDocument();
      expect(screen.getByText('¥39.99')).toBeInTheDocument();
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });
  });

  describe('提取状态指示', () => {
    it('应该显示成功状态', () => {
      const mockResult = createMockExtractedResult({
        extraction: {
          ruleId: 'test',
          status: 'success',
          confidence: 0.95,
          missingFields: [],
          processingTime: 1000
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('完整')).toBeInTheDocument();
    });

    it('应该显示部分状态', () => {
      const mockResult = createMockExtractedResult({
        extraction: {
          ruleId: 'test',
          status: 'partial',
          confidence: 0.72,
          missingFields: ['description', 'fileSize'],
          processingTime: 1200
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('部分')).toBeInTheDocument();
    });

    it('应该显示失败状态', () => {
      const mockResult = createMockExtractedResult({
        extraction: {
          ruleId: 'test',
          status: 'failed',
          confidence: 0.35,
          missingFields: ['description', 'previewImages'],
          errors: ['Failed to extract images'],
          processingTime: 2500
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('失败')).toBeInTheDocument();
    });
  });

  describe('质量评分', () => {
    it('应该显示高质量评分', () => {
      const mockResult = createMockExtractedResult({
        quality: {
          score: 95,
          factors: {
            completeness: 98,
            imageQuality: 92,
            dataAccuracy: 95
          }
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="compact"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('95')).toBeInTheDocument();
    });
  });

  describe('交互功能', () => {
    it('应该在点击时调用onCardClick', () => {
      const mockResult = createMockExtractedResult();
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      fireEvent.click(screen.getByTestId('card'));
      expect(mockOnCardClick).toHaveBeenCalledWith(mockResult.sourceUrl);
    });

    it('应该在图片错误时调用onImageError', async () => {
      const mockResult = createMockExtractedResult();
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      const image = screen.getByTestId('lazy-image');
      fireEvent.error(image);

      await waitFor(() => {
        expect(mockOnImageError).toHaveBeenCalledWith(mockResult.previewImages[0].url);
      });
    });
  });

  describe('统计信息显示', () => {
    it('应该显示下载数量', () => {
      const mockResult = createMockExtractedResult({
        statistics: {
          downloadCount: 1250,
          viewCount: 8900,
          likeCount: 156,
          rating: 4.5,
          reviewCount: 23
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('1.3K')).toBeInTheDocument(); // 格式化后的下载数
    });

    it('应该显示评分', () => {
      const mockResult = createMockExtractedResult({
        statistics: {
          downloadCount: 1250,
          viewCount: 8900,
          likeCount: 156,
          rating: 4.5,
          reviewCount: 23
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('(4.5)')).toBeInTheDocument();
    });
  });

  describe('标签显示', () => {
    it('应该显示标签', () => {
      const mockResult = createMockExtractedResult({
        categorization: {
          category: '电子产品',
          subcategory: '智能手机',
          tags: ['手机', '3D模型', 'C4D'],
          keywords: ['smartphone', 'mobile']
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('手机')).toBeInTheDocument();
      expect(screen.getByText('3D模型')).toBeInTheDocument();
      expect(screen.getByText('C4D')).toBeInTheDocument();
    });

    it('应该限制显示的标签数量', () => {
      const mockResult = createMockExtractedResult({
        categorization: {
          category: '电子产品',
          subcategory: '智能手机',
          tags: ['标签1', '标签2', '标签3', '标签4', '标签5', '标签6'],
          keywords: []
        }
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      // 应该显示前3个标签和一个"+更多"标签
      expect(screen.getByText('标签1')).toBeInTheDocument();
      expect(screen.getByText('标签2')).toBeInTheDocument();
      expect(screen.getByText('标签3')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument();
    });
  });

  describe('无数据处理', () => {
    it('应该处理没有预览图的情况', () => {
      const mockResult = createMockExtractedResult({
        previewImages: []
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="standard"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      expect(screen.getByText('暂无预览图')).toBeInTheDocument();
    });

    it('应该处理没有作者的情况', () => {
      const mockResult = createMockExtractedResult({
        author: undefined
      });
      
      render(
        <SmartResultCard
          result={mockResult}
          displayFields={mockDisplayFields}
          cardStyle="detailed"
          onCardClick={mockOnCardClick}
          onImageError={mockOnImageError}
        />
      );

      // 不应该显示作者信息
      expect(screen.queryByText(/by /)).not.toBeInTheDocument();
    });
  });
});