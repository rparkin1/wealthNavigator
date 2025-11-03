/**
 * Hedging Strategies Component
 * Interactive UI for exploring and selecting hedging strategies
 */

import React, { useState, useEffect } from 'react';
import { useRiskManagement } from '../../hooks/useRiskManagement';
import {
  formatCurrency,
  formatPercentage,
  getStrategyIcon,
  buildExampleHedgingRequest,
  HedgingStrategy,
} from '../../services/riskManagementApi';

export interface HedgingStrategiesProps {
  portfolioValue: number;
  allocation: Record<string, number>;
  riskMetrics?: Record<string, any>;
  onStrategySelected?: (strategy: HedgingStrategy) => void;
}

export const HedgingStrategies: React.FC<HedgingStrategiesProps> = ({
  portfolioValue,
  allocation,
  riskMetrics,
  onStrategySelected,
}) => {
  const {
    hedgingResult,
    loadingHedging,
    hedgingError,
    fetchHedgingStrategies,
  } = useRiskManagement();

  const [selectedStrategy, setSelectedStrategy] = useState<HedgingStrategy | null>(null);
  const [sortBy, setSortBy] = useState<'suitability' | 'cost' | 'protection'>('suitability');

  // Load hedging strategies
  useEffect(() => {
    if (portfolioValue && Object.keys(allocation).length > 0 && riskMetrics) {
      fetchHedgingStrategies({
        portfolio_value: portfolioValue,
        allocation,
        risk_metrics: riskMetrics,
      });
    }
  }, [portfolioValue, allocation, riskMetrics, fetchHedgingStrategies]);

  const handleStrategyClick = (strategy: HedgingStrategy) => {
    setSelectedStrategy(strategy);
    if (onStrategySelected) {
      onStrategySelected(strategy);
    }
  };

  const handleRunExample = () => {
    const exampleRequest = buildExampleHedgingRequest();
    fetchHedgingStrategies(exampleRequest);
  };

  const sortedStrategies = hedgingResult
    ? [...hedgingResult.recommended_strategies].sort((a, b) => {
        if (sortBy === 'suitability') {
          return b.suitability_score - a.suitability_score;
        } else if (sortBy === 'cost') {
          return a.cost_pct - b.cost_pct;
        } else {
          return b.protection_level - a.protection_level;
        }
      })
    : [];

  return (
    <div className="hedging-strategies" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
              Hedging Strategies
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Protect your portfolio with institutional-grade hedging strategies
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
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {loadingHedging && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            Analyzing hedging strategies...
          </div>
        )}

        {hedgingError && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            Error: {hedgingError}
          </div>
        )}

        {hedgingResult && !loadingHedging && (
          <div>
            {/* Summary Section */}
            <div
              style={{
                padding: '24px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '2px solid #3b82f6',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#1e40af' }}>
                🎯 Optimal Strategy: {hedgingResult.optimal_strategy.name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <SummaryMetric
                  label="Cost"
                  value={formatCurrency(hedgingResult.optimal_strategy.cost_estimate)}
                  subtitle={formatPercentage(hedgingResult.optimal_strategy.cost_pct)}
                />
                <SummaryMetric
                  label="Protection Level"
                  value={formatPercentage(hedgingResult.optimal_strategy.protection_level)}
                  subtitle="of portfolio value"
                />
                <SummaryMetric
                  label="Suitability Score"
                  value={`${hedgingResult.optimal_strategy.suitability_score}/100`}
                  subtitle="based on your risk profile"
                />
                <SummaryMetric
                  label="Total Est. Cost"
                  value={formatCurrency(hedgingResult.total_cost_estimate)}
                  subtitle="all recommended strategies"
                />
              </div>
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                <strong>Implementation Priority:</strong> {hedgingResult.implementation_priority}
              </div>
              {hedgingResult.market_conditions_note && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#92400e',
                  }}
                >
                  <strong>Market Conditions:</strong> {hedgingResult.market_conditions_note}
                </div>
              )}
            </div>

            {/* Sort Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                All Strategies ({sortedStrategies.length})
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSortBy('suitability')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: sortBy === 'suitability' ? '#3b82f6' : '#f3f4f6',
                    color: sortBy === 'suitability' ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  By Suitability
                </button>
                <button
                  onClick={() => setSortBy('cost')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: sortBy === 'cost' ? '#3b82f6' : '#f3f4f6',
                    color: sortBy === 'cost' ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  By Cost
                </button>
                <button
                  onClick={() => setSortBy('protection')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: sortBy === 'protection' ? '#3b82f6' : '#f3f4f6',
                    color: sortBy === 'protection' ? '#ffffff' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  By Protection
                </button>
              </div>
            </div>

            {/* Strategies Grid */}
            <div style={{ display: 'grid', gap: '16px' }}>
              {sortedStrategies.map((strategy, idx) => (
                <StrategyCard
                  key={idx}
                  strategy={strategy}
                  isSelected={selectedStrategy?.strategy_type === strategy.strategy_type}
                  isOptimal={strategy.strategy_type === hedgingResult.optimal_strategy.strategy_type}
                  onClick={() => handleStrategyClick(strategy)}
                />
              ))}
            </div>

            {/* Strategy Details Panel */}
            {selectedStrategy && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  width: '500px',
                  height: '100vh',
                  backgroundColor: '#ffffff',
                  boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.1)',
                  overflowY: 'auto',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                        {getStrategyIcon(selectedStrategy.strategy_type)}
                      </div>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                        {selectedStrategy.name}
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelectedStrategy(null)}
                      style={{
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '20px',
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Key Metrics */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <DetailMetric
                        label="Cost Estimate"
                        value={formatCurrency(selectedStrategy.cost_estimate)}
                      />
                      <DetailMetric
                        label="Cost %"
                        value={formatPercentage(selectedStrategy.cost_pct)}
                      />
                      <DetailMetric
                        label="Protection Level"
                        value={formatPercentage(selectedStrategy.protection_level)}
                      />
                      <DetailMetric
                        label="Suitability"
                        value={`${selectedStrategy.suitability_score}/100`}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
                      Description
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                      {selectedStrategy.description}
                    </p>
                  </div>

                  {/* When to Use */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
                      When to Use
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                      {selectedStrategy.when_to_use}
                    </p>
                  </div>

                  {/* Pros */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#059669' }}>
                      ✅ Advantages
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#047857' }}>
                      {selectedStrategy.pros.map((pro, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#dc2626' }}>
                      ⚠️ Disadvantages
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#b91c1c' }}>
                      {selectedStrategy.cons.map((con, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Implementation Steps */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600 }}>
                      Implementation Steps
                    </h3>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
                      {selectedStrategy.implementation_steps.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      if (onStrategySelected) {
                        onStrategySelected(selectedStrategy);
                      }
                      setSelectedStrategy(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Select This Strategy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components

interface SummaryMetricProps {
  label: string;
  value: string;
  subtitle: string;
}

const SummaryMetric: React.FC<SummaryMetricProps> = ({ label, value, subtitle }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '20px', fontWeight: 600, color: '#1e40af', marginBottom: '2px' }}>{value}</div>
    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{subtitle}</div>
  </div>
);

interface StrategyCardProps {
  strategy: HedgingStrategy;
  isSelected: boolean;
  isOptimal: boolean;
  onClick: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, isSelected, isOptimal, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '20px',
      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
      borderRadius: '8px',
      border: isOptimal ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative',
    }}
  >
    {isOptimal && (
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 12px',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        OPTIMAL
      </div>
    )}

    <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
      <div style={{ fontSize: '48px' }}>{getStrategyIcon(strategy.strategy_type)}</div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
          {strategy.name}
        </h4>
        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
          {strategy.description}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <StrategyMetric
            label="Cost"
            value={formatPercentage(strategy.cost_pct)}
          />
          <StrategyMetric
            label="Protection"
            value={formatPercentage(strategy.protection_level)}
          />
          <StrategyMetric
            label="Suitability"
            value={`${strategy.suitability_score}/100`}
          />
        </div>
      </div>
    </div>
  </div>
);

interface StrategyMetricProps {
  label: string;
  value: string;
}

const StrategyMetric: React.FC<StrategyMetricProps> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{value}</div>
  </div>
);

interface DetailMetricProps {
  label: string;
  value: string;
}

const DetailMetric: React.FC<DetailMetricProps> = ({ label, value }) => (
  <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{value}</div>
  </div>
);

export default HedgingStrategies;
