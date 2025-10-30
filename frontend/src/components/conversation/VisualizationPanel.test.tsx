import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualizationPanel } from './VisualizationPanel';

describe('VisualizationPanel', () => {
  it('renders nothing when no visualizations', () => {
    const { container } = render(<VisualizationPanel visualizations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders visualization panel with single chart', () => {
    const visualizations = [
      {
        type: 'pie_chart',
        title: 'Test Portfolio',
        data: { Stocks: 60, Bonds: 40 },
        config: {},
        timestamp: Date.now(),
      },
    ];

    render(<VisualizationPanel visualizations={visualizations} />);

    expect(screen.getByText('Visualizations')).toBeInTheDocument();
    expect(screen.getByText('1 chart generated')).toBeInTheDocument();
    expect(screen.getByText('Test Portfolio')).toBeInTheDocument();
  });

  it('renders multiple visualizations with tabs', () => {
    const visualizations = [
      {
        type: 'pie_chart',
        title: 'Portfolio Allocation',
        data: { Stocks: 60, Bonds: 40 },
        config: {},
        timestamp: Date.now(),
      },
      {
        type: 'bar_chart',
        title: 'Goal Progress',
        data: { Retirement: 75, Emergency: 100 },
        config: {},
        timestamp: Date.now(),
      },
    ];

    render(<VisualizationPanel visualizations={visualizations} />);

    expect(screen.getByText('2 charts generated')).toBeInTheDocument();
    // Both tab titles should be visible
    const allocationTabs = screen.getAllByText('Portfolio Allocation');
    const progressTabs = screen.getAllByText('Goal Progress');
    expect(allocationTabs.length).toBeGreaterThan(0);
    expect(progressTabs.length).toBeGreaterThan(0);
  });

  it('renders pie chart with correct data', () => {
    const visualizations = [
      {
        type: 'pie_chart',
        title: 'Portfolio',
        data: {
          'US Stocks': 40,
          Bonds: 30,
          Cash: 30,
        },
        config: {},
        timestamp: Date.now(),
      },
    ];

    const { container } = render(<VisualizationPanel visualizations={visualizations} />);

    // Check if labels are rendered
    expect(screen.getByText('US Stocks')).toBeInTheDocument();
    expect(screen.getByText('Bonds')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();

    // Check if percentages are calculated (may appear multiple times)
    expect(container.textContent).toContain('40.0%');
    expect(container.textContent).toContain('30.0%');
  });

  it('renders bar chart with progress bars', () => {
    const visualizations = [
      {
        type: 'bar_chart',
        title: 'Goals',
        data: {
          Retirement: 65,
          Emergency: 100,
          House: 45,
        },
        config: {},
        timestamp: Date.now(),
      },
    ];

    const { container } = render(<VisualizationPanel visualizations={visualizations} />);

    expect(screen.getByText('Retirement')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    // Bar chart shows percentages but might be hidden inside progress bars
    expect(container.textContent).toContain('65');
    expect(container.textContent).toContain('100');
    expect(container.textContent).toContain('45');
  });

  it('renders line chart placeholder', () => {
    const visualizations = [
      {
        type: 'line_chart',
        title: 'Growth Over Time',
        data: { '2024': 100, '2025': 120, '2026': 150 },
        config: {},
        timestamp: Date.now(),
      },
    ];

    render(<VisualizationPanel visualizations={visualizations} />);

    expect(screen.getByText('Growth Over Time')).toBeInTheDocument();
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
  });

  it('renders fan chart placeholder', () => {
    const visualizations = [
      {
        type: 'fan_chart',
        title: 'Monte Carlo Results',
        data: {},
        config: {},
        timestamp: Date.now(),
      },
    ];

    render(<VisualizationPanel visualizations={visualizations} />);

    expect(screen.getByText('Monte Carlo Results')).toBeInTheDocument();
    expect(screen.getByText('Fan Chart')).toBeInTheDocument();
  });

  it('renders table with data', () => {
    const visualizations = [
      {
        type: 'table',
        title: 'Account Summary',
        data: [
          { Account: 'Checking', Balance: 5000 },
          { Account: 'Savings', Balance: 10000 },
        ],
        config: {},
        timestamp: Date.now(),
      },
    ];

    render(<VisualizationPanel visualizations={visualizations} />);

    expect(screen.getByText('Account Summary')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('displays timestamp for visualization', () => {
    const timestamp = Date.now();
    const visualizations = [
      {
        type: 'pie_chart',
        title: 'Test',
        data: {},
        config: {},
        timestamp,
      },
    ];

    render(<VisualizationPanel visualizations={visualizations} />);

    const expectedDate = new Date(timestamp).toLocaleString();
    expect(screen.getByText(`Generated: ${expectedDate}`)).toBeInTheDocument();
  });
});
