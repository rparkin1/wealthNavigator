"""
Unit tests for Goal Analyzer
"""

import pytest
from datetime import date, timedelta
from app.tools.goal_analyzer import (
    analyze_goal,
    calculate_required_savings,
    Goal,
)


@pytest.mark.unit
@pytest.mark.asyncio
class TestGoalAnalyzer:
    """Test goal analysis functions."""

    async def test_analyze_goal_retirement(self):
        """Test goal analysis for retirement goal."""
        target_date = date.today() + timedelta(days=365 * 25)
        goal = Goal(
            name="Retirement",
            category="retirement",
            target_amount=2000000,
            target_date=target_date,
            current_funding=100000,
            priority="essential"
        )

        result = await analyze_goal(
            goal=goal,
            expected_return=0.07,
            current_monthly_savings=2000
        )

        assert result.required_monthly_savings > 0
        assert result.total_required == 2000000
        assert result.months_to_goal > 0
        assert 0 <= result.current_progress_percent <= 100
        assert 0 <= result.success_probability <= 1
        assert "stocks" in result.recommended_allocation
        assert "bonds" in result.recommended_allocation

    async def test_calculate_required_savings(self):
        """Test required savings calculation."""
        monthly_savings = await calculate_required_savings(
            target_amount=1000000,
            years_to_goal=20,
            current_savings=50000,
            expected_return=0.08
        )

        # Monthly savings should be positive
        assert monthly_savings > 0
        assert monthly_savings < 10000  # Sanity check

    async def test_short_time_horizon(self):
        """Test goal with short time horizon (1 year)."""
        target_date = date.today() + timedelta(days=365)
        goal = Goal(
            name="Home Down Payment",
            category="home",
            target_amount=100000,
            target_date=target_date,
            current_funding=50000,
            priority="important"
        )

        result = await analyze_goal(goal=goal)

        # Should recommend conservative allocation for short horizon
        assert result.recommended_allocation["bonds"] > 0.5
        assert result.months_to_goal <= 12

    async def test_long_time_horizon(self):
        """Test goal with long time horizon (30 years)."""
        target_date = date.today() + timedelta(days=365 * 30)
        goal = Goal(
            name="Retirement",
            category="retirement",
            target_amount=2000000,
            target_date=target_date,
            current_funding=100000,
            priority="essential"
        )

        result = await analyze_goal(goal=goal)

        # Should recommend more aggressive allocation for long horizon
        assert result.recommended_allocation["stocks"] > 0.6

    async def test_on_track_goal(self):
        """Test goal that is on track."""
        target_date = date.today() + timedelta(days=365 * 10)
        goal = Goal(
            name="Education Fund",
            category="education",
            target_amount=200000,
            target_date=target_date,
            current_funding=50000,
            priority="important"
        )

        result = await analyze_goal(
            goal=goal,
            current_monthly_savings=1500
        )

        # Check if on track
        if result.required_monthly_savings <= 1500:
            assert result.is_on_track is True
            assert result.success_probability > 0.7

    async def test_aspirational_goal(self):
        """Test aspirational goal gets more aggressive allocation."""
        target_date = date.today() + timedelta(days=365 * 15)
        goal = Goal(
            name="Vacation Home",
            category="major_expense",
            target_amount=500000,
            target_date=target_date,
            current_funding=50000,
            priority="aspirational"
        )

        result = await analyze_goal(goal=goal)

        # Aspirational goals should have higher stock allocation
        assert result.recommended_allocation["stocks"] >= 0.60
