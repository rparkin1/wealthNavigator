/**
 * Goal Dependencies Types
 *
 * Type definitions for multi-goal relationship management
 */

import type { Goal } from './goal';

export type DependencyType = 'sequential' | 'conditional' | 'blocking' | 'linked';

export interface GoalDependency {
  id: string;
  source_goal_id: string;
  target_goal_id: string;
  dependency_type: DependencyType;
  description?: string;
  condition?: string;
  created_at: string;
}

export interface DependencyValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  cycles_detected: string[][];
}

export interface DependencyTimeline {
  goal_id: string;
  goal_title: string;
  earliest_start: string;
  latest_start: string;
  duration_months: number;
  dependencies: string[];
  dependents: string[];
}

export interface DependencyOptimization {
  optimized_sequence: string[];
  parallel_groups: string[][];
  critical_path: string[];
  total_duration_months: number;
  recommendations: string[];
}

export interface GoalWithDependencies extends Goal {
  dependencies: GoalDependency[];
  dependents: GoalDependency[];
  depth_level: number;
  can_start: boolean;
  blocking_goals: string[];
}

export interface DependencyGraphNode {
  id: string;
  goal: Goal;
  dependencies: GoalDependency[];
  dependents: GoalDependency[];
  x?: number;
  y?: number;
  depth: number;
}

export interface DependencyGraphLink {
  source: string;
  target: string;
  dependency: GoalDependency;
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  links: DependencyGraphLink[];
  cycles: string[][];
  critical_path: string[];
}

export interface DependencyCreationRequest {
  source_goal_id: string;
  target_goal_id: string;
  dependency_type: DependencyType;
  description?: string;
  condition?: string;
}

export interface DependencyUpdateRequest {
  dependency_type?: DependencyType;
  description?: string;
  condition?: string;
}

// Explicit type re-exports for Vite/TypeScript compatibility
export type {
  DependencyCreationRequest,
  DependencyGraph,
  DependencyGraphLink,
  DependencyGraphNode,
  DependencyOptimization,
  DependencyTimeline,
  DependencyType,
  DependencyUpdateRequest,
  DependencyValidation,
  GoalDependency,
  GoalWithDependencies,
};
