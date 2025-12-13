/**
 * GoalDashboard Component (Redesigned)
 *
 * Main dashboard for displaying and managing financial goals.
 * - Professional filtering and sorting UI
 * - Loading states with skeletons
 * - Empty states with helpful messaging
 * - Responsive grid layout
 */

import { useState, useMemo } from 'react';
import { GoalCardRedesign } from './GoalCardRedesign';
import { GoalCardSkeleton } from './GoalCardSkeleton';
import { EmptyGoalsState } from './EmptyGoalsState';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import type { Goal, GoalCategory, GoalPriority, GoalStatus } from './GoalCardRedesign';

export interface GoalDashboardProps {
  goals: Goal[];
  loading?: boolean;
  onNewGoal: () => void;
  onEditGoal: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onViewDetails: (goalId: string) => void;
}

type SortOption = 'priority' | 'target_date' | 'progress' | 'amount';
type FilterCategory = GoalCategory | 'all';
type FilterPriority = GoalPriority | 'all';
type FilterStatus = GoalStatus | 'all';

export function GoalDashboardRedesign({
  goals,
  loading = false,
  onNewGoal,
  onEditGoal,
  onDeleteGoal,
  onViewDetails,
}: GoalDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = goals.length;
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalProgress = total > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    const onTrack = goals.filter((g) => g.status === 'on_track').length;
    const behind = goals.filter((g) => g.status === 'behind').length;
    const atRisk = goals.filter((g) => g.status === 'at_risk').length;
    const achieved = goals.filter((g) => g.status === 'achieved').length;

    const avgSuccessProbability =
      goals.filter((g) => g.successProbability !== undefined).length > 0
        ? goals.reduce((sum, g) => sum + (g.successProbability || 0), 0) /
          goals.filter((g) => g.successProbability !== undefined).length
        : 0;

    return {
      total,
      totalTarget,
      totalCurrent,
      totalProgress,
      onTrack,
      behind,
      atRisk,
      achieved,
      avgSuccessProbability,
    };
  }, [goals]);

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goals;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (goal) =>
          goal.title.toLowerCase().includes(query) ||
          goal.description?.toLowerCase().includes(query) ||
          goal.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((goal) => goal.category === filterCategory);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter((goal) => goal.priority === filterPriority);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((goal) => goal.status === filterStatus);
    }

    // Sort goals
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { essential: 0, important: 1, aspirational: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'target_date':
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        case 'progress': {
          const progressA = (a.currentAmount / a.targetAmount) * 100;
          const progressB = (b.currentAmount / b.targetAmount) * 100;
          return progressB - progressA; // Descending
        }
        case 'amount':
          return b.targetAmount - a.targetAmount; // Descending
        default:
          return 0;
      }
    });

    return sorted;
  }, [goals, searchQuery, sortBy, filterCategory, filterPriority, filterStatus]);

  const hasActiveFilters =
    searchQuery !== '' ||
    filterCategory !== 'all' ||
    filterPriority !== 'all' ||
    filterStatus !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterPriority('all');
    setFilterStatus('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Financial Goals</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage your path to financial independence
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onNewGoal}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          New Goal
        </Button>
      </div>

      {/* Summary Statistics */}
      {!loading && goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            label="Total Goals"
            value={stats.total.toString()}
            trend={undefined}
            variant="primary"
          />
          <StatCard
            label="Overall Progress"
            value={`${stats.totalProgress.toFixed(1)}%`}
            subtitle={`${formatCurrency(stats.totalCurrent)} / ${formatCurrency(stats.totalTarget)}`}
            trend={undefined}
            variant="success"
          />
          <StatCard
            label="On Track"
            value={stats.onTrack.toString()}
            subtitle={`${stats.behind} behind, ${stats.atRisk} at risk`}
            trend={undefined}
            variant="success"
          />
          <StatCard
            label="Avg. Success Rate"
            value={`${stats.avgSuccessProbability.toFixed(0)}%`}
            subtitle={`${stats.achieved} achieved`}
            trend={undefined}
            variant="primary"
          />
        </div>
      )}

      {/* Filters and Search */}
      {!loading && goals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 space-y-4">
          {/* Search and Sort Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-gray-700 mb-2 block uppercase tracking-wide">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-gray-700 mb-2 block uppercase tracking-wide">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
              >
                <option value="priority">Priority</option>
                <option value="target_date">Target Date</option>
                <option value="progress">Progress</option>
                <option value="amount">Amount</option>
              </select>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block uppercase tracking-wide">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
              >
                <option value="all">All Categories</option>
                <option value="retirement">Retirement</option>
                <option value="education">Education</option>
                <option value="home">Home Purchase</option>
                <option value="major_expense">Major Expense</option>
                <option value="emergency">Emergency</option>
                <option value="legacy">Legacy</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block uppercase tracking-wide">
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
              >
                <option value="all">All Priorities</option>
                <option value="essential">Essential</option>
                <option value="important">Important</option>
                <option value="aspirational">Aspirational</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block uppercase tracking-wide">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="on_track">On Track</option>
                <option value="behind">Behind</option>
                <option value="at_risk">At Risk</option>
                <option value="achieved">Achieved</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchQuery && (
                  <Badge variant="neutral" size="sm">
                    Search: "{searchQuery}"
                  </Badge>
                )}
                {filterCategory !== 'all' && (
                  <Badge variant="neutral" size="sm">
                    {filterCategory}
                  </Badge>
                )}
                {filterPriority !== 'all' && (
                  <Badge variant="neutral" size="sm">
                    {filterPriority}
                  </Badge>
                )}
                {filterStatus !== 'all' && (
                  <Badge variant="neutral" size="sm">
                    {filterStatus}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GoalCardSkeleton count={6} />
        </div>
      )}

      {/* Empty State */}
      {!loading && goals.length === 0 && (
        <EmptyGoalsState variant="no-goals" onCreateGoal={onNewGoal} />
      )}

      {/* No Results State */}
      {!loading && goals.length > 0 && filteredAndSortedGoals.length === 0 && (
        <EmptyGoalsState variant="no-results" onClearFilters={clearFilters} />
      )}

      {/* Goals Grid */}
      {!loading && filteredAndSortedGoals.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredAndSortedGoals.map((goal) => (
              <GoalCardRedesign
                key={goal.id}
                goal={goal}
                onEdit={onEditGoal}
                onDelete={onDeleteGoal}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>

          {/* Results Count */}
          <div className="text-center text-sm text-gray-600">
            Showing {filteredAndSortedGoals.length} of {goals.length} goal
            {goals.length !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down';
  variant: 'primary' | 'success' | 'warning' | 'error';
}

function StatCard({ label, value, subtitle, trend, variant }: StatCardProps) {
  const variantStyles = {
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    error: 'bg-error-50 text-error-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-3xl font-bold text-gray-900 font-mono">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend === 'up' ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {trend === 'up' ? '↑' : '↓'}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export default GoalDashboardRedesign;
