/**
 * GoalForm Component
 *
 * Multi-step wizard for creating and editing financial goals.
 * Steps: 1) Goal Type, 2) Amounts & Dates, 3) Funding & Priority
 */

import { useState } from 'react';
import { Goal, GoalCategory, GoalPriority } from './GoalCard';

export interface GoalFormProps {
  goal?: Goal | null;
  onSubmit: (goalData: Partial<Goal>) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

interface FormData {
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  monthlyContribution: string;
  description: string;
}

type FormStep = 1 | 2 | 3;

const CATEGORY_INFO: Record<GoalCategory, { label: string; icon: string; description: string }> = {
  retirement: {
    label: 'Retirement',
    icon: '🏖️',
    description: 'Plan for financial independence and comfortable retirement',
  },
  education: {
    label: 'Education',
    icon: '🎓',
    description: 'Save for college, tuition, or continuing education',
  },
  home: {
    label: 'Home Purchase',
    icon: '🏠',
    description: 'Save for a down payment or home renovation',
  },
  major_expense: {
    label: 'Major Expense',
    icon: '💰',
    description: 'Plan for large purchases like a car, wedding, or vacation',
  },
  emergency: {
    label: 'Emergency Fund',
    icon: '🚨',
    description: 'Build a safety net for unexpected expenses',
  },
  legacy: {
    label: 'Legacy Planning',
    icon: '🌟',
    description: 'Plan for estate, charitable giving, or inheritance',
  },
};

const PRIORITY_INFO: Record<GoalPriority, { label: string; description: string; color: string }> = {
  essential: {
    label: 'Essential',
    description: 'Critical for financial security (e.g., emergency fund, retirement)',
    color: 'text-red-600',
  },
  important: {
    label: 'Important',
    description: 'Significant life goals (e.g., home purchase, education)',
    color: 'text-orange-600',
  },
  aspirational: {
    label: 'Aspirational',
    description: 'Nice to have goals (e.g., vacation, luxury purchases)',
    color: 'text-blue-600',
  },
};

export function GoalForm({ goal, onSubmit, onCancel, mode = 'create' }: GoalFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<FormData>({
    title: goal?.title || '',
    category: goal?.category || 'retirement',
    priority: goal?.priority || 'important',
    targetAmount: goal?.targetAmount.toString() || '',
    currentAmount: goal?.currentAmount.toString() || '0',
    targetDate: goal?.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
    monthlyContribution: goal?.monthlyContribution?.toString() || '',
    description: goal?.description || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateStep = (step: FormStep): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        newErrors.title = 'Goal title is required';
      }
    }

    if (step === 2) {
      if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
        newErrors.targetAmount = 'Target amount must be greater than 0';
      }
      if (parseFloat(formData.currentAmount) < 0) {
        newErrors.currentAmount = 'Current amount cannot be negative';
      }
      if (!formData.targetDate) {
        newErrors.targetDate = 'Target date is required';
      } else {
        const targetDate = new Date(formData.targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDate < today) {
          newErrors.targetDate = 'Target date must be in the future';
        }
      }
    }

    if (step === 3) {
      if (formData.monthlyContribution && parseFloat(formData.monthlyContribution) < 0) {
        newErrors.monthlyContribution = 'Monthly contribution cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as FormStep);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
    }
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      const goalData: Partial<Goal> = {
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        targetDate: new Date(formData.targetDate).toISOString(),
        monthlyContribution: formData.monthlyContribution
          ? parseFloat(formData.monthlyContribution)
          : undefined,
        description: formData.description || undefined,
      };

      if (goal) {
        goalData.id = goal.id;
      }

      onSubmit(goalData);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Goal' : 'Edit Goal'}
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

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                    step === currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : step < currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {step < currentStep ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span className={currentStep === 1 ? 'font-semibold text-blue-600' : ''}>Goal Type</span>
            <span className={currentStep === 2 ? 'font-semibold text-blue-600' : ''}>
              Amounts & Dates
            </span>
            <span className={currentStep === 3 ? 'font-semibold text-blue-600' : ''}>
              Funding & Priority
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {/* Step 1: Goal Type */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Retire at 60, Save for college, Buy a home"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Goal Category *</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField('category', key)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.category === key
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{info.icon}</span>
                        <span className="font-semibold text-gray-900">{info.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{info.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Add any additional details about this goal..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Amounts & Dates */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => updateField('targetAmount', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="100"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.targetAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.currentAmount}
                    onChange={(e) => updateField('currentAmount', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="100"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.currentAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.currentAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => updateField('targetDate', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.targetDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.targetDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetDate}</p>
                )}
              </div>

              {/* Progress Preview */}
              {formData.targetAmount && formData.currentAmount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Current Progress</p>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{
                        width: `${Math.min(
                          (parseFloat(formData.currentAmount) / parseFloat(formData.targetAmount)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    {((parseFloat(formData.currentAmount) / parseFloat(formData.targetAmount)) * 100).toFixed(1)}% of target
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Funding & Priority */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Contribution (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.monthlyContribution}
                    onChange={(e) => updateField('monthlyContribution', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="50"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.monthlyContribution ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.monthlyContribution && (
                  <p className="mt-1 text-sm text-red-600">{errors.monthlyContribution}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  How much do you plan to contribute each month?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Priority Level *</label>
                <div className="space-y-3">
                  {Object.entries(PRIORITY_INFO).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField('priority', key)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        formData.priority === key
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-semibold ${info.color}`}>{info.label}</p>
                          <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                        </div>
                        {formData.priority === key && (
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-3">Goal Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Goal:</span>
                    <span className="font-medium text-gray-900">{formData.title || 'Untitled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium text-gray-900">
                      ${parseFloat(formData.targetAmount || '0').toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current:</span>
                    <span className="font-medium text-gray-900">
                      ${parseFloat(formData.currentAmount || '0').toLocaleString()}
                    </span>
                  </div>
                  {formData.monthlyContribution && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="font-medium text-gray-900">
                        ${parseFloat(formData.monthlyContribution).toLocaleString()}/month
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Date:</span>
                    <span className="font-medium text-gray-900">
                      {formData.targetDate
                        ? new Date(formData.targetDate).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="btn-secondary"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button onClick={handleNext} className="btn-primary">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary">
              {mode === 'create' ? 'Create Goal' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
