import React, { useState, useEffect, useMemo } from 'react';
import { RangeSlider, formatters } from '../ui/RangeSlider';
import { ImpactSummary } from './ImpactSummary';
import { Button } from '../ui/Button';
import {
  calculateWhatIf,
  compareScenarios,
  type WhatIfParameters,
  type WhatIfResult
} from '../../utils/whatIfCalculations';

export interface WhatIfTabProps {
  goalId: string;
  currentAge: number;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  baselineMonthlyContribution: number;
  baselineExpectedReturn: number;
  baselineRetirementAge: number;
  onSaveScenario?: (scenario: SavedScenario) => void;
  className?: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  timestamp: number;
  parameters: WhatIfParameters;
  result: WhatIfResult;
}

/**
 * WhatIfTab Component
 *
 * Interactive what-if analysis for goal projections.
 * Features:
 * - Real-time calculation with debouncing
 * - Interactive sliders for key parameters
 * - Impact summary showing differences from baseline
 * - Save and compare scenarios
 * - Professional financial planning UI
 */
export function WhatIfTab({
  goalId,
  currentAge,
  currentAmount,
  targetAmount,
  targetDate,
  baselineMonthlyContribution,
  baselineExpectedReturn,
  baselineRetirementAge,
  onSaveScenario,
  className = ''
}: WhatIfTabProps) {
  // Calculate baseline retirement age from target date
  const baselineAge = useMemo(() => {
    if (baselineRetirementAge) return baselineRetirementAge;
    const targetYear = new Date(targetDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentAge + (targetYear - currentYear);
  }, [baselineRetirementAge, targetDate, currentAge]);

  // Slider state (alternative scenario)
  const [monthlyContribution, setMonthlyContribution] = useState(baselineMonthlyContribution);
  const [expectedReturn, setExpectedReturn] = useState(baselineExpectedReturn);
  const [retirementAge, setRetirementAge] = useState(baselineAge);

  // Reset flag
  const [hasChanges, setHasChanges] = useState(false);

  // Saved scenarios
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');

  // Calculate baseline result
  const baselineParams: WhatIfParameters = {
    monthlyContribution: baselineMonthlyContribution,
    expectedReturn: baselineExpectedReturn,
    retirementAge: baselineAge,
    currentAge,
    currentAmount,
    targetAmount
  };

  const baselineResult = useMemo(
    () => calculateWhatIf(baselineParams),
    [baselineParams]
  );

  // Calculate alternative result with current slider values
  const alternativeParams: WhatIfParameters = {
    monthlyContribution,
    expectedReturn,
    retirementAge,
    currentAge,
    currentAmount,
    targetAmount
  };

  const alternativeResult = useMemo(
    () => calculateWhatIf(alternativeParams),
    [alternativeParams]
  );

  // Compare baseline vs alternative
  const comparison = useMemo(
    () => compareScenarios(baselineResult, alternativeResult),
    [baselineResult, alternativeResult]
  );

  // Check if there are changes from baseline
  useEffect(() => {
    const changed =
      monthlyContribution !== baselineMonthlyContribution ||
      expectedReturn !== baselineExpectedReturn ||
      retirementAge !== baselineAge;

    setHasChanges(changed);
  }, [monthlyContribution, expectedReturn, retirementAge, baselineMonthlyContribution, baselineExpectedReturn, baselineAge]);

  // Reset to baseline
  const handleReset = () => {
    setMonthlyContribution(baselineMonthlyContribution);
    setExpectedReturn(baselineExpectedReturn);
    setRetirementAge(baselineAge);
    setHasChanges(false);
  };

  // Save current scenario
  const handleSaveScenario = () => {
    const scenario: SavedScenario = {
      id: `scenario-${Date.now()}`,
      name: scenarioName || `Scenario ${savedScenarios.length + 1}`,
      timestamp: Date.now(),
      parameters: alternativeParams,
      result: alternativeResult
    };

    setSavedScenarios(prev => [...prev, scenario]);
    setScenarioName('');

    if (onSaveScenario) {
      onSaveScenario(scenario);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          What-If Analysis
        </h3>
        <p className="text-sm text-gray-600">
          Adjust assumptions below to see how changes impact your goal's success probability and projected value.
          Changes are calculated in real-time.
        </p>
      </div>

      {/* Interactive Sliders */}
      <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900">
          Adjust Parameters
        </h4>

        {/* Monthly Contribution Slider */}
        <RangeSlider
          label="Monthly Contribution"
          value={monthlyContribution}
          min={0}
          max={10000}
          step={100}
          onChange={setMonthlyContribution}
          formatValue={formatters.currency}
          helperText="How much you plan to save each month"
          showMinMax
        />

        {/* Expected Return Slider */}
        <RangeSlider
          label="Expected Annual Return"
          value={expectedReturn}
          min={2}
          max={12}
          step={0.5}
          onChange={setExpectedReturn}
          formatValue={formatters.percentage}
          helperText="Conservative: 4-6%, Moderate: 6-8%, Aggressive: 8-10%"
          showMinMax
        />

        {/* Retirement Age Slider */}
        <RangeSlider
          label="Retirement Age"
          value={retirementAge}
          min={Math.max(currentAge + 1, 50)}
          max={75}
          step={1}
          onChange={setRetirementAge}
          formatValue={formatters.age}
          helperText="When you plan to reach this goal"
          showMinMax
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={!hasChanges}
            size="sm"
          >
            Reset to Baseline
          </Button>

          {hasChanges && (
            <div className="flex-1 flex items-center justify-end">
              <span className="text-xs text-gray-500 italic">
                * Calculations update automatically
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Impact Summary */}
      {hasChanges && (
        <ImpactSummary
          comparison={comparison}
          baselineValue={baselineResult.projectedValue}
          alternativeValue={alternativeResult.projectedValue}
          baselineProbability={baselineResult.successProbability}
          alternativeProbability={alternativeResult.successProbability}
        />
      )}

      {/* Save Scenario */}
      {hasChanges && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Save This Scenario
          </h4>

          <div className="flex gap-3">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name (optional)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Button
              variant="primary"
              onClick={handleSaveScenario}
              size="md"
            >
              Save Scenario
            </Button>
          </div>

          {savedScenarios.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Saved scenarios ({savedScenarios.length}):
              </p>
              <div className="space-y-2">
                {savedScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <span className="font-medium text-gray-900">
                      {scenario.name}
                    </span>
                    <span className="text-gray-500">
                      {new Date(scenario.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Parameters Summary */}
      <div className="p-6 bg-info-50 border border-info-200 rounded-lg">
        <h4 className="text-sm font-semibold text-info-900 mb-3">
          Current Parameters
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-info-700 block mb-1">Monthly</span>
            <span className="text-info-900 font-semibold font-mono">
              {formatters.currency(monthlyContribution)}
            </span>
          </div>
          <div>
            <span className="text-info-700 block mb-1">Return</span>
            <span className="text-info-900 font-semibold font-mono">
              {formatters.percentage(expectedReturn)}
            </span>
          </div>
          <div>
            <span className="text-info-700 block mb-1">Retirement Age</span>
            <span className="text-info-900 font-semibold font-mono">
              {retirementAge}
            </span>
          </div>
          <div>
            <span className="text-info-700 block mb-1">Years to Goal</span>
            <span className="text-info-900 font-semibold font-mono">
              {alternativeResult.yearsToGoal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
