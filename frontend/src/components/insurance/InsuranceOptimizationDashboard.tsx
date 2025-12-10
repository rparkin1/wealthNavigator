/**
 * Insurance Optimization Dashboard
 *
 * Main dashboard for comprehensive insurance analysis including:
 * - Life insurance needs
 * - Disability coverage
 * - Long-term care planning
 * - Gap analysis
 */

import React, { useState } from 'react';
import LifeInsuranceCalculator from './LifeInsuranceCalculator';
import DisabilityCoverageAnalyzer from './DisabilityCoverageAnalyzer';
import LongTermCarePlanner from './LongTermCarePlanner';
import InsuranceGapAnalysis from './InsuranceGapAnalysis';
import type {
  LifeInsuranceAnalysis,
  DisabilityCoverageAnalysis,
  LongTermCareAnalysis,
  InsuranceGapAnalysis as IGapAnalysis,
} from '../../types/insurance';

interface InsuranceOptimizationDashboardProps {
  userId?: string;
}

type TabType = 'life' | 'disability' | 'ltc' | 'gaps';

const InsuranceOptimizationDashboard: React.FC<InsuranceOptimizationDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('life');
  const [lifeAnalysis, setLifeAnalysis] = useState<LifeInsuranceAnalysis | null>(null);
  const [disabilityAnalysis, setDisabilityAnalysis] = useState<DisabilityCoverageAnalysis | null>(null);
  const [ltcAnalysis, setLtcAnalysis] = useState<LongTermCareAnalysis | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<IGapAnalysis | null>(null);

  const tabs = [
    { id: 'life' as TabType, label: '💰 Life Insurance', icon: '🛡️' },
    { id: 'disability' as TabType, label: '🏥 Disability Coverage', icon: '⚕️' },
    { id: 'ltc' as TabType, label: '🏠 Long-Term Care', icon: '🏥' },
    { id: 'gaps' as TabType, label: '📊 Gap Analysis', icon: '🔍' },
  ];

  const handleLifeAnalysisComplete = (analysis: LifeInsuranceAnalysis) => {
    setLifeAnalysis(analysis);
    // Automatically update gap analysis if we have all three
    if (disabilityAnalysis && ltcAnalysis) {
      updateGapAnalysis(analysis, disabilityAnalysis, ltcAnalysis);
    }
  };

  const handleDisabilityAnalysisComplete = (analysis: DisabilityCoverageAnalysis) => {
    setDisabilityAnalysis(analysis);
    if (lifeAnalysis && ltcAnalysis) {
      updateGapAnalysis(lifeAnalysis, analysis, ltcAnalysis);
    }
  };

  const handleLtcAnalysisComplete = (analysis: LongTermCareAnalysis) => {
    setLtcAnalysis(analysis);
    if (lifeAnalysis && disabilityAnalysis) {
      updateGapAnalysis(lifeAnalysis, disabilityAnalysis, analysis);
    }
  };

  const updateGapAnalysis = async (
    life: LifeInsuranceAnalysis,
    disability: DisabilityCoverageAnalysis,
    ltc: LongTermCareAnalysis
  ) => {
    try {
      const { insuranceOptimizationApi } = await import('../../services/insuranceOptimizationApi');
      const gaps = await insuranceOptimizationApi.analyzeInsuranceGaps({
        life_insurance_analysis: life,
        disability_analysis: disability,
        ltc_analysis: ltc,
      });
      setGapAnalysis(gaps);
    } catch (error) {
      console.error('Failed to analyze insurance gaps:', error);
    }
  };

  const getCompletionStatus = () => {
    const completed = [
      lifeAnalysis !== null,
      disabilityAnalysis !== null,
      ltcAnalysis !== null,
    ].filter(Boolean).length;
    return { completed, total: 3 };
  };

  const status = getCompletionStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🛡️ Insurance Optimization
              </h1>
              <p className="text-gray-600">
                Comprehensive analysis of your life, disability, and long-term care insurance needs
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Completion Status</div>
              <div className="text-2xl font-bold text-blue-600">
                {status.completed}/{status.total}
              </div>
              <div className="text-xs text-gray-500">Analyses Complete</div>
            </div>
          </div>

          {/* Overall Risk Alert */}
          {gapAnalysis && gapAnalysis.overall_risk_level !== 'none' && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                gapAnalysis.overall_risk_level === 'high'
                  ? 'bg-red-50 border border-red-200'
                  : gapAnalysis.overall_risk_level === 'medium'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {gapAnalysis.overall_risk_level === 'high' ? '🚨' : '⚠️'}
                </span>
                <div>
                  <div className="font-semibold text-gray-900">
                    {gapAnalysis.critical_gaps} Critical Gap{gapAnalysis.critical_gaps !== 1 ? 's' : ''} Identified
                  </div>
                  <div className="text-sm text-gray-600">
                    Annual cost to close all gaps: ${gapAnalysis.total_annual_cost_to_close_gaps.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'life' && (
            <LifeInsuranceCalculator
              onAnalysisComplete={handleLifeAnalysisComplete}
              existingAnalysis={lifeAnalysis}
            />
          )}

          {activeTab === 'disability' && (
            <DisabilityCoverageAnalyzer
              onAnalysisComplete={handleDisabilityAnalysisComplete}
              existingAnalysis={disabilityAnalysis}
            />
          )}

          {activeTab === 'ltc' && (
            <LongTermCarePlanner
              onAnalysisComplete={handleLtcAnalysisComplete}
              existingAnalysis={ltcAnalysis}
            />
          )}

          {activeTab === 'gaps' && (
            <InsuranceGapAnalysis
              lifeAnalysis={lifeAnalysis}
              disabilityAnalysis={disabilityAnalysis}
              ltcAnalysis={ltcAnalysis}
              gapAnalysis={gapAnalysis}
            />
          )}
        </div>

        {/* Educational Footer */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 Insurance Planning Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <div className="font-medium mb-1">Life Insurance</div>
              <div className="text-blue-700">
                Most families need 10-15x annual income in coverage. Term life is most cost-effective.
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Disability Insurance</div>
              <div className="text-blue-700">
                Aim for 60-70% income replacement. Employer coverage is often insufficient.
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Long-Term Care</div>
              <div className="text-blue-700">
                Purchase in your 50s for best rates. Hybrid policies offer flexibility.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceOptimizationDashboard;
