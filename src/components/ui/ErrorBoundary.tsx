import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card, Button, Icon } from './index';
import type { AppError, ErrorType } from '../../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

/**
 * 全局错误边界组件
 * 捕获并处理应用中的JavaScript错误
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 将错误转换为应用错误格式
    const appError: AppError = {
      type: 'VALIDATION_ERROR' as ErrorType,
      message: error.message || '应用发生未知错误',
      details: {
        stack: error.stack,
        name: error.name
      },
      timestamp: new Date(),
      source: 'ErrorBoundary'
    };

    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError: AppError = {
      type: 'VALIDATION_ERROR' as ErrorType,
      message: error.message || '应用发生未知错误',
      details: {
        stack: error.stack,
        name: error.name,
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date(),
      source: 'ErrorBoundary'
    };

    // 调用错误处理回调
    this.props.onError?.(appError);

    // 记录错误到控制台
    console.error('ErrorBoundary 捕获到错误:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-sketch-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">😵</div>
              <h2 className="text-2xl font-bold sketch-text-primary mb-2 font-sketch">
                哎呀，出错了！
              </h2>
              <p className="sketch-text-secondary font-sketch">
                应用遇到了一个意外错误，请尝试刷新页面
              </p>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-sm text-red-600 font-medium mb-2">错误详情：</p>
                <p className="text-xs text-red-500 font-mono break-all">
                  {this.state.error.message}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  时间: {this.state.error.timestamp.toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleRetry}
                icon={<Icon name="refresh" size="sm" />}
              >
                重试
              </Button>
              <Button
                variant="primary"
                onClick={this.handleReload}
                icon={<Icon name="reload" size="sm" />}
              >
                刷新页面
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs sketch-text-secondary font-sketch">
                如果问题持续存在，请联系技术支持
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;