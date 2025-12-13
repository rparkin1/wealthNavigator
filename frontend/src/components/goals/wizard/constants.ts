/**
 * Goal Creation Wizard Constants
 * Week 11 - UI Redesign Phase 3
 */

import type { GoalCategory, GoalCategoryInfo, GoalPriorityInfo } from './types';

export const GOAL_CATEGORIES: Record<GoalCategory, GoalCategoryInfo> = {
  retirement: {
    id: 'retirement',
    label: 'Retirement',
    description: 'Plan for retirement',
    defaultAmount: 1500000,
    defaultMonthly: 2500,
    defaultReturn: 7.0,
  },
  education: {
    id: 'education',
    label: 'Education',
    description: 'Fund college or tuition',
    defaultAmount: 240000,
    defaultMonthly: 1200,
    defaultReturn: 6.0,
  },
  home: {
    id: 'home',
    label: 'Home Purchase',
    description: 'Save for down payment',
    defaultAmount: 100000,
    defaultMonthly: 2000,
    defaultReturn: 5.0,
  },
  major_expense: {
    id: 'major_expense',
    label: 'Major Expense',
    description: 'Large purchase or event',
    defaultAmount: 50000,
    defaultMonthly: 1000,
    defaultReturn: 4.0,
  },
  emergency: {
    id: 'emergency',
    label: 'Emergency Fund',
    description: 'Build safety net',
    defaultAmount: 30000,
    defaultMonthly: 500,
    defaultReturn: 2.0,
  },
  legacy: {
    id: 'legacy',
    label: 'Legacy',
    description: 'Estate or charitable giving',
    defaultAmount: 500000,
    defaultMonthly: 1500,
    defaultReturn: 6.5,
  },
};

export const PRIORITY_INFO: Record<string, GoalPriorityInfo> = {
  essential: {
    id: 'essential',
    label: 'Essential',
    description: 'Critical for financial security',
    color: 'error',
  },
  important: {
    id: 'important',
    label: 'Important',
    description: 'Significant life goals',
    color: 'warning',
  },
  aspirational: {
    id: 'aspirational',
    label: 'Aspirational',
    description: 'Nice to have goals',
    color: 'primary',
  },
};

export const WIZARD_STORAGE_KEY = 'goalWizardDraft';
export const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
export const SUCCESS_THRESHOLD_MIN = 0.70;
export const SUCCESS_THRESHOLD_MAX = 0.95;
export const SUCCESS_THRESHOLD_DEFAULT = 0.90;
