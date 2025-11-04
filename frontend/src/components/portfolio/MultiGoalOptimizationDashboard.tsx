/**
 * Multi-Goal Optimization Dashboard
 *
 * Main dashboard for optimizing asset allocation across multiple financial goals
 * with tax-aware asset location and household-level coordination.
 */

import React, { useState, useEffect } from 'react';
import {
  optimizeMultiGoalAllocation,
  formatCurrency,
  formatPercentage,
  getPriorityColor,
  getFundingStatusColor,
  calculateFundingLevel,
} from '../../services/multiGoalOptimizationApi';
import type {
  OptimizationRequest,
  OptimizationResponse,
  AccountInfo,
} from '../../types/multiGoalOptimization';
import { GoalPrioritizationEditor } from './GoalPrioritizationEditor';
import { TaxAwareAllocationView } from './TaxAwareAllocationView';
import { HouseholdOptimizationView } from './HouseholdOptimizationView';
import { TradeoffAnalysisChart } from './TradeoffAnalysisChart';

interface MultiGoalOptimizationDashboardProps {
  userId: string;
  goals: Array<{
    id: string;
    title: string;
    category: string;
    priority: 'essential' | 'important' | 'aspirational';
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
  }>;
  accounts: AccountInfo[];
}

type TabType = 'overview' | 'prioritization' | 'tax-optimization' | 'household' | 'tradeoffs';

