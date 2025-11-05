/**
 * Roth Conversion Analysis Component
 * Backdoor Roth conversion analysis and recommendations
 *
 * REQ-TAX-007: Roth conversion opportunity identification
 * Phase 3 Feature: Backdoor Roth conversion automation
 */

import React, { useState } from 'react';
import { analyzeRothConversion, formatCurrency, formatPercentage } from '@/services/taxManagementApi';
import type { BackdoorRothAnalysis } from '@/services/taxManagementApi';

// ==================== Types ====================

interface RothConversionFormData {
  age: number;
  income: number;
  filing_status: 'single' | 'married_joint' | 'married_separate';
  traditional_ira_balance: number;
  traditional_ira_basis: number;
  roth_ira_balance: number;
  retirement_age: number;
  current_marginal_rate: number;
  expected_retirement_rate: number;
  state_tax_rate: number;
  current_year_contributions: number;
  proposed_conversion_amount: number | null;
}

// ==================== Component ====================

export const RothConversionAnalysis: React.FC = () => {
  const [formData, setFormData] = useState<RothConversionFormData>({
    age: 35,
    income: 175000,
    filing_status: 'married_joint',
    traditional_ira_balance: 50000,
    traditional_ira_basis: 7000,
    roth_ira_balance: 25000,
    retirement_age: 65,
    current_marginal_rate: 0.24,
    expected_retirement_rate: 0.22,
    state_tax_rate: 0.05,
    current_year_contributions: 0,
    proposed_conversion_amount: null,
  });

  const [analysis, setAnalysis] = useState<BackdoorRothAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof RothConversionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeRothConversion({
        ...formData,
        proposed_conversion_amount: formData.proposed_conversion_amount || undefined,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze Roth conversion');
    } finally {
      setLoading(false);
    }
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Backdoor Roth Conversion Analysis</h2>
        <p className="text-gray-600 mt-1">
          Comprehensive analysis of Roth conversion opportunities, including backdoor Roth strategy for high-income earners
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Your Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Personal Info */}
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="18"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Annual Income (MAGI)</label>
            <input
              type="number"
              value={formData.income}
              onChange={(e) => handleInputChange('income', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Filing Status</label>
            <select
              value={formData.filing_status}
              onChange={(e) => handleInputChange('filing_status', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
            </select>
          </div>

          {/* IRA Balances */}
          <div>
            <label className="block text-sm font-medium mb-1">Traditional IRA Balance</label>
            <input
              type="number"
              value={formData.traditional_ira_balance}
              onChange={(e) => handleInputChange('traditional_ira_balance', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Traditional IRA Basis (Non-deductible)</label>
            <input
              type="number"
              value={formData.traditional_ira_basis}
              onChange={(e) => handleInputChange('traditional_ira_basis', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Roth IRA Balance</label>
            <input
              type="number"
              value={formData.roth_ira_balance}
              onChange={(e) => handleInputChange('roth_ira_balance', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
            />
          </div>

          {/* Tax Rates */}
          <div>
            <label className="block text-sm font-medium mb-1">Current Marginal Rate</label>
            <input
              type="number"
              value={formData.current_marginal_rate * 100}
              onChange={(e) => handleInputChange('current_marginal_rate', parseFloat(e.target.value) / 100 || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              max="100"
              step="1"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expected Retirement Rate</label>
            <input
              type="number"
              value={formData.expected_retirement_rate * 100}
              onChange={(e) => handleInputChange('expected_retirement_rate', parseFloat(e.target.value) / 100 || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              max="100"
              step="1"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">State Tax Rate</label>
            <input
              type="number"
              value={formData.state_tax_rate * 100}
              onChange={(e) => handleInputChange('state_tax_rate', parseFloat(e.target.value) / 100 || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              max="15"
              step="0.1"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>

          {/* Planning */}
          <div>
            <label className="block text-sm font-medium mb-1">Retirement Age</label>
            <input
              type="number"
              value={formData.retirement_age}
              onChange={(e) => handleInputChange('retirement_age', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="50"
              max="80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Current Year IRA Contributions</label>
            <input
              type="number"
              value={formData.current_year_contributions}
              onChange={(e) => handleInputChange('current_year_contributions', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Proposed Conversion Amount (Optional)</label>
            <input
              type="number"
              value={formData.proposed_conversion_amount || ''}
              onChange={(e) => handleInputChange('proposed_conversion_amount', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              placeholder="Leave blank for recommendation"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Analyzing...' : '🔍 Analyze Roth Conversion'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error: {error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Recommendation Summary */}
          <div className={`border rounded-lg p-6 ${analysis.recommendation.recommended ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {analysis.recommendation.recommended ? '✅ Roth Conversion Recommended' : '⚠️ Consider Alternatives'}
                </h3>
                <p className="text-lg mb-4">
                  <strong>Strategy:</strong> {analysis.recommendation.strategy.replace('_', ' ').toUpperCase()} |{' '}
                  <strong>Timing:</strong> {analysis.recommendation.timing.replace('_', ' ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Recommended Amount</div>
                <div className="text-3xl font-bold text-green-700">
                  {formatCurrency(analysis.recommendation.recommended_amount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <div className="text-sm text-gray-600">Estimated Tax</div>
                <div className="text-xl font-bold">{formatCurrency(analysis.recommendation.estimated_tax)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Break-Even Period</div>
                <div className="text-xl font-bold">{analysis.recommendation.break_even_years.toFixed(1)} years</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Lifetime Benefit</div>
                <div className="text-xl font-bold text-green-700">
                  {formatCurrency(analysis.recommendation.lifetime_benefit)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Remaining Contribution Room</div>
                <div className="text-xl font-bold">{formatCurrency(analysis.remaining_contribution_room)}</div>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">📋 Eligibility Analysis</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Eligible</div>
                <div className="text-lg font-semibold">
                  {analysis.eligibility.is_eligible ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Income Status</div>
                <div className="text-lg font-semibold capitalize">
                  {analysis.eligibility.income_limit_status.replace('_', ' ')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Max Conversion</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(analysis.eligibility.max_conversion_amount)}
                </div>
              </div>
            </div>

            {analysis.eligibility.pro_rata_rule_applies && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">⚠️ Pro-Rata Rule Applies</h4>
                <p className="text-sm mb-2">
                  {analysis.eligibility.pro_rata_taxable_percentage.toFixed(1)}% of your conversion will be taxable due to existing pre-tax IRA balances.
                </p>
              </div>
            )}

            {analysis.eligibility.eligibility_notes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Notes:</h4>
                {analysis.eligibility.eligibility_notes.map((note, idx) => (
                  <p key={idx} className="text-sm text-gray-700">• {note}</p>
                ))}
              </div>
            )}

            {analysis.eligibility.warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-orange-700">Warnings:</h4>
                {analysis.eligibility.warnings.map((warning, idx) => (
                  <p key={idx} className="text-sm text-orange-700">⚠️ {warning}</p>
                ))}
              </div>
            )}
          </div>

          {/* Tax Impact */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">💰 Tax Impact Analysis</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Conversion Amount</div>
                <div className="text-lg font-semibold">{formatCurrency(analysis.tax_impact.conversion_amount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Federal Tax</div>
                <div className="text-lg font-semibold">{formatCurrency(analysis.tax_impact.ordinary_income_tax)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">State Tax</div>
                <div className="text-lg font-semibold">{formatCurrency(analysis.tax_impact.state_tax)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Tax Due</div>
                <div className="text-lg font-bold text-red-600">{formatCurrency(analysis.tax_impact.total_tax_due)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Effective Rate</div>
                <div className="text-lg font-semibold">{formatPercentage(analysis.tax_impact.effective_tax_rate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Bracket</div>
                <div className="text-lg font-semibold">{analysis.tax_impact.tax_bracket_before}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">After Conversion Bracket</div>
                <div className={`text-lg font-semibold ${analysis.tax_impact.marginal_rate_impact ? 'text-orange-600' : ''}`}>
                  {analysis.tax_impact.tax_bracket_after}
                  {analysis.tax_impact.marginal_rate_impact && ' ⬆️'}
                </div>
              </div>
            </div>

            {analysis.tax_impact.marginal_rate_impact && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Tax Bracket Impact:</strong> This conversion would push you into a higher tax bracket.
                  Consider converting up to {formatCurrency(analysis.tax_impact.recommended_max_conversion)} to stay in your current bracket.
                </p>
              </div>
            )}
          </div>

          {/* Reasoning */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">💡 Recommendation Reasoning</h3>
            <div className="space-y-2">
              {analysis.recommendation.reasoning.map((reason, idx) => (
                <p key={idx} className="text-gray-700">{reason}</p>
              ))}
            </div>
          </div>

          {/* Action Steps */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">✅ Action Steps</h3>
            <ol className="space-y-3">
              {analysis.recommendation.action_steps.map((step, idx) => (
                <li key={idx} className="flex">
                  <span className="font-semibold mr-2">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Considerations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">🤔 Important Considerations</h3>
            <div className="space-y-2">
              {analysis.recommendation.considerations.map((consideration, idx) => (
                <p key={idx} className="text-gray-700">{consideration}</p>
              ))}
            </div>

            {analysis.five_year_rule_date && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="font-semibold">📅 Five-Year Rule:</p>
                <p className="text-sm text-gray-700">
                  Converted amounts will be penalty-free after {analysis.five_year_rule_date}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RothConversionAnalysis;
