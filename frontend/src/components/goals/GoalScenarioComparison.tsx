/**
 * Goal Scenario Comparison Component
 *
 * Implements REQ-GOAL-010: Side-by-side comparison of different goal scenarios
 * with what-if analysis and interactive adjustments.
 */

import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface GoalScenario {
  id: string;
  name: string;
  description?: string;
  monthly_contribution: number;
  target_amount: number;
  target_date: string;
  expected_return: number;
  projected_value: number;
  success_probability: number;
  years_to_goal: number;
  total_contributions: number;
  investment_growth: number;
  funding_level: number;
  risk_level: 'conservative' | 'moderate' | 'aggressive';
  asset_allocation: {
    [assetClass: string]: number;
  };
}

export interface ScenarioProjection {
  year: number;
  date: string;
  [scenarioId: string]: number | string;
}

interface GoalScenarioComparisonProps {
  goalTitle: string;
  scenarios: GoalScenario[];
  projections: ScenarioProjection[];
  onSelectScenario?: (scenarioId: string) => void;
  onModifyScenario?: (scenarioId: string, updates: Partial<GoalScenario>) => void;
  onCreateScenario?: () => void;
  onDeleteScenario?: (scenarioId: string) => void;
}

export const GoalScenarioComparison: React.FC<GoalScenarioComparisonProps> = ({
  goalTitle,
  scenarios,
  projections,
  onSelectScenario,
  onModifyScenario,
  onCreateScenario,
  onDeleteScenario,
}) => {
  const [selectedView, setSelectedView] = useState<'comparison' | 'projections' | 'allocations'>('comparison');
  const [compareMetric, setCompareMetric] = useState<'success' | 'value' | 'contributions'>('success');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getScenarioColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return colors[index % colors.length];
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'conservative':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'aggressive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 0.9) return 'text-green-600';
    if (probability >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBestScenario = () => {
    if (scenarios.length === 0) return null;

    // Find scenario with best balance of success probability and contributions
    return scenarios.reduce((best, current) => {
      const bestScore = best.success_probability * 100 - (best.monthly_contribution / 100);
      const currentScore = current.success_probability * 100 - (current.monthly_contribution / 100);
      return currentScore > bestScore ? current : best;
    });
  };

  const bestScenario = getBestScenario();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Goal Scenarios: {goalTitle}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Compare different approaches to reach your goal
            </p>
          </div>
          <button
            onClick={onCreateScenario}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + New Scenario
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('comparison')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'comparison'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Comparison
          </button>
          <button
            onClick={() => setSelectedView('projections')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'projections'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Projections
          </button>
          <button
            onClick={() => setSelectedView('allocations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'allocations'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Asset Allocation
          </button>
        </div>
      </div>

      {/* Best Scenario Highlight */}
      {bestScenario && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="font-semibold text-green-800">Recommended Scenario</p>
              <p className="text-sm text-green-700">
                <strong>{bestScenario.name}</strong> offers the best balance of success probability (
                {formatPercentage(bestScenario.success_probability)}) and monthly investment (
                {formatCurrency(bestScenario.monthly_contribution)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {selectedView === 'comparison' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className={`bg-white rounded-lg shadow-lg p-6 border-2 transition-all hover:shadow-xl ${
                bestScenario?.id === scenario.id ? 'border-green-400' : 'border-gray-200'
              }`}
            >
              {/* Scenario Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{scenario.name}</h3>
                  {scenario.description && (
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskBadgeColor(scenario.risk_level)}`}>
                  {scenario.risk_level}
                </span>
              </div>

              {/* Success Probability */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Success Probability</span>
                  <span className={`text-xl font-bold ${getSuccessColor(scenario.success_probability)}`}>
                    {formatPercentage(scenario.success_probability)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      scenario.success_probability >= 0.9 ? 'bg-green-500' :
                      scenario.success_probability >= 0.7 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${scenario.success_probability * 100}%` }}
                  />
                </div>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Contribution</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(scenario.monthly_contribution)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projected Value</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatCurrency(scenario.projected_value)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Contributions</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(scenario.total_contributions)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Growth</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(scenario.investment_growth)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expected Return</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPercentage(scenario.expected_return)}
                  </span>
                </div>
              </div>

              {/* Funding Level */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Funding Level</span>
                  <span className="font-semibold">{scenario.funding_level.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      scenario.funding_level >= 100 ? 'bg-green-500' :
                      scenario.funding_level >= 75 ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(scenario.funding_level, 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onSelectScenario?.(scenario.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Select
                </button>
                <button
                  onClick={() => onDeleteScenario?.(scenario.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>

              {/* Best Scenario Badge */}
              {bestScenario?.id === scenario.id && (
                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    🏆 Recommended
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projections View */}
      {selectedView === 'projections' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Value Projections</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              {scenarios.map((scenario, index) => (
                <Area
                  key={scenario.id}
                  type="monotone"
                  dataKey={scenario.id}
                  name={scenario.name}
                  stroke={getScenarioColor(index)}
                  fill={getScenarioColor(index)}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>

          {/* Metric Comparison Chart */}
          <div className="mt-8">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCompareMetric('success')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  compareMetric === 'success' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Success Rate
              </button>
              <button
                onClick={() => setCompareMetric('value')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  compareMetric === 'value' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Final Value
              </button>
              <button
                onClick={() => setCompareMetric('contributions')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  compareMetric === 'contributions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Monthly Cost
              </button>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={scenarios.map((s, i) => ({
                  name: s.name,
                  value:
                    compareMetric === 'success' ? s.success_probability * 100 :
                    compareMetric === 'value' ? s.projected_value :
                    s.monthly_contribution,
                  color: getScenarioColor(i),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) =>
                    compareMetric === 'success' ? `${value}%` : formatCurrency(value)
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    compareMetric === 'success' ? `${value.toFixed(1)}%` : formatCurrency(value)
                  }
                />
                <Bar dataKey="value" fill="#3B82F6">
                  {scenarios.map((_, index) => (
                    <Bar key={index} fill={getScenarioColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Asset Allocation View */}
      {selectedView === 'allocations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{scenario.name}</h3>

              {/* Asset Allocation Breakdown */}
              <div className="space-y-3">
                {Object.entries(scenario.asset_allocation)
                  .filter(([_, percentage]) => percentage > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([asset, percentage]) => (
                    <div key={asset}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 capitalize">{asset.replace(/_/g, ' ')}</span>
                        <span className="font-semibold">{formatPercentage(percentage)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${percentage * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              {/* Risk Level */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskBadgeColor(scenario.risk_level)}`}>
                    {scenario.risk_level}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalScenarioComparison;
