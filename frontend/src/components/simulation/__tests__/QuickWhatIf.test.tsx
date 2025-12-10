/**
 * Unit Tests for QuickWhatIf Component
 *
 * Tests pre-built scenario templates and one-click execution
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickWhatIf, QuickWhatIfProps } from '../QuickWhatIf';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('QuickWhatIf', () => {
  const mockBaseline = {
    monthlyContribution: 2000,
    retirementAge: 65,
    expectedReturnStocks: 0.08,
    expectedReturnBonds: 0.04,
    inflationRate: 0.03,
  };

  const defaultProps: QuickWhatIfProps = {
    baseline: mockBaseline,
    onScenarioSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all scenario cards', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Check for key scenarios
      expect(screen.getByText(/Retire 5 Years Earlier/i)).toBeInTheDocument();
      expect(screen.getByText(/Increase Contributions 50%/i)).toBeInTheDocument();
      expect(screen.getByText(/Market Crash/i)).toBeInTheDocument();
      expect(screen.getByText(/Lower Inflation/i)).toBeInTheDocument();
    });

    it('displays scenario icons', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Icons should be present (as text emojis)
      expect(screen.getByText('🏖️')).toBeInTheDocument(); // Retire early
      expect(screen.getByText('📈')).toBeInTheDocument(); // Increase contributions
      expect(screen.getByText('📉')).toBeInTheDocument(); // Market crash
    });

    it('shows scenario descriptions', () => {
      render(<QuickWhatIf {...defaultProps} />);

      expect(screen.getByText(/What if I retire at 60 instead of 65/i)).toBeInTheDocument();
      expect(screen.getByText(/What if I increase monthly contributions to/i)).toBeInTheDocument();
    });
  });

  describe('Scenario Selection', () => {
    it('calls onScenarioSelect when scenario is clicked', async () => {
      const onScenarioSelect = vi.fn();
      render(<QuickWhatIf {...defaultProps} onScenarioSelect={onScenarioSelect} />);

      const retireEarlyCard = screen.getByText(/Retire 5 Years Earlier/i).closest('button');
      fireEvent.click(retireEarlyCard!);

      await waitFor(() => {
        expect(onScenarioSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'retire_5_years_earlier',
            title: 'Retire 5 Years Earlier',
          })
        );
      });
    });

    it('applies correct adjustments for retire early scenario', async () => {
      const onScenarioSelect = vi.fn();
      render(<QuickWhatIf {...defaultProps} onScenarioSelect={onScenarioSelect} />);

      const retireEarlyCard = screen.getByText(/Retire 5 Years Earlier/i).closest('button');
      fireEvent.click(retireEarlyCard!);

      await waitFor(() => {
        const call = onScenarioSelect.mock.calls[0][0];
        expect(call.adjustments).toEqual({ retirementAge: -5 });
      });
    });

    it('applies correct adjustments for increase contributions scenario', async () => {
      const onScenarioSelect = vi.fn();
      render(<QuickWhatIf {...defaultProps} onScenarioSelect={onScenarioSelect} />);

      const increaseCard = screen.getByText(/Increase Contributions 50%/i).closest('button');
      fireEvent.click(increaseCard!);

      await waitFor(() => {
        const call = onScenarioSelect.mock.calls[0][0];
        expect(call.adjustments).toEqual({ monthlyContribution: 1.5 }); // Multiplier
      });
    });

    it('applies correct adjustments for market crash scenario', async () => {
      const onScenarioSelect = vi.fn();
      render(<QuickWhatIf {...defaultProps} onScenarioSelect={onScenarioSelect} />);

      const crashCard = screen.getByText(/Market Crash/i).closest('button');
      fireEvent.click(crashCard!);

      await waitFor(() => {
        const call = onScenarioSelect.mock.calls[0][0];
        expect(call.adjustments.expectedReturnStocks).toBeLessThan(mockBaseline.expectedReturnStocks);
      });
    });
  });

  describe('Visual Feedback', () => {
    it('highlights selected scenario', () => {
      render(<QuickWhatIf {...defaultProps} />);

      const retireEarlyCard = screen.getByText(/Retire 5 Years Earlier/i).closest('button');
      fireEvent.click(retireEarlyCard!);

      expect(retireEarlyCard).toHaveClass('border-blue-600');
    });

    it('shows loading state when scenario is executing', () => {
      render(<QuickWhatIf {...defaultProps} loading={true} />);

      // All cards should be disabled during loading
      const cards = screen.getAllByRole('button');
      cards.forEach(card => {
        expect(card).toBeDisabled();
      });
    });
  });

  describe('Scenario Categories', () => {
    it('groups optimistic scenarios', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Optimistic scenarios
      expect(screen.getByText(/Better Than Expected Returns/i)).toBeInTheDocument();
      expect(screen.getByText(/Lower Inflation/i)).toBeInTheDocument();
    });

    it('groups pessimistic scenarios', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Pessimistic scenarios
      expect(screen.getByText(/Market Crash/i)).toBeInTheDocument();
      expect(screen.getByText(/High Inflation/i)).toBeInTheDocument();
    });

    it('groups adjustment scenarios', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // User-driven adjustments
      expect(screen.getByText(/Increase Contributions 50%/i)).toBeInTheDocument();
      expect(screen.getByText(/Decrease Contributions 25%/i)).toBeInTheDocument();
    });
  });

  describe('Baseline Integration', () => {
    it('calculates relative adjustments based on baseline', () => {
      const customBaseline = {
        ...mockBaseline,
        monthlyContribution: 5000,
      };

      const onScenarioSelect = vi.fn();
      render(<QuickWhatIf {...defaultProps} baseline={customBaseline} onScenarioSelect={onScenarioSelect} />);

      const increaseCard = screen.getByText(/Increase Contributions 50%/i).closest('button');
      fireEvent.click(increaseCard!);

      // Should show $7,500 (50% increase from $5,000)
      expect(screen.getByText(/\$7,500/)).toBeInTheDocument();
    });

    it('updates scenario descriptions with baseline values', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Should show current baseline values in descriptions
      expect(screen.getByText(/65/)).toBeInTheDocument(); // Current retirement age
      expect(screen.getByText(/\$2,000/)).toBeInTheDocument(); // Current contribution
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Should have heading
      const heading = screen.getByRole('heading', { name: /Quick What-If/i });
      expect(heading).toBeInTheDocument();

      // All scenarios should be buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has descriptive button labels', () => {
      render(<QuickWhatIf {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing baseline values', () => {
      const incompleteBaseline = {
        monthlyContribution: 2000,
      };

      render(<QuickWhatIf {...defaultProps} baseline={incompleteBaseline as any} />);

      // Should still render without crashing
      expect(screen.getByText(/Quick What-If/i)).toBeInTheDocument();
    });

    it('handles zero contribution baseline', () => {
      const zeroBaseline = {
        ...mockBaseline,
        monthlyContribution: 0,
      };

      render(<QuickWhatIf {...defaultProps} baseline={zeroBaseline} />);

      // Should handle gracefully
      expect(screen.getByText(/Increase Contributions/i)).toBeInTheDocument();
    });
  });

  describe('Multiple Selections', () => {
    it('allows selecting different scenarios sequentially', async () => {
      const onScenarioSelect = vi.fn();
      render(<QuickWhatIf {...defaultProps} onScenarioSelect={onScenarioSelect} />);

      // Select first scenario
      const retireEarlyCard = screen.getByText(/Retire 5 Years Earlier/i).closest('button');
      fireEvent.click(retireEarlyCard!);

      await waitFor(() => {
        expect(onScenarioSelect).toHaveBeenCalledTimes(1);
      });

      // Select second scenario
      const crashCard = screen.getByText(/Market Crash/i).closest('button');
      fireEvent.click(crashCard!);

      await waitFor(() => {
        expect(onScenarioSelect).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Scenario Details', () => {
    it('shows expected impact for each scenario', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Market crash should show negative impact
      const crashCard = screen.getByText(/Market Crash/i).closest('div');
      expect(crashCard).toHaveTextContent(/20% drop/i);
    });

    it('displays time adjustments clearly', () => {
      render(<QuickWhatIf {...defaultProps} />);

      // Retirement age scenarios
      expect(screen.getByText(/-5 years/i)).toBeInTheDocument();
    });
  });
});
