/**
 * GoalCardSkeleton Component
 *
 * Loading skeleton for goal cards.
 * Provides a smooth loading experience with animated shimmer effect.
 */

import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';

export interface GoalCardSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
  /** Compact variant */
  compact?: boolean;
}

export function GoalCardSkeleton({ count = 1, compact = false }: GoalCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} compact={compact} />
      ))}
    </>
  );
}

function SkeletonCard({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <Card variant="default" padding="md" className="animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Icon skeleton */}
            <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded" />
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              {/* Amount skeleton */}
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          {/* Badge skeleton */}
          <div className="w-16 h-5 bg-gray-200 rounded-sm" />
        </div>
        {/* Progress bar skeleton */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full" />
      </Card>
    );
  }

  return (
    <Card variant="default" padding="none" className="animate-pulse">
      {/* Header */}
      <CardHeader
        title={
          <div className="flex items-center gap-3">
            {/* Icon skeleton */}
            <div className="w-6 h-6 bg-gray-200 rounded" />
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              {/* Category skeleton */}
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        }
        badge={<div className="w-20 h-6 bg-gray-200 rounded-sm" />}
        action={<div className="w-8 h-8 bg-gray-200 rounded-lg" />}
      />

      {/* Content */}
      <CardContent>
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Amount skeleton */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
          {/* Progress bar skeleton */}
          <div className="h-2 bg-gray-200 rounded-full" />
        </div>

        {/* Details grid skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-5 bg-gray-200 rounded w-full mb-1" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-5 bg-gray-200 rounded w-3/4" />
          </div>
        </div>

        {/* Success probability skeleton */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter>
        <div className="w-20 h-6 bg-gray-200 rounded-sm" />
        <div className="flex-1" />
        <div className="w-28 h-8 bg-gray-200 rounded-md" />
      </CardFooter>
    </Card>
  );
}

export default GoalCardSkeleton;
