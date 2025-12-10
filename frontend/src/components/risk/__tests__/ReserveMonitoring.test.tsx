/**
 * Reserve Monitoring Component Tests
 * Comprehensive test coverage for all reserve monitoring components
 *
 * REQ-RISK-012: Reserve monitoring test coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReserveMonitoringDashboard } from '../ReserveMonitoringDashboard';
import { EmergencyFundGauge } from '../EmergencyFundGauge';
import { ReserveAlertsPanel } from '../ReserveAlertsPanel';
import { ReserveReplenishmentPlan } from '../ReserveReplenishmentPlan';
import * as reserveMonitoringApi from '../../../services/reserveMonitoringApi';

// Mock API responses
const mockMonitoringResult = {
  current_reserves: 15000,
  monthly_expenses: 4000,
  months_coverage: 3.75,
  reserve_status: 'adequate' as const,
  minimum_target: 12000,
  recommended_target: 24000,
  optimal_target: 48000,
  shortfall: 9000,
  target_met: false,
  alerts: [
    {
      severity: 'info' as const,
      title: '💡 Below Recommended Reserve',
      message: 'You have 3.8 months of expenses saved. Recommended target is 6 months.',
      action_required: 'Continue building reserves by $9,000.',
      priority: 3,
    },
  ],
  recommendations: [
    {
      action: 'Aggressive Reserve Building',
      monthly_target: 1200,
      time_to_goal: 8,
      rationale: 'Save 20% of income ($1,200/month) to reach target in 8 months.',
      impact: 'Fastest path to financial security.',
    },
    {
      action: 'Moderate Reserve Building',
      monthly_target: 900,
      time_to_goal: 10,
      rationale: 'Save 15% of income ($900/month) to reach target in 10 months.',
      impact: 'Balanced approach.',
    },
  ],
  trend: 'stable',
  last_updated: '2025-01-15T10:00:00Z',
};

const mockGuidelines = {
  general_guidelines: {
    minimum: { months: 3, description: 'Absolute minimum' },
    recommended: { months: 6, description: 'Standard recommendation' },
    optimal: { months: 12, description: 'Ideal target' },
  },
  adjustment_factors: {
    dependents: {},
    income_stability: {},
    job_security: {},
    health_considerations: {},
    debt_obligations: {},
  },
  best_practices: [
    'Keep reserves in high-yield savings account',
    'Automate monthly contributions',
  ],
  common_mistakes: [
    'Keeping reserves in checking account',
    'Not adjusting for life changes',
  ],
};

const mockGrowthSimulation = {
  initial_balance: 15000,
  final_balance: 43200,
  monthly_contribution: 800,
  target_amount: 24000,
  target_reached_month: 12,
  months_simulated: 36,
  projection: Array.from({ length: 37 }, (_, i) => ({
    month: i,
    balance: 15000 + i * 800,
  })),
};

describe('EmergencyFundGauge', () => {
  it('renders with correct reserve status', () => {
    render(
      <EmergencyFundGauge
        currentReserves={15000}
        monthlyExpenses={4000}
        minimumTarget={12000}
        recommendedTarget={24000}
        optimalTarget={48000}
        status="adequate"
        animated={false}
      />
    );

    expect(screen.getByText('3.8')).toBeInTheDocument();
    expect(screen.getByText('months coverage')).toBeInTheDocument();
    expect(screen.getByText('adequate')).toBeInTheDocument();
  });

  it('displays all target markers', () => {
    render(
      <EmergencyFundGauge
        currentReserves={15000}
        monthlyExpenses={4000}
        minimumTarget={12000}
        recommendedTarget={24000}
        optimalTarget={48000}
        status="adequate"
        animated={false}
      />
    );

    expect(screen.getByText('Minimum')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Optimal')).toBeInTheDocument();
  });

  it('shows correct percentage of optimal target', () => {
    render(
      <EmergencyFundGauge
        currentReserves={24000}
        monthlyExpenses={4000}
        minimumTarget={12000}
        recommendedTarget={24000}
        optimalTarget={48000}
        status="strong"
        animated={false}
      />
    );

    expect(screen.getByText('50.0% of optimal target')).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { rerender } = render(
      <EmergencyFundGauge
        currentReserves={3000}
        monthlyExpenses={4000}
        minimumTarget={12000}
        recommendedTarget={24000}
        optimalTarget={48000}
        status="critical"
        animated={false}
      />
    );

    expect(screen.getByText('critical')).toBeInTheDocument();

    rerender(
      <EmergencyFundGauge
        currentReserves={50000}
        monthlyExpenses={4000}
        minimumTarget={12000}
        recommendedTarget={24000}
        optimalTarget={48000}
        status="excellent"
        animated={false}
      />
    );

    expect(screen.getByText('excellent')).toBeInTheDocument();
  });
});

describe('ReserveAlertsPanel', () => {
  it('displays all alerts sorted by priority', () => {
    const alerts = [
      {
        severity: 'info' as const,
        title: 'Info Alert',
        message: 'Info message',
        action_required: 'Info action',
        priority: 3,
      },
      {
        severity: 'critical' as const,
        title: 'Critical Alert',
        message: 'Critical message',
        action_required: 'Critical action',
        priority: 1,
      },
      {
        severity: 'warning' as const,
        title: 'Warning Alert',
        message: 'Warning message',
        action_required: 'Warning action',
        priority: 2,
      },
    ];

    render(<ReserveAlertsPanel alerts={alerts} />);

    const alertElements = screen.getAllByText(/Alert/);
    expect(alertElements[0]).toHaveTextContent('Critical Alert');
    expect(alertElements[1]).toHaveTextContent('Warning Alert');
    expect(alertElements[2]).toHaveTextContent('Info Alert');
  });

  it('shows no alerts message when empty', () => {
    render(<ReserveAlertsPanel alerts={[]} />);

    expect(screen.getByText('No Active Alerts')).toBeInTheDocument();
    expect(screen.getByText('Your emergency fund is in good shape')).toBeInTheDocument();
  });

  it('displays summary stats for multiple alerts', () => {
    const alerts = [
      {
        severity: 'critical' as const,
        title: 'Critical 1',
        message: 'Message',
        action_required: 'Action',
        priority: 1,
      },
      {
        severity: 'critical' as const,
        title: 'Critical 2',
        message: 'Message',
        action_required: 'Action',
        priority: 1,
      },
      {
        severity: 'warning' as const,
        title: 'Warning',
        message: 'Message',
        action_required: 'Action',
        priority: 2,
      },
    ];

    render(<ReserveAlertsPanel alerts={alerts} compact={false} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Critical count
    expect(screen.getByText('1')).toBeInTheDocument(); // Warning count
  });

  it('handles compact mode with expand/collapse', () => {
    const alerts = [
      {
        severity: 'warning' as const,
        title: 'Test Alert',
        message: 'Test message',
        action_required: 'Test action',
        priority: 2,
      },
    ];

    render(<ReserveAlertsPanel alerts={alerts} compact={true} />);

    expect(screen.getByText('▼ Click to expand')).toBeInTheDocument();

    const alertCard = screen.getByText('Test Alert').closest('div');
    if (alertCard) {
      fireEvent.click(alertCard);
      expect(screen.getByText('▲ Click to collapse')).toBeInTheDocument();
    }
  });

  it('limits visible alerts when maxVisible is set', () => {
    const alerts = Array.from({ length: 5 }, (_, i) => ({
      severity: 'info' as const,
      title: `Alert ${i + 1}`,
      message: `Message ${i + 1}`,
      action_required: `Action ${i + 1}`,
      priority: i + 1,
    }));

    render(<ReserveAlertsPanel alerts={alerts} maxVisible={3} />);

    expect(screen.getByText('Alert 1')).toBeInTheDocument();
    expect(screen.getByText('Alert 2')).toBeInTheDocument();
    expect(screen.getByText('Alert 3')).toBeInTheDocument();
    expect(screen.queryByText('Alert 4')).not.toBeInTheDocument();
    expect(screen.getByText('Show All')).toBeInTheDocument();
  });
});

describe('ReserveReplenishmentPlan', () => {
  it('displays target met message when no shortfall', () => {
    render(
      <ReserveReplenishmentPlan
        currentReserves={25000}
        targetReserves={24000}
        monthlyIncome={6000}
        monthlyExpenses={4000}
        recommendations={[]}
      />
    );

    expect(screen.getByText('Reserve Target Met!')).toBeInTheDocument();
  });

  it('renders all recommendations', () => {
    const recommendations = [
      {
        action: 'Aggressive Plan',
        monthly_target: 1200,
        time_to_goal: 8,
        rationale: 'Aggressive rationale',
        impact: 'Fast',
      },
      {
        action: 'Moderate Plan',
        monthly_target: 900,
        time_to_goal: 10,
        rationale: 'Moderate rationale',
        impact: 'Balanced',
      },
    ];

    render(
      <ReserveReplenishmentPlan
        currentReserves={15000}
        targetReserves={24000}
        monthlyIncome={6000}
        monthlyExpenses={4000}
        recommendations={recommendations}
      />
    );

    expect(screen.getByText('Aggressive Plan')).toBeInTheDocument();
    expect(screen.getByText('Moderate Plan')).toBeInTheDocument();
  });

  it('allows custom contribution via slider', () => {
    const onPlanChange = vi.fn();

    render(
      <ReserveReplenishmentPlan
        currentReserves={15000}
        targetReserves={24000}
        monthlyIncome={6000}
        monthlyExpenses={4000}
        recommendations={[]}
        onPlanChange={onPlanChange}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '800' } });

    expect(onPlanChange).toHaveBeenCalled();
  });

  it('calculates time to goal correctly', () => {
    render(
      <ReserveReplenishmentPlan
        currentReserves={15000}
        targetReserves={24000}
        monthlyIncome={6000}
        monthlyExpenses={4000}
        recommendations={[
          {
            action: 'Test Plan',
            monthly_target: 900,
            time_to_goal: 10,
            rationale: 'Test',
            impact: 'Test',
          },
        ]}
      />
    );

    expect(screen.getByText(/10 months/)).toBeInTheDocument();
  });

  it('shows warning when contribution exceeds disposable income', () => {
    render(
      <ReserveReplenishmentPlan
        currentReserves={15000}
        targetReserves={24000}
        monthlyIncome={6000}
        monthlyExpenses={5500}
        recommendations={[
          {
            action: 'Aggressive Plan',
            monthly_target: 1000,
            time_to_goal: 9,
            rationale: 'Save aggressively',
            impact: 'Fast',
          },
        ]}
      />
    );

    // This should show a warning since 1000 > (6000 - 5500)
    expect(screen.getByText(/exceeds your disposable income/i)).toBeInTheDocument();
  });
});

describe('ReserveMonitoringDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(reserveMonitoringApi, 'monitorReserves').mockResolvedValue(mockMonitoringResult);
    vi.spyOn(reserveMonitoringApi, 'getReserveGuidelines').mockResolvedValue(mockGuidelines);
    vi.spyOn(reserveMonitoringApi, 'simulateReserveGrowth').mockResolvedValue(mockGrowthSimulation);
  });

  it('renders loading state initially', async () => {
    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
      />
    );

    expect(screen.getByText('Analyzing Reserve Status...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Analyzing Reserve Status...')).not.toBeInTheDocument();
    });
  });

  it('fetches and displays reserve data', async () => {
    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
      />
    );

    await waitFor(() => {
      expect(reserveMonitoringApi.monitorReserves).toHaveBeenCalledWith({
        current_reserves: 15000,
        monthly_expenses: 4000,
        monthly_income: 6000,
        has_dependents: false,
        income_stability: 'stable',
        job_security: 'secure',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund Monitoring')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund Monitoring')).toBeInTheDocument();
    });

    // Click on Build Plan tab
    const planTab = screen.getByText('Build Plan');
    fireEvent.click(planTab);

    await waitFor(() => {
      expect(screen.getByText('Build Your Replenishment Plan')).toBeInTheDocument();
    });

    // Click on Guidelines tab
    const guidelinesTab = screen.getByText('Guidelines');
    fireEvent.click(guidelinesTab);

    await waitFor(() => {
      expect(screen.getByText('General Guidelines')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.spyOn(reserveMonitoringApi, 'monitorReserves').mockRejectedValue(
      new Error('Network error')
    );

    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Reserve Status')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays alerts panel on overview tab', async () => {
    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('💡 Below Recommended Reserve')).toBeInTheDocument();
    });
  });

  it('passes correct props to components', async () => {
    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
        hasDependents={true}
        incomeStability="variable"
        jobSecurity="at_risk"
      />
    );

    await waitFor(() => {
      expect(reserveMonitoringApi.monitorReserves).toHaveBeenCalledWith({
        current_reserves: 15000,
        monthly_expenses: 4000,
        monthly_income: 6000,
        has_dependents: true,
        income_stability: 'variable',
        job_security: 'at_risk',
      });
    });
  });

  it('allows refreshing data', async () => {
    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund Monitoring')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('🔄 Refresh Data');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(reserveMonitoringApi.monitorReserves).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Reserve Monitoring Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(reserveMonitoringApi, 'monitorReserves').mockResolvedValue(mockMonitoringResult);
    vi.spyOn(reserveMonitoringApi, 'getReserveGuidelines').mockResolvedValue(mockGuidelines);
    vi.spyOn(reserveMonitoringApi, 'simulateReserveGrowth').mockResolvedValue(mockGrowthSimulation);
  });

  it('navigates through full workflow', async () => {
    render(
      <ReserveMonitoringDashboard
        currentReserves={15000}
        monthlyExpenses={4000}
        monthlyIncome={6000}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Emergency Fund Monitoring')).toBeInTheDocument();
    });

    // Check overview tab content
    expect(screen.getByText('Active Alerts (1)')).toBeInTheDocument();
    expect(screen.getByText('Quick Recommendations')).toBeInTheDocument();

    // Navigate to plan tab
    const buildPlanButton = screen.getByText('Build Custom Plan →');
    fireEvent.click(buildPlanButton);

    await waitFor(() => {
      expect(screen.getByText('Build Your Replenishment Plan')).toBeInTheDocument();
    });

    // Navigate to simulator tab
    const simulatorTab = screen.getByText('Simulator');
    fireEvent.click(simulatorTab);

    await waitFor(() => {
      expect(reserveMonitoringApi.simulateReserveGrowth).toHaveBeenCalled();
    });

    // Navigate to guidelines tab
    const guidelinesTab = screen.getByText('Guidelines');
    fireEvent.click(guidelinesTab);

    await waitFor(() => {
      expect(screen.getByText('Best Practices')).toBeInTheDocument();
      expect(screen.getByText('Common Mistakes to Avoid')).toBeInTheDocument();
    });
  });
});
