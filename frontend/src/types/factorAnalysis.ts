/**
 * Types for Factor Attribution and CAPM Analysis
 */

// ============================================================================
// Factor Attribution Types (Fama-French)
// ============================================================================

export interface FactorExposure {
  factor_name: string;
  beta: number;
  t_statistic: number;
  p_value: number;
  is_significant: boolean;
}

export interface FactorAttribution {
  factor_name: string;
  beta: number;
  factor_return: number;
  contribution: number;
  contribution_pct: number;
}

export interface FactorAnalysisRequest {
  portfolio_returns: number[];
  market_returns: number[];
  factor_returns?: Record<string, number[]>;
  model_type?: 'three_factor' | 'five_factor';
  frequency?: 'daily' | 'monthly';
}

export interface FactorAnalysisResponse {
  model_type: string;
  alpha: number;
  alpha_annual: number;
  alpha_t_stat: number;
  alpha_p_value: number;
  r_squared: number;
  adjusted_r_squared: number;
  exposures: FactorExposure[];
  attributions: FactorAttribution[];
  total_return: number;
  explained_return: number;
  residual_return: number;
  interpretation: string;
  recommendations: string[];
}

// ============================================================================
// CAPM Analysis Types
// ============================================================================

export interface CAPMAnalysisRequest {
  security_returns: number[];
  market_returns: number[];
  frequency?: 'daily' | 'monthly';
  security_name?: string;
}

export interface CAPMMetrics {
  risk_free_rate: number;
  market_return: number;
  market_premium: number;
  beta: number;
  beta_confidence_interval: [number, number];
  expected_return: number;
  actual_return: number;
  alpha: number;
  r_squared: number;
  correlation: number;
  tracking_error: number;
  information_ratio: number;
  treynor_ratio: number;
  position: 'overvalued' | 'undervalued' | 'fair_value';
  distance_from_sml: number;
  interpretation: string;
  investment_recommendation: string;
}

export interface CAPMPortfolioRequest {
  portfolio_returns: number[];
  market_returns: number[];
  holdings?: Array<{
    name: string;
    weight: number;
    returns: number[];
  }>;
  frequency?: 'daily' | 'monthly';
}

export interface CAPMPortfolioResponse {
  portfolio_metrics: CAPMMetrics;
  holdings_analysis?: Array<{
    name: string;
    weight: number;
    beta: number;
    alpha: number;
    expected_return: number;
    actual_return: number;
    position: string;
  }>;
  systematic_risk_pct: number;
  idiosyncratic_risk_pct: number;
  recommendations: string[];
  risk_warnings: string[];
}

export interface SecurityMarketLineResponse {
  points: Array<{
    beta: number;
    expected_return: number;
  }>;
  portfolio_point: {
    beta: number;
    expected_return: number;
  };
  efficient_portfolios: Array<{
    name: number;
    beta: number;
    expected_return: number;
  }>;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface FactorAnalysisState {
  data: FactorAnalysisResponse | null;
  loading: boolean;
  error: string | null;
}

export interface CAPMAnalysisState {
  data: CAPMMetrics | null;
  portfolioData: CAPMPortfolioResponse | null;
  smlData: SecurityMarketLineResponse | null;
  loading: boolean;
  error: string | null;
}
