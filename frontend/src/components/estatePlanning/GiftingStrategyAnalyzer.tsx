/**
 * Gifting Strategy Analyzer Component
 *
 * Analyzes the impact of annual gifting strategies on estate taxes
 */

import React, { useState } from 'react';
import { estatePlanningApi } from '../../services/estatePlanningApi';
import type {
  GiftingStrategyAnalysis,
  GiftingStrategyForm,
} from '../../types/estatePlanning';

const GiftingStrategyAnalyzer: React.FC = () => {
  const [form, setForm] = useState<GiftingStrategyForm>({
    estateValue: 10000000,
    annualGiftAmount: 50000,
    years: 15,
    expectedReturn: 0.07,
  });

  const [analysis, setAnalysis] = useState<GiftingStrategyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await estatePlanningApi.analyzeGiftingStrategy({
        estate_value: form.estateValue,
        annual_gift_amount: form.annualGiftAmount,
        years: form.years,
        expected_return: form.expectedReturn,
      });

      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze gifting strategy');
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
    <div className="gifting-strategy-analyzer">
      <h2>Gifting Strategy Analyzer</h2>
      <p className="description">
        Analyze the impact of annual gifting on your estate taxes and wealth transfer
      </p>

      {/* Input Form */}
      <div className="input-form">
        <div className="form-row">
          <div className="form-group">
            <label>Current Estate Value</label>
            <input
              type="number"
              name="estateValue"
              value={form.estateValue}
              onChange={handleInputChange}
              step="100000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Annual Gift Amount</label>
            <input
              type="number"
              name="annualGiftAmount"
              value={form.annualGiftAmount}
              onChange={handleInputChange}
              step="10000"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Years of Gifting</label>
            <input
              type="number"
              name="years"
              value={form.years}
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
        </div>

        <button
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Gifting Strategy'}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          <h3>Gifting Strategy Analysis</h3>

          {/* Summary Card */}
          <div className="summary-card">
            <div className="summary-item">
              <div className="summary-label">Tax Savings</div>
              <div className="summary-value positive">
                {formatCurrency(analysis.tax_savings)}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Additional Wealth to Heirs</div>
              <div className="summary-value positive">
                {formatCurrency(analysis.additional_wealth)}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Gifts</div>
              <div className="summary-value">
                {formatCurrency(analysis.total_gifts)}
              </div>
            </div>
          </div>

          {/* Compliance Alert */}
          {!analysis.is_within_annual_exclusion && (
            <div className="alert warning">
              <strong>⚠️ Gift Tax May Apply</strong>
              <p>
                Your annual gift amount of {formatCurrency(analysis.annual_gift_amount)} exceeds
                the annual exclusion limit. Consider consulting with a tax professional.
              </p>
            </div>
          )}

          {analysis.is_within_annual_exclusion && (
            <div className="alert success">
              <strong>✓ Within Annual Exclusion</strong>
              <p>
                Your gifts are within the annual exclusion limit, so no gift tax return is
                required for these gifts.
              </p>
            </div>
          )}

          {/* Comparison */}
          <div className="comparison-section">
            <h4>With vs. Without Gifting Strategy</h4>

            <div className="comparison-grid">
              <div className="comparison-column">
                <div className="column-header without">Without Gifting</div>

                <div className="comparison-item">
                  <span>Future Estate Value</span>
                  <span className="value">
                    {formatCurrency(analysis.estate_without_gifting)}
                  </span>
                </div>

                <div className="comparison-item">
                  <span>Estate Tax</span>
                  <span className="value tax">
                    -{formatCurrency(analysis.tax_without_gifting)}
                  </span>
                </div>

                <div className="comparison-item total">
                  <span>Total Wealth to Heirs</span>
                  <span className="value">
                    {formatCurrency(analysis.wealth_transferred_no_gifts)}
                  </span>
                </div>
              </div>

              <div className="comparison-column">
                <div className="column-header with">With Gifting</div>

                <div className="comparison-item">
                  <span>Future Estate Value</span>
                  <span className="value">
                    {formatCurrency(analysis.estate_with_gifting)}
                  </span>
                </div>

                <div className="comparison-item">
                  <span>Estate Tax</span>
                  <span className="value tax">
                    -{formatCurrency(analysis.tax_with_gifting)}
                  </span>
                </div>

                <div className="comparison-item">
                  <span>Gifts (Future Value)</span>
                  <span className="value">
                    +{formatCurrency(analysis.gifts_future_value)}
                  </span>
                </div>

                <div className="comparison-item total">
                  <span>Total Wealth to Heirs</span>
                  <span className="value positive">
                    {formatCurrency(analysis.wealth_transferred_with_gifts)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="insights-section">
            <h4>Key Insights</h4>
            <ul className="insights-list">
              <li>
                By gifting {formatCurrency(analysis.annual_gift_amount)} annually for{' '}
                {analysis.years_of_gifting} years, you can transfer{' '}
                {formatCurrency(analysis.additional_wealth)} more wealth to your heirs.
              </li>
              <li>
                Your estate tax burden is reduced by {formatCurrency(analysis.tax_savings)},
                saving {((analysis.tax_savings / analysis.tax_without_gifting) * 100).toFixed(1)}%
                in estate taxes.
              </li>
              <li>
                The gifts will grow to {formatCurrency(analysis.gifts_future_value)} in your
                heirs' hands over {analysis.years_of_gifting} years.
              </li>
              {analysis.is_within_annual_exclusion ? (
                <li>
                  Your gifts are within the annual exclusion, so they won't count against your
                  lifetime exemption.
                </li>
              ) : (
                <li>
                  Gifts exceeding the annual exclusion will count against your lifetime estate and
                  gift tax exemption.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .gifting-strategy-analyzer {
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

        .form-group input {
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

        .analyze-button {
          width: 100%;
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }

        .analyze-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .analyze-button:disabled {
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

        .summary-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .summary-item {
          background: white;
          border: 2px solid #e5e7eb;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
        }

        .summary-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
        }

        .summary-value.positive {
          color: #10b981;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .alert.warning {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          color: #92400e;
        }

        .alert.success {
          background: #d1fae5;
          border: 1px solid #10b981;
          color: #047857;
        }

        .alert strong {
          display: block;
          margin-bottom: 0.5rem;
        }

        .alert p {
          margin: 0;
          font-size: 0.875rem;
        }

        .comparison-section,
        .insights-section {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .comparison-section h4,
        .insights-section h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .comparison-column {
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }

        .column-header {
          padding: 1rem;
          font-weight: 600;
          text-align: center;
          color: white;
        }

        .column-header.without {
          background: #6b7280;
        }

        .column-header.with {
          background: #2563eb;
        }

        .comparison-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .comparison-item.total {
          font-weight: 600;
          background: #f9fafb;
          border-top: 2px solid #9ca3af;
        }

        .comparison-item .value.tax {
          color: #dc2626;
        }

        .comparison-item .value.positive {
          color: #10b981;
        }

        .insights-list {
          list-style: disc;
          padding-left: 1.5rem;
        }

        .insights-list li {
          margin-bottom: 0.75rem;
          color: #374151;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .summary-card {
            grid-template-columns: 1fr;
          }

          .comparison-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GiftingStrategyAnalyzer;
