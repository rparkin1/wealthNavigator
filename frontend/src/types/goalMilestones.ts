/**
 * Goal Milestones Types
 *
 * Type definitions for milestone tracking and progress management
 */

export interface Milestone {
  id: string;
  title: string;
  target_amount?: number;
  target_date?: string;
  description?: string;
  completed: boolean;
  completed_date?: string;
  created_at: string;
  auto_generated?: boolean;
}

export interface MilestoneCreationRequest {
  title: string;
  target_amount?: number;
  target_date?: string;
  description?: string;
}

export interface MilestoneUpdateRequest {
  title?: string;
  target_amount?: number;
  target_date?: string;
  description?: string;
  completed?: boolean;
}

export interface ProgressCheckResponse {
  total_milestones: number;
  completed_milestones: number;
  progress_percentage: number;
  newly_completed: Array<{
    id: string;
    title: string;
    completed_date: string;
  }>;
}

export interface ProgressMetrics {
  goal_id: string;
  progress_percentage: number;
  time_progress: number;
  milestone_progress: number;
  on_track: boolean;
  current_velocity: number;
  required_velocity: number;
  velocity_gap: number;
  completed_milestones: number;
  total_milestones: number;
  status: string;
}

export interface UpcomingMilestone {
  id: string;
  title: string;
  target_date: string;
  target_amount?: number;
  goal_id: string;
  goal_title: string;
  goal_category: string;
  days_until: number;
}

export interface OverdueMilestone extends Milestone {
  goal_id: string;
  goal_title: string;
  goal_category: string;
  days_overdue: number;
}

export interface MilestoneNotification {
  id: string;
  type: 'upcoming' | 'overdue' | 'completed' | 'auto_completed';
  milestone: Milestone;
  goal_title: string;
  message: string;
  timestamp: string;
}
