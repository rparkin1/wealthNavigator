/**
 * Professional Progress Bar Component
 * WealthNavigator AI Design System
 *
 * Features:
 * - Clean, single-color design (no gradients)
 * - Semantic color variants
 * - Smooth animations
 * - Percentage display
 * - Multiple sizes
 */

import { useMemo } from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'success' | 'warning' | 'error' | 'primary' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showPercentage = false,
  label,
  className = '',
}: ProgressBarProps) {
  const percentage = useMemo(() => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return Math.round(pct);
  }, [value, max]);

  const baseStyles = 'w-full bg-slate-200 rounded-full overflow-hidden';

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const fillVariants = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    primary: 'bg-primary-600',
    neutral: 'bg-slate-500',
  };

  const fillStyles = `${fillVariants[variant]} h-full rounded-full transition-all duration-600 ease-out`;

  // Auto-determine variant based on percentage if not specified
  const autoVariant = useMemo(() => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'error';
  }, [percentage]);

  const displayVariant = variant === 'primary' && percentage < 100 ? autoVariant : variant;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold font-mono text-slate-900">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={`${baseStyles} ${sizeStyles[size]}`}>
        <div
          className={`${fillStyles.replace(fillVariants[variant], fillVariants[displayVariant])}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${percentage}%`}
        />
      </div>
    </div>
  );
}

/**
 * Compact Progress Bar - Used in cards and compact layouts
 */
export interface CompactProgressBarProps extends Omit<ProgressBarProps, 'size' | 'showPercentage'> {
  inline?: boolean;
}

export function CompactProgressBar({
  value,
  max = 100,
  variant,
  label,
  inline = false,
  className = '',
}: CompactProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  if (inline) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {label && <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{label}</span>}
        <div className="flex-1">
          <ProgressBar value={value} max={max} variant={variant} size="sm" />
        </div>
        <span className="text-xs font-semibold font-mono text-slate-900 whitespace-nowrap">
          {Math.round(percentage)}%
        </span>
      </div>
    );
  }

  return (
    <ProgressBar
      value={value}
      max={max}
      variant={variant}
      size="sm"
      showPercentage={true}
      label={label}
      className={className}
    />
  );
}
