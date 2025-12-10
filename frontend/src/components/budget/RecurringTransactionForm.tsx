/**
 * RecurringTransactionForm Component
 *
 * Form for creating and editing recurring budget transactions.
 */

import React, { useState } from 'react';
import type { BudgetCategory, Frequency } from './BudgetForm';

export interface RecurringTransaction {
  id?: string;
  category: BudgetCategory;
  name: string;
  amount: number;
  frequency: Frequency;
  type: 'income' | 'expense' | 'savings';
  is_fixed: boolean;
  notes?: string;

  // Recurrence settings
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  auto_generate: boolean;
  days_ahead: number;

  // Reminders
  reminder_enabled: boolean;
  reminder_days_before?: number;
}

export interface RecurringTransactionFormProps {
  transaction?: RecurringTransaction | null;
  onSave: (transaction: RecurringTransaction) => void;
  onCancel: () => void;
}

export const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({
  transaction,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<RecurringTransaction>(
    transaction || {
      category: 'housing' as BudgetCategory,
      name: '',
      amount: 0,
      frequency: 'monthly',
      type: 'expense',
      is_fixed: true,
      start_date: new Date().toISOString().split('T')[0],
      auto_generate: true,
      days_ahead: 7,
      reminder_enabled: false,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (formData.end_date && formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.max_occurrences && formData.max_occurrences < 1) {
      newErrors.max_occurrences = 'Must be at least 1';
    }

    if (formData.reminder_enabled && (!formData.reminder_days_before || formData.reminder_days_before < 1)) {
      newErrors.reminder_days_before = 'Must be at least 1 day';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const handleChange = (field: keyof RecurringTransaction, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {transaction?.id ? 'Edit' : 'Create'} Recurring Transaction
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Monthly Rent, Weekly Groceries"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => handleChange('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="income">💰 Income</option>
                  <option value="expense">💳 Expense</option>
                  <option value="savings">🏦 Savings</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formData.type === 'income' && (
                    <>
                      <option value="salary">Salary</option>
                      <option value="wages">Wages</option>
                      <option value="bonus">Bonus</option>
                    </>
                  )}
                  {formData.type === 'expense' && (
                    <>
                      <option value="housing">Housing</option>
                      <option value="transportation">Transportation</option>
                      <option value="food_groceries">Groceries</option>
                      <option value="utilities">Utilities</option>
                      <option value="subscriptions">Subscriptions</option>
                    </>
                  )}
                  {formData.type === 'savings' && (
                    <>
                      <option value="retirement_contribution">Retirement</option>
                      <option value="emergency_fund">Emergency Fund</option>
                      <option value="investment_contribution">Investments</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_fixed"
                  checked={formData.is_fixed}
                  onChange={(e) => handleChange('is_fixed', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="is_fixed" className="text-sm text-gray-700">
                  Fixed amount (doesn't vary)
                </label>
              </div>
            </div>
          </div>

          {/* Schedule Settings */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Schedule</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => handleChange('end_date', e.target.value || undefined)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>}
                <p className="text-xs text-gray-600 mt-1">Leave empty for indefinite</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Occurrences (Optional)
                </label>
                <input
                  type="number"
                  value={formData.max_occurrences || ''}
                  onChange={(e) => handleChange('max_occurrences', e.target.value ? parseInt(e.target.value) : undefined)}
                  min="1"
                  placeholder="Unlimited"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.max_occurrences ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.max_occurrences && <p className="text-red-600 text-sm mt-1">{errors.max_occurrences}</p>}
                <p className="text-xs text-gray-600 mt-1">Stop after X occurrences</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generate Days Ahead
                </label>
                <input
                  type="number"
                  value={formData.days_ahead}
                  onChange={(e) => handleChange('days_ahead', parseInt(e.target.value) || 7)}
                  min="0"
                  max="90"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-600 mt-1">Create entries X days in advance</p>
              </div>

              <div className="col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="auto_generate"
                  checked={formData.auto_generate}
                  onChange={(e) => handleChange('auto_generate', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="auto_generate" className="text-sm text-gray-700">
                  Automatically generate entries (recommended)
                </label>
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Reminders</h3>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reminder_enabled"
                  checked={formData.reminder_enabled}
                  onChange={(e) => handleChange('reminder_enabled', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="reminder_enabled" className="text-sm text-gray-700">
                  Enable reminders for this recurring transaction
                </label>
              </div>

              {formData.reminder_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remind me days before
                  </label>
                  <input
                    type="number"
                    value={formData.reminder_days_before || ''}
                    onChange={(e) => handleChange('reminder_days_before', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="1"
                    max="30"
                    placeholder="3"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.reminder_days_before ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.reminder_days_before && <p className="text-red-600 text-sm mt-1">{errors.reminder_days_before}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about this recurring transaction..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {transaction?.id ? 'Update' : 'Create'} Recurring Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
