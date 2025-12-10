/**
 * Hooks for CAPM Analysis
 */

import { useState, useCallback } from 'react';
import type {
  CAPMAnalysisRequest,
  CAPMPortfolioRequest,
  CAPMMetrics,
  CAPMPortfolioResponse,
  SecurityMarketLineResponse,
  CAPMAnalysisState,
} from '../types/factorAnalysis';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Hook for CAPM security analysis
 */
export function useCAPMAnalysis() {
  const [state, setState] = useState<CAPMAnalysisState>({
    data: null,
    portfolioData: null,
    smlData: null,
    loading: false,
    error: null,
  });

  const analyzeSecurity = useCallback(async (request: CAPMAnalysisRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/portfolio-optimization/capm-analysis`,
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
        throw new Error(errorData.detail || 'Failed to analyze CAPM');
      }

      const data: CAPMMetrics = await response.json();
      setState(prev => ({ ...prev, data, loading: false, error: null }));

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { data: null, error: errorMessage };
    }
  }, []);

  const analyzePortfolio = useCallback(async (request: CAPMPortfolioRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/portfolio-optimization/capm-portfolio`,
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
        throw new Error(errorData.detail || 'Failed to analyze portfolio CAPM');
      }

      const portfolioData: CAPMPortfolioResponse = await response.json();
      setState(prev => ({ ...prev, portfolioData, loading: false, error: null }));

      return { data: portfolioData, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { data: null, error: errorMessage };
    }
  }, []);

  const fetchSML = useCallback(
    async (betaMin = 0.0, betaMax = 2.0, numPoints = 50) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/portfolio-optimization/security-market-line?beta_min=${betaMin}&beta_max=${betaMax}&num_points=${numPoints}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch SML');
        }

        const smlData: SecurityMarketLineResponse = await response.json();
        setState(prev => ({ ...prev, smlData, loading: false, error: null }));

        return { data: smlData, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return { data: null, error: errorMessage };
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      portfolioData: null,
      smlData: null,
      loading: false,
      error: null,
    });
  }, []);

  return { ...state, analyzeSecurity, analyzePortfolio, fetchSML, reset };
}

/**
 * Example data generator for demo mode
 */
export function generateSampleCAPMData(): CAPMMetrics {
  return {
    risk_free_rate: 0.04,
    market_return: 0.10,
    market_premium: 0.06,
    beta: 1.05,
    beta_confidence_interval: [0.98, 1.12],
    expected_return: 0.103,
    actual_return: 0.115,
    alpha: 0.012,
    r_squared: 0.92,
    correlation: 0.96,
    tracking_error: 0.035,
    information_ratio: 0.34,
    treynor_ratio: 0.071,
    position: 'undervalued',
    distance_from_sml: 0.012,
    interpretation:
      'Portfolio moves roughly in line with the market (β=1.05). Positive alpha of 1.2% indicates outperformance relative to CAPM expectations. High R² (92.0%) means market explains most variance.',
    investment_recommendation:
      '🟢 BUY - Security appears undervalued (positive alpha 1.20%). Strong information ratio (0.34) suggests consistent alpha generation with controlled tracking error.',
  };
}

export function generateSampleSMLData(): SecurityMarketLineResponse {
  const points = [];
  for (let i = 0; i <= 50; i++) {
    const beta = (i / 50) * 2.0; // 0 to 2.0
    const expectedReturn = 0.04 + beta * 0.06; // Rf + β(Rm - Rf)
    points.push({ beta, expected_return: expectedReturn });
  }

  return {
    points,
    portfolio_point: {
      beta: 1.05,
      expected_return: 0.103,
    },
    efficient_portfolios: [
      { name: 0.5, beta: 0.5, expected_return: 0.07 },
      { name: 0.8, beta: 0.8, expected_return: 0.088 },
      { name: 1.0, beta: 1.0, expected_return: 0.10 },
      { name: 1.2, beta: 1.2, expected_return: 0.112 },
      { name: 1.5, beta: 1.5, expected_return: 0.13 },
    ],
  };
}
