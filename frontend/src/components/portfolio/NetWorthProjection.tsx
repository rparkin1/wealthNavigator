/**
 * Net Worth Projection Component
 *
 * Projects future net worth based on savings rate, returns, and contributions
 */

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { NetWorthDataPoint } from './NetWorthTrendChart';

interface NetWorthProjectionProps {
  currentData: NetWorthDataPoint[];
  userId: string;
}

export const NetWorthProjection: React.FC<NetWorthProjectionProps> = ({
  currentData,
}) => {
  const [projectionYears, setProjectionYears] = useState(10);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [monthlySavings, setMonthlySavings] = useState(1000);
  const [inflationRate, setInflationRate] = useState(3);

  const projectionData = useMemo(() => {
    if (currentData.length === 0) return [];

    const latest = currentData[currentData.length - 1];
    const startValue = latest.totalNetWorth;
    const startDate = new Date(latest.date);

    const monthlyRate = annualReturn / 100 / 12;
    const monthlyInflation = inflationRate / 100 / 12;
    const totalMonths = projectionYears * 12;

    const projections = [];

    // Add current data points
    for (const point of currentData) {
      projections.push({
        date: point.date,
        actual: point.totalNetWorth,
        projected: null,
        realProjected: null,
        isHistorical: true,
      });
    }

    // Calculate future projections
    let currentValue = startValue;
    let realValue = startValue;

    for (let month = 1; month <= totalMonths; month++) {
      // Nominal projection with contributions
      currentValue = currentValue * (1 + monthlyRate) + monthlySavings;

      // Real projection (inflation-adjusted)
      realValue = realValue * (1 + monthlyRate - monthlyInflation) + monthlySavings * (1 - monthlyInflation);

      // Create date for this projection
      const projectionDate = new Date(startDate);
      projectionDate.setMonth(projectionDate.getMonth() + month);

      // Add quarterly data points for projections
      if (month % 3 === 0) {
        projections.push({
          date: projectionDate.toISOString().split('T')[0],
          actual: null,
          projected: currentValue,
          realProjected: realValue,
          isHistorical: false,
        });
      }
    }

    return projections;
  }, [currentData, projectionYears, annualReturn, monthlySavings, inflationRate]);

  const projectionStats = useMemo(() => {
    if (projectionData.length === 0) return null;

    const lastHistorical = projectionData.find(p => p.isHistorical && p.actual);
    const lastProjection = projectionData[projectionData.length - 1];

    if (!lastHistorical || !lastProjection) return null;

    const nominalGain = (lastProjection.projected || 0) - (lastHistorical.actual || 0);
    const realGain = (lastProjection.realProjected || 0) - (lastHistorical.actual || 0);
    const totalContributions = monthlySavings * 12 * projectionYears;
    const investmentGains = nominalGain - totalContributions;

    return {
      current: lastHistorical.actual || 0,
      projected: lastProjection.projected || 0,
      realProjected: lastProjection.realProjected || 0,
      nominalGain,
      realGain,
      totalContributions,
      investmentGains,
      returnOnContributions: totalContributions > 0 ? (investmentGains / totalContributions) * 100 : 0,
    };
  }, [projectionData, monthlySavings, projectionYears]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(data.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <div className="space-y-1">
            {data.actual && (
              <p className="text-sm">
                <span className="text-gray-600">Actual: </span>
                <span className="font-semibold text-blue-600">{formatCurrency(data.actual)}</span>
              </p>
            )}
            {data.projected && (
              <p className="text-sm">
                <span className="text-gray-600">Projected: </span>
                <span className="font-semibold text-green-600">{formatCurrency(data.projected)}</span>
              </p>
            )}
            {data.realProjected && (
              <p className="text-sm">
                <span className="text-gray-600">Real (inflation-adj): </span>
                <span className="font-semibold text-purple-600">{formatCurrency(data.realProjected)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Net Worth Projection</h2>
        <p className="text-gray-600">
          Forecast your future net worth based on expected returns and contributions
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Projection Period (Years)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={projectionYears}
            onChange={(e) => setProjectionYears(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Return (%)
          </label>
          <input
            type="number"
            min="-10"
            max="20"
            step="0.5"
            value={annualReturn}
            onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 7)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">S&P 500 avg: ~10%</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Savings ($)
          </label>
          <input
            type="number"
            min="0"
            step="100"
            value={monthlySavings}
            onChange={(e) => setMonthlySavings(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inflation Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={inflationRate}
            onChange={(e) => setInflationRate(parseFloat(e.target.value) || 3)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Historical avg: ~3%</p>
        </div>
      </div>

      {/* Projection Stats */}
      {projectionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Current Net Worth</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(projectionStats.current)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Projected Value</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(projectionStats.projected)}</p>
            <p className="text-xs text-gray-600 mt-1">In {projectionYears} years</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Real Value</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(projectionStats.realProjected)}</p>
            <p className="text-xs text-gray-600 mt-1">Inflation-adjusted</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-600 mb-1">Investment Gains</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(projectionStats.investmentGains)}</p>
            <p className="text-xs text-gray-600 mt-1">
              {projectionStats.returnOnContributions.toFixed(1)}% on contributions
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={projectionData}>
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

          {/* Vertical line separating historical and projected */}
          <ReferenceLine
            x={currentData[currentData.length - 1]?.date}
            stroke="#94a3b8"
            strokeDasharray="5 5"
            label={{ value: 'Today', position: 'top' }}
          />

          {/* Actual (historical) line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 3 }}
            name="Historical"
            connectNulls={false}
          />

          {/* Projected (nominal) line */}
          <Line
            type="monotone"
            dataKey="projected"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Projected"
            connectNulls={false}
          />

          {/* Real (inflation-adjusted) line */}
          <Line
            type="monotone"
            dataKey="realProjected"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            name="Real (Inflation-Adj)"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Breakdown */}
      {projectionStats && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 Projection Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Total Contributions</p>
              <p className="font-semibold text-gray-900">{formatCurrency(projectionStats.totalContributions)}</p>
              <p className="text-xs text-gray-500">{monthlySavings > 0 ? `${formatCurrency(monthlySavings)}/month × ${projectionYears * 12} months` : 'No contributions'}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Investment Growth</p>
              <p className="font-semibold text-green-700">{formatCurrency(projectionStats.investmentGains)}</p>
              <p className="text-xs text-gray-500">From {annualReturn}% annual returns</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Inflation Impact</p>
              <p className="font-semibold text-orange-700">
                {formatCurrency(projectionStats.projected - projectionStats.realProjected)}
              </p>
              <p className="text-xs text-gray-500">At {inflationRate}% per year</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetWorthProjection;
