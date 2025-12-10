/**
 * Portfolio Optimization Dashboard
 *
 * Main dashboard for portfolio optimization with multi-level optimization,
 * ESG screening, insights, and alerts.
 */

import React, { useEffect, useState } from 'react';
import { usePortfolioOptimization } from '../../hooks/usePortfolioOptimization';
import {
  formatPercentage,
  formatCurrency,
  getRiskLevelColor,
} from '../../services/portfolioOptimizationApi';
import type {
  Account,
  Goal,
  MultiLevelOptimizationRequest,
} from '../../services/portfolioOptimizationApi';
import { FactorAttributionAnalysis } from './FactorAttributionAnalysis';
import { CAPMAnalysis } from './CAPMAnalysis';

export const PortfolioOptimizationDashboard: React.FC = () => {
  const {
    assetClasses,
    loadingAssets,
    loadAssetClasses,
    optimizationResult,
    loadingOptimization,
    optimizationError,
    optimizePortfolio,
    insights,
    loadingInsights,
    fetchInsights,
    alerts,
    loadingAlerts,
    fetchAlerts,
  } = usePortfolioOptimization();

  const [selectedTab, setSelectedTab] = useState<'optimize' | 'insights' | 'alerts' | 'factor' | 'capm'>('optimize');
  const [riskTolerance, setRiskTolerance] = useState(0.6);
  const [timeHorizon, setTimeHorizon] = useState(20);

  // Load asset classes on mount
  useEffect(() => {
    loadAssetClasses();
  }, [loadAssetClasses]);

  // Fetch insights and alerts when optimization completes
  useEffect(() => {
    if (optimizationResult) {
      fetchInsights({
        portfolio_allocation: optimizationResult.household_allocation,
      });

      fetchAlerts({
        portfolio_allocation: optimizationResult.household_allocation,
        target_allocation: optimizationResult.household_allocation,
      });
    }
  }, [optimizationResult, fetchInsights, fetchAlerts]);

  const handleOptimize = async () => {
    // Example accounts and goals
    const accounts: Account[] = [
      {
        id: '401k',
        name: '401(k) Plan',
        type: 'tax_deferred',
        balance: 150000,
        current_holdings: {},
      },
      {
        id: 'roth',
        name: 'Roth IRA',
        type: 'tax_exempt',
        balance: 75000,
        current_holdings: {},
      },
      {
        id: 'taxable',
        name: 'Brokerage Account',
        type: 'taxable',
        balance: 50000,
        current_holdings: {},
      },
    ];

    const goals: Goal[] = [
      {
        id: 'retirement',
        name: 'Retirement at 65',
        target_amount: 2000000,
        current_amount: 275000,
        years_to_goal: timeHorizon,
        priority: 'essential',
        risk_tolerance: riskTolerance,
        success_threshold: 0.85,
      },
    ];

    const request: MultiLevelOptimizationRequest = {
      accounts,
      goals,
      asset_codes: [], // Use default top assets
      use_esg_screening: false,
    };

    await optimizePortfolio(request);
  };

  return (
    <div className="portfolio-optimization-dashboard">
      <div className="dashboard-header">
        <h1>Portfolio Optimization</h1>
        <p>Institutional-grade portfolio management with multi-level optimization</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={selectedTab === 'optimize' ? 'active' : ''}
          onClick={() => setSelectedTab('optimize')}
        >
          Optimization
        </button>
        <button
          className={selectedTab === 'insights' ? 'active' : ''}
          onClick={() => setSelectedTab('insights')}
        >
          Insights ({insights.length})
        </button>
        <button
          className={selectedTab === 'alerts' ? 'active' : ''}
          onClick={() => setSelectedTab('alerts')}
        >
          Alerts ({alerts.length})
        </button>
        <button
          className={selectedTab === 'factor' ? 'active' : ''}
          onClick={() => setSelectedTab('factor')}
        >
          Factor Attribution
        </button>
        <button
          className={selectedTab === 'capm' ? 'active' : ''}
          onClick={() => setSelectedTab('capm')}
        >
          CAPM Analysis
        </button>
      </div>

      {/* Optimization Tab */}
      {selectedTab === 'optimize' && (
        <div className="optimization-section">
          <div className="controls-panel">
            <h2>Portfolio Settings</h2>

            <div className="control-group">
              <label>
                Risk Tolerance: {formatPercentage(riskTolerance)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(parseFloat(e.target.value))}
                />
              </label>
            </div>

            <div className="control-group">
              <label>
                Time Horizon: {timeHorizon} years
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
                />
              </label>
            </div>

            <button
              onClick={handleOptimize}
              disabled={loadingOptimization}
              className="optimize-button"
            >
              {loadingOptimization ? 'Optimizing...' : 'Optimize Portfolio'}
            </button>

            {optimizationError && (
              <div className="error-message">{optimizationError}</div>
            )}
          </div>

          {/* Results */}
          {optimizationResult && (
            <div className="results-panel">
              <h2>Optimization Results</h2>

              {/* Key Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Value</div>
                  <div className="metric-value">
                    {formatCurrency(optimizationResult.total_value)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Expected Return</div>
                  <div className="metric-value">
                    {formatPercentage(optimizationResult.expected_return)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Expected Volatility</div>
                  <div className="metric-value">
                    {formatPercentage(optimizationResult.expected_volatility)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Sharpe Ratio</div>
                  <div className="metric-value">
                    {optimizationResult.sharpe_ratio.toFixed(2)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Diversification Score</div>
                  <div className="metric-value">
                    {formatPercentage(optimizationResult.diversification_score)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Tax Drag</div>
                  <div className="metric-value">
                    {formatPercentage(optimizationResult.tax_metrics.estimated_tax_drag)}
                  </div>
                </div>
              </div>

              {/* Household Allocation */}
              <div className="allocation-section">
                <h3>Household Allocation</h3>
                <div className="allocation-chart">
                  {Object.entries(optimizationResult.household_allocation).map(
                    ([asset, weight]) => (
                      <div key={asset} className="allocation-bar">
                        <div className="asset-label">{asset}</div>
                        <div className="bar-container">
                          <div
                            className="bar-fill"
                            style={{ width: `${weight * 100}%` }}
                          />
                          <div className="bar-label">{formatPercentage(weight)}</div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {optimizationResult.recommendations.length > 0 && (
                <div className="recommendations-section">
                  <h3>Recommendations</h3>
                  <ul className="recommendations-list">
                    {optimizationResult.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {selectedTab === 'insights' && (
        <div className="insights-section">
          <h2>Portfolio Insights</h2>
          {loadingInsights ? (
            <div className="loading">Loading insights...</div>
          ) : insights.length > 0 ? (
            <div className="insights-grid">
              {insights.map((insight, index) => (
                <div key={index} className={`insight-card ${insight.impact}`}>
                  <div className="insight-header">
                    <span className="insight-category">{insight.category}</span>
                    <span className="insight-confidence">
                      {formatPercentage(insight.confidence)} confidence
                    </span>
                  </div>
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No insights available. Optimize your portfolio first.</p>
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="alerts-section">
          <h2>Portfolio Alerts</h2>
          {loadingAlerts ? (
            <div className="loading">Loading alerts...</div>
          ) : alerts.length > 0 ? (
            <div className="alerts-list">
              {alerts.map((alert, index) => (
                <div key={index} className={`alert-card ${alert.severity}`}>
                  <div className="alert-header">
                    <span className="alert-type">{alert.type}</span>
                    <span className="alert-severity">{alert.severity}</span>
                  </div>
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  <div className="alert-recommendation">
                    <strong>Recommendation:</strong> {alert.recommendation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No alerts. Your portfolio is well-optimized!</p>
            </div>
          )}
        </div>
      )}

      {/* Factor Attribution Tab */}
      {selectedTab === 'factor' && (
        <div className="factor-section">
          <FactorAttributionAnalysis demoMode={true} />
        </div>
      )}

      {/* CAPM Analysis Tab */}
      {selectedTab === 'capm' && (
        <div className="capm-section">
          <CAPMAnalysis demoMode={true} />
        </div>
      )}

      <style jsx>{`
        .portfolio-optimization-dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .dashboard-header p {
          color: #64748b;
          font-size: 16px;
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .tab-nav button {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
        }

        .tab-nav button:hover {
          color: #1e293b;
        }

        .tab-nav button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .controls-panel {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .control-group {
          margin-bottom: 20px;
        }

        .control-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .control-group input[type='range'] {
          width: 100%;
          margin-top: 8px;
        }

        .optimize-button {
          width: 100%;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .optimize-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .optimize-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .results-panel {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          padding: 16px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .metric-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .allocation-section {
          margin-top: 24px;
        }

        .allocation-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .asset-label {
          min-width: 150px;
          font-weight: 500;
        }

        .bar-container {
          flex: 1;
          height: 32px;
          background: #f1f5f9;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          transition: width 0.3s;
        }

        .bar-label {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          font-size: 14px;
        }

        .recommendations-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .recommendations-list {
          list-style: none;
          padding: 0;
        }

        .recommendations-list li {
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .insight-card {
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #64748b;
        }

        .insight-card.positive {
          border-left-color: #10b981;
        }

        .insight-card.negative {
          border-left-color: #ef4444;
        }

        .insight-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alert-card {
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #3b82f6;
        }

        .alert-card.warning {
          border-left-color: #f59e0b;
        }

        .alert-card.critical {
          border-left-color: #ef4444;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .alert-recommendation {
          margin-top: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 4px;
          font-size: 14px;
        }

        .error-message {
          margin-top: 12px;
          padding: 12px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 6px;
        }

        .empty-state {
          padding: 48px;
          text-align: center;
          color: #64748b;
        }

        .loading {
          padding: 48px;
          text-align: center;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};
