/**
 * WebSocket服务
 * 提供实时通信功能，用于爬虫任务状态更新
 */

import { CrawlingTask, CrawlingError, ExtractedMaterialResult } from '../crawler/types/crawler';

export interface WebSocketMessage {
  type: 'task_progress' | 'task_completed' | 'task_started' | 'task_paused' | 'task_resumed' | 'task_cancelled' | 'task_result' | 'task_error' | 'system_status';
  taskId?: string;
  data: any;
  timestamp: Date;
}

export interface TaskProgressMessage {
  taskId: string;
  status: CrawlingTask['status'];
  progress: CrawlingTask['progress'];
  currentWebsite?: string;
  estimatedTimeRemaining?: number;
}

export interface TaskResultMessage {
  taskId: string;
  result: ExtractedMaterialResult;
}

export interface TaskErrorMessage {
  taskId: string;
  error: CrawlingError;
}

export interface SystemStatusMessage {
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  systemLoad: {
    cpu: number;
    memory: number;
  };
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private isConnecting = false;
  private url: string;

  constructor(url?: string) {
    // 在开发环境中使用模拟WebSocket，生产环境中使用真实WebSocket
    this.url = url || (process.env.NODE_ENV === 'development' ? 'mock' : 'ws://localhost:8080/ws');
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        // 在开发环境中使用模拟WebSocket
        if (this.url === 'mock') {
          this.setupMockWebSocket();
          this.isConnecting = false;
          resolve();
          return;
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket连接已建立');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            message.timestamp = new Date(message.timestamp);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ WebSocket消息解析失败:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket连接已关闭:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;
          
          // 自动重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket连接错误:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // 阻止自动重连
    console.log('🔌 WebSocket连接已断开');
  }

  /**
   * 发送消息
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date()
      };
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.warn('⚠️ WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 订阅消息类型
   */
  subscribe(messageType: string, callback: (message: WebSocketMessage) => void): () => void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }
    
    this.listeners.get(messageType)!.add(callback);

    // 返回取消订阅函数
    return () => {
      const typeListeners = this.listeners.get(messageType);
      if (typeListeners) {
        typeListeners.delete(callback);
        if (typeListeners.size === 0) {
          this.listeners.delete(messageType);
        }
      }
    };
  }

  /**
   * 订阅任务进度更新
   */
  subscribeToTaskProgress(callback: (message: TaskProgressMessage) => void): () => void {
    return this.subscribe('task_progress', (message) => {
      callback(message.data as TaskProgressMessage);
    });
  }

  /**
   * 订阅任务完成事件
   */
  subscribeToTaskCompletion(callback: (task: CrawlingTask) => void): () => void {
    return this.subscribe('task_completed', (message) => {
      callback(message.data as CrawlingTask);
    });
  }

  /**
   * 订阅任务结果
   */
  subscribeToTaskResults(callback: (message: TaskResultMessage) => void): () => void {
    return this.subscribe('task_result', (message) => {
      callback(message.data as TaskResultMessage);
    });
  }

  /**
   * 订阅任务错误
   */
  subscribeToTaskErrors(callback: (message: TaskErrorMessage) => void): () => void {
    return this.subscribe('task_error', (message) => {
      callback(message.data as TaskErrorMessage);
    });
  }

  /**
   * 订阅系统状态
   */
  subscribeToSystemStatus(callback: (status: SystemStatusMessage) => void): () => void {
    return this.subscribe('system_status', (message) => {
      callback(message.data as SystemStatusMessage);
    });
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (this.isConnecting) return 'connecting';
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    const typeListeners = this.listeners.get(message.type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error(`❌ WebSocket消息处理错误 (${message.type}):`, error);
        }
      });
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 ${delay}ms后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ WebSocket重连失败:', error);
      });
    }, delay);
  }

  /**
   * 设置模拟WebSocket（用于开发环境）
   */
  private setupMockWebSocket(): void {
    console.log('🔧 使用模拟WebSocket服务');
    
    // 模拟连接状态
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: (data: string) => {
        console.log('📤 模拟发送WebSocket消息:', data);
      },
      close: () => {
        console.log('🔌 模拟WebSocket连接关闭');
      }
    };
    
    this.ws = mockWs as any;

    // 模拟定期发送系统状态消息
    setInterval(() => {
      const mockSystemStatus: WebSocketMessage = {
        type: 'system_status',
        data: {
          activeTasks: Math.floor(Math.random() * 5),
          queuedTasks: Math.floor(Math.random() * 10),
          completedTasks: Math.floor(Math.random() * 100),
          systemLoad: {
            cpu: Math.random() * 100,
            memory: Math.random() * 100
          }
        } as SystemStatusMessage,
        timestamp: new Date()
      };
      
      this.handleMessage(mockSystemStatus);
    }, 5000);
  }
}

// 创建全局WebSocket服务实例
export const webSocketService = new WebSocketService();

// 默认导出
export default webSocketService;