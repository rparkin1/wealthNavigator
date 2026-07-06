/**
 * Investment Holdings Component
 * Displays investment account holdings and securities
 */

import { useState, useEffect } from 'react';
import { plaidApi } from '../../services/plaidApi';
import { generateCSV, downloadCSV } from '../../utils/csvUtils';
import type { PlaidHolding, PlaidAccount } from '../../types/plaid';

export function InvestmentHoldings() {
  const [holdings, setHoldings] = useState<PlaidHolding[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [cashCreditAccounts, setCashCreditAccounts] = useState<PlaidAccount[]>([]);
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
      // Fetch holdings, the investment accounts that drive the grouped display,
      // and all accounts (so cash/credit balances can be included in the export).
      const [holdingsData, investmentAccountsData, allAccountsData] = await Promise.all([
        plaidApi.listHoldings(),
        plaidApi.listAccounts(undefined, 'investment'),
        plaidApi.listAccounts(),
      ]);
      setHoldings(holdingsData.holdings);
      setAccounts(investmentAccountsData.accounts);
      setCashCreditAccounts(
        allAccountsData.accounts.filter(
          (acc) => acc.type === 'depository' || acc.type === 'credit'
        )
      );
    } catch (err) {
      console.error('Failed to load holdings:', err);
      setError('Failed to load investment holdings. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Export all investment holdings across every account, plus cash (depository)
   * and credit account balances, to a single CSV file. Credit balances are
   * emitted as negative values to reflect amounts owed.
   */
  function handleExportCSV() {
    const headers = [
      'account',
      'ticker',
      'name',
      'type',
      'quantity',
      'price',
      'market_value',
      'cost_basis',
      'gain_loss',
      'gain_loss_pct',
      'currency',
    ];

    const accountLabel = (acc: PlaidAccount): string =>
      acc.mask ? `${acc.name} ••••${acc.mask}` : acc.name;

    const accountById = new Map(accounts.map((acc) => [acc.id, acc]));

    // One row per investment holding.
    const holdingRows = holdings.map((holding) => {
      const account = accountById.get(holding.account_id);
      const gainLoss =
        holding.institution_value !== null && holding.cost_basis !== null
          ? holding.institution_value - holding.cost_basis
          : null;
      const gainLossPct =
        gainLoss !== null && holding.cost_basis
          ? (gainLoss / holding.cost_basis) * 100
          : null;

      return {
        account: account ? accountLabel(account) : holding.account_id,
        ticker: holding.ticker_symbol ?? '',
        name: holding.name,
        type: holding.type ?? '',
        quantity: holding.quantity,
        price: holding.institution_price,
        market_value: holding.institution_value,
        cost_basis: holding.cost_basis,
        gain_loss: gainLoss,
        gain_loss_pct: gainLossPct !== null ? gainLossPct.toFixed(2) : '',
        currency: holding.iso_currency_code,
      };
    });

    // One row per cash/credit account balance (credit shown negative).
    const balanceRows = cashCreditAccounts.map((acc) => {
      const balance =
        acc.current_balance !== null && acc.type === 'credit'
          ? -acc.current_balance
          : acc.current_balance;

      return {
        account: accountLabel(acc),
        ticker: '',
        name: acc.official_name ?? acc.name,
        type: acc.type,
        quantity: '',
        price: '',
        market_value: balance,
        cost_basis: '',
        gain_loss: '',
        gain_loss_pct: '',
        currency: acc.iso_currency_code,
      };
    });

    const csv = generateCSV([...holdingRows, ...balanceRows], headers);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `portfolio-export-${timestamp}.csv`);
  }

  const hasExportableData = holdings.length > 0 || cashCreditAccounts.length > 0;

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

  // Only fully bail when there is nothing to show or export. If there are no
  // holdings but the user has cash/credit accounts, fall through so the export
  // button remains reachable.
  if (!hasExportableData) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!hasExportableData}
            title="Export holdings and account balances to CSV"
            className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 border
              border-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
              disabled:bg-gray-400 transition-colors text-sm font-medium"
          >
            {syncing ? 'Syncing...' : 'Sync Holdings'}
          </button>
        </div>
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
