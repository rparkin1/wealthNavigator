/**
 * Enhanced Performance API Service
 *
 * Handles TWR, MWR, tax reporting, and comprehensive performance analysis
 */

import type { ApiResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CashFlowRequest {
  date: string;
  amount: number;
  account_id?: string;
}

export interface PerformanceAnalysisRequest {
  user_id: string;
  portfolio_id?: string;
  start_date: string;
  end_date: string;
  include_tax_reporting?: boolean;
  include_peer_comparison?: boolean;
  peer_group?: string;
  tax_rate_short_term?: number;
  tax_rate_long_term?: number;
}

export interface TimeWeightedReturn {
  period: string;
  twr_percentage: number;
  method: string;
  cash_flows_removed: number;
}

export interface MoneyWeightedReturn {
  period: string;
  mwr_percentage: number;
  total_contributions: number;
  total_withdrawals: number;
  net_cash_flow: number;
}

export interface AccountPerformance {
  account_id: string;
  account_name: string;
  account_type: string;
  beginning_value: number;
  ending_value: number;
  contributions: number;
  withdrawals: number;
  twr: number;
  mwr: number;
  gain_loss: number;
  gain_loss_pct: number;
}

export interface TaxLot {
  ticker: string;
  acquisition_date: string;
  quantity: number;
  cost_basis_per_share: number;
  total_cost_basis: number;
  current_price: number;
  current_value: number;
  unrealized_gain_loss: number;
  holding_period: string;
}

export interface RealizedGain {
  ticker: string;
  sale_date: string;
  acquisition_date: string;
  quantity: number;
  cost_basis: number;
  sale_proceeds: number;
  gain_loss: number;
  holding_period: string;
  wash_sale: boolean;
}

export interface TaxReporting {
  realized_gains_short_term: number;
  realized_gains_long_term: number;
  realized_losses_short_term: number;
  realized_losses_long_term: number;
  unrealized_gains_short_term: number;
  unrealized_gains_long_term: number;
  unrealized_losses_short_term: number;
  unrealized_losses_long_term: number;
  total_cost_basis: number;
  total_current_value: number;
  net_realized_gain_loss: number;
  net_unrealized_gain_loss: number;
  tlh_opportunities_count: number;
  tlh_potential_savings: number;
  estimated_tax_liability: number;
  tax_lots: TaxLot[];
  realized_transactions: RealizedGain[];
}

export interface FeesImpact {
  period: string;
  management_fees: number;
  trading_commissions: number;
  expense_ratios: number;
  other_fees: number;
  total_fees: number;
  fee_impact_on_return: number;
  fee_percentage_of_assets: number;
}

export interface CurrencyEffect {
  asset_class: string;
  local_currency_return: number;
  currency_effect: number;
  usd_return: number;
  currency_pair: string;
}

export interface EnhancedAttribution {
  asset_class: string;
  contribution_to_return: number;
  weight: number;
  asset_return: number;
  allocation_effect: number;
  selection_effect: number;
  currency_effect?: number;
  fees_impact: number;
  total_effect: number;
}

export interface PeerGroupComparison {
  peer_group: string;
  period: string;
  portfolio_return: number;
  peer_median: number;
  peer_25th_percentile: number;
  peer_75th_percentile: number;
  percentile_rank: number;
  vs_median: number;
  performance_rating: string;
}

export interface ReturnComparison {
  period: string;
  simple_return: number;
  time_weighted_return: number;
  money_weighted_return: number;
  difference_twr_vs_mwr: number;
  interpretation: string;
}

export interface EnhancedPerformanceResponse {
  portfolio_id: string;
  as_of_date: string;
  analysis_period: string;
  total_value: number;
  beginning_value: number;
  ending_value: number;
  total_gain_loss: number;
  total_gain_loss_pct: number;
  simple_return: number;
  time_weighted_return: TimeWeightedReturn;
  money_weighted_return: MoneyWeightedReturn;
  return_comparison: ReturnComparison;
  accounts_performance: AccountPerformance[];
  enhanced_attribution: EnhancedAttribution[];
  fees_impact: FeesImpact;
  currency_effects: CurrencyEffect[];
  tax_reporting?: TaxReporting;
  peer_comparison?: PeerGroupComparison;
  risk_metrics: Record<string, number>;
}

export interface QuickPerformanceSummary {
  period: string;
  twr: number;
  mwr: number;
  total_fees: number;
  estimated_tax: number;
  peer_percentile?: number;
  performance_rating: string;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options?.headers || {}),
    };

    const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      return {
        data: null,
        error: error.error || error.detail || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export const enhancedPerformanceApi = {
  /**
   * Get comprehensive enhanced performance analysis
   */
  analyzePerformance: async (
    request: PerformanceAnalysisRequest
  ): Promise<ApiResponse<EnhancedPerformanceResponse>> => {
    return apiFetch<EnhancedPerformanceResponse>('/performance/enhanced/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get quick performance summary for dashboard widget
   */
  getPerformanceSummary: async (
    userId: string,
    period: string = '1Y'
  ): Promise<ApiResponse<QuickPerformanceSummary>> => {
    return apiFetch<QuickPerformanceSummary>(
      `/performance/enhanced/summary/${userId}?period=${period}`
    );
  },

  /**
   * Get performance broken down by account
   */
  getAccountPerformance: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<AccountPerformance[]>> => {
    return apiFetch<AccountPerformance[]>(
      `/performance/enhanced/accounts/${userId}?start_date=${startDate}&end_date=${endDate}`
    );
  },

  /**
   * Get comprehensive tax reporting
   */
  getTaxReport: async (
    userId: string,
    year: number
  ): Promise<ApiResponse<TaxReporting>> => {
    return apiFetch<TaxReporting>(
      `/performance/enhanced/tax-report/${userId}?year=${year}`
    );
  },
};

export default enhancedPerformanceApi;
