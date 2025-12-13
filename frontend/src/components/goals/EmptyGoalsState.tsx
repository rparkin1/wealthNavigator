/**
 * EmptyGoalsState Component
 *
 * Empty state displays for when no goals exist or no results match filters.
 * Provides clear messaging and actionable next steps.
 */

import Button from '../ui/Button';

export interface EmptyGoalsStateProps {
  /** Variant determines the message and icon */
  variant: 'no-goals' | 'no-results';
  /** Action to create a new goal */
  onCreateGoal?: () => void;
  /** Action to clear filters */
  onClearFilters?: () => void;
}

export function EmptyGoalsState({ variant, onCreateGoal, onClearFilters }: EmptyGoalsStateProps) {
  if (variant === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 rounded-lg">
        {/* Search Icon */}
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching goals</h3>
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          We couldn't find any goals that match your current filters or search query. Try
          adjusting your criteria.
        </p>

        {/* Action */}
        {onClearFilters && (
          <Button variant="secondary" size="md" onClick={onClearFilters}>
            Clear All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-gray-200 rounded-lg">
      {/* Goal Icon */}
      <svg
        className="w-20 h-20 text-gray-300 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4"
        />
      </svg>

      {/* Message */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Planning Your Future</h3>
      <p className="text-base text-gray-600 text-center max-w-md mb-8">
        Create your first financial goal to begin your journey toward financial independence.
        Whether it's retirement, education, or a home purchase, we'll help you get there.
      </p>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl">
        <FeatureItem
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          title="Track Progress"
          description="Monitor your progress toward each goal with real-time updates"
        />
        <FeatureItem
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          title="AI-Powered"
          description="Get personalized recommendations and probability analysis"
        />
        <FeatureItem
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          title="Tax Optimized"
          description="Maximize returns with smart tax-aware allocation strategies"
        />
      </div>

      {/* Action */}
      {onCreateGoal && (
        <Button
          variant="primary"
          size="lg"
          onClick={onCreateGoal}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Create Your First Goal
        </Button>
      )}
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
}

export default EmptyGoalsState;
