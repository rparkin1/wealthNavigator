"""
Compatibility wrapper for Monte Carlo simulations used in portfolio services.

The authoritative simulation logic lives in ``app.tools.monte_carlo_engine`` as
function-based utilities.  Historically the service layer imported a class from
``app.services.portfolio.monte_carlo_engine`` and invoked
``run_simulation(goal=..., iterations=...)`` directly.  To preserve that
interface (and keep existing services/tests unchanged) we provide a thin class
wrapper that translates goal inputs into the tool-level ``SimulationParams`` and
delegates to the shared implementation.
"""

from __future__ import annotations

from datetime import date
from typing import Any

import numpy as np

from app.tools.monte_carlo_engine import (
    PortfolioProjection,
    SimulationParams,
    SimulationResult,
    SimulationStatistics,
    run_simulation as run_simulation_function,
)

DEFAULT_TIME_HORIZON_YEARS = 30
DEFAULT_EXPECTED_RETURN = 0.07
DEFAULT_VOLATILITY = 0.15
DEFAULT_INFLATION = 0.02


class MonteCarloEngine:
    """Class-compatible wrapper around the function-based simulation utilities."""

    def __init__(self, *, default_iterations: int = 5000) -> None:
        self.default_iterations = default_iterations

    def run_simulation(
        self,
        *,
        goal: Any,
        iterations: int | None = None,
        monthly_withdrawal: float | None = None,
    ) -> SimulationResult:
        """
        Execute a Monte Carlo simulation using goal data.

        Args:
            goal: Goal-like object (typically ``app.models.goal.Goal`` or a
                Pydantic schema) providing financial attributes.
            iterations: Optional override for simulation repetitions.
            monthly_withdrawal: Optional override for withdrawal amount; falls
                back to goal attributes if present.
        """
        params = self._build_params(goal, iterations, monthly_withdrawal)
        # The shared implementation is async but purely CPU-bound; running it via
        # ``np`` means no awaits.  To avoid mixing event loops we re-implement a
        # synchronous variant here mirroring the tool behaviour.
        return self._run(params)

    # --------------------------------------------------------------------- #
    # Internal helpers
    # --------------------------------------------------------------------- #

    def _build_params(
        self,
        goal: Any,
        iterations: int | None,
        monthly_withdrawal: float | None,
    ) -> SimulationParams:
        """Create simulation parameters from a goal object."""
        current_amount = float(getattr(goal, "current_amount", 0.0) or 0.0)
        monthly_contribution = float(getattr(goal, "monthly_contribution", 0.0) or 0.0)
        withdrawal = (
            float(monthly_withdrawal)
            if monthly_withdrawal is not None
            else float(getattr(goal, "monthly_withdrawal", 0.0) or 0.0)
        )
        inflation = float(getattr(goal, "inflation_rate", DEFAULT_INFLATION) or DEFAULT_INFLATION)
        expected_return = float(
            getattr(goal, "expected_return_annual", DEFAULT_EXPECTED_RETURN) or DEFAULT_EXPECTED_RETURN
        )
        volatility = float(getattr(goal, "volatility", DEFAULT_VOLATILITY) or DEFAULT_VOLATILITY)
        goal_amount = float(getattr(goal, "target_amount", current_amount) or current_amount)

        years_to_goal = getattr(goal, "years_to_goal", None)
        if years_to_goal is None:
            years_to_goal = self._infer_years_to_goal(goal)
        years_to_goal = max(int(years_to_goal or DEFAULT_TIME_HORIZON_YEARS), 1)

        return SimulationParams(
            initial_portfolio_value=current_amount,
            monthly_contribution=monthly_contribution,
            monthly_withdrawal=withdrawal,
            time_horizon=years_to_goal,
            expected_return=expected_return,
            volatility=volatility,
            goal_amount=goal_amount,
            iterations=iterations or self.default_iterations,
            inflation_rate=inflation,
        )

    @staticmethod
    def _infer_years_to_goal(goal: Any) -> int | None:
        """Infer remaining years based on target date metadata if available."""
        target_years = getattr(goal, "years_until_goal", None)
        if target_years is not None:
            return int(target_years)

        target_date = getattr(goal, "target_date", None)
        if not target_date:
            return None

        try:
            if isinstance(target_date, date):
                delta = target_date - date.today()
            else:
                delta = date.fromisoformat(str(target_date)) - date.today()
            years = max(delta.days // 365, 1)
            return years
        except Exception:
            return None

    def _run(self, params: SimulationParams) -> SimulationResult:
        """
        Synchronous Monte Carlo execution mirroring ``run_simulation`` while
        avoiding async event-loop gymnastics inside services.
        """
        months = params.time_horizon * 12
        iterations = params.iterations

        monthly_return = (1 + params.expected_return) ** (1 / 12) - 1
        monthly_volatility = params.volatility / np.sqrt(12)
        monthly_inflation = (1 + params.inflation_rate) ** (1 / 12) - 1

        portfolio_paths = np.zeros((iterations, months + 1))
        portfolio_paths[:, 0] = params.initial_portfolio_value

        for month in range(1, months + 1):
            random_returns = np.random.normal(
                monthly_return - 0.5 * monthly_volatility**2,
                monthly_volatility,
                iterations,
            )

            previous_value = portfolio_paths[:, month - 1]
            portfolio_value = previous_value * np.exp(random_returns)

            inflation_adjustment = (1 + monthly_inflation) ** month
            contribution = params.monthly_contribution * inflation_adjustment
            portfolio_value += contribution

            withdrawal = params.monthly_withdrawal * inflation_adjustment
            portfolio_value = np.maximum(portfolio_value - withdrawal, 0)

            portfolio_paths[:, month] = portfolio_value

        final_values = portfolio_paths[:, -1]
        goal_adjusted = params.goal_amount
        success_count = np.sum(final_values >= goal_adjusted)
        success_probability = success_count / iterations

        statistics = SimulationStatistics(
            median_final_value=float(np.median(final_values)),
            percentile_10=float(np.percentile(final_values, 10)),
            percentile_25=float(np.percentile(final_values, 25)),
            percentile_75=float(np.percentile(final_values, 75)),
            percentile_90=float(np.percentile(final_values, 90)),
            best_case=float(np.max(final_values)),
            worst_case=float(np.min(final_values)),
            probability_of_loss=float(np.sum(final_values < params.initial_portfolio_value) / iterations),
        )

        projections = []
        for year in range(params.time_horizon + 1):
            month_idx = year * 12
            year_values = portfolio_paths[:, month_idx]
            projections.append(
                PortfolioProjection(
                    year=year,
                    median=float(np.median(year_values)),
                    p10=float(np.percentile(year_values, 10)),
                    p25=float(np.percentile(year_values, 25)),
                    p75=float(np.percentile(year_values, 75)),
                    p90=float(np.percentile(year_values, 90)),
                )
            )

        return SimulationResult(
            success_probability=float(success_probability),
            final_portfolio_distribution=final_values.tolist(),
            portfolio_projections=projections,
            statistics=statistics,
            iterations_run=iterations,
        )


__all__ = ["MonteCarloEngine"]
