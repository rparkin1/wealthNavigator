/**
 * Portfolio Types
 * Portfolio allocation, optimization, and performance tracking
 */

export interface Portfolio {
  id: string;
  userId: string;
  totalValue: number;
  allocation: AssetAllocation;
  accounts: Account[];
  performance: PerformanceMetrics;
  riskMetrics: RiskMetrics;
  lastRebalanced: number;
}

export interface AssetAllocation {
  [assetClass: string]: number; // percentage as decimal (0.0-1.0)
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  value: number;
  holdings: Holding[];
  connectionStatus: ConnectionStatus;
  lastSynced: number;
}

export type AccountType =
  | 'taxable'
  | 'tax_deferred'
  | 'tax_exempt'
  | 'depository'
  | 'credit';

export type ConnectionStatus = 'healthy' | 'syncing' | 'error' | 'authentication_required';

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  value: number;
  costBasis: number;
  assetClass: string;
}

export interface PerformanceMetrics {
  ytd: number; // year-to-date return
  oneYear: number;
  threeYear: number;
  fiveYear: number;
  inception: number;
}

export interface RiskMetrics {
  volatility: number; // standard deviation
  beta: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  valueAtRisk95: number; // VaR at 95% confidence
  valueAtRisk99: number; // VaR at 99% confidence
}

export interface OptimizationParams {
  goalIds: string[];
  riskTolerance: number; // 0.0-1.0
  timeHorizon: number; // years
  constraints?: OptimizationConstraints;
}

export interface OptimizationConstraints {
  minStocks?: number;
  maxStocks?: number;
  minBonds?: number;
  maxBonds?: number;
  excludeSectors?: string[];
  esgMinimum?: number;
}

export interface OptimizationResult {
  optimizationId: string;
  recommendedAllocation: AssetAllocation;
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  efficientFrontierPosition: string;
  timestamp: number;
}

// ============================================================================
// Advanced Portfolio API Types
// ============================================================================

// API Response types moved to ../types/api.ts

export const AnalysisType = {
  TAX_LOSS_HARVESTING: 'tax_loss_harvesting',
  REBALANCING: 'rebalancing',
  PERFORMANCE: 'performance',
  COMPREHENSIVE: 'comprehensive',
} as const;

// Tax-Loss Harvesting Types
export interface TaxLossHarvestRequest {
  user_id: string;
  portfolio_id?: string;
  tax_rate?: number;
  min_loss_threshold?: number;
}

export interface ReplacementSecurity {
  ticker: string;
  name: string;
  similarity_score: number;
  expense_ratio?: number;
}

export interface TLHOpportunity {
  security: string;
  loss: number;
  tax_benefit: number;
  wash_sale_risk: boolean;
  priority: number;
  recommendation: string;
  replacements: ReplacementSecurity[];
}

export interface TaxLossHarvestResponse {
  total_harvestable_losses: number;
  total_tax_benefit: number;
  opportunities_count: number;
  opportunities: TLHOpportunity[];
  strategy_notes: string;
}

// Rebalancing Types
export interface RebalanceRequest {
  user_id: string;
  portfolio_id?: string;
  drift_threshold?: number;
  tax_rate?: number;
  new_contributions?: number;
}

export interface RebalancingTrade {
  account: string;
  asset: string;
  action: 'buy' | 'sell';
  amount: number;
  tax_impact: number;
  priority: number;
  reasoning: string;
}

export interface RebalanceResponse {
  needs_rebalancing: boolean;
  max_drift: number;
  estimated_tax_cost: number;
  trades_count: number;
  trades: RebalancingTrade[];
  drift_analysis: Record<string, number>;
  execution_notes: string;
  alternative_strategy?: string;
}

// Performance Tracking Types
export interface PerformanceRequest {
  user_id: string;
  portfolio_id?: string;
  start_date?: string;
  end_date?: string;
  benchmark?: string;
}

export interface PerformanceMetricDetail {
  period: string;
  return_pct: number;
  volatility: number;
  sharpe: number;
  max_drawdown: number;
}

export interface AttributionResult {
  asset: string;
  contribution: number;
  weight: number;
  return_pct: number;
}

export interface PerformanceResponse {
  total_value: number;
  ytd_return: number;
  inception_return: number;
  metrics: PerformanceMetricDetail[];
  risk_metrics: Record<string, number>;
  attribution: AttributionResult[];
}

// Comprehensive Analysis Types
export interface ComprehensiveAnalysisRequest {
  user_id: string;
  portfolio_id?: string;
  analysis_types?: typeof AnalysisType[keyof typeof AnalysisType][];
  tax_rate?: number;
  drift_threshold?: number;
}

export interface ComprehensiveAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  tax_loss_harvesting?: TaxLossHarvestResponse;
  rebalancing?: RebalanceResponse;
  performance?: PerformanceResponse;
  summary: string;
  recommendations: string[];
}

// API types moved to ../types/api.ts to avoid circular dependencies
