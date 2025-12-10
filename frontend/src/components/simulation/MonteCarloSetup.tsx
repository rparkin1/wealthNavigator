/**
 * MonteCarloSetup Component
 *
 * Form for configuring Monte Carlo simulation parameters.
 */

import { useState } from 'react';

interface SimulationParams {
  iterations: number;
  timeHorizon: number;
  initialValue: number;
  monthlyContribution: number;
  expectedReturn: number;
  volatility: number;
  goalAmount: number;
  inflationRate: number;
}

interface MonteCarloSetupProps {
  onRunSimulation: (params: SimulationParams) => void;
  isRunning?: boolean;
  defaultParams?: Partial<SimulationParams>;
}

const DEFAULT_PARAMS: SimulationParams = {
  iterations: 5000,
  timeHorizon: 30,
  initialValue: 100000,
  monthlyContribution: 1000,
  expectedReturn: 0.07,
  volatility: 0.15,
  goalAmount: 2000000,
  inflationRate: 0.03
};

export function MonteCarloSetup({
  onRunSimulation,
  isRunning = false,
  defaultParams = {}
}: MonteCarloSetupProps) {
  const [params, setParams] = useState<SimulationParams>({
    ...DEFAULT_PARAMS,
    ...defaultParams
  });

  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSimulation(params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monte Carlo Simulation Setup
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure parameters for probabilistic portfolio projections
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Iterations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Iterations
          </label>
          <input
            type="number"
            value={params.iterations}
            onChange={(e) => updateParam('iterations', parseInt(e.target.value))}
            min={100}
            max={10000}
            step={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isRunning}
          />
          <p className="text-xs text-gray-500 mt-1">
            {params.iterations.toLocaleString()} scenarios (more = better accuracy)
          </p>
        </div>

        {/* Time Horizon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Horizon (Years)
          </label>
          <input
            type="number"
            value={params.timeHorizon}
            onChange={(e) => updateParam('timeHorizon', parseInt(e.target.value))}
            min={1}
            max={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isRunning}
          />
          <p className="text-xs text-gray-500 mt-1">
            Project {params.timeHorizon} years into the future
          </p>
        </div>

        {/* Initial Portfolio Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Portfolio Value
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={params.initialValue}
              onChange={(e) => updateParam('initialValue', parseFloat(e.target.value))}
              min={0}
              step={1000}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Current portfolio value
          </p>
        </div>

        {/* Monthly Contribution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Contribution
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={params.monthlyContribution}
              onChange={(e) => updateParam('monthlyContribution', parseFloat(e.target.value))}
              min={0}
              step={50}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Regular monthly savings (inflation-adjusted)
          </p>
        </div>

        {/* Expected Return */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Annual Return
          </label>
          <div className="relative">
            <input
              type="number"
              value={(params.expectedReturn * 100).toFixed(1)}
              onChange={(e) => updateParam('expectedReturn', parseFloat(e.target.value) / 100)}
              min={0}
              max={20}
              step={0.1}
              className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Average expected return (before inflation)
          </p>
        </div>

        {/* Volatility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Volatility
          </label>
          <div className="relative">
            <input
              type="number"
              value={(params.volatility * 100).toFixed(1)}
              onChange={(e) => updateParam('volatility', parseFloat(e.target.value) / 100)}
              min={0}
              max={50}
              step={0.1}
              className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Standard deviation (higher = more risk)
          </p>
        </div>

        {/* Goal Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Goal Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={params.goalAmount}
              onChange={(e) => updateParam('goalAmount', parseFloat(e.target.value))}
              min={0}
              step={10000}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Financial goal to achieve
          </p>
        </div>

        {/* Inflation Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inflation Rate
          </label>
          <div className="relative">
            <input
              type="number"
              value={(params.inflationRate * 100).toFixed(1)}
              onChange={(e) => updateParam('inflationRate', parseFloat(e.target.value) / 100)}
              min={0}
              max={10}
              step={0.1}
              className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Expected annual inflation
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setParams(DEFAULT_PARAMS)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          disabled={isRunning}
        >
          Reset to Defaults
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isRunning}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Running Simulation...
            </span>
          ) : (
            `Run ${params.iterations.toLocaleString()} Simulations`
          )}
        </button>
      </div>
    </form>
  );
}
