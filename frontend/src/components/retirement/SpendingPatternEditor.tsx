/**
 * SpendingPatternEditor Component
 *
 * Configure retirement spending patterns across different phases.
 */

import { useState } from 'react';

interface MajorExpense {
  year: number;
  amount: number;
  description: string;
}

interface SpendingPattern {
  baseAnnualSpending: number;
  goGoMultiplier: number;
  slowGoMultiplier: number;
  noGoMultiplier: number;
  healthcareAnnual: number;
  healthcareGrowthRate: number;
  majorExpenses: MajorExpense[];
}

interface SpendingPatternEditorProps {
  onChange: (pattern: SpendingPattern) => void;
  defaultPattern?: Partial<SpendingPattern>;
  currentAge?: number;
}

const DEFAULT_PATTERN: SpendingPattern = {
  baseAnnualSpending: 60000,
  goGoMultiplier: 1.0,
  slowGoMultiplier: 0.85,
  noGoMultiplier: 0.75,
  healthcareAnnual: 10000,
  healthcareGrowthRate: 0.06,
  majorExpenses: []
};

export function SpendingPatternEditor({
  onChange,
  defaultPattern = {},
  currentAge = 65
}: SpendingPatternEditorProps) {
  const [pattern, setPattern] = useState<SpendingPattern>({
    ...DEFAULT_PATTERN,
    ...defaultPattern
  });

  const [newExpense, setNewExpense] = useState<MajorExpense>({
    year: currentAge + 5,
    amount: 10000,
    description: ''
  });

  const updatePattern = (key: keyof SpendingPattern, value: any) => {
    const updated = { ...pattern, [key]: value };
    setPattern(updated);
    onChange(updated);
  };

  const addMajorExpense = () => {
    if (newExpense.description.trim()) {
      const updated = {
        ...pattern,
        majorExpenses: [...pattern.majorExpenses, { ...newExpense }]
      };
      setPattern(updated);
      onChange(updated);

      // Reset form
      setNewExpense({
        year: currentAge + 5,
        amount: 10000,
        description: ''
      });
    }
  };

  const removeMajorExpense = (index: number) => {
    const updated = {
      ...pattern,
      majorExpenses: pattern.majorExpenses.filter((_, i) => i !== index)
    };
    setPattern(updated);
    onChange(updated);
  };

  const calculateProjectedSpending = (age: number): number => {
    let multiplier = 1.0;
    if (age >= 85) multiplier = pattern.noGoMultiplier;
    else if (age >= 75) multiplier = pattern.slowGoMultiplier;
    else multiplier = pattern.goGoMultiplier;

    return pattern.baseAnnualSpending * multiplier + pattern.healthcareAnnual;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Retirement Spending Pattern
        </h3>
        <p className="text-sm text-gray-600">
          Configure spending across retirement phases
        </p>
      </div>

      {/* Base Spending */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base Annual Spending
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            value={pattern.baseAnnualSpending}
            onChange={(e) => updatePattern('baseAnnualSpending', parseFloat(e.target.value))}
            min={0}
            step={1000}
            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Your core retirement expenses (excluding healthcare)
        </p>
      </div>

      {/* Spending Phases */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Spending by Life Phase</h4>

        {/* Go-Go Years */}
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-green-900">Go-Go Years (60-75)</div>
              <div className="text-xs text-green-700">Active retirement, travel, hobbies</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-900">
                {(pattern.goGoMultiplier * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <input
            type="range"
            value={pattern.goGoMultiplier * 100}
            onChange={(e) => updatePattern('goGoMultiplier', parseFloat(e.target.value) / 100)}
            min={50}
            max={150}
            step={5}
            className="w-full"
          />
          <div className="text-xs text-gray-600 mt-1">
            Projected: {formatCurrency(calculateProjectedSpending(65))}
          </div>
        </div>

        {/* Slow-Go Years */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-yellow-900">Slow-Go Years (75-85)</div>
              <div className="text-xs text-yellow-700">Less active, reduced travel</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-yellow-900">
                {(pattern.slowGoMultiplier * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <input
            type="range"
            value={pattern.slowGoMultiplier * 100}
            onChange={(e) => updatePattern('slowGoMultiplier', parseFloat(e.target.value) / 100)}
            min={50}
            max={150}
            step={5}
            className="w-full"
          />
          <div className="text-xs text-gray-600 mt-1">
            Projected: {formatCurrency(calculateProjectedSpending(80))}
          </div>
        </div>

        {/* No-Go Years */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-orange-900">No-Go Years (85+)</div>
              <div className="text-xs text-orange-700">Minimal activity, more care needs</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-orange-900">
                {(pattern.noGoMultiplier * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <input
            type="range"
            value={pattern.noGoMultiplier * 100}
            onChange={(e) => updatePattern('noGoMultiplier', parseFloat(e.target.value) / 100)}
            min={50}
            max={150}
            step={5}
            className="w-full"
          />
          <div className="text-xs text-gray-600 mt-1">
            Projected: {formatCurrency(calculateProjectedSpending(90))}
          </div>
        </div>
      </div>

      {/* Healthcare */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900">Healthcare Costs</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Healthcare
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={pattern.healthcareAnnual}
                onChange={(e) => updatePattern('healthcareAnnual', parseFloat(e.target.value))}
                min={0}
                step={500}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Healthcare Inflation
            </label>
            <div className="relative">
              <input
                type="number"
                value={(pattern.healthcareGrowthRate * 100).toFixed(1)}
                onChange={(e) => updatePattern('healthcareGrowthRate', parseFloat(e.target.value) / 100)}
                min={0}
                max={15}
                step={0.1}
                className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Major Expenses */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900">One-Time Major Expenses</h4>

        {/* Existing expenses */}
        {pattern.majorExpenses.length > 0 && (
          <div className="space-y-2">
            {pattern.majorExpenses.map((expense, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                  <div className="text-xs text-gray-600">
                    Age {expense.year} • {formatCurrency(expense.amount)}
                  </div>
                </div>
                <button
                  onClick={() => removeMajorExpense(index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new expense */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3">
            <input
              type="number"
              value={newExpense.year}
              onChange={(e) => setNewExpense({ ...newExpense, year: parseInt(e.target.value) })}
              placeholder="Age"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="col-span-3">
            <input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
              placeholder="Amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="col-span-4">
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="Description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={addMajorExpense}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
