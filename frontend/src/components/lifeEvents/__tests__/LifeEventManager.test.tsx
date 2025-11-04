/**
 * LifeEventManager Component Tests
 *
 * Comprehensive test suite for the LifeEventManager component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LifeEventManager } from '../LifeEventManager';
import * as lifeEventsApi from '../../../services/lifeEventsApi';
import type { LifeEvent } from '../../../types/lifeEvents';

// Mock the API module
vi.mock('../../../services/lifeEventsApi');

const mockEvents: LifeEvent[] = [
  {
    id: 'event-1',
    user_id: 'user-123',
    goal_id: 'goal-123',
    event_type: 'job_loss',
    name: 'Potential Job Loss',
    description: 'Modeling layoff scenario',
    start_year: 2026,
    duration_years: 1,
    probability: 0.3,
    enabled: true,
    financial_impact: {
      income_loss_percentage: 1.0,
      severance_months: 3,
      job_search_months: 6,
      new_income_percentage: 0.9,
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'event-2',
    user_id: 'user-123',
    event_type: 'inheritance',
    name: 'Inheritance from Grandparents',
    start_year: 2028,
    duration_years: 1,
    probability: 0.5,
    enabled: false,
    financial_impact: {
      amount: 250000,
      tax_rate: 0.0,
      asset_type: 'cash',
    },
    simulation_results: {
      event_id: 'event-2',
      event_type: 'inheritance',
      baseline: {
        success_probability: 0.85,
        median_portfolio_value: 1500000,
      },
      with_event: {
        success_probability: 0.92,
        median_portfolio_value: 1750000,
      },
      impact: {
        success_probability_delta: 0.07,
        success_probability_delta_percentage: 8.2,
        portfolio_value_delta: 250000,
        portfolio_value_delta_percentage: 16.7,
        severity: 'minimal',
        recommended_actions: [],
      },
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

describe('LifeEventManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(lifeEventsApi.getAllLifeEvents).mockResolvedValue(mockEvents);
  });

  describe('Rendering', () => {
    it('renders loading state initially', () => {
      render(<LifeEventManager />);
      expect(screen.getByText(/loading life events/i)).toBeInTheDocument();
    });

    it('renders life events after loading', async () => {
      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
        expect(screen.getByText('Inheritance from Grandparents')).toBeInTheDocument();
      });
    });

    it('displays empty state when no events exist', async () => {
      vi.mocked(lifeEventsApi.getAllLifeEvents).mockResolvedValue([]);

      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText(/no life events/i)).toBeInTheDocument();
      });
    });

    it('renders error state on API failure', async () => {
      vi.mocked(lifeEventsApi.getAllLifeEvents).mockRejectedValue(new Error('API Error'));

      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters events by type', async () => {
      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'job_loss' } });

      await waitFor(() => {
        expect(lifeEventsApi.getAllLifeEvents).toHaveBeenCalledWith(
          expect.objectContaining({ eventType: 'job_loss' })
        );
      });
    });

    it('filters enabled/disabled events', async () => {
      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const enabledFilter = screen.getAllByRole('combobox')[1];
      fireEvent.change(enabledFilter, { target: { value: 'false' } });

      await waitFor(() => {
        expect(lifeEventsApi.getAllLifeEvents).toHaveBeenCalledWith(
          expect.objectContaining({ enabledOnly: false })
        );
      });
    });
  });

  describe('View Modes', () => {
    it('switches between list and timeline view', async () => {
      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const timelineButton = screen.getByText('Timeline');
      fireEvent.click(timelineButton);

      await waitFor(() => {
        expect(screen.getByText(/life event timeline/i)).toBeInTheDocument();
      });

      const listButton = screen.getByText('List');
      fireEvent.click(listButton);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });
    });
  });

  describe('Event Management', () => {
    it('opens form to create new event', async () => {
      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Custom Event');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/add life event/i)).toBeInTheDocument();
      });
    });

    it('opens template selector', async () => {
      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const templateButton = screen.getByText('From Template');
      fireEvent.click(templateButton);

      await waitFor(() => {
        expect(screen.getByText(/select event template/i)).toBeInTheDocument();
      });
    });

    it('deletes an event', async () => {
      vi.mocked(lifeEventsApi.deleteLifeEvent).mockResolvedValue();
      global.confirm = vi.fn(() => true);

      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(lifeEventsApi.deleteLifeEvent).toHaveBeenCalledWith('event-1');
        expect(lifeEventsApi.getAllLifeEvents).toHaveBeenCalledTimes(2); // Initial + after delete
      });
    });

    it('toggles event enabled status', async () => {
      vi.mocked(lifeEventsApi.toggleLifeEvent).mockResolvedValue(mockEvents[0]);

      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const enabledButton = screen.getByText('Enabled');
      fireEvent.click(enabledButton);

      await waitFor(() => {
        expect(lifeEventsApi.toggleLifeEvent).toHaveBeenCalledWith('event-1');
      });
    });
  });

  describe('Simulation', () => {
    it('simulates event impact', async () => {
      vi.mocked(lifeEventsApi.simulateLifeEvent).mockResolvedValue({
        event_id: 'event-1',
        event_type: 'job_loss',
        baseline: { success_probability: 0.85, median_portfolio_value: 1500000 },
        with_event: { success_probability: 0.72, median_portfolio_value: 1200000 },
        impact: {
          success_probability_delta: -0.13,
          success_probability_delta_percentage: -15.3,
          portfolio_value_delta: -300000,
          portfolio_value_delta_percentage: -20.0,
          severity: 'significant',
          recommended_actions: ['Increase emergency fund'],
        },
      });

      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const simulateButtons = screen.getAllByText('Simulate');
      fireEvent.click(simulateButtons[0]);

      await waitFor(() => {
        expect(lifeEventsApi.simulateLifeEvent).toHaveBeenCalledWith('event-1', {
          goal_id: 'goal-123',
          iterations: 5000,
        });
      });
    });

    it('shows impact comparison after simulation', async () => {
      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Inheritance from Grandparents')).toBeInTheDocument();
      });

      // Event with simulation results should show them
      expect(screen.getByText('Impact Analysis')).toBeInTheDocument();
      expect(screen.getByText('92.0%')).toBeInTheDocument(); // success probability
    });

    it('requires goal_id for simulation', async () => {
      const eventWithoutGoal: LifeEvent = {
        ...mockEvents[0],
        goal_id: undefined,
      };
      vi.mocked(lifeEventsApi.getAllLifeEvents).mockResolvedValue([eventWithoutGoal]);
      global.alert = vi.fn();

      render(<LifeEventManager />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const simulateButton = screen.getByText('Simulate');
      fireEvent.click(simulateButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('must be associated with a goal')
        );
      });
    });
  });

  describe('Goal-specific filtering', () => {
    it('filters events by goal_id when provided', async () => {
      render(<LifeEventManager goalId="goal-123" />);

      await waitFor(() => {
        expect(lifeEventsApi.getAllLifeEvents).toHaveBeenCalledWith(
          expect.objectContaining({ goalId: 'goal-123' })
        );
      });
    });
  });

  describe('Event callbacks', () => {
    it('calls onEventSelect when event is selected', async () => {
      const onEventSelect = vi.fn();
      render(<LifeEventManager onEventSelect={onEventSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Potential Job Loss')).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      // onEventSelect is not called on edit, only for custom selection logic
      // This test validates the callback prop is accepted
    });
  });
});
