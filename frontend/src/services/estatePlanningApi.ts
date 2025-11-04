/**
 * Estate Planning API Service
 *
 * Provides methods to interact with estate planning backend endpoints
 */

import axios from 'axios';
import type {
  EstateTaxCalculationRequest,
  EstateTaxCalculation,
  TrustRecommendationRequest,
  TrustRecommendationsResponse,
  BeneficiaryOptimizationRequest,
  BeneficiaryOptimizationResponse,
  LegacyGoalRequest,
  LegacyGoalAnalysis,
  GiftingStrategyRequest,
  GiftingStrategyAnalysis,
  TrustTypesResponse,
  EstateTaxRatesResponse,
} from '../types/estatePlanning';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ESTATE_PLANNING_BASE = `${API_BASE_URL}/api/v1/estate-planning`;

/**
 * Calculate estate taxes
 */
export async function calculateEstateTax(
  request: EstateTaxCalculationRequest
): Promise<EstateTaxCalculation> {
  const response = await axios.post<EstateTaxCalculation>(
    `${ESTATE_PLANNING_BASE}/calculate-estate-tax`,
    request
  );
  return response.data;
}

/**
 * Get personalized trust structure recommendations
 */
export async function recommendTrustStructures(
  request: TrustRecommendationRequest
): Promise<TrustRecommendationsResponse> {
  const response = await axios.post<TrustRecommendationsResponse>(
    `${ESTATE_PLANNING_BASE}/recommend-trusts`,
    request
  );
  return response.data;
}

/**
 * Optimize beneficiary designations
 */
export async function optimizeBeneficiaryDesignations(
  request: BeneficiaryOptimizationRequest
): Promise<BeneficiaryOptimizationResponse> {
  const response = await axios.post<BeneficiaryOptimizationResponse>(
    `${ESTATE_PLANNING_BASE}/optimize-beneficiaries`,
    request
  );
  return response.data;
}

/**
 * Calculate legacy goal funding requirements
 */
export async function calculateLegacyGoal(
  request: LegacyGoalRequest
): Promise<LegacyGoalAnalysis> {
  const response = await axios.post<LegacyGoalAnalysis>(
    `${ESTATE_PLANNING_BASE}/calculate-legacy-goal`,
    request
  );
  return response.data;
}

/**
 * Analyze gifting strategy
 */
export async function analyzeGiftingStrategy(
  request: GiftingStrategyRequest
): Promise<GiftingStrategyAnalysis> {
  const response = await axios.post<GiftingStrategyAnalysis>(
    `${ESTATE_PLANNING_BASE}/analyze-gifting-strategy`,
    request
  );
  return response.data;
}

/**
 * Get available trust types
 */
export async function getTrustTypes(): Promise<TrustTypesResponse> {
  const response = await axios.get<TrustTypesResponse>(
    `${ESTATE_PLANNING_BASE}/trust-types`
  );
  return response.data;
}

/**
 * Get current estate tax rates
 */
export async function getEstateTaxRates(): Promise<EstateTaxRatesResponse> {
  const response = await axios.get<EstateTaxRatesResponse>(
    `${ESTATE_PLANNING_BASE}/estate-tax-rates`
  );
  return response.data;
}

/**
 * Health check for estate planning service
 */
export async function checkHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  const response = await axios.get(`${ESTATE_PLANNING_BASE}/health`);
  return response.data;
}

// Error handling wrapper
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message;
      throw new Error(`${errorMessage}: ${message}`);
    }
    throw new Error(errorMessage);
  }
}

// Export all API functions with error handling
export const estatePlanningApi = {
  calculateEstateTax: (req: EstateTaxCalculationRequest) =>
    safeApiCall(() => calculateEstateTax(req), 'Failed to calculate estate tax'),

  recommendTrustStructures: (req: TrustRecommendationRequest) =>
    safeApiCall(() => recommendTrustStructures(req), 'Failed to get trust recommendations'),

  optimizeBeneficiaryDesignations: (req: BeneficiaryOptimizationRequest) =>
    safeApiCall(() => optimizeBeneficiaryDesignations(req), 'Failed to optimize beneficiary designations'),

  calculateLegacyGoal: (req: LegacyGoalRequest) =>
    safeApiCall(() => calculateLegacyGoal(req), 'Failed to calculate legacy goal'),

  analyzeGiftingStrategy: (req: GiftingStrategyRequest) =>
    safeApiCall(() => analyzeGiftingStrategy(req), 'Failed to analyze gifting strategy'),

  getTrustTypes: () =>
    safeApiCall(() => getTrustTypes(), 'Failed to get trust types'),

  getEstateTaxRates: () =>
    safeApiCall(() => getEstateTaxRates(), 'Failed to get estate tax rates'),

  checkHealth: () =>
    safeApiCall(() => checkHealth(), 'Failed to check service health'),
};

export default estatePlanningApi;
