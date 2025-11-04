/**
 * Goal Milestones API Service
 *
 * Provides milestone tracking, auto-generation, and progress monitoring.
 * Backend endpoints: /api/v1/goals/{goal_id}/milestones/*
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

import type {
  Milestone,
  MilestoneCreationRequest,
  MilestoneUpdateRequest,
  ProgressCheckResponse,
  ProgressMetrics,
  UpcomingMilestone,
  OverdueMilestone,
} from '../types/goalMilestones';

/**
 * Create a new milestone for a goal
 */
export async function createMilestone(
  goalId: string,
  request: MilestoneCreationRequest
): Promise<Milestone> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/milestones`,
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
    throw new Error(error.detail || 'Failed to create milestone');
  }

  return response.json();
}

/**
 * Get all milestones for a goal
 */
export async function getMilestones(goalId: string): Promise<Milestone[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/milestones`,
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
    throw new Error(error.detail || 'Failed to fetch milestones');
  }

  return response.json();
}

/**
 * Update an existing milestone
 */
export async function updateMilestone(
  goalId: string,
  milestoneId: string,
  request: MilestoneUpdateRequest
): Promise<Milestone> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/milestones/${milestoneId}`,
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
    throw new Error(error.detail || 'Failed to update milestone');
  }

  return response.json();
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(
  goalId: string,
  milestoneId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/milestones/${milestoneId}`,
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
    throw new Error(error.detail || 'Failed to delete milestone');
  }
}

/**
 * Mark a milestone as completed
 */
export async function completeMilestone(
  goalId: string,
  milestoneId: string
): Promise<Milestone> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/milestones/${milestoneId}/complete`,
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
    throw new Error(error.detail || 'Failed to complete milestone');
  }

  return response.json();
}

/**
 * Auto-generate milestones based on goal parameters
 */
export async function autoGenerateMilestones(goalId: string): Promise<Milestone[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/milestones/auto-generate`,
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
    throw new Error(error.detail || 'Failed to auto-generate milestones');
  }

  return response.json();
}

/**
 * Check progress and auto-complete milestones if targets met
 */
export async function checkProgress(
  goalId: string
): Promise<ProgressCheckResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/milestones/check-progress`,
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
    throw new Error(error.detail || 'Failed to check progress');
  }

  return response.json();
}

/**
 * Get comprehensive progress metrics for a goal
 */
export async function getProgressMetrics(goalId: string): Promise<ProgressMetrics> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/${goalId}/progress-metrics`,
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
    throw new Error(error.detail || 'Failed to fetch progress metrics');
  }

  return response.json();
}

/**
 * Get upcoming milestones across all goals
 */
export async function getUpcomingMilestones(
  userId: string,
  daysAhead: number = 30
): Promise<UpcomingMilestone[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/users/${userId}/milestones/upcoming?days_ahead=${daysAhead}`,
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
    throw new Error(error.detail || 'Failed to fetch upcoming milestones');
  }

  return response.json();
}

/**
 * Get overdue incomplete milestones
 */
export async function getOverdueMilestones(
  userId: string
): Promise<OverdueMilestone[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/goals/users/${userId}/milestones/overdue`,
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
    throw new Error(error.detail || 'Failed to fetch overdue milestones');
  }

  const data = await response.json();
  return data.overdue_milestones;
}
