/**
 * GoalCard Component (Redesigned)
 *
 * Professional goal card following WealthNavigator UI redesign specifications.
 * - No emojis (replaced with professional SVG icons)
 * - Clean, scannable layout with generous whitespace
 * - Proper use of design system components
 * - Responsive and accessible
 */

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';
import { getCategoryIcon, getCategoryLabel, MoreIcon, CalendarIcon } from './icons/GoalIcons';

export type GoalCategory = 'retirement' | 'education' | 'home' | 'major_expense' | 'emergency' | 'legacy';
export type GoalPriority = 'essential' | 'important' | 'aspirational';
export type GoalStatus = 'on_track' | 'behind' | 'at_risk' | 'achieved';

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution?: number;
  successProbability?: number;
  status: GoalStatus;
  description?: string;
}

export interface GoalCardProps {
  goal: Goal;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  onViewDetails?: (goalId: string) => void;
  compact?: boolean;
}

export function GoalCardRedesign({
  goal,
  onEdit,
  onDelete,
  onViewDetails,
  compact = false,
}: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
  const yearsRemaining = Math.floor(monthsRemaining / 12);

  // Status configuration
  const statusConfig = {
    on_track: { variant: 'success' as const, label: 'On Track' },
    behind: { variant: 'warning' as const, label: 'Behind' },
    at_risk: { variant: 'error' as const, label: 'At Risk' },
    achieved: { variant: 'neutral' as const, label: 'Achieved' },
  };

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

  if (compact) {
    return (
      <Card
        variant="default"
        padding="md"
        hoverable
        onClick={() => onViewDetails?.(goal.id)}
        className="cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 text-primary-600">
              {getCategoryIcon(goal.category, { size: 24 })}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
              <p className="text-sm text-gray-600">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          </div>
          <Badge {...statusConfig[goal.status]} size="sm" />
        </div>
        <div className="mt-3">
          <ProgressBar
            value={progress}
            max={100}
            color={progressColor[goal.status]}
            height="sm"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="none" hoverable onClick={() => onViewDetails?.(goal.id)}>
      {/* Header */}
      <CardHeader
        title={
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-primary-600">
              {getCategoryIcon(goal.category, { size: 24 })}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{goal.title}</h3>
              <p className="text-sm text-gray-600">{getCategoryLabel(goal.category)}</p>
            </div>
          </div>
        }
        badge={<Badge {...priorityConfig[goal.priority]} size="sm" />}
        action={
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Goal actions"
            >
              <MoreIcon size={20} className="text-gray-600" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {onViewDetails && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(goal.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-lg"
                    >
                      View Details
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(goal.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit Goal
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(goal.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 transition-colors last:rounded-b-lg"
                    >
                      Delete Goal
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Content */}
      <CardContent>
        {/* Description */}
        {goal.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{goal.description}</p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-gray-900 font-mono">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="text-sm text-gray-500">
              / {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <ProgressBar
            value={progress}
            max={100}
            showPercentage
            color={progressColor[goal.status]}
            height="md"
          />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <CalendarIcon size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">Target Date</span>
            </div>
            <p className="font-medium text-gray-900">{formatDate(goal.targetDate)}</p>
            <p className="text-xs text-gray-500">
              ({yearsRemaining > 0
                ? `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''}`
                : `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''}`})
            </p>
          </div>
          {goal.monthlyContribution && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                Monthly
              </span>
              <p className="font-medium text-gray-900 font-mono">
                {formatCurrency(goal.monthlyContribution)}
              </p>
            </div>
          )}
        </div>

        {/* Success Probability */}
        {goal.successProbability !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success Probability</span>
              <span
                className={`text-sm font-semibold font-mono ${
                  goal.successProbability >= 80
                    ? 'text-success-600'
                    : goal.successProbability >= 60
                    ? 'text-warning-600'
                    : 'text-error-600'
                }`}
              >
                {goal.successProbability.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter>
        <Badge {...statusConfig[goal.status]} size="md" />
        <div className="flex-1" />
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(goal.id);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Format currency with compact notation for large amounts
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
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
