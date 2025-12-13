import React, { forwardRef } from 'react';

/**
 * Input Component
 *
 * A flexible input field component with label, error states, and helper text.
 * Supports multiple input types including text, number, email, password, date, etc.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Monthly Contribution"
 *   type="number"
 *   value={amount}
 *   onChange={(e) => setAmount(e.target.value)}
 *   error={errors.amount}
 *   helperText="How much can you save each month?"
 *   required
 * />
 * ```
 */

export type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label text */
  label?: string;
  /** Input type */
  type?: InputType;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
  /** Additional CSS classes for the input field */
  className?: string;
  /** Additional CSS classes for the wrapper */
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = 'text',
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      wrapperClassName = '',
      required,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Wrapper styles
    const wrapperClasses = [
      'flex',
      'flex-col',
      'gap-2',
      fullWidth ? 'w-full' : '',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    // Label styles
    const labelClasses = [
      'text-sm',
      'font-medium',
      'text-gray-700',
      disabled ? 'opacity-50' : '',
    ]
      .filter(Boolean)
      .join(' ');

    // Input wrapper styles (for icons)
    const inputWrapperClasses = 'relative flex items-center';

    // Input field styles
    const baseInputStyles = [
      'w-full',
      'px-4',
      'py-2',
      'text-base',
      'text-gray-900',
      'placeholder-gray-400',
      'border',
      'rounded-md',
      'transition-colors',
      'duration-base',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-0',
      'disabled:bg-gray-100',
      'disabled:cursor-not-allowed',
      'disabled:text-gray-500',
    ].join(' ');

    // Border and focus styles based on error state
    const stateStyles = error
      ? [
          'border-error-500',
          'focus:border-error-500',
          'focus:ring-error-500',
        ].join(' ')
      : [
          'border-gray-300',
          'hover:border-gray-400',
          'focus:border-primary-500',
          'focus:ring-primary-500',
        ].join(' ');

    // Icon padding adjustments
    const iconPaddingStyles = [
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      baseInputStyles,
      stateStyles,
      iconPaddingStyles,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Icon styles
    const iconClasses = 'absolute text-gray-400 pointer-events-none';
    const leftIconClasses = `${iconClasses} left-3`;
    const rightIconClasses = `${iconClasses} right-3`;

    // Helper/Error text styles
    const helperTextClasses = error
      ? 'text-sm text-error-600'
      : 'text-sm text-gray-500';

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div className={inputWrapperClasses}>
          {leftIcon && (
            <div className={leftIconClasses}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={inputClasses}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className={rightIconClasses}>
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className={helperTextClasses} role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className={helperTextClasses}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
