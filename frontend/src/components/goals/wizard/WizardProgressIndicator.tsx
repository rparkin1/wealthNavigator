/**
 * Wizard Progress Indicator
 * Week 11 - UI Redesign Phase 3
 *
 * Displays filled circles for completed steps
 */

import React from 'react';
import type { WizardStep } from './types';

interface WizardProgressIndicatorProps {
  currentStep: WizardStep;
  totalSteps: number;
}

export const WizardProgressIndicator: React.FC<WizardProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <React.Fragment key={step}>
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full
                transition-all duration-200
                ${
                  isCompleted || isCurrent
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                }
              `}
              aria-label={`Step ${step}${isCompleted ? ' completed' : isCurrent ? ' current' : ''}`}
            >
              {isCompleted ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-sm font-medium">{step}</span>
              )}
            </div>
            {step < totalSteps && (
              <div
                className={`
                  w-12 h-0.5 transition-colors duration-200
                  ${isCompleted ? 'bg-primary-600' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
