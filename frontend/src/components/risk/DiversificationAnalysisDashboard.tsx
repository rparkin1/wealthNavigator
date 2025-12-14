/**
 * Diversification Analysis Dashboard Component
 * Comprehensive dashboard for portfolio diversification and concentration risk analysis
 *
 * REQ-RISK-008: Diversification metrics UI
 * REQ-RISK-009: Concentration risk identification UI
 * REQ-RISK-010: Diversification recommendations UI
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  LightBulbIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  BriefcaseIcon,
  FlagIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type {
  DiversificationTab,
  DiversificationAnalysisResult,
  ConcentrationThresholds,
  HoldingInfo,
  ConcentrationSeverity,
  ConcentrationType,
} from '../../types/diversification';
import * as diversificationApi from '../../services/diversificationApi';

export interface DiversificationAnalysisDashboardProps {
  portfolioValue: number;
  holdings: HoldingInfo[];
  onAnalysisComplete?: (analysis: DiversificationAnalysisResult) => void;
}

// Helper function to transform breakdown data from API format to component format
function transformBreakdown(breakdown: Record<string, number>): Array<{ name: string; weight: number; holdings_count: number }> {
  return Object.entries(breakdown || {}).map(([name, weight]) => ({
    name: name.replace(/_/g, ' '),
    weight,
    holdings_count: 0, // Backend doesn't provide this, would need to calculate from holdings
  }));
}

export function DiversificationAnalysisDashboard({
  portfolioValue,
  holdings,
  onAnalysisComplete,
}: DiversificationAnalysisDashboardProps) {
  // Tab state
  const [selectedTab, setSelectedTab] = useState<DiversificationTab>('overview');

  // Analysis state
  const [analysis, setAnalysis] = useState<DiversificationAnalysisResult | null>(null);
  const [thresholds, setThresholds] = useState<ConcentrationThresholds | null>(null);

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedSeverities, setSelectedSeverities] = useState<ConcentrationSeverity[]>(['critical', 'high', 'medium', 'low']);
  const [selectedTypes, setSelectedTypes] = useState<ConcentrationType[]>([
    'single_holding',
    'top_5',
    'sector',
    'geography',
    'asset_class',
    'manager',
  ]);
  const [showOnlyHighPriority, setShowOnlyHighPriority] = useState(false);

  // Load thresholds on mount
  useEffect(() => {
    loadThresholds();
  }, []);

  // Run analysis when holdings change
  useEffect(() => {
    if (holdings.length > 0) {
      runAnalysis();
    }
  }, [portfolioValue, holdings]);

  const loadThresholds = async () => {
    try {
      const result = await diversificationApi.getConcentrationThresholds();
      setThresholds(result);
    } catch (err) {
      console.error('Failed to load thresholds:', err);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await diversificationApi.analyzeDiversification({
        portfolio_value: portfolioValue,
        holdings: holdings,
      });
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze diversification');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadExampleAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await diversificationApi.getExampleAnalysis();
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load example');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render helpers
  const renderOverviewTab = () => {
    if (!analysis) return null;

    const scoreDisplay = diversificationApi.getDiversificationScoreDisplay(analysis.metrics.diversification_score);

    return (
      <div>
        {/* Score Card */}
        <div
          style={{
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            marginBottom: '24px',
            border: `2px solid ${scoreDisplay.color}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginRight: '16px' }}>{scoreDisplay.icon}</div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                Diversification Score
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: scoreDisplay.color }}>
                {analysis.metrics.diversification_score}/100
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: scoreDisplay.color }}>
                {scoreDisplay.level}
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            {scoreDisplay.description}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Holdings Count</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{analysis.metrics.holdings_count}</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Effective Securities
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {analysis.metrics?.effective_securities?.toFixed(1) ?? 'N/A'}
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Herfindahl Index
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {((analysis.metrics?.herfindahl_index ?? 0) * 10000).toFixed(0)}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Lower is better</div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Concentration Risks
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {analysis.concentration_risks.length}
            </div>
          </div>
        </div>

        {/* Top Holdings */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChartBarIcon style={{ width: '20px', height: '20px' }} />
            Top 5 Holdings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(analysis.top_10_holdings || []).slice(0, 5).map((holding, index) => (
              <div
                key={holding.symbol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, width: '30px', color: '#9ca3af' }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{holding.symbol}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{holding.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {diversificationApi.formatPercentage(holding.weight)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {diversificationApi.formatPercentage(holding.value, 0)}
                  </div>
                </div>
                {/* Visual bar */}
                <div style={{ width: '100px', marginLeft: '16px' }}>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                    <div
                      style={{
                        width: `${holding.weight * 100}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DocumentTextIcon style={{ width: '20px', height: '20px' }} />
            Summary
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
            {analysis.summary}
          </p>
        </div>
      </div>
    );
  };

  const renderConcentrationTab = () => {
    if (!analysis) return null;

    // Filter concentration risks
    const filteredRisks = analysis.concentration_risks.filter(
      (risk) => selectedSeverities.includes(risk.severity) && selectedTypes.includes(risk.risk_type)
    );

    return (
      <div>
        {/* Filters */}
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Filters</div>

          {/* Severity Filter */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Severity</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['critical', 'high', 'medium', 'low'] as ConcentrationSeverity[]).map((severity) => (
                <button
                  key={severity}
                  onClick={() => {
                    setSelectedSeverities((prev) =>
                      prev.includes(severity) ? prev.filter((s) => s !== severity) : [...prev, severity]
                    );
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedSeverities.includes(severity)
                      ? diversificationApi.getSeverityColor(severity)
                      : '#ffffff',
                    color: selectedSeverities.includes(severity) ? '#ffffff' : '#6b7280',
                    border: `1px solid ${diversificationApi.getSeverityColor(severity)}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {severity.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Concentration Risks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRisks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <CheckCircleIcon style={{ width: '64px', height: '64px', color: '#10b981' }} />
              </div>
              <div style={{ fontSize: '16px' }}>No concentration risks match your filters</div>
            </div>
          ) : (
            filteredRisks.map((risk, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  border: `2px solid ${diversificationApi.getSeverityColor(risk.severity)}`,
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '24px', marginRight: '12px' }}>
                    {diversificationApi.getConcentrationTypeIcon(risk.risk_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      {risk.risk_type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: diversificationApi.getSeverityBgColor(risk.severity),
                        color: diversificationApi.getSeverityColor(risk.severity),
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {risk.severity.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {diversificationApi.formatPercentage(risk.concentration_weight)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>Concentration</div>
                  </div>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
                  {risk.description}
                </p>

                {risk.affected_holdings.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Affected Holdings:
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {risk.affected_holdings.join(', ')}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    border: '1px solid #dbeafe',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LightBulbIcon style={{ width: '16px', height: '16px' }} />
                    Recommendation:
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{risk.recommendation}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderRecommendationsTab = () => {
    if (!analysis) return null;

    // Filter recommendations
    const filteredRecommendations = showOnlyHighPriority
      ? analysis.recommendations.filter((r) => r.priority === 'high')
      : analysis.recommendations;

    return (
      <div>
        {/* Filter Toggle */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showOnlyHighPriority}
              onChange={(e) => setShowOnlyHighPriority(e.target.checked)}
              style={{ marginRight: '8px', width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Show only high priority recommendations</span>
          </label>
        </div>

        {/* Recommendations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRecommendations.map((rec, index) => (
            <div
              key={index}
              style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                border: `2px solid ${diversificationApi.getPriorityColor(rec.priority)}`,
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div
                  style={{
                    padding: '4px 12px',
                    backgroundColor: diversificationApi.getPriorityColor(rec.priority),
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginRight: '12px',
                  }}
                >
                  {rec.priority.toUpperCase()}
                </div>
                <div style={{ flex: 1, fontSize: '16px', fontWeight: 600 }}>{rec.action}</div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Rationale:</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{rec.rationale}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Target:</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{rec.target}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Expected Impact:</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{rec.impact}</p>
              </div>

              {rec.specific_actions && rec.specific_actions.length > 0 && (
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Specific Actions:</div>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {rec.specific_actions.map((action, idx) => (
                      <li key={idx} style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBreakdownTab = () => {
    if (!analysis) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Sector Breakdown */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BuildingOffice2Icon style={{ width: '20px', height: '20px' }} />
            Sector Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(analysis.concentration_breakdown?.sector || transformBreakdown(analysis.sector_breakdown)).map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {item.holdings_count} holdings
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginRight: '16px' }}>
                  {diversificationApi.formatPercentage(item.weight)}
                </div>
                <div style={{ width: '120px' }}>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                    <div
                      style={{
                        width: `${item.weight * 100}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geography Breakdown */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GlobeAltIcon style={{ width: '20px', height: '20px' }} />
            Geography Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(analysis.concentration_breakdown?.geography || transformBreakdown(analysis.geography_breakdown)).map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {item.holdings_count} holdings
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginRight: '16px' }}>
                  {diversificationApi.formatPercentage(item.weight)}
                </div>
                <div style={{ width: '120px' }}>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                    <div
                      style={{
                        width: `${item.weight * 100}%`,
                        height: '100%',
                        backgroundColor: '#10b981',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Class Breakdown */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BriefcaseIcon style={{ width: '20px', height: '20px' }} />
            Asset Class Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(analysis.concentration_breakdown?.asset_class || transformBreakdown(analysis.asset_class_breakdown)).map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {item.holdings_count} holdings
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginRight: '16px' }}>
                  {diversificationApi.formatPercentage(item.weight)}
                </div>
                <div style={{ width: '120px' }}>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                    <div
                      style={{
                        width: `${item.weight * 100}%`,
                        height: '100%',
                        backgroundColor: '#f59e0b',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FlagIcon style={{ width: '28px', height: '28px' }} />
          Diversification Analysis
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          Analyze portfolio diversification and identify concentration risks
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing || holdings.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: isAnalyzing ? '#9ca3af' : '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: isAnalyzing || holdings.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </button>
        <button
          onClick={loadExampleAnalysis}
          disabled={isAnalyzing}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffffff',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Load Example
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <XCircleIcon style={{ width: '20px', height: '20px', color: '#991b1b', flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Tabs */}
      {analysis && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
            {[
              { id: 'overview', label: 'Overview', icon: <ChartBarIcon style={{ width: '18px', height: '18px' }} /> },
              { id: 'concentration', label: 'Concentration Risks', icon: <ExclamationTriangleIcon style={{ width: '18px', height: '18px' }} /> },
              { id: 'recommendations', label: 'Recommendations', icon: <LightBulbIcon style={{ width: '18px', height: '18px' }} /> },
              { id: 'breakdown', label: 'Breakdown', icon: <ArrowTrendingUpIcon style={{ width: '18px', height: '18px' }} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as DiversificationTab)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: selectedTab === tab.id ? '#3b82f6' : 'transparent',
                  color: selectedTab === tab.id ? '#ffffff' : '#6b7280',
                  border: 'none',
                  borderBottom: selectedTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
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
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'concentration' && renderConcentrationTab()}
          {selectedTab === 'recommendations' && renderRecommendationsTab()}
          {selectedTab === 'breakdown' && renderBreakdownTab()}
        </>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && holdings.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <ChartBarIcon style={{ width: '64px', height: '64px', color: '#9ca3af' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            No Holdings Data
          </div>
          <div style={{ fontSize: '14px' }}>
            Add holdings to your portfolio to analyze diversification
          </div>
          <button
            onClick={loadExampleAnalysis}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Load Example Portfolio
          </button>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '18px' }}>Analyzing portfolio diversification...</div>
        </div>
      )}
    </div>
  );
}
