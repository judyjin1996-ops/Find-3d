// 快速修复TypeScript错误的脚本
const fs = require('fs');
const path = require('path');

// 修复文件列表
const fixes = [
  {
    file: 'src/hooks/useDebounce.ts',
    search: 'const timeoutRef = useRef<NodeJS.Timeout>();',
    replace: 'const timeoutRef = useRef<NodeJS.Timeout | null>(null);'
  },
  {
    file: 'src/components/ui/VirtualList.tsx',
    search: 'const scrollTimeoutRef = useRef<NodeJS.Timeout>();',
    replace: 'const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);'
  },
  {
    file: 'src/components/results/ResultCard.tsx',
    search: 'const [imageError, setImageError] = React.useState(false);',
    replace: '// const [imageError, setImageError] = React.useState(false);'
  }
];

// 应用修复
fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
    fs.writeFileSync(filePath, content);
    console.log(`已修复: ${fix.file}`);
  }
});

console.log('修复完成！');