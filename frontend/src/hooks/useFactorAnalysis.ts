/**
 * Hooks for Factor Attribution (Fama-French) Analysis
 */

import { useState, useCallback } from 'react';
import type {
  FactorAnalysisRequest,
  FactorAnalysisResponse,
  FactorAnalysisState,
} from '../types/factorAnalysis';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Hook for Factor Attribution analysis
 */
export function useFactorAnalysis() {
  const [state, setState] = useState<FactorAnalysisState>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (request: FactorAnalysisRequest) => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/portfolio-optimization/factor-attribution`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze factor attribution');
      }

      const data: FactorAnalysisResponse = await response.json();
      setState({ data, loading: false, error: null });

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      return { data: null, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}

/**
 * Example data generator for demo mode
 */
export function generateSampleFactorData(): FactorAnalysisResponse {
  return {
    model_type: 'three_factor',
    alpha: 0.0003,
    alpha_annual: 0.0756,
    alpha_t_stat: 2.15,
    alpha_p_value: 0.032,
    r_squared: 0.89,
    adjusted_r_squared: 0.88,
    exposures: [
      {
        factor_name: 'MKT_RF',
        beta: 0.95,
        t_statistic: 15.3,
        p_value: 0.001,
        is_significant: true,
      },
      {
        factor_name: 'SMB',
        beta: 0.12,
        t_statistic: 2.8,
        p_value: 0.006,
        is_significant: true,
      },
      {
        factor_name: 'HML',
        beta: 0.18,
        t_statistic: 3.2,
        p_value: 0.002,
        is_significant: true,
      },
    ],
    attributions: [
      {
        factor_name: 'MKT_RF',
        beta: 0.95,
        factor_return: 0.08,
        contribution: 0.076,
        contribution_pct: 85.3,
      },
      {
        factor_name: 'SMB',
        beta: 0.12,
        factor_return: 0.03,
        contribution: 0.0036,
        contribution_pct: 4.0,
      },
      {
        factor_name: 'HML',
        beta: 0.18,
        factor_return: 0.04,
        contribution: 0.0072,
        contribution_pct: 8.1,
      },
    ],
    total_return: 0.089,
    explained_return: 0.087,
    residual_return: 0.002,
    interpretation:
      'Portfolio generated significant positive alpha of 7.56% annually, outperforming the factor model expectations. Significant factor exposures: MKT_RF (β=0.95), SMB (β=0.12), HML (β=0.18). The model explains 89.0% of portfolio variance (excellent fit).',
    recommendations: [
      '✅ Strong positive alpha (7.56%). Strategy is adding value above factor exposures.',
      '📈 Moderate small-cap tilt (SMB β=0.12). Expect some size premium capture.',
      '📈 Moderate value tilt (HML β=0.18). Portfolio favors value stocks over growth.',
      '✅ Factor exposures are well-balanced. Continue regular monitoring of performance attribution.',
    ],
  };
}
