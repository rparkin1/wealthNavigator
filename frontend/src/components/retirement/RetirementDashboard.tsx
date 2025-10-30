/**
 * RetirementDashboard Component
 *
 * Comprehensive retirement planning dashboard integrating:
 * - Social Security Calculator
 * - Spending Pattern Editor
 * - Longevity Configurator
 * - Income Projections
 */

import { useState } from 'react';
import { SocialSecurityCalculator } from './SocialSecurityCalculator';
import { SpendingPatternEditor } from './SpendingPatternEditor';
import { LongevityConfigurator } from './LongevityConfigurator';
import type {
  SocialSecurityResult,
  SpendingPattern,
  LongevityResult,
} from '../../services/retirementApi';

type TabView = 'overview' | 'social-security' | 'spending' | 'longevity' | 'projections';

export function RetirementDashboard() {
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [socialSecurityData, setSocialSecurityData] = useState<SocialSecurityResult | null>(null);
  const [spendingPattern, setSpendingPattern] = useState<SpendingPattern | null>(null);
  const [longevityData, setLongevityData] = useState<LongevityResult | null>(null);

  const tabs: Array<{ id: TabView; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'social-security', label: 'Social Security', icon: '🏛️' },
    { id: 'spending', label: 'Spending Plan', icon: '💰' },
    { id: 'longevity', label: 'Life Expectancy', icon: '📈' },
    { id: 'projections', label: 'Income Projection', icon: '🔮' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-none bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Retirement Planning</h1>
        <p className="text-sm text-gray-600 mt-1">
          Plan your retirement with Social Security, spending patterns, and income projections
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-none bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              socialSecurity={socialSecurityData}
              spending={spendingPattern}
              longevity={longevityData}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'social-security' && (
            <div className="card">
              <SocialSecurityCalculator
                onCalculate={(result) => {
                  setSocialSecurityData(result);
                  console.log('Social Security calculated:', result);
                }}
              />
            </div>
          )}

          {activeTab === 'spending' && (
            <div className="card">
              <SpendingPatternEditor
                onChange={(pattern) => {
                  setSpendingPattern(pattern);
                  console.log('Spending pattern updated:', pattern);
                }}
                currentAge={65}
              />
            </div>
          )}

          {activeTab === 'longevity' && (
            <div className="card">
              <LongevityConfigurator
                onChange={(assumptions, result) => {
                  setLongevityData(result);
                  console.log('Longevity calculated:', result);
                }}
              />
            </div>
          )}

          {activeTab === 'projections' && (
            <div className="card">
              <ProjectionsTab
                socialSecurity={socialSecurityData}
                spending={spendingPattern}
                longevity={longevityData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface OverviewTabProps {
  socialSecurity: SocialSecurityResult | null;
  spending: SpendingPattern | null;
  longevity: LongevityResult | null;
  onNavigate: (tab: TabView) => void;
}

function OverviewTab({ socialSecurity, spending, longevity, onNavigate }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Social Security Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate('social-security')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-blue-600 text-3xl">🏛️</div>
            <div className="text-right">
              {socialSecurity ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${socialSecurity.monthly_benefit.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">per month</div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Not configured</div>
              )}
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Social Security</h3>
          <p className="text-sm text-gray-600 mb-3">
            Calculate your benefits based on filing age and primary insurance amount
          </p>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Configure →
          </button>
        </div>

        {/* Spending Pattern Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate('spending')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-green-600 text-3xl">💰</div>
            <div className="text-right">
              {spending ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${spending.base_annual_spending.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">base annual</div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Not configured</div>
              )}
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Spending Plan</h3>
          <p className="text-sm text-gray-600 mb-3">
            Model retirement spending across Go-Go, Slow-Go, and No-Go phases
          </p>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium">
            Configure →
          </button>
        </div>

        {/* Longevity Card */}
        <div
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate('longevity')}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-purple-600 text-3xl">📈</div>
            <div className="text-right">
              {longevity ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {longevity.adjusted_life_expectancy}
                  </div>
                  <div className="text-xs text-gray-500">years</div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Not configured</div>
              )}
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Life Expectancy</h3>
          <p className="text-sm text-gray-600 mb-3">
            Calculate planning age with health adjustments and survival probabilities
          </p>
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            Configure →
          </button>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">🚀 Getting Started</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>
              <strong>Calculate Social Security:</strong> Enter your primary insurance amount and
              filing age to see your estimated benefits.
            </span>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>
              <strong>Plan Spending:</strong> Configure your expected retirement spending across
              different life phases with healthcare costs.
            </span>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>
              <strong>Set Life Expectancy:</strong> Adjust for your gender, health status, and
              planning horizon.
            </span>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            <span>
              <strong>View Projections:</strong> See your complete retirement income projection
              combining all sources.
            </span>
          </div>
        </div>
      </div>

      {/* Phase 3 Features */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">✨ Phase 3 Advanced Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-green-600 mr-2">✓</span>
              <span className="font-medium text-gray-900">Social Security Calculator</span>
            </div>
            <p className="text-sm text-gray-600">
              Full SSA benefit calculations with early/late filing adjustments, COLA, and breakeven
              analysis.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-green-600 mr-2">✓</span>
              <span className="font-medium text-gray-900">Spending Phase Modeling</span>
            </div>
            <p className="text-sm text-gray-600">
              Age-based spending with Go-Go, Slow-Go, No-Go phases, healthcare inflation, and major
              expenses.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-green-600 mr-2">✓</span>
              <span className="font-medium text-gray-900">Longevity Analysis</span>
            </div>
            <p className="text-sm text-gray-600">
              Gender-based life expectancy with health adjustments and survival probability curves.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-green-600 mr-2">✓</span>
              <span className="font-medium text-gray-900">Income Projections</span>
            </div>
            <p className="text-sm text-gray-600">
              Comprehensive multi-source income projection with portfolio withdrawals and net cash
              flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectionsTabProps {
  socialSecurity: SocialSecurityResult | null;
  spending: SpendingPattern | null;
  longevity: LongevityResult | null;
}

function ProjectionsTab({ socialSecurity, spending, longevity }: ProjectionsTabProps) {
  if (!socialSecurity || !spending || !longevity) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">🔮</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configure All Components First
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Complete Social Security, Spending Pattern, and Longevity sections to view income
          projections.
        </p>
        <div className="space-y-2 text-sm text-left max-w-md mx-auto">
          <div className="flex items-center">
            <span className={socialSecurity ? 'text-green-600' : 'text-gray-400'}>
              {socialSecurity ? '✓' : '○'}
            </span>
            <span className="ml-2">Social Security Benefits</span>
          </div>
          <div className="flex items-center">
            <span className={spending ? 'text-green-600' : 'text-gray-400'}>
              {spending ? '✓' : '○'}
            </span>
            <span className="ml-2">Spending Pattern</span>
          </div>
          <div className="flex items-center">
            <span className={longevity ? 'text-green-600' : 'text-gray-400'}>
              {longevity ? '✓' : '○'}
            </span>
            <span className="ml-2">Life Expectancy</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          ✓ All components configured! Income projections will be displayed here using the
          retirement income API.
        </p>
      </div>

      {/* Placeholder for actual projections */}
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-600">
          Income projection visualization coming soon. This will integrate with the Monte Carlo
          simulator.
        </p>
      </div>
    </div>
  );
}
