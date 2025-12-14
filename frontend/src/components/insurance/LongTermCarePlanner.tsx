/**
 * Long-Term Care Planner
 *
 * Calculates long-term care insurance needs with inflation adjustments
 */

import React, { useState } from 'react';
import { CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { insuranceOptimizationApi } from '../../services/insuranceOptimizationApi';
import type { LongTermCareAnalysis, LongTermCareForm } from '../../types/insurance';

interface LongTermCarePlannerProps {
  onAnalysisComplete?: (analysis: LongTermCareAnalysis) => void;
  existingAnalysis?: LongTermCareAnalysis | null;
}

const LongTermCarePlanner: React.FC<LongTermCarePlannerProps> = ({
  onAnalysisComplete,
  existingAnalysis,
}) => {
  const [form, setForm] = useState<LongTermCareForm>({
    age: 55,
    currentAssets: 500000,
    annualIncome: 75000,
    familyHistoryLtc: false,
    preferredCareLevel: 'assisted_living',
    yearsOfCare: 3,
    hasExistingPolicy: false,
    existingDailyBenefit: 0,
  });
  const [analysis, setAnalysis] = useState<LongTermCareAnalysis | null>(existingAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const careLevels = [
    { value: 'home_health_aide', label: 'Home Health Aide' },
    { value: 'assisted_living', label: 'Assisted Living Facility' },
    { value: 'nursing_home_semi_private', label: 'Nursing Home (Semi-Private)' },
    { value: 'nursing_home_private', label: 'Nursing Home (Private)' },
  ];

  const handleInputChange = (field: keyof LongTermCareForm, value: number | string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await insuranceOptimizationApi.calculateLTCNeeds({
        age: form.age,
        current_assets: form.currentAssets,
        annual_income: form.annualIncome,
        family_history_ltc: form.familyHistoryLtc,
        preferred_care_level: form.preferredCareLevel,
        years_of_care: form.yearsOfCare,
        has_existing_policy: form.hasExistingPolicy,
        existing_daily_benefit: form.existingDailyBenefit,
      });

      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate LTC needs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Long-Term Care Planner</h2>
        <p className="text-gray-600">
          Calculate long-term care insurance needs with 5% annual healthcare inflation
        </p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Assets
            </label>
            <input
              type="number"
              value={form.currentAssets}
              onChange={(e) => handleInputChange('currentAssets', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Income
            </label>
            <input
              type="number"
              value={form.annualIncome}
              onChange={(e) => handleInputChange('annualIncome', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="family-history"
              checked={form.familyHistoryLtc}
              onChange={(e) => handleInputChange('familyHistoryLtc', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="family-history" className="text-sm text-gray-700">
              Family history of long-term care needs
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Care Preferences</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Care Level
            </label>
            <select
              value={form.preferredCareLevel}
              onChange={(e) => handleInputChange('preferredCareLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {careLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Years of Care
            </label>
            <input
              type="number"
              value={form.yearsOfCare}
              onChange={(e) => handleInputChange('yearsOfCare', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="existing-policy"
              checked={form.hasExistingPolicy}
              onChange={(e) => handleInputChange('hasExistingPolicy', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="existing-policy" className="text-sm text-gray-700">
              I have an existing LTC policy
            </label>
          </div>

          {form.hasExistingPolicy && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Existing Daily Benefit
              </label>
              <input
                type="number"
                value={form.existingDailyBenefit}
                onChange={(e) => handleInputChange('existingDailyBenefit', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Calculate Button */}
      <div>
        <button
          onClick={handleCalculate}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Calculating...' : 'Calculate LTC Needs'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-6 pt-6 border-t">
          <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>

          {/* Risk Level */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">LTC Risk Level:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeColor(analysis.risk_level)}`}>
              {analysis.risk_level.toUpperCase()}
            </span>
            {analysis.family_history && (
              <span className="text-sm text-gray-600">(Family history present)</span>
            )}
          </div>

          {/* Self-Insurance Assessment */}
          <div className={`p-6 rounded-lg border-2 ${
            analysis.can_self_insure
              ? 'bg-green-50 border-green-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Self-Insurance Status</div>
                <div className="text-xl font-bold text-gray-900">
                  {analysis.can_self_insure ? 'Can Self-Insure' : 'Should Consider Insurance'}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Current assets: {formatCurrency(analysis.current_assets)}
                </div>
              </div>
              <div>
                {analysis.can_self_insure ? (
                  <CheckCircleIcon className="w-16 h-16 text-green-600" />
                ) : (
                  <LightBulbIcon className="w-16 h-16 text-yellow-600" />
                )}
              </div>
            </div>
          </div>

          {/* Cost Projections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Annual Cost</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(analysis.current_annual_cost)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {analysis.preferred_care_level.replace(/_/g, ' ')}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Inflated Annual Cost (in {analysis.years_until_likely_need} years)</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(analysis.inflated_annual_cost)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Assuming 5% annual inflation
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Cost ({analysis.years_of_care_assumed} years)</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(analysis.total_inflated_cost)}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Estimated Annual Premium</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(analysis.estimated_annual_premium)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on age {analysis.age}
              </div>
            </div>
          </div>

          {/* Coverage Gap */}
          {analysis.coverage_gap > 0 && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h4 className="font-semibold text-gray-900 mb-3">Coverage Gap</h4>
              <div className="text-2xl font-bold text-red-600 mb-2">
                {formatCurrency(analysis.coverage_gap)}
              </div>
              <div className="text-sm text-gray-700">
                Recommended Daily Benefit: ${analysis.recommended_daily_benefit.toFixed(2)}/day
              </div>
            </div>
          )}

          {/* Care Level Costs */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">2025 Care Level Costs (Annual)</h4>
            <div className="space-y-2">
              {Object.entries(analysis.care_level_costs).map(([level, cost]) => (
                <div key={level} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    {level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cost)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Recommendations</h4>
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {rec.strategy.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{rec.description}</div>
                      <div className="text-sm text-gray-600">{rec.reason}</div>
                      {rec.key_features && rec.key_features.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">Key Features:</div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {rec.key_features.map((feature, fidx) => (
                              <li key={fidx}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LongTermCarePlanner;
