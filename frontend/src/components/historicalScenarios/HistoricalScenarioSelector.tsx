/**
 * HistoricalScenarioSelector Component
 *
 * Main dashboard for browsing and applying historical market scenarios to goals.
 * Displays scenario cards with key metrics and allows users to stress test their portfolios.
 */

import { useState, useEffect } from 'react';
import { ChartBarIcon, StarIcon } from '@heroicons/react/24/outline';
import type {
  ScenarioListItem,
  ScenarioResult,
  HistoricalScenario,
} from '../../types/historicalScenarios';
import * as historicalScenariosApi from '../../services/historicalScenariosApi';
import { SCENARIO_METADATA, formatReturn, formatCurrency, formatDrawdown } from '../../types/historicalScenarios';

export interface HistoricalScenarioSelectorProps {
  goalId: string;
  initialValue: number;
  monthlyContribution?: number;
  onScenarioApplied?: (result: ScenarioResult) => void;
  onClose?: () => void;
}

export function HistoricalScenarioSelector({
  goalId,
  initialValue,
  monthlyContribution = 0,
  onScenarioApplied,
  onClose,
}: HistoricalScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioListItem | null>(null);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, [showFeaturedOnly]);

  const loadScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await historicalScenariosApi.getAllScenarios({
        featuredOnly: showFeaturedOnly,
        activeOnly: true,
      });
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScenario = async (scenario: ScenarioListItem) => {
    setApplying(true);
    setError(null);

    try {
      const scenarioResult = await historicalScenariosApi.applyScenario(scenario.id, {
        goal_id: goalId,
        initial_portfolio_value: initialValue,
        monthly_contribution: monthlyContribution,
      });

      setResult(scenarioResult);
      setSelectedScenario(scenario);

      if (onScenarioApplied) {
        onScenarioApplied(scenarioResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply scenario');
    } finally {
      setApplying(false);
    }
  };

  const handleBack = () => {
    setResult(null);
    setSelectedScenario(null);
  };

  if (result && selectedScenario) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedScenario.name}</h2>
            <p className="text-sm text-gray-600 mt-1">Historical Scenario Impact</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
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

        {/* Results Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Initial Value</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(result.initial_value)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Final Value</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(result.final_value)}
            </div>
            <div className={'text-sm font-medium mt-1 ' + historicalScenariosApi.getReturnColorClass(result.total_return)}>
              {formatReturn(result.total_return)}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {formatDrawdown(result.max_drawdown)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {historicalScenariosApi.getDrawdownSeverity(result.max_drawdown).label}
            </div>
          </div>
        </div>

        {/* Portfolio Trajectory Chart */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Portfolio Trajectory</h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {result.portfolio_trajectory.map((point, index) => {
              const maxValue = Math.max(...result.portfolio_trajectory.map(p => p.value));
              const minValue = Math.min(...result.portfolio_trajectory.map(p => p.value));
              const range = maxValue - minValue;
              const heightPercent = range > 0 ? ((point.value - minValue) / range) * 100 : 50;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={'w-full transition-all ' + (point.value < result.initial_value ? 'bg-red-500' : 'bg-green-500')}
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  {index % Math.ceil(result.portfolio_trajectory.length / 8) === 0 && (
                    <div className="text-xs text-gray-600 mt-2">{point.period}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Events */}
        {result.key_events && result.key_events.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Events</h3>
            <div className="space-y-2">
              {result.key_events.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="text-sm font-medium text-blue-700 w-24">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900">{event.event}</div>
                    <div className="text-sm text-blue-700">{event.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historical Market Scenarios</h2>
          <p className="text-sm text-gray-600 mt-1">
            Stress test your portfolio with real historical market events
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Featured only</span>
          </label>
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
      </div>

      {/* Portfolio Info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-blue-700">Initial Portfolio Value</div>
            <div className="text-xl font-bold text-blue-900">{formatCurrency(initialValue)}</div>
          </div>
          {monthlyContribution > 0 && (
            <div>
              <div className="text-sm text-blue-700">Monthly Contribution</div>
              <div className="text-xl font-bold text-blue-900">{formatCurrency(monthlyContribution)}</div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading scenarios...</div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <div className="text-red-800">{error}</div>
          <button
            onClick={loadScenarios}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && scenarios.length === 0 && (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <ChartBarIcon className="w-24 h-24 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scenarios Available</h3>
          <p className="text-gray-600">Historical scenarios need to be initialized.</p>
        </div>
      )}

      {!loading && !error && scenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => {
            const metadata = SCENARIO_METADATA[scenario.period];
            const riskColors = historicalScenariosApi.getRiskLevelColor(scenario.volatility_stocks);

            return (
              <button
                key={scenario.id}
                onClick={() => handleApplyScenario(scenario)}
                disabled={applying}
                className="text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{metadata?.icon || <ChartBarIcon className="w-10 h-10 text-gray-600" />}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {scenario.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="text-sm font-medium text-gray-900">
                          {scenario.duration_months} months
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Max Drawdown</div>
                        <div className="text-sm font-medium text-red-600">
                          {formatDrawdown(scenario.max_drawdown_stocks || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {scenario.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded flex items-center gap-1">
                          <StarIcon className="w-4 h-4" />
                          Featured
                        </span>
                      )}
                      <span className={`px-2 py-1 ${riskColors.bg} ${riskColors.text} text-xs font-medium rounded border ${riskColors.border}`}>
                        {historicalScenariosApi.getVolatilityLabel(scenario.volatility_stocks)} Volatility
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
