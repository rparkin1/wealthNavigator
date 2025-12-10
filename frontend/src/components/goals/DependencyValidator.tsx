/**
 * Dependency Validator Component
 *
 * Real-time validation warnings for circular dependencies and conflicts.
 * Provides actionable suggestions to resolve dependency issues.
 */

import { useState, useEffect } from 'react';
import type { Goal } from '../../types/goal';
import type {
  GoalDependency,
  DependencyValidation,
} from '../../types/goalDependencies';
import * as dependencyApi from '../../services/goalDependenciesApi';

export interface DependencyValidatorProps {
  goals: Goal[];
  dependencies: GoalDependency[];
  onValidationChange?: (isValid: boolean) => void;
  autoValidate?: boolean;
}

export function DependencyValidator({
  goals,
  dependencies,
  onValidationChange,
  autoValidate = true,
}: DependencyValidatorProps) {
  const [validation, setValidation] = useState<DependencyValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (autoValidate && goals.length > 0) {
      validateDependencies();
    }
  }, [goals, dependencies, autoValidate]);

  useEffect(() => {
    if (validation && onValidationChange) {
      onValidationChange(validation.is_valid);
    }
  }, [validation]);

  const validateDependencies = async () => {
    if (goals.length === 0) return;

    setIsValidating(true);

    try {
      const goalIds = goals.map((g) => g.id);
      const result = await dependencyApi.validateDependencies(goalIds);
      setValidation(result);
    } catch (err) {
      console.error('Validation error:', err);
      setValidation({
        is_valid: false,
        errors: ['Failed to validate dependencies'],
        warnings: [],
        cycles_detected: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  if (!validation && !isValidating) {
    return null;
  }

  if (isValidating) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-sm text-gray-600">Validating dependencies...</span>
        </div>
      </div>
    );
  }

  if (!validation) return null;

  const hasErrors = validation.errors.length > 0 || validation.cycles_detected.length > 0;
  const hasWarnings = validation.warnings.length > 0;

  if (validation.is_valid && !hasWarnings) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-600 text-xl mr-3">✅</span>
          <div>
            <div className="font-medium text-green-900">All dependencies are valid</div>
            <div className="text-sm text-green-700">No circular dependencies or conflicts detected</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Summary */}
      <div
        className={`border rounded-lg p-4 ${
          hasErrors
            ? 'bg-red-50 border-red-300'
            : hasWarnings
            ? 'bg-yellow-50 border-yellow-300'
            : 'bg-green-50 border-green-300'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <span className="text-2xl mr-3">
              {hasErrors ? '❌' : hasWarnings ? '⚠️' : '✅'}
            </span>
            <div>
              <div
                className={`font-medium ${
                  hasErrors
                    ? 'text-red-900'
                    : hasWarnings
                    ? 'text-yellow-900'
                    : 'text-green-900'
                }`}
              >
                {hasErrors
                  ? 'Dependency Errors Detected'
                  : hasWarnings
                  ? 'Dependency Warnings'
                  : 'Dependencies Valid'}
              </div>
              <div
                className={`text-sm mt-1 ${
                  hasErrors
                    ? 'text-red-700'
                    : hasWarnings
                    ? 'text-yellow-700'
                    : 'text-green-700'
                }`}
              >
                {hasErrors && `${validation.errors.length} errors`}
                {hasErrors && hasWarnings && ', '}
                {hasWarnings && `${validation.warnings.length} warnings`}
                {validation.cycles_detected.length > 0 &&
                  `, ${validation.cycles_detected.length} circular dependencies`}
              </div>
            </div>
          </div>
          {(hasErrors || hasWarnings) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm font-medium underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>
      </div>

      {/* Detailed Validation Results */}
      {showDetails && (
        <div className="space-y-4">
          {/* Circular Dependencies */}
          {validation.cycles_detected.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3">
                🔄 Circular Dependencies Detected
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Circular dependencies create impossible constraints. These must be resolved before
                proceeding.
              </p>
              <div className="space-y-2">
                {validation.cycles_detected.map((cycle, index) => (
                  <div key={index} className="bg-white border border-red-300 rounded p-3">
                    <div className="text-xs font-medium text-red-700 mb-1">
                      Cycle {index + 1}:
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {cycle.map((goalId, i) => {
                        const goal = goals.find((g) => g.id === goalId);
                        return (
                          <span key={i} className="flex items-center">
                            <span className="font-medium text-gray-900">
                              {goal?.title || 'Unknown Goal'}
                            </span>
                            {i < cycle.length - 1 && (
                              <span className="mx-2 text-red-500">→</span>
                            )}
                          </span>
                        );
                      })}
                      <span className="mx-2 text-red-500">→</span>
                      <span className="font-medium text-gray-900">
                        {goals.find((g) => g.id === cycle[0])?.title || 'Unknown Goal'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-red-600">
                      💡 Remove one of the dependencies in this chain to break the cycle
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3">❌ Errors</h4>
              <ul className="space-y-2">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start text-sm text-red-700">
                    <span className="mr-2 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-3">⚠️ Warnings</h4>
              <ul className="space-y-2">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start text-sm text-yellow-700">
                    <span className="mr-2 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">💡 Suggestions</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Review the dependency graph visualization to identify problematic relationships</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Consider changing dependency types from 'blocking' to 'conditional' where appropriate</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Break complex dependencies into smaller, more manageable sub-goals</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Ensure that goals with dependencies have realistic timelines</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Revalidate Button */}
      <div className="flex justify-end">
        <button
          onClick={validateDependencies}
          disabled={isValidating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? 'Validating...' : 'Revalidate'}
        </button>
      </div>
    </div>
  );
}
