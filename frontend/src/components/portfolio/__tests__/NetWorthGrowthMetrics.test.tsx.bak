/**
 * Net Worth Growth Metrics Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetWorthGrowthMetrics } from '../NetWorthGrowthMetrics';

describe('NetWorthGrowthMetrics', () => {
  const mockData = [
    {
      date: '2024-01-01',
      totalNetWorth: 450000,
      totalAssets: 700000,
      totalLiabilities: 250000,
      liquidNetWorth: 350000,
      assetsByClass: {
        cash: 50000,
        stocks: 150000,
        bonds: 75000,
        realEstate: 300000,
        other: 125000,
      },
    },
    {
      date: '2024-03-01',
      totalNetWorth: 475000,
      totalAssets: 725000,
      totalLiabilities: 250000,
      liquidNetWorth: 375000,
      assetsByClass: {
        cash: 50000,
        stocks: 175000,
        bonds: 75000,
        realEstate: 300000,
        other: 125000,
      },
    },
    {
      date: '2024-06-01',
      totalNetWorth: 500000,
      totalAssets: 750000,
      totalLiabilities: 250000,
      liquidNetWorth: 400000,
      assetsByClass: {
        cash: 50000,
        stocks: 200000,
        bonds: 75000,
        realEstate: 300000,
        other: 125000,
      },
    },
  ];

  it('renders growth metrics', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getByText(/growth metrics/i)).toBeInTheDocument();
  });

  it('displays total change', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getByText(/total change/i)).toBeInTheDocument();
    // Check that $50,000 appears somewhere in the document (may be multiple instances)
    expect(screen.getAllByText(/\$50,000/).length).toBeGreaterThan(0);
  });

  it('displays annualized return', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getAllByText(/annualized return/i).length).toBeGreaterThan(0);
  });

  it('displays volatility', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getAllByText(/volatility/i).length).toBeGreaterThan(0);
  });

  it('displays Sharpe ratio', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getAllByText(/sharpe ratio/i).length).toBeGreaterThan(0);
  });

  it('displays max drawdown', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getByText(/max drawdown/i)).toBeInTheDocument();
  });

  it('handles insufficient data gracefully', () => {
    const { container } = render(
      <NetWorthGrowthMetrics data={[mockData[0]]} timeframe="1Y" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('displays asset vs liability growth', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getByText(/asset vs liability growth/i)).toBeInTheDocument();
  });

  it('shows interpretation guide', () => {
    render(<NetWorthGrowthMetrics data={mockData} timeframe="1Y" />);

    expect(screen.getByText(/metric interpretations/i)).toBeInTheDocument();
  });
});
