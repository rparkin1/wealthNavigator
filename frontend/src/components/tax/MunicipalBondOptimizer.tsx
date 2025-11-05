/**
 * Municipal Bond Optimizer Component
 * REQ-TAX-014: State-specific municipal bond optimization
 */

import React, { useState, useEffect } from 'react';
import { useTaxManagement } from '@/hooks/useTaxManagement';
import type { MuniOptimizationParams } from '@/hooks/useTaxManagement';
import { formatCurrency, formatPercentage, getStateName } from '@/services/taxManagementApi';

// ==================== Types ====================

interface MunicipalBondOptimizerProps {
  state?: string;
  federalTaxRate?: number;
  annualIncome?: number;
  autoOptimize?: boolean;
}

// ==================== Component ====================

export const MunicipalBondOptimizer: React.FC<MunicipalBondOptimizerProps> = ({
  state = 'CA',
  federalTaxRate = 0.24,
  annualIncome = 150000,
  autoOptimize = false,
}) => {
  const {
    muniRecommendation,
    loadingMuni,
    muniError,
    optimizeMunicipalBondsAction,
    clearMuniRecommendation,
    stateTaxRates,
    fetchStateTaxRates,
  } = useTaxManagement();

  const [params, setParams] = useState<MuniOptimizationParams>({
    state,
    federal_tax_rate: federalTaxRate,
    annual_income: annualIncome,
    in_state_yield: 0.035,
    out_of_state_yield: 0.038,
    taxable_yield: 0.045,
  });

  // Fetch state tax rates on mount
  useEffect(() => {
    fetchStateTaxRates();
  }, []);

  // Auto-optimize on mount if enabled
  useEffect(() => {
    if (autoOptimize) {
      handleOptimize();
    }
  }, [autoOptimize]);

  const handleOptimize = async () => {
    await optimizeMunicipalBondsAction(params);
  };

  const handleClear = () => {
    clearMuniRecommendation();
  };

  const handleParamChange = (field: keyof MuniOptimizationParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Municipal Bond Optimizer</h2>
        <p className="text-gray-600 mt-1">
          State-specific analysis for optimal municipal bond allocation
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white border rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold">Optimization Parameters</h3>

        {/* State Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your State
          </label>
          <select
            value={params.state}
            onChange={(e) => handleParamChange('state', e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {stateTaxRates && Object.keys(stateTaxRates.all_rates).map(stateCode => (
              <option key={stateCode} value={stateCode}>
                {getStateName(stateCode)} ({stateCode})
              </option>
            ))}
          </select>
          {stateTaxRates && (
            <p className="text-sm text-gray-500 mt-1">
              State Tax Rate: {stateTaxRates.all_rates[params.state]?.formatted || 'Loading...'}
            </p>
          )}
        </div>

        {/* Federal Tax Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Federal Marginal Tax Rate
          </label>
          <select
            value={params.federal_tax_rate}
            onChange={(e) => handleParamChange('federal_tax_rate', parseFloat(e.target.value))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value={0.10}>10%</option>
            <option value={0.12}>12%</option>
            <option value={0.22}>22%</option>
            <option value={0.24}>24%</option>
            <option value={0.32}>32%</option>
            <option value={0.35}>35%</option>
            <option value={0.37}>37%</option>
          </select>
        </div>

        {/* Annual Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Income
          </label>
          <input
            type="number"
            value={params.annual_income}
            onChange={(e) => handleParamChange('annual_income', parseFloat(e.target.value))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="150000"
          />
        </div>

        {/* Yield Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              In-State Muni Yield (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={params.in_state_yield * 100}
              onChange={(e) => handleParamChange('in_state_yield', parseFloat(e.target.value) / 100)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="3.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Out-of-State Muni Yield (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={params.out_of_state_yield * 100}
              onChange={(e) => handleParamChange('out_of_state_yield', parseFloat(e.target.value) / 100)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="3.8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxable Bond Yield (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={params.taxable_yield * 100}
              onChange={(e) => handleParamChange('taxable_yield', parseFloat(e.target.value) / 100)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="4.5"
            />
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={handleOptimize}
          disabled={loadingMuni}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loadingMuni ? 'Optimizing...' : 'Optimize Allocation'}
        </button>
      </div>

      {/* Error Display */}
      {muniError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{muniError}</p>
        </div>
      )}

      {/* Loading State */}
      {loadingMuni && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Analyzing municipal bond options...</p>
          </div>
        </div>
      )}

      {/* Recommendation Display */}
      {muniRecommendation && !loadingMuni && (
        <div className="space-y-6">
          {/* Recommendation Header */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">
              Recommended: {muniRecommendation.recommended_allocation.toUpperCase().replace('_', '-')}
            </h3>
            <p className="text-gray-700">{muniRecommendation.reasoning}</p>
            <div className="mt-4 text-2xl font-bold text-green-700">
              Estimated Annual Tax Savings: {formatCurrency(muniRecommendation.estimated_tax_savings)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Based on $100,000 investment
            </p>
          </div>

          {/* Tax Rates Summary */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Tax Rate Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Federal Tax Rate</div>
                <div className="text-xl font-bold">
                  {formatPercentage(muniRecommendation.federal_tax_rate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">State Tax Rate ({params.state})</div>
                <div className="text-xl font-bold">
                  {formatPercentage(muniRecommendation.state_tax_rate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Combined Tax Rate</div>
                <div className="text-xl font-bold text-red-600">
                  {formatPercentage(muniRecommendation.combined_tax_rate)}
                </div>
              </div>
            </div>
          </div>

          {/* Yield Comparison */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Yield Comparison</h3>

            {/* In-State Municipal */}
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">In-State Municipal Bonds</div>
                  <div className="text-sm text-gray-600">
                    Exempt from federal and {params.state} state tax
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Nominal Yield</div>
                  <div className="font-bold">{formatPercentage(muniRecommendation.in_state_yield)}</div>
                  <div className="text-sm text-green-700">
                    Tax-Equivalent: {formatPercentage(muniRecommendation.in_state_tax_equivalent_yield)}
                  </div>
                </div>
              </div>
            </div>

            {/* Out-of-State Municipal */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Out-of-State Municipal Bonds</div>
                  <div className="text-sm text-gray-600">
                    Exempt from federal tax only
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Nominal Yield</div>
                  <div className="font-bold">{formatPercentage(muniRecommendation.out_of_state_yield)}</div>
                  <div className="text-sm text-blue-700">
                    Tax-Equivalent: {formatPercentage(muniRecommendation.out_of_state_tax_equivalent_yield)}
                  </div>
                </div>
              </div>
            </div>

            {/* Taxable Bonds */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Taxable Bonds</div>
                  <div className="text-sm text-gray-600">
                    Fully taxable at federal and state level
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Nominal Yield</div>
                  <div className="font-bold">{formatPercentage(muniRecommendation.taxable_yield)}</div>
                  <div className="text-sm text-gray-700">
                    After-Tax: {formatPercentage(muniRecommendation.taxable_yield * (1 - muniRecommendation.combined_tax_rate))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Considerations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Additional Considerations
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>
                Municipal bonds are generally more beneficial for high-income earners
              </li>
              <li>
                In-state bonds avoid both federal and state taxes in most states
              </li>
              <li>
                Consider credit quality and diversification when selecting bonds
              </li>
              <li>
                AMT (Alternative Minimum Tax) may apply to some municipal bonds
              </li>
              <li>
                Tax-equivalent yields assume bonds held in taxable accounts
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!muniRecommendation && !loadingMuni && !muniError && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            Enter your parameters and click "Optimize Allocation" to get personalized recommendations
          </p>
          <p className="text-sm text-gray-500">
            The optimizer will analyze yields with state-specific tax considerations
          </p>
        </div>
      )}
    </div>
  );
};
