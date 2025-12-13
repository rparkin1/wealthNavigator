import React from 'react';

/**
 * ProgressBar Component
 *
 * Visual indicator of progress towards a goal or completion state.
 * Supports different colors and optional percentage display.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   value={82}
 *   max={100}
 *   label="82% to goal"
 *   showPercentage
 *   color="success"
 *   height="md"
 * />
 * ```
 */

export type ProgressBarColor = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
export type ProgressBarHeight = 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  /** Current value */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Optional label above the progress bar */
  label?: string;
  /** Show percentage text on the right */
  showPercentage?: boolean;
  /** Color variant */
  color?: ProgressBarColor;
  /** Height variant */
  height?: ProgressBarHeight;
  /** Additional CSS classes for the container */
  className?: string;
  /** Animated transition */
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'primary',
  height = 'md',
  className = '',
  animated = true,
}) => {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const percentageText = `${Math.round(percentage)}%`;

  // Container styles
  const containerClasses = ['w-full', className].filter(Boolean).join(' ');

  // Track (background) styles
  const trackBaseStyles = [
    'w-full',
    'bg-gray-200',
    'rounded-full',
    'overflow-hidden',
  ].join(' ');

  // Height styles
  const heightStyles: Record<ProgressBarHeight, string> = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const trackClasses = [trackBaseStyles, heightStyles[height]]
    .filter(Boolean)
    .join(' ');

  // Fill (progress) styles
  const fillBaseStyles = [
    'h-full',
    'rounded-full',
    animated ? 'transition-all duration-slower ease-out' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Color styles
  const colorStyles: Record<ProgressBarColor, string> = {
    primary: 'bg-primary-600',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    neutral: 'bg-gray-500',
  };

  const fillClasses = [fillBaseStyles, colorStyles[color]]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">
              {percentageText}
            </span>
          )}
        </div>
      )}

      <div className={trackClasses} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className={fillClasses}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
