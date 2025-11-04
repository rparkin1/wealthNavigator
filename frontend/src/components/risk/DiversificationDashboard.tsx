/**
 * Diversification Dashboard Component
 * Comprehensive portfolio diversification analysis with metrics, concentration risks, and recommendations
 *
 * REQ-RISK-008: Diversification metrics
 * REQ-RISK-009: Concentration risk identification
 * REQ-RISK-010: Diversification recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  getExampleDiversificationAnalysis,
  getDiversificationLevelColor,
  getConcentrationRiskColor,
  formatCurrency,
  formatPercentage,
} from '../../services/riskManagementApi';
import type {
  DiversificationAnalysisResult,
  HoldingInfo,
  ConcentrationRisk,
  DiversificationRecommendation,
} from '../../services/riskManagementApi';

export interface DiversificationDashboardProps {
  portfolioValue?: number;
  holdings?: HoldingInfo[];
  onAnalysisComplete?: (result: DiversificationAnalysisResult) => void;
}

export const DiversificationDashboard: React.FC<DiversificationDashboardProps> = ({
  portfolioValue,
  holdings,
  onAnalysisComplete,
}) => {
  const [analysisResult, setAnalysisResult] = useState<DiversificationAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'risks' | 'recommendations'>('overview');

  useEffect(() => {
    loadExampleAnalysis();
  }, []);

  const loadExampleAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExampleDiversificationAnalysis();
      setAnalysisResult(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load example analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
        Analyzing portfolio diversification...
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
          margin: '24px',
        }}
      >
        Error: {error}
      </div>
    );
  }

  if (!analysisResult) {
    return null;
  }

  const { metrics, concentration_risks, recommendations } = analysisResult;

  return (
    <div className="diversification-dashboard" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
              Portfolio Diversification Analysis
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              REQ-RISK-008, 009, 010: Diversification metrics, concentration risks, and improvement recommendations
            </p>
          </div>
          <button
            onClick={loadExampleAnalysis}
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
            Refresh Analysis
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {(['overview', 'risks', 'recommendations'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedView === view ? '#3b82f6' : '#f3f4f6',
                color: selectedView === view ? '#ffffff' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {view === 'overview' && '📊 Overview'}
              {view === 'risks' && '⚠️ Concentration Risks'}
              {view === 'recommendations' && '💡 Recommendations'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div>
            {/* Diversification Score Header */}
            <div
              style={{
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    Diversification Level
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: getDiversificationLevelColor(metrics.diversification_level),
                      textTransform: 'capitalize',
                    }}
                  >
                    {metrics.diversification_level}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 700,
                    color: getDiversificationLevelColor(metrics.diversification_level),
                  }}
                >
                  {metrics.diversification_score.toFixed(0)}
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#374151' }}>
                Diversification score: 0 (poor) to 100 (excellent)
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <MetricCard
                title="Total Holdings"
                value={metrics.total_holdings.toString()}
                subtitle="Number of positions"
                color="#3b82f6"
              />
              <MetricCard
                title="Effective Holdings"
                value={metrics.effective_holdings.toFixed(1)}
                subtitle="Diversification measure"
                color="#6366f1"
              />
              <MetricCard
                title="Top 10 Concentration"
                value={formatPercentage(metrics.top_10_concentration)}
                subtitle="Weight in largest holdings"
                color="#f97316"
              />
              <MetricCard
                title="HHI Index"
                value={metrics.herfindahl_index.toFixed(3)}
                subtitle="Concentration metric"
                color="#8b5cf6"
              />
            </div>

            {/* Diversification by Dimension */}
            <div
              style={{
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
                Diversification by Dimension
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <DimensionMetric
                  label="Asset Classes"
                  count={metrics.asset_class_count}
                  effective={metrics.effective_asset_classes}
                />
                <DimensionMetric
                  label="Sectors"
                  count={metrics.sector_count}
                  effective={metrics.effective_sectors}
                />
                <DimensionMetric
                  label="Industries"
                  count={metrics.industry_count}
                  effective={metrics.effective_industries}
                />
                <DimensionMetric
                  label="Geographies"
                  count={metrics.geography_count}
                  effective={metrics.effective_geographies}
                />
                <DimensionMetric
                  label="Managers/Funds"
                  count={metrics.manager_count}
                  effective={0}
                />
              </div>
            </div>

            {/* Top 10 Holdings */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  Top 10 Holdings
                </h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>
                      Symbol
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>
                      Name
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>
                      Value
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>
                      Weight
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>
                      Sector
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResult.top_10_holdings.map((holding, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                        {holding.symbol}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {holding.name}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                        {formatCurrency(holding.value)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 500 }}>
                        {formatPercentage(holding.weight)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {holding.sector || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Concentration Risks Tab */}
        {selectedView === 'risks' && (
          <div>
            {concentration_risks.length === 0 ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#047857' }}>
                  No Significant Concentration Risks
                </div>
                <div style={{ fontSize: '14px', color: '#059669', marginTop: '8px' }}>
                  Your portfolio is well-diversified across holdings, sectors, and geographies
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {concentration_risks.map((risk, idx) => (
                  <RiskCard key={idx} risk={risk} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {selectedView === 'recommendations' && (
          <div>
            {recommendations.length === 0 ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👍</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#047857' }}>
                  Portfolio Optimization Complete
                </div>
                <div style={{ fontSize: '14px', color: '#059669', marginTop: '8px' }}>
                  No improvements needed at this time
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommendations.map((rec, idx) => (
                  <RecommendationCard key={idx} recommendation={rec} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, color }) => (
  <div
    style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}
  >
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{subtitle}</div>
  </div>
);

interface DimensionMetricProps {
  label: string;
  count: number;
  effective: number;
}

const DimensionMetric: React.FC<DimensionMetricProps> = ({ label, count, effective }) => (
  <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '10px', color: '#9ca3af' }}>Count</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{count}</div>
      </div>
      {effective > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>Effective</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#6366f1' }}>
            {effective.toFixed(1)}
          </div>
        </div>
      )}
    </div>
  </div>
);

interface RiskCardProps {
  risk: ConcentrationRisk;
}

const RiskCard: React.FC<RiskCardProps> = ({ risk }) => (
  <div
    style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: `2px solid ${getConcentrationRiskColor(risk.risk_level)}`,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '12px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: getConcentrationRiskColor(risk.risk_level) + '20',
              color: getConcentrationRiskColor(risk.risk_level),
              textTransform: 'uppercase',
            }}
          >
            {risk.risk_level}
          </span>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              textTransform: 'capitalize',
            }}
          >
            {risk.risk_type}
          </span>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          {risk.details}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '10px', color: '#6b7280' }}>Concentration</div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: getConcentrationRiskColor(risk.risk_level),
          }}
        >
          {formatPercentage(risk.concentration_pct)}
        </div>
      </div>
    </div>
    {risk.affected_holdings.length > 0 && (
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        Affected: {risk.affected_holdings.slice(0, 5).join(', ')}
        {risk.affected_holdings.length > 5 && ` and ${risk.affected_holdings.length - 5} more`}
      </div>
    )}
  </div>
);

interface RecommendationCardProps {
  recommendation: DiversificationRecommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const priorityColors = {
    high: '#ef4444',
    medium: '#eab308',
    low: '#22c55e',
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: priorityColors[recommendation.priority] + '20',
            color: priorityColors[recommendation.priority],
            textTransform: 'uppercase',
          }}
        >
          {recommendation.priority} Priority
        </span>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            textTransform: 'capitalize',
          }}
        >
          {recommendation.recommendation_type}
        </span>
      </div>

      <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
        {recommendation.description}
      </div>

      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
        <strong>Action:</strong> {recommendation.suggested_action}
      </div>

      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
        <strong>Expected Impact:</strong> {recommendation.expected_impact}
      </div>

      {recommendation.alternative_investments.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Alternative Investments:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6b7280' }}>
            {recommendation.alternative_investments.map((alt, idx) => (
              <li key={idx}>{alt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiversificationDashboard;
