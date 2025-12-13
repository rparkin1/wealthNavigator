/**
 * Estate Planning Dashboard Component
 *
 * Main dashboard for estate planning features with tabbed interface:
 * - Estate Tax Projection
 * - Trust Structures
 * - Beneficiary Optimization
 * - Legacy Goal Planning
 * - Gifting Strategies
 */

import React, { useState } from 'react';
import {
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  UsersIcon,
  FlagIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import EstateTaxProjection from './EstateTaxProjection';
import TrustStructureBuilder from './TrustStructureBuilder';
import BeneficiaryManager from './BeneficiaryManager';
import LegacyGoalPlanner from './LegacyGoalPlanner';
import GiftingStrategyAnalyzer from './GiftingStrategyAnalyzer';

type TabType = 'tax' | 'trusts' | 'beneficiaries' | 'legacy' | 'gifting';

const EstatePlanningDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tax');

  const tabs = [
    { id: 'tax' as TabType, label: 'Estate Tax', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
    { id: 'trusts' as TabType, label: 'Trust Structures', icon: <BuildingLibraryIcon className="w-5 h-5" /> },
    { id: 'beneficiaries' as TabType, label: 'Beneficiaries', icon: <UsersIcon className="w-5 h-5" /> },
    { id: 'legacy' as TabType, label: 'Legacy Goals', icon: <FlagIcon className="w-5 h-5" /> },
    { id: 'gifting' as TabType, label: 'Gifting Strategy', icon: <GiftIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="estate-planning-dashboard">
      <div className="dashboard-header">
        <h1>Estate Planning</h1>
        <p className="subtitle">
          Plan your legacy, minimize taxes, and ensure your wishes are carried out
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'tax' && <EstateTaxProjection />}
        {activeTab === 'trusts' && <TrustStructureBuilder />}
        {activeTab === 'beneficiaries' && <BeneficiaryManager />}
        {activeTab === 'legacy' && <LegacyGoalPlanner />}
        {activeTab === 'gifting' && <GiftingStrategyAnalyzer />}
      </div>

      <style>{`
        .estate-planning-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #666;
          font-size: 1rem;
        }

        .tab-navigation {
          display: flex;
          gap: 0.5rem;
          border-bottom: 2px solid #e0e0e0;
          margin-bottom: 2rem;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 1rem;
          color: #666;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #333;
          background: #f5f5f5;
        }

        .tab-button.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
          font-weight: 600;
        }


        .tab-content {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .estate-planning-dashboard {
            padding: 1rem;
          }

          .tab-navigation {
            flex-wrap: wrap;
          }

          .tab-button {
            flex: 1 1 calc(50% - 0.25rem);
            min-width: 140px;
          }

          .tab-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EstatePlanningDashboard;
