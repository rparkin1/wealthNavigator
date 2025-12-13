/**
 * SuccessProbabilityDisplay Component
 *
 * Visual display of Monte Carlo simulation success probability with
 * confidence level indicator and contextual information.
 *
 * Following UI Redesign specifications - Week 8
 */

import React from 'react';
import ProgressBar from '../../ui/ProgressBar';

export interface SuccessProbabilityDisplayProps {
  probability: number; // 0.0 - 1.0
  iterations: number;
  goalAmount: number;
  medianValue: number;
}

export function SuccessProbabilityDisplay({
  probability,
  iterations,
  goalAmount,
  medianValue,
}: SuccessProbabilityDisplayProps) {
  const probabilityPercent = probability * 100;

  // Determine confidence level
  const getConfidenceLevel = (prob: number): { level: string; color: string; description: string } => {
    if (prob >= 90) {
      return {
        level: 'Very High',
        color: 'success',
        description: 'Excellent chance of achieving your goal',
      };
    } else if (prob >= 80) {
      return {
        level: 'High',
        color: 'success',
        description: 'Strong probability of success',
      };
    } else if (prob >= 70) {
      return {
        level: 'Moderate',
        color: 'warning',
        description: 'Good chance, but consider increasing contributions',
      };
    } else if (prob >= 60) {
      return {
        level: 'Fair',
        color: 'warning',
        description: 'Success is possible but uncertain',
      };
    } else {
      return {
        level: 'Low',
        color: 'error',
        description: 'Goal may be at risk, consider adjustments',
      };
    }
  };

  const confidence = getConfidenceLevel(probabilityPercent);
  const shortfall = Math.max(0, goalAmount - medianValue);
  const surplus = Math.max(0, medianValue - goalAmount);

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-6">
      {/* Main Success Rate */}
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-gray-700 uppercase tracking-wide mb-2">
          Success Probability
        </p>
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="text-6xl font-bold text-primary-700 font-mono">
            {probabilityPercent.toFixed(1)}
          </span>
          <span className="text-3xl font-semibold text-primary-600">%</span>
        </div>
        <p className="text-lg font-medium text-primary-900 mb-1">
          {confidence.level} Confidence
        </p>
        <p className="text-sm text-gray-700">{confidence.description}</p>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-6">
        <ProgressBar
          value={probabilityPercent}
          max={100}
          color={confidence.color as 'success' | 'warning' | 'error'}
          height="lg"
          showPercentage={false}
        />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary-200">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
            Simulations Run
          </p>
          <p className="text-lg font-bold text-gray-900 font-mono">
            {iterations.toLocaleString()}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
            Median Outcome
          </p>
          <p className="text-lg font-bold text-gray-900 font-mono">
            {formatCurrency(medianValue)}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
            {surplus > 0 ? 'Expected Surplus' : 'Expected Shortfall'}
          </p>
          <p
            className={`text-lg font-bold font-mono ${
              surplus > 0 ? 'text-success-700' : 'text-error-700'
            }`}
          >
            {surplus > 0 ? '+' : '-'}
            {formatCurrency(surplus > 0 ? surplus : shortfall)}
          </p>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mt-6 pt-6 border-t border-primary-200">
        <div className="flex items-center justify-between text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-${confidence.color}-500`} />
            <span className="font-medium">{confidence.level} Confidence Level</span>
          </div>
          <span className="text-gray-600">
            {Math.round(probabilityPercent * iterations / 100)} / {iterations.toLocaleString()} scenarios successful
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Format currency with compact notation
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
