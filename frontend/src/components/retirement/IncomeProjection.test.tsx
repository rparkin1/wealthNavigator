/**
 * IncomeProjection Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncomeProjection } from './IncomeProjection';
import type { RetirementIncomeProjection } from '../../services/retirementApi';

const mockProjections: RetirementIncomeProjection[] = [
  {
    year: 1,
    age: 65,
    social_security: 30000,
    pension: 15000,
    portfolio_withdrawal: 25000,
    other_income: 0,
    total_income: 70000,
    total_expenses: 60000,
    net_cash_flow: 10000,
  },
  {
    year: 2,
    age: 66,
    social_security: 30600,
    pension: 15300,
    portfolio_withdrawal: 25500,
    other_income: 0,
    total_income: 71400,
    total_expenses: 61200,
    net_cash_flow: 10200,
  },
  {
    year: 3,
    age: 67,
    social_security: 31212,
    pension: 15606,
    portfolio_withdrawal: 26010,
    other_income: 0,
    total_income: 72828,
    total_expenses: 62424,
    net_cash_flow: 10404,
  },
];

describe('IncomeProjection', () => {
  it('renders the component with projections', () => {
    render(<IncomeProjection projections={mockProjections} />);

    expect(screen.getByText('Retirement Income Projection')).toBeInTheDocument();
    expect(screen.getByText(/from age 65 to 67/)).toBeInTheDocument();
  });

  it('displays summary cards', () => {
    render(<IncomeProjection projections={mockProjections} />);

    expect(screen.getByText('Avg Annual Income')).toBeInTheDocument();
    expect(screen.getByText('Avg Annual Expenses')).toBeInTheDocument();
    // Use getAllByText since "Net Cash Flow" appears in both dropdown and summary card
    const netCashFlowElements = screen.getAllByText('Net Cash Flow');
    expect(netCashFlowElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Planning Years')).toBeInTheDocument();
  });

  it('displays income source breakdown', () => {
    render(<IncomeProjection projections={mockProjections} />);

    expect(screen.getByText('Social Security')).toBeInTheDocument();
    expect(screen.getByText('Pension')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Total Income')).toBeInTheDocument();
  });

  it('shows insights section', () => {
    render(<IncomeProjection projections={mockProjections} />);

    expect(screen.getByText('💡 Key Insights')).toBeInTheDocument();
    expect(screen.getByText(/Your average annual income/)).toBeInTheDocument();
  });

  it('displays controls when showControls is true', () => {
    render(<IncomeProjection projections={mockProjections} showControls={true} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hide Expenses/ })).toBeInTheDocument();
  });

  it('hides controls when showControls is false', () => {
    render(<IncomeProjection projections={mockProjections} showControls={false} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Expenses/ })).not.toBeInTheDocument();
  });

  it('displays empty state when no projections', () => {
    render(<IncomeProjection projections={[]} />);

    expect(screen.getByText('No projection data available')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('calculates correct totals', () => {
    render(<IncomeProjection projections={mockProjections} />);

    // Total income: 70000 + 71400 + 72828 = 214228
    // Avg income: 214228 / 3 = 71409.33
    const avgIncomeElements = screen.getAllByText(/\$71,409/);
    expect(avgIncomeElements.length).toBeGreaterThan(0);

    // Total expenses: 60000 + 61200 + 62424 = 183624
    // Avg expenses: 183624 / 3 = 61208
    expect(screen.getByText(/\$61,208/)).toBeInTheDocument();

    // Net cash flow: 214228 - 183624 = 30604
    const netFlowElements = screen.getAllByText(/\$30,604/);
    expect(netFlowElements.length).toBeGreaterThan(0);
  });

  it('shows positive net cash flow styling', () => {
    const { container } = render(<IncomeProjection projections={mockProjections} />);

    // Find the net cash flow card - should have green styling
    const netFlowCards = container.querySelectorAll('.from-green-50');
    expect(netFlowCards.length).toBeGreaterThan(0);
  });

  it('shows negative net cash flow styling', () => {
    const negativeProjections: RetirementIncomeProjection[] = [
      {
        year: 1,
        age: 65,
        social_security: 30000,
        pension: 0,
        portfolio_withdrawal: 20000,
        other_income: 0,
        total_income: 50000,
        total_expenses: 80000,
        net_cash_flow: -30000,
      },
    ];

    const { container } = render(<IncomeProjection projections={negativeProjections} />);

    // Find the net cash flow card - should have orange/warning styling
    const netFlowCards = container.querySelectorAll('.from-orange-50');
    expect(netFlowCards.length).toBeGreaterThan(0);
  });

  it('renders custom title', () => {
    render(
      <IncomeProjection projections={mockProjections} title="My Custom Retirement Plan" />
    );

    expect(screen.getByText('My Custom Retirement Plan')).toBeInTheDocument();
  });

  it('includes all income sources in breakdown', () => {
    render(<IncomeProjection projections={mockProjections} />);

    // Social Security: 30000 + 30600 + 31212 = 91812
    expect(screen.getByText('$91,812')).toBeInTheDocument();

    // Pension: 15000 + 15300 + 15606 = 45906
    expect(screen.getByText('$45,906')).toBeInTheDocument();

    // Portfolio: 25000 + 25500 + 26010 = 76510
    expect(screen.getByText('$76,510')).toBeInTheDocument();
  });
});
