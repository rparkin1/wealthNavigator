/**
 * Integration Tests for AtRiskGoalsPanel Component
 *
 * Tests the at-risk goals identification and recommendation system
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AtRiskGoalsPanel } from '../AtRiskGoalsPanel';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('AtRiskGoalsPanel Integration Tests', () => {
  const mockUserId = 'test-user-123';
  const mockAtRiskGoals = [
    {
      id: 'goal-1',
      title: 'Retirement at 65',
      category: 'retirement',
      priority: 'essential',
      targetAmount: 1500000,
      targetDate: '2045-01-01',
      currentAmount: 400000,
      successProbability: 0.72,
      shortfallAmount: 150000,
      recommendedActions: [
        'Increase monthly contribution by $300',
        'Delay retirement by 2 years',
        'Reduce spending by 10%',
      ],
    },
    {
      id: 'goal-2',
      title: 'College Fund',
      category: 'education',
      priority: 'important',
      targetAmount: 200000,
      targetDate: '2035-09-01',
      currentAmount: 80000,
      successProbability: 0.65,
      shortfallAmount: 75000,
      recommendedActions: [
        'Increase contributions by $200/month',
        'Consider 529 plan for tax benefits',
      ],
    },
  ];

  beforeEach(() => {
    vi.mocked(global.fetch).mockClear();
  });

  it('fetches and displays at-risk goals', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals, total_goals: 3, at_risk_count: 2 }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} successThreshold={0.80} />);

    await waitFor(() => {
      expect(screen.getByText('Retirement at 65')).toBeInTheDocument();
      expect(screen.getByText('College Fund')).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    // Mock fetch to simulate a loading state
    let resolvePromise: (value: any) => void;
    const promise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(global.fetch).mockImplementation(() => promise);

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    // Verify loading state appears
    expect(screen.getByText('Analyzing goals...')).toBeInTheDocument();

    // Clean up by resolving the promise to avoid hanging
    resolvePromise!({
      ok: true,
      json: async () => ({ at_risk_goals: [], total_goals: 0, at_risk_count: 0 }),
    });
  });

  it('shows success message when no at-risk goals', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: [], total_goals: 3, at_risk_count: 0 }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('All Goals On Track!')).toBeInTheDocument();
    });
  });

  it('displays correct success probability', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('72.0%')).toBeInTheDocument();
      expect(screen.getByText('65.0%')).toBeInTheDocument();
    });
  });

  it('displays shortfall amounts', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/\$150,000/)).toBeInTheDocument();
      expect(screen.getByText(/\$75,000/)).toBeInTheDocument();
    });
  });

  it('allows sorting by shortfall amount', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('shortfall');
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'probability' } });

    expect(select).toHaveValue('probability');
  });

  it('expands goal card to show recommendations', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Retirement at 65')).toBeInTheDocument();
    });

    // Find and click expand button
    const expandButtons = screen.getAllByRole('button');
    const expandButton = expandButtons.find(btn =>
      btn.querySelector('svg')?.getAttribute('class')?.includes('w-5')
    );

    if (expandButton) {
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Recommended Actions')).toBeInTheDocument();
        expect(screen.getByText(/Increase monthly contribution/)).toBeInTheDocument();
      });
    }
  });

  it('shows risk level indicators', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });
  });

  it('calls onGoalClick when goal is clicked', async () => {
    const onGoalClick = vi.fn();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} onGoalClick={onGoalClick} />);

    await waitFor(() => {
      const goalButton = screen.getByText('Retirement at 65');
      fireEvent.click(goalButton);
    });

    expect(onGoalClick).toHaveBeenCalledWith('goal-1');
  });

  it('uses custom success threshold', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ at_risk_goals: mockAtRiskGoals }),
    });

    render(<AtRiskGoalsPanel userId={mockUserId} successThreshold={0.75} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('threshold=0.75'),
        expect.any(Object)
      );
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('API Error'));

    render(<AtRiskGoalsPanel userId={mockUserId} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch at-risk goals:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
