/**
 * AI Goal Assistant Tests
 *
 * Tests for the AI-powered goal creation interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIGoalAssistant } from '../AIGoalAssistant';
import * as aiGoalApi from '../../../services/aiGoalAssistanceApi';
import type { Goal } from '../../../types/goal';
import type { UserContext } from '../../../types/aiGoalAssistance';

// Mock the API
vi.mock('../../../services/aiGoalAssistanceApi');

describe('AIGoalAssistant', () => {
  const mockUserContext: UserContext = {
    age: 35,
    annual_income: 100000,
    location: 'San Francisco, CA',
    existing_goals: [],
  };

  const mockExistingGoals: Goal[] = [];

  const mockOnGoalCreated = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with natural language mode by default', () => {
    render(
      <AIGoalAssistant
        userId="test-user"
        existingGoals={mockExistingGoals}
        userContext={mockUserContext}
        onGoalCreated={mockOnGoalCreated}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('AI Goal Assistant')).toBeInTheDocument();
    expect(screen.getByText(/Natural Language/)).toBeInTheDocument();
  });

  it('switches between modes correctly', () => {
    render(
      <AIGoalAssistant
        userId="test-user"
        existingGoals={mockExistingGoals}
        userContext={mockUserContext}
        onGoalCreated={mockOnGoalCreated}
        onCancel={mockOnCancel}
      />
    );

    const templateButton = screen.getByRole('button', { name: /Templates/ });
    fireEvent.click(templateButton);

    expect(screen.getByText(/Choose a Goal Template/)).toBeInTheDocument();
  });

  it('parses natural language input successfully', async () => {
    const mockParsedGoal = {
      parsed_goal: {
        goal_category: 'retirement' as const,
        title: 'Retirement',
        priority: 'essential' as const,
        target_amount: 1000000,
        target_date: '2045-01-01',
        confidence: 0.9,
        clarifying_questions: [],
      },
      needs_clarification: false,
      confidence: 0.9,
    };

    vi.mocked(aiGoalApi.parseNaturalLanguageGoal).mockResolvedValue(mockParsedGoal);
    vi.mocked(aiGoalApi.generateRecommendations).mockResolvedValue({
      suggested_savings_rate: 0.15,
      monthly_contribution: 1250,
      alternative_scenarios: [],
      risk_guidance: 'Moderate risk',
      optimization_tips: ['Automate contributions'],
      trade_offs: [],
    });
    vi.mocked(aiGoalApi.checkGoalConflicts).mockResolvedValue({
      conflicts: [],
      has_conflicts: false,
      conflict_count: 0,
      highest_severity: 'none',
    });

    render(
      <AIGoalAssistant
        userId="test-user"
        existingGoals={mockExistingGoals}
        userContext={mockUserContext}
        onGoalCreated={mockOnGoalCreated}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText(/Example: I want to retire/);
    fireEvent.change(textarea, {
      target: { value: 'I want to retire at 60 with $80,000 per year' },
    });

    const submitButton = screen.getByRole('button', { name: /Analyze My Goal/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(aiGoalApi.parseNaturalLanguageGoal).toHaveBeenCalledWith({
        user_input: 'I want to retire at 60 with $80,000 per year',
        user_context: mockUserContext,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Your Goal Summary/)).toBeInTheDocument();
    });
  });

  it('handles clarifying questions flow', async () => {
    const mockParsedGoalWithQuestions = {
      parsed_goal: {
        goal_category: 'education' as const,
        title: 'Education',
        clarifying_questions: [
          {
            question: 'Which child is this for?',
            importance: 'critical' as const,
            suggested_options: ['First child', 'Second child'],
            help_text: 'Select the child',
          },
        ],
      },
      needs_clarification: true,
      confidence: 0.7,
    };

    vi.mocked(aiGoalApi.parseNaturalLanguageGoal).mockResolvedValue(mockParsedGoalWithQuestions);

    render(
      <AIGoalAssistant
        userId="test-user"
        existingGoals={mockExistingGoals}
        userContext={mockUserContext}
        onGoalCreated={mockOnGoalCreated}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText(/Example: I want to retire/);
    fireEvent.change(textarea, {
      target: { value: 'Save for college education' },
    });

    const submitButton = screen.getByRole('button', { name: /Analyze My Goal/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Help us refine your goal/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Which child is this for?/)).toBeInTheDocument();
  });

  it('displays conflicts when detected', async () => {
    const mockParsedGoal = {
      parsed_goal: {
        goal_category: 'home' as const,
        target_amount: 200000,
      },
      needs_clarification: false,
      confidence: 0.85,
    };

    const mockConflicts = {
      conflicts: [
        {
          conflict_type: 'resource' as const,
          severity: 'high' as const,
          description: 'Insufficient monthly income for all goals',
          affected_goals: ['retirement-goal'],
          suggestions: ['Extend timeline', 'Reduce target amount'],
        },
      ],
      has_conflicts: true,
      conflict_count: 1,
      highest_severity: 'high',
    };

    vi.mocked(aiGoalApi.parseNaturalLanguageGoal).mockResolvedValue(mockParsedGoal);
    vi.mocked(aiGoalApi.generateRecommendations).mockResolvedValue({
      suggested_savings_rate: 0.2,
      monthly_contribution: 1667,
      alternative_scenarios: [],
      risk_guidance: 'Moderate',
      optimization_tips: [],
      trade_offs: [],
    });
    vi.mocked(aiGoalApi.checkGoalConflicts).mockResolvedValue(mockConflicts);

    render(
      <AIGoalAssistant
        userId="test-user"
        existingGoals={mockExistingGoals}
        userContext={mockUserContext}
        onGoalCreated={mockOnGoalCreated}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText(/Example: I want to retire/);
    fireEvent.change(textarea, {
      target: { value: 'Buy a house with $200,000 down payment' },
    });

    const submitButton = screen.getByRole('button', { name: /Analyze My Goal/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Potential Conflicts/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Insufficient monthly income/)).toBeInTheDocument();
  });

  it('creates goal when confirmed', async () => {
    const mockParsedGoal = {
      parsed_goal: {
        goal_category: 'retirement' as const,
        title: 'Retirement',
        priority: 'essential' as const,
        target_amount: 1000000,
        target_date: '2045-01-01',
        confidence: 0.9,
      },
      needs_clarification: false,
      confidence: 0.9,
    };

    vi.mocked(aiGoalApi.parseNaturalLanguageGoal).mockResolvedValue(mockParsedGoal);
    vi.mocked(aiGoalApi.generateRecommendations).mockResolvedValue({
      suggested_savings_rate: 0.15,
      monthly_contribution: 1250,
      alternative_scenarios: [],
      risk_guidance: 'Moderate',
      optimization_tips: [],
      trade_offs: [],
    });
    vi.mocked(aiGoalApi.checkGoalConflicts).mockResolvedValue({
      conflicts: [],
      has_conflicts: false,
      conflict_count: 0,
      highest_severity: 'none',
    });

    render(
      <AIGoalAssistant
        userId="test-user"
        existingGoals={mockExistingGoals}
        userContext={mockUserContext}
        onGoalCreated={mockOnGoalCreated}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText(/Example: I want to retire/);
    fireEvent.change(textarea, {
      target: { value: 'I want to retire at 60' },
    });

    const submitButton = screen.getByRole('button', { name: /Analyze My Goal/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Goal Summary/)).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /Create Goal/ });
    fireEvent.click(createButton);

    expect(mockOnGoalCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'retirement',
        targetAmount: 1000000,
      })
    );
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(aiGoalApi.parseNaturalLanguageGoal).mockRejectedValue(
      new Error('API Error')
    );

    render(
      <AIGoalAssistant
        userId="test-user"
        existingGoals={mockExistingGoals}
        userContext={mockUserContext}
        onGoalCreated={mockOnGoalCreated}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByPlaceholderText(/Example: I want to retire/);
    fireEvent.change(textarea, {
      target: { value: 'I want to retire' },
    });

    const submitButton = screen.getByRole('button', { name: /Analyze My Goal/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });
  });
});
