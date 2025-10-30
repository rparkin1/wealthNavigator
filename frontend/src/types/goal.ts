/**
 * Goal Types
 * Financial goal planning and tracking - Matches GoalCard/GoalDashboard/GoalForm interfaces
 */

export type GoalCategory = 'retirement' | 'education' | 'home' | 'major_expense' | 'emergency' | 'legacy';
export type GoalPriority = 'essential' | 'important' | 'aspirational';
export type GoalStatus = 'on_track' | 'behind' | 'at_risk' | 'achieved';

/**
 * Core Goal interface - matches backend API and frontend components
 */
export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date string (YYYY-MM-DD)
  monthlyContribution?: number;
  successProbability?: number;
  status: GoalStatus;
  description?: string;
}

// Legacy interfaces for backwards compatibility
export interface GoalTimeline {
  startDate: string; // ISO date
  targetDate: string; // ISO date
  yearsRemaining: number;
  monthsRemaining: number;
}

export interface FundingSource {
  accounts: string[]; // account IDs
  allocatedAmount: number;
}

export interface GoalProjections {
  percentile10: number;
  percentile50: number;
  percentile90: number;
}

export interface GoalProgress {
  goalId: string;
  status: GoalStatus;
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  successProbability: number;
}
