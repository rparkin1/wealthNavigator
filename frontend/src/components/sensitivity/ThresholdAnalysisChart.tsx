/**
 * Threshold Analysis Chart Component
 *
 * Visualizes the required value of a variable to achieve a target
 * success probability, showing current vs. required values.
 *
 * Features:
 * - Visual comparison of current and threshold values
 * - Delta calculation with percentage change
 * - Color-coded status indicator (safe/at-risk)
 * - Actionable recommendations
 * - Progress bar visualization
 */

import React from 'react';
import type { ThresholdAnalysisResult } from '../../types/sensitivityAnalysis';
import {
  formatVariableName,
  formatVariableValue,
  calculatePercentageChange,
} from '../../services/sensitivityAnalysisApi';
import { ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ThresholdAnalysisChartProps {
  data: ThresholdAnalysisResult;
  onAdjustGoal?: (variable: string, newValue: number) => void;
}

export const ThresholdAnalysisChart: React.FC<ThresholdAnalysisChartProps> = ({
  data,
  onAdjustGoal,
}) => {
  const { analysis } = data;
  const {
    variable,
    threshold_value,
    base_value,
    delta,
    delta_percentage,
    achieved_probability,
    target_probability,
  } = analysis;

  const needsIncrease = delta > 0;
  const isOnTrack = achieved_probability >= target_probability;
  const percentageChange = Math.abs(delta_percentage);

  // Calculate progress percentage
  const progress = isOnTrack ? 100 : (achieved_probability / target_probability) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Threshold Analysis: {formatVariableName(variable)}
        </h3>
        {isOnTrack ? (
          <div className="flex items-center text-green-600">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">On Track</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-600">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Adjustment Needed</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress to Target</span>
          <span className="font-medium">
            {achieved_probability.toFixed(1)}% / {(target_probability * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isOnTrack ? 'bg-green-500' : progress >= 75 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Value Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Value */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Current Value</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatVariableValue(variable, base_value)}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Probability: {(achieved_probability * 100).toFixed(1)}%
          </div>
        </div>

        {/* Required Value */}
        <div
          className={`rounded-lg p-4 border ${
            isOnTrack
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div
            className={`text-sm font-medium mb-1 ${
              isOnTrack ? 'text-green-600' : 'text-amber-600'
            }`}
          >
            Required Value
          </div>
          <div
            className={`text-2xl font-bold ${
              isOnTrack ? 'text-green-900' : 'text-amber-900'
            }`}
          >
            {formatVariableValue(variable, threshold_value)}
          </div>
          <div
            className={`text-xs mt-1 ${
              isOnTrack ? 'text-green-700' : 'text-amber-700'
            }`}
          >
            Target: {(target_probability * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Delta Card */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">
              {needsIncrease ? 'Increase' : 'Decrease'} Required
            </div>
            <div className="flex items-center space-x-2">
              {needsIncrease ? (
                <ArrowUpIcon className="h-5 w-5 text-red-500" />
              ) : (
                <ArrowDownIcon className="h-5 w-5 text-green-500" />
              )}
              <span className="text-xl font-bold text-gray-900">
                {formatVariableValue(variable, Math.abs(delta))}
              </span>
              <span className="text-sm text-gray-600">
                ({percentageChange.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">
          Recommendations
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          {!isOnTrack && (
            <>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  {needsIncrease ? 'Increase' : 'Decrease'} your{' '}
                  {formatVariableName(variable).toLowerCase()} by{' '}
                  {percentageChange.toFixed(1)}% to achieve{' '}
                  {(target_probability * 100).toFixed(0)}% success probability.
                </span>
              </li>
              {variable === 'monthly_contribution' && (
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>
                    Consider automating this contribution through direct deposit
                    or automatic transfers.
                  </span>
                </li>
              )}
              {variable.includes('return') && (
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>
                    Adjust your asset allocation to target higher expected returns,
                    keeping in mind the associated risk.
                  </span>
                </li>
              )}
              {variable === 'target_amount' && (
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>
                    Review your goal to ensure the target amount aligns with your
                    actual needs.
                  </span>
                </li>
              )}
            </>
          )}
          {isOnTrack && (
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>
                Your current {formatVariableName(variable).toLowerCase()} is
                sufficient to achieve your target success probability.
              </span>
            </li>
          )}
        </ul>

        {onAdjustGoal && !isOnTrack && (
          <button
            onClick={() => onAdjustGoal(variable, threshold_value)}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Apply Recommended Adjustment
          </button>
        )}
      </div>

      {/* Technical Details */}
      <div className="border-t border-gray-200 pt-4">
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
            Technical Details
          </summary>
          <div className="mt-3 space-y-2 pl-4">
            <div>
              <strong>Analysis Method:</strong> Binary search optimization with
              Monte Carlo simulation
            </div>
            <div>
              <strong>Convergence:</strong> Achieved within ±1% tolerance
            </div>
            <div>
              <strong>Variable Range Tested:</strong> 50% to 200% of base value
            </div>
            <div>
              <strong>Simulation Iterations:</strong> 5,000 per test point
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ThresholdAnalysisChart;
