/**
 * Reserve Monitoring Dashboard Component
 * Comprehensive emergency fund monitoring with all features
 *
 * REQ-RISK-012: Complete reserve monitoring dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  FlagIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { EmergencyFundGauge } from './EmergencyFundGauge';
import { ReserveAlertsPanel } from './ReserveAlertsPanel';
import { ReserveReplenishmentPlan } from './ReserveReplenishmentPlan';
import { ReserveGrowthSimulator } from './ReserveGrowthSimulator';
import { monitorReserves, getReserveGuidelines } from '../../services/reserveMonitoringApi';
import type {
  ReserveMonitoringResult,
  ReserveGuidelines,
  IncomeStability,
  JobSecurity,
} from '../../types/reserveMonitoring';

export interface ReserveMonitoringDashboardProps {
  currentReserves: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  hasDependents?: boolean;
  incomeStability?: IncomeStability;
  jobSecurity?: JobSecurity;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

type Tab = 'overview' | 'plan' | 'simulator' | 'guidelines';

export const ReserveMonitoringDashboard: React.FC<ReserveMonitoringDashboardProps> = ({
  currentReserves,
  monthlyExpenses,
  monthlyIncome,
  hasDependents = false,
  incomeStability = 'stable',
  jobSecurity = 'secure',
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}) => {
  const [result, setResult] = useState<ReserveMonitoringResult | null>(null);
  const [guidelines, setGuidelines] = useState<ReserveGuidelines | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [customContribution, setCustomContribution] = useState<number>(0);

  useEffect(() => {
    fetchReserveStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchReserveStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [currentReserves, monthlyExpenses, monthlyIncome, hasDependents, incomeStability, jobSecurity]);

  const fetchReserveStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const [monitorResult, guidelinesResult] = await Promise.all([
        monitorReserves({
          current_reserves: currentReserves,
          monthly_expenses: monthlyExpenses,
          monthly_income: monthlyIncome,
          has_dependents: hasDependents,
          income_stability: incomeStability,
          job_security: jobSecurity,
        }),
        getReserveGuidelines(),
      ]);

      setResult(monitorResult);
      setGuidelines(guidelinesResult);

      // Set default contribution from recommendations
      if (monitorResult.recommendations.length > 0) {
        setCustomContribution(monitorResult.recommendations[0].monthly_target);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reserve status');
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

  if (loading && !result) {
    return (
      <div
        style={{
          padding: '96px',
          textAlign: 'center',
          color: '#6b7280',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <ChartBarIcon style={{ width: '96px', height: '96px', color: '#9ca3af' }} />
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Analyzing Reserve Status...</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Evaluating your emergency fund and generating recommendations
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          borderRadius: '8px',
          margin: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Error Loading Reserve Status
        </div>
        <div style={{ marginBottom: '16px' }}>{error}</div>
        <button
          onClick={fetchReserveStatus}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 700, color: '#111827' }}>
          Emergency Fund Monitoring
        </h1>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Track your reserve status, get personalized recommendations, and plan your savings strategy
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0',
        }}
      >
        {[
          { id: 'overview' as Tab, label: 'Overview', icon: <ChartBarIcon style={{ width: '20px', height: '20px' }} /> },
          { id: 'plan' as Tab, label: 'Build Plan', icon: <FlagIcon style={{ width: '20px', height: '20px' }} /> },
          { id: 'simulator' as Tab, label: 'Simulator', icon: <ArrowTrendingUpIcon style={{ width: '20px', height: '20px' }} /> },
          { id: 'guidelines' as Tab, label: 'Guidelines', icon: <BookOpenIcon style={{ width: '20px', height: '20px' }} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Main Status Card with Gauge */}
          <div
            style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
              <EmergencyFundGauge
                currentReserves={result.current_reserves}
                monthlyExpenses={result.monthly_expenses}
                minimumTarget={result.minimum_target}
                recommendedTarget={result.recommended_target}
                optimalTarget={result.optimal_target}
                status={result.reserve_status}
                animated={true}
              />

              <div>
                <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 600 }}>
                  Reserve Details
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    <span style={{ color: '#6b7280' }}>Current Balance</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(result.current_reserves)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    <span style={{ color: '#6b7280' }}>Monthly Expenses</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(result.monthly_expenses)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    <span style={{ color: '#6b7280' }}>Months Coverage</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{result.months_coverage.toFixed(1)} months</span>
                  </div>
                  {result.shortfall > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                      <span style={{ color: '#92400e', fontWeight: 600 }}>Shortfall</span>
                      <span style={{ fontWeight: 700, color: '#d97706' }}>{formatCurrency(result.shortfall)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div style={{ marginBottom: '24px' }}>
            <ReserveAlertsPanel alerts={result.alerts} />
          </div>

          {/* Quick Recommendations */}
          {result.recommendations.length > 0 && (
            <div
              style={{
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
                Quick Recommendations
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {result.recommendations.slice(0, 3).map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                        {rec.action}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {rec.rationale}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {rec.monthly_target > 0 && (
                        <>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>
                            {formatCurrency(rec.monthly_target)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>per month</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('plan')}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3b82f6',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Build Custom Plan →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'plan' && (
        <div
          style={{
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <ReserveReplenishmentPlan
            currentReserves={result.current_reserves}
            targetReserves={result.recommended_target}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={result.monthly_expenses}
            recommendations={result.recommendations}
            onPlanChange={(contribution, timeToGoal) => {
              setCustomContribution(contribution);
            }}
          />
        </div>
      )}

      {activeTab === 'simulator' && (
        <div
          style={{
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <ReserveGrowthSimulator
            currentReserves={result.current_reserves}
            monthlyContribution={customContribution || result.recommendations[0]?.monthly_target || 0}
            targetAmount={result.recommended_target}
            monthsToSimulate={36}
            autoSimulate={true}
          />
        </div>
      )}

      {activeTab === 'guidelines' && guidelines && (
        <div>
          {/* General Guidelines */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
              General Guidelines
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#92400e', fontWeight: 600, marginBottom: '4px' }}>
                  Minimum
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', marginBottom: '8px' }}>
                  {guidelines.general_guidelines.minimum.months} months
                </div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>
                  {guidelines.general_guidelines.minimum.description}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: 600, marginBottom: '4px' }}>
                  Recommended
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6', marginBottom: '8px' }}>
                  {guidelines.general_guidelines.recommended.months} months
                </div>
                <div style={{ fontSize: '13px', color: '#1e3a8a' }}>
                  {guidelines.general_guidelines.recommended.description}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>
                  Optimal
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
                  {guidelines.general_guidelines.optimal.months} months
                </div>
                <div style={{ fontSize: '13px', color: '#14532d' }}>
                  {guidelines.general_guidelines.optimal.description}
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
              Best Practices
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
              {guidelines.best_practices.map((practice, idx) => (
                <li key={idx} style={{ marginBottom: '8px', fontSize: '14px' }}>
                  {practice}
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistakes */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#fef2f2',
              borderRadius: '12px',
              border: '1px solid #fca5a5',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#991b1b' }}>
              Common Mistakes to Avoid
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d' }}>
              {guidelines.common_mistakes.map((mistake, idx) => (
                <li key={idx} style={{ marginBottom: '8px', fontSize: '14px' }}>
                  {mistake}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={fetchReserveStatus}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: loading ? '#9ca3af' : '#6b7280',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          Last updated: {new Date(result.last_updated).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ReserveMonitoringDashboard;
