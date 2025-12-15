/**
 * Goal Funding Types
 * Type definitions for goal funding calculations and analysis
 *
 * REQ-GOAL-007: Goal funding calculations
 */

// ============================================================================
// Request Types
// ============================================================================

export interface FundingRequirementsRequest {
  target_amount: number;
  current_amount: number;
  years_to_goal: number;
  expected_return?: number;
  inflation_rate?: number;
}

export interface SuccessProbabilityRequest {
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  years_to_goal: number;
  expected_return?: number;
  return_volatility?: number;
  iterations?: number;
}

export interface RequiredSavingsForProbabilityRequest {
  target_amount: number;
  current_amount: number;
  years_to_goal: number;
  target_probability?: number;
  expected_return?: number;
  return_volatility?: number;
}

export interface ContributionOptimizationRequest {
  target_amount: number;
  current_amount: number;
  years_to_goal: number;
  max_monthly_contribution: number;
  expected_return?: number;
}

export interface CatchUpStrategyRequest {
  target_amount: number;
  current_amount: number;
  years_remaining: number;
  years_behind_schedule: number;
  expected_return?: number;
}

export interface ComprehensiveAnalysisRequest {
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  years_to_goal: number;
  expected_return?: number;
  return_volatility?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface FundingRequirementsResult {
  required_monthly_savings: number;
  required_annual_savings: number;
  lump_sum_needed_today: number;
  inflation_adjusted_target: number;
  present_value_contributions: number;
  funding_progress_percent: number;
  total_contributions_needed: number;
  investment_growth_needed: number;
}

export interface SuccessProbabilityResult {
  success_probability: number;
  expected_final_amount: number;
  median_outcome: number;
  percentile_10th: number;
  percentile_25th: number;
  percentile_75th: number;
  percentile_90th: number;
  shortfall_risk: number;
  average_shortfall_amount: number;
  iterations_run: number;
}

export interface RequiredSavingsForProbabilityResult {
  required_monthly_savings: number;
  required_annual_savings: number;
  target_probability: number;
  total_contributions: number;
  total_investment_growth: number;
  increase_from_current?: number;
  percent_increase_from_current?: number;
}

export interface ContributionOptimizationResult {
  is_achievable: boolean;
  optimal_monthly_contribution?: number;
  projected_surplus?: number;
  years_extension_needed?: number;
  shortfall_with_original_timeline?: number;
  recommendations: string[];
  alternative_strategies: AlternativeStrategy[];
}

export interface AlternativeStrategy {
  strategy: string;
  monthly_contribution: number;
  timeline_years: number;
  success_probability: number;
  description: string;
}

export interface CatchUpStrategyResult {
  is_behind_schedule: boolean;
  months_behind: number;
  expected_amount_at_this_point: number;
  actual_amount: number;
  shortfall: number;
  required_monthly_to_catch_up: number;
  additional_monthly_needed: number;
  is_feasible: boolean;
  recommendations: string[];
  alternative_timeline?: number;
}

export interface ComprehensiveAnalysisResult {
  status: 'on_track' | 'fair' | 'at_risk';
  message: string;
  funding_requirements: FundingRequirementsResult;
  current_success_probability: SuccessProbabilityResult;
  required_for_90_percent: RequiredSavingsForProbabilityResult;
  monthly_contribution_gap: number;
  recommendations: {
    current_trajectory: string;
    to_achieve_90_percent: string;
    alternative_strategies: string[];
  };
}

// ============================================================================
// Calculator Info Types
// ============================================================================

export interface CalculatorInfo {
  methodologies: {
    funding_requirements: string;
    success_probability: string;
    optimization: string;
  };
  formulas: {
    future_value: string;
    pmt_annuity: string;
    present_value_annuity: string;
  };
  assumptions: {
    return_distribution: string;
    contribution_timing: string;
    inflation: string;
    taxes: string;
    fees: string;
  };
  monte_carlo_details: {
    default_iterations: number;
    min_iterations: number;
    max_iterations: number;
    confidence_interval: string;
    random_seed: string;
  };
  limitations: string[];
  recommendations: string[];
}

// ============================================================================
// UI State Types
// ============================================================================

export type FundingCalculatorTab =
  | 'requirements'
  | 'probability'
  | 'optimization'
  | 'catch-up'
  | 'comprehensive';

export interface FundingCalculatorState {
  selectedTab: FundingCalculatorTab;
  isCalculating: boolean;
  error: string | null;

  // Input values
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  yearsToGoal: number;
  expectedReturn: number;
  returnVolatility: number;
  targetProbability: number;
  maxMonthlyContribution: number;
  yearsBehindSchedule: number;

  // Results
  fundingRequirements: FundingRequirementsResult | null;
  successProbability: SuccessProbabilityResult | null;
  requiredSavings: RequiredSavingsForProbabilityResult | null;
  optimization: ContributionOptimizationResult | null;
  catchUpStrategy: CatchUpStrategyResult | null;
  comprehensiveAnalysis: ComprehensiveAnalysisResult | null;
}

// ============================================================================
// Display Helper Types
// ============================================================================

export interface FundingStatusDisplay {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  statusColor: string;
  statusLabel: string;
  statusIcon: string;
  progressPercentage: number;
}

export interface FundingActionItem {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

export interface FundingScenarioComparison {
  scenario: string;
  monthlyContribution: number;
  timelineYears: number;
  successProbability: number;
  totalContributions: number;
  projectedFinalAmount: number;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  AlternativeStrategy,
  CalculatorInfo,
  CatchUpStrategyRequest,
  CatchUpStrategyResult,
  ComprehensiveAnalysisRequest,
  ComprehensiveAnalysisResult,
  ContributionOptimizationRequest,
  ContributionOptimizationResult,
  FundingActionItem,
  FundingCalculatorState,
  FundingCalculatorTab,
  FundingRequirementsRequest,
  FundingRequirementsResult,
  FundingScenarioComparison,
  FundingStatusDisplay,
  RequiredSavingsForProbabilityRequest,
  RequiredSavingsForProbabilityResult,
  SuccessProbabilityRequest,
  SuccessProbabilityResult,
};
