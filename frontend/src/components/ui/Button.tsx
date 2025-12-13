import React, { forwardRef } from 'react';

/**
 * Button Component
 *
 * A versatile button component with multiple variants, sizes, and states.
 * Follows the WealthNavigator design system.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Save Goal
 * </Button>
 * ```
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Loading state with spinner */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button children (text or elements) */
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-md',
      'transition-all',
      'duration-base',
      'ease-in-out',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    ].join(' ');

    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary: [
        'bg-primary-600',
        'text-white',
        'border',
        'border-transparent',
        'hover:bg-primary-700',
        'active:bg-primary-800',
        'focus:ring-primary-500',
        'hover:shadow-sm',
      ].join(' '),
      secondary: [
        'bg-white',
        'text-gray-700',
        'border',
        'border-gray-300',
        'hover:bg-gray-50',
        'hover:border-gray-400',
        'active:bg-gray-100',
        'focus:ring-gray-500',
      ].join(' '),
      ghost: [
        'bg-transparent',
        'text-gray-700',
        'border',
        'border-transparent',
        'hover:bg-gray-100',
        'active:bg-gray-200',
        'focus:ring-gray-500',
      ].join(' '),
      danger: [
        'bg-error-600',
        'text-white',
        'border',
        'border-transparent',
        'hover:bg-error-700',
        'active:bg-error-800',
        'focus:ring-error-500',
        'hover:shadow-sm',
      ].join(' '),
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'h-8 px-4 text-sm gap-2',
      md: 'h-10 px-6 text-sm gap-2',
      lg: 'h-12 px-8 text-base gap-3',
    };

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Combine all styles
    const buttonClasses = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      widthStyles,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
