/**
 * BudgetForm Component
 *
 * Form for creating and managing budget entries.
 * Tracks income, expenses, and savings goals.
 */

import { useState } from 'react';

export interface BudgetEntry {
  id?: string;
  category: BudgetCategory;
  name: string;
  amount: number;
  frequency: Frequency;
  type: 'income' | 'expense' | 'savings';
  isFixed: boolean;
  notes?: string;
  startDate?: string;
  endDate?: string;
}

export type BudgetCategory =
  // Income categories
  | 'salary'
  | 'bonus'
  | 'investment_income'
  | 'rental_income'
  | 'other_income'
  // Expense categories
  | 'housing'
  | 'utilities'
  | 'transportation'
  | 'food'
  | 'healthcare'
  | 'insurance'
  | 'debt_payments'
  | 'entertainment'
  | 'shopping'
  | 'travel'
  | 'education'
  | 'childcare'
  | 'personal_care'
  | 'subscriptions'
  | 'gifts'
  | 'other_expense'
  // Savings categories
  | 'retirement_contribution'
  | 'emergency_fund'
  | 'goal_savings'
  | 'other_savings';

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'one_time';

export interface BudgetFormProps {
  entry?: BudgetEntry | null;
  onSubmit: (entryData: Partial<BudgetEntry>) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

interface FormData {
  category: BudgetCategory;
  name: string;
  amount: string;
  frequency: Frequency;
  type: 'income' | 'expense' | 'savings';
  isFixed: boolean;
  notes: string;
  startDate: string;
  endDate: string;
}

const INCOME_CATEGORIES: Record<string, { label: string; icon: string }> = {
  salary: { label: 'Salary/Wages', icon: '💰' },
  bonus: { label: 'Bonus', icon: '🎁' },
  investment_income: { label: 'Investment Income', icon: '📈' },
  rental_income: { label: 'Rental Income', icon: '🏠' },
  other_income: { label: 'Other Income', icon: '💵' },
};

const EXPENSE_CATEGORIES: Record<string, { label: string; icon: string }> = {
  housing: { label: 'Housing (Rent/Mortgage)', icon: '🏡' },
  utilities: { label: 'Utilities', icon: '💡' },
  transportation: { label: 'Transportation', icon: '🚗' },
  food: { label: 'Food & Groceries', icon: '🛒' },
  healthcare: { label: 'Healthcare', icon: '🏥' },
  insurance: { label: 'Insurance', icon: '🛡️' },
  debt_payments: { label: 'Debt Payments', icon: '💳' },
  entertainment: { label: 'Entertainment', icon: '🎬' },
  shopping: { label: 'Shopping', icon: '🛍️' },
  travel: { label: 'Travel', icon: '✈️' },
  education: { label: 'Education', icon: '📚' },
  childcare: { label: 'Childcare', icon: '👶' },
  personal_care: { label: 'Personal Care', icon: '💅' },
  subscriptions: { label: 'Subscriptions', icon: '📺' },
  gifts: { label: 'Gifts & Donations', icon: '🎁' },
  other_expense: { label: 'Other Expenses', icon: '📝' },
};

const SAVINGS_CATEGORIES: Record<string, { label: string; icon: string }> = {
  retirement_contribution: { label: 'Retirement Contribution', icon: '🏖️' },
  emergency_fund: { label: 'Emergency Fund', icon: '🚨' },
  goal_savings: { label: 'Goal Savings', icon: '🎯' },
  other_savings: { label: 'Other Savings', icon: '💰' },
};

const FREQUENCY_OPTIONS: Record<Frequency, { label: string; multiplier: number }> = {
  weekly: { label: 'Weekly', multiplier: 52 },
  biweekly: { label: 'Bi-weekly (Every 2 weeks)', multiplier: 26 },
  monthly: { label: 'Monthly', multiplier: 12 },
  quarterly: { label: 'Quarterly', multiplier: 4 },
  annual: { label: 'Annual', multiplier: 1 },
  one_time: { label: 'One-time', multiplier: 0 },
};

export function BudgetForm({ entry, onSubmit, onCancel, mode = 'create' }: BudgetFormProps) {
  const [formData, setFormData] = useState<FormData>({
    category: entry?.category || 'salary',
    name: entry?.name || '',
    amount: entry?.amount?.toString() || '',
    frequency: entry?.frequency || 'monthly',
    type: entry?.type || 'income',
    isFixed: entry?.isFixed ?? true,
    notes: entry?.notes || '',
    startDate: entry?.startDate ? new Date(entry.startDate).toISOString().split('T')[0] : '',
    endDate: entry?.endDate ? new Date(entry.endDate).toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const getCategoryOptions = () => {
    switch (formData.type) {
      case 'income':
        return INCOME_CATEGORIES;
      case 'expense':
        return EXPENSE_CATEGORIES;
      case 'savings':
        return SAVINGS_CATEGORIES;
      default:
        return INCOME_CATEGORIES;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const entryData: Partial<BudgetEntry> = {
        category: formData.category,
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        type: formData.type,
        isFixed: formData.isFixed,
        notes: formData.notes.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      if (entry?.id) {
        entryData.id = entry.id;
      }

      onSubmit(entryData);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense' | 'savings') => {
    updateField('type', newType);
    // Reset category to first option of new type
    const categories = Object.keys(
      newType === 'income'
        ? INCOME_CATEGORIES
        : newType === 'expense'
        ? EXPENSE_CATEGORIES
        : SAVINGS_CATEGORIES
    );
    updateField('category', categories[0]);
  };

  // Calculate annual amount
  const amount = parseFloat(formData.amount) || 0;
  const multiplier = FREQUENCY_OPTIONS[formData.frequency].multiplier;
  const annualAmount = formData.frequency === 'one_time' ? amount : amount * multiplier;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add Budget Entry' : 'Edit Budget Entry'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close form"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Entry Type *</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.type === 'income'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">💰</div>
                <div className="text-sm font-semibold">Income</div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.type === 'expense'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">💳</div>
                <div className="text-sm font-semibold">Expense</div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('savings')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.type === 'savings'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-sm font-semibold">Savings</div>
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Category *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {Object.entries(getCategoryOptions()).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateField('category', key)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    formData.category === key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{info.icon}</span>
                    <span className="text-sm font-medium">{info.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Entry Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Entry Details</h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={`e.g., ${
                  formData.type === 'income'
                    ? 'Monthly Salary'
                    : formData.type === 'expense'
                    ? 'Rent Payment'
                    : 'Emergency Fund'
                }`}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => updateField('frequency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(FREQUENCY_OPTIONS).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fixed vs Variable */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFixed}
                  onChange={(e) => updateField('isFixed', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Fixed Amount</span>
                  <p className="text-xs text-gray-500">
                    Check if this amount stays the same each period
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Optional Date Range */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Optional Date Range</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  min={formData.startDate}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Leave blank for ongoing entries. Use date range for temporary or seasonal entries.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Summary */}
          {amount > 0 && (
            <div
              className={`border-2 rounded-lg p-4 ${
                formData.type === 'income'
                  ? 'bg-green-50 border-green-200'
                  : formData.type === 'expense'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount per period:</span>
                  <span className="font-semibold">${amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-semibold">{FREQUENCY_OPTIONS[formData.frequency].label}</span>
                </div>
                {formData.frequency !== 'one_time' && (
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">Annual total:</span>
                    <span className="font-bold text-lg">${annualAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {mode === 'create' ? 'Add Entry' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
