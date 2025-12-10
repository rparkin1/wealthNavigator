/**
 * Protective Put Calculator Component
 * Interactive calculator for protective put strategy
 */

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '../../services/hedgingStrategiesApi';

export interface ProtectivePutCalculatorProps {
  portfolioValue: number;
  equityAllocation?: number;
  volatility?: number;
}

export const ProtectivePutCalculator: React.FC<ProtectivePutCalculatorProps> = ({
  portfolioValue,
  equityAllocation = 0.70,
  volatility = 0.18,
}) => {
  const [strikePercentage, setStrikePercentage] = useState(0.90);
  const [timeHorizonMonths, setTimeHorizonMonths] = useState(3);
  const [results, setResults] = useState({
    equityValue: 0,
    putCost: 0,
    protectionLevel: 0,
    maxLoss: 0,
    breakeven: 0,
    annualizedCost: 0,
  });

  useEffect(() => {
    calculateResults();
  }, [portfolioValue, equityAllocation, volatility, strikePercentage, timeHorizonMonths]);

  const calculateResults = () => {
    const equityValue = portfolioValue * equityAllocation;
    const timeHorizonYears = timeHorizonMonths / 12;

    // Simplified Black-Scholes approximation for put cost
    const otmPercent = 1 - strikePercentage;
    const atmCost = 0.4 * volatility * Math.sqrt(timeHorizonYears);
    const otmDiscount = 1 - (otmPercent * 2);
    const putCostPct = atmCost * otmDiscount;
    const putCost = equityValue * putCostPct;

    const protectionLevel = strikePercentage;
    const maxLoss = equityValue * (1 - strikePercentage) + putCost;
    const breakeven = portfolioValue - putCost;
    const annualizedCost = putCostPct * (12 / timeHorizonMonths);

    setResults({
      equityValue,
      putCost,
      protectionLevel,
      maxLoss,
      breakeven,
      annualizedCost,
    });
  };

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
          🛡️ Protective Put Calculator
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>
          Calculate the cost and protection level for protective put options on your portfolio.
        </p>

        {/* Input Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Strike Price: {formatPercentage(strikePercentage)}
            </label>
            <input
              type="range"
              min="0.80"
              max="0.95"
              step="0.01"
              value={strikePercentage}
              onChange={(e) => setStrikePercentage(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Protection kicks in at {formatPercentage(1 - strikePercentage)} decline
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
              Put option expiration period
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <ResultCard
            label="Equity Value"
            value={formatCurrency(results.equityValue)}
            subtext={formatPercentage(equityAllocation) + ' of portfolio'}
            color="#3b82f6"
          />
          <ResultCard
            label="Put Cost"
            value={formatCurrency(results.putCost)}
            subtext={formatPercentage(results.putCost / results.equityValue) + ' of equity'}
            color="#ef4444"
          />
          <ResultCard
            label="Annualized Cost"
            value={formatPercentage(results.annualizedCost)}
            subtext="Per year recurring"
            color="#f97316"
          />
          <ResultCard
            label="Protection Level"
            value={formatPercentage(results.protectionLevel)}
            subtext="Portfolio protected"
            color="#22c55e"
          />
          <ResultCard
            label="Maximum Loss"
            value={formatCurrency(results.maxLoss)}
            subtext="Worst case scenario"
            color="#dc2626"
          />
          <ResultCard
            label="Breakeven Point"
            value={formatCurrency(results.breakeven)}
            subtext="Portfolio value after cost"
            color="#6366f1"
          />
        </div>

        {/* Visual Representation */}
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>
            Protection Diagram
          </div>
          <div style={{ position: 'relative', height: '100px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
            {/* Protected Zone */}
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: formatPercentage(strikePercentage),
                height: '100%',
                backgroundColor: '#22c55e',
                opacity: 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#065f46',
              }}
            >
              Protected Zone
            </div>
            {/* Unprotected Zone */}
            <div
              style={{
                position: 'absolute',
                right: '0',
                top: '0',
                width: formatPercentage(1 - strikePercentage),
                height: '100%',
                backgroundColor: '#ef4444',
                opacity: 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#991b1b',
              }}
            >
              At Risk
            </div>
            {/* Strike Line */}
            <div
              style={{
                position: 'absolute',
                left: formatPercentage(strikePercentage),
                top: '0',
                width: '2px',
                height: '100%',
                backgroundColor: '#111827',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            <span>0% (Total Loss)</span>
            <span>Strike: {formatPercentage(strikePercentage)}</span>
            <span>100% (Full Value)</span>
          </div>
        </div>

        {/* Implementation Note */}
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
          💡 <strong>Tip:</strong> Protective puts should be rolled quarterly to maintain continuous protection.
          Lower strike prices (more protection) cost more, while higher strikes (less protection) are cheaper.
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

export default ProtectivePutCalculator;
