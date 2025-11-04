/**
 * 529 Plan Calculator Component
 *
 * Interactive calculator for 529 plan contribution strategies with tax savings visualization.
 * Implements REQ-GOAL-013: 529 plan optimization.
 */

import React, { useState, useEffect } from 'react';
import { educationFundingApi } from '../../services/educationFundingApi';
import type {
  Plan529Request,
  Plan529Response,
  TotalEducationNeedRequest,
  SavingsVehicleResponse,
} from '../../services/educationFundingApi';

interface Plan529CalculatorProps {
  childName?: string;
  childAge?: number;
  educationType?: string;
}

export const Plan529Calculator: React.FC<Plan529CalculatorProps> = ({
  childName = 'Child',
  childAge = 5,
  educationType = 'public_in_state',
}) => {
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [yearsUntilCollege, setYearsUntilCollege] = useState<number>(Math.max(0, 18 - childAge));
  const [expectedReturn, setExpectedReturn] = useState<number>(0.06);
  const [stateTaxDeduction, setStateTaxDeduction] = useState<number>(0.05);
  const [strategy, setStrategy] = useState<Plan529Response | null>(null);
  const [vehicleRecommendation, setVehicleRecommendation] = useState<SavingsVehicleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCalculateTarget, setAutoCalculateTarget] = useState(true);

  // Auto-calculate target amount based on education type
  useEffect(() => {
    if (autoCalculateTarget && educationType && childAge >= 0) {
      calculateTargetAmount();
    }
  }, [educationType, childAge, autoCalculateTarget]);

  const calculateTargetAmount = async () => {
    try {
      const request: TotalEducationNeedRequest = {
        education_type: educationType,
        child_age: childAge,
        college_start_age: 18,
        years_of_support: 4,
      };
      const response = await educationFundingApi.calculateTotalNeed(request);
      setTargetAmount(Math.round(response.total_need));
    } catch (err) {
      console.error('Failed to calculate target amount:', err);
    }
  };

  const calculateStrategy = async () => {
    if (targetAmount <= 0 || yearsUntilCollege <= 0) {
      setError('Please enter valid target amount and years until college');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: Plan529Request = {
        target_amount: targetAmount,
        current_savings: currentSavings,
        years_until_college: yearsUntilCollege,
        expected_return: expectedReturn,
        state_tax_deduction: stateTaxDeduction,
      };

      const [strategyResult, vehicleResult] = await Promise.all([
        educationFundingApi.calculate529Strategy(request),
        educationFundingApi.getSavingsVehicleRecommendation({
          years_until_college: yearsUntilCollege,
        }),
      ]);

      setStrategy(strategyResult);
      setVehicleRecommendation(vehicleResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate strategy');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="plan-529-calculator">
      <div className="calculator-header">
        <h2>529 Plan Calculator</h2>
        <p className="subtitle">
          Calculate optimal contribution strategy for {childName}'s education
        </p>
      </div>

      <div className="calculator-form card">
        <div className="form-section">
          <h3>Education Goal</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Target Amount</label>
              <div className="input-with-toggle">
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => {
                      setTargetAmount(parseFloat(e.target.value) || 0);
                      setAutoCalculateTarget(false);
                    }}
                    min="0"
                    step="1000"
                    className="form-control"
                    disabled={autoCalculateTarget}
                  />
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={autoCalculateTarget}
                    onChange={(e) => setAutoCalculateTarget(e.target.checked)}
                  />
                  Auto-calculate
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Current 529 Balance</label>
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1000"
                  className="form-control"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Years Until College</label>
              <input
                type="number"
                value={yearsUntilCollege}
                onChange={(e) => setYearsUntilCollege(parseInt(e.target.value) || 0)}
                min="0"
                max="25"
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Investment Assumptions</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Expected Annual Return</label>
              <div className="slider-group">
                <input
                  type="range"
                  value={expectedReturn * 100}
                  onChange={(e) => setExpectedReturn(parseFloat(e.target.value) / 100)}
                  min="0"
                  max="12"
                  step="0.5"
                  className="slider"
                />
                <span className="slider-value">{formatPercent(expectedReturn)}</span>
              </div>
            </div>

            <div className="form-group">
              <label>State Tax Deduction</label>
              <div className="slider-group">
                <input
                  type="range"
                  value={stateTaxDeduction * 100}
                  onChange={(e) => setStateTaxDeduction(parseFloat(e.target.value) / 100)}
                  min="0"
                  max="10"
                  step="0.5"
                  className="slider"
                />
                <span className="slider-value">{formatPercent(stateTaxDeduction)}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={calculateStrategy}
          disabled={loading || targetAmount <= 0 || yearsUntilCollege <= 0}
          className="btn btn-primary btn-large"
        >
          {loading ? 'Calculating...' : 'Calculate Strategy'}
        </button>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
      </div>

      {strategy && (
        <div className="results-section">
          <div className="card">
            <h3>Recommended Strategy</h3>

            <div className="strategy-overview">
              <div className="stat-card highlight">
                <span className="stat-label">Monthly Contribution</span>
                <span className="stat-value">{formatCurrency(strategy.monthly_contribution)}</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Annual Contribution</span>
                <span className="stat-value">{formatCurrency(strategy.annual_contribution)}</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Total Contributions</span>
                <span className="stat-value">{formatCurrency(strategy.total_contributions)}</span>
              </div>

              <div className="stat-card success">
                <span className="stat-label">Tax Savings</span>
                <span className="stat-value">{formatCurrency(strategy.tax_savings)}</span>
              </div>
            </div>

            <div className="recommendation-box">
              <div className="recommendation-icon">💡</div>
              <p>{strategy.recommendation}</p>
            </div>

            {strategy.projected_balance > targetAmount && (
              <div className="alert alert-success">
                You're on track to exceed your goal! Projected balance: {formatCurrency(strategy.projected_balance)}
              </div>
            )}

            {strategy.shortfall > 0 && (
              <div className="alert alert-warning">
                Shortfall: {formatCurrency(strategy.shortfall)}. Consider increasing contributions or adjusting expectations.
              </div>
            )}
          </div>

          {vehicleRecommendation && (
            <div className="card">
              <h3>Savings Vehicle Recommendation</h3>

              <div className="vehicle-recommendation">
                <div className="vehicle-header">
                  <h4>{vehicleRecommendation.vehicle}</h4>
                  <p className="rationale">{vehicleRecommendation.rationale}</p>
                </div>

                <div className="pros-cons">
                  <div className="pros">
                    <h5>Advantages</h5>
                    <ul>
                      {vehicleRecommendation.pros.map((pro, index) => (
                        <li key={index}>✓ {pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="cons">
                    <h5>Considerations</h5>
                    <ul>
                      {vehicleRecommendation.cons.map((con, index) => (
                        <li key={index}>⚠ {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .plan-529-calculator {
          max-width: 900px;
          margin: 0 auto;
        }

        .calculator-header {
          margin-bottom: 2rem;
        }

        .calculator-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #718096;
          font-size: 1rem;
        }

        .card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section:last-of-type {
          margin-bottom: 1rem;
        }

        .form-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 1rem 0;
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
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .form-control {
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-control:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .form-control:disabled {
          background: #f7fafc;
          color: #a0aec0;
        }

        .input-with-prefix {
          display: flex;
          align-items: center;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .input-with-prefix .prefix {
          background: #f7fafc;
          padding: 0.5rem 0.75rem;
          border-right: 1px solid #cbd5e0;
          font-weight: 500;
          color: #4a5568;
        }

        .input-with-prefix .form-control {
          border: none;
          flex: 1;
        }

        .input-with-toggle {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #4a5568;
          cursor: pointer;
        }

        .toggle-label input[type="checkbox"] {
          cursor: pointer;
        }

        .slider-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .slider {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #e2e8f0;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #4299e1;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #4299e1;
          cursor: pointer;
          border: none;
        }

        .slider-value {
          font-weight: 600;
          color: #2d3748;
          min-width: 50px;
          text-align: right;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4299e1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3182ce;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-large {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          width: 100%;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .alert-error {
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #fc8181;
        }

        .alert-success {
          background: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .alert-warning {
          background: #fefcbf;
          color: #744210;
          border: 1px solid #fbd38d;
        }

        .strategy-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-card.highlight {
          background: #ebf8ff;
          border: 2px solid #4299e1;
        }

        .stat-card.success {
          background: #f0fff4;
          border: 2px solid #48bb78;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #718096;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
        }

        .recommendation-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .recommendation-icon {
          font-size: 2rem;
        }

        .recommendation-box p {
          margin: 0;
          font-size: 1rem;
          line-height: 1.5;
        }

        .vehicle-recommendation {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .vehicle-header h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.5rem 0;
        }

        .rationale {
          color: #718096;
          margin: 0;
        }

        .pros-cons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .pros h5,
        .cons h5 {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.75rem 0;
        }

        .pros ul,
        .cons ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .pros li,
        .cons li {
          padding: 0.5rem 0;
          font-size: 0.875rem;
          color: #4a5568;
          line-height: 1.5;
        }

        .pros li {
          color: #2f855a;
        }

        .cons li {
          color: #c05621;
        }
      `}</style>
    </div>
  );
};
