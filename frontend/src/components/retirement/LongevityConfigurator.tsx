/**
 * LongevityConfigurator Component
 *
 * Configure life expectancy and longevity assumptions for retirement planning.
 */

import { useState, useEffect } from 'react';

interface LongevityAssumptions {
  currentAge: number;
  gender: 'male' | 'female';
  healthStatus: 'excellent' | 'good' | 'average' | 'poor';
  baseLifeExpectancy: number;
  planningAge: number;
}

interface LongevityResult {
  adjustedLifeExpectancy: number;
  adjusted_life_expectancy: number; // snake_case for API
  yearsRemaining: number;
  years_remaining: number; // snake_case for API
  planningBuffer: number;
  planning_age: number; // Required by API
}

interface LongevityConfiguratorProps {
  onChange: (assumptions: LongevityAssumptions, result: LongevityResult) => void;
  defaultAssumptions?: Partial<LongevityAssumptions>;
}

const DEFAULT_ASSUMPTIONS: LongevityAssumptions = {
  currentAge: 65,
  gender: 'male',
  healthStatus: 'average',
  baseLifeExpectancy: 84,
  planningAge: 95
};

export function LongevityConfigurator({
  onChange,
  defaultAssumptions = {}
}: LongevityConfiguratorProps) {
  const [assumptions, setAssumptions] = useState<LongevityAssumptions>({
    ...DEFAULT_ASSUMPTIONS,
    ...defaultAssumptions
  });

  const [result, setResult] = useState<LongevityResult | null>(null);

  useEffect(() => {
    calculateLongevity();
  }, [assumptions]);

  const updateAssumption = (key: keyof LongevityAssumptions, value: string | number | boolean) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  const calculateLongevity = () => {
    // Base life expectancy by gender (SSA 2023 data)
    const baseByGender = {
      male: 84,
      female: 87
    };

    const base = baseByGender[assumptions.gender];

    // Adjust for health status
    const healthAdjustments = {
      excellent: 4,
      good: 2,
      average: 0,
      poor: -4
    };

    const healthAdjustment = healthAdjustments[assumptions.healthStatus];
    const adjusted = base + healthAdjustment;

    const yearsRemaining = adjusted - assumptions.currentAge;
    const planningBuffer = assumptions.planningAge - adjusted;

    const calculatedResult: LongevityResult = {
      adjustedLifeExpectancy: adjusted,
      adjusted_life_expectancy: adjusted, // snake_case for API
      yearsRemaining: Math.max(0, yearsRemaining),
      years_remaining: Math.max(0, yearsRemaining), // snake_case for API
      planningBuffer,
      planning_age: assumptions.planningAge, // Required by API
    };

    setResult(calculatedResult);
    onChange(assumptions, calculatedResult);
  };

  const getSurvivalProbability = (age: number): number => {
    if (!result) return 0;
    const yearsFromNow = age - assumptions.currentAge;
    const totalYears = result.adjustedLifeExpectancy - assumptions.currentAge;

    // Exponential decay model
    if (yearsFromNow < 0) return 1;
    if (yearsFromNow > totalYears * 2) return 0;

    const decayRate = 0.693 / totalYears;
    return Math.max(0, Math.min(1, Math.exp(-decayRate * yearsFromNow)));
  };

  const getHealthDescription = (status: string): string => {
    const descriptions = {
      excellent: 'No major health issues, regular exercise, healthy lifestyle',
      good: 'Generally healthy with minor manageable conditions',
      average: 'Typical health for age group',
      poor: 'Multiple health conditions or significant health challenges'
    };
    return descriptions[status as keyof typeof descriptions] || '';
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Longevity Assumptions
        </h3>
        <p className="text-sm text-gray-600">
          Configure life expectancy for retirement planning
        </p>
      </div>

      {/* Current Age */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Age: <span className="font-bold">{assumptions.currentAge}</span>
        </label>
        <input
          type="range"
          value={assumptions.currentAge}
          onChange={(e) => updateAssumption('currentAge', parseInt(e.target.value))}
          min={50}
          max={90}
          step={1}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>50</span>
          <span>70</span>
          <span>90</span>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gender
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateAssumption('gender', 'male')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              assumptions.gender === 'male'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Male
          </button>
          <button
            onClick={() => updateAssumption('gender', 'female')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              assumptions.gender === 'female'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Female
          </button>
        </div>
      </div>

      {/* Health Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Health Status
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['excellent', 'good', 'average', 'poor'] as const).map((status) => (
            <button
              key={status}
              onClick={() => updateAssumption('healthStatus', status)}
              className={`px-4 py-2 rounded-md font-medium transition-colors capitalize ${
                assumptions.healthStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {getHealthDescription(assumptions.healthStatus)}
        </p>
      </div>

      {/* Planning Age */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plan To Age: <span className="font-bold">{assumptions.planningAge}</span>
        </label>
        <input
          type="range"
          value={assumptions.planningAge}
          onChange={(e) => updateAssumption('planningAge', parseInt(e.target.value))}
          min={assumptions.currentAge + 10}
          max={100}
          step={1}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{assumptions.currentAge + 10}</span>
          <span>90</span>
          <span>100</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Conservative planning reduces risk of outliving savings
        </p>
      </div>

      {/* Results */}
      {result && (
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Life Expectancy Analysis</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Life Expectancy</div>
              <div className="text-2xl font-bold text-blue-600">
                {result.adjustedLifeExpectancy}
              </div>
              <div className="text-xs text-gray-500">years old</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Years Remaining</div>
              <div className="text-2xl font-bold text-green-600">
                {result.yearsRemaining}
              </div>
              <div className="text-xs text-gray-500">years</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Safety Buffer</div>
              <div className="text-2xl font-bold text-purple-600">
                {result.planningBuffer}
              </div>
              <div className="text-xs text-gray-500">years</div>
            </div>
          </div>

          {/* Survival Probabilities */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-700">Survival Probabilities</h5>
            {[
              { age: assumptions.currentAge + 10, label: '10 years' },
              { age: assumptions.currentAge + 20, label: '20 years' },
              { age: assumptions.currentAge + 30, label: '30 years' },
              { age: result.adjustedLifeExpectancy, label: 'Life expect.' }
            ].map(({ age, label }, index) => {
              const prob = getSurvivalProbability(age);
              return (
                <div key={`${label}-${index}`} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    Age {age} ({label}):
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 w-12 text-right">
                      {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex gap-2">
              <svg className="h-5 w-5 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-yellow-900">
                <strong>Planning Recommendation:</strong> Based on your health status and gender,
                planning to age {assumptions.planningAge} provides a {result.planningBuffer}-year
                safety buffer beyond statistical life expectancy.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
