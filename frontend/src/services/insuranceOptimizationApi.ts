/**
 * Insurance Optimization API Service
 *
 * Provides methods to interact with insurance optimization backend endpoints
 */

import axios from 'axios';
import type {
  LifeInsuranceNeedsRequest,
  LifeInsuranceAnalysis,
  DisabilityCoverageRequest,
  DisabilityCoverageAnalysis,
  LongTermCareRequest,
  LongTermCareAnalysis,
  InsuranceGapAnalysisRequest,
  InsuranceGapAnalysis,
  PolicyTypesResponse,
  LTCCostsResponse,
} from '../types/insurance';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const INSURANCE_BASE = `${API_BASE_URL}/api/v1/insurance-optimization`;

/**
 * Calculate life insurance needs
 */
export async function calculateLifeInsuranceNeeds(
  request: LifeInsuranceNeedsRequest
): Promise<LifeInsuranceAnalysis> {
  const response = await axios.post<LifeInsuranceAnalysis>(
    `${INSURANCE_BASE}/calculate-life-insurance-needs`,
    request
  );
  return response.data;
}

/**
 * Analyze disability coverage needs
 */
export async function analyzeDisabilityCoverage(
  request: DisabilityCoverageRequest
): Promise<DisabilityCoverageAnalysis> {
  const response = await axios.post<DisabilityCoverageAnalysis>(
    `${INSURANCE_BASE}/analyze-disability-coverage`,
    request
  );
  return response.data;
}

/**
 * Calculate long-term care needs
 */
export async function calculateLTCNeeds(
  request: LongTermCareRequest
): Promise<LongTermCareAnalysis> {
  const response = await axios.post<LongTermCareAnalysis>(
    `${INSURANCE_BASE}/calculate-ltc-needs`,
    request
  );
  return response.data;
}

/**
 * Analyze comprehensive insurance gaps
 */
export async function analyzeInsuranceGaps(
  request: InsuranceGapAnalysisRequest
): Promise<InsuranceGapAnalysis> {
  const response = await axios.post<InsuranceGapAnalysis>(
    `${INSURANCE_BASE}/analyze-insurance-gaps`,
    request
  );
  return response.data;
}

/**
 * Get available policy types
 */
export async function getPolicyTypes(): Promise<PolicyTypesResponse> {
  const response = await axios.get<PolicyTypesResponse>(
    `${INSURANCE_BASE}/policy-types`
  );
  return response.data;
}

/**
 * Get current LTC costs
 */
export async function getLTCCosts(): Promise<LTCCostsResponse> {
  const response = await axios.get<LTCCostsResponse>(
    `${INSURANCE_BASE}/ltc-costs`
  );
  return response.data;
}

/**
 * Health check for insurance optimization service
 */
export async function checkHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  const response = await axios.get(`${INSURANCE_BASE}/health`);
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
export const insuranceOptimizationApi = {
  calculateLifeInsuranceNeeds: (req: LifeInsuranceNeedsRequest) =>
    safeApiCall(() => calculateLifeInsuranceNeeds(req), 'Failed to calculate life insurance needs'),

  analyzeDisabilityCoverage: (req: DisabilityCoverageRequest) =>
    safeApiCall(() => analyzeDisabilityCoverage(req), 'Failed to analyze disability coverage'),

  calculateLTCNeeds: (req: LongTermCareRequest) =>
    safeApiCall(() => calculateLTCNeeds(req), 'Failed to calculate LTC needs'),

  analyzeInsuranceGaps: (req: InsuranceGapAnalysisRequest) =>
    safeApiCall(() => analyzeInsuranceGaps(req), 'Failed to analyze insurance gaps'),

  getPolicyTypes: () =>
    safeApiCall(() => getPolicyTypes(), 'Failed to get policy types'),

  getLTCCosts: () =>
    safeApiCall(() => getLTCCosts(), 'Failed to get LTC costs'),

  checkHealth: () =>
    safeApiCall(() => checkHealth(), 'Failed to check service health'),
};

export default insuranceOptimizationApi;
