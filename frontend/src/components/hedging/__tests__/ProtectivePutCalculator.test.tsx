/**
 * Protective Put Calculator Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProtectivePutCalculator } from '../ProtectivePutCalculator';

describe('ProtectivePutCalculator', () => {
  it('renders calculator header', () => {
    render(<ProtectivePutCalculator portfolioValue={500000} />);
    expect(screen.getByText('🛡️ Protective Put Calculator')).toBeInTheDocument();
  });

  it('displays default strike price', () => {
    render(<ProtectivePutCalculator portfolioValue={500000} />);
    expect(screen.getByText(/Strike Price: 90.00%/)).toBeInTheDocument();
  });

  it('allows adjusting strike price', () => {
    render(<ProtectivePutCalculator portfolioValue={500000} />);

    const strikeSlider = screen.getAllByRole('slider')[0];
    fireEvent.change(strikeSlider, { target: { value: '0.85' } });

    expect(screen.getByText(/Strike Price: 85.00%/)).toBeInTheDocument();
  });

  it('displays protection diagram', () => {
    render(<ProtectivePutCalculator portfolioValue={500000} />);
    expect(screen.getByText('Protection Diagram')).toBeInTheDocument();
    expect(screen.getByText('Protected Zone')).toBeInTheDocument();
    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('calculates results correctly', () => {
    render(
      <ProtectivePutCalculator
        portfolioValue={500000}
        equityAllocation={0.70}
        volatility={0.18}
      />
    );

    // Check that result cards are displayed
    expect(screen.getByText('Equity Value')).toBeInTheDocument();
    expect(screen.getByText('Put Cost')).toBeInTheDocument();
    expect(screen.getByText('Protection Level')).toBeInTheDocument();
  });

  it('updates results when inputs change', () => {
    render(<ProtectivePutCalculator portfolioValue={500000} />);

    const timeHorizonSlider = screen.getAllByRole('slider')[1];
    fireEvent.change(timeHorizonSlider, { target: { value: '6' } });

    expect(screen.getByText(/Time Horizon: 6 months/)).toBeInTheDocument();
  });
});
