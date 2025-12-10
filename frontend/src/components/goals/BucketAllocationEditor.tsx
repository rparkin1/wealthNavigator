/**
 * Bucket Allocation Editor Component
 *
 * Interface for allocating accounts to goal buckets with percentage allocation
 */

import { useState, useEffect } from 'react';
import type { Goal } from '../../types/goal';
import type { AllocateAccountRequest, DedicatedAccount } from '../../types/mentalAccounting';
import * as mentalAccountingApi from '../../services/mentalAccountingApi';

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface BucketAllocationEditorProps {
  goal: Goal;
  availableAccounts: Account[];
  existingAllocations?: DedicatedAccount[];
  onClose: () => void;
  onAllocationUpdated?: () => void;
}

export function BucketAllocationEditor({
  goal,
  availableAccounts,
  existingAllocations = [],
  onClose,
  onAllocationUpdated,
}: BucketAllocationEditorProps) {
  const [allocations, setAllocations] = useState<Map<string, { percentage: number; contribution: number }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with existing allocations
    const initialAllocations = new Map();
    existingAllocations.forEach((alloc) => {
      initialAllocations.set(alloc.account_id, {
        percentage: alloc.allocation_percentage,
        contribution: alloc.contribution_rate,
      });
    });
    setAllocations(initialAllocations);
  }, [existingAllocations]);

  const handlePercentageChange = (accountId: string, percentage: number) => {
    const current = allocations.get(accountId) || { percentage: 0, contribution: 0 };
    setAllocations(new Map(allocations.set(accountId, { ...current, percentage })));
  };

  const handleContributionChange = (accountId: string, contribution: number) => {
    const current = allocations.get(accountId) || { percentage: 0, contribution: 0 };
    setAllocations(new Map(allocations.set(accountId, { ...current, contribution })));
  };

  const toggleAccount = (accountId: string) => {
    if (allocations.has(accountId)) {
      const newAllocations = new Map(allocations);
      newAllocations.delete(accountId);
      setAllocations(newAllocations);
    } else {
      setAllocations(new Map(allocations.set(accountId, { percentage: 0, contribution: 0 })));
    }
  };

  const getTotalPercentage = (): number => {
    return Array.from(allocations.values()).reduce((sum, alloc) => sum + alloc.percentage, 0);
  };

  const getTotalContribution = (): number => {
    return Array.from(allocations.values()).reduce((sum, alloc) => sum + alloc.contribution, 0);
  };

  const isValid = (): boolean => {
    const totalPercentage = getTotalPercentage();
    return totalPercentage >= 0 && totalPercentage <= 100 && allocations.size > 0;
  };

  const handleSave = async () => {
    if (!isValid()) {
      setError('Total allocation must be between 0% and 100%');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Save each allocation
      const promises = Array.from(allocations.entries()).map(([accountId, alloc]) => {
        const request: AllocateAccountRequest = {
          goal_id: goal.id,
          account_id: accountId,
          allocation_percentage: alloc.percentage,
          monthly_contribution: alloc.contribution,
        };
        return mentalAccountingApi.allocateAccountToGoal(request);
      });

      await Promise.all(promises);

      if (onAllocationUpdated) {
        onAllocationUpdated();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save allocations');
    } finally {
      setLoading(false);
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

  const totalPercentage = getTotalPercentage();
  const totalContribution = getTotalContribution();

  return (
    <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Allocate Accounts to Goal</h2>
          <p className="text-sm text-gray-600 mt-1">{goal.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Goal Summary */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Target Amount:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Current Amount:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {formatCurrency(goal.currentAmount || 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Funding Gap:</span>
            <span className="ml-2 font-semibold text-red-600">
              {formatCurrency(goal.targetAmount - (goal.currentAmount || 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Available Accounts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Accounts</h3>
        <div className="space-y-3">
          {availableAccounts.map((account) => {
            const isAllocated = allocations.has(account.id);
            const allocation = allocations.get(account.id);

            return (
              <div
                key={account.id}
                className={`border rounded-lg p-4 transition-all ${
                  isAllocated
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Account Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={isAllocated}
                        onChange={() => toggleAccount(account.id)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{account.name}</h4>
                        <p className="text-sm text-gray-600">
                          {account.type} • Balance: {formatCurrency(account.balance)}
                        </p>
                      </div>
                    </div>

                    {/* Allocation Controls */}
                    {isAllocated && allocation && (
                      <div className="ml-8 mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Allocation Percentage
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={allocation.percentage}
                              onChange={(e) =>
                                handlePercentageChange(account.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-gray-600">%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatCurrency((allocation.percentage / 100) * account.balance)} allocated
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Contribution
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">$</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={allocation.contribution}
                              onChange={(e) =>
                                handleContributionChange(account.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatCurrency(allocation.contribution * 12)}/year
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {availableAccounts.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No accounts available for allocation</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Allocation Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Accounts Allocated</p>
            <p className="text-lg font-bold text-gray-900">{allocations.size}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Allocation</p>
            <p className={`text-lg font-bold ${
              totalPercentage > 100 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {totalPercentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Monthly Contribution</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(totalContribution)}
            </p>
          </div>
        </div>

        {totalPercentage > 100 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-700">
              ⚠️ Total allocation exceeds 100%. Please adjust allocations.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid() || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {loading ? 'Saving...' : 'Save Allocations'}
        </button>
      </div>
    </div>
  );
}
