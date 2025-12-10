/**
 * Goal Prioritization Editor
 *
 * Interface for managing goal priorities to influence capital allocation
 * in multi-goal optimization. Higher priority goals receive funding first.
 */

import React, { useState } from 'react';
import { getPriorityColor, formatCurrency } from '../../services/multiGoalOptimizationApi';

interface Goal {
  id: string;
  title: string;
  category: string;
  priority: 'essential' | 'important' | 'aspirational';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

interface GoalPrioritizationEditorProps {
  goals: Goal[];
  onPrioritiesChanged: () => void;
}

type PriorityLevel = 'essential' | 'important' | 'aspirational';

const PRIORITY_DESCRIPTIONS: Record<PriorityLevel, string> = {
  essential: 'Must achieve - Highest funding priority (e.g., retirement income, emergency fund)',
  important: 'Should achieve - Medium priority (e.g., education, home down payment)',
  aspirational: 'Nice to achieve - Lower priority (e.g., vacation home, luxury purchase)',
};

const PRIORITY_ORDER: PriorityLevel[] = ['essential', 'important', 'aspirational'];

export const GoalPrioritizationEditor: React.FC<GoalPrioritizationEditorProps> = ({
  goals,
  onPrioritiesChanged,
}) => {
  const [localGoals, setLocalGoals] = useState(goals);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePriorityChange = (goalId: string, newPriority: PriorityLevel) => {
    setLocalGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId ? { ...goal, priority: newPriority } : goal
      )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real implementation, this would call an API to update priorities
    // For now, we just trigger the optimization callback
    onPrioritiesChanged();
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalGoals(goals);
    setHasChanges(false);
  };

  // Group goals by priority
  const goalsByPriority = PRIORITY_ORDER.map((priority) => ({
    priority,
    goals: localGoals.filter((g) => g.priority === priority),
  }));

  // Calculate total target amounts by priority
  const totalsByPriority = PRIORITY_ORDER.map((priority) => {
    const total = localGoals
      .filter((g) => g.priority === priority)
      .reduce((sum, g) => sum + g.targetAmount, 0);
    return { priority, total };
  });

  const grandTotal = totalsByPriority.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="goal-prioritization-editor">
      <div className="editor-header">
        <div>
          <h2>Goal Prioritization</h2>
          <p className="subtitle">
            Drag and drop goals to change priorities, or use the dropdowns.
            Higher priority goals receive funding first.
          </p>
        </div>
        {hasChanges && (
          <div className="action-buttons">
            <button onClick={handleReset} className="reset-button">
              Reset Changes
            </button>
            <button onClick={handleSave} className="save-button">
              Save & Re-optimize
            </button>
          </div>
        )}
      </div>

