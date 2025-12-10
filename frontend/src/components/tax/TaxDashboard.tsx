/**
 * Tax Management Dashboard Component
 * Main dashboard for all tax optimization features
 */

import React, { useState } from 'react';
import { TLHReporting } from './TLHReporting';
import { TaxExport } from './TaxExport';
import { MunicipalBondOptimizer } from './MunicipalBondOptimizer';
import { useTaxManagement } from '@/hooks/useTaxManagement';
import { formatCurrency } from '@/services/taxManagementApi';

// ==================== Types ====================

interface TaxDashboardProps {
  portfolioValue?: number;
  holdings?: any[];
  transactions?: any[];
  state?: string;
  federalTaxRate?: number;
  annualIncome?: number;
}

type TabType = 'overview' | 'tlh' | 'export' | 'muni';

// ==================== Component ====================

export const TaxDashboard: React.FC<TaxDashboardProps> = ({
  portfolioValue = 0,
  holdings = [],
  transactions = [],
  state = 'CA',
  federalTaxRate = 0.24,
  annualIncome = 150000,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const { taxAlpha, loadingAlpha, calculateTaxAlphaAction } = useTaxManagement();

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'tlh' as TabType, label: 'Tax-Loss Harvesting', icon: '📉' },
    { id: 'export' as TabType, label: 'Tax Export', icon: '📄' },
    { id: 'muni' as TabType, label: 'Municipal Bonds', icon: '🏛️' },
  ];

  // Calculate tax alpha on mount
  React.useEffect(() => {
    if (portfolioValue > 0) {
      calculateTaxAlphaAction({
        portfolio_value: portfolioValue,
        asset_location_benefit: 2500,
        tlh_benefit: 1800,
        withdrawal_benefit: 1200,
        muni_benefit: 900,
      });
    }
  }, [portfolioValue]);

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Management</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive tax optimization and reporting tools
          </p>
        </div>
        {portfolioValue > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Portfolio Value</div>
            <div className="text-2xl font-bold">{formatCurrency(portfolioValue)}</div>
          </div>
        )}
      </div>

      {/* Tax Alpha Summary */}
      {taxAlpha && !loadingAlpha && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Total Tax Alpha</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <div className="text-sm text-gray-600">Annual Savings</div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(taxAlpha.annual_tax_savings)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tax Alpha %</div>
              <div className="text-2xl font-bold text-blue-700">
                {taxAlpha.tax_alpha_percentage.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">30-Year Cumulative</div>
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(taxAlpha.cumulative_30_year)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Strategies</div>
              <div className="text-2xl font-bold text-indigo-700">
                {taxAlpha.strategies_active}/4
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">TLH Benefit</div>
              <div className="text-xl font-bold">
                {formatCurrency(taxAlpha.tlh_benefit)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Asset Location */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Asset Location</h3>
                <p className="text-gray-600 mb-4">
                  Optimize placement of assets across taxable and tax-advantaged accounts
                </p>
                {taxAlpha && (
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Annual Benefit</div>
                    <div className="text-xl font-bold text-blue-700">
                      {formatCurrency(taxAlpha.asset_location_benefit)}
                    </div>
                  </div>
                )}
              </div>

              {/* Tax-Loss Harvesting */}
              <div
                className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedTab('tlh')}
              >
                <h3 className="text-lg font-semibold mb-3">Tax-Loss Harvesting</h3>
                <p className="text-gray-600 mb-4">
                  Harvest losses to offset gains and reduce tax liability
                </p>
                {taxAlpha && (
                  <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Annual Benefit</div>
                    <div className="text-xl font-bold text-green-700">
                      {formatCurrency(taxAlpha.tlh_benefit)}
                    </div>
                  </div>
                )}
                <div className="mt-3 text-sm text-blue-600 font-medium">
                  View TLH Reports →
                </div>
              </div>

              {/* Withdrawal Strategies */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Withdrawal Strategies</h3>
                <p className="text-gray-600 mb-4">
                  Optimize withdrawal sequencing to minimize lifetime taxes
                </p>
                {taxAlpha && (
                  <div className="bg-purple-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Annual Benefit</div>
                    <div className="text-xl font-bold text-purple-700">
                      {formatCurrency(taxAlpha.withdrawal_benefit)}
                    </div>
                  </div>
                )}
              </div>

              {/* Municipal Bonds */}
              <div
                className="bg-white border rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedTab('muni')}
              >
                <h3 className="text-lg font-semibold mb-3">Municipal Bonds</h3>
                <p className="text-gray-600 mb-4">
                  State-specific analysis for tax-free bond allocation
                </p>
                {taxAlpha && (
                  <div className="bg-indigo-50 p-4 rounded">
                    <div className="text-sm text-gray-600">Annual Benefit</div>
                    <div className="text-xl font-bold text-indigo-700">
                      {formatCurrency(taxAlpha.muni_benefit)}
                    </div>
                  </div>
                )}
                <div className="mt-3 text-sm text-blue-600 font-medium">
                  Optimize Allocation →
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedTab('tlh')}
                  className="p-4 border rounded hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium">Generate TLH Report</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Analyze harvesting opportunities
                  </div>
                </button>
                <button
                  onClick={() => setSelectedTab('export')}
                  className="p-4 border rounded hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium">Export for Tax Software</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Prepare data for TurboTax, TaxACT, etc.
                  </div>
                </button>
                <button
                  onClick={() => setSelectedTab('muni')}
                  className="p-4 border rounded hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium">Optimize Muni Bonds</div>
                  <div className="text-sm text-gray-600 mt-1">
                    State-specific recommendations
                  </div>
                </button>
              </div>
            </div>

            {/* Tax Efficiency Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Tax Efficiency Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>
                  Hold tax-inefficient assets (bonds, REITs) in tax-deferred accounts
                </li>
                <li>
                  Monitor for tax-loss harvesting opportunities regularly
                </li>
                <li>
                  Consider municipal bonds if in a high tax bracket
                </li>
                <li>
                  Plan withdrawals to stay below tax bracket thresholds
                </li>
                <li>
                  Review asset location annually during rebalancing
                </li>
              </ul>
            </div>
          </div>
        )}

        {selectedTab === 'tlh' && (
          <TLHReporting
            holdings={holdings}
            opportunities={[]}
            executedHarvests={[]}
            taxYear={new Date().getFullYear()}
          />
        )}

        {selectedTab === 'export' && (
          <TaxExport
            transactions={transactions}
            taxYear={new Date().getFullYear()}
          />
        )}

        {selectedTab === 'muni' && (
          <MunicipalBondOptimizer
            state={state}
            federalTaxRate={federalTaxRate}
            annualIncome={annualIncome}
          />
        )}
      </div>
    </div>
  );
};
