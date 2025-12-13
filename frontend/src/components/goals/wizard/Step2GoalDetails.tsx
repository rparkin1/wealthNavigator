/**
 * Step 2: Goal Details
 * Week 11 - UI Redesign Phase 3
 *
 * Form for name, target amount, date, current savings, and priority
 */

import React from 'react';
import type { GoalPriority, ValidationErrors, WizardFormData } from './types';
import { PRIORITY_INFO, GOAL_CATEGORIES } from './constants';

interface Step2GoalDetailsProps {
  formData: WizardFormData;
  errors: ValidationErrors;
  onChange: (field: keyof WizardFormData, value: any) => void;
}

export const Step2GoalDetails: React.FC<Step2GoalDetailsProps> = ({
  formData,
  errors,
  onChange,
}) => {
  const categoryInfo = formData.category ? GOAL_CATEGORIES[formData.category] : null;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateWithdrawalRate = (amount: number): string => {
    const annualIncome = amount * 0.04;
    return formatCurrency(annualIncome);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Tell us about your {categoryInfo?.label.toLowerCase()} goal
        </h2>
        <p className="text-gray-600">
          Provide details to help us calculate your plan
        </p>
      </div>

      <div className="space-y-6">
        {/* Goal Name */}
        <div>
          <label htmlFor="goal-name" className="block text-sm font-medium text-gray-700 mb-1">
            Goal Name <span className="text-error-600">*</span>
          </label>
          <input
            id="goal-name"
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={`${categoryInfo?.label} ${new Date().getFullYear() + 20}`}
            className={`
              w-full px-4 py-3 rounded-md border transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.name ? 'border-error-500' : 'border-gray-300 hover:border-gray-400'}
            `}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-error-600">
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="goal-description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Add any additional details about your goal..."
            rows={3}
            className="w-full px-4 py-3 rounded-md border border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Target Amount */}
        <div>
          <label htmlFor="target-amount" className="block text-sm font-medium text-gray-700 mb-1">
            Target Amount <span className="text-error-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">$</span>
            <input
              id="target-amount"
              type="number"
              value={formData.targetAmount || ''}
              onChange={(e) => onChange('targetAmount', parseFloat(e.target.value) || 0)}
              placeholder="1,500,000"
              className={`
                w-full pl-8 pr-4 py-3 rounded-md border transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500
                ${errors.targetAmount ? 'border-error-500' : 'border-gray-300 hover:border-gray-400'}
              `}
              aria-invalid={!!errors.targetAmount}
              aria-describedby={errors.targetAmount ? 'target-error' : formData.category === 'retirement' ? 'target-hint' : undefined}
            />
          </div>
          {errors.targetAmount && (
            <p id="target-error" className="mt-1 text-sm text-error-600">
              {errors.targetAmount}
            </p>
          )}
          {!errors.targetAmount && formData.category === 'retirement' && formData.targetAmount > 0 && (
            <p id="target-hint" className="mt-1 text-sm text-gray-600 flex items-start gap-1">
              <span className="text-info-500">💡</span>
              Based on 4% withdrawal rule for {calculateWithdrawalRate(formData.targetAmount)}/year income
            </p>
          )}
        </div>

        {/* Target Date */}
        <div>
          <label htmlFor="target-date" className="block text-sm font-medium text-gray-700 mb-1">
            Target Date <span className="text-error-600">*</span>
          </label>
          <input
            id="target-date"
            type="date"
            value={formData.targetDate}
            onChange={(e) => onChange('targetDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`
              w-full px-4 py-3 rounded-md border transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500
              ${errors.targetDate ? 'border-error-500' : 'border-gray-300 hover:border-gray-400'}
            `}
            aria-invalid={!!errors.targetDate}
            aria-describedby={errors.targetDate ? 'date-error' : undefined}
          />
          {errors.targetDate && (
            <p id="date-error" className="mt-1 text-sm text-error-600">
              {errors.targetDate}
            </p>
          )}
        </div>

        {/* Current Savings */}
        <div>
          <label htmlFor="current-savings" className="block text-sm font-medium text-gray-700 mb-1">
            Current Savings (for this goal)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">$</span>
            <input
              id="current-savings"
              type="number"
              value={formData.currentSavings || ''}
              onChange={(e) => onChange('currentSavings', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 rounded-md border border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Priority Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Priority Level <span className="text-error-600">*</span>
          </label>
          <div className="space-y-3">
            {Object.values(PRIORITY_INFO).map((priority) => {
              const isSelected = formData.priority === priority.id;
              return (
                <label
                  key={priority.id}
                  className={`
                    flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.id}
                    checked={isSelected}
                    onChange={() => onChange('priority', priority.id as GoalPriority)}
                    className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{priority.label}</div>
                    <div className="text-sm text-gray-600">{priority.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.priority && (
            <p className="mt-1 text-sm text-error-600">{errors.priority}</p>
          )}
        </div>
      </div>
    </div>
  );
};
