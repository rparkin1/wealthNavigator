/**
 * Sensitivity Analysis Types
 *
 * Comprehensive type definitions for advanced sensitivity analysis including
 * tornado diagrams, heat maps, threshold analysis, and break-even calculations.
 */

// ==================== Variable Types ====================

export type SensitivityVariable =
  | 'monthly_contribution'
  | 'expected_return_stocks'
  | 'expected_return_bonds'
  | 'inflation_rate'
  | 'retirement_age'
  | 'life_expectancy'
  | 'target_amount';

export interface VariableInfo {
  name: SensitivityVariable;
  description: string;
  typical_range: [number, number];
  unit: string;
  category: 'contributions' | 'returns' | 'economics' | 'timing' | 'goals';
}

// ==================== One-Way Sensitivity (Tornado Diagram) ====================

export interface OneWaySensitivityRequest {
  goal_id: string;
  variables: SensitivityVariable[];
  variation_percentage?: number; // Default: 0.20 (±20%)
  num_points?: number; // Default: 5
  iterations_per_point?: number; // Default: 1000
}

export interface VariableImpact {
  variable: SensitivityVariable;
  baseline: number; // Base case success probability
  min_value: number; // Minimum test value
  max_value: number; // Maximum test value
  min_probability: number; // Success probability at min value
  max_probability: number; // Success probability at max value
  impact_range: number; // max_probability - min_probability
  probabilities: number[]; // Array of probabilities at test points
  test_values: number[]; // Array of test values
}

export interface OneWaySensitivityResult {
  success: boolean;
  goal_id: string;
  analysis: {
    variable_impacts: VariableImpact[]; // Sorted by impact_range descending
    base_success_probability: number;
    analysis_type: 'one_way';
    variation_percentage: number;
  };
  message: string;
}

// ==================== Two-Way Sensitivity (Heat Map) ====================

export interface TwoWaySensitivityRequest {
  goal_id: string;
  variable1: SensitivityVariable;
  variable2: SensitivityVariable;
  variation_percentage?: number; // Default: 0.20 (±20%)
  grid_size?: number; // Default: 10
  iterations_per_point?: number; // Default: 500
}

export interface TwoWaySensitivityResult {
  success: boolean;
  goal_id: string;
  analysis: {
    variable1: SensitivityVariable;
    variable2: SensitivityVariable;
    test_values1: number[]; // X-axis values
    test_values2: number[]; // Y-axis values
    probability_grid: number[][]; // 2D grid of success probabilities
    min_probability: number;
    max_probability: number;
    analysis_type: 'two_way';
  };
  message: string;
}

// ==================== Threshold Analysis ====================

export interface ThresholdAnalysisRequest {
  goal_id: string;
  variable: SensitivityVariable;
  target_probability?: number; // Default: 0.90
  min_value?: number | null;
  max_value?: number | null;
  tolerance?: number; // Default: 0.01
}

export interface ThresholdAnalysisResult {
  success: boolean;
  goal_id: string;
  analysis: {
    variable: SensitivityVariable;
    threshold_value: number; // Required value to achieve target
    base_value: number; // Current value
    delta: number; // threshold_value - base_value
    delta_percentage: number; // Delta as percentage of base
    achieved_probability: number; // Actual probability at threshold
    target_probability: number; // Target probability requested
  };
  message: string;
}

// ==================== Break-Even Analysis ====================

export interface BreakEvenAnalysisRequest {
  goal_id: string;
  variable1: SensitivityVariable; // e.g., inflation_rate
  variable2: SensitivityVariable; // e.g., monthly_contribution
  target_probability?: number; // Default: 0.90
  grid_size?: number; // Default: 20
  iterations_per_point?: number; // Default: 500
}

export interface BreakEvenPoint {
  [key: string]: number; // Dynamic keys based on variable names
}

export interface BreakEvenDelta {
  required_value: number; // Required value of variable2 at current variable1
  current_value: number; // Actual current value of variable2
  delta: number; // current_value - required_value
  delta_percentage: number; // Delta as percentage
  above_break_even: boolean; // True if safe, false if at risk
  status: 'safe' | 'at_risk';
}

export interface BreakEvenAnalysisResult {
  success: boolean;
  goal_id: string;
  analysis: {
    variable1: SensitivityVariable;
    variable2: SensitivityVariable;
    break_even_curve: BreakEvenPoint[]; // Array of {variable1: val, variable2: val}
    current_value1: number;
    current_value2: number;
    target_probability: number;
    current_delta: BreakEvenDelta;
    analysis_type: 'break_even';
  };
  message: string;
}

// ==================== Supported Variables ====================

export interface SupportedVariablesResponse {
  variables: VariableInfo[];
}

// ==================== Common Props ====================

export interface SensitivityAnalysisBaseProps {
  goalId: string;
  onAnalysisComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

// ==================== UI State ====================

export interface SensitivityAnalysisState {
  loading: boolean;
  error: string | null;
  oneWayResult: OneWaySensitivityResult | null;
  twoWayResult: TwoWaySensitivityResult | null;
  thresholdResult: ThresholdAnalysisResult | null;
  breakEvenResult: BreakEvenAnalysisResult | null;
}

export type AnalysisType = 'tornado' | 'heatmap' | 'threshold' | 'breakeven';

export interface AnalysisConfig {
  type: AnalysisType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// ==================== Variable Selection ====================

export interface VariableSelectOption {
  value: SensitivityVariable;
  label: string;
  description: string;
  category: string;
}

// ==================== Chart Data ====================

export interface TornadoChartDatum {
  variable: string;
  baseline: number;
  minProbability: number;
  maxProbability: number;
  impactRange: number;
  minValue: number;
  maxValue: number;
}

export interface HeatmapCell {
  x: number;
  y: number;
  value: number; // Success probability
  xLabel: string;
  yLabel: string;
}

export interface ThresholdChartPoint {
  value: number;
  probability: number;
  isThreshold: boolean;
  isCurrent: boolean;
}

export interface BreakEvenChartPoint {
  variable1Value: number;
  variable2Value: number;
  onCurve: boolean;
  isCurrent: boolean;
}

// ==================== Export All ====================

export type {
  // Requests
  OneWaySensitivityRequest,
  TwoWaySensitivityRequest,
  ThresholdAnalysisRequest,
  BreakEvenAnalysisRequest,

  // Results
  OneWaySensitivityResult,
  TwoWaySensitivityResult,
  ThresholdAnalysisResult,
  BreakEvenAnalysisResult,

  // Supporting types
  VariableImpact,
  BreakEvenPoint,
  BreakEvenDelta,
  VariableInfo,
  SupportedVariablesResponse,

  // UI types
  SensitivityAnalysisState,
  AnalysisConfig,
  VariableSelectOption,
  TornadoChartDatum,
  HeatmapCell,
  ThresholdChartPoint,
  BreakEvenChartPoint,
};

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  AnalysisConfig,
  AnalysisType,
  BreakEvenAnalysisRequest,
  BreakEvenAnalysisResult,
  BreakEvenChartPoint,
  BreakEvenDelta,
  BreakEvenPoint,
  HeatmapCell,
  OneWaySensitivityRequest,
  OneWaySensitivityResult,
  SensitivityAnalysisBaseProps,
  SensitivityAnalysisState,
  SensitivityVariable,
  SupportedVariablesResponse,
  ThresholdAnalysisRequest,
  ThresholdAnalysisResult,
  ThresholdChartPoint,
  TornadoChartDatum,
  TwoWaySensitivityRequest,
  TwoWaySensitivityResult,
  VariableImpact,
  VariableInfo,
  VariableSelectOption,
};
