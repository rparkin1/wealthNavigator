/**
 * RecurringTransactionsManager Component
 *
 * Complete management interface for recurring budget transactions.
 */

import React, { useState, useEffect } from 'react';
import { RecurringTransactionForm } from './RecurringTransactionForm';
import type { RecurringTransaction } from './RecurringTransactionForm';

interface RecurringTransactionResponse extends RecurringTransaction {
  id: string;
  user_id: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  last_generated_date?: string;
  next_generation_date: string;
  total_generated: number;
  created_at: string;
  updated_at: string;
}

interface UpcomingTransaction {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  type: string;
  category: string;
  next_date: string;
  days_until: number;
  auto_generate: boolean;
}

export const RecurringTransactionsManager: React.FC = () => {
  const [transactions, setTransactions] = useState<RecurringTransactionResponse[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
    loadUpcoming();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const mockData: RecurringTransactionResponse[] = [
        {
          id: '1',
          user_id: 'user1',
          category: 'housing',
          name: 'Monthly Rent',
          amount: 2200,
          frequency: 'monthly',
          type: 'expense',
          is_fixed: true,
          status: 'active',
          start_date: '2025-01-01',
          next_generation_date: '2025-11-01',
          total_generated: 10,
          auto_generate: true,
          days_ahead: 7,
          reminder_enabled: true,
          reminder_days_before: 3,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      setTransactions(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadUpcoming = async () => {
    try {
      // TODO: Replace with actual API call
      const mockUpcoming: UpcomingTransaction[] = [];
      setUpcoming(mockUpcoming);
    } catch (err) {
      console.error('Failed to load upcoming transactions:', err);
    }
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (transaction: RecurringTransactionResponse) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleSave = async (transaction: RecurringTransaction) => {
    try {
      // TODO: Replace with actual API call
      if (transaction.id) {
        // Update
        setTransactions(prev =>
          prev.map(t => (t.id === transaction.id ? { ...t, ...transaction } as RecurringTransactionResponse : t))
        );
      } else {
        // Create
        const newTransaction: RecurringTransactionResponse = {
          ...transaction,
          id: crypto.randomUUID(),
          user_id: 'user1',
          status: 'active',
          next_generation_date: transaction.start_date,
          total_generated: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setTransactions(prev => [...prev, newTransaction]);
      }

      setShowForm(false);
      setEditingTransaction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recurring transaction');
    }
  };

  const handlePause = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, status: 'paused' as const } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause transaction');
    }
  };

  const handleResume = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, status: 'active' as const } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume transaction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this recurring transaction?')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    }
  };

  const handleGenerateNow = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      alert('Entry generated! (This will call the API in production)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate entry');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recurring Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Automate your regular income, expenses, and savings
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Recurring Transaction
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({transactions.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({transactions.filter(t => t.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('paused')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'paused'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Paused ({transactions.filter(t => t.status === 'paused').length})
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 mb-4">No recurring transactions yet.</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Recurring Transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {transaction.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(transaction.status)}`}>
                        {transaction.status.toUpperCase()}
                      </span>
                      {transaction.is_fixed && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          Fixed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="capitalize">{transaction.type}</span>
                      <span>•</span>
                      <span className="capitalize">{transaction.category.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span className="capitalize">{transaction.frequency}</span>
                      <span>•</span>
                      <span className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Next: {new Date(transaction.next_generation_date).toLocaleDateString()}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-600">
                        Generated: {transaction.total_generated} times
                      </span>
                      {transaction.auto_generate && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="text-green-600">Auto-generate enabled</span>
                        </>
                      )}
                    </div>

                    {transaction.notes && (
                      <p className="text-sm text-gray-600 mt-2">{transaction.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {transaction.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleGenerateNow(transaction.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-600"
                        >
                          Generate Now
                        </button>
                        <button
                          onClick={() => handlePause(transaction.id)}
                          className="px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-50 rounded"
                        >
                          Pause
                        </button>
                      </>
                    )}
                    {transaction.status === 'paused' && (
                      <button
                        onClick={() => handleResume(transaction.id)}
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <RecurringTransactionForm
          transaction={editingTransaction}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
};
