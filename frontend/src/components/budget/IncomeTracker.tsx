/**
 * IncomeTracker Component
 *
 * Detailed income tracking with source analysis and projections.
 */

import React, { useState, useMemo } from 'react';
import type { BudgetEntry, Frequency } from './BudgetForm';

export interface IncomeTrackerProps {
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
  salary: '#10B981',
  wages: '#059669',
  bonus: '#34D399',
  commission: '#6EE7B7',
  self_employment: '#10B981',
  business_income: '#047857',
  freelance: '#065F46',
  rental_income: '#14B8A6',
  investment_income: '#0D9488',
  dividends: '#0F766E',
  interest: '#115E59',
  capital_gains: '#134E4A',
  social_security: '#3B82F6',
  pension: '#2563EB',
  annuity: '#1D4ED8',
  government_benefits: '#1E40AF',
  child_support: '#1E3A8A',
  alimony: '#172554',
  tax_refund: '#8B5CF6',
  gifts: '#F472B6',
  other_income: '#64748B',
};

interface IncomeSource {
  category: string;
  monthlyAverage: number;
  annualTotal: number;
  percentOfTotal: number;
  entryCount: number;
  isRecurring: boolean;
  reliability: 'stable' | 'variable' | 'uncertain';
}

export const IncomeTracker: React.FC<IncomeTrackerProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'category' | 'date'>('amount');
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'one_time'>('all');

  // Filter income entries only
  const incomeEntries = useMemo(() => {
    return entries.filter(e => e.type === 'income');
  }, [entries]);

  // Calculate income sources
  const incomeSources = useMemo(() => {
    const sourceMap = new Map<string, IncomeSource>();
    let totalAnnual = 0;

    incomeEntries.forEach(entry => {
      const annual = entry.amount * (FREQUENCY_MULTIPLIERS[entry.frequency] || 0);
      totalAnnual += annual;

      if (!sourceMap.has(entry.category)) {
        sourceMap.set(entry.category, {
          category: entry.category,
          monthlyAverage: 0,
          annualTotal: 0,
          percentOfTotal: 0,
          entryCount: 0,
          isRecurring: entry.frequency !== 'one_time',
          reliability: entry.isFixed ? 'stable' : 'variable',
        });
      }

      const source = sourceMap.get(entry.category)!;
      source.annualTotal += annual;
      source.entryCount += 1;
    });

    // Calculate percentages and monthly averages
    sourceMap.forEach(source => {
      source.monthlyAverage = source.annualTotal / 12;
      source.percentOfTotal = totalAnnual > 0 ? (source.annualTotal / totalAnnual) * 100 : 0;
    });

    return Array.from(sourceMap.values()).sort((a, b) => b.annualTotal - a.annualTotal);
  }, [incomeEntries]);

  // Calculate totals
  const totals = useMemo(() => {
    const annual = incomeEntries.reduce(
      (sum, e) => sum + e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0),
      0
    );
    const monthly = annual / 12;
    const recurring = incomeEntries
      .filter(e => e.frequency !== 'one_time')
      .reduce((sum, e) => sum + e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0), 0);
    const oneTime = incomeEntries
      .filter(e => e.frequency === 'one_time')
      .reduce((sum, e) => sum + e.amount, 0);
    const stable = incomeEntries
      .filter(e => e.isFixed)
      .reduce((sum, e) => sum + e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0), 0);

    return { annual, monthly, recurring, oneTime, stable };
  }, [incomeEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = incomeEntries;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // Filter by type
    if (filterType === 'recurring') {
      filtered = filtered.filter(e => e.frequency !== 'one_time');
    } else if (filterType === 'one_time') {
      filtered = filtered.filter(e => e.frequency === 'one_time');
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
  }, [incomeEntries, selectedCategory, filterType, sortBy]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getReliabilityColor = (reliability: string): string => {
    switch (reliability) {
      case 'stable':
        return 'text-green-600 bg-green-100';
      case 'variable':
        return 'text-yellow-600 bg-yellow-100';
      case 'uncertain':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Income Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and analyze your income sources
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Monthly Income</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.monthly)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatCurrency(totals.annual)} annually
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Recurring Income</div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totals.recurring / 12)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totals.annual > 0 ? ((totals.recurring / totals.annual) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Stable Income</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totals.stable / 12)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totals.annual > 0 ? ((totals.stable / totals.annual) * 100).toFixed(1) : 0}% reliable
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Income Sources</div>
          <div className="text-2xl font-bold text-gray-900">
            {incomeSources.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {incomeEntries.length} total entries
          </div>
        </div>
      </div>

      {/* Income Sources */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Income by Source
        </h3>

        <div className="space-y-3">
          {incomeSources.map(source => (
            <div key={source.category} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[source.category] || '#64748B' }}
                    />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {source.category.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getReliabilityColor(source.reliability)}`}>
                      {source.reliability}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(source.monthlyAverage)}/mo
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${source.percentOfTotal}%`,
                        backgroundColor: CATEGORY_COLORS[source.category] || '#64748B',
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-12 text-right">
                    {source.percentOfTotal.toFixed(1)}%
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
              {incomeSources.map(source => (
                <option key={source.category} value={source.category}>
                  {source.category.replace(/_/g, ' ')} ({source.entryCount})
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
                onClick={() => setFilterType('recurring')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  filterType === 'recurring'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Recurring
              </button>
              <button
                onClick={() => setFilterType('one_time')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  filterType === 'one_time'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                One-Time
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

      {/* Income List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Income Entries ({filteredEntries.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredEntries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No income matches the current filters.</p>
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
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                            Stable
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
                        <div className="text-lg font-bold text-green-600">
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
