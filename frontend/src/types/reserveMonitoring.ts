/**
 * Reserve Monitoring Type Definitions
 * Emergency fund and safety reserve monitoring types
 *
 * REQ-RISK-012: Reserve monitoring type safety
 */

export type ReserveStatus = 'critical' | 'low' | 'adequate' | 'strong' | 'excellent';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type IncomeStability = 'stable' | 'variable' | 'uncertain';
export type JobSecurity = 'secure' | 'moderate' | 'at_risk';

export interface ReserveAlert {
  severity: AlertSeverity;
  title: string;
  message: string;
  action_required: string;
  priority: number;
}

export interface ReserveRecommendation {
  action: string;
  monthly_target: number;
  time_to_goal: number;
  rationale: string;
  impact: string;
}

export interface ReserveMonitoringResult {
  current_reserves: number;
  monthly_expenses: number;
  months_coverage: number;
  reserve_status: ReserveStatus;
  minimum_target: number;
  recommended_target: number;
  optimal_target: number;
  shortfall: number;
  target_met: boolean;
  alerts: ReserveAlert[];
  recommendations: ReserveRecommendation[];
  trend: string;
  last_updated: string;
}

export interface ReserveMonitoringRequest {
  current_reserves: number;
  monthly_expenses: number;
  monthly_income: number;
  has_dependents?: boolean;
  income_stability?: IncomeStability;
  job_security?: JobSecurity;
}

export interface ReserveAdequacyScore {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  months_coverage: number;
  target_months: number;
}

export interface ReserveAdequacyRequest {
  months_coverage: number;
  target_months?: number;
}

export interface ReserveGrowthProjection {
  month: number;
  balance: number;
}

export interface ReserveGrowthSimulation {
  initial_balance: number;
  final_balance: number;
  monthly_contribution: number;
  target_amount: number;
  target_reached_month: number | null;
  months_simulated: number;
  projection: ReserveGrowthProjection[];
}

export interface ReserveGrowthRequest {
  current_reserves: number;
  monthly_contribution: number;
  target_amount: number;
  months_to_simulate?: number;
}

export interface ReserveGuideline {
  months: number;
  description: string;
}

export interface ReserveGuidelines {
  general_guidelines: {
    minimum: ReserveGuideline;
    recommended: ReserveGuideline;
    optimal: ReserveGuideline;
  };
  adjustment_factors: {
    dependents: Record<string, string>;
    income_stability: Record<string, string>;
    job_security: Record<string, string>;
    health_considerations: Record<string, string>;
    debt_obligations: Record<string, string>;
  };
  best_practices: string[];
  common_mistakes: string[];
}
