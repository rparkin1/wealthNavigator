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
