/**
 * 预配置的爬虫规则
 * 包含主流3D素材网站的爬虫配置
 */

import type { CrawlerRule } from '../types/crawler';

/**
 * 魔顿网 (modown.cn) 爬虫规则
 * 更新后的规则，修复链接提取和数据提取问题
 */
const modownRule: CrawlerRule = {
  id: 'modown',
  websiteName: '魔顿网',
  websiteIcon: 'https://www.modown.cn/favicon.ico',
  baseUrl: 'https://www.modown.cn',
  isActive: true,
  isPreset: true,
  
  searchConfig: {
    urlTemplate: 'https://www.modown.cn/?s={keyword}',
    method: 'GET',
    encoding: 'utf-8'
  },
  
  parseConfig: {
    listSelectors: {
      // 修复搜索结果页面的选择器 - 基于实际的魔顿网页面结构
      container: '#main, .main, .content, .posts, .search-results, body',
      item: 'article, .post, .entry, [class*="post"], h2, h3, .result-item',
      link: 'h2 a[href*="archives"], h3 a[href*="archives"], .entry-title a[href*="archives"], .post-title a[href*="archives"], a[href*="archives"]'
    },
    detailSelectors: {
      // 更新详情页面的选择器 - 基于魔顿网实际页面结构
      title: 'h1.entry-title, .post-title h1, .single-title, h1, .title',
      description: '.entry-content p:first-of-type, .post-content p:first-of-type, .content p:first-of-type, .excerpt, .summary',
      images: '.entry-content img[src*="wp-content"], .post-content img[src*="wp-content"], .wp-post-image, .featured-image img, img[src*="uploads"], .attachment-post-thumbnail, .post-thumbnail img',
      price: '.download-price, .price-info, .vip-price, [class*="price"], .cost, .money',
      freeIndicator: '.free-download, .免费下载, .free-tag, [class*="free"], .gratis',
      fileInfo: {
        format: '.file-type, .format-info, .download-format, [class*="format"], .extension',
        size: '.file-size, .size-info, .download-size, [class*="size"], .filesize'
      },
      stats: {
        downloads: '.download-count, .dl-count, .downloads, [class*="download"], .down-num',
        views: '.view-count, .views, .post-views, [class*="view"], .hit'
      },
      metadata: {
        author: '.author-name, .post-author, .by-author, [class*="author"], .writer',
        tags: '.post-tags a, .tag-links a, .tags a, [rel="tag"], .tagcloud a',
        category: '.post-category a, .cat-links a, .category a, .breadcrumb a',
        uploadDate: '.post-date, .entry-date, .publish-date, time, .date'
      }
    }
  },
  
  dataProcessing: {
    textCleanup: {
      removeHtml: true,
      trimWhitespace: true,
      removeEmptyLines: true
    },
    priceExtraction: {
      regex: '([\\d.]+)',
      currency: 'CNY',
      freeKeywords: ['免费', 'free', '0元', '0.00', '免费下载', '免费资源', 'Free', '免费素材', '不收费', '无需付费']
    },
    dateProcessing: {
      format: 'YYYY-MM-DD',
      locale: 'zh-CN'
    },
    imageProcessing: {
      baseUrl: 'https://www.modown.cn',
      preferredSize: 'medium',
      fallbackImage: 'https://www.modown.cn/wp-content/themes/modown/images/default-thumb.jpg'
    }
  },
  
  antiDetection: {
    useHeadlessBrowser: true,
    browserConfig: {
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      enableJavaScript: true,
      waitForSelector: '#main, .content, .posts, body',
      waitTime: 2000
    },
    requestConfig: {
      delay: 2000,
      randomDelay: true,
      maxRetries: 3,
      timeout: 30000
    },
    proxyConfig: {
      enabled: false,
      rotateProxies: false
    }
  },
  
  qualityControl: {
    minTitleLength: 3,
    requireImage: false,
    requirePrice: false,
    maxResultsPerPage: 15,
    duplicateDetection: true
  },
  
  testing: {
    testKeyword: '手机',
    successRate: 0.85,
    avgResponseTime: 3000
  }
};

