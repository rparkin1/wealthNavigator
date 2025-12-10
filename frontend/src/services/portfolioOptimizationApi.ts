/**
 * Portfolio Optimization API Service
 *
 * API client for portfolio optimization operations including multi-level optimization,
 * ESG screening, insights, and alerts.
 */

function normalizeApiBase(raw: string): string {
  const stripped = raw.replace(/\/$/, '');
  return /\/api\/v\d+$/.test(stripped) ? stripped : `${stripped}/api/v1`;
}

const API_BASE_URL = normalizeApiBase(
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000'
);

// ==================== Types ====================

export interface AssetClass {
  code: string;
  name: string;
  category: string;
  expected_return: number;
  volatility: number;
  tax_efficiency: number;
  benchmark_ticker?: string;
  description: string;
}

export interface SimpleAllocationRequest {
  risk_tolerance: number; // 0.0-1.0
  time_horizon: number; // years
  include_alternatives?: boolean;
}

export interface SimpleAllocationResponse {
  allocation: Record<string, number>; // {asset_code: weight}
  expected_return: number;
  expected_volatility: number;
  sharpe_ratio: number;
  risk_level: string; // conservative, moderate, aggressive
}

export interface Account {
  id: string;
  name: string;
  type: 'taxable' | 'tax_deferred' | 'tax_exempt';
  balance: number;
  current_holdings: Record<string, number>;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  years_to_goal: number;
  priority: 'essential' | 'important' | 'aspirational';
  risk_tolerance: number;
  success_threshold: number;
}

export interface MultiLevelOptimizationRequest {
  accounts: Account[];
  goals: Goal[];
  asset_codes?: string[];
  use_esg_screening?: boolean;
  esg_preset?: 'conservative' | 'moderate' | 'light' | 'none';
  esg_constraints?: ESGConstraints;
}

export interface OptimizationResult {
  optimization_level: string;
  total_value: number;
  expected_return: number;
  expected_volatility: number;
  sharpe_ratio: number;
  goal_allocations: Record<string, Record<string, number>>;
  account_allocations: Record<string, Record<string, number>>;
  household_allocation: Record<string, number>;
  tax_metrics: {
    estimated_tax_drag: number;
    asset_location_efficiency: number;
  };
  diversification_score: number;
  rebalancing_needed: boolean;
  recommendations: string[];
}

export interface ESGConstraints {
  required_criteria?: string[];
  exclusions?: string[];
  minimum_esg_rating?: 'leader' | 'average' | 'laggard';
  minimum_overall_score?: number;
  allow_not_rated?: boolean;
}

export interface ESGScreeningRequest {
  asset_codes: string[];
  required_criteria?: string[];
  exclusions?: string[];
  minimum_esg_rating?: string;
  minimum_overall_score?: number;
  allow_not_rated?: boolean;
}

export interface ESGScreeningResult {
  eligible_assets: string[];
  excluded_assets: Record<string, string>;
  portfolio_esg_score: number;
  recommendations: string[];
  summary: string;
}

export interface ESGPreset {
  name: string;
  label: string;
  description: string;
  exclusions: string[];
  required_criteria: string[];
  minimum_esg_rating: string;
  minimum_overall_score?: number;
  allow_not_rated: boolean;
}

export interface PortfolioInsight {
  category: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  data?: any;
}

export interface PortfolioAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
  created_at: string;
}

export interface InsightsRequest {
  portfolio_allocation: Record<string, number>;
  performance_metrics?: {
    total_return_1y?: number;
    sharpe_ratio_1y?: number;
    vs_benchmark_1y?: number;
    max_drawdown_1y?: number;
  };
  goals?: Goal[];
}

export interface AlertsRequest {
  portfolio_allocation: Record<string, number>;
  target_allocation: Record<string, number>;
  performance_metrics?: {
    total_return_1y?: number;
    vs_benchmark_1y?: number;
  };
  holdings_detail?: {
    average_expense_ratio?: number;
    positions_with_losses?: Array<{
      security: string;
      unrealized_loss: number;
    }>;
  };
}

