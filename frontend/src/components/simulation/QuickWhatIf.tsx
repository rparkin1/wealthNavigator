/**
 * QuickWhatIf Component
 *
 * Pre-set scenario buttons for common "what-if" questions.
 * Provides one-click access to frequently asked scenario analyses.
 */

import { useState } from 'react';

export interface QuickScenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  adjustments: {
    [key: string]: number | string;
  };
}

export interface QuickWhatIfProps {
  onScenarioSelect: (scenario: QuickScenario) => void;
  loading?: boolean;
  currentGoal?: {
    monthlyContribution: number;
    retirementAge: number;
    expectedReturn: number;
  };
}

const DEFAULT_SCENARIOS: QuickScenario[] = [
  {
    id: 'retire_5_years_earlier',
    title: 'Retire 5 Years Earlier',
    description: 'What if I retire at 60 instead of 65?',
    icon: '🏖️',
    adjustments: {
      retirementAge: -5,
    },
  },
  {
    id: 'increase_contributions_20',
    title: 'Increase Contributions 20%',
    description: 'What if I save 20% more per month?',
    icon: '💰',
    adjustments: {
      monthlyContributionMultiplier: 1.2,
    },
  },
  {
    id: 'lower_returns_2pct',
    title: 'Lower Returns (2% Less)',
    description: 'What if market returns are 2% lower?',
    icon: '📉',
    adjustments: {
      expectedReturnDelta: -0.02,
    },
  },
  {
    id: 'higher_returns_2pct',
    title: 'Higher Returns (2% More)',
    description: 'What if market returns are 2% higher?',
    icon: '📈',
    adjustments: {
      expectedReturnDelta: 0.02,
    },
  },
  {
    id: 'inflation_spike',
    title: 'High Inflation (4%)',
    description: 'What if inflation averages 4% instead of 2.5%?',
    icon: '🔥',
    adjustments: {
      inflationRate: 0.04,
    },
  },
  {
    id: 'work_3_more_years',
    title: 'Work 3 More Years',
    description: 'What if I delay retirement by 3 years?',
    icon: '💼',
    adjustments: {
      retirementAge: 3,
    },
  },
  {
    id: 'double_contributions',
    title: 'Double Contributions',
    description: 'What if I double my monthly savings?',
    icon: '🚀',
    adjustments: {
      monthlyContributionMultiplier: 2.0,
    },
  },
  {
    id: 'market_crash',
    title: 'Market Crash (-30%)',
    description: 'What if there\'s a major market crash next year?',
    icon: '💥',
    adjustments: {
      marketCrashYear: 1,
      marketCrashMagnitude: -0.30,
    },
  },
];

export function QuickWhatIf({
  onScenarioSelect,
  loading = false,
  currentGoal,
}: QuickWhatIfProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const handleScenarioClick = (scenario: QuickScenario) => {
    setSelectedScenarioId(scenario.id);
    onScenarioSelect(scenario);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick What-If Scenarios</h3>
        <p className="text-sm text-gray-600">
          Click on a scenario to instantly see how it would affect your retirement plan.
        </p>
      </div>

      {loading && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-blue-900">Running scenario...</span>
        </div>
      )}

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DEFAULT_SCENARIOS.map(scenario => (
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
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0">{scenario.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {scenario.title}
                </h4>
                <p className="text-xs text-gray-600">
                  {scenario.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Scenario Hint */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <svg className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-gray-700">
            <strong>Need a custom scenario?</strong> Use the sliders above to create your own what-if analysis with precise adjustments.
          </div>
        </div>
      </div>
    </div>
  );
}
