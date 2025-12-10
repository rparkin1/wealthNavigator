/**
 * useFocusTrap Hook
 *
 * Traps focus within a container for modals, dialogs, and popups
 */

import { useEffect, useRef, useCallback } from 'react';
import { getFocusableElements, FocusManager } from '../utils/accessibility';

export interface FocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  enabled?: boolean;

  /**
   * Whether to restore focus when trap is disabled
   */
  restoreFocus?: boolean;

  /**
   * Whether to focus the first element when trap is enabled
   */
  focusFirst?: boolean;
}

export function useFocusTrap(options: FocusTrapOptions = {}) {
  const {
    enabled = true,
    restoreFocus = true,
    focusFirst = true,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const focusManagerRef = useRef(new FocusManager());

  // Handle keyboard navigation within trap
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: move to last element if at first
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: move to first element if at last
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // Set up focus trap
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusManager = focusManagerRef.current;

    // Save current focus
    if (restoreFocus) {
      focusManager.saveFocus();
    }

    // Focus first element
    if (focusFirst) {
      focusManager.focusFirst(container);
    }

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (restoreFocus) {
        focusManager.restoreFocus();
      }
    };
  }, [enabled, restoreFocus, focusFirst, handleKeyDown]);

  // Set container ref
  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return { setContainerRef };
}
