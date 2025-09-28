/**
 * 缓存性能监控组件
 * 实时监控缓存性能指标和系统健康状态
 */

import React, { useState, useEffect } from 'react';
import type { CacheStats } from '../../services/smartCacheService';

interface CachePerformanceMonitorProps {
  stats: CacheStats;
  onRefresh: () => void;
  className?: string;
}

interface PerformanceHistory {
  timestamp: Date;
  hitRate: number;
  responseTime: number;
  totalSize: number;
  requestCount: number;
}

export const CachePerformanceMonitor: React.FC<CachePerformanceMonitorProps> = ({
  stats,
  onRefresh,
  className = ''
}) => {
  const [history, setHistory] = useState<PerformanceHistory[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alertThresholds, setAlertThresholds] = useState({
    hitRate: 0.6, // 命中率低于60%告警
    responseTime: 1000, // 响应时间超过1秒告警
    memoryUsage: 80 * 1024 * 1024 // 内存使用超过80MB告警
  });

  // 记录性能历史
  useEffect(() => {
    if (!isMonitoring) return;

    const newRecord: PerformanceHistory = {
      timestamp: new Date(),
      hitRate: stats.hitRate,
      responseTime: stats.performance.avgAccessTime,
      totalSize: stats.totalSize,
      requestCount: stats.performance.totalRequests
    };

    setHistory(prev => {
      const updated = [...prev, newRecord];
      // 保留最近100条记录
      return updated.slice(-100);
    });
  }, [stats, isMonitoring]);

  // 获取性能趋势
  const getPerformanceTrend = (metric: keyof PerformanceHistory): 'up' | 'down' | 'stable' => {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-5);
    const values = recent.map(h => h[metric] as number);
    const trend = values[values.length - 1] - values[0];
    
    if (Math.abs(trend) < 0.01) return 'stable';
    return trend > 0 ? 'up' : 'down';
  };

  // 获取趋势图标
  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  // 获取趋势颜色
  const getTrendColor = (metric: string, trend: 'up' | 'down' | 'stable'): string => {
    if (trend === 'stable') return 'text-gray-500';
    
    // 对于命中率，上升是好的
    if (metric === 'hitRate') {
      return trend === 'up' ? 'text-green-500' : 'text-red-500';
    }
    
    // 对于响应时间和内存使用，下降是好的
    if (metric === 'responseTime' || metric === 'totalSize') {
      return trend === 'down' ? 'text-green-500' : 'text-red-500';
    }
    
    return 'text-gray-500';
  };

  // 检查告警
  const getAlerts = (): Array<{ type: 'warning' | 'error'; message: string }> => {
    const alerts: Array<{ type: 'warning' | 'error'; message: string }> = [];
    
    if (stats.hitRate < alertThresholds.hitRate) {
      alerts.push({
        type: 'error',
        message: `缓存命中率过低: ${(stats.hitRate * 100).toFixed(1)}% (阈值: ${(alertThresholds.hitRate * 100).toFixed(1)}%)`
      });
    }
    
    if (stats.performance.avgAccessTime > alertThresholds.responseTime) {
      alerts.push({
        type: 'warning',
        message: `响应时间过长: ${stats.performance.avgAccessTime.toFixed(1)}ms (阈值: ${alertThresholds.responseTime}ms)`
      });
    }
    
    if (stats.totalSize > alertThresholds.memoryUsage) {
      alerts.push({
        type: 'warning',
        message: `内存使用过高: ${(stats.totalSize / 1024 / 1024).toFixed(1)}MB (阈值: ${(alertThresholds.memoryUsage / 1024 / 1024).toFixed(1)}MB)`
      });
    }
    
    return alerts;
  };

  // 计算性能评分
  const calculatePerformanceScore = (): number => {
    let score = 100;
    
    // 命中率评分 (40%)
    const hitRateScore = Math.min(100, stats.hitRate * 125); // 80%命中率 = 100分
    score = score * 0.6 + hitRateScore * 0.4;
    
    // 响应时间评分 (30%)
    const responseTimeScore = Math.max(0, 100 - (stats.performance.avgAccessTime / 10));
    score = score * 0.7 + responseTimeScore * 0.3;
    
    // 内存使用评分 (30%)
    const memoryScore = Math.max(0, 100 - (stats.totalSize / (100 * 1024 * 1024)) * 100);
    score = score * 0.7 + memoryScore * 0.3;
    
    return Math.round(score);
  };

  const performanceScore = calculatePerformanceScore();
  const alerts = getAlerts();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 标题和控制 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 缓存性能监控
        </h3>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isMonitoring}
              onChange={(e) => setIsMonitoring(e.target.checked)}
              className="rounded"
            />
            实时监控
          </label>
          
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 性能评分 */}
      <div className="mb-6">
        <div className="flex items-center justify-center">
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
                stroke={performanceScore >= 80 ? '#10b981' : performanceScore >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(performanceScore / 100) * 314} 314`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{performanceScore}</div>
                <div className="text-xs text-gray-600">性能评分</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-2">
          <span className={`text-sm font-medium ${
            performanceScore >= 80 ? 'text-green-600' :
            performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {performanceScore >= 80 ? '优秀' :
             performanceScore >= 60 ? '良好' : '需要优化'}
          </span>
        </div>
      </div>

      {/* 告警信息 */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">⚠️ 性能告警</h4>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  alert.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">命中率</span>
            <span className={`text-sm ${getTrendColor('hitRate', getPerformanceTrend('hitRate'))}`}>
              {getTrendIcon(getPerformanceTrend('hitRate'))}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {(stats.hitRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {stats.performance.cacheHits}/{stats.performance.totalRequests} 请求
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">响应时间</span>
            <span className={`text-sm ${getTrendColor('responseTime', getPerformanceTrend('responseTime'))}`}>
              {getTrendIcon(getPerformanceTrend('responseTime'))}
            </span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.performance.avgAccessTime.toFixed(1)}ms
          </div>
          <div className="text-xs text-gray-500">
            平均访问时间
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">内存使用</span>
            <span className={`text-sm ${getTrendColor('totalSize', getPerformanceTrend('totalSize'))}`}>
              {getTrendIcon(getPerformanceTrend('totalSize'))}
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {(stats.totalSize / 1024 / 1024).toFixed(1)}MB
          </div>
          <div className="text-xs text-gray-500">
            {stats.itemCount} 个缓存项
          </div>
        </div>
      </div>

      {/* 性能历史图表 */}
      {history.length > 1 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">📈 性能趋势</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 命中率趋势 */}
              <div>
                <div className="text-xs text-gray-600 mb-2">命中率趋势</div>
                <div className="flex items-end gap-1 h-16">
                  {history.slice(-20).map((record, index) => (
                    <div
                      key={index}
                      className="bg-blue-400 rounded-t"
                      style={{
                        height: `${record.hitRate * 100}%`,
                        width: '4px',
                        minHeight: '2px'
                      }}
                      title={`${(record.hitRate * 100).toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>

              {/* 响应时间趋势 */}
              <div>
                <div className="text-xs text-gray-600 mb-2">响应时间趋势</div>
                <div className="flex items-end gap-1 h-16">
                  {history.slice(-20).map((record, index) => {
                    const maxTime = Math.max(...history.map(h => h.responseTime));
                    const height = maxTime > 0 ? (record.responseTime / maxTime) * 100 : 0;
                    return (
                      <div
                        key={index}
                        className="bg-green-400 rounded-t"
                        style={{
                          height: `${height}%`,
                          width: '4px',
                          minHeight: '2px'
                        }}
                        title={`${record.responseTime.toFixed(1)}ms`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 告警阈值配置 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">⚙️ 告警阈值配置</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">命中率阈值 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={alertThresholds.hitRate * 100}
              onChange={(e) => setAlertThresholds({
                ...alertThresholds,
                hitRate: Number(e.target.value) / 100
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">响应时间阈值 (ms)</label>
            <input
              type="number"
              min="0"
              value={alertThresholds.responseTime}
              onChange={(e) => setAlertThresholds({
                ...alertThresholds,
                responseTime: Number(e.target.value)
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">内存阈值 (MB)</label>
            <input
              type="number"
              min="0"
              value={alertThresholds.memoryUsage / 1024 / 1024}
              onChange={(e) => setAlertThresholds({
                ...alertThresholds,
                memoryUsage: Number(e.target.value) * 1024 * 1024
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CachePerformanceMonitor;