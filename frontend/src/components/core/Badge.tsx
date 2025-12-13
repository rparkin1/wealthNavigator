/**
 * Professional Badge Component
 * WealthNavigator AI Design System
 *
 * Features:
 * - Semantic color variants
 * - Uppercase text styling
 * - Professional appearance
 * - Icon support
 */

import { ReactNode } from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide rounded-sm';

  const variantStyles = {
    success: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    error: 'bg-error-50 text-error-700 border border-error-200',
    info: 'bg-info-50 text-info-700 border border-info-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] h-5',
    md: 'px-3 py-1 text-[11px] h-6',
    lg: 'px-4 py-1.5 text-xs h-7',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && <span className={iconSizes[size]}>{icon}</span>}
      {children}
    </span>
  );
}
