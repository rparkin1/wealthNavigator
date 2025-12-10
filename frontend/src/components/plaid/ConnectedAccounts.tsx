/**
 * Connected Accounts Component
 * Displays list of connected bank accounts with balances
 */

import { useState, useEffect } from 'react';
import { plaidApi } from '../../services/plaidApi';
import type { PlaidAccount, PlaidItem } from '../../types/plaid';

export function ConnectedAccounts() {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load items and accounts
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, accountsData] = await Promise.all([
        plaidApi.listItems(),
        plaidApi.listAccounts(),
      ]);
      setItems(itemsData.items);
      setAccounts(accountsData.accounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await plaidApi.syncAccounts();
      await loadData();
    } catch (err) {
      console.error('Failed to sync accounts:', err);
      setError('Failed to sync accounts. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm('Are you sure you want to disconnect this institution? All associated accounts and transactions will be removed.')) {
      return;
    }

    try {
      await plaidApi.removeItem(itemId);
      await loadData();
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('Failed to disconnect institution. Please try again.');
    }
  }

  function formatCurrency(amount: number | null, currency: string = 'USD'): string {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  function getAccountTypeIcon(type: string): string {
    switch (type) {
      case 'depository':
        return '🏦';
      case 'credit':
        return '💳';
      case 'investment':
        return '📈';
      case 'loan':
        return '🏠';
      default:
        return '💰';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading accounts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadData}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          No accounts connected yet
        </div>
        <p className="text-sm text-gray-400">
          Click "Connect Bank Account" to get started
        </p>
      </div>
    );
  }

  // Group accounts by item
  const accountsByItem = accounts.reduce((acc, account) => {
    if (!acc[account.item_id]) {
      acc[account.item_id] = [];
    }
    acc[account.item_id].push(account);
    return acc;
  }, {} as Record<string, PlaidAccount[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Connected Accounts</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
            disabled:bg-gray-400 transition-colors text-sm font-medium"
        >
          {syncing ? 'Syncing...' : 'Sync All'}
        </button>
      </div>

      {/* Institutions */}
      {items.map((item) => {
        const itemAccounts = accountsByItem[item.id] || [];
        const totalBalance = itemAccounts.reduce(
          (sum, acc) => sum + (acc.current_balance || 0),
          0
        );

        return (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Institution Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.institution_name || 'Unknown Institution'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {itemAccounts.length} account{itemAccounts.length !== 1 ? 's' : ''}
                    {item.last_successful_sync && (
                      <span className="ml-2">
                        • Last synced: {new Date(item.last_successful_sync).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Accounts */}
            <div className="divide-y divide-gray-200">
              {itemAccounts.map((account) => (
                <div key={account.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getAccountTypeIcon(account.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {account.name}
                          {account.mask && (
                            <span className="text-gray-500 ml-2">••••{account.mask}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {account.official_name || account.subtype || account.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(account.current_balance, account.iso_currency_code)}
                      </div>
                      {account.available_balance !== null &&
                       account.available_balance !== account.current_balance && (
                        <div className="text-sm text-gray-600">
                          Available: {formatCurrency(account.available_balance, account.iso_currency_code)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-700">Total Balance</span>
                <span className="text-gray-900">{formatCurrency(totalBalance)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
