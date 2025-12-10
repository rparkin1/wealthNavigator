/**
 * ESG Preferences Component
 *
 * UI for configuring ESG/ethical screening preferences with presets and custom constraints
 */

import React, { useEffect, useState } from 'react';
import { usePortfolioOptimization } from '../../hooks/usePortfolioOptimization';
import {
  getESGRatingColor,
  formatPercentage,
} from '../../services/portfolioOptimizationApi';
import type { ESGPreset, ESGScreeningRequest } from '../../services/portfolioOptimizationApi';

interface ESGPreferencesProps {
  onPreferencesChange?: (preferences: ESGScreeningRequest) => void;
}

export const ESGPreferences: React.FC<ESGPreferencesProps> = ({ onPreferencesChange }) => {
  const {
    esgPresets,
    loadingESG,
    loadESGPresets,
    esgResult,
    screenESG,
  } = usePortfolioOptimization();

  const [selectedPreset, setSelectedPreset] = useState<string>('moderate');
  const [customMode, setCustomMode] = useState(false);

  // Exclusions
  const [excludeFossilFuels, setExcludeFossilFuels] = useState(true);
  const [excludeTobacco, setExcludeTobacco] = useState(true);
  const [excludeWeapons, setExcludeWeapons] = useState(true);
  const [excludeGambling, setExcludeGambling] = useState(false);
  const [excludeAlcohol, setExcludeAlcohol] = useState(false);

  // Required Criteria
  const [requireClimateAction, setRequireClimateAction] = useState(false);
  const [requireRenewableEnergy, setRequireRenewableEnergy] = useState(false);
  const [requireDiversity, setRequireDiversity] = useState(false);

  // Rating
  const [minimumRating, setMinimumRating] = useState<string>('average');
  const [minimumScore, setMinimumScore] = useState<number | null>(null);
  const [allowNotRated, setAllowNotRated] = useState(true);

  // Load presets on mount
  useEffect(() => {
    loadESGPresets();
  }, [loadESGPresets]);

  // Apply preset when selected
  useEffect(() => {
    if (!customMode && esgPresets.length > 0) {
      const preset = esgPresets.find((p) => p.name === selectedPreset);
      if (preset) {
        applyPreset(preset);
      }
    }
  }, [selectedPreset, esgPresets, customMode]);

  const applyPreset = (preset: ESGPreset) => {
    setExcludeFossilFuels(preset.exclusions.includes('fossil_fuels'));
    setExcludeTobacco(preset.exclusions.includes('tobacco'));
    setExcludeWeapons(preset.exclusions.includes('weapons'));
    setExcludeGambling(preset.exclusions.includes('gambling'));
    setExcludeAlcohol(preset.exclusions.includes('alcohol'));

    setRequireClimateAction(preset.required_criteria.includes('climate_change'));
    setRequireRenewableEnergy(preset.required_criteria.includes('renewable_energy'));
    setRequireDiversity(preset.required_criteria.includes('diversity'));

    setMinimumRating(preset.minimum_esg_rating);
    setMinimumScore(preset.minimum_overall_score || null);
    setAllowNotRated(preset.allow_not_rated);
  };

  const buildESGRequest = (): ESGScreeningRequest => {
    const exclusions: string[] = [];
    if (excludeFossilFuels) exclusions.push('fossil_fuels');
    if (excludeTobacco) exclusions.push('tobacco');
    if (excludeWeapons) exclusions.push('weapons');
    if (excludeGambling) exclusions.push('gambling');
    if (excludeAlcohol) exclusions.push('alcohol');

    const required_criteria: string[] = [];
    if (requireClimateAction) required_criteria.push('climate_change');
    if (requireRenewableEnergy) required_criteria.push('renewable_energy');
    if (requireDiversity) required_criteria.push('diversity');

    return {
      asset_codes: [], // Will be provided by parent
      exclusions,
      required_criteria,
      minimum_esg_rating: minimumRating,
      minimum_overall_score: minimumScore || undefined,
      allow_not_rated: allowNotRated,
    };
  };

  const handleApply = () => {
    const request = buildESGRequest();
    onPreferencesChange?.(request);
  };

  const handleTestScreening = async () => {
    // Test with sample asset codes
    const testAssets = [
      'US_LC_BLEND',
      'US_ESG',
      'ENERGY',
      'INTL_ESG',
      'GREEN_BOND',
      'COAL',
    ];

    const request = {
      ...buildESGRequest(),
      asset_codes: testAssets,
    };

    await screenESG(request);
  };

  return (
    <div className="esg-preferences">
      <div className="preferences-header">
        <h2>ESG & Ethical Screening</h2>
        <p>Configure environmental, social, and governance investment preferences</p>
      </div>

      {/* Preset Selection */}
      <div className="preset-section">
        <h3>ESG Presets</h3>
        <div className="preset-buttons">
          {esgPresets.map((preset) => (
            <button
              key={preset.name}
              className={`preset-button ${selectedPreset === preset.name && !customMode ? 'active' : ''}`}
              onClick={() => {
                setSelectedPreset(preset.name);
                setCustomMode(false);
              }}
            >
              <div className="preset-label">{preset.label}</div>
              <div className="preset-description">{preset.description}</div>
            </button>
          ))}
          <button
            className={`preset-button ${customMode ? 'active' : ''}`}
            onClick={() => setCustomMode(true)}
          >
            <div className="preset-label">Custom</div>
            <div className="preset-description">Create your own criteria</div>
          </button>
        </div>
      </div>

      {/* Exclusions */}
      <div className="criteria-section">
        <h3>🚫 Exclusions</h3>
        <p className="section-description">Industries and practices to avoid</p>

        <div className="checkbox-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeFossilFuels}
              onChange={(e) => setExcludeFossilFuels(e.target.checked)}
            />
            Fossil Fuels
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeTobacco}
              onChange={(e) => setExcludeTobacco(e.target.checked)}
            />
            Tobacco
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeWeapons}
              onChange={(e) => setExcludeWeapons(e.target.checked)}
            />
            Weapons
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeGambling}
              onChange={(e) => setExcludeGambling(e.target.checked)}
            />
            Gambling
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeAlcohol}
              onChange={(e) => setExcludeAlcohol(e.target.checked)}
            />
            Alcohol
          </label>
        </div>
      </div>

      {/* Required Criteria */}
      <div className="criteria-section">
        <h3>✅ Required Criteria</h3>
        <p className="section-description">Positive screens for specific practices</p>

        <div className="checkbox-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={requireClimateAction}
              onChange={(e) => setRequireClimateAction(e.target.checked)}
            />
            Climate Action
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={requireRenewableEnergy}
              onChange={(e) => setRequireRenewableEnergy(e.target.checked)}
            />
            Renewable Energy
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={requireDiversity}
              onChange={(e) => setRequireDiversity(e.target.checked)}
            />
            Diversity & Inclusion
          </label>
        </div>
      </div>

      {/* Rating Requirements */}
      <div className="criteria-section">
        <h3>⭐ Rating Requirements</h3>

        <div className="rating-controls">
          <div className="control-group">
            <label>Minimum ESG Rating</label>
            <select
              value={minimumRating}
              onChange={(e) => setMinimumRating(e.target.value)}
            >
              <option value="leader">Leader (High)</option>
              <option value="average">Average</option>
              <option value="laggard">Laggard (Low)</option>
            </select>
          </div>

          <div className="control-group">
            <label>Minimum Score (optional)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minimumScore || ''}
              onChange={(e) => setMinimumScore(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="0-100"
            />
          </div>

          <div className="checkbox-label">
            <input
              type="checkbox"
              checked={allowNotRated}
              onChange={(e) => setAllowNotRated(e.target.checked)}
            />
            Allow assets without ESG ratings
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={handleApply} className="apply-button">
          Apply Preferences
        </button>
        <button onClick={handleTestScreening} className="test-button" disabled={loadingESG}>
          {loadingESG ? 'Testing...' : 'Test Screening'}
        </button>
      </div>

      {/* Screening Results */}
      {esgResult && (
        <div className="screening-results">
          <h3>Screening Results</h3>

          <div className="results-summary">
            <div className="result-card">
              <div className="result-label">Eligible Assets</div>
              <div className="result-value">{esgResult.eligible_assets.length}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Excluded Assets</div>
              <div className="result-value">
                {Object.keys(esgResult.excluded_assets).length}
              </div>
            </div>

            <div className="result-card">
              <div className="result-label">Portfolio ESG Score</div>
              <div className="result-value">
                {esgResult.portfolio_esg_score.toFixed(0)}/100
              </div>
            </div>
          </div>

          <div className="assets-lists">
            <div className="eligible-list">
              <h4>✅ Eligible Assets</h4>
              <ul>
                {esgResult.eligible_assets.map((asset) => (
                  <li key={asset}>{asset}</li>
                ))}
              </ul>
            </div>

            {Object.keys(esgResult.excluded_assets).length > 0 && (
              <div className="excluded-list">
                <h4>❌ Excluded Assets</h4>
                <ul>
                  {Object.entries(esgResult.excluded_assets).map(([asset, reason]) => (
                    <li key={asset}>
                      <strong>{asset}</strong>: {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {esgResult.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>💡 Recommendations</h4>
              <ul>
                {esgResult.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .esg-preferences {
          padding: 24px;
        }

        .preferences-header {
          margin-bottom: 32px;
        }

        .preferences-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .preferences-header p {
          color: #64748b;
        }

        .preset-section {
          margin-bottom: 32px;
        }

        .preset-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .preset-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .preset-button {
          padding: 16px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .preset-button:hover {
          border-color: #cbd5e1;
        }

        .preset-button.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .preset-label {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .preset-description {
          font-size: 14px;
          color: #64748b;
        }

        .criteria-section {
          margin-bottom: 32px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .criteria-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .section-description {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          cursor: pointer;
        }

        .checkbox-label input[type='checkbox'] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .rating-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          font-weight: 500;
        }

        .control-group select,
        .control-group input {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .apply-button,
        .test-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .apply-button {
          background: #3b82f6;
          color: white;
        }

        .apply-button:hover {
          background: #2563eb;
        }

        .test-button {
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }

        .test-button:hover:not(:disabled) {
          background: #eff6ff;
        }

        .test-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .screening-results {
          margin-top: 32px;
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .screening-results h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .results-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .result-card {
          padding: 16px;
          background: #f8fafc;
          border-radius: 6px;
          text-align: center;
        }

        .result-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .result-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .assets-lists {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .eligible-list,
        .excluded-list {
          padding: 16px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .eligible-list h4,
        .excluded-list h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .assets-lists ul {
          list-style: none;
          padding: 0;
        }

        .assets-lists li {
          padding: 8px;
          margin-bottom: 4px;
          background: white;
          border-radius: 4px;
        }

        .recommendations {
          padding: 16px;
          background: #eff6ff;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }

        .recommendations h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .recommendations ul {
          list-style: none;
          padding: 0;
        }

        .recommendations li {
          padding: 8px 0;
          border-bottom: 1px solid #dbeafe;
        }

        .recommendations li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};
