/**
 * Historical Market Scenarios TypeScript Type Definitions
 *
 * Comprehensive type definitions for historical market scenario modeling and stress testing.
 */

/**
 * Historical Period Categories
 */
export type ScenarioPeriod =
  | 'financial_crisis'
  | 'dot_com_bust'
  | 'covid_crash'
  | 'great_depression'
  | 'stagflation_70s'
  | 'black_monday_1987'
  | 'asian_crisis_1997'
  | 'bull_market'
  | 'lost_decade'
  | 'recovery_period';

/**
 * Period return data point
 */
export interface PeriodReturn {
  period: string; // "2008-10" or "2008"
  stocks: number;
  bonds: number;
  cash: number;
  real_estate?: number;
  commodities?: number;
}

/**
 * Returns data structure
 */
export interface ReturnsData {
  frequency: 'monthly' | 'annual';
  returns: PeriodReturn[];
}

/**
 * Key event during historical period
 */
export interface KeyEvent {
  date: string; // ISO date
  event: string;
  impact: string;
}

/**
 * Historical Scenario (full)
 */
export interface HistoricalScenario {
  id: string;
  name: string;
  period: ScenarioPeriod;
  description?: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  duration_months: number;
  returns_data: ReturnsData;
  max_drawdown_stocks?: number;
  max_drawdown_bonds?: number;
  recovery_months?: number;
  volatility_stocks?: number;
  volatility_bonds?: number;
  key_events?: KeyEvent[];
  source?: string;
  is_active: boolean;
  is_featured: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Scenario List Item (summary without full return data)
 */
export interface ScenarioListItem {
  id: string;
  name: string;
  period: ScenarioPeriod;
  description?: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  max_drawdown_stocks?: number;
  volatility_stocks?: number;
  recovery_months?: number;
  is_featured: boolean;
  usage_count: number;
}

/**
 * Portfolio trajectory point
 */
export interface TrajectoryPoint {
  period: string;
  value: number;
}

/**
 * Scenario application result
 */
export interface ScenarioResult {
  scenario_id: string;
  scenario_name: string;
  initial_value: number;
  final_value: number;
  total_return: number;
  max_drawdown: number;
  max_value: number;
  min_value: number;
  portfolio_trajectory: TrajectoryPoint[];
  key_events?: KeyEvent[];
  duration_months: number;
}

/**
 * Statistical metrics for an asset class
 */
export interface AssetStatistics {
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
  cumulative_return: number;
}

/**
 * Scenario statistics
 */
export interface ScenarioStatistics {
  scenario_id: string;
  scenario_name: string;
  statistics: {
    stocks: AssetStatistics;
    bonds: AssetStatistics;
    correlation: number;
  };
  duration_months: number;
  max_drawdown_stocks?: number;
  recovery_months?: number;
}

/**
 * Scenario comparison result
 */
export interface ScenarioComparison {
  scenarios: (ScenarioResult | { scenario_id: string; error: string })[];
  comparison: {
    best_scenario?: string;
    worst_scenario?: string;
    return_range: number;
    avg_return: number;
  };
}

/**
 * API Request Types
 */
export interface ApplyScenarioRequest {
  goal_id: string;
  initial_portfolio_value: number;
  monthly_contribution?: number;
}

export interface CompareRequest {
  goal_id: string;
  scenario_ids: string[];
  initial_portfolio_value: number;
  monthly_contribution?: number;
}

/**
 * Component Props Types
 */
export interface HistoricalScenarioSelectorProps {
  goalId: string;
  initialValue: number;
  monthlyContribution?: number;
  onScenarioApplied?: (result: ScenarioResult) => void;
  onClose?: () => void;
}

export interface ScenarioComparisonProps {
  goalId: string;
  initialValue: number;
  monthlyContribution?: number;
  onClose?: () => void;
}

export interface ScenarioPlayerProps {
  scenario: HistoricalScenario;
  result: ScenarioResult;
  onClose?: () => void;
}

export interface ScenarioCardProps {
  scenario: ScenarioListItem;
  onSelect: (scenario: ScenarioListItem) => void;
  selected?: boolean;
}

/**
 * Scenario metadata for UI display
 */
export interface ScenarioMetadata {
  period: ScenarioPeriod;
  label: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Scenario period metadata mapping
 */
export const SCENARIO_METADATA: Record<ScenarioPeriod, ScenarioMetadata> = {
  financial_crisis: {
    period: 'financial_crisis',
    label: 'Financial Crisis',
    icon: '📉',
    color: 'red',
    description: 'Major market downturns (2008, etc.)',
  },
  dot_com_bust: {
    period: 'dot_com_bust',
    label: 'Dot-Com Bust',
    icon: '💻',
    color: 'orange',
    description: 'Tech bubble burst (2000-2002)',
  },
  covid_crash: {
    period: 'covid_crash',
    label: 'COVID-19 Crash',
    icon: '🦠',
    color: 'purple',
    description: 'Pandemic market crash (2020)',
  },
  great_depression: {
    period: 'great_depression',
    label: 'Great Depression',
    icon: '📊',
    color: 'gray',
    description: 'The 1929 crash and depression',
  },
  stagflation_70s: {
    period: 'stagflation_70s',
    label: '1970s Stagflation',
    icon: '📈',
    color: 'yellow',
    description: 'High inflation, stagnant growth',
  },
  black_monday_1987: {
    period: 'black_monday_1987',
    label: 'Black Monday',
    icon: '⚫',
    color: 'black',
    description: '1987 single-day crash',
  },
  asian_crisis_1997: {
    period: 'asian_crisis_1997',
    label: 'Asian Crisis',
    icon: '🌏',
    color: 'teal',
    description: '1997 Asian financial crisis',
  },
  bull_market: {
    period: 'bull_market',
    label: 'Bull Market',
    icon: '🐂',
    color: 'green',
    description: 'Extended market growth periods',
  },
  lost_decade: {
    period: 'lost_decade',
    label: 'Lost Decade',
    icon: '⏳',
    color: 'gray',
    description: 'Flat or negative returns (Japan)',
  },
  recovery_period: {
    period: 'recovery_period',
    label: 'Recovery',
    icon: '📊',
    color: 'blue',
    description: 'Post-crash recovery periods',
  },
};

/**
 * Utility type guards
 */
export function isScenarioResult(
  result: ScenarioResult | { scenario_id: string; error: string }
): result is ScenarioResult {
  return 'final_value' in result;
}

/**
 * Format helpers
 */
export function formatReturn(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDrawdown(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function getScenarioColor(period: ScenarioPeriod): string {
  return SCENARIO_METADATA[period]?.color || 'gray';
}

export function getScenarioIcon(period: ScenarioPeriod): string {
  return SCENARIO_METADATA[period]?.icon || '📊';
}
