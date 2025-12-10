"""
Portfolio Optimization Tool
Modern Portfolio Theory (MPT) implementation using mean-variance optimization
"""

import numpy as np
from scipy.optimize import minimize
from typing import Dict, List, Optional
from pydantic import BaseModel


class AssetClass(BaseModel):
    """Asset class with expected returns and risk metrics"""
    name: str
    expected_return: float  # Annual expected return (e.g., 0.08 for 8%)
    volatility: float  # Annual volatility/standard deviation
    weight: float = 0.0  # Current allocation weight


class OptimizationParams(BaseModel):
    """Parameters for portfolio optimization"""
    asset_classes: List[AssetClass]
    risk_tolerance: float  # 0.0 (conservative) to 1.0 (aggressive)
    time_horizon: int  # Years until goal
    correlation_matrix: Optional[List[List[float]]] = None
    constraints: Optional[Dict[str, float]] = None  # min/max per asset class


class OptimizationResult(BaseModel):
    """Portfolio optimization result"""
    allocation: Dict[str, float]  # {asset_class: weight}
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    max_drawdown_estimate: float


async def optimize_portfolio(params: OptimizationParams) -> OptimizationResult:
    """
    Optimize portfolio allocation using Modern Portfolio Theory.

    Uses mean-variance optimization to find the portfolio on the efficient frontier
    that matches the user's risk tolerance.

    Args:
        params: Optimization parameters including asset classes, risk tolerance, and constraints

    Returns:
        Optimal portfolio allocation with expected metrics
    """
    n_assets = len(params.asset_classes)

    # Extract returns and volatilities
    returns = np.array([ac.expected_return for ac in params.asset_classes])
    volatilities = np.array([ac.volatility for ac in params.asset_classes])

    # Create correlation matrix (default to moderate correlation if not provided)
    if params.correlation_matrix:
        corr_matrix = np.array(params.correlation_matrix)
    else:
        # Default correlation matrix with moderate positive correlation
        corr_matrix = np.eye(n_assets)
        for i in range(n_assets):
            for j in range(n_assets):
                if i != j:
                    corr_matrix[i, j] = 0.3  # Moderate correlation

    # Create covariance matrix
    cov_matrix = np.outer(volatilities, volatilities) * corr_matrix

    # Risk-free rate (assume 4% for now - should come from market data)
    risk_free_rate = 0.04

    # Target return based on risk tolerance
    # Higher risk tolerance = target higher returns
    min_return = returns.min()
    max_return = returns.max()
    target_return = min_return + params.risk_tolerance * (max_return - min_return)

    # Objective function: minimize volatility for target return
    def portfolio_volatility(weights):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

    def portfolio_return(weights):
        return np.dot(weights, returns)

    # Constraints
    constraints = [
        {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},  # Weights sum to 1
        {'type': 'ineq', 'fun': lambda w: portfolio_return(w) - target_return}  # Return >= target
    ]

    # Bounds (default 0% to 100% per asset, can be overridden)
    bounds = []
    for ac in params.asset_classes:
        if params.constraints and ac.name in params.constraints:
            min_weight = params.constraints.get(f"{ac.name}_min", 0.0)
            max_weight = params.constraints.get(f"{ac.name}_max", 1.0)
        else:
            min_weight, max_weight = 0.0, 1.0
        bounds.append((min_weight, max_weight))

    # Initial guess: equal weights
    initial_weights = np.array([1.0 / n_assets] * n_assets)

    # Optimize
    result = minimize(
        portfolio_volatility,
        initial_weights,
        method='SLSQP',
        bounds=bounds,
        constraints=constraints,
        options={'maxiter': 1000}
    )

    # Calculate metrics
    optimal_weights = result.x
    opt_return = portfolio_return(optimal_weights)
    opt_volatility = portfolio_volatility(optimal_weights)
    sharpe_ratio = (opt_return - risk_free_rate) / opt_volatility if opt_volatility > 0 else 0

    # Estimate max drawdown (simplified: -2 * volatility)
    max_drawdown = -2.0 * opt_volatility

    # Create allocation dictionary
    allocation = {
        ac.name: float(optimal_weights[i])
        for i, ac in enumerate(params.asset_classes)
    }

    return OptimizationResult(
        allocation=allocation,
        expected_return=float(opt_return),
        expected_volatility=float(opt_volatility),
        sharpe_ratio=float(sharpe_ratio),
        max_drawdown_estimate=float(max_drawdown)
    )


async def calculate_efficient_frontier(
    asset_classes: List[AssetClass],
    correlation_matrix: Optional[List[List[float]]] = None,
    num_points: int = 50
) -> List[Dict[str, float]]:
    """
    Calculate the efficient frontier - set of optimal portfolios.

    Returns a list of portfolios with varying risk/return profiles.
    Useful for visualization.

    Args:
        asset_classes: List of available asset classes
        correlation_matrix: Correlation between assets
        num_points: Number of points to calculate on the frontier

    Returns:
        List of portfolios on the efficient frontier, each with
        risk, return, and allocation data
    """
    frontier_portfolios = []

    # Calculate portfolios across risk tolerance spectrum
    for i in range(num_points):
        risk_tolerance = i / (num_points - 1)  # 0.0 to 1.0

        params = OptimizationParams(
            asset_classes=asset_classes,
            risk_tolerance=risk_tolerance,
            time_horizon=10,  # Default horizon
            correlation_matrix=correlation_matrix
        )

        result = await optimize_portfolio(params)

        frontier_portfolios.append({
            "risk_tolerance": risk_tolerance,
            "expected_return": result.expected_return,
            "expected_volatility": result.expected_volatility,
            "sharpe_ratio": result.sharpe_ratio,
            "allocation": result.allocation
        })

    return frontier_portfolios
