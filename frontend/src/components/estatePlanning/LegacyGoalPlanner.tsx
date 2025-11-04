/**
 * Legacy Goal Planner Component
 *
 * Calculates funding requirements for legacy goals
 */

import React, { useState } from 'react';
import { estatePlanningApi } from '../../services/estatePlanningApi';
import type {
  LegacyGoalAnalysis,
  LegacyGoalForm,
} from '../../types/estatePlanning';

const LegacyGoalPlanner: React.FC = () => {
  const [form, setForm] = useState<LegacyGoalForm>({
    desiredLegacyAmount: 2000000,
    currentEstateValue: 1500000,
    yearsToLegacy: 20,
    expectedReturn: 0.07,
    state: 'NY',
  });

  const [analysis, setAnalysis] = useState<LegacyGoalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'state' ? value : parseFloat(value) || 0,
    }));
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await estatePlanningApi.calculateLegacyGoal({
        desired_legacy_amount: form.desiredLegacyAmount,
        current_estate_value: form.currentEstateValue,
        years_to_legacy: form.yearsToLegacy,
        expected_return: form.expectedReturn,
        state: form.state || undefined,
      });

      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate legacy goal');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="legacy-goal-planner">
      <h2>Legacy Goal Planner</h2>
      <p className="description">
        Calculate what you need to save to achieve your legacy goals
      </p>

      {/* Input Form */}
      <div className="input-form">
        <div className="form-row">
          <div className="form-group">
            <label>Desired Legacy Amount</label>
            <input
              type="number"
              name="desiredLegacyAmount"
              value={form.desiredLegacyAmount}
              onChange={handleInputChange}
              step="100000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Current Estate Value</label>
            <input
              type="number"
              name="currentEstateValue"
              value={form.currentEstateValue}
              onChange={handleInputChange}
              step="100000"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Years to Legacy Event</label>
            <input
              type="number"
              name="yearsToLegacy"
              value={form.yearsToLegacy}
              onChange={handleInputChange}
              min="1"
              max="50"
            />
          </div>

          <div className="form-group">
            <label>Expected Annual Return</label>
            <input
              type="number"
              name="expectedReturn"
              value={form.expectedReturn}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="0.20"
            />
            <span className="helper-text">{formatPercent(form.expectedReturn)}</span>
          </div>

          <div className="form-group">
            <label>State</label>
            <select name="state" value={form.state} onChange={handleInputChange}>
              <option value="">No State Tax</option>
              <option value="MA">Massachusetts</option>
              <option value="NY">New York</option>
              <option value="OR">Oregon</option>
              <option value="WA">Washington</option>
              <option value="IL">Illinois</option>
              <option value="CT">Connecticut</option>
            </select>
          </div>
        </div>

        <button
          className="calculate-button"
          onClick={handleCalculate}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Calculate Legacy Goal'}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          <h3>Legacy Goal Analysis</h3>

          {/* Status Card */}
          <div className={`status-card ${analysis.is_on_track ? 'on-track' : 'off-track'}`}>
            <div className="status-icon">
              {analysis.is_on_track ? '✓' : '⚠'}
            </div>
            <div className="status-content">
              <div className="status-label">
                {analysis.is_on_track ? 'On Track' : 'Needs Attention'}
              </div>
              <div className="status-message">
                {analysis.is_on_track
                  ? `You're projected to exceed your legacy goal by ${formatCurrency(analysis.surplus)}`
                  : `You have a shortfall of ${formatCurrency(analysis.shortfall)} to reach your goal`}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Desired Net Legacy</div>
              <div className="metric-value">{formatCurrency(analysis.desired_legacy)}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Estimated Estate Tax</div>
              <div className="metric-value tax">
                {formatCurrency(analysis.estimated_estate_tax)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Gross Estate Needed</div>
              <div className="metric-value">{formatCurrency(analysis.gross_estate_needed)}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Projected Estate Value</div>
              <div className="metric-value positive">
                {formatCurrency(analysis.projected_estate_value)}
              </div>
            </div>
          </div>

          {/* Savings Required */}
          {!analysis.is_on_track && (
            <div className="savings-section">
              <h4>Savings Required to Close Gap</h4>
              <div className="savings-grid">
                <div className="savings-item">
                  <span className="savings-label">Annual Savings Needed</span>
                  <span className="savings-amount">
                    {formatCurrency(analysis.annual_savings_needed)}
                  </span>
                </div>
                <div className="savings-item">
                  <span className="savings-label">Monthly Savings Needed</span>
                  <span className="savings-amount">
                    {formatCurrency(analysis.monthly_savings_needed)}
                  </span>
                </div>
                <div className="savings-item">
                  <span className="savings-label">Life Insurance Alternative</span>
                  <span className="savings-amount">
                    {formatCurrency(analysis.life_insurance_alternative)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Funding Strategies */}
          {analysis.funding_strategies.length > 0 && (
            <div className="strategies-section">
              <h4>Recommended Funding Strategies</h4>
              <div className="strategies-list">
                {analysis.funding_strategies.map((strategy, index) => (
                  <div key={index} className="strategy-item">
                    <div className="strategy-header">
                      <span className="strategy-name">
                        {strategy.strategy.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className={`priority-badge priority-${strategy.priority}`}>
                        {strategy.priority}
                      </span>
                    </div>
                    <div className="strategy-description">{strategy.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .legacy-goal-planner {
          max-width: 1000px;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .description {
          color: #666;
          margin-bottom: 2rem;
        }

        .input-form {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-group input,
        .form-group select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 1rem;
        }

        .helper-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .calculate-button {
          width: 100%;
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }

        .calculate-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .calculate-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          padding: 1rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .analysis-results h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .status-card.on-track {
          background: #d1fae5;
          border: 2px solid #10b981;
        }

        .status-card.off-track {
          background: #fef3c7;
          border: 2px solid #f59e0b;
        }

        .status-icon {
          font-size: 2rem;
          font-weight: bold;
        }

        .status-card.on-track .status-icon {
          color: #10b981;
        }

        .status-card.off-track .status-icon {
          color: #f59e0b;
        }

        .status-label {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .status-card.on-track .status-label {
          color: #047857;
        }

        .status-card.off-track .status-label {
          color: #92400e;
        }

        .status-message {
          color: #374151;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .metric-card {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 1rem;
          border-radius: 8px;
        }

        .metric-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 1.25rem;
          font-weight: bold;
          color: #111827;
        }

        .metric-value.tax {
          color: #dc2626;
        }

        .metric-value.positive {
          color: #10b981;
        }

        .savings-section,
        .strategies-section {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .savings-section h4,
        .strategies-section h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .savings-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .savings-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: white;
          border-radius: 4px;
        }

        .savings-label {
          color: #374151;
        }

        .savings-amount {
          font-weight: 600;
          color: #2563eb;
        }

        .strategies-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .strategy-item {
          background: white;
          padding: 1rem;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .strategy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .strategy-name {
          font-weight: 600;
          color: #111827;
        }

        .priority-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge.priority-high {
          background: #fee2e2;
          color: #dc2626;
        }

        .priority-badge.priority-medium {
          background: #fef3c7;
          color: #d97706;
        }

        .priority-badge.priority-low {
          background: #dbeafe;
          color: #2563eb;
        }

        .strategy-description {
          color: #6b7280;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .status-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default LegacyGoalPlanner;
