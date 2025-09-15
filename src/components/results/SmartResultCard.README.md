# SmartResultCard 智能结果卡片组件

## 概述

`SmartResultCard` 是一个高级的结果展示卡片组件，专为3D素材搜索平台设计。它支持丰富的信息展示、多种卡片样式、图片懒加载和数据提取状态指示。

## 功能特性

### 🎨 多种卡片样式
- **紧凑模式 (compact)**: 适合列表视图，信息密集
- **标准模式 (standard)**: 平衡的信息展示，默认模式
- **详细模式 (detailed)**: 完整的信息展示，适合详情页

### 📊 丰富的信息展示
- 预览图片（支持多图）
- 价格信息（免费/付费/折扣）
- 文件信息（格式、大小）
- 统计数据（下载数、浏览数、评分）
- 分类标签
- 作者信息
- 时间信息

### 🔍 智能状态指示
- **提取状态**: 成功/部分/失败
- **质量评分**: 0-100分评分系统
- **置信度**: 数据提取的可信度
- **缺失字段**: 显示未能提取的数据

### 🖼️ 图片处理
- 懒加载优化性能
- 错误处理和占位图
- 多尺寸支持
- 缓存机制

## 使用方法

### 基础用法

```tsx
import { SmartResultCard } from './components/results';
import type { ExtractedMaterialResult, DisplayFieldConfig } from './types';

const displayFields: DisplayFieldConfig[] = [
  { key: 'title', label: '标题', visible: true, order: 1 },
  { key: 'description', label: '描述', visible: true, order: 2 },
  { key: 'previewImages', label: '预览图', visible: true, order: 3 },
  { key: 'pricing', label: '价格', visible: true, order: 4 }
];

function MyComponent() {
  const handleCardClick = (url: string) => {
    window.open(url, '_blank');
  };

  const handleImageError = (imageUrl: string) => {
    console.log('图片加载失败:', imageUrl);
  };

  return (
    <SmartResultCard
      result={extractedResult}
      displayFields={displayFields}
      cardStyle="standard"
      onCardClick={handleCardClick}
      onImageError={handleImageError}
    />
  );
}
```

### 不同样式展示

```tsx
// 紧凑模式 - 适合列表
<SmartResultCard
  result={result}
  displayFields={displayFields}
  cardStyle="compact"
  onCardClick={handleCardClick}
  onImageError={handleImageError}
/>

// 标准模式 - 默认
<SmartResultCard
  result={result}
  displayFields={displayFields}
  cardStyle="standard"
  onCardClick={handleCardClick}
  onImageError={handleImageError}
/>

// 详细模式 - 完整信息
<SmartResultCard
  result={result}
  displayFields={displayFields}
  cardStyle="detailed"
  onCardClick={handleCardClick}
  onImageError={handleImageError}
/>
```

### 响应式网格布局

```tsx
function ResultGrid({ results }: { results: ExtractedMaterialResult[] }) {
  const [cardStyle, setCardStyle] = useState<CardStyle>('standard');

  return (
    <div className={`grid gap-4 ${
      cardStyle === 'compact' ? 'grid-cols-1' : 
      cardStyle === 'standard' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2'
    }`}>
      {results.map((result) => (
        <SmartResultCard
          key={result.id}
          result={result}
          displayFields={displayFields}
          cardStyle={cardStyle}
          onCardClick={handleCardClick}
          onImageError={handleImageError}
        />
      ))}
    </div>
  );
}
```

## Props 接口

```tsx
interface SmartResultCardProps {
  /** 提取的素材结果数据 */
  result: ExtractedMaterialResult;
  
  /** 显示字段配置 */
  displayFields: DisplayFieldConfig[];
  
  /** 卡片样式 */
  cardStyle: 'compact' | 'standard' | 'detailed';
  
  /** 卡片点击回调 */
  onCardClick: (url: string) => void;
  
  /** 图片错误回调 */
  onImageError: (imageUrl: string) => void;
  
  /** 自定义CSS类名 */
  className?: string;
}
```

## 数据结构

### ExtractedMaterialResult

```tsx
interface ExtractedMaterialResult {
  // 基础信息
  id: string;
  title: string;
  description?: string;
  sourceWebsite: string;
  sourceUrl: string;
  
  // 媒体内容
  previewImages: Array<{
    url: string;
    alt?: string;
    size?: 'thumbnail' | 'medium' | 'large';
  }>;
  
  // 价格信息
  pricing: {
    isFree: boolean;
    price?: number;
    currency?: string;
    originalPrice?: number;
    discount?: number;
    priceText?: string;
  };
  
  // 文件信息
  fileInfo: {
    format?: string;
    size?: string;
    sizeBytes?: number;
    downloadUrl?: string;
  };
  
  // 统计信息
  statistics: {
    downloadCount?: number;
    viewCount?: number;
    likeCount?: number;
    rating?: number;
    reviewCount?: number;
  };
  
  // 分类和标签
  categorization: {
    category?: string;
    subcategory?: string;
    tags: string[];
    keywords?: string[];
  };
  
  // 作者信息
  author?: {
    name: string;
    profileUrl?: string;
    avatar?: string;
  };
  
  // 时间信息
  timestamps: {
    uploadDate?: Date;
    lastUpdated?: Date;
    extractedAt: Date;
  };
  
  // 提取元数据
  extraction: {
    ruleId: string;
    status: 'success' | 'partial' | 'failed';
    confidence: number; // 0-1
    missingFields: string[];
    errors?: string[];
    processingTime: number;
  };
  
  // 质量评分
  quality: {
    score: number; // 0-100
    factors: {
      completeness: number;
      imageQuality: number;
      dataAccuracy: number;
    };
  };
}
```

