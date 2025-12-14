/**
 * Reserve Monitoring Component
 * Emergency fund and safety reserve monitoring with alerts
 *
 * REQ-RISK-012: Reserve monitoring UI
 */

import React, { useState, useEffect } from 'react';
import { ClockIcon, BanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export interface ReserveMonitoringProps {
  currentReserves: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  hasDependents?: boolean;
  incomeStability?: 'stable' | 'variable' | 'uncertain';
  jobSecurity?: 'secure' | 'moderate' | 'at_risk';
  autoRefresh?: boolean;
}

interface ReserveAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action_required: string;
  priority: number;
}

interface ReserveRecommendation {
  action: string;
  monthly_target: number;
  time_to_goal: number;
  rationale: string;
  impact: string;
}

interface ReserveMonitoringResult {
  current_reserves: number;
  monthly_expenses: number;
  months_coverage: number;
  reserve_status: 'critical' | 'low' | 'adequate' | 'strong' | 'excellent';
  minimum_target: number;
  recommended_target: number;
  optimal_target: number;
  shortfall: number;
  target_met: boolean;
  alerts: ReserveAlert[];
  recommendations: ReserveRecommendation[];
  trend: string;
  last_updated: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const ReserveMonitoring: React.FC<ReserveMonitoringProps> = ({
  currentReserves,
  monthlyExpenses,
  monthlyIncome,
  hasDependents = false,
  incomeStability = 'stable',
  jobSecurity = 'secure',
  autoRefresh = false,
}) => {
  const [result, setResult] = useState<ReserveMonitoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ReserveRecommendation | null>(null);

  const fetchReserveStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reserve-monitoring/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_reserves: currentReserves,
          monthly_expenses: monthlyExpenses,
          monthly_income: monthlyIncome,
          has_dependents: hasDependents,
          income_stability: incomeStability,
          job_security: jobSecurity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reserve status');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserveStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchReserveStatus, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [currentReserves, monthlyExpenses, monthlyIncome, hasDependents, incomeStability, jobSecurity]);

  const getStatusColor = (status: string): string => {
    const colors = {
      critical: '#ef4444',
      low: '#f97316',
      adequate: '#eab308',
      strong: '#22c55e',
      excellent: '#059669',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getSeverityColor = (severity: string): string => {
    const colors = {
      critical: '#ef4444',
      warning: '#f97316',
      info: '#3b82f6',
    };
    return colors[severity as keyof typeof colors] || '#6b7280';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading && !result) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
        Analyzing reserve status...
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
          margin: '16px',
        }}
      >
        Error: {error}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="reserve-monitoring" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header with Status */}
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: `2px solid ${getStatusColor(result.reserve_status)}`,
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Emergency Fund Status
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: getStatusColor(result.reserve_status),
                textTransform: 'capitalize',
                marginBottom: '8px',
              }}
            >
              {result.reserve_status}
            </div>
            <div style={{ fontSize: '18px', color: '#374151' }}>
              {result.months_coverage.toFixed(1)} months of expenses saved
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Current Reserves
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>
              {formatCurrency(result.current_reserves)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            <span>Minimum (3 months)</span>
            <span>Recommended (6 months)</span>
            <span>Optimal (12 months)</span>
          </div>
          <div style={{ position: 'relative', height: '24px', backgroundColor: '#f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Filled progress */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${Math.min(100, (result.current_reserves / result.optimal_target) * 100)}%`,
                backgroundColor: getStatusColor(result.reserve_status),
                transition: 'width 0.5s ease',
              }}
            />
            {/* Markers */}
            <div style={{ position: 'absolute', left: `${(result.minimum_target / result.optimal_target) * 100}%`, top: 0, width: '2px', height: '100%', backgroundColor: '#94a3b8' }} />
            <div style={{ position: 'absolute', left: `${(result.recommended_target / result.optimal_target) * 100}%`, top: 0, width: '2px', height: '100%', backgroundColor: '#64748b' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            <span>{formatCurrency(result.minimum_target)}</span>
            <span>{formatCurrency(result.recommended_target)}</span>
            <span>{formatCurrency(result.optimal_target)}</span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {result.alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
            Alerts ({result.alerts.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {result.alerts
              .sort((a, b) => a.priority - b.priority)
              .map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    backgroundColor: alert.severity === 'critical' ? '#fef2f2' : alert.severity === 'warning' ? '#fef3c7' : '#eff6ff',
                    borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: getSeverityColor(alert.severity) }}>
                    ➜ {alert.action_required}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Targets Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
          Reserve Targets
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <TargetCard
            title="Minimum"
            amount={result.minimum_target}
            met={result.current_reserves >= result.minimum_target}
          />
          <TargetCard
            title="Recommended"
            amount={result.recommended_target}
            met={result.current_reserves >= result.recommended_target}
          />
          <TargetCard
            title="Optimal"
            amount={result.optimal_target}
            met={result.current_reserves >= result.optimal_target}
          />
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
            Recommendations ({result.recommendations.length})
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {result.recommendations.map((rec, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRecommendation(rec)}
                style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: selectedRecommendation === rec ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                      {rec.action}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {rec.rationale}
                    </div>
                  </div>
                  {rec.monthly_target > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                        {formatCurrency(rec.monthly_target)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        per month
                      </div>
                    </div>
                  )}
                </div>
                {rec.time_to_goal > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    <div style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ClockIcon style={{ width: '16px', height: '16px', color: '#6b7280', flexShrink: 0 }} />
                      Time to goal: <strong>{rec.time_to_goal} months</strong>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                  {rec.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortfall Alert */}
      {result.shortfall > 0 && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '2px solid #f59e0b',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BanknotesIcon style={{ width: '20px', height: '20px', color: '#f59e0b', flexShrink: 0 }} />
            Reserve Shortfall
          </div>
          <div style={{ fontSize: '14px', color: '#78350f' }}>
            You need an additional <strong>{formatCurrency(result.shortfall)}</strong> to reach your recommended reserve target of {formatCurrency(result.recommended_target)}.
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component

interface TargetCardProps {
  title: string;
  amount: number;
  met: boolean;
}

const TargetCard: React.FC<TargetCardProps> = ({ title, amount, met }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: met ? '#ecfdf5' : '#ffffff',
        borderRadius: '8px',
        border: met ? '2px solid #10b981' : '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {met && <CheckCircleIcon style={{ width: '24px', height: '24px', color: '#10b981' }} />}
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: met ? '#059669' : '#111827' }}>
        {formatCurrency(amount)}
      </div>
      {met && (
        <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
          Target met!
        </div>
      )}
    </div>
  );
};

export default ReserveMonitoring;
