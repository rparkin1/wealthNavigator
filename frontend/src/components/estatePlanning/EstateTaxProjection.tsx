/**
 * Estate Tax Projection Component
 *
 * Calculates and displays federal and state estate tax projections
 * with interactive form for user inputs
 */

import React, { useState } from 'react';
import { estatePlanningApi } from '../../services/estatePlanningApi';
import type {
  EstateTaxCalculation,
  EstateTaxForm,
} from '../../types/estatePlanning';

const EstateTaxProjection: React.FC = () => {
  const [form, setForm] = useState<EstateTaxForm>({
    estateValue: 5000000,
    state: 'NY',
    maritalStatus: 'married',
    charitableDonations: 0,
    lifeInsuranceValue: 0,
    debtValue: 0,
  });

  const [calculation, setCalculation] = useState<EstateTaxCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'maritalStatus' || name === 'state' ? value : parseFloat(value) || 0,
    }));
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await estatePlanningApi.calculateEstateTax({
        estate_value: form.estateValue,
        state: form.state || undefined,
        marital_status: form.maritalStatus,
        charitable_donations: form.charitableDonations,
        life_insurance_value: form.lifeInsuranceValue,
        debt_value: form.debtValue,
      });

      setCalculation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate estate tax');
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
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="estate-tax-projection">
      <h2>Estate Tax Projection</h2>
      <p className="description">
        Calculate federal and state estate taxes based on your circumstances
      </p>

      {/* Input Form */}
      <div className="input-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estateValue">Estate Value</label>
            <input
              id="estateValue"
              type="number"
              name="estateValue"
              value={form.estateValue}
              onChange={handleInputChange}
              step="100000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="estateState">State</label>
            <select
              id="estateState"
              name="state"
              value={form.state}
              onChange={handleInputChange}
            >
              <option value="">No State Tax</option>
              <option value="MA">Massachusetts</option>
              <option value="NY">New York</option>
              <option value="OR">Oregon</option>
              <option value="WA">Washington</option>
              <option value="IL">Illinois</option>
              <option value="CT">Connecticut</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="estateMaritalStatus">Marital Status</label>
            <select
              id="estateMaritalStatus"
              name="maritalStatus"
              value={form.maritalStatus}
              onChange={handleInputChange}
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lifeInsuranceValue">Life Insurance Value</label>
            <input
              id="lifeInsuranceValue"
              type="number"
              name="lifeInsuranceValue"
              value={form.lifeInsuranceValue}
              onChange={handleInputChange}
              step="10000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="charitableDonations">Charitable Donations</label>
            <input
              id="charitableDonations"
              type="number"
              name="charitableDonations"
              value={form.charitableDonations}
              onChange={handleInputChange}
              step="10000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="outstandingDebt">Outstanding Debt</label>
            <input
              id="outstandingDebt"
              type="number"
              name="debtValue"
              value={form.debtValue}
              onChange={handleInputChange}
              step="10000"
              min="0"
            />
          </div>
        </div>

        <button
          className="calculate-button"
          onClick={handleCalculate}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Calculate Estate Tax'}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Results Display */}
      {calculation && (
        <div className="results">
          <div className="results-header">
            <h3>Estate Tax Calculation Results</h3>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-label">Gross Estate</div>
              <div className="card-value">{formatCurrency(calculation.gross_estate)}</div>
            </div>

            <div className="summary-card">
              <div className="card-label">Total Tax</div>
              <div className="card-value tax">{formatCurrency(calculation.total_tax)}</div>
            </div>

            <div className="summary-card">
              <div className="card-label">Net Estate</div>
              <div className="card-value positive">
                {formatCurrency(calculation.net_estate)}
              </div>
            </div>

            <div className="summary-card">
              <div className="card-label">Effective Rate</div>
              <div className="card-value">{formatPercent(calculation.effective_rate)}</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="detailed-breakdown">
            <h4>Detailed Breakdown</h4>

            <div className="breakdown-section">
              <h5>Estate Composition</h5>
              <div className="breakdown-row">
                <span>Gross Estate</span>
                <span>{formatCurrency(calculation.gross_estate)}</span>
              </div>
              <div className="breakdown-row">
                <span>Less: Deductions</span>
                <span>-{formatCurrency(calculation.deductions)}</span>
              </div>
              <div className="breakdown-row total">
                <span>Taxable Estate</span>
                <span>{formatCurrency(calculation.taxable_estate)}</span>
              </div>
            </div>

            <div className="breakdown-section">
              <h5>Federal Estate Tax</h5>
              <div className="breakdown-row">
                <span>Federal Exemption</span>
                <span>{formatCurrency(calculation.federal_exemption)}</span>
              </div>
              <div className="breakdown-row">
                <span>Taxable Amount</span>
                <span>{formatCurrency(calculation.federal_taxable_amount)}</span>
              </div>
              <div className="breakdown-row total">
                <span>Federal Tax (40%)</span>
                <span className={calculation.federal_tax > 0 ? 'negative' : ''}>
                  {formatCurrency(calculation.federal_tax)}
                </span>
              </div>
            </div>

            {calculation.state_tax > 0 && (
              <div className="breakdown-section">
                <h5>State Estate Tax</h5>
                <div className="breakdown-row">
                  <span>State Exemption</span>
                  <span>{formatCurrency(calculation.state_exemption)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Taxable Amount</span>
                  <span>{formatCurrency(calculation.state_taxable_amount)}</span>
                </div>
                <div className="breakdown-row total">
                  <span>State Tax</span>
                  <span className="negative">{formatCurrency(calculation.state_tax)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tax Liability Alert */}
          {calculation.has_federal_tax_liability && (
            <div className="alert warning">
              <strong>⚠️ Federal Estate Tax Liability</strong>
              <p>
                Your estate exceeds the federal exemption. Consider estate planning
                strategies to reduce your tax burden.
              </p>
            </div>
          )}

          {calculation.has_state_tax_liability && (
            <div className="alert info">
              <strong>ℹ️ State Estate Tax Liability</strong>
              <p>
                Your estate is subject to state estate tax. Explore state-specific planning
                strategies.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .estate-tax-projection {
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

        .calculate-button {
          width: 100%;
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
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

        .results {
          margin-top: 2rem;
        }

        .results-header h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        .card-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .card-value {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .card-value.tax {
          color: #dc2626;
        }

        .card-value.positive {
          color: #059669;
        }

        .detailed-breakdown {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .detailed-breakdown h4 {
          font-size: 1.125rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .breakdown-section {
          margin-bottom: 1.5rem;
        }

        .breakdown-section h5 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #374151;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .breakdown-row.total {
          font-weight: 600;
          border-top: 2px solid #9ca3af;
          padding-top: 0.75rem;
          margin-top: 0.5rem;
        }

        .breakdown-row .negative {
          color: #dc2626;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .alert.warning {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          color: #92400e;
        }

        .alert.info {
          background: #dbeafe;
          border: 1px solid #60a5fa;
          color: #1e40af;
        }

        .alert strong {
          display: block;
          margin-bottom: 0.5rem;
        }

        .alert p {
          margin: 0;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EstateTaxProjection;
