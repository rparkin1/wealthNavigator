/**
 * Multi-Goal Optimization Tests
 *
 * Comprehensive tests for multi-goal optimization components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiGoalOptimizationDashboard } from '../MultiGoalOptimizationDashboard';
import { GoalPrioritizationEditor } from '../GoalPrioritizationEditor';
import { TaxAwareAllocationView } from '../TaxAwareAllocationView';
import { HouseholdOptimizationView } from '../HouseholdOptimizationView';
import { TradeoffAnalysisChart } from '../TradeoffAnalysisChart';
import * as multiGoalOptimizationApi from '../../../services/multiGoalOptimizationApi';

// Mock API
vi.mock('../../../services/multiGoalOptimizationApi', () => ({
  optimizeMultiGoalAllocation: vi.fn(),
  analyzeTaxEfficiency: vi.fn(),
  getGlidePath: vi.fn(),
  formatCurrency: (value: number) => `$${value.toLocaleString()}`,
  formatPercentage: (value: number) => `${(value * 100).toFixed(1)}%`,
  getPriorityColor: vi.fn(() => '#3b82f6'),
  getAccountTypeColor: vi.fn(() => '#8b5cf6'),
  getFundingStatusColor: vi.fn(() => '#10b981'),
  calculateFundingLevel: (current: number, target: number) => current / target,
}));

// Test data
const mockGoals = [
  {
    id: 'goal-1',
    title: 'Retirement',
    category: 'retirement',
    priority: 'essential' as const,
    targetAmount: 2000000,
    currentAmount: 500000,
    targetDate: '2050-01-01',
  },
  {
    id: 'goal-2',
    title: 'Education',
    category: 'education',
    priority: 'important' as const,
    targetAmount: 200000,
    currentAmount: 50000,
    targetDate: '2035-01-01',
  },
  {
    id: 'goal-3',
    title: 'Vacation Home',
    category: 'major_expense',
    priority: 'aspirational' as const,
    targetAmount: 500000,
    currentAmount: 100000,
    targetDate: '2040-01-01',
  },
];

const mockAccounts = [
  {
    id: 'account-1',
    type: 'tax_deferred' as const,
    balance: 250000,
  },
  {
    id: 'account-2',
    type: 'tax_exempt' as const,
    balance: 150000,
  },
  {
    id: 'account-3',
    type: 'taxable' as const,
    balance: 100000,
  },
];

const mockOptimizationResult = {
  goal_allocations: {
    'goal-1': 300000,
    'goal-2': 150000,
    'goal-3': 50000,
  },
  goal_portfolios: [
    {
      goal_id: 'goal-1',
      goal_title: 'Retirement',
      allocated_amount: 300000,
      years_to_goal: 25,
      risk_tolerance: 0.8,
      allocation: {
        us_stocks: 0.6,
        international_stocks: 0.25,
        bonds: 0.15,
      },
      expected_return: 0.078,
      expected_risk: 0.142,
      sharpe_ratio: 0.42,
    },
    {
      goal_id: 'goal-2',
      goal_title: 'Education',
      allocated_amount: 150000,
      years_to_goal: 10,
      risk_tolerance: 0.6,
      allocation: {
        us_stocks: 0.5,
        bonds: 0.4,
        cash: 0.1,
      },
      expected_return: 0.065,
      expected_risk: 0.115,
      sharpe_ratio: 0.38,
    },
    {
      goal_id: 'goal-3',
      goal_title: 'Vacation Home',
      allocated_amount: 50000,
      years_to_goal: 15,
      risk_tolerance: 0.5,
      allocation: {
        us_stocks: 0.4,
        bonds: 0.5,
        cash: 0.1,
      },
      expected_return: 0.055,
      expected_risk: 0.095,
      sharpe_ratio: 0.35,
    },
  ],
  account_allocations: [
    {
      account_id: 'account-1',
      allocations: {
        bonds: 100000,
        tips: 50000,
      },
    },
    {
      account_id: 'account-2',
      allocations: {
        us_stocks: 120000,
        international_stocks: 30000,
      },
    },
    {
      account_id: 'account-3',
      allocations: {
        us_stocks: 60000,
        municipal_bonds: 40000,
      },
    },
  ],
  aggregate_stats: {
    total_value: 500000,
    weighted_return: 0.071,
    weighted_risk: 0.125,
    sharpe_ratio: 0.40,
    aggregate_allocation: {
      us_stocks: 0.48,
      international_stocks: 0.12,
      bonds: 0.28,
      tips: 0.10,
      cash: 0.02,
    },
  },
  optimization_summary: {
    total_goals: 3,
    fully_funded_goals: 0,
    partially_funded_goals: 3,
    unfunded_goals: 0,
  },
};

const mockTaxAnalysis = {
  user_id: 'user-1',
  current_tax_drag: 0.0125,
  optimized_tax_drag: 0.0075,
  annual_savings: 1375,
  recommendations: [
    {
      priority: 'high' as const,
      action: 'Move bonds from taxable to 401k',
      current_account: 'taxable-1',
      target_account: '401k-1',
      asset: 'bonds',
      amount: 25000,
      annual_tax_savings: 875,
    },
  ],
  implementation_notes: [
    'Bond migration can be done immediately without tax impact',
  ],
};

const mockGlidePath = {
  goal_id: 'goal-1',
  goal_title: 'Retirement',
  years_to_goal: 25,
  glide_path: [
    {
      year: 0,
      years_remaining: 25,
      stocks_percentage: 80,
      bonds_percentage: 20,
      risk_level: 'aggressive' as const,
    },
    {
      year: 10,
      years_remaining: 15,
      stocks_percentage: 70,
      bonds_percentage: 30,
      risk_level: 'moderate' as const,
    },
    {
      year: 20,
      years_remaining: 5,
      stocks_percentage: 40,
      bonds_percentage: 60,
      risk_level: 'conservative' as const,
    },
  ],
  current_allocation: {
    stocks: 80,
    bonds: 20,
  },
  target_allocation: {
    stocks: 30,
    bonds: 70,
  },
};

describe('MultiGoalOptimizationDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with goal selection', () => {
    render(
      <MultiGoalOptimizationDashboard
        userId="user-1"
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Multi-Goal Portfolio Optimization')).toBeInTheDocument();
    expect(screen.getByText('Retirement')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Vacation Home')).toBeInTheDocument();
  });

  it('allows selecting and deselecting goals', () => {
    render(
      <MultiGoalOptimizationDashboard
        userId="user-1"
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);

    // All should be checked initially
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // Uncheck first goal
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('triggers optimization on button click', async () => {
    const optimizeMock = vi
      .spyOn(multiGoalOptimizationApi, 'optimizeMultiGoalAllocation')
      .mockResolvedValue(mockOptimizationResult);

    render(
      <MultiGoalOptimizationDashboard
        userId="user-1"
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    const optimizeButton = screen.getByText(/Optimize \d+ Goals/);
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(optimizeMock).toHaveBeenCalledWith({
        goal_ids: mockGoals.map((g) => g.id),
        accounts: mockAccounts,
        total_portfolio_value: 500000,
      });
    });
  });

  it('displays optimization results', async () => {
    vi.spyOn(multiGoalOptimizationApi, 'optimizeMultiGoalAllocation').mockResolvedValue(
      mockOptimizationResult
    );

    render(
      <MultiGoalOptimizationDashboard
        userId="user-1"
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
      expect(screen.getByText('Expected Return')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Risk')).toBeInTheDocument();
      expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    vi.spyOn(multiGoalOptimizationApi, 'optimizeMultiGoalAllocation').mockResolvedValue(
      mockOptimizationResult
    );

    render(
      <MultiGoalOptimizationDashboard
        userId="user-1"
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    });

    // Click on prioritization tab
    const prioritizationTab = screen.getByText('Goal Prioritization');
    fireEvent.click(prioritizationTab);

    expect(screen.getByText(/Drag and drop goals/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    vi.spyOn(multiGoalOptimizationApi, 'optimizeMultiGoalAllocation').mockRejectedValue(
      new Error('Optimization failed')
    );

    render(
      <MultiGoalOptimizationDashboard
        userId="user-1"
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Optimization failed/i)).toBeInTheDocument();
    });
  });
});

describe('GoalPrioritizationEditor', () => {
  const onPrioritiesChanged = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders goals grouped by priority', () => {
    render(
      <GoalPrioritizationEditor goals={mockGoals} onPrioritiesChanged={onPrioritiesChanged} />
    );

    expect(screen.getByText('Goal Prioritization')).toBeInTheDocument();
    expect(screen.getByText(/essential/i)).toBeInTheDocument();
    expect(screen.getByText(/important/i)).toBeInTheDocument();
    expect(screen.getByText(/aspirational/i)).toBeInTheDocument();
  });

  it('allows changing goal priority', () => {
    render(
      <GoalPrioritizationEditor goals={mockGoals} onPrioritiesChanged={onPrioritiesChanged} />
    );

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);

    // Change first goal's priority
    fireEvent.change(selects[0], { target: { value: 'important' } });

    // Should show save button
    expect(screen.getByText('Save & Re-optimize')).toBeInTheDocument();
  });

  it('saves changes and triggers callback', () => {
    render(
      <GoalPrioritizationEditor goals={mockGoals} onPrioritiesChanged={onPrioritiesChanged} />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'important' } });

    const saveButton = screen.getByText('Save & Re-optimize');
    fireEvent.click(saveButton);

    expect(onPrioritiesChanged).toHaveBeenCalledTimes(1);
  });

  it('displays target allocation by priority', () => {
    render(
      <GoalPrioritizationEditor goals={mockGoals} onPrioritiesChanged={onPrioritiesChanged} />
    );

    expect(screen.getByText('Target Allocation by Priority')).toBeInTheDocument();
  });
});

describe('TaxAwareAllocationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(multiGoalOptimizationApi, 'analyzeTaxEfficiency').mockResolvedValue(
      mockTaxAnalysis
    );
  });

  it('renders tax optimization view', () => {
    render(
      <TaxAwareAllocationView
        userId="user-1"
        accountAllocations={mockOptimizationResult.account_allocations}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Tax-Aware Asset Location')).toBeInTheDocument();
  });

  it('loads and displays tax analysis', async () => {
    render(
      <TaxAwareAllocationView
        userId="user-1"
        accountAllocations={mockOptimizationResult.account_allocations}
        accounts={mockAccounts}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Current Annual Tax Drag')).toBeInTheDocument();
      expect(screen.getByText('Optimized Tax Drag')).toBeInTheDocument();
      expect(screen.getByText('Potential Annual Savings')).toBeInTheDocument();
    });
  });

  it('displays account type descriptions', () => {
    render(
      <TaxAwareAllocationView
        userId="user-1"
        accountAllocations={mockOptimizationResult.account_allocations}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Account Types & Tax Treatment')).toBeInTheDocument();
    expect(screen.getByText(/tax-free growth/i)).toBeInTheDocument();
  });

  it('shows tax optimization recommendations', async () => {
    render(
      <TaxAwareAllocationView
        userId="user-1"
        accountAllocations={mockOptimizationResult.account_allocations}
        accounts={mockAccounts}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/Move bonds from taxable/i)).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    vi.spyOn(multiGoalOptimizationApi, 'analyzeTaxEfficiency').mockRejectedValue(
      new Error('Tax analysis failed')
    );

    render(
      <TaxAwareAllocationView
        userId="user-1"
        accountAllocations={mockOptimizationResult.account_allocations}
        accounts={mockAccounts}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Tax analysis failed/i)).toBeInTheDocument();
    });
  });
});

describe('HouseholdOptimizationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(multiGoalOptimizationApi, 'getGlidePath').mockResolvedValue(mockGlidePath);
  });

  it('renders household optimization view', () => {
    render(
      <HouseholdOptimizationView
        optimizationResult={mockOptimizationResult}
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Household-Level Optimization')).toBeInTheDocument();
  });

  it('switches between view modes', () => {
    render(
      <HouseholdOptimizationView
        optimizationResult={mockOptimizationResult}
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    // Default is aggregate
    expect(screen.getByText('Household Asset Allocation')).toBeInTheDocument();

    // Switch to accounts
    const accountsTab = screen.getByText('Account Allocations');
    fireEvent.click(accountsTab);
    expect(screen.getByText('Asset Allocation by Account')).toBeInTheDocument();

    // Switch to glide paths
    const glidePathsTab = screen.getByText('Glide Paths');
    fireEvent.click(glidePathsTab);
    expect(screen.getByText('Select Goal:')).toBeInTheDocument();
  });

  it('displays aggregate statistics', () => {
    render(
      <HouseholdOptimizationView
        optimizationResult={mockOptimizationResult}
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Weighted Expected Return')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Risk (Volatility)')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
  });

  it('loads glide path for selected goal', async () => {
    render(
      <HouseholdOptimizationView
        optimizationResult={mockOptimizationResult}
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    // Switch to glide paths tab
    const glidePathsTab = screen.getByText('Glide Paths');
    fireEvent.click(glidePathsTab);

    await waitFor(() => {
      expect(screen.getByText(/years to goal/i)).toBeInTheDocument();
    });
  });

  it('displays funding status summary', () => {
    render(
      <HouseholdOptimizationView
        optimizationResult={mockOptimizationResult}
        goals={mockGoals}
        accounts={mockAccounts}
      />
    );

    expect(screen.getByText('Goal Funding Status')).toBeInTheDocument();
    expect(screen.getByText('Fully Funded')).toBeInTheDocument();
    expect(screen.getByText('Partially Funded')).toBeInTheDocument();
    expect(screen.getByText('Unfunded')).toBeInTheDocument();
  });
});

describe('TradeoffAnalysisChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tradeoff analysis', () => {
    render(
      <TradeoffAnalysisChart
        goalPortfolios={mockOptimizationResult.goal_portfolios}
        goals={mockGoals}
        totalPortfolioValue={500000}
      />
    );

    expect(screen.getByText('Goal Trade-off Analysis')).toBeInTheDocument();
  });

  it('displays portfolio status', () => {
    render(
      <TradeoffAnalysisChart
        goalPortfolios={mockOptimizationResult.goal_portfolios}
        goals={mockGoals}
        totalPortfolioValue={500000}
      />
    );

    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Total Target Amount')).toBeInTheDocument();
    expect(screen.getByText('Funding Gap')).toBeInTheDocument();
  });

  it('allows switching between allocation strategies', () => {
    render(
      <TradeoffAnalysisChart
        goalPortfolios={mockOptimizationResult.goal_portfolios}
        goals={mockGoals}
        totalPortfolioValue={500000}
      />
    );

    const equalDistButton = screen.getByText('Equal Distribution');
    fireEvent.click(equalDistButton);

    expect(equalDistButton.closest('button')).toHaveClass('active');
  });

  it('allows adjusting goal allocations', () => {
    render(
      <TradeoffAnalysisChart
        goalPortfolios={mockOptimizationResult.goal_portfolios}
        goals={mockGoals}
        totalPortfolioValue={500000}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '20' } });

    expect(slider).toHaveValue('20');
  });

  it('displays allocation comparison table', () => {
    render(
      <TradeoffAnalysisChart
        goalPortfolios={mockOptimizationResult.goal_portfolios}
        goals={mockGoals}
        totalPortfolioValue={500000}
      />
    );

    expect(screen.getByText('Allocation Comparison')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Allocation')).toBeInTheDocument();
    expect(screen.getByText('Funding Level')).toBeInTheDocument();
  });

  it('shows recommendations when underfunded', () => {
    // Total target = 2,700,000, portfolio = 500,000, so underfunded
    render(
      <TradeoffAnalysisChart
        goalPortfolios={mockOptimizationResult.goal_portfolios}
        goals={mockGoals}
        totalPortfolioValue={500000}
      />
    );

    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Increase Contributions')).toBeInTheDocument();
    expect(screen.getByText('Adjust Goal Priorities')).toBeInTheDocument();
    expect(screen.getByText('Extend Timelines')).toBeInTheDocument();
  });

  it('resets allocation adjustment', () => {
    render(
      <TradeoffAnalysisChart
        goalPortfolios={mockOptimizationResult.goal_portfolios}
        goals={mockGoals}
        totalPortfolioValue={500000}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '25' } });

    const resetButton = screen.getByText('Reset Adjustment');
    fireEvent.click(resetButton);

    expect(slider).toHaveValue('0');
  });
});
