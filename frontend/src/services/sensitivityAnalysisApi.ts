/**
 * Sensitivity Analysis API Service
 *
 * Client service for advanced sensitivity analysis endpoints including
 * tornado diagrams, heat maps, threshold analysis, and break-even calculations.
 */

import api from './api';
import type {
  OneWaySensitivityRequest,
  OneWaySensitivityResult,
  TwoWaySensitivityRequest,
  TwoWaySensitivityResult,
  ThresholdAnalysisRequest,
  ThresholdAnalysisResult,
  BreakEvenAnalysisRequest,
  BreakEvenAnalysisResult,
  SupportedVariablesResponse,
} from '../types/sensitivityAnalysis';

const BASE_URL = '/api/v1/sensitivity-analysis';

/**
 * Sensitivity Analysis API Client
 */
export const sensitivityAnalysisApi = {
  /**
   * One-Way Sensitivity Analysis (Tornado Diagram)
   *
   * Analyzes the impact of varying multiple variables independently on
   * goal success probability. Results are sorted by impact magnitude.
   *
   * @param request - Analysis parameters including variables to test
   * @returns Tornado diagram data with variable impacts
   *
   * @example
   * ```typescript
   * const result = await sensitivityAnalysisApi.oneWaySensitivity({
   *   goal_id: 'goal-123',
   *   variables: ['monthly_contribution', 'expected_return_stocks', 'inflation_rate'],
   *   variation_percentage: 0.20,
   *   num_points: 5,
   *   iterations_per_point: 1000
   * });
   * ```
   */
  async oneWaySensitivity(
    request: OneWaySensitivityRequest
  ): Promise<OneWaySensitivityResult> {
    const response = await api.post<OneWaySensitivityResult>(
      `${BASE_URL}/one-way`,
      request
    );
    return response.data;
  },

  /**
   * Two-Way Sensitivity Analysis (Heat Map)
   *
   * Analyzes the interaction between two variables and their combined
   * effect on goal success probability across a grid of values.
   *
   * @param request - Analysis parameters including two variables
   * @returns Heat map data with probability grid
   *
   * @example
   * ```typescript
   * const result = await sensitivityAnalysisApi.twoWaySensitivity({
   *   goal_id: 'goal-123',
   *   variable1: 'monthly_contribution',
   *   variable2: 'expected_return_stocks',
   *   variation_percentage: 0.20,
   *   grid_size: 10,
   *   iterations_per_point: 500
   * });
   * ```
   */
  async twoWaySensitivity(
    request: TwoWaySensitivityRequest
  ): Promise<TwoWaySensitivityResult> {
    const response = await api.post<TwoWaySensitivityResult>(
      `${BASE_URL}/two-way`,
      request
    );
    return response.data;
  },

  /**
   * Threshold Analysis
   *
   * Finds the required value of a variable to achieve a target success
   * probability using binary search optimization.
   *
   * @param request - Analysis parameters including variable and target
   * @returns Threshold value and delta from current value
   *
   * @example
   * ```typescript
   * const result = await sensitivityAnalysisApi.thresholdAnalysis({
   *   goal_id: 'goal-123',
   *   variable: 'monthly_contribution',
   *   target_probability: 0.90,
   *   tolerance: 0.01
   * });
   * ```
   */
  async thresholdAnalysis(
    request: ThresholdAnalysisRequest
  ): Promise<ThresholdAnalysisResult> {
    const response = await api.post<ThresholdAnalysisResult>(
      `${BASE_URL}/threshold`,
      request
    );
    return response.data;
  },

  /**
   * Break-Even Analysis
   *
   * Calculates the break-even frontier between two variables showing
   * combinations that achieve the target success probability.
   *
   * @param request - Analysis parameters including two variables
   * @returns Break-even curve and current position analysis
   *
   * @example
   * ```typescript
   * const result = await sensitivityAnalysisApi.breakEvenAnalysis({
   *   goal_id: 'goal-123',
   *   variable1: 'inflation_rate',
   *   variable2: 'monthly_contribution',
   *   target_probability: 0.90,
   *   grid_size: 20,
   *   iterations_per_point: 500
   * });
   * ```
   */
  async breakEvenAnalysis(
    request: BreakEvenAnalysisRequest
  ): Promise<BreakEvenAnalysisResult> {
    const response = await api.post<BreakEvenAnalysisResult>(
      `${BASE_URL}/break-even`,
      request
    );
    return response.data;
  },

  /**
   * Get Supported Variables
   *
   * Retrieves list of all variables that can be used in sensitivity
   * analysis with metadata including descriptions and typical ranges.
   *
   * @returns List of supported variables with metadata
   *
   * @example
   * ```typescript
   * const variables = await sensitivityAnalysisApi.getSupportedVariables();
   * console.log(variables.variables); // Array of VariableInfo
   * ```
   */
  async getSupportedVariables(): Promise<SupportedVariablesResponse> {
    const response = await api.get<SupportedVariablesResponse>(
      `${BASE_URL}/supported-variables`
    );
    return response.data;
  },

  /**
   * Health Check
   *
   * Checks if the sensitivity analysis service is operational.
   *
   * @returns Service health status
   */
  async healthCheck(): Promise<{ service: string; status: string; features: string[] }> {
    const response = await api.get<{ service: string; status: string; features: string[] }>(
      `${BASE_URL}/health`
    );
    return response.data;
  },
};

/**
 * Utility Functions
 */

/**
 * Format variable name for display
 */
export function formatVariableName(variable: string): string {
  return variable
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format variable value based on type
 */
export function formatVariableValue(variable: string, value: number): string {
  if (variable.includes('rate') || variable.includes('return')) {
    return `${(value * 100).toFixed(1)}%`;
  } else if (variable.includes('age') || variable.includes('expectancy')) {
    return `${Math.round(value)} years`;
  } else if (variable.includes('contribution') || variable.includes('amount')) {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return value.toFixed(2);
}

/**
 * Get variable category color
 */
export function getVariableCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    contributions: '#3b82f6', // blue
    returns: '#10b981', // green
    economics: '#f59e0b', // amber
    timing: '#8b5cf6', // purple
    goals: '#ec4899', // pink
  };
  return colors[category] || '#6b7280'; // gray default
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, target: number): number {
  if (current === 0) return 0;
  return ((target - current) / current) * 100;
}

/**
 * Determine impact severity
 */
export function getImpactSeverity(impactRange: number): 'low' | 'medium' | 'high' | 'critical' {
  if (impactRange < 0.1) return 'low';
  if (impactRange < 0.2) return 'medium';
  if (impactRange < 0.3) return 'high';
  return 'critical';
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: '#10b981', // green
    medium: '#f59e0b', // amber
    high: '#f97316', // orange
    critical: '#ef4444', // red
  };
  return colors[severity];
}

export default sensitivityAnalysisApi;
