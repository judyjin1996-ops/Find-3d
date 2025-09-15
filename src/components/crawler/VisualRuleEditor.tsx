import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Button, Icon, Badge, Tooltip, Loading } from '../ui';
import type { CrawlerRule } from '../../crawler/types/crawler';

interface PreviewResult {
  elements: Array<{
    text: string;
    html: string;
    attributes: Record<string, string>;
    xpath: string;
    cssSelector: string;
  }>;
  count: number;
  screenshot?: string;
}

interface VisualRuleEditorProps {
  websiteUrl: string;
  currentRule: CrawlerRule;
  onRuleChange: (rule: Partial<CrawlerRule>) => void;
  onPreview: (selector: string) => Promise<PreviewResult>;
  className?: string;
}

export const VisualRuleEditor: React.FC<VisualRuleEditorProps> = ({
  websiteUrl,
  currentRule,
  onRuleChange,
  onPreview,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewResults, setPreviewResults] = useState<Record<string, PreviewResult>>({});
  const [selectedField, setSelectedField] = useState<string>('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectMode, setInspectMode] = useState<'click' | 'hover'>('click');
  const [showPreview, setShowPreview] = useState(true);
  const [previewScale, setPreviewScale] = useState(0.5);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // 选择器字段配置
  const selectorFields = [
    { key: 'resultList', label: '结果列表', description: '搜索结果的容器元素', required: true },
    { key: 'resultLink', label: '详情链接', description: '指向详情页的链接元素', required: true },
    { key: 'title', label: '标题', description: '素材标题元素', required: true },
    { key: 'description', label: '描述', description: '素材描述元素', required: false },
    { key: 'previewImages', label: '预览图', description: '预览图片元素', required: false },
    { key: 'price', label: '价格', description: '价格信息元素', required: false },
    { key: 'isFree', label: '免费标识', description: '免费标识元素', required: false },
    { key: 'fileFormat', label: '文件格式', description: '文件格式信息', required: false },
    { key: 'fileSize', label: '文件大小', description: '文件大小信息', required: false },
    { key: 'downloadCount', label: '下载数', description: '下载次数信息', required: false },
    { key: 'rating', label: '评分', description: '评分信息', required: false },
    { key: 'tags', label: '标签', description: '标签元素', required: false },
    { key: 'author', label: '作者', description: '作者信息', required: false },
    { key: 'uploadDate', label: '上传日期', description: '上传时间信息', required: false }
  ];

  // 处理iframe加载完成
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    
    // 注入选择器脚本
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        
        // 注入样式
        const style = doc.createElement('style');
        style.textContent = `
          .visual-editor-highlight {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 2px !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
            cursor: pointer !important;
          }
          .visual-editor-selected {
            outline: 2px solid #ef4444 !important;
            outline-offset: 2px !important;
            background-color: rgba(239, 68, 68, 0.1) !important;
          }
          .visual-editor-tooltip {
            position: absolute;
            background: #1f2937;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
          }
        `;
        doc.head.appendChild(style);
        
        // 注入交互脚本
        const script = doc.createElement('script');
        script.textContent = `
          let isInspecting = false;
          let selectedElement = null;
          let tooltip = null;
          
          function createTooltip() {
            tooltip = document.createElement('div');
            tooltip.className = 'visual-editor-tooltip';
            document.body.appendChild(tooltip);
          }
          
          function updateTooltip(element, event) {
            if (!tooltip) createTooltip();
            const selector = generateSelector(element);
            tooltip.textContent = selector;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - 30 + 'px';
            tooltip.style.display = 'block';
          }
          
          function hideTooltip() {
            if (tooltip) {
              tooltip.style.display = 'none';
            }
          }
          
          function generateSelector(element) {
            if (element.id) {
              return '#' + element.id;
            }
            
            let selector = element.tagName.toLowerCase();
            
            if (element.className) {
              const classes = element.className.split(' ')
                .filter(cls => cls && !cls.startsWith('visual-editor-'))
                .slice(0, 2);
              if (classes.length > 0) {
                selector += '.' + classes.join('.');
              }
            }
            
            // 添加nth-child如果有同级元素
            const siblings = Array.from(element.parentNode?.children || [])
              .filter(el => el.tagName === element.tagName);
            if (siblings.length > 1) {
              const index = siblings.indexOf(element) + 1;
              selector += ':nth-child(' + index + ')';
            }
            
            return selector;
          }
          
          function handleMouseOver(event) {
            if (!isInspecting) return;
            
            const element = event.target;
            if (element === selectedElement) return;
            
            // 清除之前的高亮
            document.querySelectorAll('.visual-editor-highlight').forEach(el => {
              el.classList.remove('visual-editor-highlight');
            });
            
            // 高亮当前元素
            element.classList.add('visual-editor-highlight');
            
            // 显示工具提示
            updateTooltip(element, event);
          }
          
          function handleMouseOut(event) {
            if (!isInspecting) return;
            
            const element = event.target;
            element.classList.remove('visual-editor-highlight');
            hideTooltip();
          }
          
          function handleClick(event) {
            if (!isInspecting) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            const element = event.target;
            
            // 清除之前的选中状态
            document.querySelectorAll('.visual-editor-selected').forEach(el => {
              el.classList.remove('visual-editor-selected');
            });
            
            // 标记为选中
            element.classList.add('visual-editor-selected');
            selectedElement = element;
            
            // 生成选择器
            const selector = generateSelector(element);
            
            // 通知父窗口
            window.parent.postMessage({
              type: 'elementSelected',
              selector: selector,
              element: {
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                text: element.textContent?.trim().substring(0, 100),
                html: element.outerHTML.substring(0, 200),
                attributes: Array.from(element.attributes).reduce((acc, attr) => {
                  acc[attr.name] = attr.value;
                  return acc;
                }, {})
              }
            }, '*');
            
            hideTooltip();
          }
          
          // 监听来自父窗口的消息
          window.addEventListener('message', function(event) {
            if (event.data.type === 'startInspecting') {
              isInspecting = true;
              document.body.style.cursor = 'crosshair';
            } else if (event.data.type === 'stopInspecting') {
              isInspecting = false;
              document.body.style.cursor = 'default';
              
              // 清除所有高亮
              document.querySelectorAll('.visual-editor-highlight, .visual-editor-selected').forEach(el => {
                el.classList.remove('visual-editor-highlight', 'visual-editor-selected');
              });
              
              hideTooltip();
            } else if (event.data.type === 'highlightSelector') {
              const selector = event.data.selector;
              try {
                const elements = document.querySelectorAll(selector);
                
                // 清除之前的高亮
                document.querySelectorAll('.visual-editor-highlight').forEach(el => {
                  el.classList.remove('visual-editor-highlight');
                });
                
                // 高亮匹配的元素
                elements.forEach(el => {
                  el.classList.add('visual-editor-highlight');
                });
                
                // 滚动到第一个匹配的元素
                if (elements.length > 0) {
                  elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } catch (error) {
                console.error('Invalid selector:', selector);
              }
            }
          });
          
          // 绑定事件
          document.addEventListener('mouseover', handleMouseOver);
          document.addEventListener('mouseout', handleMouseOut);
          document.addEventListener('click', handleClick);
        `;
        doc.body.appendChild(script);
        
      } catch (error) {
        console.error('Failed to inject scripts:', error);
      }
    }
  }, []);

  // 监听来自iframe的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected') {
        const { selector, element } = event.data;
        
        if (selectedField) {
          // 更新选中字段的选择器
          const updatedSelectors = {
            ...currentRule.selectors,
            [selectedField]: selector
          };
          
          onRuleChange({
            selectors: updatedSelectors
          });
          
          // 预览选择器结果
          handlePreviewSelector(selectedField, selector);
        }
        
        setIsInspecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedField, currentRule.selectors, onRuleChange]);

  // 开始检查元素
  const startInspecting = (fieldKey: string) => {
    setSelectedField(fieldKey);
    setIsInspecting(true);
    
    // 通知iframe开始检查
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'startInspecting'
      }, '*');
    }
  };

  // 停止检查
  const stopInspecting = () => {
    setIsInspecting(false);
    setSelectedField('');
    
    // 通知iframe停止检查
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'stopInspecting'
      }, '*');
    }
  };

  // 预览选择器
  const handlePreviewSelector = async (fieldKey: string, selector: string) => {
    if (!selector.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await onPreview(selector);
      setPreviewResults(prev => ({
        ...prev,
        [fieldKey]: result
      }));
      
      // 在iframe中高亮显示匹配的元素
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'highlightSelector',
          selector: selector
        }, '*');
      }
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 更新选择器
  const updateSelector = (fieldKey: string, selector: string) => {
    const updatedSelectors = {
      ...currentRule.selectors,
      [fieldKey]: selector
    };
    
    onRuleChange({
      selectors: updatedSelectors
    });
  };

  // 生成智能选择器建议
  const generateSelectorSuggestions = (fieldKey: string): string[] => {
    const suggestions: Record<string, string[]> = {
      resultList: [
        '.search-results .item',
        '.results .result',
        '.list-item',
        'article',
        '.post',
        '.product'
      ],
      resultLink: [
        'a.title',
        'h2 a',
        '.title-link',
        '.item-link',
        'a[href*="/item/"]',
        'a[href*="/post/"]'
      ],
      title: [
        'h1',
        'h2.title',
        '.title',
        '.post-title',
        '.item-title',
        '.name'
      ],
      description: [
        '.description',
        '.excerpt',
        '.summary',
        '.content p:first-of-type',
        '.intro',
        '.desc'
      ],
      previewImages: [
        '.preview img',
        '.thumbnail img',
        '.gallery img:first-of-type',
        'img.preview',
        '.image img',
        '.photo img'
      ],
      price: [
        '.price',
        '.cost',
        '.amount',
        '.price-value',
        '.money',
        '[data-price]'
      ],
      isFree: [
        '.free',
        '.free-tag',
        '.price:contains("免费")',
        '[data-free="true"]',
        '.badge-free',
        '.label-free'
      ]
    };
    
    return suggestions[fieldKey] || [];
  };

  return (
    <div className={`visual-rule-editor ${className}`}>
      <div className="grid lg:grid-cols-2 gap-6 h-full">
        {/* 左侧：网页预览 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-sketch-text">
              网页预览
            </h3>
            
            <div className="flex items-center gap-2">
              <Tooltip content="缩放比例">
                <select
                  value={previewScale}
                  onChange={(e) => setPreviewScale(Number(e.target.value))}
                  className="px-2 py-1 border border-sketch-border rounded text-sm"
                >
                  <option value={0.3}>30%</option>
                  <option value={0.5}>50%</option>
                  <option value={0.7}>70%</option>
                  <option value={1}>100%</option>
                </select>
              </Tooltip>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                icon={<Icon name={showPreview ? "eye-off" : "eye"} size="sm" />}
              >
                {showPreview ? '隐藏' : '显示'}
              </Button>
            </div>
          </div>
          
          {showPreview && (
            <Card className="p-4 h-96 lg:h-[600px]">
              <div className="relative w-full h-full border border-sketch-border rounded overflow-hidden">
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-sketch-background">
                    <Loading size="lg" text="加载网页中..." />
                  </div>
                )}
                
                <iframe
                  ref={iframeRef}
                  src={websiteUrl}
                  className="w-full h-full"
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: `${100 / previewScale}%`,
                    height: `${100 / previewScale}%`
                  }}
                  onLoad={handleIframeLoad}
                  sandbox="allow-scripts allow-same-origin"
                />
                
                {isInspecting && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                      <Icon name="target" size="sm" />
                      <span className="text-sm">
                        点击页面元素选择 "{selectorFields.find(f => f.key === selectedField)?.label}"
                      </span>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={stopInspecting}
                        className="ml-2 text-white border-white hover:bg-white hover:text-blue-600"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* 右侧：选择器配置 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-sketch-text">
              选择器配置
            </h3>
            
            {isInspecting && (
              <Button
                variant="outline"
                size="sm"
                onClick={stopInspecting}
                icon={<Icon name="x" size="sm" />}
              >
                停止选择
              </Button>
            )}
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {selectorFields.map((field) => {
              const currentSelector = currentRule.selectors[field.key as keyof typeof currentRule.selectors] || '';
              const previewResult = previewResults[field.key];
              const suggestions = generateSelectorSuggestions(field.key);
              
              return (
                <Card key={field.key} className="p-4">
                  <div className="space-y-3">
                    {/* 字段标题和描述 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sketch-text">
                            {field.label}
                          </h4>
                          {field.required && (
                            <Badge variant="error" size="xs">必填</Badge>
                          )}
                        </div>
                        <p className="text-xs text-sketch-muted mt-1">
                          {field.description}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startInspecting(field.key)}
                        disabled={isInspecting}
                        icon={<Icon name="target" size="sm" />}
                      >
                        选择
                      </Button>
                    </div>
                    
                    {/* 选择器输入 */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentSelector}
                          onChange={(e) => updateSelector(field.key, e.target.value)}
                          placeholder={`输入${field.label}的CSS选择器`}
                          className="flex-1 px-3 py-2 border border-sketch-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-accent text-sm font-mono"
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewSelector(field.key, currentSelector)}
                          disabled={!currentSelector.trim() || isLoading}
                          icon={isLoading ? <Loading size="xs" /> : <Icon name="eye" size="sm" />}
                        >
                          预览
                        </Button>
                      </div>
                      
                      {/* 智能建议 */}
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-sketch-muted">建议:</span>
                          {suggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                updateSelector(field.key, suggestion);
                                handlePreviewSelector(field.key, suggestion);
                              }}
                              className="text-xs bg-sketch-background hover:bg-sketch-border px-2 py-1 rounded font-mono"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* 预览结果 */}
                    {previewResult && (
                      <div className="bg-sketch-background rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-sketch-text">
                            预览结果
                          </span>
                          <Badge 
                            variant={previewResult.count > 0 ? "success" : "warning"} 
                            size="sm"
                          >
                            {previewResult.count} 个匹配
                          </Badge>
                        </div>
                        
                        {previewResult.count > 0 ? (
                          <div className="space-y-2">
                            {previewResult.elements.slice(0, 3).map((element, index) => (
                              <div key={index} className="text-xs bg-white p-2 rounded border">
                                <div className="font-medium text-sketch-text mb-1">
                                  {element.text.substring(0, 50)}
                                  {element.text.length > 50 && '...'}
                                </div>
                                <div className="text-sketch-muted font-mono">
                                  {element.cssSelector}
                                </div>
                              </div>
                            ))}
                            
                            {previewResult.elements.length > 3 && (
                              <div className="text-xs text-sketch-muted text-center">
                                还有 {previewResult.elements.length - 3} 个匹配项...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-sketch-muted">
                            没有找到匹配的元素，请检查选择器是否正确
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};