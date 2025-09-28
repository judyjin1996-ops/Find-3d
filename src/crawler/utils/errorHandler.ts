/**
 * 爬虫错误处理工具
 */

import type { CrawlingError, CrawlerErrorType } from '../types/crawler';

export class ErrorHandler {
  /**
   * 创建爬虫错误对象
   */
  createError(
    type: CrawlerErrorType,
    message: string,
    details?: any,
    websiteId?: string,
    ruleId?: string
  ): CrawlingError {
    return {
      type,
      message,
      details,
      timestamp: new Date(),
      websiteId: websiteId || 'unknown',
      ruleId,
      severity: this.determineSeverity(type),
      recoverable: this.isRecoverable(type)
    };
  }

  /**
   * 确定错误严重程度
   */
  private determineSeverity(type: CrawlerErrorType): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case CrawlerErrorType.NETWORK_ERROR:
      case CrawlerErrorType.TIMEOUT_ERROR:
        return 'medium';
      
      case CrawlerErrorType.BLOCKED_BY_WEBSITE:
      case CrawlerErrorType.IP_BANNED:
        return 'high';
      
      case CrawlerErrorType.BROWSER_CRASH:
      case CrawlerErrorType.MEMORY_ERROR:
        return 'critical';
      
      case CrawlerErrorType.PARSE_ERROR:
      case CrawlerErrorType.SELECTOR_NOT_FOUND:
        return 'medium';
      
