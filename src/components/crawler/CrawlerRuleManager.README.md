# CrawlerRuleManager 爬虫规则配置管理系统

## 概述

`CrawlerRuleManager` 是一个完整的爬虫规则配置管理系统，提供规则的增删改查、测试验证、批量操作和导入导出功能。专为3D素材搜索平台设计，支持多网站的爬虫规则统一管理。

## 功能特性

### 🔧 规则管理
- **完整的CRUD操作**: 创建、读取、更新、删除爬虫规则
- **预设规则支持**: 内置主流3D素材网站的预配置规则
- **自定义规则**: 支持用户添加自定义网站的爬虫规则
- **规则状态管理**: 启用/禁用规则，灵活控制爬虫行为

### 🧪 规则测试
- **实时测试**: 在线测试规则的有效性和准确性
- **测试结果展示**: 详细显示提取的数据和性能指标
- **错误诊断**: 提供详细的错误信息和调试建议
- **测试历史**: 记录测试结果和时间戳

### 📊 批量操作
- **多选功能**: 支持批量选择规则进行操作
- **批量启用/禁用**: 一键切换多个规则的状态
- **批量删除**: 安全删除多个规则（带确认提示）
- **批量导出**: 选择性导出规则配置

### 📁 导入导出
- **JSON格式**: 标准化的JSON配置文件格式
- **配置验证**: 导入时自动验证配置文件的完整性
- **示例配置**: 提供标准的配置文件模板
- **备份恢复**: 支持规则配置的备份和恢复

### 🔍 搜索过滤
- **实时搜索**: 根据网站名称或URL快速搜索规则
- **状态过滤**: 按启用/禁用状态筛选规则
- **类型过滤**: 区分预设规则和自定义规则
- **智能排序**: 支持多种排序方式

## 使用方法

### 基础用法

```tsx
import { CrawlerRuleManager } from './components/crawler';
import type { CrawlerRule, TestResult } from './crawler/types/crawler';

function MyComponent() {
  const [rules, setRules] = useState<CrawlerRule[]>([]);

  const handleAddRule = (rule: CrawlerRule) => {
    setRules(prev => [...prev, rule]);
  };

  const handleEditRule = (id: string, updatedRule: CrawlerRule) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? updatedRule : rule
    ));
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const handleTestRule = async (id: string, keyword: string): Promise<TestResult> => {
    // 实现规则测试逻辑
    return await testCrawlerRule(id, keyword);
  };

  const handleImport = (configFile: File) => {
    // 实现规则导入逻辑
    importRulesFromFile(configFile);
  };

  const handleExport = (ruleIds: string[]) => {
    // 实现规则导出逻辑
    exportRulesToFile(ruleIds);
  };

  return (
    <CrawlerRuleManager
      rules={rules}
      onAdd={handleAddRule}
      onEdit={handleEditRule}
      onDelete={handleDeleteRule}
      onToggleActive={handleToggleActive}
      onTest={handleTestRule}
      onImport={handleImport}
      onExport={handleExport}
    />
  );
}
```

### 高级配置

```tsx
// 自定义规则配置示例
const customRule: CrawlerRule = {
  id: 'custom-site-1',
  websiteName: '自定义网站',
  websiteIcon: 'https://example.com/icon.png',
  baseUrl: 'https://example.com',
  isActive: true,
  isPreset: false,
  
  // 搜索配置
  searchUrlTemplate: 'https://example.com/search?q={keyword}&page={page}',
  searchMethod: 'GET',
  searchHeaders: {
    'User-Agent': 'Mozilla/5.0 (compatible; Find3D-Bot/1.0)',
    'Accept': 'text/html,application/xhtml+xml'
  },
  
  // 选择器配置
  selectors: {
    resultList: '.search-results .item',
    resultLink: 'a.title-link',
    title: 'h1.title',
    description: '.description',
    previewImages: '.preview-img',
    price: '.price',
    isFree: '.free-tag',
    fileFormat: '.format',
    fileSize: '.size',
    downloadCount: '.downloads',
    rating: '.rating',
    tags: '.tags a',
    author: '.author',
    uploadDate: '.date'
  },
  
  // 数据处理配置
  dataProcessing: {
    priceRegex: '\\d+(\\.\\d+)?',
    dateFormat: 'YYYY-MM-DD',
    tagSeparator: ',',
    imageUrlPrefix: 'https://example.com'
  },
  
  // 反爬虫配置
  antiBot: {
    useHeadlessBrowser: false,
    waitForSelector: '.content-loaded',
    delay: 1000,
    userAgent: '',
    enableProxy: false
  },
  
  // 测试配置
  testKeyword: '手机模型'
};
```

## Props 接口

### CrawlerRuleManagerProps

```tsx
interface CrawlerRuleManagerProps {
  /** 爬虫规则列表 */
  rules: CrawlerRule[];
  
  /** 添加规则回调 */
  onAdd: (rule: CrawlerRule) => void;
  
  /** 编辑规则回调 */
  onEdit: (id: string, rule: CrawlerRule) => void;
  
  /** 删除规则回调 */
  onDelete: (id: string) => void;
  
  /** 切换规则状态回调 */
  onToggleActive: (id: string) => void;
  
  /** 测试规则回调 */
  onTest: (id: string, keyword: string) => Promise<TestResult>;
  
  /** 导入规则回调 */
  onImport: (configFile: File) => void;
  
  /** 导出规则回调 */
  onExport: (ruleIds: string[]) => void;
  
  /** 自定义CSS类名 */
  className?: string;
}
```

## 数据结构

### CrawlerRule

