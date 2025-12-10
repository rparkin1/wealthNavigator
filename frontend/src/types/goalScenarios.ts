/**
 * Goal Scenarios Types
 *
 * Type definitions for scenario creation, comparison, and what-if analysis
 */

export interface GoalScenario {
  id: string;
  goal_id: string;
  name: string;
  description?: string;
  monthly_contribution: number;
  target_amount: number;
  target_date: string;
  expected_return: number;
  projected_value: number;
  success_probability: number;
  years_to_goal: number;
  total_contributions: number;
  investment_growth: number;
  funding_level: number;
  risk_level: 'conservative' | 'moderate' | 'aggressive';
  asset_allocation: {
    [assetClass: string]: number;
  };
  created_at: string;
}

export interface ScenarioCreationRequest {
  name: string;
  description?: string;
  monthly_contribution: number;
  target_amount?: number;
  target_date?: string;
  expected_return?: number;
  risk_level?: 'conservative' | 'moderate' | 'aggressive';
}

export interface ScenarioUpdateRequest {
  name?: string;
  description?: string;
  monthly_contribution?: number;
  target_amount?: number;
  expected_return?: number;
  risk_level?: 'conservative' | 'moderate' | 'aggressive';
}

export interface ScenarioProjection {
  year: number;
  date: string;
  values: {
    [scenarioId: string]: number;
  };
}

export interface ScenarioComparisonRequest {
  scenario_ids: string[];
}

export interface ScenarioComparisonResponse {
  scenarios: GoalScenario[];
  projections: ScenarioProjection[];
  best_scenario_id: string;
  comparison_metrics: {
    highest_success_probability: string;
    lowest_monthly_cost: string;
    best_balance: string;
  };
}

export interface QuickCompareScenario {
  name: string;
  risk_level: 'conservative' | 'moderate' | 'aggressive';
  monthly_contribution: number;
  expected_return: number;
  description: string;
}

export interface QuickCompareResponse {
  goal_id: string;
  goal_title: string;
  target_amount: number;
  years_to_goal: number;
  scenarios: QuickCompareScenario[];
  recommendation: string;
}

export interface MonteCarloScenarioResult {
  scenario_id: string;
  iterations: number;
  success_probability: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  shortfall_risk: number;
  median_outcome: number;
  best_case: number;
  worst_case: number;
  recommendation: string;
}

export interface BestWorstCaseRequest {
  scenario_id: string;
}

export interface BestWorstCaseResponse {
  scenario_id: string;
  best_case: {
    name: string;
    projected_value: number;
    success_probability: number;
    description: string;
  };
  worst_case: {
    name: string;
    projected_value: number;
    success_probability: number;
    description: string;
  };
  base_case: {
    name: string;
    projected_value: number;
    success_probability: number;
    description: string;
  };
}

export interface ScenarioFilter {
  risk_levels?: Array<'conservative' | 'moderate' | 'aggressive'>;
  min_success_probability?: number;
  max_monthly_contribution?: number;
  sort_by?: 'success_probability' | 'monthly_contribution' | 'projected_value' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface SavedScenario extends GoalScenario {
  is_favorite?: boolean;
  last_modified?: string;
  notes?: string;
}
