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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
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
