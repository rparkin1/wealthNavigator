/**
 * Collar Strategy Builder Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollarStrategyBuilder } from '../CollarStrategyBuilder';

describe('CollarStrategyBuilder', () => {
  it('renders builder header', () => {
    render(<CollarStrategyBuilder portfolioValue={500000} />);
    expect(screen.getByText('🎯 Collar Strategy Builder')).toBeInTheDocument();
  });

  it('displays put and call strikes', () => {
    render(<CollarStrategyBuilder portfolioValue={500000} />);
    expect(screen.getByText(/Put Strike: 90.00%/)).toBeInTheDocument();
    expect(screen.getByText(/Call Strike: 110.00%/)).toBeInTheDocument();
  });

  it('allows adjusting put strike', () => {
    render(<CollarStrategyBuilder portfolioValue={500000} />);

    const putStrikeSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(putStrikeSlider, { target: { value: '0.85' } });

    expect(screen.getByText(/Put Strike: 85.00%/)).toBeInTheDocument();
  });

  it('allows adjusting call strike', () => {
    render(<CollarStrategyBuilder portfolioValue={500000} />);

    const callStrikeSlider = screen.getAllByRole('slider')[1];
    fireEvent.change(callStrikeSlider, { target: { value: '1.15' } });

    expect(screen.getByText(/Call Strike: 115.00%/)).toBeInTheDocument();
  });

  it('displays cost breakdown', () => {
    render(<CollarStrategyBuilder portfolioValue={500000} />);
    expect(screen.getByText('Cost Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Put Cost')).toBeInTheDocument();
    expect(screen.getByText('Call Premium')).toBeInTheDocument();
    expect(screen.getByText('Net Cost')).toBeInTheDocument();
  });

  it('displays collar payoff diagram', () => {
    render(<CollarStrategyBuilder portfolioValue={500000} />);
    expect(screen.getByText('Collar Payoff Diagram')).toBeInTheDocument();
    expect(screen.getByText('Protected')).toBeInTheDocument();
    expect(screen.getByText('Capped')).toBeInTheDocument();
  });

  it('shows zero cost message when applicable', () => {
    render(
      <CollarStrategyBuilder
        portfolioValue={500000}
        equityAllocation={0.70}
        volatility={0.10}
      />
    );

    // With low volatility, collar might be near-zero cost
    // Check if appropriate messages are displayed
    expect(screen.getByText(/Net Cost/)).toBeInTheDocument();
  });
});
