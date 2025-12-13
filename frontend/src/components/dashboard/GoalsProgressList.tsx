/**
 * GoalsProgressList Component
 * Displays top 3 goals with progress bars and status badges
 * Part of Phase 2 - Week 4: Dashboard Redesign
 */

import { Card } from '../ui/Card';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';

export interface Goal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  status: 'on_track' | 'behind' | 'at_risk' | 'achieved';
  priority: 'essential' | 'important' | 'aspirational';
}

export interface GoalsProgressListProps {
  goals: Goal[];
  onViewAll?: () => void;
  onViewGoal?: (goalId: string) => void;
  className?: string;
}

const statusConfig = {
  on_track: { variant: 'success' as const, label: 'On Track' },
  behind: { variant: 'warning' as const, label: 'Behind' },
  at_risk: { variant: 'error' as const, label: 'At Risk' },
  achieved: { variant: 'neutral' as const, label: 'Achieved' },
};

export function GoalsProgressList({
  goals,
  onViewAll,
  onViewGoal,
  className = '',
}: GoalsProgressListProps) {
  // Take top 3 goals
  const topGoals = goals.slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Goals Progress</h3>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View All Goals →
            </button>
          )}
        </div>

        {/* Goals List */}
        {topGoals.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-500 mb-2">No goals yet</p>
            <p className="text-sm text-gray-400">Create your first financial goal to get started</p>
          </div>
        ) : (
          <div className="space-y-5">
            {topGoals.map((goal) => {
              const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
              const statusInfo = statusConfig[goal.status];

              return (
                <div
                  key={goal.id}
                  className={`${
                    onViewGoal ? 'cursor-pointer hover:bg-gray-50' : ''
                  } p-4 rounded-lg border border-gray-200 transition-colors`}
                  onClick={() => onViewGoal?.(goal.id)}
                  role={onViewGoal ? 'button' : undefined}
                  tabIndex={onViewGoal ? 0 : undefined}
                >
                  {/* Goal header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{goal.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusInfo.variant} size="sm">
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <ProgressBar
                      value={progress}
                      max={100}
                      color={goal.status === 'on_track' || goal.status === 'achieved' ? 'success' : 'warning'}
                      showPercentage={false}
                      height="md"
                      className="mb-2"
                    />
                  </div>

                  {/* Amount and percentage */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium text-gray-900">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * GoalsProgressListSkeleton - Loading state
 */
export function GoalsProgressListSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse mb-3" />
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
