/**
 * React Hook for SSE Streaming
 *
 * Manages SSE connection lifecycle and state updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sseService, type SSEEvent, type AgentProgressEvent, type MessageEvent } from '../services/streaming';

export interface SSEStreamState {
  isConnected: boolean;
  isStreaming: boolean;
  currentAgent: string | null;
  messages: MessageEvent[];
  agentUpdates: AgentProgressEvent[];
  visualizations: any[];
  error: string | null;
}

export function useSSEStream() {
  const [state, setState] = useState<SSEStreamState>({
    isConnected: false,
    isStreaming: false,
    currentAgent: null,
    messages: [],
    agentUpdates: [],
    visualizations: [],
    error: null,
  });

  const handlersRef = useRef<Map<string, (event: SSEEvent) => void>>(new Map());

  // Set up event handlers
  useEffect(() => {
    const handlers = {
      connected: (_event: SSEEvent) => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isStreaming: true,
          error: null,
        }));
      },

      agent_started: (event: SSEEvent) => {
        setState(prev => ({
          ...prev,
          currentAgent: event.data.agent_name,
        }));
      },

      agent_progress: (event: SSEEvent) => {
        setState(prev => ({
          ...prev,
          agentUpdates: [...prev.agentUpdates, event.data],
        }));
      },

      message: (event: SSEEvent) => {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, event.data],
        }));
      },

      visualization: (event: SSEEvent) => {
        console.log('📊 Visualization event received:', event.data);
        setState(prev => {
          const newVisualizations = [...prev.visualizations, event.data];
          console.log('📊 Updated visualizations array:', newVisualizations);
          return {
            ...prev,
            visualizations: newVisualizations,
          };
        });
      },

      done: (_event: SSEEvent) => {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          isConnected: false,
          currentAgent: null,
        }));
      },

      error: (event: SSEEvent) => {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          isConnected: false,
          error: event.data.error || 'An error occurred',
        }));
      },
    };

    // Register handlers
    Object.entries(handlers).forEach(([eventType, handler]) => {
      sseService.on(eventType, handler);
      handlersRef.current.set(eventType, handler);
    });

    // Cleanup on unmount
    return () => {
      handlersRef.current.forEach((handler, eventType) => {
        sseService.off(eventType, handler);
      });
      sseService.disconnect();
    };
  }, []);

  // Connect to stream
  const connect = useCallback((threadId: string, message: string, userId: string) => {
    // Reset state
    setState({
      isConnected: false,
      isStreaming: true,
      currentAgent: null,
      messages: [],
      agentUpdates: [],
      visualizations: [],
      error: null,
    });

    // Connect to SSE
    sseService.connect(threadId, message, userId);
  }, []);

  // Disconnect from stream
  const disconnect = useCallback(() => {
    sseService.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isStreaming: false,
    }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
}
