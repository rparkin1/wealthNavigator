/**
 * AI Goal Assistance API Service
 *
 * Provides natural language goal creation, AI recommendations, and intelligent assistance.
 * Backend endpoints: /api/v1/ai-goal-assistance/*
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface NaturalLanguageGoalRequest {
  user_input: string;
  user_context?: {
    age?: number;
    annual_income?: number;
    location?: string;
    family_status?: string;
    [key: string]: any;
  };
}

export interface ParsedGoal {
  goal_category: string;
  title?: string;
  priority?: string;
  target_amount?: number;
  target_date?: string;
  time_horizon_years?: number;
  description?: string;
  clarifying_questions?: ClarifyingQuestion[];
  confidence?: number;
}

export interface ClarifyingQuestion {
  question: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  suggested_options?: string[];
  default_value?: any;
  help_text?: string;
}

export interface CostEstimate {
  low: number;
  medium: number;
  high: number;
  confidence: string;
  factors: string[];
  regional_adjustment?: number;
  inflation_adjusted: boolean;
}

export interface TimelineRecommendation {
  recommended_years: number;
  target_date: string;
  rationale: string;
  alternative_timelines?: {
    years: number;
    feasibility: string;
    trade_offs: string;
  }[];
}

export interface GoalConflict {
  conflict_type: 'resource' | 'timeline' | 'priority' | 'mutual_exclusion';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affected_goals: string[];
  suggestions: string[];
}

export interface GoalRecommendations {
  suggested_savings_rate: number;
  monthly_contribution: number;
  alternative_scenarios: {
    name: string;
    description: string;
    adjustments: Record<string, any>;
    impact: string;
  }[];
  risk_guidance: string;
  optimization_tips: string[];
  trade_offs: string[];
}

export interface EducationalContext {
  overview: string;
  typical_requirements: string[];
  common_mistakes: string[];
  best_practices: string[];
  tax_implications?: string[];
  key_milestones?: string[];
  resources?: string[];
}

export interface QuickGoalSetupResponse {
  parsed_goal: ParsedGoal;
  cost_suggestions?: { cost_estimates: CostEstimate };
  timeline_recommendation?: TimelineRecommendation;
  recommendations: GoalRecommendations;
  ready_to_create: boolean;
  confidence: number;
}

/**
 * Parse natural language goal description into structured format
 */
export async function parseNaturalLanguageGoal(
  request: NaturalLanguageGoalRequest
): Promise<{
  parsed_goal: ParsedGoal;
  needs_clarification: boolean;
  confidence: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/parse-natural-language`,
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
    throw new Error(error.detail || 'Failed to parse natural language goal');
  }

  return response.json();
}

/**
 * Generate clarifying questions for incomplete goals
 */
export async function generateClarifyingQuestions(
  partialGoal: Record<string, any>,
  userContext?: Record<string, any>
): Promise<{
  questions: ClarifyingQuestion[];
  total_questions: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/clarifying-questions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        partial_goal: partialGoal,
        user_context: userContext,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate clarifying questions');
  }

  return response.json();
}

/**
 * Get typical cost suggestions for a goal category
 */
export async function suggestTypicalCosts(
  goalCategory: string,
  location?: string,
  userContext?: Record<string, any>
): Promise<{ cost_estimates: CostEstimate; regional_info?: any }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/suggest-costs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        goal_category: goalCategory,
        location,
        user_context: userContext,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to suggest costs');
  }

  return response.json();
}

/**
 * Get time horizon recommendation for a goal
 */
export async function recommendTimeHorizon(
  goalCategory: string,
  userAge: number,
  targetAmount: number,
  currentSavings?: number,
  monthlyContribution?: number
): Promise<TimelineRecommendation> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/recommend-timeline`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        goal_category: goalCategory,
        user_age: userAge,
        target_amount: targetAmount,
        current_savings: currentSavings || 0,
        monthly_contribution: monthlyContribution || 0,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to recommend timeline');
  }

  return response.json();
}

/**
 * Check for conflicts with existing goals
 */
export async function checkGoalConflicts(
  newGoal: Record<string, any>,
  existingGoals: Record<string, any>[],
  userResources: Record<string, any>
): Promise<{
  conflicts: GoalConflict[];
  has_conflicts: boolean;
  conflict_count: number;
  highest_severity: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/check-conflicts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        new_goal: newGoal,
        existing_goals: existingGoals,
        user_resources: userResources,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to check conflicts');
  }

  return response.json();
}

/**
 * Generate personalized recommendations for a goal
 */
export async function generateRecommendations(
  goal: Record<string, any>,
  userProfile: Record<string, any>,
  existingGoals?: Record<string, any>[]
): Promise<GoalRecommendations> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/recommendations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        goal,
        user_profile: userProfile,
        existing_goals: existingGoals || [],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate recommendations');
  }

  return response.json();
}

/**
 * Get educational context about a goal category
 */
export async function getEducationalContext(
  goalCategory: string,
  userQuestion?: string
): Promise<EducationalContext> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/educational-context`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        goal_category: goalCategory,
        user_question: userQuestion,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get educational context');
  }

  return response.json();
}

/**
 * Quick AI-assisted goal setup (combines multiple AI services)
 */
export async function quickGoalSetup(
  userInput: string,
  userAge: number,
  annualIncome: number
): Promise<QuickGoalSetupResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai-goal-assistance/quick-goal-setup?user_input=${encodeURIComponent(
      userInput
    )}&user_age=${userAge}&annual_income=${annualIncome}`,
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
    throw new Error(error.detail || 'Quick goal setup failed');
  }

  return response.json();
}
