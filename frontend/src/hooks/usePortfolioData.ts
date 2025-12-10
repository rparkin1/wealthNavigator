/**
 * Portfolio Data Hook
 *
 * Custom React hook for fetching real portfolio data from Plaid integration
 * Replaces hardcoded mock data in Analysis & Scenarios pages
 */

import { useState, useEffect, useCallback } from 'react';
import { portfolioApi, type PortfolioSummaryResponse, type DetailedPortfolioResponse, type FinancialSnapshotResponse } from '../services/portfolioApi';
import type { ErrorResponse } from '../types/api';

interface PortfolioDataState {
  summary: PortfolioSummaryResponse | null;
  detailed: DetailedPortfolioResponse | null;
  financialSnapshot: FinancialSnapshotResponse | null;
  loading: boolean;
  error: ErrorResponse | null;
}

/**
 * Hook to fetch portfolio summary data (value, allocation, counts)
 */
export function usePortfolioSummary(userId: string) {
  const [state, setState] = useState<{
    data: PortfolioSummaryResponse | null;
    loading: boolean;
    error: ErrorResponse | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const response = await portfolioApi.getPortfolioSummary(userId);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Hook to fetch detailed portfolio data (summary + holdings + account breakdown)
 */
export function useDetailedPortfolio(userId: string) {
  const [state, setState] = useState<{
    data: DetailedPortfolioResponse | null;
    loading: boolean;
    error: ErrorResponse | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const response = await portfolioApi.getDetailedPortfolio(userId);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Hook to fetch financial snapshot (income, expenses, reserves)
 */
export function useFinancialSnapshot(userId: string) {
  const [state, setState] = useState<{
    data: FinancialSnapshotResponse | null;
    loading: boolean;
    error: ErrorResponse | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const response = await portfolioApi.getFinancialSnapshot(userId);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

/**
 * Comprehensive hook to fetch all portfolio data at once
 * Use this when you need complete portfolio information
 */
export function usePortfolioData(userId: string) {
  const [state, setState] = useState<PortfolioDataState>({
    summary: null,
    detailed: null,
    financialSnapshot: null,
    loading: false,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all data in parallel
      const [summaryResponse, detailedResponse, snapshotResponse] = await Promise.all([
        portfolioApi.getPortfolioSummary(userId),
        portfolioApi.getDetailedPortfolio(userId),
        portfolioApi.getFinancialSnapshot(userId),
      ]);

      // Check for errors
      if (summaryResponse.error || detailedResponse.error || snapshotResponse.error) {
        const error = summaryResponse.error || detailedResponse.error || snapshotResponse.error;
        setState({
          summary: null,
          detailed: null,
          financialSnapshot: null,
          loading: false,
          error: error || { error: 'Unknown error', detail: 'Failed to fetch portfolio data' },
        });
        return;
      }

      setState({
        summary: summaryResponse.data,
        detailed: detailedResponse.data,
        financialSnapshot: snapshotResponse.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        summary: null,
        detailed: null,
        financialSnapshot: null,
        loading: false,
        error: {
          error: 'Network error',
          detail: error instanceof Error ? error.message : 'Failed to fetch portfolio data',
        },
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { ...state, refetch: fetchAll };
}
