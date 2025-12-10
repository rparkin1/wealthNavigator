/**
 * Tax-Loss Harvesting Panel
 *
 * Component for displaying tax-loss harvesting opportunities
 */

import React, { useState, useEffect } from 'react';
import { useTaxLossHarvesting } from '../../hooks/usePortfolio';
import type { TaxLossHarvestRequest } from '../../types/portfolio';

interface TaxLossHarvestingPanelProps {
  userId: string;
  portfolioId?: string;
}

export const TaxLossHarvestingPanel: React.FC<TaxLossHarvestingPanelProps> = ({
  userId,
  portfolioId,
}) => {
  const { data, loading, error, analyze } = useTaxLossHarvesting();
  const [taxRate, setTaxRate] = useState(0.24);
  const [minLossThreshold, setMinLossThreshold] = useState(100);

  useEffect(() => {
    // Auto-analyze on mount
    handleAnalyze();
  }, [userId, portfolioId]);

  const handleAnalyze = async () => {
    const request: TaxLossHarvestRequest = {
      user_id: userId,
      portfolio_id: portfolioId,
      tax_rate: taxRate,
      min_loss_threshold: minLossThreshold,
    };

    await analyze(request);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Analyzing tax-loss harvesting opportunities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error.detail || error.error}</p>
          <button
            onClick={handleAnalyze}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Tax-Loss Harvesting</h2>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={taxRate}
              onChange={(e) => {
                const v = e.currentTarget.valueAsNumber;
                setTaxRate(Number.isFinite(v) ? v : 0.24);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter as decimal (e.g., 0.24 for 24%)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Loss Threshold ($)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={minLossThreshold}
              onChange={(e) => {
                const v = e.currentTarget.valueAsNumber;
                setMinLossThreshold(Number.isFinite(v) ? v : 100);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 px-6 py-6 border-b border-gray-200">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium mb-1">Total Harvestable Losses</p>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(data.total_harvestable_losses)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">Estimated Tax Benefit</p>
              <p className="text-3xl font-bold text-blue-900">
                {formatCurrency(data.total_tax_benefit)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium mb-1">Opportunities</p>
              <p className="text-3xl font-bold text-purple-900">{data.opportunities_count}</p>
            </div>
          </div>

          {/* Strategy Notes */}
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <p className="text-sm text-blue-900">{data.strategy_notes}</p>
          </div>

          {/* Opportunities List */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Harvesting Opportunities</h3>
            {data.opportunities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tax-loss harvesting opportunities found at this time.</p>
                <p className="text-sm mt-2">Try lowering the minimum loss threshold.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.opportunities.map((opportunity, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    {/* Opportunity Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {opportunity.security}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">
                            Loss: {formatCurrency(opportunity.loss)}
                          </span>
                          <span className="text-sm text-gray-600">
                            Tax Benefit: {formatCurrency(opportunity.tax_benefit)}
                          </span>
                          <span className="text-sm text-gray-600">
                            Priority: {formatPercent(opportunity.priority)}
                          </span>
                        </div>
                      </div>
                      {opportunity.wash_sale_risk && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Wash Sale Risk
                        </span>
                      )}
                    </div>

                    {/* Recommendation */}
                    <div className="mb-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{opportunity.recommendation}</p>
                    </div>

                    {/* Replacement Securities */}
                    {opportunity.replacements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Suggested Replacements:
                        </p>
                        <div className="space-y-2">
                          {opportunity.replacements.map((replacement, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{replacement.ticker}</p>
                                <p className="text-sm text-gray-600">{replacement.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-green-600">
                                  {formatPercent(replacement.similarity_score * 100)} Similar
                                </p>
                                {replacement.expense_ratio && (
                                  <p className="text-xs text-gray-500">
                                    ER: {formatPercent(replacement.expense_ratio * 100)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TaxLossHarvestingPanel;
