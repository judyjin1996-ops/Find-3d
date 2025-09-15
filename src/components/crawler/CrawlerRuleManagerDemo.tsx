import React, { useState } from 'react';
import { CrawlerRuleManager } from './CrawlerRuleManager';
import { Card, Button, Icon, Badge } from '../ui';
import type { CrawlerRule, TestResult } from '../../crawler/types/crawler';

// 模拟的预设规则数据
const createMockRules = (): CrawlerRule[] => [
  {
    id: 'modown-rule',
    websiteName: '魔顿网',
    websiteIcon: 'https://www.modown.cn/favicon.ico',
    baseUrl: 'https://www.modown.cn',
    isActive: true,
    isPreset: true,
    searchUrlTemplate: 'https://www.modown.cn/?s={keyword}&post_type=post',
    searchMethod: 'GET',
    searchHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
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
    },
    dataProcessing: {
      priceRegex: '\\d+(\\.\\d+)?',
      dateFormat: 'YYYY-MM-DD',
      tagSeparator: ',',
      imageUrlPrefix: 'https://www.modown.cn'
    },
    antiBot: {
      useHeadlessBrowser: false,
      waitForSelector: '.entry-content',
      delay: 1000,
      userAgent: '',
      enableProxy: false
    },
    testKeyword: '手机模型',
    lastTested: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
    testStatus: 'success'
  },
  {
    id: 'cgown-rule',
    websiteName: 'CG资源网',
    websiteIcon: 'https://www.cgown.com/favicon.ico',
    baseUrl: 'https://www.cgown.com',
    isActive: true,
    isPreset: true,
    searchUrlTemplate: 'https://www.cgown.com/search?q={keyword}&page={page}',
    searchMethod: 'GET',
    searchHeaders: {},
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
    },
    dataProcessing: {
      priceRegex: '\\d+',
      dateFormat: 'YYYY/MM/DD',
      tagSeparator: ' ',
      imageUrlPrefix: 'https://www.cgown.com'
    },
    antiBot: {
      useHeadlessBrowser: true,
      waitForSelector: '.resource-list',
      delay: 1500,
      userAgent: 'Mozilla/5.0 (compatible; Find3D-Bot/1.0)',
      enableProxy: false
    },
    testKeyword: '建筑模型',
    lastTested: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
    testStatus: 'failed'
  },
  {
    id: 'c4dsky-rule',
    websiteName: '书生CG资源站',
    websiteIcon: 'https://c4dsky.com/favicon.ico',
    baseUrl: 'https://c4dsky.com',
    isActive: false,
    isPreset: true,
    searchUrlTemplate: 'https://c4dsky.com/search/{keyword}',
    searchMethod: 'GET',
    searchHeaders: {},
    selectors: {
      resultList: '.post-list .post-item',
      resultLink: '.post-title a',
      title: 'h1.post-title',
      description: '.post-excerpt',
      previewImages: '.post-thumbnail img',
      price: '.price-display',
      isFree: '.free-download',
      fileFormat: '.file-type',
      fileSize: '.file-size',
      downloadCount: '.download-count',
      rating: '.post-rating',
      tags: '.post-tags a',
      author: '.post-author',
      uploadDate: '.post-date'
    },
    dataProcessing: {
      priceRegex: '\\d+(\\.\\d+)?',
      dateFormat: 'MM/DD/YYYY',
      tagSeparator: ',',
      imageUrlPrefix: 'https://c4dsky.com'
    },
    antiBot: {
      useHeadlessBrowser: false,
      waitForSelector: '.post-content',
      delay: 800,
      userAgent: '',
      enableProxy: false
    },
    testKeyword: '汽车模型',
    testStatus: 'pending'
  },
  {
    id: 'custom-rule-1',
    websiteName: '自定义网站示例',
    websiteIcon: '',
    baseUrl: 'https://example.com',
    isActive: true,
    isPreset: false,
    searchUrlTemplate: 'https://example.com/search?q={keyword}',
    searchMethod: 'GET',
    searchHeaders: {},
    selectors: {
      resultList: '.results .item',
      resultLink: 'a.link',
      title: 'h2.title',
      description: '.desc',
      previewImages: '.thumb img',
      price: '.price',
      isFree: '.free',
      fileFormat: '.format',
      fileSize: '.size',
      downloadCount: '.downloads',
      rating: '.rating',
      tags: '.tags span',
      author: '.author',
      uploadDate: '.date'
    },
    dataProcessing: {
      priceRegex: '\\d+',
      dateFormat: 'YYYY-MM-DD',
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
    testKeyword: '测试',
    lastTested: new Date(Date.now() - 10 * 60 * 1000), // 10分钟前
    testStatus: 'success'
  }
];

