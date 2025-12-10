/**
 * Goals Manager Component
 *
 * Complete interface for managing financial goals with dashboard and forms.
 */

import { useState, useEffect } from 'react';
import { GoalDashboard } from './GoalDashboard';
import { GoalForm } from './GoalForm';
import type { Goal } from './GoalCard';

export interface GoalsManagerProps {
  userId: string;
}

export function GoalsManager({ userId }: GoalsManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/goals?user_id=${userId}`);
      // const data = await response.json();
      // setGoals(data.goals);

      // Mock data for now
      setGoals([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleNewGoal = () => {
    setEditingGoal(null);
    setShowForm(true);
  };

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setEditingGoal(goal);
      setShowForm(true);
    }
  };

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    try {
      // TODO: API call
      if (editingGoal) {
        // Update
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalData } as Goal : g));
      } else {
        // Create
        const newGoal: Goal = {
          ...goalData as Goal,
          id: crypto.randomUUID(),
          currentAmount: 0,
          status: 'on_track',
        };
        setGoals(prev => [...prev, newGoal]);
      }
      setShowForm(false);
      setEditingGoal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return;

    try {
      // TODO: API call
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  };

  const handleViewDetails = (goalId: string) => {
    // Navigate to goal details or open detailed modal
    console.log('View details for goal:', goalId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Goal Dashboard */}
      <GoalDashboard
        goals={goals}
        onNewGoal={handleNewGoal}
        onEditGoal={handleEditGoal}
        onDeleteGoal={handleDeleteGoal}
        onViewDetails={handleViewDetails}
      />

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSubmit={handleSaveGoal}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
          mode={editingGoal ? 'edit' : 'create'}
        />
      )}
    </div>
  );
}
