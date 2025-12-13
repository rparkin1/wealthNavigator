import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatPercentage } from '../../utils/whatIfCalculations';
import type { SavedScenario } from './WhatIfTab';

export interface ScenarioComparisonProps {
  scenarios: SavedScenario[];
  onRemoveScenario?: (scenarioId: string) => void;
  onSelectBaseline?: (scenarioId: string) => void;
  className?: string;
}

/**
 * ScenarioComparison Component
 *
 * Side-by-side comparison of saved what-if scenarios.
 * Features:
 * - Multi-scenario comparison table
 * - Visual highlighting of best/worst values
 * - Remove scenarios
 * - Set new baseline
 * - Export comparison
 */
export function ScenarioComparison({
  scenarios,
  onRemoveScenario,
  onSelectBaseline,
  className = ''
}: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());

  if (scenarios.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Saved Scenarios
        </h3>
        <p className="text-sm text-gray-600">
          Save scenarios from the What-If Analysis tab to compare them here.
        </p>
      </div>
    );
  }

  // Find best and worst scenarios
  const bestValue = Math.max(...scenarios.map(s => s.result.projectedValue));
  const worstValue = Math.min(...scenarios.map(s => s.result.projectedValue));
  const bestProbability = Math.max(...scenarios.map(s => s.result.successProbability));
  const worstProbability = Math.min(...scenarios.map(s => s.result.successProbability));

  const toggleScenario = (scenarioId: string) => {
    const newSelected = new Set(selectedScenarios);
    if (newSelected.has(scenarioId)) {
      newSelected.delete(scenarioId);
    } else {
      newSelected.add(scenarioId);
    }
    setSelectedScenarios(newSelected);
  };

  const handleRemoveSelected = () => {
    if (onRemoveScenario) {
      selectedScenarios.forEach(id => onRemoveScenario(id));
    }
    setSelectedScenarios(new Set());
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Scenario Comparison
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Compare {scenarios.length} saved scenario{scenarios.length !== 1 ? 's' : ''}
          </p>
        </div>

        {selectedScenarios.size > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemoveSelected}
          >
            Remove ({selectedScenarios.size})
          </Button>
        )}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedScenarios.size === scenarios.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedScenarios(new Set(scenarios.map(s => s.id)));
                    } else {
                      setSelectedScenarios(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                Scenario
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                Monthly
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                Return
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                Age
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                Projected Value
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b border-gray-200">
                Success %
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario, index) => {
              const isSelected = selectedScenarios.has(scenario.id);
              const isBestValue = scenario.result.projectedValue === bestValue;
              const isWorstValue = scenario.result.projectedValue === worstValue;
              const isBestProbability = scenario.result.successProbability === bestProbability;
              const isWorstProbability = scenario.result.successProbability === worstProbability;

              return (
                <tr
                  key={scenario.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    ${isSelected ? 'bg-primary-50' : ''}
                    hover:bg-gray-100 transition-colors
                  `}
                >
                  <td className="px-4 py-3 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleScenario(scenario.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>

                  <td className="px-4 py-3 border-b border-gray-200">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {scenario.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(scenario.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right border-b border-gray-200 font-mono text-sm text-gray-900">
                    {formatCurrency(scenario.parameters.monthlyContribution)}
                  </td>

                  <td className="px-4 py-3 text-right border-b border-gray-200 font-mono text-sm text-gray-900">
                    {formatPercentage(scenario.parameters.expectedReturn)}
                  </td>

                  <td className="px-4 py-3 text-right border-b border-gray-200 font-mono text-sm text-gray-900">
                    {scenario.parameters.retirementAge}
                  </td>

                  <td className="px-4 py-3 text-right border-b border-gray-200">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono text-sm text-gray-900">
                        {formatCurrency(scenario.result.projectedValue)}
                      </span>
                      {isBestValue && scenarios.length > 1 && (
                        <Badge variant="success" size="sm">Best</Badge>
                      )}
                      {isWorstValue && scenarios.length > 1 && (
                        <Badge variant="error" size="sm">Worst</Badge>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right border-b border-gray-200">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono text-sm text-gray-900">
                        {formatPercentage(scenario.result.successProbability * 100, 1)}
                      </span>
                      {isBestProbability && scenarios.length > 1 && (
                        <Badge variant="success" size="sm">Best</Badge>
                      )}
                      {isWorstProbability && scenarios.length > 1 && (
                        <Badge variant="error" size="sm">Worst</Badge>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center border-b border-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      {onSelectBaseline && (
                        <button
                          onClick={() => onSelectBaseline(scenario.id)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          title="Set as baseline"
                        >
                          Set Baseline
                        </button>
                      )}
                      {onRemoveScenario && (
                        <button
                          onClick={() => onRemoveScenario(scenario.id)}
                          className="text-xs text-error-600 hover:text-error-700 font-medium"
                          title="Remove scenario"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Projected Value Range
          </h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Best:</span>
              <span className="font-mono font-semibold text-success-700">
                {formatCurrency(bestValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Worst:</span>
              <span className="font-mono font-semibold text-error-700">
                {formatCurrency(worstValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Difference:</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatCurrency(bestValue - worstValue)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Success Probability Range
          </h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Best:</span>
              <span className="font-mono font-semibold text-success-700">
                {formatPercentage(bestProbability * 100, 1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Worst:</span>
              <span className="font-mono font-semibold text-error-700">
                {formatPercentage(worstProbability * 100, 1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Difference:</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatPercentage((bestProbability - worstProbability) * 100, 1)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Quick Stats
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Scenarios:</span>
              <span className="font-semibold text-gray-900">
                {scenarios.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Value:</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatCurrency(
                  scenarios.reduce((sum, s) => sum + s.result.projectedValue, 0) / scenarios.length
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Success:</span>
              <span className="font-mono font-semibold text-gray-900">
                {formatPercentage(
                  (scenarios.reduce((sum, s) => sum + s.result.successProbability, 0) / scenarios.length) * 100,
                  1
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
