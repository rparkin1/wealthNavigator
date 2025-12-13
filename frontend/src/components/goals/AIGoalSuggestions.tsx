/**
 * AI Goal Suggestions Component
 *
 * Displays AI-generated recommendations and alternative scenarios.
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import { useState } from 'react';
import type { GoalRecommendations, AlternativeScenario } from '../../types/aiGoalAssistance';
import {
  SparklesIcon,
  LightBulbIcon,
  CheckIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ScaleIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export interface AIGoalSuggestionsProps {
  recommendations: GoalRecommendations;
}

export function AIGoalSuggestions({ recommendations }: AIGoalSuggestionsProps) {
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);

  const toggleScenario = (index: number) => {
    setExpandedScenario(expandedScenario === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {/* Main Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-indigo-600" />
          AI Recommendations
        </h3>

        {/* Savings Recommendation */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Recommended Monthly Contribution</h4>
            <span className="text-2xl font-bold text-indigo-600">
              ${recommendations.monthly_contribution.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            This represents {(recommendations.suggested_savings_rate * 100).toFixed(1)}% of your income
          </p>
          <div className="mt-3 bg-indigo-50 rounded p-3">
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <LightBulbIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span>
                Automating this contribution can help you stay on track without thinking about it
              </span>
            </div>
          </div>
        </div>

        {/* Optimization Tips */}
        {recommendations.optimization_tips && recommendations.optimization_tips.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <h4 className="font-medium text-gray-900 mb-3">Optimization Tips</h4>
            <ul className="space-y-2">
              {recommendations.optimization_tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckIcon className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Alternative Scenarios */}
      {recommendations.alternative_scenarios && recommendations.alternative_scenarios.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary-600" />
            Alternative Scenarios ({recommendations.alternative_scenarios.length})
          </h4>
          <p className="text-sm text-gray-600">
            Consider these alternatives to optimize your goal achievement
          </p>

          <div className="space-y-2">
            {recommendations.alternative_scenarios.map((scenario, index) => {
              const ScenarioIcon = index === 0 ? RocketLaunchIcon : index === 1 ? ScaleIcon : BanknotesIcon;
              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors"
                >
                  {/* Scenario Header */}
                  <button
                    onClick={() => toggleScenario(index)}
                    className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <ScenarioIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                      <div className="text-left">
                        <h5 className="font-medium text-gray-900">{scenario.name}</h5>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                    </div>
                  <span className="text-gray-400">
                    {expandedScenario === index ? '−' : '+'}
                  </span>
                </button>

                {/* Scenario Details */}
                {expandedScenario === index && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3">
                      {/* Adjustments */}
                      {Object.keys(scenario.adjustments).length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Adjustments:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(scenario.adjustments).map(([key, value], i) => (
                              <div key={i} className="bg-white rounded p-2 border border-gray-200">
                                <div className="text-xs text-gray-600 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </div>
                                <div className="font-medium text-gray-900">
                                  {typeof value === 'number'
                                    ? value.toLocaleString()
                                    : String(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Impact */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <label className="text-sm font-medium text-blue-900 block mb-1">
                          Expected Impact:
                        </label>
                        <p className="text-sm text-blue-800">{scenario.impact}</p>
                      </div>

                      {/* Action Button */}
                      <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
                        Apply This Scenario
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Guidance */}
      {recommendations.risk_guidance && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-warning-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Risk Considerations</h4>
              <p className="text-sm text-amber-800">{recommendations.risk_guidance}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
