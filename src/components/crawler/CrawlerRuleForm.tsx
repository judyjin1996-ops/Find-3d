import React, { useState, useEffect } from 'react';
import { Button, Icon, Badge, Tooltip } from '../ui';
import type { CrawlerRule } from '../../crawler/types/crawler';

interface CrawlerRuleFormProps {
  initialRule?: CrawlerRule;
  onSubmit: (rule: CrawlerRule | Omit<CrawlerRule, 'id'>) => void;
  onCancel: () => void;
}

export const CrawlerRuleForm: React.FC<CrawlerRuleFormProps> = ({
  initialRule,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<CrawlerRule>>({
    websiteName: '',
    websiteIcon: '',
    baseUrl: '',
    isActive: true,
    isPreset: false,
    searchUrlTemplate: '',
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
    testKeyword: '手机',
    testStatus: 'pending'
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'selectors' | 'processing' | 'antibot'>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表单数据
  useEffect(() => {
    if (initialRule) {
      setFormData(initialRule);
    }
  }, [initialRule]);

  // 更新表单字段
  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    
    // 清除相关错误
    if (errors[path]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[path];
        return newErrors;
      });
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 基本信息验证
    if (!formData.websiteName?.trim()) {
      newErrors['websiteName'] = '网站名称不能为空';
    }
    
    if (!formData.baseUrl?.trim()) {
      newErrors['baseUrl'] = '网站URL不能为空';
    } else if (!/^https?:\/\/.+/.test(formData.baseUrl)) {
      newErrors['baseUrl'] = '请输入有效的URL';
    }
    
    if (!formData.searchUrlTemplate?.trim()) {
      newErrors['searchUrlTemplate'] = '搜索URL模板不能为空';
    } else if (!formData.searchUrlTemplate.includes('{keyword}')) {
      newErrors['searchUrlTemplate'] = 'URL模板必须包含{keyword}占位符';
    }

    // 选择器验证
    if (!formData.selectors?.resultList?.trim()) {
      newErrors['selectors.resultList'] = '结果列表选择器不能为空';
    }
    
    if (!formData.selectors?.resultLink?.trim()) {
      newErrors['selectors.resultLink'] = '详情链接选择器不能为空';
    }
    
    if (!formData.selectors?.title?.trim()) {
      newErrors['selectors.title'] = '标题选择器不能为空';
    }

    // 反爬虫配置验证
    if (formData.antiBot?.delay && formData.antiBot.delay < 100) {
      newErrors['antiBot.delay'] = '请求延迟不能少于100毫秒';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const ruleData = {
      ...formData,
      // 确保必要字段有默认值
      searchHeaders: formData.searchHeaders || {},
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
        uploadDate: '',
        ...formData.selectors
      },
      dataProcessing: {
        priceRegex: '',
        dateFormat: '',
        tagSeparator: ',',
        imageUrlPrefix: '',
        ...formData.dataProcessing
      },
      antiBot: {
        useHeadlessBrowser: false,
        waitForSelector: '',
        delay: 1000,
        userAgent: '',
        enableProxy: false,
        ...formData.antiBot
      }
    } as CrawlerRule;

    onSubmit(ruleData);
  };

  // 渲染输入字段
  const renderInput = (
    label: string,
    path: string,
    type: 'text' | 'number' | 'url' = 'text',
    placeholder?: string,
    required?: boolean
  ) => (
    <div>
      <label className="block text-sm font-medium text-sketch-text mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={getNestedValue(formData, path) || ''}
        onChange={(e) => updateField(path, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent ${
          errors[path] ? 'border-red-500' : 'border-sketch-border'
        }`}
      />
      {errors[path] && (
        <p className="text-red-500 text-xs mt-1">{errors[path]}</p>
      )}
    </div>
  );

  // 渲染文本域
  const renderTextarea = (
    label: string,
    path: string,
    placeholder?: string,
    rows: number = 3
  ) => (
    <div>
      <label className="block text-sm font-medium text-sketch-text mb-1">
        {label}
      </label>
      <textarea
        value={getNestedValue(formData, path) || ''}
        onChange={(e) => updateField(path, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent ${
          errors[path] ? 'border-red-500' : 'border-sketch-border'
        }`}
      />
      {errors[path] && (
        <p className="text-red-500 text-xs mt-1">{errors[path]}</p>
      )}
    </div>
  );

  // 渲染选择框
  const renderSelect = (
    label: string,
    path: string,
    options: Array<{ value: string; label: string }>,
    required?: boolean
  ) => (
    <div>
      <label className="block text-sm font-medium text-sketch-text mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={getNestedValue(formData, path) || ''}
        onChange={(e) => updateField(path, e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent ${
          errors[path] ? 'border-red-500' : 'border-sketch-border'
        }`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errors[path] && (
        <p className="text-red-500 text-xs mt-1">{errors[path]}</p>
      )}
    </div>
  );

  // 渲染复选框
  const renderCheckbox = (label: string, path: string, description?: string) => (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={getNestedValue(formData, path) || false}
        onChange={(e) => updateField(path, e.target.checked)}
        className="mt-1 rounded border-gray-300"
      />
      <div>
        <label className="text-sm font-medium text-sketch-text">
          {label}
        </label>
        {description && (
          <p className="text-xs text-sketch-muted mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  // 获取嵌套值的辅助函数
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const tabs = [
    { id: 'basic', label: '基本信息', icon: 'info' },
    { id: 'selectors', label: '选择器配置', icon: 'target' },
    { id: 'processing', label: '数据处理', icon: 'settings' },
    { id: 'antibot', label: '反爬虫配置', icon: 'shield' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 标签页导航 */}
      <div className="border-b border-sketch-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-sketch-accent text-sketch-accent'
                  : 'border-transparent text-sketch-muted hover:text-sketch-text'
              }`}
            >
              <Icon name={tab.icon as any} size="sm" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="min-h-96">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-sketch-text">基本信息</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {renderInput('网站名称', 'websiteName', 'text', '如：魔顿网', true)}
              {renderInput('网站图标URL', 'websiteIcon', 'url', '网站图标的URL地址')}
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {renderInput('网站URL', 'baseUrl', 'url', 'https://example.com', true)}
              {renderInput('测试关键词', 'testKeyword', 'text', '用于测试规则的关键词')}
            </div>
            
            {renderInput('搜索URL模板', 'searchUrlTemplate', 'text', 
              'https://example.com/search?q={keyword}&page={page}', true)}
            
            <div className="grid md:grid-cols-2 gap-4">
              {renderSelect('请求方法', 'searchMethod', [
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' }
              ], true)}
              
              <div>
                {renderCheckbox('启用规则', 'isActive', '是否启用此爬虫规则')}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'selectors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-sketch-text">选择器配置</h3>
              <Tooltip content="使用CSS选择器来定位页面元素">
                <Icon name="help-circle" size="sm" className="text-sketch-muted" />
              </Tooltip>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon name="info" size="sm" className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">选择器使用说明：</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>使用CSS选择器语法，如 .class、#id、tag[attr]</li>
                    <li>结果列表选择器：定位搜索结果的容器元素</li>
                    <li>详情链接选择器：在结果项中定位链接元素</li>
                    <li>其他选择器：在详情页中定位对应的数据元素</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('结果列表选择器', 'selectors.resultList', 'text', 
                  '.search-results .item', true)}
                {renderInput('详情链接选择器', 'selectors.resultLink', 'text', 
                  'a.title-link', true)}
              </div>
              
              {renderInput('标题选择器', 'selectors.title', 'text', 
                'h1.title, .post-title', true)}
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('描述选择器', 'selectors.description', 'text', 
                  '.description, .content')}
                {renderInput('预览图选择器', 'selectors.previewImages', 'text', 
                  '.preview-img, .gallery img')}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('价格选择器', 'selectors.price', 'text', 
                  '.price, .cost')}
                {renderInput('免费标识选择器', 'selectors.isFree', 'text', 
                  '.free-tag, .price:contains("免费")')}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('文件格式选择器', 'selectors.fileFormat', 'text', 
                  '.format, .file-type')}
                {renderInput('文件大小选择器', 'selectors.fileSize', 'text', 
                  '.size, .file-size')}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('下载数选择器', 'selectors.downloadCount', 'text', 
                  '.downloads, .download-count')}
                {renderInput('评分选择器', 'selectors.rating', 'text', 
                  '.rating, .stars')}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('标签选择器', 'selectors.tags', 'text', 
                  '.tags a, .tag-list .tag')}
                {renderInput('作者选择器', 'selectors.author', 'text', 
                  '.author, .uploader')}
              </div>
              
              {renderInput('上传日期选择器', 'selectors.uploadDate', 'text', 
                '.date, .upload-time')}
            </div>
          </div>
        )}

        {activeTab === 'processing' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-sketch-text">数据处理配置</h3>
            
            <div className="space-y-4">
              {renderInput('价格提取正则', 'dataProcessing.priceRegex', 'text', 
                '\\d+(\\.\\d+)?', false)}
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('日期格式', 'dataProcessing.dateFormat', 'text', 
                  'YYYY-MM-DD')}
                {renderInput('标签分隔符', 'dataProcessing.tagSeparator', 'text', 
                  ',')}
              </div>
              
              {renderInput('图片URL前缀', 'dataProcessing.imageUrlPrefix', 'text', 
                'https://example.com')}
            </div>
          </div>
        )}

        {activeTab === 'antibot' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-sketch-text">反爬虫配置</h3>
            
            <div className="space-y-4">
              {renderCheckbox('使用无头浏览器', 'antiBot.useHeadlessBrowser', 
                '使用Puppeteer等无头浏览器来处理JavaScript渲染的页面')}
              
              <div className="grid md:grid-cols-2 gap-4">
                {renderInput('等待选择器', 'antiBot.waitForSelector', 'text', 
                  '.content-loaded')}
                {renderInput('请求延迟(ms)', 'antiBot.delay', 'number', '1000')}
              </div>
              
              {renderTextarea('User-Agent', 'antiBot.userAgent', 
                '自定义User-Agent字符串，留空使用默认值')}
              
              {renderCheckbox('启用代理', 'antiBot.enableProxy', 
                '使用代理IP来避免被封禁')}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-sketch-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          取消
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          icon={<Icon name="save" size="sm" />}
        >
          {initialRule ? '更新规则' : '创建规则'}
        </Button>
      </div>
    </form>
  );
};