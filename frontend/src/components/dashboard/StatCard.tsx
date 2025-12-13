/**
 * StatCard Component
 * Displays key metrics with trend indicators and professional icons
 * Part of Phase 2 - Week 4: Dashboard Redesign
 */

import React from 'react';
import { Card } from '../ui/Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number; // Percentage change
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  onClick?: () => void;
  className?: string;
}

const iconColorClasses = {
  primary: 'text-primary-600 bg-primary-50',
  success: 'text-success-600 bg-success-50',
  warning: 'text-warning-600 bg-warning-50',
  error: 'text-error-600 bg-error-50',
  neutral: 'text-gray-600 bg-gray-50',
};

const trendColorClasses = {
  up: 'text-success-600',
  down: 'text-error-600',
};

export function StatCard({
  title,
  value,
  trend,
  icon,
  iconColor = 'primary',
  onClick,
  className = '',
}: StatCardProps) {
  const formattedValue = typeof value === 'number' && value >= 1000
    ? value.toLocaleString('en-US')
    : value;

  return (
    <Card
      variant="default"
      hoverable={!!onClick}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50" />

      <div className="relative p-6">
        {/* Header with title and icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">
              {title}
            </h3>
          </div>

          {icon && (
            <div className={`p-2 rounded-lg ${iconColorClasses[iconColor]}`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900 font-mono">
            {formattedValue}
          </p>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trendColorClasses[trend.direction]}`}>
            {trend.direction === 'up' ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * StatCardSkeleton - Loading state for StatCard
 */
export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    </Card>
  );
}
