/**
 * Rebalancing Dashboard
 *
 * Component for displaying portfolio rebalancing recommendations
 */

import React, { useState, useEffect } from 'react';
import { useRebalancing } from '../../hooks/usePortfolio';
import type { RebalanceRequest } from '../../types/portfolio';

interface RebalancingDashboardProps {
  userId: string;
  portfolioId?: string;
}

export const RebalancingDashboard: React.FC<RebalancingDashboardProps> = ({
  userId,
  portfolioId,
}) => {
  const { data, loading, error, analyze } = useRebalancing();
  const [driftThreshold, setDriftThreshold] = useState(5.0);
  const [taxRate, setTaxRate] = useState(0.24);
  const [newContributions, setNewContributions] = useState(0);

  useEffect(() => {
    handleAnalyze();
  }, [userId, portfolioId]);

  const handleAnalyze = async () => {
    const request: RebalanceRequest = {
      user_id: userId,
      portfolio_id: portfolioId,
      drift_threshold: driftThreshold,
      tax_rate: taxRate,
      new_contributions: newContributions,
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
    return `${value.toFixed(2)}%`;
  };

  const getDriftColor = (drift: number) => {
    const absDrift = Math.abs(drift);
    if (absDrift < 3) return 'text-green-600';
    if (absDrift < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDriftBgColor = (drift: number) => {
    const absDrift = Math.abs(drift);
    if (absDrift < 3) return 'bg-green-50';
    if (absDrift < 5) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Analyzing portfolio rebalancing...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Rebalancing</h2>
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
        <div className="grid grid-cols-3 gap-4">
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Contributions ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={newContributions}
              onChange={(e) => {
                const v = e.currentTarget.valueAsNumber;
                setNewContributions(Number.isFinite(v) ? v : 0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Status Banner */}
          <div
            className={`px-6 py-4 border-b border-gray-200 ${
              data.needs_rebalancing ? 'bg-yellow-50' : 'bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    data.needs_rebalancing ? 'text-yellow-900' : 'text-green-900'
                  }`}
                >
                  {data.needs_rebalancing
                    ? 'Rebalancing Recommended'
                    : 'Portfolio Within Tolerance'}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    data.needs_rebalancing ? 'text-yellow-700' : 'text-green-700'
                  }`}
                >
                  {data.execution_notes}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Max Drift</p>
                <p
                  className={`text-2xl font-bold ${
                    data.needs_rebalancing ? 'text-yellow-900' : 'text-green-900'
                  }`}
                >
                  {formatPercent(data.max_drift)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 px-6 py-6 border-b border-gray-200">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium mb-1">Recommended Trades</p>
              <p className="text-3xl font-bold text-purple-900">{data.trades_count}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium mb-1">Estimated Tax Cost</p>
              <p className="text-3xl font-bold text-red-900">
                {formatCurrency(data.estimated_tax_cost)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">Max Drift</p>
              <p className="text-3xl font-bold text-blue-900">{formatPercent(data.max_drift)}</p>
            </div>
          </div>

          {/* Drift Analysis */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Class Drift</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.drift_analysis).map(([assetClass, drift]) => (
                <div
                  key={assetClass}
                  className={`p-4 rounded-lg ${getDriftBgColor(drift)}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{assetClass}</p>
                    <p className={`text-lg font-bold ${getDriftColor(drift)}`}>
                      {drift > 0 ? '+' : ''}
                      {formatPercent(drift)}
                    </p>
                  </div>
                  <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        drift > 0 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(Math.abs(drift) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Trades */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Trades</h3>
            {data.trades.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No trades needed at this time.</p>
                <p className="text-sm mt-2">Your portfolio is within the drift threshold.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.trades.map((trade, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              trade.action === 'buy'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {trade.action.toUpperCase()}
                          </span>
                          <span className="font-semibold text-gray-900">{trade.asset}</span>
                          <span className="text-sm text-gray-600">in {trade.account}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{trade.reasoning}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Amount: <span className="font-medium">{formatCurrency(trade.amount)}</span>
                          </span>
                          <span className="text-gray-600">
                            Tax Impact:{' '}
                            <span className="font-medium">{formatCurrency(trade.tax_impact)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                          {trade.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alternative Strategy */}
          {data.alternative_strategy && (
            <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Alternative Strategy</h4>
              <p className="text-sm text-blue-800">{data.alternative_strategy}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RebalancingDashboard;