export const CrawlerRuleManagerDemo: React.FC = () => {
  const [rules, setRules] = useState<CrawlerRule[]>(createMockRules());

  // 处理添加规则
  const handleAddRule = (rule: CrawlerRule) => {
    setRules(prev => [...prev, rule]);
  };

  // 处理编辑规则
  const handleEditRule = (id: string, updatedRule: CrawlerRule) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? updatedRule : rule
    ));
  };

  // 处理删除规则
  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  };

  // 处理切换规则状态
  const handleToggleActive = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  // 模拟测试规则
  const handleTestRule = async (id: string, keyword: string): Promise<TestResult> => {
    // 模拟测试延迟
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const rule = rules.find(r => r.id === id);
    if (!rule) {
      throw new Error('规则不存在');
    }

    // 模拟测试结果
    const success = Math.random() > 0.3; // 70% 成功率
    
    if (success) {
      const mockResults = Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
        id: `result-${i}`,
        title: `${keyword}相关素材 ${i + 1}`,
        description: `这是一个关于${keyword}的3D素材资源`,
        sourceWebsite: rule.websiteName,
        sourceUrl: `${rule.baseUrl}/item/${i + 1}`,
        previewImages: [{
          url: `${rule.baseUrl}/preview/${i + 1}.jpg`,
          alt: `${keyword}预览图`,
          size: 'medium' as const
        }],
        pricing: {
          isFree: Math.random() > 0.5,
          price: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 10 : undefined,
          currency: '¥'
        },
        fileInfo: {
          format: ['C4D', 'MAX', 'FBX', 'OBJ'][Math.floor(Math.random() * 4)],
          size: `${Math.floor(Math.random() * 50) + 5}MB`
        },
        statistics: {
          downloadCount: Math.floor(Math.random() * 1000) + 100,
          rating: Math.floor(Math.random() * 5) + 1
        },
        categorization: {
          tags: [keyword, '3D模型', '高质量'],
          category: '电子产品'
        },
        author: {
          name: `设计师${Math.floor(Math.random() * 100) + 1}`
        },
        timestamps: {
          uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          extractedAt: new Date()
        },
        extraction: {
          ruleId: id,
          status: 'success' as const,
          confidence: 0.9 + Math.random() * 0.1,
          missingFields: [],
          processingTime: Math.floor(Math.random() * 1000) + 500
        },
        quality: {
          score: Math.floor(Math.random() * 30) + 70,
          factors: {
            completeness: 90,
            imageQuality: 85,
            dataAccuracy: 88
          }
        }
      }));

      return {
        success: true,
        results: mockResults,
        errors: [],
        performance: {
          totalTime: Math.floor(Math.random() * 2000) + 1000,
          networkTime: Math.floor(Math.random() * 800) + 200,
          parseTime: Math.floor(Math.random() * 500) + 100
        }
      };
    } else {
      const errors = [
        '网络连接超时',
        '页面结构发生变化，选择器失效',
        '被网站反爬虫机制阻止',
        '解析数据时发生错误'
      ];
      
      return {
        success: false,
        results: [],
        errors: [errors[Math.floor(Math.random() * errors.length)]],
        performance: {
          totalTime: Math.floor(Math.random() * 1000) + 500,
          networkTime: Math.floor(Math.random() * 400) + 100,
          parseTime: 0
        }
      };
    }
  };

  // 处理导入规则
  const handleImportRules = (configFile: File) => {
    // 在实际应用中，这里会解析文件并添加规则
    console.log('导入规则文件:', configFile.name);
    
    // 模拟导入成功
    alert(`成功导入规则文件: ${configFile.name}`);
  };

  // 处理导出规则
  const handleExportRules = (ruleIds: string[]) => {
    const rulesToExport = rules.filter(rule => ruleIds.includes(rule.id));
    
    const blob = new Blob([JSON.stringify(rulesToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawler-rules-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 p-6">
      {/* 标题和说明 */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-sketch-text">
          爬虫规则配置管理系统演示
        </h1>
        <p className="text-sketch-muted max-w-2xl mx-auto">
          展示爬虫规则的增删改查功能、规则测试验证、批量操作和导入导出功能。
          支持预设规则和自定义规则的管理。
        </p>
      </div>

      {/* 功能特性说明 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">
          系统功能特性
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="settings" size="lg" className="text-blue-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">规则管理</h4>
            <p className="text-sm text-sketch-muted">
              完整的CRUD操作，支持预设和自定义规则
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="play" size="lg" className="text-green-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">规则测试</h4>
            <p className="text-sm text-sketch-muted">
              实时测试规则有效性，查看提取结果
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="upload" size="lg" className="text-purple-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">导入导出</h4>
            <p className="text-sm text-sketch-muted">
              支持JSON格式的规则配置导入导出
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="layers" size="lg" className="text-orange-600" />
            </div>
            <h4 className="font-medium text-sketch-text mb-2">批量操作</h4>
            <p className="text-sm text-sketch-muted">
              支持批量启用、禁用、删除和导出
            </p>
          </div>
        </div>
      </Card>

      {/* 爬虫规则管理器 */}
      <CrawlerRuleManager
        rules={rules}
        onAdd={handleAddRule}
        onEdit={handleEditRule}
        onDelete={handleDeleteRule}
        onToggleActive={handleToggleActive}
        onTest={handleTestRule}
        onImport={handleImportRules}
        onExport={handleExportRules}
      />

      {/* 技术说明 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">
          技术实现说明
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium text-sketch-text">规则配置</h4>
            <p className="text-sm text-sketch-muted">
              使用CSS选择器定位页面元素，支持复杂的数据提取逻辑和反爬虫配置。
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sketch-text">实时测试</h4>
            <p className="text-sm text-sketch-muted">
              提供规则测试功能，实时验证选择器有效性和数据提取准确性。
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sketch-text">配置管理</h4>
            <p className="text-sm text-sketch-muted">
              支持规则的导入导出，便于备份、分享和批量管理规则配置。
            </p>
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
            <p>点击"添加规则"创建新的爬虫规则，填写网站信息和选择器配置</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">2</Badge>
            <p>使用"测试规则"功能验证配置是否正确，查看提取结果</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">3</Badge>
            <p>通过搜索和过滤功能快速找到需要的规则</p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="info" size="sm">4</Badge>
            <p>使用批量操作功能管理多个规则，支持导入导出配置</p>
          </div>
        </div>
      </Card>
    </div>
  );
};