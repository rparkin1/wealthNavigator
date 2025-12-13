import React from 'react';

export interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  helperText?: string;
  disabled?: boolean;
  showMinMax?: boolean;
  className?: string;
}

/**
 * RangeSlider Component
 *
 * Interactive range slider for what-if analysis and other adjustable parameters.
 * Features:
 * - Touch-optimized (44px height)
 * - Live value display
 * - Min/max labels
 * - Custom value formatting
 * - Accessibility (ARIA labels, keyboard support)
 */
export function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  helperText,
  disabled = false,
  showMinMax = true,
  className = ''
}: RangeSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : value.toString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Current Value */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={`slider-${label}`}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <span className="text-lg font-semibold text-gray-900 font-mono">
          {displayValue}
        </span>
      </div>

      {/* Slider Track */}
      <div className="relative">
        <input
          id={`slider-${label}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="range-slider"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={displayValue}
        />
        {/* Progress fill */}
        <div
          className="range-slider-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Min/Max Labels */}
      {showMinMax && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatValue ? formatValue(min) : min}</span>
          <span>{formatValue ? formatValue(max) : max}</span>
        </div>
      )}

      {/* Helper Text */}
      {helperText && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Common value formatters for financial calculations
 */
export const formatters = {
  currency: (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value),

  percentage: (value: number) => `${value.toFixed(1)}%`,

  years: (value: number) => `${value} years`,

  age: (value: number) => `Age ${value}`,

  months: (value: number) => `${value} months`
};
