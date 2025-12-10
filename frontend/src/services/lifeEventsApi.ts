/**
 * Life Events API Service
 *
 * Provides client-side API methods for managing life events and running simulations.
 * Includes all 10 backend endpoints with proper error handling and TypeScript types.
 */

import type { LifeEvent } from '../types/lifeEvents';

const API_BASE = '/api/v1/life-events';

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
// Life Event CRUD Operations
// ============================================================================

export interface GetEventsParams {
  goalId?: string;
  eventType?: string;
  enabledOnly?: boolean;
}

/**
 * Get all life events for current user with optional filters
 */
export async function getAllLifeEvents(params?: GetEventsParams): Promise<LifeEvent[]> {
  const searchParams = new URLSearchParams();

  if (params?.goalId) searchParams.append('goal_id', params.goalId);
  if (params?.eventType) searchParams.append('event_type', params.eventType);
  if (params?.enabledOnly !== undefined) {
    searchParams.append('enabled_only', String(params.enabledOnly));
  }

  const url = `${API_BASE}/events${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

/**
 * Get a specific life event by ID
 */
export async function getLifeEvent(eventId: string): Promise<LifeEvent> {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

export interface CreateLifeEventRequest {
  goal_id?: string;
  event_type: string;
  name: string;
  description?: string;
  start_year: number;
  duration_years?: number;
  probability?: number;
  enabled?: boolean;
  financial_impact: Record<string, any>;
}

/**
 * Create a new life event
 */
export async function createLifeEvent(data: CreateLifeEventRequest): Promise<LifeEvent> {
  const response = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

export interface UpdateLifeEventRequest {
  name?: string;
  description?: string;
  start_year?: number;
  duration_years?: number;
  probability?: number;
  enabled?: boolean;
  financial_impact?: Record<string, any>;
}

/**
 * Update an existing life event
 */
export async function updateLifeEvent(
  eventId: string,
  data: UpdateLifeEventRequest
): Promise<LifeEvent> {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

/**
 * Delete a life event
 */
export async function deleteLifeEvent(eventId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
}

/**
 * Toggle event enabled/disabled status
 */
export async function toggleLifeEvent(eventId: string): Promise<LifeEvent> {
  const response = await fetch(`${API_BASE}/events/${eventId}/toggle`, {
    method: 'POST',
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

// ============================================================================
// Simulation Operations
// ============================================================================

export interface SimulateEventRequest {
  goal_id: string;
  iterations?: number;
}

export interface SimulationResult {
  event_id: string;
  event_type: string;
  baseline: {
    success_probability: number;
    median_portfolio_value: number;
  };
  with_event: {
    success_probability: number;
    median_portfolio_value: number;
  };
  impact: {
    success_probability_delta: number;
    success_probability_delta_percentage: number;
    portfolio_value_delta: number;
    portfolio_value_delta_percentage: number;
    severity: 'minimal' | 'moderate' | 'significant' | 'severe';
    recommended_actions: string[];
  };
  recovery_analysis?: {
    estimated_recovery_years: number;
    value_to_recover: number;
    recovery_feasible: boolean;
  };
}

/**
 * Simulate the financial impact of a life event on a goal
 */
export async function simulateLifeEvent(
  eventId: string,
  request: SimulateEventRequest
): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE}/events/${eventId}/simulate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      goal_id: request.goal_id,
      iterations: request.iterations || 5000,
    }),
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

// ============================================================================
// Event Templates
// ============================================================================

export interface EventTemplate {
  id: string;
  event_type: string;
  name: string;
  description?: string;
  default_parameters: Record<string, any>;
  usage_count: number;
  average_rating?: number;
}

/**
 * Get all available event templates
 */
export async function getEventTemplates(eventType?: string): Promise<EventTemplate[]> {
  const searchParams = new URLSearchParams();
  if (eventType) searchParams.append('event_type', eventType);

  const url = `${API_BASE}/templates${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: { 'X-User-Id': getUserId() },
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

/**
 * Create a life event from a template
 */
export async function createFromTemplate(
  templateId: string,
  goalId: string | undefined,
  startYear: number
): Promise<LifeEvent> {
  const searchParams = new URLSearchParams();
  if (goalId) searchParams.append('goal_id', goalId);
  searchParams.append('start_year', String(startYear));

  const response = await fetch(`${API_BASE}/templates/${templateId}/use?${searchParams.toString()}`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) await handleError(response);
  return response.json();
}

/**
 * Initialize database with default templates (admin only)
 */
export async function initializeTemplates(): Promise<{ message: string; count: number }> {
  const response = await fetch(`${API_BASE}/templates/initialize`, {
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
 * Get event type icon
 */
export function getEventTypeIcon(eventType: string): string {
  const icons: Record<string, string> = {
    job_loss: '💼',
    disability: '🏥',
    divorce: '💔',
    inheritance: '💰',
    major_medical: '🏥',
    home_purchase: '🏡',
    business_start: '🚀',
    career_change: '📊',
    marriage: '💍',
    child_birth: '👶',
    relocation: '📦',
    windfall: '🎰',
  };
  return icons[eventType] || '📅';
}

/**
 * Get event type label
 */
export function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    job_loss: 'Job Loss',
    disability: 'Disability',
    divorce: 'Divorce',
    inheritance: 'Inheritance',
    major_medical: 'Major Medical',
    home_purchase: 'Home Purchase',
    business_start: 'Business Start',
    career_change: 'Career Change',
    marriage: 'Marriage',
    child_birth: 'Child Birth',
    relocation: 'Relocation',
    windfall: 'Windfall',
  };
  return labels[eventType] || eventType;
}

/**
 * Get severity color classes
 */
export function getSeverityColorClasses(severity: string): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    minimal: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    significant: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    severe: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };
  return colors[severity] || colors.moderate;
}
