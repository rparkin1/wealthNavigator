/**
 * AI Goal Assistance Types
 *
 * Type definitions for natural language goal creation and AI recommendations
 */

import type { Goal, GoalCategory, GoalPriority } from './goal';

export interface AIGoalAssistanceState {
  mode: 'natural-language' | 'template' | 'quick-setup';
  step: 'input' | 'clarification' | 'review' | 'complete';
  parsedGoal: ParsedGoalData | null;
  clarifyingQuestions: ClarifyingQuestion[];
  recommendations: GoalRecommendations | null;
  conflicts: GoalConflict[];
  isProcessing: boolean;
  error: string | null;
}

export interface ParsedGoalData {
  goal_category: GoalCategory;
  title?: string;
  priority?: GoalPriority;
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
  answer?: any;
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
  alternative_scenarios: AlternativeScenario[];
  risk_guidance: string;
  optimization_tips: string[];
  trade_offs: string[];
}

export interface AlternativeScenario {
  name: string;
  description: string;
  adjustments: Record<string, any>;
  impact: string;
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

export interface GoalTemplate {
  id: string;
  category: GoalCategory;
  title: string;
  description: string;
  typical_amount_range: { min: number; max: number };
  typical_timeframe_years: number;
  icon: string;
  priority_suggestion: GoalPriority;
  quick_setup_available: boolean;
}

export interface QuickSetupData {
  parsed_goal: ParsedGoalData;
  cost_suggestions?: { cost_estimates: CostEstimate };
  timeline_recommendation?: TimelineRecommendation;
  recommendations: GoalRecommendations;
  ready_to_create: boolean;
  confidence: number;
}

export interface UserContext {
  age?: number;
  annual_income?: number;
  location?: string;
  family_status?: string;
  existing_goals?: Goal[];
  current_savings?: number;
  monthly_contribution?: number;
  [key: string]: any;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  AIGoalAssistanceState,
  AlternativeScenario,
  ClarifyingQuestion,
  CostEstimate,
  EducationalContext,
  GoalConflict,
  GoalRecommendations,
  GoalTemplate,
  ParsedGoalData,
  QuickSetupData,
  TimelineRecommendation,
  UserContext,
};
