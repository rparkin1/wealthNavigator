/**
 * WhatIfSliders Component
 *
 * Interactive sliders for real-time scenario adjustment.
 * Allows users to modify key variables and see immediate impact on success probability.
 */

import { useState, useEffect, useMemo, useId } from 'react';
import { debounce } from '../../utils/debounce';

export interface WhatIfAdjustments {
  monthlyContribution?: number;
  expectedReturnStocks?: number;
  expectedReturnBonds?: number;
  inflationRate?: number;
  retirementAge?: number;
  lifeExpectancy?: number;
}

const DEFAULT_BASE_VALUES = {
  monthlyContribution: 0,
  expectedReturnStocks: 0.07,
  expectedReturnBonds: 0.03,
  inflationRate: 0.02,
  retirementAge: 65,
  lifeExpectancy: 90,
} as const;

export interface WhatIfSlidersProps {
  goalId: string;
  baseValues: {
    monthlyContribution: number;
    expectedReturnStocks: number;
    expectedReturnBonds: number;
    inflationRate: number;
    retirementAge: number;
    lifeExpectancy: number;
  };
  onAdjustmentsChange: (adjustments: WhatIfAdjustments) => void;
  loading?: boolean;
}

export function WhatIfSliders({
  goalId,
  baseValues,
  onAdjustmentsChange,
  loading = false,
}: WhatIfSlidersProps) {
  const [adjustments, setAdjustments] = useState<WhatIfAdjustments>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const safeBaseValues = useMemo(
    () => ({
      ...DEFAULT_BASE_VALUES,
      ...baseValues,
    }),
    [baseValues]
  );

  // Debounced callback to parent
  useEffect(() => {
    const debouncedCallback = debounce(() => {
      onAdjustmentsChange(adjustments);
    }, 500);

    debouncedCallback();
    return () => debouncedCallback.cancel?.();
  }, [adjustments, onAdjustmentsChange]);

  const handleReset = () => {
    setAdjustments({});
  };

  const updateAdjustment = (key: keyof WhatIfAdjustments, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getCurrentValue = (key: keyof typeof DEFAULT_BASE_VALUES): number => {
    const adjustment = adjustments[key];
    if (typeof adjustment === 'number' && !Number.isNaN(adjustment)) {
      return adjustment;
    }
    return safeBaseValues[key];
  };

  const hasChanges = Object.keys(adjustments).length > 0;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">What-If Analysis</h3>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset to Baseline
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2 text-blue-600">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Recalculating...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Monthly Contribution Slider */}
        <SliderControl
          label="Monthly Contribution"
          value={getCurrentValue('monthlyContribution')}
          baseValue={safeBaseValues.monthlyContribution}
          min={0}
          max={Math.max(safeBaseValues.monthlyContribution * 3, 1000)}
          step={50}
          format="currency"
          onChange={value => updateAdjustment('monthlyContribution', value)}
          description="Adjust your monthly savings amount"
          disabled={loading}
        />

        {/* Retirement Age Slider */}
        <SliderControl
          label="Retirement Age"
          value={getCurrentValue('retirementAge')}
          baseValue={safeBaseValues.retirementAge}
          min={50}
          max={75}
          step={1}
          format="years"
          onChange={value => updateAdjustment('retirementAge', value)}
          description="When do you plan to retire?"
          disabled={loading}
        />

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">Advanced Options</span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Advanced Sliders */}
        {showAdvanced && (
          <div className="space-y-6 pl-4 border-l-2 border-gray-200">
            <SliderControl
              label="Expected Stock Returns"
              value={getCurrentValue('expectedReturnStocks')}
              baseValue={safeBaseValues.expectedReturnStocks}
              min={0}
              max={0.15}
              step={0.005}
              format="percentage"
              onChange={value => updateAdjustment('expectedReturnStocks', value)}
              description="Annual return assumption for stocks"
              disabled={loading}
            />

            <SliderControl
              label="Expected Bond Returns"
              value={getCurrentValue('expectedReturnBonds')}
              baseValue={safeBaseValues.expectedReturnBonds}
              min={0}
              max={0.08}
              step={0.0025}
              format="percentage"
              onChange={value => updateAdjustment('expectedReturnBonds', value)}
              description="Annual return assumption for bonds"
              disabled={loading}
            />

            <SliderControl
              label="Inflation Rate"
              value={getCurrentValue('inflationRate')}
              baseValue={safeBaseValues.inflationRate}
              min={0}
              max={0.06}
              step={0.0025}
              format="percentage"
              onChange={value => updateAdjustment('inflationRate', value)}
              description="Expected annual inflation"
              disabled={loading}
            />

            <SliderControl
              label="Life Expectancy"
              value={getCurrentValue('lifeExpectancy')}
              baseValue={safeBaseValues.lifeExpectancy}
              min={75}
              max={100}
              step={1}
              format="years"
              onChange={value => updateAdjustment('lifeExpectancy', value)}
              description="Planning horizon"
              disabled={loading}
            />
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex gap-2">
          <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-blue-900">
            <strong>Tip:</strong> Adjust the sliders to see how different scenarios affect your goal success probability.
            Changes are updated in real-time.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Slider Control Component
 */
interface SliderControlProps {
  label: string;
  value: number;
  baseValue: number;
  min: number;
  max: number;
  step: number;
  format: 'currency' | 'percentage' | 'years';
  onChange: (value: number) => void;
  description?: string;
  disabled?: boolean;
}

function SliderControl({
  label,
  value,
  baseValue,
  min,
  max,
  step,
  format,
  onChange,
  description,
  disabled = false,
}: SliderControlProps) {
  const sliderId = useId();

  const formatValue = (val: number): string => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    } else if (format === 'percentage') {
      return `${(val * 100).toFixed(2)}%`;
    } else {
      return `${val.toFixed(0)} years`;
    }
  };

  const getDeltaDisplay = (): string | null => {
    if (value === baseValue) return null;
    const delta = value - baseValue;
    const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';

    if (format === 'currency') {
      return `${sign}${formatValue(Math.abs(delta))}`;
    } else if (format === 'percentage') {
      return `${sign}${(delta * 100).toFixed(2)}%`;
    } else {
      return `${sign}${delta.toFixed(0)} years`;
    }
  };

  const delta = getDeltaDisplay();
  const hasChanged = value !== baseValue;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700" htmlFor={sliderId}>
          {label}
        </label>
        <div className="flex items-center space-x-2">
          {hasChanged && delta && (
            <span className={`text-xs font-medium ${
              value > baseValue ? 'text-green-600' : 'text-red-600'
            }`}>
              ({delta})
            </span>
          )}
          <span className="text-sm font-semibold text-gray-900" role="status" aria-live="polite">
            {formatValue(value)}
          </span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        id={sliderId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-label={label}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />

      {/* Range Labels */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500">{formatValue(min)}</span>
        {description && (
          <span className="text-xs text-gray-500 italic">{description}</span>
        )}
        <span className="text-xs text-gray-500">{formatValue(max)}</span>
      </div>
    </div>
  );
}
