/**
 * Education Funding Dashboard
 *
 * Main dashboard for education planning with overview and analytics.
 * Implements REQ-GOAL-013 and REQ-GOAL-014: Education funding visualization.
 */

import React, { useState } from 'react';
import { educationFundingApi } from '../../services/educationFundingApi';
import type {
  ChildEducation,
  MultiChildResponse,
  EducationTimelineResponse,
} from '../../services/educationFundingApi';

interface EducationFundingDashboardProps {
  userId?: string;
}

export const EducationFundingDashboard: React.FC<EducationFundingDashboardProps> = ({ userId }) => {
  const [children, setChildren] = useState<ChildEducation[]>([]);
  const [totalMonthlySavings, setTotalMonthlySavings] = useState<number>(0);
  const [optimization, setOptimization] = useState<MultiChildResponse | null>(null);
  const [timeline, setTimeline] = useState<EducationTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add child
  const addChild = () => {
    setChildren([
      ...children,
      {
        name: `Child ${children.length + 1}`,
        age: 5,
        education_type: 'public_in_state',
        years_of_support: 4,
      },
    ]);
  };

  // Update child
  const updateChild = (index: number, field: keyof ChildEducation, value: string | number) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  // Remove child
  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  // Calculate optimization
  const calculateOptimization = async () => {
    if (children.length === 0 || totalMonthlySavings <= 0) {
      setError('Please add at least one child and set monthly savings amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [optimizationResult, timelineResult] = await Promise.all([
        educationFundingApi.optimizeMultiChild({
          children,
          total_monthly_savings: totalMonthlySavings,
        }),
        educationFundingApi.calculateTimeline({ children }),
      ]);

      setOptimization(optimizationResult);
      setTimeline(timelineResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate optimization');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="education-funding-dashboard">
      <div className="dashboard-header">
        <h1>Education Funding Planning</h1>
        <p className="subtitle">
          Plan for multiple children's education with optimized 529 strategies
        </p>
      </div>

      {/* Children Management */}
      <div className="children-section card">
        <div className="section-header">
          <h2>Children</h2>
          <button onClick={addChild} className="btn btn-primary">
            + Add Child
          </button>
        </div>

        {children.length === 0 ? (
          <div className="empty-state">
            <p>No children added yet. Click "Add Child" to get started.</p>
          </div>
        ) : (
          <div className="children-list">
            {children.map((child, index) => (
              <div key={index} className="child-card">
                <div className="child-header">
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => updateChild(index, 'name', e.target.value)}
                    className="child-name-input"
                    placeholder="Child name"
                  />
                  <button
                    onClick={() => removeChild(index)}
                    className="btn-icon btn-danger"
                    aria-label="Remove child"
                  >
                    ✕
                  </button>
                </div>

                <div className="child-details">
                  <div className="form-group">
                    <label>Current Age</label>
                    <input
                      type="number"
                      value={child.age}
                      onChange={(e) => updateChild(index, 'age', parseInt(e.target.value))}
                      min="0"
                      max="25"
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Education Type</label>
                    <select
                      value={child.education_type}
                      onChange={(e) => updateChild(index, 'education_type', e.target.value)}
                      className="form-control"
                    >
                      <option value="public_in_state">Public In-State</option>
                      <option value="public_out_state">Public Out-of-State</option>
                      <option value="private">Private</option>
                      <option value="graduate_public">Graduate Public</option>
                      <option value="graduate_private">Graduate Private</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Years of Support</label>
                    <input
                      type="number"
                      value={child.years_of_support}
                      onChange={(e) => updateChild(index, 'years_of_support', parseInt(e.target.value))}
                      min="1"
                      max="10"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Savings Input */}
      <div className="savings-section card">
        <h2>Total Monthly Savings Available</h2>
        <div className="form-group">
          <label>Monthly Amount</label>
          <div className="input-with-prefix">
            <span className="prefix">$</span>
            <input
              type="number"
              value={totalMonthlySavings}
              onChange={(e) => setTotalMonthlySavings(parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
              className="form-control"
              placeholder="0"
            />
          </div>
        </div>

        <button
          onClick={calculateOptimization}
          disabled={loading || children.length === 0 || totalMonthlySavings <= 0}
          className="btn btn-primary btn-large"
        >
          {loading ? 'Calculating...' : 'Calculate Optimal Allocation'}
        </button>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
      </div>

      {/* Optimization Results */}
      {optimization && (
        <div className="results-section">
          <div className="card">
            <h2>Recommended Allocation</h2>
            <div className="allocation-summary">
              <div className="summary-stat">
                <span className="label">Total Monthly Savings</span>
                <span className="value">{formatCurrency(optimization.total_allocated)}</span>
              </div>
            </div>

            <div className="allocation-list">
              {optimization.children_data.map((child, index) => (
                <div key={index} className="allocation-item">
                  <div className="allocation-header">
                    <h3>{child.name}</h3>
                    <span className="age">Age {child.age}</span>
                  </div>

                  <div className="allocation-details">
                    <div className="detail-row">
                      <span>Monthly Allocation:</span>
                      <strong>{formatCurrency(child.allocated)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total Need:</span>
                      <strong>{formatCurrency(child.total_need)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Years Until College:</span>
                      <strong>{child.years_until_college} years</strong>
                    </div>
                    <div className="detail-row">
                      <span>Urgency Score:</span>
                      <strong>{(child.urgency * 100).toFixed(1)}%</strong>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(child.allocated / totalMonthlySavings) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Visualization */}
          {timeline && timeline.timeline.length > 0 && (
            <div className="card">
              <h2>Education Timeline</h2>
              <div className="timeline-container">
                {timeline.timeline.map((event, index) => (
                  <div key={index} className="timeline-event">
                    <div className="timeline-marker" />
                    <div className="timeline-content">
                      <h4>{event.child_name}</h4>
                      <div className="timeline-details">
                        <p>
                          <strong>College Years:</strong> {event.college_start_year} - {event.college_end_year}
                        </p>
                        <p>
                          <strong>Years Until College:</strong> {event.years_until_college} years
                        </p>
                        <p>
                          <strong>Education Type:</strong>{' '}
                          {event.education_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        <p>
                          <strong>Estimated Annual Cost:</strong>{' '}
                          {formatCurrency(event.estimated_annual_cost)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .education-funding-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
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

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #718096;
        }

        .children-list {
          display: grid;
          gap: 1rem;
        }

        .child-card {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
        }

        .child-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .child-name-input {
          font-size: 1.125rem;
          font-weight: 600;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.25rem 0;
          flex: 1;
        }

        .child-name-input:focus {
          outline: none;
          border-bottom-color: #4299e1;
        }

        .child-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 0.25rem;
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
          margin-top: 1rem;
        }

        .btn-icon {
          padding: 0.25rem 0.5rem;
          background: transparent;
          color: #e53e3e;
        }

        .btn-icon:hover {
          background: #fed7d7;
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

        .allocation-summary {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .summary-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-stat .label {
          font-weight: 500;
          color: #4a5568;
        }

        .summary-stat .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
        }

        .allocation-list {
          display: grid;
          gap: 1rem;
        }

        .allocation-item {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
        }

        .allocation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .allocation-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .age {
          background: #edf2f7;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .allocation-details {
          display: grid;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .detail-row span {
          color: #718096;
        }

        .detail-row strong {
          color: #2d3748;
        }

        .progress-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4299e1, #3182ce);
          transition: width 0.3s;
        }

        .timeline-container {
          position: relative;
        }

        .timeline-event {
          position: relative;
          padding-left: 2rem;
          padding-bottom: 2rem;
        }

        .timeline-event:last-child {
          padding-bottom: 0;
        }

        .timeline-marker {
          position: absolute;
          left: 0;
          top: 0;
          width: 12px;
          height: 12px;
          background: #4299e1;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 2px #4299e1;
        }

        .timeline-event::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 12px;
          bottom: 0;
          width: 2px;
          background: #e2e8f0;
        }

        .timeline-event:last-child::before {
          display: none;
        }

        .timeline-content {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 6px;
        }

        .timeline-content h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 0.75rem 0;
        }

        .timeline-details p {
          font-size: 0.875rem;
          color: #4a5568;
          margin: 0.5rem 0;
        }

        .timeline-details strong {
          color: #2d3748;
        }
      `}</style>
    </div>
  );
};
