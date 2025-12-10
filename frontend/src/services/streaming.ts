/**
 * SSE Streaming Service
 *
 * Handles Server-Sent Events (SSE) connection to backend for real-time
 * AI agent updates.
 */

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface AgentProgressEvent {
  agent_id: string;
  agent_name: string;
  response: string;
  timestamp: string;
}

export interface VisualizationEvent {
  type: string;
  title: string;
  data: any;
  config: any;
  timestamp: string;
}

export interface MessageEvent {
  role: string;
  content: string;
  timestamp: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;

export class SSEStreamService {
  private eventSource: EventSource | null = null;
  private handlers: Map<string, SSEEventHandler[]> = new Map();

  /**
   * Connect to SSE stream for a chat session
   */
  connect(threadId: string, message: string, userId: string): void {
    // Close existing connection
    this.disconnect();

    // Create SSE connection - Use full URL with localhost for development
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const url = `${baseUrl}/api/v1/chat/stream`;
    const params = new URLSearchParams({
      thread_id: threadId || '',
      message: message,
      user_id: userId,
    });

    console.log('Connecting to SSE:', `${url}?${params.toString()}`);
    this.eventSource = new EventSource(`${url}?${params}`);

    // Set up event listeners
    this.eventSource.addEventListener('connected', (e) => {
      this.handleEvent('connected', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('agent_started', (e) => {
      this.handleEvent('agent_started', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('agent_progress', (e) => {
      this.handleEvent('agent_progress', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('result', (e) => {
      this.handleEvent('result', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('visualization', (e) => {
      this.handleEvent('visualization', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('message', (e) => {
      this.handleEvent('message', JSON.parse(e.data));
    });

    this.eventSource.addEventListener('done', (e) => {
      this.handleEvent('done', JSON.parse(e.data));
      this.disconnect();
    });

    this.eventSource.addEventListener('error', (e) => {
      // Error events in EventSource don't have data property
      this.handleEvent('error', { error: 'Connection error', details: e });
      this.disconnect();
    });

    // Handle connection errors
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.handleEvent('error', { error: 'Connection failed' });
      this.disconnect();
    };
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: SSEEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Unregister event handler
   */
  off(eventType: string, handler: SSEEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming event
   */
  private handleEvent(type: string, data: any): void {
    const event: SSEEvent = {
      type,
      data,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // Also trigger 'all' handlers
    const allHandlers = this.handlers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(event));
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

// Export singleton instance
export const sseService = new SSEStreamService();