      {/* Priority Explanation Cards */}
      <div className="priority-explanation">
        {PRIORITY_ORDER.map((priority) => (
          <div
            key={priority}
            className="priority-card"
            style={{ borderLeftColor: getPriorityColor(priority) }}
          >
            <div className="priority-header">
              <span
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(priority) }}
              >
                {priority}
              </span>
              <span className="priority-count">
                {localGoals.filter((g) => g.priority === priority).length} goals
              </span>
            </div>
            <p className="priority-description">{PRIORITY_DESCRIPTIONS[priority]}</p>
          </div>
        ))}
      </div>

      {/* Priority Allocation Summary */}
      <div className="allocation-summary">
        <h3>Target Allocation by Priority</h3>
        <div className="summary-bars">
          {totalsByPriority.map(({ priority, total }) => {
            const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
            return (
              <div key={priority} className="summary-row">
                <div className="summary-label">
                  <span
                    className="priority-badge-small"
                    style={{ backgroundColor: getPriorityColor(priority) }}
                  >
                    {priority}
                  </span>
                  <span className="summary-amount">{formatCurrency(total)}</span>
                </div>
                <div className="summary-bar-container">
                  <div
                    className="summary-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getPriorityColor(priority),
                    }}
                  />
                  <span className="summary-percentage">{percentage.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals Grouped by Priority */}
      <div className="goals-by-priority">
        {goalsByPriority.map(({ priority, goals: priorityGoals }) => (
          <div key={priority} className="priority-group">
            <div className="group-header">
              <h3>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(priority) }}
                >
                  {priority}
                </span>
                <span className="goal-count">{priorityGoals.length} goals</span>
              </h3>
            </div>

            {priorityGoals.length === 0 ? (
              <div className="empty-state">
                <p>No {priority} goals. Drag goals here or use the dropdown to change priority.</p>
              </div>
            ) : (
              <div className="goal-list">
                {priorityGoals.map((goal) => (
                  <div key={goal.id} className="goal-item">
                    <div className="goal-content">
                      <div className="goal-info">
                        <h4>{goal.title}</h4>
                        <div className="goal-details">
                          <span className="category-badge">{goal.category}</span>
                          <span className="target-amount">
                            {formatCurrency(goal.targetAmount)}
                          </span>
                          <span className="target-date">
                            by {new Date(goal.targetDate).getFullYear()}
                          </span>
                        </div>
                      </div>

                      <div className="goal-actions">
                        <select
                          value={goal.priority}
                          onChange={(e) =>
                            handlePriorityChange(goal.id, e.target.value as PriorityLevel)
                          }
                          className="priority-select"
                        >
                          {PRIORITY_ORDER.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="funding-status">
                      <div className="status-bar">
                        <div
                          className="status-bar-fill"
                          style={{
                            width: `${(goal.currentAmount / goal.targetAmount) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="status-text">
                        {formatCurrency(goal.currentAmount)} /{' '}
                        {formatCurrency(goal.targetAmount)} (
                        {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .goal-prioritization-editor {
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 24px;
        }

        .editor-header h2 {
          margin-bottom: 8px;
        }

        .subtitle {
          color: #64748b;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .reset-button,
        .save-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reset-button {
          background: #f1f5f9;
          color: #475569;
        }

        .reset-button:hover {
          background: #e2e8f0;
        }

        .save-button {
          background: #3b82f6;
          color: white;
        }

        .save-button:hover {
          background: #2563eb;
        }

        .priority-explanation {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .priority-card {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .priority-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge-small {
          padding: 2px 8px;
          border-radius: 8px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-count {
          font-size: 13px;
          color: #64748b;
        }

        .priority-description {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
        }

        .allocation-summary {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 32px;
        }

        .allocation-summary h3 {
          margin-bottom: 16px;
          font-size: 16px;
        }

        .summary-row {
          margin-bottom: 12px;
        }

        .summary-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .summary-amount {
          font-weight: 600;
        }

        .summary-bar-container {
          height: 24px;
          background: white;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .summary-bar-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .summary-percentage {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: 600;
        }

        .priority-group {
          margin-bottom: 32px;
        }

        .group-header h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .goal-count {
          font-size: 14px;
          color: #64748b;
          font-weight: normal;
        }

        .empty-state {
          padding: 48px;
          text-align: center;
          background: #f8fafc;
          border-radius: 8px;
          border: 2px dashed #cbd5e1;
        }

        .empty-state p {
          color: #64748b;
        }

        .goal-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .goal-item {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .goal-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .goal-content {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .goal-info h4 {
          font-size: 16px;
          margin-bottom: 8px;
        }

        .goal-details {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .category-badge {
          padding: 4px 8px;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .target-amount,
        .target-date {
          font-size: 13px;
          color: #64748b;
        }

        .priority-select {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-transform: capitalize;
        }

        .priority-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .funding-status {
          margin-top: 12px;
        }

        .status-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .status-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.3s;
        }

        .status-text {
          font-size: 12px;
          color: #64748b;
          text-align: right;
        }
      `}</style>
    </div>
  );
};
