/**
 * Monte Carlo Simulation Types
 * Probabilistic financial planning simulations
 */

export interface MonteCarloSimulation {
  id: string;
  queryId: string;
  iterations: number;
  timeHorizon: number; // years
  successProbability: number; // 0.0-1.0
  portfolioProjections: PortfolioProjection[];
  statistics: SimulationStatistics;
  assumptions: SimulationAssumptions;
  status: SimulationStatus;
  progress: number; // 0-100
  createdAt: number;
  completedAt?: number;
}

export type SimulationStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface PortfolioProjection {
  year: number;
  percentile10: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
}

export interface SimulationStatistics {
  medianFinalValue: number;
  meanFinalValue: number;
  worstCase: number;
  bestCase: number;
  depletionRisk: DepletionRisk;
}

export interface DepletionRisk {
  age85: number; // probability of depletion by age 85
  age90: number;
  age95: number;
}

export interface SimulationAssumptions {
  inflationRate: number;
  lifeExpectancy: number;
  withdrawalStrategy: 'fixed' | 'dynamic' | 'percentage';
  includeSequenceRisk: boolean;
  marketScenarios?: MarketScenario[];
}

export interface MarketScenario {
  name: string;
  enabled: boolean;
  year: number;
  magnitude: number; // return multiplier (e.g., -0.30 for -30%)
}

export interface SimulationParams {
  goalIds: string[];
  iterations: number;
  timeHorizon: number;
  assumptions: SimulationAssumptions;
  scenarios?: {
    [key: string]: MarketScenario;
  };
}

export interface SimulationResult {
  simulationId: string;
  iterations: number;
  successProbability: number;
  depletionRisk: DepletionRisk;
  portfolioValues: {
    percentiles: {
      '10': number[];
      '50': number[];
      '90': number[];
    };
    years: number[];
  };
  statistics: SimulationStatistics;
}
