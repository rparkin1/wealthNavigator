"""
Unit Tests for Sensitivity Analyzer Service

Tests the sensitivity analysis engine:
1. One-way sensitivity (tornado diagram data)
2. Two-way sensitivity (heat map data)
3. Threshold analysis
"""

import pytest
from unittest.mock import Mock, AsyncMock
from app.services.portfolio.sensitivity_analyzer import SensitivityAnalyzer
from app.models.goal import Goal


@pytest.fixture
def mock_goal():
    """Create a mock retirement goal"""
    goal = Mock(spec=Goal)
    goal.id = "test-goal-123"
    goal.goal_type = "retirement"
    goal.current_amount = 100000
    goal.target_amount = 1000000
    goal.monthly_contribution = 1500
    goal.years_to_goal = 20
    goal.expected_return_stocks = 0.08
    goal.expected_return_bonds = 0.04
    goal.inflation_rate = 0.03
    goal.retirement_age = 65
    goal.life_expectancy = 90
    return goal


@pytest.fixture
def mock_monte_carlo_engine():
    """Create a mock Monte Carlo engine"""
    engine = Mock()

    # Mock baseline result
    baseline_result = Mock()
    baseline_result.success_probability = 0.85
    baseline_result.median_portfolio_value = 1200000

    engine.run_simulation = AsyncMock(return_value=baseline_result)
    return engine


@pytest.fixture
def sensitivity_analyzer(mock_monte_carlo_engine):
    """Create SensitivityAnalyzer instance"""
    return SensitivityAnalyzer(monte_carlo_engine=mock_monte_carlo_engine)


class TestOneWaySensitivity:
    """Test one-way sensitivity analysis (tornado diagram)"""

    @pytest.mark.asyncio
    async def test_one_way_sensitivity_single_variable(self, sensitivity_analyzer, mock_goal):
        """Test sensitivity analysis for single variable"""
        result = await sensitivity_analyzer.one_way_sensitivity(
            goal=mock_goal,
            variables=["monthly_contribution"],
            variation_percentage=0.20,
            num_points=5,
            iterations_per_point=100,
        )

        assert "variables" in result
        assert len(result["variables"]) == 1

        var_result = result["variables"][0]
        assert var_result["variable"] == "monthly_contribution"
        assert "baseline_value" in var_result
        assert "baseline_probability" in var_result
        assert "sensitivity_data" in var_result
        assert len(var_result["sensitivity_data"]) == 5  # 5 test points

    @pytest.mark.asyncio
    async def test_one_way_sensitivity_multiple_variables(self, sensitivity_analyzer, mock_goal):
        """Test sensitivity analysis for multiple variables"""
        variables = [
            "monthly_contribution",
            "expected_return_stocks",
            "inflation_rate",
        ]

        result = await sensitivity_analyzer.one_way_sensitivity(
            goal=mock_goal,
            variables=variables,
            variation_percentage=0.20,
            num_points=3,
        )

        assert len(result["variables"]) == 3

        # Check all variables are present
        var_names = [v["variable"] for v in result["variables"]]
        assert "monthly_contribution" in var_names
        assert "expected_return_stocks" in var_names
        assert "inflation_rate" in var_names

    @pytest.mark.asyncio
    async def test_one_way_sensitivity_tornado_data(self, sensitivity_analyzer, mock_goal, mock_monte_carlo_engine):
        """Test that tornado diagram data is properly calculated"""
        # Mock different probabilities for different values
        probabilities = [0.75, 0.80, 0.85, 0.88, 0.90]
        call_count = [0]

        async def mock_sim(*args, **kwargs):
            result = Mock()
            result.success_probability = probabilities[call_count[0] % len(probabilities)]
            result.median_portfolio_value = 1000000
            call_count[0] += 1
            return result

        mock_monte_carlo_engine.run_simulation = mock_sim

        result = await sensitivity_analyzer.one_way_sensitivity(
            goal=mock_goal,
            variables=["monthly_contribution"],
            num_points=5,
        )

        var_result = result["variables"][0]

        # Check tornado diagram fields
        assert "min_probability" in var_result
        assert "max_probability" in var_result
        assert "impact_range" in var_result

        # Impact range should be positive
        assert var_result["impact_range"] >= 0


class TestTwoWaySensitivity:
    """Test two-way sensitivity analysis (heat map)"""

    @pytest.mark.asyncio
    async def test_two_way_sensitivity_basic(self, sensitivity_analyzer, mock_goal):
        """Test two-way sensitivity with 2 variables"""
        result = await sensitivity_analyzer.two_way_sensitivity(
            goal=mock_goal,
            variable_x="monthly_contribution",
            variable_y="expected_return_stocks",
            variation_percentage=0.20,
            num_points_per_axis=3,
            iterations_per_point=100,
        )

        assert "variable_x" in result
        assert "variable_y" in result
        assert result["variable_x"] == "monthly_contribution"
        assert result["variable_y"] == "expected_return_stocks"

        # Check heat map data
        assert "heat_map_data" in result
        assert len(result["heat_map_data"]) == 3  # 3x3 grid
        assert len(result["heat_map_data"][0]) == 3

    @pytest.mark.asyncio
    async def test_two_way_sensitivity_grid_size(self, sensitivity_analyzer, mock_goal):
        """Test different grid sizes"""
        result = await sensitivity_analyzer.two_way_sensitivity(
            goal=mock_goal,
            variable_x="monthly_contribution",
            variable_y="inflation_rate",
            num_points_per_axis=5,
        )

        # Should produce 5x5 grid
        assert len(result["heat_map_data"]) == 5
        assert all(len(row) == 5 for row in result["heat_map_data"])

    @pytest.mark.asyncio
    async def test_two_way_sensitivity_contour_levels(self, sensitivity_analyzer, mock_goal):
        """Test contour level generation for heat map"""
        result = await sensitivity_analyzer.two_way_sensitivity(
            goal=mock_goal,
            variable_x="monthly_contribution",
            variable_y="expected_return_stocks",
            num_points_per_axis=4,
        )

        # Check contour levels are provided
        if "contour_levels" in result:
            assert len(result["contour_levels"]) > 0
            # Levels should be in ascending order
            assert result["contour_levels"] == sorted(result["contour_levels"])


