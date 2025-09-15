// 错误处理相关类型定义

export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR', 
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

// 基础错误接口
export interface BaseError {
  type: ErrorType;
  message: string;
  timestamp: Date;
  source?: string;
  details?: any;
}

// 网络错误
export interface NetworkError extends BaseError {
  type: typeof ErrorType.NETWORK_ERROR;
  statusCode?: number;
  url?: string;
}

// API错误
export interface ApiError extends BaseError {
  type: typeof ErrorType.API_ERROR;
  endpoint?: string;
  statusCode?: number;
  responseData?: any;
}

// 超时错误
export interface TimeoutError extends BaseError {
  type: typeof ErrorType.TIMEOUT_ERROR;
  timeoutDuration: number;
  operation: string;
}

// 解析错误
export interface ParseError extends BaseError {
  type: typeof ErrorType.PARSE_ERROR;
  rawData?: any;
  expectedFormat?: string;
}

// 验证错误
export interface ValidationError extends BaseError {
  type: typeof ErrorType.VALIDATION_ERROR;
  field?: string;
  value?: any;
  constraints?: string[];
}

// 配置错误
export interface ConfigError extends BaseError {
  type: typeof ErrorType.CONFIG_ERROR;
  configKey?: string;
  configValue?: any;
}

// 缓存错误
export interface CacheError extends BaseError {
  type: typeof ErrorType.CACHE_ERROR;
  operation: 'read' | 'write' | 'delete' | 'clear';
  key?: string;
}

// 未知错误
export interface UnknownError extends BaseError {
  type: typeof ErrorType.UNKNOWN_ERROR;
  originalError?: Error;
}

// 联合错误类型
export type AppError = 
  | NetworkError 
  | ApiError 
  | TimeoutError 
  | ParseError 
  | ValidationError 
  | ConfigError 
  | CacheError 
  | UnknownError;

// 错误严重程度
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

// 错误处理选项
export interface ErrorHandlingOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  severity?: ErrorSeverity;
}

// 错误处理结果
export interface ErrorHandlingResult {
  handled: boolean;
  shouldRetry: boolean;
  userMessage?: string;
  nextAction?: 'retry' | 'fallback' | 'abort';
}