```tsx
interface CrawlerRule {
  // 基本信息
  id: string;
  websiteName: string;
  websiteIcon?: string;
  baseUrl: string;
  isActive: boolean;
  isPreset: boolean; // 是否为预设规则
  
  // 搜索配置
  searchUrlTemplate: string; // 搜索URL模板
  searchMethod: 'GET' | 'POST';
  searchHeaders?: Record<string, string>;
  
  // 选择器配置
  selectors: {
    // 搜索结果列表页
    resultList: string; // 结果容器选择器
    resultLink: string; // 详情页链接选择器
    
    // 详情页解析
    title: string;
    description?: string;
    previewImages: string;
    price?: string;
    isFree?: string;
    fileFormat?: string;
    fileSize?: string;
    downloadCount?: string;
    rating?: string;
    tags?: string;
    author?: string;
    uploadDate?: string;
  };
  
  // 数据处理规则
  dataProcessing: {
    priceRegex?: string; // 价格提取正则
    dateFormat?: string; // 日期格式
    tagSeparator?: string; // 标签分隔符
    imageUrlPrefix?: string; // 图片URL前缀
  };
  
  // 反爬虫配置
  antiBot: {
    useHeadlessBrowser: boolean;
    waitForSelector?: string;
    delay: number; // 请求间隔（毫秒）
    userAgent?: string;
    enableProxy: boolean;
  };
  
  // 测试配置
  testKeyword: string;
  lastTested?: Date;
  testStatus?: 'success' | 'failed' | 'pending';
}
```

### TestResult

```tsx
interface TestResult {
  success: boolean;
  results: ExtractedMaterialResult[];
  errors: string[];
  performance: {
    totalTime: number;
    networkTime: number;
    parseTime: number;
  };
}
```

## 组件架构

### 主要组件

1. **CrawlerRuleManager**: 主管理组件，协调所有子组件
2. **CrawlerRuleList**: 规则列表展示组件
3. **CrawlerRuleForm**: 规则编辑表单组件
4. **CrawlerRuleImportExport**: 导入导出功能组件

### 组件关系

```
CrawlerRuleManager
├── CrawlerRuleList
│   ├── 规则项展示
│   ├── 批量选择
│   ├── 状态切换
│   └── 测试功能
├── CrawlerRuleForm (Modal)
│   ├── 基本信息配置
│   ├── 选择器配置
│   ├── 数据处理配置
│   └── 反爬虫配置
└── CrawlerRuleImportExport (Modal)
    ├── 规则导入
    └── 规则导出
```

## 样式定制

### CSS 变量

组件使用以下CSS变量，可以通过覆盖来自定义样式：

```css
:root {
  --crawler-primary-color: #3b82f6;
  --crawler-success-color: #10b981;
  --crawler-warning-color: #f59e0b;
  --crawler-error-color: #ef4444;
  --crawler-border-color: #e5e7eb;
  --crawler-background-color: #f9fafb;
}
```

### 自定义样式类

```css
/* 自定义规则卡片样式 */
.my-crawler-rule-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 自定义测试按钮样式 */
.my-crawler-test-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

## 最佳实践

### 规则配置

1. **选择器编写**
   - 使用稳定的CSS选择器，避免依赖易变的class名
   - 优先使用语义化的选择器，如`h1`、`article`等
   - 为选择器添加备用方案，提高容错性

2. **反爬虫配置**
   - 设置合理的请求延迟，避免过于频繁的请求
   - 根据网站特性选择是否使用无头浏览器
   - 定期更新User-Agent字符串

3. **数据处理**
   - 使用正则表达式提取结构化数据
   - 设置合适的日期格式解析规则
   - 处理特殊字符和编码问题

### 性能优化

1. **规则测试**
   - 使用防抖机制避免频繁测试
   - 缓存测试结果，避免重复请求
   - 设置测试超时时间

2. **批量操作**
   - 使用虚拟滚动处理大量规则
   - 实现增量更新，避免全量刷新
   - 优化选择状态管理

3. **导入导出**
   - 使用Web Workers处理大文件
   - 实现进度显示和取消功能
   - 压缩导出文件大小

### 错误处理

1. **规则验证**
   - 在保存前验证选择器语法
   - 检查URL模板的有效性
   - 验证必填字段的完整性

2. **测试错误**
   - 提供详细的错误信息和建议
   - 区分网络错误和解析错误
   - 记录错误日志便于调试

3. **用户体验**
   - 提供友好的错误提示
   - 实现自动重试机制
   - 支持错误恢复操作

## 故障排除

### 常见问题

1. **选择器不工作**
   - 检查选择器语法是否正确
   - 确认目标元素是否存在
   - 验证页面结构是否发生变化

2. **测试失败**
   - 检查网络连接状态
   - 验证目标网站是否可访问
   - 确认反爬虫配置是否合适

3. **导入失败**
   - 检查JSON文件格式是否正确
   - 验证必填字段是否完整
   - 确认文件编码是否为UTF-8

### 调试技巧

```tsx
// 启用调试模式
const DEBUG = process.env.NODE_ENV === 'development';

function CrawlerRuleManager(props) {
  if (DEBUG) {
    console.log('CrawlerRuleManager props:', props);
  }
  
  // 组件逻辑...
}
```

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的规则管理功能
- 规则测试和验证
- 导入导出功能
- 批量操作支持

## 贡献指南

欢迎提交Issue和Pull Request来改进这个组件。请确保：

1. 遵循现有的代码风格
2. 添加适当的测试
3. 更新相关文档
4. 确保向后兼容性

## 许可证

MIT License