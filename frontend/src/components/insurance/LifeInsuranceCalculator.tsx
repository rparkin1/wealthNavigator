/**
 * Life Insurance Calculator
 *
 * Interactive calculator for determining life insurance needs using DIME method
 */

import React, { useState } from 'react';
import { insuranceOptimizationApi } from '../../services/insuranceOptimizationApi';
import type { LifeInsuranceAnalysis, LifeInsuranceForm } from '../../types/insurance';

interface LifeInsuranceCalculatorProps {
  onAnalysisComplete?: (analysis: LifeInsuranceAnalysis) => void;
  existingAnalysis?: LifeInsuranceAnalysis | null;
}

const LifeInsuranceCalculator: React.FC<LifeInsuranceCalculatorProps> = ({
  onAnalysisComplete,
  existingAnalysis,
}) => {
  const [form, setForm] = useState<LifeInsuranceForm>({
    annualIncome: 75000,
    age: 35,
    dependents: 2,
    outstandingDebt: 250000,
    existingCoverage: 100000,
    yearsToSupport: 20,
    collegeFundingNeeded: 50000,
    finalExpenses: 15000,
    currentSavings: 50000,
  });
  const [analysis, setAnalysis] = useState<LifeInsuranceAnalysis | null>(existingAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof LifeInsuranceForm, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await insuranceOptimizationApi.calculateLifeInsuranceNeeds({
        annual_income: form.annualIncome,
        age: form.age,
        dependents: form.dependents,
        outstanding_debt: form.outstandingDebt,
        existing_coverage: form.existingCoverage,
        years_to_support: form.yearsToSupport,
        college_funding_needed: form.collegeFundingNeeded,
        final_expenses: form.finalExpenses,
        current_savings: form.currentSavings,
      });

      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate life insurance needs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Life Insurance Needs Calculator</h2>
        <p className="text-gray-600">
          Calculate your life insurance needs using the DIME method (Debt, Income, Mortgage, Education)
        </p>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
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
              Number of Dependents
            </label>
            <input
              type="number"
              value={form.dependents}
              onChange={(e) => handleInputChange('dependents', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years to Support Dependents
            </label>
            <input
              type="number"
              value={form.yearsToSupport}
              onChange={(e) => handleInputChange('yearsToSupport', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Financial Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outstanding Debt (Mortgage, Loans, etc.)
            </label>
            <input
              type="number"
              value={form.outstandingDebt}
              onChange={(e) => handleInputChange('outstandingDebt', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Existing Life Insurance Coverage
            </label>
            <input
              type="number"
              value={form.existingCoverage}
              onChange={(e) => handleInputChange('existingCoverage', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College Funding per Child
            </label>
            <input
              type="number"
              value={form.collegeFundingNeeded}
              onChange={(e) => handleInputChange('collegeFundingNeeded', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Savings & Investments
            </label>
            <input
              type="number"
              value={form.currentSavings}
              onChange={(e) => handleInputChange('currentSavings', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <div>
        <button
          onClick={handleCalculate}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Calculating...' : 'Calculate Life Insurance Needs'}
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

          {/* Summary Card */}
          <div className={`p-6 rounded-lg border-2 ${
            analysis.has_adequate_coverage
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Net Insurance Need</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analysis.net_insurance_need)}
                </div>
                <div className={`mt-2 text-sm font-medium ${
                  analysis.has_adequate_coverage ? 'text-green-700' : 'text-red-700'
                }`}>
                  {analysis.has_adequate_coverage
                    ? '✓ You have adequate coverage'
                    : `✗ Coverage gap of ${formatCurrency(analysis.coverage_gap)}`
                  }
                </div>
              </div>
              <div className="text-6xl">
                {analysis.has_adequate_coverage ? '✅' : '⚠️'}
              </div>
            </div>
          </div>

          {/* Needs Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Income Replacement</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(analysis.income_replacement_need)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {analysis.years_of_support} years × {analysis.income_multiplier_used}x multiplier
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Debt Coverage</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(analysis.debt_coverage_need)}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Education Funding</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(analysis.education_funding_need)}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Final Expenses</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(analysis.final_expenses_need)}
              </div>
            </div>
          </div>

          {/* Cost Estimates */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">Estimated Monthly Premiums</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Term Life Insurance</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${analysis.estimated_term_premium_monthly.toFixed(2)}/month
                </div>
                <div className="text-xs text-gray-500 mt-1">Most cost-effective option</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Whole Life Insurance</div>
                <div className="text-2xl font-bold text-gray-600">
                  ${analysis.estimated_whole_premium_monthly.toFixed(2)}/month
                </div>
                <div className="text-xs text-gray-500 mt-1">With cash value component</div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              Recommended Policy Type
            </h4>
            <div className="space-y-2">
              <div className="font-medium text-gray-900">
                Primary: {analysis.recommendation.primary.replace(/_/g, ' ').toUpperCase()}
              </div>
              <div className="text-sm text-gray-700">
                Coverage Amount: {formatCurrency(analysis.recommendation.recommended_coverage)}
              </div>
              <div className="text-sm text-gray-600">
                {analysis.recommendation.reason}
              </div>
              {analysis.recommendation.alternatives.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Alternatives:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analysis.recommendation.alternatives.map((alt, idx) => (
                      <li key={idx}>
                        • {alt.type.replace(/_/g, ' ')} - {alt.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LifeInsuranceCalculator;
