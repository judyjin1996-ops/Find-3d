/**
 * 反爬虫管理组件
 * 提供代理管理、频率控制和反爬虫策略配置
 */

import React, { useState, useEffect } from 'react';
import type { ProxyConfig, ProxyStatus } from '../../crawler/utils/proxyManager';
import { RateLimitConfig } from '../../crawler/utils/rateLimiter';

interface AntiCrawlerManagerProps {
  onAddProxy: (proxy: ProxyConfig) => void;
  onRemoveProxy: (proxy: ProxyConfig) => void;
  onTestProxy: (proxy: ProxyConfig) => Promise<boolean>;
  onUpdateRateLimit: (websiteId: string, config: RateLimitConfig) => void;
  onResetWebsite: (websiteId: string) => void;
  className?: string;
}

export const AntiCrawlerManager: React.FC<AntiCrawlerManagerProps> = ({
  onAddProxy,
  onRemoveProxy,
  onTestProxy,
  onUpdateRateLimit,
  onResetWebsite,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'proxies' | 'rateLimit' | 'detection'>('proxies');
  const [proxies, setProxies] = useState<ProxyStatus[]>([]);
  const [newProxy, setNewProxy] = useState<Partial<ProxyConfig>>({
    protocol: 'http',
    host: '',
    port: 8080,
    username: '',
    password: ''
  });
  const [proxyImportText, setProxyImportText] = useState('');
  const [isTestingProxy, setIsTestingProxy] = useState<string | null>(null);
  
  // 网站频率限制配置
  const [rateLimitConfigs, setRateLimitConfigs] = useState<Record<string, RateLimitConfig>>({
    'modown.cn': {
      requestsPerSecond: 0.5,
      requestsPerMinute: 20,
      requestsPerHour: 500,
      burstSize: 2,
      adaptiveDelay: true,
      respectRetryAfter: true
    },
    'cgown.com': {
      requestsPerSecond: 1,
      requestsPerMinute: 30,
      requestsPerHour: 800,
      burstSize: 3,
      adaptiveDelay: true,
      respectRetryAfter: true
    },
    'c4dsky.com': {
      requestsPerSecond: 0.8,
      requestsPerMinute: 25,
      requestsPerHour: 600,
      burstSize: 2,
      adaptiveDelay: true,
      respectRetryAfter: true
    },
    '3dxy.com': {
      requestsPerSecond: 1,
      requestsPerMinute: 40,
      requestsPerHour: 1000,
      burstSize: 4,
      adaptiveDelay: true,
      respectRetryAfter: true
    }
  });

  // 检测策略配置
  const [detectionConfig, setDetectionConfig] = useState({
    enableProxyRotation: true,
    enableUserAgentRotation: true,
    enableRequestDelay: true,
    enableCaptchaDetection: true,
    enableIPBanDetection: true,
    autoSwitchOnFailure: true,
    maxFailuresBeforeSwitch: 3,
    proxyHealthCheckInterval: 5 * 60 * 1000, // 5分钟
    adaptiveDelayFactor: 1.5
  });

  // 添加代理
  const handleAddProxy = () => {
    if (newProxy.host && newProxy.port) {
      const proxy: ProxyConfig = {
        protocol: newProxy.protocol || 'http',
        host: newProxy.host,
        port: newProxy.port,
        username: newProxy.username || undefined,
        password: newProxy.password || undefined
      };
      
      onAddProxy(proxy);
      setNewProxy({
        protocol: 'http',
        host: '',
        port: 8080,
        username: '',
        password: ''
      });
    }
  };

  // 批量导入代理
  const handleImportProxies = () => {
    const lines = proxyImportText.split('\n').filter(line => line.trim());
    let importedCount = 0;

    for (const line of lines) {
      try {
        const proxy = parseProxyString(line.trim());
        if (proxy) {
          onAddProxy(proxy);
          importedCount++;
        }
      } catch (error) {
        console.warn('解析代理失败:', line, error);
      }
    }

    setProxyImportText('');
    alert(`成功导入 ${importedCount} 个代理`);
  };

  // 解析代理字符串
  const parseProxyString = (proxyStr: string): ProxyConfig | null => {
    try {
      // 支持格式: protocol://[username:password@]host:port
      if (proxyStr.includes('://')) {
        const url = new URL(proxyStr);
        return {
          protocol: url.protocol.slice(0, -1) as ProxyConfig['protocol'],
          host: url.hostname,
          port: parseInt(url.port),
          username: url.username || undefined,
          password: url.password || undefined
        };
      } else {
        // 支持格式: host:port 或 host:port:username:password
        const parts = proxyStr.split(':');
        if (parts.length >= 2) {
          return {
            protocol: 'http',
            host: parts[0],
            port: parseInt(parts[1]),
            username: parts[2] || undefined,
            password: parts[3] || undefined
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // 测试代理
  const handleTestProxy = async (proxy: ProxyConfig) => {
    const proxyKey = `${proxy.host}:${proxy.port}`;
    setIsTestingProxy(proxyKey);
    
    try {
      const success = await onTestProxy(proxy);
      alert(success ? '代理测试成功' : '代理测试失败');
    } catch (error) {
      alert(`代理测试失败: ${error}`);
    } finally {
      setIsTestingProxy(null);
    }
  };

  // 更新频率限制配置
  const handleUpdateRateLimit = (websiteId: string, config: RateLimitConfig) => {
    setRateLimitConfigs(prev => ({
      ...prev,
      [websiteId]: config
    }));
    onUpdateRateLimit(websiteId, config);
  };

  // 获取代理状态颜色
  const getProxyStatusColor = (status: ProxyStatus): string => {
    if (!status.isActive) return 'text-red-500';
    if (status.healthScore >= 80) return 'text-green-500';
    if (status.healthScore >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  // 获取代理状态文本
  const getProxyStatusText = (status: ProxyStatus): string => {
    if (!status.isActive) return '已禁用';
    if (status.healthScore >= 80) return '优秀';
    if (status.healthScore >= 60) return '良好';
    return '一般';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          🛡️ 反爬虫管理
        </h2>
      </div>

      {/* 标签导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'proxies', label: '代理管理', icon: '🌐' },
            { key: 'rateLimit', label: '频率控制', icon: '⏱️' },
            { key: 'detection', label: '检测策略', icon: '🔍' }
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

      {/* 代理管理标签 */}
      {activeTab === 'proxies' && (
        <div className="space-y-6">
          {/* 添加代理 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加代理</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">协议</label>
                <select
                  value={newProxy.protocol}
                  onChange={(e) => setNewProxy({ ...newProxy, protocol: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主机</label>
                <input
                  type="text"
                  value={newProxy.host}
                  onChange={(e) => setNewProxy({ ...newProxy, host: e.target.value })}
                  placeholder="127.0.0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
                <input
                  type="number"
                  value={newProxy.port}
                  onChange={(e) => setNewProxy({ ...newProxy, port: parseInt(e.target.value) })}
                  placeholder="8080"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={newProxy.username}
                  onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                  placeholder="可选"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={newProxy.password}
                  onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
                  placeholder="可选"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddProxy}
                  disabled={!newProxy.host || !newProxy.port}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  添加代理
                </button>
              </div>
            </div>

            {/* 批量导入 */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">批量导入代理</h4>
              <div className="flex gap-4">
                <textarea
                  value={proxyImportText}
                  onChange={(e) => setProxyImportText(e.target.value)}
                  placeholder="每行一个代理，支持格式：&#10;host:port&#10;host:port:username:password&#10;protocol://username:password@host:port"
                  rows={4}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleImportProxies}
                  disabled={!proxyImportText.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  导入
                </button>
              </div>
            </div>
          </div>

          {/* 代理列表 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">代理列表</h3>
            
            {proxies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无代理配置
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        代理地址
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        健康分数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        成功/失败
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        响应时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proxies.map((proxyStatus, index) => {
                      const proxy = proxyStatus.proxy;
                      const proxyKey = `${proxy.host}:${proxy.port}`;
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {proxy.protocol}://{proxy.host}:{proxy.port}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getProxyStatusColor(proxyStatus)}`}>
                              {getProxyStatusText(proxyStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${proxyStatus.healthScore}%` }}
                                ></div>
                              </div>
                              <span>{proxyStatus.healthScore}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {proxyStatus.successCount}/{proxyStatus.failureCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {proxyStatus.avgResponseTime.toFixed(0)}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleTestProxy(proxy)}
                              disabled={isTestingProxy === proxyKey}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              {isTestingProxy === proxyKey ? '测试中...' : '测试'}
                            </button>
                            <button
                              onClick={() => onRemoveProxy(proxy)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 频率控制标签 */}
      {activeTab === 'rateLimit' && (
        <div className="space-y-6">
          {Object.entries(rateLimitConfigs).map(([websiteId, config]) => (
            <div key={websiteId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{websiteId}</h3>
                <button
                  onClick={() => onResetWebsite(websiteId)}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  重置状态
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    每秒请求数
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={config.requestsPerSecond}
                    onChange={(e) => handleUpdateRateLimit(websiteId, {
                      ...config,
                      requestsPerSecond: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    每分钟请求数
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={config.requestsPerMinute}
                    onChange={(e) => handleUpdateRateLimit(websiteId, {
                      ...config,
                      requestsPerMinute: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    每小时请求数
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={config.requestsPerHour}
                    onChange={(e) => handleUpdateRateLimit(websiteId, {
                      ...config,
                      requestsPerHour: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium text-gray-900">自适应延迟</div>
                    <div className="text-sm text-gray-600">根据响应情况自动调整延迟</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.adaptiveDelay}
                      onChange={(e) => handleUpdateRateLimit(websiteId, {
                        ...config,
                        adaptiveDelay: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium text-gray-900">遵守Retry-After</div>
                    <div className="text-sm text-gray-600">遵守服务器的重试延迟指示</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.respectRetryAfter}
                      onChange={(e) => handleUpdateRateLimit(websiteId, {
                        ...config,
                        respectRetryAfter: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 检测策略标签 */}
      {activeTab === 'detection' && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">检测策略配置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'enableProxyRotation', label: '启用代理轮换', desc: '自动轮换使用不同的代理IP' },
                { key: 'enableUserAgentRotation', label: '启用User-Agent轮换', desc: '随机使用不同的浏览器标识' },
                { key: 'enableRequestDelay', label: '启用请求延迟', desc: '在请求之间添加随机延迟' },
                { key: 'enableCaptchaDetection', label: '启用验证码检测', desc: '自动检测并跳过验证码页面' },
                { key: 'enableIPBanDetection', label: '启用IP封禁检测', desc: '检测IP被封禁并自动切换' },
                { key: 'autoSwitchOnFailure', label: '失败时自动切换', desc: '连续失败时自动切换代理' }
              ].map((option) => (
                <div key={option.key} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detectionConfig[option.key as keyof typeof detectionConfig] as boolean}
                      onChange={(e) => setDetectionConfig({
                        ...detectionConfig,
                        [option.key]: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  切换前最大失败次数
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={detectionConfig.maxFailuresBeforeSwitch}
                  onChange={(e) => setDetectionConfig({
                    ...detectionConfig,
                    maxFailuresBeforeSwitch: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自适应延迟因子
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={detectionConfig.adaptiveDelayFactor}
                  onChange={(e) => setDetectionConfig({
                    ...detectionConfig,
                    adaptiveDelayFactor: parseFloat(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AntiCrawlerManager;