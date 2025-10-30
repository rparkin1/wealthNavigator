/**
 * SimulationResults Component
 *
 * Displays statistical results from Monte Carlo simulation.
 */

interface SimulationStatistics {
  median_final_value: number;
  percentile_10: number;
  percentile_25: number;
  percentile_75: number;
  percentile_90: number;
  best_case: number;
  worst_case: number;
  probability_of_loss: number;
}

interface SimulationResultsProps {
  successProbability: number;
  statistics: SimulationStatistics;
  goalAmount?: number;
  iterations: number;
}

export function SimulationResults({
  successProbability,
  statistics,
  goalAmount,
  iterations
}: SimulationResultsProps) {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const getSuccessColor = (probability: number): string => {
    if (probability >= 0.85) return 'text-green-600';
    if (probability >= 0.70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessGrade = (probability: number): string => {
    if (probability >= 0.90) return 'Excellent';
    if (probability >= 0.80) return 'Good';
    if (probability >= 0.70) return 'Fair';
    if (probability >= 0.60) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className="space-y-6">
      {/* Success Probability Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">Goal Success Probability</div>
          <div className={`text-5xl font-bold mb-2 ${getSuccessColor(successProbability)}`}>
            {(successProbability * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">
            {getSuccessGrade(successProbability)} chance of reaching goal
          </div>
          {goalAmount && (
            <div className="text-xs text-gray-500 mt-2">
              Target: {formatCurrency(goalAmount)}
            </div>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-6">
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                successProbability >= 0.85
                  ? 'bg-green-600'
                  : successProbability >= 0.70
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${successProbability * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Based on {iterations.toLocaleString()} simulations
        </div>
      </div>

      {/* Portfolio Value Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Final Portfolio Value Distribution
        </h4>

        <div className="space-y-3">
          {/* Best Case */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">Best Case (Max)</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(statistics.best_case)}
            </span>
          </div>

          {/* 90th Percentile */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span className="text-sm text-gray-700">90th Percentile</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(statistics.percentile_90)}
            </span>
          </div>

          {/* 75th Percentile */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 rounded-full" />
              <span className="text-sm text-gray-700">75th Percentile</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(statistics.percentile_75)}
            </span>
          </div>

          {/* Median */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100 bg-blue-50 -mx-2 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-sm font-semibold text-gray-900">Median (50th)</span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {formatCurrency(statistics.median_final_value)}
            </span>
          </div>

          {/* 25th Percentile */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-300 rounded-full" />
              <span className="text-sm text-gray-700">25th Percentile</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(statistics.percentile_25)}
            </span>
          </div>

          {/* 10th Percentile */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full" />
              <span className="text-sm text-gray-700">10th Percentile</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(statistics.percentile_10)}
            </span>
          </div>

          {/* Worst Case */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-700">Worst Case (Min)</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(statistics.worst_case)}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Risk Metrics</h4>

        <div className="grid grid-cols-2 gap-4">
          {/* Probability of Loss */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Probability of Loss</div>
            <div className="text-2xl font-bold text-gray-900">
              {(statistics.probability_of_loss * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Risk of ending below starting value
            </div>
          </div>

          {/* Range of Outcomes */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Range of Outcomes</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(statistics.best_case - statistics.worst_case)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Difference between best and worst
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex gap-2">
            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-blue-900">
              <strong>Interpretation:</strong> In {(successProbability * 100).toFixed(0)}% of scenarios,
              you reach your goal. The median outcome is {formatCurrency(statistics.median_final_value)},
              meaning half of scenarios end above this value and half below.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
