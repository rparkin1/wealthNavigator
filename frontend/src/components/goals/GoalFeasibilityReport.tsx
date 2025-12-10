/**
 * Goal Feasibility Report Component
 *
 * Displays AI analysis of goal feasibility, conflicts, and recommendations.
 */

import type {
  ParsedGoalData,
  GoalRecommendations,
  GoalConflict,
  UserContext,
} from '../../types/aiGoalAssistance';

export interface GoalFeasibilityReportProps {
  parsedGoal: ParsedGoalData;
  recommendations: GoalRecommendations | null;
  conflicts: GoalConflict[];
  userContext: UserContext;
}

export function GoalFeasibilityReport({
  parsedGoal,
  recommendations,
  conflicts,
  userContext,
}: GoalFeasibilityReportProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  const feasibilityScore = calculateFeasibilityScore(
    parsedGoal,
    recommendations,
    conflicts,
    userContext
  );

  return (
    <div className="space-y-4">
      {/* Feasibility Score */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Feasibility Analysis</h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-700">
              {feasibilityScore}%
            </div>
            <div className="text-sm text-gray-600">Success Likelihood</div>
          </div>
        </div>

        <div className="bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all ${
              feasibilityScore >= 80
                ? 'bg-green-600'
                : feasibilityScore >= 60
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${feasibilityScore}%` }}
          />
        </div>

        <p className="text-sm text-gray-700">
          {feasibilityScore >= 80
            ? '✅ This goal appears highly achievable with your current plan'
            : feasibilityScore >= 60
            ? '⚡ This goal is achievable but may require adjustments'
            : '⚠️ This goal may be challenging with current parameters'}
        </p>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>⚠️</span>
            Potential Conflicts ({conflicts.length})
          </h4>

          {conflicts.map((conflict, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getSeverityIcon(conflict.severity)}</span>
                  <h5 className="font-semibold capitalize">
                    {conflict.conflict_type.replace('_', ' ')}
                  </h5>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  conflict.severity === 'critical'
                    ? 'bg-red-200 text-red-800'
                    : conflict.severity === 'high'
                    ? 'bg-orange-200 text-orange-800'
                    : conflict.severity === 'medium'
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-blue-200 text-blue-800'
                }`}>
                  {conflict.severity}
                </span>
              </div>

              <p className="text-gray-700 mb-3">{conflict.description}</p>

              {conflict.affected_goals.length > 0 && (
                <div className="mb-3">
                  <label className="text-sm font-medium text-gray-600">Affected Goals:</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {conflict.affected_goals.map((goalId, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white px-2 py-1 rounded border border-gray-300"
                      >
                        {goalId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {conflict.suggestions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Suggestions:</label>
                  <ul className="mt-1 space-y-1">
                    {conflict.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Conflicts */}
      {conflicts.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="font-semibold text-green-900">No Conflicts Detected</h4>
              <p className="text-sm text-green-700">
                This goal appears compatible with your existing financial plans
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Considerations */}
      {recommendations && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>💡</span>
            Key Considerations
          </h4>

          <div className="space-y-3">
            {/* Savings Rate */}
            <div className="bg-white rounded p-3 border border-blue-100">
              <label className="text-sm text-gray-600">Recommended Savings Rate</label>
              <p className="text-lg font-semibold text-gray-900">
                {(recommendations.suggested_savings_rate * 100).toFixed(1)}% of income
              </p>
              <p className="text-sm text-gray-600">
                ${recommendations.monthly_contribution.toLocaleString()}/month
              </p>
            </div>

            {/* Trade-offs */}
            {recommendations.trade_offs && recommendations.trade_offs.length > 0 && (
              <div className="bg-white rounded p-3 border border-blue-100">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Trade-offs to Consider:</label>
                <ul className="space-y-1">
                  {recommendations.trade_offs.map((tradeOff, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>{tradeOff}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Guidance */}
            {recommendations.risk_guidance && (
              <div className="bg-white rounded p-3 border border-blue-100">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Risk Guidance:</label>
                <p className="text-sm text-gray-700">{recommendations.risk_guidance}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate overall feasibility score based on various factors
 */
function calculateFeasibilityScore(
  parsedGoal: ParsedGoalData,
  recommendations: GoalRecommendations | null,
  conflicts: GoalConflict[],
  userContext: UserContext
): number {
  let score = 100;

  // Deduct for conflicts
  conflicts.forEach(conflict => {
    switch (conflict.severity) {
      case 'critical':
        score -= 25;
        break;
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 8;
        break;
      case 'low':
        score -= 3;
        break;
    }
  });

  // Deduct for high savings rate requirements
  if (recommendations && recommendations.suggested_savings_rate > 0.3) {
    score -= 15; // >30% savings rate is challenging
  } else if (recommendations && recommendations.suggested_savings_rate > 0.2) {
    score -= 8; // >20% savings rate is moderate
  }

  // Deduct for confidence
  if (parsedGoal.confidence && parsedGoal.confidence < 0.7) {
    score -= 10; // Low confidence in parsing
  }

  // Ensure score is within bounds
  return Math.max(0, Math.min(100, Math.round(score)));
}
