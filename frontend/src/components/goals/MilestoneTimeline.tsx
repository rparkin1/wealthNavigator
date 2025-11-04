/**
 * Milestone Timeline Component
 *
 * Visual timeline showing milestones with progress tracking.
 * Displays milestones chronologically with completion status.
 */

import { useEffect, useState } from 'react';
import type { Goal } from '../../types/goal';
import type { Milestone } from '../../types/goalMilestones';
import * as milestoneApi from '../../services/goalMilestonesApi';

export interface MilestoneTimelineProps {
  goal: Goal;
}

export function MilestoneTimeline({ goal }: MilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMilestones();
  }, [goal.id]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await milestoneApi.getMilestones(goal.id);
      // Sort by target date
      const sorted = data.sort((a, b) => {
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      });
      setMilestones(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntil = (targetDate: string): number => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (milestone: Milestone): string => {
    if (milestone.completed) return 'bg-green-500';
    if (!milestone.target_date) return 'bg-gray-400';

    const daysUntil = getDaysUntil(milestone.target_date);
    if (daysUntil < 0) return 'bg-red-500'; // Overdue
    if (daysUntil < 30) return 'bg-yellow-500'; // Due soon
    return 'bg-blue-500'; // Future
  };

  const getStatusText = (milestone: Milestone): string => {
    if (milestone.completed) return 'Completed';
    if (!milestone.target_date) return 'No date set';

    const daysUntil = getDaysUntil(milestone.target_date);
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil < 30) return `${daysUntil} days until due`;
    return formatDate(milestone.target_date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No milestones to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {/* Milestones */}
      <div className="space-y-6">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="relative pl-14">
            {/* Timeline Dot */}
            <div
              className={`absolute left-3 top-2 w-6 h-6 rounded-full ${getStatusColor(
                milestone
              )} border-4 border-white shadow`}
            >
              {milestone.completed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </div>

            {/* Milestone Card */}
            <div
              className={`border rounded-lg p-4 ${
                milestone.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              } transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4
                    className={`font-semibold ${
                      milestone.completed ? 'text-green-900' : 'text-gray-900'
                    }`}
                  >
                    {milestone.title}
                  </h4>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    {milestone.target_amount && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <span className="font-medium">
                          {formatCurrency(milestone.target_amount)}
                        </span>
                      </span>
                    )}
                    <span className={milestone.completed ? 'text-green-700' : ''}>
                      {getStatusText(milestone)}
                    </span>
                  </div>

                  {milestone.description && (
                    <p className="mt-2 text-sm text-gray-600">{milestone.description}</p>
                  )}

                  {milestone.completed && milestone.completed_date && (
                    <p className="mt-2 text-xs text-green-700 font-medium">
                      ✓ Completed on {formatDate(milestone.completed_date)}
                    </p>
                  )}
                </div>

                {/* Index Badge */}
                <span className="ml-4 flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
                  {index + 1}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-700 font-medium">Progress</div>
            <div className="text-2xl font-bold text-blue-900">
              {milestones.filter((m) => m.completed).length} / {milestones.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-700 font-medium">Completion Rate</div>
            <div className="text-2xl font-bold text-blue-900">
              {Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
