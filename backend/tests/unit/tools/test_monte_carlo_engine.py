"""
Unit tests for Monte Carlo Engine
"""

import pytest
from datetime import date, timedelta
from app.tools.monte_carlo_engine import (
    run_simulation,
    calculate_success_probability,
    SimulationParams,
)


@pytest.mark.unit
@pytest.mark.asyncio
class TestMonteCarloEngine:
    """Test Monte Carlo simulation functions."""

    async def test_run_simulation_basic(self):
        """Test basic Monte Carlo simulation."""
        params = SimulationParams(
            initial_portfolio_value=100000,
            monthly_contribution=1000,
            time_horizon=10,
            expected_return=0.08,
            volatility=0.12,
            goal_amount=300000,
            iterations=1000
        )

        result = await run_simulation(params)

        assert result.success_probability >= 0
        assert result.success_probability <= 1
        assert result.iterations_run == 1000
        assert len(result.final_portfolio_distribution) == 1000
        assert len(result.portfolio_projections) == 11  # 0 to 10 years

        # Statistics should be present
        assert result.statistics.median_final_value > 0
        assert result.statistics.percentile_10 < result.statistics.median_final_value
        assert result.statistics.median_final_value < result.statistics.percentile_90

    async def test_calculate_success_probability(self):
        """Test success probability calculation."""
        probability = await calculate_success_probability(
            current_value=100000,
            goal_amount=200000,
            monthly_contribution=1000,
            years_to_goal=10,
            expected_return=0.08,
            volatility=0.12
        )

        # Should return a valid probability
        assert 0 <= probability <= 1

    async def test_high_volatility_simulation(self):
        """Test simulation with high volatility."""
        params = SimulationParams(
            initial_portfolio_value=100000,
            monthly_contribution=500,
            time_horizon=20,
            expected_return=0.10,
            volatility=0.25,  # High volatility
            goal_amount=300000,
            iterations=500
        )

        result = await run_simulation(params)

        # With high volatility, there should be a wide range of outcomes
        p10 = result.statistics.percentile_10
        p90 = result.statistics.percentile_90

        # P90 should be significantly higher than P10
        assert p90 > p10 * 1.8

    async def test_low_volatility_simulation(self):
        """Test simulation with low volatility."""
        params = SimulationParams(
            initial_portfolio_value=100000,
            monthly_contribution=500,
            time_horizon=20,
            expected_return=0.06,
            volatility=0.05,  # Low volatility
            goal_amount=200000,
            iterations=500
        )

        result = await run_simulation(params)

        # With low volatility, outcomes should be more clustered
        p10 = result.statistics.percentile_10
        p90 = result.statistics.percentile_90

        # P90 should not be extremely far from P10 (allowing for contributions)
        assert p90 < p10 * 2.0

    async def test_zero_contributions(self):
        """Test simulation with no contributions."""
        params = SimulationParams(
            initial_portfolio_value=100000,
            monthly_contribution=0,
            time_horizon=10,
            expected_return=0.08,
            volatility=0.12,
            goal_amount=200000,
            iterations=500
        )

        result = await run_simulation(params)

        # Median should be approximately initial * (1 + return)^years
        expected_median = 100000 * (1.08 ** 10)
        actual_median = result.statistics.median_final_value

        # Allow 20% margin due to volatility
        assert 0.80 * expected_median < actual_median < 1.20 * expected_median

    async def test_with_withdrawals(self):
        """Test simulation with withdrawals (retirement scenario)."""
        params = SimulationParams(
            initial_portfolio_value=500000,
            monthly_contribution=0,
            monthly_withdrawal=2000,  # $24k/year (4.8% withdrawal)
            time_horizon=20,
            expected_return=0.07,
            volatility=0.12,
            goal_amount=100000,  # Want to preserve some capital
            iterations=1000
        )

        result = await run_simulation(params)

        # Should have some probability of success
        assert 0 <= result.success_probability <= 1

        # Statistics should show declining portfolio
        assert result.statistics.median_final_value < params.initial_portfolio_value

    async def test_portfolio_projections(self):
        """Test that portfolio projections are generated correctly."""
        params = SimulationParams(
            initial_portfolio_value=100000,
            monthly_contribution=1000,
            time_horizon=5,
            expected_return=0.08,
            volatility=0.12,
            goal_amount=150000,
            iterations=500
        )

        result = await run_simulation(params)

        # Should have projection for each year (0 to time_horizon)
        assert len(result.portfolio_projections) == 6

        # Projections should show growth
        first_year = result.portfolio_projections[0]
        last_year = result.portfolio_projections[-1]

        assert first_year.year == 0
        assert last_year.year == 5
        assert last_year.median > first_year.median

        # Percentiles should be ordered (skip year 0 which has no variation)
        for proj in result.portfolio_projections[1:]:
            assert proj.p10 <= proj.p25 <= proj.median <= proj.p75 <= proj.p90

    async def test_probability_of_loss(self):
        """Test probability of loss calculation."""
        params = SimulationParams(
            initial_portfolio_value=100000,
            monthly_contribution=0,
            time_horizon=10,
            expected_return=0.03,  # Low return
            volatility=0.20,  # High volatility
            goal_amount=50000,
            iterations=1000
        )

        result = await run_simulation(params)

        # With low returns and high volatility, should have some probability of loss
        assert result.statistics.probability_of_loss >= 0
        assert result.statistics.probability_of_loss <= 1
