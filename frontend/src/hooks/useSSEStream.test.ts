import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSSEStream } from './useSSEStream';
import { sseService } from '../services/streaming';

// Mock the streaming service
vi.mock('../services/streaming', () => ({
  sseService: {
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

describe('useSSEStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSSEStream());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.currentAgent).toBe(null);
    expect(result.current.messages).toEqual([]);
    expect(result.current.agentUpdates).toEqual([]);
    expect(result.current.visualizations).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('registers event handlers on mount', () => {
    renderHook(() => useSSEStream());

    expect(sseService.on).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(sseService.on).toHaveBeenCalledWith('agent_started', expect.any(Function));
    expect(sseService.on).toHaveBeenCalledWith('agent_progress', expect.any(Function));
    expect(sseService.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(sseService.on).toHaveBeenCalledWith('visualization', expect.any(Function));
    expect(sseService.on).toHaveBeenCalledWith('done', expect.any(Function));
    expect(sseService.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('connects to stream with correct parameters', () => {
    const { result } = renderHook(() => useSSEStream());

    act(() => {
      result.current.connect('thread-123', 'Hello', 'user-456');
    });

    expect(sseService.connect).toHaveBeenCalledWith('thread-123', 'Hello', 'user-456');
  });

  it('resets state when connecting', () => {
    const { result } = renderHook(() => useSSEStream());

    act(() => {
      result.current.connect('thread-123', 'Hello', 'user-456');
    });

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.messages).toEqual([]);
    expect(result.current.agentUpdates).toEqual([]);
    expect(result.current.visualizations).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('disconnects from stream', () => {
    const { result } = renderHook(() => useSSEStream());

    act(() => {
      result.current.disconnect();
    });

    expect(sseService.disconnect).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isStreaming).toBe(false);
  });

  it('cleans up event handlers on unmount', () => {
    const { unmount } = renderHook(() => useSSEStream());

    unmount();

    expect(sseService.off).toHaveBeenCalled();
    expect(sseService.disconnect).toHaveBeenCalled();
  });

  it('handles connected event', () => {
    const { result } = renderHook(() => useSSEStream());

    // Get the connected event handler
    const connectedHandler = (sseService.on as any).mock.calls.find(
      (call: any) => call[0] === 'connected'
    )?.[1];

    act(() => {
      connectedHandler?.({ type: 'connected', data: {} });
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isStreaming).toBe(true);
  });

  it('handles agent_started event', () => {
    const { result } = renderHook(() => useSSEStream());

    const agentStartedHandler = (sseService.on as any).mock.calls.find(
      (call: any) => call[0] === 'agent_started'
    )?.[1];

    act(() => {
      agentStartedHandler?.({
        type: 'agent_started',
        data: { agent_name: 'Goal Planner' },
      });
    });

    expect(result.current.currentAgent).toBe('Goal Planner');
  });

  it('handles agent_progress event', () => {
    const { result } = renderHook(() => useSSEStream());

    const progressHandler = (sseService.on as any).mock.calls.find(
      (call: any) => call[0] === 'agent_progress'
    )?.[1];

    const progressData = {
      agent_id: 'test',
      agent_name: 'Test Agent',
      response: 'Working on it',
      timestamp: Date.now(),
    };

    act(() => {
      progressHandler?.({
        type: 'agent_progress',
        data: progressData,
      });
    });

    expect(result.current.agentUpdates).toHaveLength(1);
    expect(result.current.agentUpdates[0]).toEqual(progressData);
  });

  it('handles message event', () => {
    const { result } = renderHook(() => useSSEStream());

    const messageHandler = (sseService.on as any).mock.calls.find(
      (call: any) => call[0] === 'message'
    )?.[1];

    const messageData = {
      role: 'assistant',
      content: 'Test message',
      timestamp: Date.now(),
    };

    act(() => {
      messageHandler?.({
        type: 'message',
        data: messageData,
      });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(messageData);
  });

  it('handles visualization event', () => {
    const { result } = renderHook(() => useSSEStream());

    const vizHandler = (sseService.on as any).mock.calls.find(
      (call: any) => call[0] === 'visualization'
    )?.[1];

    const vizData = {
      type: 'pie_chart',
      title: 'Test Chart',
      data: { A: 50, B: 50 },
      config: {},
      timestamp: Date.now(),
    };

    act(() => {
      vizHandler?.({
        type: 'visualization',
        data: vizData,
      });
    });

    expect(result.current.visualizations).toHaveLength(1);
    expect(result.current.visualizations[0]).toEqual(vizData);
  });

  it('handles done event', () => {
    const { result } = renderHook(() => useSSEStream());

    const doneHandler = (sseService.on as any).mock.calls.find(
      (call: any) => call[0] === 'done'
    )?.[1];

    act(() => {
      doneHandler?.({ type: 'done', data: {} });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.currentAgent).toBe(null);
  });

  it('handles error event', () => {
    const { result } = renderHook(() => useSSEStream());

    const errorHandler = (sseService.on as any).mock.calls.find(
      (call: any) => call[0] === 'error'
    )?.[1];

    act(() => {
      errorHandler?.({
        type: 'error',
        data: { error: 'Connection failed' },
      });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe('Connection failed');
  });
});
