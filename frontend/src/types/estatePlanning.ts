/**
 * Estate Planning Types
 *
 * TypeScript type definitions for estate planning features including:
 * - Estate tax calculations
 * - Trust structures
 * - Beneficiary designations
 * - Legacy goals
 * - Gifting strategies
 */

// Estate Tax Calculation Types

export interface EstateTaxCalculationRequest {
  estate_value: number;
  state?: string;
  marital_status: "single" | "married";
  charitable_donations?: number;
  life_insurance_value?: number;
  debt_value?: number;
}

export interface EstateTaxCalculation {
  gross_estate: number;
  deductions: number;
  taxable_estate: number;
  federal_exemption: number;
  federal_taxable_amount: number;
  federal_tax: number;
  state_exemption: number;
  state_taxable_amount: number;
  state_tax: number;
  total_tax: number;
  net_estate: number;
  effective_rate: number;
  has_federal_tax_liability: boolean;
  has_state_tax_liability: boolean;
}

// Trust Structure Types

export interface TrustRecommendationRequest {
  estate_value: number;
  age: number;
  marital_status: string;
  has_children: boolean;
  charitable_intent?: boolean;
  asset_protection_needs?: boolean;
  business_owner?: boolean;
}

export interface TrustStructure {
  name: string;
  estate_tax_benefit: boolean;
  probate_avoidance: boolean;
  asset_protection: boolean;
  complexity: "low" | "medium" | "high";
  cost: number;
  priority?: "high" | "medium" | "low";
  reason?: string;
  suitability_score?: number;
}

export interface TrustRecommendationsResponse {
  recommendations: TrustStructure[];
}

// Beneficiary Designation Types

export interface BeneficiaryAccount {
  account_id: string;
  account_type: "ira" | "401k" | "403b" | "taxable" | "roth_ira" | "roth_401k";
  value: number;
}

export interface Beneficiary {
  beneficiary_id: string;
  name: string;
  relationship: "spouse" | "child" | "charity" | "trust" | "other";
  age?: number;
}

export interface BeneficiaryOptimizationRequest {
  accounts: BeneficiaryAccount[];
  beneficiaries: Beneficiary[];
  estate_plan_goals: Record<string, any>;
}

export interface BeneficiaryStrategy {
  strategy: string;
  accounts?: string[] | string;
  beneficiary?: string;
  beneficiaries?: string[];
  reason: string;
  tax_benefit: string;
  priority: "high" | "medium" | "low";
}

export interface BeneficiaryOptimizationResponse {
  recommendations: BeneficiaryStrategy[];
  estimated_tax_savings: number;
  key_actions: string[];
}

// Legacy Goal Types

export interface LegacyGoalRequest {
  desired_legacy_amount: number;
  current_estate_value: number;
  years_to_legacy: number;
  expected_return: number;
  state?: string;
}

export interface FundingStrategy {
  strategy: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface LegacyGoalAnalysis {
  desired_legacy: number;
  estimated_estate_tax: number;
  gross_estate_needed: number;
  current_estate_value: number;
  projected_estate_value: number;
  is_on_track: boolean;
  shortfall: number;
  surplus: number;
  annual_savings_needed: number;
  monthly_savings_needed: number;
  life_insurance_alternative: number;
  funding_strategies: FundingStrategy[];
}

// Gifting Strategy Types

export interface GiftingStrategyRequest {
  estate_value: number;
  annual_gift_amount: number;
  years: number;
  expected_return: number;
}

export interface GiftingStrategyAnalysis {
  annual_gift_amount: number;
  years_of_gifting: number;
  total_gifts: number;
  estate_without_gifting: number;
  estate_with_gifting: number;
  gifts_future_value: number;
  tax_without_gifting: number;
  tax_with_gifting: number;
  tax_savings: number;
  wealth_transferred_no_gifts: number;
  wealth_transferred_with_gifts: number;
  additional_wealth: number;
  is_within_annual_exclusion: boolean;
  gift_tax_applicable: boolean;
}

// Reference Data Types

export interface TrustTypesResponse {
  trust_types: Record<string, TrustStructure>;
}

export interface StateTaxInfo {
  exemption: number;
  rate: number;
}

export interface EstateTaxRatesResponse {
  federal: {
    exemption: number;
    rate: number;
    year: number;
  };
  states: Record<string, StateTaxInfo>;
}

// UI State Types

export interface EstatePlanningState {
  taxCalculation: EstateTaxCalculation | null;
  trustRecommendations: TrustStructure[];
  beneficiaryOptimization: BeneficiaryOptimizationResponse | null;
  legacyGoal: LegacyGoalAnalysis | null;
  giftingAnalysis: GiftingStrategyAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

// Form State Types

export interface EstateTaxForm {
  estateValue: number;
  state: string;
  maritalStatus: "single" | "married";
  charitableDonations: number;
  lifeInsuranceValue: number;
  debtValue: number;
}

export interface TrustRecommendationForm {
  estateValue: number;
  age: number;
  maritalStatus: string;
  hasChildren: boolean;
  charitableIntent: boolean;
  assetProtectionNeeds: boolean;
  businessOwner: boolean;
}

export interface LegacyGoalForm {
  desiredLegacyAmount: number;
  currentEstateValue: number;
  yearsToLegacy: number;
  expectedReturn: number;
  state: string;
}

export interface GiftingStrategyForm {
  estateValue: number;
  annualGiftAmount: number;
  years: number;
  expectedReturn: number;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  Beneficiary,
  BeneficiaryAccount,
  BeneficiaryOptimizationRequest,
  BeneficiaryOptimizationResponse,
  BeneficiaryStrategy,
  EstatePlanningState,
  EstateTaxCalculation,
  EstateTaxCalculationRequest,
  EstateTaxForm,
  EstateTaxRatesResponse,
  FundingStrategy,
  GiftingStrategyAnalysis,
  GiftingStrategyForm,
  GiftingStrategyRequest,
  LegacyGoalAnalysis,
  LegacyGoalForm,
  LegacyGoalRequest,
  StateTaxInfo,
  TrustRecommendationForm,
  TrustRecommendationRequest,
  TrustRecommendationsResponse,
  TrustStructure,
  TrustTypesResponse,
};
