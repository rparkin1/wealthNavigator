/**
 * Plaid Dashboard Component
 * Main dashboard for managing connected accounts and viewing transactions
 */

import { useState } from 'react';
import {
  BuildingLibraryIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { PlaidLinkButton } from './PlaidLinkButton';
import { ConnectedAccounts } from './ConnectedAccounts';
import { TransactionsList } from './TransactionsList';
import { InvestmentHoldings } from './InvestmentHoldings';
import { InvestmentTransactionsList } from './InvestmentTransactionsList';

type Tab = 'accounts' | 'transactions' | 'investments' | 'investment-transactions';

export function PlaidDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLinkSuccess = () => {
    // Refresh the dashboard after successful account linking
    setRefreshKey((prev) => prev + 1);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'accounts', label: 'Accounts', icon: <BuildingLibraryIcon className="w-5 h-5" /> },
    { id: 'transactions', label: 'Bank Transactions', icon: <BanknotesIcon className="w-5 h-5" /> },
    { id: 'investments', label: 'Holdings', icon: <ArrowTrendingUpIcon className="w-5 h-5" /> },
    { id: 'investment-transactions', label: 'Investment Trades', icon: <ChartBarIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bank Connections</h1>
              <p className="mt-1 text-sm text-gray-600">
                Connect and manage your financial accounts
              </p>
            </div>
            <PlaidLinkButton onSuccess={handleLinkSuccess} />
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'accounts' && <ConnectedAccounts key={`accounts-${refreshKey}`} />}
        {activeTab === 'transactions' && <TransactionsList key={`transactions-${refreshKey}`} />}
        {activeTab === 'investments' && <InvestmentHoldings key={`investments-${refreshKey}`} />}
        {activeTab === 'investment-transactions' && <InvestmentTransactionsList key={`investment-transactions-${refreshKey}`} />}
      </div>
    </div>
  );
}
