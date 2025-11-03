"""
Goal Solver Service

Provides optimization solvers for common financial planning questions:
1. Contribution Solver: "How much do I need to save monthly?"
2. Timeline Solver: "When can I retire?"
3. Target Amount Solver: "What portfolio value do I need?"
"""

from typing import Dict, Any, Optional
import numpy as np
from scipy.optimize import minimize_scalar, brentq
from .monte_carlo_engine import MonteCarloEngine
from app.models.goal import Goal


class GoalSolver:
    """Optimization solvers for goal-based planning"""

    def __init__(self, monte_carlo_engine: MonteCarloEngine):
        self.mc_engine = monte_carlo_engine

    async def solve_contribution(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        tolerance: float = 0.01,
        max_iterations: int = 20,
    ) -> Dict[str, Any]:
        """
        Contribution Solver: Find required monthly contribution for target success probability.

        Args:
            goal: Goal object with parameters
            target_success_probability: Desired success probability (0.0-1.0)
            tolerance: Acceptable deviation from target (default 0.01 = 1%)
            max_iterations: Maximum solver iterations

        Returns:
            Dict containing:
                - required_monthly_contribution: float
                - achieved_success_probability: float
                - iterations: int
                - converged: bool
        """

        def objective_function(contribution: float) -> float:
            """Calculate success probability for given contribution"""
            # Update goal with test contribution
            test_goal = goal.copy()
            test_goal.monthly_contribution = contribution

            # Run Monte Carlo simulation
            result = self.mc_engine.run_simulation(
                goal=test_goal,
                iterations=1000,  # Reduced for speed during optimization
            )

            # Return difference from target (we want to minimize this)
            return abs(result.success_probability - target_success_probability)

        # Initial bounds: 0 to 10x current contribution
        current_contribution = goal.monthly_contribution or 1000
        lower_bound = 0
        upper_bound = current_contribution * 10

        # Binary search optimization
        result = minimize_scalar(
            objective_function,
            bounds=(lower_bound, upper_bound),
            method='bounded',
            options={'maxiter': max_iterations, 'xatol': 50}  # $50 tolerance
        )

        # Run final simulation with optimal contribution for accurate result
        final_goal = goal.copy()
        final_goal.monthly_contribution = result.x

        final_result = self.mc_engine.run_simulation(
            goal=final_goal,
            iterations=5000,  # Full iterations for final result
        )

        return {
            'required_monthly_contribution': round(result.x, 2),
            'achieved_success_probability': final_result.success_probability,
            'iterations': result.nit,
            'converged': result.success,
            'difference_from_current': round(result.x - current_contribution, 2),
        }

    async def solve_timeline(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        min_retirement_age: int = 50,
        max_retirement_age: int = 75,
        tolerance: float = 0.01,
    ) -> Dict[str, Any]:
        """
        Timeline Solver: Find earliest retirement age for target success probability.

        Args:
            goal: Goal object with parameters
            target_success_probability: Desired success probability
            min_retirement_age: Minimum retirement age to consider
            max_retirement_age: Maximum retirement age to consider
            tolerance: Acceptable deviation from target

        Returns:
            Dict containing:
                - earliest_retirement_age: int
                - achieved_success_probability: float
                - years_until_retirement: int
                - additional_years_working: int
        """
        current_age = goal.current_age or 40
        current_retirement_age = goal.retirement_age or 65

        def objective_function(retirement_age: int) -> float:
            """Calculate success probability for given retirement age"""
            test_goal = goal.copy()
            test_goal.retirement_age = int(retirement_age)
            test_goal.years_to_goal = int(retirement_age) - current_age

            result = self.mc_engine.run_simulation(
                goal=test_goal,
                iterations=1000,
            )

            return abs(result.success_probability - target_success_probability)

        # Binary search through discrete age values
        best_age = max_retirement_age
        best_probability = 0.0

        for age in range(min_retirement_age, max_retirement_age + 1):
            test_goal = goal.copy()
            test_goal.retirement_age = age
            test_goal.years_to_goal = age - current_age

            result = self.mc_engine.run_simulation(
                goal=test_goal,
                iterations=1000,
            )

            if result.success_probability >= target_success_probability:
                if age < best_age:
                    best_age = age
                    best_probability = result.success_probability
                break

        # Run final simulation with optimal age
        final_goal = goal.copy()
        final_goal.retirement_age = best_age
        final_goal.years_to_goal = best_age - current_age

        final_result = self.mc_engine.run_simulation(
            goal=final_goal,
            iterations=5000,
        )

        return {
            'earliest_retirement_age': best_age,
            'achieved_success_probability': final_result.success_probability,
            'years_until_retirement': best_age - current_age,
            'additional_years_working': max(0, best_age - current_retirement_age),
            'can_retire_earlier': best_age < current_retirement_age,
        }

    async def solve_target_amount(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        tolerance: float = 0.01,
        max_iterations: int = 20,
    ) -> Dict[str, Any]:
        """
        Target Amount Solver: Find required portfolio value at retirement.

        Args:
            goal: Goal object with parameters
            target_success_probability: Desired success probability
            tolerance: Acceptable deviation from target
            max_iterations: Maximum solver iterations

        Returns:
            Dict containing:
                - required_portfolio_value: float
                - achieved_success_probability: float
                - current_portfolio_value: float
                - additional_savings_needed: float
        """

        def objective_function(target_amount: float) -> float:
            """Calculate success probability for given target amount"""
            test_goal = goal.copy()
            test_goal.target_amount = target_amount

            result = self.mc_engine.run_simulation(
                goal=test_goal,
                iterations=1000,
            )

            return abs(result.success_probability - target_success_probability)

        # Initial bounds: 50% to 200% of current target
        current_target = goal.target_amount or 1000000
        lower_bound = current_target * 0.5
        upper_bound = current_target * 2.0

        result = minimize_scalar(
            objective_function,
            bounds=(lower_bound, upper_bound),
            method='bounded',
            options={'maxiter': max_iterations, 'xatol': 1000}  # $1000 tolerance
        )

        # Run final simulation with optimal target
        final_goal = goal.copy()
        final_goal.target_amount = result.x

        final_result = self.mc_engine.run_simulation(
            goal=final_goal,
            iterations=5000,
        )

        current_value = goal.current_amount or 0

        return {
            'required_portfolio_value': round(result.x, 2),
            'achieved_success_probability': final_result.success_probability,
            'current_portfolio_value': current_value,
            'additional_savings_needed': round(result.x - current_value, 2),
            'iterations': result.nit,
            'converged': result.success,
        }

    async def solve_withdrawal_rate(
        self,
        portfolio_value: float,
        years_in_retirement: int,
        annual_expenses: float,
        target_success_probability: float = 0.90,
        expected_return: float = 0.06,
        volatility: float = 0.12,
        inflation: float = 0.025,
    ) -> Dict[str, Any]:
        """
        Withdrawal Rate Solver: Find safe withdrawal rate.

        Args:
            portfolio_value: Starting portfolio value
            years_in_retirement: Planning horizon
            annual_expenses: Base annual spending
            target_success_probability: Desired success probability
            expected_return: Expected portfolio return
            volatility: Portfolio volatility
            inflation: Expected inflation rate

        Returns:
            Dict containing:
                - safe_withdrawal_rate: float (percentage)
                - annual_withdrawal_amount: float
                - success_probability: float
        """

        def simulate_withdrawal_rate(rate: float) -> float:
            """Simulate success probability for given withdrawal rate"""
            simulations = 1000
            successes = 0

            for _ in range(simulations):
                portfolio = portfolio_value
                annual_withdrawal = portfolio * rate

                for year in range(years_in_retirement):
                    # Random return for this year
                    annual_return = np.random.normal(expected_return, volatility)

                    # Withdraw (inflation-adjusted)
                    withdrawal = annual_withdrawal * ((1 + inflation) ** year)
                    portfolio -= withdrawal

                    # Market returns
                    portfolio *= (1 + annual_return)

                    # Check if depleted
                    if portfolio <= 0:
                        break

                if portfolio > 0:
                    successes += 1

            return successes / simulations

        # Binary search for optimal withdrawal rate
        lower_rate = 0.01  # 1%
        upper_rate = 0.10  # 10%

        while upper_rate - lower_rate > 0.001:  # 0.1% precision
            mid_rate = (lower_rate + upper_rate) / 2
            success_prob = simulate_withdrawal_rate(mid_rate)

            if success_prob >= target_success_probability:
                lower_rate = mid_rate
            else:
                upper_rate = mid_rate

        safe_rate = lower_rate
        final_success_prob = simulate_withdrawal_rate(safe_rate)

        return {
            'safe_withdrawal_rate': round(safe_rate * 100, 2),  # As percentage
            'annual_withdrawal_amount': round(portfolio_value * safe_rate, 2),
            'monthly_withdrawal_amount': round(portfolio_value * safe_rate / 12, 2),
            'success_probability': round(final_success_prob, 4),
            'compared_to_4pct_rule': round((safe_rate - 0.04) * 100, 2),
        }
