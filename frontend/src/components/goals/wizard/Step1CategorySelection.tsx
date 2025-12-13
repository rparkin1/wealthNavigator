/**
 * Step 1: Category Selection
 * Week 11 - UI Redesign Phase 3
 *
 * Grid of clickable category cards with professional icons
 */

import React from 'react';
import type { GoalCategory } from './types';
import { GOAL_CATEGORIES } from './constants';
import { getCategoryIcon } from './CategoryIcons';

interface Step1CategorySelectionProps {
  selectedCategory: GoalCategory | null;
  onSelectCategory: (category: GoalCategory) => void;
}

export const Step1CategorySelection: React.FC<Step1CategorySelectionProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          What kind of goal are you planning for?
        </h2>
        <p className="text-gray-600">
          Select the category that best matches your financial objective
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(GOAL_CATEGORIES).map((category) => {
          const Icon = getCategoryIcon(category.id);
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`
                flex flex-col items-center justify-center p-6 rounded-lg
                border-2 transition-all duration-200
                hover:shadow-md hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
              aria-pressed={isSelected}
            >
              <div
                className={`
                  p-3 rounded-full mb-3 transition-colors duration-200
                  ${
                    isSelected
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
              >
                <Icon size={32} />
              </div>
              <h3
                className={`
                  text-lg font-semibold mb-1 transition-colors duration-200
                  ${isSelected ? 'text-primary-700' : 'text-gray-900'}
                `}
              >
                {category.label}
              </h3>
              <p className="text-sm text-gray-600 text-center">
                {category.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
