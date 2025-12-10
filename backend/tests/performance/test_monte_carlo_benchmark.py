"""
Monte Carlo Simulation Performance Benchmarks
Target: 5,000 iterations in <30 seconds
"""

import pytest
import time
import numpy as np
import asyncio
from app.tools.monte_carlo_engine import run_simulation, SimulationParams


@pytest.fixture
def simulation_params():
    """Standard simulation configuration for testing"""
    return SimulationParams(
        initial_portfolio_value=500000,
        monthly_contribution=2083,  # $25,000 annual / 12
        monthly_withdrawal=0,  # No withdrawals during accumulation
        time_horizon=30,
        expected_return=0.08,  # 8% expected annual return
        volatility=0.15,  # 15% annual volatility
        goal_amount=2000000,  # $2M retirement goal
        iterations=5000,
        inflation_rate=0.03,
    )


class TestMonteCarloPerformance:
    """Performance benchmarks for Monte Carlo simulation"""

    @pytest.mark.asyncio
    async def test_5000_iterations_under_30_seconds(self, simulation_params):
        """
        Critical benchmark: 5,000 iterations must complete in <30 seconds
        This is a hard requirement for MVP
        """
        start_time = time.time()
        results = await run_simulation(simulation_params)
        execution_time = time.time() - start_time

        # Assertions
        assert execution_time < 30.0, f"Simulation took {execution_time:.2f}s, expected <30s"
        assert results.iterations_run == 5000
        assert results.success_probability >= 0.0
        assert results.success_probability <= 1.0
        assert len(results.portfolio_projections) > 0

        print(f"\n✓ Monte Carlo benchmark: {execution_time:.2f}s for 5,000 iterations")
        print(f"  Success probability: {results.success_probability:.1%}")

    @pytest.mark.asyncio
    async def test_1000_iterations_baseline(self, simulation_params):
        """Baseline: 1,000 iterations should be very fast (<5 seconds)"""
        simulation_params.iterations = 1000

        start_time = time.time()
        results = await run_simulation(simulation_params)
        execution_time = time.time() - start_time

        assert execution_time < 5.0, f"1,000 iterations took {execution_time:.2f}s, expected <5s"
        assert results.iterations_run == 1000

        print(f"\n✓ Baseline: {execution_time:.2f}s for 1,000 iterations")

    @pytest.mark.asyncio
    async def test_10000_iterations_extended(self, simulation_params):
        """Extended test: 10,000 iterations for stress testing"""
        simulation_params.iterations = 10000

        start_time = time.time()
        results = await run_simulation(simulation_params)
        execution_time = time.time() - start_time

        # Should be roughly 2x the 5,000 iteration time (< 60s)
        assert execution_time < 60.0, f"10,000 iterations took {execution_time:.2f}s"
        assert results.iterations_run == 10000

        print(f"\n✓ Extended: {execution_time:.2f}s for 10,000 iterations")

    @pytest.mark.asyncio
    async def test_memory_efficiency(self, simulation_params):
        """Ensure simulation doesn't use excessive memory"""
        try:
            import psutil
            import os

            process = psutil.Process(os.getpid())
            memory_before = process.memory_info().rss / 1024 / 1024  # MB

            results = await run_simulation(simulation_params)

            memory_after = process.memory_info().rss / 1024 / 1024  # MB
            memory_used = memory_after - memory_before

            # Should use <500MB for 5,000 iterations
            assert memory_used < 500, f"Memory usage {memory_used:.0f}MB exceeds 500MB limit"

            print(f"\n✓ Memory usage: {memory_used:.0f}MB")
        except ImportError:
            pytest.skip("psutil not installed")

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "iterations,expected_max_time",
        [
            (100, 2),
            (500, 5),
            (1000, 8),
            (2500, 18),
            (5000, 30),
        ],
    )
    async def test_scaling_performance(
        self, simulation_params, iterations, expected_max_time
    ):
        """Test performance scales linearly with iterations"""
        simulation_params.iterations = iterations

        start_time = time.time()
        results = await run_simulation(simulation_params)
        execution_time = time.time() - start_time

        assert (
            execution_time < expected_max_time
        ), f"{iterations} iterations took {execution_time:.2f}s, expected <{expected_max_time}s"

        print(f"\n✓ {iterations} iterations: {execution_time:.2f}s")

    @pytest.mark.asyncio
    async def test_result_consistency(self, simulation_params):
        """Verify results are statistically consistent"""
        # Run simulation twice
        results1 = await run_simulation(simulation_params)
        results2 = await run_simulation(simulation_params)

        # Success probabilities should be within 5% of each other
        prob_diff = abs(results1.success_probability - results2.success_probability)
        assert prob_diff < 0.05, f"Success probability variance too high: {prob_diff:.2%}"

        # Median values should be within 10% of each other
        median_diff = abs(
            results1.statistics.median_final_value - results2.statistics.median_final_value
        ) / results1.statistics.median_final_value
        assert median_diff < 0.10, f"Median value variance too high: {median_diff:.2%}"

        print(f"\n✓ Results consistent:")
        print(f"  Success prob variance: {prob_diff:.2%}")
        print(f"  Median value variance: {median_diff:.2%}")


class TestPortfolioOptimizationPerformance:
    """Performance benchmarks for portfolio optimization"""

    @pytest.mark.asyncio
    async def test_optimization_under_5_seconds(self):
        """Portfolio optimization should complete in <5 seconds"""
        from app.tools.portfolio_optimizer import optimize_portfolio, AssetClass, OptimizationParams

        # Test data - create AssetClass objects
        asset_classes = [
            AssetClass(name="US Stocks", expected_return=0.10, volatility=0.18),
            AssetClass(name="International Stocks", expected_return=0.09, volatility=0.20),
            AssetClass(name="Bonds", expected_return=0.04, volatility=0.06),
            AssetClass(name="REITs", expected_return=0.08, volatility=0.15),
            AssetClass(name="Cash", expected_return=0.02, volatility=0.01),
        ]

        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=0.6,  # Moderate risk tolerance
            time_horizon=10,
        )

        start_time = time.time()
        result = await optimize_portfolio(params)
        execution_time = time.time() - start_time

        assert execution_time < 5.0, f"Optimization took {execution_time:.2f}s, expected <5s"
        assert result.allocation is not None
        assert result.expected_return > 0
        assert result.expected_volatility > 0

        print(f"\n✓ Portfolio optimization: {execution_time:.2f}s")


# Run benchmarks with: pytest tests/performance/test_monte_carlo_benchmark.py -v -s
# For quick test: pytest tests/performance/test_monte_carlo_benchmark.py::TestMonteCarloPerformance::test_1000_iterations_baseline -v -s
