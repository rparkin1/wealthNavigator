/**
 * useGoals Hook
 * React Query hook for goal management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Goal, GoalCategory, GoalPriority } from '../types/goal';

const GOALS_QUERY_KEY = ['goals'] as const;

interface UseGoalsOptions {
  userId: string;
  category?: GoalCategory;
  priority?: GoalPriority;
}

/**
 * Hook to fetch and manage goals
 */
export function useGoals({ userId, category, priority }: UseGoalsOptions) {
  const queryClient = useQueryClient();

  // Fetch all goals
  const {
    data: goals = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...GOALS_QUERY_KEY, userId, category, priority],
    queryFn: () => apiClient.getGoals(userId, { category, priority }),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (goalData: Omit<Goal, 'id' | 'status'>) =>
      apiClient.createGoal(userId, goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) =>
      apiClient.updateGoal(id, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => apiClient.deleteGoal(goalId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });

  // Analyze goal mutation
  const analyzeGoalMutation = useMutation({
    mutationFn: (goalId: string) => apiClient.analyzeGoal(goalId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });

  return {
    // Data
    goals,
    isLoading,
    error,

    // Actions
    refetch,
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    analyzeGoal: analyzeGoalMutation.mutateAsync,

    // Mutation states
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
    isAnalyzing: analyzeGoalMutation.isPending,
  };
}

/**
 * Hook to fetch a single goal
 */
export function useGoal(goalId: string | null, userId: string) {
  return useQuery({
    queryKey: [...GOALS_QUERY_KEY, 'detail', goalId, userId],
    queryFn: () => apiClient.getGoal(goalId!, userId),
    enabled: !!goalId && !!userId,
    staleTime: 30000,
  });
}
