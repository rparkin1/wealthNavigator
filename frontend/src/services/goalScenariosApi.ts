/**
 * Goal Scenarios API Service
 *
 * Provides scenario creation, comparison, and what-if analysis for goals.
 * Backend endpoints: /api/v1/goals/{goal_id}/scenarios/*
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

import type {
  GoalScenario,
  ScenarioCreationRequest,
  ScenarioUpdateRequest,
  ScenarioComparisonRequest,
  ScenarioComparisonResponse,
  QuickCompareResponse,
  MonteCarloScenarioResult,
  BestWorstCaseResponse,
} from '../types/goalScenarios';

/**
 * Create a new scenario for a goal
 */
export async function createScenario(
  goalId: string,
  request: ScenarioCreationRequest
): Promise<GoalScenario> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios`,
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
    throw new Error(error.detail || 'Failed to create scenario');
  }

  return response.json();
}

/**
 * Get all scenarios for a goal
 */
export async function getScenarios(goalId: string): Promise<GoalScenario[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios`,
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
    throw new Error(error.detail || 'Failed to fetch scenarios');
  }

  return response.json();
}

/**
 * Get a specific scenario by ID
 */
export async function getScenario(
  goalId: string,
  scenarioId: string
): Promise<GoalScenario> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios/${scenarioId}`,
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
    throw new Error(error.detail || 'Failed to fetch scenario');
  }

  return response.json();
}

/**
 * Update an existing scenario
 */
export async function updateScenario(
  goalId: string,
  scenarioId: string,
  request: ScenarioUpdateRequest
): Promise<GoalScenario> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios/${scenarioId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update scenario');
  }

  return response.json();
}

/**
 * Delete a scenario
 */
export async function deleteScenario(
  goalId: string,
  scenarioId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios/${scenarioId}`,
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
    throw new Error(error.detail || 'Failed to delete scenario');
  }
}

/**
 * Compare multiple scenarios side-by-side
 */
export async function compareScenarios(
  goalId: string,
  request: ScenarioComparisonRequest
): Promise<ScenarioComparisonResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios/compare`,
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
    throw new Error(error.detail || 'Failed to compare scenarios');
  }

  return response.json();
}

/**
 * Get quick comparison of 3 preset scenarios (conservative, moderate, aggressive)
 */
export async function quickCompareScenarios(
  goalId: string
): Promise<QuickCompareResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios/quick-compare`,
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
    throw new Error(error.detail || 'Failed to fetch quick comparison');
  }

  return response.json();
}

/**
 * Run Monte Carlo simulation for a scenario
 */
export async function runScenarioSimulation(
  goalId: string,
  scenarioId: string,
  iterations: number = 5000
): Promise<MonteCarloScenarioResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios/${scenarioId}/monte-carlo?iterations=${iterations}`,
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
    throw new Error(error.detail || 'Failed to run Monte Carlo simulation');
  }

  return response.json();
}

/**
 * Calculate best and worst case scenarios
 */
export async function calculateBestWorstCase(
  goalId: string,
  scenarioId: string
): Promise<BestWorstCaseResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/scenarios/best-worst-case`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ scenario_id: scenarioId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to calculate best/worst case');
  }

  return response.json();
}
