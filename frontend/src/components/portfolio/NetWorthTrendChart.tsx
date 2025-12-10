/**
 * Net Worth Trend Chart Component
 *
 * Implements REQ-BUD-012: System shall calculate and trend total net worth over time,
 * net worth by asset class, debt-to-asset ratio, and liquid net worth.
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';

export interface NetWorthDataPoint {
  date: string;
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidNetWorth?: number;
  movingAverage?: number;
  assetsByClass?: {
    cash: number;
    stocks: number;
    bonds: number;
    realEstate: number;
    other: number;
  };
}

export interface Milestone {
  date: string;
  label: string;
  value: number;
  type: 'goal' | 'event' | 'achievement';
}

interface NetWorthTrendChartProps {
  data: NetWorthDataPoint[];
  height?: number;
  showAssetBreakdown?: boolean;
  showLiquidNetWorth?: boolean;
  showMovingAverage?: boolean;
  showMilestones?: boolean;
  milestones?: Milestone[];
  viewMode?: 'line' | 'area' | 'stacked';
  timeframe?: '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
}

export const NetWorthTrendChart: React.FC<NetWorthTrendChartProps> = ({
  data,
  height = 400,
  showAssetBreakdown = false,
  showLiquidNetWorth = false,
  showMovingAverage = false,
  showMilestones = false,
  milestones = [],
  viewMode = 'line',
  timeframe = '1Y',
}) => {
  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeframe) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '3Y':
        cutoffDate.setFullYear(now.getFullYear() - 3);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case 'ALL':
        return data;
    }

    return data.filter(d => new Date(d.date) >= cutoffDate);
  }, [data, timeframe]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;

    const latest = filteredData[filteredData.length - 1];
    const first = filteredData[0];

    const currentNetWorth = latest.totalNetWorth;
    const change = currentNetWorth - first.totalNetWorth;
    const changePercent = (change / Math.abs(first.totalNetWorth)) * 100;

    const debtToAssetRatio = latest.totalLiabilities / latest.totalAssets;

    return {
      currentNetWorth,
      change,
      changePercent,
      debtToAssetRatio,
      totalAssets: latest.totalAssets,
      totalLiabilities: latest.totalLiabilities,
      liquidNetWorth: latest.liquidNetWorth,
    };
  }, [filteredData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(data.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-gray-600">Net Worth: </span>
              <span className="font-semibold text-green-600">{formatCurrency(data.totalNetWorth)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Assets: </span>
              <span className="font-semibold text-blue-600">{formatCurrency(data.totalAssets)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Liabilities: </span>
              <span className="font-semibold text-red-600">{formatCurrency(data.totalLiabilities)}</span>
            </p>
            {data.liquidNetWorth !== undefined && (
              <p className="text-sm">
                <span className="text-gray-600">Liquid Net Worth: </span>
                <span className="font-semibold text-teal-600">{formatCurrency(data.liquidNetWorth)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No net worth data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with Stats */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Net Worth Trend</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Net Worth */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Net Worth</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.currentNetWorth)}</p>
            <p className={`text-sm mt-1 ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.change >= 0 ? '+' : ''}{formatCurrency(stats.change)} ({stats.changePercent.toFixed(1)}%)
            </p>
          </div>

          {/* Total Assets */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalAssets)}</p>
          </div>

          {/* Total Liabilities */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Liabilities</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalLiabilities)}</p>
          </div>

          {/* Debt-to-Asset Ratio */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Debt-to-Asset Ratio</p>
            <p className="text-2xl font-bold text-purple-700">{(stats.debtToAssetRatio * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.debtToAssetRatio < 0.3 ? 'Excellent' : stats.debtToAssetRatio < 0.5 ? 'Good' : 'High'}
            </p>
          </div>
        </div>

        {/* Liquid Net Worth */}
        {showLiquidNetWorth && stats.liquidNetWorth !== undefined && (
          <div className="mt-4 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Liquid Net Worth (excluding real estate & illiquid assets)</p>
            <p className="text-xl font-bold text-teal-700">{formatCurrency(stats.liquidNetWorth)}</p>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {viewMode === 'stacked' && showAssetBreakdown ? (
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="colorStocks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="colorBonds" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="colorRealEstate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="assetsByClass.cash"
              stackId="1"
              stroke="#10b981"
              fill="url(#colorCash)"
              name="Cash"
            />
            <Area
              type="monotone"
              dataKey="assetsByClass.stocks"
              stackId="1"
              stroke="#3b82f6"
              fill="url(#colorStocks)"
              name="Stocks"
            />
            <Area
              type="monotone"
              dataKey="assetsByClass.bonds"
              stackId="1"
              stroke="#8b5cf6"
              fill="url(#colorBonds)"
              name="Bonds"
            />
            <Area
              type="monotone"
              dataKey="assetsByClass.realEstate"
              stackId="1"
              stroke="#f59e0b"
              fill="url(#colorRealEstate)"
              name="Real Estate"
            />
            <Area
              type="monotone"
              dataKey="assetsByClass.other"
              stackId="1"
              stroke="#94a3b8"
              fill="url(#colorOther)"
              name="Other"
            />
            {/* Milestones */}
            {showMilestones && milestones.map((milestone, idx) => (
              <ReferenceLine
                key={idx}
                x={milestone.date}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: milestone.label, position: 'top', fill: '#ef4444', fontSize: 12 }}
              />
            ))}
          </AreaChart>
        ) : viewMode === 'area' ? (
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="totalNetWorth"
              stroke="#10b981"
              fill="url(#colorNetWorth)"
              name="Net Worth"
            />
            {showMovingAverage && (
              <Area
                type="monotone"
                dataKey="movingAverage"
                stroke="#8b5cf6"
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Moving Average"
              />
            )}
            {/* Milestones */}
            {showMilestones && milestones.map((milestone, idx) => (
              <ReferenceLine
                key={idx}
                x={milestone.date}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: milestone.label, position: 'top', fill: '#ef4444', fontSize: 12 }}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalNetWorth"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Net Worth"
            />
            <Line
              type="monotone"
              dataKey="totalAssets"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Assets"
            />
            <Line
              type="monotone"
              dataKey="totalLiabilities"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Liabilities"
            />
            {showLiquidNetWorth && (
              <Line
                type="monotone"
                dataKey="liquidNetWorth"
                stroke="#14b8a6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Liquid Net Worth"
              />
            )}
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Moving Average"
              />
            )}
            {/* Milestones */}
            {showMilestones && milestones.map((milestone, idx) => (
              <ReferenceLine
                key={idx}
                x={milestone.date}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: milestone.label, position: 'top', fill: '#ef4444', fontSize: 12 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default NetWorthTrendChart;
