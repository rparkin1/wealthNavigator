/**
 * Reserve Replenishment Plan Component
 * Interactive tool for planning reserve fund contributions
 *
 * REQ-RISK-012: Reserve replenishment planning
 */

import React, { useState, useEffect } from 'react';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ReserveRecommendation } from '../../types/reserveMonitoring';

export interface ReserveReplenishmentPlanProps {
  currentReserves: number;
  targetReserves: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recommendations: ReserveRecommendation[];
  onPlanChange?: (monthlyContribution: number, timeToGoal: number) => void;
}

export const ReserveReplenishmentPlan: React.FC<ReserveReplenishmentPlanProps> = ({
  currentReserves,
  targetReserves,
  monthlyIncome,
  monthlyExpenses,
  recommendations,
  onPlanChange,
}) => {
  const shortfall = Math.max(0, targetReserves - currentReserves);
  const disposableIncome = monthlyIncome - monthlyExpenses;

  const [monthlyContribution, setMonthlyContribution] = useState<number>(
    recommendations[0]?.monthly_target || Math.min(disposableIncome * 0.15, shortfall / 24)
  );
  const [selectedRecommendation, setSelectedRecommendation] = useState<ReserveRecommendation | null>(
    recommendations[0] || null
  );

  const timeToGoal = monthlyContribution > 0 ? Math.ceil(shortfall / monthlyContribution) : Infinity;
  const percentOfIncome = (monthlyContribution / monthlyIncome) * 100;
  const remainingDisposable = disposableIncome - monthlyContribution;

  useEffect(() => {
    onPlanChange?.(monthlyContribution, timeToGoal);
  }, [monthlyContribution, timeToGoal, onPlanChange]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleRecommendationSelect = (rec: ReserveRecommendation) => {
    setSelectedRecommendation(rec);
    setMonthlyContribution(rec.monthly_target);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMonthlyContribution(value);
    setSelectedRecommendation(null);
  };

  if (shortfall <= 0) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ecfdf5',
          borderRadius: '8px',
          border: '2px solid #10b981',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#059669', marginBottom: '8px' }}>
          Reserve Target Met!
        </div>
        <div style={{ fontSize: '14px', color: '#047857' }}>
          Your emergency fund is fully funded at {formatCurrency(currentReserves)}.
        </div>
        <div style={{ fontSize: '14px', color: '#047857', marginTop: '4px' }}>
          Consider allocating excess contributions to other financial goals.
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: '#111827' }}>
          Build Your Replenishment Plan
        </h3>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          You need {formatCurrency(shortfall)} to reach your target of {formatCurrency(targetReserves)}
        </div>
      </div>

      {/* Preset Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
            Recommended Plans:
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                onClick={() => handleRecommendationSelect(rec)}
                style={{
                  padding: '16px',
                  backgroundColor: selectedRecommendation === rec ? '#eff6ff' : '#ffffff',
                  border: `2px solid ${selectedRecommendation === rec ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                    {rec.action}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                      {formatCurrency(rec.monthly_target)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>per month</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                  {rec.rationale}
                </div>
                {rec.time_to_goal > 0 && (
                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ClockIcon style={{ width: '16px', height: '16px', color: '#6b7280', flexShrink: 0 }} />
                    Reach target in <strong>{rec.time_to_goal} months</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Amount Slider */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
          Or Set Custom Amount:
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Monthly Contribution</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
                {formatCurrency(monthlyContribution)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.min(disposableIncome, shortfall)}
              step="10"
              value={monthlyContribution}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(monthlyContribution / disposableIncome) * 100}%, #e5e7eb ${(monthlyContribution / disposableIncome) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              <span>$0</span>
              <span>{formatCurrency(disposableIncome)}</span>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Time to Goal
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                {timeToGoal === Infinity ? '∞' : `${timeToGoal} mo`}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                % of Income
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                {percentOfIncome.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Remaining Disposable */}
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: remainingDisposable < 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: remainingDisposable < 0 ? '#991b1b' : '#166534' }}>
                Remaining Disposable Income
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: remainingDisposable < 0 ? '#ef4444' : '#16a34a' }}>
                {formatCurrency(remainingDisposable)}
              </div>
            </div>
            {remainingDisposable < 0 && (
              <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ExclamationTriangleIcon style={{ width: '14px', height: '14px', color: '#991b1b', flexShrink: 0 }} />
                This exceeds your disposable income
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projection Timeline */}
      {timeToGoal < Infinity && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #3b82f6',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
            Your Timeline
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Today</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                {formatCurrency(currentReserves)}
              </div>
            </div>
            <div style={{ fontSize: '24px', color: '#3b82f6' }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                In {timeToGoal} months
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                {formatCurrency(targetReserves)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ height: '8px', backgroundColor: '#dbeafe', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(currentReserves / targetReserves) * 100}%`,
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
              {((currentReserves / targetReserves) * 100).toFixed(1)}% complete
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReserveReplenishmentPlan;
