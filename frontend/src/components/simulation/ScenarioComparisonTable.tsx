/**
 * Scenario Comparison Table
 *
 * Detailed side-by-side comparison table for goal scenarios.
 * Implements REQ-GOAL-010: Advanced scenario comparison with delta calculations.
 */

import React from 'react';
import type { GoalScenario } from '../../types/goalScenarios';

interface ScenarioComparisonTableProps {
  scenarios: GoalScenario[];
  baselineScenarioId?: string;
  onExportCSV?: () => void;
}

export const ScenarioComparisonTable: React.FC<ScenarioComparisonTableProps> = ({
  scenarios,
  baselineScenarioId,
  onExportCSV,
}) => {
  if (scenarios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">No scenarios to compare</p>
      </div>
    );
  }

  const baselineScenario = baselineScenarioId
    ? scenarios.find(s => s.id === baselineScenarioId) || scenarios[0]
    : scenarios[0];

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

  const calculateDelta = (value: number, baseValue: number, format: 'currency' | 'percentage') => {
    const delta = value - baseValue;
    const percentChange = baseValue !== 0 ? (delta / baseValue) * 100 : 0;

    if (format === 'currency') {
      return {
        absolute: formatCurrency(delta),
        percent: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
        isPositive: delta >= 0,
      };
    } else {
      return {
        absolute: `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`,
        percent: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
        isPositive: delta >= 0,
      };
    }
  };

  const metrics = [
    {
      label: 'Success Probability',
      key: 'success_probability' as keyof GoalScenario,
      format: 'percentage' as const,
      higherIsBetter: true,
    },
    {
      label: 'Projected Value',
      key: 'projected_value' as keyof GoalScenario,
      format: 'currency' as const,
      higherIsBetter: true,
    },
    {
      label: 'Monthly Contribution',
      key: 'monthly_contribution' as keyof GoalScenario,
      format: 'currency' as const,
      higherIsBetter: false,
    },
    {
      label: 'Total Contributions',
      key: 'total_contributions' as keyof GoalScenario,
      format: 'currency' as const,
      higherIsBetter: false,
    },
    {
      label: 'Investment Growth',
      key: 'investment_growth' as keyof GoalScenario,
      format: 'currency' as const,
      higherIsBetter: true,
    },
    {
      label: 'Funding Level',
      key: 'funding_level' as keyof GoalScenario,
      format: 'percentage' as const,
      higherIsBetter: true,
      customFormat: (value: number) => `${value.toFixed(0)}%`,
    },
    {
      label: 'Expected Return',
      key: 'expected_return' as keyof GoalScenario,
      format: 'percentage' as const,
      higherIsBetter: true,
    },
    {
      label: 'Years to Goal',
      key: 'years_to_goal' as keyof GoalScenario,
      format: 'number' as const,
      higherIsBetter: false,
      customFormat: (value: number) => `${value.toFixed(1)} years`,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Detailed Scenario Comparison</h3>
            <p className="text-sm text-blue-100 mt-1">
              Comparing {scenarios.length} scenarios • Baseline: {baselineScenario.name}
            </p>
          </div>
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-medium">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Metric</th>
              {scenarios.map(scenario => (
                <th key={scenario.id} className="px-6 py-4 text-right">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-gray-900">{scenario.name}</div>
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                          scenario.risk_level === 'conservative'
                            ? 'bg-blue-100 text-blue-800'
                            : scenario.risk_level === 'moderate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {scenario.risk_level}
                      </span>
                    </div>
                    {scenario.id === baselineScenario.id && (
                      <div className="text-xs text-blue-600 font-medium">Baseline</div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {metrics.map((metric, index) => (
              <tr key={metric.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{metric.label}</td>
                {scenarios.map(scenario => {
                  const value = scenario[metric.key] as number;
                  const baseValue = baselineScenario[metric.key] as number;
                  const isBaseline = scenario.id === baselineScenario.id;

                  const formattedValue = metric.customFormat
                    ? metric.customFormat(value)
                    : metric.format === 'currency'
                    ? formatCurrency(value)
                    : metric.format === 'percentage'
                    ? formatPercentage(value)
                    : value.toFixed(2);

                  let delta = null;
                  if (!isBaseline && metric.format !== 'number') {
                    delta = calculateDelta(value, baseValue, metric.format);
                  }

                  return (
                    <td key={scenario.id} className="px-6 py-4 text-right">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">{formattedValue}</div>
                        {delta && (
                          <div className="flex items-center justify-end gap-1">
                            <span
                              className={`text-xs font-medium ${
                                metric.higherIsBetter
                                  ? delta.isPositive
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                  : delta.isPositive
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {delta.absolute}
                            </span>
                            <span className="text-xs text-gray-500">({delta.percent})</span>
                          </div>
                        )}
                        {isBaseline && <div className="text-xs text-gray-400">—</div>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Asset Allocation Section */}
            <tr className="bg-blue-50">
              <td colSpan={scenarios.length + 1} className="px-6 py-3">
                <h4 className="text-sm font-semibold text-blue-900">Asset Allocation</h4>
              </td>
            </tr>
            {Object.keys(scenarios[0].asset_allocation).map((assetClass, index) => {
              const allZero = scenarios.every(s => s.asset_allocation[assetClass] === 0);
              if (allZero) return null;

              return (
                <tr key={assetClass} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-3 text-sm text-gray-700 capitalize">
                    {assetClass.replace(/_/g, ' ')}
                  </td>
                  {scenarios.map(scenario => (
                    <td key={scenario.id} className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${scenario.asset_allocation[assetClass] * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                          {formatPercentage(scenario.asset_allocation[assetClass])}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Legend:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">Green</span>
            <span>= Better than baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-medium">Red</span>
            <span>= Worse than baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">—</span>
            <span>= Baseline (no comparison)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioComparisonTable;