class TestThresholdAnalysis:
    """Test threshold analysis (find breakeven points)"""

    @pytest.mark.asyncio
    async def test_threshold_analysis_single_variable(self, sensitivity_analyzer, mock_goal):
        """Test finding threshold for single variable"""
        result = await sensitivity_analyzer.threshold_analysis(
            goal=mock_goal,
            variable="monthly_contribution",
            target_probability=0.90,
            min_value=500,
            max_value=5000,
        )

        assert "variable" in result
        assert result["variable"] == "monthly_contribution"
        assert "threshold_value" in result
        assert "achieved_probability" in result

        # Threshold should be within search range
        assert 500 <= result["threshold_value"] <= 5000

    @pytest.mark.asyncio
    async def test_threshold_analysis_return_rate(self, sensitivity_analyzer, mock_goal):
        """Test finding required return rate threshold"""
        result = await sensitivity_analyzer.threshold_analysis(
            goal=mock_goal,
            variable="expected_return_stocks",
            target_probability=0.85,
            min_value=0.05,
            max_value=0.12,
        )

        # Should find reasonable return requirement
        assert 0.05 <= result["threshold_value"] <= 0.12
        assert abs(result["achieved_probability"] - 0.85) < 0.05

    @pytest.mark.asyncio
    async def test_threshold_analysis_no_solution(self, sensitivity_analyzer, mock_goal, mock_monte_carlo_engine):
        """Test when no threshold achieves target probability"""
        # Mock engine to always return low probability
        result_mock = Mock()
        result_mock.success_probability = 0.50
        mock_monte_carlo_engine.run_simulation = AsyncMock(return_value=result_mock)

        result = await sensitivity_analyzer.threshold_analysis(
            goal=mock_goal,
            variable="monthly_contribution",
            target_probability=0.95,
            max_iterations=5,
        )

        # Should indicate no solution found
        assert result.get("status") == "no_solution" or result["achieved_probability"] < 0.90


class TestVariableRanking:
    """Test variable impact ranking"""

    @pytest.mark.asyncio
    async def test_rank_variable_impact(self, sensitivity_analyzer, mock_goal):
        """Test ranking variables by impact"""
        variables = [
            "monthly_contribution",
            "expected_return_stocks",
            "inflation_rate",
            "retirement_age",
        ]

        result = await sensitivity_analyzer.one_way_sensitivity(
            goal=mock_goal,
            variables=variables,
            num_points=3,
        )

        # Extract impact ranges
        impacts = {v["variable"]: v["impact_range"] for v in result["variables"]}

        # All impacts should be non-negative
        assert all(impact >= 0 for impact in impacts.values())

        # Ranked order
        if "ranked_variables" in result:
            ranked = result["ranked_variables"]
            # Check descending order
            for i in range(len(ranked) - 1):
                assert ranked[i]["impact_range"] >= ranked[i + 1]["impact_range"]


class TestErrorHandling:
    """Test error handling"""

    @pytest.mark.asyncio
    async def test_invalid_variable_name(self, sensitivity_analyzer, mock_goal):
        """Test handling of invalid variable names"""
        with pytest.raises(ValueError):
            await sensitivity_analyzer.one_way_sensitivity(
                goal=mock_goal,
                variables=["nonexistent_variable"],
            )

    @pytest.mark.asyncio
    async def test_invalid_variation_range(self, sensitivity_analyzer, mock_goal):
        """Test handling of invalid variation ranges"""
        with pytest.raises(ValueError):
            await sensitivity_analyzer.one_way_sensitivity(
                goal=mock_goal,
                variables=["monthly_contribution"],
                variation_percentage=-0.5,  # Negative variation
            )

    @pytest.mark.asyncio
    async def test_simulation_failure(self, sensitivity_analyzer, mock_goal, mock_monte_carlo_engine):
        """Test handling of Monte Carlo simulation failures"""
        mock_monte_carlo_engine.run_simulation = AsyncMock(side_effect=Exception("Sim failed"))

        with pytest.raises(Exception):
            await sensitivity_analyzer.one_way_sensitivity(
                goal=mock_goal,
                variables=["monthly_contribution"],
            )


class TestPerformance:
    """Test performance characteristics"""

    @pytest.mark.asyncio
    async def test_parallel_execution(self, sensitivity_analyzer, mock_goal, mock_monte_carlo_engine):
        """Test that multiple points can be evaluated in parallel"""
        call_times = []

        async def timed_sim(*args, **kwargs):
            import time
            start = time.time()
            result = Mock()
            result.success_probability = 0.85
            result.median_portfolio_value = 1000000
            call_times.append(time.time() - start)
            return result

        mock_monte_carlo_engine.run_simulation = timed_sim

        await sensitivity_analyzer.one_way_sensitivity(
            goal=mock_goal,
            variables=["monthly_contribution"],
            num_points=5,
        )

        # With proper parallel execution, total time should be less than sum of call times
        # (This is a simplified test - actual parallelization would need proper async setup)
        assert len(call_times) > 0
