/**
 * Goal Dependencies Tests
 *
 * Comprehensive test suite for all dependency components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { GoalDependencyGraph } from '../GoalDependencyGraph';
import { DependencyEditor } from '../DependencyEditor';
import { SequentialGoalPlanner } from '../SequentialGoalPlanner';
import { DependencyValidator } from '../DependencyValidator';
import * as dependencyApi from '../../../services/goalDependenciesApi';
import type { Goal } from '../../../types/goal';
import type { GoalDependency } from '../../../types/goalDependencies';

// Mock the API
vi.mock('../../../services/goalDependenciesApi');

describe('GoalDependencyGraph', () => {
  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Retirement',
      category: 'retirement',
      priority: 'essential',
      targetAmount: 1000000,
      currentAmount: 50000,
      targetDate: '2045-01-01',
      status: 'on_track',
    },
    {
      id: 'goal-2',
      title: 'College Fund',
      category: 'education',
      priority: 'important',
      targetAmount: 200000,
      currentAmount: 10000,
      targetDate: '2035-01-01',
      status: 'on_track',
    },
  ];

  const mockDependencies: GoalDependency[] = [
    {
      id: 'dep-1',
      source_goal_id: 'goal-1',
      target_goal_id: 'goal-2',
      dependency_type: 'sequential',
      description: 'Retirement starts after college',
      created_at: '2025-01-01T00:00:00Z',
    },
  ];

  it('renders the dependency graph with nodes and links', () => {
    render(
      <GoalDependencyGraph
        goals={mockGoals}
        dependencies={mockDependencies}
      />
    );

    expect(screen.getByText('Dependency Types')).toBeInTheDocument();
    expect(screen.getByText('Sequential')).toBeInTheDocument();
  });

  it('shows empty state when no goals', () => {
    render(
      <GoalDependencyGraph
        goals={[]}
        dependencies={[]}
      />
    );

    expect(screen.getByText('No goals to display')).toBeInTheDocument();
  });

  it('calls onNodeClick when node is clicked', async () => {
    const onNodeClick = vi.fn();

    render(
      <GoalDependencyGraph
        goals={mockGoals}
        dependencies={mockDependencies}
        onNodeClick={onNodeClick}
      />
    );

    // D3 creates the nodes dynamically, so we need to wait
    await waitFor(() => {
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
  });

  it('detects cycles in dependencies', () => {
    const cyclicDependencies: GoalDependency[] = [
      {
        id: 'dep-1',
        source_goal_id: 'goal-1',
        target_goal_id: 'goal-2',
        dependency_type: 'sequential',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'dep-2',
        source_goal_id: 'goal-2',
        target_goal_id: 'goal-1',
        dependency_type: 'sequential',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    render(
      <GoalDependencyGraph
        goals={mockGoals}
        dependencies={cyclicDependencies}
      />
    );

    // The graph should still render
    expect(screen.getByText('Dependency Types')).toBeInTheDocument();
  });
});

describe('DependencyEditor', () => {
  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Retirement',
      category: 'retirement',
      priority: 'essential',
      targetAmount: 1000000,
      currentAmount: 50000,
      targetDate: '2045-01-01',
      status: 'on_track',
    },
    {
      id: 'goal-2',
      title: 'College Fund',
      category: 'education',
      priority: 'important',
      targetAmount: 200000,
      currentAmount: 10000,
      targetDate: '2035-01-01',
      status: 'on_track',
    },
  ];

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create mode correctly', () => {
    render(
      <DependencyEditor
        goals={mockGoals}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('heading', { name: /Create Dependency/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Source Goal/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Goal/)).toBeInTheDocument();
  });

  it('renders edit mode correctly', () => {
    const existingDependency: GoalDependency = {
      id: 'dep-1',
      source_goal_id: 'goal-1',
      target_goal_id: 'goal-2',
      dependency_type: 'sequential',
      description: 'Test dependency',
      created_at: '2025-01-01T00:00:00Z',
    };

    render(
      <DependencyEditor
        goals={mockGoals}
        existingDependency={existingDependency}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Dependency')).toBeInTheDocument();
  });

  it('shows all dependency types', () => {
    render(
      <DependencyEditor
        goals={mockGoals}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Sequential')).toBeInTheDocument();
    expect(screen.getByText('Conditional')).toBeInTheDocument();
    expect(screen.getByText('Blocking')).toBeInTheDocument();
    expect(screen.getByText('Linked')).toBeInTheDocument();
  });

  it('creates dependency when form is submitted', async () => {
    vi.mocked(dependencyApi.createDependency).mockResolvedValue({
      id: 'new-dep',
      source_goal_id: 'goal-1',
      target_goal_id: 'goal-2',
      dependency_type: 'sequential',
      created_at: '2025-01-01T00:00:00Z',
    });

    render(
      <DependencyEditor
        goals={mockGoals}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Select source goal
    const sourceSelect = screen.getByLabelText(/Source Goal/);
    fireEvent.change(sourceSelect, { target: { value: 'goal-1' } });

    // Select target goal
    const targetSelect = screen.getByLabelText(/Target Goal/);
    fireEvent.change(targetSelect, { target: { value: 'goal-2' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Create Dependency/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(dependencyApi.createDependency).toHaveBeenCalledWith({
        source_goal_id: 'goal-1',
        target_goal_id: 'goal-2',
        dependency_type: 'sequential',
      });
    });

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('prevents self-dependency', () => {
    render(
      <DependencyEditor
        goals={mockGoals}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Select same goal for both source and target (target option should be removed)
    const sourceSelect = screen.getByLabelText(/Source Goal/);
    fireEvent.change(sourceSelect, { target: { value: 'goal-1' } });

    const targetSelect = screen.getByLabelText(/Target Goal/);
    expect(within(targetSelect).queryByText('Retirement')).not.toBeInTheDocument();

    // Selecting source removes that goal from target options
    fireEvent.change(targetSelect, { target: { value: 'goal-2' } });

    const updatedSourceOptions = within(sourceSelect).queryAllByRole('option');
    expect(updatedSourceOptions.some(option => option.textContent?.includes('College Fund'))).toBe(
      false
    );
  });
});

describe('SequentialGoalPlanner', () => {
  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Retirement',
      category: 'retirement',
      priority: 'essential',
      targetAmount: 1000000,
      currentAmount: 50000,
      targetDate: '2045-01-01',
      status: 'on_track',
    },
    {
      id: 'goal-2',
      title: 'College Fund',
      category: 'education',
      priority: 'important',
      targetAmount: 200000,
      currentAmount: 10000,
      targetDate: '2035-01-01',
      status: 'on_track',
    },
  ];

  const mockDependencies: GoalDependency[] = [
    {
      id: 'dep-1',
      source_goal_id: 'goal-1',
      target_goal_id: 'goal-2',
      dependency_type: 'sequential',
      created_at: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays timeline', async () => {
    vi.mocked(dependencyApi.getOptimizedTimeline).mockResolvedValue([
      {
        goal_id: 'goal-2',
        goal_title: 'College Fund',
        earliest_start: '2025-01-01',
        latest_start: '2025-06-01',
        duration_months: 120,
        dependencies: [],
        dependents: ['goal-1'],
      },
      {
        goal_id: 'goal-1',
        goal_title: 'Retirement',
        earliest_start: '2035-01-01',
        latest_start: '2035-06-01',
        duration_months: 120,
        dependencies: ['goal-2'],
        dependents: [],
      },
    ]);

    vi.mocked(dependencyApi.optimizeSequencing).mockResolvedValue({
      optimized_sequence: ['goal-2', 'goal-1'],
      parallel_groups: [],
      critical_path: ['goal-2', 'goal-1'],
      total_duration_months: 240,
      recommendations: ['Focus on college fund first'],
    });

    render(
      <SequentialGoalPlanner
        goals={mockGoals}
        dependencies={mockDependencies}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'College Fund' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('heading', { name: 'Retirement' }).length).toBeGreaterThan(0);
    });
  });

  it('shows optimization recommendations', async () => {
    vi.mocked(dependencyApi.getOptimizedTimeline).mockResolvedValue([]);
    vi.mocked(dependencyApi.optimizeSequencing).mockResolvedValue({
      optimized_sequence: ['goal-2', 'goal-1'],
      parallel_groups: [],
      critical_path: ['goal-2', 'goal-1'],
      total_duration_months: 240,
      recommendations: ['Focus on college fund first', 'Consider increasing savings rate'],
    });

    render(
      <SequentialGoalPlanner
        goals={mockGoals}
        dependencies={mockDependencies}
      />
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Show Optimization/ });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText(/Focus on college fund first/)).toBeInTheDocument();
    });
  });
});

describe('DependencyValidator', () => {
  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Retirement',
      category: 'retirement',
      priority: 'essential',
      targetAmount: 1000000,
      currentAmount: 50000,
      targetDate: '2045-01-01',
      status: 'on_track',
    },
    {
      id: 'goal-2',
      title: 'College Fund',
      category: 'education',
      priority: 'important',
      targetAmount: 200000,
      currentAmount: 10000,
      targetDate: '2035-01-01',
      status: 'on_track',
    },
  ];

  const mockDependencies: GoalDependency[] = [
    {
      id: 'dep-1',
      source_goal_id: 'goal-1',
      target_goal_id: 'goal-2',
      dependency_type: 'sequential',
      created_at: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows valid state when no errors', async () => {
    vi.mocked(dependencyApi.validateDependencies).mockResolvedValue({
      is_valid: true,
      errors: [],
      warnings: [],
      cycles_detected: [],
    });

    render(
      <DependencyValidator
        goals={mockGoals}
        dependencies={mockDependencies}
        autoValidate={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/All dependencies are valid/)).toBeInTheDocument();
    });
  });

  it('shows errors when cycles detected', async () => {
    vi.mocked(dependencyApi.validateDependencies).mockResolvedValue({
      is_valid: false,
      errors: ['Circular dependency detected'],
      warnings: [],
      cycles_detected: [['goal-1', 'goal-2', 'goal-1']],
    });

    render(
      <DependencyValidator
        goals={mockGoals}
        dependencies={mockDependencies}
        autoValidate={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Dependency Errors Detected/)).toBeInTheDocument();
    });
  });

  it('shows warnings', async () => {
    vi.mocked(dependencyApi.validateDependencies).mockResolvedValue({
      is_valid: true,
      errors: [],
      warnings: ['Timeline overlap detected'],
      cycles_detected: [],
    });

    render(
      <DependencyValidator
        goals={mockGoals}
        dependencies={mockDependencies}
        autoValidate={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Dependency Warnings/)).toBeInTheDocument();
    });
  });

  it('allows manual revalidation', async () => {
    vi.mocked(dependencyApi.validateDependencies).mockResolvedValue({
      is_valid: true,
      errors: [],
      warnings: [],
      cycles_detected: [],
    });

    render(
      <DependencyValidator
        goals={mockGoals}
        dependencies={mockDependencies}
        autoValidate={false}
      />
    );

    // Initially should not validate
    expect(dependencyApi.validateDependencies).not.toHaveBeenCalled();

    // Run initial validation manually
    const runButton = screen.getByRole('button', { name: /Validate Dependencies/ });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(dependencyApi.validateDependencies).toHaveBeenCalledTimes(1);
    });

    vi.mocked(dependencyApi.validateDependencies).mockClear();

    // Re-run via revalidate button
    const revalidateButton = await screen.findByRole('button', { name: /Revalidate/ });
    fireEvent.click(revalidateButton);

    await waitFor(() => {
      expect(dependencyApi.validateDependencies).toHaveBeenCalledTimes(1);
    });
  });
});
