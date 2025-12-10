/**
 * Retirement Planning API Service
 * Handles Social Security, spending patterns, longevity, and income projections
 */

import { apiClient } from './api';

// Types
export interface SocialSecurityParams {
  primary_insurance_amount: number;
  birth_year: number;
  filing_age: number;
  cola_rate?: number;
}

export interface SocialSecurityResult {
  monthly_benefit: number;
  annual_benefit: number;
  lifetime_benefits: Record<number, number>;
  full_retirement_age: number;
  reduction_percentage: number;
  increase_percentage: number;
  breakeven_age: number;
  // Original parameters (needed for income projections)
  primary_insurance_amount: number;
  birth_year: number;
  filing_age: number;
  cola_rate: number;
}

export interface SpendingPattern {
  base_annual_spending: number;
  go_go_multiplier?: number;
  slow_go_multiplier?: number;
  no_go_multiplier?: number;
  healthcare_annual?: number;
  healthcare_growth_rate?: number;
  major_expenses?: Array<{
    year: number;
    amount: number;
    description: string;
  }>;
}

export interface SpendingPatternRequest extends SpendingPattern {
  current_age: number;
  planning_age?: number;
  inflation_rate?: number;
}

export interface LongevityAssumptions {
  current_age: number;
  gender: 'male' | 'female';
  health_status?: 'excellent' | 'good' | 'average' | 'poor';
  planning_age?: number;
}

export interface LongevityResult {
  base_life_expectancy: number;
  adjusted_life_expectancy: number;
  planning_age: number;
  survival_probabilities: Record<number, number>;
  years_remaining: number;
  median_lifespan: number;
}

export interface RetirementProjectionRequest {
  user_id: string; // User ID to fetch real portfolio data from Plaid
  current_age: number;
  retirement_age: number;
  social_security?: SocialSecurityParams;
  pension_annual?: number;
  spending_pattern?: SpendingPattern;
  portfolio_withdrawal_rate?: number;
  initial_portfolio?: number; // Optional - backend fetches actual portfolio if not provided
  expected_return?: number; // Expected annual portfolio return (default 7%)
  planning_age?: number;
}

export interface RetirementIncomeProjection {
  year: number;
  age: number;
  social_security: number;
  pension: number;
  portfolio_withdrawal: number;
  other_income: number;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
}

export interface RetirementProjectionMetadata {
  portfolio_source: 'plaid' | 'override' | 'default';
  portfolio_value: number;
  expected_return: number;
  accounts_count: number;
  user_id: string;
}

export interface RetirementProjectionResponse {
  projections: RetirementIncomeProjection[];
  metadata: RetirementProjectionMetadata;
}

// API Functions
export const retirementApi = {
  /**
   * Calculate Social Security benefits
   */
  calculateSocialSecurity: async (
    params: SocialSecurityParams
  ): Promise<SocialSecurityResult> => {
    const response = await apiClient.post('/retirement/social-security', params);
    return response.data;
  },

  /**
   * Calculate spending pattern by age
   */
  calculateSpendingPattern: async (
    request: SpendingPatternRequest
  ): Promise<Record<number, number>> => {
    const response = await apiClient.post('/retirement/spending-pattern', request);
    return response.data;
  },

  /**
   * Calculate life expectancy and survival probabilities
   */
  calculateLongevity: async (
    assumptions: LongevityAssumptions
  ): Promise<LongevityResult> => {
    const response = await apiClient.post('/retirement/longevity', assumptions);
    return response.data;
  },

  /**
   * Project complete retirement income
   */
  projectRetirementIncome: async (
    request: RetirementProjectionRequest
  ): Promise<RetirementProjectionResponse> => {
    console.log('Sending income projection request:', JSON.stringify(request, null, 2));
    const response = await apiClient.post('/retirement/income-projection', request);
    return response.data;
  },

  /**
   * Health check for retirement API
   */
  healthCheck: async (): Promise<{ status: string; module: string }> => {
    const response = await apiClient.get('/retirement/health');
    return response.data;
  },
};

export default retirementApi;
