/**
 * Emergency Fund Gauge Component
 * Visual gauge showing reserve adequacy with color-coded status
 *
 * REQ-RISK-012: Reserve adequacy visualization
 */

import React, { useEffect, useState } from 'react';
import type { ReserveStatus } from '../../types/reserveMonitoring';

export interface EmergencyFundGaugeProps {
  currentReserves: number;
  monthlyExpenses: number;
  minimumTarget: number;
  recommendedTarget: number;
  optimalTarget: number;
  status: ReserveStatus;
  animated?: boolean;
}

export const EmergencyFundGauge: React.FC<EmergencyFundGaugeProps> = ({
  currentReserves,
  monthlyExpenses,
  minimumTarget,
  recommendedTarget,
  optimalTarget,
  status,
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : currentReserves);

  const monthsCoverage = monthlyExpenses > 0 ? currentReserves / monthlyExpenses : 0;
  const percentage = Math.min(100, (currentReserves / optimalTarget) * 100);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(currentReserves);
      return;
    }

    let start = 0;
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuad = progress * (2 - progress); // Easing function

      const current = start + (currentReserves - start) * easeOutQuad;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [currentReserves, animated]);

  const getStatusColor = (statusValue: ReserveStatus): string => {
    const colors = {
      critical: '#ef4444',
      low: '#f97316',
      adequate: '#eab308',
      strong: '#22c55e',
      excellent: '#059669',
    };
    return colors[statusValue];
  };

  const getStatusGradient = (statusValue: ReserveStatus): string => {
    const gradients = {
      critical: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      low: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      adequate: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
      strong: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      excellent: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    };
    return gradients[statusValue];
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statusColor = getStatusColor(status);
  const statusGradient = getStatusGradient(status);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Circular Gauge */}
      <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto' }}>
        {/* Background Circle */}
        <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
          {/* Gray background */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="24"
          />

          {/* Colored progress */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={statusColor}
            strokeWidth="24"
            strokeDasharray={`${(percentage / 100) * 754} 754`}
            strokeLinecap="round"
            style={{
              transition: animated ? 'stroke-dasharray 1.5s ease-out' : 'none',
            }}
          />

          {/* Markers for targets */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray={`${(minimumTarget / optimalTarget) * 754} 754`}
            opacity="0.5"
          />
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray={`${(recommendedTarget / optimalTarget) * 754} 754`}
            opacity="0.7"
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              background: statusGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '4px',
            }}
          >
            {monthsCoverage.toFixed(1)}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
            months coverage
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginTop: '8px' }}>
            {formatCurrency(displayValue)}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            background: statusGradient,
            borderRadius: '9999px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#ffffff',
            textTransform: 'capitalize',
          }}
        >
          {status}
        </div>
      </div>

      {/* Target Markers Legend */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-around', fontSize: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '2px', backgroundColor: '#94a3b8', margin: '0 auto 4px' }} />
          <div style={{ color: '#6b7280' }}>Minimum</div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(minimumTarget)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '2px', backgroundColor: '#64748b', margin: '0 auto 4px' }} />
          <div style={{ color: '#6b7280' }}>Recommended</div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(recommendedTarget)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '2px', backgroundColor: '#475569', margin: '0 auto 4px' }} />
          <div style={{ color: '#6b7280' }}>Optimal</div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(optimalTarget)}</div>
        </div>
      </div>

      {/* Percentage Display */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {percentage.toFixed(1)}% of optimal target
        </div>
        <div
          style={{
            marginTop: '8px',
            height: '8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: statusGradient,
              transition: animated ? 'width 1.5s ease-out' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EmergencyFundGauge;
