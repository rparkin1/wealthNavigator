/**
 * Bucket Rebalancer Component
 *
 * Interface for analyzing and executing rebalancing across mental account buckets
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import { useState, useEffect } from 'react';
import type {
  RebalancingAnalysis,
  RebalancingRecommendation,
  MentalAccountBucket
} from '../../types/mentalAccounting';
import * as mentalAccountingApi from '../../services/mentalAccountingApi';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';

export interface BucketRebalancerProps {
  userId: string;
  buckets: MentalAccountBucket[];
  totalPortfolioValue: number;
  onRebalanceComplete?: () => void;
}

export function BucketRebalancer({
  userId,
  buckets,
  totalPortfolioValue,
  onRebalanceComplete,
}: BucketRebalancerProps) {
  const [analysis, setAnalysis] = useState<RebalancingAnalysis | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeRebalancing();
  }, [userId, buckets, totalPortfolioValue]);

  const analyzeRebalancing = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await mentalAccountingApi.analyzeRebalancingNeeds({
        user_id: userId,
        total_portfolio_value: totalPortfolioValue,
      });

      setAnalysis(result);

      // Auto-select high priority recommendations
      const highPriorityIndices = result.recommendations
        .map((rec, idx) => (rec.priority === 'high' ? idx : -1))
        .filter(idx => idx !== -1);

      setSelectedRecommendations(new Set(highPriorityIndices));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze rebalancing needs');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecommendation = (index: number) => {
    const newSelected = new Set(selectedRecommendations);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRecommendations(newSelected);
  };

  const executeRebalancing = async () => {
    if (!analysis || selectedRecommendations.size === 0) return;

    try {
      setExecuting(true);
      setError(null);

      // Execute selected recommendations
      const selectedRecs = analysis.recommendations.filter((_, idx) =>
        selectedRecommendations.has(idx)
      );

      // In a real implementation, this would call a backend endpoint to execute transfers
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 100));

      if (onRebalanceComplete) {
        onRebalanceComplete();
      }

      // Re-analyze after execution
      await analyzeRebalancing();
      setSelectedRecommendations(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute rebalancing');
    } finally {
      setExecuting(false);
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

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIconComponent = (priority: string): React.ComponentType<{ className?: string }> => {
    switch (priority) {
      case 'high':
        return ExclamationCircleIcon; // Red circle for high priority
      case 'medium':
        return ExclamationTriangleIcon; // Yellow warning for medium priority
      case 'low':
        return CheckCircleIcon; // Green check for low priority
      default:
        return MinusCircleIcon; // Gray circle for default
    }
  };

  const getTotalSelectedAmount = (): number => {
    if (!analysis) return 0;
    return analysis.recommendations
      .filter((_, idx) => selectedRecommendations.has(idx))
      .reduce((sum, rec) => sum + rec.amount, 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing rebalancing needs...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg p-6">
        {error ? (
          <p className="text-red-600 text-center py-8" data-testid="rebalancer-error">
            Error: {error}
          </p>
        ) : (
          <p className="text-gray-500 text-center py-8">No rebalancing analysis available</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rebalancing Analysis</h2>
        <p className="text-sm text-gray-600">
          Optimize allocation across {buckets.length} goals based on priorities and funding gaps
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Status Banner */}
      {!analysis.needs_rebalancing && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-8 h-8 text-success-600 flex-shrink-0" />
            <div>
              <h3 className="text-green-900 font-semibold">Portfolio Balanced</h3>
              <p className="text-sm text-green-700">
                Your goals are properly allocated. No rebalancing needed at this time.
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis.needs_rebalancing && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium mb-1">Total Imbalance</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(analysis.total_imbalance)}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 font-medium mb-1">Overallocated Goals</p>
              <p className="text-2xl font-bold text-yellow-900">{analysis.overallocated_goals.length}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium mb-1">Underallocated Goals</p>
              <p className="text-2xl font-bold text-blue-900">{analysis.underallocated_goals.length}</p>
            </div>
          </div>

          {/* Overallocated Goals */}
          {analysis.overallocated_goals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Overallocated Goals ({analysis.overallocated_goals.length})
              </h3>
              <div className="space-y-2">
                {analysis.overallocated_goals.map((goal) => (
                  <div
                    key={goal.goal_id}
                    data-testid={`overallocated-goal-${goal.goal_id}`}
                    className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className="font-semibold text-gray-900"
                          data-testid={`overallocated-goal-name-${goal.goal_id}`}
                        >
                          {goal.goal_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Current: {goal.current_allocation.toFixed(1)}% •
                          Target: {goal.target_allocation.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Excess Amount</p>
                        <p
                          className="text-lg font-bold text-yellow-900"
                          data-testid={`overallocated-goal-excess-${goal.goal_id}`}
                        >
                          {formatCurrency(goal.excess_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full"
                        style={{ width: `${(goal.current_allocation / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Underallocated Goals */}
          {analysis.underallocated_goals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Underallocated Goals ({analysis.underallocated_goals.length})
              </h3>
              <div className="space-y-2">
                {analysis.underallocated_goals.map((goal) => (
                  <div
                    key={goal.goal_id}
                    data-testid={`underallocated-goal-${goal.goal_id}`}
                    className="border border-blue-200 bg-blue-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4
                          className="font-semibold text-gray-900"
                          data-testid={`underallocated-goal-name-${goal.goal_id}`}
                        >
                          {goal.goal_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Current: {goal.current_allocation.toFixed(1)}% •
                          Target: {goal.target_allocation.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Shortfall Amount</p>
                        <p
                          className="text-lg font-bold text-blue-900"
                          data-testid={`underallocated-goal-shortfall-${goal.goal_id}`}
                        >
                          {formatCurrency(goal.shortfall_amount)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${(goal.current_allocation / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Rebalancing Recommendations ({analysis.recommendations.length})
                </h3>
                <button
                  onClick={() => {
                    if (selectedRecommendations.size === analysis.recommendations.length) {
                      setSelectedRecommendations(new Set());
                    } else {
                      setSelectedRecommendations(
                        new Set(analysis.recommendations.map((_, idx) => idx))
                      );
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedRecommendations.size === analysis.recommendations.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => {
                  const isSelected = selectedRecommendations.has(index);

                  return (
                    <div
                      key={`${rec.from_goal_id}-${rec.to_goal_id}`}
                      data-testid={`recommendation-card-${index}`}
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => toggleRecommendation(index)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRecommendation(index)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-blue-600 rounded mt-1"
                        />

                        <div className="flex-1">
                          {/* Priority Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`${rec.priority === 'high' ? 'text-error-600' : rec.priority === 'medium' ? 'text-warning-600' : 'text-success-600'}`}>
                              {(() => {
                                const IconComponent = getPriorityIconComponent(rec.priority);
                                return <IconComponent className="w-5 h-5" />;
                              })()}
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityColor(
                                rec.priority
                              )}`}
                            >
                              {rec.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>

                          {/* Transfer Details */}
                          <div className="mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className="font-semibold text-gray-900"
                                data-testid={`recommendation-from-${index}`}
                              >
                                {rec.from_goal_name}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span
                                className="font-semibold text-gray-900"
                                data-testid={`recommendation-to-${index}`}
                              >
                                {rec.to_goal_name}
                              </span>
                            </div>
                            <p
                              className="text-lg font-bold text-blue-600 mt-1"
                              data-testid={`recommendation-amount-${index}`}
                            >
                              {formatCurrency(rec.amount)}
                            </p>
                          </div>

                          {/* Reason */}
                          <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                            <span className="font-medium">Reason:</span> {rec.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Panel */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600" data-testid="selected-recommendation-count">
                    Selected Recommendations: {selectedRecommendations.size} of{' '}
                    {analysis.recommendations.length}
                  </p>
                  <p className="text-lg font-bold text-gray-900" data-testid="total-transfer-amount">
                    Total Transfer Amount: {formatCurrency(getTotalSelectedAmount())}
                  </p>
                </div>
                <button
                  data-testid="execute-rebalancing-button"
                  onClick={executeRebalancing}
                  disabled={selectedRecommendations.size === 0 || executing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {executing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {executing ? 'Executing Rebalancing...' : 'Execute Selected Rebalancing'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={analyzeRebalancing}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
          )}
          Re-analyze
        </button>
      </div>
    </div>
  );
}
