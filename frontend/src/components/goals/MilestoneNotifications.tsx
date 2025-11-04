/**
 * Milestone Notifications Component
 *
 * Alert system showing overdue milestones and recent completions.
 * Displays notifications with different severity levels.
 */

import { useEffect, useState } from 'react';
import type { OverdueMilestone, UpcomingMilestone } from '../../types/goalMilestones';
import * as milestoneApi from '../../services/goalMilestonesApi';

export interface MilestoneNotificationsProps {
  userId: string;
  onMilestoneClick?: (goalId: string) => void;
}

export function MilestoneNotifications({
  userId,
  onMilestoneClick,
}: MilestoneNotificationsProps) {
  const [overdueMilestones, setOverdueMilestones] = useState<OverdueMilestone[]>([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState<UpcomingMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverdue, setShowOverdue] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overdue, upcoming] = await Promise.all([
        milestoneApi.getOverdueMilestones(userId),
        milestoneApi.getUpcomingMilestones(userId, 7), // Next 7 days
      ]);

      setOverdueMilestones(overdue);
      setUpcomingMilestones(upcoming);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
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

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Alerts</h3>
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Alerts</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const hasNotifications = overdueMilestones.length > 0 || upcomingMilestones.length > 0;

  if (!hasNotifications) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Alerts</h3>
        <div className="text-center py-8 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-700 font-medium">All caught up!</p>
          <p className="text-green-600 text-sm mt-1">No overdue or upcoming milestones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Milestone Alerts</h3>
        <div className="flex gap-2">
          {overdueMilestones.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {overdueMilestones.length} overdue
            </span>
          )}
          {upcomingMilestones.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {upcomingMilestones.length} soon
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {/* Overdue Milestones */}
        {overdueMilestones.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOverdue(!showOverdue)}
                className="text-sm font-medium text-red-700 hover:text-red-800"
              >
                {showOverdue ? '▼' : '▶'} Overdue ({overdueMilestones.length})
              </button>
            </div>

            {showOverdue &&
              overdueMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  onClick={() => onMilestoneClick && onMilestoneClick(milestone.goal_id)}
                  className={`bg-red-50 border border-red-200 rounded-lg p-3 transition-all ${
                    onMilestoneClick ? 'cursor-pointer hover:border-red-300 hover:shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getGoalIcon(milestone.goal_category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-red-900 truncate">
                            {milestone.title}
                          </h4>
                          <p className="text-xs text-red-700 truncate mt-0.5">
                            {milestone.goal_title}
                          </p>
                        </div>

                        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white">
                          {milestone.days_overdue}d overdue
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-red-700">
                          Due: {milestone.target_date && formatDate(milestone.target_date)}
                        </span>
                        {milestone.target_amount && (
                          <>
                            <span className="text-red-400">•</span>
                            <span className="font-medium text-red-900">
                              {formatCurrency(milestone.target_amount)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}

        {/* Upcoming Milestones (Next 7 Days) */}
        {upcomingMilestones.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setShowUpcoming(!showUpcoming)}
                className="text-sm font-medium text-yellow-700 hover:text-yellow-800"
              >
                {showUpcoming ? '▼' : '▶'} Coming Soon ({upcomingMilestones.length})
              </button>
            </div>

            {showUpcoming &&
              upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  onClick={() => onMilestoneClick && onMilestoneClick(milestone.goal_id)}
                  className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 transition-all ${
                    onMilestoneClick ? 'cursor-pointer hover:border-yellow-300 hover:shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getGoalIcon(milestone.goal_category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-yellow-900 truncate">
                            {milestone.title}
                          </h4>
                          <p className="text-xs text-yellow-700 truncate mt-0.5">
                            {milestone.goal_title}
                          </p>
                        </div>

                        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-600 text-white">
                          {milestone.days_until === 0
                            ? 'Today'
                            : milestone.days_until === 1
                            ? 'Tomorrow'
                            : `${milestone.days_until}d`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-yellow-700">
                          {formatDate(milestone.target_date)}
                        </span>
                        {milestone.target_amount && (
                          <>
                            <span className="text-yellow-400">•</span>
                            <span className="font-medium text-yellow-900">
                              {formatCurrency(milestone.target_amount)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
