/**
 * Tests for ScenarioManager Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScenarioManager } from '../ScenarioManager';
import * as api from '../../../services/goalScenariosApi';
import type { GoalScenario } from '../../../types/goalScenarios';

vi.mock('../../../services/goalScenariosApi');

describe('ScenarioManager', () => {
  const mockScenarios: GoalScenario[] = [
    {
      id: 'scenario-1',
      goal_id: 'goal-123',
      name: 'Conservative Approach',
      description: 'Low risk strategy',
      monthly_contribution: 1000,
      target_amount: 500000,
      target_date: '2050-01-01',
      expected_return: 0.05,
      projected_value: 480000,
      success_probability: 0.92,
      years_to_goal: 25,
      total_contributions: 300000,
      investment_growth: 180000,
      funding_level: 96,
      risk_level: 'conservative',
      asset_allocation: { us_stocks: 0.4, bonds: 0.6 },
      created_at: '2025-01-01T00:00:00',
    },
    {
      id: 'scenario-2',
      goal_id: 'goal-123',
      name: 'Moderate Growth',
      description: 'Balanced strategy',
      monthly_contribution: 1000,
      target_amount: 500000,
      target_date: '2050-01-01',
      expected_return: 0.07,
      projected_value: 520000,
      success_probability: 0.85,
      years_to_goal: 25,
      total_contributions: 300000,
      investment_growth: 220000,
      funding_level: 104,
      risk_level: 'moderate',
      asset_allocation: { us_stocks: 0.6, bonds: 0.4 },
      created_at: '2025-01-02T00:00:00',
    },
    {
      id: 'scenario-3',
      goal_id: 'goal-123',
      name: 'Aggressive Growth',
      description: 'High risk strategy',
      monthly_contribution: 1000,
      target_amount: 500000,
      target_date: '2050-01-01',
      expected_return: 0.09,
      projected_value: 580000,
      success_probability: 0.78,
      years_to_goal: 25,
      total_contributions: 300000,
      investment_growth: 280000,
      funding_level: 116,
      risk_level: 'aggressive',
      asset_allocation: { us_stocks: 0.8, bonds: 0.2 },
      created_at: '2025-01-03T00:00:00',
    },
  ];

  const mockProps = {
    goalId: 'goal-123',
    onSelectScenario: vi.fn(),
    onCreateNew: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('should fetch scenarios on mount', async () => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(api.getScenarios).toHaveBeenCalledWith('goal-123');
      });
    });

    it('should display loading state initially', () => {
      vi.mocked(api.getScenarios).mockImplementation(() => new Promise(() => {}));

      render(<ScenarioManager {...mockProps} />);

      expect(screen.getByText('Loading scenarios...')).toBeInTheDocument();
    });

    it('should display scenarios after loading', async () => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
        expect(screen.getByText('Moderate Growth')).toBeInTheDocument();
        expect(screen.getByText('Aggressive Growth')).toBeInTheDocument();
      });
    });

    it('should display error if loading fails', async () => {
      vi.mocked(api.getScenarios).mockRejectedValue(new Error('Load failed'));

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Load failed/i)).toBeInTheDocument();
      });
    });

    it('should show scenario count in header', async () => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('3 saved scenarios')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);
    });

    it('should filter scenarios by search query', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search scenarios...');
      fireEvent.change(searchInput, { target: { value: 'conservative' } });

      expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      expect(screen.queryByText('Moderate Growth')).not.toBeInTheDocument();
    });

    it('should filter by risk level', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getAllByText(/conservative|moderate|aggressive/i).length).toBeGreaterThan(0);
      });

      const riskFilter = screen.getByDisplayValue('All Risk Levels');
      fireEvent.change(riskFilter, { target: { value: 'conservative' } });

      expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      expect(screen.queryByText('Moderate Growth')).not.toBeInTheDocument();
    });

    it('should sort by success probability', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('Date Created');
      fireEvent.change(sortSelect, { target: { value: 'success' } });

      const scenarios = screen.getAllByText(/Approach|Growth/);
      // Conservative (92%) should be first
      expect(scenarios[0].textContent).toContain('Conservative');
    });

    it('should show "no results" message when filters return empty', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search scenarios...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No scenarios match your filters')).toBeInTheDocument();
    });
  });

  describe('Scenario Selection', () => {
    beforeEach(() => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);
    });

    it('should allow selecting individual scenarios', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    it('should show bulk delete button when scenarios are selected', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      expect(screen.getByText('Delete (2)')).toBeInTheDocument();
    });
  });

  describe('Scenario Actions', () => {
    beforeEach(() => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);
      vi.mocked(api.deleteScenario).mockResolvedValue();
    });

    it('should call onSelectScenario when Load button is clicked', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const loadButtons = screen.getAllByRole('button', { name: 'Load' });
      fireEvent.click(loadButtons[0]);

      expect(mockProps.onSelectScenario).toHaveBeenCalledWith(mockScenarios[0]);
    });

    it('should delete scenario when confirmed', async () => {
      global.confirm = vi.fn(() => true);

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(api.deleteScenario).toHaveBeenCalledWith('goal-123', 'scenario-1');
      }, { timeout: 2000 });
    });

    it('should not delete if user cancels confirmation', async () => {
      global.confirm = vi.fn(() => false);

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(api.deleteScenario).not.toHaveBeenCalled();
    });

    it('should handle bulk delete', async () => {
      global.confirm = vi.fn(() => true);

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      const bulkDeleteButton = screen.getByText('Delete (2)');
      fireEvent.click(bulkDeleteButton);

      await waitFor(() => {
        expect(api.deleteScenario).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Create New Scenario', () => {
    beforeEach(() => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);
    });

    it('should call onCreateNew when button is clicked', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      const createButton = screen.getByText('+ New Scenario');
      fireEvent.click(createButton);

      expect(mockProps.onCreateNew).toHaveBeenCalledOnce();
    });

    it('should show create button when no scenarios exist', async () => {
      vi.mocked(api.getScenarios).mockResolvedValue([]);

      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Scenarios Found')).toBeInTheDocument();
      });

      expect(screen.getByText('Create Scenario')).toBeInTheDocument();
    });
  });

  describe('Close Modal', () => {
    it('should call onClose when close button is clicked', async () => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);

      render(<ScenarioManager {...mockProps} />);

      // Wait for scenarios to load first
      await waitFor(() => {
        expect(screen.getByText('Conservative Approach')).toBeInTheDocument();
      });

      // Find close button by SVG pattern (X icon in header)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && svg.getAttribute('viewBox') === '0 0 24 24';
      });

      expect(closeButton).toBeDefined();
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockProps.onClose).toHaveBeenCalledOnce();
      }
    });
  });

  describe('Scenario Display', () => {
    beforeEach(() => {
      vi.mocked(api.getScenarios).mockResolvedValue(mockScenarios);
    });

    it('should display scenario metrics correctly', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('92.0%')).toBeInTheDocument(); // success probability
        expect(screen.getByText('$1,000')).toBeInTheDocument(); // monthly contribution
        expect(screen.getByText('$480,000')).toBeInTheDocument(); // projected value
      }, { timeout: 2000 });
    });

    it('should show risk level badges', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        const badges = screen.getAllByText(/conservative|moderate|aggressive/);
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display creation dates', async () => {
      render(<ScenarioManager {...mockProps} />);

      await waitFor(() => {
        // The formatDate function returns format like "Jan 1, 2025"
        expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
