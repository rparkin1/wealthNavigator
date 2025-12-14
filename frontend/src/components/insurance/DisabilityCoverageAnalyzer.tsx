/**
 * Disability Coverage Analyzer
 *
 * Analyzes short-term and long-term disability insurance needs
 */

import React, { useState } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { insuranceOptimizationApi } from '../../services/insuranceOptimizationApi';
import type { DisabilityCoverageAnalysis, DisabilityForm } from '../../types/insurance';

interface DisabilityCoverageAnalyzerProps {
  onAnalysisComplete?: (analysis: DisabilityCoverageAnalysis) => void;
  existingAnalysis?: DisabilityCoverageAnalysis | null;
}

const DisabilityCoverageAnalyzer: React.FC<DisabilityCoverageAnalyzerProps> = ({
  onAnalysisComplete,
  existingAnalysis,
}) => {
  const [form, setForm] = useState<DisabilityForm>({
    annualIncome: 75000,
    age: 35,
    occupation: 'Professional',
    existingStdCoverage: 0,
    existingLtdCoverage: 0,
    emergencyFundMonths: 3,
    hasEmployerCoverage: false,
  });
  const [analysis, setAnalysis] = useState<DisabilityCoverageAnalysis | null>(existingAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof DisabilityForm, value: number | string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await insuranceOptimizationApi.analyzeDisabilityCoverage({
        annual_income: form.annualIncome,
        age: form.age,
        occupation: form.occupation,
        existing_std_coverage: form.existingStdCoverage,
        existing_ltd_coverage: form.existingLtdCoverage,
        emergency_fund_months: form.emergencyFundMonths,
        has_employer_coverage: form.hasEmployerCoverage,
      });

      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze disability coverage');
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Disability Coverage Analyzer</h2>
        <p className="text-gray-600">
          Analyze your short-term and long-term disability insurance needs (60% income replacement standard)
        </p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h3>

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
              Occupation
            </label>
            <input
              type="text"
              value={form.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              placeholder="e.g., Software Engineer, Manager, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Fund (Months)
            </label>
            <input
              type="number"
              value={form.emergencyFundMonths}
              onChange={(e) => handleInputChange('emergencyFundMonths', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Existing Coverage</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short-Term Disability Coverage
            </label>
            <input
              type="number"
              value={form.existingStdCoverage}
              onChange={(e) => handleInputChange('existingStdCoverage', parseFloat(e.target.value) || 0)}
              placeholder="Total benefit amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Long-Term Disability Monthly Benefit
            </label>
            <input
              type="number"
              value={form.existingLtdCoverage}
              onChange={(e) => handleInputChange('existingLtdCoverage', parseFloat(e.target.value) || 0)}
              placeholder="Monthly benefit amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="employer-coverage"
              checked={form.hasEmployerCoverage}
              onChange={(e) => handleInputChange('hasEmployerCoverage', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="employer-coverage" className="text-sm text-gray-700">
              I have employer-provided disability coverage
            </label>
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Disability Coverage'}
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

          {/* Occupation Risk */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Occupation Risk Level:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeColor(analysis.occupation_risk)}`}>
              {analysis.occupation_risk.toUpperCase()}
            </span>
          </div>

          {/* Recommended Monthly Benefit */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Recommended Monthly Benefit (60% replacement)</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(analysis.recommended_monthly_benefit)}/month
            </div>
          </div>

          {/* Short-Term Disability */}
          <div className={`p-6 rounded-lg border-2 ${
            analysis.short_term_disability.has_adequate_coverage
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <h4 className="font-semibold text-gray-900 mb-4">Short-Term Disability (3-6 months)</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Existing</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(analysis.short_term_disability.existing_coverage)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Recommended</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(analysis.short_term_disability.recommended_coverage)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Gap</div>
                <div className={`text-xl font-bold ${
                  analysis.short_term_disability.has_adequate_coverage ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(analysis.short_term_disability.gap)}
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${
              analysis.short_term_disability.has_adequate_coverage ? 'text-green-700' : 'text-red-700'
            }`}>
              {analysis.short_term_disability.has_adequate_coverage
                ? '✓ Adequate short-term disability coverage'
                : '✗ Insufficient short-term disability coverage'
              }
            </div>
          </div>

          {/* Long-Term Disability */}
          <div className={`p-6 rounded-lg border-2 ${
            analysis.long_term_disability.has_adequate_coverage
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <h4 className="font-semibold text-gray-900 mb-4">Long-Term Disability (Until retirement)</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Existing Monthly</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(analysis.long_term_disability.existing_monthly_coverage)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Recommended Monthly</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(analysis.long_term_disability.recommended_monthly_benefit)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Monthly Gap</div>
                <div className={`text-xl font-bold ${
                  analysis.long_term_disability.has_adequate_coverage ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(analysis.long_term_disability.monthly_gap)}
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${
              analysis.long_term_disability.has_adequate_coverage ? 'text-green-700' : 'text-red-700'
            }`}>
              {analysis.long_term_disability.has_adequate_coverage
                ? '✓ Adequate long-term disability coverage'
                : '✗ Insufficient long-term disability coverage'
              }
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Recommendations</h4>
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {rec.coverage_type.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{rec.reason}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>• Monthly Benefit: {formatCurrency(rec.recommended_monthly_benefit)}</div>
                        <div>• Benefit Period: {rec.benefit_period}</div>
                        <div>• Elimination Period: {rec.elimination_period}</div>
                        <div>• Estimated Annual Cost: {formatCurrency(rec.estimated_annual_cost)}</div>
                      </div>
                      {rec.features && rec.features.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">Key Features:</div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {rec.features.map((feature, fidx) => (
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

          {/* Key Features to Consider */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-blue-600" />
              Key Features to Consider
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              {analysis.key_features_to_consider.map((feature, idx) => (
                <li key={idx}>• {feature}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisabilityCoverageAnalyzer;
