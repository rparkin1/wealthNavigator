"""
Sensitivity Analysis Service

Provides one-way and two-way sensitivity analysis for financial planning variables.
Generates tornado diagrams and heat maps showing impact on success probability.
"""

from typing import Dict, List, Any, Tuple
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from .monte_carlo_engine import MonteCarloEngine
from app.models.goal import Goal


class SensitivityAnalyzer:
    """Sensitivity analysis for goal planning variables"""

    def __init__(self, monte_carlo_engine: MonteCarloEngine):
        self.mc_engine = monte_carlo_engine

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
            test_goal = goal.copy()
            self._set_variable_value(test_goal, variable, test_value)

            # Run simulation
            result = self.mc_engine.run_simulation(
                goal=test_goal,
                iterations=iterations,
            )
            probabilities.append(result.success_probability)

        min_prob = min(probabilities)
        max_prob = max(probabilities)
        baseline_prob = probabilities[num_points // 2]  # Middle point

        return {
            'variable': variable,
            'baseline': baseline_prob,
            'min_value': float(test_values[0]),
            'max_value': float(test_values[-1]),
            'min_probability': min_prob,
            'max_probability': max_prob,
            'impact_range': max_prob - min_prob,
            'probabilities': probabilities.tolist(),
            'test_values': test_values.tolist(),
        }

    async def two_way_sensitivity(
        self,
        goal: Goal,
        variable1: str,
        variable2: str,
        variation_percentage: float = 0.20,
        grid_size: int = 10,
        iterations_per_point: int = 500,
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

        base_value1 = self._get_variable_value(goal, variable1)
        base_value2 = self._get_variable_value(goal, variable2)

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
                test_goal = goal.copy()
                self._set_variable_value(test_goal, variable1, val1)
                self._set_variable_value(test_goal, variable2, val2)

                result = self.mc_engine.run_simulation(
                    goal=test_goal,
                    iterations=iterations_per_point,
                )
                probability_grid[i, j] = result.success_probability

        return {
            'variable1': variable1,
            'variable2': variable2,
            'test_values1': test_values1.tolist(),
            'test_values2': test_values2.tolist(),
            'probability_grid': probability_grid.tolist(),
            'min_probability': float(np.min(probability_grid)),
            'max_probability': float(np.max(probability_grid)),
            'analysis_type': 'two_way',
        }

    async def threshold_analysis(
        self,
        goal: Goal,
        variable: str,
        target_probability: float = 0.90,
        min_value: float | None = None,
        max_value: float | None = None,
        tolerance: float = 0.01,
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
        while max_value - min_value > tolerance * base_value:
            mid_value = (min_value + max_value) / 2

            test_goal = goal.copy()
            self._set_variable_value(test_goal, variable, mid_value)

            result = self.mc_engine.run_simulation(
                goal=test_goal,
                iterations=1000,
            )

            if result.success_probability >= target_probability:
                max_value = mid_value
            else:
                min_value = mid_value

        threshold_value = (min_value + max_value) / 2

        # Final verification
        final_goal = goal.copy()
        self._set_variable_value(final_goal, variable, threshold_value)
        final_result = self.mc_engine.run_simulation(
            goal=final_goal,
            iterations=5000,
        )

        return {
            'variable': variable,
            'threshold_value': threshold_value,
            'base_value': base_value,
            'delta': threshold_value - base_value,
            'delta_percentage': ((threshold_value - base_value) / base_value) * 100,
            'achieved_probability': final_result.success_probability,
            'target_probability': target_probability,
        }

    def _get_variable_value(self, goal: Goal, variable: str) -> float:
        """Get current value of a variable from goal"""
        variable_map = {
            'monthly_contribution': goal.monthly_contribution,
            'expected_return_stocks': goal.expected_return_stocks,
            'expected_return_bonds': goal.expected_return_bonds,
            'inflation_rate': goal.inflation_rate,
            'retirement_age': goal.retirement_age,
            'life_expectancy': goal.life_expectancy,
            'target_amount': goal.target_amount,
        }
        return variable_map.get(variable, 0.0)

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
