/**
 * Sequential Goal Planner Component
 *
 * Timeline coordinator showing goals in dependency order.
 * Visualizes optimized timeline and sequencing recommendations.
 */

import { useState, useEffect } from 'react';
import type { Goal } from '../../types/goal';
import type {
  GoalDependency,
  DependencyTimeline,
  DependencyOptimization,
} from '../../types/goalDependencies';
import * as dependencyApi from '../../services/goalDependenciesApi';

export interface SequentialGoalPlannerProps {
  goals: Goal[];
  dependencies: GoalDependency[];
  onReorder?: (optimizedSequence: string[]) => void;
}

export function SequentialGoalPlanner({
  goals,
  dependencies,
  onReorder,
}: SequentialGoalPlannerProps) {
  const [timeline, setTimeline] = useState<DependencyTimeline[]>([]);
  const [optimization, setOptimization] = useState<DependencyOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptimization, setShowOptimization] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [goals, dependencies]);

  const loadTimeline = async () => {
    if (goals.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const goalIds = goals.map((g) => g.id);
      const [timelineData, optimizationData] = await Promise.all([
        dependencyApi.getOptimizedTimeline(goalIds),
        dependencyApi.optimizeSequencing(goalIds),
      ]);
      setTimeline(timelineData);
      setOptimization(optimizationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyOptimization = () => {
    if (optimization && onReorder) {
      onReorder(optimization.optimized_sequence);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const getGoalById = (goalId: string): Goal | undefined => {
    return goals.find((g) => g.id === goalId);
  };

  const getGoalIcon = (category: string): string => {
    const icons: Record<string, string> = {
      retirement: '🏖️',
      education: '🎓',
      home: '🏠',
      major_expense: '💎',
      emergency: '💰',
      legacy: '🌳',
    };
    return icons[category] || '🎯';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Optimizing goal sequence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadTimeline}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-2">No goals to display</p>
        <p className="text-sm text-gray-400">Create some goals to see the optimized timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Goal Timeline</h3>
        {optimization && (
          <button
            onClick={() => setShowOptimization(!showOptimization)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showOptimization ? 'Hide' : 'Show'} Optimization
          </button>
        )}
      </div>

      {/* Optimization Panel */}
      {showOptimization && optimization && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Optimized Sequence Recommendations
          </h4>

          {/* Total Duration */}
          <div className="mb-4">
            <div className="text-sm text-gray-600">Total Timeline Duration</div>
            <div className="text-2xl font-bold text-blue-600">
              {optimization.total_duration_months} months
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({Math.round(optimization.total_duration_months / 12)} years)
              </span>
            </div>
          </div>

          {/* Critical Path */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Critical Path:</div>
            <div className="flex flex-wrap gap-2">
              {optimization.critical_path.map((goalId, index) => {
                const goal = getGoalById(goalId);
                return (
                  <div
                    key={goalId}
                    className="flex items-center bg-white border border-red-300 rounded-md px-3 py-1"
                  >
                    <span className="mr-2">{goal ? getGoalIcon(goal.category) : '🎯'}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {goal?.title || 'Unknown'}
                    </span>
                    {index < optimization.critical_path.length - 1 && (
                      <span className="ml-2 text-gray-400">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parallel Groups */}
          {optimization.parallel_groups.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Goals that can be pursued simultaneously:
              </div>
              <div className="space-y-2">
                {optimization.parallel_groups.map((group, groupIndex) => (
                  <div key={groupIndex} className="bg-white border border-green-300 rounded-md p-3">
                    <div className="text-xs text-green-700 font-medium mb-1">
                      Group {groupIndex + 1}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.map((goalId) => {
                        const goal = getGoalById(goalId);
                        return (
                          <div key={goalId} className="flex items-center text-sm">
                            <span className="mr-1">{goal ? getGoalIcon(goal.category) : '🎯'}</span>
                            <span className="text-gray-900">{goal?.title || 'Unknown'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {optimization.recommendations.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Recommendations:</div>
              <ul className="space-y-1">
                {optimization.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply Button */}
          {onReorder && (
            <button
              onClick={handleApplyOptimization}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Apply Optimized Sequence
            </button>
          )}
        </div>
      )}

      {/* Timeline View */}
      <div className="space-y-4">
        {timeline.map((item) => {
          const goal = getGoalById(item.goal_id);
          if (!goal) return null;

          return (
            <div
              key={item.goal_id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="text-2xl mr-3">{getGoalIcon(goal.category)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.goal_title}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Earliest Start:</span>
                        {formatDate(item.earliest_start)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Latest Start:</span>
                        {formatDate(item.latest_start)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">Duration:</span>
                        {item.duration_months} months
                      </div>
                    </div>

                    {/* Dependencies */}
                    {item.dependencies.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Depends on:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.dependencies.map((depId) => {
                            const depGoal = getGoalById(depId);
                            return (
                              <span
                                key={depId}
                                className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded"
                              >
                                {depGoal?.title || 'Unknown'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dependents */}
                    {item.dependents.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">Blocks:</div>
                        <div className="flex flex-wrap gap-2">
                          {item.dependents.map((depId) => {
                            const depGoal = getGoalById(depId);
                            return (
                              <span
                                key={depId}
                                className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                              >
                                {depGoal?.title || 'Unknown'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goal Status Badge */}
                <div className="ml-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'achieved'
                        ? 'bg-green-100 text-green-800'
                        : goal.status === 'at_risk'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {goal.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
