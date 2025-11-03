"""
Unit tests for Goal Funding Calculator

Tests funding requirements, success probability, and optimization calculations.
"""

import pytest
import numpy as np
from app.services.goal_funding_calculator import GoalFundingCalculator


class TestGoalFundingCalculator:
    """Test suite for GoalFundingCalculator"""

    def test_calculate_funding_requirements_basic(self):
        """Test basic funding requirements calculation"""
        result = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=10000,
            years_to_goal=10,
            expected_return=0.07,
            inflation_rate=0.03
        )

        # Should have all required fields
        assert "target_amount" in result
        assert "required_monthly_savings" in result
        assert "required_annual_savings" in result
        assert "lump_sum_needed_today" in result

        # Required monthly should be positive
        assert result["required_monthly_savings"] > 0

        # Lump sum today should be less than remaining need
        assert result["lump_sum_needed_today"] < result["remaining_need"]

    def test_calculate_funding_requirements_zero_current(self):
        """Test funding requirements with zero current amount"""
        result = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=0,
            years_to_goal=20,
            expected_return=0.07
        )

        # Should still calculate valid requirements
        assert result["required_monthly_savings"] > 0
        assert result["remaining_need"] > 0

    def test_calculate_funding_requirements_high_current(self):
        """Test funding requirements when current amount is already high"""
        result = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=95000,
            years_to_goal=10,
            expected_return=0.07
        )

        # Future value of current should exceed target
        assert result["future_value_current"] > result["target_amount"]

        # Remaining need should be minimal or zero
        assert result["remaining_need"] >= 0

    def test_calculate_success_probability_high_contributions(self):
        """Test success probability with high contributions"""
        result = GoalFundingCalculator.calculate_success_probability(
            target_amount=100000,
            current_amount=50000,
            monthly_contribution=2000,
            years_to_goal=5,
            expected_return=0.07,
            return_volatility=0.15,
            iterations=1000  # Lower for speed
        )

        # High contributions should give high success probability
        assert result["success_probability"] > 0.80
        assert result["median_outcome"] > 0

        # Should have percentile data
        assert "percentile_10" in result
        assert "percentile_90" in result
        assert result["percentile_90"] > result["percentile_10"]

    def test_calculate_success_probability_low_contributions(self):
        """Test success probability with insufficient contributions"""
        result = GoalFundingCalculator.calculate_success_probability(
            target_amount=100000,
            current_amount=10000,
            monthly_contribution=100,
            years_to_goal=5,
            expected_return=0.07,
            return_volatility=0.15,
            iterations=1000
        )

        # Low contributions should give low success probability
        assert result["success_probability"] < 0.50

        # Shortfall risk should be high
        assert result["shortfall_risk"] > 0.50

    def test_calculate_success_probability_zero_years(self):
        """Test success probability when goal is immediate"""
        result = GoalFundingCalculator.calculate_success_probability(
            target_amount=100000,
            current_amount=110000,
            monthly_contribution=0,
            years_to_goal=0,
            expected_return=0.07,
            return_volatility=0.15,
            iterations=1000
        )

        # Current amount exceeds target - should be 100% success
        assert result["success_probability"] == 1.0

    def test_calculate_success_probability_zero_years_insufficient(self):
        """Test success probability when goal is immediate but insufficient"""
        result = GoalFundingCalculator.calculate_success_probability(
            target_amount=100000,
            current_amount=50000,
            monthly_contribution=0,
            years_to_goal=0,
            expected_return=0.07,
            return_volatility=0.15,
            iterations=1000
        )

        # Insufficient amount - should be 0% success
        assert result["success_probability"] == 0.0

    def test_required_savings_for_probability_90_percent(self):
        """Test calculation of required savings for 90% probability"""
        result = GoalFundingCalculator.calculate_required_savings_for_probability(
            target_amount=100000,
            current_amount=10000,
            years_to_goal=10,
            target_probability=0.90,
            expected_return=0.07,
            return_volatility=0.15
        )

        # Should calculate required monthly
        assert result["required_monthly_savings"] > 0

        # Estimated probability should be close to target
        # Allow some tolerance due to Monte Carlo randomness
        assert 0.85 <= result["estimated_success_probability"] <= 0.95

    def test_optimize_contribution_timeline_achievable(self):
        """Test timeline optimization when goal is achievable"""
        result = GoalFundingCalculator.optimize_contribution_timeline(
            target_amount=100000,
            current_amount=20000,
            years_to_goal=10,
            max_monthly_contribution=1000,
            expected_return=0.07
        )

        # Should be achievable
        assert result["status"] == "achievable"
        assert result["optimal_monthly_contribution"] <= 1000
        assert result["surplus"] > 0

    def test_optimize_contribution_timeline_needs_extension(self):
        """Test timeline optimization when extension is needed"""
        result = GoalFundingCalculator.optimize_contribution_timeline(
            target_amount=500000,
            current_amount=10000,
            years_to_goal=5,
            max_monthly_contribution=500,
            expected_return=0.07
        )

        # Should need timeline extension
        assert result["status"] == "timeline_extension_needed"
        assert result["required_years"] > result["original_years"]
        assert result["shortfall"] > 0

    def test_calculate_catch_up_strategy_small_deficit(self):
        """Test catch-up strategy with small deficit"""
        result = GoalFundingCalculator.calculate_catch_up_strategy(
            target_amount=100000,
            current_amount=15000,
            years_remaining=10,
            years_behind_schedule=2,
            expected_return=0.07
        )

        # Should have catch-up calculations
        assert result["years_behind_schedule"] == 2
        assert result["catchup_required_monthly"] > result["original_required_monthly"]
        assert result["additional_monthly_needed"] > 0

        # Small deficit should be feasible
        assert result["feasibility"] in ["high", "medium"]

    def test_calculate_catch_up_strategy_large_deficit(self):
        """Test catch-up strategy with large deficit"""
        result = GoalFundingCalculator.calculate_catch_up_strategy(
            target_amount=500000,
            current_amount=10000,
            years_remaining=5,
            years_behind_schedule=10,
            expected_return=0.07
        )

        # Large deficit should be challenging
        assert result["feasibility"] == "challenging"
        assert result["catch_up_percentage"] > 100  # More than double required

    def test_funding_requirements_inflation_adjustment(self):
        """Test that inflation properly adjusts target amount"""
        result_no_inflation = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=10000,
            years_to_goal=10,
            expected_return=0.07,
            inflation_rate=0.00
        )

        result_with_inflation = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=10000,
            years_to_goal=10,
            expected_return=0.07,
            inflation_rate=0.03
        )

        # Inflation-adjusted target should be higher
        assert result_with_inflation["inflation_adjusted_target"] > result_no_inflation["inflation_adjusted_target"]

        # Required monthly should be higher with inflation
        assert result_with_inflation["required_monthly_savings"] > result_no_inflation["required_monthly_savings"]

    def test_monte_carlo_deterministic_no_volatility(self):
        """Test Monte Carlo with zero volatility (should be deterministic)"""
        result = GoalFundingCalculator.calculate_success_probability(
            target_amount=100000,
            current_amount=50000,
            monthly_contribution=500,
            years_to_goal=10,
            expected_return=0.07,
            return_volatility=0.00,  # No volatility
            iterations=1000
        )

        # With no volatility, all percentiles should be very similar
        percentile_range = result["percentile_90"] - result["percentile_10"]
        total_value = result["median_outcome"]

        # Range should be very small relative to total value
        assert percentile_range / total_value < 0.01  # Less than 1% variation

    def test_edge_case_zero_return(self):
        """Test calculations with zero expected return"""
        result = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=10000,
            years_to_goal=10,
            expected_return=0.00,
            inflation_rate=0.00
        )

        # With zero return, should just divide by time
        expected_monthly = (100000 - 10000) / (10 * 12)
        assert abs(result["required_monthly_savings"] - expected_monthly) < 1.0

    def test_funding_percentage_calculation(self):
        """Test funding percentage calculation"""
        result = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=50000,
            years_to_goal=10,
            expected_return=0.07
        )

        # Funding percentage should be reasonable
        assert 0 <= result["funding_percentage"] <= 100

    def test_present_value_contributions(self):
        """Test present value of contributions calculation"""
        result = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=0,
            years_to_goal=10,
            expected_return=0.07
        )

        # PV of future contributions should be positive
        assert result["present_value_future_contributions"] > 0

        # Should be less than total contributions (due to time value)
        total_contributions = result["required_monthly_savings"] * 12 * 10
        assert result["present_value_future_contributions"] < total_contributions

    def test_real_return_calculation(self):
        """Test real return (inflation-adjusted) calculation"""
        result = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=100000,
            current_amount=10000,
            years_to_goal=10,
            expected_return=0.07,
            inflation_rate=0.03
        )

        # Real return should be less than nominal return
        assert result["real_return"] < 0.07

        # Real return should be approximately (1.07/1.03 - 1)
        expected_real = (1.07 / 1.03) - 1
        assert abs(result["real_return"] - expected_real) < 0.001


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