/**
 * CG资源网 (cgown.com) 爬虫规则
 */
const cgownRule: CrawlerRule = {
  id: 'cgown',
  websiteName: 'CG资源网',
  websiteIcon: 'https://www.cgown.com/favicon.ico',
  baseUrl: 'https://www.cgown.com',
  isActive: true,
  isPreset: true,
  
  searchConfig: {
    urlTemplate: 'https://www.cgown.com/search?keyword={keyword}',
    method: 'GET',
    encoding: 'utf-8'
  },
  
  parseConfig: {
    listSelectors: {
      container: '.search-results, .post-list',
      item: '.post-item, .result-item',
      link: '.post-title a, .title a'
    },
    detailSelectors: {
      title: '.post-title, .entry-title, h1',
      description: '.post-excerpt, .content p:first-of-type',
      images: '.post-thumbnail img, .preview-image, .content img',
      price: '.price-info, .download-price',
      freeIndicator: '.free-tag, .免费',
      fileInfo: {
        format: '.file-type, .format-info',
        size: '.file-size-info'
      },
      stats: {
        downloads: '.download-stats, .dl-count',
        views: '.view-stats, .view-count',
        rating: '.rating-score'
      },
      metadata: {
        author: '.author-info, .uploader',
        tags: '.tag-list a, .post-tags a',
        category: '.category-info a',
        uploadDate: '.upload-date, .post-date'
      }
    }
  },
  
  dataProcessing: {
    textCleanup: {
      removeHtml: true,
      trimWhitespace: true,
      removeEmptyLines: true
    },
    priceExtraction: {
      regex: '([\\d.]+)',
      currency: 'CNY',
      freeKeywords: ['免费', 'free', '0积分']
    },
    dateProcessing: {
      format: 'YYYY-MM-DD',
      locale: 'zh-CN'
    },
    imageProcessing: {
      baseUrl: 'https://www.cgown.com',
      preferredSize: 'medium'
    }
  },
  
  antiDetection: {
    useHeadlessBrowser: true,
    browserConfig: {
      viewport: { width: 1920, height: 1080 },
      enableJavaScript: true,
      waitTime: 1500
    },
    requestConfig: {
      delay: 1500,
      randomDelay: true,
      maxRetries: 3,
      timeout: 25000
    }
  },
  
  qualityControl: {
    minTitleLength: 3,
    requireImage: false,
    requirePrice: false,
    maxResultsPerPage: 15,
    duplicateDetection: true
  },
  
  testing: {
    testKeyword: '建筑',
    successRate: 0.80,
    avgResponseTime: 2500
  }
};

/**
 * 书生CG资源站 (c4dsky.com) 爬虫规则
 */
