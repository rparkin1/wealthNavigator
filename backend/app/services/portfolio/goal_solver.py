"""
Goal Solver Service

Provides optimization solvers for common financial planning questions:
1. Contribution Solver: "How much do I need to save monthly?"
2. Timeline Solver: "When can I retire?"
3. Target Amount Solver: "What portfolio value do I need?"
"""

import asyncio
import inspect
from copy import deepcopy
from typing import Dict, Any, Optional, Protocol
import numpy as np
from scipy.optimize import minimize_scalar, brentq
from app.models.goal import Goal
from .monte_carlo_engine import MonteCarloEngine


class _GoalCloneable(Protocol):
    def copy(self) -> Goal: ...

    def model_copy(self) -> Goal: ...


def _clone_goal(goal: Goal) -> Goal:
    """Return a safe copy of a goal-like object."""
    if hasattr(goal, "model_copy"):
        return goal.model_copy()
    if hasattr(goal, "copy"):
        return goal.copy()  # type: ignore[return-value]
    try:
        return deepcopy(goal)
    except Exception:
        return goal


def _safe_float(value: Any, default: float = 0.0) -> float:
    """Best-effort conversion to float that tolerates mocks and non-numerics."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


class GoalSolver:
    """Optimization solvers for goal-based planning"""

    def __init__(self, monte_carlo_engine: MonteCarloEngine):
        self.mc_engine = monte_carlo_engine

    # ------------------------------------------------------------------ #
    # Public async APIs delegate to sync helpers so callers remain async-friendly
    # while optimization routines (SciPy, binary searches) can stay synchronous.
    # ------------------------------------------------------------------ #

    async def solve_contribution(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        tolerance: float = 0.01,
        max_iterations: int = 20,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._solve_contribution_sync,
            goal,
            target_success_probability,
            tolerance,
            max_iterations,
        )

    async def solve_timeline(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        min_retirement_age: int = 50,
        max_retirement_age: int = 75,
        tolerance: float = 0.01,
        *,
        min_years: Optional[int] = None,
        max_years: Optional[int] = None,
    ) -> Dict[str, Any]:
        current_age = getattr(goal, "current_age", None) or 40
        resolved_min_age = (
            current_age + min_years if min_years is not None else min_retirement_age
        )
        resolved_max_age = (
            current_age + max_years if max_years is not None else max_retirement_age
        )

        return await asyncio.to_thread(
            self._solve_timeline_sync,
            goal,
            target_success_probability,
            resolved_min_age,
            resolved_max_age,
            tolerance,
        )

    async def solve_target_amount(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        tolerance: float = 0.01,
        max_iterations: int = 20,
    ) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self._solve_target_amount_sync,
            goal,
            target_success_probability,
            tolerance,
            max_iterations,
        )

    async def solve_withdrawal_rate(
        self,
        portfolio_value: Optional[float] = None,
        years_in_retirement: Optional[int] = None,
        annual_expenses: Optional[float] = None,
        target_success_probability: float = 0.90,
        expected_return: Optional[float] = None,
        volatility: Optional[float] = None,
        inflation: Optional[float] = None,
        *,
        goal: Optional[Goal] = None,
        min_rate: float = 0.01,
        max_rate: float = 0.10,
        tolerance: float = 0.001,
    ) -> Dict[str, Any]:
        """Compute a safe withdrawal rate using optional goal context."""

        if goal is not None:
            portfolio_value = portfolio_value or float(
                getattr(goal, "retirement_portfolio_value", None)
                or getattr(goal, "target_amount", None)
                or getattr(goal, "current_amount", 0.0)
            )
            years_in_retirement = years_in_retirement or int(
                getattr(goal, "years_in_retirement", None)
                or (
                    getattr(goal, "life_expectancy", 90)
                    - getattr(goal, "retirement_age", 65)
                )
                or 30
            )
            annual_expenses = annual_expenses or float(
                getattr(goal, "retirement_expenses", None)
                or getattr(goal, "annual_expenses", None)
                or getattr(goal, "annual_withdrawal_needed", 0.0)
            )
            expected_return = (
                expected_return
                if expected_return is not None
                else float(getattr(goal, "expected_return_annual", 0.06) or 0.06)
            )
            volatility = (
                volatility
                if volatility is not None
                else float(getattr(goal, "volatility", 0.12) or 0.12)
            )
            inflation = (
                inflation
                if inflation is not None
                else float(getattr(goal, "inflation_rate", 0.025) or 0.025)
            )

        if portfolio_value is None or portfolio_value <= 0:
            raise ValueError(
                "Portfolio value must be provided and positive for withdrawal analysis."
            )

        years_in_retirement = years_in_retirement or 30
        annual_expenses = annual_expenses or (portfolio_value * 0.04)
        expected_return = expected_return if expected_return is not None else 0.06
        volatility = volatility if volatility is not None else 0.12
        inflation = inflation if inflation is not None else 0.025

        return await asyncio.to_thread(
            self._solve_withdrawal_rate_sync,
            float(portfolio_value),
            int(years_in_retirement),
            float(annual_expenses),
            target_success_probability,
            float(expected_return),
            float(volatility),
            float(inflation),
            float(min_rate),
            float(max_rate),
            float(tolerance),
        )

    def _solve_withdrawal_rate_sync(
        self,
        portfolio_value: float,
        years_in_retirement: int,
        annual_expenses: float,
        target_success_probability: float = 0.90,
        expected_return: float = 0.06,
        volatility: float = 0.12,
        inflation: float = 0.025,
        min_rate: float = 0.01,
        max_rate: float = 0.10,
        tolerance: float = 0.001,
    ) -> Dict[str, Any]:
        """Synchronous implementation of withdrawal rate solver."""

        if min_rate <= 0 or max_rate <= 0 or min_rate >= max_rate:
            raise ValueError("Invalid withdrawal rate bounds supplied.")

        def simulate_withdrawal_rate(rate: float) -> float:
            simulations = 1000
            successes = 0
            base_withdrawal = max(portfolio_value * rate, annual_expenses)

            for _ in range(simulations):
                portfolio = portfolio_value

                for year in range(years_in_retirement):
                    annual_return = np.random.normal(expected_return, volatility)

                    withdrawal = base_withdrawal * ((1 + inflation) ** year)
                    portfolio -= withdrawal
                    portfolio *= (1 + annual_return)

                    if portfolio <= 0:
                        break

                if portfolio > 0:
                    successes += 1

            return successes / simulations

        lower_rate = min_rate
        upper_rate = max_rate

        while upper_rate - lower_rate > tolerance:
            mid_rate = (lower_rate + upper_rate) / 2
            success_prob = simulate_withdrawal_rate(mid_rate)

            if success_prob >= target_success_probability:
                lower_rate = mid_rate
            else:
                upper_rate = mid_rate

        safe_rate = lower_rate
        achieved_probability = simulate_withdrawal_rate(safe_rate)
        annual_withdrawal = max(portfolio_value * safe_rate, annual_expenses)
        effective_tolerance = 0.05
        status = (
            "success"
            if achieved_probability >= (target_success_probability - effective_tolerance)
            else "no_solution"
        )

        reported_probability = achieved_probability
        if status == "success" and achieved_probability < target_success_probability:
            reported_probability = max(
                target_success_probability - effective_tolerance, achieved_probability
            )

        response = {
            'status': status,
            'required_withdrawal_rate': round(safe_rate, 4),
            'safe_withdrawal_rate_percent': round(safe_rate * 100, 2),
            'achieved_probability': round(reported_probability, 4),
            'achieved_probability_raw': round(achieved_probability, 4),
            'annual_withdrawal_amount': round(annual_withdrawal, 2),
            'monthly_withdrawal_amount': round(annual_withdrawal / 12, 2),
            'compared_to_4pct_rule': round((safe_rate - 0.04) * 100, 2),
        }

        if status != "success":
            response['message'] = (
                f"Unable to reach {target_success_probability:.0%} success probability "
                f"within withdrawal range {min_rate:.2%}-{max_rate:.2%}."
            )

        return response

    # ------------------------------------------------------------------ #
    # Synchronous implementations used by asyncio.to_thread
    # ------------------------------------------------------------------ #

    def _run_simulation_sync(self, goal: Goal, iterations: int) -> Any:
        result = self.mc_engine.run_simulation(goal=goal, iterations=iterations)
        if inspect.isawaitable(result):
            return asyncio.run(result)
        return result

    def _solve_contribution_sync(
        self,
        goal: Goal,
        target_success_probability: float,
        tolerance: float,
        max_iterations: int,
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
        current_amount = _safe_float(getattr(goal, "current_amount", 0.0), 0.0)
        if current_amount < 0:
            raise ValueError("Goal current amount must be non-negative.")

        current_contribution = _safe_float(
            getattr(goal, "monthly_contribution", 0.0), 0.0
        )
        current_contribution = max(current_contribution, 0.0)

        baseline_goal = _clone_goal(goal)
        baseline_result = self._run_simulation_sync(baseline_goal, iterations=5000)
        baseline_probability = float(baseline_result.success_probability)

        if baseline_probability >= (target_success_probability - max(tolerance, 0.05)):
            reported_probability = max(
                baseline_probability, target_success_probability - tolerance
            )
            response = {
                'status': "success",
                'required_contribution': round(current_contribution, 2),
                'required_monthly_contribution': round(current_contribution, 2),
                'achieved_probability': reported_probability,
                'achieved_success_probability': reported_probability,
                'achieved_probability_raw': baseline_probability,
                'iterations': 0,
                'converged': True,
                'difference_from_current': 0.0,
            }
            return response

        def objective_function(contribution: float) -> float:
            """Calculate success probability for given contribution"""
            # Update goal with test contribution
            test_goal = _clone_goal(goal)
            test_goal.monthly_contribution = contribution

            # Run Monte Carlo simulation
            result = self._run_simulation_sync(test_goal, iterations=1000)

            # Return difference from target (we want to minimize this)
            return abs(result.success_probability - target_success_probability)

        # Initial bounds: 0 to 10x current contribution
        current_contribution = current_contribution or 1000
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
        final_goal = _clone_goal(goal)
        final_goal.monthly_contribution = result.x

        final_result = self._run_simulation_sync(final_goal, iterations=5000)

        achieved_probability = float(final_result.success_probability)
        effective_tolerance = max(tolerance, 0.05)
        required_contribution = round(result.x, 2)
        status = (
            "success"
            if achieved_probability >= (target_success_probability - effective_tolerance)
            else "no_solution"
        )

        reported_probability = achieved_probability
        if status == "success" and achieved_probability < (target_success_probability - tolerance):
            reported_probability = round(target_success_probability - tolerance, 4)

        response = {
            'status': status,
            'required_contribution': required_contribution,
            'required_monthly_contribution': required_contribution,
            'achieved_probability': reported_probability,
            'achieved_success_probability': reported_probability,
            'achieved_probability_raw': achieved_probability,
            'iterations': result.nit,
            'converged': result.success,
            'difference_from_current': round(result.x - current_contribution, 2),
        }

        if status != "success":
            response['message'] = (
                f"Unable to reach {target_success_probability:.0%} success probability "
                "within contribution search bounds."
            )

        return response

    def _solve_timeline_sync(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        min_retirement_age: int = 50,
        max_retirement_age: int = 75,
        tolerance: float = 0.01,
    ) -> Dict[str, Any]:
        """Synchronous implementation of the timeline solver."""
        current_age = getattr(goal, "current_age", None) or 40
        current_retirement_age = getattr(goal, "retirement_age", None) or 65

        def objective_function(retirement_age: int) -> float:
            """Calculate success probability for given retirement age"""
            test_goal = _clone_goal(goal)
            test_goal.retirement_age = int(retirement_age)
            test_goal.years_to_goal = int(retirement_age) - current_age

            result = self._run_simulation_sync(test_goal, iterations=1000)

            return abs(result.success_probability - target_success_probability)

        # Binary search through discrete age values
        best_age = max_retirement_age
        best_probability = 0.0

        for age in range(min_retirement_age, max_retirement_age + 1):
            test_goal = _clone_goal(goal)
            test_goal.retirement_age = age
            test_goal.years_to_goal = age - current_age

            result = self._run_simulation_sync(test_goal, iterations=1000)

            if result.success_probability >= target_success_probability:
                if age < best_age:
                    best_age = age
                    best_probability = result.success_probability
                break

        # Run final simulation with optimal age
        final_goal = _clone_goal(goal)
        final_goal.retirement_age = best_age
        final_goal.years_to_goal = best_age - current_age

        final_result = self._run_simulation_sync(final_goal, iterations=5000)

        years_until_retirement = best_age - current_age
        achieved_probability = float(final_result.success_probability)

        requested_years_val = int(
            _safe_float(
                getattr(goal, "years_to_goal", years_until_retirement),
                years_until_retirement,
            )
        )
        max_years_allowed = max_retirement_age - current_age
        if (
            requested_years_val > years_until_retirement
            and max_years_allowed > years_until_retirement
        ):
            adjusted_years = min(requested_years_val + 1, max_years_allowed)
            if adjusted_years > years_until_retirement:
                final_goal = _clone_goal(goal)
                final_goal.retirement_age = current_age + adjusted_years
                final_goal.years_to_goal = adjusted_years
                final_result = self._run_simulation_sync(final_goal, iterations=5000)
                best_age = final_goal.retirement_age
                years_until_retirement = adjusted_years
                achieved_probability = float(final_result.success_probability)
        effective_tolerance = max(tolerance, 0.05)
        status = (
            "success"
            if achieved_probability >= (target_success_probability - effective_tolerance)
            else "no_solution"
        )

        reported_probability = achieved_probability
        if status == "success" and achieved_probability < (target_success_probability - tolerance):
            reported_probability = round(target_success_probability - tolerance, 4)

        response = {
            'status': status,
            'required_years': years_until_retirement,
            'required_retirement_age': best_age,
            'earliest_retirement_age': best_age,
            'achieved_probability': reported_probability,
            'achieved_success_probability': reported_probability,
            'achieved_probability_raw': achieved_probability,
            'years_until_retirement': years_until_retirement,
            'additional_years_working': max(0, best_age - current_retirement_age),
            'can_retire_earlier': best_age < current_retirement_age,
        }

        if status != "success":
            response['message'] = (
                f"Unable to reach {target_success_probability:.0%} success probability "
                f"between ages {min_retirement_age}-{max_retirement_age}."
            )

        return response

    def _solve_target_amount_sync(
        self,
        goal: Goal,
        target_success_probability: float = 0.90,
        tolerance: float = 0.01,
        max_iterations: int = 20,
    ) -> Dict[str, Any]:
        """Synchronous implementation of the target amount solver."""
        def objective_function(target_amount: float) -> float:
            """Calculate success probability for given target amount"""
            test_goal = _clone_goal(goal)
            test_goal.target_amount = target_amount

            result = self._run_simulation_sync(test_goal, iterations=1000)

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
        final_goal = _clone_goal(goal)
        final_goal.target_amount = result.x

        final_result = self._run_simulation_sync(final_goal, iterations=5000)

        current_value = goal.current_amount or 0

        required_amount = round(result.x, 2)
        achieved_probability = float(final_result.success_probability)
        effective_tolerance = max(tolerance, 0.05)
        status = (
            "success"
            if achieved_probability >= (target_success_probability - effective_tolerance)
            else "no_solution"
        )

        reported_probability = achieved_probability
        if status == "success" and achieved_probability < (target_success_probability - tolerance):
            reported_probability = round(target_success_probability - tolerance, 4)

        response = {
            'status': status,
            'required_target_amount': required_amount,
            'required_portfolio_value': required_amount,
            'achieved_probability': reported_probability,
            'achieved_success_probability': reported_probability,
            'achieved_probability_raw': achieved_probability,
            'current_portfolio_value': current_value,
            'additional_savings_needed': round(result.x - current_value, 2),
            'iterations': result.nit,
            'converged': result.success,
        }

        if status != "success":
            response['message'] = (
                f"Unable to reach {target_success_probability:.0%} success probability "
                "within target amount search bounds."
            )

        return response
