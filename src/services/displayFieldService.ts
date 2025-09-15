import type { DisplayField, MaterialResult } from '../types';

// 显示字段配置服务
export class DisplayFieldService {
  private static readonly STORAGE_KEY = 'find3d_display_fields';

  // 默认显示字段配置
  private static readonly DEFAULT_FIELDS: DisplayField[] = [
    { key: 'previewImage', label: '预览图', visible: true, order: 1 },
    { key: 'title', label: '标题', visible: true, order: 2 },
    { key: 'price', label: '价格', visible: true, order: 3 },
    { key: 'isFree', label: '免费状态', visible: true, order: 4 },
    { key: 'sourceWebsite', label: '来源网站', visible: true, order: 5 },
    { key: 'fileFormat', label: '文件格式', visible: true, order: 6 },
    { key: 'fileSize', label: '文件大小', visible: false, order: 7 },
    { key: 'rating', label: '评分', visible: false, order: 8 },
    { key: 'downloadCount', label: '下载量', visible: false, order: 9 },
    { key: 'uploadDate', label: '上传时间', visible: false, order: 10 },
    { key: 'author', label: '作者', visible: false, order: 11 },
    { key: 'tags', label: '标签', visible: false, order: 12 },
    { key: 'description', label: '描述', visible: false, order: 13 }
  ];

  // 获取显示字段配置
  static getDisplayFields(): DisplayField[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) {
        return [...this.DEFAULT_FIELDS];
      }
      
      const fields = JSON.parse(saved) as DisplayField[];
      
      // 确保所有默认字段都存在（向后兼容）
      const savedKeys = new Set(fields.map(f => f.key));
      const missingFields = this.DEFAULT_FIELDS.filter(f => !savedKeys.has(f.key));
      
      if (missingFields.length > 0) {
        const maxOrder = Math.max(...fields.map(f => f.order));
        missingFields.forEach((field, index) => {
          fields.push({ ...field, order: maxOrder + index + 1 });
        });
        this.saveDisplayFields(fields);
      }
      
      return fields.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.warn('Failed to load display fields:', error);
      return [...this.DEFAULT_FIELDS];
    }
  }

  // 保存显示字段配置
  static saveDisplayFields(fields: DisplayField[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fields));
    } catch (error) {
      console.warn('Failed to save display fields:', error);
    }
  }

  // 获取可见的显示字段
  static getVisibleFields(): DisplayField[] {
    return this.getDisplayFields().filter(field => field.visible);
  }

  // 更新字段可见性
  static updateFieldVisibility(key: keyof MaterialResult, visible: boolean): DisplayField[] {
    const fields = this.getDisplayFields();
    const field = fields.find(f => f.key === key);
    
    if (field) {
      field.visible = visible;
      this.saveDisplayFields(fields);
    }
    
    return fields;
  }

  // 更新字段顺序
  static updateFieldOrder(fields: DisplayField[]): DisplayField[] {
    // 重新分配顺序
    const sortedFields = fields.map((field, index) => ({
      ...field,
      order: index + 1
    }));
    
    this.saveDisplayFields(sortedFields);
    return sortedFields;
  }

  // 重置为默认配置
  static resetToDefault(): DisplayField[] {
    const defaultFields = [...this.DEFAULT_FIELDS];
    this.saveDisplayFields(defaultFields);
    return defaultFields;
  }

  // 添加自定义字段
  static addCustomField(key: string, label: string): DisplayField[] {
    const fields = this.getDisplayFields();
    const maxOrder = Math.max(...fields.map(f => f.order));
    
    // 检查是否已存在
    if (fields.some(f => f.key === key)) {
      throw new Error(`字段 "${key}" 已存在`);
    }
    
    const newField: DisplayField = {
      key: key as keyof MaterialResult,
      label,
      visible: true,
      order: maxOrder + 1
    };
    
    fields.push(newField);
    this.saveDisplayFields(fields);
    return fields;
  }

  // 删除自定义字段
  static removeCustomField(key: keyof MaterialResult): DisplayField[] {
    const fields = this.getDisplayFields();
    
    // 不允许删除默认字段
    const defaultKeys = new Set(this.DEFAULT_FIELDS.map(f => f.key));
    if (defaultKeys.has(key)) {
      throw new Error('不能删除默认字段');
    }
    
    const updatedFields = fields.filter(f => f.key !== key);
    this.saveDisplayFields(updatedFields);
    return updatedFields;
  }

  // 获取字段配置统计
  static getFieldStats() {
    const fields = this.getDisplayFields();
    const visibleCount = fields.filter(f => f.visible).length;
    const customCount = fields.length - this.DEFAULT_FIELDS.length;
    
    return {
      total: fields.length,
      visible: visibleCount,
      hidden: fields.length - visibleCount,
      custom: customCount,
      default: this.DEFAULT_FIELDS.length
    };
  }

  // 导出配置
  static exportConfig(): string {
    const fields = this.getDisplayFields();
    const config = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      fields
    };
    
    return JSON.stringify(config, null, 2);
  }

  // 导入配置
  static importConfig(jsonData: string): boolean {
    try {
      const config = JSON.parse(jsonData);
      
      if (!config.fields || !Array.isArray(config.fields)) {
        throw new Error('无效的配置格式');
      }
      
      // 验证字段格式
      const validFields = config.fields.filter((field: any) => 
        field.key && 
        field.label && 
        typeof field.visible === 'boolean' && 
        typeof field.order === 'number'
      );
      
      if (validFields.length === 0) {
        throw new Error('没有有效的字段配置');
      }
      
      this.saveDisplayFields(validFields);
      return true;
    } catch (error) {
      console.warn('Failed to import display field config:', error);
      return false;
    }
  }

  // 获取字段的显示值
  static getFieldDisplayValue(result: MaterialResult, field: DisplayField): string | number | boolean | null {
    const value = result[field.key];
    
    if (value === undefined || value === null) {
      return null;
    }
    
    // 特殊处理某些字段
    switch (field.key) {
      case 'uploadDate':
        return value instanceof Date ? value.toLocaleDateString() : String(value || '');
      case 'tags':
        return Array.isArray(value) ? value.join(', ') : String(value || '');
      case 'isFree':
        return value ? '免费' : '付费';
      case 'price':
        return typeof value === 'number' ? `¥${value}` : String(value || '');
      default:
        return String(value || '');
    }
  }

  // 验证字段键是否有效
  static isValidFieldKey(key: string): key is keyof MaterialResult {
    const sampleResult: MaterialResult = {
      id: '',
      title: '',
      previewImage: '',
      sourceWebsite: '',
      sourceUrl: '',
      isFree: false,
      tags: []
    };
    
    return key in sampleResult;
  }
}