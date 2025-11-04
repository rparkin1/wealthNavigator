/**
 * Milestone Manager Component
 *
 * CRUD interface for managing goal milestones with creation, editing, and deletion.
 * Includes auto-generation and progress checking capabilities.
 */

import { useState, useEffect } from 'react';
import type { Goal } from '../../types/goal';
import type {
  Milestone,
  MilestoneCreationRequest,
  MilestoneUpdateRequest,
} from '../../types/goalMilestones';
import * as milestoneApi from '../../services/goalMilestonesApi';

export interface MilestoneManagerProps {
  goal: Goal;
  onClose: () => void;
  onMilestonesUpdated?: () => void;
}

export function MilestoneManager({
  goal,
  onClose,
  onMilestonesUpdated,
}: MilestoneManagerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState<MilestoneCreationRequest>({
    title: '',
    target_amount: undefined,
    target_date: '',
    description: '',
  });

  useEffect(() => {
    loadMilestones();
  }, [goal.id]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await milestoneApi.getMilestones(goal.id);
      setMilestones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!confirm('This will generate milestones automatically. Continue?')) return;

    try {
      setError(null);
      const generated = await milestoneApi.autoGenerateMilestones(goal.id);
      setMilestones(generated);
      if (onMilestonesUpdated) onMilestonesUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-generate milestones');
    }
  };

  const handleCreateMilestone = async () => {
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    try {
      setError(null);
      const created = await milestoneApi.createMilestone(goal.id, formData);
      setMilestones((prev) => [...prev, created]);
      setShowForm(false);
      setFormData({ title: '', target_amount: undefined, target_date: '', description: '' });
      if (onMilestonesUpdated) onMilestonesUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create milestone');
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone) return;

    try {
      setError(null);
      const updateRequest: MilestoneUpdateRequest = {
        title: formData.title,
        target_amount: formData.target_amount,
        target_date: formData.target_date || undefined,
        description: formData.description,
      };
      const updated = await milestoneApi.updateMilestone(
        goal.id,
        editingMilestone.id,
        updateRequest
      );
      setMilestones((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      setEditingMilestone(null);
      setShowForm(false);
      setFormData({ title: '', target_amount: undefined, target_date: '', description: '' });
      if (onMilestonesUpdated) onMilestonesUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Delete this milestone?')) return;

    try {
      setError(null);
      await milestoneApi.deleteMilestone(goal.id, milestoneId);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      if (onMilestonesUpdated) onMilestonesUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete milestone');
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      setError(null);
      const completed = await milestoneApi.completeMilestone(goal.id, milestoneId);
      setMilestones((prev) =>
        prev.map((m) => (m.id === completed.id ? completed : m))
      );
      if (onMilestonesUpdated) onMilestonesUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete milestone');
    }
  };

  const handleEditClick = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      target_amount: milestone.target_amount,
      target_date: milestone.target_date || '',
      description: milestone.description || '',
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMilestone(null);
    setFormData({ title: '', target_amount: undefined, target_date: '', description: '' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Milestones</h2>
          <p className="text-sm text-gray-600 mt-1">{goal.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      {!showForm && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Milestone
          </button>
          <button
            onClick={handleAutoGenerate}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            🤖 Auto-Generate
          </button>
        </div>
      )}

      {/* Milestone Form */}
      {showForm && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingMilestone ? 'Edit Milestone' : 'New Milestone'}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., First Quarter Milestone"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  id="target_amount"
                  value={formData.target_amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                />
              </div>

              <div>
                <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  id="target_date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={editingMilestone ? handleUpdateMilestone : handleCreateMilestone}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editingMilestone ? 'Update' : 'Create'}
              </button>
              <button
                onClick={handleCancelForm}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-2">No milestones yet</p>
          <p className="text-sm text-gray-400">
            Add milestones manually or use auto-generate
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`border rounded-lg p-4 ${
                milestone.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4
                      className={`font-semibold ${
                        milestone.completed
                          ? 'text-green-900 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {milestone.title}
                    </h4>
                    {milestone.auto_generated && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Auto
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    {milestone.target_amount && (
                      <span>Target: {formatCurrency(milestone.target_amount)}</span>
                    )}
                    {milestone.target_date && (
                      <span>Date: {formatDate(milestone.target_date)}</span>
                    )}
                  </div>

                  {milestone.description && (
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                  )}

                  {milestone.completed && milestone.completed_date && (
                    <p className="text-xs text-green-700 mt-2">
                      Completed: {formatDate(milestone.completed_date)}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  {!milestone.completed && (
                    <>
                      <button
                        onClick={() => handleCompleteMilestone(milestone.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                        title="Mark as completed"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleEditClick(milestone)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        title="Edit"
                      >
                        Edit
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
