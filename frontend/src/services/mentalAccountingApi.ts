/**
 * Mental Accounting API Service
 *
 * API client for REQ-GOAL-009: Mental account buckets
 */

import type {
  MentalAccountBucket,
  AllMentalAccountsResponse,
  CreateBucketRequest,
  AllocateAccountRequest,
  AccountAllocation,
  RebalancingAnalysis,
  AnalyzeRebalancingRequest,
  GrowthProjection,
  ProjectGrowthRequest,
  MentalAccountingDashboard,
} from '../types/mentalAccounting';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_PATH = '/api/v1/goal-planning/mental-accounting';

/**
 * Create a mental account bucket for a goal
 */
export async function createMentalAccountBucket(
  request: CreateBucketRequest
): Promise<MentalAccountBucket> {
  const userId = localStorage.getItem('user_id') || 'test-user-123';
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/create-bucket`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create mental account bucket');
  }

  return response.json();
}

/**
 * Get all mental account buckets for a user
 */
export async function getAllMentalAccounts(
  userId: string,
  expectedReturn: number = 0.07,
  returnVolatility: number = 0.15
): Promise<AllMentalAccountsResponse> {
  const params = new URLSearchParams({
    expected_return: expectedReturn.toString(),
    return_volatility: returnVolatility.toString(),
  });

  const currentUserId = localStorage.getItem('user_id') || 'test-user-123';
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/users/${userId}/all-buckets?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUserId
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get mental accounts');
  }

  return response.json();
}

/**
 * Get mental account bucket for a specific goal
 */
export async function getGoalMentalAccount(
  goalId: string,
  expectedReturn: number = 0.07,
  returnVolatility: number = 0.15
): Promise<MentalAccountBucket> {
  const params = new URLSearchParams({
    expected_return: expectedReturn.toString(),
    return_volatility: returnVolatility.toString(),
  });

  const userId = localStorage.getItem('user_id') || 'test-user-123';
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/${goalId}/bucket?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get goal mental account');
  }

  return response.json();
}

/**
 * Allocate an account (or portion) to a specific goal
 */
export async function allocateAccountToGoal(
  request: AllocateAccountRequest
): Promise<AccountAllocation> {
  const userId = localStorage.getItem('user_id') || 'test-user-123';
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/allocate-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to allocate account to goal');
  }

  return response.json();
}

/**
 * Analyze rebalancing needs across mental accounts
 */
export async function analyzeRebalancingNeeds(
  request: AnalyzeRebalancingRequest
): Promise<RebalancingAnalysis> {
  const userId = localStorage.getItem('user_id') || 'test-user-123';
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/analyze-rebalancing`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze rebalancing needs');
  }

  return response.json();
}

/**
 * Project mental account growth over time
 */
export async function projectMentalAccountGrowth(
  request: ProjectGrowthRequest
): Promise<GrowthProjection> {
  const userId = localStorage.getItem('user_id') || 'test-user-123';
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/project-growth`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to project growth');
  }

  return response.json();
}

/**
 * Get comprehensive mental accounting dashboard
 */
export async function getMentalAccountingDashboard(
  userId: string
): Promise<MentalAccountingDashboard> {
  const currentUserId = localStorage.getItem('user_id') || 'test-user-123';
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/dashboard?user_id=${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUserId
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get dashboard');
  }

  return response.json();
}
