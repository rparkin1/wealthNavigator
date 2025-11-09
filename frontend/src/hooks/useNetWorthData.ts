/**
 * Net Worth Data Hook
 *
 * Custom React hook for fetching and managing net worth data
 */

import { useState, useCallback, useEffect } from 'react';
import type { NetWorthDataPoint } from '../components/portfolio/NetWorthTrendChart';
import type { ErrorResponse } from '../types/api';
import { netWorthApi } from '../services/netWorthApi';

interface UseNetWorthDataState {
  data: NetWorthDataPoint[] | null;
  loading: boolean;
  error: ErrorResponse | null;
}

export function useNetWorthData(userId: string) {
  const [state, setState] = useState<UseNetWorthDataState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const response = await netWorthApi.getNetWorthHistory(userId);

    if (response.error) {
      setState({ data: null, loading: false, error: response.error });
    } else {
      setState({ data: response.data, loading: false, error: null });
    }

    return response;
  }, [userId]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, refetch, reset };
}

export default useNetWorthData;
