/**
 * Mental Account Buckets Component
 *
 * Implements REQ-GOAL-009: Mental account buckets showing dedicated assets,
 * expected value at goal date, funding level, success probability, and funding gap/surplus.
 */

import React from 'react';

export interface MentalAccountBucket {
  goalId: string;
  goalTitle: string;
  goalCategory: string;
  priority: 'essential' | 'important' | 'aspirational';
  targetDate: string;
  targetAmount: number;
  currentAmount: number;
  projectedValue: number;
  requiredMonthly: number;
  successProbability: number;
  fundingLevel: number; // 0-100%
  fundingGap: number; // negative = surplus, positive = gap
  allocatedAccounts: string[];
  assetAllocation: {
    [assetClass: string]: number;
  };
}

interface MentalAccountBucketsProps {
  buckets: MentalAccountBucket[];
  onSelectBucket?: (bucketId: string) => void;
}

export const MentalAccountBuckets: React.FC<MentalAccountBucketsProps> = ({
  buckets,
  onSelectBucket,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential':
        return 'border-red-500 bg-red-50';
      case 'important':
        return 'border-blue-500 bg-blue-50';
      case 'aspirational':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      essential: 'bg-red-100 text-red-800',
      important: 'bg-blue-100 text-blue-800',
      aspirational: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 0.9) return 'text-green-600';
    if (probability >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      retirement: '🏖️',
      education: '🎓',
      home: '🏠',
      major_expense: '🛒',
      emergency: '🚨',
      legacy: '💝',
    };
    return icons[category] || '🎯';
  };

  const formatGoalDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Goal Buckets</h2>
        <p className="text-sm text-gray-600">
          {buckets.length} active {buckets.length === 1 ? 'goal' : 'goals'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {buckets.map((bucket) => (
          <div
            key={bucket.goalId}
            className={`border-2 rounded-lg p-6 transition-all hover:shadow-lg cursor-pointer ${getPriorityColor(bucket.priority)}`}
            onClick={() => onSelectBucket?.(bucket.goalId)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getCategoryIcon(bucket.goalCategory)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{bucket.goalTitle}</h3>
                  <p className="text-sm text-gray-600">
                    Target: {formatGoalDate(bucket.targetDate)}
                  </p>
                </div>
              </div>
              {getPriorityBadge(bucket.priority)}
            </div>

            {/* Goal Financial Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-600">Current Value</p>
                <p className="text-base font-semibold text-gray-900">{formatCurrency(bucket.currentAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Target Amount</p>
                <p className="text-base font-semibold text-gray-900">{formatCurrency(bucket.targetAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Projected Value</p>
                <p className="text-base font-semibold text-blue-600">{formatCurrency(bucket.projectedValue)}</p>
              </div>
            </div>

            {/* Funding Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Funding Level</span>
                <span className="font-semibold">{bucket.fundingLevel.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    bucket.fundingLevel >= 75 ? 'bg-green-500' :
                    bucket.fundingLevel >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(bucket.fundingLevel, 100)}%` }}
                />
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Value</span>
                <span className="text-sm font-semibold">{formatCurrency(bucket.currentAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Target Amount</span>
                <span className="text-sm font-semibold">{formatCurrency(bucket.targetAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projected Value</span>
                <span className="text-sm font-semibold text-blue-600">{formatCurrency(bucket.projectedValue)}</span>
              </div>
            </div>

            {/* Funding Gap/Surplus */}
            <div className={`p-3 rounded-lg mb-4 ${
              bucket.fundingGap <= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {bucket.fundingGap <= 0 ? 'Surplus' : 'Funding Gap'}
                </span>
                <span className={`text-sm font-bold ${
                  bucket.fundingGap <= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {bucket.fundingGap <= 0 ? '+' : ''}{formatCurrency(Math.abs(bucket.fundingGap))}
                </span>
              </div>
            </div>

            {/* Success Probability */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Success Probability</span>
                <span className={`text-lg font-bold ${getSuccessColor(bucket.successProbability)}`}>
                  {(bucket.successProbability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    bucket.successProbability >= 0.9 ? 'bg-green-500' :
                    bucket.successProbability >= 0.7 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${bucket.successProbability * 100}%` }}
                />
              </div>
            </div>

            {/* Required Monthly Savings */}
            {bucket.requiredMonthly > 0 && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                <p className="text-xs text-gray-600 mb-1">Required Monthly Savings</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(bucket.requiredMonthly)}</p>
              </div>
            )}

            {/* Asset Allocation */}
            <div className="border-t border-gray-300 pt-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Asset Allocation</p>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                {Object.entries(bucket.assetAllocation).map(([asset, percentage]) => (
                  <div
                    key={asset}
                    className={`${getAssetColor(asset)}`}
                    style={{ width: `${percentage * 100}%` }}
                    title={`${asset}: ${(percentage * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(bucket.assetAllocation)
                  .filter(([_, percentage]) => percentage > 0.05)
                  .map(([asset, percentage]) => (
                    <span key={asset} className="text-xs text-gray-600">
                      {asset.replace(/_/g, ' ')}: {(percentage * 100).toFixed(0)}%
                    </span>
                  ))}
              </div>
            </div>

            {/* Allocated Accounts */}
            {bucket.allocatedAccounts && bucket.allocatedAccounts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-xs font-medium text-gray-700 mb-1">Allocated Accounts</p>
                <p className="text-xs text-gray-600">{bucket.allocatedAccounts.length} account(s)</p>
              </div>
            )}

            {/* Action Indicator */}
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Current Value</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(buckets.reduce((sum, b) => sum + b.currentAmount, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Target</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(buckets.reduce((sum, b) => sum + b.targetAmount, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Projected</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(buckets.reduce((sum, b) => sum + b.projectedValue, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Success Rate</p>
            <p className="text-xl font-bold text-green-600">
              {(buckets.reduce((sum, b) => sum + b.successProbability, 0) / buckets.length * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for asset class colors
function getAssetColor(asset: string): string {
  const colors: { [key: string]: string } = {
    us_stocks: 'bg-blue-500',
    international_stocks: 'bg-indigo-500',
    emerging_markets: 'bg-purple-500',
    bonds: 'bg-green-500',
    tips: 'bg-teal-500',
    cash: 'bg-gray-400',
    real_estate: 'bg-yellow-500',
    commodities: 'bg-orange-500',
  };
  return colors[asset] || 'bg-gray-300';
}

export default MentalAccountBuckets;
