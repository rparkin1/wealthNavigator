/**
 * Multi-Goal Optimization API Service
 *
 * Provides multi-goal portfolio optimization, tax-aware allocation, and rebalancing.
 * Backend endpoints: /api/v1/optimization/*
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

import type {
  OptimizationRequest,
  OptimizationResponse,
  RebalanceRequest,
  RebalanceResponse,
  TaxEfficiencyAnalysis,
  GlidePathResponse,
  CurrentAllocationResponse,
} from '../types/multiGoalOptimization';

/**
 * Optimize asset allocation across multiple goals
 *
 * Performs comprehensive multi-goal optimization:
 * - Capital allocation based on priority and funding needs
 * - Goal-level asset allocation based on time horizon and risk tolerance
 * - Tax-aware account placement
 * - Aggregate portfolio statistics
 */
export async function optimizeMultiGoalAllocation(
  request: OptimizationRequest
): Promise<OptimizationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/optimization/optimize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to optimize multi-goal allocation');
  }

  return response.json();
}

/**
 * Get current multi-goal allocation for a user
 *
 * Returns the most recent optimization results if available
 */
export async function getCurrentAllocation(
  userId: string
): Promise<CurrentAllocationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/optimization/users/${userId}/allocation`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch current allocation');
  }

  return response.json();
}

/**
 * Generate tax-aware rebalancing recommendations
 *
 * Features:
 * - Identifies current vs. target allocation gaps
 * - Prioritizes rebalancing in tax-advantaged accounts
 * - Minimizes tax impact by avoiding short-term capital gains
 * - Suggests specific buy/sell trades
 * - Estimates tax liability from rebalancing
 */
export async function rebalancePortfolio(
  request: RebalanceRequest
): Promise<RebalanceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/optimization/rebalance`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate rebalancing recommendations');
  }

  return response.json();
}

/**
 * Analyze tax efficiency of current asset location
 *
 * Identifies opportunities to improve tax efficiency by:
 * - Moving tax-inefficient assets to tax-deferred accounts
 * - Moving high-growth assets to Roth accounts
 * - Identifying suboptimal placements
 */
export async function analyzeTaxEfficiency(
  userId: string
): Promise<TaxEfficiencyAnalysis> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/optimization/analyze-tax-efficiency?user_id=${userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze tax efficiency');
  }

  return response.json();
}

/**
 * Get recommended glide path for a goal
 *
 * A glide path gradually reduces risk as the goal approaches.
 * Returns projected allocation changes over time.
 */
export async function getGlidePath(goalId: string): Promise<GlidePathResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/optimization/glide-path/${goalId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch glide path');
  }

  return response.json();
}

/**
 * Format currency values
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
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Get color for priority level
 */
export function getPriorityColor(priority: 'essential' | 'important' | 'aspirational'): string {
  switch (priority) {
    case 'essential':
      return '#ef4444'; // red-500
    case 'important':
      return '#f59e0b'; // amber-500
    case 'aspirational':
      return '#10b981'; // green-500
  }
}

/**
 * Get color for account type
 */
export function getAccountTypeColor(type: string): string {
  switch (type) {
    case 'taxable':
      return '#3b82f6'; // blue-500
    case 'tax_deferred':
      return '#8b5cf6'; // purple-500
    case 'tax_exempt':
      return '#10b981'; // green-500
    default:
      return '#64748b'; // slate-500
  }
}

/**
 * Calculate funding level (current / target)
 */
export function calculateFundingLevel(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(current / target, 1);
}

/**
 * Get funding status color
 */
export function getFundingStatusColor(fundingLevel: number): string {
  if (fundingLevel >= 1.0) return '#10b981'; // green-500 - fully funded
  if (fundingLevel >= 0.75) return '#84cc16'; // lime-500 - on track
  if (fundingLevel >= 0.5) return '#f59e0b'; // amber-500 - partially funded
  return '#ef4444'; // red-500 - underfunded
}
