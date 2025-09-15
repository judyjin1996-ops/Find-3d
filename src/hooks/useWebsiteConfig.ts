import { useState, useCallback, useEffect } from 'react';
import type { WebsiteConfig, ValidationResult } from '../types';
import { websiteConfigService } from '../services/websiteConfigService';

interface UseWebsiteConfigOptions {
  onConfigChange?: (websites: WebsiteConfig[]) => void;
  onError?: (error: string) => void;
}

export const useWebsiteConfig = (options: UseWebsiteConfigOptions = {}) => {
  const { onConfigChange, onError } = options;
  
  const [websites, setWebsites] = useState<WebsiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载网站配置
  const loadWebsites = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const allWebsites = websiteConfigService.getAllWebsites();
      setWebsites(allWebsites);
      onConfigChange?.(allWebsites);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载网站配置失败';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onConfigChange, onError]);

  // 添加网站
  const addWebsite = useCallback(async (websiteData: Omit<WebsiteConfig, 'id'>) => {
    try {
      setError(null);
      const newWebsite = websiteConfigService.addWebsite(websiteData);
      const updatedWebsites = websiteConfigService.getAllWebsites();
      setWebsites(updatedWebsites);
      onConfigChange?.(updatedWebsites);
      return newWebsite;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加网站失败';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    }
  }, [onConfigChange, onError]);

  // 更新网站
  const updateWebsite = useCallback(async (id: string, websiteData: WebsiteConfig) => {
    try {
      setError(null);
      const updatedWebsite = websiteConfigService.updateWebsite(id, websiteData);
      const updatedWebsites = websiteConfigService.getAllWebsites();
      setWebsites(updatedWebsites);
      onConfigChange?.(updatedWebsites);
      return updatedWebsite;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新网站失败';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    }
  }, [onConfigChange, onError]);

  // 删除网站
  const deleteWebsite = useCallback(async (id: string) => {
    try {
      setError(null);
      const success = websiteConfigService.deleteWebsite(id);
      if (success) {
        const updatedWebsites = websiteConfigService.getAllWebsites();
        setWebsites(updatedWebsites);
        onConfigChange?.(updatedWebsites);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除网站失败';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  }, [onConfigChange, onError]);

  // 切换网站激活状态
  const toggleWebsiteActive = useCallback(async (id: string) => {
    try {
      setError(null);
      const success = websiteConfigService.toggleWebsiteActive(id);
      if (success) {
        const updatedWebsites = websiteConfigService.getAllWebsites();
        setWebsites(updatedWebsites);
        onConfigChange?.(updatedWebsites);
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换网站状态失败';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    }
  }, [onConfigChange, onError]);

  // 验证网站配置
  const validateWebsite = useCallback((config: WebsiteConfig): ValidationResult => {
    return websiteConfigService.validateWebsiteConfig(config);
  }, []);

  // 测试网站连接
  const testWebsiteConnection = useCallback(async (config: WebsiteConfig) => {
    try {
      setError(null);
      return await websiteConfigService.testWebsiteConnection(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '测试连接失败';
      setError(errorMessage);
      onError?.(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [onError]);

  // 重置为默认配置
  const resetToDefaults = useCallback(() => {
    try {
      setError(null);
      websiteConfigService.resetToDefaults();
      const updatedWebsites = websiteConfigService.getAllWebsites();
      setWebsites(updatedWebsites);
      onConfigChange?.(updatedWebsites);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置配置失败';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onConfigChange, onError]);

  // 导出配置
  const exportConfig = useCallback(() => {
    try {
      return websiteConfigService.exportConfig();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导出配置失败';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    }
  }, [onError]);

  // 导入配置
  const importConfig = useCallback((configJson: string) => {
    try {
      setError(null);
      const result = websiteConfigService.importConfig(configJson);
      if (result.isValid) {
        const updatedWebsites = websiteConfigService.getAllWebsites();
        setWebsites(updatedWebsites);
        onConfigChange?.(updatedWebsites);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导入配置失败';
      setError(errorMessage);
      onError?.(errorMessage);
      return {
        isValid: false,
        errors: [errorMessage]
      };
    }
  }, [onConfigChange, onError]);

  // 初始化加载
  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  // 计算统计信息
  const stats = {
    total: websites.length,
    active: websites.filter(w => w.isActive).length,
    inactive: websites.filter(w => !w.isActive).length
  };

  return {
    // 状态
    websites,
    loading,
    error,
    stats,
    
    // 操作
    addWebsite,
    updateWebsite,
    deleteWebsite,
    toggleWebsiteActive,
    
    // 工具方法
    validateWebsite,
    testWebsiteConnection,
    resetToDefaults,
    exportConfig,
    importConfig,
    
    // 刷新
    refresh: loadWebsites,
    
    // 便捷访问器
    activeWebsites: websites.filter(w => w.isActive),
    inactiveWebsites: websites.filter(w => !w.isActive)
  };
};