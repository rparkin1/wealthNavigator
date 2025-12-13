/**
 * GoalDetailView Component
 *
 * Main goal detail view with tabbed interface for:
 * - Projection: Monte Carlo simulation results
 * - What-If: Interactive scenario analysis
 * - Funding: Account allocation and tax strategy
 * - History: Goal changes and analysis history
 *
 * Following UI Redesign specifications - Week 8
 */

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import ProgressBar from '../../ui/ProgressBar';
import { getCategoryIcon, getCategoryLabel, CalendarIcon, EditIcon, BackIcon } from '../icons/GoalIcons';
import { TabNavigation } from './TabNavigation';
import { ProjectionTab } from './ProjectionTab';
import type { Goal } from '../../../types/goal';
import type { MonteCarloSimulation } from '../../../types/simulation';

export type GoalDetailTab = 'projection' | 'what-if' | 'funding' | 'history';

export interface GoalDetailViewProps {
  goal: Goal;
  simulation?: MonteCarloSimulation;
  onEdit?: (goalId: string) => void;
  onBack?: () => void;
  onRunSimulation?: (goalId: string) => void;
}

export function GoalDetailView({
  goal,
  simulation,
  onEdit,
  onBack,
  onRunSimulation,
}: GoalDetailViewProps) {
  const [activeTab, setActiveTab] = useState<GoalDetailTab>('projection');

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
  const yearsRemaining = Math.floor(monthsRemaining / 12);

  // Priority configuration
  const priorityConfig = {
    essential: { variant: 'error' as const, label: 'Essential' },
    important: { variant: 'warning' as const, label: 'Important' },
    aspirational: { variant: 'primary' as const, label: 'Aspirational' },
  };

  // Progress bar color based on status
  const progressColor = {
    on_track: 'success' as const,
    behind: 'warning' as const,
    at_risk: 'error' as const,
    achieved: 'success' as const,
  };

  const tabs = [
    { id: 'projection' as const, label: 'Projection', enabled: true },
    { id: 'what-if' as const, label: 'What-If', enabled: true },
    { id: 'funding' as const, label: 'Funding', enabled: true },
    { id: 'history' as const, label: 'History', enabled: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb / Back Navigation */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <BackIcon size={16} />
          <span>Back to Goals</span>
        </button>
      </div>

      {/* Goal Header Card */}
      <Card variant="default" padding="none" className="mb-6">
        <CardHeader
          title={
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 text-primary-600">
                {getCategoryIcon(goal.category, { size: 28 })}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>
                <p className="text-sm text-gray-600 mt-1">{getCategoryLabel(goal.category)}</p>
              </div>
            </div>
          }
          badge={<Badge {...priorityConfig[goal.priority]} size="md" />}
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<EditIcon size={16} />}
              onClick={() => onEdit?.(goal.id)}
            >
              Edit Goal
            </Button>
          }
        />

        <CardContent>
          {/* Description */}
          {goal.description && (
            <p className="text-base text-gray-600 mb-6">{goal.description}</p>
          )}

          {/* Progress Section */}
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                  Current Progress
                </span>
                <span className="text-4xl font-bold text-gray-900 font-mono">
                  {formatCurrency(goal.currentAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                  Target Amount
                </span>
                <span className="text-2xl font-semibold text-gray-600 font-mono">
                  {formatCurrency(goal.targetAmount)}
                </span>
              </div>
            </div>
            <ProgressBar
              value={progress}
              max={100}
              showPercentage
              color={progressColor[goal.status]}
              height="lg"
            />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Target Date */}
            <div>
              <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                <CalendarIcon size={16} />
                <span className="text-xs font-medium uppercase tracking-wide">Target Date</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatDate(goal.targetDate)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {yearsRemaining > 0
                  ? `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining`
                  : `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''} remaining`}
              </p>
            </div>

            {/* Monthly Contribution */}
            {goal.monthlyContribution && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                  Required Monthly
                </span>
                <p className="text-lg font-semibold text-gray-900 font-mono">
                  {formatCurrency(goal.monthlyContribution)}
                </p>
                <p className="text-sm text-gray-600 mt-1">per month</p>
              </div>
            )}

            {/* Success Probability */}
            {goal.successProbability !== undefined && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                  Success Probability
                </span>
                <p
                  className={`text-lg font-bold font-mono ${
                    goal.successProbability >= 80
                      ? 'text-success-600'
                      : goal.successProbability >= 60
                      ? 'text-warning-600'
                      : 'text-error-600'
                  }`}
                >
                  {goal.successProbability.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {goal.successProbability >= 80
                    ? 'High confidence'
                    : goal.successProbability >= 60
                    ? 'Moderate confidence'
                    : 'Low confidence'}
                </p>
              </div>
            )}

            {/* Time to Goal */}
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                Time Horizon
              </span>
              <p className="text-lg font-semibold text-gray-900">
                {yearsRemaining > 0 ? `${yearsRemaining} years` : `${monthsRemaining} months`}
              </p>
              <p className="text-sm text-gray-600 mt-1">until {new Date(goal.targetDate).getFullYear()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Card variant="default" padding="none">
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <CardContent>
          {activeTab === 'projection' && (
            <ProjectionTab
              goal={goal}
              simulation={simulation}
              onRunSimulation={onRunSimulation}
            />
          )}

          {activeTab === 'what-if' && (
            <div className="py-12 text-center text-gray-600">
              <p className="text-lg font-medium mb-2">What-If Analysis</p>
              <p className="text-sm">Interactive scenario analysis coming soon...</p>
            </div>
          )}

          {activeTab === 'funding' && (
            <div className="py-12 text-center text-gray-600">
              <p className="text-lg font-medium mb-2">Funding Strategy</p>
              <p className="text-sm">Account allocation and tax optimization coming soon...</p>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="py-12 text-center text-gray-600">
              <p className="text-lg font-medium mb-2">Goal History</p>
              <p className="text-sm">Changes and analysis history coming soon...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Format currency with compact notation for large amounts
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date as MMM D, YYYY
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate months remaining until target date
 */
function calculateMonthsRemaining(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - now.getTime();
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return Math.max(0, diffMonths);
}
