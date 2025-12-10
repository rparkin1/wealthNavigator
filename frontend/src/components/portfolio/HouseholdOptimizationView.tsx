/**
 * Household Optimization View
 *
 * Provides a household-level view of multi-goal portfolio optimization,
 * showing aggregate statistics, account-level allocations, and glide paths.
 */

import React, { useState, useEffect } from 'react';
import {
  getGlidePath,
  formatCurrency,
  formatPercentage,
  getAccountTypeColor,
  getPriorityColor,
} from '../../services/multiGoalOptimizationApi';
import type {
  OptimizationResponse,
  AccountInfo,
  GlidePathResponse,
} from '../../types/multiGoalOptimization';

interface Goal {
  id: string;
  title: string;
  category: string;
  priority: 'essential' | 'important' | 'aspirational';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

interface HouseholdOptimizationViewProps {
  optimizationResult: OptimizationResponse;
  goals: Goal[];
  accounts: AccountInfo[];
}

type ViewMode = 'aggregate' | 'accounts' | 'glide-paths';

export const HouseholdOptimizationView: React.FC<HouseholdOptimizationViewProps> = ({
  optimizationResult,
  goals,
  accounts,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('aggregate');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [glidePath, setGlidePath] = useState<GlidePathResponse | null>(null);
  const [loadingGlidePath, setLoadingGlidePath] = useState(false);

  useEffect(() => {
    if (selectedGoalId && viewMode === 'glide-paths') {
      loadGlidePath();
    }
  }, [selectedGoalId, viewMode]);

  const loadGlidePath = async () => {
    setLoadingGlidePath(true);
    try {
      const path = await getGlidePath(selectedGoalId);
      setGlidePath(path);
    } catch (error) {
      console.error('Failed to load glide path:', error);
    } finally {
      setLoadingGlidePath(false);
    }
  };

  const totalAllocated = Object.values(optimizationResult.goal_allocations).reduce(
    (sum, amount) => sum + amount,
    0
  );

  return (
    <div className="household-optimization-view">
      <div className="view-header">
        <h2>Household-Level Optimization</h2>
        <p className="subtitle">
          Comprehensive view of portfolio optimization across all accounts and goals
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="view-mode-selector">
        <button
          className={viewMode === 'aggregate' ? 'active' : ''}
          onClick={() => setViewMode('aggregate')}
        >
          Aggregate Statistics
        </button>
        <button
          className={viewMode === 'accounts' ? 'active' : ''}
          onClick={() => setViewMode('accounts')}
        >
          Account Allocations
        </button>
        <button
          className={viewMode === 'glide-paths' ? 'active' : ''}
          onClick={() => setViewMode('glide-paths')}
        >
          Glide Paths
        </button>
      </div>

      {/* Aggregate Statistics View */}
      {viewMode === 'aggregate' && (
        <div className="aggregate-view">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Portfolio Value</div>
              <div className="metric-value">
                {formatCurrency(optimizationResult.aggregate_stats.total_value)}
              </div>
              <div className="metric-subtitle">{accounts.length} accounts</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Weighted Expected Return</div>
              <div className="metric-value positive">
                {formatPercentage(optimizationResult.aggregate_stats.weighted_return)}
              </div>
              <div className="metric-subtitle">Annual</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Portfolio Risk (Volatility)</div>
              <div className="metric-value">
                {formatPercentage(optimizationResult.aggregate_stats.weighted_risk)}
              </div>
              <div className="metric-subtitle">Standard deviation</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Sharpe Ratio</div>
              <div className="metric-value">
                {optimizationResult.aggregate_stats.sharpe_ratio.toFixed(2)}
              </div>
              <div className="metric-subtitle">Risk-adjusted return</div>
            </div>
          </div>

          {/* Allocation Distribution */}
          <div className="allocation-distribution">
            <h3>Household Asset Allocation</h3>
            <div className="allocation-chart">
              {Object.entries(optimizationResult.aggregate_stats.aggregate_allocation)
                .sort(([, a], [, b]) => b - a)
                .map(([asset, weight]) => {
                  const value = optimizationResult.aggregate_stats.total_value * weight;
                  return (
                    <div key={asset} className="allocation-bar">
                      <div className="bar-header">
                        <span className="asset-name">{asset}</span>
                        <span className="asset-stats">
                          {formatPercentage(weight)} · {formatCurrency(value)}
                        </span>
                      </div>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${weight * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Goal Funding Status */}
          <div className="funding-status-section">
            <h3>Goal Funding Status</h3>
            <div className="funding-summary">
              <div className="summary-stat">
                <div className="stat-value fully-funded">
                  {optimizationResult.optimization_summary.fully_funded_goals}
                </div>
                <div className="stat-label">Fully Funded</div>
              </div>
              <div className="summary-stat">
                <div className="stat-value partially-funded">
                  {optimizationResult.optimization_summary.partially_funded_goals}
                </div>
                <div className="stat-label">Partially Funded</div>
              </div>
              <div className="summary-stat">
                <div className="stat-value unfunded">
                  {optimizationResult.optimization_summary.unfunded_goals}
                </div>
                <div className="stat-label">Unfunded</div>
              </div>
            </div>
          </div>

          {/* Capital Allocation Pie Chart */}
          <div className="capital-allocation-section">
            <h3>Capital Allocation by Goal</h3>
            <div className="goal-allocations-list">
              {optimizationResult.goal_portfolios.map((portfolio) => {
                const goal = goals.find((g) => g.id === portfolio.goal_id);
                if (!goal) return null;

                const allocationPercent = (portfolio.allocated_amount / totalAllocated) * 100;

                return (
                  <div key={portfolio.goal_id} className="goal-allocation-row">
                    <div className="goal-info">
                      <span className="goal-name">{portfolio.goal_title}</span>
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(goal.priority) }}
                      >
                        {goal.priority}
                      </span>
                    </div>
                    <div className="allocation-bar-container">
                      <div
                        className="allocation-bar-fill"
                        style={{
                          width: `${allocationPercent}%`,
                          backgroundColor: getPriorityColor(goal.priority),
                        }}
                      />
                    </div>
                    <div className="allocation-stats">
                      <span className="percentage">{allocationPercent.toFixed(1)}%</span>
                      <span className="amount">{formatCurrency(portfolio.allocated_amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Account Allocations View */}
      {viewMode === 'accounts' && (
        <div className="accounts-view">
          <h3>Asset Allocation by Account</h3>
          <div className="accounts-grid">
            {optimizationResult.account_allocations.map((allocation) => {
              const account = accounts.find((a) => a.id === allocation.account_id);
              if (!account) return null;

              const totalAccountValue = Object.values(allocation.allocations).reduce(
                (sum, amount) => sum + amount,
                0
              );

              return (
                <div key={allocation.account_id} className="account-card">
                  <div className="account-header">
                    <div>
                      <h4>{allocation.account_id}</h4>
                      <span
                        className="account-type-badge"
                        style={{ backgroundColor: getAccountTypeColor(account.type) }}
                      >
                        {account.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="account-value">
                      {formatCurrency(totalAccountValue)}
                    </div>
                  </div>

                  <div className="account-allocations">
                    {Object.entries(allocation.allocations)
                      .sort(([, a], [, b]) => b - a)
                      .map(([asset, amount]) => {
                        const percentage = (amount / totalAccountValue) * 100;
                        return (
                          <div key={asset} className="asset-allocation-row">
                            <span className="asset-name">{asset}</span>
                            <div className="asset-bar">
                              <div
                                className="asset-bar-fill"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="asset-value">
                              {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Glide Paths View */}
      {viewMode === 'glide-paths' && (
        <div className="glide-paths-view">
          <div className="goal-selector">
            <label htmlFor="goal-select">Select Goal:</label>
            <select
              id="goal-select"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
            >
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          {loadingGlidePath && (
            <div className="loading-state">Loading glide path...</div>
          )}

          {glidePath && !loadingGlidePath && (
            <div className="glide-path-content">
              <div className="glide-path-header">
                <h3>{glidePath.goal_title}</h3>
                <p className="glide-path-subtitle">
                  {glidePath.years_to_goal.toFixed(1)} years to goal
                </p>
              </div>

              <div className="allocation-comparison">
                <div className="allocation-box">
                  <div className="box-label">Current Allocation</div>
                  <div className="allocation-split">
                    <div className="allocation-item stocks">
                      <div className="item-value">{glidePath.current_allocation.stocks}%</div>
                      <div className="item-label">Stocks</div>
                    </div>
                    <div className="allocation-item bonds">
                      <div className="item-value">{glidePath.current_allocation.bonds}%</div>
                      <div className="item-label">Bonds</div>
                    </div>
                  </div>
                </div>

                <div className="allocation-box">
                  <div className="box-label">Target Allocation (at goal date)</div>
                  <div className="allocation-split">
                    <div className="allocation-item stocks">
                      <div className="item-value">{glidePath.target_allocation.stocks}%</div>
                      <div className="item-label">Stocks</div>
                    </div>
                    <div className="allocation-item bonds">
                      <div className="item-value">{glidePath.target_allocation.bonds}%</div>
                      <div className="item-label">Bonds</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glide-path-chart">
                <h4>Allocation Over Time</h4>
                <div className="chart-container">
                  {glidePath.glide_path.map((projection, index) => {
                    const isCurrentYear = index === 0;
                    return (
                      <div
                        key={projection.year}
                        className={`chart-bar ${isCurrentYear ? 'current' : ''}`}
                      >
                        <div className="bar-stack">
                          <div
                            className="bar-segment stocks"
                            style={{ height: `${projection.stocks_percentage}%` }}
                          >
                            {projection.stocks_percentage >= 20 && (
                              <span className="segment-label">
                                {projection.stocks_percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <div
                            className="bar-segment bonds"
                            style={{ height: `${projection.bonds_percentage}%` }}
                          >
                            {projection.bonds_percentage >= 20 && (
                              <span className="segment-label">
                                {projection.bonds_percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bar-label">Year {projection.year}</div>
                        <div className="bar-sublabel">
                          {projection.years_remaining.toFixed(0)}y left
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glide-path-legend">
                <div className="legend-item">
                  <div className="legend-color stocks" />
                  <span>Stocks (higher growth, higher risk)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color bonds" />
                  <span>Bonds (lower risk, stable income)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .household-optimization-view {
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .view-header {
          margin-bottom: 24px;
        }

        .view-header h2 {
          margin-bottom: 8px;
        }

        .subtitle {
          color: #64748b;
          font-size: 14px;
        }

        .view-mode-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          border-bottom: 1px solid #e2e8f0;
        }

        .view-mode-selector button {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
        }

        .view-mode-selector button:hover {
          color: #1e293b;
        }

        .view-mode-selector button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .metric-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .metric-value.positive {
          color: #10b981;
        }

        .metric-subtitle {
          font-size: 12px;
          color: #94a3b8;
        }

        .allocation-distribution {
          margin-bottom: 32px;
        }

        .allocation-distribution h3 {
          margin-bottom: 20px;
        }

        .allocation-bar {
          margin-bottom: 16px;
        }

        .bar-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .asset-name {
          font-weight: 500;
        }

        .asset-stats {
          font-size: 14px;
          color: #64748b;
        }

        .bar-container {
          height: 32px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          transition: width 0.3s;
        }

        .funding-status-section {
          margin-bottom: 32px;
          padding: 24px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .funding-status-section h3 {
          margin-bottom: 20px;
        }

        .funding-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          text-align: center;
        }

        .stat-value {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stat-value.fully-funded {
          color: #10b981;
        }

        .stat-value.partially-funded {
          color: #f59e0b;
        }

        .stat-value.unfunded {
          color: #ef4444;
        }

        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .capital-allocation-section {
          margin-bottom: 32px;
        }

        .capital-allocation-section h3 {
          margin-bottom: 20px;
        }

        .goal-allocations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .goal-allocation-row {
          display: grid;
          grid-template-columns: 250px 1fr 180px;
          gap: 16px;
          align-items: center;
        }

        .goal-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .goal-name {
          font-weight: 500;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 8px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .allocation-bar-container {
          height: 24px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .allocation-bar-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .allocation-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .percentage {
          font-weight: 600;
        }

        .amount {
          color: #64748b;
        }

        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }

        .account-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e2e8f0;
        }

        .account-header h4 {
          margin-bottom: 8px;
        }

        .account-type-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .account-value {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
        }

        .asset-allocation-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .asset-allocation-row .asset-name {
          min-width: 120px;
          font-size: 14px;
        }

        .asset-bar {
          flex: 1;
          height: 16px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .asset-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #7c3aed);
          transition: width 0.3s;
        }

        .asset-value {
          font-size: 13px;
          font-weight: 600;
          min-width: 150px;
          text-align: right;
        }

        .goal-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
        }

        .goal-selector label {
          font-weight: 500;
        }

        .goal-selector select {
          padding: 8px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .loading-state {
          padding: 48px;
          text-align: center;
          color: #64748b;
        }

        .glide-path-header {
          margin-bottom: 32px;
        }

        .glide-path-header h3 {
          margin-bottom: 8px;
        }

        .glide-path-subtitle {
          color: #64748b;
        }

        .allocation-comparison {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }

        .allocation-box {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .box-label {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 16px;
        }

        .allocation-split {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .allocation-item {
          text-align: center;
          padding: 16px;
          border-radius: 8px;
        }

        .allocation-item.stocks {
          background: #dbeafe;
        }

        .allocation-item.bonds {
          background: #fef3c7;
        }

        .item-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .allocation-item.stocks .item-value {
          color: #1e40af;
        }

        .allocation-item.bonds .item-value {
          color: #92400e;
        }

        .item-label {
          font-size: 13px;
          color: #64748b;
        }

        .glide-path-chart {
          margin-bottom: 24px;
        }

        .glide-path-chart h4 {
          margin-bottom: 16px;
        }

        .chart-container {
          display: flex;
          gap: 8px;
          height: 400px;
          align-items: flex-end;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .chart-bar.current {
          background: #f0fdf4;
          border-radius: 8px;
          padding: 8px 4px 4px 4px;
        }

        .bar-stack {
          width: 100%;
          height: 300px;
          display: flex;
          flex-direction: column-reverse;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .bar-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: height 0.3s;
        }

        .bar-segment.stocks {
          background: #3b82f6;
        }

        .bar-segment.bonds {
          background: #f59e0b;
        }

        .segment-label {
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .bar-label {
          font-size: 12px;
          font-weight: 600;
        }

        .bar-sublabel {
          font-size: 11px;
          color: #64748b;
        }

        .glide-path-legend {
          display: flex;
          gap: 24px;
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .legend-color.stocks {
          background: #3b82f6;
        }

        .legend-color.bonds {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
};
