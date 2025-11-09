/**
 * useAnnounce Hook
 *
 * Provides screen reader announcements for dynamic content changes
 */

import { useCallback, useRef } from 'react';

export type AnnouncementPriority = 'polite' | 'assertive';

export interface AnnounceOptions {
  /**
   * Priority of announcement
   * - polite: Wait for current announcement to finish
   * - assertive: Interrupt current announcement
   */
  priority?: AnnouncementPriority;

  /**
   * Delay before announcement (ms)
   */
  delay?: number;
}

export function useAnnounce() {
  const timeoutRef = useRef<number | null>(null);

  const announce = useCallback((message: string, options: AnnounceOptions = {}) => {
    const { priority = 'polite', delay = 0 } = options;

    // Clear existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    const makeAnnouncement = () => {
      // Create live region element
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = message;

      document.body.appendChild(liveRegion);

      // Remove after announcement
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);
    };

    if (delay > 0) {
      timeoutRef.current = window.setTimeout(makeAnnouncement, delay);
    } else {
      makeAnnouncement();
    }
  }, []);

  return { announce };
}
