/**
 * Life Events TypeScript Type Definitions
 *
 * Comprehensive type definitions for life event modeling and simulation.
 */

/**
 * Life Event Types (matches backend enum)
 */
export type LifeEventType =
  | 'job_loss'
  | 'disability'
  | 'divorce'
  | 'inheritance'
  | 'major_medical'
  | 'home_purchase'
  | 'business_start'
  | 'career_change'
  | 'marriage'
  | 'child_birth'
  | 'relocation'
  | 'windfall';

/**
 * Life Event entity
 */
export interface LifeEvent {
  id: string;
  user_id: string;
  goal_id?: string;
  event_type: LifeEventType;
  name: string;
  description?: string;
  start_year: number;
  duration_years: number;
  probability: number; // 0.0 - 1.0
  enabled: boolean;
  financial_impact: FinancialImpact;
  simulation_results?: SimulationResults;
  created_at: string;
  updated_at: string;
  last_simulated_at?: string;
}

/**
 * Event-specific financial parameters (union type based on event_type)
 */
export type FinancialImpact =
  | JobLossImpact
  | DisabilityImpact
  | DivorceImpact
  | InheritanceImpact
  | MajorMedicalImpact
  | HomePurchaseImpact
  | BusinessStartImpact
  | CareerChangeImpact
  | MarriageImpact
  | ChildBirthImpact
  | RelocationImpact
  | WindfallImpact;

export interface JobLossImpact {
  income_loss_percentage: number;
  severance_months: number;
  job_search_months: number;
  new_income_percentage: number;
}

export interface DisabilityImpact {
  income_replacement_rate: number;
  waiting_period_months: number;
  duration: 'short_term' | 'long_term' | 'permanent';
  duration_months?: number;
  medical_expenses_annual: number;
}

export interface DivorceImpact {
  asset_split_percentage: number;
  alimony_monthly: number;
  alimony_duration_years: number;
  child_support_monthly: number;
  child_support_duration_years?: number;
  legal_costs: number;
}

export interface InheritanceImpact {
  amount: number;
  tax_rate: number;
  asset_type: 'cash' | 'property' | 'securities';
}

export interface MajorMedicalImpact {
  out_of_pocket_max: number;
  ongoing_expenses_annual: number;
  duration_years: number;
  income_impact_percentage: number;
}

export interface HomePurchaseImpact {
  home_price: number;
  down_payment: number;
  mortgage_rate: number;
  mortgage_years: number;
  closing_costs: number;
  property_tax_annual: number;
}

export interface BusinessStartImpact {
  initial_investment: number;
  expected_annual_income: number;
  years_to_profitability: number;
  failure_probability: number;
}

export interface CareerChangeImpact {
  income_change_percentage: number;
  education_costs: number;
  transition_months: number;
  long_term_income_potential: number;
}

export interface MarriageImpact {
  partner_income_annual: number;
  combined_expense_factor: number;
  wedding_costs: number;
}

export interface ChildBirthImpact {
  delivery_costs: number;
  childcare_annual: number;
  childcare_duration_years: number;
  education_529_contribution_monthly: number;
}

export interface RelocationImpact {
  moving_costs: number;
  income_change_percentage: number;
  cost_of_living_change: number;
}

export interface WindfallImpact {
  amount: number;
  source: 'bonus' | 'lottery' | 'sale' | 'settlement';
  tax_rate: number;
}

/**
 * Simulation Results
 */
export interface SimulationResults {
  event_id: string;
  event_type: LifeEventType;
  baseline: ScenarioResult;
  with_event: ScenarioResult;
  impact: ImpactAnalysis;
  recovery_analysis?: RecoveryAnalysis;
}

export interface ScenarioResult {
  success_probability: number;
  median_portfolio_value: number;
}

export interface ImpactAnalysis {
  success_probability_delta: number;
  success_probability_delta_percentage: number;
  portfolio_value_delta: number;
  portfolio_value_delta_percentage: number;
  severity: 'minimal' | 'moderate' | 'significant' | 'severe';
  recommended_actions: string[];
}

export interface RecoveryAnalysis {
  estimated_recovery_years: number;
  value_to_recover: number;
  recovery_feasible: boolean;
}

/**
 * Event Template
 */
