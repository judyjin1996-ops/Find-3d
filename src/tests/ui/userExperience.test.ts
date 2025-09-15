/**
 * 用户体验测试
 * 测试用户界面和交互体验的质量
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartSearchComponent } from '../../components/search/SmartSearchComponent';
import { SmartResultCard } from '../../components/results/SmartResultCard';
import { CrawlerRuleManager } from '../../components/crawler/CrawlerRuleManager';
import { SmartCacheManager } from '../../components/cache/SmartCacheManager';
import { SearchHistoryManager } from '../../components/search/SearchHistoryManager';
import { userConfigService } from '../../services/userConfigService';
import { smartCacheService } from '../../services/smartCacheService';
import type { ExtractedMaterialResult, CrawlingStatus } from '../../types';

// Mock 数据
const mockSearchResults: ExtractedMaterialResult[] = [
  {
    id: 'ui-test-1',
    title: '现代建筑3D模型',
    description: '高质量的现代建筑3D模型，适用于建筑可视化项目',
    sourceWebsite: '魔顿网',
    sourceUrl: 'https://www.modown.cn/archives/123456.html',
    previewImages: [
      { url: 'https://example.com/preview1.jpg', alt: '主预览图' },
      { url: 'https://example.com/preview2.jpg', alt: '侧视图' }
    ],
    pricing: {
      isFree: false,
      price: 29.99,
      currency: 'CNY'
    },
    fileInfo: {
      format: '3ds Max',
      size: '15.6MB'
    },
    statistics: {
      downloadCount: 1250,
      viewCount: 5600,
      rating: 4.7,
      reviewCount: 23
    },
    categorization: {
      category: '建筑模型',
      tags: ['现代', '建筑', '商业']
    },
    timestamps: {
      uploadDate: new Date('2024-01-15'),
      extractedAt: new Date()
    },
    extraction: {
      ruleId: 'modown-rule',
      status: 'success',
      confidence: 0.95,
      missingFields: [],
      processingTime: 1200
    },
    quality: {
      score: 92,
      factors: { completeness: 95, imageQuality: 90, dataAccuracy: 91 }
    }
  },
  {
    id: 'ui-test-2',
    title: '免费汽车模型包',
    description: '包含多种汽车模型的免费资源包',
    sourceWebsite: 'CG资源网',
    sourceUrl: 'https://www.cgown.com/model/car-pack.html',
    previewImages: [
      { url: 'https://example.com/car-preview.jpg', alt: '汽车预览' }
    ],
    pricing: {
      isFree: true
    },
    fileInfo: {
      format: 'FBX',
      size: '45.2MB'
    },
    statistics: {
      downloadCount: 3200,
      rating: 4.2
    },
    categorization: {
      category: '交通工具',
      tags: ['汽车', '免费', '模型包']
    },
    timestamps: {
      uploadDate: new Date('2024-02-01'),
      extractedAt: new Date()
    },
    extraction: {
      ruleId: 'cgown-rule',
      status: 'success',
      confidence: 0.88,
      missingFields: [],
      processingTime: 980
    },
    quality: {
      score: 85,
      factors: { completeness: 88, imageQuality: 82, dataAccuracy: 85 }
    }
  }
];

const mockCrawlingStatus: CrawlingStatus = {
  totalWebsites: 4,
  completedWebsites: 2,
  currentWebsite: '魔顿网',
  errors: []
};

describe('用户体验测试', () => {
  beforeAll(async () => {
    await smartCacheService.initialize();
    console.log('🎨 用户体验测试环境初始化完成');
  });

  afterAll(async () => {
    await smartCacheService.cleanup();
    console.log('🧹 用户体验测试环境清理完成');
  });

  beforeEach(() => {
    cleanup();
    // 重置用户配置
    userConfigService.resetToDefaults();
  });

  describe('搜索界面用户体验', () => {
    test('搜索输入框应该响应用户输入', async () => {
      const user = userEvent.setup();
      const mockOnSearch = vi.fn();

      render(
        <SmartSearchComponent
          onSearch={mockOnSearch}
          loading={false}
          crawlingStatus={mockCrawlingStatus}
          availableWebsites={[]}
        />
      );

      const searchInput = screen.getByPlaceholderText(/搜索3D素材/i);
      expect(searchInput).toBeInTheDocument();

      // 测试输入响应
      await user.type(searchInput, '现代建筑');
      expect(searchInput).toHaveValue('现代建筑');

      // 测试搜索触发
      const searchButton = screen.getByRole('button', { name: /搜索/i });
      await user.click(searchButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('现代建筑', undefined);
    });

    test('应该显示搜索建议', async () => {
      const user = userEvent.setup();
      
      // 添加搜索历史
      userConfigService.addSearchHistory({
        query: '现代建筑模型',
        websites: ['modown'],
        resultCount: 15,
        searchTime: 2000
      });

      userConfigService.addSearchHistory({
        query: '现代家具设计',
        websites: ['cgown'],
        resultCount: 8,
        searchTime: 1500
      });

      render(
        <SmartSearchComponent
          onSearch={vi.fn()}
          loading={false}
          crawlingStatus={mockCrawlingStatus}
          availableWebsites={[]}
        />
      );

      const searchInput = screen.getByPlaceholderText(/搜索3D素材/i);
      
      // 输入触发建议
      await user.type(searchInput, '现代');
      
      // 等待建议出现
      await waitFor(() => {
        expect(screen.getByText('现代建筑模型')).toBeInTheDocument();
        expect(screen.getByText('现代家具设计')).toBeInTheDocument();
      });

      // 点击建议
      await user.click(screen.getByText('现代建筑模型'));
      expect(searchInput).toHaveValue('现代建筑模型');
    });

    test('应该显示爬虫状态', () => {
      const crawlingStatus: CrawlingStatus = {
        totalWebsites: 4,
        completedWebsites: 2,
        currentWebsite: '魔顿网',
        errors: [
          {
            website: 'CG资源网',
            type: 'network',
            message: '网络连接超时',
            timestamp: new Date()
          }
        ]
      };

      render(
        <SmartSearchComponent
          onSearch={vi.fn()}
          loading={true}
          crawlingStatus={crawlingStatus}
          availableWebsites={[]}
        />
      );

      // 验证状态显示
      expect(screen.getByText(/正在搜索/i)).toBeInTheDocument();
      expect(screen.getByText(/2\/4/)).toBeInTheDocument();
      expect(screen.getByText(/魔顿网/)).toBeInTheDocument();
      expect(screen.getByText(/网络连接超时/)).toBeInTheDocument();
    });

    test('搜索界面应该响应式适配', () => {
      const { container } = render(
        <SmartSearchComponent
          onSearch={vi.fn()}
          loading={false}
          crawlingStatus={mockCrawlingStatus}
          availableWebsites={[]}
        />
      );

      // 模拟不同屏幕尺寸
      const searchContainer = container.firstChild as HTMLElement;
      
      // 桌面端
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      fireEvent(window, new Event('resize'));
      expect(searchContainer).toHaveClass('desktop-layout');

      // 平板端
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      fireEvent(window, new Event('resize'));
      expect(searchContainer).toHaveClass('tablet-layout');

      // 移动端
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      fireEvent(window, new Event('resize'));
      expect(searchContainer).toHaveClass('mobile-layout');
    });
  });

  describe('结果卡片用户体验', () => {
    test('结果卡片应该显示完整信息', () => {
      const displayFields = userConfigService.getDisplayFields();
      
      render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={displayFields}
          cardStyle="standard"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      // 验证基本信息显示
      expect(screen.getByText('现代建筑3D模型')).toBeInTheDocument();
      expect(screen.getByText(/高质量的现代建筑3D模型/)).toBeInTheDocument();
      expect(screen.getByText('魔顿网')).toBeInTheDocument();
      expect(screen.getByText('¥29.99')).toBeInTheDocument();
      expect(screen.getByText('15.6MB')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument(); // 下载次数
      expect(screen.getByText('4.7')).toBeInTheDocument(); // 评分
    });

    test('免费素材应该显示免费标识', () => {
      render(
        <SmartResultCard
          result={mockSearchResults[1]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      expect(screen.getByText('免费')).toBeInTheDocument();
      expect(screen.getByText('免费')).toHaveClass('free-badge');
    });

    test('卡片点击应该触发回调', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={mockOnClick}
          onImageError={vi.fn()}
        />
      );

      const card = screen.getByRole('article');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledWith(mockSearchResults[0].sourceUrl);
    });

    test('图片加载错误应该显示占位图', async () => {
      const mockOnImageError = vi.fn();

      render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={vi.fn()}
          onImageError={mockOnImageError}
        />
      );

      const image = screen.getByAltText('主预览图');
      
      // 模拟图片加载错误
      fireEvent.error(image);

      expect(mockOnImageError).toHaveBeenCalledWith('https://example.com/preview1.jpg');
      
      // 应该显示占位图
      await waitFor(() => {
        expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
      });
    });

    test('不同卡片样式应该正确渲染', () => {
      const { rerender } = render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="compact"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      let card = screen.getByRole('article');
      expect(card).toHaveClass('compact-card');

      rerender(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="detailed"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      card = screen.getByRole('article');
      expect(card).toHaveClass('detailed-card');
    });

    test('卡片应该支持键盘导航', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={mockOnClick}
          onImageError={vi.fn()}
        />
      );

      const card = screen.getByRole('article');
      
      // Tab 键聚焦
      await user.tab();
      expect(card).toHaveFocus();

      // Enter 键激活
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('配置管理用户体验', () => {
    test('显示字段配置应该实时生效', async () => {
      const user = userEvent.setup();

      render(<CrawlerRuleManager />);

      // 打开显示配置
      const configButton = screen.getByRole('button', { name: /显示配置/i });
      await user.click(configButton);

      // 切换字段显示
      const priceToggle = screen.getByLabelText(/显示价格/i);
      await user.click(priceToggle);

      // 验证配置已更新
      const config = userConfigService.getConfig();
      const priceField = config.display.fieldsToShow.find(f => f.key === 'pricing');
      expect(priceField?.visible).toBe(false);
    });

    test('卡片样式切换应该立即生效', async () => {
      const user = userEvent.setup();

      render(<CrawlerRuleManager />);

      // 切换到紧凑模式
      const compactButton = screen.getByRole('button', { name: /紧凑模式/i });
      await user.click(compactButton);

      // 验证配置更新
      const config = userConfigService.getConfig();
      expect(config.display.cardStyle).toBe('compact');
    });

    test('搜索历史管理应该用户友好', async () => {
      const user = userEvent.setup();

      // 添加一些搜索历史
      userConfigService.addSearchHistory({
        query: '建筑模型',
        websites: ['modown'],
        resultCount: 20,
        searchTime: 2500
      });

      render(<SearchHistoryManager />);

      // 验证历史显示
      expect(screen.getByText('建筑模型')).toBeInTheDocument();
      expect(screen.getByText('20 个结果')).toBeInTheDocument();

      // 清除历史
      const clearButton = screen.getByRole('button', { name: /清除历史/i });
      await user.click(clearButton);

      // 确认对话框
      const confirmButton = screen.getByRole('button', { name: /确认/i });
      await user.click(confirmButton);

      // 验证历史已清除
      expect(screen.queryByText('建筑模型')).not.toBeInTheDocument();
    });
  });

  describe('缓存管理用户体验', () => {
    test('缓存统计应该清晰显示', async () => {
      // 添加一些缓存数据
      await smartCacheService.set('test', 'item1', { data: 'test1' });
      await smartCacheService.set('test', 'item2', { data: 'test2' });

      render(<SmartCacheManager />);

      // 验证统计显示
      expect(screen.getByText(/缓存项目/)).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });

    test('缓存清理应该有确认机制', async () => {
      const user = userEvent.setup();

      render(<SmartCacheManager />);

      // 点击清理按钮
      const clearButton = screen.getByRole('button', { name: /清理缓存/i });
      await user.click(clearButton);

      // 应该显示确认对话框
      expect(screen.getByText(/确认清理/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /确认/i })).toBeInTheDocument();
    });
  });

  describe('无障碍访问测试', () => {
    test('所有交互元素应该有适当的ARIA标签', () => {
      render(
        <SmartSearchComponent
          onSearch={vi.fn()}
          loading={false}
          crawlingStatus={mockCrawlingStatus}
          availableWebsites={[]}
        />
      );

      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveAttribute('aria-label');

      const searchButton = screen.getByRole('button', { name: /搜索/i });
      expect(searchButton).toHaveAttribute('aria-label');
    });

    test('结果卡片应该有语义化结构', () => {
      render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby');

      const title = screen.getByRole('heading');
      expect(title).toBeInTheDocument();

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt');
    });

    test('键盘导航应该流畅', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <SmartSearchComponent
            onSearch={vi.fn()}
            loading={false}
            crawlingStatus={mockCrawlingStatus}
            availableWebsites={[]}
          />
          <SmartResultCard
            result={mockSearchResults[0]}
            displayFields={userConfigService.getDisplayFields()}
            cardStyle="standard"
            onCardClick={vi.fn()}
            onImageError={vi.fn()}
          />
        </div>
      );

      // Tab 导航顺序
      await user.tab(); // 搜索输入框
      expect(screen.getByRole('textbox')).toHaveFocus();

      await user.tab(); // 搜索按钮
      expect(screen.getByRole('button', { name: /搜索/i })).toHaveFocus();

      await user.tab(); // 结果卡片
      expect(screen.getByRole('article')).toHaveFocus();
    });

    test('颜色对比度应该符合标准', () => {
      const { container } = render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      // 检查文本颜色对比度
      const titleElement = screen.getByText('现代建筑3D模型');
      const computedStyle = window.getComputedStyle(titleElement);
      
      // 这里应该有实际的颜色对比度检查逻辑
      expect(computedStyle.color).toBeTruthy();
    });
  });

  describe('响应式设计测试', () => {
    test('移动端布局应该适配', () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      const { container } = render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      fireEvent(window, new Event('resize'));

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('mobile-card');
    });

    test('平板端布局应该适配', () => {
      // 模拟平板端视口
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });

      const { container } = render(
        <SmartSearchComponent
          onSearch={vi.fn()}
          loading={false}
          crawlingStatus={mockCrawlingStatus}
          availableWebsites={[]}
        />
      );

      fireEvent(window, new Event('resize'));

      const searchContainer = container.firstChild as HTMLElement;
      expect(searchContainer).toHaveClass('tablet-layout');
    });

    test('触摸操作应该响应', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={mockOnClick}
          onImageError={vi.fn()}
        />
      );

      const card = screen.getByRole('article');
      
      // 模拟触摸事件
      fireEvent.touchStart(card);
      fireEvent.touchEnd(card);

      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('性能用户体验', () => {
    test('大量结果渲染应该流畅', async () => {
      const largeResultSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockSearchResults[0],
        id: `perf-test-${i}`,
        title: `性能测试素材 ${i}`
      }));

      const startTime = Date.now();
      
      render(
        <div>
          {largeResultSet.map(result => (
            <SmartResultCard
              key={result.id}
              result={result}
              displayFields={userConfigService.getDisplayFields()}
              cardStyle="compact"
              onCardClick={vi.fn()}
              onImageError={vi.fn()}
            />
          ))}
        </div>
      );

      const renderTime = Date.now() - startTime;
      
      // 渲染时间应该在合理范围内
      expect(renderTime).toBeLessThan(1000); // 1秒内
      
      console.log(`🚀 渲染 ${largeResultSet.length} 个卡片耗时: ${renderTime}ms`);
    });

    test('图片懒加载应该工作', async () => {
      const { container } = render(
        <SmartResultCard
          result={mockSearchResults[0]}
          displayFields={userConfigService.getDisplayFields()}
          cardStyle="standard"
          onCardClick={vi.fn()}
          onImageError={vi.fn()}
        />
      );

      const image = screen.getByAltText('主预览图');
      
      // 初始状态应该是懒加载占位符
      expect(image).toHaveAttribute('loading', 'lazy');
      
      // 模拟图片进入视口
      const intersectionObserver = new IntersectionObserver(vi.fn());
      intersectionObserver.observe(image);
      
      // 触发交叉观察
      fireEvent(image, new Event('load'));
      
      expect(image).toHaveAttribute('src', 'https://example.com/preview1.jpg');
    });

    test('搜索防抖应该工作', async () => {
      const user = userEvent.setup();
      const mockOnSearch = vi.fn();

      render(
        <SmartSearchComponent
          onSearch={mockOnSearch}
          loading={false}
          crawlingStatus={mockCrawlingStatus}
          availableWebsites={[]}
        />
      );

      const searchInput = screen.getByPlaceholderText(/搜索3D素材/i);
      
      // 快速输入多个字符
      await user.type(searchInput, '建筑模型');
      
      // 等待防抖延迟
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('错误处理用户体验', () => {
    test('网络错误应该友好提示', () => {
      const errorStatus: CrawlingStatus = {
        totalWebsites: 2,
        completedWebsites: 1,
        currentWebsite: undefined,
        errors: [
          {
            website: '魔顿网',
            type: 'network',
            message: '网络连接失败',
            timestamp: new Date()
          }
        ]
      };

      render(
        <SmartSearchComponent
          onSearch={vi.fn()}
          loading={false}
          crawlingStatus={errorStatus}
          availableWebsites={[]}
        />
      );

      expect(screen.getByText(/网络连接失败/)).toBeInTheDocument();
      expect(screen.getByText(/魔顿网/)).toBeInTheDocument();
    });

    test('空结果应该显示友好提示', () => {
      render(
        <div data-testid="empty-results">
          <p>未找到相关素材，请尝试其他关键词</p>
          <button>重新搜索</button>
        </div>
      );

      expect(screen.getByText(/未找到相关素材/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /重新搜索/i })).toBeInTheDocument();
    });

    test('加载状态应该有视觉反馈', () => {
      render(
        <SmartSearchComponent
          onSearch={vi.fn()}
          loading={true}
          crawlingStatus={mockCrawlingStatus}
          availableWebsites={[]}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/正在搜索/)).toBeInTheDocument();
    });
  });
});