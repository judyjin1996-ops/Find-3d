/**
 * 反爬虫检测处理类
 * 负责应对各种反爬虫机制
 */

import { Page } from 'puppeteer';
import UserAgent from 'user-agents';
import { CrawlerRule } from '../types/crawler';
import { proxyManager, ProxyConfig } from '../utils/proxyManager';
import { rateLimiter } from '../utils/rateLimiter';

export class AntiDetection {
  private userAgents: string[];
  private currentUserAgentIndex = 0;
  private currentProxy: ProxyConfig | null = null;
  private websiteFailureCounts = new Map<string, number>();
  private lastProxySwitch = new Map<string, Date>();

  constructor() {
    // 预定义常用的User-Agent
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];

    // 初始化频率限制配置
    this.initializeRateLimits();
  }

  /**
   * 设置页面反爬虫配置
   */
  async setupPage(page: Page, antiDetectionConfig: CrawlerRule['antiDetection']): Promise<void> {
    try {
      // 设置视窗大小
      if (antiDetectionConfig.browserConfig?.viewport) {
        await page.setViewport(antiDetectionConfig.browserConfig.viewport);
      } else {
        await page.setViewport({ width: 1920, height: 1080 });
      }

      // 设置User-Agent
      const userAgent = antiDetectionConfig.browserConfig?.userAgent || this.getRandomUserAgent();
      await page.setUserAgent(userAgent);

      // 设置额外的Headers
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      });

      // 禁用图片加载以提高速度（可选）
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'image' && !this.isImportantImage(req.url())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // 注入反检测脚本
      await page.evaluateOnNewDocument(() => {
        // 隐藏webdriver属性
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // 伪造Chrome对象
        (window as any).chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        };

        // 伪造权限API
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );

        // 伪造插件
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // 伪造语言
        Object.defineProperty(navigator, 'languages', {
          get: () => ['zh-CN', 'zh', 'en'],
        });
      });

      console.log(`🛡️ 反爬虫配置已应用: ${userAgent.substring(0, 50)}...`);
    } catch (error) {
      console.error('设置反爬虫配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取随机User-Agent
   */
  private getRandomUserAgent(): string {
    const userAgent = this.userAgents[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    return userAgent;
  }

  /**
   * 判断是否为重要图片（需要加载）
   */
  private isImportantImage(url: string): boolean {
    // 如果是预览图或缩略图，则需要加载
    const importantPatterns = [
      /thumb/i,
      /preview/i,
      /cover/i,
      /avatar/i,
      /logo/i
    ];

    return importantPatterns.some(pattern => pattern.test(url));
  }

  /**
   * 检测是否遇到验证码
   */
  async detectCaptcha(page: Page): Promise<boolean> {
    try {
      const captchaSelectors = [
        'img[src*="captcha"]',
        'img[src*="verify"]',
        '.captcha',
        '#captcha',
        '[class*="captcha"]',
        '[id*="captcha"]'
      ];

      for (const selector of captchaSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.log('🤖 检测到验证码');
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 检测是否被封禁
   */
  async detectBlocked(page: Page): Promise<boolean> {
    try {
      const content = await page.content();
      const blockedKeywords = [
        '访问被拒绝',
        'Access Denied',
        '403 Forbidden',
        '您的访问过于频繁',
        'Too Many Requests',
        '请稍后再试',
        'Please try again later',
        '验证码',
        'captcha',
        'blocked'
      ];

      return blockedKeywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  /**
   * 智能等待
   */
  async smartWait(page: Page, rule: CrawlerRule): Promise<void> {
    const config = rule.antiDetection.browserConfig;
    
    if (config?.waitForSelector) {
      try {
        await page.waitForSelector(config.waitForSelector, { timeout: 10000 });
      } catch {
        console.warn('等待选择器超时:', config.waitForSelector);
      }
    }

    if (config?.waitTime) {
      await this.delay(config.waitTime);
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 随机延迟
   */
  async randomDelay(baseDelay: number, randomFactor = 0.5): Promise<void> {
    const randomDelay = baseDelay * (1 + Math.random() * randomFactor);
    await this.delay(randomDelay);
  }

  /**
   * 模拟人类行为
   */
  async simulateHumanBehavior(page: Page): Promise<void> {
    try {
      // 随机滚动
      await page.evaluate(() => {
        const scrollHeight = Math.random() * window.innerHeight;
        window.scrollTo(0, scrollHeight);
      });

      // 随机等待
      await this.randomDelay(1000, 0.5);

      // 随机鼠标移动
      const viewport = page.viewport();
      if (viewport) {
        await page.mouse.move(
          Math.random() * viewport.width,
          Math.random() * viewport.height
        );
      }
    } catch (error) {
      console.warn('模拟人类行为失败:', error);
    }
  }

  /**
   * 初始化频率限制配置
   */
  private initializeRateLimits(): void {
    // 为不同网站设置不同的频率限制
    rateLimiter.setWebsiteRateLimit('modown.cn', {
      requestsPerSecond: 0.5, // 2秒一次请求
      requestsPerMinute: 20,
      requestsPerHour: 500,
      burstSize: 2,
      adaptiveDelay: true,
      respectRetryAfter: true
    });

    rateLimiter.setWebsiteRateLimit('cgown.com', {
      requestsPerSecond: 1,
      requestsPerMinute: 30,
      requestsPerHour: 800,
      burstSize: 3,
      adaptiveDelay: true,
      respectRetryAfter: true
    });

    rateLimiter.setWebsiteRateLimit('c4dsky.com', {
      requestsPerSecond: 0.8,
      requestsPerMinute: 25,
      requestsPerHour: 600,
      burstSize: 2,
      adaptiveDelay: true,
      respectRetryAfter: true
    });

    rateLimiter.setWebsiteRateLimit('3dxy.com', {
      requestsPerSecond: 1,
      requestsPerMinute: 40,
      requestsPerHour: 1000,
      burstSize: 4,
      adaptiveDelay: true,
      respectRetryAfter: true
    });
  }

  /**
   * 请求前的准备工作
   */
  async prepareRequest(websiteId: string, rule: CrawlerRule): Promise<void> {
    // 等待频率限制
    await rateLimiter.waitForRequest(websiteId);

    // 检查是否需要切换代理
    await this.checkAndSwitchProxy(websiteId);

    console.log(`🚀 准备请求: ${websiteId}`);
  }

  /**
   * 记录请求结果
   */
  recordRequestResult(
    websiteId: string,
    success: boolean,
    responseTime: number,
    statusCode?: number,
    retryAfter?: number
  ): void {
    // 记录到频率控制器
    rateLimiter.recordRequest(websiteId, success, responseTime, statusCode, retryAfter);

    // 记录到代理管理器
    if (this.currentProxy) {
      proxyManager.reportProxyResult(this.currentProxy, success, responseTime, 
        success ? undefined : `HTTP ${statusCode || 'Unknown'}`);
    }

    // 更新失败计数
    if (success) {
      this.websiteFailureCounts.delete(websiteId);
    } else {
      const currentCount = this.websiteFailureCounts.get(websiteId) || 0;
      this.websiteFailureCounts.set(websiteId, currentCount + 1);
    }
  }

  /**
   * 检查并切换代理
   */
  private async checkAndSwitchProxy(websiteId: string): Promise<void> {
    const failureCount = this.websiteFailureCounts.get(websiteId) || 0;
    const lastSwitch = this.lastProxySwitch.get(websiteId);
    const timeSinceLastSwitch = lastSwitch ? Date.now() - lastSwitch.getTime() : Infinity;

    // 如果失败次数过多或距离上次切换时间过长，尝试切换代理
    if (failureCount >= 3 || timeSinceLastSwitch > 30 * 60 * 1000) { // 30分钟
      const newProxy = proxyManager.getNextProxy();
      if (newProxy && newProxy !== this.currentProxy) {
        this.currentProxy = newProxy;
        this.lastProxySwitch.set(websiteId, new Date());
        console.log(`🔄 切换代理: ${newProxy.host}:${newProxy.port} (失败次数: ${failureCount})`);
      }
    }
  }

  /**
   * 检测IP封禁
   */
  async detectIPBan(page: Page): Promise<boolean> {
    try {
      const content = await page.content();
      const title = await page.title();
      
      const banKeywords = [
        'ip被封',
        'ip banned',
        'access denied',
        '访问被拒绝',
        '403 forbidden',
        'your ip has been blocked',
        '您的ip已被封禁',
        'too many requests',
        '请求过于频繁'
      ];

      const contentLower = content.toLowerCase();
      const titleLower = title.toLowerCase();
      
      const isBanned = banKeywords.some(keyword => 
        contentLower.includes(keyword) || titleLower.includes(keyword)
      );

      if (isBanned) {
        console.log('🚫 检测到IP封禁');
        // 立即切换代理
        const newProxy = proxyManager.getNextProxy();
        if (newProxy) {
          this.currentProxy = newProxy;
          console.log(`🔄 因IP封禁切换代理: ${newProxy.host}:${newProxy.port}`);
        }
      }

      return isBanned;
    } catch {
      return false;
    }
  }

  /**
   * 处理反爬虫响应
   */
  async handleAntiCrawlerResponse(page: Page, websiteId: string): Promise<{
    shouldRetry: boolean;
    waitTime: number;
    switchProxy: boolean;
  }> {
    const isCaptcha = await this.detectCaptcha(page);
    const isBlocked = await this.detectBlocked(page);
    const isIPBan = await this.detectIPBan(page);

    let shouldRetry = false;
    let waitTime = 0;
    let switchProxy = false;

    if (isCaptcha) {
      console.log('🤖 遇到验证码，跳过此页面');
      switchProxy = true;
      waitTime = 30000; // 等待30秒
    } else if (isIPBan) {
      console.log('🚫 IP被封禁，切换代理');
      switchProxy = true;
      shouldRetry = true;
      waitTime = 60000; // 等待1分钟
    } else if (isBlocked) {
      console.log('⛔ 访问被阻止，增加延迟');
      shouldRetry = true;
      waitTime = 120000; // 等待2分钟
      
      // 连续被阻止时切换代理
      const failureCount = this.websiteFailureCounts.get(websiteId) || 0;
      if (failureCount >= 2) {
        switchProxy = true;
      }
    }

    if (switchProxy) {
      const newProxy = proxyManager.getNextProxy();
      if (newProxy) {
        this.currentProxy = newProxy;
        this.lastProxySwitch.set(websiteId, new Date());
      }
    }

    return { shouldRetry, waitTime, switchProxy };
  }

  /**
   * 获取当前代理信息
   */
  getCurrentProxy(): ProxyConfig | null {
    return this.currentProxy;
  }

  /**
   * 手动设置代理
   */
  setProxy(proxy: ProxyConfig | null): void {
    this.currentProxy = proxy;
    if (proxy) {
      console.log(`🌐 手动设置代理: ${proxy.host}:${proxy.port}`);
    } else {
      console.log('🌐 清除代理设置');
    }
  }

  /**
   * 获取反爬虫统计信息
   */
  getAntiCrawlerStats(): {
    currentProxy: ProxyConfig | null;
    websiteFailures: Map<string, number>;
    proxyStats: any;
    rateLimitStats: any;
  } {
    return {
      currentProxy: this.currentProxy,
      websiteFailures: new Map(this.websiteFailureCounts),
      proxyStats: proxyManager.getProxyStats(),
      rateLimitStats: rateLimiter.getGlobalStats()
    };
  }

  /**
   * 重置网站状态
   */
  resetWebsiteStatus(websiteId: string): void {
    this.websiteFailureCounts.delete(websiteId);
    this.lastProxySwitch.delete(websiteId);
    rateLimiter.resetWebsite(websiteId);
    console.log(`🔄 重置网站反爬虫状态: ${websiteId}`);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.websiteFailureCounts.clear();
    this.lastProxySwitch.clear();
    this.currentProxy = null;
    console.log('🧹 反爬虫检测器资源清理完成');
  }
}