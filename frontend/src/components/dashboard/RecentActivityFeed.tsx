/**
 * RecentActivityFeed Component
 * Displays chronological log of system actions with timestamps
 * Part of Phase 2 - Week 4: Dashboard Redesign
 */

import { Card } from '../ui/Card';

export interface ActivityItem {
  id: string;
  type: 'market_update' | 'goal_update' | 'portfolio_update' | 'system' | 'user_action';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RecentActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  onViewAll?: () => void;
  className?: string;
}

const activityTypeIcons = {
  market_update: (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  goal_update: (
    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  portfolio_update: (
    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  system: (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  user_action: (
    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export function RecentActivityFeed({
  activities,
  maxItems = 5,
  onViewAll,
  className = '',
}: RecentActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          {onViewAll && activities.length > maxItems && (
            <button
              onClick={onViewAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View All →
            </button>
          )}
        </div>

        {/* Activity List */}
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {activityTypeIcons[activity.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * RecentActivityFeedSkeleton - Loading state
 */
export function RecentActivityFeedSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card variant="default" className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
