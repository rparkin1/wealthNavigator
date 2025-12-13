import React from 'react';

/**
 * Badge Component
 *
 * Small status indicators with semantic colors.
 * Used for displaying goal priorities, statuses, and categories.
 *
 * @example
 * ```tsx
 * <Badge variant="success" size="sm">On Track</Badge>
 * <Badge variant="error" size="md">Essential</Badge>
 * ```
 */

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Optional icon before text */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Badge content */
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) => {
  // Base styles
  const baseStyles = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-sm',
    'uppercase',
    'tracking-wide',
    'border',
  ].join(' ');

  // Variant styles
  const variantStyles: Record<BadgeVariant, string> = {
    primary: [
      'bg-primary-50',
      'text-primary-700',
      'border-primary-200',
    ].join(' '),
    success: [
      'bg-success-50',
      'text-success-700',
      'border-success-200',
    ].join(' '),
    warning: [
      'bg-warning-50',
      'text-warning-700',
      'border-warning-200',
    ].join(' '),
    error: [
      'bg-error-50',
      'text-error-700',
      'border-error-200',
    ].join(' '),
    info: [
      'bg-info-50',
      'text-info-700',
      'border-info-200',
    ].join(' '),
    neutral: [
      'bg-gray-50',
      'text-gray-700',
      'border-gray-200',
    ].join(' '),
  };

  // Size styles
  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'h-5 px-2 text-xs gap-1',
    md: 'h-6 px-3 text-xs gap-1.5',
  };

  const badgeClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
