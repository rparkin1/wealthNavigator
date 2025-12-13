/**
 * Goal Progress Tracker Component
 *
 * Implements REQ-GOAL-004: Comprehensive goal progress tracking with milestones,
 * velocity tracking, and visual progress indicators.
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import React, { useState } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  CheckCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MinusCircleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export interface Milestone {
  id: string;
  title: string;
  target_amount?: number;
  target_date?: string;
  description?: string;
  completed: boolean;
  completed_date?: string;
  created_at: string;
  auto_generated?: boolean;
}

export interface ProgressMetrics {
  goal_id: string;
  progress_percentage: number;
  time_progress: number;
  milestone_progress: number;
  on_track: boolean;
  current_velocity: number;
  required_velocity: number;
  velocity_gap: number;
  completed_milestones: number;
  total_milestones: number;
  status: string;
}

interface GoalProgressTrackerProps {
  goalId: string;
  goalTitle: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  milestones: Milestone[];
  progressMetrics?: ProgressMetrics;
  onCreateMilestone?: () => void;
  onCompleteMilestone?: (milestoneId: string) => void;
  onEditMilestone?: (milestone: Milestone) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
}

export const GoalProgressTracker: React.FC<GoalProgressTrackerProps> = ({
  goalId,
  goalTitle,
  currentAmount,
  targetAmount,
  targetDate,
  milestones = [],
  progressMetrics,
  onCreateMilestone,
  onCompleteMilestone,
  onEditMilestone,
  onDeleteMilestone,
}) => {
  const [showMilestoneDetails, setShowMilestoneDetails] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (on_track: boolean) => {
    if (on_track) {
      return (
        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircleIcon className="w-4 h-4" />
          <span>On Track</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
        <ExclamationTriangleIcon className="w-4 h-4" />
        <span>Behind Schedule</span>
      </span>
    );
  };

  const getDaysUntil = (dateString: string) => {
    const date = parseISO(dateString);
    const days = differenceInDays(date, new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const getMilestoneStatusIcon = (milestone: Milestone) => {
    if (milestone.completed) {
      return <CheckCircleIcon className="w-6 h-6 text-success-600" />;
    }

    if (milestone.target_date) {
      const daysUntil = differenceInDays(parseISO(milestone.target_date), new Date());
      if (daysUntil < 0) return <XCircleIcon className="w-6 h-6 text-error-600" />;
      if (daysUntil <= 7) return <ExclamationTriangleIcon className="w-6 h-6 text-warning-600" />;
    }

    return <MinusCircleIcon className="w-6 h-6 text-gray-400" />;
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.target_date && b.target_date) {
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    }
    return 0;
  });

  const completedMilestones = milestones.filter(m => m.completed);
  const upcomingMilestones = milestones.filter(m => !m.completed);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{goalTitle} Progress</h2>
        {progressMetrics && getStatusBadge(progressMetrics.on_track)}
      </div>

      {/* Main Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-lg font-bold text-gray-900">
            {((currentAmount / targetAmount) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
          <div
            className={`h-6 rounded-full transition-all ${getProgressColor((currentAmount / targetAmount) * 100)}`}
            style={{ width: `${Math.min((currentAmount / targetAmount) * 100, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30"></div>
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{formatCurrency(currentAmount)}</span>
          <span>{formatCurrency(targetAmount)}</span>
        </div>
      </div>

      {/* Progress Metrics Grid */}
      {progressMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Financial Progress */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Financial Progress</p>
            <p className="text-2xl font-bold text-blue-900">{progressMetrics.progress_percentage.toFixed(1)}%</p>
          </div>

          {/* Time Progress */}
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium mb-1">Time Elapsed</p>
            <p className="text-2xl font-bold text-purple-900">{progressMetrics.time_progress.toFixed(1)}%</p>
          </div>

          {/* Current Velocity */}
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium mb-1">Monthly Savings</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(progressMetrics.current_velocity)}</p>
          </div>

          {/* Required Velocity */}
          <div className={`rounded-lg p-4 ${progressMetrics.velocity_gap > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className={`text-xs font-medium mb-1 ${progressMetrics.velocity_gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
              Required Monthly
            </p>
            <p className={`text-2xl font-bold ${progressMetrics.velocity_gap > 0 ? 'text-red-900' : 'text-green-900'}`}>
              {formatCurrency(progressMetrics.required_velocity)}
            </p>
          </div>
        </div>
      )}

      {/* Velocity Gap Alert */}
      {progressMetrics && progressMetrics.velocity_gap > 100 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-error-600 mr-3 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Increase Savings Required</p>
              <p className="text-sm text-red-700">
                You need to save an additional {formatCurrency(progressMetrics.velocity_gap)}/month to stay on track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Milestones ({completedMilestones.length}/{milestones.length})
          </h3>
          <button
            onClick={onCreateMilestone}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Milestone
          </button>
        </div>

        {/* Milestone Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Milestone Progress</span>
            <span className="font-semibold">
              {milestones.length > 0 ? ((completedMilestones.length / milestones.length) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
              style={{ width: `${milestones.length > 0 ? (completedMilestones.length / milestones.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Milestone Timeline */}
        {sortedMilestones.length > 0 ? (
          <div className="space-y-4">
            {sortedMilestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  milestone.completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getMilestoneStatusIcon(milestone)}
                </div>

                {/* Milestone Content */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-semibold ${milestone.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      )}
                    </div>
                    {milestone.auto_generated && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Auto</span>
                    )}
                  </div>

                  {/* Milestone Details */}
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    {milestone.target_amount && (
                      <div>
                        <span className="text-gray-600">Target: </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(milestone.target_amount)}</span>
                      </div>
                    )}
                    {milestone.target_date && (
                      <div>
                        <span className="text-gray-600">Due: </span>
                        <span className={`font-semibold ${
                          milestone.completed ? 'text-green-700' :
                          differenceInDays(parseISO(milestone.target_date), new Date()) < 0 ? 'text-red-600' :
                          'text-gray-900'
                        }`}>
                          {format(parseISO(milestone.target_date), 'MMM d, yyyy')} ({getDaysUntil(milestone.target_date)})
                        </span>
                      </div>
                    )}
                    {milestone.completed && milestone.completed_date && (
                      <div>
                        <span className="text-green-600">Completed: </span>
                        <span className="font-semibold text-green-700">
                          {format(parseISO(milestone.completed_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!milestone.completed && (
                    <button
                      onClick={() => onCompleteMilestone?.(milestone.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center justify-center"
                      title="Mark as complete"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEditMilestone?.(milestone)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center justify-center"
                    title="Edit milestone"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteMilestone?.(milestone.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center justify-center"
                    title="Delete milestone"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No milestones yet</p>
            <p className="text-sm">Create milestones to track your progress more effectively</p>
          </div>
        )}
      </div>

      {/* Target Date Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Goal Target Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {format(parseISO(targetDate), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Days Remaining</p>
            <p className="text-lg font-semibold text-gray-900">
              {getDaysUntil(targetDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalProgressTracker;
