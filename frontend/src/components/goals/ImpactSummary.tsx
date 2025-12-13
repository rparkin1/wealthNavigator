/**
 * Impact Summary Component
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from './GoalIcons';
import type { ComparisonResult } from '../../utils/whatIfCalculations';
import { formatCurrency, formatPercentage, formatDifference } from '../../utils/whatIfCalculations';
import { LightBulbIcon } from '@heroicons/react/24/outline';

export interface ImpactSummaryProps {
  comparison: ComparisonResult;
  baselineValue: number;
  alternativeValue: number;
  baselineProbability: number;
  alternativeProbability: number;
  className?: string;
}

/**
 * ImpactSummary Component
 *
 * Displays the impact of what-if scenario changes compared to baseline.
 * Shows:
 * - Projected value change
 * - Success probability change
 * - Visual indicators (up/down arrows, colors)
 * - Percentage changes
 */
export function ImpactSummary({
  comparison,
  baselineValue,
  alternativeValue,
  baselineProbability,
  alternativeProbability,
  className = ''
}: ImpactSummaryProps) {
  const {
    valueDifference,
    valuePercentChange,
    probabilityDifference
  } = comparison;

  // Determine if changes are positive or negative
  const isValuePositive = valueDifference > 0;
  const isProbabilityPositive = probabilityDifference > 0;

  // Color classes based on change direction
  const valueColorClass = isValuePositive ? 'text-success-700' : 'text-error-700';
  const probabilityColorClass = isProbabilityPositive ? 'text-success-700' : 'text-error-700';

  const valueBgClass = isValuePositive ? 'bg-success-50' : 'bg-error-50';
  const probabilityBgClass = isProbabilityPositive ? 'bg-success-50' : 'bg-error-50';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5 text-primary-600" />
          <span>Impact Summary</span>
        </h3>
      </div>

      {/* Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projected Value Impact */}
        <div className={`rounded-lg border border-gray-200 p-4 ${valueBgClass}`}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Projected Value
            </span>
            {isValuePositive ? (
              <ArrowUpIcon className={`w-5 h-5 ${valueColorClass}`} />
            ) : (
              <ArrowDownIcon className={`w-5 h-5 ${valueColorClass}`} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 font-mono">
                {formatCurrency(alternativeValue)}
              </span>
            </div>

            <div className={`flex items-center gap-1 text-sm font-medium ${valueColorClass}`}>
              <span>{formatDifference(valueDifference, true)}</span>
              <span>({valuePercentChange >= 0 ? '+' : ''}{valuePercentChange.toFixed(1)}%)</span>
            </div>

            <div className="text-xs text-gray-600">
              vs. baseline: {formatCurrency(baselineValue)}
            </div>
          </div>
        </div>

        {/* Success Probability Impact */}
        <div className={`rounded-lg border border-gray-200 p-4 ${probabilityBgClass}`}>
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Success Probability
            </span>
            {isProbabilityPositive ? (
              <ArrowUpIcon className={`w-5 h-5 ${probabilityColorClass}`} />
            ) : (
              <ArrowDownIcon className={`w-5 h-5 ${probabilityColorClass}`} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 font-mono">
                {formatPercentage(alternativeProbability * 100, 1)}
              </span>
            </div>

            <div className={`flex items-center gap-1 text-sm font-medium ${probabilityColorClass}`}>
              <span>
                {probabilityDifference >= 0 ? '+' : ''}
                {formatPercentage(probabilityDifference * 100, 1)}
              </span>
            </div>

            <div className="text-xs text-gray-600">
              vs. baseline: {formatPercentage(baselineProbability * 100, 1)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Text */}
      <div className="p-4 bg-info-50 border border-info-200 rounded-lg">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-info-900">
            <p className="font-medium mb-1">Analysis</p>
            <p>
              {isValuePositive && isProbabilityPositive && (
                <>
                  Your adjustments <strong>improve</strong> both the projected value and success probability.
                  This scenario is more favorable than the baseline.
                </>
              )}
              {isValuePositive && !isProbabilityPositive && (
                <>
                  Higher projected value but <strong>lower success probability</strong>.
                  This scenario has more upside potential but increased risk.
                </>
              )}
              {!isValuePositive && isProbabilityPositive && (
                <>
                  Lower projected value but <strong>higher success probability</strong>.
                  This scenario is more conservative with greater certainty.
                </>
              )}
              {!isValuePositive && !isProbabilityPositive && (
                <>
                  Your adjustments <strong>reduce</strong> both projected value and success probability.
                  Consider revising your parameters.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation (if applicable) */}
      {!isProbabilityPositive && (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-warning-900">
              <p className="font-medium mb-1">Recommendation</p>
              <p>
                To improve your success probability, consider increasing your monthly contribution
                or adjusting your retirement age. Small changes can have a significant impact over time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function CompactImpactSummary({
  comparison,
  className = ''
}: {
  comparison: ComparisonResult;
  className?: string;
}) {
  const { valueDifference, probabilityDifference } = comparison;

  return (
    <div className={`inline-flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">Value:</span>
        <span className={`text-sm font-semibold ${valueDifference >= 0 ? 'text-success-700' : 'text-error-700'}`}>
          {formatDifference(valueDifference, true)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">Probability:</span>
        <span className={`text-sm font-semibold ${probabilityDifference >= 0 ? 'text-success-700' : 'text-error-700'}`}>
          {probabilityDifference >= 0 ? '+' : ''}{formatPercentage(probabilityDifference * 100, 1)}
        </span>
      </div>
    </div>
  );
}
