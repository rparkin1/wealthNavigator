/**
 * Goal Dependencies API Service
 *
 * Provides multi-goal relationship management and dependency tracking.
 * Backend endpoints: /api/v1/goal-planning/dependencies/*
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const BASE_PATH = '/api/v1/goal-planning/dependencies';

import type {
  GoalDependency,
  DependencyValidation,
  DependencyTimeline,
  DependencyOptimization,
  DependencyCreationRequest,
  DependencyUpdateRequest,
} from '../types/goalDependencies';

/**
 * Create a new goal dependency
 */
export async function createDependency(
  request: DependencyCreationRequest
): Promise<GoalDependency> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create dependency');
  }

  return response.json();
}

/**
 * Get all dependencies for the current user
 */
export async function getAllDependencies(): Promise<GoalDependency[]> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch dependencies');
  }

  return response.json();
}

/**
 * Get dependencies for a specific goal
 */
export async function getGoalDependencies(goalId: string): Promise<{
  dependencies: GoalDependency[];
  dependents: GoalDependency[];
}> {
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/goal/${goalId}`,
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
    throw new Error(error.detail || 'Failed to fetch goal dependencies');
  }

  return response.json();
}

/**
 * Update a dependency
 */
export async function updateDependency(
  dependencyId: string,
  request: DependencyUpdateRequest
): Promise<GoalDependency> {
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/${dependencyId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update dependency');
  }

  return response.json();
}

/**
 * Delete a dependency
 */
export async function deleteDependency(dependencyId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/${dependencyId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete dependency');
  }
}

/**
 * Validate dependency graph (check for cycles)
 */
export async function validateDependencies(
  goalIds: string[]
): Promise<DependencyValidation> {
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/validate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ goal_ids: goalIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to validate dependencies');
  }

  return response.json();
}

/**
 * Get optimized timeline considering dependencies
 */
export async function getOptimizedTimeline(
  goalIds: string[]
): Promise<DependencyTimeline[]> {
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/timeline`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ goal_ids: goalIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get timeline');
  }

  return response.json();
}

/**
 * Optimize goal sequencing
 */
export async function optimizeSequencing(
  goalIds: string[]
): Promise<DependencyOptimization> {
  const response = await fetch(
    `${API_BASE_URL}${BASE_PATH}/optimize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ goal_ids: goalIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to optimize sequencing');
  }

  return response.json();
}
