/**
 * Hedging Strategies Type Definitions
 * Types for hedging strategy recommendations and analysis
 */

export type HedgingStrategyType =
  | 'protective_put'
  | 'collar'
  | 'covered_call'
  | 'put_spread'
  | 'diversification'
  | 'tail_risk_hedge'
  | 'inverse_etf'
  | 'volatility_hedge'
  | 'correlation_hedge';

export interface HedgingStrategy {
  strategy_type: HedgingStrategyType;
  name: string;
  description: string;
  implementation: string;
  cost_estimate: number;
  cost_pct: number;
  protection_level: number;
  max_downside: number;
  breakeven_point: number;
  time_horizon: string;
  pros: string[];
  cons: string[];
  suitability_score: number;
  when_to_use: string;
  implementation_steps: string[];
  impact_on_return: number;
  impact_on_volatility: number;
}

export interface HedgingObjectives {
  hedge_percentage?: number;
  max_acceptable_drawdown?: number;
  cost_tolerance_pct?: number;
  time_horizon_months?: number;
  specific_scenarios?: string[];
}

export interface HedgingRecommendation {
  portfolio_value: number;
  current_risk_level: string;
  recommended_strategies: HedgingStrategy[];
  optimal_strategy: HedgingStrategy;
  total_cost_range: [number, number];
  total_cost_estimate: number;
  expected_protection: number;
  implementation_priority: string;
  market_conditions_note?: string;
  objectives_met?: Record<string, boolean>;
}

export interface HedgingRequest {
  portfolio_value: number;
  allocation: Record<string, number>;
  risk_metrics: Record<string, any>;
  market_conditions?: Record<string, any>;
  objectives?: HedgingObjectives;
}

export interface HedgingEducationTopic {
  title: string;
  content: string;
  examples: string[];
  key_points: string[];
  common_mistakes: string[];
}

export interface HedgingEducationContent {
  topics: HedgingEducationTopic[];
  quick_reference: Record<string, string>;
  glossary: Record<string, string>;
}
