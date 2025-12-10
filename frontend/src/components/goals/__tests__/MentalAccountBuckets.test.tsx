/**
 * Integration Tests for MentalAccountBuckets Component
 *
 * Tests the mental accounting visualization and goal bucket management
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MentalAccountBuckets } from '../MentalAccountBuckets';
import '@testing-library/jest-dom';

describe('MentalAccountBuckets Integration Tests', () => {
  const mockBuckets = [
    {
      goalId: 'goal-1',
      goalTitle: 'Retirement at 65',
      goalCategory: 'retirement',
      priority: 'essential' as const,
      targetDate: '2045-01-01',
      targetAmount: 1500000,
      currentAmount: 600000,
      projectedValue: 1550000,
      requiredMonthly: 2000,
      successProbability: 0.89,
      fundingLevel: 78.5,
      fundingGap: -50000, // surplus
      allocatedAccounts: ['401k', 'IRA'],
      assetAllocation: {
        us_stocks: 0.50,
        international_stocks: 0.20,
        bonds: 0.25,
        cash: 0.05,
      },
    },
    {
      goalId: 'goal-2',
      goalTitle: 'College Fund',
      goalCategory: 'education',
      priority: 'important' as const,
      targetDate: '2035-09-01',
      targetAmount: 200000,
      currentAmount: 85000,
      projectedValue: 180000,
      requiredMonthly: 500,
      successProbability: 0.72,
      fundingLevel: 62.0,
      fundingGap: 20000,
      allocatedAccounts: ['529 Plan'],
      assetAllocation: {
        us_stocks: 0.60,
        bonds: 0.35,
        cash: 0.05,
      },
    },
  ];

  it('renders all goal buckets', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('Retirement at 65')).toBeInTheDocument();
    expect(screen.getByText('College Fund')).toBeInTheDocument();
  });

  it('displays goal count', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);
    expect(screen.getByText('2 active goals')).toBeInTheDocument();
  });

  it('shows priority badges', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
  });

  it('displays funding levels', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
  });

  it('shows success probabilities', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('89%')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('displays funding gap and surplus correctly', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('Surplus')).toBeInTheDocument();
    expect(screen.getByText('Funding Gap')).toBeInTheDocument();
    expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$20,000/)).toBeInTheDocument();
  });

  it('shows required monthly savings', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText(/\$2,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$500/)).toBeInTheDocument();
  });

  it('displays asset allocation', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    // Check for asset class labels
    expect(screen.getByText(/us stocks: 50%/i)).toBeInTheDocument();
    expect(screen.getByText(/international stocks: 20%/i)).toBeInTheDocument();
    expect(screen.getByText(/bonds:/i)).toBeInTheDocument();
  });

  it('shows target dates formatted correctly', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText(/Jan 2045/i)).toBeInTheDocument();
    expect(screen.getByText(/Sep 2035/i)).toBeInTheDocument();
  });

  it('displays financial metrics', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('Current Value')).toBeInTheDocument();
    expect(screen.getByText('Target Amount')).toBeInTheDocument();
    expect(screen.getByText('Projected Value')).toBeInTheDocument();
  });

  it('shows portfolio summary statistics', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('Total Current Value')).toBeInTheDocument();
    expect(screen.getByText('Total Target')).toBeInTheDocument();
    expect(screen.getByText('Total Projected')).toBeInTheDocument();
    expect(screen.getByText('Avg Success Rate')).toBeInTheDocument();

    // Check calculated values
    expect(screen.getByText(/\$685,000/)).toBeInTheDocument(); // 600k + 85k
    expect(screen.getByText(/\$1,700,000/)).toBeInTheDocument(); // 1.5M + 200k
  });

  it('calls onSelectBucket when bucket is clicked', () => {
    const onSelectBucket = jest.fn();

    render(<MentalAccountBuckets buckets={mockBuckets} onSelectBucket={onSelectBucket} />);

    const bucket = screen.getByText('Retirement at 65').closest('div[class*="cursor-pointer"]');
    if (bucket) {
      fireEvent.click(bucket);
      expect(onSelectBucket).toHaveBeenCalledWith('goal-1');
    }
  });

  it('displays category icons', () => {
    const { container } = render(<MentalAccountBuckets buckets={mockBuckets} />);

    // Check for emoji icons (retirement and education)
    expect(container.textContent).toContain('🏖️'); // retirement
    expect(container.textContent).toContain('🎓'); // education
  });

  it('shows allocated accounts count', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    expect(screen.getByText('2 account(s)')).toBeInTheDocument();
    expect(screen.getByText('1 account(s)')).toBeInTheDocument();
  });

  it('applies correct priority colors', () => {
    const { container } = render(<MentalAccountBuckets buckets={mockBuckets} />);

    const bucketDivs = container.querySelectorAll('div[class*="border-2"]');
    expect(bucketDivs.length).toBeGreaterThan(0);

    // Essential should have red border
    const essentialBucket = Array.from(bucketDivs).find(div =>
      div.textContent?.includes('Retirement at 65')
    );
    expect(essentialBucket?.className).toContain('border-red-500');

    // Important should have blue border
    const importantBucket = Array.from(bucketDivs).find(div =>
      div.textContent?.includes('College Fund')
    );
    expect(importantBucket?.className).toContain('border-blue-500');
  });

  it('renders with empty buckets', () => {
    render(<MentalAccountBuckets buckets={[]} />);

    expect(screen.getByText('Goal Buckets')).toBeInTheDocument();
    expect(screen.getByText('0 active goals')).toBeInTheDocument();
  });

  it('shows View Details buttons', () => {
    render(<MentalAccountBuckets buckets={mockBuckets} />);

    const viewButtons = screen.getAllByText('View Details →');
    expect(viewButtons).toHaveLength(2);
  });
});
