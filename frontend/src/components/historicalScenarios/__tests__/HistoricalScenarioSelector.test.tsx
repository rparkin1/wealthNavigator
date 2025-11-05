/**
 * HistoricalScenarioSelector Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HistoricalScenarioSelector } from '../HistoricalScenarioSelector';
import * as historicalScenariosApi from '../../../services/historicalScenariosApi';
import type { ScenarioListItem } from '../../../types/historicalScenarios';

vi.mock('../../../services/historicalScenariosApi');

const mockScenarios: ScenarioListItem[] = [
  {
    id: '2008_financial_crisis',
    name: '2008 Financial Crisis',
    period: 'financial_crisis',
    description: 'The worst financial crisis since the Great Depression',
    start_date: '2007-10-01',
    end_date: '2009-03-31',
    duration_months: 18,
    max_drawdown_stocks: -0.56,
    volatility_stocks: 0.35,
    recovery_months: 49,
    is_featured: true,
    usage_count: 150,
  },
  {
    id: 'covid_crash_2020',
    name: 'COVID-19 Market Crash',
    period: 'covid_crash',
    description: 'Fastest bear market in history',
    start_date: '2020-02-01',
    end_date: '2020-08-31',
    duration_months: 7,
    max_drawdown_stocks: -0.34,
    volatility_stocks: 0.40,
    recovery_months: 5,
    is_featured: true,
    usage_count: 100,
  },
];

describe('HistoricalScenarioSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(historicalScenariosApi.getAllScenarios).mockResolvedValue(mockScenarios);

    // Mock helper functions that are used in the component
    vi.mocked(historicalScenariosApi.getRiskLevelColor).mockReturnValue({
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
    });

    vi.mocked(historicalScenariosApi.getVolatilityLabel).mockReturnValue('Moderate');

    vi.mocked(historicalScenariosApi.getDrawdownSeverity).mockReturnValue({
      label: 'Severe',
      color: 'red',
    });
  });

  describe('Rendering', () => {
    it('renders loading state initially', () => {
      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);
      expect(screen.getByText(/loading scenarios/i)).toBeInTheDocument();
    });

    it('renders scenarios after loading', async () => {
      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
        expect(screen.getByText('COVID-19 Market Crash')).toBeInTheDocument();
      });
    });

    it('displays portfolio information', async () => {
      render(
        <HistoricalScenarioSelector
          goalId="goal-123"
          initialValue={100000}
          monthlyContribution={1000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$100,000')).toBeInTheDocument();
        expect(screen.getByText('$1,000')).toBeInTheDocument();
      });
    });

    it('renders error state on API failure', async () => {
      vi.mocked(historicalScenariosApi.getAllScenarios).mockRejectedValue(new Error('API Error'));

      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters featured scenarios by default', async () => {
      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(historicalScenariosApi.getAllScenarios).toHaveBeenCalledWith({
          featuredOnly: true,
          activeOnly: true,
        });
      });
    });

    it('shows all scenarios when featured filter is unchecked', async () => {
      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /featured only/i });
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(historicalScenariosApi.getAllScenarios).toHaveBeenCalledWith({
          featuredOnly: false,
          activeOnly: true,
        });
      });
    });
  });

  describe('Scenario Application', () => {
    it('applies scenario when clicked', async () => {
      const mockResult = {
        scenario_id: '2008_financial_crisis',
        scenario_name: '2008 Financial Crisis',
        initial_value: 100000,
        final_value: 44000,
        total_return: -0.56,
        max_drawdown: -0.56,
        max_value: 100000,
        min_value: 44000,
        portfolio_trajectory: [
          { period: '2007-10', value: 100000 },
          { period: '2009-03', value: 44000 },
        ],
        duration_months: 18,
      };

      vi.mocked(historicalScenariosApi.applyScenario).mockResolvedValue(mockResult);

      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const scenarioCard = screen.getByText('2008 Financial Crisis').closest('button');
      fireEvent.click(scenarioCard!);

      await waitFor(() => {
        expect(historicalScenariosApi.applyScenario).toHaveBeenCalledWith(
          '2008_financial_crisis',
          {
            goal_id: 'goal-123',
            initial_portfolio_value: 100000,
            monthly_contribution: 0,
          }
        );
      });

      // Verify results are displayed
      await waitFor(() => {
        expect(screen.getByText(/Final Value/i)).toBeInTheDocument();
        expect(screen.getByText('$44,000')).toBeInTheDocument();
      });
    });

    it('calls onScenarioApplied callback', async () => {
      const onScenarioApplied = vi.fn();
      const mockResult = {
        scenario_id: '2008_financial_crisis',
        scenario_name: '2008 Financial Crisis',
        initial_value: 100000,
        final_value: 44000,
        total_return: -0.56,
        max_drawdown: -0.56,
        max_value: 100000,
        min_value: 44000,
        portfolio_trajectory: [],
        duration_months: 18,
      };

      vi.mocked(historicalScenariosApi.applyScenario).mockResolvedValue(mockResult);

      render(
        <HistoricalScenarioSelector
          goalId="goal-123"
          initialValue={100000}
          onScenarioApplied={onScenarioApplied}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const scenarioCard = screen.getByText('2008 Financial Crisis').closest('button');
      fireEvent.click(scenarioCard!);

      await waitFor(() => {
        expect(onScenarioApplied).toHaveBeenCalledWith(mockResult);
      });
    });

    it('displays error when scenario application fails', async () => {
      vi.mocked(historicalScenariosApi.applyScenario).mockRejectedValue(
        new Error('Failed to apply')
      );

      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const scenarioCard = screen.getByText('2008 Financial Crisis').closest('button');
      fireEvent.click(scenarioCard!);

      await waitFor(() => {
        expect(screen.getByText(/Failed to apply/i)).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    it('shows trajectory chart', async () => {
      const mockResult = {
        scenario_id: '2008_financial_crisis',
        scenario_name: '2008 Financial Crisis',
        initial_value: 100000,
        final_value: 44000,
        total_return: -0.56,
        max_drawdown: -0.56,
        max_value: 100000,
        min_value: 44000,
        portfolio_trajectory: [
          { period: '2007-10', value: 100000 },
          { period: '2008-03', value: 80000 },
          { period: '2009-03', value: 44000 },
        ],
        duration_months: 18,
      };

      vi.mocked(historicalScenariosApi.applyScenario).mockResolvedValue(mockResult);

      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const scenarioCard = screen.getByText('2008 Financial Crisis').closest('button');
      fireEvent.click(scenarioCard!);

      await waitFor(() => {
        expect(screen.getByText(/Portfolio Trajectory/i)).toBeInTheDocument();
      });
    });

    it('displays key events if present', async () => {
      const mockResult = {
        scenario_id: '2008_financial_crisis',
        scenario_name: '2008 Financial Crisis',
        initial_value: 100000,
        final_value: 44000,
        total_return: -0.56,
        max_drawdown: -0.56,
        max_value: 100000,
        min_value: 44000,
        portfolio_trajectory: [],
        key_events: [
          {
            date: '2008-09-15',
            event: 'Lehman Brothers bankruptcy',
            impact: 'Market panic',
          },
        ],
        duration_months: 18,
      };

      vi.mocked(historicalScenariosApi.applyScenario).mockResolvedValue(mockResult);

      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const scenarioCard = screen.getByText('2008 Financial Crisis').closest('button');
      fireEvent.click(scenarioCard!);

      await waitFor(() => {
        expect(screen.getByText(/Key Events/i)).toBeInTheDocument();
        expect(screen.getByText('Lehman Brothers bankruptcy')).toBeInTheDocument();
      });
    });

    it('allows navigation back to scenario list', async () => {
      const mockResult = {
        scenario_id: '2008_financial_crisis',
        scenario_name: '2008 Financial Crisis',
        initial_value: 100000,
        final_value: 44000,
        total_return: -0.56,
        max_drawdown: -0.56,
        max_value: 100000,
        min_value: 44000,
        portfolio_trajectory: [],
        duration_months: 18,
      };

      vi.mocked(historicalScenariosApi.applyScenario).mockResolvedValue(mockResult);

      render(<HistoricalScenarioSelector goalId="goal-123" initialValue={100000} />);

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const scenarioCard = screen.getByText('2008 Financial Crisis').closest('button');
      fireEvent.click(scenarioCard!);

      await waitFor(() => {
        expect(screen.getByText(/Final Value/i)).toBeInTheDocument();
      });

      const backButton = screen.getByText('← Back');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Historical Market Scenarios')).toBeInTheDocument();
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();

      render(
        <HistoricalScenarioSelector
          goalId="goal-123"
          initialValue={100000}
          onClose={onClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2008 Financial Crisis')).toBeInTheDocument();
      });

      const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
      fireEvent.click(closeButton!);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
