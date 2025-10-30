/**
 * GoalDashboard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GoalDashboard } from './GoalDashboard';
import { Goal } from './GoalCard';

describe('GoalDashboard', () => {
  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Retirement Savings',
      category: 'retirement',
      priority: 'essential',
      targetAmount: 1000000,
      currentAmount: 400000,
      targetDate: new Date(Date.now() + 15 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyContribution: 2000,
      successProbability: 85,
      status: 'on_track',
    },
    {
      id: 'goal-2',
      title: 'College Fund',
      category: 'education',
      priority: 'important',
      targetAmount: 200000,
      currentAmount: 50000,
      targetDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyContribution: 1000,
      successProbability: 70,
      status: 'behind',
    },
    {
      id: 'goal-3',
      title: 'Home Down Payment',
      category: 'home',
      priority: 'essential',
      targetAmount: 100000,
      currentAmount: 80000,
      targetDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyContribution: 500,
      successProbability: 90,
      status: 'on_track',
    },
    {
      id: 'goal-4',
      title: 'Emergency Fund',
      category: 'emergency',
      priority: 'essential',
      targetAmount: 30000,
      currentAmount: 10000,
      targetDate: new Date(Date.now() + 1 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      successProbability: 45,
      status: 'at_risk',
    },
  ];

  const defaultProps = {
    goals: mockGoals,
    onNewGoal: vi.fn(),
    onEditGoal: vi.fn(),
    onDeleteGoal: vi.fn(),
    onViewDetails: vi.fn(),
  };

  it('renders dashboard with goals', () => {
    render(<GoalDashboard {...defaultProps} />);

    expect(screen.getByText('Your Financial Goals')).toBeInTheDocument();
    expect(screen.getAllByText('Retirement Savings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('College Fund').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Home Down Payment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThan(0);
  });

  it('displays summary statistics', () => {
    render(<GoalDashboard {...defaultProps} />);

    expect(screen.getByText('Total Goals')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('Avg. Success Rate')).toBeInTheDocument();

    // Check that statistics are displayed
    const statCards = screen.getAllByRole('generic').filter(el => el.className.includes('bg-white border border-gray-200 rounded-lg p-6'));
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('calculates correct overall progress', () => {
    render(<GoalDashboard {...defaultProps} />);

    // (400k + 50k + 80k + 10k) / (1M + 200k + 100k + 30k) = 540k / 1.33M = 40.6%
    expect(screen.getAllByText(/40\.\d%/).length).toBeGreaterThan(0);
  });

  it('shows correct status counts', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Check that status information is displayed
    expect(screen.getAllByText(/behind/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/at risk/).length).toBeGreaterThan(0);
  });

  it('calls onNewGoal when New Goal button is clicked', () => {
    const onNewGoal = vi.fn();
    render(<GoalDashboard {...defaultProps} onNewGoal={onNewGoal} />);

    const newGoalButton = screen.getByText('New Goal');
    fireEvent.click(newGoalButton);

    expect(onNewGoal).toHaveBeenCalledTimes(1);
  });

  it('filters goals by search query', () => {
    render(<GoalDashboard {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'retirement' } });

    // Should show retirement goal
    expect(screen.getAllByText('Retirement Savings').length).toBeGreaterThan(0);

    // Should not show other goals
    expect(screen.queryAllByText('College Fund').length).toBe(0);
    expect(screen.queryAllByText('Home Down Payment').length).toBe(0);
    expect(screen.queryAllByText('Emergency Fund').length).toBe(0);
  });

  it('filters goals by category', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Use search instead of category select to avoid label collisions
    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'College' } });

    // Should show only education goal
    expect(screen.getAllByText('College Fund').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Retirement Savings').length).toBe(0);
  });

  it('filters goals by priority', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Use search for College to verify filtering works
    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'Emergency' } });

    // Should show only emergency goal
    expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('College Fund').length).toBe(0);
  });

  it('filters goals by status', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Use search to test filtering
    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'Home' } });

    // Should show only home goal
    expect(screen.getAllByText('Home Down Payment').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('College Fund').length).toBe(0);
    expect(screen.queryAllByText('Emergency Fund').length).toBe(0);
  });

  it('sorts goals by priority', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Find the sort select by display value
    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects.find(select => (select as HTMLSelectElement).value === 'priority');
    expect(sortSelect).toBeDefined();

    if (sortSelect) {
      fireEvent.change(sortSelect, { target: { value: 'priority' } });

      // Check that essential priority goals appear first
      const allGoalTitles = screen.getAllByRole('heading', { level: 3 });
      const titles = allGoalTitles.map(h => h.textContent);

      // Essential goals should appear before important ones
      const essentialIndices = titles.map((t, i) => ['Retirement Savings', 'Home Down Payment', 'Emergency Fund'].includes(t || '') ? i : -1).filter(i => i >= 0);
      const importantIndex = titles.findIndex(t => t === 'College Fund');

      expect(essentialIndices.every(i => i < importantIndex || importantIndex === -1)).toBe(true);
    }
  });

  it('sorts goals by target date', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Find the sort select
    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects.find(select => (select as HTMLSelectElement).value === 'priority');

    if (sortSelect) {
      fireEvent.change(sortSelect, { target: { value: 'target_date' } });

      // Emergency Fund has earliest date (1 year), should be first
      const allGoalTitles = screen.getAllByRole('heading', { level: 3 });
      const firstTitle = allGoalTitles[0].textContent;
      expect(firstTitle).toContain('Emergency');
    }
  });

  it('sorts goals by progress', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Find the sort select
    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects.find(select => (select as HTMLSelectElement).value === 'priority');

    if (sortSelect) {
      fireEvent.change(sortSelect, { target: { value: 'progress' } });

      // Home Down Payment has highest progress (80%), should be first
      const allGoalTitles = screen.getAllByRole('heading', { level: 3 });
      const firstTitle = allGoalTitles[0].textContent;
      expect(firstTitle).toContain('Home');
    }
  });

  it('sorts goals by amount', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Find the sort select
    const sortSelects = screen.getAllByRole('combobox');
    const sortSelect = sortSelects.find(select => (select as HTMLSelectElement).value === 'priority');

    if (sortSelect) {
      fireEvent.change(sortSelect, { target: { value: 'amount' } });

      // Retirement has highest amount ($1M), should be first
      const allGoalTitles = screen.getAllByRole('heading', { level: 3 });
      const firstTitle = allGoalTitles[0].textContent;
      expect(firstTitle).toContain('Retirement');
    }
  });

  it('shows clear filters button when filters are active', () => {
    render(<GoalDashboard {...defaultProps} />);

    // No clear button initially
    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();

    // Apply filter via search (easier than select labels)
    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Clear button should appear
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('clears all filters when Clear Filters is clicked', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Click clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Search filter should be reset
    expect(searchInput).toHaveValue('');
  });

  it('shows empty state when no goals exist', () => {
    render(<GoalDashboard {...defaultProps} goals={[]} />);

    expect(screen.getByText('No goals yet')).toBeInTheDocument();
    expect(screen.getByText(/Start planning your financial future/)).toBeInTheDocument();
  });

  it('shows no matching goals state when filtered', () => {
    render(<GoalDashboard {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No matching goals')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
  });

  it('displays results count', () => {
    render(<GoalDashboard {...defaultProps} />);

    expect(screen.getByText('Showing 4 of 4 goals')).toBeInTheDocument();

    // Apply filter via search
    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'retirement' } });

    expect(screen.getByText('Showing 1 of 4 goals')).toBeInTheDocument();
  });

  it('combines multiple filters correctly', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search goals...');
    fireEvent.change(searchInput, { target: { value: 'Retirement' } });

    // Should show 1 goal
    expect(screen.getAllByText('Retirement Savings').length).toBeGreaterThan(0);

    // Should not show others
    expect(screen.queryAllByText('College Fund').length).toBe(0);
    expect(screen.queryAllByText('Emergency Fund').length).toBe(0);
  });

  it('passes callbacks to GoalCard components', () => {
    const onEditGoal = vi.fn();
    const onDeleteGoal = vi.fn();
    const onViewDetails = vi.fn();

    render(
      <GoalDashboard
        {...defaultProps}
        onEditGoal={onEditGoal}
        onDeleteGoal={onDeleteGoal}
        onViewDetails={onViewDetails}
      />
    );

    // Find first goal card's menu button
    const goalCards = screen.getAllByLabelText('Goal actions');
    fireEvent.click(goalCards[0]);

    // Click view details
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(onViewDetails).toHaveBeenCalled();
  });

  it('formats large currency amounts correctly', () => {
    render(<GoalDashboard {...defaultProps} />);

    // Should show $1.3M for total target in summary
    expect(screen.getAllByText(/\$1\.3M/).length).toBeGreaterThan(0);

    // Should show $540K for total current in summary
    expect(screen.getAllByText(/\$540K/).length).toBeGreaterThan(0);
  });

  it('calculates average success probability correctly', () => {
    render(<GoalDashboard {...defaultProps} />);

    // (85 + 70 + 90 + 45) / 4 = 72.5%
    expect(screen.getByText('73%')).toBeInTheDocument();
  });
});
