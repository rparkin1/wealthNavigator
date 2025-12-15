/**
 * Integration Tests for BucketRebalancer Component
 *
 * Tests the rebalancing analysis and execution interface
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BucketRebalancer } from '../BucketRebalancer';
import * as mentalAccountingApi from '../../../services/mentalAccountingApi';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the API module
vi.mock('../../../services/mentalAccountingApi');

describe('BucketRebalancer Integration Tests', () => {
  const mockBuckets = [
    {
      goal_id: 'goal-1',
      goal_name: 'Emergency Fund',
      goal_category: 'emergency',
      goal_priority: 'essential' as const,
      target_date: '2025-12-31',
      target_amount: 30000,
      current_value: 35000, // Overallocated
      projected_value: 36000,
      funding_level: 1.17,
      funding_status: 'fully_funded' as const,
      funding_gap: -5000,
      success_probability: 0.99,
      required_monthly: 0,
      dedicated_accounts: [],
      expected_return: 0.02,
      return_volatility: 0.05,
    },
    {
      goal_id: 'goal-2',
      goal_name: 'Retirement',
      goal_category: 'retirement',
      goal_priority: 'essential' as const,
      target_date: '2045-01-01',
      target_amount: 1500000,
      current_value: 500000, // Underallocated
      projected_value: 1400000,
      funding_level: 0.33,
      funding_status: 'at_risk' as const,
      funding_gap: 1000000,
      success_probability: 0.72,
      required_monthly: 3000,
      dedicated_accounts: [],
      expected_return: 0.07,
      return_volatility: 0.15,
    },
  ];

  const mockAnalysis = {
    needs_rebalancing: true,
    total_imbalance: 5000,
    overallocated_goals: [
      {
        goal_id: 'goal-1',
        goal_name: 'Emergency Fund',
        excess_amount: 5000,
        current_allocation: 6.5,
        target_allocation: 5.5,
      },
    ],
    underallocated_goals: [
      {
        goal_id: 'goal-2',
        goal_name: 'Retirement',
        shortfall_amount: 50000,
        current_allocation: 93.5,
        target_allocation: 94.5,
      },
    ],
    recommendations: [
      {
        from_goal_id: 'goal-1',
        from_goal_name: 'Emergency Fund',
        to_goal_id: 'goal-2',
        to_goal_name: 'Retirement',
        amount: 5000,
        priority: 'high' as const,
        reason: 'Emergency fund is overfunded while retirement is underfunded',
      },
    ],
  };

  const userId = 'user-123';
  const totalPortfolioValue = 535000;
  const mockOnRebalanceComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mentalAccountingApi.analyzeRebalancingNeeds).mockResolvedValue(mockAnalysis);
  });

  it('renders the rebalancer with loading state initially', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    expect(screen.getByText('Analyzing rebalancing needs...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mentalAccountingApi.analyzeRebalancingNeeds).toHaveBeenCalledTimes(1);
    });
  });

  it('displays rebalancing analysis results', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Rebalancing Analysis')).toBeInTheDocument();
    });
  });

  it('shows summary cards with rebalancing metrics', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Total Imbalance')).toBeInTheDocument();
      expect(screen.getByText('Overallocated Goals')).toBeInTheDocument();
      expect(screen.getByText('Underallocated Goals')).toBeInTheDocument();
    });
  });

  it('displays overallocated goals section', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Overallocated Goals \(1\)/)).toBeInTheDocument();
      expect(screen.getByTestId('overallocated-goal-name-goal-1')).toHaveTextContent(
        'Emergency Fund'
      );
      expect(screen.getByText(/Excess Amount/)).toBeInTheDocument();
    });
  });

  it('displays underallocated goals section', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Underallocated Goals \(1\)/)).toBeInTheDocument();
      expect(screen.getByTestId('underallocated-goal-name-goal-2')).toHaveTextContent('Retirement');
      expect(screen.getByText(/Shortfall Amount/)).toBeInTheDocument();
    });
  });

  it('shows rebalancing recommendations', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Rebalancing Recommendations \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/HIGH PRIORITY/)).toBeInTheDocument();
    });
  });

  it('displays recommendation details', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('recommendation-from-0')).toHaveTextContent('Emergency Fund');
      expect(screen.getByTestId('recommendation-to-0')).toHaveTextContent('Retirement');
      expect(screen.getByTestId('recommendation-amount-0')).toHaveTextContent('$5,000');
      expect(
        screen.getByText(/Emergency fund is overfunded while retirement is underfunded/)
      ).toBeInTheDocument();
    });
  });

  it('auto-selects high priority recommendations', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
    });
  });

  it('allows toggling recommendation selection', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      const checkbox = checkboxes[0];

      expect(checkbox).toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  it('shows select all / deselect all button', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });
  });

  it('select all button selects all recommendations', async () => {
    const multipleRecommendations = {
      ...mockAnalysis,
      recommendations: [
        ...mockAnalysis.recommendations,
        {
          from_goal_id: 'goal-3',
          from_goal_name: 'Goal 3',
          to_goal_id: 'goal-4',
          to_goal_name: 'Goal 4',
          amount: 10000,
          priority: 'medium' as const,
          reason: 'Test reason',
        },
      ],
    };

    vi.mocked(mentalAccountingApi.analyzeRebalancingNeeds).mockResolvedValue(
      multipleRecommendations
    );

    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  it('calculates total selected amount correctly', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Transfer Amount:/)).toBeInTheDocument();
      expect(screen.getByTestId('total-transfer-amount')).toHaveTextContent('$5,000');
    });
  });

  it('shows selected recommendation count', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Selected Recommendations: 1 of 1/)).toBeInTheDocument();
    });
  });

  it('disables execute button when no recommendations selected', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Deselect

      const executeButton = screen.getByText('Execute Selected Rebalancing');
      expect(executeButton).toBeDisabled();
    });
  });

  it('executes rebalancing when button clicked', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
        onRebalanceComplete={mockOnRebalanceComplete}
      />
    );

    await waitFor(() => {
      const executeButton = screen.getByTestId('execute-rebalancing-button');
      fireEvent.click(executeButton);
    });

    await waitFor(() => {
      expect(mockOnRebalanceComplete).toHaveBeenCalled();
    });
  });

  it('shows loading state during execution', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const executeButton = screen.getByText('Execute Selected Rebalancing');
      fireEvent.click(executeButton);
    });

    expect(screen.getByText('Executing Rebalancing...')).toBeInTheDocument();
  });

  it('displays "Portfolio Balanced" message when no rebalancing needed', async () => {
    const balancedAnalysis = {
      needs_rebalancing: false,
      total_imbalance: 0,
      overallocated_goals: [],
      underallocated_goals: [],
      recommendations: [],
    };

    vi.mocked(mentalAccountingApi.analyzeRebalancingNeeds).mockResolvedValue(balancedAnalysis);

    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Portfolio Balanced')).toBeInTheDocument();
      expect(
        screen.getByText(/Your goals are properly allocated. No rebalancing needed/)
      ).toBeInTheDocument();
    });
  });

  it('shows priority icons for recommendations', async () => {
    const { container } = render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(container.textContent).toContain('🔴'); // high priority
    });
  });

  it('applies correct priority colors to badges', async () => {
    const { container } = render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const highPriorityBadges = container.querySelectorAll('.bg-red-100');
      expect(highPriorityBadges.length).toBeGreaterThan(0);
    });
  });

  it('shows re-analyze button', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Re-analyze')).toBeInTheDocument();
    });
  });

  it('re-analyzes when re-analyze button clicked', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const reanalyzeButton = screen.getByText('Re-analyze');
      fireEvent.click(reanalyzeButton);
    });

    expect(mentalAccountingApi.analyzeRebalancingNeeds).toHaveBeenCalledTimes(2);
  });

  it('displays allocation progress bars', async () => {
    const { container } = render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const progressBars = container.querySelectorAll('.rounded-full.h-2');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it('shows current vs target allocation percentages', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Current: 6.5%/)).toBeInTheDocument();
      expect(screen.getByText(/Target: 5.5%/)).toBeInTheDocument();
    });
  });

  it('formats currency values correctly', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      // Should use US currency format
      expect(screen.getAllByText(/\$/).length).toBeGreaterThanOrEqual(3);
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(mentalAccountingApi.analyzeRebalancingNeeds).mockRejectedValue(
      new Error('API Error')
    );

    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('rebalancer-error')).toHaveTextContent(/API Error/);
    });
  });

  it('allows clicking recommendation card to toggle selection', async () => {
    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      const recommendationCard = screen.getByTestId('recommendation-card-0');

      if (recommendationCard) {
        const checkboxBefore = screen.getAllByRole('checkbox')[0];
        const isCheckedBefore = checkboxBefore.checked;

        fireEvent.click(recommendationCard);

        const checkboxAfter = screen.getAllByRole('checkbox')[0];
        expect(checkboxAfter.checked).toBe(!isCheckedBefore);
      }
    });
  });

  it('shows medium priority recommendations', async () => {
    const mediumPriorityAnalysis = {
      ...mockAnalysis,
      recommendations: [
        {
          ...mockAnalysis.recommendations[0],
          priority: 'medium' as const,
        },
      ],
    };

    vi.mocked(mentalAccountingApi.analyzeRebalancingNeeds).mockResolvedValue(
      mediumPriorityAnalysis
    );

    const { container } = render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(container.textContent).toContain('🟡'); // medium priority icon
      expect(screen.getByText(/MEDIUM PRIORITY/)).toBeInTheDocument();
    });
  });

  it('shows low priority recommendations', async () => {
    const lowPriorityAnalysis = {
      ...mockAnalysis,
      recommendations: [
        {
          ...mockAnalysis.recommendations[0],
          priority: 'low' as const,
        },
      ],
    };

    vi.mocked(mentalAccountingApi.analyzeRebalancingNeeds).mockResolvedValue(
      lowPriorityAnalysis
    );

    const { container } = render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(container.textContent).toContain('🟢'); // low priority icon
      expect(screen.getByText(/LOW PRIORITY/)).toBeInTheDocument();
    });
  });

  it('updates selected count when selections change', async () => {
    const multipleRecommendations = {
      ...mockAnalysis,
      recommendations: [
        ...mockAnalysis.recommendations,
        {
          from_goal_id: 'goal-3',
          from_goal_name: 'Goal 3',
          to_goal_id: 'goal-4',
          to_goal_name: 'Goal 4',
          amount: 10000,
          priority: 'medium' as const,
          reason: 'Test reason',
        },
      ],
    };

    vi.mocked(mentalAccountingApi.analyzeRebalancingNeeds).mockResolvedValue(
      multipleRecommendations
    );

    render(
      <BucketRebalancer
        userId={userId}
        buckets={mockBuckets}
        totalPortfolioValue={totalPortfolioValue}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Selected Recommendations: 1 of 2/)).toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select second recommendation

      expect(screen.getByText(/Selected Recommendations: 2 of 2/)).toBeInTheDocument();
    });
  });
});
