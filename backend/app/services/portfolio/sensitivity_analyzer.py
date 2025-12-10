"""
Sensitivity Analysis Service

Provides one-way and two-way sensitivity analysis for financial planning variables.
Generates tornado diagrams and heat maps showing impact on success probability.
"""

import inspect
from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from app.models.goal import Goal
from .monte_carlo_engine import MonteCarloEngine


def _clone_goal(goal: Goal) -> Goal:
    if hasattr(goal, "model_copy"):
        return goal.model_copy()
    if hasattr(goal, "copy"):
        return goal.copy()
    try:
        return deepcopy(goal)
    except Exception:
        return goal


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


class SensitivityAnalyzer:
    """Sensitivity analysis for goal planning variables"""

    def __init__(self, monte_carlo_engine: MonteCarloEngine):
        self.mc_engine = monte_carlo_engine

    async def _run_simulation(self, goal: Goal, iterations: int):
        result = self.mc_engine.run_simulation(goal=goal, iterations=iterations)
        if inspect.isawaitable(result):
            return await result
        return result

    async def one_way_sensitivity(
        self,
        goal: Goal,
        variables: List[str],
        variation_percentage: float = 0.20,  # ±20% by default
        num_points: int = 5,
        iterations_per_point: int = 1000,
    ) -> Dict[str, Any]:
        """
        One-way sensitivity analysis (Tornado Diagram).

        Args:
            goal: Base goal configuration
            variables: List of variables to test
            variation_percentage: How much to vary each variable (±%)
            num_points: Number of test points per variable
            iterations_per_point: Monte Carlo iterations per point

        Returns:
            Dict with tornado diagram data
        """
        if not 0 < variation_percentage <= 0.5:
            raise ValueError("variation_percentage must be between 0 and 0.5")

        results = {}
        variable_impacts = []

        # Test each variable independently
        for variable in variables:
            impact = await self._test_variable(
                goal=goal,
                variable=variable,
                variation=variation_percentage,
                num_points=num_points,
                iterations=iterations_per_point,
            )
            variable_impacts.append(impact)

        # Sort by impact magnitude (for tornado visualization)
        variable_impacts.sort(key=lambda x: x['impact_range'], reverse=True)

        return {
            'variables': variable_impacts,
            'variable_impacts': variable_impacts,
            'base_success_probability': variable_impacts[0]['baseline'] if variable_impacts else 0.0,
            'analysis_type': 'one_way',
            'variation_percentage': variation_percentage,
        }

    async def _test_variable(
        self,
        goal: Goal,
        variable: str,
        variation: float,
        num_points: int,
        iterations: int,
    ) -> Dict[str, Any]:
        """Test sensitivity for a single variable"""

        base_value = self._get_variable_value(goal, variable)
        test_values = np.linspace(
            base_value * (1 - variation),
            base_value * (1 + variation),
            num_points
        )

        probabilities = []

        for test_value in test_values:
            # Create test goal with modified variable
            test_goal = _clone_goal(goal)
            self._set_variable_value(test_goal, variable, test_value)

            # Run simulation
            result = await self._run_simulation(
                goal=test_goal,
                iterations=iterations,
            )
            probabilities.append(result.success_probability)

        min_prob = min(probabilities)
        max_prob = max(probabilities)
        baseline_prob = probabilities[num_points // 2]  # Middle point
        baseline_value = float(test_values[num_points // 2])
        sensitivity_data = [
            {
                'value': float(value),
                'success_probability': prob,
            }
            for value, prob in zip(test_values, probabilities)
        ]

        return {
            'variable': variable,
            'baseline': baseline_prob,
            'baseline_value': baseline_value,
            'baseline_probability': baseline_prob,
            'min_value': float(test_values[0]),
            'max_value': float(test_values[-1]),
            'min_probability': min_prob,
            'max_probability': max_prob,
            'impact_range': max_prob - min_prob,
            'sensitivity_data': sensitivity_data,
            'probabilities': list(probabilities),
            'test_values': test_values.tolist(),
        }

    async def two_way_sensitivity(
        self,
        goal: Goal,
        variable1: Optional[str] = None,
        variable2: Optional[str] = None,
        variation_percentage: float = 0.20,
        grid_size: int = 10,
        iterations_per_point: int = 500,
        *,
        variable_x: Optional[str] = None,
        variable_y: Optional[str] = None,
        num_points_per_axis: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Two-way sensitivity analysis (Heat Map).

        Args:
            goal: Base goal configuration
            variable1: First variable to test
            variable2: Second variable to test
            variation_percentage: How much to vary each variable
            grid_size: Grid resolution (NxN points)
            iterations_per_point: Monte Carlo iterations per point

        Returns:
            Dict with heat map data
        """

        var1 = variable1 or variable_x
        var2 = variable2 or variable_y
        if var1 is None or var2 is None:
            raise ValueError("Two variables must be specified for sensitivity analysis.")

        if num_points_per_axis is not None:
            grid_size = num_points_per_axis

        if not 0 < variation_percentage <= 0.5:
            raise ValueError("variation_percentage must be between 0 and 0.5")

        base_value1 = self._get_variable_value(goal, var1)
        base_value2 = self._get_variable_value(goal, var2)

        # Create test grids
        test_values1 = np.linspace(
            base_value1 * (1 - variation_percentage),
            base_value1 * (1 + variation_percentage),
            grid_size
        )
        test_values2 = np.linspace(
            base_value2 * (1 - variation_percentage),
            base_value2 * (1 + variation_percentage),
            grid_size
        )

        # Initialize result grid
        probability_grid = np.zeros((grid_size, grid_size))

        # Test all combinations
        for i, val1 in enumerate(test_values1):
            for j, val2 in enumerate(test_values2):
                test_goal = _clone_goal(goal)
                self._set_variable_value(test_goal, var1, val1)
                self._set_variable_value(test_goal, var2, val2)

                result = await self._run_simulation(
                    goal=test_goal,
                    iterations=iterations_per_point,
                )
                probability_grid[i, j] = result.success_probability

        heat_map = probability_grid.tolist()
        result = {
            'variable_x': var1,
            'variable_y': var2,
            'variable1': var1,
            'variable2': var2,
            'test_values_x': test_values1.tolist(),
            'test_values_y': test_values2.tolist(),
            'heat_map_data': heat_map,
            'probability_grid': heat_map,
            'min_probability': float(np.min(probability_grid)),
            'max_probability': float(np.max(probability_grid)),
            'analysis_type': 'two_way',
        }

        if grid_size >= 3:
            levels = np.linspace(result['min_probability'], result['max_probability'], min(grid_size, 10)).tolist()
            result['contour_levels'] = levels

        return result

    async def threshold_analysis(
        self,
        goal: Goal,
        variable: str,
        target_probability: float = 0.90,
        min_value: float | None = None,
        max_value: float | None = None,
        tolerance: float = 0.01,
        max_iterations: int = 50,
    ) -> Dict[str, Any]:
        """
        Find threshold value for a variable to achieve target success probability.

        Args:
            goal: Base goal configuration
            variable: Variable to analyze
            target_probability: Desired success probability
            min_value: Minimum value to test
            max_value: Maximum value to test
            tolerance: Acceptable deviation from target

        Returns:
            Dict with threshold value and analysis
        """

        base_value = self._get_variable_value(goal, variable)

        if min_value is None:
            min_value = base_value * 0.5
        if max_value is None:
            max_value = base_value * 2.0

        # Binary search for threshold
        iterations = 0
        while max_value - min_value > tolerance * base_value and iterations < max_iterations:
            mid_value = (min_value + max_value) / 2

            test_goal = _clone_goal(goal)
            self._set_variable_value(test_goal, variable, mid_value)

            result = await self._run_simulation(
                goal=test_goal,
                iterations=1000,
            )

            if result.success_probability >= target_probability:
                max_value = mid_value
            else:
                min_value = mid_value

            iterations += 1

        threshold_value = (min_value + max_value) / 2

        # Final verification
        final_goal = _clone_goal(goal)
        self._set_variable_value(final_goal, variable, threshold_value)
        final_result = await self._run_simulation(
            goal=final_goal,
            iterations=5000,
        )

        achieved_probability = float(final_result.success_probability)
        effective_tolerance = max(tolerance, 0.05)
        status = (
            "success"
            if achieved_probability >= (target_probability - effective_tolerance)
            else "no_solution"
        )

        return {
            'variable': variable,
            'threshold_value': threshold_value,
            'base_value': base_value,
            'delta': threshold_value - base_value,
            'delta_percentage': ((threshold_value - base_value) / base_value * 100) if base_value else 0.0,
            'achieved_probability': achieved_probability,
            'target_probability': target_probability,
            'status': status,
            'iterations': iterations,
        }

    def _get_variable_value(self, goal: Goal, variable: str) -> float:
        """Get current value of a variable from goal"""
        variable_map = {
            'monthly_contribution': getattr(goal, 'monthly_contribution', None),
            'expected_return_stocks': getattr(goal, 'expected_return_stocks', None),
            'expected_return_bonds': getattr(goal, 'expected_return_bonds', None),
            'inflation_rate': getattr(goal, 'inflation_rate', None),
            'retirement_age': getattr(goal, 'retirement_age', None),
            'life_expectancy': getattr(goal, 'life_expectancy', None),
            'target_amount': getattr(goal, 'target_amount', None),
        }
        if variable not in variable_map or variable_map[variable] is None:
            raise ValueError(f"Unsupported variable '{variable}' for sensitivity analysis.")
        return _safe_float(variable_map[variable])

    def _set_variable_value(self, goal: Goal, variable: str, value: float) -> None:
        """Set value of a variable on goal"""
        if variable == 'monthly_contribution':
            goal.monthly_contribution = value
        elif variable == 'expected_return_stocks':
            goal.expected_return_stocks = value
        elif variable == 'expected_return_bonds':
            goal.expected_return_bonds = value
        elif variable == 'inflation_rate':
            goal.inflation_rate = value
        elif variable == 'retirement_age':
            goal.retirement_age = int(value)
        elif variable == 'life_expectancy':
            goal.life_expectancy = int(value)
        elif variable == 'target_amount':
            goal.target_amount = value
        else:
            raise ValueError(f"Unsupported variable '{variable}' for sensitivity analysis.")

    async def break_even_analysis(
        self,
        goal: Goal,
        variable1: str,
        variable2: str,
        target_probability: float = 0.90,
        grid_size: int = 20,
        iterations_per_point: int = 500,
    ) -> Dict[str, Any]:
        """
        Calculate break-even frontier between two variables.

        Args:
            goal: Base goal configuration
            variable1: First variable (typically cost/risk)
            variable2: Second variable (typically return/contribution)
            target_probability: Target success probability for break-even
            grid_size: Grid resolution for analysis
            iterations_per_point: Monte Carlo iterations per point

        Returns:
            Dict with break-even curve data and analysis
        """

        base_value1 = self._get_variable_value(goal, variable1)
        base_value2 = self._get_variable_value(goal, variable2)

        # Test ranges: ±30% for comprehensive break-even analysis
        test_values1 = np.linspace(
            base_value1 * 0.7,
            base_value1 * 1.3,
            grid_size
        )

        break_even_points = []

        # For each value of variable1, find break-even value of variable2
        for val1 in test_values1:
            # Binary search for break-even value
            min_val2 = base_value2 * 0.5
            max_val2 = base_value2 * 2.0
            tolerance = base_value2 * 0.01

            while max_val2 - min_val2 > tolerance:
                mid_val2 = (min_val2 + max_val2) / 2

                test_goal = _clone_goal(goal)
                self._set_variable_value(test_goal, variable1, val1)
                self._set_variable_value(test_goal, variable2, mid_val2)

                result = await self._run_simulation(
                    goal=test_goal,
                    iterations=iterations_per_point,
                )

                if result.success_probability >= target_probability:
                    max_val2 = mid_val2
                else:
                    min_val2 = mid_val2

            break_even_val2 = (min_val2 + max_val2) / 2
            break_even_points.append({
                variable1: float(val1),
                variable2: float(break_even_val2),
            })

        # Calculate current position relative to break-even curve
        current_delta = self._calculate_break_even_delta(
            goal=goal,
            variable1=variable1,
            variable2=variable2,
            break_even_points=break_even_points,
            base_value1=base_value1,
            base_value2=base_value2,
        )

        return {
            'variable1': variable1,
            'variable2': variable2,
            'break_even_curve': break_even_points,
            'current_value1': base_value1,
            'current_value2': base_value2,
            'target_probability': target_probability,
            'current_delta': current_delta,
            'analysis_type': 'break_even',
        }

    def _calculate_break_even_delta(
        self,
        goal: Goal,
        variable1: str,
        variable2: str,
        break_even_points: List[Dict],
        base_value1: float,
        base_value2: float,
    ) -> Dict[str, Any]:
        """Calculate how far current position is from break-even curve"""

        # Find closest point on break-even curve
        closest_point = min(
            break_even_points,
            key=lambda p: abs(p[variable1] - base_value1)
        )

        required_value2 = closest_point[variable2]
        delta = base_value2 - required_value2
        delta_percentage = (delta / required_value2) * 100 if required_value2 != 0 else 0

        # Determine if current position is above or below break-even
        above_break_even = base_value2 >= required_value2

        return {
            'required_value': required_value2,
            'current_value': base_value2,
            'delta': delta,
            'delta_percentage': delta_percentage,
            'above_break_even': above_break_even,
            'status': 'safe' if above_break_even else 'at_risk',
        }
