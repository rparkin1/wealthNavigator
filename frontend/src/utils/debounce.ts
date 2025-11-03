/**
 * Debounce utility function
 * Delays execution of a function until after a specified wait period has elapsed
 * since the last time it was invoked.
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel?: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  } as T & { cancel?: () => void };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };

  return debounced;
}
