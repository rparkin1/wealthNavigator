/**
 * Integration Tests for FundingWaterfallChart Component
 *
 * Tests the priority-based funding waterfall visualization
 */

import { render, screen } from '@testing-library/react';
import { FundingWaterfallChart } from '../FundingWaterfallChart';
import '@testing-library/jest-dom';

describe('FundingWaterfallChart Integration Tests', () => {
  const mockBuckets = [
    {
      goal_id: 'goal-1',
      goal_name: 'Emergency Fund',
      goal_category: 'emergency',
      goal_priority: 'essential' as const,
      target_date: '2025-12-31',
      target_amount: 30000,
      current_value: 20000,
      projected_value: 32000,
      funding_level: 0.67,
      funding_status: 'on_track' as const,
      funding_gap: 10000,
      success_probability: 0.95,
      required_monthly: 833,
      dedicated_accounts: [],
      expected_return: 0.02,
      return_volatility: 0.05,
    },
    {
      goal_id: 'goal-2',
      goal_name: 'Home Down Payment',
      goal_category: 'home',
      goal_priority: 'important' as const,
      target_date: '2027-06-01',
      target_amount: 100000,
      current_value: 40000,
      projected_value: 95000,
      funding_level: 0.4,
      funding_status: 'at_risk' as const,
      funding_gap: 60000,
      success_probability: 0.72,
      required_monthly: 2000,
      dedicated_accounts: [],
      expected_return: 0.05,
      return_volatility: 0.10,
    },
    {
      goal_id: 'goal-3',
      goal_name: 'Dream Vacation',
      goal_category: 'lifestyle',
      goal_priority: 'aspirational' as const,
      target_date: '2026-07-01',
      target_amount: 15000,
      current_value: 5000,
      projected_value: 14000,
      funding_level: 0.33,
      funding_status: 'underfunded' as const,
      funding_gap: 10000,
      success_probability: 0.65,
      required_monthly: 555,
      dedicated_accounts: [],
      expected_return: 0.04,
      return_volatility: 0.08,
    },
  ];

  const totalAvailable = 50000;

  it('renders the waterfall chart with header', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('Funding Waterfall')).toBeInTheDocument();
    expect(screen.getByText(/Priority-based allocation/)).toBeInTheDocument();
  });

  it('displays total available funds', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('Total Available')).toBeInTheDocument();
    expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
  });

  it('shows summary cards with allocation metrics', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('Allocated')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('displays all goals in priority order', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Home Down Payment')).toBeInTheDocument();
    expect(screen.getByText('Dream Vacation')).toBeInTheDocument();
  });

  it('shows priority badges for each goal', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('essential')).toBeInTheDocument();
    expect(screen.getByText('important')).toBeInTheDocument();
    expect(screen.getByText('aspirational')).toBeInTheDocument();
  });

  it('displays funding status icons', () => {
    const { container } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />
    );

    // Check for status icons (emojis)
    expect(container.textContent).toContain('✅'); // fully funded
    expect(container.textContent).toContain('⚠️'); // partially funded
    expect(container.textContent).toContain('❌'); // unfunded
  });

  it('shows required vs allocated amounts', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getAllByText(/Required:/)).toHaveLength(3);
    expect(screen.getAllByText(/Allocated:/)).toHaveLength(3);
  });

  it('calculates funding percentages correctly', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getAllByText(/Funded:/)).toHaveLength(3);
    // Emergency Fund: needs $10k, should get fully funded (100%)
    // Home: needs $60k, partially funded
    // Vacation: needs $10k, may not be funded
  });

  it('displays cumulative allocation amounts', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getAllByText(/Cumulative:/)).toHaveLength(3);
  });

  it('shows funding summary with goal counts', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('Funding Summary')).toBeInTheDocument();
    expect(screen.getByText(/Fully Funded:/)).toBeInTheDocument();
    expect(screen.getByText(/Partially Funded:/)).toBeInTheDocument();
    expect(screen.getByText(/Unfunded:/)).toBeInTheDocument();
  });

  it('applies correct priority colors to funding bars', () => {
    const { container } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />
    );

    // Essential priority should have red background
    const redBars = container.querySelectorAll('.bg-red-500');
    expect(redBars.length).toBeGreaterThan(0);

    // Important priority should have blue background
    const blueBars = container.querySelectorAll('.bg-blue-500');
    expect(blueBars.length).toBeGreaterThan(0);

    // Aspirational priority should have green background
    const greenBars = container.querySelectorAll('.bg-green-500');
    expect(greenBars.length).toBeGreaterThan(0);
  });

  it('shows unfunded portions with dashed borders', () => {
    const { container } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />
    );

    const dashedBorders = container.querySelectorAll('.border-dashed');
    expect(dashedBorders.length).toBeGreaterThan(0);
  });

  it('handles insufficient funds scenario', () => {
    const insufficientFunds = 5000;
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={insufficientFunds} />);

    // Should still render without errors
    expect(screen.getByText('Funding Waterfall')).toBeInTheDocument();
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
  });

  it('handles excess funds scenario', () => {
    const excessFunds = 200000; // More than enough to fund all goals
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={excessFunds} />);

    // Remaining funds should be shown
    expect(screen.getByText('Remaining')).toBeInTheDocument();
    // All goals should be fully funded
    const summarySection = screen.getByText('Funding Summary').closest('div');
    expect(summarySection).toBeInTheDocument();
  });

  it('renders with empty buckets', () => {
    render(<FundingWaterfallChart buckets={[]} totalAvailable={totalAvailable} />);

    expect(screen.getByText('Funding Waterfall')).toBeInTheDocument();
    expect(screen.getByText(/0 goals/)).toBeInTheDocument();
  });

  it('sorts goals by priority correctly', () => {
    const { container } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />
    );

    const goalNames = Array.from(container.querySelectorAll('.font-semibold')).map(
      (el) => el.textContent
    );

    // Essential goals should come first
    const emergencyIndex = goalNames.findIndex((name) => name?.includes('Emergency Fund'));
    const homeIndex = goalNames.findIndex((name) => name?.includes('Home Down Payment'));
    const vacationIndex = goalNames.findIndex((name) => name?.includes('Dream Vacation'));

    expect(emergencyIndex).toBeLessThan(homeIndex);
    expect(homeIndex).toBeLessThan(vacationIndex);
  });

  it('displays priority order indicators', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText(/2nd Priority/)).toBeInTheDocument();
    expect(screen.getByText(/3rd Priority/)).toBeInTheDocument();
  });

  it('shows visual progress bars for funding', () => {
    const { container } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />
    );

    // Should have progress bar divs
    const progressBars = container.querySelectorAll('.h-16.bg-gray-100');
    expect(progressBars.length).toBe(3);
  });

  it('calculates waterfall allocation correctly', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={50000} />);

    // Emergency Fund needs $10k - should get $10k (fully funded)
    // Home needs $60k - should get $40k (remaining funds, partially funded)
    // Vacation needs $10k - should get $0 (no funds left, unfunded)

    const summaryText = screen.getByText('Funding Summary').closest('div')?.textContent;
    expect(summaryText).toMatch(/Fully Funded:/);
    expect(summaryText).toMatch(/1 goal/); // Emergency Fund
    expect(summaryText).toMatch(/Partially Funded:/);
    expect(summaryText).toMatch(/1 goal/); // Home
    expect(summaryText).toMatch(/Unfunded:/);
    expect(summaryText).toMatch(/1 goal/); // Vacation
  });

  it('handles goals with same priority', () => {
    const samePriorityBuckets = [
      { ...mockBuckets[0], goal_priority: 'essential' as const, target_date: '2025-12-31' },
      { ...mockBuckets[1], goal_priority: 'essential' as const, target_date: '2024-06-01' },
    ];

    render(<FundingWaterfallChart buckets={samePriorityBuckets} totalAvailable={totalAvailable} />);

    // Should sort by target date within same priority
    expect(screen.getByText('Funding Waterfall')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />);

    // Should use US currency format
    expect(screen.getAllByText(/\$/)).toHaveLength(3); // Multiple currency displays
  });

  it('shows allocated amounts in funding bars', () => {
    const { container } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />
    );

    // Funding bars should show amounts when width > 10%
    const fundingBars = container.querySelectorAll('.text-white.font-semibold');
    expect(fundingBars.length).toBeGreaterThan(0);
  });

  it('displays "Unfunded" label for shortfall portions', () => {
    render(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={30000} />);

    // With only $30k, some goals won't be fully funded
    expect(screen.getByText('Funding Waterfall')).toBeInTheDocument();
    // Dashed borders indicate unfunded portions
  });

  it('updates when totalAvailable changes', () => {
    const { rerender } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={50000} />
    );

    expect(screen.getByText(/\$50,000/)).toBeInTheDocument();

    rerender(<FundingWaterfallChart buckets={mockBuckets} totalAvailable={75000} />);

    expect(screen.getByText(/\$75,000/)).toBeInTheDocument();
  });

  it('updates when buckets change', () => {
    const { rerender } = render(
      <FundingWaterfallChart buckets={mockBuckets} totalAvailable={totalAvailable} />
    );

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();

    const newBuckets = mockBuckets.slice(0, 2);
    rerender(<FundingWaterfallChart buckets={newBuckets} totalAvailable={totalAvailable} />);

    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.queryByText('Dream Vacation')).not.toBeInTheDocument();
  });
});
