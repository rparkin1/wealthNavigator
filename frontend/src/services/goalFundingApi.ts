/**
 * Goal Funding API Service
 * Service for goal funding calculations and optimization
 *
 * REQ-GOAL-007: Goal funding API integration
 */

import type {
  FundingRequirementsRequest,
  FundingRequirementsResult,
  SuccessProbabilityRequest,
  SuccessProbabilityResult,
  RequiredSavingsForProbabilityRequest,
  RequiredSavingsForProbabilityResult,
  ContributionOptimizationRequest,
  ContributionOptimizationResult,
  CatchUpStrategyRequest,
  CatchUpStrategyResult,
  ComprehensiveAnalysisResult,
  CalculatorInfo,
} from '../types/goalFunding';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const BASE_PATH = '/api/v1/goal-funding';

export class GoalFundingApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'GoalFundingApiError';
  }
}

/**
 * Calculate comprehensive funding requirements for a goal
 *
 * Returns required monthly/annual savings, lump sum needed today,
 * inflation-adjusted target, and funding progress percentage.
 */
export async function calculateFundingRequirements(
  request: FundingRequirementsRequest
): Promise<FundingRequirementsResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/calculate-funding-requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GoalFundingApiError(
        errorData.detail || 'Failed to calculate funding requirements',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GoalFundingApiError) {
      throw error;
    }
    throw new GoalFundingApiError(
      error instanceof Error ? error.message : 'Unknown error calculating funding requirements'
    );
  }
}

/**
 * Calculate success probability using Monte Carlo simulation
 *
 * Runs thousands of simulations with random market returns to estimate
 * success probability, expected outcome distribution, and shortfall risk.
 */
export async function calculateSuccessProbability(
  request: SuccessProbabilityRequest
): Promise<SuccessProbabilityResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/calculate-success-probability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GoalFundingApiError(
        errorData.detail || 'Failed to calculate success probability',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GoalFundingApiError) {
      throw error;
    }
    throw new GoalFundingApiError(
      error instanceof Error ? error.message : 'Unknown error calculating success probability'
    );
  }
}

/**
 * Calculate required monthly savings to achieve target success probability
 *
 * Uses binary search with Monte Carlo simulation to find the monthly
 * contribution that achieves the desired probability (e.g., 90% chance of success).
 */
export async function calculateRequiredSavingsForProbability(
  request: RequiredSavingsForProbabilityRequest
): Promise<RequiredSavingsForProbabilityResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/required-savings-for-probability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GoalFundingApiError(
        errorData.detail || 'Failed to calculate required savings',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GoalFundingApiError) {
      throw error;
    }
    throw new GoalFundingApiError(
      error instanceof Error ? error.message : 'Unknown error calculating required savings'
    );
  }
}

/**
 * Optimize contribution timeline given maximum monthly budget
 *
 * If goal is achievable with max contribution, calculates optimal (lower) monthly amount.
 * If timeline extension needed, calculates additional years required and recommends alternatives.
 */
export async function optimizeContributionTimeline(
  request: ContributionOptimizationRequest
): Promise<ContributionOptimizationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/optimize-contribution-timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GoalFundingApiError(
        errorData.detail || 'Failed to optimize contribution timeline',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GoalFundingApiError) {
      throw error;
    }
    throw new GoalFundingApiError(
      error instanceof Error ? error.message : 'Unknown error optimizing contribution timeline'
    );
  }
}

/**
 * Calculate catch-up strategy for goals behind schedule
 *
 * Analyzes how far behind schedule the goal is, expected vs. actual progress,
 * required monthly savings to catch up, and feasibility assessment.
 */
export async function calculateCatchUpStrategy(
  request: CatchUpStrategyRequest
): Promise<CatchUpStrategyResult> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/calculate-catch-up-strategy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GoalFundingApiError(
        errorData.detail || 'Failed to calculate catch-up strategy',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GoalFundingApiError) {
      throw error;
    }
    throw new GoalFundingApiError(
      error instanceof Error ? error.message : 'Unknown error calculating catch-up strategy'
    );
  }
}

/**
 * Run comprehensive funding analysis combining multiple calculations
 *
 * Includes funding requirements, success probability, required savings for 90% probability,
 * and optimization recommendations. Returns complete picture of goal funding status.
 */
export async function comprehensiveFundingAnalysis(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number,
  yearsToGoal: number,
  expectedReturn: number = 0.07,
  returnVolatility: number = 0.15
): Promise<ComprehensiveAnalysisResult> {
  try {
    const params = new URLSearchParams({
      target_amount: targetAmount.toString(),
      current_amount: currentAmount.toString(),
      monthly_contribution: monthlyContribution.toString(),
      years_to_goal: yearsToGoal.toString(),
      expected_return: expectedReturn.toString(),
      return_volatility: returnVolatility.toString(),
    });

    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/comprehensive-analysis?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GoalFundingApiError(
        errorData.detail || 'Failed to run comprehensive analysis',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GoalFundingApiError) {
      throw error;
    }
    throw new GoalFundingApiError(
      error instanceof Error ? error.message : 'Unknown error running comprehensive analysis'
    );
  }
}

/**
 * Get calculator information, methodologies, and formulas
 *
 * Returns calculation methodologies, formulas used, assumptions,
 * limitations, and recommendations. Useful for transparency and user education.
 */
export async function getCalculatorInfo(): Promise<CalculatorInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/funding-calculator-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GoalFundingApiError(
        errorData.detail || 'Failed to fetch calculator info',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GoalFundingApiError) {
      throw error;
    }
    throw new GoalFundingApiError(
      error instanceof Error ? error.message : 'Unknown error fetching calculator info'
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

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
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Get status color based on success probability
 */
export function getStatusColor(probability: number): string {
  if (probability >= 0.90) return '#10b981'; // green
  if (probability >= 0.75) return '#3b82f6'; // blue
  if (probability >= 0.60) return '#f59e0b'; // amber
  if (probability >= 0.40) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Get status label based on success probability
 */
export function getStatusLabel(probability: number): string {
  if (probability >= 0.90) return 'Excellent';
  if (probability >= 0.75) return 'Good';
  if (probability >= 0.60) return 'Fair';
  if (probability >= 0.40) return 'At Risk';
  return 'Critical';
}

export { GoalFundingApiError };
