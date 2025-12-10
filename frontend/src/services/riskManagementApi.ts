/**
 * Risk Management API Client
 * TypeScript client for all risk management and hedging endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1/risk-management';

// ==================== Types ====================

export interface RiskAssessmentRequest {
  portfolio_value: number;
  allocation: Record<string, number>;
  expected_return: number;
  volatility: number;
  returns_history?: number[];
  benchmark_returns?: number[];
}

export interface RiskMetrics {
  var_95_1day: number;
  var_99_1day: number;
  var_95_1month: number;
  var_99_1month: number;
  cvar_95: number;
  cvar_99: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  avg_drawdown: number;
  recovery_duration_days: number;
  beta: number;
  alpha: number;
  tracking_error: number;
  information_ratio: number;
  skewness: number;
  kurtosis: number;
  annual_volatility: number;
  concentration_score: number;
  risk_score: number;
  risk_level: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
}

export interface RiskAssessmentResult {
  portfolio_value: number;
  metrics: RiskMetrics;
  recommendations: string[];
  warnings: string[];
  timestamp: string;
}

export interface StressTestRequest {
  portfolio_value: number;
  allocation: Record<string, number>;
  scenarios?: string[];
  include_all_presets?: boolean;
}

export interface StressTestResult {
  scenario_name: string;
  original_value: number;
  stressed_value: number;
  value_change: number;
  pct_change: number;
  asset_impacts: Record<string, number>;
  risk_metrics_change: Record<string, number>;
  severity: 'mild' | 'moderate' | 'severe' | 'catastrophic';
}

export interface StressTestingSuite {
  portfolio_value: number;
  scenarios_tested: number;
  results: StressTestResult[];
  worst_case_scenario: StressTestResult;
  best_case_scenario: StressTestResult;
  average_impact: number;
  value_at_risk_stress: number;
}

export interface HedgingRequest {
  portfolio_value: number;
  allocation: Record<string, number>;
  risk_metrics: Record<string, any>;
  market_conditions?: Record<string, any>;
}

export interface HedgingStrategy {
  strategy_type: string;
  name: string;
  description: string;
  cost_estimate: number;
  cost_pct: number;
  protection_level: number;
  implementation_steps: string[];
  pros: string[];
  cons: string[];
  suitability_score: number;
  when_to_use: string;
}

export interface HedgingRecommendation {
  portfolio_value: number;
  current_risk_level: string;
  optimal_strategy: HedgingStrategy;
  recommended_strategies: HedgingStrategy[];
  market_conditions_note: string;
  implementation_priority: string;
  total_cost_estimate: number;
}

export interface MonteCarloStressRequest {
  portfolio_value: number;
  allocation: Record<string, number>;
  asset_volatilities: Record<string, number>;
  n_simulations?: number;
  confidence_level?: number;
}

export interface MonteCarloStressResult {
  simulations: number;
  mean_value: number;
  median_value: number;
  std_deviation: number;
  var_value: number;
  var_loss: number;
  cvar_value: number;
  cvar_loss: number;
  worst_case_value: number;
  worst_loss: number;
  confidence_level: number;
}

export interface StressScenario {
  name: string;
  description: string;
  type: string;
  probability: number;
  key: string;
}

export interface StressScenariosResponse {
  scenarios: StressScenario[];
  total: number;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  endpoints: number;
}

export interface ServiceSummaryResponse {
  name: string;
  version: string;
  features: string[];
  api_endpoints: number;
  metrics_available: string[];
}

// ==================== API Functions ====================

/**
 * Assess comprehensive portfolio risk
 */
export async function assessRisk(
  request: RiskAssessmentRequest
): Promise<RiskAssessmentResult> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/assess-risk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to assess risk');
  }

  return response.json();
}

/**
 * Run stress test suite
 */
export async function runStressTest(
  request: StressTestRequest
): Promise<StressTestingSuite> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/stress-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to run stress test');
  }

  return response.json();
}

/**
 * Get hedging strategy recommendations
 */
export async function getHedgingRecommendations(
  request: HedgingRequest
): Promise<HedgingRecommendation> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/hedging-strategies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get hedging recommendations');
  }

  return response.json();
}

/**
 * Run Monte Carlo stress test
 */
export async function runMonteCarloStress(
  request: MonteCarloStressRequest
): Promise<MonteCarloStressResult> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/monte-carlo-stress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to run Monte Carlo stress test');
  }

  return response.json();
}

