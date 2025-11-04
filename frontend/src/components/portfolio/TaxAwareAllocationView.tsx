/**
 * Tax-Aware Allocation View
 *
 * Visualizes tax-optimized asset location across different account types
 * and provides recommendations for improving tax efficiency.
 */

import React, { useState, useEffect } from 'react';
import {
  analyzeTaxEfficiency,
  formatCurrency,
  formatPercentage,
  getAccountTypeColor,
} from '../../services/multiGoalOptimizationApi';
import type {
  AccountAllocation,
  AccountInfo,
  TaxEfficiencyAnalysis,
} from '../../types/multiGoalOptimization';

interface TaxAwareAllocationViewProps {
  userId: string;
  accountAllocations: AccountAllocation[];
  accounts: AccountInfo[];
}

const ACCOUNT_TYPE_DESCRIPTIONS = {
  taxable: 'Taxable brokerage accounts - Capital gains and dividend taxes apply',
  tax_deferred: '401(k), Traditional IRA - Taxes deferred until withdrawal',
  tax_exempt: 'Roth IRA, Roth 401(k) - Tax-free growth and withdrawals',
};

const OPTIMAL_PLACEMENTS = {
  bonds: 'tax_deferred',
  tips: 'tax_deferred',
  reits: 'tax_deferred',
  high_yield_bonds: 'tax_deferred',
  stocks: 'tax_exempt',
  international_stocks: 'tax_exempt',
  emerging_markets: 'tax_exempt',
  municipal_bonds: 'taxable',
  index_funds: 'taxable',
};

