/**
 * Portfolio Hooks
 *
 * Custom React hooks for portfolio operations
 */

import { useState, useCallback } from 'react';
import type {
  TaxLossHarvestRequest,
  TaxLossHarvestResponse,
  RebalanceRequest,
  RebalanceResponse,
  PerformanceRequest,
  PerformanceResponse,
  ComprehensiveAnalysisRequest,
  ComprehensiveAnalysisResponse,
} from '../types/portfolio';
import type { ErrorResponse } from '../types/api';
import { portfolioApi } from '../services/portfolioApi';

interface UsePortfolioState<T> {
  data: T | null;
  loading: boolean;
  error: ErrorResponse | null;
}

/**
 * Hook for tax-loss harvesting analysis
 */
export function useTaxLossHarvesting() {
  const [state, setState] = useState<UsePortfolioState<TaxLossHarvestResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (request: TaxLossHarvestRequest) => {
    setState({ data: null, loading: true, error: null });

    const response = await portfolioApi.analyzeTaxLossHarvesting(request);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }

    return response;
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}

/**
 * Hook for portfolio rebalancing analysis
 */
export function useRebalancing() {
  const [state, setState] = useState<UsePortfolioState<RebalanceResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (request: RebalanceRequest) => {
    setState({ data: null, loading: true, error: null });

    const response = await portfolioApi.analyzeRebalancing(request);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }

    return response;
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}

/**
 * Hook for portfolio performance analysis
 */
export function usePerformance() {
  const [state, setState] = useState<UsePortfolioState<PerformanceResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (request: PerformanceRequest) => {
    setState({ data: null, loading: true, error: null });

    const response = await portfolioApi.analyzePerformance(request);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }

    return response;
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}

/**
 * Hook for comprehensive portfolio analysis
 */
export function useComprehensiveAnalysis() {
  const [state, setState] = useState<UsePortfolioState<ComprehensiveAnalysisResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (request: ComprehensiveAnalysisRequest) => {
    setState({ data: null, loading: true, error: null });

    const response = await portfolioApi.analyzeComprehensive(request);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }

    return response;
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, analyze, reset };
}
