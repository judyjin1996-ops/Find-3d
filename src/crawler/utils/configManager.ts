/**
 * 爬虫配置管理工具
 * 负责管理爬虫规则的存储、加载和验证
 */

import type { CrawlerRule } from '../types/crawler';

export class ConfigManager {
  private static readonly STORAGE_KEY = 'crawler_config';
  private static readonly RULES_KEY = 'crawler_custom_rules';
  private static readonly SETTINGS_KEY = 'crawler_settings';

  /**
   * 保存爬虫配置
   */
  static saveConfig(config: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('保存爬虫配置失败:', error);
      throw new Error('配置保存失败');
    }
  }

  /**
   * 加载爬虫配置
   */
  static loadConfig(): any {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('加载爬虫配置失败:', error);
      return {};
    }
  }

  /**
   * 保存自定义规则
   */
  static saveCustomRules(rules: CrawlerRule[]): void {
    try {
      localStorage.setItem(this.RULES_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('保存自定义规则失败:', error);
      throw new Error('规则保存失败');
    }
  }

  /**
   * 加载自定义规则
   */
  static loadCustomRules(): CrawlerRule[] {
    try {
      const stored = localStorage.getItem(this.RULES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('加载自定义规则失败:', error);
      return [];
    }
  }

  /**
   * 保存爬虫设置
   */
  static saveSettings(settings: CrawlerSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('保存爬虫设置失败:', error);
      throw new Error('设置保存失败');
    }
  }

  /**
   * 加载爬虫设置
   */
  static loadSettings(): CrawlerSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      const defaultSettings = this.getDefaultSettings();
      
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
      
      return defaultSettings;
    } catch (error) {
      console.error('加载爬虫设置失败:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 获取默认设置
   */
  static getDefaultSettings(): CrawlerSettings {
    return {
      maxConcurrentTasks: 3,
      defaultTimeout: 30000,
      defaultDelay: 2000,
      enableCache: true,
      cacheExpiry: 24 * 60 * 60 * 1000, // 24小时
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      enableProxy: false,
      proxyList: [],
      userAgentRotation: true,
      enableJavaScript: true,
      enableImages: false,
      maxRetries: 3,
      logLevel: 'info'
    };
  }

  /**
   * 重置所有配置
   */
  static resetAllConfig(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.RULES_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
      console.log('✅ 所有爬虫配置已重置');
    } catch (error) {
      console.error('重置配置失败:', error);
      throw new Error('配置重置失败');
    }
  }

  /**
   * 导出所有配置
   */
  static exportAllConfig(): string {
    const config = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      config: this.loadConfig(),
      customRules: this.loadCustomRules(),
      settings: this.loadSettings()
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 导入所有配置
   */
  static importAllConfig(configData: string, overwrite = false): {
    success: boolean;
    imported: string[];
    errors: string[];
  } {
    const imported: string[] = [];
    const errors: string[] = [];

    try {
      const data = JSON.parse(configData);

      // 导入基础配置
      if (data.config) {
        if (overwrite || Object.keys(this.loadConfig()).length === 0) {
          this.saveConfig(data.config);
          imported.push('基础配置');
        }
      }

      // 导入自定义规则
      if (data.customRules && Array.isArray(data.customRules)) {
        const existingRules = this.loadCustomRules();
        const newRules = overwrite ? data.customRules : [
          ...existingRules,
          ...data.customRules.filter((newRule: CrawlerRule) => 
            !existingRules.some(existing => existing.id === newRule.id)
          )
        ];
        
        this.saveCustomRules(newRules);
        imported.push('自定义规则');
      }

      // 导入设置
      if (data.settings) {
        if (overwrite) {
          this.saveSettings(data.settings);
        } else {
          const existingSettings = this.loadSettings();
          this.saveSettings({ ...existingSettings, ...data.settings });
        }
        imported.push('爬虫设置');
      }

      return {
        success: true,
        imported,
        errors
      };
    } catch (error) {
      errors.push(`导入失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        imported,
        errors
      };
    }
  }

  /**
   * 获取存储使用情况
   */
  static getStorageUsage(): {
    total: number;
    config: number;
    rules: number;
    settings: number;
    available: number;
  } {
    const getSize = (key: string): number => {
      const item = localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    };

    const configSize = getSize(this.STORAGE_KEY);
    const rulesSize = getSize(this.RULES_KEY);
    const settingsSize = getSize(this.SETTINGS_KEY);
    const total = configSize + rulesSize + settingsSize;

    // 估算可用空间（localStorage通常限制为5-10MB）
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const available = Math.max(0, estimatedLimit - total);

    return {
      total,
      config: configSize,
      rules: rulesSize,
      settings: settingsSize,
      available
    };
  }

  /**
   * 清理过期缓存
   */
  static cleanupExpiredCache(): void {
    const settings = this.loadSettings();
    const now = Date.now();
    
    try {
      // 遍历localStorage中的缓存项
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('crawler_cache_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const cacheData = JSON.parse(item);
              if (cacheData.timestamp && (now - cacheData.timestamp) > settings.cacheExpiry) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // 如果解析失败，也删除这个项
            keysToRemove.push(key);
          }
        }
      }

      // 删除过期项
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 已清理 ${keysToRemove.length} 个过期缓存项`);
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }

  /**
   * 验证配置完整性
   */
  static validateConfig(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 验证基础配置
      const config = this.loadConfig();
      
      // 验证自定义规则
      const customRules = this.loadCustomRules();
      customRules.forEach((rule, index) => {
        if (!rule.id) {
          errors.push(`自定义规则 ${index + 1}: 缺少ID`);
        }
        if (!rule.websiteName) {
          errors.push(`自定义规则 ${index + 1}: 缺少网站名称`);
        }
        if (!rule.searchConfig?.urlTemplate) {
          errors.push(`自定义规则 ${index + 1}: 缺少搜索URL模板`);
        }
      });

      // 验证设置
      const settings = this.loadSettings();
      if (settings.maxConcurrentTasks < 1 || settings.maxConcurrentTasks > 10) {
        warnings.push('并发任务数建议设置在1-10之间');
      }
      if (settings.defaultTimeout < 5000) {
        warnings.push('超时时间建议不少于5秒');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`配置验证失败: ${error instanceof Error ? error.message : String(error)}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }
}

/**
 * 爬虫设置接口
 */
export interface CrawlerSettings {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  defaultDelay: number;
  enableCache: boolean;
  cacheExpiry: number;
  maxCacheSize: number;
  enableProxy: boolean;
  proxyList: string[];
  userAgentRotation: boolean;
  enableJavaScript: boolean;
  enableImages: boolean;
  maxRetries: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}