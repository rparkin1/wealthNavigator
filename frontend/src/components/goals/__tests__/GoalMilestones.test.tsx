/**
 * Goal Milestones Tests
 *
 * Comprehensive test suite for all milestone components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MilestoneManager } from '../MilestoneManager';
import { MilestoneTimeline } from '../MilestoneTimeline';
import { MilestoneProgressBar } from '../MilestoneProgressBar';
import { UpcomingMilestones } from '../UpcomingMilestones';
import { MilestoneNotifications } from '../MilestoneNotifications';
import * as milestoneApi from '../../../services/goalMilestonesApi';
import type { Goal } from '../../../types/goal';
import type { Milestone, ProgressMetrics, UpcomingMilestone, OverdueMilestone } from '../../../types/goalMilestones';

// Mock the API
vi.mock('../../../services/goalMilestonesApi');

describe('MilestoneManager', () => {
  const mockGoal: Goal = {
    id: 'goal-1',
    title: 'Retirement',
    category: 'retirement',
    priority: 'essential',
    targetAmount: 1000000,
    currentAmount: 50000,
    targetDate: '2045-01-01',
    status: 'on_track',
  };

  const mockMilestones: Milestone[] = [
    {
      id: 'milestone-1',
      title: 'First 10%',
      target_amount: 100000,
      target_date: '2027-01-01',
      description: 'Reach 10% of retirement goal',
      completed: false,
      created_at: '2025-01-01T00:00:00Z',
      auto_generated: false,
    },
    {
      id: 'milestone-2',
      title: 'Halfway There',
      target_amount: 500000,
      target_date: '2035-01-01',
      description: 'Reach 50% of retirement goal',
      completed: false,
      created_at: '2025-01-01T00:00:00Z',
      auto_generated: false,
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnMilestonesUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with milestones list', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue(mockMilestones);

    render(
      <MilestoneManager
        goal={mockGoal}
        onClose={mockOnClose}
        onMilestonesUpdated={mockOnMilestonesUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Milestones')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('First 10%')).toBeInTheDocument();
      expect(screen.getByText('Halfway There')).toBeInTheDocument();
    });
  });

  it('shows empty state when no milestones', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue([]);

    render(
      <MilestoneManager
        goal={mockGoal}
        onClose={mockOnClose}
        onMilestonesUpdated={mockOnMilestonesUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No milestones yet/)).toBeInTheDocument();
    });
  });

  it('opens create form when add button clicked', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue([]);

    render(
      <MilestoneManager
        goal={mockGoal}
        onClose={mockOnClose}
        onMilestonesUpdated={mockOnMilestonesUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Milestones')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Milestone/ });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Milestone Title/)).toBeInTheDocument();
    });
  });

  it('creates milestone successfully', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue([]);
    vi.mocked(milestoneApi.createMilestone).mockResolvedValue({
      id: 'new-milestone',
      title: 'New Milestone',
      target_amount: 200000,
      target_date: '2030-01-01',
      completed: false,
      created_at: '2025-01-01T00:00:00Z',
      auto_generated: false,
    });

    render(
      <MilestoneManager
        goal={mockGoal}
        onClose={mockOnClose}
        onMilestonesUpdated={mockOnMilestonesUpdated}
      />
    );

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /Add Milestone/ });
      fireEvent.click(addButton);
    });

    // Fill form
    const titleInput = screen.getByLabelText(/Milestone Title/);
    fireEvent.change(titleInput, { target: { value: 'New Milestone' } });

    const amountInput = screen.getByLabelText(/Target Amount/);
    fireEvent.change(amountInput, { target: { value: '200000' } });

    const dateInput = screen.getByLabelText(/Target Date/);
    fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Create Milestone/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(milestoneApi.createMilestone).toHaveBeenCalledWith(
        'goal-1',
        expect.objectContaining({
          title: 'New Milestone',
          target_amount: 200000,
          target_date: '2030-01-01',
        })
      );
    });
  });

  it('auto-generates milestones', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue([]);
    vi.mocked(milestoneApi.autoGenerateMilestones).mockResolvedValue([
      {
        id: 'auto-1',
        title: 'Auto Milestone 1',
        target_amount: 250000,
        target_date: '2030-01-01',
        completed: false,
        created_at: '2025-01-01T00:00:00Z',
        auto_generated: true,
      },
    ]);

    global.confirm = vi.fn().mockReturnValue(true);

    render(
      <MilestoneManager
        goal={mockGoal}
        onClose={mockOnClose}
        onMilestonesUpdated={mockOnMilestonesUpdated}
      />
    );

    await waitFor(() => {
      const autoButton = screen.getByRole('button', { name: /Auto-Generate/ });
      fireEvent.click(autoButton);
    });

    await waitFor(() => {
      expect(milestoneApi.autoGenerateMilestones).toHaveBeenCalledWith('goal-1');
    });
  });

  it('marks milestone as complete', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue(mockMilestones);
    vi.mocked(milestoneApi.completeMilestone).mockResolvedValue({
      ...mockMilestones[0],
      completed: true,
      completed_date: '2025-11-04',
    });

    render(
      <MilestoneManager
        goal={mockGoal}
        onClose={mockOnClose}
        onMilestonesUpdated={mockOnMilestonesUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First 10%')).toBeInTheDocument();
    });

    // Click complete button for first milestone
    const completeButtons = screen.getAllByRole('button', { name: /Complete/ });
    fireEvent.click(completeButtons[0]);

    await waitFor(() => {
      expect(milestoneApi.completeMilestone).toHaveBeenCalledWith('milestone-1');
    });
  });

  it('deletes milestone with confirmation', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue(mockMilestones);
    vi.mocked(milestoneApi.deleteMilestone).mockResolvedValue(undefined);

    global.confirm = vi.fn().mockReturnValue(true);

    render(
      <MilestoneManager
        goal={mockGoal}
        onClose={mockOnClose}
        onMilestonesUpdated={mockOnMilestonesUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First 10%')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(milestoneApi.deleteMilestone).toHaveBeenCalledWith('milestone-1');
    });
  });
});

describe('MilestoneTimeline', () => {
  const mockGoal: Goal = {
    id: 'goal-1',
    title: 'Retirement',
    category: 'retirement',
    priority: 'essential',
    targetAmount: 1000000,
    currentAmount: 50000,
    targetDate: '2045-01-01',
    status: 'on_track',
  };

  const mockMilestones: Milestone[] = [
    {
      id: 'milestone-1',
      title: 'First 10%',
      target_amount: 100000,
      target_date: '2027-01-01',
      completed: false,
      created_at: '2025-01-01T00:00:00Z',
      auto_generated: false,
    },
    {
      id: 'milestone-2',
      title: 'Halfway There',
      target_amount: 500000,
      target_date: '2035-01-01',
      completed: true,
      completed_date: '2034-12-01',
      created_at: '2025-01-01T00:00:00Z',
      auto_generated: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timeline with milestones', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue(mockMilestones);

    render(<MilestoneTimeline goal={mockGoal} />);

    await waitFor(() => {
      expect(screen.getByText('First 10%')).toBeInTheDocument();
      expect(screen.getByText('Halfway There')).toBeInTheDocument();
    });
  });

  it('shows completion status correctly', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue(mockMilestones);

    render(<MilestoneTimeline goal={mockGoal} />);

    await waitFor(() => {
      expect(screen.getByText(/Completed/)).toBeInTheDocument();
    });
  });

  it('displays progress summary', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue(mockMilestones);

    render(<MilestoneTimeline goal={mockGoal} />);

    await waitFor(() => {
      expect(screen.getByText(/Progress/)).toBeInTheDocument();
      expect(screen.getByText(/1.*2/)).toBeInTheDocument(); // 1 / 2
    });
  });

  it('shows empty state when no milestones', async () => {
    vi.mocked(milestoneApi.getMilestones).mockResolvedValue([]);

    render(<MilestoneTimeline goal={mockGoal} />);

    await waitFor(() => {
      expect(screen.getByText(/No milestones to display/)).toBeInTheDocument();
    });
  });
});

describe('MilestoneProgressBar', () => {
  const mockGoal: Goal = {
    id: 'goal-1',
    title: 'Retirement',
    category: 'retirement',
    priority: 'essential',
    targetAmount: 1000000,
    currentAmount: 50000,
    targetDate: '2045-01-01',
    status: 'on_track',
  };

  const mockMetrics: ProgressMetrics = {
    goal_id: 'goal-1',
    progress_percentage: 5.0,
    time_progress: 10.0,
    milestone_progress: 20.0,
    on_track: true,
    current_velocity: 500,
    required_velocity: 450,
    velocity_gap: -50,
    completed_milestones: 1,
    total_milestones: 5,
    status: 'on_track',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress metrics', async () => {
    vi.mocked(milestoneApi.getProgressMetrics).mockResolvedValue(mockMetrics);

    render(<MilestoneProgressBar goal={mockGoal} compact={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Progress Metrics/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/On Track/)).toBeInTheDocument();
    });
  });

  it('shows three progress bars', async () => {
    vi.mocked(milestoneApi.getProgressMetrics).mockResolvedValue(mockMetrics);

    render(<MilestoneProgressBar goal={mockGoal} compact={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Financial Progress/)).toBeInTheDocument();
      expect(screen.getByText(/Time Progress/)).toBeInTheDocument();
      expect(screen.getByText(/Milestone Progress/)).toBeInTheDocument();
    });
  });

  it('displays velocity metrics', async () => {
    vi.mocked(milestoneApi.getProgressMetrics).mockResolvedValue(mockMetrics);

    render(<MilestoneProgressBar goal={mockGoal} compact={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Current Velocity/)).toBeInTheDocument();
      expect(screen.getByText(/Required Velocity/)).toBeInTheDocument();
    });
  });

  it('shows recommendation when behind', async () => {
    const behindMetrics: ProgressMetrics = {
      ...mockMetrics,
      on_track: false,
      velocity_gap: 200,
    };

    vi.mocked(milestoneApi.getProgressMetrics).mockResolvedValue(behindMetrics);

    render(<MilestoneProgressBar goal={mockGoal} compact={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Recommendation/)).toBeInTheDocument();
      expect(screen.getByText(/get back on track/)).toBeInTheDocument();
    });
  });

  it('renders compact version', async () => {
    vi.mocked(milestoneApi.getProgressMetrics).mockResolvedValue(mockMetrics);

    render(<MilestoneProgressBar goal={mockGoal} compact={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Progress/)).toBeInTheDocument();
      expect(screen.getByText(/On Track/)).toBeInTheDocument();
    });

    // Compact version should not show detailed metrics
    expect(screen.queryByText(/Financial Progress/)).not.toBeInTheDocument();
  });
});

describe('UpcomingMilestones', () => {
  const mockUpcomingMilestones: UpcomingMilestone[] = [
    {
      id: 'milestone-1',
      title: 'Emergency Fund Milestone',
      goal_id: 'goal-1',
      goal_title: 'Emergency Fund',
      goal_category: 'emergency',
      target_amount: 10000,
      target_date: '2025-11-10',
      days_until: 6,
    },
    {
      id: 'milestone-2',
      title: 'Retirement Checkpoint',
      goal_id: 'goal-2',
      goal_title: 'Retirement',
      goal_category: 'retirement',
      target_amount: 100000,
      target_date: '2025-11-20',
      days_until: 16,
    },
  ];

  const mockOnMilestoneClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upcoming milestones', async () => {
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue(mockUpcomingMilestones);

    render(<UpcomingMilestones userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund Milestone')).toBeInTheDocument();
      expect(screen.getByText('Retirement Checkpoint')).toBeInTheDocument();
    });
  });

  it('shows urgency color coding', async () => {
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue(mockUpcomingMilestones);

    render(<UpcomingMilestones userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText(/6d/)).toBeInTheDocument(); // Red urgency
      expect(screen.getByText(/16d/)).toBeInTheDocument(); // Blue urgency
    });
  });

  it('calls onMilestoneClick when milestone clicked', async () => {
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue(mockUpcomingMilestones);

    render(<UpcomingMilestones userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund Milestone')).toBeInTheDocument();
    });

    // Click the milestone card
    const milestoneCard = screen.getByText('Emergency Fund Milestone').closest('div');
    if (milestoneCard) {
      fireEvent.click(milestoneCard);
    }

    expect(mockOnMilestoneClick).toHaveBeenCalledWith('goal-1');
  });

  it('shows empty state when no upcoming milestones', async () => {
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue([]);

    render(<UpcomingMilestones userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText(/No upcoming milestones/)).toBeInTheDocument();
    });
  });
});

describe('MilestoneNotifications', () => {
  const mockOverdueMilestones: OverdueMilestone[] = [
    {
      id: 'milestone-1',
      title: 'Overdue Milestone',
      goal_id: 'goal-1',
      goal_title: 'Retirement',
      goal_category: 'retirement',
      target_amount: 50000,
      target_date: '2025-10-01',
      days_overdue: 34,
    },
  ];

  const mockUpcomingMilestones: UpcomingMilestone[] = [
    {
      id: 'milestone-2',
      title: 'Coming Soon',
      goal_id: 'goal-2',
      goal_title: 'Emergency Fund',
      goal_category: 'emergency',
      target_amount: 10000,
      target_date: '2025-11-10',
      days_until: 6,
    },
  ];

  const mockOnMilestoneClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both overdue and upcoming milestones', async () => {
    vi.mocked(milestoneApi.getOverdueMilestones).mockResolvedValue(mockOverdueMilestones);
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue(mockUpcomingMilestones);

    render(<MilestoneNotifications userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Milestone')).toBeInTheDocument();
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });
  });

  it('shows severity badges', async () => {
    vi.mocked(milestoneApi.getOverdueMilestones).mockResolvedValue(mockOverdueMilestones);
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue(mockUpcomingMilestones);

    render(<MilestoneNotifications userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText(/1 overdue/)).toBeInTheDocument();
      expect(screen.getByText(/1 soon/)).toBeInTheDocument();
    });
  });

  it('collapses and expands sections', async () => {
    vi.mocked(milestoneApi.getOverdueMilestones).mockResolvedValue(mockOverdueMilestones);
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue(mockUpcomingMilestones);

    render(<MilestoneNotifications userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText('Overdue Milestone')).toBeInTheDocument();
    });

    // Click to collapse overdue section
    const overdueButton = screen.getByRole('button', { name: /Overdue/ });
    fireEvent.click(overdueButton);

    // Milestone should still be visible (controlled by CSS, not removal from DOM)
    expect(screen.getByText('Overdue Milestone')).toBeInTheDocument();
  });

  it('shows all caught up when no notifications', async () => {
    vi.mocked(milestoneApi.getOverdueMilestones).mockResolvedValue([]);
    vi.mocked(milestoneApi.getUpcomingMilestones).mockResolvedValue([]);

    render(<MilestoneNotifications userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText(/All caught up/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(milestoneApi.getOverdueMilestones).mockRejectedValue(new Error('API Error'));
    vi.mocked(milestoneApi.getUpcomingMilestones).mockRejectedValue(new Error('API Error'));

    render(<MilestoneNotifications userId="user-1" onMilestoneClick={mockOnMilestoneClick} />);

    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });
  });
});
