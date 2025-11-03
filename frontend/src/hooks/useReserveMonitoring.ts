/**
 * useReserveMonitoring Hook
 * React hook for emergency fund and reserve monitoring
 */

import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ReserveAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action_required: string;
  priority: number;
}

export interface ReserveRecommendation {
  action: string;
  monthly_target: number;
  time_to_goal: number;
  rationale: string;
  impact: string;
}

export interface ReserveMonitoringResult {
  current_reserves: number;
  monthly_expenses: number;
  months_coverage: number;
  reserve_status: 'critical' | 'low' | 'adequate' | 'strong' | 'excellent';
  minimum_target: number;
  recommended_target: number;
  optimal_target: number;
  shortfall: number;
  target_met: boolean;
  alerts: ReserveAlert[];
  recommendations: ReserveRecommendation[];
  trend: string;
  last_updated: string;
}

export interface ReserveAdequacyScore {
  score: number;
  rating: string;
  months_coverage: number;
  target_months: number;
}

export interface ReserveGrowthSimulation {
  initial_balance: number;
  final_balance: number;
  monthly_contribution: number;
  target_amount: number;
  target_reached_month: number | null;
  months_simulated: number;
  projection: Array<{ month: number; balance: number }>;
}

export interface UseReserveMonitoringResult {
  // Reserve monitoring
  reserveResult: ReserveMonitoringResult | null;
  loadingReserve: boolean;
  reserveError: string | null;
  monitorReserves: (params: {
    currentReserves: number;
    monthlyExpenses: number;
    monthlyIncome: number;
    hasDependents?: boolean;
    incomeStability?: string;
    jobSecurity?: string;
  }) => Promise<void>;
  clearReserveResult: () => void;

  // Adequacy score
  adequacyScore: ReserveAdequacyScore | null;
  loadingAdequacy: boolean;
  adequacyError: string | null;
  calculateAdequacyScore: (monthsCoverage: number, targetMonths?: number) => Promise<void>;

  // Growth simulation
  growthSimulation: ReserveGrowthSimulation | null;
  loadingGrowth: boolean;
  growthError: string | null;
  simulateGrowth: (params: {
    currentReserves: number;
    monthlyContribution: number;
    targetAmount: number;
    monthsToSimulate?: number;
  }) => Promise<void>;
}

export function useReserveMonitoring(): UseReserveMonitoringResult {
  // Reserve monitoring state
  const [reserveResult, setReserveResult] = useState<ReserveMonitoringResult | null>(null);
  const [loadingReserve, setLoadingReserve] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  // Adequacy score state
  const [adequacyScore, setAdequacyScore] = useState<ReserveAdequacyScore | null>(null);
  const [loadingAdequacy, setLoadingAdequacy] = useState(false);
  const [adequacyError, setAdequacyError] = useState<string | null>(null);

  // Growth simulation state
  const [growthSimulation, setGrowthSimulation] = useState<ReserveGrowthSimulation | null>(null);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const [growthError, setGrowthError] = useState<string | null>(null);

  // Monitor reserves
  const monitorReserves = useCallback(async (params: {
    currentReserves: number;
    monthlyExpenses: number;
    monthlyIncome: number;
    hasDependents?: boolean;
    incomeStability?: string;
    jobSecurity?: string;
  }) => {
    setLoadingReserve(true);
    setReserveError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reserve-monitoring/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_reserves: params.currentReserves,
          monthly_expenses: params.monthlyExpenses,
          monthly_income: params.monthlyIncome,
          has_dependents: params.hasDependents || false,
          income_stability: params.incomeStability || 'stable',
          job_security: params.jobSecurity || 'secure',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to monitor reserves');
      }

      const data = await response.json();
      setReserveResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to monitor reserves';
      setReserveError(message);
      console.error('Reserve monitoring error:', error);
    } finally {
      setLoadingReserve(false);
    }
  }, []);

  // Calculate adequacy score
  const calculateAdequacyScore = useCallback(async (
    monthsCoverage: number,
    targetMonths: number = 6
  ) => {
    setLoadingAdequacy(true);
    setAdequacyError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reserve-monitoring/adequacy-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months_coverage: monthsCoverage,
          target_months: targetMonths,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate adequacy score');
      }

      const data = await response.json();
      setAdequacyScore(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate adequacy score';
      setAdequacyError(message);
      console.error('Adequacy score error:', error);
    } finally {
      setLoadingAdequacy(false);
    }
  }, []);

  // Simulate growth
  const simulateGrowth = useCallback(async (params: {
    currentReserves: number;
    monthlyContribution: number;
    targetAmount: number;
    monthsToSimulate?: number;
  }) => {
    setLoadingGrowth(true);
    setGrowthError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reserve-monitoring/simulate-growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_reserves: params.currentReserves,
          monthly_contribution: params.monthlyContribution,
          target_amount: params.targetAmount,
          months_to_simulate: params.monthsToSimulate || 36,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to simulate growth');
      }

      const data = await response.json();
      setGrowthSimulation(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to simulate growth';
      setGrowthError(message);
      console.error('Growth simulation error:', error);
    } finally {
      setLoadingGrowth(false);
    }
  }, []);

  const clearReserveResult = useCallback(() => {
    setReserveResult(null);
    setReserveError(null);
  }, []);

  return {
    // Reserve monitoring
    reserveResult,
    loadingReserve,
    reserveError,
    monitorReserves,
    clearReserveResult,

    // Adequacy score
    adequacyScore,
    loadingAdequacy,
    adequacyError,
    calculateAdequacyScore,

    // Growth simulation
    growthSimulation,
    loadingGrowth,
    growthError,
    simulateGrowth,
  };
}
