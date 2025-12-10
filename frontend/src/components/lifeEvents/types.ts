/**
 * Shared TypeScript interfaces for Life Events
 */

export interface LifeEvent {
  id: string;
  user_id: string;
  goal_id?: string;
  event_type: string;
  name: string;
  description?: string;
  start_year: number;
  duration_years: number;
  probability: number;
  enabled: boolean;
  financial_impact: Record<string, any>;
  simulation_results?: {
    baseline: { success_probability: number; median_portfolio_value: number };
    with_event: { success_probability: number; median_portfolio_value: number };
    impact: {
      success_probability_delta: number;
      portfolio_value_delta: number;
      severity: string;
      recommended_actions: string[];
    };
  };
  created_at: string;
  updated_at: string;
  last_simulated_at?: string;
}

export interface LifeEventManagerProps {
  goalId?: string;
  onEventSelect?: (event: LifeEvent) => void;
}
