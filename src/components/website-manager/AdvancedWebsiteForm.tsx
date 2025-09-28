import React, { useState, useCallback } from 'react';
import { Input, Button, Card, Badge, Icon, Modal, Loading } from '../ui';
import type { CrawlerRule } from '../../crawler/types/crawler';
import { validateRuleConfig } from '../../crawler/config/presetRules';

interface AdvancedWebsiteFormProps {
  initialData?: CrawlerRule;
  onSubmit: (data: CrawlerRule) => void;
  onCancel: () => void;
  onTest?: (rule: CrawlerRule, keyword: string) => Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }>;
}

interface FormData {
  // 基本信息
  websiteName: string;
  websiteIcon: string;
  baseUrl: string;
  isActive: boolean;
  
  // 搜索配置
  searchUrlTemplate: string;
  searchMethod: 'GET' | 'POST';
  searchEncoding: string;
  
  // 列表页选择器
  listContainer: string;
  listItem: string;
  listLink: string;
  
  // 详情页选择器
  detailTitle: string;
  detailDescription: string;
  detailImages: string;
  detailPrice: string;
  detailFreeIndicator: string;
  detailFileFormat: string;
  detailFileSize: string;
  detailDownloads: string;
  detailViews: string;
  detailRating: string;
  detailAuthor: string;
  detailTags: string;
  detailCategory: string;
  detailUploadDate: string;
  
  // 数据处理
  priceRegex: string;
  priceCurrency: string;
  freeKeywords: string;
  dateFormat: string;
  
  // 反爬虫配置
  useHeadlessBrowser: boolean;
  userAgent: string;
  waitForSelector: string;
  waitTime: string;
  requestDelay: string;
  maxRetries: string;
  timeout: string;
  
  // 质量控制
  minTitleLength: string;
  requireImage: boolean;
  requirePrice: boolean;
  maxResultsPerPage: string;
  duplicateDetection: boolean;
  
  // 测试配置
  testKeyword: string;
}

