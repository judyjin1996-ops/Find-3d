import React, { useState } from 'react';
import { Button, Icon, Badge } from '../ui';
import type { CrawlerRule } from '../../crawler/types/crawler';

interface CrawlerTaskFormProps {
  rules: CrawlerRule[];
  onSubmit: (taskData: {
    query: string;
    websites: string[];
    priority?: number;
    maxResults?: number;
    timeout?: number;
    retryAttempts?: number;
  }) => void;
  onCancel: () => void;
}

export const CrawlerTaskForm: React.FC<CrawlerTaskFormProps> = ({
  rules,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    query: '',
    websites: [] as string[],
    priority: 1,
    maxResults: 50,
    timeout: 300, // 5分钟
    retryAttempts: 3
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 活跃的规则
  const activeRules = rules.filter(rule => rule.isActive);

  // 更新表单字段
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 切换网站选择
  const toggleWebsite = (websiteId: string) => {
    setFormData(prev => ({
      ...prev,
      websites: prev.websites.includes(websiteId)
        ? prev.websites.filter(id => id !== websiteId)
        : [...prev.websites, websiteId]
    }));
  };

  // 全选/取消全选网站
  const toggleAllWebsites = () => {
    if (formData.websites.length === activeRules.length) {
      setFormData(prev => ({ ...prev, websites: [] }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        websites: activeRules.map(rule => rule.id) 
      }));
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.query.trim()) {
      newErrors.query = '搜索关键词不能为空';
    } else if (formData.query.trim().length < 2) {
      newErrors.query = '搜索关键词至少需要2个字符';
    }

    if (formData.websites.length === 0) {
      newErrors.websites = '至少选择一个网站';
    }

    if (formData.maxResults < 1 || formData.maxResults > 1000) {
      newErrors.maxResults = '最大结果数应在1-1000之间';
    }

    if (formData.timeout < 30 || formData.timeout > 3600) {
      newErrors.timeout = '超时时间应在30-3600秒之间';
    }

    if (formData.retryAttempts < 0 || formData.retryAttempts > 10) {
      newErrors.retryAttempts = '重试次数应在0-10之间';
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

    onSubmit(formData);
  };

  // 预设查询建议
  const queryPresets = [
    '手机模型', '汽车模型', '建筑模型', '家具模型', '人物模型',
    '动物模型', '植物模型', '武器模型', '食物模型', '电子产品'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h4 className="font-medium text-sketch-text">基本信息</h4>
        
        {/* 搜索关键词 */}
        <div>
          <label className="block text-sm font-medium text-sketch-text mb-1">
            搜索关键词 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.query}
            onChange={(e) => updateField('query', e.target.value)}
            placeholder="输入要搜索的关键词"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent ${
              errors.query ? 'border-red-500' : 'border-sketch-border'
            }`}
          />
          {errors.query && (
            <p className="text-red-500 text-xs mt-1">{errors.query}</p>
          )}
          
          {/* 预设关键词建议 */}
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-sketch-muted">建议:</span>
            {queryPresets.slice(0, 5).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateField('query', preset)}
                className="text-xs bg-sketch-background hover:bg-sketch-border px-2 py-1 rounded"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 优先级 */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-sketch-text mb-1">
              优先级
            </label>
            <select
              value={formData.priority}
              onChange={(e) => updateField('priority', Number(e.target.value))}
              className="w-full px-3 py-2 border border-sketch-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent"
            >
              <option value={1}>低</option>
              <option value={2}>中</option>
              <option value={3}>高</option>
              <option value={4}>紧急</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sketch-text mb-1">
              最大结果数
            </label>
            <input
              type="number"
              value={formData.maxResults}
              onChange={(e) => updateField('maxResults', Number(e.target.value))}
              min="1"
              max="1000"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent ${
                errors.maxResults ? 'border-red-500' : 'border-sketch-border'
              }`}
            />
            {errors.maxResults && (
              <p className="text-red-500 text-xs mt-1">{errors.maxResults}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sketch-text mb-1">
              超时时间(秒)
            </label>
            <input
              type="number"
              value={formData.timeout}
              onChange={(e) => updateField('timeout', Number(e.target.value))}
              min="30"
              max="3600"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent ${
                errors.timeout ? 'border-red-500' : 'border-sketch-border'
              }`}
            />
            {errors.timeout && (
              <p className="text-red-500 text-xs mt-1">{errors.timeout}</p>
            )}
          </div>
        </div>
      </div>

      {/* 网站选择 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sketch-text">
            目标网站 <span className="text-red-500">*</span>
          </h4>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-sketch-muted">
              已选择 {formData.websites.length} / {activeRules.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAllWebsites}
            >
              {formData.websites.length === activeRules.length ? '取消全选' : '全选'}
            </Button>
          </div>
        </div>
        
        {errors.websites && (
          <p className="text-red-500 text-xs">{errors.websites}</p>
        )}
        
        <div className="grid md:grid-cols-2 gap-3">
          {activeRules.map((rule) => {
            const isSelected = formData.websites.includes(rule.id);
            
            return (
              <div
                key={rule.id}
                onClick={() => toggleWebsite(rule.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-sketch-accent bg-blue-50' 
                    : 'border-sketch-border hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // 由父div的onClick处理
                    className="rounded border-gray-300"
                  />
                  
                  <div className="flex items-center gap-2 flex-1">
                    {rule.websiteIcon ? (
                      <img
                        src={rule.websiteIcon}
                        alt={rule.websiteName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-sketch-background rounded-full flex items-center justify-center">
                        <Icon name="globe" size="xs" className="text-sketch-muted" />
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sketch-text">
                          {rule.websiteName}
                        </span>
                        {rule.isPreset && (
                          <Badge variant="info" size="xs">预设</Badge>
                        )}
                      </div>
                      <p className="text-xs text-sketch-muted truncate">
                        {rule.baseUrl}
                      </p>
                    </div>
                  </div>
                  
                  {/* 规则状态 */}
                  <div className="text-right">
                    <Badge 
                      variant={rule.testStatus === 'success' ? 'success' : 
                               rule.testStatus === 'failed' ? 'error' : 'default'} 
                      size="xs"
                    >
                      {rule.testStatus === 'success' ? '测试通过' :
                       rule.testStatus === 'failed' ? '测试失败' : '未测试'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {activeRules.length === 0 && (
          <div className="text-center py-8 text-sketch-muted">
            <Icon name="alert-circle" size="lg" className="mx-auto mb-2" />
            <p>没有可用的活跃规则</p>
            <p className="text-xs">请先在规则管理中启用一些规则</p>
          </div>
        )}
      </div>

      {/* 高级选项 */}
      <div className="space-y-4">
        <h4 className="font-medium text-sketch-text">高级选项</h4>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sketch-text mb-1">
              重试次数
            </label>
            <input
              type="number"
              value={formData.retryAttempts}
              onChange={(e) => updateField('retryAttempts', Number(e.target.value))}
              min="0"
              max="10"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent ${
                errors.retryAttempts ? 'border-red-500' : 'border-sketch-border'
              }`}
            />
            {errors.retryAttempts && (
              <p className="text-red-500 text-xs mt-1">{errors.retryAttempts}</p>
            )}
          </div>
        </div>
      </div>

      {/* 任务预览 */}
      <div className="bg-sketch-background rounded-lg p-4">
        <h4 className="font-medium text-sketch-text mb-3">任务预览</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-sketch-muted">搜索关键词:</span>
            <span className="text-sketch-text">
              {formData.query || '未设置'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sketch-muted">目标网站:</span>
            <span className="text-sketch-text">
              {formData.websites.length > 0 
                ? `${formData.websites.length} 个网站`
                : '未选择'
              }
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sketch-muted">优先级:</span>
            <Badge 
              variant={
                formData.priority === 4 ? 'error' :
                formData.priority === 3 ? 'warning' :
                formData.priority === 2 ? 'info' : 'default'
              } 
              size="sm"
            >
              {formData.priority === 4 ? '紧急' :
               formData.priority === 3 ? '高' :
               formData.priority === 2 ? '中' : '低'}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sketch-muted">最大结果:</span>
            <span className="text-sketch-text">
              {formData.maxResults} 个
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sketch-muted">超时时间:</span>
            <span className="text-sketch-text">
              {Math.floor(formData.timeout / 60)}分{formData.timeout % 60}秒
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sketch-muted">重试次数:</span>
            <span className="text-sketch-text">
              {formData.retryAttempts} 次
            </span>
          </div>
        </div>
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
          icon={<Icon name="play" size="sm" />}
          disabled={!formData.query.trim() || formData.websites.length === 0}
        >
          创建任务
        </Button>
      </div>
    </form>
  );
};