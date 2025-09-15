import type { WebsiteConfig, ValidationResult } from '../types';
import { getDefaultWebsites } from '../utils/defaultWebsites';
import { STORAGE_KEYS } from '../types';

// 网站配置管理服务
export class WebsiteConfigService {
  private static instance: WebsiteConfigService;
  private websites: WebsiteConfig[] = [];

  private constructor() {
    this.loadWebsites();
  }

  public static getInstance(): WebsiteConfigService {
    if (!WebsiteConfigService.instance) {
      WebsiteConfigService.instance = new WebsiteConfigService();
    }
    return WebsiteConfigService.instance;
  }

  // 加载网站配置
  private loadWebsites(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEBSITE_CONFIG);
      if (saved) {
        this.websites = JSON.parse(saved);
      } else {
        // 首次使用，加载默认配置
        this.websites = getDefaultWebsites();
        this.saveWebsites();
      }
    } catch (error) {
      console.error('加载网站配置失败:', error);
      this.websites = getDefaultWebsites();
    }
  }

  // 保存网站配置
  private saveWebsites(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WEBSITE_CONFIG, JSON.stringify(this.websites));
    } catch (error) {
      console.error('保存网站配置失败:', error);
    }
  }

  // 获取所有网站配置
  public getAllWebsites(): WebsiteConfig[] {
    return [...this.websites];
  }

  // 获取激活的网站配置
  public getActiveWebsites(): WebsiteConfig[] {
    return this.websites.filter(website => website.isActive);
  }

  // 根据ID获取网站配置
  public getWebsiteById(id: string): WebsiteConfig | undefined {
    return this.websites.find(website => website.id === id);
  }

  // 添加网站配置
  public addWebsite(websiteData: Omit<WebsiteConfig, 'id'>): WebsiteConfig {
    const newWebsite: WebsiteConfig = {
      ...websiteData,
      id: `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // 验证配置
    const validation = this.validateWebsiteConfig(newWebsite);
    if (!validation.isValid) {
      throw new Error(`网站配置无效: ${validation.errors.join(', ')}`);
    }

    this.websites.push(newWebsite);
    this.saveWebsites();
    return newWebsite;
  }

  // 更新网站配置
  public updateWebsite(id: string, websiteData: WebsiteConfig): WebsiteConfig {
    const index = this.websites.findIndex(website => website.id === id);
    if (index === -1) {
      throw new Error('网站配置不存在');
    }

    // 验证配置
    const validation = this.validateWebsiteConfig(websiteData);
    if (!validation.isValid) {
      throw new Error(`网站配置无效: ${validation.errors.join(', ')}`);
    }

    this.websites[index] = { ...websiteData, id };
    this.saveWebsites();
    return this.websites[index];
  }

  // 删除网站配置
  public deleteWebsite(id: string): boolean {
    const index = this.websites.findIndex(website => website.id === id);
    if (index === -1) {
      return false;
    }

    this.websites.splice(index, 1);
    this.saveWebsites();
    return true;
  }

  // 切换网站激活状态
  public toggleWebsiteActive(id: string): boolean {
    const website = this.websites.find(w => w.id === id);
    if (!website) {
      return false;
    }

    website.isActive = !website.isActive;
    this.saveWebsites();
    return true;
  }

  // 验证网站配置
  public validateWebsiteConfig(config: WebsiteConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段验证
    if (!config.name?.trim()) {
      errors.push('网站名称不能为空');
    }

    if (!config.baseUrl?.trim()) {
      errors.push('网站地址不能为空');
    } else {
      try {
        new URL(config.baseUrl);
      } catch {
        errors.push('网站地址格式无效');
      }
    }

    if (!config.searchEndpoint?.trim()) {
      errors.push('搜索端点不能为空');
    }

    if (!config.searchParams?.queryParam?.trim()) {
      errors.push('查询参数名不能为空');
    }

    if (!config.resultMapping?.titlePath?.trim()) {
      errors.push('标题字段路径不能为空');
    }

    if (!config.resultMapping?.imagePath?.trim()) {
      errors.push('图片字段路径不能为空');
    }

    if (!config.resultMapping?.urlPath?.trim()) {
      errors.push('链接字段路径不能为空');
    }

    // 速率限制验证
    if (!config.rateLimit?.requestsPerMinute || config.rateLimit.requestsPerMinute <= 0) {
      errors.push('每分钟请求数必须大于0');
    }

    if (!config.rateLimit?.concurrent || config.rateLimit.concurrent <= 0) {
      errors.push('并发请求数必须大于0');
    }

    // 警告检查
    if (config.rateLimit?.requestsPerMinute > 300) {
      warnings.push('每分钟请求数过高，可能导致被网站限制');
    }

    if (config.rateLimit?.concurrent > 10) {
      warnings.push('并发请求数过高，可能影响网站性能');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // 测试网站连接
  public async testWebsiteConnection(config: WebsiteConfig): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const testUrl = new URL(config.searchEndpoint, config.baseUrl);
      testUrl.searchParams.set(config.searchParams.queryParam, 'test');
      
      const response = await fetch(testUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Find3D-Search-Bot/1.0',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: '连接成功',
          responseTime
        };
      } else {
        return {
          success: false,
          message: `HTTP错误: ${response.status} ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: '连接超时',
            responseTime
          };
        }
        return {
          success: false,
          message: `连接失败: ${error.message}`,
          responseTime
        };
      }
      
      return {
        success: false,
        message: '未知错误',
        responseTime
      };
    }
  }

  // 重置为默认配置
  public resetToDefaults(): void {
    this.websites = getDefaultWebsites();
    this.saveWebsites();
  }

  // 导出配置
  public exportConfig(): string {
    return JSON.stringify(this.websites, null, 2);
  }

  // 导入配置
  public importConfig(configJson: string): ValidationResult {
    try {
      const importedWebsites = JSON.parse(configJson);
      
      if (!Array.isArray(importedWebsites)) {
        return {
          isValid: false,
          errors: ['配置格式无效：必须是网站配置数组']
        };
      }

      const errors: string[] = [];
      
      // 验证每个网站配置
      importedWebsites.forEach((website, index) => {
        const validation = this.validateWebsiteConfig(website);
        if (!validation.isValid) {
          errors.push(`网站 ${index + 1}: ${validation.errors.join(', ')}`);
        }
      });

      if (errors.length > 0) {
        return {
          isValid: false,
          errors
        };
      }

      // 导入成功
      this.websites = importedWebsites;
      this.saveWebsites();
      
      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['配置文件格式错误：无法解析JSON']
      };
    }
  }
}

// 导出单例实例
export const websiteConfigService = WebsiteConfigService.getInstance();