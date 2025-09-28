/**
 * 数据验证工具
 * 负责验证爬取数据的完整性和准确性
 */

import type { ExtractedMaterialResult, CrawlerRule } from '../types/crawler';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  impact: string;
}

export class DataValidator {
  /**
   * 验证提取的素材结果
   */
  static validateExtractedResult(result: ExtractedMaterialResult, rule: CrawlerRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // 验证必填字段
    this.validateRequiredFields(result, rule, errors);
    
    // 验证数据格式
    this.validateDataFormats(result, errors, warnings);
    
    // 验证数据质量
    this.validateDataQuality(result, rule, warnings, suggestions);
    
    // 验证数据一致性
    this.validateDataConsistency(result, warnings);

    // 计算验证分数
    const score = this.calculateValidationScore(result, errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      score,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * 验证必填字段
   */
  private static validateRequiredFields(
    result: ExtractedMaterialResult, 
    rule: CrawlerRule, 
    errors: ValidationError[]
  ): void {
    // 标题是必填的
    if (!result.title || result.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: '标题不能为空',
        severity: 'critical'
      });
    } else if (result.title.length < rule.qualityControl.minTitleLength) {
      errors.push({
        field: 'title',
        message: `标题长度不能少于${rule.qualityControl.minTitleLength}个字符`,
        severity: 'high'
      });
    }

    // 来源URL是必填的
    if (!result.sourceUrl || !this.isValidUrl(result.sourceUrl)) {
      errors.push({
        field: 'sourceUrl',
        message: '来源URL无效或为空',
        severity: 'critical'
      });
    }

    // 根据规则检查图片要求
    if (rule.qualityControl.requireImage && (!result.previewImages || result.previewImages.length === 0)) {
      errors.push({
        field: 'previewImages',
        message: '根据规则配置，此网站要求必须有预览图',
        severity: 'high'
      });
    }

    // 根据规则检查价格要求
    if (rule.qualityControl.requirePrice && result.pricing.price === undefined && !result.pricing.isFree) {
      errors.push({
        field: 'pricing',
        message: '根据规则配置，此网站要求必须有价格信息',
        severity: 'medium'
      });
    }
  }

  /**
   * 验证数据格式
   */
  private static validateDataFormats(
    result: ExtractedMaterialResult, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // 验证URL格式
    if (result.sourceUrl && !this.isValidUrl(result.sourceUrl)) {
      errors.push({
        field: 'sourceUrl',
        message: 'URL格式无效',
        severity: 'high'
      });
    }

    // 验证图片URL
    if (result.previewImages) {
      result.previewImages.forEach((img, index) => {
        if (!this.isValidUrl(img.url)) {
          warnings.push({
            field: `previewImages[${index}]`,
            message: '图片URL格式无效',
            impact: '可能导致图片无法显示'
          });
        }
      });
    }

    // 验证价格格式
    if (result.pricing.price !== undefined) {
      if (typeof result.pricing.price !== 'number' || result.pricing.price < 0) {
        errors.push({
          field: 'pricing.price',
          message: '价格必须是非负数',
          severity: 'medium'
        });
      }
    }

    // 验证统计数据格式
    if (result.statistics.downloadCount !== undefined && result.statistics.downloadCount < 0) {
      warnings.push({
        field: 'statistics.downloadCount',
        message: '下载次数不能为负数',
        impact: '可能影响排序和推荐'
      });
    }

    if (result.statistics.rating !== undefined && (result.statistics.rating < 0 || result.statistics.rating > 5)) {
      warnings.push({
        field: 'statistics.rating',
        message: '评分应该在0-5之间',
        impact: '可能影响质量评估'
      });
    }

    // 验证日期格式
    if (result.timestamps.uploadDate && !(result.timestamps.uploadDate instanceof Date)) {
      warnings.push({
        field: 'timestamps.uploadDate',
        message: '上传日期格式无效',
        impact: '可能影响时间排序'
      });
    }
  }

  /**
   * 验证数据质量
   */
  private static validateDataQuality(
    result: ExtractedMaterialResult, 
    rule: CrawlerRule, 
    warnings: ValidationWarning[], 
    suggestions: string[]
  ): void {
    // 检查标题质量
    if (result.title) {
      if (result.title.length > 100) {
        warnings.push({
          field: 'title',
          message: '标题过长，可能影响显示效果',
          impact: '在卡片中可能被截断'
        });
      }

      if (this.containsSuspiciousContent(result.title)) {
        warnings.push({
          field: 'title',
          message: '标题包含可疑内容',
          impact: '可能是垃圾信息或广告'
        });
      }
    }

    // 检查描述质量
    if (result.description) {
      if (result.description.length < 10) {
        warnings.push({
          field: 'description',
          message: '描述过短，信息量不足',
          impact: '用户可能无法充分了解素材内容'
        });
      }

      if (result.description.length > 500) {
        suggestions.push('考虑截取描述的前500个字符以提高显示效果');
      }
    }

    // 检查图片质量
    if (result.previewImages && result.previewImages.length > 0) {
      if (result.previewImages.length > 10) {
        suggestions.push('预览图数量较多，考虑只显示前几张以提高加载速度');
      }

      // 检查图片URL的有效性
      const invalidImages = result.previewImages.filter(img => !this.isValidImageUrl(img.url));
      if (invalidImages.length > 0) {
        warnings.push({
          field: 'previewImages',
          message: `${invalidImages.length}张图片URL可能无效`,
          impact: '可能导致图片加载失败'
        });
      }
    }

    // 检查标签质量
    if (result.categorization.tags.length === 0) {
      suggestions.push('添加相关标签可以提高搜索匹配度');
    } else if (result.categorization.tags.length > 20) {
      suggestions.push('标签数量过多，考虑保留最相关的标签');
    }

    // 检查数据完整性
    const completeness = this.calculateCompleteness(result);
    if (completeness < 50) {
      warnings.push({
        field: 'overall',
        message: '数据完整性较低',
        impact: '可能影响用户体验和搜索排名'
      });
      suggestions.push('尝试优化选择器配置以提取更多字段信息');
    }
  }

