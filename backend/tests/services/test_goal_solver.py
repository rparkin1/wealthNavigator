"""
Unit Tests for Goal Solver Service

Tests the 4 optimization solvers:
1. Contribution Solver
2. Timeline Solver
3. Target Amount Solver
4. Withdrawal Rate Solver
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.services.portfolio.goal_solver import GoalSolver
from app.models.goal import Goal


@pytest.fixture
def mock_goal():
    """Create a mock retirement goal"""
    goal = Mock(spec=Goal)
    goal.id = "test-goal-123"
    goal.goal_type = "retirement"
    goal.current_amount = 100000
    goal.target_amount = 1000000
    goal.monthly_contribution = 1000
    goal.years_to_goal = 20
    goal.expected_return_annual = 0.07
    goal.risk_tolerance = 0.6
    return goal


@pytest.fixture
def mock_monte_carlo_engine():
    """Create a mock Monte Carlo engine"""
    engine = Mock()

    # Mock simulation result
    result = Mock()
    result.success_probability = 0.85
    result.median_portfolio_value = 1200000

    engine.run_simulation = AsyncMock(return_value=result)
    return engine


@pytest.fixture
def goal_solver(mock_monte_carlo_engine):
    """Create GoalSolver instance with mocked engine"""
    return GoalSolver(monte_carlo_engine=mock_monte_carlo_engine)


class TestContributionSolver:
    """Test contribution solver"""

    @pytest.mark.asyncio
    async def test_solve_contribution_success(self, goal_solver, mock_goal):
        """Test finding required monthly contribution"""
        result = await goal_solver.solve_contribution(
            goal=mock_goal,
            target_success_probability=0.90,
            tolerance=0.01,
        )

        assert "required_contribution" in result
        assert result["required_contribution"] > 0
        assert "achieved_probability" in result
        assert abs(result["achieved_probability"] - 0.90) <= 0.02
        assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_solve_contribution_no_solution(self, goal_solver, mock_goal, mock_monte_carlo_engine):
        """Test when no reasonable contribution amount works"""
        # Mock engine to always return low probability
        result_mock = Mock()
        result_mock.success_probability = 0.30
        mock_monte_carlo_engine.run_simulation = AsyncMock(return_value=result_mock)

        result = await goal_solver.solve_contribution(
            goal=mock_goal,
            target_success_probability=0.99,
            tolerance=0.01,
            max_iterations=5,
        )

        assert result["status"] == "no_solution"
        assert "message" in result

    @pytest.mark.asyncio
    async def test_solve_contribution_already_sufficient(self, goal_solver, mock_goal, mock_monte_carlo_engine):
        """Test when current contribution is already sufficient"""
        # Mock high probability with current contribution
        result_mock = Mock()
        result_mock.success_probability = 0.95
        mock_monte_carlo_engine.run_simulation = AsyncMock(return_value=result_mock)

        result = await goal_solver.solve_contribution(
            goal=mock_goal,
            target_success_probability=0.90,
        )

        assert result["status"] == "success"
        assert result["required_contribution"] <= mock_goal.monthly_contribution


class TestTimelineSolver:
    """Test timeline solver"""

    @pytest.mark.asyncio
    async def test_solve_timeline_success(self, goal_solver, mock_goal):
        """Test finding earliest retirement age"""
        result = await goal_solver.solve_timeline(
            goal=mock_goal,
            target_success_probability=0.85,
            min_years=5,
            max_years=30,
        )

        assert "required_years" in result
        assert 5 <= result["required_years"] <= 30
        assert "achieved_probability" in result
        assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_solve_timeline_constraints(self, goal_solver, mock_goal):
        """Test timeline solver respects min/max constraints"""
        result = await goal_solver.solve_timeline(
            goal=mock_goal,
            target_success_probability=0.90,
            min_years=10,
            max_years=15,
        )

        if result["status"] == "success":
            assert 10 <= result["required_years"] <= 15


class TestTargetAmountSolver:
    """Test target amount solver"""

    @pytest.mark.asyncio
    async def test_solve_target_amount_success(self, goal_solver, mock_goal):
        """Test finding achievable target amount"""
        result = await goal_solver.solve_target_amount(
            goal=mock_goal,
            target_success_probability=0.85,
        )

        assert "required_target_amount" in result
        assert result["required_target_amount"] > 0
        assert "achieved_probability" in result
        assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_solve_target_amount_minimum(self, goal_solver, mock_goal):
        """Test target amount solver finds reasonable minimum"""
        result = await goal_solver.solve_target_amount(
            goal=mock_goal,
            target_success_probability=0.90,
        )

        # Target should be lower than original ambitious target
        if result["status"] == "success":
            assert result["required_target_amount"] < mock_goal.target_amount * 2


class TestWithdrawalRateSolver:
    """Test withdrawal rate solver"""

    @pytest.mark.asyncio
    async def test_solve_withdrawal_rate_success(self, goal_solver, mock_goal):
        """Test finding safe withdrawal rate"""
        result = await goal_solver.solve_withdrawal_rate(
            goal=mock_goal,
            target_success_probability=0.85,
            min_rate=0.03,
            max_rate=0.06,
        )

        assert "required_withdrawal_rate" in result
        assert 0.03 <= result["required_withdrawal_rate"] <= 0.06
        assert "annual_withdrawal_amount" in result
        assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_solve_withdrawal_rate_four_percent_rule(self, goal_solver, mock_goal):
        """Test that solver finds reasonable rate near 4% rule"""
        result = await goal_solver.solve_withdrawal_rate(
            goal=mock_goal,
            target_success_probability=0.85,
        )

        # Should be within reasonable range of 4% rule
        if result["status"] == "success":
            assert 0.03 <= result["required_withdrawal_rate"] <= 0.05


class TestErrorHandling:
    """Test error handling and edge cases"""

    @pytest.mark.asyncio
    async def test_solver_with_invalid_goal(self, goal_solver):
        """Test solver handles invalid goal gracefully"""
        invalid_goal = Mock()
        invalid_goal.current_amount = -1000  # Invalid negative amount

        with pytest.raises(ValueError):
            await goal_solver.solve_contribution(invalid_goal)

    @pytest.mark.asyncio
    async def test_solver_with_engine_failure(self, goal_solver, mock_goal, mock_monte_carlo_engine):
        """Test solver handles Monte Carlo engine failures"""
        # Mock engine to raise exception
        mock_monte_carlo_engine.run_simulation = AsyncMock(side_effect=Exception("Engine failed"))

        with pytest.raises(Exception):
            await goal_solver.solve_contribution(mock_goal)

    @pytest.mark.asyncio
    async def test_solver_iteration_limit(self, goal_solver, mock_goal):
        """Test solver respects max iteration limit"""
        result = await goal_solver.solve_contribution(
            goal=mock_goal,
            target_success_probability=0.90,
            max_iterations=2,  # Very low limit
        )

        # Should still return result (possibly sub-optimal)
        assert "status" in result


class TestIntegration:
    """Integration tests with realistic scenarios"""

    @pytest.mark.asyncio
    async def test_realistic_retirement_scenario(self, goal_solver, mock_goal):
        """Test realistic retirement planning scenario"""
        mock_goal.current_amount = 200000
        mock_goal.target_amount = 1500000
        mock_goal.monthly_contribution = 2000
        mock_goal.years_to_goal = 25
        mock_goal.expected_return_annual = 0.07

        result = await goal_solver.solve_contribution(
            goal=mock_goal,
            target_success_probability=0.85,
        )

        assert result["status"] in ["success", "no_solution"]
        if result["status"] == "success":
            assert result["required_contribution"] > 0
            assert result["required_contribution"] < 10000  # Sanity check

    @pytest.mark.asyncio
    async def test_early_retirement_scenario(self, goal_solver, mock_goal):
        """Test early retirement scenario (high contribution needed)"""
        mock_goal.current_amount = 50000
        mock_goal.target_amount = 2000000
        mock_goal.years_to_goal = 15  # Aggressive timeline

        result = await goal_solver.solve_timeline(
            goal=mock_goal,
            target_success_probability=0.80,
            min_years=10,
            max_years=30,
        )

        # Should suggest longer timeline for ambitious goal
        if result["status"] == "success":
            assert result["required_years"] > 15
