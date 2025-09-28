/**
 * 数据质量管理器
 * 提供数据去重、质量评估和优化功能
 */

import type { ExtractedMaterialResult } from '../crawler/types/crawler';

export interface QualityMetrics {
  completeness: number; // 完整性评分 0-100
  accuracy: number; // 准确性评分 0-100
  consistency: number; // 一致性评分 0-100
  freshness: number; // 新鲜度评分 0-100
  overall: number; // 总体质量评分 0-100
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateId?: string;
  similarity: number; // 相似度 0-1
  duplicateFields: string[]; // 重复的字段
}

export interface DataCleaningResult {
  cleaned: ExtractedMaterialResult;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }>;
  qualityImprovement: number; // 质量提升分数
}

export class DataQualityManager {
  private duplicateThreshold = 0.8; // 重复检测阈值
  private qualityWeights = {
    completeness: 0.3,
    accuracy: 0.25,
    consistency: 0.25,
    freshness: 0.2
  };

  /**
   * 检测重复数据
   */
  detectDuplicates(
    newResult: ExtractedMaterialResult,
    existingResults: ExtractedMaterialResult[]
  ): DuplicateDetectionResult {
    let maxSimilarity = 0;
    let duplicateId: string | undefined;
    let duplicateFields: string[] = [];

    for (const existing of existingResults) {
      const similarity = this.calculateSimilarity(newResult, existing);
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        duplicateId = existing.id;
        duplicateFields = this.findDuplicateFields(newResult, existing);
      }
    }

