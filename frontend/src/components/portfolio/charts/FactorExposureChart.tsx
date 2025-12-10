/**
 * Factor Exposure Chart Component
 * Displays factor betas with significance indicators
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FactorExposure } from '../../../types/factorAnalysis';

interface FactorExposureChartProps {
  exposures: FactorExposure[];
}

export function FactorExposureChart({ exposures }: FactorExposureChartProps) {
  // Transform data for Recharts
  const chartData = exposures.map(exposure => ({
    name: exposure.factor_name,
    beta: exposure.beta,
    isSignificant: exposure.is_significant,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const exposure = exposures.find(e => e.factor_name === data.name);

      if (!exposure) return null;

      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold mb-2">{exposure.factor_name}</p>
          <p className="text-sm">
            <span className="text-gray-600">Beta: </span>
            <span className="font-mono">{exposure.beta.toFixed(3)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">t-stat: </span>
            <span className="font-mono">{exposure.t_statistic.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">p-value: </span>
            <span className="font-mono">{exposure.p_value.toFixed(4)}</span>
          </p>
          {exposure.is_significant && (
            <p className="text-xs text-green-600 mt-1">Statistically significant</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Color based on beta value and significance
  const getBarColor = (beta: number, isSignificant: boolean) => {
    if (!isSignificant) return '#d1d5db'; // gray-300
    if (beta > 0.5) return '#10b981'; // green-500
    if (beta < -0.5) return '#ef4444'; // red-500
    return '#3b82f6'; // blue-500
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{ value: 'Beta', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={() => (
              <div className="flex justify-center gap-4 text-xs mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500" />
                  <span>High Beta (β &gt; 0.5)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500" />
                  <span>Moderate Beta</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500" />
                  <span>Negative Beta (β &lt; -0.5)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300" />
                  <span>Not Significant</span>
                </div>
              </div>
            )}
          />
          <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
          <Bar dataKey="beta" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.beta, entry.isSignificant)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
