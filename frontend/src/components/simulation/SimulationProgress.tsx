/**
 * SimulationProgress Component
 *
 * Shows real-time progress for Monte Carlo simulation execution.
 */

interface SimulationProgressProps {
  progress: number; // 0-100
  status: 'running' | 'complete' | 'failed';
  currentIteration?: number;
  totalIterations?: number;
  estimatedTimeRemaining?: number; // seconds
}

export function SimulationProgress({
  progress,
  status,
  currentIteration,
  totalIterations,
  estimatedTimeRemaining
}: SimulationProgressProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-blue-600';
      case 'complete': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return (
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'complete':
        return (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running': return 'Running simulation...';
      case 'complete': return 'Simulation complete!';
      case 'failed': return 'Simulation failed';
      default: return 'Unknown status';
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        {getStatusIcon()}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{getStatusText()}</h4>
          {currentIteration !== undefined && totalIterations !== undefined && (
            <p className="text-xs text-gray-600 mt-1">
              {currentIteration.toLocaleString()} / {totalIterations.toLocaleString()} iterations
              {estimatedTimeRemaining !== undefined && status === 'running' && (
                <span className="ml-2">
                  • Est. {formatTime(estimatedTimeRemaining)} remaining
                </span>
              )}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStatusColor()} transition-all duration-300 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Performance Stats (if complete) */}
      {status === 'complete' && (
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500">Total Iterations</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">
              {totalIterations?.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="text-sm font-semibold text-green-600 mt-1">Success</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Accuracy</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">
              {totalIterations && totalIterations >= 5000 ? 'High' : 'Medium'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
