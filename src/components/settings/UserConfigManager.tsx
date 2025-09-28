/**
 * 用户配置管理组件
 * 提供完整的用户个性化设置界面
 */

import React, { useState, useEffect } from 'react';
import type { UserConfig, DisplayField, userConfigService } from '../../services/userConfigService';

interface UserConfigManagerProps {
  onConfigChange?: (config: UserConfig) => void;
  className?: string;
}

export const UserConfigManager: React.FC<UserConfigManagerProps> = ({
  onConfigChange,
  className = ''
}) => {
  const [config, setConfig] = useState<UserConfig>(userConfigService.getConfig());
  const [activeTab, setActiveTab] = useState<'display' | 'search' | 'interface' | 'privacy' | 'performance' | 'shortcuts'>('display');
  const [hasChanges, setHasChanges] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'none' | 'import' | 'export'>('none');
  const [importData, setImportData] = useState('');

  // 检测配置变化
  useEffect(() => {
    const originalConfig = userConfigService.getConfig();
    const hasChanged = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(hasChanged);
  }, [config]);

  // 更新配置
  const updateConfig = (updates: Partial<UserConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
  };

  // 保存配置
  const handleSaveConfig = () => {
    userConfigService.updateConfig(config);
    setHasChanges(false);
    onConfigChange?.(config);
  };

  // 重置配置
  const handleResetConfig = () => {
    const defaultConfig = userConfigService.getConfig();
    setConfig(defaultConfig);
    setHasChanges(false);
  };

  // 导出配置
  const handleExportConfig = () => {
    const exportData = userConfigService.exportConfig();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `find3d-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportExportMode('none');
  };

  // 导入配置
  const handleImportConfig = () => {
    try {
      const success = userConfigService.importConfig(importData);
      if (success) {
        const newConfig = userConfigService.getConfig();
        setConfig(newConfig);
        setImportData('');
        setImportExportMode('none');
        alert('配置导入成功！');
      } else {
        alert('配置导入失败，请检查文件格式。');
      }
    } catch (error) {
      alert('配置导入失败：' + error);
    }
  };

  // 更新显示字段
  const updateDisplayField = (index: number, updates: Partial<DisplayField>) => {
    const newFields = [...config.display.fieldsToShow];
    newFields[index] = { ...newFields[index], ...updates };
    updateConfig({
      display: {
        ...config.display,
        fieldsToShow: newFields
      }
    });
  };

  // 移动显示字段
  const moveDisplayField = (fromIndex: number, toIndex: number) => {
    const newFields = [...config.display.fieldsToShow];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    
    // 重新排序
    newFields.forEach((field, index) => {
      field.order = index + 1;
    });

    updateConfig({
      display: {
        ...config.display,
        fieldsToShow: newFields
      }
    });
  };

  const stats = userConfigService.getStats();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 标题和操作 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          ⚙️ 用户配置管理
        </h2>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-orange-600">● 有未保存的更改</span>
          )}
          
          <button
            onClick={() => setImportExportMode('export')}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            📤 导出
          </button>
          
          <button
            onClick={() => setImportExportMode('import')}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            📥 导入
          </button>
        </div>
      </div>

      {/* 导入导出模态框 */}
      {importExportMode !== 'none' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {importExportMode === 'export' ? '📤 导出配置' : '📥 导入配置'}
            </h3>
            
            {importExportMode === 'export' ? (
              <div>
                <p className="text-gray-600 mb-4">
                  点击下载按钮将当前配置导出为JSON文件，包含所有个性化设置和搜索历史。
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setImportExportMode('none')}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleExportConfig}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    下载配置文件
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  粘贴配置JSON数据或上传配置文件来导入设置。
                </p>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="粘贴配置JSON数据..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setImportExportMode('none');
                      setImportData('');
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleImportConfig}
                    disabled={!importData.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    导入配置
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">{stats.totalSearches}</div>
          <div className="text-sm text-gray-600">总搜索次数</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">{stats.favoriteResults}</div>
          <div className="text-sm text-gray-600">收藏结果</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-600">{(stats.configSize / 1024).toFixed(1)}KB</div>
          <div className="text-sm text-gray-600">配置大小</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-600">
            {stats.lastSearchTime ? stats.lastSearchTime.toLocaleDateString() : '无'}
          </div>
          <div className="text-sm text-gray-600">最后搜索</div>
        </div>
      </div>

      {/* 标签导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'display', label: '显示设置', icon: '🎨' },
            { key: 'search', label: '搜索配置', icon: '🔍' },
            { key: 'interface', label: '界面设置', icon: '🖥️' },
            { key: 'privacy', label: '隐私设置', icon: '🔒' },
            { key: 'performance', label: '性能优化', icon: '⚡' },
            { key: 'shortcuts', label: '快捷键', icon: '⌨️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 显示设置标签 */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          {/* 卡片样式 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">卡片样式</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'compact', label: '紧凑', desc: '显示基本信息' },
                { value: 'standard', label: '标准', desc: '平衡的信息展示' },
                { value: 'detailed', label: '详细', desc: '显示完整信息' }
              ].map((style) => (
                <label
                  key={style.value}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    config.display.cardStyle === style.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cardStyle"
                    value={style.value}
                    checked={config.display.cardStyle === style.value}
                    onChange={(e) => updateConfig({
                      display: { ...config.display, cardStyle: e.target.value as any }
                    })}
                    className="sr-only"
                  />
                  <div className="font-medium text-gray-900">{style.label}</div>
                  <div className="text-sm text-gray-600">{style.desc}</div>
                </label>
              ))}
            </div>
          </div>

          {/* 显示字段配置 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">显示字段</h3>
            <div className="space-y-2">
              {config.display.fieldsToShow.map((field, index) => (
                <div
                  key={field.key}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveDisplayField(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDisplayField(index, Math.min(config.display.fieldsToShow.length - 1, index + 1))}
                      disabled={index === config.display.fieldsToShow.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </div>
                  
                  <label className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={field.visible}
                      onChange={(e) => updateDisplayField(index, { visible: e.target.checked })}
                      className="rounded"
                    />
                    <span className="font-medium">{field.label}</span>
                    <span className="text-sm text-gray-500">({field.key})</span>
                  </label>
                  
                  <select
                    value={field.format || 'text'}
                    onChange={(e) => updateDisplayField(index, { format: e.target.value as any })}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="text">文本</option>
                    <option value="image">图片</option>
                    <option value="price">价格</option>
                    <option value="date">日期</option>
                    <option value="number">数字</option>
                    <option value="badge">标签</option>
                    <option value="link">链接</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 其他显示设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                每页结果数
              </label>
              <select
                value={config.display.resultsPerPage}
                onChange={(e) => updateConfig({
                  display: { ...config.display, resultsPerPage: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网格列数
              </label>
              <select
                value={config.display.gridColumns}
                onChange={(e) => updateConfig({
                  display: { ...config.display, gridColumns: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1列</option>
                <option value={2}>2列</option>
                <option value={3}>3列</option>
                <option value={4}>4列</option>
                <option value={6}>6列</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序方式
              </label>
              <select
                value={config.display.sortBy}
                onChange={(e) => updateConfig({
                  display: { ...config.display, sortBy: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">相关性</option>
                <option value="date">日期</option>
                <option value="price">价格</option>
                <option value="downloads">下载数</option>
                <option value="rating">评分</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片质量
              </label>
              <select
                value={config.display.imageQuality}
                onChange={(e) => updateConfig({
                  display: { ...config.display, imageQuality: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">低质量</option>
                <option value="medium">中等质量</option>
                <option value="high">高质量</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 搜索配置标签 */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* 默认网站 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">默认搜索网站</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'modown', name: '魔顿网' },
                { id: 'cgown', name: 'CG资源网' },
                { id: 'c4dsky', name: '书生CG资源站' },
                { id: '3dxy', name: '3D溜溜网' }
              ].map((website) => (
                <label key={website.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.search.defaultWebsites.includes(website.id)}
                    onChange={(e) => {
                      const websites = e.target.checked
                        ? [...config.search.defaultWebsites, website.id]
                        : config.search.defaultWebsites.filter(w => w !== website.id);
                      updateConfig({
                        search: { ...config.search, defaultWebsites: websites }
                      });
                    }}
                    className="rounded"
                  />
                  <span>{website.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 搜索设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索模式
              </label>
              <select
                value={config.search.searchMode}
                onChange={(e) => updateConfig({
                  search: { ...config.search, searchMode: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fast">快速模式</option>
                <option value="comprehensive">全面模式</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                缓存过期时间（小时）
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={config.search.cacheExpiry}
                onChange={(e) => updateConfig({
                  search: { ...config.search, cacheExpiry: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大并发爬虫数
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.search.maxConcurrentCrawlers}
                onChange={(e) => updateConfig({
                  search: { ...config.search, maxConcurrentCrawlers: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索延迟（毫秒）
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                step="100"
                value={config.search.searchDelay}
                onChange={(e) => updateConfig({
                  search: { ...config.search, searchDelay: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 搜索开关 */}
          <div className="space-y-4">
            {[
              { key: 'enableCache', label: '启用缓存', desc: '缓存搜索结果以提高速度' },
              { key: 'autoSearch', label: '自动搜索', desc: '输入时自动触发搜索' },
              { key: 'enableFilters', label: '启用过滤器', desc: '显示搜索过滤选项' }
            ].map((option) => (
              <div key={option.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.search[option.key as keyof typeof config.search] as boolean}
                    onChange={(e) => updateConfig({
                      search: { ...config.search, [option.key]: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 其他标签的内容... */}
      {/* 为了节省空间，这里只展示部分标签的实现 */}

      {/* 保存按钮 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {hasChanges ? '配置已修改，请保存更改' : '配置已同步'}
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
            onClick={handleSaveConfig}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConfigManager;