/**
 * Risk Dashboard Component
 * Comprehensive risk management dashboard with risk assessment, stress testing, and hedging
 */

import React, { useState, useEffect } from 'react';
import { useRiskManagement } from '../../hooks/useRiskManagement';
import {
  formatCurrency,
  formatPercentage,
  getRiskLevelColor,
  getSeverityColor,
  buildExampleRiskRequest,
  buildExampleStressRequest,
} from '../../services/riskManagementApi';
import { DiversificationDashboard } from './DiversificationDashboard';
import { DiversificationAnalysisDashboard } from './DiversificationAnalysisDashboard';
import { HedgingStrategyDashboard } from '../hedging/HedgingStrategyDashboard';

export interface RiskDashboardProps {
  portfolioValue: number;
  allocation: Record<string, number>;
  expectedReturn?: number;
  volatility?: number;
  onHedgingSelected?: (strategyType: string) => void;
}

export const RiskDashboard: React.FC<RiskDashboardProps> = ({
  portfolioValue,
  allocation,
  expectedReturn = 0.08,
  volatility = 0.15,
  onHedgingSelected,
}) => {
  const {
    riskResult,
    loadingRisk,
    riskError,
    assessPortfolioRisk,
    stressResult,
    loadingStress,
    stressError,
    performStressTest,
    scenarios,
    loadStressScenarios,
  } = useRiskManagement();

  const [selectedTab, setSelectedTab] = useState<'risk' | 'stress' | 'scenarios' | 'diversification' | 'hedging'>('risk');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    '2008_financial_crisis',
    '2020_covid_crash',
    'recession',
  ]);

  // Load scenarios on mount
  useEffect(() => {
    loadStressScenarios();
  }, [loadStressScenarios]);

  // Run initial risk assessment
  useEffect(() => {
    if (portfolioValue && Object.keys(allocation).length > 0) {
      assessPortfolioRisk({
        portfolio_value: portfolioValue,
        allocation,
        expected_return: expectedReturn,
        volatility,
      });
    }
  }, [portfolioValue, allocation, expectedReturn, volatility, assessPortfolioRisk]);

  const handleStressTest = () => {
    performStressTest({
      portfolio_value: portfolioValue,
      allocation,
      scenarios: selectedScenarios,
    });
  };

  const handleScenarioToggle = (scenarioKey: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioKey)
        ? prev.filter((s) => s !== scenarioKey)
        : [...prev, scenarioKey]
    );
  };

  const handleRunExample = () => {
    const exampleRequest = buildExampleRiskRequest();
    assessPortfolioRisk(exampleRequest);

    const exampleStressRequest = buildExampleStressRequest();
    performStressTest(exampleStressRequest);
  };

  return (
    <div className="risk-dashboard" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#111827' }}>
              Risk Management Dashboard
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Comprehensive risk assessment, stress testing, and hedging strategies
            </p>
          </div>
          <button
            onClick={handleRunExample}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Run Example Analysis
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {(['risk', 'stress', 'scenarios', 'diversification', 'hedging'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedTab === tab ? '#3b82f6' : '#f3f4f6',
                color: selectedTab === tab ? '#ffffff' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {tab === 'risk' && '📊 Risk Assessment'}
              {tab === 'stress' && '⚡ Stress Testing'}
              {tab === 'scenarios' && '🎯 Scenarios'}
              {tab === 'diversification' && '🌐 Diversification'}
              {tab === 'hedging' && '🛡️ Hedging'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {/* Risk Assessment Tab */}
        {selectedTab === 'risk' && (
          <div>
            {loadingRisk && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                Analyzing portfolio risk...
              </div>
            )}

            {riskError && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                Error: {riskError}
              </div>
            )}

            {riskResult && !loadingRisk && (
              <div>
                {/* Risk Level Header */}
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        Portfolio Risk Level
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: 700,
                          color: getRiskLevelColor(riskResult.metrics.risk_level),
                          textTransform: 'capitalize',
                        }}
                      >
                        {riskResult.metrics.risk_level.replace('_', ' ')}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '48px',
                        fontWeight: 700,
                        color: getRiskLevelColor(riskResult.metrics.risk_level),
                      }}
                    >
                      {riskResult.metrics.risk_score.toFixed(0)}
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '14px', color: '#374151' }}>
                    Risk score: 0 (conservative) to 100 (very aggressive)
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                  }}
                >
                  {/* VaR 95% 1-Day */}
                  <MetricCard
                    title="Value at Risk (95%, 1-day)"
                    value={formatCurrency(riskResult.metrics.var_95_1day)}
                    subtitle="Expected daily loss threshold"
                    color="#ef4444"
                  />

                  {/* VaR 99% 1-Month */}
                  <MetricCard
                    title="Value at Risk (99%, 1-month)"
                    value={formatCurrency(riskResult.metrics.var_99_1month)}
                    subtitle="Expected monthly loss threshold"
                    color="#dc2626"
                  />

                  {/* Sharpe Ratio */}
                  <MetricCard
                    title="Sharpe Ratio"
                    value={riskResult.metrics.sharpe_ratio.toFixed(3)}
                    subtitle="Risk-adjusted return"
                    color={riskResult.metrics.sharpe_ratio > 1 ? '#22c55e' : '#eab308'}
                  />

                  {/* Max Drawdown */}
                  <MetricCard
                    title="Maximum Drawdown"
                    value={formatPercentage(riskResult.metrics.max_drawdown)}
                    subtitle="Peak-to-trough decline"
                    color="#f97316"
                  />

                  {/* Beta */}
                  <MetricCard
                    title="Beta"
                    value={riskResult.metrics.beta.toFixed(2)}
                    subtitle="Market sensitivity"
                    color="#6366f1"
                  />

                  {/* Sortino Ratio */}
                  <MetricCard
                    title="Sortino Ratio"
                    value={riskResult.metrics.sortino_ratio.toFixed(3)}
                    subtitle="Downside risk-adjusted"
                    color={riskResult.metrics.sortino_ratio > 1 ? '#22c55e' : '#eab308'}
                  />
                </div>

                {/* Advanced Metrics */}
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginBottom: '24px',
                  }}
                >
                  <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
                    Advanced Risk Metrics
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <AdvancedMetric
                      label="CVaR (95%)"
                      value={formatCurrency(riskResult.metrics.cvar_95)}
                    />
                    <AdvancedMetric
                      label="Alpha"
                      value={formatPercentage(riskResult.metrics.alpha / 100)}
                    />
                    <AdvancedMetric
                      label="Tracking Error"
                      value={formatPercentage(riskResult.metrics.tracking_error)}
                    />
                    <AdvancedMetric
                      label="Skewness"
                      value={riskResult.metrics.skewness.toFixed(2)}
                    />
                    <AdvancedMetric
                      label="Kurtosis"
                      value={riskResult.metrics.kurtosis.toFixed(2)}
                    />
                    <AdvancedMetric
                      label="Concentration"
                      value={riskResult.metrics.concentration_score.toFixed(0)}
                    />
                  </div>
                </div>

                {/* Recommendations */}
                {riskResult.recommendations.length > 0 && (
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: '#ecfdf5',
                      borderRadius: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#065f46' }}>
                      ✅ Recommendations
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#047857' }}>
                      {riskResult.recommendations.map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {riskResult.warnings.length > 0 && (
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                    }}
                  >
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#92400e' }}>
                      ⚠️ Warnings
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#b45309' }}>
                      {riskResult.warnings.map((warning, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stress Testing Tab */}
        {selectedTab === 'stress' && (
          <div>
            <div
              style={{
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
                Run Stress Test
              </h3>
              <button
                onClick={handleStressTest}
                disabled={loadingStress}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: loadingStress ? 'not-allowed' : 'pointer',
                  opacity: loadingStress ? 0.6 : 1,
                }}
              >
                {loadingStress ? 'Running Stress Tests...' : 'Run Stress Test'}
              </button>
            </div>

            {stressError && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                Error: {stressError}
              </div>
            )}

            {stressResult && !loadingStress && (
              <div>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <MetricCard
                    title="Scenarios Tested"
                    value={stressResult.scenarios_tested.toString()}
                    subtitle="Historical & hypothetical"
                    color="#6366f1"
                  />
                  <MetricCard
                    title="Worst Case Impact"
                    value={formatCurrency(stressResult.worst_case_scenario.value_change)}
                    subtitle={formatPercentage(stressResult.worst_case_scenario.pct_change)}
                    color="#ef4444"
                  />
                  <MetricCard
                    title="Average Impact"
                    value={formatCurrency(stressResult.average_impact)}
                    subtitle="Across all scenarios"
                    color="#f97316"
                  />
                </div>

                {/* Worst Case Scenario */}
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    marginBottom: '24px',
                  }}
                >
                  <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#991b1b' }}>
                    🚨 Worst Case: {stressResult.worst_case_scenario.scenario_name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Portfolio Value
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: '#dc2626' }}>
                        {formatCurrency(stressResult.worst_case_scenario.stressed_value)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Loss Amount
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: '#dc2626' }}>
                        {formatCurrency(stressResult.worst_case_scenario.value_change)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Severity
                      </div>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 600,
                          color: getSeverityColor(stressResult.worst_case_scenario.severity),
                          textTransform: 'capitalize',
                        }}
                      >
                        {stressResult.worst_case_scenario.severity}
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Results Table */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#374151',
                          }}
                        >
                          Scenario
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#374151',
                          }}
                        >
                          Impact
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#374151',
                          }}
                        >
                          % Change
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#374151',
                          }}
                        >
                          Severity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stressResult.results.map((result, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderTop: '1px solid #e5e7eb',
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                            {result.scenario_name}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: result.value_change < 0 ? '#dc2626' : '#059669',
                            }}
                          >
                            {formatCurrency(result.value_change)}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: result.pct_change < 0 ? '#dc2626' : '#059669',
                            }}
                          >
                            {formatPercentage(result.pct_change)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                backgroundColor: getSeverityColor(result.severity) + '20',
                                color: getSeverityColor(result.severity),
                                textTransform: 'capitalize',
                              }}
                            >
                              {result.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scenarios Tab */}
        {selectedTab === 'scenarios' && (
          <div>
            {scenarios && (
              <div>
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginBottom: '24px',
                  }}
                >
                  <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
                    Available Stress Test Scenarios ({scenarios.total})
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {scenarios.scenarios.map((scenario) => (
                      <div
                        key={scenario.key}
                        style={{
                          padding: '16px',
                          backgroundColor: selectedScenarios.includes(scenario.key) ? '#eff6ff' : '#f9fafb',
                          borderRadius: '8px',
                          border: selectedScenarios.includes(scenario.key)
                            ? '2px solid #3b82f6'
                            : '1px solid #e5e7eb',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleScenarioToggle(scenario.key)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                              {scenario.name}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                              {scenario.description}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                              <span
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '4px',
                                  color: '#374151',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {scenario.type}
                              </span>
                              <span style={{ color: '#6b7280' }}>
                                Probability: {(scenario.probability * 100).toFixed(1)}%/year
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedScenarios.includes(scenario.key)}
                            onChange={() => handleScenarioToggle(scenario.key)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diversification Tab (REQ-RISK-008, 009, 010) */}
        {selectedTab === 'diversification' && (
          <div style={{ padding: '24px' }}>
            <DiversificationAnalysisDashboard
              portfolioValue={portfolioValue}
              holdings={Object.entries(allocation).map(([assetClass, weight]) => ({
                symbol: assetClass,
                name: assetClass.replace(/_/g, ' '),
                value: portfolioValue * weight,
                weight: weight,
                asset_class: assetClass,
                sector: undefined,
                industry: undefined,
                geography: undefined,
                manager: undefined,
              }))}
              onAnalysisComplete={(analysis) => {
                console.log('Diversification analysis complete:', analysis);
              }}
            />
          </div>
        )}

        {/* Hedging Tab (REQ-RISK-004, 005, 006, 007) */}
        {selectedTab === 'hedging' && riskResult && (
          <HedgingStrategyDashboard
            portfolioValue={portfolioValue}
            allocation={allocation}
            riskMetrics={{
              annual_volatility: volatility,
              beta: riskResult.metrics.beta,
              max_drawdown: riskResult.metrics.max_drawdown,
              risk_level: riskResult.metrics.risk_level,
            }}
          />
        )}
      </div>
    </div>
  );
};

// Helper Components

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, color }) => (
  <div
    style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}
  >
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{subtitle}</div>
  </div>
);

interface AdvancedMetricProps {
  label: string;
  value: string;
}

const AdvancedMetric: React.FC<AdvancedMetricProps> = ({ label, value }) => (
  <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{value}</div>
  </div>
);

export default RiskDashboard;
