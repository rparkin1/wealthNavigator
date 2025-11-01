/**
 * Comprehensive Analysis Component
 *
 * Combined view of all portfolio analyses
 */

import React, { useState } from 'react';
import { useComprehensiveAnalysis } from '../../hooks/usePortfolio';
import { AnalysisType } from '../../types/portfolio';
import type { ComprehensiveAnalysisRequest } from '../../types/portfolio';

interface ComprehensiveAnalysisProps {
  userId: string;
  portfolioId?: string;
}

export const ComprehensiveAnalysis: React.FC<ComprehensiveAnalysisProps> = ({
  userId,
  portfolioId,
}) => {
  const { data, loading, error, analyze } = useComprehensiveAnalysis();
  const [taxRate, setTaxRate] = useState(0.24);
  const [driftThreshold, setDriftThreshold] = useState(5.0);
  const [selectedAnalyses, setSelectedAnalyses] = useState<Array<typeof AnalysisType[keyof typeof AnalysisType]>>([
    AnalysisType.TAX_LOSS_HARVESTING,
    AnalysisType.REBALANCING,
    AnalysisType.PERFORMANCE,
  ]);

  const handleAnalyze = async () => {
    const request: ComprehensiveAnalysisRequest = {
      user_id: userId,
      portfolio_id: portfolioId,
      analysis_types: selectedAnalyses,
      tax_rate: taxRate,
      drift_threshold: driftThreshold,
    };

    await analyze(request);
  };

  const toggleAnalysis = (type: typeof AnalysisType[keyof typeof AnalysisType]) => {
    if (selectedAnalyses.includes(type)) {
      setSelectedAnalyses(selectedAnalyses.filter((t) => t !== type));
    } else {
      setSelectedAnalyses([...selectedAnalyses, type]);
    }
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
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Running Comprehensive Analysis
            </h3>
            <p className="text-gray-600">
              Analyzing {selectedAnalyses.length} portfolio dimensions...
            </p>
          </div>
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
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Comprehensive Portfolio Analysis</h1>
        <p className="text-blue-100">
          Complete financial health check across tax optimization, rebalancing, and performance
        </p>
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Settings</h2>

        {/* Analysis Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Analyses to Run
          </label>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(AnalysisType).map((type) => (
              <button
                key={type}
                onClick={() => toggleAnalysis(type)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedAnalyses.includes(type)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAnalyses.includes(type)}
                    onChange={() => {}}
                    className="h-4 w-4 text-blue-600 rounded mr-3"
                  />
                  <span className="font-medium text-gray-900 capitalize">
                    {type.replace(/_/g, ' ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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
              Drift Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={driftThreshold}
              onChange={(e) => {
                const v = e.currentTarget.valueAsNumber;
                setDriftThreshold(Number.isFinite(v) ? v : 5.0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Run Analysis Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || selectedAnalyses.length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Analyzing...' : 'Run Comprehensive Analysis'}
        </button>
      </div>

      {/* Results */}
      {data && (
        <>
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Summary</h2>
                <p className="text-sm text-gray-600">
                  Analysis ID: {data.analysis_id} • {new Date(data.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{data.summary}</p>

            {/* Key Recommendations */}
            {data.recommendations.length > 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Key Recommendations
                </h3>
                <ul className="space-y-2">
                  {data.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-blue-900">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tax-Loss Harvesting Results */}
          {data.tax_loss_harvesting && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tax-Loss Harvesting
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium mb-1">
                    Harvestable Losses
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(data.tax_loss_harvesting.total_harvestable_losses)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Tax Benefit</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(data.tax_loss_harvesting.total_tax_benefit)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium mb-1">Opportunities</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {data.tax_loss_harvesting.opportunities_count}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                {data.tax_loss_harvesting.strategy_notes}
              </p>
            </div>
          )}

          {/* Rebalancing Results */}
          {data.rebalancing && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Portfolio Rebalancing
              </h2>
              <div
                className={`p-4 rounded-lg mb-4 ${
                  data.rebalancing.needs_rebalancing ? 'bg-yellow-50' : 'bg-green-50'
                }`}
              >
                <p
                  className={`font-semibold ${
                    data.rebalancing.needs_rebalancing ? 'text-yellow-900' : 'text-green-900'
                  }`}
                >
                  {data.rebalancing.needs_rebalancing
                    ? '⚠️ Rebalancing Recommended'
                    : '✓ Portfolio Within Tolerance'}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    data.rebalancing.needs_rebalancing ? 'text-yellow-700' : 'text-green-700'
                  }`}
                >
                  {data.rebalancing.execution_notes}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Max Drift</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercent(data.rebalancing.max_drift)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Recommended Trades</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.rebalancing.trades_count}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-1">Estimated Tax Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.rebalancing.estimated_tax_cost)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Results */}
          {data.performance && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Portfolio Performance
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(data.performance.total_value)}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-4 ${
                    data.performance.ytd_return > 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">YTD Return</p>
                  <p
                    className={`text-2xl font-bold ${
                      data.performance.ytd_return > 0 ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {formatPercent(data.performance.ytd_return)}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-4 ${
                    data.performance.inception_return > 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">Since Inception</p>
                  <p
                    className={`text-2xl font-bold ${
                      data.performance.inception_return > 0 ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {formatPercent(data.performance.inception_return)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComprehensiveAnalysis;
