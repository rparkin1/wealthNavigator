/**
 * Goal Types
 * Financial goal planning and tracking
 */

import { GoalCategory } from './thread';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  targetDate: string; // ISO date
  priority: 'essential' | 'important' | 'aspirational';
  successThreshold: number; // 0.0-1.0 (minimum acceptable probability)
  currentFunding: number;
  percentFunded: number; // 0.0-1.0
  successProbability: number; // 0.0-1.0
  requiredMonthlySavings: number;
  timeline: GoalTimeline;
  fundingSource?: FundingSource;
  createdAt: number;
  updatedAt: number;
}

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

export type GoalStatus = 'on_track' | 'at_risk' | 'off_track' | 'achieved';

export interface GoalProgress {
  goalId: string;
  status: GoalStatus;
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  successProbability: number;
}
