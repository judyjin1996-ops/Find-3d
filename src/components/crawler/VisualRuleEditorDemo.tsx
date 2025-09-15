import React, { useState } from 'react';
import { VisualRuleEditor } from './VisualRuleEditor';
import { Card, Button, Icon, Badge } from '../ui';
import type { CrawlerRule } from '../../crawler/types/crawler';

// 模拟的预览结果接口
interface PreviewResult {
  elements: Array<{
    text: string;
    html: string;
    attributes: Record<string, string>;
    xpath: string;
    cssSelector: string;
  }>;
  count: number;
  screenshot?: string;
}

export const VisualRuleEditorDemo: React.FC = () => {
  const [currentRule, setCurrentRule] = useState<CrawlerRule>({
    id: 'demo-rule',
    websiteName: '演示网站',
    websiteIcon: '',
    baseUrl: 'https://example.com',
    isActive: true,
    isPreset: false,
    searchUrlTemplate: 'https://example.com/search?q={keyword}',
    searchMethod: 'GET',
    searchHeaders: {},
    selectors: {
      resultList: '',
      resultLink: '',
      title: '',
      description: '',
      previewImages: '',
      price: '',
      isFree: '',
      fileFormat: '',
      fileSize: '',
      downloadCount: '',
      rating: '',
      tags: '',
      author: '',
      uploadDate: ''
    },
    dataProcessing: {
      priceRegex: '',
      dateFormat: '',
      tagSeparator: ',',
      imageUrlPrefix: ''
    },
    antiBot: {
      useHeadlessBrowser: false,
      waitForSelector: '',
      delay: 1000,
      userAgent: '',
      enableProxy: false
    },
    testKeyword: '手机'
  });

  const [websiteUrl, setWebsiteUrl] = useState('https://www.modown.cn');
  const [availableWebsites] = useState([
    { url: 'https://www.modown.cn', name: '魔顿网' },
    { url: 'https://www.cgown.com', name: 'CG资源网' },
    { url: 'https://c4dsky.com', name: '书生CG资源站' },
    { url: 'https://www.3dxy.com', name: '3D溜溜网' }
  ]);

  // 处理规则变更
  const handleRuleChange = (changes: Partial<CrawlerRule>) => {
    setCurrentRule(prev => ({
      ...prev,
      ...changes
    }));
  };

  // 模拟预览选择器
  const handlePreviewSelector = async (selector: string): Promise<PreviewResult> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 模拟不同的预览结果
    const mockResults: PreviewResult[] = [
      {
        count: 5,
        elements: [
          {
            text: '高质量手机3D模型',
            html: '<h2 class="title">高质量手机3D模型</h2>',
            attributes: { class: 'title', id: 'item-1' },
            xpath: '/html/body/div[1]/div[2]/h2',
            cssSelector: 'h2.title'
          },
          {
            text: 'iPhone 14 Pro 3D模型',
            html: '<h2 class="title">iPhone 14 Pro 3D模型</h2>',
            attributes: { class: 'title', id: 'item-2' },
            xpath: '/html/body/div[1]/div[3]/h2',
            cssSelector: 'h2.title'
          },
          {
            text: '三星Galaxy S23 模型',
            html: '<h2 class="title">三星Galaxy S23 模型</h2>',
            attributes: { class: 'title', id: 'item-3' },
            xpath: '/html/body/div[1]/div[4]/h2',
            cssSelector: 'h2.title'
          }
        ]
      },
      {
        count: 0,
        elements: []
      },
      {
        count: 12,
        elements: [
          {
            text: '¥29.99',
            html: '<span class="price">¥29.99</span>',
            attributes: { class: 'price' },
            xpath: '/html/body/div[1]/div[2]/span',
            cssSelector: '.price'
          },
          {
            text: '免费',
            html: '<span class="price free">免费</span>',
            attributes: { class: 'price free' },
            xpath: '/html/body/div[1]/div[3]/span',
            cssSelector: '.price.free'
          }
        ]
      }
    ];
    
    // 根据选择器返回不同的结果
    if (!selector.trim()) {
      return { count: 0, elements: [] };
    }
    
    if (selector.includes('title') || selector.includes('h1') || selector.includes('h2')) {
      return mockResults[0];
    } else if (selector.includes('price') || selector.includes('cost')) {
      return mockResults[2];
    } else if (Math.random() > 0.7) {
      return mockResults[1]; // 偶尔返回空结果
    } else {
      return mockResults[0];
    }
  };

  // 导出规则配置
  const exportRule = () => {
    const blob = new Blob([JSON.stringify(currentRule, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentRule.websiteName}-rule.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 重置规则
  const resetRule = () => {
    setCurrentRule(prev => ({
      ...prev,
      selectors: {
        resultList: '',
        resultLink: '',
        title: '',
        description: '',
        previewImages: '',
        price: '',
        isFree: '',
        fileFormat: '',
        fileSize: '',
        downloadCount: '',
        rating: '',
        tags: '',
        author: '',
        uploadDate: ''
      }
    }));
  };

  // 加载预设规则
  const loadPresetRule = (websiteName: string) => {
    const presetRules: Record<string, Partial<CrawlerRule>> = {
      '魔顿网': {
        selectors: {
          resultList: '.search-results article',
          resultLink: 'h2.entry-title a',
          title: 'h1.entry-title',
          description: '.entry-content p:first-of-type',
          previewImages: '.entry-content img:first-of-type',
          price: '.price-info',
          isFree: '.free-tag',
          fileFormat: '.file-format',
          fileSize: '.file-size',
          downloadCount: '.download-count',
          rating: '.rating-stars',
          tags: '.post-tags a',
          author: '.author-name',
          uploadDate: '.post-date'
        }
      },
      'CG资源网': {
        selectors: {
          resultList: '.resource-list .item',
          resultLink: '.title a',
          title: 'h1.resource-title',
          description: '.resource-desc',
          previewImages: '.preview-gallery img',
          price: '.price-tag',
          isFree: '.free-label',
          fileFormat: '.format-info',
          fileSize: '.size-info',
          downloadCount: '.download-stats',
          rating: '.rating-score',
          tags: '.tag-list .tag',
          author: '.author-info',
          uploadDate: '.upload-date'
        }
      }
    };
    
    const preset = presetRules[websiteName];
    if (preset) {
      handleRuleChange(preset);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* 标题和说明 */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-sketch-text">
          可视化规则编辑器演示
        </h1>
        <p className="text-sketch-muted max-w-2xl mx-auto">
          通过可视化界面配置爬虫规则，支持实时预览网页、点击选择元素、
          自动生成选择器和实时验证规则有效性。
        </p>
      </div>

      {/* 控制面板 */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sketch-text">控制面板</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 网站选择 */}
            <div>
              <label className="block text-sm font-medium text-sketch-text mb-2">
                目标网站
              </label>
              <select
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3 py-2 border border-sketch-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent"
              >
                {availableWebsites.map((site) => (
                  <option key={site.url} value={site.url}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 预设规则 */}
            <div>
              <label className="block text-sm font-medium text-sketch-text mb-2">
                加载预设
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    loadPresetRule(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-sketch-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent"
              >
                <option value="">选择预设规则</option>
                <option value="魔顿网">魔顿网规则</option>
                <option value="CG资源网">CG资源网规则</option>
              </select>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetRule}
                icon={<Icon name="refresh-cw" size="sm" />}
              >
                重置
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportRule}
                icon={<Icon name="download" size="sm" />}
              >
                导出
              </Button>
            </div>
            
            {/* 规则状态 */}
            <div className="flex items-end">
              <div className="text-sm">
                <div className="text-sketch-muted">已配置字段:</div>
                <div className="font-medium text-sketch-text">
                  {Object.values(currentRule.selectors).filter(Boolean).length} / {Object.keys(currentRule.selectors).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 功能特性说明 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">
          编辑器功能特性
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="eye" size="lg" className="text-blue-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">实时预览</h4>
            <p className="text-sm text-sketch-muted">
              在iframe中实时预览目标网页，支持缩放和交互
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="target" size="lg" className="text-green-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">点击选择</h4>
            <p className="text-sm text-sketch-muted">
              点击页面元素自动生成CSS选择器
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="zap" size="lg" className="text-purple-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">智能建议</h4>
            <p className="text-sm text-sketch-muted">
              提供常用选择器模式的智能建议
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="check-circle" size="lg" className="text-orange-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">实时验证</h4>
            <p className="text-sm text-sketch-muted">
              实时验证选择器并显示匹配结果
            </p>
          </div>
        </div>
      </Card>

      {/* 可视化规则编辑器 */}
      <Card className="p-6">
        <div className="h-[800px]">
          <VisualRuleEditor
            websiteUrl={websiteUrl}
            currentRule={currentRule}
            onRuleChange={handleRuleChange}
            onPreview={handlePreviewSelector}
          />
        </div>
      </Card>

      {/* 当前规则配置 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">
          当前规则配置
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-sketch-text mb-3">已配置选择器</h4>
            <div className="space-y-2">
              {Object.entries(currentRule.selectors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-sketch-muted capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <div className="flex items-center gap-2">
                    {value ? (
                      <>
                        <Badge variant="success" size="xs">已配置</Badge>
                        <code className="text-xs bg-sketch-background px-2 py-1 rounded max-w-xs truncate">
                          {value}
                        </code>
                      </>
                    ) : (
                      <Badge variant="default" size="xs">未配置</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sketch-text mb-3">配置统计</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sketch-muted">总字段数:</span>
                <span className="text-sketch-text">{Object.keys(currentRule.selectors).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sketch-muted">已配置:</span>
                <span className="text-green-600">
                  {Object.values(currentRule.selectors).filter(Boolean).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sketch-muted">未配置:</span>
                <span className="text-gray-500">
                  {Object.values(currentRule.selectors).filter(v => !v).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sketch-muted">完成度:</span>
                <span className="text-sketch-text">
                  {Math.round(
                    (Object.values(currentRule.selectors).filter(Boolean).length / 
                     Object.keys(currentRule.selectors).length) * 100
                  )}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 使用说明 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">
          使用说明
        </h3>
        
        <div className="space-y-4 text-sm text-sketch-muted">
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">1</Badge>
            <p>选择目标网站，编辑器会在左侧iframe中加载网页预览</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">2</Badge>
            <p>点击右侧配置面板中的"选择"按钮，进入元素选择模式</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">3</Badge>
            <p>在网页预览中点击目标元素，系统会自动生成CSS选择器</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">4</Badge>
            <p>点击"预览"按钮验证选择器是否正确，查看匹配的元素</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">5</Badge>
            <p>使用智能建议快速配置常见的选择器模式</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">6</Badge>
            <p>完成配置后可以导出规则文件，用于爬虫系统</p>
          </div>
        </div>
      </Card>
    </div>
  );
};