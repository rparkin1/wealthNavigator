/**
 * Enhanced Net Worth Dashboard
 *
 * Comprehensive net worth trending with interactive features:
 * - Time period selection
 * - Asset class breakdown
 * - Growth metrics
 * - Projections
 * - Export functionality
 */

import React, { useState, useMemo } from 'react';
import { NetWorthTrendChart } from './NetWorthTrendChart';
import { NetWorthGrowthMetrics } from './NetWorthGrowthMetrics';
import { NetWorthProjection } from './NetWorthProjection';
import { NetWorthExport } from './NetWorthExport';
import { useNetWorthData } from '../../hooks/useNetWorthData';
import type { NetWorthDataPoint } from '../../types/netWorth';

interface NetWorthDashboardProps {
  userId: string;
}

type TimeFrame = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
type ViewMode = 'line' | 'area' | 'stacked';

export const NetWorthDashboard: React.FC<NetWorthDashboardProps> = ({ userId }) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1Y');
  const [viewMode, setViewMode] = useState<ViewMode>('line');
  const [showProjection, setShowProjection] = useState(false);
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);

  // Fetch net worth data from API
  const { data, loading, error, refetch } = useNetWorthData(userId);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (!data) return [];

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

  // Calculate moving average
  const dataWithMA = useMemo(() => {
    if (!showMovingAverage || filteredData.length < 7) return filteredData;

    const windowSize = 7; // 7-day moving average
    return filteredData.map((point, idx) => {
      if (idx < windowSize - 1) return point;

      const window = filteredData.slice(idx - windowSize + 1, idx + 1);
      const avgNetWorth = window.reduce((sum, p) => sum + p.totalNetWorth, 0) / windowSize;

      return {
        ...point,
        movingAverage: avgNetWorth,
      };
    });
  }, [filteredData, showMovingAverage]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
          <p className="text-red-600">{error.detail || error.error}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Net Worth Data Available</h3>
        <p className="text-gray-500 mb-4">
          Connect your accounts or manually add holdings to start tracking your net worth.
        </p>
      </div>
    );
  }

  const timeframeOptions: { value: TimeFrame; label: string }[] = [
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
    { value: '3Y', label: '3 Years' },
    { value: '5Y', label: '5 Years' },
    { value: 'ALL', label: 'All Time' },
  ];

  const viewModeOptions: { value: ViewMode; label: string; icon: string }[] = [
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'area', label: 'Area Chart', icon: '📊' },
    { value: 'stacked', label: 'Stacked', icon: '📉' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Net Worth Tracking</h1>
            <p className="text-green-100">Comprehensive view of your financial growth over time</p>
          </div>
          <NetWorthExport data={filteredData} timeframe={timeframe} />
        </div>

        {/* Time Period Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-green-100 flex items-center mr-2">
            Time Period:
          </span>
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeframe(option.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                timeframe === option.value
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* View Mode Selector */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-green-100 flex items-center mr-2">
            View Mode:
          </span>
          {viewModeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setViewMode(option.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === option.value
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              <span className="mr-2">{option.icon}</span>
              {option.label}
            </button>
          ))}

          {/* Toggle Options */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                showMovingAverage
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              📊 Moving Average
            </button>
            <button
              onClick={() => setShowMilestones(!showMilestones)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                showMilestones
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              🎯 Milestones
            </button>
            <button
              onClick={() => setShowProjection(!showProjection)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                showProjection
                  ? 'bg-white text-green-700 shadow-md'
                  : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              🔮 Projection
            </button>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <NetWorthGrowthMetrics data={filteredData} timeframe={timeframe} />

      {/* Main Chart */}
      <NetWorthTrendChart
        data={dataWithMA}
        timeframe={timeframe}
        height={500}
        showAssetBreakdown={viewMode === 'stacked'}
        showLiquidNetWorth={true}
        showMovingAverage={showMovingAverage}
        showMilestones={showMilestones}
        viewMode={viewMode}
      />

      {/* Projection Panel */}
      {showProjection && (
        <NetWorthProjection
          currentData={filteredData}
          userId={userId}
        />
      )}
    </div>
  );
};

export default NetWorthDashboard;
