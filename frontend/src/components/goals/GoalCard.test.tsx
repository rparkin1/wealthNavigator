/**
 * GoalCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalCard, Goal } from './GoalCard';

describe('GoalCard', () => {
  const mockGoal: Goal = {
    id: 'goal-1',
    title: 'Retirement Savings',
    category: 'retirement',
    priority: 'essential',
    targetAmount: 1000000,
    currentAmount: 400000,
    targetDate: new Date(Date.now() + 15 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 15 years from now
    monthlyContribution: 2000,
    successProbability: 85,
    status: 'on_track',
    description: 'Planning for retirement at age 65',
  };

  const defaultProps = {
    goal: mockGoal,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewDetails: vi.fn(),
  };

  it('renders goal information correctly', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('Retirement Savings')).toBeInTheDocument();
    expect(screen.getByText('Retirement')).toBeInTheDocument();
    expect(screen.getByText('$400,000')).toBeInTheDocument();
    expect(screen.getByText('$1,000,000')).toBeInTheDocument();
  });

  it('displays correct progress percentage', () => {
    render(<GoalCard {...defaultProps} />);

    // Progress should be 40% (400,000 / 1,000,000)
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });

  it('shows status badge', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('shows priority badge', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('Essential')).toBeInTheDocument();
  });

  it('displays category icon', () => {
    const { container } = render(<GoalCard {...defaultProps} />);

    // Check for retirement emoji
    expect(container.textContent).toContain('🏖️');
  });

  it('shows monthly contribution', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('$2,000/mo')).toBeInTheDocument();
  });

  it('displays success probability', () => {
    render(<GoalCard {...defaultProps} />);

    expect(screen.getByText('Success Probability')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('shows years remaining for long-term goals', () => {
    render(<GoalCard {...defaultProps} />);

    // Should show "15 years remaining"
    expect(screen.getByText(/15 years? remaining/)).toBeInTheDocument();
  });

  it('shows months remaining for short-term goals', () => {
    const shortTermGoal: Goal = {
      ...mockGoal,
      targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
    };

    render(<GoalCard goal={shortTermGoal} />);

    expect(screen.getByText(/6 months? remaining/)).toBeInTheDocument();
  });

  it('opens actions menu when clicking menu button', () => {
    render(<GoalCard {...defaultProps} />);

    const menuButton = screen.getByLabelText('Goal actions');
    fireEvent.click(menuButton);

    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    expect(screen.getByText('Delete Goal')).toBeInTheDocument();
  });

  it('calls onViewDetails when View Details is clicked', () => {
    const onViewDetails = vi.fn();
    render(<GoalCard {...defaultProps} onViewDetails={onViewDetails} />);

    const menuButton = screen.getByLabelText('Goal actions');
    fireEvent.click(menuButton);

    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(onViewDetails).toHaveBeenCalledWith('goal-1');
  });

  it('calls onEdit when Edit Goal is clicked', () => {
    const onEdit = vi.fn();
    render(<GoalCard {...defaultProps} onEdit={onEdit} />);

    const menuButton = screen.getByLabelText('Goal actions');
    fireEvent.click(menuButton);

    const editButton = screen.getByText('Edit Goal');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith('goal-1');
  });

  it('shows delete confirmation modal when Delete Goal is clicked', () => {
    render(<GoalCard {...defaultProps} />);

    const menuButton = screen.getByLabelText('Goal actions');
    fireEvent.click(menuButton);

    const deleteButton = screen.getByText('Delete Goal');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Goal?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', () => {
    const onDelete = vi.fn();
    render(<GoalCard {...defaultProps} onDelete={onDelete} />);

    // Open menu and click delete
    const menuButton = screen.getByLabelText('Goal actions');
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByText('Delete Goal'));

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /Delete Goal/i });
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith('goal-1');
  });

  it('cancels deletion when Cancel is clicked', () => {
    const onDelete = vi.fn();
    render(<GoalCard {...defaultProps} onDelete={onDelete} />);

    // Open menu and click delete
    const menuButton = screen.getByLabelText('Goal actions');
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByText('Delete Goal'));

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Delete Goal?')).not.toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<GoalCard {...defaultProps} compact={true} />);

    // Compact mode should show less detail
    expect(screen.getByText('Retirement Savings')).toBeInTheDocument();
    expect(screen.getByText('$400,000 / $1,000,000')).toBeInTheDocument();

    // Should not show detailed information
    expect(screen.queryByText('Success Probability')).not.toBeInTheDocument();
    expect(screen.queryByText('Essential')).not.toBeInTheDocument();
  });

  it('applies correct color for high success probability', () => {
    render(<GoalCard {...defaultProps} />);

    const probabilityValue = screen.getByText('85%');
    expect(probabilityValue.className).toContain('text-green-600');
  });

  it('applies correct color for medium success probability', () => {
    const mediumProbGoal: Goal = {
      ...mockGoal,
      successProbability: 65,
    };

    render(<GoalCard goal={mediumProbGoal} />);

    const probabilityValue = screen.getByText('65%');
    expect(probabilityValue.className).toContain('text-yellow-600');
  });

  it('applies correct color for low success probability', () => {
    const lowProbGoal: Goal = {
      ...mockGoal,
      successProbability: 45,
    };

    render(<GoalCard goal={lowProbGoal} />);

    const probabilityValue = screen.getByText('45%');
    expect(probabilityValue.className).toContain('text-red-600');
  });

  it('displays all priority types correctly', () => {
    const priorities = ['essential', 'important', 'aspirational'] as const;

    priorities.forEach((priority) => {
      const { unmount } = render(
        <GoalCard goal={{ ...mockGoal, priority }} />
      );

      const labels: Record<typeof priority, string> = {
        essential: 'Essential',
        important: 'Important',
        aspirational: 'Aspirational',
      };

      expect(screen.getByText(labels[priority])).toBeInTheDocument();
      unmount();
    });
  });

  it('displays all status types correctly', () => {
    const statuses = ['on_track', 'behind', 'at_risk', 'achieved'] as const;

    statuses.forEach((status) => {
      const { unmount } = render(
        <GoalCard goal={{ ...mockGoal, status }} />
      );

      const labels: Record<typeof status, string> = {
        on_track: 'On Track',
        behind: 'Behind',
        at_risk: 'At Risk',
        achieved: 'Achieved',
      };

      expect(screen.getByText(labels[status])).toBeInTheDocument();
      unmount();
    });
  });

  it('displays all category icons correctly', () => {
    const categories = ['retirement', 'education', 'home', 'major_expense', 'emergency', 'legacy'] as const;
    const icons: Record<typeof categories[number], string> = {
      retirement: '🏖️',
      education: '🎓',
      home: '🏠',
      major_expense: '💰',
      emergency: '🚨',
      legacy: '🌟',
    };

    categories.forEach((category) => {
      const { container, unmount } = render(
        <GoalCard goal={{ ...mockGoal, category }} />
      );

      expect(container.textContent).toContain(icons[category]);
      unmount();
    });
  });

  it('handles goal without monthly contribution', () => {
    const goalWithoutContribution: Goal = {
      ...mockGoal,
      monthlyContribution: undefined,
    };

    render(<GoalCard goal={goalWithoutContribution} />);

    expect(screen.queryByText(/\/mo/)).not.toBeInTheDocument();
  });

  it('handles goal without success probability', () => {
    const goalWithoutProbability: Goal = {
      ...mockGoal,
      successProbability: undefined,
    };

    render(<GoalCard goal={goalWithoutProbability} />);

    expect(screen.queryByText('Success Probability')).not.toBeInTheDocument();
  });

  it('caps progress at 100% for over-funded goals', () => {
    const overFundedGoal: Goal = {
      ...mockGoal,
      currentAmount: 1200000, // More than target
      targetAmount: 1000000,
    };

    render(<GoalCard goal={overFundedGoal} />);

    // Progress should be capped at 100%
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });
});
