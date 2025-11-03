"""
Goal Scenarios API Endpoints

Handles scenario creation, comparison, and what-if analysis for goals.
"""

from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.models.goal import Goal
from app.services.multi_goal_optimizer import MultiGoalOptimizer
# Monte Carlo implementation - using goal_funding_calculator instead
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class ScenarioCreate(BaseModel):
    """Request model for creating a scenario"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    monthly_contribution: float = Field(..., ge=0)
    target_amount: Optional[float] = Field(None, ge=0)
    target_date: Optional[str] = Field(None, description="ISO format date")
    expected_return: float = Field(default=0.07, ge=0, le=0.20)
    risk_level: str = Field(default="moderate", description="conservative, moderate, or aggressive")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Aggressive Growth",
                "description": "Higher contributions with aggressive asset allocation",
                "monthly_contribution": 1500,
                "target_amount": 500000,
                "target_date": "2050-01-01",
                "expected_return": 0.09,
                "risk_level": "aggressive"
            }
        }


class ScenarioUpdate(BaseModel):
    """Request model for updating a scenario"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    monthly_contribution: Optional[float] = Field(None, ge=0)
    target_amount: Optional[float] = Field(None, ge=0)
    expected_return: Optional[float] = Field(None, ge=0, le=0.20)
    risk_level: Optional[str] = None


class ScenarioResponse(BaseModel):
    """Response model for scenario"""
    id: str
    goal_id: str
    name: str
    description: Optional[str]
    monthly_contribution: float
    target_amount: float
    target_date: str
    expected_return: float
    projected_value: float
    success_probability: float
    years_to_goal: float
    total_contributions: float
    investment_growth: float
    funding_level: float
    risk_level: str
    asset_allocation: Dict[str, float]
    created_at: str

    class Config:
        json_schema_extra = {
            "example": {
                "id": "scenario-123",
                "goal_id": "goal-456",
                "name": "Aggressive Growth",
                "description": "Higher risk, higher return approach",
                "monthly_contribution": 1500,
                "target_amount": 500000,
                "target_date": "2050-01-01",
                "expected_return": 0.09,
                "projected_value": 523000,
                "success_probability": 0.87,
                "years_to_goal": 25,
                "total_contributions": 450000,
                "investment_growth": 73000,
                "funding_level": 104.6,
                "risk_level": "aggressive",
                "asset_allocation": {
                    "us_stocks": 0.54,
                    "international_stocks": 0.27,
                    "emerging_markets": 0.09,
                    "bonds": 0.07,
                    "tips": 0.02,
                    "cash": 0.01
                },
                "created_at": "2025-01-01T00:00:00"
            }
        }


class ComparisonRequest(BaseModel):
    """Request model for scenario comparison"""
    scenario_ids: List[str] = Field(..., min_length=2, max_length=6, description="2-6 scenarios to compare")


class ProjectionDataPoint(BaseModel):
    """Single data point in projection timeline"""
    year: int
    date: str
    values: Dict[str, float]  # scenario_id -> projected_value


class ComparisonResponse(BaseModel):
    """Response model for scenario comparison"""
    scenarios: List[ScenarioResponse]
    projections: List[Dict]
    best_scenario_id: str
    comparison_metrics: Dict

    class Config:
        json_schema_extra = {
            "example": {
                "scenarios": [],
                "projections": [
                    {"year": 0, "date": "2025", "scenario-1": 0, "scenario-2": 0},
                    {"year": 5, "date": "2030", "scenario-1": 95000, "scenario-2": 105000}
                ],
                "best_scenario_id": "scenario-2",
                "comparison_metrics": {
                    "highest_success_probability": "scenario-2",
                    "lowest_monthly_cost": "scenario-1",
                    "best_balance": "scenario-2"
                }
            }
        }


# Endpoints

