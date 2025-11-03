/**
 * Unit Tests for WhatIfSliders Component
 *
 * Tests interactive slider functionality, debouncing, and API integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatIfSliders, WhatIfSlidersProps } from '../WhatIfSliders';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the debounce utility
vi.mock('../../../utils/debounce', () => ({
  debounce: (fn: Function) => fn, // No delay for testing
}));

describe('WhatIfSliders', () => {
  const mockBaseline = {
    monthlyContribution: 2000,
    retirementAge: 65,
    expectedReturnStocks: 0.08,
    expectedReturnBonds: 0.04,
    inflationRate: 0.03,
    lifeExpectancy: 90,
  };

  const mockResult = {
    successProbability: 0.85,
    medianPortfolioValue: 1500000,
    requiredContribution: 2000,
    yearsToGoal: 20,
  };

  const defaultProps: WhatIfSlidersProps = {
    baseline: mockBaseline,
    onAdjustmentChange: vi.fn(),
    initialResult: mockResult,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all slider controls', () => {
      render(<WhatIfSliders {...defaultProps} />);

      expect(screen.getByText(/Monthly Contribution/i)).toBeInTheDocument();
      expect(screen.getByText(/Retirement Age/i)).toBeInTheDocument();
      expect(screen.getByText(/Stock Returns/i)).toBeInTheDocument();
      expect(screen.getByText(/Bond Returns/i)).toBeInTheDocument();
      expect(screen.getByText(/Inflation Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Life Expectancy/i)).toBeInTheDocument();
    });

    it('displays baseline values correctly', () => {
      render(<WhatIfSliders {...defaultProps} />);

      // Check that baseline values are displayed
      expect(screen.getByText('$2,000')).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('8.0%')).toBeInTheDocument();
    });

    it('shows initial scenario results', () => {
      render(<WhatIfSliders {...defaultProps} />);

      expect(screen.getByText('85.0%')).toBeInTheDocument(); // Success probability
      expect(screen.getByText(/\$1,500,000/)).toBeInTheDocument(); // Portfolio value
    });
  });

  describe('Slider Interactions', () => {
    it('calls onAdjustmentChange when slider is moved', async () => {
      const onAdjustmentChange = vi.fn();
      render(<WhatIfSliders {...defaultProps} onAdjustmentChange={onAdjustmentChange} />);

      const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
      fireEvent.change(contributionSlider, { target: { value: '2500' } });

      await waitFor(() => {
        expect(onAdjustmentChange).toHaveBeenCalledWith(
          expect.objectContaining({
            monthlyContribution: 2500,
          })
        );
      });
    });

    it('updates delta indicator when value changes', () => {
      render(<WhatIfSliders {...defaultProps} />);

      const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
      fireEvent.change(contributionSlider, { target: { value: '2500' } });

      // Should show +$500 delta
      expect(screen.getByText(/\+\$500/)).toBeInTheDocument();
    });

    it('handles retirement age adjustments', async () => {
      const onAdjustmentChange = vi.fn();
      render(<WhatIfSliders {...defaultProps} onAdjustmentChange={onAdjustmentChange} />);

      const ageSlider = screen.getByRole('slider', { name: /retirement age/i });
      fireEvent.change(ageSlider, { target: { value: '60' } });

      await waitFor(() => {
        expect(onAdjustmentChange).toHaveBeenCalledWith(
          expect.objectContaining({
            retirementAge: 60,
          })
        );
      });
    });

    it('handles return rate adjustments', async () => {
      const onAdjustmentChange = vi.fn();
      render(<WhatIfSliders {...defaultProps} onAdjustmentChange={onAdjustmentChange} />);

      const stocksSlider = screen.getByRole('slider', { name: /stock returns/i });
      fireEvent.change(stocksSlider, { target: { value: '0.10' } });

      await waitFor(() => {
        expect(onAdjustmentChange).toHaveBeenCalledWith(
          expect.objectContaining({
            expectedReturnStocks: 0.10,
          })
        );
      });
    });
  });

  describe('Reset Functionality', () => {
    it('resets all sliders to baseline when reset button clicked', async () => {
      const onAdjustmentChange = vi.fn();
      render(<WhatIfSliders {...defaultProps} onAdjustmentChange={onAdjustmentChange} />);

      // Change a slider
      const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
      fireEvent.change(contributionSlider, { target: { value: '3000' } });

      // Click reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(onAdjustmentChange).toHaveBeenCalledWith(
          expect.objectContaining({
            monthlyContribution: 2000, // Back to baseline
          })
        );
      });
    });
  });

  describe('Advanced Options', () => {
    it('shows advanced sliders when toggled', () => {
      render(<WhatIfSliders {...defaultProps} />);

      // Advanced sliders should be hidden initially
      expect(screen.queryByText(/Life Expectancy/i)).not.toBeVisible();

      // Click to expand
      const advancedToggle = screen.getByText(/Advanced Options/i);
      fireEvent.click(advancedToggle);

      // Now visible
      expect(screen.getByText(/Life Expectancy/i)).toBeVisible();
    });
  });

  describe('Delta Indicators', () => {
    it('shows positive delta with green color', () => {
      render(<WhatIfSliders {...defaultProps} />);

      const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
      fireEvent.change(contributionSlider, { target: { value: '2500' } });

      const delta = screen.getByText(/\+\$500/);
      expect(delta).toHaveClass('text-green-600');
    });

    it('shows negative delta with red color', () => {
      render(<WhatIfSliders {...defaultProps} />);

      const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
      fireEvent.change(contributionSlider, { target: { value: '1500' } });

      const delta = screen.getByText(/-\$500/);
      expect(delta).toHaveClass('text-red-600');
    });

    it('shows no delta when value equals baseline', () => {
      render(<WhatIfSliders {...defaultProps} />);

      // Initially no delta
      expect(screen.queryByText(/\+\$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/-\$/)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when recalculating', () => {
      render(<WhatIfSliders {...defaultProps} loading={true} />);

      expect(screen.getByText(/Recalculating/i)).toBeInTheDocument();
    });

    it('disables sliders during loading', () => {
      render(<WhatIfSliders {...defaultProps} loading={true} />);

      const sliders = screen.getAllByRole('slider');
      sliders.forEach(slider => {
        expect(slider).toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing baseline gracefully', () => {
      const incompleteBaseline = {
        monthlyContribution: 2000,
        retirementAge: 65,
      };

      render(
        <WhatIfSliders
          {...defaultProps}
          baseline={incompleteBaseline as any}
        />
      );

      // Should still render without crashing
      expect(screen.getByText(/Monthly Contribution/i)).toBeInTheDocument();
    });

    it('handles extreme slider values', () => {
      const onAdjustmentChange = vi.fn();
      render(<WhatIfSliders {...defaultProps} onAdjustmentChange={onAdjustmentChange} />);

      const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });

      // Try very high value
      fireEvent.change(contributionSlider, { target: { value: '10000' } });

      expect(onAdjustmentChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels for sliders', () => {
      render(<WhatIfSliders {...defaultProps} />);

      const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
      expect(contributionSlider).toHaveAttribute('aria-label');
    });

    it('displays current values in accessible format', () => {
      render(<WhatIfSliders {...defaultProps} />);

      // Values should be readable by screen readers
      const values = screen.getAllByRole('status');
      expect(values.length).toBeGreaterThan(0);
    });
  });
});
