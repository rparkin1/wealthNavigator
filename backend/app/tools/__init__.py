"""
Financial Planning Tools

Pre-built tools that agents can use for calculations and analysis.
Agents should import and use these tools, NOT reimplement the logic.
"""

from .portfolio_optimizer import optimize_portfolio, calculate_efficient_frontier
from .monte_carlo_engine import run_simulation, calculate_success_probability
from .goal_analyzer import analyze_goal, calculate_required_savings
from .risk_assessor import assess_risk, calculate_var
from .tax_calculator import optimize_asset_location, calculate_tax_alpha

__all__ = [
    "optimize_portfolio",
    "calculate_efficient_frontier",
    "run_simulation",
    "calculate_success_probability",
    "analyze_goal",
    "calculate_required_savings",
    "assess_risk",
    "calculate_var",
    "optimize_asset_location",
    "calculate_tax_alpha",
]
