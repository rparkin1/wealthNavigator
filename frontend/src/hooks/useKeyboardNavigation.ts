/**
 * useKeyboardNavigation Hook
 *
 * Provides keyboard navigation support for lists, menus, and complex widgets
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { KeyCodes } from '../utils/accessibility';

export interface KeyboardNavigationOptions {
  /**
   * Items that can be navigated
   */
  itemCount: number;

  /**
   * Initial selected index
   */
  initialIndex?: number;

  /**
   * Callback when an item is selected/activated
   */
  onSelect?: (index: number) => void;

  /**
   * Enable circular navigation (wrap around)
   */
  circular?: boolean;

  /**
   * Enable horizontal navigation (left/right arrows)
   */
  horizontal?: boolean;

  /**
   * Enable vertical navigation (up/down arrows)
   */
  vertical?: boolean;

  /**
   * Enable Home/End keys
   */
  enableHomeEnd?: boolean;
}

export function useKeyboardNavigation({
  itemCount,
  initialIndex = 0,
  onSelect,
  circular = false,
  horizontal = false,
  vertical = true,
  enableHomeEnd = true,
}: KeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  // Register an item element
  const registerItem = useCallback((index: number, element: HTMLElement | null) => {
    itemsRef.current[index] = element;
  }, []);

  // Navigate to next item
  const navigateNext = useCallback(() => {
    setFocusedIndex((prev) => {
      if (prev >= itemCount - 1) {
        return circular ? 0 : prev;
      }
      return prev + 1;
    });
  }, [itemCount, circular]);

  // Navigate to previous item
  const navigatePrevious = useCallback(() => {
    setFocusedIndex((prev) => {
      if (prev <= 0) {
        return circular ? itemCount - 1 : prev;
      }
      return prev - 1;
    });
  }, [itemCount, circular]);

  // Navigate to first item
  const navigateFirst = useCallback(() => {
    setFocusedIndex(0);
  }, []);

  // Navigate to last item
  const navigateLast = useCallback(() => {
    setFocusedIndex(itemCount - 1);
  }, [itemCount]);

  // Select current item
  const selectCurrent = useCallback(() => {
    if (onSelect) {
      onSelect(focusedIndex);
    }
  }, [focusedIndex, onSelect]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      let handled = false;

      switch (event.key) {
        case KeyCodes.ARROW_DOWN:
          if (vertical) {
            event.preventDefault();
            navigateNext();
            handled = true;
          }
          break;

        case KeyCodes.ARROW_UP:
          if (vertical) {
            event.preventDefault();
            navigatePrevious();
            handled = true;
          }
          break;

        case KeyCodes.ARROW_RIGHT:
          if (horizontal) {
            event.preventDefault();
            navigateNext();
            handled = true;
          }
          break;

        case KeyCodes.ARROW_LEFT:
          if (horizontal) {
            event.preventDefault();
            navigatePrevious();
            handled = true;
          }
          break;

        case KeyCodes.HOME:
          if (enableHomeEnd) {
            event.preventDefault();
            navigateFirst();
            handled = true;
          }
          break;

        case KeyCodes.END:
          if (enableHomeEnd) {
            event.preventDefault();
            navigateLast();
            handled = true;
          }
          break;

        case KeyCodes.ENTER:
        case KeyCodes.SPACE:
          event.preventDefault();
          selectCurrent();
          handled = true;
          break;
      }

      return handled;
    },
    [
      vertical,
      horizontal,
      enableHomeEnd,
      navigateNext,
      navigatePrevious,
      navigateFirst,
      navigateLast,
      selectCurrent,
    ]
  );

  // Focus the currently focused item
  useEffect(() => {
    const currentItem = itemsRef.current[focusedIndex];
    if (currentItem) {
      currentItem.focus();
    }
  }, [focusedIndex]);

  // Get props for container
  const getContainerProps = useCallback(
    () => ({
      onKeyDown: handleKeyDown,
      role: 'list',
    }),
    [handleKeyDown]
  );

  // Get props for an item
  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => registerItem(index, el),
      tabIndex: index === focusedIndex ? 0 : -1,
      role: 'listitem',
      'aria-selected': index === focusedIndex,
      onFocus: () => setFocusedIndex(index),
      onClick: () => onSelect?.(index),
    }),
    [focusedIndex, registerItem, onSelect]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
    selectCurrent,
    getContainerProps,
    getItemProps,
  };
}
