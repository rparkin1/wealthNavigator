/**
 * Portfolio View
 *
 * Main portfolio view with tabbed navigation to different analyses
 */

import React, { useState } from 'react';
import {
  ChartBarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { TaxLossHarvestingPanel } from './TaxLossHarvestingPanel';
import { RebalancingDashboard } from './RebalancingDashboard';
import { PerformanceDashboard } from './PerformanceDashboard';
import { ComprehensiveAnalysis } from './ComprehensiveAnalysis';
import { NetWorthDashboard } from './NetWorthDashboard';

interface PortfolioViewProps {
  userId: string;
  portfolioId?: string;
}

type TabView = 'overview' | 'net-worth' | 'tax-loss' | 'rebalancing' | 'performance';

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  userId,
  portfolioId,
}) => {
  const [activeTab, setActiveTab] = useState<TabView>('overview');

  const tabs = [
    { id: 'overview' as TabView, label: 'Overview', icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: 'net-worth' as TabView, label: 'Net Worth', icon: <BanknotesIcon className="w-5 h-5" /> },
    { id: 'tax-loss' as TabView, label: 'Tax-Loss Harvesting', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
    { id: 'rebalancing' as TabView, label: 'Rebalancing', icon: <ScaleIcon className="w-5 h-5" /> },
    { id: 'performance' as TabView, label: 'Performance', icon: <ArrowTrendingUpIcon className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ComprehensiveAnalysis userId={userId} portfolioId={portfolioId} />;
      case 'net-worth':
        return <NetWorthDashboard userId={userId} />;
      case 'tax-loss':
        return <TaxLossHarvestingPanel userId={userId} portfolioId={portfolioId} />;
      case 'rebalancing':
        return <RebalancingDashboard userId={userId} portfolioId={portfolioId} />;
      case 'performance':
        return <PerformanceDashboard userId={userId} portfolioId={portfolioId} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default PortfolioView;
