/**
 * Dashboard Component
 * Main overview dashboard showing financial snapshot
 * Part of Phase 2 - Week 4: Dashboard Redesign
 */

import { StatCard, StatCardSkeleton } from './StatCard';
import { PortfolioAllocationCard, PortfolioAllocationCardSkeleton } from './PortfolioAllocationCard';
import type { AllocationData, RebalancingWarning } from './PortfolioAllocationCard';
import { GoalsProgressList, GoalsProgressListSkeleton } from './GoalsProgressList';
import type { Goal } from './GoalsProgressList';
import { RecentActivityFeed, RecentActivityFeedSkeleton } from './RecentActivityFeed';
import type { ActivityItem } from './RecentActivityFeed';

export interface DashboardData {
  netWorth: {
    value: number;
    trend: {
      value: number;
      direction: 'up' | 'down';
    };
  };
  totalGoals: {
    total: number;
    onTrack: number;
  };
  riskScore: {
    level: 'low' | 'medium' | 'high';
    description: string;
  };
  portfolioAllocation: AllocationData[];
  rebalancingWarning?: RebalancingWarning;
  goals: Goal[];
  recentActivities: ActivityItem[];
}

export interface DashboardProps {
  data?: DashboardData;
  loading?: boolean;
  onNavigateToGoals?: () => void;
  onNavigateToPortfolio?: () => void;
  onNavigateToGoalDetail?: (goalId: string) => void;
  className?: string;
}

export function Dashboard({
  data,
  loading = false,
  onNavigateToGoals,
  onNavigateToPortfolio,
  onNavigateToGoalDetail,
  className = '',
}: DashboardProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get risk score display
  const getRiskScoreDisplay = () => {
    if (!data) return { value: '-', color: 'neutral' as const };

    const { level } = data.riskScore;
    const colorMap = {
      low: 'success' as const,
      medium: 'warning' as const,
      high: 'error' as const,
    };

    return {
      value: level.charAt(0).toUpperCase() + level.slice(1),
      color: colorMap[level],
    };
  };

  const riskDisplay = getRiskScoreDisplay();

  // Icons for stat cards
  const NetWorthIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const GoalsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const RiskIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          {/* Portfolio and Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PortfolioAllocationCardSkeleton />
            <GoalsProgressListSkeleton />
          </div>

          {/* Recent Activity */}
          <div className="max-w-2xl">
            <RecentActivityFeedSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="max-w-7xl mx-auto text-center py-12">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Add your financial data to see your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Your financial overview at a glance</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Net Worth */}
          <StatCard
            title="Net Worth"
            value={formatCurrency(data.netWorth.value)}
            trend={data.netWorth.trend}
            icon={<NetWorthIcon />}
            iconColor="primary"
            onClick={onNavigateToPortfolio}
          />

          {/* Total Goals */}
          <StatCard
            title="Financial Goals"
            value={data.totalGoals.total}
            icon={<GoalsIcon />}
            iconColor="success"
            onClick={onNavigateToGoals}
          />

          {/* Risk Score */}
          <StatCard
            title="Risk Level"
            value={riskDisplay.value}
            icon={<RiskIcon />}
            iconColor={riskDisplay.color}
            onClick={onNavigateToPortfolio}
          />
        </div>

        {/* Portfolio Allocation and Goals Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Allocation */}
          <PortfolioAllocationCard
            allocation={data.portfolioAllocation}
            rebalancingWarning={data.rebalancingWarning}
            onViewDetails={onNavigateToPortfolio}
          />

          {/* Goals Progress */}
          <GoalsProgressList
            goals={data.goals}
            onViewAll={onNavigateToGoals}
            onViewGoal={onNavigateToGoalDetail}
          />
        </div>

        {/* Recent Activity */}
        <div className="max-w-2xl">
          <RecentActivityFeed
            activities={data.recentActivities}
            maxItems={5}
          />
        </div>
      </div>
    </div>
  );
}
