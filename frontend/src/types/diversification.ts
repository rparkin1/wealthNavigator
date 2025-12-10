/**
 * Diversification Analysis Types
 * Type definitions for portfolio diversification and concentration risk analysis
 *
 * REQ-RISK-008: Diversification metrics
 * REQ-RISK-009: Concentration risk identification
 * REQ-RISK-010: Diversification recommendations
 */

// ============================================================================
// Core Types
// ============================================================================

export type DiversificationLevel = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
export type ConcentrationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ConcentrationType =
  | 'single_holding'
  | 'top_5'
  | 'sector'
  | 'geography'
  | 'asset_class'
  | 'manager';

// ============================================================================
// Request Types
// ============================================================================

export interface HoldingInfo {
  symbol: string;
  name: string;
  value: number;
  weight: number;
  asset_class: string;
  sector?: string;
  industry?: string;
  geography?: string;
  manager?: string;
}

export interface DiversificationAnalysisRequest {
  portfolio_value: number;
  holdings: HoldingInfo[];
}

export interface SimplifiedHolding {
  symbol: string;
  name: string;
  value: number;
  asset_class: string;
  sector?: string;
  industry?: string;
  geography?: string;
  manager?: string;
}

export interface SimplifiedDiversificationRequest {
  holdings: SimplifiedHolding[];
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface DiversificationMetrics {
  holdings_count: number;
  effective_securities: number;
  herfindahl_index: number;
  diversification_score: number;
  diversification_level: DiversificationLevel;
  concentration_score: number;
}

export interface TopHolding {
  symbol: string;
  name: string;
  weight: number;
  value: number;
  rank: number;
}

export interface ConcentrationBreakdown {
  name: string;
  weight: number;
  holdings_count: number;
  top_securities: string[];
}

// ============================================================================
// Risk Types
// ============================================================================

export interface ConcentrationRisk {
  risk_type: ConcentrationType;
  severity: ConcentrationSeverity;
  description: string;
  affected_holdings: string[];
  concentration_weight: number;
  threshold_exceeded: number;
  recommendation: string;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface DiversificationRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  target: string;
  impact: string;
  specific_actions: string[];
}

// ============================================================================
// Analysis Result Types
// ============================================================================

export interface DiversificationAnalysisResult {
  portfolio_value: number;
  metrics: DiversificationMetrics;
  concentration_risks: ConcentrationRisk[];
  recommendations: DiversificationRecommendation[];
  asset_class_breakdown: Record<string, number>;
  sector_breakdown: Record<string, number>;
  industry_breakdown: Record<string, number>;
  geography_breakdown: Record<string, number>;
  manager_breakdown: Record<string, number>;
  top_10_holdings: HoldingInfo[];
  // Legacy fields for backward compatibility
  top_holdings?: TopHolding[];
  concentration_breakdown?: {
    sector: ConcentrationBreakdown[];
    geography: ConcentrationBreakdown[];
    asset_class: ConcentrationBreakdown[];
    manager: ConcentrationBreakdown[];
  };
  summary?: string;
}

// ============================================================================
// Threshold Types
// ============================================================================

export interface ConcentrationThresholds {
  single_holding: {
    critical: number;
    high: number;
    medium: number;
  };
  top_5: {
    critical: number;
    high: number;
  };
  sector: {
    critical: number;
    high: number;
  };
  geography: {
    critical: number;
    high: number;
  };
  manager: {
    high: number;
  };
  asset_class: {
    high: number;
  };
}

// ============================================================================
// UI State Types
// ============================================================================

export type DiversificationTab = 'overview' | 'concentration' | 'recommendations' | 'breakdown';

export interface DiversificationDashboardState {
  selectedTab: DiversificationTab;
  isAnalyzing: boolean;
  error: string | null;

  // Analysis results
  analysis: DiversificationAnalysisResult | null;
  thresholds: ConcentrationThresholds | null;

  // Filters
  selectedSeverities: ConcentrationSeverity[];
  selectedTypes: ConcentrationType[];
  showOnlyHighPriority: boolean;
}

// ============================================================================
// Display Helper Types
// ============================================================================

export interface DiversificationScoreDisplay {
  score: number;
  level: DiversificationLevel;
  color: string;
  icon: string;
  description: string;
}

export interface RiskBadge {
  severity: ConcentrationSeverity;
  label: string;
  color: string;
  bgColor: string;
}

export interface ConcentrationCard {
  type: ConcentrationType;
  title: string;
  description: string;
  weight: number;
  severity: ConcentrationSeverity;
  icon: string;
  recommendations: string[];
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface DiversificationChartData {
  // Pie chart data for top holdings
  topHoldingsChart: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];

  // Bar chart data for sector concentration
  sectorConcentrationChart: {
    sector: string;
    weight: number;
    holdingsCount: number;
    color: string;
  }[];

  // Bar chart data for geography concentration
  geographyConcentrationChart: {
    geography: string;
    weight: number;
    holdingsCount: number;
    color: string;
  }[];

  // Herfindahl Index gauge data
  herfindahlGauge: {
    value: number;
    min: number;
    max: number;
    thresholds: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  ConcentrationBreakdown,
  ConcentrationCard,
  ConcentrationRisk,
  ConcentrationSeverity,
  ConcentrationThresholds,
  ConcentrationType,
  DiversificationAnalysisRequest,
  DiversificationAnalysisResult,
  DiversificationChartData,
  DiversificationDashboardState,
  DiversificationLevel,
  DiversificationMetrics,
  DiversificationRecommendation,
  DiversificationScoreDisplay,
  DiversificationTab,
  HoldingInfo,
  RiskBadge,
  SimplifiedDiversificationRequest,
  SimplifiedHolding,
  TopHolding,
};
