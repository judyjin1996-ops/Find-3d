import type { AppError, ErrorType } from '../types';

/**
 * 错误处理服务
 * 提供统一的错误处理、记录和报告功能
 */
class ErrorService {
  private errorHandlers: Map<ErrorType, (error: AppError) => void> = new Map();
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;

  /**
   * 注册错误处理器
   */
  registerHandler(type: ErrorType, handler: (error: AppError) => void) {
    this.errorHandlers.set(type, handler);
  }

  /**
   * 处理错误
   */
  handleError(error: AppError | Error | string): AppError {
    let appError: AppError;

    // 标准化错误格式
    if (typeof error === 'string') {
      appError = {
        type: 'VALIDATION_ERROR',
        message: error,
        timestamp: new Date(),
        source: 'ErrorService'
      };
    } else if (error instanceof Error) {
      appError = {
        type: 'VALIDATION_ERROR',
        message: error.message,
        details: {
          stack: error.stack,
          name: error.name
        },
        timestamp: new Date(),
        source: 'ErrorService'
      };
    } else {
      appError = error;
    }

    // 记录错误
    this.logError(appError);

    // 调用对应的错误处理器
    const handler = this.errorHandlers.get(appError.type);
    if (handler) {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('错误处理器执行失败:', handlerError);
      }
    }

    return appError;
  }

  /**
   * 记录错误到历史记录
   */
  private logError(error: AppError) {
    // 添加到历史记录
    this.errorHistory.unshift(error);
    
    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }

    // 控制台输出
    console.error(`[${error.type}] ${error.message}`, error.details);

    // 可以在这里添加其他日志记录逻辑，如发送到服务器
  }

  /**
   * 获取错误历史记录
   */
  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  /**
   * 清除错误历史记录
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * 创建网络错误
   */
  createNetworkError(message: string, details?: any): AppError {
    return {
      type: 'NETWORK_ERROR',
      message,
      details,
      timestamp: new Date(),
      source: 'Network'
    };
  }

  /**
   * 创建API错误
   */
  createApiError(message: string, details?: any): AppError {
    return {
      type: 'API_ERROR',
      message,
      details,
      timestamp: new Date(),
      source: 'API'
    };
  }

  /**
   * 创建超时错误
   */
  createTimeoutError(message: string, details?: any): AppError {
    return {
      type: 'TIMEOUT_ERROR',
      message,
      details,
      timestamp: new Date(),
      source: 'Timeout'
    };
  }

  /**
   * 创建解析错误
   */
  createParseError(message: string, details?: any): AppError {
    return {
      type: 'PARSE_ERROR',
      message,
      details,
      timestamp: new Date(),
      source: 'Parser'
    };
  }

  /**
   * 创建验证错误
   */
  createValidationError(message: string, details?: any): AppError {
    return {
      type: 'VALIDATION_ERROR',
      message,
      details,
      timestamp: new Date(),
      source: 'Validation'
    };
  }

  /**
   * 检查是否为网络错误
   */
  isNetworkError(error: any): boolean {
    return error?.type === 'NETWORK_ERROR' || 
           error?.code === 'NETWORK_ERROR' ||
           error?.message?.includes('网络') ||
           error?.message?.includes('network') ||
           !navigator.onLine;
  }

  /**
   * 检查是否为超时错误
   */
  isTimeoutError(error: any): boolean {
    return error?.type === 'TIMEOUT_ERROR' ||
           error?.code === 'TIMEOUT_ERROR' ||
           error?.message?.includes('timeout') ||
           error?.message?.includes('超时');
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case 'NETWORK_ERROR':
        return '网络连接异常，请检查网络后重试';
      case 'TIMEOUT_ERROR':
        return '请求超时，请稍后重试';
      case 'API_ERROR':
        return '服务器响应异常，请稍后重试';
      case 'PARSE_ERROR':
        return '数据解析失败，请刷新页面重试';
      case 'VALIDATION_ERROR':
        return error.message || '输入数据有误，请检查后重试';
      default:
        return '发生未知错误，请稍后重试';
    }
  }

  /**
   * 重试机制
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }

        // 如果是网络错误或超时错误，进行重试
        if (this.isNetworkError(error) || this.isTimeoutError(error)) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        } else {
          // 其他类型错误不重试
          break;
        }
      }
    }

    throw this.handleError(lastError);
  }
}

// 创建全局实例
export const errorService = new ErrorService();

// 设置默认错误处理器
errorService.registerHandler('NETWORK_ERROR', (error) => {
  // 可以在这里添加网络错误的特殊处理逻辑
  console.warn('网络错误:', error.message);
});

errorService.registerHandler('TIMEOUT_ERROR', (error) => {
  // 可以在这里添加超时错误的特殊处理逻辑
  console.warn('超时错误:', error.message);
});

export default errorService;