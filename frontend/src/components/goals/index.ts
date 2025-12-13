/**
 * Goal Components
 *
 * Export all goal-related components.
 */

// Redesigned components (Week 5 - UI Redesign)
export { GoalCardRedesign } from './GoalCardRedesign';
export { GoalCardSkeleton } from './GoalCardSkeleton';
export { EmptyGoalsState } from './EmptyGoalsState';
export { GoalDashboardRedesign } from './GoalDashboardRedesign';

// Icons
export * from './icons/GoalIcons';

// Legacy components (still in use)
export { GoalCard } from './GoalCard';
export { GoalDashboard } from './GoalDashboard';
export { GoalForm } from './GoalForm';

// Types - Redesigned
export type {
  Goal,
  GoalCategory,
  GoalPriority,
  GoalStatus,
  GoalCardProps,
} from './GoalCardRedesign';

export type { GoalDashboardProps } from './GoalDashboardRedesign';
export type { GoalCardSkeletonProps } from './GoalCardSkeleton';
export type { EmptyGoalsStateProps } from './EmptyGoalsState';

// Types - Legacy
export type { GoalFormProps } from './GoalForm';

// Goal Detail View Components (Week 8)
export { GoalDetailView } from './GoalDetailView';
export { TabNavigation } from './TabNavigation';
export { ProjectionTab } from './ProjectionTab';
export { SuccessProbabilityDisplay } from './SuccessProbabilityDisplay';
export { MonteCarloFanChartRedesign } from './MonteCarloFanChartRedesign';

// What-If Analysis Components (Week 9)
export { WhatIfTab } from './WhatIfTab';
export { ImpactSummary, CompactImpactSummary } from './ImpactSummary';
export { ScenarioComparison } from './ScenarioComparison';
export type { SavedScenario, WhatIfTabProps } from './WhatIfTab';
export type { ImpactSummaryProps } from './ImpactSummary';
export type { ScenarioComparisonProps } from './ScenarioComparison';
