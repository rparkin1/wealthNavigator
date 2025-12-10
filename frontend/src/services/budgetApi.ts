/**
 * Budget API Service
 *
 * API client for budget operations including CRUD and AI features.
 */

import type { BudgetEntry, BudgetCategory, Frequency } from '@/components/budget/BudgetForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ==================== Types ====================

export interface BudgetEntryResponse extends BudgetEntry {
  id: string;
  user_id: string;
  extraction_method: string;
  extraction_confidence?: number;
  extracted_at?: string;
  created_at: string;
  updated_at: string;
  annual_amount?: number;
  monthly_amount?: number;
}

export interface BudgetEntriesList {
  entries: BudgetEntryResponse[];
  total: number;
  income_count: number;
  expense_count: number;
  savings_count: number;
}

export interface BudgetCategorizationResult {
  category: string;
  confidence: number;
  note?: string;
}

export interface BudgetPatternAnalysis {
  is_recurring: boolean;
  typical_frequency?: string;
  is_fixed: boolean;
  variability: string;
  category_confidence: number;
  is_anomalous: boolean;
  suggestions: string[];
}

export interface BudgetOpportunity {
  category: string;
  current: number;
  suggested: number;
  savings: number;
  action: string;
  difficulty: string;
}

export interface BudgetRecommendation {
  priority: string;
  action: string;
  impact: string;
  difficulty: string;
  timeline?: string;
}

export interface BudgetSuggestions {
  health_score: number;
  health_category: string;
  savings_rate: number;
  concerns: string[];
  opportunities: BudgetOpportunity[];
  recommendations: BudgetRecommendation[];
}

export interface BudgetSummary {
  total_income: number;
  total_expenses: number;
  total_savings: number;
  net_cash_flow: number;
  savings_rate: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_savings: number;
  monthly_net: number;
  income_by_category: Record<string, number>;
  expenses_by_category: Record<string, number>;
  savings_by_category: Record<string, number>;
  total_entries: number;
  income_entries: number;
  expense_entries: number;
  savings_entries: number;
  health_category: string;
  health_score?: number;
}

// ==================== Helper Functions ====================

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response;
}

// ==================== CRUD Operations ====================

/**
 * Create a new budget entry
 */
export async function createBudgetEntry(
  entry: Omit<BudgetEntry, 'id'>
): Promise<BudgetEntryResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/entries`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });

  return response.json();
}

/**
 * List budget entries with optional filters
 */
export async function listBudgetEntries(filters?: {
  type?: 'income' | 'expense' | 'savings';
  category?: string;
  is_fixed?: boolean;
  include_deleted?: boolean;
}): Promise<BudgetEntriesList> {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE_URL}/budget/entries${params.toString() ? `?${params}` : ''}`;
  const response = await fetchWithAuth(url);

  return response.json();
}

/**
 * Get a specific budget entry
 */
export async function getBudgetEntry(id: string): Promise<BudgetEntryResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/entries/${id}`);
  return response.json();
}

/**
 * Update a budget entry
 */
export async function updateBudgetEntry(
  id: string,
  updates: Partial<BudgetEntry>
): Promise<BudgetEntryResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  return response.json();
}

/**
 * Delete a budget entry
 */
export async function deleteBudgetEntry(
  id: string,
  permanent: boolean = false
): Promise<void> {
  const url = `${API_BASE_URL}/budget/entries/${id}${permanent ? '?permanent=true' : ''}`;
  await fetchWithAuth(url, { method: 'DELETE' });
}

/**
 * Bulk create budget entries
 */
export async function bulkCreateBudgetEntries(
  entries: Omit<BudgetEntry, 'id'>[]
): Promise<{
  created: number;
  failed: number;
  entries: BudgetEntryResponse[];
  errors: any[];
}> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/entries/bulk`, {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });

  return response.json();
}

// ==================== AI Operations ====================

/**
 * Extract budget entries from conversation text
 */
export async function extractBudgetFromConversation(
  conversationText: string,
  autoSave: boolean = false
): Promise<BudgetEntryResponse[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/extract`, {
    method: 'POST',
    body: JSON.stringify({
      conversation_text: conversationText,
      auto_save: autoSave,
    }),
  });

  return response.json();
}

/**
 * Categorize a budget entry using AI
 */
export async function categorizeBudgetEntry(
  description: string,
  amount?: number,
  context?: string
): Promise<BudgetCategorizationResult> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/categorize`, {
    method: 'POST',
    body: JSON.stringify({
      entry_description: description,
      amount,
      context,
    }),
  });

  return response.json();
}

/**
 * Analyze budget entry patterns
 */
export async function analyzeBudgetPattern(
  entryName: string,
  amount: number,
  frequency: Frequency,
  category: BudgetCategory
): Promise<BudgetPatternAnalysis> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/analyze-pattern`, {
    method: 'POST',
    body: JSON.stringify({
      entry_name: entryName,
      amount,
      frequency,
      category,
    }),
  });

  return response.json();
}

/**
 * Get AI-powered budget suggestions
 */
export async function getBudgetSuggestions(
  entryIds?: string[]
): Promise<BudgetSuggestions> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/suggestions`, {
    method: 'POST',
    body: JSON.stringify({
      entry_ids: entryIds,
    }),
  });

  return response.json();
}

/**
 * Get budget summary
 */
export async function getBudgetSummary(): Promise<BudgetSummary> {
  const response = await fetchWithAuth(`${API_BASE_URL}/budget/summary`);
  return response.json();
}

// ==================== Helper Functions for Components ====================

/**
 * Get frequency multiplier for annual calculation
 */
export function getFrequencyMultiplier(frequency: Frequency): number {
  const multipliers: Record<Frequency, number> = {
    weekly: 52,
    biweekly: 26,
    monthly: 12,
    quarterly: 4,
    annual: 1,
    one_time: 0,
  };

  return multipliers[frequency] || 0;
}

/**
 * Calculate annual amount from entry
 */
export function calculateAnnualAmount(amount: number, frequency: Frequency): number {
  return amount * getFrequencyMultiplier(frequency);
}

/**
 * Calculate monthly amount from entry
 */
export function calculateMonthlyAmount(amount: number, frequency: Frequency): number {
  return calculateAnnualAmount(amount, frequency) / 12;
}

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
 * Get category color
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    // Income
    salary: '#10B981',
    wages: '#059669',
    bonus: '#34D399',
    // Expenses
    housing: '#EF4444',
    transportation: '#F59E0B',
    food_groceries: '#10B981',
    food_dining: '#14B8A6',
    utilities: '#6366F1',
    // Savings
    retirement_contribution: '#3B82F6',
    emergency_fund: '#10B981',
    // Default
    default: '#64748B',
  };

  return colors[category] || colors.default;
}

/**
 * Get budget health color
 */
export function getHealthColor(healthCategory: string): string {
  const colors: Record<string, string> = {
    excellent: '#10B981', // green
    good: '#3B82F6', // blue
    needs_work: '#F59E0B', // orange
    poor: '#EF4444', // red
  };

  return colors[healthCategory] || colors.needs_work;
}

/**
 * Get budget health label
 */
export function getHealthLabel(savingsRate: number): string {
  if (savingsRate >= 20) return 'Excellent';
  if (savingsRate >= 10) return 'Good';
  return 'Needs Work';
}
