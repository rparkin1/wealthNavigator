/**
 * Reserve Growth Simulator Component
 * Visual simulation of reserve fund growth over time
 *
 * REQ-RISK-012: Reserve growth visualization
 */

import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { simulateReserveGrowth } from '../../services/reserveMonitoringApi';
import type { ReserveGrowthSimulation } from '../../types/reserveMonitoring';

export interface ReserveGrowthSimulatorProps {
  currentReserves: number;
  monthlyContribution: number;
  targetAmount: number;
  monthsToSimulate?: number;
  autoSimulate?: boolean;
  onSimulationComplete?: (simulation: ReserveGrowthSimulation) => void;
}

export const ReserveGrowthSimulator: React.FC<ReserveGrowthSimulatorProps> = ({
  currentReserves,
  monthlyContribution,
  targetAmount,
  monthsToSimulate = 36,
  autoSimulate = true,
  onSimulationComplete,
}) => {
  const [simulation, setSimulation] = useState<ReserveGrowthSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  useEffect(() => {
    if (autoSimulate) {
      runSimulation();
    }
  }, [currentReserves, monthlyContribution, targetAmount, monthsToSimulate]);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await simulateReserveGrowth({
        current_reserves: currentReserves,
        monthly_contribution: monthlyContribution,
        target_amount: targetAmount,
        months_to_simulate: monthsToSimulate,
      });

      setSimulation(result);
      onSimulationComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate growth');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <ChartBarIcon style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
        </div>
        Running simulation...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          borderRadius: '8px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Error: {error}
        <button
          onClick={runSimulation}
          style={{
            marginLeft: '12px',
            padding: '4px 12px',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <button
          onClick={runSimulation}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Run Simulation
        </button>
      </div>
    );
  }

  const maxBalance = Math.max(simulation.target_amount, simulation.final_balance);
  const chartHeight = 240;
  const chartWidth = 800;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Sample points for chart (show every nth month for clarity)
  const samplingRate = Math.max(1, Math.floor(simulation.projection.length / 50));
  const sampledProjection = simulation.projection.filter((_, i) => i % samplingRate === 0 || i === simulation.projection.length - 1);

  const hoveredData = hoveredMonth !== null ? simulation.projection.find(p => p.month === hoveredMonth) : null;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Starting Balance</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
            {formatCurrency(simulation.initial_balance)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>Projected Balance</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
            {formatCurrency(simulation.final_balance)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            after {simulation.months_simulated} months
          </div>
        </div>
        <div
          style={{
            padding: '16px',
            backgroundColor: simulation.target_reached_month ? '#ecfdf5' : '#fef3c7',
            borderRadius: '8px',
            border: `1px solid ${simulation.target_reached_month ? '#10b981' : '#f59e0b'}`,
          }}
        >
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Target</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: simulation.target_reached_month ? '#059669' : '#d97706' }}>
            {formatCurrency(simulation.target_amount)}
          </div>
          {simulation.target_reached_month ? (
            <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
              ✓ Reached in month {simulation.target_reached_month}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>
              Not reached in timeframe
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
          Growth Projection
        </div>

        <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const value = maxBalance * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor="end"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {/* Target line */}
          <line
            x1={padding.left}
            y1={padding.top + innerHeight * (1 - simulation.target_amount / maxBalance)}
            x2={chartWidth - padding.right}
            y2={padding.top + innerHeight * (1 - simulation.target_amount / maxBalance)}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x={chartWidth - padding.right + 5}
            y={padding.top + innerHeight * (1 - simulation.target_amount / maxBalance) + 4}
            fontSize="12"
            fill="#10b981"
            fontWeight="600"
          >
            Target
          </text>

          {/* Growth line */}
          <polyline
            points={sampledProjection
              .map((point) => {
                const x = padding.left + (point.month / simulation.months_simulated) * innerWidth;
                const y = padding.top + innerHeight * (1 - point.balance / maxBalance);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Fill area under curve */}
          <polygon
            points={`
              ${padding.left},${padding.top + innerHeight}
              ${sampledProjection
                .map((point) => {
                  const x = padding.left + (point.month / simulation.months_simulated) * innerWidth;
                  const y = padding.top + innerHeight * (1 - point.balance / maxBalance);
                  return `${x},${y}`;
                })
                .join(' ')}
              ${padding.left + innerWidth},${padding.top + innerHeight}
            `}
            fill="url(#gradient)"
            opacity="0.2"
          />

          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Interactive points */}
          {sampledProjection.map((point) => {
            const x = padding.left + (point.month / simulation.months_simulated) * innerWidth;
            const y = padding.top + innerHeight * (1 - point.balance / maxBalance);
            const isHovered = hoveredMonth === point.month;

            return (
              <circle
                key={point.month}
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? '#3b82f6' : '#ffffff'}
                stroke="#3b82f6"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredMonth(point.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              />
            );
          })}

          {/* X-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = padding.left + innerWidth * ratio;
            const month = Math.round(simulation.months_simulated * ratio);
            return (
              <text
                key={ratio}
                x={x}
                y={chartHeight - padding.bottom + 20}
                fontSize="12"
                fill="#6b7280"
                textAnchor="middle"
              >
                Month {month}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredData && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
            }}
          >
            <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: 600 }}>
              Month {hoveredData.month}
            </div>
            <div style={{ fontSize: '20px', color: '#3b82f6', fontWeight: 700, marginTop: '4px' }}>
              {formatCurrency(hoveredData.balance)}
            </div>
          </div>
        )}
      </div>

      {/* Contribution Summary */}
      <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#6b7280' }}>Monthly Contribution:</span>
            <span style={{ fontWeight: 600, color: '#111827', marginLeft: '8px' }}>
              {formatCurrency(simulation.monthly_contribution)}
            </span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Total Contributions:</span>
            <span style={{ fontWeight: 600, color: '#111827', marginLeft: '8px' }}>
              {formatCurrency(simulation.monthly_contribution * simulation.months_simulated)}
            </span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Net Growth:</span>
            <span style={{ fontWeight: 600, color: '#10b981', marginLeft: '8px' }}>
              {formatCurrency(simulation.final_balance - simulation.initial_balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReserveGrowthSimulator;