export const MultiGoalOptimizationDashboard: React.FC<MultiGoalOptimizationDashboardProps> = ({
  userId,
  goals,
  accounts,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(goals.map((g) => g.id));

  // Run optimization on mount and when goals/accounts change
  useEffect(() => {
    if (goals.length > 0 && accounts.length > 0) {
      handleOptimize();
    }
  }, []); // Only run on mount

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);

    try {
      const totalPortfolioValue = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      const request: OptimizationRequest = {
        goal_ids: selectedGoalIds,
        accounts: accounts,
        total_portfolio_value: totalPortfolioValue,
      };

      const result = await optimizeMultiGoalAllocation(request);
      setOptimizationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSelectionChange = (goalId: string, selected: boolean) => {
    if (selected) {
      setSelectedGoalIds([...selectedGoalIds, goalId]);
    } else {
      setSelectedGoalIds(selectedGoalIds.filter((id) => id !== goalId));
    }
  };

  const totalPortfolioValue = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="multi-goal-optimization-dashboard">
      <div className="dashboard-header">
        <h1>Multi-Goal Portfolio Optimization</h1>
        <p>Optimize allocation across {goals.length} goals with tax-aware asset location</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={selectedTab === 'prioritization' ? 'active' : ''}
          onClick={() => setSelectedTab('prioritization')}
        >
          Goal Prioritization
        </button>
        <button
          className={selectedTab === 'tax-optimization' ? 'active' : ''}
          onClick={() => setSelectedTab('tax-optimization')}
        >
          Tax Optimization
        </button>
        <button
          className={selectedTab === 'household' ? 'active' : ''}
          onClick={() => setSelectedTab('household')}
        >
          Household View
        </button>
        <button
          className={selectedTab === 'tradeoffs' ? 'active' : ''}
          onClick={() => setSelectedTab('tradeoffs')}
        >
          Trade-off Analysis
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="overview-section">
          {/* Goal Selection */}
          <div className="goal-selection-panel">
            <h2>Select Goals to Optimize</h2>
            <div className="goal-checkboxes">
              {goals.map((goal) => (
                <label key={goal.id} className="goal-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedGoalIds.includes(goal.id)}
                    onChange={(e) => handleGoalSelectionChange(goal.id, e.target.checked)}
                  />
                  <span className="goal-info">
                    <span className="goal-title">{goal.title}</span>
                    <span className="goal-details">
                      {formatCurrency(goal.targetAmount)} by {new Date(goal.targetDate).getFullYear()}
                    </span>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {goal.priority}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleOptimize}
              disabled={loading || selectedGoalIds.length === 0}
              className="optimize-button"
            >
              {loading ? 'Optimizing...' : `Optimize ${selectedGoalIds.length} Goals`}
            </button>
          </div>

          {/* Optimization Results */}
          {optimizationResult && (
            <div className="results-container">
              {/* Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-label">Total Portfolio Value</div>
                  <div className="card-value">
                    {formatCurrency(optimizationResult.aggregate_stats.total_value)}
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-label">Expected Return</div>
                  <div className="card-value">
                    {formatPercentage(optimizationResult.aggregate_stats.weighted_return)}
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-label">Portfolio Risk</div>
                  <div className="card-value">
                    {formatPercentage(optimizationResult.aggregate_stats.weighted_risk)}
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-label">Sharpe Ratio</div>
                  <div className="card-value">
                    {optimizationResult.aggregate_stats.sharpe_ratio.toFixed(2)}
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-label">Fully Funded Goals</div>
                  <div className="card-value">
                    {optimizationResult.optimization_summary.fully_funded_goals} /{' '}
                    {optimizationResult.optimization_summary.total_goals}
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-label">Goals At Risk</div>
                  <div className="card-value warning">
                    {optimizationResult.optimization_summary.unfunded_goals}
                  </div>
                </div>
              </div>

              {/* Goal Allocations */}
              <div className="goal-allocations-section">
                <h2>Capital Allocation by Goal</h2>
                <div className="goal-allocations">
                  {optimizationResult.goal_portfolios.map((portfolio) => {
                    const goal = goals.find((g) => g.id === portfolio.goal_id);
                    if (!goal) return null;

                    const fundingLevel = calculateFundingLevel(
                      portfolio.allocated_amount,
                      goal.targetAmount
                    );

                    return (
                      <div key={portfolio.goal_id} className="goal-allocation-card">
                        <div className="goal-header">
                          <div>
                            <h3>{portfolio.goal_title}</h3>
                            <span
                              className="priority-badge"
                              style={{ backgroundColor: getPriorityColor(goal.priority) }}
                            >
                              {goal.priority}
                            </span>
                          </div>
                          <div className="allocation-amount">
                            {formatCurrency(portfolio.allocated_amount)}
                          </div>
                        </div>

                        <div className="funding-bar">
                          <div className="bar-container">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${fundingLevel * 100}%`,
                                backgroundColor: getFundingStatusColor(fundingLevel),
                              }}
                            />
                          </div>
                          <div className="bar-label">{formatPercentage(fundingLevel)}</div>
                        </div>

                        <div className="portfolio-metrics">
                          <div className="metric">
                            <span className="metric-label">Years to Goal:</span>
                            <span className="metric-value">{portfolio.years_to_goal.toFixed(1)}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Expected Return:</span>
                            <span className="metric-value">
                              {formatPercentage(portfolio.expected_return)}
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Risk:</span>
                            <span className="metric-value">
                              {formatPercentage(portfolio.expected_risk)}
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Sharpe Ratio:</span>
                            <span className="metric-value">{portfolio.sharpe_ratio.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="asset-allocation">
                          <h4>Asset Allocation</h4>
                          <div className="allocation-bars">
                            {Object.entries(portfolio.allocation).map(([asset, weight]) => (
                              <div key={asset} className="allocation-row">
                                <span className="asset-label">{asset}</span>
                                <div className="allocation-bar-mini">
                                  <div
                                    className="bar-fill-mini"
                                    style={{ width: `${weight * 100}%` }}
                                  />
                                </div>
                                <span className="allocation-value">{formatPercentage(weight)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Aggregate Allocation */}
              <div className="aggregate-section">
                <h2>Household Aggregate Allocation</h2>
                <div className="aggregate-chart">
                  {Object.entries(optimizationResult.aggregate_stats.aggregate_allocation)
                    .sort(([, a], [, b]) => b - a)
                    .map(([asset, weight]) => (
                      <div key={asset} className="aggregate-bar">
                        <div className="asset-label">{asset}</div>
                        <div className="bar-container">
                          <div
                            className="bar-fill"
                            style={{ width: `${weight * 100}%` }}
                          />
                        </div>
                        <div className="bar-value">{formatPercentage(weight)}</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goal Prioritization Tab */}
      {selectedTab === 'prioritization' && (
        <GoalPrioritizationEditor
          goals={goals}
          onPrioritiesChanged={handleOptimize}
        />
      )}

      {/* Tax Optimization Tab */}
      {selectedTab === 'tax-optimization' && optimizationResult && (
        <TaxAwareAllocationView
          userId={userId}
          accountAllocations={optimizationResult.account_allocations}
          accounts={accounts}
        />
      )}

      {/* Household View Tab */}
      {selectedTab === 'household' && optimizationResult && (
        <HouseholdOptimizationView
          optimizationResult={optimizationResult}
          goals={goals}
          accounts={accounts}
        />
      )}

      {/* Trade-offs Tab */}
      {selectedTab === 'tradeoffs' && optimizationResult && (
        <TradeoffAnalysisChart
          goalPortfolios={optimizationResult.goal_portfolios}
          goals={goals}
          totalPortfolioValue={totalPortfolioValue}
        />
      )}

      <style jsx>{`
        .multi-goal-optimization-dashboard {
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
          overflow-x: auto;
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
          white-space: nowrap;
        }

        .tab-nav button:hover {
          color: #1e293b;
        }

        .tab-nav button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .error-banner {
          padding: 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .goal-selection-panel {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .goal-checkboxes {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 20px 0;
        }

        .goal-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .goal-checkbox:hover {
          background: #f1f5f9;
        }

        .goal-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .goal-title {
          font-weight: 600;
          min-width: 200px;
        }

        .goal-details {
          color: #64748b;
          font-size: 14px;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .optimize-button {
          width: 100%;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
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

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .summary-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .card-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }

        .card-value.warning {
          color: #ef4444;
        }

        .goal-allocations-section {
          margin-bottom: 32px;
        }

        .goal-allocations {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }

        .goal-allocation-card {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 16px;
        }

        .goal-header h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .allocation-amount {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
        }

        .funding-bar {
          margin: 16px 0;
        }

        .bar-container {
          height: 12px;
          background: #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .bar-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .bar-label {
          text-align: right;
          font-size: 12px;
          color: #64748b;
        }

        .portfolio-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 16px 0;
        }

        .metric {
          display: flex;
          justify-content: space-between;
        }

        .metric-label {
          font-size: 14px;
          color: #64748b;
        }

        .metric-value {
          font-weight: 600;
        }

        .asset-allocation h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #64748b;
        }

        .allocation-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .asset-label {
          min-width: 120px;
          font-size: 13px;
        }

        .allocation-bar-mini {
          flex: 1;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .bar-fill-mini {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
        }

        .allocation-value {
          min-width: 50px;
          text-align: right;
          font-size: 13px;
          font-weight: 600;
        }

        .aggregate-section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .aggregate-section h2 {
          margin-bottom: 20px;
        }

        .aggregate-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .aggregate-bar .asset-label {
          min-width: 180px;
          font-weight: 500;
        }

        .aggregate-bar .bar-container {
          flex: 1;
          height: 32px;
          background: #f1f5f9;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .aggregate-bar .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #7c3aed);
        }

        .bar-value {
          min-width: 60px;
          text-align: right;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
