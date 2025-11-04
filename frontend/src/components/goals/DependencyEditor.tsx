/**
 * Dependency Editor Component
 *
 * Form-based UI for creating and editing goal dependencies.
 * Supports all dependency types: sequential, conditional, blocking, linked.
 */

import { useState, useEffect } from 'react';
import type { Goal } from '../../types/goal';
import type {
  GoalDependency,
  DependencyType,
  DependencyCreationRequest,
  DependencyUpdateRequest,
} from '../../types/goalDependencies';
import * as dependencyApi from '../../services/goalDependenciesApi';

export interface DependencyEditorProps {
  goals: Goal[];
  existingDependency?: GoalDependency;
  onSave: (dependency: GoalDependency) => void;
  onCancel: () => void;
  sourceGoalId?: string;
  targetGoalId?: string;
}

export function DependencyEditor({
  goals,
  existingDependency,
  onSave,
  onCancel,
  sourceGoalId: initialSourceId,
  targetGoalId: initialTargetId,
}: DependencyEditorProps) {
  const [sourceGoalId, setSourceGoalId] = useState<string>(
    existingDependency?.source_goal_id || initialSourceId || ''
  );
  const [targetGoalId, setTargetGoalId] = useState<string>(
    existingDependency?.target_goal_id || initialTargetId || ''
  );
  const [dependencyType, setDependencyType] = useState<DependencyType>(
    existingDependency?.dependency_type || 'sequential'
  );
  const [description, setDescription] = useState<string>(
    existingDependency?.description || ''
  );
  const [condition, setCondition] = useState<string>(
    existingDependency?.condition || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!existingDependency;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sourceGoalId || !targetGoalId) {
      setError('Please select both source and target goals');
      return;
    }

    if (sourceGoalId === targetGoalId) {
      setError('A goal cannot depend on itself');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const updateRequest: DependencyUpdateRequest = {
          dependency_type: dependencyType,
          description: description || undefined,
          condition: condition || undefined,
        };
        const updated = await dependencyApi.updateDependency(
          existingDependency.id,
          updateRequest
        );
        onSave(updated);
      } else {
        const createRequest: DependencyCreationRequest = {
          source_goal_id: sourceGoalId,
          target_goal_id: targetGoalId,
          dependency_type: dependencyType,
          description: description || undefined,
          condition: condition || undefined,
        };
        const created = await dependencyApi.createDependency(createRequest);
        onSave(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dependency');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGoalTitle = (goalId: string): string => {
    const goal = goals.find((g) => g.id === goalId);
    return goal?.title || 'Unknown Goal';
  };

  const availableTargetGoals = goals.filter((g) => g.id !== sourceGoalId);
  const availableSourceGoals = goals.filter((g) => g.id !== targetGoalId);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        {isEditMode ? 'Edit Dependency' : 'Create Dependency'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Source Goal Selection */}
        <div>
          <label htmlFor="sourceGoal" className="block text-sm font-medium text-gray-700 mb-2">
            Source Goal (depends on)
          </label>
          <select
            id="sourceGoal"
            value={sourceGoalId}
            onChange={(e) => setSourceGoalId(e.target.value)}
            disabled={isEditMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select a goal</option>
            {availableSourceGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title} ({goal.category})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            The goal that has a dependency (dependent goal)
          </p>
        </div>

        {/* Target Goal Selection */}
        <div>
          <label htmlFor="targetGoal" className="block text-sm font-medium text-gray-700 mb-2">
            Target Goal (prerequisite)
          </label>
          <select
            id="targetGoal"
            value={targetGoalId}
            onChange={(e) => setTargetGoalId(e.target.value)}
            disabled={isEditMode}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select a goal</option>
            {availableTargetGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title} ({goal.category})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            The goal that must be satisfied first (prerequisite goal)
          </p>
        </div>

        {/* Dependency Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dependency Type
          </label>
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="radio"
                name="dependencyType"
                value="sequential"
                checked={dependencyType === 'sequential'}
                onChange={(e) => setDependencyType(e.target.value as DependencyType)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Sequential</div>
                <div className="text-sm text-gray-500">
                  Target goal must be completed before source goal can start
                </div>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="dependencyType"
                value="conditional"
                checked={dependencyType === 'conditional'}
                onChange={(e) => setDependencyType(e.target.value as DependencyType)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Conditional</div>
                <div className="text-sm text-gray-500">
                  Source goal starts only if target goal meets specific conditions
                </div>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="dependencyType"
                value="blocking"
                checked={dependencyType === 'blocking'}
                onChange={(e) => setDependencyType(e.target.value as DependencyType)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Blocking</div>
                <div className="text-sm text-gray-500">
                  Target goal completely blocks source goal until resolved
                </div>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="dependencyType"
                value="linked"
                checked={dependencyType === 'linked'}
                onChange={(e) => setDependencyType(e.target.value as DependencyType)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Linked</div>
                <div className="text-sm text-gray-500">
                  Goals share resources and progress together
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Explain the relationship between these goals..."
          />
        </div>

        {/* Condition (for conditional dependencies) */}
        {dependencyType === 'conditional' && (
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <input
              type="text"
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 'Target goal reaches 50% completion'"
              required={dependencyType === 'conditional'}
            />
            <p className="mt-1 text-xs text-gray-500">
              Specify the condition that triggers the source goal
            </p>
          </div>
        )}

        {/* Dependency Preview */}
        {sourceGoalId && targetGoalId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="text-sm font-medium text-blue-900 mb-2">Dependency Preview:</div>
            <div className="text-sm text-blue-700">
              <span className="font-semibold">{getGoalTitle(sourceGoalId)}</span>
              {' → '}
              <span className="text-blue-500">
                {dependencyType === 'sequential' && 'starts after'}
                {dependencyType === 'conditional' && 'starts if'}
                {dependencyType === 'blocking' && 'is blocked by'}
                {dependencyType === 'linked' && 'is linked to'}
              </span>
              {' → '}
              <span className="font-semibold">{getGoalTitle(targetGoalId)}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Dependency' : 'Create Dependency'}
          </button>
        </div>
      </form>
    </div>
  );
}
