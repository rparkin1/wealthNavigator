/**
 * PortfolioAllocationCard Component
 * Displays portfolio allocation with pie chart and rebalancing warnings
 * Part of Phase 2 - Week 4: Dashboard Redesign
 */

import { Card } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export interface AllocationData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

export interface RebalancingWarning {
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface PortfolioAllocationCardProps {
  allocation: AllocationData[];
  rebalancingWarning?: RebalancingWarning;
  onViewDetails?: () => void;
  className?: string;
}

const severityClasses = {
  info: 'bg-info-50 border-info-200 text-info-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  error: 'bg-error-50 border-error-200 text-error-800',
};

const severityIcons = {
  info: (
    <svg className="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function PortfolioAllocationCard({
  allocation,
  rebalancingWarning,
  onViewDetails,
  className = '',
}: PortfolioAllocationCardProps) {
  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h3>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View Details →
            </button>
          )}
        </div>

        {/* Pie Chart */}
        <div className="mb-6" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {allocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Rebalancing Warning/Info */}
        {rebalancingWarning && (
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${severityClasses[rebalancingWarning.severity]}`}>
            <div className="flex-shrink-0 mt-0.5">
              {severityIcons[rebalancingWarning.severity]}
            </div>
            <p className="text-sm font-medium">
              {rebalancingWarning.message}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * PortfolioAllocationCardSkeleton - Loading state
 */
export function PortfolioAllocationCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-center" style={{ height: 280 }}>
          <div className="w-40 h-40 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
