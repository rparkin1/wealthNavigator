/**
 * Education Funding API Service
 *
 * Handles all education funding calculations, 529 planning, and multi-child optimization.
 */

import { apiClient } from './api';

// Types
export interface EducationCostRequest {
  education_type: 'public_in_state' | 'public_out_state' | 'private' | 'graduate_public' | 'graduate_private';
  years_until_college: number;
  years_of_support: number;
}

export interface EducationCostResponse {
  tuition: number;
  room_and_board: number;
  books_and_supplies: number;
  other_expenses: number;
  total_annual: number;
  education_type: string;
  years_until_college: number;
}

export interface TotalEducationNeedRequest {
  education_type: string;
  child_age: number;
  college_start_age: number;
  years_of_support: number;
}

export interface TotalEducationNeedResponse {
  total_need: number;
  education_type: string;
  child_age: number;
  years_until_college: number;
  annual_costs: number[];
}

export interface Plan529Request {
  target_amount: number;
  current_savings: number;
  years_until_college: number;
  expected_return: number;
  state_tax_deduction: number;
}

export interface Plan529Response {
  monthly_contribution: number;
  annual_contribution: number;
  total_contributions: number;
  projected_balance: number;
  shortfall: number;
  tax_savings: number;
  recommendation: string;
}

export interface FinancialAidRequest {
  parent_income: number;
  parent_assets: number;
  student_assets: number;
  num_children: number;
}

export interface FinancialAidResponse {
  expected_family_contribution: number;
  estimated_need_based_aid: number;
  parent_income_contribution: number;
  parent_asset_contribution: number;
  student_asset_contribution: number;
  recommendation: string;
}

export interface ChildEducation {
  name: string;
  age: number;
  education_type: string;
  years_of_support: number;
}

export interface MultiChildRequest {
  children: ChildEducation[];
  total_monthly_savings: number;
}

export interface MultiChildResponse {
  allocations: Record<string, number>;
  total_allocated: number;
  children_data: Array<{
    name: string;
    age: number;
    years_until_college: number;
    urgency: number;
    total_need: number;
    allocated: number;
  }>;
}

export interface SavingsVehicleRequest {
  years_until_college: number;
  state?: string;
}

export interface SavingsVehicleResponse {
  vehicle: string;
  rationale: string;
  pros: string[];
  cons: string[];
}

export interface EducationTimelineRequest {
  children: ChildEducation[];
}

export interface EducationTimelineResponse {
  timeline: Array<{
    child_name: string;
    college_start_year: number;
    college_end_year: number;
    years_until_college: number;
    education_type: string;
    estimated_annual_cost: number;
  }>;
}

/**
 * Education Funding API Client
 */
export const educationFundingApi = {
  /**
   * Calculate projected education costs with inflation
   */
  calculateCost: async (request: EducationCostRequest): Promise<EducationCostResponse> => {
    const response = await apiClient.post<EducationCostResponse>(
      '/api/v1/education-funding/calculate-cost',
      request
    );
    return response.data;
  },

  /**
   * Calculate total education funding need for all years
   */
  calculateTotalNeed: async (request: TotalEducationNeedRequest): Promise<TotalEducationNeedResponse> => {
    const response = await apiClient.post<TotalEducationNeedResponse>(
      '/api/v1/education-funding/total-need',
      request
    );
    return response.data;
  },

  /**
   * Calculate 529 plan contribution strategy
   */
  calculate529Strategy: async (request: Plan529Request): Promise<Plan529Response> => {
    const response = await apiClient.post<Plan529Response>(
      '/api/v1/education-funding/529-strategy',
      request
    );
    return response.data;
  },

  /**
   * Estimate financial aid eligibility
   */
  calculateFinancialAid: async (request: FinancialAidRequest): Promise<FinancialAidResponse> => {
    const response = await apiClient.post<FinancialAidResponse>(
      '/api/v1/education-funding/financial-aid',
      request
    );
    return response.data;
  },

  /**
   * Optimize funding allocation across multiple children
   */
  optimizeMultiChild: async (request: MultiChildRequest): Promise<MultiChildResponse> => {
    const response = await apiClient.post<MultiChildResponse>(
      '/api/v1/education-funding/optimize-multi-child',
      request
    );
    return response.data;
  },

  /**
   * Generate education timeline for multiple children
   */
  calculateTimeline: async (request: EducationTimelineRequest): Promise<EducationTimelineResponse> => {
    const response = await apiClient.post<EducationTimelineResponse>(
      '/api/v1/education-funding/timeline',
      request
    );
    return response.data;
  },

  /**
   * Get savings vehicle recommendation
   */
  getSavingsVehicleRecommendation: async (request: SavingsVehicleRequest): Promise<SavingsVehicleResponse> => {
    const response = await apiClient.post<SavingsVehicleResponse>(
      '/api/v1/education-funding/savings-vehicle',
      request
    );
    return response.data;
  },
};
