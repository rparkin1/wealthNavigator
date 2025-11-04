/**
 * Reserve Monitoring API Service
 * Centralized API calls for reserve monitoring
 *
 * REQ-RISK-012: Reserve monitoring API integration
 */

import type {
  ReserveMonitoringRequest,
  ReserveMonitoringResult,
  ReserveAdequacyRequest,
  ReserveAdequacyScore,
  ReserveGrowthRequest,
  ReserveGrowthSimulation,
  ReserveGuidelines,
  
} from '../types/reserveMonitoring';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const BASE_PATH = '/api/v1/reserve-monitoring';

class ReserveMonitoringApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ReserveMonitoringApiError';
  }
}

/**
 * Monitor emergency fund reserves with comprehensive analysis
 */
export async function monitorReserves(
  request: ReserveMonitoringRequest
): Promise<ReserveMonitoringResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ReserveMonitoringApiError(
        errorData.detail || 'Failed to monitor reserves',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ReserveMonitoringApiError) {
      throw error;
    }
    throw new ReserveMonitoringApiError(
      error instanceof Error ? error.message : 'Unknown error monitoring reserves'
    );
  }
}

/**
 * Calculate reserve adequacy score (0-100)
 */
export async function calculateAdequacyScore(
  request: ReserveAdequacyRequest
): Promise<ReserveAdequacyScore> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/adequacy-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ReserveMonitoringApiError(
        errorData.detail || 'Failed to calculate adequacy score',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ReserveMonitoringApiError) {
      throw error;
    }
    throw new ReserveMonitoringApiError(
      error instanceof Error ? error.message : 'Unknown error calculating adequacy score'
    );
  }
}

/**
 * Simulate reserve fund growth over time
 */
export async function simulateReserveGrowth(
  request: ReserveGrowthRequest
): Promise<ReserveGrowthSimulation> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/simulate-growth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ReserveMonitoringApiError(
        errorData.detail || 'Failed to simulate reserve growth',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ReserveMonitoringApiError) {
      throw error;
    }
    throw new ReserveMonitoringApiError(
      error instanceof Error ? error.message : 'Unknown error simulating growth'
    );
  }
}

/**
 * Get reserve fund guidelines and best practices
 */
export async function getReserveGuidelines(): Promise<ReserveGuidelines> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/guidelines`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ReserveMonitoringApiError(
        errorData.detail || 'Failed to fetch reserve guidelines',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ReserveMonitoringApiError) {
      throw error;
    }
    throw new ReserveMonitoringApiError(
      error instanceof Error ? error.message : 'Unknown error fetching guidelines'
    );
  }
}

/**
 * Check service health
 */
export async function checkHealth(): Promise<{ status: string; service: string; endpoints: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ReserveMonitoringApiError('Health check failed', response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ReserveMonitoringApiError) {
      throw error;
    }
    throw new ReserveMonitoringApiError(
      error instanceof Error ? error.message : 'Unknown error checking health'
    );
  }
}

export { ReserveMonitoringApiError };
