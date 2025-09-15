import React, { useState, useRef } from 'react';
import { Button, Icon, Badge } from '../ui';
import type { CrawlerRule } from '../../crawler/types/crawler';

interface CrawlerRuleImportExportProps {
  rules: CrawlerRule[];
  onImport: (configFile: File) => void;
  onExport: (ruleIds: string[]) => void;
  onClose: () => void;
}

export const CrawlerRuleImportExport: React.FC<CrawlerRuleImportExportProps> = ({
  rules,
  onImport,
  onExport,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<CrawlerRule[] | null>(null);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 验证数据格式
      if (!Array.isArray(data)) {
        throw new Error('配置文件格式错误：应该是规则数组');
      }
      
      // 验证每个规则的基本字段
      const validRules: CrawlerRule[] = [];
      for (const rule of data) {
        if (!rule.websiteName || !rule.baseUrl || !rule.searchUrlTemplate) {
          throw new Error(`规则"${rule.websiteName || '未知'}"缺少必要字段`);
        }
        validRules.push(rule);
      }
      
      setImportPreview(validRules);
      setImportError('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '文件解析失败');
      setImportPreview(null);
    }
  };

  // 执行导入
  const handleImport = () => {
    if (importPreview && fileInputRef.current?.files?.[0]) {
      onImport(fileInputRef.current.files[0]);
      onClose();
    }
  };

  // 执行导出
  const handleExport = () => {
    const rulesToExport = selectedRules.length > 0 
      ? selectedRules 
      : rules.map(r => r.id);
    
    onExport(rulesToExport);
    onClose();
  };

  // 切换规则选择
  const toggleRuleSelection = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId)
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedRules.length === rules.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(rules.map(r => r.id));
    }
  };

  // 生成示例配置
  const generateSampleConfig = () => {
    const sampleRule: Partial<CrawlerRule> = {
      websiteName: "示例网站",
      websiteIcon: "https://example.com/icon.png",
      baseUrl: "https://example.com",
      isActive: true,
      isPreset: false,
      searchUrlTemplate: "https://example.com/search?q={keyword}&page={page}",
      searchMethod: "GET",
      searchHeaders: {
        "User-Agent": "Mozilla/5.0 (compatible; Find3D-Bot/1.0)"
      },
      selectors: {
        resultList: ".search-results .item",
        resultLink: "a.title-link",
        title: "h1.title",
        description: ".description",
        previewImages: ".preview-img",
        price: ".price",
        isFree: ".free-tag",
        fileFormat: ".format",
        fileSize: ".size",
        downloadCount: ".downloads",
        rating: ".rating",
        tags: ".tags a",
        author: ".author",
        uploadDate: ".date"
      },
      dataProcessing: {
        priceRegex: "\\d+(\\.\\d+)?",
        dateFormat: "YYYY-MM-DD",
        tagSeparator: ",",
        imageUrlPrefix: "https://example.com"
      },
      antiBot: {
        useHeadlessBrowser: false,
        waitForSelector: ".content-loaded",
        delay: 1000,
        userAgent: "",
        enableProxy: false
      },
      testKeyword: "手机"
    };

    const blob = new Blob([JSON.stringify([sampleRule], null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crawler-rule-sample.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 标签页导航 */}
      <div className="border-b border-sketch-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-sketch-accent text-sketch-accent'
                : 'border-transparent text-sketch-muted hover:text-sketch-text'
            }`}
          >
            <Icon name="upload" size="sm" className="inline mr-2" />
            导入规则
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-sketch-accent text-sketch-accent'
                : 'border-transparent text-sketch-muted hover:text-sketch-text'
            }`}
          >
            <Icon name="download" size="sm" className="inline mr-2" />
            导出规则
          </button>
        </nav>
      </div>

      {/* 导入标签页 */}
      {activeTab === 'import' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-sketch-text mb-2">
              导入爬虫规则
            </h3>
            <p className="text-sketch-muted text-sm">
              选择JSON格式的规则配置文件进行导入
            </p>
          </div>

          {/* 文件选择 */}
          <div className="border-2 border-dashed border-sketch-border rounded-lg p-6">
            <div className="text-center">
              <Icon name="upload-cloud" size="lg" className="mx-auto text-sketch-muted mb-4" />
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Icon name="file" size="sm" />}
                >
                  选择配置文件
                </Button>
                
                <p className="text-sm text-sketch-muted">
                  支持JSON格式的规则配置文件
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* 导入错误 */}
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon name="alert-circle" size="sm" className="text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-medium">导入失败</h4>
                  <p className="text-red-700 text-sm mt-1">{importError}</p>
                </div>
              </div>
            </div>
          )}

          {/* 导入预览 */}
          {importPreview && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Icon name="check-circle" size="sm" className="text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-green-800 font-medium">文件解析成功</h4>
                    <p className="text-green-700 text-sm mt-1">
                      发现 {importPreview.length} 个有效规则
                    </p>
                  </div>
                </div>
              </div>

              {/* 规则预览列表 */}
              <div className="border border-sketch-border rounded-lg">
                <div className="p-3 border-b border-sketch-border bg-sketch-background">
                  <h4 className="font-medium text-sketch-text">规则预览</h4>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {importPreview.map((rule, index) => (
                    <div key={index} className="p-3 border-b border-sketch-border last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-sketch-text">
                            {rule.websiteName}
                          </h5>
                          <p className="text-sm text-sketch-muted">
                            {rule.baseUrl}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {rule.isPreset && (
                            <Badge variant="info" size="xs">预设</Badge>
                          )}
                          <Badge 
                            variant={rule.isActive ? "success" : "default"} 
                            size="xs"
                          >
                            {rule.isActive ? '启用' : '禁用'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 示例配置下载 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icon name="info" size="sm" className="text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-blue-800 font-medium">需要配置示例？</h4>
                <p className="text-blue-700 text-sm mt-1">
                  下载示例配置文件来了解正确的格式
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSampleConfig}
                icon={<Icon name="download" size="sm" />}
              >
                下载示例
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 导出标签页 */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-sketch-text mb-2">
              导出爬虫规则
            </h3>
            <p className="text-sketch-muted text-sm">
              选择要导出的规则，将生成JSON格式的配置文件
            </p>
          </div>

          {/* 规则选择 */}
          <div className="border border-sketch-border rounded-lg">
            <div className="p-3 border-b border-sketch-border bg-sketch-background">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sketch-text">选择规则</h4>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-sketch-muted">
                    已选择 {selectedRules.length} / {rules.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedRules.length === rules.length ? '取消全选' : '全选'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {rules.map((rule) => (
                <div key={rule.id} className="p-3 border-b border-sketch-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedRules.includes(rule.id)}
                      onChange={() => toggleRuleSelection(rule.id)}
                      className="rounded border-gray-300"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sketch-text">
                          {rule.websiteName}
                        </h5>
                        {rule.isPreset && (
                          <Badge variant="info" size="xs">预设</Badge>
                        )}
                        <Badge 
                          variant={rule.isActive ? "success" : "default"} 
                          size="xs"
                        >
                          {rule.isActive ? '启用' : '禁用'}
                        </Badge>
                      </div>
                      <p className="text-sm text-sketch-muted">
                        {rule.baseUrl}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 导出选项 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-sketch-text mb-2">导出选项</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-sketch-muted">文件格式:</span>
                <Badge variant="default" size="sm">JSON</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sketch-muted">包含字段:</span>
                <span className="text-sketch-text">完整配置</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sketch-muted">文件名:</span>
                <span className="text-sketch-text font-mono text-xs">
                  crawler-rules-{new Date().toISOString().split('T')[0]}.json
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-sketch-border">
        <Button
          variant="outline"
          onClick={onClose}
        >
          取消
        </Button>
        
        {activeTab === 'import' ? (
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!importPreview}
            icon={<Icon name="upload" size="sm" />}
          >
            导入规则
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={selectedRules.length === 0 && rules.length === 0}
            icon={<Icon name="download" size="sm" />}
          >
            导出规则
          </Button>
        )}
      </div>
    </div>
  );
};