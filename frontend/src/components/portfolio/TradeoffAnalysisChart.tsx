/**
 * Tradeoff Analysis Chart
 *
 * Visualizes the trade-offs between different goals when portfolio value
 * is insufficient to fully fund all goals. Shows how increasing one goal's
 * allocation impacts other goals.
 */

import React, { useState } from 'react';
import { BanknotesIcon, FlagIcon, CalendarIcon } from '@heroicons/react/24/outline';
import {
  formatCurrency,
  formatPercentage,
  getPriorityColor,
  calculateFundingLevel,
} from '../../services/multiGoalOptimizationApi';
import type { GoalPortfolio } from '../../types/multiGoalOptimization';

interface Goal {
  id: string;
  title: string;
  category: string;
  priority: 'essential' | 'important' | 'aspirational';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

interface TradeoffAnalysisChartProps {
  goalPortfolios: GoalPortfolio[];
  goals: Goal[];
  totalPortfolioValue: number;
}

interface TradeoffScenario {
  name: string;
  description: string;
  allocations: { [goalId: string]: number };
}

export const TradeoffAnalysisChart: React.FC<TradeoffAnalysisChartProps> = ({
  goalPortfolios,
  goals,
  totalPortfolioValue,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goalPortfolios[0]?.goal_id || '');
  const [allocationAdjustment, setAllocationAdjustment] = useState<number>(0);

  // Calculate total target amount
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const isUnderfunded = totalPortfolioValue < totalTargetAmount;

  // Calculate current allocations as percentages
  const currentAllocations = goalPortfolios.reduce((acc, portfolio) => {
    acc[portfolio.goal_id] = portfolio.allocated_amount;
    return acc;
  }, {} as { [goalId: string]: number });

  // Create tradeoff scenarios
  const scenarios: TradeoffScenario[] = [
    {
      name: 'Current Optimization',
      description: 'Allocation based on priority and time horizon',
      allocations: { ...currentAllocations },
    },
    {
      name: 'Equal Distribution',
      description: 'Equal allocation to all goals',
      allocations: goalPortfolios.reduce((acc, portfolio) => {
        acc[portfolio.goal_id] = totalPortfolioValue / goalPortfolios.length;
        return acc;
      }, {} as { [goalId: string]: number }),
    },
    {
      name: 'Priority-Only',
      description: 'Fund essential goals first, then others',
      allocations: (() => {
        const allocs: { [goalId: string]: number } = {};
        let remaining = totalPortfolioValue;

        // Sort goals by priority
        const sortedGoals = [...goals].sort((a, b) => {
          const priorityOrder = { essential: 0, important: 1, aspirational: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        sortedGoals.forEach((goal) => {
          const needed = goal.targetAmount;
          allocs[goal.id] = Math.min(needed, remaining);
          remaining -= allocs[goal.id];
        });

        return allocs;
      })(),
    },
  ];

  const [selectedScenario, setSelectedScenario] = useState<string>('Current Optimization');

  const currentScenario = scenarios.find((s) => s.name === selectedScenario) || scenarios[0];

  // Calculate what happens if we adjust selected goal's allocation
  const calculateAdjustedAllocations = () => {
    const adjustedAllocations = { ...currentAllocations };
    const selectedGoal = goalPortfolios.find((p) => p.goal_id === selectedGoalId);

    if (!selectedGoal) return adjustedAllocations;

    const adjustmentAmount = (allocationAdjustment / 100) * selectedGoal.allocated_amount;
    adjustedAllocations[selectedGoalId] += adjustmentAmount;

    // Distribute the adjustment across other goals proportionally
    const otherGoals = goalPortfolios.filter((p) => p.goal_id !== selectedGoalId);
    const totalOtherAllocations = otherGoals.reduce(
      (sum, p) => sum + currentAllocations[p.goal_id],
      0
    );

    otherGoals.forEach((portfolio) => {
      const proportion = currentAllocations[portfolio.goal_id] / totalOtherAllocations;
      adjustedAllocations[portfolio.goal_id] -= adjustmentAmount * proportion;
    });

    return adjustedAllocations;
  };

  const adjustedAllocations = allocationAdjustment !== 0
    ? calculateAdjustedAllocations()
    : currentScenario.allocations;

  return (
    <div className="tradeoff-analysis-chart">
      <div className="analysis-header">
        <h2>Goal Trade-off Analysis</h2>
        <p className="subtitle">
          {isUnderfunded
            ? 'Portfolio is underfunded. Explore allocation trade-offs between goals.'
            : 'Portfolio can fully fund all goals. Trade-off analysis shows alternative allocations.'}
        </p>
      </div>

      {/* Portfolio Status */}
      <div className="portfolio-status">
        <div className="status-card">
          <div className="card-label">Total Portfolio Value</div>
          <div className="card-value">{formatCurrency(totalPortfolioValue)}</div>
        </div>

        <div className="status-card">
          <div className="card-label">Total Target Amount</div>
          <div className="card-value">{formatCurrency(totalTargetAmount)}</div>
        </div>

        <div className={`status-card ${isUnderfunded ? 'warning' : 'success'}`}>
          <div className="card-label">Funding Gap</div>
          <div className="card-value">
            {isUnderfunded
              ? formatCurrency(totalTargetAmount - totalPortfolioValue)
              : 'Fully Funded'}
          </div>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="scenario-selector">
        <h3>Allocation Strategies</h3>
        <div className="scenario-buttons">
          {scenarios.map((scenario) => (
            <button
              key={scenario.name}
              className={selectedScenario === scenario.name ? 'active' : ''}
              onClick={() => setSelectedScenario(scenario.name)}
            >
              <div className="scenario-name">{scenario.name}</div>
              <div className="scenario-description">{scenario.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Adjustment */}
      <div className="interactive-adjustment">
        <h3>What-If Analysis</h3>
        <div className="adjustment-controls">
          <div className="control-group">
            <label>Select Goal to Adjust:</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
            >
              {goalPortfolios.map((portfolio) => {
                const goal = goals.find((g) => g.id === portfolio.goal_id);
                return (
                  <option key={portfolio.goal_id} value={portfolio.goal_id}>
                    {portfolio.goal_title} - {formatCurrency(portfolio.allocated_amount)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="control-group">
            <label>
              Adjust Allocation: {allocationAdjustment > 0 ? '+' : ''}
              {allocationAdjustment}%
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={allocationAdjustment}
              onChange={(e) => setAllocationAdjustment(parseInt(e.target.value))}
            />
            <div className="range-labels">
              <span>-50%</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
          </div>

          <button
            className="reset-button"
            onClick={() => setAllocationAdjustment(0)}
            disabled={allocationAdjustment === 0}
          >
            Reset Adjustment
          </button>
        </div>
      </div>

      {/* Allocation Comparison Chart */}
      <div className="allocation-comparison">
        <h3>Allocation Comparison</h3>
        <div className="comparison-table">
          <div className="table-header">
            <div className="col-goal">Goal</div>
            <div className="col-target">Target</div>
            <div className="col-allocation">Allocation</div>
            <div className="col-funding">Funding Level</div>
            <div className="col-impact">Impact</div>
          </div>

          {goalPortfolios.map((portfolio) => {
            const goal = goals.find((g) => g.id === portfolio.goal_id);
            if (!goal) return null;

            const originalAmount = currentAllocations[portfolio.goal_id];
            const newAmount = adjustedAllocations[portfolio.goal_id];
            const change = newAmount - originalAmount;
            const changePercent = (change / originalAmount) * 100;

            const originalFundingLevel = calculateFundingLevel(originalAmount, goal.targetAmount);
            const newFundingLevel = calculateFundingLevel(newAmount, goal.targetAmount);
            const fundingChange = newFundingLevel - originalFundingLevel;

            return (
              <div key={portfolio.goal_id} className="table-row">
                <div className="col-goal">
                  <div className="goal-info">
                    <span className="goal-name">{portfolio.goal_title}</span>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {goal.priority}
                    </span>
                  </div>
                </div>

                <div className="col-target">{formatCurrency(goal.targetAmount)}</div>

                <div className="col-allocation">
                  <div className="allocation-value">
                    {formatCurrency(newAmount)}
                    {change !== 0 && (
                      <span className={`change ${change > 0 ? 'positive' : 'negative'}`}>
                        {change > 0 ? '+' : ''}
                        {formatCurrency(Math.abs(change))}
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-funding">
                  <div className="funding-bar-container">
                    <div
                      className="funding-bar"
                      style={{
                        width: `${Math.min(newFundingLevel * 100, 100)}%`,
                        backgroundColor: getPriorityColor(goal.priority),
                      }}
                    />
                  </div>
                  <div className="funding-percentage">
                    {formatPercentage(newFundingLevel)}
                  </div>
                </div>

                <div className="col-impact">
                  {change !== 0 ? (
                    <div className={`impact ${change > 0 ? 'positive' : 'negative'}`}>
                      <span className="impact-icon">{change > 0 ? '↑' : '↓'}</span>
                      <span className="impact-value">
                        {Math.abs(fundingChange * 100).toFixed(1)}pp
                      </span>
                    </div>
                  ) : (
                    <span className="no-change">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {isUnderfunded && (
        <div className="recommendations-section">
          <h3>Recommendations</h3>
          <div className="recommendation-cards">
            <div className="recommendation-card">
              <div className="rec-icon">
                <BanknotesIcon className="w-8 h-8 text-green-600" />
              </div>
              <h4>Increase Contributions</h4>
              <p>
                Consider increasing monthly contributions by{' '}
                {formatCurrency((totalTargetAmount - totalPortfolioValue) / (30 * 12))} to
                fully fund all goals over 30 years.
              </p>
            </div>

            <div className="recommendation-card">
              <div className="rec-icon">
                <FlagIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h4>Adjust Goal Priorities</h4>
              <p>
                Review goal priorities to ensure essential goals are fully funded first.
                Consider delaying aspirational goals.
              </p>
            </div>

            <div className="recommendation-card">
              <div className="rec-icon">
                <CalendarIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h4>Extend Timelines</h4>
              <p>
                Extending goal timelines by a few years can significantly reduce required
                monthly contributions while maintaining success probability.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tradeoff-analysis-chart {
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .analysis-header {
          margin-bottom: 24px;
        }

        .analysis-header h2 {
          margin-bottom: 8px;
        }

        .subtitle {
          color: #64748b;
          font-size: 14px;
        }

        .portfolio-status {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .status-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .status-card.warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
        }

        .status-card.success {
          background: #d1fae5;
          border-left: 4px solid #10b981;
        }

        .card-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 28px;
          font-weight: 700;
        }

        .scenario-selector {
          margin-bottom: 32px;
        }

        .scenario-selector h3 {
          margin-bottom: 16px;
        }

        .scenario-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .scenario-buttons button {
          padding: 16px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .scenario-buttons button:hover {
          border-color: #3b82f6;
        }

        .scenario-buttons button.active {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .scenario-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .scenario-description {
          font-size: 13px;
          color: #64748b;
        }

        .interactive-adjustment {
          padding: 24px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 32px;
        }

        .interactive-adjustment h3 {
          margin-bottom: 20px;
        }

        .adjustment-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .control-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .control-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
        }

        .control-group input[type='range'] {
          width: 100%;
          margin-top: 8px;
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        .reset-button {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .reset-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .reset-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .allocation-comparison {
          margin-bottom: 32px;
        }

        .allocation-comparison h3 {
          margin-bottom: 16px;
        }

        .comparison-table {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1.5fr 1fr;
          gap: 16px;
          padding: 12px;
          align-items: center;
        }

        .table-header {
          background: #f1f5f9;
          font-weight: 600;
          font-size: 13px;
          color: #475569;
          border-radius: 6px;
        }

        .table-row {
          background: #f8fafc;
          border-radius: 6px;
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
          padding: 2px 8px;
          border-radius: 8px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .allocation-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .change {
          font-size: 12px;
          font-weight: 600;
        }

        .change.positive {
          color: #10b981;
        }

        .change.negative {
          color: #ef4444;
        }

        .funding-bar-container {
          height: 12px;
          background: #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .funding-bar {
          height: 100%;
          transition: width 0.3s;
        }

        .funding-percentage {
          font-size: 12px;
          color: #64748b;
        }

        .impact {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }

        .impact.positive {
          color: #10b981;
        }

        .impact.negative {
          color: #ef4444;
        }

        .impact-icon {
          font-size: 18px;
        }

        .no-change {
          color: #94a3b8;
        }

        .recommendations-section h3 {
          margin-bottom: 16px;
        }

        .recommendation-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .recommendation-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .rec-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .recommendation-card h4 {
          font-size: 16px;
          margin-bottom: 8px;
        }

        .recommendation-card p {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};
