"""
Monte Carlo Simulation Engine
Probabilistic modeling for goal success analysis
"""

import numpy as np
from typing import Dict, List, Optional
from pydantic import BaseModel


class SimulationParams(BaseModel):
    """Parameters for Monte Carlo simulation"""
    initial_portfolio_value: float
    monthly_contribution: float
    monthly_withdrawal: float = 0.0
    time_horizon: int  # years
    expected_return: float  # annual
    volatility: float  # annual
    goal_amount: float
    iterations: int = 5000
    inflation_rate: float = 0.03


class SimulationStatistics(BaseModel):
    """Statistical results from simulation"""
    median_final_value: float
    percentile_10: float
    percentile_25: float
    percentile_75: float
    percentile_90: float
    best_case: float
    worst_case: float
    probability_of_loss: float


class PortfolioProjection(BaseModel):
    """Portfolio value projections over time"""
    year: int
    median: float
    p10: float  # 10th percentile
    p25: float
    p75: float
    p90: float  # 90th percentile


class SimulationResult(BaseModel):
    """Monte Carlo simulation result"""
    success_probability: float  # Probability of reaching goal
    final_portfolio_distribution: List[float]
    portfolio_projections: List[PortfolioProjection]
    statistics: SimulationStatistics
    iterations_run: int


async def run_simulation(params: SimulationParams) -> SimulationResult:
    """
    Run Monte Carlo simulation to calculate goal success probability.

    Simulates portfolio value over time using geometric Brownian motion
    with contributions/withdrawals. Runs thousands of scenarios to
    calculate probability of meeting financial goals.

    Args:
        params: Simulation parameters (returns, volatility, horizon, etc.)

    Returns:
        Simulation results including success probability and projections
    """
    np.random.seed(None)  # Ensure randomness

    months = params.time_horizon * 12
    iterations = params.iterations

    # Convert annual rates to monthly
    monthly_return = (1 + params.expected_return) ** (1/12) - 1
    monthly_volatility = params.volatility / np.sqrt(12)
    monthly_inflation = (1 + params.inflation_rate) ** (1/12) - 1

    # Initialize portfolio paths matrix
    portfolio_paths = np.zeros((iterations, months + 1))
    portfolio_paths[:, 0] = params.initial_portfolio_value

    # Run simulations
    for month in range(1, months + 1):
        # Generate random returns using geometric Brownian motion
        random_returns = np.random.normal(
            monthly_return - 0.5 * monthly_volatility**2,
            monthly_volatility,
            iterations
        )

        # Update portfolio values
        previous_value = portfolio_paths[:, month - 1]

        # Apply return
        portfolio_value = previous_value * np.exp(random_returns)

        # Add contributions (inflation-adjusted)
        inflation_adjustment = (1 + monthly_inflation) ** month
        contribution = params.monthly_contribution * inflation_adjustment
        portfolio_value += contribution

        # Subtract withdrawals (inflation-adjusted)
        withdrawal = params.monthly_withdrawal * inflation_adjustment
        portfolio_value = np.maximum(portfolio_value - withdrawal, 0)

        portfolio_paths[:, month] = portfolio_value

    # Calculate final values
    final_values = portfolio_paths[:, -1]

    # Calculate success probability
    goal_adjusted = params.goal_amount  # Could inflation-adjust this too
    success_count = np.sum(final_values >= goal_adjusted)
    success_probability = success_count / iterations

    # Calculate statistics
    statistics = SimulationStatistics(
        median_final_value=float(np.median(final_values)),
        percentile_10=float(np.percentile(final_values, 10)),
        percentile_25=float(np.percentile(final_values, 25)),
        percentile_75=float(np.percentile(final_values, 75)),
        percentile_90=float(np.percentile(final_values, 90)),
        best_case=float(np.max(final_values)),
        worst_case=float(np.min(final_values)),
        probability_of_loss=float(np.sum(final_values < params.initial_portfolio_value) / iterations)
    )

    # Calculate projections at each year
    projections = []
    for year in range(params.time_horizon + 1):
        month_idx = year * 12
        year_values = portfolio_paths[:, month_idx]

        projections.append(PortfolioProjection(
            year=year,
            median=float(np.median(year_values)),
            p10=float(np.percentile(year_values, 10)),
            p25=float(np.percentile(year_values, 25)),
            p75=float(np.percentile(year_values, 75)),
            p90=float(np.percentile(year_values, 90))
        ))

    return SimulationResult(
        success_probability=float(success_probability),
        final_portfolio_distribution=final_values.tolist(),
        portfolio_projections=projections,
        statistics=statistics,
        iterations_run=iterations
    )


async def calculate_success_probability(
    current_value: float,
    goal_amount: float,
    monthly_contribution: float,
    years_to_goal: int,
    expected_return: float,
    volatility: float
) -> float:
    """
    Quick calculation of goal success probability.

    Simplified version that just returns the probability, not full simulation data.

    Args:
        current_value: Current portfolio value
        goal_amount: Target amount needed
        monthly_contribution: Monthly savings
        years_to_goal: Time horizon in years
        expected_return: Expected annual return
        volatility: Annual volatility

    Returns:
        Probability of reaching the goal (0.0 to 1.0)
    """
    params = SimulationParams(
        initial_portfolio_value=current_value,
        monthly_contribution=monthly_contribution,
        time_horizon=years_to_goal,
        expected_return=expected_return,
        volatility=volatility,
        goal_amount=goal_amount,
        iterations=5000
    )

    result = await run_simulation(params)
    return result.success_probability