const c4dskyRule: CrawlerRule = {
  id: 'c4dsky',
  websiteName: '书生CG资源站',
  websiteIcon: 'https://c4dsky.com/favicon.ico',
  baseUrl: 'https://c4dsky.com',
  isActive: true,
  isPreset: true,
  
  searchConfig: {
    urlTemplate: 'https://c4dsky.com/?s={keyword}',
    method: 'GET',
    encoding: 'utf-8'
  },
  
  parseConfig: {
    listSelectors: {
      container: '.search-results, #main',
      item: '.post, article',
      link: '.entry-title a, .post-title a'
    },
    detailSelectors: {
      title: '.entry-title, .post-title, h1.title',
      description: '.entry-content p:first-of-type, .post-content p:first-of-type',
      images: '.entry-content img, .post-content img, .wp-post-image',
      price: '.download-info .price, .price-tag',
      freeIndicator: '.free-download, .免费下载',
      fileInfo: {
        format: '.file-format, .download-format',
        size: '.file-size, .download-size'
      },
      stats: {
        downloads: '.download-count',
        views: '.post-views, .view-count'
      },
      metadata: {
        author: '.author-name, .post-author',
        tags: '.post-tags a, .tag-links a',
        category: '.post-categories a, .cat-links a',
        uploadDate: '.post-date, .entry-date'
      }
    }
  },
  
  dataProcessing: {
    textCleanup: {
      removeHtml: true,
      trimWhitespace: true,
      removeEmptyLines: true
    },
    priceExtraction: {
      regex: '([\\d.]+)',
      currency: 'CNY',
      freeKeywords: ['免费', 'free', '免费下载']
    },
    dateProcessing: {
      format: 'YYYY年MM月DD日',
      locale: 'zh-CN'
    },
    imageProcessing: {
      baseUrl: 'https://c4dsky.com',
      preferredSize: 'large'
    }
  },
  
  antiDetection: {
    useHeadlessBrowser: true,
    browserConfig: {
      viewport: { width: 1920, height: 1080 },
      enableJavaScript: true,
      waitForSelector: '#main',
      waitTime: 2500
    },
    requestConfig: {
      delay: 2500,
      randomDelay: true,
      maxRetries: 3,
      timeout: 35000
    }
  },
  
  qualityControl: {
    minTitleLength: 4,
    requireImage: true,
    requirePrice: false,
    maxResultsPerPage: 12,
    duplicateDetection: true
  },
  
  testing: {
    testKeyword: 'C4D模型',
    successRate: 0.90,
    avgResponseTime: 4000
  }
};

/**
 * 3D溜溜网 (3dxy.com) 爬虫规则
 */
const d3dxyRule: CrawlerRule = {
  id: '3dxy',
  websiteName: '3D溜溜网',
  websiteIcon: 'https://www.3dxy.com/favicon.ico',
  baseUrl: 'https://www.3dxy.com',
  isActive: true,
  isPreset: true,
  
  searchConfig: {
    urlTemplate: 'https://www.3dxy.com/search/?keyword={keyword}',
    method: 'GET',
    encoding: 'utf-8'
  },
  
  parseConfig: {
    listSelectors: {
      container: '.search-list, .model-list',
      item: '.list-item, .model-item',
      link: '.item-title a, .model-link'
    },
    detailSelectors: {
      title: '.model-title, .detail-title h1',
      description: '.model-desc, .detail-info .desc',
      images: '.model-preview img, .preview-gallery img',
      price: '.price-info .price, .download-price',
      freeIndicator: '.free-tag, .免费模型',
      fileInfo: {
        format: '.file-format, .model-format',
        size: '.file-size, .model-size'
      },
      stats: {
        downloads: '.download-num, .dl-count',
        views: '.view-num, .browse-count',
        rating: '.rating-score, .star-rating'
      },
      metadata: {
        author: '.author-info .name, .uploader-name',
        tags: '.tag-list a, .model-tags a',
        category: '.category-path a, .breadcrumb a',
        uploadDate: '.upload-time, .create-time'
      }
    }
  },
  
  dataProcessing: {
    textCleanup: {
      removeHtml: true,
      trimWhitespace: true,
      removeEmptyLines: true
    },
    priceExtraction: {
      regex: '([\\d.]+)',
      currency: 'CNY',
      freeKeywords: ['免费', 'free', '0溜币']
    },
    dateProcessing: {
      format: 'YYYY-MM-DD HH:mm',
      locale: 'zh-CN'
    },
    imageProcessing: {
      baseUrl: 'https://www.3dxy.com',
      preferredSize: 'large'
    }
  },
  
  antiDetection: {
    useHeadlessBrowser: true,
    browserConfig: {
      viewport: { width: 1920, height: 1080 },
      enableJavaScript: true,
      waitForSelector: '.model-list, .search-list',
      waitTime: 3000
    },
    requestConfig: {
      delay: 3000,
      randomDelay: true,
      maxRetries: 3,
      timeout: 40000
    }
  },
  
  qualityControl: {
    minTitleLength: 3,
    requireImage: true,
    requirePrice: false,
    maxResultsPerPage: 18,
    duplicateDetection: true
  },
  
  testing: {
    testKeyword: '沙发',
    successRate: 0.88,
    avgResponseTime: 3500
  }
};

