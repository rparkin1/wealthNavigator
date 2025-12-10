/**
 * GoalForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalForm } from './GoalForm';
import type { Goal } from './GoalCard';

describe('GoalForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    mode: 'create' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create mode correctly', () => {
    render(<GoalForm {...defaultProps} />);

    expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    expect(screen.getByText('Goal Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., Retire at 60/)).toBeInTheDocument();
  });

  it('renders edit mode with goal data', () => {
    const goal: Goal = {
      id: 'goal-1',
      title: 'Test Goal',
      category: 'retirement',
      priority: 'essential',
      targetAmount: 100000,
      currentAmount: 50000,
      targetDate: '2030-12-31',
      monthlyContribution: 500,
      status: 'on_track',
      description: 'Test description',
    };

    render(<GoalForm {...defaultProps} goal={goal} mode="edit" />);

    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Goal')).toBeInTheDocument();
  });

  it('displays all 6 goal categories', () => {
    render(<GoalForm {...defaultProps} />);

    expect(screen.getByText('Retirement')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Home Purchase')).toBeInTheDocument();
    expect(screen.getByText('Major Expense')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Legacy Planning')).toBeInTheDocument();
  });

  it('shows step progress indicators', () => {
    render(<GoalForm {...defaultProps} />);

    expect(screen.getByText('Goal Type')).toBeInTheDocument();
    expect(screen.getByText('Amounts & Dates')).toBeInTheDocument();
    expect(screen.getByText('Funding & Priority')).toBeInTheDocument();
  });

  it('validates required title field', () => {
    render(<GoalForm {...defaultProps} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText('Goal title is required')).toBeInTheDocument();
  });

  it('allows category selection', () => {
    render(<GoalForm {...defaultProps} />);

    const educationButton = screen.getByText('Education').closest('button');
    fireEvent.click(educationButton!);

    expect(educationButton).toHaveClass('border-blue-600');
  });

  it('moves to step 2 after valid step 1', () => {
    render(<GoalForm {...defaultProps} />);

    // Fill in title
    const titleInput = screen.getByPlaceholderText(/e.g., Retire at 60/);
    fireEvent.change(titleInput, { target: { value: 'My Goal' } });

    // Click next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should now be on step 2
    expect(screen.getByText('Target Amount *')).toBeInTheDocument();
    expect(screen.getByText('Current Amount')).toBeInTheDocument();
    expect(screen.getByText('Target Date *')).toBeInTheDocument();
  });

  it('validates target amount on step 2', () => {
    render(<GoalForm {...defaultProps} />);

    // Move to step 2
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Try to proceed without target amount
    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Target amount must be greater than 0')).toBeInTheDocument();
  });

  it('validates target date on step 2', () => {
    render(<GoalForm {...defaultProps} />);

    // Move to step 2
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Fill target amount but not date
    const targetAmountInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(targetAmountInputs[0], { target: { value: '10000' } });

    // Try to proceed without date
    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Target date is required')).toBeInTheDocument();
  });

  it('prevents past target dates', () => {
    render(<GoalForm {...defaultProps} />);

    // Move to step 2
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Fill with past date
    const targetAmountInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(targetAmountInputs[0], { target: { value: '10000' } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

    // Try to proceed
    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Target date must be in the future')).toBeInTheDocument();
  });

  it('shows progress preview on step 2', () => {
    render(<GoalForm {...defaultProps} />);

    // Move to step 2
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Fill amounts
    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '10000' } }); // target
    fireEvent.change(inputs[1], { target: { value: '5000' } }); // current

    // Progress preview should appear
    expect(screen.getByText('Current Progress')).toBeInTheDocument();
    expect(screen.getByText('50.0% of target')).toBeInTheDocument();
  });

  it('moves to step 3 after valid step 2', () => {
    render(<GoalForm {...defaultProps} />);

    // Complete step 1
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Complete step 2
    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '10000' } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2030-12-31' } });

    fireEvent.click(screen.getByText('Next'));

    // Should now be on step 3
    expect(screen.getByText('Monthly Contribution (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Priority Level *')).toBeInTheDocument();
  });

  it('displays all 3 priority levels on step 3', () => {
    render(<GoalForm {...defaultProps} />);

    // Navigate to step 3
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '10000' } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2030-12-31' } });
    fireEvent.click(screen.getByText('Next'));

    // Check priority options
    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Aspirational')).toBeInTheDocument();
  });

  it('shows goal summary on step 3', () => {
    render(<GoalForm {...defaultProps} />);

    // Navigate to step 3
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'Retirement Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '100000' } });
    fireEvent.change(inputs[1], { target: { value: '50000' } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2030-12-31' } });
    fireEvent.click(screen.getByText('Next'));

    // Check summary
    expect(screen.getByText('Goal Summary')).toBeInTheDocument();
    expect(screen.getByText('Retirement Goal')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('allows back navigation', () => {
    render(<GoalForm {...defaultProps} />);

    // Move to step 2
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Click back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Should be back on step 1
    expect(screen.getByPlaceholderText(/e.g., Retire at 60/)).toBeInTheDocument();
  });

  it('calls onCancel when clicking cancel on step 1', () => {
    render(<GoalForm {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when clicking close button', () => {
    render(<GoalForm {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close form');
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('submits form with complete data', () => {
    render(<GoalForm {...defaultProps} />);

    // Step 1
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'Retirement Goal' },
    });
    const educationButton = screen.getByText('Education').closest('button');
    fireEvent.click(educationButton!);
    fireEvent.click(screen.getByText('Next'));

    // Step 2
    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '100000' } });
    fireEvent.change(inputs[1], { target: { value: '50000' } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2030-12-31' } });
    fireEvent.click(screen.getByText('Next'));

    // Step 3
    const monthlyInput = screen.getAllByPlaceholderText('0')[0];
    fireEvent.change(monthlyInput, { target: { value: '500' } });

    const essentialButton = screen.getByText('Essential').closest('button');
    fireEvent.click(essentialButton!);

    // Submit
    const submitButton = screen.getByText('Create Goal');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Retirement Goal',
        category: 'education',
        priority: 'essential',
        targetAmount: 100000,
        currentAmount: 50000,
        monthlyContribution: 500,
      })
    );
  });

  it('clears field errors when field is edited', () => {
    render(<GoalForm {...defaultProps} />);

    // Try to proceed without title
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Goal title is required')).toBeInTheDocument();

    // Edit title
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });

    // Error should be cleared
    expect(screen.queryByText('Goal title is required')).not.toBeInTheDocument();
  });

  it('includes goal ID when editing existing goal', () => {
    const goal: Goal = {
      id: 'existing-goal-123',
      title: 'Test Goal',
      category: 'retirement',
      priority: 'important',
      targetAmount: 100000,
      currentAmount: 50000,
      targetDate: '2030-12-31',
      status: 'on_track',
    };

    render(<GoalForm {...defaultProps} goal={goal} mode="edit" />);

    // Navigate to end and submit
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Save Changes'));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'existing-goal-123',
      })
    );
  });

  it('validates negative amounts', () => {
    render(<GoalForm {...defaultProps} />);

    // Move to step 2
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    // Try negative current amount
    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '10000' } });
    fireEvent.change(inputs[1], { target: { value: '-100' } });

    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Current amount cannot be negative')).toBeInTheDocument();
  });

  it('shows submit button text based on mode', () => {
    const { rerender } = render(<GoalForm {...defaultProps} mode="create" />);

    // Navigate to step 3
    fireEvent.change(screen.getByPlaceholderText(/e.g., Retire at 60/), {
      target: { value: 'My Goal' },
    });
    fireEvent.click(screen.getByText('Next'));

    const inputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(inputs[0], { target: { value: '10000' } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2030-12-31' } });
    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Create Goal')).toBeInTheDocument();

    // Rerender with edit mode
    rerender(<GoalForm {...defaultProps} mode="edit" />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});
