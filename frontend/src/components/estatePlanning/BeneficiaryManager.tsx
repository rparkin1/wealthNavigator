/**
 * Beneficiary Manager Component
 *
 * Manages beneficiary designations and provides optimization recommendations
 */

import React, { useState } from 'react';
import { estatePlanningApi } from '../../services/estatePlanningApi';
import type {
  Beneficiary,
  BeneficiaryAccount,
  BeneficiaryOptimizationResponse,
} from '../../types/estatePlanning';

const BeneficiaryManager: React.FC = () => {
  const [accounts, setAccounts] = useState<BeneficiaryAccount[]>([
    { account_id: '1', account_type: 'ira', value: 500000 },
    { account_id: '2', account_type: 'taxable', value: 300000 },
    { account_id: '3', account_type: 'roth_ira', value: 200000 },
  ]);

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    { beneficiary_id: '1', name: 'Spouse', relationship: 'spouse', age: 52 },
    { beneficiary_id: '2', name: 'Child 1', relationship: 'child', age: 25 },
    { beneficiary_id: '3', name: 'Child 2', relationship: 'child', age: 22 },
  ]);

  const [optimization, setOptimization] = useState<BeneficiaryOptimizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await estatePlanningApi.optimizeBeneficiaryDesignations({
        accounts,
        beneficiaries,
        estate_plan_goals: {
          minimize_taxes: true,
          protect_spouse: true,
          provide_for_children: true,
        },
      });

      setOptimization(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize beneficiary designations');
    } finally {
      setIsLoading(false);
    }
  };

  const addAccount = () => {
    const newId = (Math.max(...accounts.map(a => parseInt(a.account_id)), 0) + 1).toString();
    setAccounts([
      ...accounts,
      { account_id: newId, account_type: 'taxable', value: 0 },
    ]);
  };

  const removeAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.account_id !== id));
  };

  const updateAccount = (id: string, field: keyof BeneficiaryAccount, value: any) => {
    setAccounts(accounts.map(a => (a.account_id === id ? { ...a, [field]: value } : a)));
  };

  const addBeneficiary = () => {
    const newId = (Math.max(...beneficiaries.map(b => parseInt(b.beneficiary_id)), 0) + 1).toString();
    setBeneficiaries([
      ...beneficiaries,
      { beneficiary_id: newId, name: '', relationship: 'child' },
    ]);
  };

  const removeBeneficiary = (id: string) => {
    setBeneficiaries(beneficiaries.filter(b => b.beneficiary_id !== id));
  };

  const updateBeneficiary = (id: string, field: keyof Beneficiary, value: any) => {
    setBeneficiaries(beneficiaries.map(b => (b.beneficiary_id === id ? { ...b, [field]: value } : b)));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="beneficiary-manager">
      <h2>Beneficiary Manager</h2>
      <p className="description">
        Optimize beneficiary designations for tax efficiency and estate planning goals
      </p>

      {/* Accounts Section */}
      <div className="section">
        <div className="section-header">
          <h3>Accounts</h3>
          <button className="add-button" onClick={addAccount}>+ Add Account</button>
        </div>

        <div className="accounts-list">
          {accounts.map((account) => (
            <div key={account.account_id} className="account-row">
              <select
                value={account.account_type}
                onChange={(e) => updateAccount(account.account_id, 'account_type', e.target.value)}
              >
                <option value="taxable">Taxable</option>
                <option value="ira">Traditional IRA</option>
                <option value="401k">401(k)</option>
                <option value="403b">403(b)</option>
                <option value="roth_ira">Roth IRA</option>
                <option value="roth_401k">Roth 401(k)</option>
              </select>

              <input
                type="number"
                value={account.value}
                onChange={(e) => updateAccount(account.account_id, 'value', parseFloat(e.target.value) || 0)}
                placeholder="Account value"
                step="10000"
                min="0"
              />

              <button
                className="remove-button"
                onClick={() => removeAccount(account.account_id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Beneficiaries Section */}
      <div className="section">
        <div className="section-header">
          <h3>Beneficiaries</h3>
          <button className="add-button" onClick={addBeneficiary}>+ Add Beneficiary</button>
        </div>

        <div className="beneficiaries-list">
          {beneficiaries.map((beneficiary) => (
            <div key={beneficiary.beneficiary_id} className="beneficiary-row">
              <input
                type="text"
                value={beneficiary.name}
                onChange={(e) => updateBeneficiary(beneficiary.beneficiary_id, 'name', e.target.value)}
                placeholder="Name"
              />

              <select
                value={beneficiary.relationship}
                onChange={(e) => updateBeneficiary(beneficiary.beneficiary_id, 'relationship', e.target.value)}
              >
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="charity">Charity</option>
                <option value="trust">Trust</option>
                <option value="other">Other</option>
              </select>

              <input
                type="number"
                value={beneficiary.age || ''}
                onChange={(e) => updateBeneficiary(beneficiary.beneficiary_id, 'age', parseInt(e.target.value) || undefined)}
                placeholder="Age (optional)"
                min="0"
                max="120"
              />

              <button
                className="remove-button"
                onClick={() => removeBeneficiary(beneficiary.beneficiary_id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        className="optimize-button"
        onClick={handleOptimize}
        disabled={isLoading || accounts.length === 0 || beneficiaries.length === 0}
      >
        {isLoading ? 'Optimizing...' : 'Get Optimization Recommendations'}
      </button>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Optimization Results */}
      {optimization && (
        <div className="optimization-results">
          <h3>Optimization Recommendations</h3>

          {/* Tax Savings */}
          {optimization.estimated_tax_savings > 0 && (
            <div className="savings-card">
              <div className="savings-label">Estimated Tax Savings</div>
              <div className="savings-value">{formatCurrency(optimization.estimated_tax_savings)}</div>
            </div>
          )}

          {/* Strategies */}
          <div className="strategies-section">
            <h4>Recommended Strategies</h4>
            <div className="strategies-list">
              {optimization.recommendations.map((strategy, index) => (
                <div key={index} className="strategy-card">
                  <div className="strategy-header">
                    <span className="strategy-name">{strategy.strategy.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className={`priority-badge priority-${strategy.priority}`}>
                      {strategy.priority}
                    </span>
                  </div>
                  <div className="strategy-reason">{strategy.reason}</div>
                  <div className="strategy-benefit">
                    <strong>Tax Benefit:</strong> {strategy.tax_benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Actions */}
          <div className="actions-section">
            <h4>Key Actions</h4>
            <ul className="actions-list">
              {optimization.key_actions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .beneficiary-manager {
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

        .section {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .add-button {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .add-button:hover {
          background: #059669;
        }

        .accounts-list,
        .beneficiaries-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .account-row,
        .beneficiary-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr;
          gap: 0.75rem;
          align-items: center;
        }

        .account-row input,
        .account-row select,
        .beneficiary-row input,
        .beneficiary-row select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .remove-button {
          padding: 0.5rem 0.75rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .remove-button:hover {
          background: #dc2626;
        }

        .optimize-button {
          width: 100%;
          padding: 0.75rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        }

        .optimize-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .optimize-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          padding: 1rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .optimization-results {
          margin-top: 2rem;
        }

        .optimization-results h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .savings-card {
          background: #d1fae5;
          border: 2px solid #10b981;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .savings-label {
          font-size: 0.875rem;
          color: #047857;
          margin-bottom: 0.5rem;
        }

        .savings-value {
          font-size: 2rem;
          font-weight: bold;
          color: #047857;
        }

        .strategies-section,
        .actions-section {
          margin-bottom: 1.5rem;
        }

        .strategies-section h4,
        .actions-section h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .strategies-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .strategy-card {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 1rem;
          border-radius: 8px;
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

        .strategy-reason {
          color: #374151;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .strategy-benefit {
          font-size: 0.875rem;
          color: #059669;
        }

        .actions-list {
          list-style: disc;
          padding-left: 1.5rem;
        }

        .actions-list li {
          margin-bottom: 0.5rem;
          color: #374151;
        }

        @media (max-width: 768px) {
          .account-row,
          .beneficiary-row {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BeneficiaryManager;
