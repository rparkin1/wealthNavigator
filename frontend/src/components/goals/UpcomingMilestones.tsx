/**
 * Upcoming Milestones Component
 *
 * Dashboard widget showing upcoming milestones across all goals.
 * Displays next 30 days by default with goal context.
 */

import { useEffect, useState } from 'react';
import type { UpcomingMilestone } from '../../types/goalMilestones';
import * as milestoneApi from '../../services/goalMilestonesApi';

export interface UpcomingMilestonesProps {
  userId: string;
  daysAhead?: number;
  onMilestoneClick?: (goalId: string) => void;
}

export function UpcomingMilestones({
  userId,
  daysAhead = 30,
  onMilestoneClick,
}: UpcomingMilestonesProps) {
  const [milestones, setMilestones] = useState<UpcomingMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingMilestones();
  }, [userId, daysAhead]);

  const loadUpcomingMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await milestoneApi.getUpcomingMilestones(userId, daysAhead);
      setMilestones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upcoming milestones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGoalIcon = (category: string): string => {
    const icons: Record<string, string> = {
      retirement: '🏖️',
      education: '🎓',
      home: '🏠',
      major_expense: '💎',
      emergency: '💰',
      legacy: '🌳',
    };
    return icons[category] || '🎯';
  };

  const getUrgencyColor = (daysUntil: number): string => {
    if (daysUntil <= 7) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntil <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">No upcoming milestones</p>
          <p className="text-gray-400 text-xs mt-1">in the next {daysAhead} days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Milestones</h3>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {milestones.length} upcoming
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            onClick={() => onMilestoneClick && onMilestoneClick(milestone.goal_id)}
            className={`border rounded-lg p-3 transition-all ${
              onMilestoneClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''
            } ${getUrgencyColor(milestone.days_until)}`}
          >
            <div className="flex items-start gap-3">
              {/* Goal Icon */}
              <div className="text-2xl flex-shrink-0">
                {getGoalIcon(milestone.goal_category)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">
                      {milestone.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {milestone.goal_title}
                    </p>
                  </div>

                  {/* Days Until Badge */}
                  <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white border shadow-sm">
                    {milestone.days_until === 0 ? (
                      'Today'
                    ) : milestone.days_until === 1 ? (
                      'Tomorrow'
                    ) : (
                      `${milestone.days_until}d`
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-gray-600">
                    {formatDate(milestone.target_date)}
                  </span>
                  {milestone.target_amount && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(milestone.target_amount)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
