"""
Goal Analysis Tool
Calculate funding requirements and progress for financial goals
"""

from typing import Dict, Optional
from pydantic import BaseModel
from datetime import datetime, date
import math


class Goal(BaseModel):
    """Financial goal definition"""
    name: str
    category: str  # retirement, education, home, etc.
    target_amount: float
    target_date: date
    current_funding: float = 0.0
    priority: str = "important"  # essential, important, aspirational
    success_threshold: float = 0.9  # 90% confidence


class GoalAnalysisResult(BaseModel):
    """Goal analysis result"""
    required_monthly_savings: float
    total_required: float
    current_progress_percent: float
    months_to_goal: int
    is_on_track: bool
    recommended_allocation: Dict[str, float]
    success_probability: float


async def analyze_goal(
    goal: Goal,
    expected_return: float = 0.07,
    current_monthly_savings: float = 0.0
) -> GoalAnalysisResult:
    """
    Analyze a financial goal and calculate funding requirements.

    Uses time value of money calculations to determine monthly savings
    needed to reach the goal amount by the target date.

    Args:
        goal: Goal definition with target amount and date
        expected_return: Expected annual portfolio return
        current_monthly_savings: Current amount being saved monthly

    Returns:
        Analysis result with required savings and progress
    """
    # Calculate months to goal
    today = date.today()
    months_to_goal = (goal.target_date.year - today.year) * 12 + \
                     (goal.target_date.month - today.month)

    if months_to_goal <= 0:
        months_to_goal = 1  # Avoid division by zero

    # Convert annual return to monthly
    monthly_return = (1 + expected_return) ** (1/12) - 1

    # Calculate future value of current funding
    fv_current = goal.current_funding * (1 + monthly_return) ** months_to_goal

    # Amount still needed
    amount_needed = max(goal.target_amount - fv_current, 0)

    # Calculate required monthly payment using future value of annuity formula
    # FV = PMT * [(1 + r)^n - 1] / r
    if amount_needed > 0 and monthly_return > 0:
        required_monthly = amount_needed * monthly_return / \
                          ((1 + monthly_return) ** months_to_goal - 1)
    elif amount_needed > 0:
        # If return is 0, simple division
        required_monthly = amount_needed / months_to_goal
    else:
        required_monthly = 0.0

    # Calculate current progress
    if goal.target_amount > 0:
        progress_percent = (goal.current_funding / goal.target_amount) * 100
    else:
        progress_percent = 0.0

    # Check if on track
    is_on_track = current_monthly_savings >= required_monthly

    # Simple success probability (would integrate with Monte Carlo in full implementation)
    if is_on_track:
        success_probability = min(0.95, 0.7 + (current_monthly_savings / required_monthly) * 0.2)
    else:
        success_probability = 0.5 * (current_monthly_savings / required_monthly) if required_monthly > 0 else 0.5

    # Recommended allocation based on time horizon and goal priority
    years_to_goal = months_to_goal / 12
    recommended_allocation = _calculate_glide_path_allocation(
        years_to_goal,
        goal.priority
    )

    return GoalAnalysisResult(
        required_monthly_savings=round(required_monthly, 2),
        total_required=round(goal.target_amount, 2),
        current_progress_percent=round(progress_percent, 2),
        months_to_goal=months_to_goal,
        is_on_track=is_on_track,
        recommended_allocation=recommended_allocation,
        success_probability=round(success_probability, 3)
    )


async def calculate_required_savings(
    target_amount: float,
    years_to_goal: int,
    current_savings: float = 0.0,
    expected_return: float = 0.07
) -> float:
    """
    Calculate required monthly savings to reach a goal.

    Simplified version that just returns the monthly amount needed.

    Args:
        target_amount: Goal amount needed
        years_to_goal: Time horizon in years
        current_savings: Current amount saved
        expected_return: Expected annual return

    Returns:
        Required monthly savings amount
    """
    months = years_to_goal * 12
    monthly_return = (1 + expected_return) ** (1/12) - 1

    # Future value of current savings
    fv_current = current_savings * (1 + monthly_return) ** months

    # Amount still needed
    amount_needed = max(target_amount - fv_current, 0)

    # Calculate monthly payment
    if amount_needed > 0 and monthly_return > 0:
        required_monthly = amount_needed * monthly_return / \
                          ((1 + monthly_return) ** months - 1)
    elif amount_needed > 0:
        required_monthly = amount_needed / months
    else:
        required_monthly = 0.0

    return round(required_monthly, 2)


def _calculate_glide_path_allocation(
    years_to_goal: int,
    priority: str
) -> Dict[str, float]:
    """
    Calculate recommended asset allocation based on time horizon.

    Uses age-based glide path: more stocks when young, more bonds near retirement.

    Args:
        years_to_goal: Years until goal is needed
        priority: Goal priority level

    Returns:
        Recommended allocation dictionary
    """
    # Base allocation on time horizon
    if years_to_goal > 20:
        stock_pct = 0.90
    elif years_to_goal > 10:
        stock_pct = 0.75
    elif years_to_goal > 5:
        stock_pct = 0.60
    elif years_to_goal > 2:
        stock_pct = 0.40
    else:
        stock_pct = 0.20

    # Adjust for priority
    if priority == "essential":
        # More conservative for essential goals
        stock_pct = max(stock_pct - 0.15, 0.20)
    elif priority == "aspirational":
        # More aggressive for aspirational goals
        stock_pct = min(stock_pct + 0.10, 0.95)

    bond_pct = 1.0 - stock_pct

    return {
        "stocks": round(stock_pct, 2),
        "bonds": round(bond_pct, 2)
    }
