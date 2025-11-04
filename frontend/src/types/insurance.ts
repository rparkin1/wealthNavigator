/**
 * Insurance Optimization Types
 *
 * TypeScript type definitions for insurance optimization features including:
 * - Life insurance needs calculation
 * - Disability coverage analysis
 * - Long-term care planning
 * - Insurance gap analysis
 */

// Life Insurance Types

export interface LifeInsuranceNeedsRequest {
  annual_income: number;
  age: number;
  dependents: number;
  outstanding_debt: number;
  existing_coverage?: number;
  years_to_support?: number;
  college_funding_needed?: number;
  final_expenses?: number;
  current_savings?: number;
}

export interface PolicyRecommendation {
  type: string;
  term_length?: number;
  coverage_amount: number;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface LifeInsuranceRecommendation {
  primary: string;
  recommended_coverage: number;
  reason: string;
  alternatives: PolicyRecommendation[];
}

export interface LifeInsuranceAnalysis {
  total_needs: number;
  income_replacement_need: number;
  debt_coverage_need: number;
  education_funding_need: number;
  final_expenses_need: number;
  existing_coverage: number;
  current_savings: number;
  net_insurance_need: number;
  income_multiplier_used: number;
  years_of_support: number;
  has_adequate_coverage: boolean;
  coverage_gap: number;
  estimated_term_premium_monthly: number;
  estimated_whole_premium_monthly: number;
  recommendation: LifeInsuranceRecommendation;
}

// Disability Coverage Types

export interface DisabilityCoverageRequest {
  annual_income: number;
  age: number;
  occupation: string;
  existing_std_coverage?: number;
  existing_ltd_coverage?: number;
  emergency_fund_months?: number;
  has_employer_coverage?: boolean;
}

export interface DisabilityRecommendation {
  coverage_type: "short_term_disability" | "long_term_disability";
  recommended_monthly_benefit: number;
  benefit_period: string;
  elimination_period: string;
  estimated_annual_cost: number;
  priority: "high" | "medium" | "low";
  reason: string;
  features?: string[];
}

export interface DisabilityCoverage {
  existing_coverage: number;
  recommended_coverage: number;
  gap: number;
  has_adequate_coverage: boolean;
}

export interface DisabilityCoverageAnalysis {
  annual_income: number;
  recommended_monthly_benefit: number;
  replacement_ratio: number;
  short_term_disability: DisabilityCoverage & {
    existing_monthly_coverage?: number;
    recommended_monthly_benefit?: number;
    monthly_gap?: number;
  };
  long_term_disability: {
    existing_monthly_coverage: number;
    recommended_monthly_benefit: number;
    monthly_gap: number;
    has_adequate_coverage: boolean;
  };
  occupation_risk: "low" | "medium" | "high";
  has_employer_coverage: boolean;
  recommendations: DisabilityRecommendation[];
  key_features_to_consider: string[];
}

// Long-Term Care Types

export interface LongTermCareRequest {
  age: number;
  current_assets: number;
  annual_income: number;
  family_history_ltc?: boolean;
  preferred_care_level?: string;
  years_of_care?: number;
  has_existing_policy?: boolean;
  existing_daily_benefit?: number;
}

export interface LTCRecommendation {
  strategy: string;
  description: string;
  priority: "high" | "medium" | "low";
  reason: string;
  key_features?: string[];
}

export interface LongTermCareAnalysis {
  age: number;
  preferred_care_level: string;
  current_daily_cost: number;
  current_annual_cost: number;
  years_of_care_assumed: number;
  years_until_likely_need: number;
  inflated_daily_cost: number;
  inflated_annual_cost: number;
  total_inflated_cost: number;
  current_assets: number;
  can_self_insure: boolean;
  has_existing_policy: boolean;
  existing_daily_benefit: number;
  existing_coverage_value: number;
  coverage_gap: number;
  recommended_daily_benefit: number;
  estimated_annual_premium: number;
  risk_level: "low" | "medium" | "high";
  family_history: boolean;
  recommendations: LTCRecommendation[];
  care_level_costs: {
    home_health_aide: number;
    assisted_living: number;
    nursing_home_semi_private: number;
    nursing_home_private: number;
  };
}

// Insurance Gap Analysis Types

export interface InsuranceGap {
  category: "life_insurance" | "disability_insurance" | "long_term_care";
  description: string;
  gap_amount?: number;
  std_gap?: number;
  ltd_monthly_gap?: number;
  annual_cost: number;
  priority: "high" | "medium" | "low";
  recommendations: any[];
}

export interface InsuranceGapAnalysisRequest {
  life_insurance_analysis: LifeInsuranceAnalysis;
  disability_analysis: DisabilityCoverageAnalysis;
  ltc_analysis: LongTermCareAnalysis;
}

export interface InsuranceGapAnalysis {
  total_gaps_identified: number;
  critical_gaps: number;
  overall_risk_level: "none" | "low" | "medium" | "high";
  total_annual_cost_to_close_gaps: number;
  gaps: InsuranceGap[];
  priority_actions: string[];
  summary: {
    has_life_insurance_gap: boolean;
    has_disability_gap: boolean;
    has_ltc_gap: boolean;
  };
}

// Reference Data Types

export interface PolicyType {
  name: string;
  coverage_period: string;
  cash_value?: boolean;
  replacement_ratio?: number;
  typical_daily_benefit?: number;
  typical_cost: string;
  best_for: string;
}

export interface PolicyTypesResponse {
  policy_types: Record<string, PolicyType>;
}

export interface LTCCostsResponse {
  year: number;
  costs: {
    home_health_aide: number;
    assisted_living: number;
    nursing_home_semi_private: number;
    nursing_home_private: number;
  };
  note: string;
}

// UI State Types

export interface InsuranceOptimizationState {
  lifeInsuranceAnalysis: LifeInsuranceAnalysis | null;
  disabilityAnalysis: DisabilityCoverageAnalysis | null;
  ltcAnalysis: LongTermCareAnalysis | null;
  gapAnalysis: InsuranceGapAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

// Form State Types

export interface LifeInsuranceForm {
  annualIncome: number;
  age: number;
  dependents: number;
  outstandingDebt: number;
  existingCoverage: number;
  yearsToSupport: number;
  collegeFundingNeeded: number;
  finalExpenses: number;
  currentSavings: number;
}

export interface DisabilityForm {
  annualIncome: number;
  age: number;
  occupation: string;
  existingStdCoverage: number;
  existingLtdCoverage: number;
  emergencyFundMonths: number;
  hasEmployerCoverage: boolean;
}

export interface LongTermCareForm {
  age: number;
  currentAssets: number;
  annualIncome: number;
  familyHistoryLtc: boolean;
  preferredCareLevel: string;
  yearsOfCare: number;
  hasExistingPolicy: boolean;
  existingDailyBenefit: number;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  DisabilityCoverage,
  DisabilityCoverageAnalysis,
  DisabilityCoverageRequest,
  DisabilityForm,
  DisabilityRecommendation,
  InsuranceGap,
  InsuranceGapAnalysis,
  InsuranceGapAnalysisRequest,
  InsuranceOptimizationState,
  LifeInsuranceAnalysis,
  LifeInsuranceForm,
  LifeInsuranceNeedsRequest,
  LifeInsuranceRecommendation,
  LongTermCareAnalysis,
  LongTermCareForm,
  LongTermCareRequest,
  LTCCostsResponse,
  LTCRecommendation,
  PolicyRecommendation,
  PolicyType,
  PolicyTypesResponse,
};
