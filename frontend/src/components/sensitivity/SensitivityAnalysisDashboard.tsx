/**
 * Sensitivity Analysis Dashboard
 *
 * Comprehensive dashboard for advanced sensitivity analysis featuring:
 * - Tornado diagrams (one-way sensitivity)
 * - Heat maps (two-way sensitivity)
 * - Threshold analysis
 * - Break-even calculations
 *
 * This dashboard allows users to understand which variables have the greatest
 * impact on their financial goals and find optimal values for success.
 */

import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  ChartBarIcon,
  TableCellsIcon,
  ScaleIcon,
  CalculatorIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import TornadoDiagram from './TornadoDiagram';
import TwoWaySensitivityHeatmap from './TwoWaySensitivityHeatmap';
import ThresholdAnalysisChart from './ThresholdAnalysisChart';
import BreakEvenCalculator from './BreakEvenCalculator';
import { sensitivityAnalysisApi, formatVariableName } from '../../services/sensitivityAnalysisApi';
import type {
  SensitivityVariable,
  OneWaySensitivityResult,
  TwoWaySensitivityResult,
  ThresholdAnalysisResult,
  BreakEvenAnalysisResult,
  VariableInfo,
} from '../../types/sensitivityAnalysis';

interface SensitivityAnalysisDashboardProps {
  goalId: string;
  defaultVariables?: SensitivityVariable[];
}

export const SensitivityAnalysisDashboard: React.FC<
  SensitivityAnalysisDashboardProps