## 样式定制

### CSS 变量

组件使用以下CSS变量，可以通过覆盖来自定义样式：

```css
:root {
  --sketch-background: #f8fafc;
  --sketch-text: #1e293b;
  --sketch-muted: #64748b;
  --sketch-accent: #3b82f6;
  --sketch-border: #e2e8f0;
}
```

### 自定义样式类

```css
/* 自定义卡片样式 */
.my-custom-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 自定义悬停效果 */
.my-custom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

## 性能优化

### 图片懒加载

组件内置图片懒加载功能，只有当图片进入视口时才会开始加载：

```tsx
// 自动启用懒加载
<SmartResultCard
  result={result}
  // ... 其他props
/>
```

### 组件缓存

使用 React.memo 优化组件渲染：

```tsx
import React from 'react';

const MemoizedSmartResultCard = React.memo(SmartResultCard, (prevProps, nextProps) => {
  return (
    prevProps.result.id === nextProps.result.id &&
    prevProps.cardStyle === nextProps.cardStyle &&
    prevProps.displayFields === nextProps.displayFields
  );
});
```

### 虚拟滚动

对于大量结果，建议使用虚拟滚动：

```tsx
import { VirtualList } from './components/ui';

function VirtualizedResults({ results }: { results: ExtractedMaterialResult[] }) {
  return (
    <VirtualList
      items={results}
      itemHeight={cardStyle === 'compact' ? 120 : cardStyle === 'standard' ? 300 : 400}
      renderItem={({ item, index }) => (
        <SmartResultCard
          key={item.id}
          result={item}
          displayFields={displayFields}
          cardStyle={cardStyle}
          onCardClick={handleCardClick}
          onImageError={handleImageError}
        />
      )}
    />
  );
}
```

## 无障碍访问

组件内置无障碍访问支持：

- 键盘导航支持
- 屏幕阅读器友好
- 高对比度模式支持
- 语义化HTML结构

### ARIA 属性

```tsx
// 组件自动添加适当的ARIA属性
<div
  role="article"
  aria-label={`素材: ${result.title}`}
  tabIndex={0}
>
  {/* 卡片内容 */}
</div>
```

## 测试

### 单元测试

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartResultCard } from './SmartResultCard';
import { createMockExtractedResult } from '../../../utils/resultTransformer';

test('应该正确渲染卡片', () => {
  const mockResult = createMockExtractedResult();
  const mockOnCardClick = jest.fn();
  const mockOnImageError = jest.fn();

  render(
    <SmartResultCard
      result={mockResult}
      displayFields={[]}
      cardStyle="standard"
      onCardClick={mockOnCardClick}
      onImageError={mockOnImageError}
    />
  );

  expect(screen.getByText(mockResult.title)).toBeInTheDocument();
});
```

### 集成测试

```tsx
test('应该在点击时调用回调函数', () => {
  const mockResult = createMockExtractedResult();
  const mockOnCardClick = jest.fn();

  render(
    <SmartResultCard
      result={mockResult}
      displayFields={[]}
      cardStyle="standard"
      onCardClick={mockOnCardClick}
      onImageError={jest.fn()}
    />
  );

  fireEvent.click(screen.getByRole('article'));
  expect(mockOnCardClick).toHaveBeenCalledWith(mockResult.sourceUrl);
});
```

## 故障排除

### 常见问题

1. **图片不显示**
   - 检查图片URL是否有效
   - 确认网络连接正常
   - 查看浏览器控制台错误信息

2. **样式异常**
   - 确认CSS文件已正确导入
   - 检查Tailwind CSS配置
   - 验证CSS变量定义

3. **性能问题**
   - 启用图片懒加载
   - 使用React.memo优化
   - 考虑虚拟滚动

### 调试技巧

```tsx
// 启用调试模式
const DEBUG = process.env.NODE_ENV === 'development';

function SmartResultCard(props) {
  if (DEBUG) {
    console.log('SmartResultCard props:', props);
  }
  
  // 组件逻辑...
}
```

## 更新日志

### v1.0.0
- 初始版本发布
- 支持三种卡片样式
- 完整的数据展示功能
- 图片懒加载和错误处理
- 提取状态和质量评分指示

## 贡献指南

欢迎提交Issue和Pull Request来改进这个组件。请确保：

1. 遵循现有的代码风格
2. 添加适当的测试
3. 更新相关文档
4. 确保无障碍访问兼容性

## 许可证

MIT License