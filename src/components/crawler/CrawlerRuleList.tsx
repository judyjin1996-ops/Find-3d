import React, { useState } from 'react';
import { Card, Button, Icon, Badge, Tooltip, Loading } from '../ui';
import type { CrawlerRule, TestResult } from '../../crawler/types/crawler';

interface CrawlerRuleListProps {
  rules: CrawlerRule[];
  selectedRules: string[];
  testingRules: Set<string>;
  onSelectRule: (ruleId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (rule: CrawlerRule) => void;
  onDelete: (ruleId: string) => void;
  onToggleActive: (ruleId: string) => void;
  onTest: (ruleId: string, keyword?: string) => Promise<TestResult>;
}

export const CrawlerRuleList: React.FC<CrawlerRuleListProps> = ({
  rules,
  selectedRules,
  testingRules,
  onSelectRule,
  onSelectAll,
  onEdit,
  onDelete,
  onToggleActive,
  onTest
}) => {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // 处理测试规则
  const handleTestRule = async (ruleId: string, keyword?: string) => {
    try {
      const result = await onTest(ruleId, keyword);
      setTestResults(prev => ({ ...prev, [ruleId]: result }));
    } catch (error) {
      console.error('测试规则失败:', error);
    }
  };

  // 切换规则展开状态
  const toggleExpanded = (ruleId: string) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  // 格式化时间
  const formatDate = (date?: Date) => {
    if (!date) return '从未测试';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // 获取测试状态徽章
  const getTestStatusBadge = (rule: CrawlerRule) => {
    if (testingRules.has(rule.id)) {
      return <Badge variant="warning" size="sm">测试中</Badge>;
    }
    
    switch (rule.testStatus) {
      case 'success':
        return <Badge variant="success" size="sm">测试通过</Badge>;
      case 'failed':
        return <Badge variant="error" size="sm">测试失败</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">待测试</Badge>;
      default:
        return <Badge variant="default" size="sm">未测试</Badge>;
    }
  };

  const allSelected = rules.length > 0 && selectedRules.length === rules.length;
  const someSelected = selectedRules.length > 0 && selectedRules.length < rules.length;

  return (
    <div className="space-y-4">
      {/* 表头 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-sketch-text">
              {rules.length} 个规则
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-sketch-muted">
            <span>状态</span>
            <span>类型</span>
            <span>最后测试</span>
            <span>操作</span>
          </div>
        </div>
      </Card>

      {/* 规则列表 */}
      <div className="space-y-3">
        {rules.map((rule) => {
          const isSelected = selectedRules.includes(rule.id);
          const isExpanded = expandedRules.has(rule.id);
          const isTesting = testingRules.has(rule.id);
          const testResult = testResults[rule.id];

          return (
            <Card key={rule.id} className={`transition-all duration-200 ${
              isSelected ? 'ring-2 ring-sketch-accent' : ''
            }`}>
              <div className="p-4">
                {/* 主要信息行 */}
                <div className="flex items-center gap-4">
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectRule(rule.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />

                  {/* 网站图标和名称 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {rule.websiteIcon ? (
                      <img
                        src={rule.websiteIcon}
                        alt={rule.websiteName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-sketch-background rounded-full flex items-center justify-center">
                        <Icon name="globe" size="sm" className="text-sketch-muted" />
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sketch-text truncate">
                          {rule.websiteName}
                        </h3>
                        {rule.isPreset && (
                          <Badge variant="info" size="xs">预设</Badge>
                        )}
                      </div>
                      <p className="text-sm text-sketch-muted truncate">
                        {rule.baseUrl}
                      </p>
                    </div>
                  </div>

                  {/* 状态信息 */}
                  <div className="flex items-center gap-4">
                    {/* 启用状态 */}
                    <Tooltip content={rule.isActive ? '已启用' : '已禁用'}>
                      <button
                        onClick={() => onToggleActive(rule.id)}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          rule.isActive 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          rule.isActive ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </Tooltip>

                    {/* 测试状态 */}
                    <div className="text-center">
                      {getTestStatusBadge(rule)}
                      <div className="text-xs text-sketch-muted mt-1">
                        {formatDate(rule.lastTested)}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <Tooltip content="测试规则">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestRule(rule.id)}
                          disabled={isTesting}
                          icon={isTesting ? 
                            <Loading size="xs" /> : 
                            <Icon name="play" size="sm" />
                          }
                        />
                      </Tooltip>

                      <Tooltip content="编辑规则">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(rule)}
                          icon={<Icon name="edit" size="sm" />}
                        />
                      </Tooltip>

                      <Tooltip content="删除规则">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`确定要删除规则"${rule.websiteName}"吗？`)) {
                              onDelete(rule.id);
                            }
                          }}
                          icon={<Icon name="trash-2" size="sm" />}
                          className="text-red-600 hover:text-red-700"
                        />
                      </Tooltip>

                      <Tooltip content={isExpanded ? '收起详情' : '展开详情'}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpanded(rule.id)}
                          icon={<Icon 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size="sm" 
                          />}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* 展开的详细信息 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-sketch-border">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* 基本配置 */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sketch-text">基本配置</h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">搜索URL模板:</span>
                            <span className="text-sketch-text font-mono text-xs truncate max-w-xs">
                              {rule.searchUrlTemplate}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">请求方法:</span>
                            <Badge variant="default" size="xs">
                              {rule.searchMethod}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">测试关键词:</span>
                            <span className="text-sketch-text">
                              {rule.testKeyword || '未设置'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sketch-muted">请求延迟:</span>
                            <span className="text-sketch-text">
                              {rule.antiBot.delay}ms
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 选择器配置 */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sketch-text">选择器配置</h4>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-sketch-muted">结果列表:</span>
                            <code className="block text-xs bg-sketch-background p-1 rounded mt-1">
                              {rule.selectors.resultList}
                            </code>
                          </div>
                          
                          <div>
                            <span className="text-sketch-muted">详情链接:</span>
                            <code className="block text-xs bg-sketch-background p-1 rounded mt-1">
                              {rule.selectors.resultLink}
                            </code>
                          </div>
                          
                          <div>
                            <span className="text-sketch-muted">标题:</span>
                            <code className="block text-xs bg-sketch-background p-1 rounded mt-1">
                              {rule.selectors.title}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 测试结果 */}
                    {testResult && (
                      <div className="mt-4 pt-4 border-t border-sketch-border">
                        <h4 className="font-medium text-sketch-text mb-3">最近测试结果</h4>
                        
                        <div className="bg-sketch-background rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Icon 
                                name={testResult.success ? "check-circle" : "x-circle"} 
                                size="sm" 
                                className={testResult.success ? "text-green-500" : "text-red-500"}
                              />
                              <span className={`font-medium ${
                                testResult.success ? "text-green-700" : "text-red-700"
                              }`}>
                                {testResult.success ? '测试成功' : '测试失败'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-sketch-muted">
                              耗时: {testResult.performance.totalTime}ms
                            </div>
                          </div>
                          
                          {testResult.success ? (
                            <div>
                              <p className="text-sm text-sketch-text mb-2">
                                成功提取 {testResult.results.length} 个结果
                              </p>
                              {testResult.results.slice(0, 3).map((result, index) => (
                                <div key={index} className="text-xs text-sketch-muted mb-1">
                                  • {result.title}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-red-600 mb-2">错误信息:</p>
                              {testResult.errors.map((error, index) => (
                                <div key={index} className="text-xs text-red-500 mb-1">
                                  • {error}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {rules.length === 0 && (
        <Card className="p-8 text-center">
          <Icon name="search" size="lg" className="mx-auto text-sketch-muted mb-4" />
          <h3 className="text-lg font-medium text-sketch-text mb-2">
            没有找到匹配的规则
          </h3>
          <p className="text-sketch-muted">
            尝试调整搜索条件或添加新的爬虫规则
          </p>
        </Card>
      )}
    </div>
  );
};