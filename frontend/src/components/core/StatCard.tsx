/**
 * Professional Stat Card Component
 * WealthNavigator AI Design System
 *
 * Features:
 * - Large monospace numbers for financial data
 * - ALL CAPS labels for hierarchy
 * - Clean, data-first design
 * - Trend indicators
 * - Icon support
 */

import { ReactNode } from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    percentage?: boolean;
  };
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  footer,
  className = '',
}: StatCardProps) {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-error-600',
    neutral: 'text-slate-600',
  };

  const formatChange = (changeValue: number, isPercentage?: boolean) => {
    const sign = changeValue > 0 ? '+' : '';
    const suffix = isPercentage ? '%' : '';
    return `${sign}${changeValue.toFixed(1)}${suffix}`;
  };

  return (
    <Card className={`${className}`} padding="md">
      <div className="space-y-3">
        {/* Header with label and icon */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          {icon && (
            <div className="text-slate-400">
              {icon}
            </div>
          )}
        </div>

        {/* Large value display */}
        <div className="space-y-1">
          <div className="text-3xl font-semibold font-mono text-slate-900 leading-none">
            {value}
          </div>

          {/* Change indicator */}
          {change && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend ? trendColors[trend] : 'text-slate-600'}`}>
              {trend === 'up' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className="font-mono">
                {formatChange(change.value, change.percentage)}
              </span>
            </div>
          )}
        </div>

        {/* Footer content */}
        {footer && (
          <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Compact Stat Display - For inline statistics
 */
export interface CompactStatProps {
  label: string;
  value: string | number;
  className?: string;
}

export function CompactStat({ label, value, className = '' }: CompactStatProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-lg font-semibold font-mono text-slate-900">
        {value}
      </div>
    </div>
  );
}
