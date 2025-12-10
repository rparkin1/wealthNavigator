/**
 * Milestone Progress Bar Component
 *
 * Comprehensive progress visualization with velocity metrics and on-track status.
 * Shows financial progress, time progress, and milestone completion.
 */

import { useEffect, useState } from 'react';
import type { Goal } from '../../types/goal';
import type { ProgressMetrics } from '../../types/goalMilestones';
import * as milestoneApi from '../../services/goalMilestonesApi';

export interface MilestoneProgressBarProps {
  goal: Goal;
  compact?: boolean;
}

export function MilestoneProgressBar({ goal, compact = false }: MilestoneProgressBarProps) {
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [goal.id]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await milestoneApi.getProgressMetrics(goal.id);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return null; // Fail silently for optional widget
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={`text-sm font-semibold ${metrics.on_track ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.on_track ? 'On Track' : 'Behind'}
          </span>
        </div>
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-500 ${
              metrics.on_track ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(metrics.progress_percentage, 100)}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-gray-600 text-right">
          {Math.round(metrics.progress_percentage)}%
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progress Metrics</h3>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            metrics.on_track
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {metrics.on_track ? '✓ On Track' : '⚠ Behind Schedule'}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-6">
        {/* Financial Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Financial Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(metrics.progress_percentage)}%
            </span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${Math.min(metrics.progress_percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Time Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Time Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(metrics.time_progress)}%
            </span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-500"
              style={{ width: `${Math.min(metrics.time_progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Milestone Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Milestone Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {metrics.completed_milestones} / {metrics.total_milestones} completed
            </span>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-green-600 transition-all duration-500"
              style={{
                width: `${
                  metrics.total_milestones > 0
                    ? (metrics.completed_milestones / metrics.total_milestones) * 100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Velocity Metrics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-700 font-medium mb-1">Current Velocity</div>
          <div className="text-lg font-bold text-blue-900">
            {formatCurrency(metrics.current_velocity)}
            <span className="text-xs font-normal text-blue-700">/mo</span>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-xs text-purple-700 font-medium mb-1">Required Velocity</div>
          <div className="text-lg font-bold text-purple-900">
            {formatCurrency(metrics.required_velocity)}
            <span className="text-xs font-normal text-purple-700">/mo</span>
          </div>
        </div>

        <div
          className={`border rounded-lg p-3 ${
            metrics.velocity_gap <= 0
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div
            className={`text-xs font-medium mb-1 ${
              metrics.velocity_gap <= 0 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {metrics.velocity_gap <= 0 ? 'Surplus' : 'Shortfall'}
          </div>
          <div
            className={`text-lg font-bold ${
              metrics.velocity_gap <= 0 ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {formatCurrency(Math.abs(metrics.velocity_gap))}
            <span
              className={`text-xs font-normal ${
                metrics.velocity_gap <= 0 ? 'text-green-700' : 'text-red-700'
              }`}
            >
              /mo
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {!metrics.on_track && metrics.velocity_gap > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">💡 Recommendation</h4>
          <p className="text-sm text-yellow-800">
            To get back on track, consider increasing your monthly contribution by{' '}
            <span className="font-semibold">{formatCurrency(metrics.velocity_gap)}</span> or
            adjusting your target date.
          </p>
        </div>
      )}
    </div>
  );
}