> = ({ goalId, defaultVariables = ['monthly_contribution', 'expected_return_stocks', 'inflation_rate'] }) => {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedVariables, setSupportedVariables] = useState<VariableInfo[]>([]);

  // Analysis results
  const [oneWayResult, setOneWayResult] = useState<OneWaySensitivityResult | null>(null);
  const [twoWayResult, setTwoWayResult] = useState<TwoWaySensitivityResult | null>(null);
  const [thresholdResult, setThresholdResult] = useState<ThresholdAnalysisResult | null>(null);
  const [breakEvenResult, setBreakEvenResult] = useState<BreakEvenAnalysisResult | null>(null);

  // Configuration
  const [selectedVariables, setSelectedVariables] = useState<SensitivityVariable[]>(defaultVariables);
  const [variable1, setVariable1] = useState<SensitivityVariable>('monthly_contribution');
  const [variable2, setVariable2] = useState<SensitivityVariable>('expected_return_stocks');
  const [thresholdVariable, setThresholdVariable] = useState<SensitivityVariable>('monthly_contribution');
  const [targetProbability, setTargetProbability] = useState(0.90);
  const [breakEvenVar1, setBreakEvenVar1] = useState<SensitivityVariable>('inflation_rate');
  const [breakEvenVar2, setBreakEvenVar2] = useState<SensitivityVariable>('monthly_contribution');

  // Load supported variables
  useEffect(() => {
    const loadVariables = async () => {
      try {
        const response = await sensitivityAnalysisApi.getSupportedVariables();
        setSupportedVariables(response.variables);
      } catch (err) {
        console.error('Failed to load supported variables:', err);
      }
    };
    loadVariables();
  }, []);

  // Tab configuration
  const tabs = [
    {
      name: 'Tornado Diagram',
      icon: ChartBarIcon,
      description: 'Identify high-impact variables',
    },
    {
      name: 'Heat Map',
      icon: TableCellsIcon,
      description: 'Explore variable interactions',
    },
    {
      name: 'Threshold Analysis',
      icon: ScaleIcon,
      description: 'Find required values',
    },
    {
      name: 'Break-Even',
      icon: CalculatorIcon,
      description: 'Calculate break-even points',
    },
  ];

  // Analysis functions
  const runOneWayAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sensitivityAnalysisApi.oneWaySensitivity({
        goal_id: goalId,
        variables: selectedVariables,
        variation_percentage: 0.20,
        num_points: 5,
        iterations_per_point: 1000,
      });
      setOneWayResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to run tornado analysis');
    } finally {
      setLoading(false);
    }
  };

  const runTwoWayAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sensitivityAnalysisApi.twoWaySensitivity({
        goal_id: goalId,
        variable1,
        variable2,
        variation_percentage: 0.20,
        grid_size: 10,
        iterations_per_point: 500,
      });
      setTwoWayResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to run heat map analysis');
    } finally {
      setLoading(false);
    }
  };

  const runThresholdAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sensitivityAnalysisApi.thresholdAnalysis({
        goal_id: goalId,
        variable: thresholdVariable,
        target_probability: targetProbability,
        tolerance: 0.01,
      });
      setThresholdResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to run threshold analysis');
    } finally {
      setLoading(false);
    }
  };

  const runBreakEvenAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await sensitivityAnalysisApi.breakEvenAnalysis({
        goal_id: goalId,
        variable1: breakEvenVar1,
        variable2: breakEvenVar2,
        target_probability: targetProbability,
        grid_size: 20,
        iterations_per_point: 500,
      });
      setBreakEvenResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to run break-even analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Advanced Sensitivity Analysis
        </h2>
        <p className="text-gray-600">
          Understand which variables have the greatest impact on your goal's success
          and find optimal values for achieving your targets.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">What is Sensitivity Analysis?</p>
          <p>
            Sensitivity analysis helps you understand how changes in key variables affect
            your goal's success probability. Use these tools to prioritize what to focus
            on and find the right balance for your financial plan.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex space-x-2 rounded-lg bg-gray-100 p-1 mb-6">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `flex items-center justify-center w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-700 hover:bg-white/50 hover:text-gray-900'
                }`
              }
            >
              <tab.icon className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-semibold">{tab.name}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {/* Tornado Diagram Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Configuration */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Variables to Analyze (max 5)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {supportedVariables.map((v) => (
                        <label key={v.name} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedVariables.includes(v.name)}
                            onChange={(e) => {
                              if (e.target.checked && selectedVariables.length < 5) {
                                setSelectedVariables([...selectedVariables, v.name]);
                              } else if (!e.target.checked) {
                                setSelectedVariables(
                                  selectedVariables.filter((sv) => sv !== v.name)
                                );
                              }
                            }}
                            className="mr-2"
                            disabled={
                              !selectedVariables.includes(v.name) &&
                              selectedVariables.length >= 5
                            }
                          />
                          {formatVariableName(v.name)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={runOneWayAnalysis}
                    disabled={loading || selectedVariables.length === 0}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Analyzing...' : 'Run Tornado Analysis'}
                  </button>
                </div>
              </div>

              {/* Results */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  {error}
                </div>
              )}
              {oneWayResult && <TornadoDiagram data={oneWayResult} />}
            </div>
          </Tab.Panel>

          {/* Heat Map Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Configuration */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variable 1 (X-axis)
                    </label>
                    <select
                      value={variable1}
                      onChange={(e) =>
                        setVariable1(e.target.value as SensitivityVariable)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {supportedVariables.map((v) => (
                        <option key={v.name} value={v.name}>
                          {formatVariableName(v.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variable 2 (Y-axis)
                    </label>
                    <select
                      value={variable2}
                      onChange={(e) =>
                        setVariable2(e.target.value as SensitivityVariable)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {supportedVariables.map((v) => (
                        <option key={v.name} value={v.name}>
                          {formatVariableName(v.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={runTwoWayAnalysis}
                  disabled={loading || variable1 === variable2}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Run Heat Map Analysis'}
                </button>
              </div>

              {/* Results */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  {error}
                </div>
              )}
              {twoWayResult && <TwoWaySensitivityHeatmap data={twoWayResult} />}
            </div>
          </Tab.Panel>

          {/* Threshold Analysis Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Configuration */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variable
                    </label>
                    <select
                      value={thresholdVariable}
                      onChange={(e) =>
                        setThresholdVariable(e.target.value as SensitivityVariable)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {supportedVariables.map((v) => (
                        <option key={v.name} value={v.name}>
                          {formatVariableName(v.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Probability
                    </label>
                    <input
                      type="number"
                      min="0.50"
                      max="0.99"
                      step="0.05"
                      value={targetProbability}
                      onChange={(e) => setTargetProbability(parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <div className="text-xs text-gray-600 mt-1">
                      {(targetProbability * 100).toFixed(0)}% success rate
                    </div>
                  </div>
                </div>
                <button
                  onClick={runThresholdAnalysis}
                  disabled={loading}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Run Threshold Analysis'}
                </button>
              </div>

              {/* Results */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  {error}
                </div>
              )}
              {thresholdResult && <ThresholdAnalysisChart data={thresholdResult} />}
            </div>
          </Tab.Panel>

          {/* Break-Even Panel */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Configuration */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Configuration
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variable 1 (Risk/Cost)
                    </label>
                    <select
                      value={breakEvenVar1}
                      onChange={(e) =>
                        setBreakEvenVar1(e.target.value as SensitivityVariable)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {supportedVariables.map((v) => (
                        <option key={v.name} value={v.name}>
                          {formatVariableName(v.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variable 2 (Return/Savings)
                    </label>
                    <select
                      value={breakEvenVar2}
                      onChange={(e) =>
                        setBreakEvenVar2(e.target.value as SensitivityVariable)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {supportedVariables.map((v) => (
                        <option key={v.name} value={v.name}>
                          {formatVariableName(v.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Probability
                    </label>
                    <input
                      type="number"
                      min="0.50"
                      max="0.99"
                      step="0.05"
                      value={targetProbability}
                      onChange={(e) => setTargetProbability(parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  onClick={runBreakEvenAnalysis}
                  disabled={loading || breakEvenVar1 === breakEvenVar2}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Run Break-Even Analysis'}
                </button>
              </div>

              {/* Results */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  {error}
                </div>
              )}
              {breakEvenResult && <BreakEvenCalculator data={breakEvenResult} />}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default SensitivityAnalysisDashboard;
