/**
 * IncomeProjection Component
 *
 * Visualizes comprehensive retirement income projections over time.
 * Shows multiple income sources, expenses, and net cash flow using Recharts.
 */

import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { RetirementIncomeProjection } from '../../services/retirementApi';

interface IncomeProjectionProps {
  projections: RetirementIncomeProjection[];
  title?: string;
  showControls?: boolean;
}

type ChartView = 'stacked' | 'individual' | 'net';

export function IncomeProjection({
  projections,
  title = 'Retirement Income Projection',
  showControls = true,
}: IncomeProjectionProps) {
  const [chartView, setChartView] = useState<ChartView>('stacked');
  const [showExpenses, setShowExpenses] = useState(true);

  if (!projections || projections.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-gray-400 text-4xl mb-3">📊</div>
        <p className="text-gray-600">No projection data available</p>
      </div>
    );
  }

  // Calculate summary statistics
  const totalSocialSecurity = projections.reduce((sum, p) => sum + p.social_security, 0);
  const totalPension = projections.reduce((sum, p) => sum + p.pension, 0);
  const totalPortfolio = projections.reduce((sum, p) => sum + p.portfolio_withdrawal, 0);
  const totalIncome = projections.reduce((sum, p) => sum + p.total_income, 0);
  const totalExpenses = projections.reduce((sum, p) => sum + p.total_expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const avgAnnualIncome = totalIncome / projections.length;
  const avgAnnualExpenses = totalExpenses / projections.length;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">
            Age {data.age} (Year {data.year})
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-blue-600">Social Security:</span>
              <span className="font-medium">{formatCurrency(data.social_security)}</span>
            </div>
            {data.pension > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-purple-600">Pension:</span>
                <span className="font-medium">{formatCurrency(data.pension)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-green-600">Portfolio:</span>
              <span className="font-medium">{formatCurrency(data.portfolio_withdrawal)}</span>
            </div>
            {data.other_income > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-yellow-600">Other Income:</span>
                <span className="font-medium">{formatCurrency(data.other_income)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between gap-4">
              <span className="font-semibold text-gray-900">Total Income:</span>
              <span className="font-bold">{formatCurrency(data.total_income)}</span>
            </div>
            {showExpenses && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-red-600">Expenses:</span>
                  <span className="font-medium">{formatCurrency(data.total_expenses)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between gap-4">
                  <span
                    className={`font-semibold ${
                      data.net_cash_flow >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    Net Cash Flow:
                  </span>
                  <span
                    className={`font-bold ${
                      data.net_cash_flow >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {formatCurrency(data.net_cash_flow)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Controls */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive income projection from age {projections[0].age} to{' '}
            {projections[projections.length - 1].age}
          </p>
        </div>

        {showControls && (
          <div className="flex gap-2">
            <select
              value={chartView}
              onChange={(e) => setChartView(e.target.value as ChartView)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="stacked">Stacked Income</option>
              <option value="individual">Individual Sources</option>
              <option value="net">Net Cash Flow</option>
            </select>
            <button
              onClick={() => setShowExpenses(!showExpenses)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showExpenses
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showExpenses ? 'Hide' : 'Show'} Expenses
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
            Avg Annual Income
          </div>
          <div className="text-2xl font-bold text-blue-900">{formatCurrency(avgAnnualIncome)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">
            Avg Annual Expenses
          </div>
          <div className="text-2xl font-bold text-red-900">{formatCurrency(avgAnnualExpenses)}</div>
        </div>

        <div
          className={`bg-gradient-to-br rounded-lg p-4 border ${
            netCashFlow >= 0
              ? 'from-green-50 to-green-100 border-green-200'
              : 'from-orange-50 to-orange-100 border-orange-200'
          }`}
        >
          <div
            className={`text-xs font-medium uppercase tracking-wide mb-1 ${
              netCashFlow >= 0 ? 'text-green-700' : 'text-orange-700'
            }`}
          >
            Net Cash Flow
          </div>
          <div
            className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-900' : 'text-orange-900'}`}
          >
            {formatCurrency(netCashFlow)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">
            Planning Years
          </div>
          <div className="text-2xl font-bold text-purple-900">{projections.length}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ResponsiveContainer width="100%" height={500}>
          {chartView === 'stacked' ? (
            <AreaChart data={projections} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="age"
                label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                stroke="#6b7280"
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Annual Amount ($)', angle: -90, position: 'insideLeft' }}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showExpenses && (
                <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
              )}
              <Area
                type="monotone"
                dataKey="social_security"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                name="Social Security"
              />
              <Area
                type="monotone"
                dataKey="pension"
                stackId="1"
                stroke="#a855f7"
                fill="#a855f7"
                name="Pension"
              />
              <Area
                type="monotone"
                dataKey="portfolio_withdrawal"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                name="Portfolio Withdrawal"
              />
              <Area
                type="monotone"
                dataKey="other_income"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                name="Other Income"
              />
              {showExpenses && (
                <Line
                  type="monotone"
                  dataKey="total_expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Total Expenses"
                />
              )}
            </AreaChart>
          ) : chartView === 'individual' ? (
            <LineChart data={projections} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="age"
                label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                stroke="#6b7280"
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Annual Amount ($)', angle: -90, position: 'insideLeft' }}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="social_security"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Social Security"
              />
              <Line
                type="monotone"
                dataKey="pension"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                name="Pension"
              />
              <Line
                type="monotone"
                dataKey="portfolio_withdrawal"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Portfolio Withdrawal"
              />
              <Line
                type="monotone"
                dataKey="other_income"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Other Income"
              />
              {showExpenses && (
                <Line
                  type="monotone"
                  dataKey="total_expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Total Expenses"
                />
              )}
            </LineChart>
          ) : (
            <BarChart data={projections} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="age"
                label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                stroke="#6b7280"
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Net Cash Flow ($)', angle: -90, position: 'insideLeft' }}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#374151" strokeWidth={2} />
              <Bar
                dataKey="net_cash_flow"
                fill="#10b981"
                name="Net Cash Flow"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Income Source Breakdown */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <h4 className="font-semibold text-gray-900 text-sm">Social Security</h4>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalSocialSecurity)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {((totalSocialSecurity / totalIncome) * 100).toFixed(1)}% of total income
          </div>
        </div>

        {totalPension > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <h4 className="font-semibold text-gray-900 text-sm">Pension</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPension)}</div>
            <div className="text-xs text-gray-600 mt-1">
              {((totalPension / totalIncome) * 100).toFixed(1)}% of total income
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <h4 className="font-semibold text-gray-900 text-sm">Portfolio</h4>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPortfolio)}</div>
          <div className="text-xs text-gray-600 mt-1">
            {((totalPortfolio / totalIncome) * 100).toFixed(1)}% of total income
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <h4 className="font-semibold text-gray-900 text-sm">Total Income</h4>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</div>
          <div className="text-xs text-gray-600 mt-1">Over {projections.length} years</div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Key Insights</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            • Your average annual income in retirement is projected to be{' '}
            <strong>{formatCurrency(avgAnnualIncome)}</strong>
          </li>
          <li>
            • Social Security comprises{' '}
            <strong>{((totalSocialSecurity / totalIncome) * 100).toFixed(1)}%</strong> of your total
            retirement income
          </li>
          {netCashFlow >= 0 ? (
            <li className="text-green-700">
              • Your income exceeds expenses by{' '}
              <strong>{formatCurrency(netCashFlow)}</strong> over the planning period
            </li>
          ) : (
            <li className="text-orange-700">
              • You have a projected shortfall of{' '}
              <strong>{formatCurrency(Math.abs(netCashFlow))}</strong> over the planning period
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
