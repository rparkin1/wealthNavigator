/**
 * Funding Waterfall Chart Component
 *
 * Visualizes priority-based funding allocation across goals
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import { useState, useEffect } from 'react';
import type { MentalAccountBucket } from '../../types/mentalAccounting';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export interface FundingWaterfallChartProps {
  buckets: MentalAccountBucket[];
  totalAvailable: number;
}

interface WaterfallStep {
  goal_id: string;
  goal_name: string;
  priority: 'essential' | 'important' | 'aspirational';
  funding_required: number;
  funding_allocated: number;
  cumulative_allocation: number;
  funding_status: 'fully_funded' | 'partially_funded' | 'unfunded';
}

export function FundingWaterfallChart({
  buckets,
  totalAvailable,
}: FundingWaterfallChartProps) {
  const [waterfallSteps, setWaterfallSteps] = useState<WaterfallStep[]>([]);

  useEffect(() => {
    calculateWaterfall();
  }, [buckets, totalAvailable]);

  const calculateWaterfall = () => {
    // Sort by priority (essential > important > aspirational)
    const priorityOrder = { essential: 1, important: 2, aspirational: 3 };
    const sortedBuckets = [...buckets].sort((a, b) => {
      const priorityDiff = priorityOrder[a.goal_priority] - priorityOrder[b.goal_priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Within same priority, sort by target date (earlier first)
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    });

    let remainingFunds = totalAvailable;
    let cumulativeAllocation = 0;
    const steps: WaterfallStep[] = [];

    sortedBuckets.forEach((bucket) => {
      const fundingRequired = Math.max(0, bucket.target_amount - bucket.current_value);
      const fundingAllocated = Math.min(fundingRequired, remainingFunds);
      cumulativeAllocation += fundingAllocated;

      let fundingStatus: 'fully_funded' | 'partially_funded' | 'unfunded';
      if (fundingAllocated >= fundingRequired) {
        fundingStatus = 'fully_funded';
      } else if (fundingAllocated > 0) {
        fundingStatus = 'partially_funded';
      } else {
        fundingStatus = 'unfunded';
      }

      steps.push({
        goal_id: bucket.goal_id,
        goal_name: bucket.goal_name,
        priority: bucket.goal_priority,
        funding_required: fundingRequired,
        funding_allocated: fundingAllocated,
        cumulative_allocation: cumulativeAllocation,
        funding_status: fundingStatus,
      });

      remainingFunds -= fundingAllocated;
    });

    setWaterfallSteps(steps);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'essential':
        return 'bg-red-500';
      case 'important':
        return 'bg-blue-500';
      case 'aspirational':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityBadgeColor = (priority: string): string => {
    switch (priority) {
      case 'essential':
        return 'bg-red-100 text-red-800';
      case 'important':
        return 'bg-blue-100 text-blue-800';
      case 'aspirational':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIconComponent = (status: string): React.ComponentType<{ className?: string }> => {
    switch (status) {
      case 'fully_funded':
        return CheckCircleIcon; // Green check for fully funded
      case 'partially_funded':
        return ExclamationTriangleIcon; // Yellow warning for partial funding
      case 'unfunded':
        return XCircleIcon; // Red X for unfunded
      default:
        return QuestionMarkCircleIcon; // Gray question mark for unknown
    }
  };

  const maxWidth = totalAvailable;
  const remainingFunds = totalAvailable - (waterfallSteps[waterfallSteps.length - 1]?.cumulative_allocation || 0);

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Funding Waterfall</h2>
        <p className="text-sm text-gray-600">
          Priority-based allocation of {formatCurrency(totalAvailable)} across {buckets.length} goals
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">Total Available</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalAvailable)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium mb-1">Allocated</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(waterfallSteps[waterfallSteps.length - 1]?.cumulative_allocation || 0)}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 font-medium mb-1">Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(remainingFunds)}</p>
        </div>
      </div>

      {/* Waterfall Visualization */}
      <div className="space-y-4">
        {waterfallSteps.map((step, index) => {
          const widthPercentage = (step.funding_allocated / maxWidth) * 100;
          const fillPercentage = (step.funding_allocated / step.funding_required) * 100;

          return (
            <div key={step.goal_id} className="space-y-2">
              {/* Goal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`${step.funding_status === 'fully_funded' ? 'text-success-600' : step.funding_status === 'partially_funded' ? 'text-warning-600' : step.funding_status === 'unfunded' ? 'text-error-600' : 'text-gray-600'}`}>
                    {(() => {
                      const IconComponent = getStatusIconComponent(step.funding_status);
                      return <IconComponent className="w-6 h-6" />;
                    })()}
                  </div>
                  <span className="font-semibold text-gray-900">{step.goal_name}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getPriorityBadgeColor(step.priority)}`}>
                    {step.priority}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {index === 0 ? 'First' : `${index + 1}${getOrdinalSuffix(index + 1)}`} Priority
                </div>
              </div>

              {/* Waterfall Bar */}
              <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                {/* Funding Allocated Bar */}
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${getPriorityColor(step.priority)}`}
                  style={{ width: `${widthPercentage}%` }}
                >
                  <div className="flex items-center justify-center h-full text-white font-semibold text-sm">
                    {widthPercentage > 10 && formatCurrency(step.funding_allocated)}
                  </div>
                </div>

                {/* Required but Unfunded (dashed border) */}
                {step.funding_allocated < step.funding_required && (
                  <div
                    className="absolute top-0 h-full border-2 border-dashed border-gray-400"
                    style={{
                      left: `${widthPercentage}%`,
                      width: `${Math.min(((step.funding_required - step.funding_allocated) / maxWidth) * 100, 100 - widthPercentage)}%`,
                    }}
                  >
                    <div className="flex items-center justify-center h-full text-gray-600 font-medium text-xs">
                      {widthPercentage + ((step.funding_required - step.funding_allocated) / maxWidth) * 100 > 10 && 'Unfunded'}
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    Required: <span className="font-semibold text-gray-900">{formatCurrency(step.funding_required)}</span>
                  </span>
                  <span className="text-gray-600">
                    Allocated: <span className="font-semibold text-gray-900">{formatCurrency(step.funding_allocated)}</span>
                  </span>
                  <span className="text-gray-600">
                    Funded: <span className={`font-semibold ${fillPercentage >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {fillPercentage.toFixed(0)}%
                    </span>
                  </span>
                </div>
                <span className="text-gray-600">
                  Cumulative: <span className="font-semibold text-gray-900">{formatCurrency(step.cumulative_allocation)}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Funding Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Fully Funded:</span>
            <span className="ml-2 font-semibold text-green-600">
              {waterfallSteps.filter(s => s.funding_status === 'fully_funded').length} goals
            </span>
          </div>
          <div>
            <span className="text-gray-600">Partially Funded:</span>
            <span className="ml-2 font-semibold text-yellow-600">
              {waterfallSteps.filter(s => s.funding_status === 'partially_funded').length} goals
            </span>
          </div>
          <div>
            <span className="text-gray-600">Unfunded:</span>
            <span className="ml-2 font-semibold text-red-600">
              {waterfallSteps.filter(s => s.funding_status === 'unfunded').length} goals
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
