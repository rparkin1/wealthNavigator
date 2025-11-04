/**
 * Multi-Goal Optimization Types
 *
 * Type definitions for multi-goal portfolio optimization with tax-aware asset location
 */

export interface AccountInfo {
  id: string;
  type: 'taxable' | 'tax_deferred' | 'tax_exempt' | 'depository' | 'credit';
  balance: number;
}

export interface OptimizationRequest {
  goal_ids: string[];
  accounts: AccountInfo[];
  total_portfolio_value?: number;
}

export interface GoalPortfolio {
  goal_id: string;
  goal_title: string;
  allocated_amount: number;
  years_to_goal: number;
  risk_tolerance: number;
  allocation: {
    [assetClass: string]: number;
  };
  expected_return: number;
  expected_risk: number;
  sharpe_ratio: number;
}

export interface AccountAllocation {
  account_id: string;
  allocations: {
    [assetClass: string]: number;
  };
}

export interface AggregateStats {
  total_value: number;
  weighted_return: number;
  weighted_risk: number;
  sharpe_ratio: number;
  aggregate_allocation: {
    [assetClass: string]: number;
  };
}

export interface OptimizationSummary {
  total_goals: number;
  fully_funded_goals: number;
  partially_funded_goals: number;
  unfunded_goals: number;
}

export interface OptimizationResponse {
  goal_allocations: {
    [goalId: string]: number;
  };
  goal_portfolios: GoalPortfolio[];
  account_allocations: AccountAllocation[];
  aggregate_stats: AggregateStats;
  optimization_summary: OptimizationSummary;
}

export interface RebalanceRequest {
  user_id: string;
  target_allocations: {
    [goalId: string]: {
      [assetClass: string]: number;
    };
  };
  minimize_taxes: boolean;
}

export interface RebalanceTrade {
  account_id: string;
  action: 'buy' | 'sell';
  asset: string;
  amount: number;
  reason: string;
}

export interface TradeSummary {
  tax_deferred_trades: number;
  taxable_trades: number;
  tax_exempt_trades: number;
  estimated_savings: number;
}

export interface RebalanceResponse {
  rebalancing_trades: RebalanceTrade[];
  estimated_tax_impact: number;
  total_trades: number;
  trade_summary: TradeSummary;
}

export interface TaxEfficiencyRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  current_account: string;
  target_account: string;
  asset: string;
  amount: number;
  annual_tax_savings?: number;
  long_term_benefit?: string;
}

export interface TaxEfficiencyAnalysis {
  user_id: string;
  current_tax_drag: number;
  optimized_tax_drag: number;
  annual_savings: number;
  recommendations: TaxEfficiencyRecommendation[];
  implementation_notes: string[];
}

export interface GlidePathProjection {
  year: number;
  years_remaining: number;
  stocks_percentage: number;
  bonds_percentage: number;
  risk_level: 'aggressive' | 'moderate' | 'conservative';
}

export interface GlidePathResponse {
  goal_id: string;
  goal_title: string;
  years_to_goal: number;
  glide_path: GlidePathProjection[];
  current_allocation: {
    stocks: number;
    bonds: number;
  };
  target_allocation: {
    stocks: number;
    bonds: number;
  };
}

export interface CurrentAllocationResponse {
  user_id: string;
  last_optimization: OptimizationResponse | null;
  message: string;
}

export interface GoalPriorityUpdate {
  goal_id: string;
  priority: 'essential' | 'important' | 'aspirational';
  custom_priority_weight?: number;
}

export interface TradeoffMetric {
  goal_id: string;
  goal_title: string;
  current_allocation: number;
  optimal_allocation: number;
  tradeoff_impact: number;
  success_probability_change: number;
}

export interface TradeoffAnalysis {
  total_portfolio_value: number;
  tradeoffs: TradeoffMetric[];
  recommendation: string;
}
