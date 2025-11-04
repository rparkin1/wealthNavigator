/**
 * Tests for ScenarioComparisonTable Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScenarioComparisonTable } from '../ScenarioComparisonTable';
import type { GoalScenario } from '../../../types/goalScenarios';

describe('ScenarioComparisonTable', () => {
  const mockScenarios: GoalScenario[] = [
    {
      id: 'scenario-1',
      goal_id: 'goal-123',
      name: 'Baseline',
      monthly_contribution: 1000,
      target_amount: 500000,
      target_date: '2050-01-01',
      expected_return: 0.07,
      projected_value: 500000,
      success_probability: 0.85,
      years_to_goal: 25,
      total_contributions: 300000,
      investment_growth: 200000,
      funding_level: 100,
      risk_level: 'moderate',
      asset_allocation: {
        us_stocks: 0.36,
        international_stocks: 0.18,
        bonds: 0.28,
        cash: 0.18,
      },
      created_at: '2025-01-01T00:00:00',
    },
    {
      id: 'scenario-2',
      goal_id: 'goal-123',
      name: 'Conservative',
      monthly_contribution: 1200,
      target_amount: 500000,
      target_date: '2050-01-01',
      expected_return: 0.05,
      projected_value: 480000,
      success_probability: 0.92,
      years_to_goal: 25,
      total_contributions: 360000,
      investment_growth: 120000,
      funding_level: 96,
      risk_level: 'conservative',
      asset_allocation: {
        us_stocks: 0.24,
        international_stocks: 0.12,
        bonds: 0.42,
        cash: 0.22,
      },
      created_at: '2025-01-02T00:00:00',
    },
    {
      id: 'scenario-3',
      goal_id: 'goal-123',
      name: 'Aggressive',
      monthly_contribution: 800,
      target_amount: 500000,
      target_date: '2050-01-01',
      expected_return: 0.09,
      projected_value: 550000,
      success_probability: 0.78,
      years_to_goal: 25,
      total_contributions: 240000,
      investment_growth: 310000,
      funding_level: 110,
      risk_level: 'aggressive',
      asset_allocation: {
        us_stocks: 0.48,
        international_stocks: 0.24,
        bonds: 0.14,
        cash: 0.14,
      },
      created_at: '2025-01-03T00:00:00',
    },
  ];

  describe('Empty State', () => {
    it('should render empty message when no scenarios provided', () => {
      render(<ScenarioComparisonTable scenarios={[]} />);

      expect(screen.getByText('No scenarios to compare')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('should display title and baseline scenario', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('Detailed Scenario Comparison')).toBeInTheDocument();
      expect(screen.getByText(/Baseline: Baseline/)).toBeInTheDocument();
    });

    it('should show scenario count', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText(/Comparing 3 scenarios/)).toBeInTheDocument();
    });

    it('should show export CSV button if handler provided', () => {
      const onExport = vi.fn();
      render(<ScenarioComparisonTable scenarios={mockScenarios} onExportCSV={onExport} />);

      const exportButton = screen.getByText('Export CSV');
      expect(exportButton).toBeInTheDocument();

      fireEvent.click(exportButton);
      expect(onExport).toHaveBeenCalledOnce();
    });

    it('should not show export button if handler not provided', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });
  });

  describe('Table Header', () => {
    it('should show all scenario names in columns', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('Baseline')).toBeInTheDocument();
      expect(screen.getByText('Conservative')).toBeInTheDocument();
      expect(screen.getByText('Aggressive')).toBeInTheDocument();
    });

    it('should display risk level badges', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      const badges = screen.getAllByText(/moderate|conservative|aggressive/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should mark baseline scenario', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('Baseline')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display all key metrics', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('Success Probability')).toBeInTheDocument();
      expect(screen.getByText('Projected Value')).toBeInTheDocument();
      expect(screen.getByText('Monthly Contribution')).toBeInTheDocument();
      expect(screen.getByText('Total Contributions')).toBeInTheDocument();
      expect(screen.getByText('Investment Growth')).toBeInTheDocument();
      expect(screen.getByText('Funding Level')).toBeInTheDocument();
      expect(screen.getByText('Expected Return')).toBeInTheDocument();
      expect(screen.getByText('Years to Goal')).toBeInTheDocument();
    });

    it('should format currency values correctly', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('$500,000')).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('should format percentage values correctly', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('85.0%')).toBeInTheDocument();
      expect(screen.getByText('7.0%')).toBeInTheDocument();
    });

    it('should show years to goal with units', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('25.0 years')).toBeInTheDocument();
    });
  });

  describe('Delta Calculations', () => {
    it('should show positive deltas in green for metrics where higher is better', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      // Aggressive scenario has higher projected value ($550k vs $500k baseline)
      const positiveDeltas = screen.getAllByText(/\+/);
      expect(positiveDeltas.length).toBeGreaterThan(0);
    });

    it('should show negative deltas in red for metrics where higher is better', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      // Conservative has lower projected value
      const negativeDeltas = screen.getAllByText(/-/);
      expect(negativeDeltas.length).toBeGreaterThan(0);
    });

    it('should calculate percentage change correctly', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      // Aggressive has +10% funding level vs baseline (110 vs 100)
      expect(screen.getByText(/\+10\.0%/)).toBeInTheDocument();
    });

    it('should not show deltas for baseline scenario', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} baselineScenarioId="scenario-1" />);

      // Baseline column should have em-dash for deltas
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe('Asset Allocation Section', () => {
    it('should show asset allocation header', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('Asset Allocation')).toBeInTheDocument();
    });

    it('should display all asset classes', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('us stocks')).toBeInTheDocument();
      expect(screen.getByText('international stocks')).toBeInTheDocument();
      expect(screen.getByText('bonds')).toBeInTheDocument();
      expect(screen.getByText('cash')).toBeInTheDocument();
    });

    it('should show allocation percentages', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('36.0%')).toBeInTheDocument(); // Baseline US stocks
      expect(screen.getByText('28.0%')).toBeInTheDocument(); // Baseline bonds
    });

    it('should skip asset classes with zero allocation', () => {
      const scenariosWithZero = [
        {
          ...mockScenarios[0],
          asset_allocation: {
            us_stocks: 0.5,
            bonds: 0.5,
            commodities: 0,
          },
        },
      ];

      render(<ScenarioComparisonTable scenarios={scenariosWithZero} />);

      expect(screen.queryByText('commodities')).not.toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('should show comparison legend', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      expect(screen.getByText('Legend:')).toBeInTheDocument();
      expect(screen.getByText(/Green.*Better than baseline/)).toBeInTheDocument();
      expect(screen.getByText(/Red.*Worse than baseline/)).toBeInTheDocument();
      expect(screen.getByText(/Baseline.*no comparison/)).toBeInTheDocument();
    });
  });

  describe('Custom Baseline', () => {
    it('should use specified baseline scenario', () => {
      render(
        <ScenarioComparisonTable
          scenarios={mockScenarios}
          baselineScenarioId="scenario-2"
        />
      );

      expect(screen.getByText(/Baseline: Conservative/)).toBeInTheDocument();
    });

    it('should fall back to first scenario if baseline not found', () => {
      render(
        <ScenarioComparisonTable
          scenarios={mockScenarios}
          baselineScenarioId="nonexistent"
        />
      );

      expect(screen.getByText(/Baseline: Baseline/)).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should apply correct background colors to risk badges', () => {
      const { container } = render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      const conservativeBadge = container.querySelector('.bg-blue-100');
      const moderateBadge = container.querySelector('.bg-yellow-100');
      const aggressiveBadge = container.querySelector('.bg-red-100');

      expect(conservativeBadge).toBeInTheDocument();
      expect(moderateBadge).toBeInTheDocument();
      expect(aggressiveBadge).toBeInTheDocument();
    });

    it('should alternate row backgrounds', () => {
      const { container } = render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      const whiteRows = container.querySelectorAll('.bg-white');
      const grayRows = container.querySelectorAll('.bg-gray-50');

      expect(whiteRows.length).toBeGreaterThan(0);
      expect(grayRows.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should use semantic table markup', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      const table = screen.getByRole('table', { hidden: true });
      expect(table).toBeInTheDocument();
    });

    it('should have proper table headers', () => {
      render(<ScenarioComparisonTable scenarios={mockScenarios} />);

      const headers = screen.getAllByRole('columnheader', { hidden: true });
      expect(headers.length).toBeGreaterThan(0);
    });
  });
});
