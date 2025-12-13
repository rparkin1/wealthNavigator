import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Toast Notification System
 *
 * Global toast notifications with automatic dismissal and queue management.
 * Supports multiple variants and custom actions.
 *
 * @example
 * ```tsx
 * // Wrap app with ToastProvider
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // Use in components
 * const toast = useToast();
 * toast.success('Goal created successfully!', {
 *   action: { label: 'View', onClick: () => navigate('/goal/123') }
 * });
 * ```
 */

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Toast variant */
  variant?: ToastVariant;
  /** Duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Action button */
  action?: ToastAction;
}

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'variant'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider Component
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, options: ToastOptions = {}): string => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = {
        id,
        message,
        variant: options.variant || 'info',
        duration: options.duration ?? 5000,
        action: options.action,
      };

      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss
      if (toast.duration > 0) {
        setTimeout(() => dismiss(id), toast.duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      show(message, { ...options, variant: 'success' }),
    [show]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      show(message, { ...options, variant: 'error' }),
    [show]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      show(message, { ...options, variant: 'warning' }),
    [show]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'variant'>) =>
      show(message, { ...options, variant: 'info' }),
    [show]
  );

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

/**
 * Hook to access toast functions
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * Toast Container (renders all toasts)
 */
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-notification space-y-3 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

/**
 * Individual Toast Item
 */
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  // Variant styles
  const variantStyles: Record<ToastVariant, { bg: string; text: string; icon: JSX.Element }> = {
    info: {
      bg: 'bg-info-50 border-info-200',
      text: 'text-info-800',
      icon: (
        <svg className="w-5 h-5 text-info-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-success-50 border-success-200',
      text: 'text-success-800',
      icon: (
        <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-warning-50 border-warning-200',
      text: 'text-warning-800',
      icon: (
        <svg className="w-5 h-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-error-50 border-error-200',
      text: 'text-error-800',
      icon: (
        <svg className="w-5 h-5 text-error-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const { bg, text, icon } = variantStyles[toast.variant];

  return (
    <div
      className={`
        ${bg} ${text}
        border rounded-lg shadow-lg p-4
        flex items-start gap-3
        animate-in slide-in-from-right duration-300
      `}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-sm font-semibold underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 -mr-1 -mt-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ToastProvider;
