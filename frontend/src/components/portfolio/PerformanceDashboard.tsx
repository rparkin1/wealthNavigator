/**
 * Performance Dashboard
 *
 * Component for displaying historical portfolio performance
 */

import React, { useState, useEffect } from 'react';
import { usePerformance } from '../../hooks/usePortfolio';
import type { PerformanceRequest } from '../../types/portfolio';

interface PerformanceDashboardProps {
  userId: string;
  portfolioId?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  userId,
  portfolioId,
}) => {
  const { data, loading, error, analyze } = usePerformance();
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [benchmark, setBenchmark] = useState('SPY');

  useEffect(() => {
    handleAnalyze();
  }, [userId, portfolioId]);

  const handleAnalyze = async () => {
    const request: PerformanceRequest = {
      user_id: userId,
      portfolio_id: portfolioId,
      start_date: startDate,
      end_date: endDate,
      benchmark: benchmark,
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
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getReturnColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getReturnBgColor = (value: number) => {
    if (value > 0) return 'bg-green-50';
    if (value < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Analyzing portfolio performance...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Performance</h2>
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
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benchmark
            </label>
            <select
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SPY">S&P 500 (SPY)</option>
              <option value="QQQ">NASDAQ 100 (QQQ)</option>
              <option value="AGG">Bond Aggregate (AGG)</option>
              <option value="VT">Total World (VT)</option>
            </select>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 px-6 py-6 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-blue-900">
                {formatCurrency(data.total_value)}
              </p>
            </div>
            <div className={`${getReturnBgColor(data.ytd_return)} rounded-lg p-4`}>
              <p className="text-sm font-medium mb-1">YTD Return</p>
              <p className={`text-3xl font-bold ${getReturnColor(data.ytd_return)}`}>
                {formatPercent(data.ytd_return)}
              </p>
            </div>
            <div className={`${getReturnBgColor(data.inception_return)} rounded-lg p-4`}>
              <p className="text-sm font-medium mb-1">Since Inception</p>
              <p className={`text-3xl font-bold ${getReturnColor(data.inception_return)}`}>
                {formatPercent(data.inception_return)}
              </p>
            </div>
          </div>

          {/* Performance Metrics by Period */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Period</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volatility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sharpe Ratio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Drawdown
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.metrics.map((metric, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {metric.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${getReturnColor(metric.return_pct)}`}>
                          {formatPercent(metric.return_pct)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatPercent(metric.volatility)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {metric.sharpe.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {formatPercent(metric.max_drawdown)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Metrics</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(data.risk_metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Attribution Analysis */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Attribution by Asset Class
            </h3>
            {data.attribution.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No attribution data available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.attribution.map((attr, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{attr.asset}</h4>
                      <span
                        className={`text-lg font-bold ${getReturnColor(attr.contribution)}`}
                      >
                        {formatPercent(attr.contribution)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Weight</p>
                        <p className="font-medium text-gray-900">
                          {formatPercent(attr.weight * 100)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Asset Return</p>
                        <p className={`font-medium ${getReturnColor(attr.return_pct)}`}>
                          {formatPercent(attr.return_pct)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contribution</p>
                        <p className={`font-medium ${getReturnColor(attr.contribution)}`}>
                          {formatPercent(attr.contribution)}
                        </p>
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          attr.contribution > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(attr.contribution) * 5, 100)}%`,
                        }}
                      ></div>
                    </div>
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

export default PerformanceDashboard;
