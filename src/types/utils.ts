// 类型工具函数和类型守卫

import type { 
  MaterialResult, 
  WebsiteConfig, 
  SearchState, 
  AppError,
  ApiResponse,
  ErrorType 
} from './index';

// 类型守卫函数
export const isValidMaterialResult = (obj: any): obj is MaterialResult => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.sourceWebsite === 'string' &&
    typeof obj.sourceUrl === 'string' &&
    typeof obj.isFree === 'boolean'
  );
};

export const isValidWebsiteConfig = (obj: any): obj is WebsiteConfig => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.baseUrl === 'string' &&
    typeof obj.isActive === 'boolean' &&
    obj.searchParams &&
    obj.resultMapping
  );
};

export const isAppError = (obj: any): obj is AppError => {
  return (
    obj &&
    typeof obj.type === 'string' &&
    typeof obj.message === 'string' &&
    obj.timestamp instanceof Date
  );
};

export const isApiSuccessResponse = <T>(response: ApiResponse<T>): response is { success: true; data: T } => {
  return 'success' in response && response.success === true;
};

export const isApiErrorResponse = (response: ApiResponse<any>): response is { error: true; message: string } => {
  return 'error' in response && response.error === true;
};

// 类型转换工具
export const createMaterialResult = (partial: Partial<MaterialResult> & Pick<MaterialResult, 'id' | 'title' | 'sourceWebsite' | 'sourceUrl' | 'isFree'>): MaterialResult => {
  return {
    previewImage: '',
    tags: [],
    ...partial
  };
};

export const createWebsiteConfig = (partial: Partial<WebsiteConfig> & Pick<WebsiteConfig, 'id' | 'name' | 'baseUrl'>): WebsiteConfig => {
  return {
    searchEndpoint: '/search',
    isActive: true,
    searchParams: {
      queryParam: 'q'
    },
    resultMapping: {
      titlePath: 'title',
      imagePath: 'image',
      urlPath: 'url'
    },
    rateLimit: {
      requestsPerMinute: 60,
      concurrent: 3
    },
    ...partial
  };
};

export const createSearchState = (partial?: Partial<SearchState>): SearchState => {
  return {
    query: '',
    loading: false,
    results: [],
    totalCount: 0,
    searchTime: 0,
    websiteStatus: {},
    ...partial
  };
};

// 数据验证工具
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePrice = (price: number): boolean => {
  return typeof price === 'number' && price >= 0 && isFinite(price);
};

// 数据清理工具
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return '';
  }
};

// 深度克隆工具（简单版本）
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

// 对象比较工具
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }
  
  return true;
};

// 错误创建工具
export const createError = (type: ErrorType, message: string, details?: any): AppError => {
  return {
    type,
    message,
    timestamp: new Date(),
    details
  };
};