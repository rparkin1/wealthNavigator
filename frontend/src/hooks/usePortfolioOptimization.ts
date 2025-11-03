/**
 * Portfolio Optimization Hook
 *
 * React hook for managing portfolio optimization state and API calls
 */

import { useState, useCallback } from 'react';
import {
  getAllAssetClasses,
  getSimpleAllocation,
  multiLevelOptimization,
  screenAssetsESG,
  getESGPresets,
  generateInsights,
  generateAlerts,
  checkHealth,
  type AssetClass,
  type SimpleAllocationRequest,
  type SimpleAllocationResponse,
  type MultiLevelOptimizationRequest,
  type OptimizationResult,
  type ESGScreeningRequest,
  type ESGScreeningResult,
  type ESGPreset,
  type InsightsRequest,
  type PortfolioInsight,
  type AlertsRequest,
  type PortfolioAlert,
} from '../services/portfolioOptimizationApi';

export interface UsePortfolioOptimizationResult {
  // Asset Classes
  assetClasses: AssetClass[];
  loadingAssets: boolean;
  assetError: string | null;
  loadAssetClasses: (filters?: {
    category?: string;
    min_return?: number;
    max_volatility?: number;
  }) => Promise<void>;

  // Simple Allocation
  simpleAllocation: SimpleAllocationResponse | null;
  loadingSimpleAllocation: boolean;
  simpleAllocationError: string | null;
  getSimplePortfolio: (request: SimpleAllocationRequest) => Promise<void>;

  // Multi-Level Optimization
  optimizationResult: OptimizationResult | null;
  loadingOptimization: boolean;
  optimizationError: string | null;
  optimizePortfolio: (request: MultiLevelOptimizationRequest) => Promise<void>;

  // ESG Screening
  esgResult: ESGScreeningResult | null;
  esgPresets: ESGPreset[];
  loadingESG: boolean;
  esgError: string | null;
  screenESG: (request: ESGScreeningRequest) => Promise<void>;
  loadESGPresets: () => Promise<void>;

  // Insights & Alerts
  insights: PortfolioInsight[];
  alerts: PortfolioAlert[];
  loadingInsights: boolean;
  loadingAlerts: boolean;
  insightsError: string | null;
  alertsError: string | null;
  fetchInsights: (request: InsightsRequest) => Promise<void>;
  fetchAlerts: (request: AlertsRequest) => Promise<void>;

  // Health
  isHealthy: boolean;
  checkServiceHealth: () => Promise<void>;
}

export function usePortfolioOptimization(): UsePortfolioOptimizationResult {
  // Asset Classes
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);

  // Simple Allocation
  const [simpleAllocation, setSimpleAllocation] = useState<SimpleAllocationResponse | null>(null);
  const [loadingSimpleAllocation, setLoadingSimpleAllocation] = useState(false);
  const [simpleAllocationError, setSimpleAllocationError] = useState<string | null>(null);

  // Multi-Level Optimization
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [loadingOptimization, setLoadingOptimization] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  // ESG Screening
  const [esgResult, setEsgResult] = useState<ESGScreeningResult | null>(null);
  const [esgPresets, setEsgPresets] = useState<ESGPreset[]>([]);
  const [loadingESG, setLoadingESG] = useState(false);
  const [esgError, setEsgError] = useState<string | null>(null);

  // Insights & Alerts
  const [insights, setInsights] = useState<PortfolioInsight[]>([]);
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Health
  const [isHealthy, setIsHealthy] = useState(true);

  // Load Asset Classes
  const loadAssetClasses = useCallback(async (filters?: {
    category?: string;
    min_return?: number;
    max_volatility?: number;
  }) => {
    setLoadingAssets(true);
    setAssetError(null);

    try {
      const assets = await getAllAssetClasses(filters);
      setAssetClasses(assets);
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : 'Failed to load asset classes');
    } finally {
      setLoadingAssets(false);
    }
  }, []);

  // Get Simple Portfolio
  const getSimplePortfolio = useCallback(async (request: SimpleAllocationRequest) => {
    setLoadingSimpleAllocation(true);
    setSimpleAllocationError(null);

    try {
      const result = await getSimpleAllocation(request);
      setSimpleAllocation(result);
    } catch (error) {
      setSimpleAllocationError(
        error instanceof Error ? error.message : 'Failed to generate allocation'
      );
    } finally {
      setLoadingSimpleAllocation(false);
    }
  }, []);

  // Optimize Portfolio
  const optimizePortfolio = useCallback(async (request: MultiLevelOptimizationRequest) => {
    setLoadingOptimization(true);
    setOptimizationError(null);

    try {
      const result = await multiLevelOptimization(request);
      setOptimizationResult(result);
    } catch (error) {
      setOptimizationError(
        error instanceof Error ? error.message : 'Failed to optimize portfolio'
      );
    } finally {
      setLoadingOptimization(false);
    }
  }, []);

  // Screen ESG
  const screenESG = useCallback(async (request: ESGScreeningRequest) => {
    setLoadingESG(true);
    setEsgError(null);

    try {
      const result = await screenAssetsESG(request);
      setEsgResult(result);
    } catch (error) {
      setEsgError(error instanceof Error ? error.message : 'Failed to screen ESG');
    } finally {
      setLoadingESG(false);
    }
  }, []);

  // Load ESG Presets
  const loadESGPresets = useCallback(async () => {
    setLoadingESG(true);
    setEsgError(null);

    try {
      const { presets } = await getESGPresets();
      setEsgPresets(presets);
    } catch (error) {
      setEsgError(error instanceof Error ? error.message : 'Failed to load ESG presets');
    } finally {
      setLoadingESG(false);
    }
  }, []);

  // Fetch Insights
  const fetchInsights = useCallback(async (request: InsightsRequest) => {
    setLoadingInsights(true);
    setInsightsError(null);

    try {
      const result = await generateInsights(request);
      setInsights(result);
    } catch (error) {
      setInsightsError(error instanceof Error ? error.message : 'Failed to generate insights');
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  // Fetch Alerts
  const fetchAlerts = useCallback(async (request: AlertsRequest) => {
    setLoadingAlerts(true);
    setAlertsError(null);

    try {
      const result = await generateAlerts(request);
      setAlerts(result);
    } catch (error) {
      setAlertsError(error instanceof Error ? error.message : 'Failed to generate alerts');
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  // Check Service Health
  const checkServiceHealth = useCallback(async () => {
    try {
      const health = await checkHealth();
      setIsHealthy(health.status === 'healthy');
    } catch (error) {
      setIsHealthy(false);
    }
  }, []);

  return {
    // Asset Classes
    assetClasses,
    loadingAssets,
    assetError,
    loadAssetClasses,

    // Simple Allocation
    simpleAllocation,
    loadingSimpleAllocation,
    simpleAllocationError,
    getSimplePortfolio,

    // Multi-Level Optimization
    optimizationResult,
    loadingOptimization,
    optimizationError,
    optimizePortfolio,

    // ESG Screening
    esgResult,
    esgPresets,
    loadingESG,
    esgError,
    screenESG,
    loadESGPresets,

    // Insights & Alerts
    insights,
    alerts,
    loadingInsights,
    loadingAlerts,
    insightsError,
    alertsError,
    fetchInsights,
    fetchAlerts,

    // Health
    isHealthy,
    checkServiceHealth,
  };
}
