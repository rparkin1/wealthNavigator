/**
 * Collar Strategy Builder Component
 * Interactive builder for collar strategy (buy put + sell call)
 */

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '../../services/hedgingStrategiesApi';

export interface CollarStrategyBuilderProps {
  portfolioValue: number;
  equityAllocation?: number;
  volatility?: number;
}

export const CollarStrategyBuilder: React.FC<CollarStrategyBuilderProps> = ({
  portfolioValue,
  equityAllocation = 0.70,
  volatility = 0.18,
}) => {
  const [putStrike, setPutStrike] = useState(0.90);
  const [callStrike, setCallStrike] = useState(1.10);
  const [timeHorizonMonths, setTimeHorizonMonths] = useState(3);
  const [results, setResults] = useState({
    equityValue: 0,
    putCost: 0,
    callPremium: 0,
    netCost: 0,
    protectionLevel: 0,
    maxUpside: 0,
    maxDownside: 0,
    breakeven: 0,
    effectiveCost: 0,
  });

  useEffect(() => {
    calculateResults();
  }, [portfolioValue, equityAllocation, volatility, putStrike, callStrike, timeHorizonMonths]);

  const calculateResults = () => {
    const equityValue = portfolioValue * equityAllocation;
    const timeHorizonYears = timeHorizonMonths / 12;

    // Estimate put cost (downside protection)
    const putOtmPercent = 1 - putStrike;
    const putAtmCost = 0.4 * volatility * Math.sqrt(timeHorizonYears);
    const putOtmDiscount = 1 - (putOtmPercent * 2);
    const putCostPct = putAtmCost * putOtmDiscount;
    const putCost = equityValue * putCostPct;

    // Estimate call premium (income from selling calls)
    const callOtmPercent = callStrike - 1;
    const callAtmValue = 0.4 * volatility * Math.sqrt(timeHorizonYears);
    const callOtmDiscount = 1 - (callOtmPercent * 2);
    const callPremiumPct = callAtmValue * callOtmDiscount * 0.7; // Calls worth less than puts
    const callPremium = equityValue * callPremiumPct;

    const netCost = Math.max(0, putCost - callPremium);
    const protectionLevel = putStrike;
    const maxUpside = equityValue * (callStrike - 1);
    const maxDownside = equityValue * (1 - putStrike) + netCost;
    const breakeven = portfolioValue - netCost;
    const effectiveCost = netCost / portfolioValue;

    setResults({
      equityValue,
      putCost,
      callPremium,
      netCost,
      protectionLevel,
      maxUpside,
      maxDownside,
      breakeven,
      effectiveCost,
    });
  };

  const isZeroCost = results.netCost < results.equityValue * 0.001; // Less than 0.1%

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600 }}>
          🎯 Collar Strategy Builder
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>
          Build a collar strategy by buying protective puts and selling covered calls.
          The call premium offsets the put cost, often resulting in zero or low net cost.
        </p>

        {/* Input Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Put Strike: {formatPercentage(putStrike)}
            </label>
            <input
              type="range"
              min="0.80"
              max="0.95"
              step="0.01"
              value={putStrike}
              onChange={(e) => setPutStrike(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Downside protection level
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Call Strike: {formatPercentage(callStrike)}
            </label>
            <input
              type="range"
              min="1.05"
              max="1.20"
              step="0.01"
              value={callStrike}
              onChange={(e) => setCallStrike(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Upside cap level
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Time Horizon: {timeHorizonMonths} months
            </label>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={timeHorizonMonths}
              onChange={(e) => setTimeHorizonMonths(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Options expiration period
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div
          style={{
            padding: '16px',
            backgroundColor: isZeroCost ? '#ecfdf5' : '#fef3c7',
            borderRadius: '6px',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#111827' }}>
            Cost Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <CostItem label="Put Cost" value={formatCurrency(results.putCost)} type="expense" />
            <CostItem label="Call Premium" value={formatCurrency(results.callPremium)} type="income" />
            <CostItem
              label="Net Cost"
              value={formatCurrency(results.netCost)}
              type={isZeroCost ? 'zero' : 'expense'}
            />
          </div>
          {isZeroCost && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#059669', fontWeight: 500 }}>
              ✅ Near-zero cost collar! Call premium covers most/all of the put cost.
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <ResultCard
            label="Protection Level"
            value={formatPercentage(results.protectionLevel)}
            subtext="Downside protected"
            color="#22c55e"
          />
          <ResultCard
            label="Max Upside"
            value={formatCurrency(results.maxUpside)}
            subtext={`Capped at ${formatPercentage(callStrike)}`}
            color="#3b82f6"
          />
          <ResultCard
            label="Max Downside"
            value={formatCurrency(results.maxDownside)}
            subtext="Maximum loss"
            color="#ef4444"
          />
        </div>

        {/* Visual Collar Diagram */}
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>
            Collar Payoff Diagram
          </div>
          <div style={{ position: 'relative', height: '120px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            {/* Put Protection Zone */}
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                width: `${putStrike * 100}%`,
                height: '50%',
                backgroundColor: '#22c55e',
                opacity: 0.3,
              }}
            />
            {/* Profit Zone (between put and call) */}
            <div
              style={{
                position: 'absolute',
                left: `${putStrike * 100}%`,
                top: '0',
                width: `${(callStrike - putStrike) * 100}%`,
                height: '100%',
                background: 'linear-gradient(to top, #22c55e33, #3b82f633)',
              }}
            />
            {/* Call Cap Zone */}
            <div
              style={{
                position: 'absolute',
                right: `${(1 - callStrike) * 100}%`,
                top: '0',
                width: `${(1 - callStrike) * 100}%`,
                height: '50%',
                backgroundColor: '#f97316',
                opacity: 0.3,
              }}
            />
            {/* Put Strike Line */}
            <div
              style={{
                position: 'absolute',
                left: `${putStrike * 100}%`,
                top: '0',
                width: '2px',
                height: '100%',
                backgroundColor: '#22c55e',
              }}
            />
            {/* Current Price Line */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '0',
                width: '2px',
                height: '100%',
                backgroundColor: '#111827',
              }}
            />
            {/* Call Strike Line */}
            <div
              style={{
                position: 'absolute',
                right: `${(1 - callStrike) * 100}%`,
                top: '0',
                width: '2px',
                height: '100%',
                backgroundColor: '#f97316',
              }}
            />
            {/* Labels */}
            <div
              style={{
                position: 'absolute',
                left: '5px',
                bottom: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#065f46',
              }}
            >
              Protected
            </div>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#111827',
              }}
            >
              Current
            </div>
            <div
              style={{
                position: 'absolute',
                right: '5px',
                top: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#c2410c',
              }}
            >
              Capped
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            <span>Put: {formatPercentage(putStrike)}</span>
            <span>Current: 100%</span>
            <span>Call: {formatPercentage(callStrike)}</span>
          </div>
        </div>

        {/* Strategy Summary */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#1e40af',
          }}
        >
          💡 <strong>Summary:</strong> Your collar provides {formatPercentage(1 - putStrike)} downside protection
          while capping upside at {formatPercentage(callStrike - 1)}.
          {isZeroCost
            ? ' The near-zero cost makes this an excellent long-term hedge.'
            : ` Net cost is ${formatCurrency(results.netCost)} (${formatPercentage(results.effectiveCost)}).`
          }
        </div>
      </div>
    </div>
  );
};

const ResultCard: React.FC<{ label: string; value: string; subtext: string; color: string }> = ({
  label,
  value,
  subtext,
  color,
}) => (
  <div
    style={{
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    }}
  >
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{subtext}</div>
  </div>
);

const CostItem: React.FC<{ label: string; value: string; type: 'expense' | 'income' | 'zero' }> = ({
  label,
  value,
  type,
}) => {
  const colors = {
    expense: '#ef4444',
    income: '#22c55e',
    zero: '#059669',
  };
  const prefix = type === 'income' ? '+ ' : type === 'expense' ? '- ' : '';

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: colors[type] }}>
        {prefix}{value}
      </div>
    </div>
  );
};

export default CollarStrategyBuilder;
