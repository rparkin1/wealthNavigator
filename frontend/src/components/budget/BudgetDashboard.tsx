/**
 * BudgetDashboard Component
 *
 * Comprehensive budget tracking dashboard with:
 * - Income/Expense overview
 * - Category breakdown
 * - Cash flow analysis
 * - Spending trends
 * - Budget vs Actual comparison
 */

import { useState, useMemo } from 'react';
import type { BudgetEntry } from './BudgetForm';

interface BudgetDashboardProps {
  entries: BudgetEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: BudgetEntry) => void;
  onDeleteEntry: (id: string) => void;
}

interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
  entries: BudgetEntry[];
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  // Income
  salary: '#10B981',
  bonus: '#34D399',
  investment_income: '#6EE7B7',
  rental_income: '#A7F3D0',
  other_income: '#D1FAE5',

  // Expenses
  housing: '#EF4444',
  utilities: '#F87171',
  transportation: '#FCA5A5',
  food: '#FEE2E2',
  healthcare: '#DC2626',
  insurance: '#B91C1C',
  debt_payments: '#991B1B',
  entertainment: '#FCD34D',
  shopping: '#FDE047',
  travel: '#FBBF24',
  education: '#F59E0B',
  childcare: '#D97706',
  personal_care: '#B45309',
  subscriptions: '#92400E',
  gifts: '#78350F',
  other_expense: '#9CA3AF',

  // Savings
  retirement_contribution: '#3B82F6',
  emergency_fund: '#60A5FA',
  goal_savings: '#93C5FD',
  other_savings: '#DBEAFE',
};

const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  annual: 1,
  one_time: 0,
};

