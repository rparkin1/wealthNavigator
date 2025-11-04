/**
 * Insurance Gap Analysis
 *
 * Comprehensive view of all insurance gaps and prioritized action items
 */

import React, { useEffect, useState } from 'react';
import { insuranceOptimizationApi } from '../../services/insuranceOptimizationApi';
import type {
  LifeInsuranceAnalysis,
  DisabilityCoverageAnalysis,
  LongTermCareAnalysis,
  InsuranceGapAnalysis as IGapAnalysis,
} from '../../types/insurance';

interface InsuranceGapAnalysisProps {
  lifeAnalysis: LifeInsuranceAnalysis | null;
  disabilityAnalysis: DisabilityCoverageAnalysis | null;
  ltcAnalysis: LongTermCareAnalysis | null;
  gapAnalysis?: IGapAnalysis | null;
}

const InsuranceGapAnalysis: React.FC<InsuranceGapAnalysisProps> = ({
  lifeAnalysis,
  disabilityAnalysis,
  ltcAnalysis,
  gapAnalysis: externalGapAnalysis,
}) => {
  const [gapAnalysis, setGapAnalysis] = useState<IGapAnalysis | null>(externalGapAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lifeAnalysis && disabilityAnalysis && ltcAnalysis && !externalGapAnalysis) {
      analyzeGaps();
    }
  }, [lifeAnalysis, disabilityAnalysis, ltcAnalysis]);

  const analyzeGaps = async () => {
    if (!lifeAnalysis || !disabilityAnalysis || !ltcAnalysis) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await insuranceOptimizationApi.analyzeInsuranceGaps({
        life_insurance_analysis: lifeAnalysis,
        disability_analysis: disabilityAnalysis,
        ltc_analysis: ltcAnalysis,
      });

      setGapAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze insurance gaps');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (!lifeAnalysis || !disabilityAnalysis || !ltcAnalysis) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Complete All Analyses First</h3>
        <p className="text-gray-600">
          Please complete the Life Insurance, Disability Coverage, and Long-Term Care analyses
          to see your comprehensive insurance gap analysis.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <div className={`px-4 py-2 rounded-lg ${lifeAnalysis ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {lifeAnalysis ? '✓' : '○'} Life Insurance
          </div>
          <div className={`px-4 py-2 rounded-lg ${disabilityAnalysis ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {disabilityAnalysis ? '✓' : '○'} Disability
          </div>
          <div className={`px-4 py-2 rounded-lg ${ltcAnalysis ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {ltcAnalysis ? '✓' : '○'} Long-Term Care
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-6xl mb-4">⚙️</div>
        <p className="text-gray-600">Analyzing insurance gaps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-800">{error}</p>
        <button
          onClick={analyzeGaps}
          className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!gapAnalysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Comprehensive Insurance Gap Analysis</h2>
        <p className="text-gray-600">
          Overview of all insurance gaps and prioritized recommendations
        </p>
      </div>

      {/* Overall Summary */}
      <div className={`p-6 rounded-lg border-2 ${getRiskColor(gapAnalysis.overall_risk_level)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Overall Risk Level</div>
            <div className="text-3xl font-bold">
              {gapAnalysis.overall_risk_level.toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Total Gaps Identified</div>
            <div className="text-3xl font-bold">{gapAnalysis.total_gaps_identified}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Critical Gaps</div>
            <div className="text-3xl font-bold text-red-600">{gapAnalysis.critical_gaps}</div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600 mb-1">Total Annual Cost to Close All Gaps</div>
          <div className="text-2xl font-bold">
            {formatCurrency(gapAnalysis.total_annual_cost_to_close_gaps)}
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎯</span>
          Priority Actions
        </h3>
        <div className="space-y-3">
          {gapAnalysis.priority_actions.map((action, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-xl">{action.startsWith('🚨') ? '🚨' : action.startsWith('⚠️') ? '⚠️' : '✅'}</span>
              <div className="flex-1 text-gray-800">{action.replace(/^[🚨⚠️✅]\s*/, '')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${
          gapAnalysis.summary.has_life_insurance_gap
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="text-center">
            <div className="text-3xl mb-2">
              {gapAnalysis.summary.has_life_insurance_gap ? '⚠️' : '✅'}
            </div>
            <div className="font-semibold text-gray-900">Life Insurance</div>
            <div className={`text-sm mt-1 ${
              gapAnalysis.summary.has_life_insurance_gap ? 'text-red-700' : 'text-green-700'
            }`}>
              {gapAnalysis.summary.has_life_insurance_gap ? 'Gap Identified' : 'Adequate Coverage'}
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          gapAnalysis.summary.has_disability_gap
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="text-center">
            <div className="text-3xl mb-2">
              {gapAnalysis.summary.has_disability_gap ? '⚠️' : '✅'}
            </div>
            <div className="font-semibold text-gray-900">Disability Insurance</div>
            <div className={`text-sm mt-1 ${
              gapAnalysis.summary.has_disability_gap ? 'text-red-700' : 'text-green-700'
            }`}>
              {gapAnalysis.summary.has_disability_gap ? 'Gap Identified' : 'Adequate Coverage'}
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          gapAnalysis.summary.has_ltc_gap
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="text-center">
            <div className="text-3xl mb-2">
              {gapAnalysis.summary.has_ltc_gap ? '⚠️' : '✅'}
            </div>
            <div className="font-semibold text-gray-900">Long-Term Care</div>
            <div className={`text-sm mt-1 ${
              gapAnalysis.summary.has_ltc_gap ? 'text-red-700' : 'text-green-700'
            }`}>
              {gapAnalysis.summary.has_ltc_gap ? 'Gap Identified' : 'Adequate Coverage'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Gaps */}
      {gapAnalysis.gaps.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Gap Analysis</h3>
          {gapAnalysis.gaps.map((gap, idx) => (
            <div key={idx} className={`p-6 rounded-lg border-2 ${
              gap.priority === 'high'
                ? 'bg-red-50 border-red-300'
                : 'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                    gap.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {gap.priority.toUpperCase()} PRIORITY
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {gap.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <p className="text-sm text-gray-700 mt-1">{gap.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Annual Cost</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(gap.annual_cost)}
                  </div>
                </div>
              </div>

              {gap.gap_amount && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Coverage Gap Amount</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(gap.gap_amount)}
                  </div>
                </div>
              )}

              {(gap.std_gap || gap.ltd_monthly_gap) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {gap.std_gap && gap.std_gap > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Short-Term Disability Gap</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(gap.std_gap)}
                      </div>
                    </div>
                  )}
                  {gap.ltd_monthly_gap && gap.ltd_monthly_gap > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Long-Term Disability Monthly Gap</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(gap.ltd_monthly_gap)}/month
                      </div>
                    </div>
                  )}
                </div>
              )}

              {gap.recommendations && gap.recommendations.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Recommendations:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {gap.recommendations.map((rec: any, ridx: number) => {
                      if (typeof rec === 'string') {
                        return <li key={ridx}>• {rec}</li>;
                      }
                      return (
                        <li key={ridx}>
                          • {rec.type || rec.coverage_type || rec.strategy}: {rec.reason || rec.description}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Gaps Message */}
      {gapAnalysis.gaps.length === 0 && (
        <div className="bg-green-50 p-12 rounded-lg border border-green-200 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Excellent! No Insurance Gaps Detected
          </h3>
          <p className="text-green-700">
            Your insurance coverage appears adequate across all categories.
            Continue to review annually as your circumstances change.
          </p>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 Next Steps
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Schedule consultations with licensed insurance agents for quotes</li>
          <li>• Compare policies from at least 3 different providers</li>
          <li>• Review policy details carefully before purchasing</li>
          <li>• Update beneficiary designations on all policies</li>
          <li>• Re-evaluate insurance needs annually or after major life events</li>
          <li>• Keep all policy documents in a secure, accessible location</li>
        </ul>
      </div>
    </div>
  );
};

export default InsuranceGapAnalysis;