export const AdvancedWebsiteForm: React.FC<AdvancedWebsiteFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onTest
}) => {
  const [formData, setFormData] = useState<FormData>({
    // 基本信息
    websiteName: initialData?.websiteName || '',
    websiteIcon: initialData?.websiteIcon || '',
    baseUrl: initialData?.baseUrl || '',
    isActive: initialData?.isActive ?? true,
    
    // 搜索配置
    searchUrlTemplate: initialData?.searchConfig.urlTemplate || '',
    searchMethod: initialData?.searchConfig.method || 'GET',
    searchEncoding: initialData?.searchConfig.encoding || 'utf-8',
    
    // 列表页选择器
    listContainer: initialData?.parseConfig.listSelectors.container || '',
    listItem: initialData?.parseConfig.listSelectors.item || '',
    listLink: initialData?.parseConfig.listSelectors.link || '',
    
    // 详情页选择器
    detailTitle: initialData?.parseConfig.detailSelectors.title || '',
    detailDescription: initialData?.parseConfig.detailSelectors.description || '',
    detailImages: initialData?.parseConfig.detailSelectors.images || '',
    detailPrice: initialData?.parseConfig.detailSelectors.price || '',
    detailFreeIndicator: initialData?.parseConfig.detailSelectors.freeIndicator || '',
    detailFileFormat: initialData?.parseConfig.detailSelectors.fileInfo?.format || '',
    detailFileSize: initialData?.parseConfig.detailSelectors.fileInfo?.size || '',
    detailDownloads: initialData?.parseConfig.detailSelectors.stats?.downloads || '',
    detailViews: initialData?.parseConfig.detailSelectors.stats?.views || '',
    detailRating: initialData?.parseConfig.detailSelectors.stats?.rating || '',
    detailAuthor: initialData?.parseConfig.detailSelectors.metadata?.author || '',
    detailTags: initialData?.parseConfig.detailSelectors.metadata?.tags || '',
    detailCategory: initialData?.parseConfig.detailSelectors.metadata?.category || '',
    detailUploadDate: initialData?.parseConfig.detailSelectors.metadata?.uploadDate || '',
    
    // 数据处理
    priceRegex: initialData?.dataProcessing.priceExtraction.regex || '([\\d.]+)',
    priceCurrency: initialData?.dataProcessing.priceExtraction.currency || 'CNY',
    freeKeywords: initialData?.dataProcessing.priceExtraction.freeKeywords?.join(', ') || '免费, free',
    dateFormat: initialData?.dataProcessing.dateProcessing.format || 'YYYY-MM-DD',
    
    // 反爬虫配置
    useHeadlessBrowser: initialData?.antiDetection.useHeadlessBrowser ?? true,
    userAgent: initialData?.antiDetection.browserConfig?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    waitForSelector: initialData?.antiDetection.browserConfig?.waitForSelector || '',
    waitTime: initialData?.antiDetection.browserConfig?.waitTime?.toString() || '2000',
    requestDelay: initialData?.antiDetection.requestConfig.delay.toString() || '2000',
    maxRetries: initialData?.antiDetection.requestConfig.maxRetries.toString() || '3',
    timeout: initialData?.antiDetection.requestConfig.timeout.toString() || '30000',
    
    // 质量控制
    minTitleLength: initialData?.qualityControl.minTitleLength.toString() || '3',
    requireImage: initialData?.qualityControl.requireImage ?? false,
    requirePrice: initialData?.qualityControl.requirePrice ?? false,
    maxResultsPerPage: initialData?.qualityControl.maxResultsPerPage.toString() || '20',
    duplicateDetection: initialData?.qualityControl.duplicateDetection ?? true,
    
    // 测试配置
    testKeyword: initialData?.testing.testKeyword || '测试'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'selectors' | 'processing' | 'advanced'>('basic');

  const handleChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 基本信息验证
    if (!formData.websiteName.trim()) {
      newErrors.websiteName = '网站名称不能为空';
    }
    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = '基础URL不能为空';
    }
    if (!formData.searchUrlTemplate.trim()) {
      newErrors.searchUrlTemplate = '搜索URL模板不能为空';
    } else if (!formData.searchUrlTemplate.includes('{keyword}')) {
      newErrors.searchUrlTemplate = 'URL模板必须包含{keyword}占位符';
    }

    // 选择器验证
    if (!formData.listContainer.trim()) {
      newErrors.listContainer = '列表容器选择器不能为空';
    }
    if (!formData.listItem.trim()) {
      newErrors.listItem = '列表项选择器不能为空';
    }
    if (!formData.listLink.trim()) {
      newErrors.listLink = '链接选择器不能为空';
    }
    if (!formData.detailTitle.trim()) {
      newErrors.detailTitle = '标题选择器不能为空';
    }

    // 数字字段验证
    const numericFields = ['waitTime', 'requestDelay', 'maxRetries', 'timeout', 'minTitleLength', 'maxResultsPerPage'];
    numericFields.forEach(field => {
      const value = parseInt(formData[field as keyof FormData] as string);
      if (isNaN(value) || value < 0) {
        newErrors[field] = '请输入有效的数字';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildRuleFromForm = (): CrawlerRule => {
    return {
      id: initialData?.id || `custom_${Date.now()}`,
      websiteName: formData.websiteName.trim(),
      websiteIcon: formData.websiteIcon.trim() || undefined,
      baseUrl: formData.baseUrl.trim(),
      isActive: formData.isActive,
      isPreset: false,
      
      searchConfig: {
        urlTemplate: formData.searchUrlTemplate.trim(),
        method: formData.searchMethod,
        encoding: formData.searchEncoding
      },
      
      parseConfig: {
        listSelectors: {
          container: formData.listContainer.trim(),
          item: formData.listItem.trim(),
          link: formData.listLink.trim()
        },
        detailSelectors: {
          title: formData.detailTitle.trim(),
          description: formData.detailDescription.trim() || undefined,
          images: formData.detailImages.trim() || undefined,
          price: formData.detailPrice.trim() || undefined,
          freeIndicator: formData.detailFreeIndicator.trim() || undefined,
          fileInfo: {
            format: formData.detailFileFormat.trim() || undefined,
            size: formData.detailFileSize.trim() || undefined
          },
          stats: {
            downloads: formData.detailDownloads.trim() || undefined,
            views: formData.detailViews.trim() || undefined,
            rating: formData.detailRating.trim() || undefined
          },
          metadata: {
            author: formData.detailAuthor.trim() || undefined,
            tags: formData.detailTags.trim() || undefined,
            category: formData.detailCategory.trim() || undefined,
            uploadDate: formData.detailUploadDate.trim() || undefined
          }
        }
      },
      
      dataProcessing: {
        textCleanup: {
          removeHtml: true,
          trimWhitespace: true,
          removeEmptyLines: true
        },
        priceExtraction: {
          regex: formData.priceRegex.trim(),
          currency: formData.priceCurrency.trim(),
          freeKeywords: formData.freeKeywords.split(',').map(k => k.trim()).filter(k => k)
        },
        dateProcessing: {
          format: formData.dateFormat.trim(),
          locale: 'zh-CN'
        },
        imageProcessing: {
          baseUrl: formData.baseUrl.trim(),
          preferredSize: 'medium'
        }
      },
      
      antiDetection: {
        useHeadlessBrowser: formData.useHeadlessBrowser,
        browserConfig: {
          viewport: { width: 1920, height: 1080 },
          userAgent: formData.userAgent.trim(),
          enableJavaScript: true,
          waitForSelector: formData.waitForSelector.trim() || undefined,
          waitTime: parseInt(formData.waitTime)
        },
        requestConfig: {
          delay: parseInt(formData.requestDelay),
          randomDelay: true,
          maxRetries: parseInt(formData.maxRetries),
          timeout: parseInt(formData.timeout)
        }
      },
      
      qualityControl: {
        minTitleLength: parseInt(formData.minTitleLength),
        requireImage: formData.requireImage,
        requirePrice: formData.requirePrice,
        maxResultsPerPage: parseInt(formData.maxResultsPerPage),
        duplicateDetection: formData.duplicateDetection
      },
      
      testing: {
        testKeyword: formData.testKeyword.trim(),
        successRate: 0,
        avgResponseTime: 0
      }
    };
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    if (!validateForm()) {
      return;
    }

    setIsTesting(true);
    try {
      const rule = buildRuleFromForm();
      const results = await onTest(rule, formData.testKeyword);
      setTestResults(results);
      setShowTestModal(true);
    } catch (error) {
      console.error('测试失败:', error);
      setTestResults({
        success: false,
        results: [],
        errors: [error instanceof Error ? error.message : '测试失败']
      });
      setShowTestModal(true);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const rule = buildRuleFromForm();
      
      // 验证规则配置
      const validation = validateRuleConfig(rule);
      if (!validation.isValid) {
        setErrors(validation.errors.reduce((acc, error) => {
          acc[error] = error;
          return acc;
        }, {} as Record<string, string>));
        return;
      }

      onSubmit(rule);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { key: 'basic', label: '基本配置', icon: 'settings' },
    { key: 'selectors', label: '选择器配置', icon: 'target' },
    { key: 'processing', label: '数据处理', icon: 'filter' },
    { key: 'advanced', label: '高级设置', icon: 'cog' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* 标签页导航 */}
      <div className="flex space-x-1 bg-sketch-background rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-sketch-accent shadow-sm'
                : 'text-sketch-muted hover:text-sketch-text'
            }`}
          >
            <Icon name={tab.icon} size="sm" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本配置 */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="网站名称 *"
                  value={formData.websiteName}
                  onChange={(e) => handleChange('websiteName', e.target.value)}
                  error={errors.websiteName}
                  placeholder="例如：魔顿网"
                />
                
                <Input
                  label="网站图标URL"
                  value={formData.websiteIcon}
                  onChange={(e) => handleChange('websiteIcon', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
                
                <Input
                  label="基础URL *"
                  value={formData.baseUrl}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  error={errors.baseUrl}
                  placeholder="https://example.com"
                />
                
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-sketch-accent border-2 border-sketch-border rounded focus:ring-sketch-accent"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-sketch-text">
                    启用此网站
                  </label>
                </div>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">搜索配置</h3>
              <div className="space-y-4">
                <Input
                  label="搜索URL模板 *"
                  value={formData.searchUrlTemplate}
                  onChange={(e) => handleChange('searchUrlTemplate', e.target.value)}
                  error={errors.searchUrlTemplate}
                  placeholder="https://example.com/search?q={keyword}"
                  helperText="使用{keyword}作为搜索关键词的占位符"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sketch-text mb-2">
                      请求方法
                    </label>
                    <select
                      value={formData.searchMethod}
                      onChange={(e) => handleChange('searchMethod', e.target.value as 'GET' | 'POST')}
                      className="w-full px-3 py-2 border border-sketch-border rounded-md focus:outline-none focus:ring-2 focus:ring-sketch-accent"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>
                  
                  <Input
                    label="页面编码"
                    value={formData.searchEncoding}
                    onChange={(e) => handleChange('searchEncoding', e.target.value)}
                    placeholder="utf-8"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 选择器配置 */}
        {activeTab === 'selectors' && (
          <div className="space-y-6">
            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">搜索结果页面选择器</h3>
              <div className="space-y-4">
                <Input
                  label="列表容器选择器 *"
                  value={formData.listContainer}
                  onChange={(e) => handleChange('listContainer', e.target.value)}
                  error={errors.listContainer}
                  placeholder="#main, .content, .search-results"
                  helperText="包含搜索结果的容器元素选择器，可用逗号分隔多个备选"
                />
                
                <Input
                  label="列表项选择器 *"
                  value={formData.listItem}
                  onChange={(e) => handleChange('listItem', e.target.value)}
                  error={errors.listItem}
                  placeholder="article, .post, .result-item"
                  helperText="单个搜索结果项的选择器，可用逗号分隔多个备选"
                />
                
                <Input
                  label="链接选择器 *"
                  value={formData.listLink}
                  onChange={(e) => handleChange('listLink', e.target.value)}
                  error={errors.listLink}
                  placeholder="h2 a, .title a, a[href*='archives']"
                  helperText="指向详情页面的链接选择器，可用逗号分隔多个备选"
                />
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">详情页面选择器</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="标题选择器 *"
                  value={formData.detailTitle}
                  onChange={(e) => handleChange('detailTitle', e.target.value)}
                  error={errors.detailTitle}
                  placeholder="h1, .title, .entry-title"
                />
                
                <Input
                  label="描述选择器"
                  value={formData.detailDescription}
                  onChange={(e) => handleChange('detailDescription', e.target.value)}
                  placeholder=".description, .content p:first-of-type"
                />
                
                <Input
                  label="图片选择器"
                  value={formData.detailImages}
                  onChange={(e) => handleChange('detailImages', e.target.value)}
                  placeholder=".preview img, .gallery img"
                />
                
                <Input
                  label="价格选择器"
                  value={formData.detailPrice}
                  onChange={(e) => handleChange('detailPrice', e.target.value)}
                  placeholder=".price, .cost"
                />
                
                <Input
                  label="免费标识选择器"
                  value={formData.detailFreeIndicator}
                  onChange={(e) => handleChange('detailFreeIndicator', e.target.value)}
                  placeholder=".free, .免费"
                />
                
                <Input
                  label="文件格式选择器"
                  value={formData.detailFileFormat}
                  onChange={(e) => handleChange('detailFileFormat', e.target.value)}
                  placeholder=".format, .file-type"
                />
                
                <Input
                  label="文件大小选择器"
                  value={formData.detailFileSize}
                  onChange={(e) => handleChange('detailFileSize', e.target.value)}
                  placeholder=".size, .file-size"
                />
                
                <Input
                  label="下载次数选择器"
                  value={formData.detailDownloads}
                  onChange={(e) => handleChange('detailDownloads', e.target.value)}
                  placeholder=".downloads, .dl-count"
                />
                
                <Input
                  label="浏览次数选择器"
                  value={formData.detailViews}
                  onChange={(e) => handleChange('detailViews', e.target.value)}
                  placeholder=".views, .view-count"
                />
                
                <Input
                  label="评分选择器"
                  value={formData.detailRating}
                  onChange={(e) => handleChange('detailRating', e.target.value)}
                  placeholder=".rating, .stars"
                />
                
                <Input
                  label="作者选择器"
                  value={formData.detailAuthor}
                  onChange={(e) => handleChange('detailAuthor', e.target.value)}
                  placeholder=".author, .uploader"
                />
                
                <Input
                  label="标签选择器"
                  value={formData.detailTags}
                  onChange={(e) => handleChange('detailTags', e.target.value)}
                  placeholder=".tags a, .tag-list a"
                />
                
                <Input
                  label="分类选择器"
                  value={formData.detailCategory}
                  onChange={(e) => handleChange('detailCategory', e.target.value)}
                  placeholder=".category, .cat-links a"
                />
                
                <Input
                  label="上传日期选择器"
                  value={formData.detailUploadDate}
                  onChange={(e) => handleChange('detailUploadDate', e.target.value)}
                  placeholder=".date, .upload-time"
                />
              </div>
            </Card>
          </div>
        )}

        {/* 数据处理 */}
        {activeTab === 'processing' && (
          <div className="space-y-6">
            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">价格处理</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="价格提取正则表达式"
                  value={formData.priceRegex}
                  onChange={(e) => handleChange('priceRegex', e.target.value)}
                  placeholder="([\\d.]+)"
                  helperText="用于从价格文本中提取数字的正则表达式"
                />
                
                <Input
                  label="货币单位"
                  value={formData.priceCurrency}
                  onChange={(e) => handleChange('priceCurrency', e.target.value)}
                  placeholder="CNY"
                />
                
                <div className="md:col-span-2">
                  <Input
                    label="免费关键词"
                    value={formData.freeKeywords}
                    onChange={(e) => handleChange('freeKeywords', e.target.value)}
                    placeholder="免费, free, 0元"
                    helperText="用逗号分隔多个关键词，用于识别免费内容"
                  />
                </div>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">其他数据处理</h3>
              <Input
                label="日期格式"
                value={formData.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                placeholder="YYYY-MM-DD"
                helperText="日期解析格式，支持常见的日期格式"
              />
            </Card>
          </div>
        )}

        {/* 高级设置 */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">反爬虫设置</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useHeadlessBrowser"
                    checked={formData.useHeadlessBrowser}
                    onChange={(e) => handleChange('useHeadlessBrowser', e.target.checked)}
                    className="w-4 h-4 text-sketch-accent border-2 border-sketch-border rounded focus:ring-sketch-accent"
                  />
                  <label htmlFor="useHeadlessBrowser" className="text-sm font-medium text-sketch-text">
                    使用无头浏览器（推荐）
                  </label>
                </div>
                
                <Input
                  label="用户代理字符串"
                  value={formData.userAgent}
                  onChange={(e) => handleChange('userAgent', e.target.value)}
                  placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                />
                
                <Input
                  label="等待选择器"
                  value={formData.waitForSelector}
                  onChange={(e) => handleChange('waitForSelector', e.target.value)}
                  placeholder="#main, .content"
                  helperText="页面加载后等待此选择器出现"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="等待时间 (毫秒)"
                    type="number"
                    value={formData.waitTime}
                    onChange={(e) => handleChange('waitTime', e.target.value)}
                    error={errors.waitTime}
                    placeholder="2000"
                  />
                  
                  <Input
                    label="请求延迟 (毫秒)"
                    type="number"
                    value={formData.requestDelay}
                    onChange={(e) => handleChange('requestDelay', e.target.value)}
                    error={errors.requestDelay}
                    placeholder="2000"
                  />
                  
                  <Input
                    label="超时时间 (毫秒)"
                    type="number"
                    value={formData.timeout}
                    onChange={(e) => handleChange('timeout', e.target.value)}
                    error={errors.timeout}
                    placeholder="30000"
                  />
                </div>
                
                <Input
                  label="最大重试次数"
                  type="number"
                  value={formData.maxRetries}
                  onChange={(e) => handleChange('maxRetries', e.target.value)}
                  error={errors.maxRetries}
                  placeholder="3"
                />
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">质量控制</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="最小标题长度"
                  type="number"
                  value={formData.minTitleLength}
                  onChange={(e) => handleChange('minTitleLength', e.target.value)}
                  error={errors.minTitleLength}
                  placeholder="3"
                />
                
                <Input
                  label="每页最大结果数"
                  type="number"
                  value={formData.maxResultsPerPage}
                  onChange={(e) => handleChange('maxResultsPerPage', e.target.value)}
                  error={errors.maxResultsPerPage}
                  placeholder="20"
                />
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requireImage"
                    checked={formData.requireImage}
                    onChange={(e) => handleChange('requireImage', e.target.checked)}
                    className="w-4 h-4 text-sketch-accent border-2 border-sketch-border rounded focus:ring-sketch-accent"
                  />
                  <label htmlFor="requireImage" className="text-sm font-medium text-sketch-text">
                    要求必须有预览图
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="requirePrice"
                    checked={formData.requirePrice}
                    onChange={(e) => handleChange('requirePrice', e.target.checked)}
                    className="w-4 h-4 text-sketch-accent border-2 border-sketch-border rounded focus:ring-sketch-accent"
                  />
                  <label htmlFor="requirePrice" className="text-sm font-medium text-sketch-text">
                    要求必须有价格信息
                  </label>
                </div>
                
                <div className="flex items-center gap-3 md:col-span-2">
                  <input
                    type="checkbox"
                    id="duplicateDetection"
                    checked={formData.duplicateDetection}
                    onChange={(e) => handleChange('duplicateDetection', e.target.checked)}
                    className="w-4 h-4 text-sketch-accent border-2 border-sketch-border rounded focus:ring-sketch-accent"
                  />
                  <label htmlFor="duplicateDetection" className="text-sm font-medium text-sketch-text">
                    启用重复检测
                  </label>
                </div>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <h3 className="text-lg font-semibold text-sketch-text mb-4">测试配置</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    label="测试关键词"
                    value={formData.testKeyword}
                    onChange={(e) => handleChange('testKeyword', e.target.value)}
                    placeholder="手机"
                    helperText="用于测试爬虫规则的关键词"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    loading={isTesting}
                    disabled={isTesting || !onTest}
                    icon={<Icon name="play" size="sm" />}
                  >
                    测试规则
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-sketch-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {initialData ? '更新配置' : '添加网站'}
          </Button>
        </div>
      </form>

      {/* 测试结果模态框 */}
      <Modal
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="测试结果"
        size="lg"
      >
        {testResults && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={testResults.success ? 'success' : 'danger'}>
                {testResults.success ? '测试成功' : '测试失败'}
              </Badge>
              <span className="text-sm text-sketch-muted">
                找到 {testResults.results.length} 个结果
              </span>
            </div>

            {testResults.errors.length > 0 && (
              <Card variant="outlined" padding="sm">
                <h4 className="font-medium text-red-600 mb-2">错误信息:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {testResults.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </Card>
            )}

            {testResults.results.length > 0 && (
              <Card variant="outlined" padding="sm">
                <h4 className="font-medium text-sketch-text mb-2">提取结果:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {testResults.results.slice(0, 5).map((result: any, index: number) => (
                    <div key={index} className="text-sm border-l-2 border-sketch-accent pl-3">
                      <div className="font-medium">{result.title || '无标题'}</div>
                      {result.url && (
                        <div className="text-sketch-muted truncate">{result.url}</div>
                      )}
                      {result.image && (
                        <div className="text-sketch-muted">图片: {result.image}</div>
                      )}
                    </div>
                  ))}
                  {testResults.results.length > 5 && (
                    <div className="text-sm text-sketch-muted">
                      还有 {testResults.results.length - 5} 个结果...
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};