// ==================== Helper Functions ====================

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response;
}

// ==================== Asset Classes ====================

/**
 * Get all asset classes
 */
export async function getAllAssetClasses(filters?: {
  category?: string;
  min_return?: number;
  max_volatility?: number;
}): Promise<AssetClass[]> {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE_URL}/portfolio-optimization/asset-classes${
    params.toString() ? `?${params}` : ''
  }`;
  const response = await fetchWithAuth(url);

  return response.json();
}

/**
 * Get specific asset class details
 */
export async function getAssetClass(assetCode: string): Promise<AssetClass> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/asset-classes/${assetCode}`
  );
  return response.json();
}

// ==================== Optimization ====================

/**
 * Get simple allocation
 */
export async function getSimpleAllocation(
  request: SimpleAllocationRequest
): Promise<SimpleAllocationResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/simple-allocation`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  return response.json();
}

/**
 * Perform multi-level optimization
 */
export async function multiLevelOptimization(
  request: MultiLevelOptimizationRequest
): Promise<OptimizationResult> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/multi-level-optimization`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  return response.json();
}

// ==================== ESG Screening ====================

/**
 * Screen assets based on ESG criteria
 */
export async function screenAssetsESG(
  request: ESGScreeningRequest
): Promise<ESGScreeningResult> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/esg-screening`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  return response.json();
}

/**
 * Get available ESG presets
 */
export async function getESGPresets(): Promise<{ presets: ESGPreset[] }> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/esg-presets`
  );
  return response.json();
}

// ==================== Insights & Alerts ====================

/**
 * Generate portfolio insights
 */
export async function generateInsights(
  request: InsightsRequest
): Promise<PortfolioInsight[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/insights`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  return response.json();
}

/**
 * Generate portfolio alerts
 */
export async function generateAlerts(
  request: AlertsRequest
): Promise<PortfolioAlert[]> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/alerts`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  return response.json();
}

// ==================== Health & Summary ====================

/**
 * Check service health
 */
export async function checkHealth(): Promise<{
  status: string;
  service: string;
  asset_classes_available: number;
}> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/health`
  );
  return response.json();
}

/**
 * Get service summary
 */
export async function getServiceSummary(): Promise<{
  name: string;
  version: string;
  features: string[];
  api_endpoints: number;
}> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/portfolio-optimization/summary`
  );
  return response.json();
}

// ==================== Helper Functions for Components ====================

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(riskLevel: string): string {
  const colors: Record<string, string> = {
    conservative: '#10B981', // green
    moderate: '#F59E0B', // orange
    aggressive: '#EF4444', // red
  };

  return colors[riskLevel] || colors.moderate;
}

/**
 * Get ESG rating color
 */
export function getESGRatingColor(rating: string): string {
  const colors: Record<string, string> = {
    leader: '#10B981', // green
    average: '#F59E0B', // orange
    laggard: '#EF4444', // red
    not_rated: '#64748B', // gray
  };

  return colors[rating] || colors.not_rated;
}

/**
 * Get alert severity color
 */
export function getAlertSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    info: '#3B82F6', // blue
    warning: '#F59E0B', // orange
    critical: '#EF4444', // red
  };

  return colors[severity] || colors.info;
}

/**
 * Get insight impact icon
 */
export function getInsightImpactIcon(impact: string): string {
  const icons: Record<string, string> = {
    positive: '✅',
    negative: '⚠️',
    neutral: 'ℹ️',
  };

  return icons[impact] || icons.neutral;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get asset category color
 */
export function getAssetCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    equity: '#3B82F6', // blue
    fixed_income: '#10B981', // green
    alternative: '#F59E0B', // orange
    commodity: '#EF4444', // red
    real_estate: '#8B5CF6', // purple
    cash: '#64748B', // gray
  };

  return colors[category] || colors.cash;
}