export const TaxAwareAllocationView: React.FC<TaxAwareAllocationViewProps> = ({
  userId,
  accountAllocations,
  accounts,
}) => {
  const [taxAnalysis, setTaxAnalysis] = useState<TaxEfficiencyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaxAnalysis();
  }, [userId]);

  const loadTaxAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzeTaxEfficiency(userId);
      setTaxAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze tax efficiency');
    } finally {
      setLoading(false);
    }
  };

  // Group allocations by account type
  const allocationsByType: Record<string, AccountAllocation[]> = {};
  accountAllocations.forEach((allocation) => {
    const account = accounts.find((a) => a.id === allocation.account_id);
    if (account) {
      if (!allocationsByType[account.type]) {
        allocationsByType[account.type] = [];
      }
      allocationsByType[account.type].push(allocation);
    }
  });

  return (
    <div className="tax-aware-allocation-view">
      <div className="view-header">
        <h2>Tax-Aware Asset Location</h2>
        <p className="subtitle">
          Optimize placement of assets across account types to minimize taxes
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tax Savings Summary */}
      {taxAnalysis && (
        <div className="tax-savings-summary">
          <div className="savings-card primary">
            <div className="card-label">Current Annual Tax Drag</div>
            <div className="card-value negative">
              {formatPercentage(taxAnalysis.current_tax_drag)}
            </div>
            <div className="card-subtitle">
              {formatCurrency(taxAnalysis.current_tax_drag * 275000)} annually on $275k portfolio
            </div>
          </div>

          <div className="savings-card success">
            <div className="card-label">Optimized Tax Drag</div>
            <div className="card-value positive">
              {formatPercentage(taxAnalysis.optimized_tax_drag)}
            </div>
            <div className="card-subtitle">
              {formatPercentage(
                (taxAnalysis.current_tax_drag - taxAnalysis.optimized_tax_drag) /
                  taxAnalysis.current_tax_drag
              )}{' '}
              improvement
            </div>
          </div>

          <div className="savings-card highlight">
            <div className="card-label">Potential Annual Savings</div>
            <div className="card-value">{formatCurrency(taxAnalysis.annual_savings)}</div>
            <div className="card-subtitle">
              {formatCurrency(taxAnalysis.annual_savings * 30)} over 30 years (not compounded)
            </div>
          </div>
        </div>
      )}

      {/* Account Type Descriptions */}
      <div className="account-types-section">
        <h3>Account Types & Tax Treatment</h3>
        <div className="account-type-cards">
          {Object.entries(ACCOUNT_TYPE_DESCRIPTIONS).map(([type, description]) => (
            <div
              key={type}
              className="account-type-card"
              style={{ borderLeftColor: getAccountTypeColor(type) }}
            >
              <div className="type-header">
                <span
                  className="type-badge"
                  style={{ backgroundColor: getAccountTypeColor(type) }}
                >
                  {type.replace('_', ' ')}
                </span>
              </div>
              <p className="type-description">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Allocation by Account Type */}
      <div className="allocations-section">
        <h3>Current Asset Location</h3>
        {Object.entries(allocationsByType).map(([accountType, allocations]) => (
          <div key={accountType} className="account-type-group">
            <div className="group-header">
              <h4>
                <span
                  className="type-badge"
                  style={{ backgroundColor: getAccountTypeColor(accountType) }}
                >
                  {accountType.replace('_', ' ')}
                </span>
                <span className="account-count">{allocations.length} accounts</span>
              </h4>
            </div>

            <div className="allocations-grid">
              {allocations.map((allocation) => {
                const account = accounts.find((a) => a.id === allocation.account_id);
                if (!account) return null;

                return (
                  <div key={allocation.account_id} className="allocation-card">
                    <div className="account-header">
                      <span className="account-id">{allocation.account_id}</span>
                      <span className="account-balance">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>

                    <div className="assets-list">
                      {Object.entries(allocation.allocations).map(([asset, amount]) => {
                        const isOptimal = OPTIMAL_PLACEMENTS[asset as keyof typeof OPTIMAL_PLACEMENTS] === accountType;
                        return (
                          <div key={asset} className="asset-row">
                            <span className="asset-name">
                              {asset}
                              {!isOptimal && (
                                <span className="suboptimal-badge" title="May be suboptimal placement">
                                  ⚠️
                                </span>
                              )}
                            </span>
                            <span className="asset-amount">{formatCurrency(amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tax Optimization Recommendations */}
      {taxAnalysis && taxAnalysis.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>Optimization Recommendations</h3>
          <div className="recommendations-list">
            {taxAnalysis.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card priority-${rec.priority}`}>
                <div className="rec-header">
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority} priority
                  </span>
                  {rec.annual_tax_savings && (
                    <span className="savings-badge">
                      Save {formatCurrency(rec.annual_tax_savings)}/year
                    </span>
                  )}
                </div>

                <h4>{rec.action}</h4>

                <div className="rec-details">
                  <div className="detail-row">
                    <span className="label">Asset:</span>
                    <span className="value">{rec.asset}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">{formatCurrency(rec.amount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">From:</span>
                    <span className="value">{rec.current_account}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">To:</span>
                    <span className="value">{rec.target_account}</span>
                  </div>
                </div>

                {rec.long_term_benefit && (
                  <div className="long-term-benefit">
                    <strong>Long-term benefit:</strong> {rec.long_term_benefit}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Notes */}
      {taxAnalysis && taxAnalysis.implementation_notes.length > 0 && (
        <div className="implementation-notes">
          <h3>Implementation Notes</h3>
          <ul>
            {taxAnalysis.implementation_notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .tax-aware-allocation-view {
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

        .error-banner {
          padding: 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .tax-savings-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .savings-card {
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .savings-card.primary {
          background: #fef3c7;
          border-left-color: #f59e0b;
        }

        .savings-card.success {
          background: #d1fae5;
          border-left-color: #10b981;
        }

        .savings-card.highlight {
          background: #dbeafe;
          border-left-color: #3b82f6;
        }

        .card-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .card-value.negative {
          color: #ef4444;
        }

        .card-value.positive {
          color: #10b981;
        }

        .card-subtitle {
          font-size: 12px;
          color: #64748b;
        }

        .account-types-section {
          margin-bottom: 32px;
        }

        .account-types-section h3 {
          margin-bottom: 16px;
        }

        .account-type-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .account-type-card {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .type-header {
          margin-bottom: 8px;
        }

        .type-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .type-description {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
        }

        .allocations-section {
          margin-bottom: 32px;
        }

        .allocations-section h3 {
          margin-bottom: 24px;
        }

        .account-type-group {
          margin-bottom: 32px;
        }

        .group-header h4 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .account-count {
          font-size: 14px;
          color: #64748b;
          font-weight: normal;
        }

        .allocations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .allocation-card {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .account-id {
          font-weight: 600;
          font-size: 14px;
        }

        .account-balance {
          font-weight: 700;
          color: #3b82f6;
        }

        .assets-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .asset-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .asset-name {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .suboptimal-badge {
          font-size: 14px;
        }

        .asset-amount {
          font-weight: 600;
        }

        .recommendations-section {
          margin-bottom: 32px;
        }

        .recommendations-section h3 {
          margin-bottom: 16px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommendation-card {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .recommendation-card.priority-high {
          border-left-color: #ef4444;
        }

        .recommendation-card.priority-medium {
          border-left-color: #f59e0b;
        }

        .recommendation-card.priority-low {
          border-left-color: #3b82f6;
        }

        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .priority-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge.high {
          background: #ef4444;
        }

        .priority-badge.medium {
          background: #f59e0b;
        }

        .priority-badge.low {
          background: #3b82f6;
        }

        .savings-badge {
          padding: 4px 12px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .recommendation-card h4 {
          font-size: 16px;
          margin-bottom: 16px;
        }

        .rec-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
        }

        .label {
          font-size: 13px;
          color: #64748b;
        }

        .value {
          font-weight: 600;
          font-size: 13px;
        }

        .long-term-benefit {
          margin-top: 12px;
          padding: 12px;
          background: #eff6ff;
          border-radius: 6px;
          font-size: 13px;
          color: #1e40af;
        }

        .implementation-notes {
          padding: 20px;
          background: #fef3c7;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .implementation-notes h3 {
          margin-bottom: 12px;
        }

        .implementation-notes ul {
          margin-left: 20px;
        }

        .implementation-notes li {
          margin-bottom: 8px;
          color: #92400e;
        }
      `}</style>
    </div>
  );
};
