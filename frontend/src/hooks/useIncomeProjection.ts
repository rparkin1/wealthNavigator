/**
 * useIncomeProjection Hook
 *
 * Custom hook for fetching and managing retirement income projection data
 */

import { useState, useEffect } from 'react';
import { retirementApi } from '../services/retirementApi';
import type {
  RetirementProjectionRequest,
  RetirementIncomeProjection,
  RetirementProjectionMetadata,
} from '../services/retirementApi';

interface UseIncomeProjectionResult {
  projections: RetirementIncomeProjection[] | null;
  metadata: RetirementProjectionMetadata | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useIncomeProjection(
  request: RetirementProjectionRequest | null
): UseIncomeProjectionResult {
  const [projections, setProjections] = useState<RetirementIncomeProjection[] | null>(null);
  const [metadata, setMetadata] = useState<RetirementProjectionMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjections = async () => {
    if (!request) {
      setProjections(null);
      setMetadata(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await retirementApi.projectRetirementIncome(request);
      setProjections(response.projections);
      setMetadata(response.metadata);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch income projections';
      setError(errorMessage);
      setProjections(null);
      setMetadata(null);
      console.error('Income projection error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjections();
  }, [JSON.stringify(request)]);

  return {
    projections,
    metadata,
    loading,
    error,
    refetch: fetchProjections,
  };
}
