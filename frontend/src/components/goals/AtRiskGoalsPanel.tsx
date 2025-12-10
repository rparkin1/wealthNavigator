/**
 * AtRiskGoalsPanel Component
 *
 * Displays goals that are below the success probability threshold.
 * Provides recommendations for improving goal funding and prioritization.
 */

import { useState, useEffect } from 'react';
import type { Goal } from '../../types/goal';

export interface AtRiskGoal extends Goal {
  shortfallAmount: number;
  recommendedActions: string[];
}

export interface AtRiskGoalsPanelProps {
  userId: string;
  successThreshold?: number;
  onGoalClick?: (goalId: string) => void;
}

export function AtRiskGoalsPanel({
  userId,
  successThreshold = 0.80,
  onGoalClick,
}: AtRiskGoalsPanelProps) {
  const [atRiskGoals, setAtRiskGoals] = useState<AtRiskGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'shortfall' | 'probability'>('shortfall');

  useEffect(() => {
    fetchAtRiskGoals();
  }, [userId, successThreshold]);

  const fetchAtRiskGoals = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/goals/at-risk?threshold=${successThreshold}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const data = await response.json();
      setAtRiskGoals(data.at_risk_goals || []);
    } catch (error) {
      console.error('Failed to fetch at-risk goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedGoals = [...atRiskGoals].sort((a, b) => {
    if (sortBy === 'shortfall') {
      return b.shortfallAmount - a.shortfallAmount;
    } else {
      return (a.successProbability || 0) - (b.successProbability || 0);
    }
  });

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Analyzing goals...</span>
        </div>
      </div>
    );
  }

  if (atRiskGoals.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            All Goals On Track!
          </h3>
          <p className="text-sm text-gray-600">
            All your goals have a {(successThreshold * 100).toFixed(0)}% or higher success probability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">At-Risk Goals</h3>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'shortfall' | 'probability')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="shortfall">Shortfall Amount</option>
              <option value="probability">Success Probability</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {atRiskGoals.length} goal{atRiskGoals.length !== 1 ? 's' : ''} below {(successThreshold * 100).toFixed(0)}% success probability
        </p>
      </div>

      {/* At-Risk Goals List */}
      <div className="divide-y divide-gray-200">
        {sortedGoals.map(goal => (
          <AtRiskGoalCard
            key={goal.id}
            goal={goal}
            onClick={() => onGoalClick?.(goal.id)}
          />
        ))}
      </div>

      {/* Action Panel */}
      <div className="p-6 bg-yellow-50 border-t border-yellow-200">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="text-sm text-yellow-900">
            <strong>Prioritization Tip:</strong> Focus on essential goals first. Consider increasing contributions, delaying target dates, or adjusting return assumptions for at-risk goals.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * At-Risk Goal Card Component
 */
interface AtRiskGoalCardProps {
  goal: AtRiskGoal;
  onClick?: () => void;
}

function AtRiskGoalCard({ goal, onClick }: AtRiskGoalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskLevel = (probability: number): { label: string; color: string } => {
    if (probability < 0.60) return { label: 'High Risk', color: 'text-red-600' };
    if (probability < 0.70) return { label: 'Medium Risk', color: 'text-orange-600' };
    return { label: 'Low Risk', color: 'text-yellow-600' };
  };

  const riskLevel = getRiskLevel(goal.successProbability || 0);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <button
          onClick={onClick}
          className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          <h4 className="text-base font-semibold text-gray-900 mb-2">{goal.title}</h4>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Success Probability</div>
              <div className={`text-sm font-semibold ${riskLevel.color}`}>
                {((goal.successProbability || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Shortfall</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(goal.shortfallAmount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Risk Level</div>
              <div className={`text-sm font-semibold ${riskLevel.color}`}>
                {riskLevel.label}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                style={{ width: `${(goal.successProbability || 0) * 100}%` }}
              />
            </div>
          </div>
        </button>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Recommendations */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Recommended Actions</h5>
          <ul className="space-y-2">
            {goal.recommendedActions.map((action, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{action}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onClick}
            className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            View Goal Details
          </button>
        </div>
      )}
    </div>
  );
}
