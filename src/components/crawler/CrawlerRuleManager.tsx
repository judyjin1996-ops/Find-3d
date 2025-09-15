import React, { useState, useCallback } from 'react';
import { Card, Button, Icon, Modal, Badge, Tooltip, Loading } from '../ui';
import { CrawlerRuleForm } from './CrawlerRuleForm';
import { CrawlerRuleList } from './CrawlerRuleList';
import { CrawlerRuleImportExport } from './CrawlerRuleImportExport';
import type { CrawlerRule, TestResult } from '../../crawler/types/crawler';

interface CrawlerRuleManagerProps {
  rules: CrawlerRule[];
  onAdd: (rule: CrawlerRule) => void;
  onEdit: (id: string, rule: CrawlerRule) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onTest: (id: string, keyword: string) => Promise<TestResult>;
  onImport: (configFile: File) => void;
  onExport: (ruleIds: string[]) => void;
  className?: string;
}

export const CrawlerRuleManager: React.FC<CrawlerRuleManagerProps> = ({
  rules,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  onTest,
  onImport,
  onExport,
  className = ''
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CrawlerRule | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [testingRules, setTestingRules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // 处理添加规则
  const handleAddRule = useCallback((rule: Omit<CrawlerRule, 'id'>) => {
    const newRule: CrawlerRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    onAdd(newRule);
    setShowAddModal(false);
  }, [onAdd]);

  // 处理编辑规则
  const handleEditRule = useCallback((rule: CrawlerRule) => {
    if (editingRule) {
      onEdit(editingRule.id, rule);
      setEditingRule(null);
    }
  }, [editingRule, onEdit]);

  // 处理测试规则
  const handleTestRule = useCallback(async (ruleId: string, keyword?: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const testKeyword = keyword || rule.testKeyword || '手机';
    
    setTestingRules(prev => new Set(prev).add(ruleId));
    
    try {
      const result = await onTest(ruleId, testKeyword);
      
      // 更新规则的测试状态
      const updatedRule: CrawlerRule = {
        ...rule,
        lastTested: new Date(),
        testStatus: result.success ? 'success' : 'failed'
      };
      
      onEdit(ruleId, updatedRule);
      
      return result;
    } catch (error) {
      console.error('测试规则失败:', error);
      
      // 更新为失败状态
      const updatedRule: CrawlerRule = {
        ...rule,
        lastTested: new Date(),
        testStatus: 'failed'
      };
      
      onEdit(ruleId, updatedRule);
      
      throw error;
    } finally {
      setTestingRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleId);
        return newSet;
      });
    }
  }, [rules, onTest, onEdit]);

  // 处理批量操作
  const handleBatchToggleActive = useCallback(() => {
    selectedRules.forEach(ruleId => {
      onToggleActive(ruleId);
    });
    setSelectedRules([]);
  }, [selectedRules, onToggleActive]);

  const handleBatchDelete = useCallback(() => {
    if (window.confirm(`确定要删除选中的 ${selectedRules.length} 个规则吗？`)) {
      selectedRules.forEach(ruleId => {
        onDelete(ruleId);
      });
      setSelectedRules([]);
    }
  }, [selectedRules, onDelete]);

  const handleBatchExport = useCallback(() => {
    onExport(selectedRules);
    setSelectedRules([]);
  }, [selectedRules, onExport]);

  // 过滤规则
  const filteredRules = rules.filter(rule => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!rule.websiteName.toLowerCase().includes(query) &&
          !rule.baseUrl.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // 状态过滤
    if (filterStatus === 'active' && !rule.isActive) return false;
    if (filterStatus === 'inactive' && rule.isActive) return false;
    
    return true;
  });

  // 统计信息
  const stats = {
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    inactive: rules.filter(r => !r.isActive).length,
    preset: rules.filter(r => r.isPreset).length,
    custom: rules.filter(r => !r.isPreset).length
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-sketch-text">
            爬虫规则管理
          </h2>
          <p className="text-sketch-muted mt-1">
            管理网站爬虫规则，配置数据提取逻辑
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportExport(true)}
            icon={<Icon name="upload" size="sm" />}
          >
            导入/导出
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            icon={<Icon name="plus" size="sm" />}
          >
            添加规则
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-sketch-text">{stats.total}</div>
          <div className="text-sm text-sketch-muted">总规则数</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-sketch-muted">已启用</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
          <div className="text-sm text-sketch-muted">已禁用</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.preset}</div>
          <div className="text-sm text-sketch-muted">预设规则</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.custom}</div>
          <div className="text-sm text-sketch-muted">自定义规则</div>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Icon 
                name="search" 
                size="sm" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sketch-muted" 
              />
              <input
                type="text"
                placeholder="搜索规则名称或网站..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-sketch-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent"
              />
            </div>
          </div>
          
          {/* 状态过滤 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-sketch-muted">状态:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-sketch-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent"
            >
              <option value="all">全部</option>
              <option value="active">已启用</option>
              <option value="inactive">已禁用</option>
            </select>
          </div>
          
          {/* 批量操作 */}
          {selectedRules.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                已选择 {selectedRules.length} 项
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchToggleActive}
                icon={<Icon name="toggle-left" size="sm" />}
              >
                切换状态
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchExport}
                icon={<Icon name="download" size="sm" />}
              >
                导出
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
                icon={<Icon name="trash-2" size="sm" />}
                className="text-red-600 hover:text-red-700"
              >
                删除
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 规则列表 */}
      <CrawlerRuleList
        rules={filteredRules}
        selectedRules={selectedRules}
        testingRules={testingRules}
        onSelectRule={(ruleId, selected) => {
          if (selected) {
            setSelectedRules(prev => [...prev, ruleId]);
          } else {
            setSelectedRules(prev => prev.filter(id => id !== ruleId));
          }
        }}
        onSelectAll={(selected) => {
          if (selected) {
            setSelectedRules(filteredRules.map(r => r.id));
          } else {
            setSelectedRules([]);
          }
        }}
        onEdit={(rule) => setEditingRule(rule)}
        onDelete={onDelete}
        onToggleActive={onToggleActive}
        onTest={handleTestRule}
      />

      {/* 添加规则模态框 */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加爬虫规则"
        size="xl"
      >
        <CrawlerRuleForm
          onSubmit={handleAddRule}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* 编辑规则模态框 */}
      <Modal
        open={!!editingRule}
        onClose={() => setEditingRule(null)}
        title="编辑爬虫规则"
        size="xl"
      >
        {editingRule && (
          <CrawlerRuleForm
            initialRule={editingRule}
            onSubmit={handleEditRule}
            onCancel={() => setEditingRule(null)}
          />
        )}
      </Modal>

      {/* 导入导出模态框 */}
      <Modal
        open={showImportExport}
        onClose={() => setShowImportExport(false)}
        title="导入/导出规则"
        size="lg"
      >
        <CrawlerRuleImportExport
          rules={rules}
          onImport={onImport}
          onExport={onExport}
          onClose={() => setShowImportExport(false)}
        />
      </Modal>
    </div>
  );
};