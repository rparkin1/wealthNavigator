/**
 * QuickWhatIf Component
 *
 * Pre-set scenario buttons for common "what-if" questions.
 * Provides one-click access to frequently asked scenario analyses.
 */

import { useMemo, useState } from 'react';
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  SunIcon,
  FireIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

export type QuickScenarioCategory = 'Optimistic' | 'Pessimistic' | 'Adjustment';

export interface QuickScenario {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: QuickScenarioCategory;
  impactLabel?: string;
  adjustments: Record<string, number>;
}

interface BaselineInputs {
  monthlyContribution?: number;
  retirementAge?: number;
  expectedReturnStocks?: number;
  expectedReturnBonds?: number;
  inflationRate?: number;
}

interface BaselineValues {
  monthlyContribution: number;
  retirementAge: number;
  expectedReturnStocks: number;
  expectedReturnBonds: number;
  inflationRate: number;
}

interface ScenarioDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: QuickScenarioCategory;
  description: (baseline: BaselineValues) => string;
  impactLabel?: (baseline: BaselineValues) => string;
  adjustments: (baseline: BaselineValues) => Record<string, number>;
}

export interface QuickWhatIfProps {
  onScenarioSelect: (scenario: QuickScenario) => void;
  loading?: boolean;
  baseline?: BaselineInputs;
  /** @deprecated use baseline instead */
  currentGoal?: {
    monthlyContribution?: number;
    retirementAge?: number;
    expectedReturn?: number;
  };
}

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.0%';
  }
  return `${(value * 100).toFixed(1)}%`;
};

const deriveBaseline = (baseline?: BaselineInputs, legacyGoal?: QuickWhatIfProps['currentGoal']): BaselineValues => {
  return {
    monthlyContribution:
      baseline?.monthlyContribution ??
      legacyGoal?.monthlyContribution ??
      0,
    retirementAge: baseline?.retirementAge ?? legacyGoal?.retirementAge ?? 65,
    expectedReturnStocks:
      baseline?.expectedReturnStocks ??
      legacyGoal?.expectedReturn ??
      0.07,
    expectedReturnBonds: baseline?.expectedReturnBonds ?? 0.03,
    inflationRate: baseline?.inflationRate ?? 0.025,
  };
};

