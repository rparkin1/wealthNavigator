/**
 * Diversification Analysis API Service
 * Service for portfolio diversification and concentration risk analysis
 *
 * REQ-RISK-008: Diversification metrics API integration
 * REQ-RISK-009: Concentration risk identification
 * REQ-RISK-010: Diversification recommendations
 */

import type {
  DiversificationAnalysisRequest,
  DiversificationAnalysisResult,
  SimplifiedDiversificationRequest,
  ConcentrationThresholds,
} from '../types/diversification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const BASE_PATH = '/api/v1/diversification';

export class DiversificationApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'DiversificationApiError';
  }
}

/**
 * Perform comprehensive diversification analysis
 *
 * Analyzes portfolio holdings to identify:
 * - Diversification metrics (holdings count, HHI, effective securities)
 * - Concentration risks (security, sector, geography, asset class, manager)
 * - Improvement recommendations with suggested actions
 */
export async function analyzeDiversification(
  request: DiversificationAnalysisRequest
): Promise<DiversificationAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DiversificationApiError(
        errorData.detail || 'Failed to analyze diversification',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DiversificationApiError) {
      throw error;
    }
    throw new DiversificationApiError(
      error instanceof Error ? error.message : 'Unknown error analyzing diversification'
    );
  }
}

/**
 * Perform diversification analysis with simplified input
 *
 * Accepts holdings with values only - automatically calculates weights
 */
export async function analyzeDiversificationSimple(
  request: SimplifiedDiversificationRequest
): Promise<DiversificationAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/analyze-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DiversificationApiError(
        errorData.detail || 'Failed to analyze diversification',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DiversificationApiError) {
      throw error;
    }
    throw new DiversificationApiError(
      error instanceof Error ? error.message : 'Unknown error analyzing diversification'
    );
  }
}

/**
 * Get example diversification analysis with sample portfolio
 *
 * Useful for testing and demonstration
 */
export async function getExampleAnalysis(): Promise<DiversificationAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/example`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DiversificationApiError(
        errorData.detail || 'Failed to fetch example analysis',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DiversificationApiError) {
      throw error;
    }
    throw new DiversificationApiError(
      error instanceof Error ? error.message : 'Unknown error fetching example analysis'
    );
  }
}

/**
 * Get concentration risk thresholds used for analysis
 *
 * Returns the thresholds used to classify concentration risks as
 * low, medium, high, or critical
 */
export async function getConcentrationThresholds(): Promise<ConcentrationThresholds> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/thresholds`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DiversificationApiError(
        errorData.detail || 'Failed to fetch concentration thresholds',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DiversificationApiError) {
      throw error;
    }
    throw new DiversificationApiError(
      error instanceof Error ? error.message : 'Unknown error fetching thresholds'
    );
  }
}

/**
 * Get only diversification recommendations without full analysis
 *
 * Faster endpoint for quick recommendation retrieval
 */
export async function getRecommendationsOnly(
  request: DiversificationAnalysisRequest
): Promise<{
  recommendations: any[];
  concentration_risks: any[];
  diversification_score: number;
  diversification_level: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/recommendations-only`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DiversificationApiError(
        errorData.detail || 'Failed to fetch recommendations',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DiversificationApiError) {
      throw error;
    }
    throw new DiversificationApiError(
      error instanceof Error ? error.message : 'Unknown error fetching recommendations'
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Get severity color for concentration risk
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#ef4444'; // red
    case 'high':
      return '#f97316'; // orange
    case 'medium':
      return '#f59e0b'; // amber
    case 'low':
      return '#10b981'; // green
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get severity background color for badges
 */
export function getSeverityBgColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#fee2e2'; // red-100
    case 'high':
      return '#ffedd5'; // orange-100
    case 'medium':
      return '#fef3c7'; // amber-100
    case 'low':
      return '#d1fae5'; // green-100
    default:
      return '#f3f4f6'; // gray-100
  }
}

/**
 * Get diversification level color
 */
export function getDiversificationLevelColor(level: string): string {
  switch (level) {
    case 'Excellent':
      return '#10b981'; // green
    case 'Good':
      return '#3b82f6'; // blue
    case 'Fair':
      return '#f59e0b'; // amber
    case 'Poor':
      return '#f97316'; // orange
    case 'Critical':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get icon for concentration type
 */
export function getConcentrationTypeIcon(type: string): string {
  switch (type) {
    case 'single_holding':
      return '🎯';
    case 'top_5':
      return '📊';
    case 'sector':
      return '🏭';
    case 'geography':
      return '🌍';
    case 'asset_class':
      return '💼';
    case 'manager':
      return '👤';
    default:
      return '⚠️';
  }
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return '#ef4444'; // red
    case 'medium':
      return '#f59e0b'; // amber
    case 'low':
      return '#3b82f6'; // blue
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Calculate diversification score display properties
 */
export function getDiversificationScoreDisplay(score: number): {
  level: string;
  color: string;
  icon: string;
  description: string;
} {
  if (score >= 80) {
    return {
      level: 'Excellent',
      color: '#10b981',
      icon: '✅',
      description: 'Your portfolio is well-diversified',
    };
  } else if (score >= 60) {
    return {
      level: 'Good',
      color: '#3b82f6',
      icon: '👍',
      description: 'Your portfolio is adequately diversified',
    };
  } else if (score >= 40) {
    return {
      level: 'Fair',
      color: '#f59e0b',
      icon: '⚠️',
      description: 'Consider improving diversification',
    };
  } else if (score >= 20) {
    return {
      level: 'Poor',
      color: '#f97316',
      icon: '⚠️',
      description: 'Significant concentration risks present',
    };
  } else {
    return {
      level: 'Critical',
      color: '#ef4444',
      icon: '🚨',
      description: 'Urgent action needed to reduce risk',
    };
  }
}
