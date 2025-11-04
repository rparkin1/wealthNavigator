/**
 * useRiskManagement Hook
 * React hook for managing risk assessment, stress testing, and hedging strategies
 */

import { useState, useCallback } from 'react';
import {
  assessRisk,
  runStressTest,
  getHedgingRecommendations,
  runMonteCarloStress,
  getStressScenarios,
  healthCheck,
  getServiceSummary,
} from '../services/riskManagementApi';
import type {
  RiskAssessmentRequest,
  RiskAssessmentResult,
  StressTestRequest,
  StressTestingSuite,
  HedgingRequest,
  HedgingRecommendation,
  MonteCarloStressRequest,
  MonteCarloStressResult,
  StressScenariosResponse,
  HealthCheckResponse,
  ServiceSummaryResponse,
} from '../services/riskManagementApi';

export interface UseRiskManagementResult {
  // Risk Assessment
  riskResult: RiskAssessmentResult | null;
  loadingRisk: boolean;
  riskError: string | null;
  assessPortfolioRisk: (request: RiskAssessmentRequest) => Promise<void>;
  clearRiskResult: () => void;

  // Stress Testing
  stressResult: StressTestingSuite | null;
  loadingStress: boolean;
  stressError: string | null;
  performStressTest: (request: StressTestRequest) => Promise<void>;
  clearStressResult: () => void;

  // Hedging Strategies
  hedgingResult: HedgingRecommendation | null;
  loadingHedging: boolean;
  hedgingError: string | null;
  fetchHedgingStrategies: (request: HedgingRequest) => Promise<void>;
  clearHedgingResult: () => void;

  // Monte Carlo Simulation
  monteCarloResult: MonteCarloStressResult | null;
  loadingMonteCarlo: boolean;
  monteCarloError: string | null;
  performMonteCarlo: (request: MonteCarloStressRequest) => Promise<void>;
  clearMonteCarloResult: () => void;

  // Stress Scenarios
  scenarios: StressScenariosResponse | null;
  loadingScenarios: boolean;
  scenariosError: string | null;
  loadStressScenarios: () => Promise<void>;

  // Service Status
  serviceHealth: HealthCheckResponse | null;
  serviceSummary: ServiceSummaryResponse | null;
  loadingService: boolean;
  checkServiceHealth: () => Promise<void>;
  loadServiceSummary: () => Promise<void>;

  // Combined Operations
  runCompleteAnalysis: (
    riskRequest: RiskAssessmentRequest,
    stressRequest: StressTestRequest,
    hedgingRequest: HedgingRequest
  ) => Promise<void>;
  clearAllResults: () => void;
}

/**
 * Hook for managing risk management operations
 */