export function BudgetDashboard({ entries, onAddEntry, onEditEntry, onDeleteEntry }: BudgetDashboardProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'savings'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate totals
  const totals = useMemo(() => {
    const income = entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + (e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0)), 0);

    const expenses = entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + (e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0)), 0);

    const savings = entries
      .filter(e => e.type === 'savings')
      .reduce((sum, e) => sum + (e.amount * (FREQUENCY_MULTIPLIERS[e.frequency] || 0)), 0);

    const netIncome = income - expenses - savings;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;

    return {
      income,
      expenses,
      savings,
      netIncome,
      savingsRate,
      expenseRatio,
    };
  }, [entries]);

  // Group by category
  const categoryTotals = useMemo(() => {
    const grouped = new Map<string, CategoryTotal>();

    entries.forEach(entry => {
      const annual = entry.amount * (FREQUENCY_MULTIPLIERS[entry.frequency] || 0);

      if (!grouped.has(entry.category)) {
        grouped.set(entry.category, {
          category: entry.category,
          total: 0,
          percentage: 0,
          entries: [],
          color: CATEGORY_COLORS[entry.category] || '#9CA3AF',
        });
      }

      const cat = grouped.get(entry.category)!;
      cat.total += annual;
      cat.entries.push(entry);
    });

    // Calculate percentages
    const typeTotal = selectedType === 'all'
      ? totals.income + totals.expenses + totals.savings
      : selectedType === 'income'
        ? totals.income
        : selectedType === 'expense'
          ? totals.expenses
          : totals.savings;

    grouped.forEach(cat => {
      cat.percentage = typeTotal > 0 ? (cat.total / typeTotal) * 100 : 0;
    });

    return Array.from(grouped.values())
      .filter(cat => {
        if (selectedType === 'all') return true;
        const hasTypeEntry = cat.entries.some(e => e.type === selectedType);
        return hasTypeEntry;
      })
      .sort((a, b) => b.total - a.total);
  }, [entries, selectedType, totals]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.type === selectedType);
    }

    if (selectedCategory) {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    return filtered;
  }, [entries, selectedType, selectedCategory]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track income, expenses, and savings
            </p>
          </div>
          <button
            onClick={onAddEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Income */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Annual Income</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              ${totals.income.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {entries.filter(e => e.type === 'income').length} sources
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-900">Annual Expenses</span>
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              ${totals.expenses.toLocaleString()}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {totals.expenseRatio.toFixed(1)}% of income
            </p>
          </div>

          {/* Total Savings */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Annual Savings</span>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              ${totals.savings.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {totals.savingsRate.toFixed(1)}% savings rate
            </p>
          </div>

          {/* Net Income */}
          <div className={`border-2 rounded-lg p-4 ${
            totals.netIncome >= 0
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                totals.netIncome >= 0 ? 'text-emerald-900' : 'text-orange-900'
              }`}>
                Net Cash Flow
              </span>
              <span className="text-2xl">{totals.netIncome >= 0 ? '📈' : '📉'}</span>
            </div>
            <p className={`text-2xl font-bold ${
              totals.netIncome >= 0 ? 'text-emerald-700' : 'text-orange-700'
            }`}>
              {totals.netIncome >= 0 ? '+' : ''}${totals.netIncome.toLocaleString()}
            </p>
            <p className={`text-xs mt-1 ${
              totals.netIncome >= 0 ? 'text-emerald-600' : 'text-orange-600'
            }`}>
              {totals.netIncome >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </div>

          {/* Budget Health */}
          <div className={`border-2 rounded-lg p-4 ${
            totals.savingsRate >= 20
              ? 'bg-green-50 border-green-200'
              : totals.savingsRate >= 10
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${
                totals.savingsRate >= 20
                  ? 'text-green-900'
                  : totals.savingsRate >= 10
                    ? 'text-yellow-900'
                    : 'text-red-900'
              }`}>
                Budget Health
              </span>
              <span className="text-2xl">
                {totals.savingsRate >= 20 ? '✅' : totals.savingsRate >= 10 ? '⚠️' : '❌'}
              </span>
            </div>
            <p className={`text-2xl font-bold ${
              totals.savingsRate >= 20
                ? 'text-green-700'
                : totals.savingsRate >= 10
                  ? 'text-yellow-700'
                  : 'text-red-700'
            }`}>
              {totals.savingsRate >= 20 ? 'Excellent' : totals.savingsRate >= 10 ? 'Good' : 'Needs Work'}
            </p>
            <p className={`text-xs mt-1 ${
              totals.savingsRate >= 20
                ? 'text-green-600'
                : totals.savingsRate >= 10
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}>
              {totals.savingsRate >= 20
                ? 'Great savings!'
                : totals.savingsRate >= 10
                  ? 'On track'
                  : 'Increase savings'}
            </p>
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedCategory(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setSelectedType('income');
              setSelectedCategory(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💰 Income
          </button>
          <button
            onClick={() => {
              setSelectedType('expense');
              setSelectedCategory(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💳 Expenses
          </button>
          <button
            onClick={() => {
              setSelectedType('savings');
              setSelectedCategory(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'savings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 Savings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Category Breakdown
              </h3>

              {categoryTotals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No entries yet. Add budget entries to see breakdown.
                </p>
              ) : (
                <div className="space-y-2">
                  {categoryTotals.map(cat => (
                    <button
                      key={cat.category}
                      onClick={() => setSelectedCategory(
                        selectedCategory === cat.category ? null : cat.category
                      )}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCategory === cat.category
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {cat.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-bold" style={{ color: cat.color }}>
                          ${cat.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {cat.entries.length} {cat.entries.length === 1 ? 'entry' : 'entries'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Entries List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCategory
                    ? `${selectedCategory.replace(/_/g, ' ')} Entries`
                    : selectedType === 'all'
                      ? 'All Entries'
                      : `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Entries`
                  }
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredEntries.length})
                  </span>
                </h3>
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredEntries.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No entries found.</p>
                    <button
                      onClick={onAddEntry}
                      className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add your first entry
                    </button>
                  </div>
                ) : (
                  filteredEntries.map(entry => {
                    const annual = entry.amount * (FREQUENCY_MULTIPLIERS[entry.frequency] || 0);
                    const monthly = annual / 12;

                    return (
                      <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                entry.type === 'income'
                                  ? 'bg-green-100 text-green-700'
                                  : entry.type === 'expense'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                {entry.type}
                              </span>
                              {entry.isFixed && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                  Fixed
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 capitalize mb-2">
                              {entry.category.replace(/_/g, ' ')}
                            </p>

                            <div className="flex items-center space-x-4 text-sm">
                              <div>
                                <span className="text-gray-500">Amount: </span>
                                <span className="font-semibold text-gray-900">
                                  ${entry.amount.toLocaleString()} / {entry.frequency}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Monthly: </span>
                                <span className="font-semibold text-gray-900">
                                  ${monthly.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Annual: </span>
                                <span className="font-semibold text-gray-900">
                                  ${annual.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {entry.notes && (
                              <p className="text-sm text-gray-500 mt-2">{entry.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => onEditEntry(entry)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => entry.id && onDeleteEntry(entry.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
