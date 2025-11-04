/**
 * Security Market Line Chart Component
 * Displays SML with portfolio position and efficient portfolios
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis,
  ReferenceLine,
} from 'recharts';
import type { SecurityMarketLineResponse } from '../../../types/factorAnalysis';

interface SecurityMarketLineChartProps {
  data: SecurityMarketLineResponse;
  actualReturn?: number;
}

export function SecurityMarketLineChart({
  data,
  actualReturn,
}: SecurityMarketLineChartProps) {
  // Format SML line data
  const smlData = data.points.map(p => ({
    beta: p.beta,
    expectedReturn: p.expected_return * 100,
  }));

  // Format portfolio point
  const portfolioPoint = {
    beta: data.portfolio_point.beta,
    expectedReturn: data.portfolio_point.expected_return * 100,
    actualReturn: actualReturn ? actualReturn * 100 : undefined,
  };

  // Format efficient portfolios
  const efficientPortfolios = data.efficient_portfolios.map(p => ({
    beta: p.beta,
    expectedReturn: p.expected_return * 100,
    name: `β=${p.beta.toFixed(1)}`,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm">
            <span className="text-gray-600">Beta: </span>
            <span className="font-mono">{data.beta.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Expected Return: </span>
            <span className="font-mono">{data.expectedReturn.toFixed(2)}%</span>
          </p>
          {data.actualReturn && (
            <p className="text-sm">
              <span className="text-gray-600">Actual Return: </span>
              <span className="font-mono">{data.actualReturn.toFixed(2)}%</span>
            </p>
          )}
          {data.name && (
            <p className="text-xs text-gray-500 mt-1">{data.name}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate alpha visually
  const showAlpha = actualReturn !== undefined;
  const alpha = showAlpha
    ? (actualReturn! - data.portfolio_point.expected_return) * 100
    : 0;

  return (
    <div className="w-full">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            data={smlData}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="beta"
              label={{ value: 'Beta (β)', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
              domain={[0, 'dataMax']}
            />
            <YAxis
              label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
            />

            {/* Security Market Line */}
            <Line
              type="monotone"
              dataKey="expectedReturn"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Security Market Line (SML)"
            />

            {/* Efficient Portfolios */}
            <Scatter
              data={efficientPortfolios}
              fill="#10b981"
              name="Efficient Portfolios"
            />

            {/* Portfolio Position */}
            <Scatter
              data={[
                {
                  beta: portfolioPoint.beta,
                  expectedReturn: portfolioPoint.expectedReturn,
                  actualReturn: portfolioPoint.actualReturn,
                },
              ]}
              fill="#ef4444"
              shape="star"
              name="Your Portfolio"
            />

            {/* Actual return line if available */}
            {showAlpha && portfolioPoint.actualReturn && (
              <ReferenceLine
                segment={[
                  { x: portfolioPoint.beta, y: portfolioPoint.expectedReturn },
                  { x: portfolioPoint.beta, y: portfolioPoint.actualReturn },
                ]}
                stroke={alpha > 0 ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `α = ${alpha.toFixed(2)}%`,
                  position: 'right',
                  fill: alpha > 0 ? '#10b981' : '#ef4444',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend explanation */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
        <h4 className="font-semibold mb-2">Chart Interpretation:</h4>
        <ul className="space-y-1 text-gray-700">
          <li>
            <span className="font-semibold text-blue-600">SML (blue line):</span> Expected
            return for any given level of systematic risk (beta)
          </li>
          <li>
            <span className="font-semibold text-green-600">Green dots:</span> Efficient
            portfolios with different risk levels
          </li>
          <li>
            <span className="font-semibold text-red-600">Red star:</span> Your portfolio's
            position
          </li>
          {showAlpha && (
            <li>
              <span className={`font-semibold ${alpha > 0 ? 'text-green-600' : 'text-red-600'}`}>
                Dashed line:
              </span>{' '}
              Alpha (α = {alpha.toFixed(2)}%) - excess return{' '}
              {alpha > 0 ? 'above' : 'below'} expected
            </li>
          )}
        </ul>
        <p className="mt-2 text-xs text-gray-600">
          Portfolios above the SML are undervalued (positive alpha), while portfolios below
          are overvalued (negative alpha).
        </p>
      </div>
    </div>
  );
}
