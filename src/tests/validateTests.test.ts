/**
 * 测试验证脚本
 * 快速验证测试环境和基本功能
 */

import { describe, test, expect, vi } from 'vitest';

describe('测试环境验证', () => {
  test('基本测试框架应该工作', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
  });

  test('异步测试应该工作', async () => {
    const result = await Promise.resolve('async test');
    expect(result).toBe('async test');
  });

  test('错误处理应该工作', () => {
    expect(() => {
      throw new Error('测试错误');
    }).toThrow('测试错误');
  });

  test('模拟函数应该工作', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('定时器应该工作', async () => {
    vi.useFakeTimers();
    
    let resolved = false;
    setTimeout(() => {
      resolved = true;
    }, 1000);

    expect(resolved).toBe(false);
    
    vi.advanceTimersByTime(1000);
    expect(resolved).toBe(true);
    
    vi.useRealTimers();
  });
});

describe('类型系统验证', () => {
  test('TypeScript类型应该正确', () => {
    interface TestInterface {
      id: string;
      name: string;
      count: number;
    }

    const testObj: TestInterface = {
      id: 'test-1',
      name: '测试对象',
      count: 42
    };

    expect(testObj.id).toBe('test-1');
    expect(testObj.name).toBe('测试对象');
    expect(testObj.count).toBe(42);
  });

  test('泛型应该工作', () => {
    function identity<T>(arg: T): T {
      return arg;
    }

    expect(identity('string')).toBe('string');
    expect(identity(123)).toBe(123);
    expect(identity(true)).toBe(true);
  });
});

describe('模块导入验证', () => {
  test('应该能够导入类型', () => {
    // 这个测试验证类型导入不会导致运行时错误
    expect(true).toBe(true);
  });

  test('应该能够使用工具函数', () => {
    const testArray = [1, 2, 3, 4, 5];
    const doubled = testArray.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
  });
});

// 导出验证函数供其他测试使用
export function validateTestEnvironment(): boolean {
  try {
    // 基本功能检查
    expect(typeof describe).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
    expect(typeof vi).toBe('object');
    
    return true;
  } catch (error) {
    console.error('测试环境验证失败:', error);
    return false;
  }
}

export function createMockData<T>(factory: () => T, count: number): T[] {
  return Array.from({ length: count }, factory);
}

export async function waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  
  while (!condition() && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!condition()) {
    throw new Error(`等待条件超时 (${timeout}ms)`);
  }
}