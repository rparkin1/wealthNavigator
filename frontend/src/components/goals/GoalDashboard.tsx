/**
 * GoalDashboard Component
 *
 * Main dashboard for displaying and managing all financial goals.
 * Includes filtering, sorting, summary statistics, and grid layout.
 */

import { useState, useMemo } from 'react';
import { GoalCard } from './GoalCard';
import type { Goal, GoalCategory, GoalPriority, GoalStatus } from './GoalCard';

export interface GoalDashboardProps {
  goals: Goal[];
  onNewGoal: () => void;
  onEditGoal: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onViewDetails: (goalId: string) => void;
}

type SortOption = 'priority' | 'target_date' | 'progress' | 'amount';
type FilterCategory = GoalCategory | 'all';
type FilterPriority = GoalPriority | 'all';
type FilterStatus = GoalStatus | 'all';

export function GoalDashboard({
  goals,
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Financial Goals</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage your financial planning goals
          </p>
        </div>
        <button
          onClick={onNewGoal}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Goal</span>
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Goals"
          value={stats.total}
          icon="📊"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Overall Progress"
          value={`${stats.totalProgress.toFixed(1)}%`}
          subtitle={`${formatCurrency(stats.totalCurrent)} / ${formatCurrency(stats.totalTarget)}`}
          icon="📈"
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="On Track"
          value={stats.onTrack}
          subtitle={`${stats.behind} behind, ${stats.atRisk} at risk`}
          icon="✅"
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Avg. Success Rate"
          value={`${stats.avgSuccessProbability.toFixed(0)}%`}
          subtitle={`${stats.achieved} achieved`}
          icon="🎯"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Search</label>
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            <label className="text-xs font-medium text-gray-700 mb-1 block">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="essential">Essential</option>
              <option value="important">Important</option>
              <option value="aspirational">Aspirational</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="on_track">On Track</option>
              <option value="behind">Behind</option>
              <option value="at_risk">At Risk</option>
              <option value="achieved">Achieved</option>
            </select>
          </div>
        </div>

        {/* Sort and Clear Filters */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="priority">Priority</option>
              <option value="target_date">Target Date</option>
              <option value="progress">Progress</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Goals Grid */}
      {filteredAndSortedGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {hasActiveFilters ? 'No matching goals' : 'No goals yet'}
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query'
              : 'Start planning your financial future by creating your first goal'}
          </p>
          {!hasActiveFilters && (
            <button onClick={onNewGoal} className="btn-primary">
              Create Your First Goal
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={onEditGoal}
                onDelete={onDeleteGoal}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>

          {/* Results Count */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredAndSortedGoals.length} of {goals.length} goals
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
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`text-3xl p-2 rounded-lg ${color}`}>
          {icon}
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
