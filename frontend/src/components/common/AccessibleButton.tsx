/**
 * AccessibleButton Component
 *
 * Fully accessible button with keyboard support and ARIA attributes
 */

import React from 'react';
import { handleActivation } from '../../utils/accessibility';

export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button label for screen readers (if different from visible text)
   */
  'aria-label'?: string;

  /**
   * ID of element describing this button
   */
  'aria-describedby'?: string;

  /**
   * Whether button triggers a popup/menu
   */
  'aria-haspopup'?: boolean | 'menu' | 'dialog' | 'listbox' | 'tree' | 'grid';

  /**
   * Whether popup is expanded
   */
  'aria-expanded'?: boolean;

  /**
   * Current state for toggle buttons
   */
  'aria-pressed'?: boolean;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Icon element to display before text
   */
  icon?: React.ReactNode;

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';

  children: React.ReactNode;
}

export function AccessibleButton({
  children,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-haspopup': ariaHaspopup,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed,
  isLoading = false,
  icon,
  variant = 'primary',
  disabled,
  className,
  onKeyDown,
  ...props
}: AccessibleButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Prevent default for space key to avoid scrolling
    if (e.key === ' ') {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  return (
    <button
      type="button"
      className={`
        ${variantClasses[variant]}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className || ''}
      `.trim()}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {isLoading && (
        <span
          className="inline-block mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Loading"
        />
      )}
      {icon && <span className="mr-2" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
