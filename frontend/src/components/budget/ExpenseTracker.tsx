/**
 * ExpenseTracker Component
 *
 * Detailed expense tracking with categorization, trends, and insights.
 */

import React, { useState, useMemo } from 'react';
import type { BudgetEntry, Frequency } from './BudgetForm';

export interface ExpenseTrackerProps {
  entries: BudgetEntry[];
  onEditEntry: (entry: BudgetEntry) => void;
  onDeleteEntry: (id: string) => void;
}

// Frequency multipliers for annual calculation
const FREQUENCY_MULTIPLIERS: Record<Frequency, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  annual: 1,
  one_time: 0,
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  housing: '#EF4444',
  transportation: '#F59E0B',
  food_groceries: '#10B981',
  food_dining: '#14B8A6',
  utilities: '#6366F1',
  insurance: '#8B5CF6',
  healthcare: '#EC4899',
  personal_care: '#F97316',
  entertainment: '#06B6D4',
  shopping: '#84CC16',
  subscriptions: '#A855F7',
  education: '#3B82F6',
  childcare: '#EAB308',
  pet_care: '#22C55E',
  gifts_donations: '#F472B6',
  taxes: '#DC2626',
  debt_payment: '#991B1B',
  maintenance_repairs: '#EA580C',
  travel: '#0EA5E9',
  miscellaneous: '#64748B',
};

interface CategoryInsight {
  category: string;
  monthlyAverage: number;
  annualTotal: number;
  percentOfTotal: number;
  entryCount: number;
  isFixed: boolean;
  trend: 'stable' | 'increasing' | 'decreasing';
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'category' | 'date'>('amount');
  const [filterType, setFilterType] = useState<'all' | 'fixed' | 'variable'>('all');

  // Filter expense entries only
  const expenseEntries = useMemo(() => {
    return entries.filter(e => e.type === 'expense');
  }, [entries]);

  // Calculate category insights
  const categoryInsights = useMemo(() => {
    const categoryMap = new Map<string, CategoryInsight>();
    let totalAnnual = 0;

    expenseEntries.forEach(entry => {
      const annual = entry.amount * (FREQUENCY_MULTIPLIERS[entry.frequency] || 0);
      totalAnnual += annual;

      if (!categoryMap.has(entry.category)) {
        categoryMap.set(entry.category, {
          category: entry.category,
          monthlyAverage: 0,
          annualTotal: 0,
          percentOfTotal: 0,
          entryCount: 0,
          isFixed: entry.isFixed,
          trend: 'stable',
        });
      }

      const insight = categoryMap.get(entry.category)!;
      insight.annualTotal += annual;
      insight.entryCount += 1;
    });

    // Calculate percentages and monthly averages
    categoryMap.forEach(insight => {
      insight.monthlyAverage = insight.annualTotal / 12;
      insight.percentOfTotal = totalAnnual > 0 ? (insight.annualTotal / totalAnnual) * 100 : 0;
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.annualTotal - a.annualTotal);
  }, [expenseEntries]);

  // Calculate totals
  const totals = useMemo(() => {
    const annual = expenseEntries.reduce(
      (sum, e) => sum + e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0),
      0
    );
    const monthly = annual / 12;
    const fixed = expenseEntries
      .filter(e => e.isFixed)
      .reduce((sum, e) => sum + e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0), 0);
    const variable = annual - fixed;

    return { annual, monthly, fixed, variable };
  }, [expenseEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = expenseEntries;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // Filter by type
    if (filterType === 'fixed') {
      filtered = filtered.filter(e => e.isFixed);
    } else if (filterType === 'variable') {
      filtered = filtered.filter(e => !e.isFixed);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'amount') {
        const aAnnual = a.amount * (FREQUENCY_MULTIPLIERS[a.frequency] || 0);
        const bAnnual = b.amount * (FREQUENCY_MULTIPLIERS[b.frequency] || 0);
        return bAnnual - aAnnual;
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      } else if (sortBy === 'date') {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        return bDate - aDate;
      }
      return 0;
    });

    return filtered;
  }, [expenseEntries, selectedCategory, filterType, sortBy]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expense Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and analyze your spending patterns
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Monthly Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totals.monthly)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(totals.annual)} annually
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Fixed Expenses</div>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(totals.fixed / 12)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totals.annual > 0 ? ((totals.fixed / totals.annual) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Variable Expenses</div>
          <div className="text-2xl font-bold text-yellow-600">
            {formatCurrency(totals.variable / 12)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totals.annual > 0 ? ((totals.variable / totals.annual) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Categories</div>
          <div className="text-2xl font-bold text-gray-900">
            {categoryInsights.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {expenseEntries.length} total entries
          </div>
        </div>
      </div>

      {/* Category Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Spending by Category
        </h3>

        <div className="space-y-3">
          {categoryInsights.map(insight => (
            <div key={insight.category} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[insight.category] || '#64748B' }}
                    />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {insight.category.replace(/_/g, ' ')}
                    </span>
                    {insight.isFixed && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Fixed
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(insight.monthlyAverage)}/mo
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${insight.percentOfTotal}%`,
                        backgroundColor: CATEGORY_COLORS[insight.category] || '#64748B',
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-12 text-right">
                    {insight.percentOfTotal.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categoryInsights.map(insight => (
                <option key={insight.category} value={insight.category}>
                  {insight.category.replace(/_/g, ' ')} ({insight.entryCount})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('fixed')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  filterType === 'fixed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fixed
              </button>
              <button
                onClick={() => setFilterType('variable')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  filterType === 'variable'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Variable
              </button>
            </div>
          </div>

          {/* Sort By */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'amount' | 'category' | 'date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="amount">Amount (High to Low)</option>
              <option value="category">Category (A-Z)</option>
              <option value="date">Date (Newest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Expense Entries ({filteredEntries.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredEntries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No expenses match the current filters.</p>
            </div>
          ) : (
            filteredEntries.map(entry => {
              const annual = entry.amount * (FREQUENCY_MULTIPLIERS[entry.frequency] || 0);
              const monthly = annual / 12;

              return (
                <div key={entry.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: CATEGORY_COLORS[entry.category] || '#64748B',
                          }}
                        />
                        <h4 className="text-base font-medium text-gray-900">
                          {entry.name}
                        </h4>
                        {entry.isFixed && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            Fixed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="capitalize">
                          {entry.category.replace(/_/g, ' ')}
                        </span>
                        <span>•</span>
                        <span>{entry.frequency}</span>
                        {entry.startDate && (
                          <>
                            <span>•</span>
                            <span>
                              Started {new Date(entry.startDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      )}
                    </div>

                    <div className="flex items-start gap-4 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(entry.amount)}
                          <span className="text-sm font-normal text-gray-600">
                            /{entry.frequency === 'one_time' ? 'once' : entry.frequency}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(monthly)}/mo • {formatCurrency(annual)}/yr
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => entry.id && onDeleteEntry(entry.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