export interface EventTemplate {
  id: string;
  event_type: LifeEventType;
  name: string;
  description?: string;
  default_parameters: Partial<FinancialImpact>;
  usage_count: number;
  average_rating?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * API Request/Response Types
 */
export interface CreateLifeEventRequest {
  goal_id?: string;
  event_type: LifeEventType;
  name: string;
  description?: string;
  start_year: number;
  duration_years?: number;
  probability?: number;
  enabled?: boolean;
  financial_impact: Partial<FinancialImpact>;
}

export interface UpdateLifeEventRequest {
  name?: string;
  description?: string;
  start_year?: number;
  duration_years?: number;
  probability?: number;
  enabled?: boolean;
  financial_impact?: Partial<FinancialImpact>;
}

export interface SimulateEventRequest {
  goal_id: string;
  iterations?: number;
}

export interface GetEventsParams {
  goal_id?: string;
  event_type?: LifeEventType;
  enabled_only?: boolean;
}

/**
 * Component Props Types
 */
export interface LifeEventManagerProps {
  goalId?: string;
  onEventSelect?: (event: LifeEvent) => void;
}

export interface LifeEventFormProps {
  onClose: () => void;
  onSave: (event: CreateLifeEventRequest | UpdateLifeEventRequest) => Promise<void>;
  initialData?: LifeEvent;
  goalId?: string;
}

export interface LifeEventTimelineProps {
  events: TimelineEvent[];
  currentYear?: number;
  width?: number;
  height?: number;
  onEventClick?: (eventId: string) => void;
}

export interface TimelineEvent {
  id: string;
  name: string;
  year: number;
  duration: number;
  type: LifeEventType;
  enabled: boolean;
}

export interface LifeEventImpactComparisonProps {
  event: LifeEvent;
  onClose: () => void;
}

export interface EventTemplateSelectorProps {
  eventType?: LifeEventType;
  onSelect: (template: EventTemplate) => void;
  onClose: () => void;
}

/**
 * Event Type Metadata
 */
export interface EventTypeMetadata {
  value: LifeEventType;
  label: string;
  icon: string;
  category: 'negative' | 'positive' | 'neutral';
  defaultDuration: number;
  defaultProbability: number;
}

export const EVENT_TYPE_METADATA: Record<LifeEventType, EventTypeMetadata> = {
  job_loss: {
    value: 'job_loss',
    label: 'Job Loss',
    icon: '💼',
    category: 'negative',
    defaultDuration: 1,
    defaultProbability: 1.0,
  },
  disability: {
    value: 'disability',
    label: 'Disability',
    icon: '🏥',
    category: 'negative',
    defaultDuration: 5,
    defaultProbability: 1.0,
  },
  divorce: {
    value: 'divorce',
    label: 'Divorce',
    icon: '💔',
    category: 'negative',
    defaultDuration: 1,
    defaultProbability: 1.0,
  },
  inheritance: {
    value: 'inheritance',
    label: 'Inheritance',
    icon: '💰',
    category: 'positive',
    defaultDuration: 1,
    defaultProbability: 0.5,
  },
  major_medical: {
    value: 'major_medical',
    label: 'Major Medical',
    icon: '🏥',
    category: 'negative',
    defaultDuration: 3,
    defaultProbability: 1.0,
  },
  home_purchase: {
    value: 'home_purchase',
    label: 'Home Purchase',
    icon: '🏡',
    category: 'neutral',
    defaultDuration: 1,
    defaultProbability: 1.0,
  },
  business_start: {
    value: 'business_start',
    label: 'Business Start',
    icon: '🚀',
    category: 'neutral',
    defaultDuration: 5,
    defaultProbability: 1.0,
  },
  career_change: {
    value: 'career_change',
    label: 'Career Change',
    icon: '📊',
    category: 'neutral',
    defaultDuration: 2,
    defaultProbability: 1.0,
  },
  marriage: {
    value: 'marriage',
    label: 'Marriage',
    icon: '💍',
    category: 'positive',
    defaultDuration: 1,
    defaultProbability: 1.0,
  },
  child_birth: {
    value: 'child_birth',
    label: 'Child Birth',
    icon: '👶',
    category: 'neutral',
    defaultDuration: 18,
    defaultProbability: 1.0,
  },
  relocation: {
    value: 'relocation',
    label: 'Relocation',
    icon: '📦',
    category: 'neutral',
    defaultDuration: 1,
    defaultProbability: 1.0,
  },
  windfall: {
    value: 'windfall',
    label: 'Windfall',
    icon: '🎰',
    category: 'positive',
    defaultDuration: 1,
    defaultProbability: 0.2,
  },
};
