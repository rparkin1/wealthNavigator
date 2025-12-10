/**
 * ScenarioComparison Component
 *
 * Side-by-side comparison of multiple historical scenarios.
 * Allows users to compare how different historical events would impact their portfolio.
 */

import { useState, useEffect } from 'react';
import type { ScenarioListItem, ScenarioComparison as ComparisonResult } from '../../types/historicalScenarios';
import * as historicalScenariosApi from '../../services/historicalScenariosApi';
import { formatReturn, formatCurrency, isScenarioResult } from '../../types/historicalScenarios';

export interface ScenarioComparisonProps {
  goalId: string;
  initialValue: number;
  monthlyContribution?: number;
  onClose?: () => void;
}

export function ScenarioComparison({
  goalId,
  initialValue,
  monthlyContribution = 0,
  onClose,
}: ScenarioComparisonProps) {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await historicalScenariosApi.getAllScenarios({
        activeOnly: true,
      });
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleScenario = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 scenarios to compare');
      return;
    }

    setComparing(true);
    setError(null);

    try {
      const comparison = await historicalScenariosApi.compareScenarios({
        goal_id: goalId,
        scenario_ids: selectedIds,
        initial_portfolio_value: initialValue,
        monthly_contribution: monthlyContribution,
      });

      setResult(comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare scenarios');
    } finally {
      setComparing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedIds([]);
  };

  if (result) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Scenario Comparison Results</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comparing {result.scenarios.length} historical scenarios
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-700">Best Scenario</div>
            <div className="text-lg font-bold text-green-900 mt-1">
              {result.comparison.best_scenario || 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-700">Worst Scenario</div>
            <div className="text-lg font-bold text-red-900 mt-1">
              {result.comparison.worst_scenario || 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700">Average Return</div>
            <div className="text-lg font-bold text-blue-900 mt-1">
              {formatReturn(result.comparison.avg_return)}
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          {result.scenarios.map((scenario, index) => {
            if (!isScenarioResult(scenario)) {
              return (
                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800">Error: {scenario.error}</div>
                </div>
              );
            }

            const isWorst = scenario.total_return === Math.min(...result.scenarios.filter(isScenarioResult).map(s => s.total_return));
            const isBest = scenario.total_return === Math.max(...result.scenarios.filter(isScenarioResult).map(s => s.total_return));

            return (
              <div
                key={scenario.scenario_id}
                className={`p-6 border-2 rounded-lg ${
                  isBest
                    ? 'border-green-500 bg-green-50'
                    : isWorst
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {scenario.scenario_name}
                    </h3>
                    {isBest && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                        ✓ Best
                      </span>
                    )}
                    {isWorst && (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                        ⚠ Worst
                      </span>
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${historicalScenariosApi.getReturnColorClass(scenario.total_return)}`}>
                    {formatReturn(scenario.total_return)}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Initial Value</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(scenario.initial_value)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Final Value</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(scenario.final_value)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Max Drawdown</div>
                    <div className="text-sm font-medium text-red-600">
                      {(scenario.max_drawdown * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Duration</div>
                    <div className="text-sm font-medium text-gray-900">
                      {scenario.duration_months} months
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compare Historical Scenarios</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select 2-5 scenarios to compare side-by-side
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Selection Counter */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-700">Selected Scenarios</div>
            <div className="text-xl font-bold text-blue-900">{selectedIds.length} / 5</div>
          </div>
          {selectedIds.length >= 2 && (
            <button
              onClick={handleCompare}
              disabled={comparing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {comparing ? 'Comparing...' : 'Compare Scenarios'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading scenarios...</div>
        </div>
      )}

      {!loading && scenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => {
            const isSelected = selectedIds.includes(scenario.id);
            const canSelect = selectedIds.length < 5 || isSelected;

            return (
              <button
                key={scenario.id}
                onClick={() => toggleScenario(scenario.id)}
                disabled={!canSelect}
                className={`text-left p-4 border-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{scenario.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{scenario.description}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{scenario.duration_months} months</span>
                      <span>•</span>
                      <span className="text-red-600">
                        {(Math.abs(scenario.max_drawdown_stocks || 0) * 100).toFixed(1)}% max drawdown
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
