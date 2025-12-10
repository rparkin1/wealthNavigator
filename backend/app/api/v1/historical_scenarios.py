"""
Historical Scenarios API Endpoints

Provides REST API for accessing and applying historical market scenarios
for stress testing and what-if analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.historical_scenario_service import HistoricalScenarioService
from app.models.goal import Goal
from app.api.deps import get_current_user

router = APIRouter()


# Request/Response Models
class ScenarioListResponse(BaseModel):
    """Response model for scenario list"""
    id: str
    name: str
    period: str
    description: Optional[str]
    start_date: str
    end_date: str
    duration_months: int
    max_drawdown_stocks: Optional[float]
    volatility_stocks: Optional[float]
    recovery_months: Optional[int]
    is_featured: bool
    usage_count: int


class ApplyScenarioRequest(BaseModel):
    """Request to apply scenario to goal"""
    goal_id: str = Field(..., description="Goal ID to stress test")
    initial_portfolio_value: float = Field(..., gt=0, description="Starting portfolio value")
    monthly_contribution: float = Field(default=0, ge=0, description="Monthly contributions during period")


class ScenarioResultResponse(BaseModel):
    """Result of applying scenario to goal"""
    scenario_id: str
    scenario_name: str
    initial_value: float
    final_value: float
    total_return: float
    max_drawdown: float
    max_value: float
    min_value: float
    duration_months: int


class CompareRequest(BaseModel):
    """Request to compare multiple scenarios"""
    goal_id: str
    scenario_ids: List[str] = Field(..., min_items=2, max_items=5)
    initial_portfolio_value: float = Field(..., gt=0)
    monthly_contribution: float = Field(default=0, ge=0)


@router.get("/scenarios", response_model=List[ScenarioListResponse])
async def get_all_scenarios(
    featured_only: bool = Query(False, description="Only return featured scenarios"),
    active_only: bool = Query(True, description="Only return active scenarios"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get all available historical market scenarios.

    Returns list of scenarios with metadata (without full return data).
    """
    service = HistoricalScenarioService(db)
    scenarios = await service.get_all_scenarios(
        featured_only=featured_only,
        active_only=active_only,
    )
    return scenarios


@router.get("/scenarios/{scenario_id}")
async def get_scenario_detail(
    scenario_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get full details for a specific scenario including return sequences.
    """
    service = HistoricalScenarioService(db)
    scenario = await service.get_scenario_by_id(scenario_id)

    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    return {
        "id": scenario.id,
        "name": scenario.name,
        "period": scenario.period,
        "description": scenario.description,
        "start_date": scenario.start_date,
        "end_date": scenario.end_date,
        "duration_months": scenario.duration_months,
        "max_drawdown_stocks": scenario.max_drawdown_stocks,
        "max_drawdown_bonds": scenario.max_drawdown_bonds,
        "recovery_months": scenario.recovery_months,
        "volatility_stocks": scenario.volatility_stocks,
        "volatility_bonds": scenario.volatility_bonds,
        "returns_data": scenario.returns_data,
        "key_events": scenario.key_events,
        "source": scenario.source,
        "is_featured": scenario.is_featured,
        "usage_count": scenario.usage_count,
    }


@router.post("/scenarios/{scenario_id}/apply", response_model=ScenarioResultResponse)
async def apply_scenario(
    scenario_id: str,
    request: ApplyScenarioRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Apply a historical scenario to a goal and calculate outcomes.

    Returns portfolio trajectory and key metrics.
    """
    service = HistoricalScenarioService(db)

    # Fetch goal
    goal = db.query(Goal).filter(
        Goal.id == request.goal_id,
        Goal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail=f"Goal {request.goal_id} not found")

    try:
        result = await service.apply_scenario_to_goal(
            goal=goal,
            scenario_id=scenario_id,
            initial_portfolio_value=request.initial_portfolio_value,
            monthly_contribution=request.monthly_contribution,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying scenario: {str(e)}")


@router.post("/scenarios/compare")
async def compare_scenarios(
    request: CompareRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Compare multiple historical scenarios side-by-side.

    Returns comparative metrics and trajectories for all scenarios.
    """
    service = HistoricalScenarioService(db)

    # Fetch goal
    goal = db.query(Goal).filter(
        Goal.id == request.goal_id,
        Goal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail=f"Goal {request.goal_id} not found")

    try:
        result = await service.compare_scenarios(
            goal=goal,
            scenario_ids=request.scenario_ids,
            initial_portfolio_value=request.initial_portfolio_value,
            monthly_contribution=request.monthly_contribution,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing scenarios: {str(e)}")


@router.get("/scenarios/{scenario_id}/statistics")
async def get_scenario_statistics(
    scenario_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get detailed statistical analysis for a scenario.

    Returns mean, median, std dev, correlations, etc.
    """
    service = HistoricalScenarioService(db)

    try:
        stats = await service.get_scenario_statistics(scenario_id)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")


@router.post("/scenarios/initialize")
async def initialize_default_scenarios(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),  # Should be admin only
):
    """
    Initialize database with default historical scenarios.

    Admin-only endpoint to seed scenarios on first setup.
    """
    # TODO: Add admin role check
    service = HistoricalScenarioService(db)

    try:
        count = await service.initialize_default_scenarios()
        return {
            "message": f"Successfully initialized {count} historical scenarios",
            "count": count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing scenarios: {str(e)}")
