import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentProgress } from './AgentProgress';

describe('AgentProgress', () => {
  it('renders current agent name', () => {
    render(
      <AgentProgress
        currentAgent="Goal Planner"
        agentUpdates={[]}
      />
    );

    // May appear multiple times (in title and in team badges)
    const elements = screen.getAllByText('Goal Planner');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows active indicator when agent is running', () => {
    render(
      <AgentProgress
        currentAgent="Portfolio Architect"
        agentUpdates={[]}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays latest agent update', () => {
    const agentUpdates = [
      {
        agent_id: 'goal_planner',
        agent_name: 'Goal Planner',
        response: 'Calculating retirement needs',
        timestamp: Date.now(),
      },
    ];

    render(
      <AgentProgress
        currentAgent="Goal Planner"
        agentUpdates={agentUpdates}
      />
    );

    expect(screen.getByText(/Calculating retirement needs/)).toBeInTheDocument();
  });

  it('displays animated spinner', () => {
    const { container } = render(
      <AgentProgress
        currentAgent="Monte Carlo Simulator"
        agentUpdates={[]}
      />
    );

    // Check for spinner element (has animate-ping class)
    const spinner = container.querySelector('.animate-ping');
    expect(spinner).toBeInTheDocument();
  });

  it('truncates long responses to 60 characters', () => {
    const longResponse = 'A'.repeat(100);
    const agentUpdates = [
      {
        agent_id: 'test',
        agent_name: 'Test Agent',
        response: longResponse,
        timestamp: Date.now(),
      },
    ];

    const { container } = render(
      <AgentProgress
        currentAgent="Test Agent"
        agentUpdates={agentUpdates}
      />
    );

    // The component truncates at 60 characters and adds "..."
    const textContent = container.textContent || '';
    const responseText = textContent.match(/A+\.\.\./)?.[0];
    expect(responseText).toBeDefined();
    expect(responseText!.length).toBe(63); // 60 A's + "..."
  });

  it('displays agent icon', () => {
    const { container } = render(
      <AgentProgress
        currentAgent="Goal Planner"
        agentUpdates={[]}
      />
    );

    // Goal Planner should have 📊 icon (may appear multiple times)
    expect(container.textContent).toContain('📊');
  });

  it('renders nothing when currentAgent is null', () => {
    const { container } = render(
      <AgentProgress
        currentAgent={null}
        agentUpdates={[]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows agent team visualization', () => {
    const { container } = render(
      <AgentProgress
        currentAgent="Portfolio Architect"
        agentUpdates={[]}
      />
    );

    // Should render multiple agent badges
    expect(container.textContent).toContain('orchestrator');
    expect(container.textContent).toContain('Portfolio Architect');
  });

  it('highlights active agent in team visualization', () => {
    const { container } = render(
      <AgentProgress
        currentAgent="Goal Planner"
        agentUpdates={[]}
      />
    );

    // Active agent should have scale-110 class
    const activeAgent = container.querySelector('.scale-110');
    expect(activeAgent).toBeInTheDocument();
    expect(activeAgent?.textContent).toContain('Goal Planner');
  });
});