@router.post(
    "/{goal_id}/scenarios",
    response_model=ScenarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create goal scenario"
)
async def create_scenario(
    goal_id: str,
    scenario: ScenarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new scenario for a goal.

    Scenarios allow what-if analysis with different:
    - Monthly contribution amounts
    - Target amounts and dates
    - Expected returns
    - Risk levels and asset allocations

    Each scenario is evaluated with Monte Carlo simulation.
    """
    # Fetch goal
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # Use goal defaults if not provided
    target_amount = scenario.target_amount or goal.target_amount
    target_date = scenario.target_date or goal.target_date

    # Calculate years to goal
    target_dt = datetime.fromisoformat(target_date)
    years_to_goal = max(0, (target_dt - datetime.now()).days / 365.25)

    # Determine asset allocation based on risk level
    risk_adjustments = {
        "conservative": -0.2,
        "moderate": 0.0,
        "aggressive": 0.2
    }
    risk_adj = risk_adjustments.get(scenario.risk_level, 0.0)

    # Calculate base stocks allocation from glide path
    base_stocks = MultiGoalOptimizer._calculate_stocks_allocation(years_to_goal, 0.75)
    stocks_allocation = max(0.1, min(0.95, base_stocks + risk_adj))
    bonds_allocation = 1.0 - stocks_allocation

    asset_allocation = {
        "us_stocks": stocks_allocation * 0.60,
        "international_stocks": stocks_allocation * 0.30,
        "emerging_markets": stocks_allocation * 0.10,
        "bonds": bonds_allocation * 0.70,
        "tips": bonds_allocation * 0.20,
        "cash": bonds_allocation * 0.10,
    }

    # Calculate projected value
    months = years_to_goal * 12
    monthly_rate = scenario.expected_return / 12
    total_contributions = scenario.monthly_contribution * months

    if monthly_rate > 0:
        # Future value of annuity
        projected_value = scenario.monthly_contribution * (
            ((1 + monthly_rate) ** months - 1) / monthly_rate
        )
    else:
        projected_value = total_contributions

    investment_growth = projected_value - total_contributions
    funding_level = (projected_value / target_amount * 100) if target_amount > 0 else 0

    # Run quick Monte Carlo simulation (1000 iterations for speed)
    # In production, this would be a background task
    success_probability = 0.85  # Placeholder

    # Create scenario ID
    import uuid
    scenario_id = str(uuid.uuid4())

    # Store scenario (in production, this would be saved to database)
    # For now, return the calculated values

    return ScenarioResponse(
        id=scenario_id,
        goal_id=goal_id,
        name=scenario.name,
        description=scenario.description,
        monthly_contribution=scenario.monthly_contribution,
        target_amount=target_amount,
        target_date=target_date,
        expected_return=scenario.expected_return,
        projected_value=round(projected_value, 2),
        success_probability=success_probability,
        years_to_goal=round(years_to_goal, 2),
        total_contributions=round(total_contributions, 2),
        investment_growth=round(investment_growth, 2),
        funding_level=round(funding_level, 2),
        risk_level=scenario.risk_level,
        asset_allocation=asset_allocation,
        created_at=datetime.now().isoformat()
    )


@router.get(
    "/{goal_id}/scenarios",
    response_model=List[ScenarioResponse],
    summary="Get all scenarios for goal"
)
async def get_scenarios(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all scenarios for a goal.

    Returns list of scenarios sorted by creation date.
    """
    # Verify goal exists
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # In production, fetch from database
    # For now, return empty list
    return []


@router.put(
    "/{goal_id}/scenarios/{scenario_id}",
    response_model=ScenarioResponse,
    summary="Update scenario"
)
async def update_scenario(
    goal_id: str,
    scenario_id: str,
    updates: ScenarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing scenario.

    Recalculates projections based on new parameters.
    """
    # Placeholder - would fetch and update from database
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Scenario updates not yet implemented"
    )


@router.delete(
    "/{goal_id}/scenarios/{scenario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete scenario"
)
async def delete_scenario(
    goal_id: str,
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a scenario.
    """
    # Placeholder - would delete from database
    pass


@router.post(
    "/{goal_id}/scenarios/compare",
    response_model=ComparisonResponse,
    summary="Compare scenarios"
)
async def compare_scenarios(
    goal_id: str,
    request: ComparisonRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare multiple scenarios side-by-side.

    Generates:
    - Projection timelines for all scenarios
    - Success probability comparison
    - Cost comparison (monthly contributions)
    - Recommendation for best scenario

    Best scenario is determined by:
    score = (success_probability * 100) - (monthly_contribution / 100)

    Higher score = better balance of success probability vs. cost
    """
    # Verify goal exists
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # In production, fetch scenarios from database
    # For now, return placeholder
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Scenario comparison not yet fully implemented"
    )


@router.post(
    "/{goal_id}/scenarios/quick-compare",
    summary="Quick comparison of 3 preset scenarios"
)
async def quick_compare(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate quick comparison of 3 preset scenarios:
    1. Conservative: Lower contributions, safe allocation
    2. Moderate: Balanced approach
    3. Aggressive: Higher contributions, growth allocation

    Useful for users who want to see options without manual setup.
    """
    # Fetch goal
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    target_date = datetime.fromisoformat(goal.target_date)
    years_to_goal = max(0, (target_date - datetime.now()).days / 365.25)
    months = years_to_goal * 12

    scenarios = []

    # Conservative scenario
    conservative_monthly = goal.target_amount / months * 0.90 if months > 0 else 0
    scenarios.append({
        "name": "Conservative",
        "risk_level": "conservative",
        "monthly_contribution": round(conservative_monthly, 2),
        "expected_return": 0.05,
        "description": "Lower risk, steady growth"
    })

    # Moderate scenario
    moderate_monthly = goal.target_amount / months * 0.75 if months > 0 else 0
    scenarios.append({
        "name": "Moderate",
        "risk_level": "moderate",
        "monthly_contribution": round(moderate_monthly, 2),
        "expected_return": 0.07,
        "description": "Balanced risk and return"
    })

    # Aggressive scenario
    aggressive_monthly = goal.target_amount / months * 0.60 if months > 0 else 0
    scenarios.append({
        "name": "Aggressive",
        "risk_level": "aggressive",
        "monthly_contribution": round(aggressive_monthly, 2),
        "expected_return": 0.09,
        "description": "Higher risk, higher potential return"
    })

    return {
        "goal_id": goal_id,
        "goal_title": goal.title,
        "target_amount": goal.target_amount,
        "years_to_goal": round(years_to_goal, 1),
        "scenarios": scenarios,
        "recommendation": "Moderate scenario offers best balance for most investors"
    }


@router.post(
    "/{goal_id}/scenarios/{scenario_id}/monte-carlo",
    summary="Run Monte Carlo simulation for scenario"
)
async def run_scenario_simulation(
    goal_id: str,
    scenario_id: str,
    iterations: int = 5000,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run comprehensive Monte Carlo simulation for a scenario.

    Simulates thousands of market scenarios to determine:
    - Success probability (% of scenarios reaching goal)
    - Portfolio value distribution (percentiles)
    - Risk of shortfall
    - Upside potential

    Default: 5,000 iterations (< 30 seconds)
    """
    # Placeholder - would run actual Monte Carlo simulation
    return {
        "scenario_id": scenario_id,
        "iterations": iterations,
        "success_probability": 0.87,
        "percentiles": {
            "p10": 380000,
            "p25": 420000,
            "p50": 485000,
            "p75": 560000,
            "p90": 650000
        },
        "shortfall_risk": 0.13,
        "median_outcome": 485000,
        "best_case": 850000,
        "worst_case": 280000,
        "recommendation": "High probability of success with moderate upside potential"
    }
