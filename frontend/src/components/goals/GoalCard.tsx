/**
 * GoalCard Component
 *
 * Displays an individual financial goal with progress visualization,
 * status indicators, and action menu.
 */

import { useState } from 'react';

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

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onViewDetails,
  compact = false,
}: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
  const yearsRemaining = Math.floor(monthsRemaining / 12);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(goal.id);
      setShowDeleteConfirm(false);
    }
  };

  if (compact) {
    return (
      <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{goal.title}</h3>
              <p className="text-sm text-gray-600">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          </div>
          <StatusBadge status={goal.status} />
        </div>
        <div className="mt-3">
          <ProgressBar progress={progress} status={goal.status} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <span className="text-3xl">{getCategoryIcon(goal.category)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
              <p className="text-sm text-gray-600">{getCategoryLabel(goal.category)}</p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Goal actions"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {onViewDetails && (
                  <button
                    onClick={() => {
                      onViewDetails(goal.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(goal.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    Edit Goal
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete Goal
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center space-x-2 mb-4">
          <PriorityBadge priority={goal.priority} />
          <StatusBadge status={goal.status} />
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-gray-900">{progress.toFixed(1)}%</span>
          </div>
          <ProgressBar progress={progress} status={goal.status} />
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(goal.currentAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Target</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {yearsRemaining > 0 ? `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} remaining` : `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''} remaining`}
            </span>
          </div>
          {goal.monthlyContribution && (
            <span className="text-blue-600 font-medium">
              {formatCurrency(goal.monthlyContribution)}/mo
            </span>
          )}
        </div>

        {/* Success Probability */}
        {goal.successProbability !== undefined && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success Probability</span>
              <span className={`text-sm font-semibold ${
                goal.successProbability >= 80 ? 'text-green-600' :
                goal.successProbability >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {goal.successProbability.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Goal?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{goal.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Progress Bar Component
 */
function ProgressBar({ progress, status }: { progress: number; status: GoalStatus }) {
  const getProgressColor = () => {
    if (status === 'achieved') return 'bg-green-500';
    if (status === 'on_track') return 'bg-blue-500';
    if (status === 'behind') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${getProgressColor()} transition-all duration-300`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: GoalStatus }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'on_track':
        return { label: 'On Track', className: 'bg-green-100 text-green-800' };
      case 'behind':
        return { label: 'Behind', className: 'bg-yellow-100 text-yellow-800' };
      case 'at_risk':
        return { label: 'At Risk', className: 'bg-red-100 text-red-800' };
      case 'achieved':
        return { label: 'Achieved', className: 'bg-blue-100 text-blue-800' };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

/**
 * Priority Badge Component
 */
function PriorityBadge({ priority }: { priority: GoalPriority }) {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'essential':
        return { label: 'Essential', className: 'bg-red-100 text-red-800', icon: '🔴' };
      case 'important':
        return { label: 'Important', className: 'bg-orange-100 text-orange-800', icon: '🟠' };
      case 'aspirational':
        return { label: 'Aspirational', className: 'bg-blue-100 text-blue-800', icon: '🔵' };
    }
  };

  const config = getPriorityConfig();

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${config.className} flex items-center space-x-1`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Get category icon emoji
 */
function getCategoryIcon(category: GoalCategory): string {
  const icons: Record<GoalCategory, string> = {
    retirement: '🏖️',
    education: '🎓',
    home: '🏠',
    major_expense: '💰',
    emergency: '🚨',
    legacy: '🌟',
  };
  return icons[category];
}

/**
 * Get category label
 */
function getCategoryLabel(category: GoalCategory): string {
  const labels: Record<GoalCategory, string> = {
    retirement: 'Retirement',
    education: 'Education',
    home: 'Home Purchase',
    major_expense: 'Major Expense',
    emergency: 'Emergency Fund',
    legacy: 'Legacy Planning',
  };
  return labels[category];
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