  /**
   * 验证数据一致性
   */
  private static validateDataConsistency(result: ExtractedMaterialResult, warnings: ValidationWarning[]): void {
    // 检查价格一致性
    if (result.pricing.isFree && result.pricing.price && result.pricing.price > 0) {
      warnings.push({
        field: 'pricing',
        message: '价格信息不一致：标记为免费但有价格',
        impact: '可能混淆用户对价格的理解'
      });
    }

    // 检查统计数据一致性
    if (result.statistics.rating && result.statistics.reviewCount === 0) {
      warnings.push({
        field: 'statistics',
        message: '有评分但评论数为0，数据可能不一致',
        impact: '可能影响用户对评分可信度的判断'
      });
    }

    // 检查时间一致性
    if (result.timestamps.uploadDate && result.timestamps.lastUpdated) {
      if (result.timestamps.lastUpdated < result.timestamps.uploadDate) {
        warnings.push({
          field: 'timestamps',
          message: '最后更新时间早于上传时间',
          impact: '时间逻辑不合理'
        });
      }
    }

    // 检查作者信息一致性
    if (result.author && result.author.profileUrl && !this.isValidUrl(result.author.profileUrl)) {
      warnings.push({
        field: 'author.profileUrl',
        message: '作者链接URL格式无效',
        impact: '用户无法访问作者页面'
      });
    }
  }

  /**
   * 计算验证分数
   */
  private static calculateValidationScore(
    result: ExtractedMaterialResult, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): number {
    let score = 100;

    // 根据错误扣分
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // 根据警告扣分
    warnings.forEach(() => {
      score -= 2;
    });

    // 根据数据完整性加分
    const completeness = this.calculateCompleteness(result);
    score += (completeness - 50) * 0.2; // 完整性超过50%的部分给予加分

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算数据完整性
   */
  private static calculateCompleteness(result: ExtractedMaterialResult): number {
    const fields = [
      'title',
      'description',
      'previewImages',
      'pricing.price',
      'fileInfo.format',
      'statistics.downloadCount',
      'categorization.tags',
      'author.name',
      'timestamps.uploadDate'
    ];

    let presentFields = 0;
    
    fields.forEach(field => {
      const value = this.getNestedValue(result, field);
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          presentFields++;
        } else if (!Array.isArray(value)) {
          presentFields++;
        }
      }
    });

    return (presentFields / fields.length) * 100;
  }

  /**
   * 获取嵌套对象的值
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 验证URL格式
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证图片URL格式
   */
  private static isValidImageUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const urlLower = url.toLowerCase();
    
    return imageExtensions.some(ext => urlLower.includes(ext)) || 
           urlLower.includes('image') || 
           urlLower.includes('img') ||
           urlLower.includes('thumb') ||
           urlLower.includes('preview');
  }

  /**
   * 检查是否包含可疑内容
   */
  private static containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /广告/i,
      /推广/i,
      /点击/i,
      /免费下载.*立即/i,
      /限时/i,
      /优惠/i,
      /特价/i,
      /.*元.*包邮/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  /**
   * 批量验证结果
   */
  static validateBatchResults(results: ExtractedMaterialResult[], rule: CrawlerRule): {
    totalResults: number;
    validResults: number;
    invalidResults: number;
    avgScore: number;
    commonIssues: string[];
    recommendations: string[];
  } {
    const validationResults = results.map(result => this.validateExtractedResult(result, rule));
    
    const validResults = validationResults.filter(v => v.isValid).length;
    const invalidResults = results.length - validResults;
    const avgScore = validationResults.reduce((sum, v) => sum + v.score, 0) / results.length;

    // 统计常见问题
    const issueCount = new Map<string, number>();
    validationResults.forEach(v => {
      v.errors.forEach(error => {
        const count = issueCount.get(error.message) || 0;
        issueCount.set(error.message, count + 1);
      });
      v.warnings.forEach(warning => {
        const count = issueCount.get(warning.message) || 0;
        issueCount.set(warning.message, count + 1);
      });
    });

    const commonIssues = Array.from(issueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => `${issue} (${count}次)`);

    // 生成建议
    const recommendations: string[] = [];
    if (avgScore < 70) {
      recommendations.push('整体数据质量较低，建议优化选择器配置');
    }
    if (invalidResults / results.length > 0.3) {
      recommendations.push('无效结果比例较高，建议检查数据验证规则');
    }
    if (commonIssues.some(issue => issue.includes('URL'))) {
      recommendations.push('URL相关问题较多，建议检查URL处理逻辑');
    }

    return {
      totalResults: results.length,
      validResults,
      invalidResults,
      avgScore,
      commonIssues,
      recommendations
    };
  }
}