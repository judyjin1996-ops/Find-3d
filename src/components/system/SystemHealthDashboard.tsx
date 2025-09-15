/**
 * 系统健康监控仪表板
 * 显示系统整体健康状态和各组件状态
 */

import React, { useState, useEffect } from 'react';
import { SystemHealth, SystemAlert, ComponentHealth, systemHealthMonitor } from '../../services/systemHealthMonitor';

interface SystemHealthDashboardProps {
  onAlertAcknowledge?: (alertId: string) => void;
  className?: string;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  onAlertAcknowledge,
  className = ''
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // 秒

  useEffect(() => {
    // 启动监控
    systemHealthMonitor.startMonitoring(refreshInterval * 1000);
    
    // 立即获取一次健康状态
    loadHealthStatus();

    return () => {
      systemHealthMonitor.stopMonitoring();
    };
  }, [refreshInterval]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadHealthStatus();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // 加载健康状态
  const loadHealthStatus = async () => {
    try {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      setHealth(healthStatus);
    } catch (error) {
      console.error('获取系统健康状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 确认告警
  const handleAcknowledgeAlert = (alertId: string) => {
    systemHealthMonitor.acknowledgeAlert(alertId);
    onAlertAcknowledge?.(alertId);
    loadHealthStatus(); // 刷新状态
  };

  // 清除所有告警
  const handleClearAllAlerts = () => {
    systemHealthMonitor.clearAllAlerts();
    loadHealthStatus();
  };

  // 获取状态颜色
  const getStatusColor = (status: ComponentHealth['status']): string => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'unknown': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // 获取状态背景色
  const getStatusBgColor = (status: ComponentHealth['status']): string => {
    switch (status) {
      case 'healthy': return 'bg-green-100 border-green-200';
      case 'warning': return 'bg-yellow-100 border-yellow-200';
      case 'critical': return 'bg-red-100 border-red-200';
      case 'unknown': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: ComponentHealth['status']): string => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      case 'unknown': return '❓';
      default: return '❓';
    }
  };

  // 获取告警类型图标
  const getAlertIcon = (type: SystemAlert['type']): string => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return 'ℹ️';
    }
  };

  // 获取告警类型颜色
  const getAlertColor = (type: SystemAlert['type']): string => {
    switch (type) {
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 格式化运行时间
  const formatUptime = (uptime: number): string => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天 ${hours % 24}小时`;
    if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`;
    return `${seconds}秒`;
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">加载系统健康状态...</span>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">❌</div>
          <div className="text-lg font-medium">无法获取系统健康状态</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 标题和控制 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          🏥 系统健康监控
        </h2>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自动刷新
          </label>
          
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value={10}>10秒</option>
            <option value={30}>30秒</option>
            <option value={60}>1分钟</option>
            <option value={300}>5分钟</option>
          </select>
          
          <button
            onClick={loadHealthStatus}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 总体健康状态 */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* 背景圆环 */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* 进度圆环 */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={
                  health.overall === 'healthy' ? '#10b981' :
                  health.overall === 'warning' ? '#f59e0b' : '#ef4444'
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(health.score / 100) * 314} 314`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{health.score}</div>
                <div className="text-xs text-gray-600">健康分数</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <span className={`text-lg font-medium ${getStatusColor(health.overall as any)}`}>
            {health.overall === 'healthy' ? '系统健康' :
             health.overall === 'warning' ? '需要关注' : '严重问题'}
          </span>
        </div>
      </div>

      {/* 系统指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-blue-600">{formatUptime(health.metrics.uptime)}</div>
          <div className="text-sm text-gray-600">运行时间</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-green-600">{health.metrics.totalRequests}</div>
          <div className="text-sm text-gray-600">总请求数</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-purple-600">
            {health.metrics.totalRequests > 0 
              ? ((health.metrics.successfulRequests / health.metrics.totalRequests) * 100).toFixed(1) + '%'
              : '100%'
            }
          </div>
          <div className="text-sm text-gray-600">成功率</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-orange-600">
            {health.metrics.avgResponseTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-600">平均响应时间</div>
        </div>
      </div>

      {/* 组件健康状态 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📊 组件状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(health.components).map(([componentName, component]) => (
            <div
              key={componentName}
              className={`border rounded-lg p-4 ${getStatusBgColor(component.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(component.status)}</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {componentName === 'memory' ? '内存' :
                     componentName === 'network' ? '网络' :
                     componentName === 'crawler' ? '爬虫' :
                     componentName === 'cache' ? '缓存' :
                     componentName === 'storage' ? '存储' : componentName}
                  </span>
                </div>
                <span className="text-sm font-bold">{component.score}</span>
              </div>
              
              <div className="text-sm text-gray-700 mb-2">
                {component.message}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    component.status === 'healthy' ? 'bg-green-500' :
                    component.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${component.score}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                最后检查: {component.lastCheck.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 系统告警 */}
      {health.alerts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              🚨 系统告警 ({health.alerts.length})
            </h3>
            <button
              onClick={handleClearAllAlerts}
              className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              清除全部
            </button>
          </div>
          
          <div className="space-y-3">
            {health.alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <span className="font-medium">{alert.title}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                        {alert.component}
                      </span>
                    </div>
                    <div className="text-sm mb-2">{alert.message}</div>
                    <div className="text-xs opacity-75">
                      {alert.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="ml-4 px-3 py-1 text-xs bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
                  >
                    确认
                  </button>
                </div>
              </div>
            ))}
            
            {health.alerts.length > 5 && (
              <div className="text-center text-sm text-gray-500">
                还有 {health.alerts.length - 5} 个告警...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 详细指标 */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📈 详细指标</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 内存使用 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">内存使用</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>已使用</span>
                <span>{formatSize(health.metrics.memoryUsage.used)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>总容量</span>
                <span>{formatSize(health.metrics.memoryUsage.total)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${health.metrics.memoryUsage.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {health.metrics.memoryUsage.percentage.toFixed(1)}% 使用中
              </div>
            </div>
          </div>

          {/* 缓存统计 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">缓存统计</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>命中率</span>
                <span>{(health.metrics.cacheStats.hitRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>缓存大小</span>
                <span>{formatSize(health.metrics.cacheStats.size)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>缓存项数</span>
                <span>{health.metrics.cacheStats.itemCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 错误统计 */}
        {health.metrics.errorStats.totalErrors > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">错误统计</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-2">
                <span>总错误数</span>
                <span className="text-red-600 font-medium">{health.metrics.errorStats.totalErrors}</span>
              </div>
              
              {health.metrics.errorStats.recentErrors.length > 0 && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">最近错误:</div>
                  <div className="space-y-1">
                    {health.metrics.errorStats.recentErrors.slice(0, 3).map((error, index) => (
                      <div key={index} className="text-xs text-gray-700 bg-white rounded px-2 py-1">
                        <span className="font-medium">{error.type}</span>: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthDashboard;