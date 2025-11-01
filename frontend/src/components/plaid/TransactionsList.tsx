/**
 * Transactions List Component
 * Displays and filters bank transactions
 */

import { useState, useEffect } from 'react';
import { plaidApi } from '../../services/plaidApi';
import type { PlaidTransaction, TransactionsListRequest } from '../../types/plaid';

export function TransactionsList() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<TransactionsListRequest>({
    limit: 50,
    offset: 0,
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    end_date: new Date().toISOString().split('T')[0],
  });

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  async function loadTransactions() {
    try {
      setLoading(true);
      setError(null);
      const response = await plaidApi.listTransactions(filters);
      setTransactions(response.transactions);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await plaidApi.syncTransactions();
      await loadTransactions();
    } catch (err) {
      console.error('Failed to sync transactions:', err);
      setError('Failed to sync transactions. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleUpdateTransaction(
    transactionId: string,
    updates: { user_category?: string; user_notes?: string; is_excluded?: boolean }
  ) {
    try {
      await plaidApi.updateTransaction(transactionId, updates);
      // Reload to show updated transaction
      await loadTransactions();
    } catch (err) {
      console.error('Failed to update transaction:', err);
      setError('Failed to update transaction. Please try again.');
    }
  }

  function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Math.abs(amount));
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">
            {total} transaction{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
            disabled:bg-gray-400 transition-colors text-sm font-medium"
        >
          {syncing ? 'Syncing...' : 'Sync Transactions'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-gray-500">No transactions found</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {transaction.pending && (
                          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.merchant_name || transaction.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.date)}
                          {transaction.category && transaction.category.length > 0 && (
                            <span className="ml-2">• {transaction.category[0]}</span>
                          )}
                        </p>
                        {transaction.user_notes && (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            {transaction.user_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div
                      className={`text-lg font-semibold ${
                        transaction.amount < 0 ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      {transaction.amount < 0 ? '+' : '-'}
                      {formatCurrency(transaction.amount, transaction.iso_currency_code)}
                    </div>
                    {transaction.pending && (
                      <span className="text-xs text-yellow-600">Pending</span>
                    )}
                    {transaction.is_excluded && (
                      <span className="text-xs text-gray-500">Excluded</span>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <button
                    onClick={() => {
                      const category = prompt('Enter category:', transaction.user_category || '');
                      if (category !== null) {
                        handleUpdateTransaction(transaction.id, { user_category: category });
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {transaction.user_category ? 'Edit Category' : 'Add Category'}
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Enter notes:', transaction.user_notes || '');
                      if (notes !== null) {
                        handleUpdateTransaction(transaction.id, { user_notes: notes });
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {transaction.user_notes ? 'Edit Notes' : 'Add Notes'}
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateTransaction(transaction.id, {
                        is_excluded: !transaction.is_excluded,
                      })
                    }
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {transaction.is_excluded ? 'Include' : 'Exclude'} from Budget
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > (filters.limit || 50) && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    offset: Math.max(0, (filters.offset || 0) - (filters.limit || 50)),
                  })
                }
                disabled={!filters.offset || filters.offset === 0}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Showing {(filters.offset || 0) + 1} - {Math.min((filters.offset || 0) + (filters.limit || 50), total)} of {total}
              </span>
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    offset: (filters.offset || 0) + (filters.limit || 50),
                  })
                }
                disabled={(filters.offset || 0) + (filters.limit || 50) >= total}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
