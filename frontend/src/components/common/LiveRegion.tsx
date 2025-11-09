/**
 * LiveRegion Component
 *
 * ARIA live region for announcing dynamic content changes to screen readers
 */

import React, { useEffect, useRef } from 'react';

export interface LiveRegionProps {
  /**
   * Message to announce
   */
  message: string;

  /**
   * Priority of announcement
   */
  priority?: 'polite' | 'assertive';

  /**
   * Whether to clear message after announcement
   */
  clearAfter?: number;

  /**
   * Callback when message is cleared
   */
  onClear?: () => void;
}

export function LiveRegion({
  message,
  priority = 'polite',
  clearAfter,
  onClear,
}: LiveRegionProps) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (clearAfter && message) {
      timeoutRef.current = window.setTimeout(() => {
        onClear?.();
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter, onClear]);

  if (!message) return null;

  return (
    <div
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
