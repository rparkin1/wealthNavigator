/**
 * Step 3: Funding Strategy
 * Week 11 - UI Redesign Phase 3
 *
 * Funding inputs with real-time projection preview
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import React, { useEffect, useState } from 'react';
import type { ValidationErrors, WizardFormData } from './types';
import { SUCCESS_THRESHOLD_DEFAULT, SUCCESS_THRESHOLD_MAX, SUCCESS_THRESHOLD_MIN, GOAL_CATEGORIES } from './constants';
import { calculateProjection, formatCurrency, formatPercent } from './projectionCalculations';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface Step3FundingStrategyProps {
  formData: WizardFormData;
  errors: ValidationErrors;
  onChange: (field: keyof WizardFormData, value: any) => void;
}

export const Step3FundingStrategy: React.FC<Step3FundingStrategyProps> = ({
  formData,
  errors,
  onChange,
}) => {
  const [projection, setProjection] = useState<ReturnType<typeof calculateProjection> | null>(null);

  // Calculate projection whenever funding parameters change
  useEffect(() => {
    if (
      formData.targetAmount > 0 &&
      formData.targetDate &&
      formData.monthlyContribution >= 0 &&
      formData.expectedReturn > 0
    ) {
      const result = calculateProjection({
        currentSavings: formData.currentSavings || 0,
        monthlyContribution: formData.monthlyContribution,
        expectedReturn: formData.expectedReturn,
        targetAmount: formData.targetAmount,
        targetDate: formData.targetDate,
        successThreshold: formData.successThreshold,
      });
      setProjection(result);
    }
  }, [
    formData.currentSavings,
    formData.monthlyContribution,
    formData.expectedReturn,
    formData.targetAmount,
    formData.targetDate,
    formData.successThreshold,
  ]);

  const categoryInfo = formData.category ? GOAL_CATEGORIES[formData.category] : null;

  const getSuccessStatusColor = () => {
    if (!projection) return 'gray';
    if (projection.successProbability >= formData.successThreshold) return 'success';
    if (projection.successProbability >= formData.successThreshold - 0.1) return 'warning';
    return 'error';
  };

  const statusColor = getSuccessStatusColor();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          How will you fund this goal?
        </h2>
        <p className="text-gray-600">
          Set your contribution strategy and see projected outcomes
        </p>
      </div>

      <div className="space-y-6">
        {/* Monthly Contribution */}
        <div>
          <label htmlFor="monthly-contribution" className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Contribution <span className="text-error-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">$</span>
            <input
              id="monthly-contribution"
              type="number"
              value={formData.monthlyContribution || ''}
              onChange={(e) => onChange('monthlyContribution', parseFloat(e.target.value) || 0)}
              placeholder="2,500"
              step="100"
              className={`
                w-full pl-8 pr-4 py-3 rounded-md border transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500
                ${errors.monthlyContribution ? 'border-error-500' : 'border-gray-300 hover:border-gray-400'}
              `}
              aria-invalid={!!errors.monthlyContribution}
              aria-describedby={errors.monthlyContribution ? 'contribution-error' : undefined}
            />
          </div>
          {errors.monthlyContribution && (
            <p id="contribution-error" className="mt-1 text-sm text-error-600">
              {errors.monthlyContribution}
            </p>
          )}
        </div>

        {/* Expected Annual Return */}
        <div>
          <label htmlFor="expected-return" className="block text-sm font-medium text-gray-700 mb-1">
            Expected Annual Return (%)
          </label>
          <input
            id="expected-return"
            type="number"
            value={formData.expectedReturn || ''}
            onChange={(e) => onChange('expectedReturn', parseFloat(e.target.value) || 0)}
            placeholder="7.0"
            step="0.1"
            min="0"
            max="20"
            className="w-full px-4 py-3 rounded-md border border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-describedby="return-hint"
          />
          {categoryInfo && (
            <p id="return-hint" className="mt-1 text-sm text-gray-600 flex items-start gap-1">
              <LightBulbIcon className="w-4 h-4 text-info-600 flex-shrink-0" />
              <span>Based on {categoryInfo.defaultReturn}% for typical {categoryInfo.label.toLowerCase()} allocation</span>
            </p>
          )}
        </div>

        {/* Success Threshold Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="success-threshold" className="block text-sm font-medium text-gray-700">
              Success Threshold (Confidence Level)
            </label>
            <span className="text-sm font-semibold text-primary-600">
              {formatPercent(formData.successThreshold)} confidence
            </span>
          </div>
          <input
            id="success-threshold"
            type="range"
            min={SUCCESS_THRESHOLD_MIN}
            max={SUCCESS_THRESHOLD_MAX}
            step="0.05"
            value={formData.successThreshold}
            onChange={(e) => onChange('successThreshold', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatPercent(SUCCESS_THRESHOLD_MIN)}</span>
            <span>{formatPercent(SUCCESS_THRESHOLD_MAX)}</span>
          </div>
        </div>

        {/* Projected Outcome Card */}
        {projection && (
          <div className={`
            p-6 rounded-lg border-2 transition-colors
            ${statusColor === 'success' ? 'bg-success-50 border-success-200' : ''}
            ${statusColor === 'warning' ? 'bg-warning-50 border-warning-200' : ''}
            ${statusColor === 'error' ? 'bg-error-50 border-error-200' : ''}
            ${statusColor === 'gray' ? 'bg-gray-50 border-gray-200' : ''}
          `}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Projected Outcome</h3>
            </div>

            <div className="space-y-3">
              <div className="text-gray-700">
                With <span className="font-semibold">{formatCurrency(formData.monthlyContribution)}/month</span> contributions at{' '}
                <span className="font-semibold">{formData.expectedReturn}%</span> return:
              </div>

              <ul className="space-y-2 pl-5">
                <li className="text-gray-700">
                  • Projected Value:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(projection.projectedValue)}
                  </span>
                </li>
                <li className="text-gray-700">
                  • Success Probability:{' '}
                  <span className={`font-semibold ${
                    statusColor === 'success' ? 'text-success-700' :
                    statusColor === 'warning' ? 'text-warning-700' :
                    'text-error-700'
                  }`}>
                    {formatPercent(projection.successProbability)}
                  </span>
                </li>
                {projection.shortfallRisk > 0.05 && (
                  <li className="text-gray-700">
                    • Shortfall Risk:{' '}
                    <span className="font-semibold text-gray-900">
                      {formatPercent(projection.shortfallRisk)}
                    </span>
                    {projection.medianShortfall > 0 && (
                      <span className="text-sm text-gray-600">
                        {' '}(median shortfall: {formatCurrency(projection.medianShortfall)})
                      </span>
                    )}
                  </li>
                )}
              </ul>

              {projection.contributionAdjustment > 0 && (
                <div className={`
                  mt-4 p-3 rounded-md
                  ${statusColor === 'error' ? 'bg-error-100' : 'bg-warning-100'}
                `}>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-warning-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 mb-1">
                        To reach {formatPercent(formData.successThreshold)} confidence:
                      </p>
                      <p className="text-gray-700">
                        Increase monthly contribution to{' '}
                        <span className="font-semibold">
                          {formatCurrency(projection.recommendedContribution)}
                        </span>
                        {' '}(+{formatCurrency(projection.contributionAdjustment)})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {projection.successProbability >= formData.successThreshold && (
                <div className="mt-4 p-3 rounded-md bg-success-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-success-900">
                      Great! Your plan meets your {formatPercent(formData.successThreshold)} success threshold.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monte Carlo Option */}
        <div className="flex items-start">
          <input
            id="run-monte-carlo"
            type="checkbox"
            checked={formData.runMonteCarloOnCreation}
            onChange={(e) => onChange('runMonteCarloOnCreation', e.target.checked)}
            className="mt-1 mr-3 text-primary-600 focus:ring-primary-500 rounded"
          />
          <label htmlFor="run-monte-carlo" className="text-sm text-gray-700 cursor-pointer">
            Run full Monte Carlo simulation after creation (5,000+ iterations for detailed probability analysis)
          </label>
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};