      default:
        return 'low';
    }
  }

  /**
   * 判断错误是否可恢复
   */
  private isRecoverable(type: CrawlerErrorType): boolean {
    const nonRecoverableErrors = [
      CrawlerErrorType.INVALID_RULE_CONFIG,
      CrawlerErrorType.MISSING_SELECTOR,
      CrawlerErrorType.INVALID_URL_TEMPLATE
    ];

    return !nonRecoverableErrors.includes(type);
  }

  /**
   * 处理错误并决定重试策略
   */
  shouldRetry(error: CrawlingError, retryCount: number, maxRetries: number): boolean {
    if (retryCount >= maxRetries) {
      return false;
    }

    if (!error.recoverable) {
      return false;
    }

    // 根据错误类型决定是否重试
    switch (error.type) {
      case CrawlerErrorType.NETWORK_ERROR:
      case CrawlerErrorType.TIMEOUT_ERROR:
      case CrawlerErrorType.CONNECTION_REFUSED:
        return true;
      
      case CrawlerErrorType.BLOCKED_BY_WEBSITE:
      case CrawlerErrorType.RATE_LIMITED:
        return retryCount < 2; // 最多重试2次
      
      case CrawlerErrorType.IP_BANNED:
        return false; // IP被封不重试
      
      default:
        return retryCount < 1; // 其他错误最多重试1次
    }
  }

  /**
   * 计算重试延迟（指数退避）
   */
  calculateRetryDelay(retryCount: number, baseDelay = 1000): number {
    return Math.min(baseDelay * Math.pow(2, retryCount), 30000); // 最大30秒
  }

  /**
   * 记录错误日志
   */
  logError(error: CrawlingError): void {
    const timestamp = error.timestamp.toISOString();
    const severity = error.severity.toUpperCase();
    
    console.error(`[${timestamp}] ${severity} - ${error.type}: ${error.message}`);
    
    if (error.details) {
      console.error('错误详情:', error.details);
    }
  }

  /**
   * 分析错误模式
   */
  analyzeErrorPattern(errors: CrawlingError[]): {
    mostCommonError: CrawlerErrorType;
    errorRate: number;
    suggestions: string[];
  } {
    if (errors.length === 0) {
      return {
        mostCommonError: CrawlerErrorType.NETWORK_ERROR,
        errorRate: 0,
        suggestions: []
      };
    }

    // 统计错误类型
    const errorCounts = new Map<CrawlerErrorType, number>();
    errors.forEach(error => {
      const count = errorCounts.get(error.type) || 0;
      errorCounts.set(error.type, count + 1);
    });

    // 找出最常见的错误
    let mostCommonError = CrawlerErrorType.NETWORK_ERROR;
    let maxCount = 0;
    errorCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonError = type;
      }
    });

    // 生成建议
    const suggestions = this.generateSuggestions(mostCommonError, errors);

    return {
      mostCommonError,
      errorRate: errors.length,
      suggestions
    };
  }

  /**
   * 生成错误处理建议
   */
  private generateSuggestions(errorType: CrawlerErrorType, errors: CrawlingError[]): string[] {
    const suggestions: string[] = [];

    switch (errorType) {
      case CrawlerErrorType.BLOCKED_BY_WEBSITE:
        suggestions.push('增加请求间隔时间');
        suggestions.push('启用代理IP轮换');
        suggestions.push('更换User-Agent');
        break;
      
      case CrawlerErrorType.SELECTOR_NOT_FOUND:
        suggestions.push('检查页面结构是否发生变化');
        suggestions.push('更新CSS选择器');
        suggestions.push('添加备用选择器');
        break;
      
      case CrawlerErrorType.TIMEOUT_ERROR:
        suggestions.push('增加请求超时时间');
        suggestions.push('检查网络连接');
        suggestions.push('减少并发请求数');
        break;
      
      case CrawlerErrorType.RATE_LIMITED:
        suggestions.push('降低请求频率');
        suggestions.push('启用随机延迟');
        suggestions.push('使用代理IP池');
        break;
      
      default:
        suggestions.push('检查网站可访问性');
        suggestions.push('验证爬虫规则配置');
    }

    return suggestions;
  }

  /**
   * 检测并处理常见的反爬虫机制
   */
  async handleAntiCrawlerMechanisms(page: Page): Promise<boolean> {
    try {
      // 检测验证码
      const hasCaptcha = await this.detectCaptcha(page);
      if (hasCaptcha) {
        console.log('🤖 检测到验证码，跳过此页面');
        return false;
      }

      // 检测访问限制
      const isBlocked = await this.detectAccessRestriction(page);
      if (isBlocked) {
        console.log('🚫 检测到访问限制，跳过此页面');
        return false;
      }

      // 检测JavaScript挑战
      const hasJsChallenge = await this.detectJavaScriptChallenge(page);
      if (hasJsChallenge) {
        console.log('⚡ 检测到JavaScript挑战，等待处理...');
        await this.delay(5000); // 等待5秒让JS执行
      }

      return true;
    } catch (error) {
      console.error('反爬虫机制检测失败:', error);
      return false;
    }
  }

  /**
   * 检测验证码
   */
  private async detectCaptcha(page: Page): Promise<boolean> {
    const captchaSelectors = [
      'img[src*="captcha"]',
      'img[src*="verify"]',
      '.captcha',
      '#captcha',
      '[class*="captcha"]',
      '[id*="captcha"]',
      '.geetest',
      '#geetest'
    ];

    for (const selector of captchaSelectors) {
      try {
        const element = await page.$(selector);
        if (element) return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  /**
   * 检测访问限制
   */
  private async detectAccessRestriction(page: Page): Promise<boolean> {
    try {
      const content = await page.content();
      const restrictionKeywords = [
        '访问被拒绝',
        'Access Denied',
        '403 Forbidden',
        '您的访问过于频繁',
        'Too Many Requests',
        '请稍后再试',
        'Please try again later',
        'Rate limit exceeded',
        '服务不可用',
        'Service Unavailable'
      ];

      return restrictionKeywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  /**
   * 检测JavaScript挑战
   */
  private async detectJavaScriptChallenge(page: Page): Promise<boolean> {
    try {
      const challengeSelectors = [
        '[data-cf-beacon]', // Cloudflare
        '.cf-browser-verification',
        '#challenge-form',
        '.challenge-form',
        '[class*="challenge"]'
      ];

      for (const selector of challengeSelectors) {
        const element = await page.$(selector);
        if (element) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}