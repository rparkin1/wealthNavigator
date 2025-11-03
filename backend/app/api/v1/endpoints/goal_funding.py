"""
Goal Funding Calculations API Endpoints

Handles funding requirements, success probability, and optimization.
Implements REQ-GOAL-007.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.goal_funding_calculator import GoalFundingCalculator
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class FundingRequirementsRequest(BaseModel):
    """Request model for funding requirements calculation"""
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0, ge=0)
    years_to_goal: float = Field(..., gt=0)
    expected_return: float = Field(default=0.07, ge=0, le=0.20)
    inflation_rate: float = Field(default=0.03, ge=0, le=0.10)

    class Config:
        json_schema_extra = {
            "example": {
                "target_amount": 500000,
                "current_amount": 50000,
                "years_to_goal": 20,
                "expected_return": 0.07,
                "inflation_rate": 0.03
            }
        }


class SuccessProbabilityRequest(BaseModel):
    """Request model for success probability calculation"""
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0, ge=0)
    monthly_contribution: float = Field(..., ge=0)
    years_to_goal: float = Field(..., gt=0)
    expected_return: float = Field(default=0.07, ge=0, le=0.20)
    return_volatility: float = Field(default=0.15, ge=0, le=0.50)
    iterations: int = Field(default=5000, ge=1000, le=10000)

    class Config:
        json_schema_extra = {
            "example": {
                "target_amount": 500000,
                "current_amount": 50000,
                "monthly_contribution": 1500,
                "years_to_goal": 20,
                "expected_return": 0.07,
                "return_volatility": 0.15,
                "iterations": 5000
            }
        }


class RequiredSavingsForProbabilityRequest(BaseModel):
    """Request model for calculating required savings for target probability"""
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0, ge=0)
    years_to_goal: float = Field(..., gt=0)
    target_probability: float = Field(default=0.90, ge=0.5, le=0.99)
    expected_return: float = Field(default=0.07, ge=0, le=0.20)
    return_volatility: float = Field(default=0.15, ge=0, le=0.50)

    class Config:
        json_schema_extra = {
            "example": {
                "target_amount": 500000,
                "current_amount": 50000,
                "years_to_goal": 20,
                "target_probability": 0.90,
                "expected_return": 0.07,
                "return_volatility": 0.15
            }
        }


class ContributionOptimizationRequest(BaseModel):
    """Request model for contribution timeline optimization"""
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0, ge=0)
    years_to_goal: float = Field(..., gt=0)
    max_monthly_contribution: float = Field(..., ge=0)
    expected_return: float = Field(default=0.07, ge=0, le=0.20)

    class Config:
        json_schema_extra = {
            "example": {
                "target_amount": 500000,
                "current_amount": 50000,
                "years_to_goal": 20,
                "max_monthly_contribution": 1200,
                "expected_return": 0.07
            }
        }


class CatchUpStrategyRequest(BaseModel):
    """Request model for catch-up strategy calculation"""
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0, ge=0)
    years_remaining: float = Field(..., gt=0)
    years_behind_schedule: float = Field(..., ge=0)
    expected_return: float = Field(default=0.07, ge=0, le=0.20)

    class Config:
        json_schema_extra = {
            "example": {
                "target_amount": 500000,
                "current_amount": 30000,
                "years_remaining": 15,
                "years_behind_schedule": 5,
                "expected_return": 0.07
            }
        }


# Endpoints

@router.post(
    "/calculate-funding-requirements",
    summary="Calculate comprehensive funding requirements"
)
async def calculate_funding_requirements(
    request: FundingRequirementsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate comprehensive funding requirements for a goal.

    Returns:
    - Required monthly and annual savings
    - Lump sum needed today
    - Present value of future contributions
    - Inflation-adjusted target
    - Funding progress percentage

    **REQ-GOAL-007:** Calculate funding requirements for each goal
    """
    result = GoalFundingCalculator.calculate_funding_requirements(
        target_amount=request.target_amount,
        current_amount=request.current_amount,
        years_to_goal=request.years_to_goal,
        expected_return=request.expected_return,
        inflation_rate=request.inflation_rate
    )

    return result


