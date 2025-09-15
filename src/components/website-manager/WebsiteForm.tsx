import React from 'react';
import { Input, Button, Card } from '../ui';
import type { WebsiteConfig } from '../../types';
import { validateUrl } from '../../types/utils';

interface WebsiteFormProps {
  initialData?: WebsiteConfig;
  onSubmit: (data: WebsiteConfig) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  baseUrl: string;
  searchEndpoint: string;
  apiKey: string;
  isActive: boolean;
  queryParam: string;
  limitParam: string;
  formatParam: string;
  titlePath: string;
  imagePath: string;
  urlPath: string;
  pricePath: string;
  freePath: string;
  requestsPerMinute: string;
  concurrent: string;
}

interface FormErrors {
  [key: string]: string;
}

export const WebsiteForm: React.FC<WebsiteFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = React.useState<FormData>({
    name: initialData?.name || '',
    baseUrl: initialData?.baseUrl || '',
    searchEndpoint: initialData?.searchEndpoint || '/search',
    apiKey: initialData?.apiKey || '',
    isActive: initialData?.isActive ?? true,
    queryParam: initialData?.searchParams.queryParam || 'q',
    limitParam: initialData?.searchParams.limitParam || '',
    formatParam: initialData?.searchParams.formatParam || '',
    titlePath: initialData?.resultMapping.titlePath || 'title',
    imagePath: initialData?.resultMapping.imagePath || 'image',
    urlPath: initialData?.resultMapping.urlPath || 'url',
    pricePath: initialData?.resultMapping.pricePath || '',
    freePath: initialData?.resultMapping.freePath || '',
    requestsPerMinute: initialData?.rateLimit.requestsPerMinute.toString() || '60',
    concurrent: initialData?.rateLimit.concurrent.toString() || '3'
  });

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 必填字段验证
    if (!formData.name.trim()) {
      newErrors.name = '网站名称不能为空';
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = '网站地址不能为空';
    } else if (!validateUrl(formData.baseUrl)) {
      newErrors.baseUrl = '请输入有效的网站地址';
    }

    if (!formData.searchEndpoint.trim()) {
      newErrors.searchEndpoint = '搜索端点不能为空';
    }

    if (!formData.queryParam.trim()) {
      newErrors.queryParam = '查询参数名不能为空';
    }

    if (!formData.titlePath.trim()) {
      newErrors.titlePath = '标题字段路径不能为空';
    }

    if (!formData.imagePath.trim()) {
      newErrors.imagePath = '图片字段路径不能为空';
    }

    if (!formData.urlPath.trim()) {
      newErrors.urlPath = '链接字段路径不能为空';
    }

    // 数字字段验证
    const requestsPerMinute = parseInt(formData.requestsPerMinute);
    if (isNaN(requestsPerMinute) || requestsPerMinute <= 0) {
      newErrors.requestsPerMinute = '请输入有效的请求限制数';
    }

    const concurrent = parseInt(formData.concurrent);
    if (isNaN(concurrent) || concurrent <= 0) {
      newErrors.concurrent = '请输入有效的并发数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const websiteConfig: WebsiteConfig = {
        id: initialData?.id || `website_${Date.now()}`,
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        searchEndpoint: formData.searchEndpoint.trim(),
        apiKey: formData.apiKey.trim() || undefined,
        isActive: formData.isActive,
        searchParams: {
          queryParam: formData.queryParam.trim(),
          limitParam: formData.limitParam.trim() || undefined,
          formatParam: formData.formatParam.trim() || undefined
        },
        resultMapping: {
          titlePath: formData.titlePath.trim(),
          imagePath: formData.imagePath.trim(),
          urlPath: formData.urlPath.trim(),
          pricePath: formData.pricePath.trim() || undefined,
          freePath: formData.freePath.trim() || undefined
        },
        rateLimit: {
          requestsPerMinute: parseInt(formData.requestsPerMinute),
          concurrent: parseInt(formData.concurrent)
        }
      };

      onSubmit(websiteConfig);
    } catch (error) {
      console.error('提交表单时出错:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <Card variant="outlined" padding="md">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="网站名称 *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="例如：魔顿网"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="网站地址 *"
            value={formData.baseUrl}
            onChange={(e) => handleChange('baseUrl', e.target.value)}
            error={errors.baseUrl}
            placeholder="https://example.com"
          />
          
          <Input
            label="搜索端点 *"
            value={formData.searchEndpoint}
            onChange={(e) => handleChange('searchEndpoint', e.target.value)}
            error={errors.searchEndpoint}
            placeholder="/search"
          />
        </div>

        <Input
          label="API密钥"
          value={formData.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="可选，如果网站需要API密钥"
          helperText="某些网站可能需要API密钥才能访问搜索功能"
        />
      </Card>

      {/* 搜索参数配置 */}
      <Card variant="outlined" padding="md">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">搜索参数配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="查询参数名 *"
            value={formData.queryParam}
            onChange={(e) => handleChange('queryParam', e.target.value)}
            error={errors.queryParam}
            placeholder="q"
            helperText="搜索关键词的参数名"
          />
          
          <Input
            label="限制参数名"
            value={formData.limitParam}
            onChange={(e) => handleChange('limitParam', e.target.value)}
            placeholder="limit"
            helperText="结果数量限制参数名"
          />
          
          <Input
            label="格式参数名"
            value={formData.formatParam}
            onChange={(e) => handleChange('formatParam', e.target.value)}
            placeholder="format"
            helperText="返回格式参数名"
          />
        </div>
      </Card>

      {/* 结果映射配置 */}
      <Card variant="outlined" padding="md">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">结果字段映射</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="标题字段路径 *"
            value={formData.titlePath}
            onChange={(e) => handleChange('titlePath', e.target.value)}
            error={errors.titlePath}
            placeholder="title"
            helperText="结果中标题字段的路径"
          />
          
          <Input
            label="图片字段路径 *"
            value={formData.imagePath}
            onChange={(e) => handleChange('imagePath', e.target.value)}
            error={errors.imagePath}
            placeholder="image"
            helperText="结果中预览图字段的路径"
          />
          
          <Input
            label="链接字段路径 *"
            value={formData.urlPath}
            onChange={(e) => handleChange('urlPath', e.target.value)}
            error={errors.urlPath}
            placeholder="url"
            helperText="结果中详情链接字段的路径"
          />
          
          <Input
            label="价格字段路径"
            value={formData.pricePath}
            onChange={(e) => handleChange('pricePath', e.target.value)}
            placeholder="price"
            helperText="结果中价格字段的路径"
          />
          
          <Input
            label="免费标识字段路径"
            value={formData.freePath}
            onChange={(e) => handleChange('freePath', e.target.value)}
            placeholder="is_free"
            helperText="结果中免费标识字段的路径"
          />
        </div>
      </Card>

      {/* 速率限制配置 */}
      <Card variant="outlined" padding="md">
        <h3 className="text-lg font-semibold text-sketch-text mb-4">速率限制</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="每分钟请求数 *"
            type="number"
            value={formData.requestsPerMinute}
            onChange={(e) => handleChange('requestsPerMinute', e.target.value)}
            error={errors.requestsPerMinute}
            placeholder="60"
            helperText="每分钟最大请求次数"
          />
          
          <Input
            label="并发请求数 *"
            type="number"
            value={formData.concurrent}
            onChange={(e) => handleChange('concurrent', e.target.value)}
            error={errors.concurrent}
            placeholder="3"
            helperText="同时进行的最大请求数"
          />
        </div>
      </Card>

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
  );
};