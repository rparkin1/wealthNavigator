/**
 * Historical Scenarios API Service
 *
 * Provides client-side API methods for accessing and applying historical market scenarios.
 * Includes all 6 backend endpoints with proper error handling and TypeScript types.
 */

import type {
  ScenarioListItem,
  HistoricalScenario,
  ScenarioResult,
  ScenarioStatistics,
  ScenarioComparison,
  ApplyScenarioRequest,
  CompareRequest,
} from '../types/historicalScenarios';

const API_BASE = '/api/v1/historical-scenarios';

/**
 * Get user ID from localStorage (temporary auth solution)
 */
const getUserId = (): string => {
  return localStorage.getItem('user_id') || 'test-user-123';
};

/**
 * Common headers for all requests
 */
const getHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'X-User-Id': getUserId(),
});

/**
 * Handle API errors consistently
 */
const handleError = async (response: Response): Promise<never> => {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const error = await response.json();
    throw new Error(error.detail || `API error: ${response.status}`);
  }
  throw new Error(`API error: ${response.status} ${response.statusText}`);
};

// ============================================================================
// Scenario Retrieval
// ============================================================================

export interface GetScenariosParams {
  featuredOnly?: boolean;
  activeOnly?: boolean;
}

/**
 * Get all available historical market scenarios (list view).
 * Returns scenarios with metadata but without full return data.
 */
export async function getAllScenarios(
  params?: GetScenariosParams
): Promise<ScenarioListItem[]> {
  const searchParams = new URLSearchParams();

  if (params?.featuredOnly !== undefined) {
    searchParams.append('featured_only', String(params.featuredOnly));
  }
  if (params?.activeOnly !== undefined) {
    searchParams.append('active_only', String(params.activeOnly));
  }

  const url = `${API_BASE}/scenarios${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

/**
 * Get full details for a specific scenario including return sequences.
 */
export async function getScenarioDetail(scenarioId: string): Promise<HistoricalScenario> {
  const response = await fetch(`${API_BASE}/scenarios/${scenarioId}`, {
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

// ============================================================================
// Scenario Application
// ============================================================================

/**
 * Apply a historical scenario to a goal and calculate outcomes.
 * Returns portfolio trajectory and key metrics.
 */
export async function applyScenario(
  scenarioId: string,
  request: ApplyScenarioRequest
): Promise<ScenarioResult> {
  const response = await fetch(`${API_BASE}/scenarios/${scenarioId}/apply`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

// ============================================================================
// Scenario Comparison
// ============================================================================

/**
 * Compare multiple historical scenarios side-by-side.
 * Returns comparative metrics and trajectories for all scenarios.
 */
export async function compareScenarios(
  request: CompareRequest
): Promise<ScenarioComparison> {
  const response = await fetch(`${API_BASE}/scenarios/compare`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get detailed statistical analysis for a scenario.
 * Returns mean, median, std dev, correlations, etc.
 */
export async function getScenarioStatistics(
  scenarioId: string
): Promise<ScenarioStatistics> {
  const response = await fetch(`${API_BASE}/scenarios/${scenarioId}/statistics`, {
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize database with default historical scenarios (admin only).
 */
export async function initializeDefaultScenarios(): Promise<{
  message: string;
  count: number;
}> {
  const response = await fetch(`${API_BASE}/scenarios/initialize`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate annualized return from total return and duration
 */
export function calculateAnnualizedReturn(
  totalReturn: number,
  durationMonths: number
): number {
  const years = durationMonths / 12;
  if (years === 0) return 0;
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Calculate recovery time from drawdown
 */
export function calculateRecoveryTime(
  trajectory: { period: string; value: number }[]
): number | null {
  if (trajectory.length < 2) return null;

  const maxValue = Math.max(...trajectory.map(t => t.value));
  const maxIndex = trajectory.findIndex(t => t.value === maxValue);

  // Find minimum after peak
  let minValue = maxValue;
  let minIndex = maxIndex;
  for (let i = maxIndex + 1; i < trajectory.length; i++) {
    if (trajectory[i].value < minValue) {
      minValue = trajectory[i].value;
      minIndex = i;
    }
  }

  // Find recovery (when value exceeds previous max)
  for (let i = minIndex + 1; i < trajectory.length; i++) {
    if (trajectory[i].value >= maxValue) {
      return i - minIndex; // Periods to recover
    }
  }

  return null; // Never recovered
}

/**
 * Get color class for return value
 */
export function getReturnColorClass(value: number): string {
  if (value >= 0.1) return 'text-green-600';
  if (value >= 0) return 'text-green-500';
  if (value >= -0.1) return 'text-orange-500';
  return 'text-red-600';
}

/**
 * Get severity of drawdown
 */
export function getDrawdownSeverity(drawdown: number): {
  label: string;
  color: string;
} {
  const absDrawdown = Math.abs(drawdown);

  if (absDrawdown < 0.1) {
    return { label: 'Minimal', color: 'green' };
  } else if (absDrawdown < 0.2) {
    return { label: 'Moderate', color: 'yellow' };
  } else if (absDrawdown < 0.3) {
    return { label: 'Significant', color: 'orange' };
  } else {
    return { label: 'Severe', color: 'red' };
  }
}

/**
 * Format scenario period date range
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startStr = start.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
  const endStr = end.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  return `${startStr} - ${endStr}`;
}

/**
 * Get risk level badge color
 */
export function getRiskLevelColor(volatility?: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (!volatility) {
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  }

  if (volatility < 0.15) {
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  } else if (volatility < 0.25) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
  } else if (volatility < 0.35) {
    return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
  } else {
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  }
}

/**
 * Calculate volatility label
 */
export function getVolatilityLabel(volatility?: number): string {
  if (!volatility) return 'Unknown';

  if (volatility < 0.15) return 'Low';
  if (volatility < 0.25) return 'Moderate';
  if (volatility < 0.35) return 'High';
  return 'Very High';
}

/**
 * Extract year from period string
 */
export function extractYear(period: string): number {
  const match = period.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Group scenarios by period type
 */
export function groupScenariosByPeriod(
  scenarios: ScenarioListItem[]
): Record<string, ScenarioListItem[]> {
  const groups: Record<string, ScenarioListItem[]> = {};

  for (const scenario of scenarios) {
    if (!groups[scenario.period]) {
      groups[scenario.period] = [];
    }
    groups[scenario.period].push(scenario);
  }

  return groups;
}
