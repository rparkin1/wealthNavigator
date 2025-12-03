/**
 * Portfolio Data Manager Component
 *
 * Comprehensive data entry interface for portfolio management.
 * Provides access to Accounts, Holdings, and Import/Export functionality.
 */

import { useState, useEffect } from 'react';
import { AccountForm } from './AccountForm';
import type { Account } from './AccountForm';
import { HoldingForm } from './HoldingForm';
import type { Holding } from './HoldingForm';
import { ImportExportPanel } from './ImportExportPanel';

export interface PortfolioDataManagerProps {
  userId: string;
}

type View = 'accounts' | 'holdings' | 'import-export';
type ModalState = 'closed' | 'add-account' | 'edit-account' | 'add-holding' | 'edit-holding';

export function PortfolioDataManager({ userId }: PortfolioDataManagerProps) {
  const [currentView, setCurrentView] = useState<View>('accounts');
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LocalStorage keys for persistence
  const ACCOUNTS_KEY = `portfolio_accounts_${userId}`;
  const HOLDINGS_KEY = `portfolio_holdings_${userId}`;

  useEffect(() => {
    loadData();
  }, [userId]);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        console.log('[PortfolioDataManager] Saved', accounts.length, 'accounts to localStorage');
      } catch (err) {
        console.error('[PortfolioDataManager] Failed to save accounts to localStorage:', err);
      }
    }
  }, [accounts, ACCOUNTS_KEY, loading]);

  // Save holdings to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
        console.log('[PortfolioDataManager] Saved', holdings.length, 'holdings to localStorage');
      } catch (err) {
        console.error('[PortfolioDataManager] Failed to save holdings to localStorage:', err);
      }
    }
  }, [holdings, HOLDINGS_KEY, loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from localStorage
      const savedAccounts = localStorage.getItem(ACCOUNTS_KEY);
      const savedHoldings = localStorage.getItem(HOLDINGS_KEY);

      if (savedAccounts) {
        const parsedAccounts = JSON.parse(savedAccounts);
        setAccounts(parsedAccounts);
        console.log('[PortfolioDataManager] Loaded', parsedAccounts.length, 'accounts from localStorage');
      } else {
        setAccounts([]);
      }

      if (savedHoldings) {
        const parsedHoldings = JSON.parse(savedHoldings);
        setHoldings(parsedHoldings);
        console.log('[PortfolioDataManager] Loaded', parsedHoldings.length, 'holdings from localStorage');
      } else {
        setHoldings([]);
      }

      // TODO: Replace with actual API calls when backend is ready
      // const accountsResponse = await fetch(`/api/v1/portfolio/accounts?user_id=${userId}`);
      // const holdingsResponse = await fetch(`/api/v1/portfolio/holdings?user_id=${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
      console.error('[PortfolioDataManager] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setModalState('add-account');
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setModalState('edit-account');
  };

  const handleSaveAccount = async (accountData: Partial<Account>) => {
    try {
      // TODO: API call
      // const response = await fetch('/api/v1/portfolio/accounts', { method: 'POST', body: JSON.stringify(accountData) });

      if (editingAccount) {
        // Update
        setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...accountData } as Account : a));
      } else {
        // Create
        const newAccount: Account = {
          ...accountData as Account,
          id: crypto.randomUUID(),
        };
        setAccounts(prev => [...prev, newAccount]);
      }
      setModalState('closed');
      setEditingAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Delete this account and all its holdings?')) return;

    try {
      // TODO: API call
      setAccounts(prev => prev.filter(a => a.id !== id));
      setHoldings(prev => prev.filter(h => h.accountId !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const handleAddHolding = () => {
    setEditingHolding(null);
    setModalState('add-holding');
  };

  const handleEditHolding = (holding: Holding) => {
    setEditingHolding(holding);
    setModalState('edit-holding');
  };

  const handleSaveHolding = async (holdingData: Partial<Holding>) => {
    try {
      // TODO: API call

      if (editingHolding) {
        // Update
        setHoldings(prev => prev.map(h => h.id === editingHolding.id ? { ...h, ...holdingData } as Holding : h));
      } else {
        // Create
        const newHolding: Holding = {
          ...holdingData as Holding,
          id: crypto.randomUUID(),
        };
        setHoldings(prev => [...prev, newHolding]);
      }
      setModalState('closed');
      setEditingHolding(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save holding');
    }
  };

  const handleDeleteHolding = async (id: string) => {
    if (!confirm('Delete this holding?')) return;

    try {
      // TODO: API call
      setHoldings(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete holding');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Data Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your investment accounts, holdings, and portfolio data
          </p>
        </div>
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

      {/* View Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex gap-2">
        <button
          onClick={() => setCurrentView('accounts')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
            currentView === 'accounts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏦 Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setCurrentView('holdings')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
            currentView === 'holdings'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📈 Holdings ({holdings.length})
        </button>
        <button
          onClick={() => setCurrentView('import-export')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
            currentView === 'import-export'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📥 Import/Export
        </button>
      </div>

      {/* Accounts View */}
      {currentView === 'accounts' && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Investment Accounts</h3>
            <button
              onClick={handleAddAccount}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Add Account
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No accounts yet.</p>
              <button
                onClick={handleAddAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Account
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {accounts.map(account => (
                <div key={account.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{account.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="capitalize">{account.accountType?.replace(/_/g, ' ') || 'Unknown Type'}</span>
                        <span>•</span>
                        <span>{account.institution || 'Unknown Institution'}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-900">{formatCurrency(account.balance)}</span>
                      </div>
                      {account.notes && <p className="text-sm text-gray-600 mt-2">{account.notes}</p>}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id!)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Holdings View */}
      {currentView === 'holdings' && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Holdings</h3>
            <button
              onClick={handleAddHolding}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={accounts.length === 0}
            >
              + Add Holding
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">Create an account first before adding holdings.</p>
              <button
                onClick={handleAddAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Account
              </button>
            </div>
          ) : holdings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4">No holdings yet.</p>
              <button
                onClick={handleAddHolding}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Your First Holding
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {holdings.map(holding => (
                <div key={holding.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-medium text-gray-900">{holding.ticker || 'N/A'}</h4>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {holding.securityType?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{holding.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{holding.shares} shares</span>
                        <span>•</span>
                        <span>Cost: {formatCurrency(holding.costBasis)}</span>
                        <span>•</span>
                        <span>Current: {formatCurrency(holding.currentValue)}</span>
                        <span>•</span>
                        <span className={holding.currentValue >= holding.costBasis ? 'text-green-600' : 'text-red-600'}>
                          {holding.costBasis && holding.currentValue
                            ? ((holding.currentValue - holding.costBasis) / holding.costBasis * 100).toFixed(2)
                            : '0.00'}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditHolding(holding)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHolding(holding.id!)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import/Export View */}
      {currentView === 'import-export' && (
        <div className="space-y-6">
          {/* Accounts Import/Export */}
          <ImportExportPanel
            dataType="accounts"
            onImport={async (data) => {
              console.log('[PortfolioDataManager] Starting accounts import with', data.length, 'rows');
              console.log('[PortfolioDataManager] Sample account row:', data[0]);

              // Transform CSV snake_case to camelCase
              const accountsToCreate = data.map(item => ({
                id: item.id as string || undefined,
                name: item.name as string,
                account_type: item.account_type as string,
                institution: item.institution as string,
                account_number: item.account_number as string || undefined,
                balance: item.balance as number,
                opened: item.opened as string || undefined,
                notes: item.notes as string || undefined,
              }));

              // Persist to database via API
              try {
                const response = await fetch('http://localhost:8000/api/v1/portfolio-data/accounts/bulk', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    user_id: userId,
                    accounts: accountsToCreate,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error('[PortfolioDataManager] API Error Response:', errorData);

                  // Handle validation errors (422) - format as readable string
                  if (response.status === 422 && Array.isArray(errorData.detail)) {
                    const validationErrors = errorData.detail
                      .map((err: any) => `${err.loc.join('.')}: ${err.msg}`)
                      .join('; ');
                    throw new Error(`Validation failed: ${validationErrors}`);
                  }

                  // Handle other errors
                  const errorMessage = typeof errorData.detail === 'string'
                    ? errorData.detail
                    : JSON.stringify(errorData.detail);
                  throw new Error(errorMessage || 'Failed to save accounts to database');
                }

                const result = await response.json();
                console.log('[PortfolioDataManager] Successfully saved', result.created_count, 'accounts to database');

                // Update local state with response from database (includes IDs)
                const newAccounts = result.accounts.map((acc: any) => ({
                  id: acc.id,
                  name: acc.name,
                  accountType: acc.account_type,
                  institution: acc.institution,
                  accountNumber: acc.account_number,
                  balance: acc.balance,
                  opened: acc.opened,
                  notes: acc.notes,
                }));

                setAccounts(prev => [...prev, ...newAccounts]);

                if (result.errors && result.errors.length > 0) {
                  console.warn('[PortfolioDataManager] Some accounts had errors:', result.errors);
                }
              } catch (err) {
                console.error('[PortfolioDataManager] Failed to save accounts to database:', err);
                setError(err instanceof Error ? err.message : 'Failed to save accounts to database');
                throw err; // Re-throw to prevent UI from showing success
              }
            }}
            onExport={async () => accounts}
            existingData={accounts}
          />

          {/* Holdings Import/Export */}
          <ImportExportPanel
            dataType="holdings"
            onImport={async (data) => {
              console.log('[PortfolioDataManager] Starting holdings import with', data.length, 'rows');
              console.log('[PortfolioDataManager] Sample row:', data[0]);

              // Validate account references
              const accountIds = new Set(accounts.map(a => a.id));
              const orphanedHoldings: string[] = [];

              data.forEach(item => {
                if (item.account_id && !accountIds.has(item.account_id as string)) {
                  orphanedHoldings.push(`${item.ticker} (account_id: ${item.account_id})`);
                }
              });

              // Warn about orphaned holdings
              if (orphanedHoldings.length > 0) {
                const proceed = confirm(
                  `⚠️ Warning: ${orphanedHoldings.length} holding(s) reference non-existent accounts:\n\n` +
                  `${orphanedHoldings.slice(0, 5).join('\n')}` +
                  `${orphanedHoldings.length > 5 ? `\n...and ${orphanedHoldings.length - 5} more` : ''}\n\n` +
                  `These holdings will be imported but won't be linked to any account.\n\n` +
                  `Import accounts first, then import holdings. Continue anyway?`
                );
                if (!proceed) return;
              }

              // Transform for API
              const holdingsToCreate = data.map(item => ({
                id: item.id as string || undefined,
                ticker: item.ticker as string,
                name: item.name as string,
                security_type: item.security_type as string,
                shares: item.shares as number,
                cost_basis: item.cost_basis as number,
                current_value: item.current_value as number,
                purchase_date: item.purchase_date as string || undefined,
                account_id: item.account_id as string,
                asset_class: item.asset_class as string || undefined,
                expense_ratio: item.expense_ratio as number || undefined,
              }));

              // Persist to database via API
              try {
                const response = await fetch('http://localhost:8000/api/v1/portfolio-data/holdings/bulk', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    user_id: userId,
                    holdings: holdingsToCreate,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.detail || 'Failed to save holdings to database');
                }

                const result = await response.json();
                console.log('[PortfolioDataManager] Successfully saved', result.created_count, 'holdings to database');

                // Update local state with response from database (includes IDs)
                const newHoldings = result.holdings.map((h: any) => ({
                  id: h.id,
                  ticker: h.ticker,
                  name: h.name,
                  securityType: h.security_type,
                  shares: h.shares,
                  costBasis: h.cost_basis,
                  currentValue: h.current_value,
                  purchaseDate: h.purchase_date,
                  accountId: h.account_id,
                  assetClass: h.asset_class,
                  expenseRatio: h.expense_ratio,
                }));

                setHoldings(prev => [...prev, ...newHoldings]);

                if (result.errors && result.errors.length > 0) {
                  console.warn('[PortfolioDataManager] Some holdings had errors:', result.errors);
                }
              } catch (err) {
                console.error('[PortfolioDataManager] Failed to save holdings to database:', err);
                setError(err instanceof Error ? err.message : 'Failed to save holdings to database');
                throw err; // Re-throw to prevent UI from showing success
              }
            }}
            onExport={async () => holdings}
            existingData={holdings}
          />
        </div>
      )}

      {/* Account Form Modal */}
      {(modalState === 'add-account' || modalState === 'edit-account') && (
        <AccountForm
          account={editingAccount}
          onSubmit={handleSaveAccount}
          onCancel={() => {
            setModalState('closed');
            setEditingAccount(null);
          }}
          mode={modalState === 'add-account' ? 'create' : 'edit'}
        />
      )}

      {/* Holding Form Modal */}
      {(modalState === 'add-holding' || modalState === 'edit-holding') && (
        <HoldingForm
          holding={editingHolding}
          accounts={accounts.map(a => ({ id: a.id || '', name: a.name || 'Unnamed Account', type: a.accountType || 'taxable' }))}
          onSubmit={handleSaveHolding}
          onCancel={() => {
            setModalState('closed');
            setEditingHolding(null);
          }}
          mode={modalState === 'add-holding' ? 'create' : 'edit'}
        />
      )}
    </div>
  );
}
