/**
 * Portfolio Analysis View
 *
 * Main portfolio analysis view with comprehensive visualization:
 * - Current vs Target allocation comparison
 * - Efficient frontier chart
 * - Holdings detail table
 * - Rebalancing recommendations
 *
 * Following UI Redesign specifications - Week 10
 */

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import { AllocationComparison } from './AllocationComparison';
import { EfficientFrontier } from './EfficientFrontier';
import { HoldingsTable } from './HoldingsTable';
import { RebalancingPlanModal } from './RebalancingPlanModal';
import {
  PieChartIcon,
  RefreshIcon,
  RebalanceIcon,
} from '../icons/PortfolioIcons';
import type {
  Portfolio,
  EfficientFrontierPoint,
  RebalancingPlanDetails,
} from '../../../types/portfolio';

export interface PortfolioAnalysisViewProps {
  portfolio: Portfolio;
  efficientFrontier?: EfficientFrontierPoint[];
  rebalancingPlan?: RebalancingPlanDetails;
  onRefresh?: () => void;
  onRebalance?: () => void;
  onOptimize?: () => void;
}

export function PortfolioAnalysisView({
  portfolio,
  efficientFrontier,
  rebalancingPlan,
  onRefresh,
  onRebalance,
  onOptimize,
}: PortfolioAnalysisViewProps) {
  const [showRebalancingModal, setShowRebalancingModal] = useState(false);

  // Calculate allocation drift
  const allocationDrift = calculateAllocationDrift(
    portfolio.allocation,
    portfolio.allocation // TODO: Add targetAllocation to Portfolio type
  );

  const needsRebalancing = allocationDrift > 0.05; // 5% threshold

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Analysis</h1>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {new Date(portfolio.lastRebalanced || Date.now()).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshIcon size={16} />}
            onClick={onRefresh}
          >
            Refresh Data
          </Button>
          {needsRebalancing && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<RebalanceIcon size={16} />}
              onClick={() => setShowRebalancingModal(true)}
            >
              Review Rebalancing
            </Button>
          )}
        </div>
      </div>

      {/* Rebalancing Alert */}
      {needsRebalancing && (
        <Card variant="default" padding="md" className="border-l-4 border-l-warning-500 bg-warning-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <RebalanceIcon size={20} className="text-warning-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-warning-900 mb-1">
                Rebalancing Needed
              </h3>
              <p className="text-sm text-warning-700">
                Your portfolio has drifted {(allocationDrift * 100).toFixed(1)}% from target allocation.
                Stocks are {allocationDrift > 0 ? 'overweight' : 'underweight'}.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRebalancingModal(true)}
            >
              View Plan
            </Button>
          </div>
        </Card>
      )}

      {/* Portfolio Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Value"
          value={formatCurrency(portfolio.totalValue)}
          icon={<PieChartIcon size={20} className="text-primary-600" />}
        />
        <StatCard
          label="Expected Return"
          value={`${portfolio.riskMetrics.sharpeRatio.toFixed(2)}%`}
          badge={<Badge variant="success" size="sm">+2.3%</Badge>}
        />
        <StatCard
          label="Risk (StdDev)"
          value={`${(portfolio.riskMetrics.volatility * 100).toFixed(1)}%`}
        />
        <StatCard
          label="Sharpe Ratio"
          value={portfolio.riskMetrics.sharpeRatio.toFixed(2)}
        />
      </div>

      {/* Current vs Target Allocation */}
      <AllocationComparison
        currentAllocation={portfolio.allocation}
        targetAllocation={portfolio.allocation} // TODO: Use actual target
        onOptimize={onOptimize}
      />

      {/* Efficient Frontier Chart */}
      {efficientFrontier && efficientFrontier.length > 0 && (
        <EfficientFrontier
          points={efficientFrontier}
          currentPortfolio={{
            risk: portfolio.riskMetrics.volatility,
            return: portfolio.riskMetrics.sharpeRatio, // Simplified
            label: 'Current',
          }}
        />
      )}

      {/* Holdings Detail Table */}
      <HoldingsTable
        accounts={portfolio.accounts}
        onRebalance={onRebalance}
      />

      {/* Rebalancing Plan Modal */}
      {rebalancingPlan && (
        <RebalancingPlanModal
          isOpen={showRebalancingModal}
          onClose={() => setShowRebalancingModal(false)}
          plan={rebalancingPlan}
          onExecute={() => {
            setShowRebalancingModal(false);
            onRebalance?.();
          }}
        />
      )}
    </div>
  );
}

// Helper Components
interface StatCardProps {
  label: string;
  value: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

function StatCard({ label, value, badge, icon }: StatCardProps) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 font-mono">{value}</span>
        {badge}
      </div>
    </Card>
  );
}

// Utility Functions
function calculateAllocationDrift(current: Record<string, number>, target: Record<string, number>): number {
  let maxDrift = 0;
  for (const assetClass in target) {
    const drift = Math.abs((current[assetClass] || 0) - target[assetClass]);
    maxDrift = Math.max(maxDrift, drift);
  }
  return maxDrift;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
