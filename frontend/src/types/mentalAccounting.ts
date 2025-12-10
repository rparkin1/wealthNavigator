/**
 * Mental Accounting Type Definitions
 *
 * Types for REQ-GOAL-009: Mental account buckets for goals
 */

/**
 * Dedicated account allocated to a goal
 */
export interface DedicatedAccount {
  account_id: string;
  account_name?: string;
  balance: number;
  contribution_rate: number;
  allocation_percentage: number;
}

/**
 * Mental account bucket for a goal
 */
export interface MentalAccountBucket {
  goal_id: string;
  goal_name: string;
  goal_category: string;
  goal_priority: 'essential' | 'important' | 'aspirational';
  target_date: string;
  target_amount: number;
  current_value: number;
  projected_value: number;
  funding_level: number; // 0-1 (percentage as decimal)
  funding_status: 'fully_funded' | 'on_track' | 'at_risk' | 'underfunded';
  funding_gap: number; // negative = surplus, positive = gap
  success_probability: number; // 0-1
  required_monthly: number;
  dedicated_accounts: DedicatedAccount[];
  expected_return: number;
  return_volatility: number;
}

/**
 * Request to create a mental account bucket
 */
export interface CreateBucketRequest {
  goal_id: string;
  dedicated_accounts: DedicatedAccount[];
  expected_return?: number;
  return_volatility?: number;
}

/**
 * Summary statistics for all mental accounts
 */
export interface MentalAccountSummary {
  total_current_value: number;
  total_target_amount: number;
  total_projected_value: number;
  overall_funding_level: number;
  average_success_probability: number;
  fully_funded_count: number;
  on_track_count: number;
  at_risk_count: number;
  underfunded_count: number;
  total_funding_gap: number;
}

/**
 * Response from get all mental accounts endpoint
 */
export interface AllMentalAccountsResponse {
  user_id: string;
  mental_accounts: MentalAccountBucket[];
  summary: MentalAccountSummary;
}

/**
 * Account allocation request
 */
export interface AllocateAccountRequest {
  goal_id: string;
  account_id: string;
  allocation_percentage: number;
  monthly_contribution: number;
}

/**
 * Account allocation response
 */
export interface AccountAllocation {
  goal_id: string;
  account_id: string;
  allocation_percentage: number;
  monthly_contribution: number;
  created_at: string;
}

/**
 * Rebalancing recommendation
 */
export interface RebalancingRecommendation {
  from_goal_id: string;
  from_goal_name: string;
  to_goal_id: string;
  to_goal_name: string;
  amount: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Rebalancing analysis response
 */
export interface RebalancingAnalysis {
  needs_rebalancing: boolean;
  total_imbalance: number;
  overallocated_goals: Array<{
    goal_id: string;
    goal_name: string;
    excess_amount: number;
    current_allocation: number;
    target_allocation: number;
  }>;
  underallocated_goals: Array<{
    goal_id: string;
    goal_name: string;
    shortfall_amount: number;
    current_allocation: number;
    target_allocation: number;
  }>;
  recommendations: RebalancingRecommendation[];
}

/**
 * Growth projection data point
 */
export interface GrowthProjectionPoint {
  year: number;
  date: string;
  portfolio_value: number;
  total_contributions: number;
  investment_growth: number;
  funding_level: number;
}

/**
 * Growth projection response
 */
export interface GrowthProjection {
  goal_id: string;
  goal_name: string;
  current_value: number;
  target_amount: number;
  years_forward: number;
  expected_return: number;
  monthly_contribution: number;
  projection: GrowthProjectionPoint[];
  final_value: number;
  final_funding_level: number;
  will_meet_goal: boolean;
}

/**
 * Dashboard alert
 */
export interface DashboardAlert {
  at_risk_goals: number;
  needs_attention: number;
  needs_rebalancing: boolean;
}

/**
 * Dashboard recommendation
 */
export interface DashboardRecommendation {
  immediate_actions: string[];
  rebalancing_priority: RebalancingRecommendation[];
}

/**
 * Mental accounting dashboard response
 */
export interface MentalAccountingDashboard {
  user_id: string;
  mental_accounts: AllMentalAccountsResponse;
  rebalancing: RebalancingAnalysis;
  alerts: DashboardAlert;
  at_risk_goal_details: MentalAccountBucket[];
  recommendations: DashboardRecommendation;
}

/**
 * Projection request parameters
 */
export interface ProjectGrowthRequest {
  goal_id: string;
  years_forward?: number;
  expected_return?: number;
  monthly_contribution?: number;
}

/**
 * Rebalancing request parameters
 */
export interface AnalyzeRebalancingRequest {
  user_id: string;
  total_portfolio_value: number;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  AccountAllocation,
  AllMentalAccountsResponse,
  AllocateAccountRequest,
  AnalyzeRebalancingRequest,
  CreateBucketRequest,
  DashboardAlert,
  DashboardRecommendation,
  DedicatedAccount,
  GrowthProjection,
  GrowthProjectionPoint,
  MentalAccountBucket,
  MentalAccountingDashboard,
  MentalAccountSummary,
  ProjectGrowthRequest,
  RebalancingAnalysis,
  RebalancingRecommendation,
};
