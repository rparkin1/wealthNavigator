/**
 * Hedging Strategy Dashboard Component
 * Comprehensive dashboard for hedging strategy recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  getHedgingRecommendations,
  formatCurrency,
  formatPercentage,
  getStrategyIcon,
  getSuitabilityColor,
  getPriorityColor,
  buildExampleHedgingRequest,
} from '../../services/hedgingStrategiesApi';
import type {
  HedgingRecommendation,
  HedgingRequest,
  HedgingObjectives,
  HedgingStrategy,
} from '../../types/hedgingStrategies';

export interface HedgingStrategyDashboardProps {
  portfolioValue: number;
  allocation: Record<string, number>;
  riskMetrics: Record<string, any>;
  marketConditions?: Record<string, any>;
}

export const HedgingStrategyDashboard: React.FC<HedgingStrategyDashboardProps> = ({
  portfolioValue,
  allocation,
  riskMetrics,
  marketConditions,
}) => {
  const [recommendation, setRecommendation] = useState<HedgingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<HedgingStrategy | null>(null);
  const [objectives, setObjectives] = useState<HedgingObjectives>({
    hedge_percentage: 0.50,
    max_acceptable_drawdown: 0.20,
    cost_tolerance_pct: 0.02,
    time_horizon_months: 12,
  });
  const [showObjectives, setShowObjectives] = useState(false);

  // Load recommendations on mount
  useEffect(() => {
    if (portfolioValue && Object.keys(allocation).length > 0 && riskMetrics) {
      loadRecommendations();
    }
  }, [portfolioValue, allocation, riskMetrics, marketConditions]);

  const loadRecommendations = async (customObjectives?: HedgingObjectives) => {
    try {
      setLoading(true);
      setError(null);

      const request: HedgingRequest = {
        portfolio_value: portfolioValue,
        allocation,
        risk_metrics: riskMetrics,
        market_conditions: marketConditions,
        objectives: customObjectives || objectives,
      };

      const result = await getHedgingRecommendations(request);
      setRecommendation(result);
      setSelectedStrategy(result.optimal_strategy);
    } catch (err: any) {
      setError(err.message || 'Failed to load hedging recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRunExample = async () => {
    try {
      setLoading(true);
      setError(null);

      const exampleRequest = buildExampleHedgingRequest();
      const result = await getHedgingRecommendations(exampleRequest);
      setRecommendation(result);
      setSelectedStrategy(result.optimal_strategy);
    } catch (err: any) {
      setError(err.message || 'Failed to run example');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyObjectives = () => {
    loadRecommendations(objectives);
    setShowObjectives(false);
  };

  return (
    <div className="hedging-strategy-dashboard" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
              Hedging Strategy Recommendations
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Comprehensive hedging strategies to protect your portfolio
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowObjectives(!showObjectives)}
              style={{
                padding: '8px 16px',
                backgroundColor: showObjectives ? '#3b82f6' : '#f3f4f6',
                color: showObjectives ? '#ffffff' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              ⚙️ Objectives
            </button>
            <button
              onClick={handleRunExample}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Run Example Analysis
            </button>
          </div>
        </div>

        {/* Objectives Panel */}
        {showObjectives && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
              Hedging Objectives
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Hedge Percentage: {formatPercentage(objectives.hedge_percentage || 0)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={objectives.hedge_percentage}
                  onChange={(e) => setObjectives({ ...objectives, hedge_percentage: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Max Acceptable Drawdown: {formatPercentage(objectives.max_acceptable_drawdown || 0)}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={objectives.max_acceptable_drawdown}
                  onChange={(e) => setObjectives({ ...objectives, max_acceptable_drawdown: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Cost Tolerance: {formatPercentage(objectives.cost_tolerance_pct || 0)}
                </label>
                <input
                  type="range"
                  min="0.005"
                  max="0.05"
                  step="0.005"
                  value={objectives.cost_tolerance_pct}
                  onChange={(e) => setObjectives({ ...objectives, cost_tolerance_pct: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Time Horizon: {objectives.time_horizon_months} months
                </label>
                <input
                  type="range"
                  min="3"
                  max="24"
                  step="3"
                  value={objectives.time_horizon_months}
                  onChange={(e) => setObjectives({ ...objectives, time_horizon_months: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <button
              onClick={handleApplyObjectives}
              style={{
                marginTop: '12px',
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
              Apply Objectives
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Analyzing hedging strategies...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            Error: {error}
          </div>
        )}

        {recommendation && !loading && (
          <div>
            {/* Summary Header */}
            <div
              style={{
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Portfolio Value
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                    {formatCurrency(recommendation.portfolio_value)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Risk Level
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#ef4444',
                      textTransform: 'capitalize',
                    }}
                  >
                    {recommendation.current_risk_level.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Estimated Cost
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>
                    {formatCurrency(recommendation.total_cost_estimate)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {formatPercentage(recommendation.total_cost_estimate / recommendation.portfolio_value)} of portfolio
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Implementation Priority
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: getPriorityColor(recommendation.implementation_priority),
                    }}
                  >
                    {recommendation.implementation_priority}
                  </div>
                </div>
              </div>

              {/* Market Conditions Note */}
              {recommendation.market_conditions_note && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#92400e',
                  }}
                >
                  📊 {recommendation.market_conditions_note}
                </div>
              )}

              {/* Objectives Met */}
              {recommendation.objectives_met && Object.keys(recommendation.objectives_met).length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(recommendation.objectives_met).map(([key, met]) => (
                    <span
                      data-testid={`objective-status-${key}`}
                      key={key}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: met ? '#d1fae5' : '#fee2e2',
                        color: met ? '#065f46' : '#991b1b',
                      }}
                    >
                      {met ? '✅' : '❌'} {key.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Optimal Strategy Card */}
            {recommendation.optimal_strategy && (
              <div
                style={{
                  padding: '24px',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '32px' }}>
                        {getStrategyIcon(recommendation.optimal_strategy.strategy_type)}
                      </span>
                      <div>
                        <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                          ⭐ OPTIMAL STRATEGY
                        </div>
                        <div
                          data-testid="optimal-strategy-name"
                          style={{ fontSize: '24px', fontWeight: 700, color: '#065f46' }}
                        >
                          {recommendation.optimal_strategy.name}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: '8px 0', fontSize: '14px', color: '#047857' }}>
                      {recommendation.optimal_strategy.description}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Suitability Score
                    </div>
                    <div
                      style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: getSuitabilityColor(recommendation.optimal_strategy.suitability_score),
                      }}
                    >
                      {recommendation.optimal_strategy.suitability_score.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>out of 100</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gap: '16px',
                    marginTop: '16px',
                  }}
                >
                  <QuickStat
                    label="Cost Estimate"
                    value={formatCurrency(recommendation.optimal_strategy.cost_estimate)}
                    color="#ef4444"
                  />
                  <QuickStat
                    label="Protection Level"
                    value={formatPercentage(recommendation.optimal_strategy.protection_level)}
                    color="#22c55e"
                  />
                  <QuickStat
                    label="Time Horizon"
                    value={recommendation.optimal_strategy.time_horizon}
                    color="#3b82f6"
                  />
                  <QuickStat
                    label="Impact on Return"
                    value={formatPercentage(recommendation.optimal_strategy.impact_on_return)}
                    color={recommendation.optimal_strategy.impact_on_return < 0 ? '#ef4444' : '#22c55e'}
                  />
                </div>

                <button
                  onClick={() => setSelectedStrategy(recommendation.optimal_strategy)}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  View Implementation Details
                </button>
              </div>
            )}

            {/* All Strategies Grid */}
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
                All Recommended Strategies ({recommendation.recommended_strategies.length})
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '16px',
                }}
              >
                {recommendation.recommended_strategies.map((strategy, index) => (
                  <StrategyCard
                    key={index}
                    strategy={strategy}
                    isSelected={selectedStrategy?.strategy_type === strategy.strategy_type}
                    onClick={() => setSelectedStrategy(strategy)}
                  />
                ))}
              </div>
            </div>

            {/* Strategy Details Panel */}
            {selectedStrategy && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '48px' }}>
                      {getStrategyIcon(selectedStrategy.strategy_type)}
                    </span>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                        {selectedStrategy.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                        {selectedStrategy.description}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStrategy(null)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Implementation */}
                <Section title="📋 Implementation">
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                    {selectedStrategy.implementation}
                  </p>
                </Section>

                {/* When to Use */}
                <Section title="🎯 When to Use">
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                    {selectedStrategy.when_to_use}
                  </p>
                </Section>

                {/* Implementation Steps */}
                <Section title="✅ Implementation Steps">
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    {selectedStrategy.implementation_steps.map((step, index) => (
                      <li key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </Section>

                {/* Pros and Cons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <Section title="✅ Pros">
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedStrategy.pros.map((pro, index) => (
                        <li key={index} style={{ marginBottom: '4px', fontSize: '14px', color: '#059669' }}>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </Section>
                  <Section title="❌ Cons">
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {selectedStrategy.cons.map((con, index) => (
                        <li key={index} style={{ marginBottom: '4px', fontSize: '14px', color: '#dc2626' }}>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </Section>
                </div>

                {/* Key Metrics */}
                <Section title="📊 Key Metrics">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <MetricBox
                      label="Cost Estimate"
                      value={formatCurrency(selectedStrategy.cost_estimate)}
                      subtext={`${formatPercentage(selectedStrategy.cost_pct)} of portfolio`}
                    />
                    <MetricBox
                      label="Protection Level"
                      value={formatPercentage(selectedStrategy.protection_level)}
                      subtext="Portfolio protected"
                    />
                    <MetricBox
                      label="Max Downside"
                      value={formatCurrency(selectedStrategy.max_downside)}
                      subtext="Maximum potential loss"
                    />
                    <MetricBox
                      label="Breakeven Point"
                      value={formatCurrency(selectedStrategy.breakeven_point)}
                      subtext="Portfolio breakeven value"
                    />
                    <MetricBox
                      label="Impact on Return"
                      value={formatPercentage(selectedStrategy.impact_on_return)}
                      subtext="Annual return impact"
                    />
                    <MetricBox
                      label="Impact on Volatility"
                      value={formatPercentage(selectedStrategy.impact_on_volatility)}
                      subtext="Volatility reduction"
                    />
                  </div>
                </Section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components

interface StrategyCardProps {
  strategy: HedgingStrategy;
  isSelected: boolean;
  onClick: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '20px',
      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
      borderRadius: '8px',
      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => {
      if (!isSelected) {
        e.currentTarget.style.borderColor = '#d1d5db';
      }
    }}
    onMouseLeave={(e) => {
      if (!isSelected) {
        e.currentTarget.style.borderColor = '#e5e7eb';
      }
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>{getStrategyIcon(strategy.strategy_type)}</span>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          {strategy.name}
        </div>
      </div>
      <div
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: getSuitabilityColor(strategy.suitability_score) + '20',
          color: getSuitabilityColor(strategy.suitability_score),
        }}
      >
        {strategy.suitability_score.toFixed(0)}
      </div>
    </div>
    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
      {strategy.description}
    </p>
    <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
      <span
        style={{
          padding: '4px 8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          color: '#374151',
        }}
      >
        Cost: {formatCurrency(strategy.cost_estimate)}
      </span>
      <span
        style={{
          padding: '4px 8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          color: '#374151',
        }}
      >
        Protection: {formatPercentage(strategy.protection_level)}
      </span>
    </div>
  </div>
);

const QuickStat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: 600, color }}>{value}</div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginTop: '16px' }}>
    <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
      {title}
    </h4>
    {children}
  </div>
);

const MetricBox: React.FC<{ label: string; value: string; subtext: string }> = ({ label, value, subtext }) => (
  <div
    style={{
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    }}
  >
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
      {value}
    </div>
    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{subtext}</div>
  </div>
);

export default HedgingStrategyDashboard;