/**
 * 所有预配置规则
 */
export const presetRules: CrawlerRule[] = [
  modownRule,
  cgownRule,
  c4dskyRule,
  d3dxyRule
];

/**
 * 根据ID获取预配置规则
 */
export function getPresetRule(id: string): CrawlerRule | undefined {
  return presetRules.find(rule => rule.id === id);
}

/**
 * 获取所有激活的预配置规则
 */
export function getActivePresetRules(): CrawlerRule[] {
  return presetRules.filter(rule => rule.isActive);
}

/**
 * 验证规则配置的完整性
 */
export function validateRuleConfig(rule: CrawlerRule): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必填字段
  if (!rule.id) errors.push('规则ID不能为空');
  if (!rule.websiteName) errors.push('网站名称不能为空');
  if (!rule.baseUrl) errors.push('基础URL不能为空');
  if (!rule.searchConfig.urlTemplate) errors.push('搜索URL模板不能为空');

  // 检查URL模板格式
  if (rule.searchConfig.urlTemplate && !rule.searchConfig.urlTemplate.includes('{keyword}')) {
    errors.push('搜索URL模板必须包含{keyword}占位符');
  }

  // 检查选择器配置
  if (!rule.parseConfig.listSelectors.container) {
    errors.push('列表容器选择器不能为空');
  }
  if (!rule.parseConfig.listSelectors.item) {
    errors.push('列表项选择器不能为空');
  }
  if (!rule.parseConfig.listSelectors.link) {
    errors.push('链接选择器不能为空');
  }
  if (!rule.parseConfig.detailSelectors.title) {
    errors.push('标题选择器不能为空');
  }

  // 检查反爬虫配置
  if (rule.antiDetection.requestConfig.delay < 500) {
    errors.push('请求延迟不能少于500毫秒');
  }
  if (rule.antiDetection.requestConfig.timeout < 5000) {
    errors.push('请求超时时间不能少于5秒');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 创建规则模板
 */
export function createRuleTemplate(websiteName: string, baseUrl: string): Partial<CrawlerRule> {
  return {
    websiteName,
    baseUrl,
    isActive: true,
    isPreset: false,
    
    searchConfig: {
      urlTemplate: `${baseUrl}/search?q={keyword}`,
      method: 'GET',
      encoding: 'utf-8'
    },
    
    parseConfig: {
      listSelectors: {
        container: '.search-results',
        item: '.result-item',
        link: '.title a'
      },
      detailSelectors: {
        title: 'h1, .title',
        description: '.description, .content p:first-of-type',
        images: '.preview img, .gallery img'
      }
    },
    
    dataProcessing: {
      textCleanup: {
        removeHtml: true,
        trimWhitespace: true,
        removeEmptyLines: true
      },
      priceExtraction: {
        currency: 'CNY',
        freeKeywords: ['免费', 'free']
      },
      dateProcessing: {
        format: 'YYYY-MM-DD',
        locale: 'zh-CN'
      },
      imageProcessing: {
        baseUrl,
        preferredSize: 'medium'
      }
    },
    
    antiDetection: {
      useHeadlessBrowser: true,
      browserConfig: {
        viewport: { width: 1920, height: 1080 },
        enableJavaScript: true,
        waitTime: 2000
      },
      requestConfig: {
        delay: 2000,
        randomDelay: true,
        maxRetries: 3,
        timeout: 30000
      }
    },
    
    qualityControl: {
      minTitleLength: 3,
      requireImage: false,
      requirePrice: false,
      maxResultsPerPage: 20,
      duplicateDetection: true
    },
    
    testing: {
      testKeyword: '测试',
      successRate: 0,
      avgResponseTime: 0
    }
  };
}