/**
 * Get available stress test scenarios
 */
export async function getStressScenarios(): Promise<StressScenariosResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/stress-scenarios`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get stress scenarios');
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed health check');
  }

  return response.json();
}

/**
 * Get service summary
 */
export async function getServiceSummary(): Promise<ServiceSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/summary`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get service summary');
  }

  return response.json();
}

// ==================== Helper Functions ====================

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format risk level with color
 */
export function getRiskLevelColor(level: string): string {
  const colors: Record<string, string> = {
    conservative: '#22c55e',
    moderate: '#eab308',
    aggressive: '#f97316',
    very_aggressive: '#ef4444',
  };
  return colors[level] || '#6b7280';
}

/**
 * Format severity level with color
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    mild: '#22c55e',
    moderate: '#eab308',
    severe: '#f97316',
    catastrophic: '#ef4444',
  };
  return colors[severity] || '#6b7280';
}

/**
 * Get strategy type icon
 */
export function getStrategyIcon(strategyType: string): string {
  const icons: Record<string, string> = {
    protective_put: '🛡️',
    collar: '🎯',
    put_spread: '📊',
    tail_risk_hedge: '🚨',
    diversification: '🌐',
    volatility_hedge: '📈',
    inverse_etf: '🔄',
  };
  return icons[strategyType] || '💼';
}

/**
 * Get risk metric description
 */
export function getRiskMetricDescription(metric: string): string {
  const descriptions: Record<string, string> = {
    var_95_1day: 'Value at Risk (95% confidence, 1-day)',
    var_99_1day: 'Value at Risk (99% confidence, 1-day)',
    var_95_1month: 'Value at Risk (95% confidence, 1-month)',
    var_99_1month: 'Value at Risk (99% confidence, 1-month)',
    cvar_95: 'Conditional VaR (95% confidence)',
    cvar_99: 'Conditional VaR (99% confidence)',
    sharpe_ratio: 'Sharpe Ratio (risk-adjusted return)',
    sortino_ratio: 'Sortino Ratio (downside risk-adjusted)',
    calmar_ratio: 'Calmar Ratio (return vs max drawdown)',
    max_drawdown: 'Maximum Drawdown',
    beta: 'Beta (market sensitivity)',
    alpha: 'Alpha (excess return)',
    tracking_error: 'Tracking Error',
    skewness: 'Skewness (distribution asymmetry)',
    kurtosis: 'Kurtosis (tail risk)',
    concentration_score: 'Concentration Score (diversification)',
    risk_score: 'Overall Risk Score (0-100)',
  };
  return descriptions[metric] || metric;
}

/**
 * Build example risk assessment request
 */
export function buildExampleRiskRequest(): RiskAssessmentRequest {
  return {
    portfolio_value: 500000,
    allocation: {
      US_LC_BLEND: 0.40,
      INTL_DEV_BLEND: 0.20,
      US_TREASURY_INTER: 0.30,
      GOLD: 0.10,
    },
    expected_return: 0.08,
    volatility: 0.15,
  };
}

/**
 * Build example stress test request
 */
export function buildExampleStressRequest(): StressTestRequest {
  return {
    portfolio_value: 500000,
    allocation: {
      US_LC_BLEND: 0.60,
      US_TREASURY_INTER: 0.30,
      GOLD: 0.10,
    },
    scenarios: ['2008_financial_crisis', '2020_covid_crash', 'recession'],
  };
}

/**
 * Build example hedging request
 */
export function buildExampleHedgingRequest(): HedgingRequest {
  return {
    portfolio_value: 500000,
    allocation: {
      US_LC_BLEND: 0.70,
      US_TREASURY_INTER: 0.30,
    },
    risk_metrics: {
      annual_volatility: 0.18,
      beta: 1.15,
      max_drawdown: 0.28,
      risk_level: 'aggressive',
    },
  };
}

/**
 * Build example Monte Carlo request
 */
export function buildExampleMonteCarloRequest(): MonteCarloStressRequest {
  return {
    portfolio_value: 500000,
    allocation: {
      US_LC_BLEND: 0.60,
      US_TREASURY_INTER: 0.40,
    },
    asset_volatilities: {
      US_LC_BLEND: 0.18,
      US_TREASURY_INTER: 0.05,
    },
    n_simulations: 10000,
    confidence_level: 0.05,
  };
}
