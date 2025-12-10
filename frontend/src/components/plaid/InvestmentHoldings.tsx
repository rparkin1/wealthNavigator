/**
 * Investment Holdings Component
 * Displays investment account holdings and securities
 */

import { useState, useEffect } from 'react';
import { plaidApi } from '../../services/plaidApi';
import type { PlaidHolding, PlaidAccount } from '../../types/plaid';

export function InvestmentHoldings() {
  const [holdings, setHoldings] = useState<PlaidHolding[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHoldings();
  }, []);

  async function loadHoldings() {
    try {
      setLoading(true);
      setError(null);
      const [holdingsData, accountsData] = await Promise.all([
        plaidApi.listHoldings(),
        plaidApi.listAccounts(undefined, 'investment'),
      ]);
      setHoldings(holdingsData.holdings);
      setAccounts(accountsData.accounts);
    } catch (err) {
      console.error('Failed to load holdings:', err);
      setError('Failed to load investment holdings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      await plaidApi.syncHoldings();
      await loadHoldings();
    } catch (err) {
      console.error('Failed to sync holdings:', err);
      setError('Failed to sync holdings. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  function formatCurrency(amount: number | null, currency: string = 'USD'): string {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(num);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading investment holdings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadHoldings}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <div className="text-gray-500 mb-2">No investment accounts found</div>
        <p className="text-sm text-gray-400">
          Connect an investment account to see your holdings
        </p>
      </div>
    );
  }

  // Group holdings by account
  const holdingsByAccount = holdings.reduce((acc, holding) => {
    if (!acc[holding.account_id]) {
      acc[holding.account_id] = [];
    }
    acc[holding.account_id].push(holding);
    return acc;
  }, {} as Record<string, PlaidHolding[]>);

  // Calculate totals
  const totalValue = holdings.reduce(
    (sum, holding) => sum + (holding.institution_value || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investment Holdings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Portfolio Value: {formatCurrency(totalValue)}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
            disabled:bg-gray-400 transition-colors text-sm font-medium"
        >
          {syncing ? 'Syncing...' : 'Sync Holdings'}
        </button>
      </div>

      {/* Holdings by Account */}
      {accounts.map((account) => {
        const accountHoldings = holdingsByAccount[account.id] || [];
        if (accountHoldings.length === 0) return null;

        const accountTotal = accountHoldings.reduce(
          (sum, h) => sum + (h.institution_value || 0),
          0
        );

        return (
          <div key={account.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Account Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {account.name}
                    {account.mask && (
                      <span className="text-gray-500 ml-2">••••{account.mask}</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {accountHoldings.length} holding{accountHoldings.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(accountTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Security
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Basis
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gain/Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accountHoldings.map((holding) => {
                    const gainLoss =
                      holding.institution_value && holding.cost_basis
                        ? holding.institution_value - holding.cost_basis
                        : null;
                    const gainLossPercent =
                      gainLoss !== null && holding.cost_basis
                        ? (gainLoss / holding.cost_basis) * 100
                        : null;

                    return (
                      <tr key={holding.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {holding.ticker_symbol || holding.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {holding.ticker_symbol ? holding.name : holding.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatNumber(holding.quantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(
                            holding.institution_price,
                            holding.iso_currency_code
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(
                            holding.institution_value,
                            holding.iso_currency_code
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(holding.cost_basis, holding.iso_currency_code)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {gainLoss !== null ? (
                            <div>
                              <div
                                className={`font-medium ${
                                  gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {gainLoss >= 0 ? '+' : ''}
                                {formatCurrency(gainLoss, holding.iso_currency_code)}
                              </div>
                              {gainLossPercent !== null && (
                                <div
                                  className={`text-xs ${
                                    gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {gainLossPercent >= 0 ? '+' : ''}
                                  {gainLossPercent.toFixed(2)}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
