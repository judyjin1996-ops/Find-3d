#!/bin/bash

# 修复TypeScript类型导入问题

echo "🔧 修复TypeScript类型导入问题..."

# 修复主要的类型导入问题
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    # 修复 CrawlerRule 类型导入
    sed -i.bak 's/import { CrawlerRule/import type { CrawlerRule/g' "$file"
    
    # 修复其他类型导入
    sed -i.bak 's/import { ExtractedMaterialResult/import type { ExtractedMaterialResult/g' "$file"
    sed -i.bak 's/import { CrawlingTask/import type { CrawlingTask/g' "$file"
    sed -i.bak 's/import { CrawlerSearchRequest/import type { CrawlerSearchRequest/g' "$file"
    sed -i.bak 's/import { CrawlerSearchResponse/import type { CrawlerSearchResponse/g' "$file"
    sed -i.bak 's/import { CrawlingError/import type { CrawlingError/g' "$file"
    sed -i.bak 's/import { TestResult/import type { TestResult/g' "$file"
    sed -i.bak 's/import { UserConfig/import type { UserConfig/g' "$file"
    sed -i.bak 's/import { DisplayField/import type { DisplayField/g' "$file"
    sed -i.bak 's/import { SystemHealth/import type { SystemHealth/g' "$file"
    sed -i.bak 's/import { SystemAlert/import type { SystemAlert/g' "$file"
    sed -i.bak 's/import { ComponentHealth/import type { ComponentHealth/g' "$file"
    sed -i.bak 's/import { ProxyConfig/import type { ProxyConfig/g' "$file"
    sed -i.bak 's/import { TaskSchedulerConfig/import type { TaskSchedulerConfig/g' "$file"
    sed -i.bak 's/import { DetailedTestResult/import type { DetailedTestResult/g' "$file"
    sed -i.bak 's/import { ExtractedData/import type { ExtractedData/g' "$file"
    sed -i.bak 's/import { CacheStats/import type { CacheStats/g' "$file"
    sed -i.bak 's/import { QualityMetrics/import type { QualityMetrics/g' "$file"
    
    # 删除备份文件
    rm -f "$file.bak"
done

echo "✅ TypeScript类型导入修复完成"