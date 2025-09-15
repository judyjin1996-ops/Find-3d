/**
 * 缓存策略配置组件
 * 允许用户自定义缓存策略和参数
 */

import React, { useState, useEffect } from 'react';
import { CacheConfig } from '../../services/smartCacheService';

interface CacheStrategyConfigProps {
  config: CacheConfig;
  onConfigChange: (config: CacheConfig) => void;
  onApplyConfig: () => Promise<void>;
  className?: string;
}

export const CacheStrategyConfig: React.FC<CacheStrategyConfigProps> = ({
  config,
  onConfigChange,
  onApplyConfig,
  className = ''
}) => {
  const [localConfig, setLocalConfig] = useState<CacheConfig>(config);
  const [isApplying, setIsApplying] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 检测配置变化
  useEffect(() => {
    const hasChanged = JSON.stringify(localConfig) !== JSON.stringify(config);
    setHasChanges(hasChanged);
  }, [localConfig, config]);

  // 更新本地配置
  const updateConfig = (updates: Partial<CacheConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  // 应用配置
  const handleApplyConfig = async () => {
    setIsApplying(true);
    try {
      await onApplyConfig();
      setHasChanges(false);
    } catch (error) {
      console.error('应用缓存配置失败:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // 重置配置
  const handleResetConfig = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  // 预设配置
  const presetConfigs = {
    performance: {
      name: '性能优先',
      description: '最大化缓存性能，适合高频访问场景',
      config: {
        maxMemorySize: 100,
        maxIndexedDBSize: 1000,
        maxLocalStorageSize: 20,
        defaultTTL: 60 * 60 * 1000, // 1小时
        cleanupInterval: 15 * 60 * 1000, // 15分钟
        compressionEnabled: false,
        encryptionEnabled: false
      }
    },
    balanced: {
      name: '平衡模式',
      description: '平衡性能和存储，适合一般使用场景',
      config: {
        maxMemorySize: 50,
        maxIndexedDBSize: 500,
        maxLocalStorageSize: 10,
        defaultTTL: 24 * 60 * 60 * 1000, // 24小时
        cleanupInterval: 30 * 60 * 1000, // 30分钟
        compressionEnabled: true,
        encryptionEnabled: false
      }
    },
    storage: {
      name: '存储优先',
      description: '最大化存储效率，适合存储空间有限的场景',
      config: {
        maxMemorySize: 20,
        maxIndexedDBSize: 200,
        maxLocalStorageSize: 5,
        defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7天
        cleanupInterval: 60 * 60 * 1000, // 1小时
        compressionEnabled: true,
        encryptionEnabled: true
      }
    }
  };

  // 应用预设配置
  const applyPreset = (presetKey: keyof typeof presetConfigs) => {
    const preset = presetConfigs[presetKey];
    updateConfig(preset.config);
  };

  // 格式化时间
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天`;
    if (hours > 0) return `${hours}小时`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 标题和状态 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          ⚙️ 缓存策略配置
        </h3>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-600">● 有未保存的更改</span>
            <button
              onClick={handleResetConfig}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              重置
            </button>
          </div>
        )}
      </div>

      {/* 预设配置 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">🎯 预设配置</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(presetConfigs).map(([key, preset]) => (
            <div
              key={key}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => applyPreset(key as keyof typeof presetConfigs)}
            >
              <div className="font-medium text-gray-900 mb-1">{preset.name}</div>
              <div className="text-sm text-gray-600 mb-3">{preset.description}</div>
              <div className="text-xs text-gray-500">
                <div>内存: {preset.config.maxMemorySize}MB</div>
                <div>TTL: {formatTime(preset.config.defaultTTL)}</div>
                <div>压缩: {preset.config.compressionEnabled ? '启用' : '禁用'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 存储配置 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">💾 存储配置</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内存缓存大小 (MB)
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={localConfig.maxMemorySize}
              onChange={(e) => updateConfig({ maxMemorySize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              推荐: 20-100MB，影响访问速度
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IndexedDB大小 (MB)
            </label>
            <input
              type="number"
              min="10"
              max="2000"
              value={localConfig.maxIndexedDBSize}
              onChange={(e) => updateConfig({ maxIndexedDBSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              推荐: 200-1000MB，持久化存储
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LocalStorage大小 (MB)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={localConfig.maxLocalStorageSize}
              onChange={(e) => updateConfig({ maxLocalStorageSize: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              推荐: 5-20MB，轻量级存储
            </div>
          </div>
        </div>
      </div>

      {/* 时间配置 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">⏰ 时间配置</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              默认TTL (小时)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={localConfig.defaultTTL / (60 * 60 * 1000)}
              onChange={(e) => updateConfig({ 
                defaultTTL: Number(e.target.value) * 60 * 60 * 1000 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              缓存项的默认生存时间 (当前: {formatTime(localConfig.defaultTTL)})
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              清理间隔 (分钟)
            </label>
            <input
              type="number"
              min="5"
              max="240"
              value={localConfig.cleanupInterval / (60 * 1000)}
              onChange={(e) => updateConfig({ 
                cleanupInterval: Number(e.target.value) * 60 * 1000 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              自动清理过期缓存的间隔 (当前: {formatTime(localConfig.cleanupInterval)})
            </div>
          </div>
        </div>
      </div>

      {/* 功能配置 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">🔧 功能配置</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">数据压缩</div>
              <div className="text-sm text-gray-600">
                启用数据压缩可以节省存储空间，但会增加CPU使用
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.compressionEnabled}
                onChange={(e) => updateConfig({ compressionEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">数据加密</div>
              <div className="text-sm text-gray-600">
                启用数据加密可以保护敏感信息，但会影响性能
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.encryptionEnabled}
                onChange={(e) => updateConfig({ encryptionEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 配置预览 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">📋 配置预览</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-sm text-gray-700 overflow-x-auto">
            {JSON.stringify(localConfig, null, 2)}
          </pre>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {hasChanges ? '配置已修改，请点击应用保存更改' : '配置已同步'}
        </div>
        
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={handleResetConfig}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消更改
            </button>
          )}
          
          <button
            onClick={handleApplyConfig}
            disabled={!hasChanges || isApplying}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApplying ? '应用中...' : '应用配置'}
          </button>
        </div>
      </div>

      {/* 配置说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="text-sm font-medium text-blue-900 mb-2">💡 配置建议</h5>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• <strong>内存缓存</strong>: 存储热点数据，访问最快但容量有限</div>
          <div>• <strong>IndexedDB</strong>: 大容量持久化存储，适合存储搜索结果</div>
          <div>• <strong>LocalStorage</strong>: 轻量级存储，适合配置和小数据</div>
          <div>• <strong>TTL设置</strong>: 根据数据更新频率调整，搜索结果建议2-24小时</div>
          <div>• <strong>压缩功能</strong>: 在存储空间紧张时启用，会消耗额外CPU</div>
        </div>
      </div>
    </div>
  );
};

export default CacheStrategyConfig;