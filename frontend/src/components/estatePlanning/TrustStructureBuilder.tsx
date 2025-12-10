/**
 * Trust Structure Builder Component
 *
 * Provides personalized trust structure recommendations based on user circumstances
 */

import React, { useState } from 'react';
import { estatePlanningApi } from '../../services/estatePlanningApi';
import type {
  TrustStructure,
  TrustRecommendationForm,
} from '../../types/estatePlanning';

const TrustStructureBuilder: React.FC = () => {
  const [form, setForm] = useState<TrustRecommendationForm>({
    estateValue: 5000000,
    age: 55,
    maritalStatus: 'married',
    hasChildren: true,
    charitableIntent: false,
    assetProtectionNeeds: false,
    businessOwner: false,
  });

  const [recommendations, setRecommendations] = useState<TrustStructure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrust, setExpandedTrust] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await estatePlanningApi.recommendTrustStructures({
        estate_value: form.estateValue,
        age: form.age,
        marital_status: form.maritalStatus,
        has_children: form.hasChildren,
        charitable_intent: form.charitableIntent,
        asset_protection_needs: form.assetProtectionNeeds,
        business_owner: form.businessOwner,
      });

      setRecommendations(result.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get trust recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrust = (trustName: string) => {
    setExpandedTrust((prev) => (prev === trustName ? null : trustName));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'badge-high';
      case 'medium':
        return 'badge-medium';
      case 'low':
        return 'badge-low';
      default:
        return '';
    }
  };

  return (
    <div className="trust-structure-builder">
      <h2>Trust Structure Recommendations</h2>
      <p className="description">
        Get personalized trust recommendations based on your estate planning goals
      </p>

      {/* Input Form */}
      <div className="input-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="trustEstateValue">Estate Value</label>
            <input
              id="trustEstateValue"
              type="number"
              name="estateValue"
              value={form.estateValue}
              onChange={handleInputChange}
              step="100000"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="trustAge">Age</label>
            <input
              id="trustAge"
              type="number"
              name="age"
              value={form.age}
              onChange={handleInputChange}
              min="18"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="trustMaritalStatus">Marital Status</label>
            <select
              id="trustMaritalStatus"
              name="maritalStatus"
              value={form.maritalStatus}
              onChange={handleInputChange}
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="hasChildren"
              checked={form.hasChildren}
              onChange={handleInputChange}
            />
            <span>I have children or dependents</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="charitableIntent"
              checked={form.charitableIntent}
              onChange={handleInputChange}
            />
            <span>I have charitable giving goals</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="assetProtectionNeeds"
              checked={form.assetProtectionNeeds}
              onChange={handleInputChange}
            />
            <span>I need asset protection</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="businessOwner"
              checked={form.businessOwner}
              onChange={handleInputChange}
            />
            <span>I own a business</span>
          </label>
        </div>

        <button
          className="calculate-button"
          onClick={handleGetRecommendations}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Get Trust Recommendations'}
        </button>
      </div>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations">
          <h3>Recommended Trust Structures ({recommendations.length})</h3>

          <div className="trust-list">
            {recommendations.map((trust, index) => (
              <div
                key={index}
                className={`trust-card ${expandedTrust === trust.name ? 'expanded' : ''}`}
              >
                <div
                  className="trust-header"
                  onClick={() => toggleTrust(trust.name)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="trust-title">
                    <h4>{trust.name}</h4>
                    {trust.priority && (
                      <span className={`priority-badge ${getPriorityBadgeClass(trust.priority)}`}>
                        {trust.priority} priority
                      </span>
                    )}
                  </div>
                  <div className="trust-score">
                    {trust.suitability_score && (
                      <div className="score-badge">{trust.suitability_score}/100</div>
                    )}
                    <span className="expand-icon">
                      {expandedTrust === trust.name ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {trust.reason && (
                  <div className="trust-reason">
                    <strong>Why this trust:</strong> {trust.reason}
                  </div>
                )}

                {expandedTrust === trust.name && (
                  <div className="trust-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Estate Tax Benefit</span>
                        <span className={`detail-value ${trust.estate_tax_benefit ? 'positive' : ''}`}>
                          {trust.estate_tax_benefit ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Probate Avoidance</span>
                        <span className={`detail-value ${trust.probate_avoidance ? 'positive' : ''}`}>
                          {trust.probate_avoidance ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Asset Protection</span>
                        <span className={`detail-value ${trust.asset_protection ? 'positive' : ''}`}>
                          {trust.asset_protection ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Complexity</span>
                        <span className="detail-value">{trust.complexity}</span>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Setup Cost</span>
                        <span className="detail-value">{formatCurrency(trust.cost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .trust-structure-builder {
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

        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
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

        .recommendations h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .trust-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .trust-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .trust-card:hover {
          border-color: #2563eb;
        }

        .trust-card.expanded {
          border-color: #2563eb;
        }

        .trust-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          cursor: pointer;
          user-select: none;
        }

        .trust-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .trust-title h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .priority-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge.badge-high {
          background: #fee2e2;
          color: #dc2626;
        }

        .priority-badge.badge-medium {
          background: #fef3c7;
          color: #d97706;
        }

        .priority-badge.badge-low {
          background: #dbeafe;
          color: #2563eb;
        }

        .trust-score {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .score-badge {
          background: #10b981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 600;
        }

        .expand-icon {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .trust-reason {
          padding: 0 1rem 1rem 1rem;
          color: #374151;
        }

        .trust-reason strong {
          color: #111827;
        }

        .trust-details {
          border-top: 1px solid #e5e7eb;
          padding: 1rem;
          background: #f9fafb;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .detail-value {
          font-weight: 600;
          color: #111827;
        }

        .detail-value.positive {
          color: #10b981;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .checkbox-group {
            grid-template-columns: 1fr;
          }

          .trust-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TrustStructureBuilder;
