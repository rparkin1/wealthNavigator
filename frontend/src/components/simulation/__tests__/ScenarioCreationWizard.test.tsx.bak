/**
 * Tests for ScenarioCreationWizard Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScenarioCreationWizard } from '../ScenarioCreationWizard';
import * as api from '../../../services/goalScenariosApi';

vi.mock('../../../services/goalScenariosApi');

describe('ScenarioCreationWizard', () => {
  const mockProps = {
    goalId: 'goal-123',
    goalTitle: 'Retirement Savings',
    currentMonthlyContribution: 1000,
    currentTargetAmount: 500000,
    currentTargetDate: '2050-01-01',
    onScenarioCreated: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render method selection step initially', () => {
    render(<ScenarioCreationWizard {...mockProps} />);

    expect(screen.getByText('Choose Creation Method')).toBeInTheDocument();
    expect(screen.getByText('Quick Setup')).toBeInTheDocument();
    expect(screen.getByText('Custom Setup')).toBeInTheDocument();
  });

  it('should show progress indicator with 4 steps', () => {
    render(<ScenarioCreationWizard {...mockProps} />);

    expect(screen.getByText('method')).toBeInTheDocument();
    expect(screen.getByText('basic')).toBeInTheDocument();
    expect(screen.getByText('risk')).toBeInTheDocument();
    expect(screen.getByText('review')).toBeInTheDocument();
  });

  it('should allow closing the wizard', () => {
    render(<ScenarioCreationWizard {...mockProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockProps.onCancel).toHaveBeenCalledOnce();
  });

  describe('Quick Setup Flow', () => {
    it('should fetch quick compare data when quick setup is selected', async () => {
      const mockQuickCompare = {
        goal_id: 'goal-123',
        goal_title: 'Retirement Savings',
        target_amount: 500000,
        years_to_goal: 25,
        scenarios: [
          {
            name: 'Conservative',
            risk_level: 'conservative' as const,
            monthly_contribution: 1350,
            expected_return: 0.05,
            description: 'Lower risk, steady growth',
          },
          {
            name: 'Moderate',
            risk_level: 'moderate' as const,
            monthly_contribution: 1125,
            expected_return: 0.07,
            description: 'Balanced risk and return',
          },
          {
            name: 'Aggressive',
            risk_level: 'aggressive' as const,
            monthly_contribution: 900,
            expected_return: 0.09,
            description: 'Higher risk, higher potential return',
          },
        ],
        recommendation: 'Moderate',
      };

      vi.mocked(api.quickCompareScenarios).mockResolvedValue(mockQuickCompare);

      render(<ScenarioCreationWizard {...mockProps} />);

      const quickButton = screen.getByText('Quick Setup');
      fireEvent.click(quickButton);

      await waitFor(() => {
        expect(api.quickCompareScenarios).toHaveBeenCalledWith('goal-123');
      });
    });

    it('should show risk selection after quick setup loads', async () => {
      const mockQuickCompare = {
        goal_id: 'goal-123',
        goal_title: 'Retirement Savings',
        target_amount: 500000,
        years_to_goal: 25,
        scenarios: [
          {
            name: 'Conservative',
            risk_level: 'conservative' as const,
            monthly_contribution: 1350,
            expected_return: 0.05,
            description: 'Lower risk, steady growth',
          },
        ],
        recommendation: 'Moderate',
      };

      vi.mocked(api.quickCompareScenarios).mockResolvedValue(mockQuickCompare);

      render(<ScenarioCreationWizard {...mockProps} />);

      fireEvent.click(screen.getByText('Quick Setup'));

      await waitFor(() => {
        expect(screen.getByText('Select Risk Level')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(api.quickCompareScenarios).mockRejectedValue(new Error('API Error'));

      render(<ScenarioCreationWizard {...mockProps} />);

      fireEvent.click(screen.getByText('Quick Setup'));

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Manual Setup Flow', () => {
    it('should show basic info form when manual setup is selected', () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      fireEvent.click(screen.getByText('Custom Setup'));

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/Scenario Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Contribution/i)).toBeInTheDocument();
    });

    it('should validate required fields in basic info', () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      fireEvent.click(screen.getByText('Custom Setup'));

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(screen.getByText(/fill in all required fields/i)).toBeInTheDocument();
    });

    it('should allow navigation through wizard steps', () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      // Go to manual setup
      fireEvent.click(screen.getByText('Custom Setup'));

      // Fill in basic info
      fireEvent.change(screen.getByLabelText(/Scenario Name/i), {
        target: { value: 'My Scenario' },
      });
      fireEvent.change(screen.getByLabelText(/Monthly Contribution/i), {
        target: { value: '1500' },
      });

      // Go to next step
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByText('Select Risk Level')).toBeInTheDocument();

      // Go back
      fireEvent.click(screen.getByText('Back'));

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });
  });

  describe('Risk Level Selection', () => {
    it('should show all three risk levels', async () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      // Navigate to risk step via manual flow
      fireEvent.click(screen.getByText('Custom Setup'));

      fireEvent.change(screen.getByLabelText(/Scenario Name/i), {
        target: { value: 'Test Scenario' },
      });
      fireEvent.change(screen.getByLabelText(/Monthly Contribution/i), {
        target: { value: '1000' },
      });

      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByText('Conservative')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText('Aggressive')).toBeInTheDocument();
    });

    it('should advance to review when risk is selected', async () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      // Navigate to risk step
      fireEvent.click(screen.getByText('Custom Setup'));
      fireEvent.change(screen.getByLabelText(/Scenario Name/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Monthly Contribution/i), {
        target: { value: '1000' },
      });
      fireEvent.click(screen.getByText('Next'));

      // Select moderate risk
      const moderateButton = screen.getAllByText('Moderate')[0];
      fireEvent.click(moderateButton);

      await waitFor(() => {
        expect(screen.getByText('Review Scenario')).toBeInTheDocument();
      });
    });
  });

  describe('Review and Creation', () => {
    const setupToReview = async () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      // Navigate through wizard
      fireEvent.click(screen.getByText('Custom Setup'));

      fireEvent.change(screen.getByLabelText(/Scenario Name/i), {
        target: { value: 'Test Scenario' },
      });
      fireEvent.change(screen.getByLabelText(/Monthly Contribution/i), {
        target: { value: '1500' },
      });

      fireEvent.click(screen.getByText('Next'));

      const moderateButton = screen.getAllByText('Moderate')[0];
      fireEvent.click(moderateButton);
    };

    it('should display scenario details in review step', async () => {
      await setupToReview();

      await waitFor(() => {
        expect(screen.getByText('Test Scenario')).toBeInTheDocument();
        expect(screen.getByText('$1,500')).toBeInTheDocument();
        expect(screen.getByText('7.0%')).toBeInTheDocument();
      });
    });

    it('should create scenario when confirmed', async () => {
      const mockCreatedScenario = {
        id: 'scenario-456',
        goal_id: 'goal-123',
        name: 'Test Scenario',
        description: null,
        monthly_contribution: 1500,
        target_amount: 500000,
        target_date: '2050-01-01',
        expected_return: 0.07,
        projected_value: 550000,
        success_probability: 0.85,
        years_to_goal: 25,
        total_contributions: 450000,
        investment_growth: 100000,
        funding_level: 110,
        risk_level: 'moderate' as const,
        asset_allocation: {
          us_stocks: 0.36,
          international_stocks: 0.18,
          emerging_markets: 0.06,
          bonds: 0.28,
          tips: 0.08,
          cash: 0.04,
        },
        created_at: '2025-11-04T00:00:00',
      };

      vi.mocked(api.createScenario).mockResolvedValue(mockCreatedScenario);

      await setupToReview();

      await waitFor(() => {
        const createButton = screen.getByText('Create Scenario');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(api.createScenario).toHaveBeenCalledWith('goal-123', expect.objectContaining({
          name: 'Test Scenario',
          monthly_contribution: 1500,
          risk_level: 'moderate',
        }));
      });
    });

    it('should show success message after creation', async () => {
      const mockCreatedScenario = {
        id: 'scenario-456',
        goal_id: 'goal-123',
        name: 'Test Scenario',
        description: null,
        monthly_contribution: 1500,
        target_amount: 500000,
        target_date: '2050-01-01',
        expected_return: 0.07,
        projected_value: 550000,
        success_probability: 0.85,
        years_to_goal: 25,
        total_contributions: 450000,
        investment_growth: 100000,
        funding_level: 110,
        risk_level: 'moderate' as const,
        asset_allocation: {},
        created_at: '2025-11-04T00:00:00',
      };

      vi.mocked(api.createScenario).mockResolvedValue(mockCreatedScenario);

      await setupToReview();

      const createButton = await screen.findByText('Create Scenario');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Scenario Created!')).toBeInTheDocument();
      });
    });

    it('should call onScenarioCreated when finished', async () => {
      const mockCreatedScenario = {
        id: 'scenario-456',
        goal_id: 'goal-123',
        name: 'Test Scenario',
        monthly_contribution: 1500,
        target_amount: 500000,
        target_date: '2050-01-01',
        expected_return: 0.07,
        projected_value: 550000,
        success_probability: 0.85,
        years_to_goal: 25,
        total_contributions: 450000,
        investment_growth: 100000,
        funding_level: 110,
        risk_level: 'moderate' as const,
        asset_allocation: {},
        created_at: '2025-11-04T00:00:00',
      };

      vi.mocked(api.createScenario).mockResolvedValue(mockCreatedScenario);

      await setupToReview();

      const createButton = await screen.findByText('Create Scenario');
      fireEvent.click(createButton);

      await waitFor(() => {
        const viewButton = screen.getByText('View Scenario');
        fireEvent.click(viewButton);
      });

      expect(mockProps.onScenarioCreated).toHaveBeenCalledWith('scenario-456');
    });
  });

  describe('Error Handling', () => {
    it('should display error if scenario creation fails', async () => {
      vi.mocked(api.createScenario).mockRejectedValue(new Error('Creation failed'));

      render(<ScenarioCreationWizard {...mockProps} />);

      // Navigate to review
      fireEvent.click(screen.getByText('Custom Setup'));
      fireEvent.change(screen.getByLabelText(/Scenario Name/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Monthly Contribution/i), {
        target: { value: '1000' },
      });
      fireEvent.click(screen.getByText('Next'));

      const moderateButton = screen.getAllByText('Moderate')[0];
      fireEvent.click(moderateButton);

      await waitFor(async () => {
        const createButton = await screen.findByText('Create Scenario');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Creation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should allow keyboard navigation', () => {
      render(<ScenarioCreationWizard {...mockProps} />);

      const quickButton = screen.getByText('Quick Setup');
      quickButton.focus();
      expect(document.activeElement).toBe(quickButton);
    });
  });
});
