"""
Unit tests for Portfolio Optimizer
"""

import pytest
from app.tools.portfolio_optimizer import (
    optimize_portfolio,
    calculate_efficient_frontier,
    AssetClass,
    OptimizationParams,
)


@pytest.mark.unit
@pytest.mark.asyncio
class TestPortfolioOptimizer:
    """Test portfolio optimization functions."""

    def get_sample_asset_classes(self):
        """Get sample asset classes for testing."""
        return [
            AssetClass(name="US_LargeCap", expected_return=0.10, volatility=0.15),
            AssetClass(name="US_SmallCap", expected_return=0.12, volatility=0.20),
            AssetClass(name="International", expected_return=0.09, volatility=0.17),
            AssetClass(name="Bonds", expected_return=0.04, volatility=0.06),
            AssetClass(name="REITs", expected_return=0.08, volatility=0.18),
        ]

    async def test_optimize_portfolio_basic(self):
        """Test basic portfolio optimization."""
        asset_classes = self.get_sample_asset_classes()

        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=0.6,
            time_horizon=20
        )

        result = await optimize_portfolio(params)

        assert result.allocation is not None
        assert result.expected_return > 0
        assert result.expected_volatility > 0
        assert -1 < result.sharpe_ratio < 2

        # Allocations should sum to ~1.0
        total_allocation = sum(result.allocation.values())
        assert 0.99 <= total_allocation <= 1.01

        # All allocations should be non-negative
        for allocation in result.allocation.values():
            assert allocation >= 0

    async def test_optimize_portfolio_conservative(self):
        """Test conservative portfolio (low risk tolerance)."""
        asset_classes = self.get_sample_asset_classes()

        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=0.2,
            time_horizon=5
        )

        result = await optimize_portfolio(params)

        # Conservative portfolios should have lower expected return
        assert result.expected_return < 0.08

        # Should have lower volatility
        assert result.expected_volatility < 0.15

    async def test_optimize_portfolio_aggressive(self):
        """Test aggressive portfolio (high risk tolerance)."""
        asset_classes = self.get_sample_asset_classes()

        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=0.9,
            time_horizon=30
        )

        result = await optimize_portfolio(params)

        # Aggressive portfolios should target higher returns
        assert result.expected_return > 0.08

    async def test_efficient_frontier_generation(self):
        """Test efficient frontier calculation."""
        asset_classes = self.get_sample_asset_classes()

        frontier = await calculate_efficient_frontier(
            asset_classes=asset_classes,
            num_points=10
        )

        assert len(frontier) == 10

        # Each point should have required fields
        for point in frontier:
            assert "expected_return" in point
            assert "expected_volatility" in point
            assert "allocation" in point
            assert "sharpe_ratio" in point

        # Returns should generally increase along frontier
        returns = [p["expected_return"] for p in frontier]
        assert returns[-1] >= returns[0]

    async def test_portfolio_with_constraints(self):
        """Test portfolio optimization with constraints."""
        asset_classes = self.get_sample_asset_classes()

        # Constrain bonds to at least 20%
        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=0.6,
            time_horizon=15,
            constraints={"Bonds_min": 0.20, "Bonds_max": 0.40}
        )

        result = await optimize_portfolio(params)

        # Verify bond constraint is respected
        assert result.allocation.get("Bonds", 0) >= 0.19
        assert result.allocation.get("Bonds", 0) <= 0.41

    async def test_sharpe_ratio_calculation(self):
        """Test Sharpe ratio is correctly calculated."""
        asset_classes = self.get_sample_asset_classes()

        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=0.5,
            time_horizon=15
        )

        result = await optimize_portfolio(params)

        # Sharpe ratio = (return - risk_free_rate) / volatility
        # Risk-free rate is 0.04 in the implementation
        expected_sharpe = (result.expected_return - 0.04) / result.expected_volatility

        assert abs(result.sharpe_ratio - expected_sharpe) < 0.01

    async def test_max_drawdown_estimate(self):
        """Test max drawdown estimate is reasonable."""
        asset_classes = self.get_sample_asset_classes()

        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=0.7,
            time_horizon=20
        )

        result = await optimize_portfolio(params)

        # Max drawdown should be negative and related to volatility
        assert result.max_drawdown_estimate < 0
        assert result.max_drawdown_estimate > -1.0  # Not more than 100%

        # Should be approximately -2 * volatility (per implementation)
        expected_drawdown = -2.0 * result.expected_volatility
        assert abs(result.max_drawdown_estimate - expected_drawdown) < 0.01
