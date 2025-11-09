/**
 * AccessibleInput Component
 *
 * Fully accessible form input with validation and error messages
 */

import React, { useId } from 'react';

export interface AccessibleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'aria-label'> {
  /**
   * Label for the input
   */
  label: string;

  /**
   * Additional description/help text
   */
  description?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Whether to hide label visually (still accessible to screen readers)
   */
  hideLabel?: boolean;

  /**
   * Container className
   */
  containerClassName?: string;
}

export function AccessibleInput({
  label,
  description,
  error,
  hideLabel = false,
  containerClassName,
  required,
  disabled,
  className,
  ...props
}: AccessibleInputProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={containerClassName}>
      <label
        htmlFor={id}
        className={`block text-sm font-medium text-gray-700 mb-1 ${
          hideLabel ? 'sr-only' : ''
        }`}
      >
        {label}
        {required && (
          <span className="text-red-600 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-gray-600 mb-2">
          {description}
        </p>
      )}

      <input
        id={id}
        className={`
          input-field
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${className || ''}
        `.trim()}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        disabled={disabled}
        {...props}
      />

      {error && (
        <div
          id={errorId}
          className="mt-2 text-sm text-red-600 flex items-start"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