@router.post(
    "/calculate-success-probability",
    summary="Calculate success probability using Monte Carlo"
)
async def calculate_success_probability(
    request: SuccessProbabilityRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate probability of successfully achieving goal using Monte Carlo simulation.

    Runs thousands of simulations with random market returns to estimate:
    - Success probability
    - Expected outcome distribution
    - Shortfall risk
    - Percentile outcomes (10th, 25th, 75th, 90th)

    **REQ-GOAL-007:** Probability of success given current resources and savings rate
    """
    result = GoalFundingCalculator.calculate_success_probability(
        target_amount=request.target_amount,
        current_amount=request.current_amount,
        monthly_contribution=request.monthly_contribution,
        years_to_goal=request.years_to_goal,
        expected_return=request.expected_return,
        return_volatility=request.return_volatility,
        iterations=request.iterations
    )

    return result


@router.post(
    "/required-savings-for-probability",
    summary="Calculate required savings for target probability"
)
async def required_savings_for_probability(
    request: RequiredSavingsForProbabilityRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate required monthly savings to achieve target success probability.

    Uses binary search with Monte Carlo simulation to find the monthly
    contribution that achieves the desired probability (e.g., 90% chance of success).

    **REQ-GOAL-007:** Required monthly/annual savings for probability target
    """
    result = GoalFundingCalculator.calculate_required_savings_for_probability(
        target_amount=request.target_amount,
        current_amount=request.current_amount,
        years_to_goal=request.years_to_goal,
        target_probability=request.target_probability,
        expected_return=request.expected_return,
        return_volatility=request.return_volatility
    )

    return result


@router.post(
    "/optimize-contribution-timeline",
    summary="Optimize contribution timeline"
)
async def optimize_contribution_timeline(
    request: ContributionOptimizationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Optimize contribution timeline given maximum monthly budget.

    If goal is achievable with max contribution:
    - Calculate optimal (lower) monthly amount
    - Show projected surplus

    If timeline extension needed:
    - Calculate additional years required
    - Show shortfall with original timeline
    - Recommend alternatives

    **REQ-GOAL-007:** Lump sum investments needed, timeline optimization
    """
    result = GoalFundingCalculator.optimize_contribution_timeline(
        target_amount=request.target_amount,
        current_amount=request.current_amount,
        years_to_goal=request.years_to_goal,
        max_monthly_contribution=request.max_monthly_contribution,
        expected_return=request.expected_return
    )

    return result


@router.post(
    "/calculate-catch-up-strategy",
    summary="Calculate catch-up strategy for underperforming goals"
)
async def calculate_catch_up_strategy(
    request: CatchUpStrategyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate catch-up strategy for goals that are behind schedule.

    Analyzes:
    - How far behind schedule the goal is
    - Expected vs. actual progress
    - Required monthly savings to catch up
    - Additional contribution needed
    - Feasibility assessment

    **REQ-GOAL-007:** Catch-up calculations for underperforming goals
    """
    result = GoalFundingCalculator.calculate_catch_up_strategy(
        target_amount=request.target_amount,
        current_amount=request.current_amount,
        years_remaining=request.years_remaining,
        years_behind_schedule=request.years_behind_schedule,
        expected_return=request.expected_return
    )

    return result


@router.post(
    "/comprehensive-analysis",
    summary="Comprehensive funding analysis"
)
async def comprehensive_funding_analysis(
    target_amount: float,
    current_amount: float,
    monthly_contribution: float,
    years_to_goal: float,
    expected_return: float = 0.07,
    return_volatility: float = 0.15,
    current_user: User = Depends(get_current_user)
):
    """
    Run comprehensive funding analysis combining multiple calculations.

    Includes:
    1. Funding requirements
    2. Success probability
    3. Required savings for 90% probability
    4. Optimization recommendations

    Returns complete picture of goal funding status.

    **REQ-GOAL-007:** Comprehensive analysis combining all calculations
    """
    # Calculate funding requirements
    funding_req = GoalFundingCalculator.calculate_funding_requirements(
        target_amount=target_amount,
        current_amount=current_amount,
        years_to_goal=years_to_goal,
        expected_return=expected_return
    )

    # Calculate success probability with current contributions
    success_prob = GoalFundingCalculator.calculate_success_probability(
        target_amount=target_amount,
        current_amount=current_amount,
        monthly_contribution=monthly_contribution,
        years_to_goal=years_to_goal,
        expected_return=expected_return,
        return_volatility=return_volatility,
        iterations=5000
    )

    # Calculate required savings for 90% probability
    required_for_90 = GoalFundingCalculator.calculate_required_savings_for_probability(
        target_amount=target_amount,
        current_amount=current_amount,
        years_to_goal=years_to_goal,
        target_probability=0.90,
        expected_return=expected_return,
        return_volatility=return_volatility
    )

    # Determine status
    if success_prob["success_probability"] >= 0.90:
        status = "on_track"
        message = "Goal is on track for high probability of success"
    elif success_prob["success_probability"] >= 0.70:
        status = "fair"
        message = "Goal has fair probability - consider increasing contributions"
    else:
        status = "at_risk"
        message = "Goal is at risk - significant changes needed"

    # Calculate gap
    contribution_gap = required_for_90["required_monthly_savings"] - monthly_contribution

    return {
        "status": status,
        "message": message,
        "funding_requirements": funding_req,
        "current_success_probability": success_prob,
        "required_for_90_percent": required_for_90,
        "monthly_contribution_gap": round(contribution_gap, 2),
        "recommendations": {
            "current_trajectory": f"{success_prob['success_probability']*100:.1f}% success probability with current contributions",
            "to_achieve_90_percent": f"Increase monthly contributions by ${contribution_gap:.2f}" if contribution_gap > 0 else "Current contributions exceed 90% target",
            "alternative_strategies": [
                "Extend timeline to reduce required monthly savings",
                "Make lump sum contribution to close funding gap",
                "Adjust target amount to match available resources"
            ]
        }
    }


@router.get(
    "/funding-calculator-info",
    summary="Get calculator information and formulas"
)
async def get_calculator_info():
    """
    Get information about the funding calculator.

    Returns:
    - Calculation methodologies
    - Formulas used
    - Assumptions
    - Limitations

    Useful for transparency and user education.
    """
    return {
        "methodologies": {
            "funding_requirements": "Time value of money calculations with compound interest",
            "success_probability": "Monte Carlo simulation with random return sampling",
            "optimization": "Binary search algorithms with constraint satisfaction"
        },
        "formulas": {
            "future_value": "FV = PV * (1 + r)^n",
            "pmt_annuity": "PMT = FV * r / [(1 + r)^n - 1]",
            "present_value_annuity": "PV = PMT * [1 - (1 + r)^-n] / r"
        },
        "assumptions": {
            "return_distribution": "Normal distribution of returns",
            "contribution_timing": "End of month contributions",
            "inflation": "Constant inflation rate (default 3%)",
            "taxes": "Not included in basic calculations (see tax-aware optimization)",
            "fees": "Not included (can be incorporated by adjusting return)"
        },
        "monte_carlo_details": {
            "default_iterations": 5000,
            "min_iterations": 1000,
            "max_iterations": 10000,
            "confidence_interval": "Based on percentile distribution",
            "random_seed": "Not fixed - results will vary slightly between runs"
        },
        "limitations": [
            "Assumes constant contribution amounts",
            "Does not account for contribution limit changes",
            "Simplified tax treatment",
            "Market returns assumed normally distributed",
            "Does not model sequence of returns risk in detail"
        ],
        "recommendations": [
            "Use conservative return assumptions",
            "Review and update calculations annually",
            "Consider multiple scenarios",
            "Account for taxes in final planning",
            "Professional advice recommended for complex situations"
        ]
    }
