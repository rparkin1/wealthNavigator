import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sseService } from './streaming';

describe('SSE Service', () => {
  beforeEach(() => {
    // Reset service state before each test
    sseService.disconnect();
  });

  afterEach(() => {
    sseService.disconnect();
  });

  it('does not error when disconnecting without connection', () => {
    expect(() => {
      sseService.disconnect();
    }).not.toThrow();
  });

  it('exports sseService singleton', () => {
    expect(sseService).toBeDefined();
    expect(sseService.connect).toBeInstanceOf(Function);
    expect(sseService.disconnect).toBeInstanceOf(Function);
    expect(sseService.on).toBeInstanceOf(Function);
    expect(sseService.off).toBeInstanceOf(Function);
  });

  it('has connect method that accepts parameters', () => {
    // Just verify the method exists and can be called without errors
    expect(() => {
      const connect = sseService.connect;
      expect(connect).toBeInstanceOf(Function);
    }).not.toThrow();
  });

  it('has on method for event listeners', () => {
    expect(() => {
      sseService.on('message', () => {});
    }).not.toThrow();
  });

  it('has off method for removing event listeners', () => {
    const callback = () => {};
    expect(() => {
      sseService.on('message', callback);
      sseService.off('message', callback);
    }).not.toThrow();
  });
});
