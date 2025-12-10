/**
 * Performance Attribution Chart Component
 * Displays contribution breakdown by factor
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { FactorAttribution } from '../../../types/factorAnalysis';

interface PerformanceAttributionChartProps {
  attributions: FactorAttribution[];
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

export function PerformanceAttributionChart({
  attributions,
}: PerformanceAttributionChartProps) {
  // Transform data for Recharts
  const chartData = attributions.map(attr => ({
    name: attr.factor_name,
    value: Math.abs(attr.contribution_pct),
    contribution: attr.contribution,
    beta: attr.beta,
    factorReturn: attr.factor_return,
    isNegative: attr.contribution < 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold mb-2">{data.name}</p>
          <p className="text-sm">
            <span className="text-gray-600">Contribution: </span>
            <span className={`font-mono ${data.payload.isNegative ? 'text-red-600' : 'text-green-600'}`}>
              {(data.payload.contribution * 100).toFixed(2)}%
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">% of Total: </span>
            <span className="font-mono">{data.value.toFixed(1)}%</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Beta: </span>
            <span className="font-mono">{data.payload.beta.toFixed(3)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Factor Return: </span>
            <span className="font-mono">{(data.payload.factorReturn * 100).toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderLabel = (entry: any) => {
    return `${entry.name} (${entry.value.toFixed(1)}%)`;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                opacity={entry.isNegative ? 0.6 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const contribution = entry.payload.contribution;
              const sign = contribution >= 0 ? '+' : '';
              return `${value} (${sign}${(contribution * 100).toFixed(2)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-500 text-center mt-2">
        * Faded slices indicate negative contributions
      </div>
    </div>
  );
}