const scenarioDefinitions: ScenarioDefinition[] = [
  {
    id: 'retire_5_years_earlier',
    title: 'Retire 5 Years Earlier',
    icon: <CalendarIcon className="w-6 h-6" />,
    category: 'Adjustment',
    description: (ctx) =>
      `What if I retire at ${Math.max(ctx.retirementAge - 5, 0)} instead of ${ctx.retirementAge}?`,
    impactLabel: () => '-5 years',
    adjustments: () => ({ retirementAge: -5 }),
  },
  {
    id: 'increase_contributions_50',
    title: 'Increase Contributions 50%',
    icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
    category: 'Adjustment',
    description: (ctx) =>
      `What if I increase monthly contributions to ${formatCurrency(ctx.monthlyContribution * 1.5)}?`,
    impactLabel: () => '+50%',
    adjustments: () => ({ monthlyContribution: 1.5 }),
  },
  {
    id: 'decrease_contributions_25',
    title: 'Decrease Contributions 25%',
    icon: <ArrowTrendingDownIcon className="w-6 h-6" />,
    category: 'Adjustment',
    description: (ctx) =>
      `What if I reduce contributions to ${formatCurrency(ctx.monthlyContribution * 0.75)} for a while?`,
    impactLabel: () => '-25%',
    adjustments: () => ({ monthlyContribution: 0.75 }),
  },
  {
    id: 'market_crash',
    title: 'Market Crash Scenario',
    icon: <BoltIcon className="w-6 h-6" />,
    category: 'Pessimistic',
    description: (ctx) =>
      `Simulate a 20% drop next year and reduce equity returns to ${formatPercentage(
        Math.max(ctx.expectedReturnStocks - 0.02, 0)
      )}.`,
    impactLabel: () => '20% drop',
    adjustments: (ctx) => ({
      expectedReturnStocks: Math.max(ctx.expectedReturnStocks - 0.02, 0),
    }),
  },
  {
    id: 'lower_inflation',
    title: 'Lower Inflation',
    icon: <SunIcon className="w-6 h-6" />,
    category: 'Optimistic',
    description: (ctx) => {
      const newRate = Math.max(ctx.inflationRate - 0.01, 0.01);
      return `Assume inflation falls from ${formatPercentage(ctx.inflationRate)} to ${formatPercentage(newRate)}.`;
    },
    impactLabel: (ctx) => {
      const newRate = Math.max(ctx.inflationRate - 0.01, 0.01);
      return formatPercentage(newRate);
    },
    adjustments: (ctx) => ({
      inflationRate: Math.max(ctx.inflationRate - 0.01, 0.01),
    }),
  },
  {
    id: 'high_inflation',
    title: 'High Inflation (4%)',
    icon: <FireIcon className="w-6 h-6" />,
    category: 'Pessimistic',
    description: () => 'Stress-test the plan with inflation averaging 4% over the next decade.',
    impactLabel: () => '4.0% inflation',
    adjustments: () => ({
      inflationRate: 0.04,
    }),
  },
  {
    id: 'better_returns',
    title: 'Better Than Expected Returns',
    icon: <RocketLaunchIcon className="w-6 h-6" />,
    category: 'Optimistic',
    description: (ctx) => {
      const improved = ctx.expectedReturnStocks + 0.02;
      return `Improve equity returns from ${formatPercentage(ctx.expectedReturnStocks)} to ${formatPercentage(improved)}.`;
    },
    impactLabel: (ctx) => formatPercentage(ctx.expectedReturnStocks + 0.02),
    adjustments: (ctx) => ({
      expectedReturnStocks: ctx.expectedReturnStocks + 0.02,
    }),
  },
];

const buildScenarios = (baseline: BaselineValues): QuickScenario[] =>
  scenarioDefinitions.map((definition) => ({
    id: definition.id,
    title: definition.title,
    icon: definition.icon,
    category: definition.category,
    description: definition.description(baseline),
    impactLabel: definition.impactLabel?.(baseline),
    adjustments: definition.adjustments(baseline),
  }));

export function QuickWhatIf({
  onScenarioSelect,
  loading = false,
  baseline,
  currentGoal,
}: QuickWhatIfProps) {
  const baselineValues = useMemo(() => deriveBaseline(baseline, currentGoal), [baseline, currentGoal]);
  const scenarios = useMemo(() => buildScenarios(baselineValues), [baselineValues]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const handleScenarioClick = (scenario: QuickScenario) => {
    setSelectedScenarioId(scenario.id);
    onScenarioSelect(scenario);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="mb-6 space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Quick What-If Scenarios</h3>
        <p className="text-sm text-gray-600">
          Click on a scenario to instantly see how it would affect your retirement plan.
        </p>
        <p className="text-xs text-gray-500">
          Current plan contribution: {formatCurrency(baselineValues.monthlyContribution)} each month.
        </p>
      </div>

      {loading && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium text-blue-900">Running scenario...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleScenarioClick(scenario)}
            disabled={loading}
            className={`
              p-4 text-left rounded-lg border-2 transition-all
              ${selectedScenarioId === scenario.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{scenario.icon}</span>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{scenario.title}</h4>
                  {scenario.impactLabel && (
                    <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">
                      {scenario.impactLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{scenario.description}</p>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  {scenario.category}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <svg className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-gray-700">
            <strong>Need a custom scenario?</strong> Use the sliders above to create your own what-if analysis with precise
            adjustments.
          </div>
        </div>
      </div>
    </div>
  );
}
