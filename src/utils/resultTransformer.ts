import type { MaterialResult, ExtractedMaterialResult } from '../types';

/**
 * 将旧的MaterialResult转换为新的ExtractedMaterialResult格式
 */
export function transformMaterialResult(
  oldResult: MaterialResult,
  ruleId: string = 'legacy',
  extractionTime: Date = new Date()
): ExtractedMaterialResult {
  return {
    // 基础信息
    id: oldResult.id,
    title: oldResult.title,
    description: oldResult.description,
    sourceWebsite: oldResult.sourceWebsite,
    sourceUrl: oldResult.sourceUrl,
    
    // 媒体内容
    previewImages: oldResult.previewImage ? [
      {
        url: oldResult.previewImage,
        alt: oldResult.title,
        size: 'medium' as const
      }
    ] : [],
    
    // 价格信息
    pricing: {
      isFree: oldResult.isFree,
      price: oldResult.price,
      currency: oldResult.currency || '¥',
      originalPrice: undefined,
      discount: undefined,
      priceText: oldResult.price ? `${oldResult.currency || '¥'}${oldResult.price}` : undefined
    },
    
    // 文件信息
    fileInfo: {
      format: oldResult.fileFormat,
      size: oldResult.fileSize,
      sizeBytes: undefined,
      downloadUrl: undefined
    },
    
    // 统计信息
    statistics: {
      downloadCount: oldResult.downloadCount,
      viewCount: undefined,
      likeCount: undefined,
      rating: oldResult.rating,
      reviewCount: undefined
    },
    
    // 分类和标签
    categorization: {
      category: undefined,
      subcategory: undefined,
      tags: oldResult.tags || [],
      keywords: undefined
    },
    
    // 作者信息
    author: oldResult.author ? {
      name: oldResult.author,
      profileUrl: undefined,
      avatar: undefined
    } : undefined,
    
    // 时间信息
    timestamps: {
      uploadDate: oldResult.uploadDate,
      lastUpdated: undefined,
      extractedAt: extractionTime
    },
    
    // 提取元数据
    extraction: {
      ruleId,
      status: 'success' as const,
      confidence: calculateConfidence(oldResult),
      missingFields: getMissingFields(oldResult),
      errors: undefined,
      processingTime: 0
    },
    
    // 质量评分
    quality: {
      score: calculateQualityScore(oldResult),
      factors: {
        completeness: calculateCompleteness(oldResult),
        imageQuality: oldResult.previewImage ? 80 : 0,
        dataAccuracy: 85
      }
    }
  };
}

/**
 * 批量转换MaterialResult数组
 */
export function transformMaterialResults(
  oldResults: MaterialResult[],
  ruleId: string = 'legacy'
): ExtractedMaterialResult[] {
  const extractionTime = new Date();
  return oldResults.map(result => transformMaterialResult(result, ruleId, extractionTime));
}

/**
 * 计算数据提取置信度
 */
function calculateConfidence(result: MaterialResult): number {
  let confidence = 0.5; // 基础置信度
  
  // 必要字段存在性检查
  if (result.title) confidence += 0.2;
  if (result.previewImage) confidence += 0.15;
  if (result.sourceUrl) confidence += 0.1;
  
  // 可选字段存在性检查
  if (result.description) confidence += 0.05;
  if (result.price !== undefined || result.isFree) confidence += 0.05;
  if (result.fileFormat) confidence += 0.03;
  if (result.fileSize) confidence += 0.02;
  
  return Math.min(confidence, 1.0);
}

/**
 * 获取缺失字段列表
 */
function getMissingFields(result: MaterialResult): string[] {
  const missingFields: string[] = [];
  
  if (!result.title) missingFields.push('title');
  if (!result.previewImage) missingFields.push('previewImage');
  if (!result.description) missingFields.push('description');
  if (result.price === undefined && !result.isFree) missingFields.push('price');
  if (!result.fileFormat) missingFields.push('fileFormat');
  if (!result.fileSize) missingFields.push('fileSize');
  if (!result.downloadCount) missingFields.push('downloadCount');
  if (!result.rating) missingFields.push('rating');
  if (!result.author) missingFields.push('author');
  if (!result.uploadDate) missingFields.push('uploadDate');
  if (!result.tags || result.tags.length === 0) missingFields.push('tags');
  
  return missingFields;
}

/**
 * 计算数据完整性
 */
function calculateCompleteness(result: MaterialResult): number {
  const totalFields = 11; // 总字段数
  const missingFields = getMissingFields(result);
  const presentFields = totalFields - missingFields.length;
  
  return Math.round((presentFields / totalFields) * 100);
}

/**
 * 计算质量评分
 */
