/**
 * Hedging Strategy Dashboard Tests
 * Comprehensive tests for hedging strategy recommendations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HedgingStrategyDashboard } from '../HedgingStrategyDashboard';
import * as hedgingApi from '../../../services/hedgingStrategiesApi';

// Mock the API
vi.mock('../../../services/hedgingStrategiesApi');

describe('HedgingStrategyDashboard', () => {
  const mockRecommendation: hedgingApi.HedgingRecommendation = {
    portfolio_value: 500000,
    current_risk_level: 'aggressive',
    recommended_strategies: [
      {
        strategy_type: 'protective_put',
        name: 'Protective Put',
        description: 'Purchase put options on equity holdings to protect against downside',
        implementation: 'Buy put options with strike at 90% of current portfolio value',
        cost_estimate: 7000,
        cost_pct: 0.014,
        protection_level: 0.90,
        max_downside: 57000,
        breakeven_point: 493000,
        time_horizon: '3 months',
        pros: ['Unlimited upside potential', 'Defined maximum loss'],
        cons: ['Direct cost to portfolio', 'Requires quarterly rolling'],
        suitability_score: 85.5,
        when_to_use: 'Best when you expect potential short-term market decline',
        implementation_steps: ['Identify equity portion', 'Select appropriate index ETF'],
        impact_on_return: -0.014,
        impact_on_volatility: -0.15,
      },
      {
        strategy_type: 'collar',
        name: 'Collar Strategy',
        description: 'Buy protective puts and sell covered calls',
        implementation: 'Buy 90% put and sell 110% call',
        cost_estimate: 500,
        cost_pct: 0.001,
        protection_level: 0.90,
        max_downside: 50500,
        breakeven_point: 499500,
        time_horizon: '3 months',
        pros: ['Very low or zero net cost', 'Defined maximum loss'],
        cons: ['Caps upside potential', 'Gives up gains above call strike'],
        suitability_score: 90.2,
        when_to_use: 'Ideal for long-term investors who want downside protection',
        implementation_steps: ['Calculate equity allocation', 'Buy ATM puts'],
        impact_on_return: -0.004,
        impact_on_volatility: -0.25,
      },
    ],
    optimal_strategy: {
      strategy_type: 'collar',
      name: 'Collar Strategy',
      description: 'Buy protective puts and sell covered calls',
      implementation: 'Buy 90% put and sell 110% call',
      cost_estimate: 500,
      cost_pct: 0.001,
      protection_level: 0.90,
      max_downside: 50500,
      breakeven_point: 499500,
      time_horizon: '3 months',
      pros: ['Very low or zero net cost', 'Defined maximum loss'],
      cons: ['Caps upside potential', 'Gives up gains above call strike'],
      suitability_score: 90.2,
      when_to_use: 'Ideal for long-term investors who want downside protection',
      implementation_steps: ['Calculate equity allocation', 'Buy ATM puts'],
      impact_on_return: -0.004,
      impact_on_volatility: -0.25,
    },
    total_cost_range: [500, 7000],
    total_cost_estimate: 500,
    expected_protection: 0.90,
    implementation_priority: 'High',
    market_conditions_note: 'High volatility environment',
    objectives_met: {
      cost_tolerance: true,
      protection_level: true,
      hedge_percentage: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header', () => {
    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
      />
    );

    expect(screen.getByText('Hedging Strategy Recommendations')).toBeInTheDocument();
  });

  it('loads recommendations on mount', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      expect(hedgingApi.getHedgingRecommendations).toHaveBeenCalledWith({
        portfolio_value: 500000,
        allocation: { US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 },
        risk_metrics: { annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' },
        market_conditions: undefined,
        objectives: expect.any(Object),
      });
    }, { timeout: 2000 });
  });

  it('displays optimal strategy', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('⭐ OPTIMAL STRATEGY')).toBeInTheDocument();
      expect(screen.getByTestId('optimal-strategy-name')).toHaveTextContent('Collar Strategy');
    }, { timeout: 2000 });
  });

  it('displays all recommended strategies', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('All Recommended Strategies (2)')).toBeInTheDocument();
      expect(screen.getByText('Protective Put')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('allows setting custom objectives', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    // Open objectives panel
    const objectivesButton = screen.getByText('⚙️ Objectives');
    fireEvent.click(objectivesButton);

    await waitFor(() => {
      expect(screen.getByText('Hedging Objectives')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Apply objectives
    const applyButton = screen.getByText('Apply Objectives');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(hedgingApi.getHedgingRecommendations).toHaveBeenCalledTimes(2);
    }, { timeout: 2000 });
  });

  it('shows market conditions note', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/High volatility environment/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays objectives met indicators', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('objective-status-cost_tolerance')).toHaveTextContent('✅ cost tolerance');
      expect(screen.getByTestId('objective-status-protection_level')).toHaveTextContent('✅ protection level');
      expect(screen.getByTestId('objective-status-hedge_percentage')).toHaveTextContent('✅ hedge percentage');
    }, { timeout: 2000 });
  });

  it('handles strategy selection', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Protective Put')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click on a strategy
    const protectivePutCard = screen.getByText('Protective Put').closest('div');
    if (protectivePutCard) {
      fireEvent.click(protectivePutCard);
    }

    await waitFor(() => {
      expect(screen.getByText('📋 Implementation')).toBeInTheDocument();
      expect(screen.getByText('✅ Pros')).toBeInTheDocument();
      expect(screen.getByText('❌ Cons')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('displays implementation steps', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      const viewDetailsButton = screen.getByText('View Implementation Details');
      fireEvent.click(viewDetailsButton);
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(screen.getByText('✅ Implementation Steps')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles API errors', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockRejectedValue(
      new Error('Failed to load recommendations')
    );

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load recommendations/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('runs example analysis', async () => {
    vi.mocked(hedgingApi.getHedgingRecommendations).mockResolvedValue(mockRecommendation);

    render(
      <HedgingStrategyDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.70, US_TREASURY_INTER: 0.30 }}
        riskMetrics={{ annual_volatility: 0.18, beta: 1.15, risk_level: 'aggressive' }}
        usePlaidData={false}
      />
    );

    const exampleButton = screen.getByText('Run Example Analysis');
    fireEvent.click(exampleButton);

    await waitFor(() => {
      expect(hedgingApi.getHedgingRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          portfolio_value: 500000,
        })
      );
    }, { timeout: 2000 });
  });
});
