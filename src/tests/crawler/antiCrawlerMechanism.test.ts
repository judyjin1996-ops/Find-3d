/**
 * 反爬虫机制测试
 * 测试系统的反爬虫检测和应对策略
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { AntiDetection } from '../../crawler/engine/AntiDetection';
import { proxyManager } from '../../crawler/utils/proxyManager';
import { rateLimiter } from '../../crawler/utils/rateLimiter';
import { errorHandler } from '../../crawler/utils/errorHandler';
import type { CrawlerRule } from '../../crawler/types/crawler';

describe('反爬虫机制测试', () => {
  let antiDetection: AntiDetection;

  beforeAll(async () => {
    antiDetection = new AntiDetection();
    await antiDetection.initialize();
    console.log('🛡️ 反爬虫机制测试环境初始化完成');
  });

  afterAll(async () => {
    await antiDetection.cleanup();
    await proxyManager.cleanup();
    rateLimiter.cleanup();
    console.log('🧹 反爬虫机制测试环境清理完成');
  });

  describe('User-Agent 轮换测试', () => {
    test('应该能够生成不同的User-Agent', () => {
      const userAgents = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const userAgent = antiDetection.getRandomUserAgent();
        userAgents.add(userAgent);
        
        // 验证User-Agent格式
        expect(userAgent).toBeTruthy();
        expect(userAgent).toMatch(/Mozilla|Chrome|Safari|Firefox/);
      }
      
      // 应该生成多个不同的User-Agent
      expect(userAgents.size).toBeGreaterThan(1);
      console.log(`✅ 生成了 ${userAgents.size} 个不同的User-Agent`);
    });

    test('应该能够生成移动端User-Agent', () => {
      const mobileUserAgent = antiDetection.getRandomUserAgent('mobile');
      
      expect(mobileUserAgent).toBeTruthy();
      expect(mobileUserAgent).toMatch(/Mobile|Android|iPhone|iPad/i);
    });

    test('应该能够生成桌面端User-Agent', () => {
      const desktopUserAgent = antiDetection.getRandomUserAgent('desktop');
      
      expect(desktopUserAgent).toBeTruthy();
      expect(desktopUserAgent).toMatch(/Windows|Macintosh|Linux/);
    });
  });

  describe('请求头轮换测试', () => {
    test('应该生成真实的浏览器请求头', () => {
      const headers = antiDetection.generateHeaders();
      
      expect(headers['User-Agent']).toBeTruthy();
      expect(headers['Accept']).toBeTruthy();
      expect(headers['Accept-Language']).toBeTruthy();
      expect(headers['Accept-Encoding']).toBeTruthy();
      expect(headers['Connection']).toBe('keep-alive');
      expect(headers['Upgrade-Insecure-Requests']).toBe('1');
    });

    test('应该能够自定义请求头', () => {
      const customHeaders = {
        'Custom-Header': 'test-value',
        'Authorization': 'Bearer token123'
      };
      
      const headers = antiDetection.generateHeaders(customHeaders);
      
      expect(headers['Custom-Header']).toBe('test-value');
      expect(headers['Authorization']).toBe('Bearer token123');
      expect(headers['User-Agent']).toBeTruthy(); // 仍应包含基础头
    });

    test('应该根据网站生成特定请求头', () => {
      const modownHeaders = antiDetection.generateHeaders({}, 'modown.cn');
      const cgownHeaders = antiDetection.generateHeaders({}, 'cgown.com');
      
      expect(modownHeaders['Referer']).toContain('modown.cn');
      expect(cgownHeaders['Referer']).toContain('cgown.com');
    });
  });

  describe('代理管理测试', () => {
    test('应该能够管理代理池', async () => {
      // 添加测试代理
      const testProxies = [
        { host: '127.0.0.1', port: 8080, type: 'http' as const },
        { host: '127.0.0.1', port: 8081, type: 'http' as const },
        { host: '127.0.0.1', port: 8082, type: 'socks5' as const }
      ];

      for (const proxy of testProxies) {
        proxyManager.addProxy(proxy);
      }

      const availableProxies = proxyManager.getAvailableProxies();
      expect(availableProxies.length).toBeGreaterThanOrEqual(testProxies.length);
    });

    test('应该能够轮换代理', async () => {
      const proxy1 = await proxyManager.getNextProxy();
      const proxy2 = await proxyManager.getNextProxy();
      
      if (proxy1 && proxy2) {
        // 如果有多个代理，应该轮换
        const hasMultipleProxies = proxyManager.getAvailableProxies().length > 1;
        if (hasMultipleProxies) {
          expect(proxy1).not.toEqual(proxy2);
        }
      }
    });

    test('应该能够检测代理健康状态', async () => {
      const proxy = await proxyManager.getNextProxy();
      
      if (proxy) {
        const isHealthy = await proxyManager.checkProxyHealth(proxy);
        expect(typeof isHealthy).toBe('boolean');
        
        if (!isHealthy) {
          console.log(`⚠️ 代理 ${proxy.host}:${proxy.port} 不可用`);
        }
      }
    });

    test('应该能够处理代理失败', async () => {
      const failedProxy = { host: '192.0.2.1', port: 9999, type: 'http' as const };
      
      proxyManager.markProxyFailed(failedProxy, '连接超时');
      
      const stats = proxyManager.getProxyStats(failedProxy);
      expect(stats.failureCount).toBeGreaterThan(0);
      expect(stats.lastFailure).toBeTruthy();
    });
  });

  describe('频率限制测试', () => {
    test('应该能够限制请求频率', async () => {
      const websiteId = 'rate-limit-test';
      const maxRequests = 3;
      const timeWindow = 1000; // 1秒

      rateLimiter.setLimit(websiteId, maxRequests, timeWindow);

      const startTime = Date.now();
      const results: boolean[] = [];

      // 快速发送多个请求
      for (let i = 0; i < 5; i++) {
        const allowed = await rateLimiter.checkLimit(websiteId);
        results.push(allowed);
      }

      const endTime = Date.now();

      // 前3个请求应该被允许，后面的应该被限制
      expect(results.slice(0, maxRequests).every(r => r)).toBe(true);
      expect(results.slice(maxRequests).some(r => !r)).toBe(true);

      console.log(`🚦 频率限制测试: ${results.filter(r => r).length}/${results.length} 请求被允许`);
    });

    test('应该能够在时间窗口重置后允许新请求', async () => {
      const websiteId = 'reset-test';
      const maxRequests = 2;
      const timeWindow = 500; // 0.5秒

      rateLimiter.setLimit(websiteId, maxRequests, timeWindow);

      // 用完配额
      await rateLimiter.checkLimit(websiteId);
      await rateLimiter.checkLimit(websiteId);
      
      // 第三个请求应该被拒绝
      const rejected = await rateLimiter.checkLimit(websiteId);
      expect(rejected).toBe(false);

      // 等待时间窗口重置
      await new Promise(resolve => setTimeout(resolve, timeWindow + 100));

      // 新请求应该被允许
      const allowed = await rateLimiter.checkLimit(websiteId);
      expect(allowed).toBe(true);
    });

    test('应该能够动态调整频率限制', async () => {
      const websiteId = 'dynamic-test';
      
      // 初始限制
      rateLimiter.setLimit(websiteId, 2, 1000);
      
      // 检测到反爬虫后降低频率
      rateLimiter.adjustLimit(websiteId, 0.5); // 降低到50%
      
      const newLimit = rateLimiter.getCurrentLimit(websiteId);
      expect(newLimit.maxRequests).toBe(1); // 2 * 0.5 = 1
    });
  });

  describe('验证码检测测试', () => {
    test('应该能够检测验证码页面', async () => {
      const captchaHtml = `
        <html>
          <body>
            <div class="captcha-container">
              <img src="/captcha.jpg" alt="验证码" />
              <input type="text" name="captcha" placeholder="请输入验证码" />
            </div>
          </body>
        </html>
      `;

      const hasCaptcha = antiDetection.detectCaptcha(captchaHtml);
      expect(hasCaptcha).toBe(true);
    });

    test('应该能够检测登录要求', async () => {
      const loginHtml = `
        <html>
          <body>
            <div class="login-form">
              <input type="text" name="username" />
              <input type="password" name="password" />
              <button type="submit">登录</button>
            </div>
          </body>
        </html>
      `;

      const requiresLogin = antiDetection.detectLoginRequired(loginHtml);
      expect(requiresLogin).toBe(true);
    });

    test('应该能够检测IP封禁', async () => {
      const blockedHtml = `
        <html>
          <body>
            <h1>访问被拒绝</h1>
            <p>您的IP地址已被封禁</p>
          </body>
        </html>
      `;

      const isBlocked = antiDetection.detectIpBlocked(blockedHtml);
      expect(isBlocked).toBe(true);
    });

    test('应该能够检测频率限制', async () => {
      const rateLimitHtml = `
        <html>
          <body>
            <h1>请求过于频繁</h1>
            <p>请稍后再试</p>
          </body>
        </html>
      `;

      const isRateLimited = antiDetection.detectRateLimit(rateLimitHtml);
      expect(isRateLimited).toBe(true);
    });
  });

  describe('浏览器指纹测试', () => {
    test('应该能够生成随机浏览器指纹', () => {
      const fingerprint1 = antiDetection.generateBrowserFingerprint();
      const fingerprint2 = antiDetection.generateBrowserFingerprint();

      expect(fingerprint1).toBeTruthy();
      expect(fingerprint2).toBeTruthy();
      expect(fingerprint1).not.toEqual(fingerprint2);

      // 验证指纹包含必要字段
      expect(fingerprint1.userAgent).toBeTruthy();
      expect(fingerprint1.viewport).toBeTruthy();
      expect(fingerprint1.timezone).toBeTruthy();
      expect(fingerprint1.language).toBeTruthy();
    });

    test('应该能够模拟不同设备类型', () => {
      const mobileFingerprint = antiDetection.generateBrowserFingerprint('mobile');
      const desktopFingerprint = antiDetection.generateBrowserFingerprint('desktop');

      expect(mobileFingerprint.viewport.width).toBeLessThan(desktopFingerprint.viewport.width);
      expect(mobileFingerprint.userAgent).toMatch(/Mobile|Android|iPhone/i);
      expect(desktopFingerprint.userAgent).toMatch(/Windows|Macintosh|Linux/);
    });
  });

  describe('智能延迟测试', () => {
    test('应该能够计算智能延迟', () => {
      const baseDelay = 1000;
      const websiteId = 'delay-test';

      // 正常情况下的延迟
      const normalDelay = antiDetection.calculateDelay(websiteId, baseDelay);
      expect(normalDelay).toBeGreaterThanOrEqual(baseDelay * 0.8);
      expect(normalDelay).toBeLessThanOrEqual(baseDelay * 1.2);

      // 模拟检测到反爬虫后的延迟
      antiDetection.recordAntiCrawlerDetection(websiteId, 'rate_limit');
      const increasedDelay = antiDetection.calculateDelay(websiteId, baseDelay);
      expect(increasedDelay).toBeGreaterThan(normalDelay);
    });

    test('应该能够根据历史调整延迟', () => {
      const websiteId = 'adaptive-delay-test';
      const baseDelay = 1000;

      // 记录多次成功请求
      for (let i = 0; i < 5; i++) {
        antiDetection.recordSuccessfulRequest(websiteId);
      }

      const successDelay = antiDetection.calculateDelay(websiteId, baseDelay);

      // 记录失败请求
      antiDetection.recordFailedRequest(websiteId, 'blocked');
      const failureDelay = antiDetection.calculateDelay(websiteId, baseDelay);

      expect(failureDelay).toBeGreaterThan(successDelay);
    });
  });

  describe('会话管理测试', () => {
    test('应该能够管理Cookie会话', async () => {
      const websiteId = 'session-test';
      const cookies = [
        { name: 'sessionId', value: 'abc123', domain: 'test.com' },
        { name: 'userId', value: '456', domain: 'test.com' }
      ];

      antiDetection.setCookies(websiteId, cookies);
      const retrievedCookies = antiDetection.getCookies(websiteId);

      expect(retrievedCookies).toHaveLength(2);
      expect(retrievedCookies[0].name).toBe('sessionId');
      expect(retrievedCookies[0].value).toBe('abc123');
    });

    test('应该能够清理过期会话', async () => {
      const websiteId = 'cleanup-test';
      const expiredCookies = [
        { 
          name: 'expired', 
          value: 'old', 
          domain: 'test.com',
          expires: new Date(Date.now() - 86400000) // 昨天过期
        }
      ];

      antiDetection.setCookies(websiteId, expiredCookies);
      antiDetection.cleanupExpiredSessions();

      const remainingCookies = antiDetection.getCookies(websiteId);
      expect(remainingCookies).toHaveLength(0);
    });
  });

  describe('反爬虫策略测试', () => {
    test('应该能够选择合适的反爬虫策略', () => {
      const testRule: CrawlerRule = {
        id: 'strategy-test',
        websiteName: '策略测试网站',
        baseUrl: 'https://test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://test.com/search?q={keyword}',
          method: 'GET'
        },
        parseConfig: {
          listSelectors: {
            container: '.results',
            item: '.item',
            link: 'a'
          },
          detailSelectors: {
            title: '.title'
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
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
          },
          proxyConfig: {
            enabled: true,
            rotateProxies: true
          }
        },
        qualityControl: {
          minTitleLength: 1,
          requireImage: false,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      const strategy = antiDetection.selectStrategy(testRule);
      
      expect(strategy).toBeTruthy();
      expect(strategy.useHeadlessBrowser).toBe(true);
      expect(strategy.enableProxy).toBe(true);
      expect(strategy.randomizeHeaders).toBe(true);
      expect(strategy.delay).toBeGreaterThan(0);
    });

    test('应该能够根据检测结果调整策略', () => {
      const websiteId = 'adaptive-strategy-test';
      
      // 初始策略
      const initialStrategy = antiDetection.getCurrentStrategy(websiteId);
      
      // 模拟检测到验证码
      antiDetection.recordAntiCrawlerDetection(websiteId, 'captcha');
      const captchaStrategy = antiDetection.getCurrentStrategy(websiteId);
      
      // 策略应该更加保守
      expect(captchaStrategy.delay).toBeGreaterThan(initialStrategy.delay);
      expect(captchaStrategy.useHeadlessBrowser).toBe(true);
      
      // 模拟检测到IP封禁
      antiDetection.recordAntiCrawlerDetection(websiteId, 'ip_blocked');
      const blockedStrategy = antiDetection.getCurrentStrategy(websiteId);
      
      // 应该启用代理
      expect(blockedStrategy.enableProxy).toBe(true);
      expect(blockedStrategy.rotateProxies).toBe(true);
    });
  });

  describe('错误恢复测试', () => {
    test('应该能够从反爬虫检测中恢复', async () => {
      const websiteId = 'recovery-test';
      
      // 模拟反爬虫检测
      const detectionTypes = ['captcha', 'rate_limit', 'ip_blocked', 'login_required'];
      
      for (const type of detectionTypes) {
        antiDetection.recordAntiCrawlerDetection(websiteId, type as any);
        
        const recoveryAction = await antiDetection.getRecoveryAction(websiteId, type as any);
        expect(recoveryAction).toBeTruthy();
        expect(recoveryAction.action).toBeTruthy();
        expect(recoveryAction.delay).toBeGreaterThan(0);
        
        console.log(`🔄 ${type} 恢复策略: ${recoveryAction.action}, 延迟: ${recoveryAction.delay}ms`);
      }
    });

    test('应该能够记录和分析反爬虫模式', () => {
      const websiteId = 'pattern-test';
      
      // 模拟一系列反爬虫检测
      const detections = [
        { type: 'rate_limit', timestamp: new Date(Date.now() - 3600000) }, // 1小时前
        { type: 'rate_limit', timestamp: new Date(Date.now() - 1800000) }, // 30分钟前
        { type: 'captcha', timestamp: new Date(Date.now() - 900000) },     // 15分钟前
        { type: 'ip_blocked', timestamp: new Date() }                      // 现在
      ];

      detections.forEach(detection => {
        antiDetection.recordAntiCrawlerDetection(websiteId, detection.type as any, detection.timestamp);
      });

      const pattern = antiDetection.analyzeAntiCrawlerPattern(websiteId);
      
      expect(pattern.mostCommonType).toBe('rate_limit');
      expect(pattern.frequency).toBeGreaterThan(0);
      expect(pattern.escalationPattern).toBeTruthy();
      expect(pattern.recommendations).toBeTruthy();
      expect(pattern.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('性能影响测试', () => {
    test('反爬虫机制不应显著影响性能', async () => {
      const iterations = 100;
      
      // 测试无反爬虫机制的性能
      const startTimeBasic = Date.now();
      for (let i = 0; i < iterations; i++) {
        antiDetection.getRandomUserAgent();
      }
      const basicTime = Date.now() - startTimeBasic;
      
      // 测试完整反爬虫机制的性能
      const startTimeFull = Date.now();
      for (let i = 0; i < iterations; i++) {
        const headers = antiDetection.generateHeaders();
        const fingerprint = antiDetection.generateBrowserFingerprint();
        const delay = antiDetection.calculateDelay('perf-test', 1000);
      }
      const fullTime = Date.now() - startTimeFull;
      
      // 性能开销应该在合理范围内
      const overhead = (fullTime - basicTime) / basicTime;
      expect(overhead).toBeLessThan(2); // 开销不应超过200%
      
      console.log(`⚡ 反爬虫机制性能开销: ${(overhead * 100).toFixed(1)}%`);
    });

    test('代理轮换不应造成显著延迟', async () => {
      const iterations = 10;
      
      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        await proxyManager.getNextProxy();
      }
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / iterations;
      
      // 平均获取代理时间应该很短
      expect(avgTime).toBeLessThan(100); // 100ms以内
      
      console.log(`🔄 代理轮换平均耗时: ${avgTime.toFixed(1)}ms`);
    });
  });

  describe('集成测试', () => {
    test('完整的反爬虫工作流', async () => {
      const websiteId = 'integration-test';
      const testRule: CrawlerRule = {
        id: 'integration-rule',
        websiteName: '集成测试网站',
        baseUrl: 'https://test.com',
        isActive: true,
        isPreset: false,
        searchConfig: {
          urlTemplate: 'https://test.com/search?q={keyword}',
          method: 'GET'
        },
        parseConfig: {
          listSelectors: {
            container: '.results',
            item: '.item',
            link: 'a'
          },
          detailSelectors: {
            title: '.title'
          }
        },
        dataProcessing: {
          textCleanup: {
            removeHtml: true,
            trimWhitespace: true,
            removeEmptyLines: true
          }
        },
        antiDetection: {
          useHeadlessBrowser: true,
          requestConfig: {
            delay: 1000,
            randomDelay: true,
            maxRetries: 3,
            timeout: 30000
          },
          proxyConfig: {
            enabled: true,
            rotateProxies: true
          }
        },
        qualityControl: {
          minTitleLength: 1,
          requireImage: false,
          requirePrice: false,
          maxResultsPerPage: 50,
          duplicateDetection: true
        },
        testing: {
          testKeyword: '测试',
          successRate: 0,
          avgResponseTime: 0
        }
      };

      // 1. 选择反爬虫策略
      const strategy = antiDetection.selectStrategy(testRule);
      expect(strategy).toBeTruthy();

      // 2. 生成请求配置
      const headers = antiDetection.generateHeaders({}, 'test.com');
      const proxy = await proxyManager.getNextProxy();
      const fingerprint = antiDetection.generateBrowserFingerprint();

      // 3. 检查频率限制
      const allowed = await rateLimiter.checkLimit(websiteId);
      expect(typeof allowed).toBe('boolean');

      // 4. 计算延迟
      const delay = antiDetection.calculateDelay(websiteId, strategy.delay);
      expect(delay).toBeGreaterThan(0);

      // 5. 模拟请求执行
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 100))); // 限制测试时间

      // 6. 记录成功请求
      antiDetection.recordSuccessfulRequest(websiteId);

      // 验证整个流程
      const stats = antiDetection.getWebsiteStats(websiteId);
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.successfulRequests).toBeGreaterThan(0);

      console.log(`🎯 集成测试完成: ${stats.successfulRequests}/${stats.totalRequests} 成功`);
    });
  });
});