export function useRiskManagement(): UseRiskManagementResult {
  // Risk Assessment State
  const [riskResult, setRiskResult] = useState<RiskAssessmentResult | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // Stress Testing State
  const [stressResult, setStressResult] = useState<StressTestingSuite | null>(null);
  const [loadingStress, setLoadingStress] = useState(false);
  const [stressError, setStressError] = useState<string | null>(null);

  // Hedging Strategies State
  const [hedgingResult, setHedgingResult] = useState<HedgingRecommendation | null>(null);
  const [loadingHedging, setLoadingHedging] = useState(false);
  const [hedgingError, setHedgingError] = useState<string | null>(null);

  // Monte Carlo State
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloStressResult | null>(null);
  const [loadingMonteCarlo, setLoadingMonteCarlo] = useState(false);
  const [monteCarloError, setMonteCarloError] = useState<string | null>(null);

  // Scenarios State
  const [scenarios, setScenarios] = useState<StressScenariosResponse | null>(null);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [scenariosError, setScenariosError] = useState<string | null>(null);

  // Service Status State
  const [serviceHealth, setServiceHealth] = useState<HealthCheckResponse | null>(null);
  const [serviceSummary, setServiceSummary] = useState<ServiceSummaryResponse | null>(null);
  const [loadingService, setLoadingService] = useState(false);

  // ==================== Risk Assessment ====================

  const assessPortfolioRisk = useCallback(async (request: RiskAssessmentRequest) => {
    setLoadingRisk(true);
    setRiskError(null);
    try {
      const result = await assessRisk(request);
      setRiskResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assess risk';
      setRiskError(message);
      console.error('Risk assessment error:', error);
    } finally {
      setLoadingRisk(false);
    }
  }, []);

  const clearRiskResult = useCallback(() => {
    setRiskResult(null);
    setRiskError(null);
  }, []);

  // ==================== Stress Testing ====================

  const performStressTest = useCallback(async (request: StressTestRequest) => {
    setLoadingStress(true);
    setStressError(null);
    try {
      const result = await runStressTest(request);
      setStressResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run stress test';
      setStressError(message);
      console.error('Stress test error:', error);
    } finally {
      setLoadingStress(false);
    }
  }, []);

  const clearStressResult = useCallback(() => {
    setStressResult(null);
    setStressError(null);
  }, []);

  // ==================== Hedging Strategies ====================

  const fetchHedgingStrategies = useCallback(async (request: HedgingRequest) => {
    setLoadingHedging(true);
    setHedgingError(null);
    try {
      const result = await getHedgingRecommendations(request);
      setHedgingResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch hedging strategies';
      setHedgingError(message);
      console.error('Hedging strategies error:', error);
    } finally {
      setLoadingHedging(false);
    }
  }, []);

  const clearHedgingResult = useCallback(() => {
    setHedgingResult(null);
    setHedgingError(null);
  }, []);

  // ==================== Monte Carlo Simulation ====================

  const performMonteCarlo = useCallback(async (request: MonteCarloStressRequest) => {
    setLoadingMonteCarlo(true);
    setMonteCarloError(null);
    try {
      const result = await runMonteCarloStress(request);
      setMonteCarloResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run Monte Carlo simulation';
      setMonteCarloError(message);
      console.error('Monte Carlo error:', error);
    } finally {
      setLoadingMonteCarlo(false);
    }
  }, []);

  const clearMonteCarloResult = useCallback(() => {
    setMonteCarloResult(null);
    setMonteCarloError(null);
  }, []);

  // ==================== Stress Scenarios ====================

  const loadStressScenarios = useCallback(async () => {
    setLoadingScenarios(true);
    setScenariosError(null);
    try {
      const result = await getStressScenarios();
      setScenarios(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load stress scenarios';
      setScenariosError(message);
      console.error('Load scenarios error:', error);
    } finally {
      setLoadingScenarios(false);
    }
  }, []);

  // ==================== Service Status ====================

  const checkServiceHealth = useCallback(async () => {
    setLoadingService(true);
    try {
      const result = await healthCheck();
      setServiceHealth(result);
    } catch (error) {
      console.error('Health check error:', error);
    } finally {
      setLoadingService(false);
    }
  }, []);

  const loadServiceSummary = useCallback(async () => {
    setLoadingService(true);
    try {
      const result = await getServiceSummary();
      setServiceSummary(result);
    } catch (error) {
      console.error('Service summary error:', error);
    } finally {
      setLoadingService(false);
    }
  }, []);

  // ==================== Combined Operations ====================

  const runCompleteAnalysis = useCallback(
    async (
      riskRequest: RiskAssessmentRequest,
      stressRequest: StressTestRequest,
      hedgingRequest: HedgingRequest
    ) => {
      // Run all three analyses in parallel
      await Promise.all([
        assessPortfolioRisk(riskRequest),
        performStressTest(stressRequest),
        fetchHedgingStrategies(hedgingRequest),
      ]);
    },
    [assessPortfolioRisk, performStressTest, fetchHedgingStrategies]
  );

  const clearAllResults = useCallback(() => {
    clearRiskResult();
    clearStressResult();
    clearHedgingResult();
    clearMonteCarloResult();
  }, [clearRiskResult, clearStressResult, clearHedgingResult, clearMonteCarloResult]);

  return {
    // Risk Assessment
    riskResult,
    loadingRisk,
    riskError,
    assessPortfolioRisk,
    clearRiskResult,

    // Stress Testing
    stressResult,
    loadingStress,
    stressError,
    performStressTest,
    clearStressResult,

    // Hedging Strategies
    hedgingResult,
    loadingHedging,
    hedgingError,
    fetchHedgingStrategies,
    clearHedgingResult,

    // Monte Carlo Simulation
    monteCarloResult,
    loadingMonteCarlo,
    monteCarloError,
    performMonteCarlo,
    clearMonteCarloResult,

    // Stress Scenarios
    scenarios,
    loadingScenarios,
    scenariosError,
    loadStressScenarios,

    // Service Status
    serviceHealth,
    serviceSummary,
    loadingService,
    checkServiceHealth,
    loadServiceSummary,

    // Combined Operations
    runCompleteAnalysis,
    clearAllResults,
  };
}

// ==================== Helper Hooks ====================

/**
 * Hook for auto-loading stress scenarios on mount
 */
export function useStressScenarios() {
  const { scenarios, loadingScenarios, scenariosError, loadStressScenarios } = useRiskManagement();

  // Auto-load scenarios on mount
  useState(() => {
    loadStressScenarios();
  });

  return { scenarios, loadingScenarios, scenariosError, loadStressScenarios };
}

/**
 * Hook for periodic service health checks
 */
export function useServiceHealthMonitor(intervalMs: number = 60000) {
  const { serviceHealth, checkServiceHealth } = useRiskManagement();

  useState(() => {
    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, intervalMs);
    return () => clearInterval(interval);
  });

  return { serviceHealth };
}
