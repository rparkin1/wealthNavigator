/**
 * Goal Creation Wizard Types
 * Week 11 - UI Redesign Phase 3
 */

export type GoalCategory = 'retirement' | 'education' | 'home' | 'major_expense' | 'emergency' | 'legacy';
export type GoalPriority = 'essential' | 'important' | 'aspirational';
export type WizardStep = 1 | 2 | 3;

export interface GoalCategoryInfo {
  id: GoalCategory;
  label: string;
  description: string;
  defaultAmount?: number;
  defaultMonthly?: number;
  defaultReturn?: number;
}

export interface GoalPriorityInfo {
  id: GoalPriority;
  label: string;
  description: string;
  color: string;
}

export interface WizardFormData {
  // Step 1
  category: GoalCategory | null;

  // Step 2
  name: string;
  description: string;
  targetAmount: number;
  targetDate: string;
  currentSavings: number;
  priority: GoalPriority;

  // Step 3
  monthlyContribution: number;
  expectedReturn: number;
  successThreshold: number;
  runMonteCarloOnCreation: boolean;
}

export interface ProjectionResult {
  projectedValue: number;
  successProbability: number;
  shortfallRisk: number;
  medianShortfall: number;
  recommendedContribution: number;
  contributionAdjustment: number;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface WizardDraft {
  data: Partial<WizardFormData>;
  currentStep: WizardStep;
  lastSaved: number;
}
