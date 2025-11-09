/**
 * Scenario Creation Wizard
 *
 * Step-by-step wizard for creating goal scenarios with guided parameter selection.
 * Implements REQ-GOAL-010: Interactive scenario creation with validation and recommendations.
 */

import React, { useState } from 'react';
import { createScenario, quickCompareScenarios } from '../../services/goalScenariosApi';
import type { ScenarioCreationRequest, QuickCompareResponse } from '../../types/goalScenarios';

interface ScenarioCreationWizardProps {
  goalId: string;
  goalTitle: string;
  currentMonthlyContribution: number;
  currentTargetAmount: number;
  currentTargetDate: string;
  onScenarioCreated: (scenarioId: string) => void;
  onCancel: () => void;
}

type WizardStep = 'method' | 'basic' | 'risk' | 'review' | 'success';

export const ScenarioCreationWizard: React.FC<ScenarioCreationWizardProps> = ({
  goalId,
  goalTitle,
  currentMonthlyContribution,
  currentTargetAmount,
  currentTargetDate,
  onScenarioCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('method');
  const [creationMethod, setCreationMethod] = useState<'manual' | 'quick' | null>(null);
  const [scenarioData, setScenarioData] = useState<Partial<ScenarioCreationRequest>>({
    monthly_contribution: currentMonthlyContribution,
    target_amount: currentTargetAmount,
    target_date: currentTargetDate,
    risk_level: 'moderate',
    expected_return: 0.07,
  });
  const [quickCompareData, setQuickCompareData] = useState<QuickCompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdScenarioId, setCreatedScenarioId] = useState<string | null>(null);
  const scenarioNameId = 'scenario-name-input';
  const scenarioDescriptionId = 'scenario-description-input';
  const monthlyContributionId = 'scenario-monthly-contribution';

  const handleMethodSelection = async (method: 'manual' | 'quick') => {
    setCreationMethod(method);

    if (method === 'quick') {
      setLoading(true);
      setError(null);
      try {
        const response = await quickCompareScenarios(goalId);
        setQuickCompareData(response);
        setCurrentStep('risk');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quick scenarios');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep('basic');
    }
  };

  const handleBasicInfoNext = () => {
    if (!scenarioData.name || !scenarioData.monthly_contribution) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setCurrentStep('risk');
  };

  const handleRiskSelection = (riskLevel: 'conservative' | 'moderate' | 'aggressive') => {
    const returnRates = {
      conservative: 0.05,
      moderate: 0.07,
      aggressive: 0.09,
    };

    if (creationMethod === 'quick' && quickCompareData) {
      const selectedScenario = quickCompareData.scenarios.find(s => s.risk_level === riskLevel);
      if (selectedScenario) {
        setScenarioData({
          ...scenarioData,
          name: selectedScenario.name,
          description: selectedScenario.description,
          monthly_contribution: selectedScenario.monthly_contribution,
          expected_return: selectedScenario.expected_return,
          risk_level: riskLevel,
        });
      }
    } else {
      setScenarioData({
        ...scenarioData,
        risk_level: riskLevel,
        expected_return: returnRates[riskLevel],
      });
    }

    setCurrentStep('review');
  };

  const handleCreateScenario = async () => {
    if (!scenarioData.name) {
      setError('Scenario name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createScenario(goalId, scenarioData as ScenarioCreationRequest);
      setCreatedScenarioId(response.id);
      setCurrentStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (createdScenarioId) {
      onScenarioCreated(createdScenarioId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Scenario Builder</h2>
              <p className="text-sm text-blue-100 mt-1">Goal: {goalTitle}</p>
            </div>
            <button
              onClick={onCancel}
              aria-label="Close wizard"
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {['method', 'basic', 'risk', 'review'].map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      currentStep === step
                        ? 'bg-blue-600 text-white'
                        : ['method', 'basic', 'risk', 'review'].indexOf(currentStep) > index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 capitalize">{step}</span>
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ['method', 'basic', 'risk', 'review'].indexOf(currentStep) > index
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Method Selection */}
          {currentStep === 'method' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Creation Method</h3>
                <p className="text-sm text-gray-600">
                  How would you like to create your scenario?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleMethodSelection('quick')}
                  disabled={loading}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">⚡</span>
                    <div>
                      <h4 tabIndex={-1} className="font-semibold text-gray-900 group-hover:text-blue-600">
                        Quick Setup
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Choose from 3 preset scenarios (Conservative, Moderate, Aggressive)
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Recommended for beginners</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleMethodSelection('manual')}
                  disabled={loading}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🎛️</span>
                    <div>
                      <h4 tabIndex={-1} className="font-semibold text-gray-900 group-hover:text-blue-600">
                        Custom Setup
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Manually configure all scenario parameters
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Full control and flexibility</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Information (Manual Only) */}
          {currentStep === 'basic' && creationMethod === 'manual' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
                <p className="text-sm text-gray-600">
                  Provide basic details for your scenario
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor={scenarioNameId} className="block text-sm font-medium text-gray-700 mb-2">
                    Scenario Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={scenarioNameId}
                    type="text"
                    value={scenarioData.name || ''}
                    onChange={e => setScenarioData({ ...scenarioData, name: e.target.value })}
                    placeholder="e.g., Aggressive Growth"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor={scenarioDescriptionId} className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id={scenarioDescriptionId}
                    value={scenarioData.description || ''}
                    onChange={e => setScenarioData({ ...scenarioData, description: e.target.value })}
                    placeholder="Brief description of this scenario..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor={monthlyContributionId} className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Contribution <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={monthlyContributionId}
                    type="number"
                    inputMode="decimal"
                    value={scenarioData.monthly_contribution ?? ''}
                    onChange={e => {
                      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      setScenarioData({ ...scenarioData, monthly_contribution: value });
                    }}
                    placeholder="1000"
                    min="0"
                    step="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {formatCurrency(currentMonthlyContribution)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep('method')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleBasicInfoNext}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Risk Level Selection */}
          {currentStep === 'risk' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Risk Level</h3>
                <p className="text-sm text-gray-600">
                  Choose your risk tolerance and expected returns
                </p>
              </div>

              <div className="space-y-4">
                {(['conservative', 'moderate', 'aggressive'] as const).map(risk => {
                  const riskData = {
                    conservative: {
                      color: 'blue',
                      icon: '🛡️',
                      return: '5.0%',
                      description: 'Lower risk, steady growth',
                      allocation: '40% stocks, 60% bonds',
                    },
                    moderate: {
                      color: 'yellow',
                      icon: '⚖️',
                      return: '7.0%',
                      description: 'Balanced risk and return',
                      allocation: '60% stocks, 40% bonds',
                    },
                    aggressive: {
                      color: 'red',
                      icon: '🚀',
                      return: '9.0%',
                      description: 'Higher risk, higher potential return',
                      allocation: '80% stocks, 20% bonds',
                    },
                  }[risk];
                  const riskLabel = risk.charAt(0).toUpperCase() + risk.slice(1);

                  return (
                    <button
                      key={risk}
                      onClick={() => handleRiskSelection(risk)}
                      className={`w-full p-6 border-2 rounded-lg hover:shadow-lg transition-all text-left group ${
                        scenarioData.risk_level === risk
                          ? `border-${riskData.color}-500 bg-${riskData.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-4xl">{riskData.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{riskLabel}</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${riskData.color}-100 text-${riskData.color}-800`}>
                              {riskData.return} Expected Return
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{riskData.description}</p>
                          <p className="text-xs text-gray-500">{riskData.allocation}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep(creationMethod === 'quick' ? 'method' : 'basic')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Scenario</h3>
                <p className="text-sm text-gray-600">
                  Review your scenario before creating
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="font-semibold text-gray-900">{scenarioData.name}</span>
                </div>

                {scenarioData.description && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Description</span>
                    <span className="text-sm text-gray-900 text-right max-w-xs">
                      {scenarioData.description}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Contribution</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(scenarioData.monthly_contribution || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <span className="font-semibold text-gray-900">
                    {scenarioData.risk_level
                      ? scenarioData.risk_level.charAt(0).toUpperCase() + scenarioData.risk_level.slice(1)
                      : '—'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expected Return</span>
                  <span className="font-semibold text-gray-900">
                    {formatPercentage(scenarioData.expected_return || 0)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep('risk')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateScenario}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Scenario'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Scenario Created!</h3>
                <p className="text-gray-600">
                  Your scenario "{scenarioData.name}" has been created successfully.
                </p>
              </div>

              <button
                onClick={handleFinish}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Scenario
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioCreationWizard;
