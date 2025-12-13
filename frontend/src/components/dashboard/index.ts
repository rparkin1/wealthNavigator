/**
 * Dashboard Components Barrel Export
 * Centralized exports for all dashboard-related components
 */

export { Dashboard } from './Dashboard';
export type { DashboardProps, DashboardData } from './Dashboard';

export { StatCard, StatCardSkeleton } from './StatCard';
export type { StatCardProps } from './StatCard';

export { PortfolioAllocationCard, PortfolioAllocationCardSkeleton } from './PortfolioAllocationCard';
export type {
  PortfolioAllocationCardProps,
  AllocationData,
  RebalancingWarning,
} from './PortfolioAllocationCard';

export { GoalsProgressList, GoalsProgressListSkeleton } from './GoalsProgressList';
export type { GoalsProgressListProps, Goal } from './GoalsProgressList';

export { RecentActivityFeed, RecentActivityFeedSkeleton } from './RecentActivityFeed';
export type { RecentActivityFeedProps, ActivityItem } from './RecentActivityFeed';
