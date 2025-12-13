/**
 * Goal Creation Wizard
 * Week 11 - UI Redesign Phase 3
 *
 * Multi-step wizard for creating financial goals with:
 * - Progress indicator
 * - Form validation
 * - Smart defaults by category
 * - Real-time projection preview
 * - Draft auto-save
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { GoalCategory, ValidationErrors, WizardFormData, WizardStep, WizardDraft } from './types';
import { GOAL_CATEGORIES, WIZARD_STORAGE_KEY, AUTO_SAVE_INTERVAL, SUCCESS_THRESHOLD_DEFAULT } from './constants';
import { WizardProgressIndicator } from './WizardProgressIndicator';
import { Step1CategorySelection } from './Step1CategorySelection';
import { Step2GoalDetails } from './Step2GoalDetails';
import { Step3FundingStrategy } from './Step3FundingStrategy';

interface GoalCreationWizardProps {
  onComplete: (goalData: WizardFormData) => void;
  onCancel: () => void;
}

const INITIAL_FORM_DATA: WizardFormData = {
  category: null,
  name: '',
  description: '',
  targetAmount: 0,
  targetDate: '',
  currentSavings: 0,
  priority: 'important',
  monthlyContribution: 0,
  expectedReturn: 7.0,
  successThreshold: SUCCESS_THRESHOLD_DEFAULT,
  runMonteCarloOnCreation: false,
};

export const GoalCreationWizard: React.FC<GoalCreationWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft: WizardDraft = JSON.parse(savedDraft);
        // Only restore if saved within last 24 hours
        if (Date.now() - draft.lastSaved < 24 * 60 * 60 * 1000) {
          setFormData({ ...INITIAL_FORM_DATA, ...draft.data });
          setCurrentStep(draft.currentStep);
        } else {
          localStorage.removeItem(WIZARD_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      const draft: WizardDraft = {
        data: formData,
        currentStep,
        lastSaved: Date.now(),
      };
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(draft));
      setHasUnsavedChanges(false);
    }, AUTO_SAVE_INTERVAL);

    return () => clearTimeout(timer);
  }, [formData, currentStep, hasUnsavedChanges]);

  // Apply smart defaults when category changes
  useEffect(() => {
    if (formData.category) {
      const categoryDefaults = GOAL_CATEGORIES[formData.category];
      setFormData((prev) => ({
        ...prev,
        targetAmount: prev.targetAmount || categoryDefaults.defaultAmount || 0,
        monthlyContribution: prev.monthlyContribution || categoryDefaults.defaultMonthly || 0,
        expectedReturn: prev.expectedReturn || categoryDefaults.defaultReturn || 7.0,
        name: prev.name || `${categoryDefaults.label} ${new Date().getFullYear() + 20}`,
      }));
    }
  }, [formData.category]);

  const handleFieldChange = useCallback((field: keyof WizardFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleCategorySelect = useCallback((category: GoalCategory) => {
    handleFieldChange('category', category);
  }, [handleFieldChange]);

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.category) {
        newErrors.category = 'Please select a goal category';
      }
    }

    if (step === 2) {
      if (!formData.name || formData.name.trim() === '') {
        newErrors.name = 'Goal name is required';
      }
      if (!formData.targetAmount || formData.targetAmount <= 0) {
        newErrors.targetAmount = 'Target amount must be greater than zero';
      }
      if (!formData.targetDate) {
        newErrors.targetDate = 'Target date is required';
      } else {
        const targetDate = new Date(formData.targetDate);
        const today = new Date();
        if (targetDate <= today) {
          newErrors.targetDate = 'Target date must be in the future';
        }
      }
      if (!formData.priority) {
        newErrors.priority = 'Priority level is required';
      }
    }

    if (step === 3) {
      if (!formData.monthlyContribution || formData.monthlyContribution < 0) {
        newErrors.monthlyContribution = 'Monthly contribution must be zero or greater';
      }
      if (!formData.expectedReturn || formData.expectedReturn <= 0 || formData.expectedReturn > 20) {
        newErrors.expectedReturn = 'Expected return must be between 0 and 20%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((prev) => (prev + 1) as WizardStep);
      } else {
        // Complete wizard
        localStorage.removeItem(WIZARD_STORAGE_KEY);
        onComplete(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
      setErrors({});
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges || formData.category) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        localStorage.removeItem(WIZARD_STORAGE_KEY);
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New Goal</h1>
            <div className="text-sm text-gray-500">Step {currentStep} of 3</div>
          </div>
          <WizardProgressIndicator currentStep={currentStep} totalSteps={3} />
        </div>

        {/* Step Content */}
        <div className="px-6 py-8">
          {currentStep === 1 && (
            <Step1CategorySelection
              selectedCategory={formData.category}
              onSelectCategory={handleCategorySelect}
            />
          )}

          {currentStep === 2 && (
            <Step2GoalDetails
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}

          {currentStep === 3 && (
            <Step3FundingStrategy
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
            />
          )}

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-md">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-error-900 mb-1">
                    Please fix the following errors:
                  </p>
                  <ul className="text-sm text-error-700 list-disc list-inside">
                    {Object.values(errors).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 1 && !formData.category}
              className={`
                px-6 py-2 rounded-md font-medium transition-colors
                ${
                  currentStep === 1 && !formData.category
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }
              `}
            >
              {currentStep === 3 ? 'Create Goal' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Auto-save indicator */}
        {hasUnsavedChanges && (
          <div className="absolute top-4 right-4 text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Saving...
          </div>
        )}
      </div>
    </div>
  );
};
