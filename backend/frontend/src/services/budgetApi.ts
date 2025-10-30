/**
 * Budget API Service
 *
 * Client-side service for budget management API endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface BudgetEntry {
  id?: string;
  category: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  type: 'income' | 'expense' | 'savings';
  is_fixed?: boolean;
  notes?: string;
  start_date?: string;
  end_date?: string;
}

export interface BudgetEntryResponse extends BudgetEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetSuggestions {
  health_score: number;
  health_category: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  savings_rate: number;
  concerns: string[];
  opportunities: Array<{
    category: string;
    savings: number;
    action: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
    difficulty: string;
    timeline: string;
  }>;
}

export interface BudgetListResponse {
  entries: BudgetEntryResponse[];
  total: number;
}

/**
 * List all budget entries for the current user
 */
export async function listBudgetEntries(): Promise<BudgetListResponse> {
  try {
    const response = await fetch(`${API_BASE}/budget/entries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing budget entries:', error);
    throw error;
  }
}

/**
 * Create a new budget entry
 */
export async function createBudgetEntry(entry: BudgetEntry): Promise<BudgetEntryResponse> {
  try {
    const response = await fetch(`${API_BASE}/budget/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating budget entry:', error);
    throw error;
  }
}

/**
 * Update an existing budget entry
 */
export async function updateBudgetEntry(id: string, entry: Partial<BudgetEntry>): Promise<BudgetEntryResponse> {
  try {
    const response = await fetch(`${API_BASE}/budget/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating budget entry:', error);
    throw error;
  }
}

/**
 * Delete a budget entry
 */
export async function deleteBudgetEntry(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/budget/entries/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting budget entry:', error);
    throw error;
  }
}

/**
 * Get AI-powered budget suggestions
 */
export async function getBudgetSuggestions(): Promise<BudgetSuggestions> {
  try {
    const response = await fetch(`${API_BASE}/budget/suggestions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting budget suggestions:', error);
    throw error;
  }
}

/**
 * Extract budget entries from natural language conversation
 */
export async function extractBudgetFromConversation(
  conversationText: string,
  autoSave: boolean = false
): Promise<BudgetEntryResponse[]> {
  try {
    const response = await fetch(`${API_BASE}/budget/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_text: conversationText,
        auto_save: autoSave,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error extracting budget from conversation:', error);
    throw error;
  }
}