function calculateQualityScore(result: MaterialResult): number {
  let score = 0;
  
  // 基础信息完整性 (40分)
  if (result.title) score += 15;
  if (result.description) score += 10;
  if (result.previewImage) score += 15;
  
  // 价格信息准确性 (20分)
  if (result.isFree || result.price !== undefined) score += 20;
  
  // 文件信息完整性 (20分)
  if (result.fileFormat) score += 10;
  if (result.fileSize) score += 10;
  
  // 统计和评价信息 (20分)
  if (result.downloadCount !== undefined) score += 5;
  if (result.rating !== undefined) score += 10;
  if (result.author) score += 5;
  
  return Math.min(score, 100);
}

/**
 * 创建模拟的ExtractedMaterialResult用于测试
 */
export function createMockExtractedResult(overrides: Partial<ExtractedMaterialResult> = {}): ExtractedMaterialResult {
  const now = new Date();
  
  const defaultResult: ExtractedMaterialResult = {
    id: `mock-${Date.now()}`,
    title: '高质量3D手机模型',
    description: '精美的智能手机3D模型，包含详细的材质和纹理，适用于产品展示和渲染。',
    sourceWebsite: '魔顿网',
    sourceUrl: 'https://www.modown.cn/archives/103007.html',
    
    previewImages: [
      {
        url: 'https://example.com/preview1.jpg',
        alt: '手机模型预览图',
        size: 'medium'
      },
      {
        url: 'https://example.com/preview2.jpg',
        alt: '手机模型侧视图',
        size: 'medium'
      }
    ],
    
    pricing: {
      isFree: false,
      price: 29.99,
      currency: '¥',
      originalPrice: 39.99,
      discount: 25,
      priceText: '¥29.99'
    },
    
    fileInfo: {
      format: 'C4D',
      size: '15.6MB',
      sizeBytes: 16384000,
      downloadUrl: 'https://example.com/download/phone-model.zip'
    },
    
    statistics: {
      downloadCount: 1250,
      viewCount: 8900,
      likeCount: 156,
      rating: 4.5,
      reviewCount: 23
    },
    
    categorization: {
      category: '电子产品',
      subcategory: '智能手机',
      tags: ['手机', '3D模型', 'C4D', '产品展示', '高质量'],
      keywords: ['smartphone', 'mobile', 'phone', '3d model']
    },
    
    author: {
      name: '设计师小王',
      profileUrl: 'https://example.com/user/xiaowang',
      avatar: 'https://example.com/avatar/xiaowang.jpg'
    },
    
    timestamps: {
      uploadDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7天前
      lastUpdated: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2天前
      extractedAt: now
    },
    
    extraction: {
      ruleId: 'modown-v1.0',
      status: 'success',
      confidence: 0.95,
      missingFields: [],
      errors: undefined,
      processingTime: 1250
    },
    
    quality: {
      score: 92,
      factors: {
        completeness: 95,
        imageQuality: 88,
        dataAccuracy: 93
      }
    }
  };
  
  return { ...defaultResult, ...overrides };
}

/**
 * 创建不同质量等级的模拟数据
 */
export function createMockResultsByQuality(): {
  high: ExtractedMaterialResult;
  medium: ExtractedMaterialResult;
  low: ExtractedMaterialResult;
} {
  return {
    high: createMockExtractedResult({
      quality: { score: 95, factors: { completeness: 98, imageQuality: 92, dataAccuracy: 95 } },
      extraction: { 
        ruleId: 'test', 
        status: 'success', 
        confidence: 0.98, 
        missingFields: [], 
        processingTime: 800 
      }
    }),
    
    medium: createMockExtractedResult({
      description: undefined,
      fileInfo: { format: 'C4D', size: undefined, sizeBytes: undefined, downloadUrl: undefined },
      statistics: { downloadCount: 450, viewCount: undefined, likeCount: undefined, rating: 3.8, reviewCount: 8 },
      quality: { score: 72, factors: { completeness: 75, imageQuality: 70, dataAccuracy: 71 } },
      extraction: { 
        ruleId: 'test', 
        status: 'partial', 
        confidence: 0.72, 
        missingFields: ['description', 'fileSize', 'viewCount'], 
        processingTime: 1200 
      }
    }),
    
    low: createMockExtractedResult({
      description: undefined,
      previewImages: [],
      fileInfo: { format: undefined, size: undefined, sizeBytes: undefined, downloadUrl: undefined },
      statistics: { downloadCount: undefined, viewCount: undefined, likeCount: undefined, rating: undefined, reviewCount: undefined },
      author: undefined,
      quality: { score: 35, factors: { completeness: 40, imageQuality: 0, dataAccuracy: 65 } },
      extraction: { 
        ruleId: 'test', 
        status: 'failed', 
        confidence: 0.35, 
        missingFields: ['description', 'previewImages', 'fileFormat', 'statistics', 'author'], 
        errors: ['Failed to extract image URLs', 'Missing file information'],
        processingTime: 2500 
      }
    })
  };
}