    return {
      isDuplicate: maxSimilarity >= this.duplicateThreshold,
      duplicateId,
      similarity: maxSimilarity,
      duplicateFields
    };
  }

  /**
   * 计算两个结果的相似度
   */
  private calculateSimilarity(
    result1: ExtractedMaterialResult,
    result2: ExtractedMaterialResult
  ): number {
    let totalWeight = 0;
    let matchWeight = 0;

    // 标题相似度 (权重: 40%)
    const titleSimilarity = this.calculateTextSimilarity(result1.title, result2.title);
    totalWeight += 0.4;
    matchWeight += titleSimilarity * 0.4;

    // URL相似度 (权重: 30%)
    const urlSimilarity = result1.sourceUrl === result2.sourceUrl ? 1 : 0;
    totalWeight += 0.3;
    matchWeight += urlSimilarity * 0.3;

    // 来源网站相似度 (权重: 10%)
    const websiteSimilarity = result1.sourceWebsite === result2.sourceWebsite ? 1 : 0;
    totalWeight += 0.1;
    matchWeight += websiteSimilarity * 0.1;

    // 价格相似度 (权重: 10%)
    const priceSimilarity = this.calculatePriceSimilarity(result1.pricing, result2.pricing);
    totalWeight += 0.1;
    matchWeight += priceSimilarity * 0.1;

    // 描述相似度 (权重: 10%)
    if (result1.description && result2.description) {
      const descSimilarity = this.calculateTextSimilarity(result1.description, result2.description);
      totalWeight += 0.1;
      matchWeight += descSimilarity * 0.1;
    }

    return totalWeight > 0 ? matchWeight / totalWeight : 0;
  }

  /**
   * 计算文本相似度
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 计算价格相似度
   */
  private calculatePriceSimilarity(
    pricing1: ExtractedMaterialResult['pricing'],
    pricing2: ExtractedMaterialResult['pricing']
  ): number {
    // 都是免费
    if (pricing1.isFree && pricing2.isFree) return 1;
    
    // 一个免费一个付费
    if (pricing1.isFree !== pricing2.isFree) return 0;
    
    // 都是付费，比较价格
    if (pricing1.price && pricing2.price) {
      const priceDiff = Math.abs(pricing1.price - pricing2.price);
      const avgPrice = (pricing1.price + pricing2.price) / 2;
      return avgPrice > 0 ? Math.max(0, 1 - priceDiff / avgPrice) : 1;
    }
    
    return 0.5; // 部分匹配
  }

  /**
   * 找出重复的字段
   */
  private findDuplicateFields(
    result1: ExtractedMaterialResult,
    result2: ExtractedMaterialResult
  ): string[] {
    const duplicateFields: string[] = [];

    // 检查各个字段
    if (result1.title === result2.title) duplicateFields.push('title');
    if (result1.sourceUrl === result2.sourceUrl) duplicateFields.push('sourceUrl');
    if (result1.description === result2.description) duplicateFields.push('description');
    if (result1.sourceWebsite === result2.sourceWebsite) duplicateFields.push('sourceWebsite');
    
    // 检查价格
    if (result1.pricing.isFree === result2.pricing.isFree && 
        result1.pricing.price === result2.pricing.price) {
      duplicateFields.push('pricing');
    }

    return duplicateFields;
  }

  /**
   * 评估数据质量
   */
  assessQuality(result: ExtractedMaterialResult): QualityMetrics {
    const completeness = this.calculateCompleteness(result);
    const accuracy = this.calculateAccuracy(result);
    const consistency = this.calculateConsistency(result);
    const freshness = this.calculateFreshness(result);
    
    const overall = 
      completeness * this.qualityWeights.completeness +
      accuracy * this.qualityWeights.accuracy +
      consistency * this.qualityWeights.consistency +
      freshness * this.qualityWeights.freshness;

    return {
      completeness,
      accuracy,
      consistency,
      freshness,
      overall
    };
  }

  /**
   * 计算完整性评分
   */
  private calculateCompleteness(result: ExtractedMaterialResult): number {
    const requiredFields = [
      'title', 'sourceUrl', 'sourceWebsite', 'previewImages'
    ];
    
    const optionalFields = [
      'description', 'pricing.price', 'fileInfo.format', 'fileInfo.size',
      'statistics.downloadCount', 'categorization.tags', 'author'
    ];

    let score = 0;
    let totalWeight = 0;

    // 必需字段 (权重: 70%)
    for (const field of requiredFields) {
      totalWeight += 0.7 / requiredFields.length;
      if (this.hasValue(result, field)) {
        score += 0.7 / requiredFields.length;
      }
    }

    // 可选字段 (权重: 30%)
    for (const field of optionalFields) {
      totalWeight += 0.3 / optionalFields.length;
      if (this.hasValue(result, field)) {
        score += 0.3 / optionalFields.length;
      }
    }

    return Math.round((score / totalWeight) * 100);
  }

  /**
   * 计算准确性评分
   */
  private calculateAccuracy(result: ExtractedMaterialResult): number {
    let score = 100;
    
    // 检查标题长度
    if (!result.title || result.title.length < 3) {
      score -= 20;
    }
    
    // 检查URL格式
    if (!this.isValidUrl(result.sourceUrl)) {
      score -= 15;
    }
    
    // 检查价格逻辑
    if (result.pricing.isFree && result.pricing.price && result.pricing.price > 0) {
      score -= 10; // 逻辑矛盾
    }
    
    // 检查图片URL
    if (result.previewImages.length > 0) {
      const invalidImages = result.previewImages.filter(img => !this.isValidUrl(img.url));
      score -= (invalidImages.length / result.previewImages.length) * 15;
    }
    
    // 检查数据类型
    if (result.statistics.downloadCount && result.statistics.downloadCount < 0) {
      score -= 5;
    }
    
    if (result.statistics.rating && (result.statistics.rating < 0 || result.statistics.rating > 5)) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * 计算一致性评分
   */
  private calculateConsistency(result: ExtractedMaterialResult): number {
    let score = 100;
    
    // 检查货币一致性
    if (result.pricing.price && !result.pricing.currency) {
      score -= 10;
    }
    
    // 检查时间一致性
    if (result.timestamps.uploadDate && result.timestamps.lastUpdated) {
      if (result.timestamps.uploadDate > result.timestamps.lastUpdated) {
        score -= 15;
      }
    }
    
    // 检查文件信息一致性
    if (result.fileInfo.format && result.fileInfo.size) {
      // 简单检查：3D文件格式应该有合理的大小
      const format = result.fileInfo.format.toLowerCase();
      const sizeStr = result.fileInfo.size.toLowerCase();
      
      if ((format.includes('max') || format.includes('blend') || format.includes('fbx')) && 
          sizeStr.includes('kb') && !sizeStr.includes('mb')) {
        score -= 10; // 3D文件通常不会只有KB大小
      }
    }
    
    // 检查评分和评论数一致性
    if (result.statistics.rating && result.statistics.rating > 0 && 
        (!result.statistics.reviewCount || result.statistics.reviewCount === 0)) {
      score -= 5; // 有评分但没有评论数
    }

    return Math.max(0, score);
  }

  /**
   * 计算新鲜度评分
   */
  private calculateFreshness(result: ExtractedMaterialResult): number {
    const now = new Date();
    const extractedTime = result.timestamps.extractedAt;
    const ageInHours = (now.getTime() - extractedTime.getTime()) / (1000 * 60 * 60);
    
    // 24小时内: 100分
    // 7天内: 80分
    // 30天内: 60分
    // 更久: 40分
    
    if (ageInHours <= 24) return 100;
    if (ageInHours <= 24 * 7) return 80;
    if (ageInHours <= 24 * 30) return 60;
    return 40;
  }

  /**
   * 清理和优化数据
   */
  cleanData(result: ExtractedMaterialResult): DataCleaningResult {
    const cleaned = { ...result };
    const changes: DataCleaningResult['changes'] = [];
    const originalQuality = this.assessQuality(result).overall;

    // 清理标题
    if (cleaned.title) {
      const originalTitle = cleaned.title;
      cleaned.title = this.cleanText(cleaned.title);
      if (cleaned.title !== originalTitle) {
        changes.push({
          field: 'title',
          oldValue: originalTitle,
          newValue: cleaned.title,
          reason: '清理标题格式和特殊字符'
        });
      }
    }

    // 清理描述
    if (cleaned.description) {
      const originalDesc = cleaned.description;
      cleaned.description = this.cleanText(cleaned.description);
      if (cleaned.description !== originalDesc) {
        changes.push({
          field: 'description',
          oldValue: originalDesc,
          newValue: cleaned.description,
          reason: '清理描述格式和HTML标签'
        });
      }
    }

    // 标准化价格信息
    if (cleaned.pricing.price === 0 && !cleaned.pricing.isFree) {
      cleaned.pricing.isFree = true;
      changes.push({
        field: 'pricing.isFree',
        oldValue: false,
        newValue: true,
        reason: '价格为0时标记为免费'
      });
    }

    // 清理标签
    if (cleaned.categorization.tags.length > 0) {
      const originalTags = [...cleaned.categorization.tags];
      cleaned.categorization.tags = this.cleanTags(cleaned.categorization.tags);
      if (JSON.stringify(originalTags) !== JSON.stringify(cleaned.categorization.tags)) {
        changes.push({
          field: 'categorization.tags',
          oldValue: originalTags,
          newValue: cleaned.categorization.tags,
          reason: '去重和标准化标签'
        });
      }
    }

    // 验证和修复图片URL
    const originalImages = [...cleaned.previewImages];
    cleaned.previewImages = cleaned.previewImages.filter(img => this.isValidUrl(img.url));
    if (cleaned.previewImages.length !== originalImages.length) {
      changes.push({
        field: 'previewImages',
        oldValue: originalImages.length,
        newValue: cleaned.previewImages.length,
        reason: '移除无效的图片URL'
      });
    }

    const newQuality = this.assessQuality(cleaned).overall;
    const qualityImprovement = newQuality - originalQuality;

    return {
      cleaned,
      changes,
      qualityImprovement
    };
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // 移除HTML实体
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim(); // 移除首尾空格
  }

  /**
   * 清理和标准化标签
   */
  private cleanTags(tags: string[]): string[] {
    const cleanedTags = tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 20)
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // 去重

    return cleanedTags.slice(0, 10); // 限制标签数量
  }

  /**
   * 检查是否有值
   */
  private hasValue(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return false;
      }
      current = current[key];
    }
    
    return current != null && current !== '' && 
           (Array.isArray(current) ? current.length > 0 : true);
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 批量处理数据质量
   */
  batchProcessQuality(results: ExtractedMaterialResult[]): {
    processed: ExtractedMaterialResult[];
    duplicatesRemoved: number;
    qualityImproved: number;
    totalChanges: number;
  } {
    const processed: ExtractedMaterialResult[] = [];
    const seenIds = new Set<string>();
    let duplicatesRemoved = 0;
    let qualityImproved = 0;
    let totalChanges = 0;

    for (const result of results) {
      // 检查重复
      const duplicateCheck = this.detectDuplicates(result, processed);
      if (duplicateCheck.isDuplicate) {
        duplicatesRemoved++;
        continue;
      }

      // 清理数据
      const cleaningResult = this.cleanData(result);
      processed.push(cleaningResult.cleaned);
      
      if (cleaningResult.qualityImprovement > 0) {
        qualityImproved++;
      }
      
      totalChanges += cleaningResult.changes.length;
    }

    return {
      processed,
      duplicatesRemoved,
      qualityImproved,
      totalChanges
    };
  }

  /**
   * 获取质量报告
   */
  generateQualityReport(results: ExtractedMaterialResult[]): {
    totalItems: number;
    averageQuality: QualityMetrics;
    qualityDistribution: {
      excellent: number; // 90-100
      good: number; // 70-89
      fair: number; // 50-69
      poor: number; // 0-49
    };
    commonIssues: Array<{
      issue: string;
      count: number;
      percentage: number;
    }>;
  } {
    const totalItems = results.length;
    const qualityScores = results.map(result => this.assessQuality(result));
    
    // 计算平均质量
    const averageQuality: QualityMetrics = {
      completeness: qualityScores.reduce((sum, q) => sum + q.completeness, 0) / totalItems,
      accuracy: qualityScores.reduce((sum, q) => sum + q.accuracy, 0) / totalItems,
      consistency: qualityScores.reduce((sum, q) => sum + q.consistency, 0) / totalItems,
      freshness: qualityScores.reduce((sum, q) => sum + q.freshness, 0) / totalItems,
      overall: qualityScores.reduce((sum, q) => sum + q.overall, 0) / totalItems
    };

    // 质量分布
    const qualityDistribution = {
      excellent: qualityScores.filter(q => q.overall >= 90).length,
      good: qualityScores.filter(q => q.overall >= 70 && q.overall < 90).length,
      fair: qualityScores.filter(q => q.overall >= 50 && q.overall < 70).length,
      poor: qualityScores.filter(q => q.overall < 50).length
    };

    // 常见问题统计
    const issues = new Map<string, number>();
    
    for (const result of results) {
      if (!result.title || result.title.length < 3) {
        issues.set('标题过短或缺失', (issues.get('标题过短或缺失') || 0) + 1);
      }
      if (result.previewImages.length === 0) {
        issues.set('缺少预览图', (issues.get('缺少预览图') || 0) + 1);
      }
      if (!result.description) {
        issues.set('缺少描述', (issues.get('缺少描述') || 0) + 1);
      }
      if (!result.pricing.price && !result.pricing.isFree) {
        issues.set('价格信息不明确', (issues.get('价格信息不明确') || 0) + 1);
      }
    }

    const commonIssues = Array.from(issues.entries())
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: (count / totalItems) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalItems,
      averageQuality,
      qualityDistribution,
      commonIssues
    };
  }
}

// 创建全局数据质量管理器实例
export const dataQualityManager = new DataQualityManager();

// 默认导出
export default dataQualityManager;