/**
 * Net Worth API Service
 *
 * Service for fetching net worth history and trends
 */

import type { NetWorthDataPoint } from '../components/portfolio/NetWorthTrendChart';
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
 * Net Worth API Service
 */
export const netWorthApi = {
  /**
   * Get net worth history for a user
   */
  getNetWorthHistory: async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<NetWorthDataPoint[]>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const endpoint = `/net-worth/${userId}/history${queryString ? `?${queryString}` : ''}`;

    return apiFetch(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Get latest net worth snapshot
   */
  getLatestNetWorth: async (userId: string): Promise<ApiResponse<NetWorthDataPoint>> => {
    return apiFetch(`/net-worth/${userId}/latest`, {
      method: 'GET',
    });
  },

  /**
   * Get net worth summary statistics
   */
  getNetWorthSummary: async (
    userId: string,
    period: '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL' = '1Y'
  ): Promise<ApiResponse<{
    currentNetWorth: number;
    change: number;
    changePercent: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
  }>> => {
    return apiFetch(`/net-worth/${userId}/summary?period=${period}`, {
      method: 'GET',
    });
  },
};

export default netWorthApi;
