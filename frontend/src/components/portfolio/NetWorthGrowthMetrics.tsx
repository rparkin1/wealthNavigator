/**
 * Net Worth Growth Metrics Component
 *
 * Displays period-over-period growth, annualized returns, and other key metrics
 */

import React, { useMemo } from 'react';
import type { NetWorthDataPoint } from './NetWorthTrendChart';

interface NetWorthGrowthMetricsProps {
  data: NetWorthDataPoint[];
  timeframe: string;
}

export const NetWorthGrowthMetrics: React.FC<NetWorthGrowthMetricsProps> = ({
  data,
  timeframe,
}) => {
  const metrics = useMemo(() => {
    if (data.length < 2) return null;

    const latest = data[data.length - 1];
    const first = data[0];
    const previous = data[data.length - 2];

    // Calculate various metrics
    const currentNetWorth = latest.totalNetWorth;
    const totalChange = currentNetWorth - first.totalNetWorth;
    const totalChangePercent = (totalChange / Math.abs(first.totalNetWorth)) * 100;

    // Period-over-period (last data point vs previous)
    const popChange = currentNetWorth - previous.totalNetWorth;
    const popChangePercent = (popChange / Math.abs(previous.totalNetWorth)) * 100;

    // Calculate annualized return
    const daysDiff = Math.max(
      1,
      (new Date(latest.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const yearsFraction = daysDiff / 365.25;
    const annualizedReturn = yearsFraction > 0
      ? (Math.pow(currentNetWorth / first.totalNetWorth, 1 / yearsFraction) - 1) * 100
      : 0;

    // Calculate volatility (standard deviation of daily returns)
    const returns = data.slice(1).map((point, idx) => {
      const prevValue = data[idx].totalNetWorth;
      return (point.totalNetWorth - prevValue) / prevValue;
    });
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility

    // Calculate Sharpe ratio (assuming 4% risk-free rate)
    const riskFreeRate = 4;
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = data[0].totalNetWorth;

    for (const point of data) {
      if (point.totalNetWorth > peak) {
        peak = point.totalNetWorth;
      }
      const drawdown = ((point.totalNetWorth - peak) / peak) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Asset allocation change
    const assetGrowth = latest.totalAssets - first.totalAssets;
    const liabilityGrowth = latest.totalLiabilities - first.totalLiabilities;

    return {
      currentNetWorth,
      totalChange,
      totalChangePercent,
      popChange,
      popChangePercent,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      assetGrowth,
      liabilityGrowth,
      dataPoints: data.length,
      periodDays: Math.round(daysDiff),
    };
  }, [data]);

  if (!metrics) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-700';
    if (value < 0) return 'text-red-700';
    return 'text-gray-700';
  };

  const getChangeBgColor = (value: number) => {
    if (value > 0) return 'bg-green-50 border-green-200';
    if (value < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Growth Metrics</h2>
        <span className="text-sm text-gray-600">
          {metrics.dataPoints} data points over {metrics.periodDays} days
        </span>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Change */}
        <div className={`p-4 rounded-lg border-2 ${getChangeBgColor(metrics.totalChange)}`}>
          <p className="text-sm font-medium text-gray-600 mb-1">
            Total Change ({timeframe})
          </p>
          <p className={`text-2xl font-bold ${getChangeColor(metrics.totalChange)}`}>
            {formatCurrency(metrics.totalChange)}
          </p>
          <p className={`text-sm mt-1 ${getChangeColor(metrics.totalChangePercent)}`}>
            {formatPercent(metrics.totalChangePercent)}
          </p>
        </div>

        {/* Period-over-Period */}
        <div className={`p-4 rounded-lg border-2 ${getChangeBgColor(metrics.popChange)}`}>
          <p className="text-sm font-medium text-gray-600 mb-1">Recent Change</p>
          <p className={`text-2xl font-bold ${getChangeColor(metrics.popChange)}`}>
            {formatCurrency(metrics.popChange)}
          </p>
          <p className={`text-sm mt-1 ${getChangeColor(metrics.popChangePercent)}`}>
            {formatPercent(metrics.popChangePercent)}
          </p>
        </div>

        {/* Annualized Return */}
        <div className={`p-4 rounded-lg border-2 ${getChangeBgColor(metrics.annualizedReturn)}`}>
          <p className="text-sm font-medium text-gray-600 mb-1">Annualized Return</p>
          <p className={`text-2xl font-bold ${getChangeColor(metrics.annualizedReturn)}`}>
            {formatPercent(metrics.annualizedReturn)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {metrics.annualizedReturn > 7 ? 'Excellent' : metrics.annualizedReturn > 4 ? 'Good' : 'Below Target'}
          </p>
        </div>

        {/* Volatility */}
        <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Volatility</p>
          <p className="text-2xl font-bold text-blue-700">
            {metrics.volatility.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {metrics.volatility < 10 ? 'Low' : metrics.volatility < 20 ? 'Moderate' : 'High'}
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sharpe Ratio */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Sharpe Ratio</p>
          <p className="text-xl font-bold text-purple-700">
            {metrics.sharpeRatio.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Risk-adjusted return</p>
        </div>

        {/* Max Drawdown */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Max Drawdown</p>
          <p className="text-xl font-bold text-orange-700">
            {metrics.maxDrawdown.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Largest peak-to-trough decline</p>
        </div>

        {/* Asset vs Liability Growth */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Asset vs Liability Growth</p>
          <div className="flex items-center justify-between mt-1">
            <div>
              <p className="text-xs text-gray-600">Assets</p>
              <p className={`text-lg font-bold ${getChangeColor(metrics.assetGrowth)}`}>
                {formatCurrency(metrics.assetGrowth)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Liabilities</p>
              <p className={`text-lg font-bold ${getChangeColor(-metrics.liabilityGrowth)}`}>
                {formatCurrency(metrics.liabilityGrowth)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Metric Interpretations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
          <div>
            <span className="font-medium">Annualized Return:</span> Historical average yearly growth rate
          </div>
          <div>
            <span className="font-medium">Volatility:</span> Measures fluctuation; lower is more stable
          </div>
          <div>
            <span className="font-medium">Sharpe Ratio:</span> Return per unit of risk; higher is better (&gt;1 is good)
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthGrowthMetrics;
