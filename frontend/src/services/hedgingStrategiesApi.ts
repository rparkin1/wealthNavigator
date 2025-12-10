/**
 * Hedging Strategies API Client
 * API client for hedging strategy recommendations and education
 */

import type {
  HedgingRecommendation,
  HedgingRequest,
  HedgingEducationContent,
  HedgingEducationTopic,
} from '../types/hedgingStrategies';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1/risk-management';

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
 * Get hedging strategy recommendations using real portfolio data from database (Plaid)
 * Automatically fetches portfolio, calculates risk, and recommends hedging strategies
 */
export async function getHedgingRecommendationsAuto(): Promise<HedgingRecommendation> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/hedging-strategies-auto`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get hedging recommendations');
  }

  return response.json();
}

/**
 * Get all hedging education content
 */
export async function getHedgingEducation(): Promise<HedgingEducationContent> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/hedging-education`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get hedging education');
  }

  return response.json();
}

/**
 * Get specific hedging education topic
 */
export async function getHedgingEducationTopic(
  topicName: string
): Promise<HedgingEducationTopic> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/hedging-education/${topicName}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get hedging education topic');
  }

  return response.json();
}

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
 * Get strategy type icon
 */
export function getStrategyIcon(strategyType: string): string {
  const icons: Record<string, string> = {
    protective_put: '🛡️',
    collar: '🎯',
    covered_call: '💰',
    put_spread: '📊',
    tail_risk_hedge: '🚨',
    diversification: '🌐',
    volatility_hedge: '📈',
    inverse_etf: '🔄',
    correlation_hedge: '🔗',
  };
  return icons[strategyType] || '💼';
}

/**
 * Get suitability score color
 */
export function getSuitabilityColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

/**
 * Get implementation priority color
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
  };
  return colors[priority] || '#6b7280';
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
