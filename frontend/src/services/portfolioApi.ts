/**
 * Portfolio API Service
 *
 * Service for interacting with the Advanced Portfolio API endpoints
 */

import type {
  TaxLossHarvestRequest,
  TaxLossHarvestResponse,
  RebalanceRequest,
  RebalanceResponse,
  PerformanceRequest,
  PerformanceResponse,
  ComprehensiveAnalysisRequest,
  ComprehensiveAnalysisResponse,
} from '../types/portfolio';
import type { ApiResponse, ErrorResponse } from '../types/api';

// Standardize on VITE_API_BASE_URL and normalize to include /api/v1
function normalizeApiBase(raw: string): string {
  const stripped = raw.replace(/\/$/, '');
  return /\/api\/v\d+$/.test(stripped) ? stripped : `${stripped}/api/v1`;
}

const API_BASE_URL = normalizeApiBase(
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000'
);

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      // Spread options first, then merge headers to avoid being overwritten
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Request failed',
        detail: `HTTP ${response.status}: ${response.statusText}`,
      }));

      return {
        data: null,
        error: errorData as ErrorResponse,
      };
    }

    const data = await response.json();
    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        error: 'Network error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Portfolio Summary Response Types
 */
export interface PortfolioSummaryResponse {
  total_value: number;
  allocation: Record<string, number>;
  holdings_count: number;
  accounts_count: number;
}

export interface HoldingDetail {
  symbol: string;
  name: string;
  value: number;
  weight: number;
  shares: number;
  cost_basis: number;
  asset_class: string;
  security_type: string;
  purchase_date: string | null;
  expense_ratio: number | null;
}

export interface DetailedPortfolioResponse {
  summary: PortfolioSummaryResponse;
  holdings: HoldingDetail[];
  account_breakdown: Record<string, number>;
}

export interface FinancialSnapshotResponse {
  monthly_income: number;
  monthly_expenses: number;
  current_reserves: number;
  has_dependents: boolean;
  risk_tolerance: string;
  age: number;
}

/**
 * Portfolio API Service
 */
export const portfolioApi = {
  /**
   * Health check for portfolio API
   */
  healthCheck: async (): Promise<ApiResponse<{ status: string; features: string[] }>> => {
    return apiFetch('/portfolio/health', {
      method: 'GET',
    });
  },

  /**
   * Get portfolio summary (value, allocation, counts)
   */
  getPortfolioSummary: async (
    userId: string
  ): Promise<ApiResponse<PortfolioSummaryResponse>> => {
    return apiFetch(`/portfolio-summary/summary?user_id=${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Get detailed portfolio data (summary + holdings + account breakdown)
   */
  getDetailedPortfolio: async (
    userId: string
  ): Promise<ApiResponse<DetailedPortfolioResponse>> => {
    return apiFetch(`/portfolio-summary/detailed?user_id=${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Get financial snapshot (income, expenses, reserves)
   */
  getFinancialSnapshot: async (
    userId: string
  ): Promise<ApiResponse<FinancialSnapshotResponse>> => {
    return apiFetch(`/portfolio-summary/financial-snapshot?user_id=${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Analyze tax-loss harvesting opportunities
   */
  analyzeTaxLossHarvesting: async (
    request: TaxLossHarvestRequest
  ): Promise<ApiResponse<TaxLossHarvestResponse>> => {
    return apiFetch('/portfolio/tax-loss-harvest', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Analyze portfolio rebalancing recommendations
   */
  analyzeRebalancing: async (
    request: RebalanceRequest
  ): Promise<ApiResponse<RebalanceResponse>> => {
    return apiFetch('/portfolio/rebalance', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Analyze portfolio performance
   */
  analyzePerformance: async (
    request: PerformanceRequest
  ): Promise<ApiResponse<PerformanceResponse>> => {
    return apiFetch('/portfolio/performance', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Perform comprehensive portfolio analysis
   */
  analyzeComprehensive: async (
    request: ComprehensiveAnalysisRequest
  ): Promise<ApiResponse<ComprehensiveAnalysisResponse>> => {
    return apiFetch('/portfolio/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

export default portfolioApi;
