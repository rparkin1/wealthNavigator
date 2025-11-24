"""
Goal Management API

CRUD operations for financial goals.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.database import get_db
from app.models import Goal as GoalModel, GoalCategory, GoalPriority
from app.models.user import User
from app.api.deps import get_current_user
from app.core.config import get_settings


router = APIRouter(tags=["goals"])
settings = get_settings()


class GoalCreate(BaseModel):
    """Create goal request"""
    title: str = Field(..., min_length=1, max_length=255)
    category: GoalCategory
    priority: GoalPriority = GoalPriority.IMPORTANT
    target_amount: float = Field(..., gt=0)
    target_date: str  # ISO date string (YYYY-MM-DD)
    current_amount: float = Field(default=0.0, ge=0)
    monthly_contribution: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None
    expected_return_stocks: float = Field(default=0.07, ge=0.0, description="Expected annual stock return (decimal)")
    expected_return_bonds: float = Field(default=0.04, ge=0.0, description="Expected annual bond return (decimal)")
    inflation_rate: float = Field(default=0.025, ge=0.0, description="Assumed annual inflation (decimal)")
    retirement_age: int = Field(default=65, ge=40, le=80)
    life_expectancy: int = Field(default=90, ge=60, le=120)


class GoalUpdate(BaseModel):
    """Update goal request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    priority: Optional[GoalPriority] = None
    target_amount: Optional[float] = Field(None, gt=0)
    target_date: Optional[str] = None  # ISO date string
    current_amount: Optional[float] = Field(None, ge=0)
    monthly_contribution: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None
    expected_return_stocks: Optional[float] = Field(None, ge=0.0)
    expected_return_bonds: Optional[float] = Field(None, ge=0.0)
    inflation_rate: Optional[float] = Field(None, ge=0.0)
    retirement_age: Optional[int] = Field(None, ge=40, le=90)
    life_expectancy: Optional[int] = Field(None, ge=60, le=120)


class GoalResponse(BaseModel):
    """Goal response - matches frontend Goal interface"""
    id: str
    title: str
    category: GoalCategory
    priority: GoalPriority
    target_amount: float = Field(alias="targetAmount")
    current_amount: float = Field(alias="currentAmount")
    target_date: str = Field(alias="targetDate")  # ISO date string
    monthly_contribution: Optional[float] = Field(None, alias="monthlyContribution")
    success_probability: Optional[float] = Field(None, alias="successProbability")
    status: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


def _goal_to_response(goal: GoalModel) -> GoalResponse:
    """Map Goal ORM model to API response with computed progress status."""
    return GoalResponse(
        id=goal.id,
        title=goal.title,
        category=goal.category,
        priority=goal.priority,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        monthly_contribution=goal.monthly_contribution,
        success_probability=goal.success_probability,
        status=goal.progress_status,
        description=goal.description,
    )

@router.post(
    "",
    response_model=GoalResponse,
    response_model_by_alias=True,
    status_code=201,
)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new financial goal.

    The goal will be analyzed by the AI agents to calculate:
    - Required monthly savings
    - Success probability
    - Recommended asset allocation
    """
    owner_id = current_user.id

    goal = GoalModel(
        id=str(uuid.uuid4()),
        user_id=owner_id,
        title=goal_data.title,
        category=goal_data.category,
        priority=goal_data.priority,
        target_amount=goal_data.target_amount,
        target_date=goal_data.target_date,
        current_amount=goal_data.current_amount,
        monthly_contribution=goal_data.monthly_contribution,
        description=goal_data.description,
        expected_return_stocks=goal_data.expected_return_stocks,
        expected_return_bonds=goal_data.expected_return_bonds,
        inflation_rate=goal_data.inflation_rate,
        retirement_age=goal_data.retirement_age,
        life_expectancy=goal_data.life_expectancy,
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    # Trigger AI analysis in background (simplified - would use Celery/RQ in production)
    # asyncio.create_task(analyze_goal_background(goal.id))

    return _goal_to_response(goal)


@router.get("", response_model=List[GoalResponse], response_model_by_alias=True)
async def list_goals(
    category: Optional[GoalCategory] = None,
    priority: Optional[GoalPriority] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all goals for a user.

    Can be filtered by category and/or priority.
    """
    query = select(GoalModel)
    if not settings.DEBUG:
        query = query.where(GoalModel.user_id == current_user.id)

    if category:
        query = query.where(GoalModel.category == category)

    if priority:
        query = query.where(GoalModel.priority == priority)

    query = query.order_by(GoalModel.priority.desc(), GoalModel.target_date)

    result = await db.execute(query)
    goals = result.scalars().all()

    return [_goal_to_response(goal) for goal in goals]


@router.get("/at-risk")
async def list_at_risk_goals(
    threshold: float = Query(
        0.8,
        ge=0.0,
        le=1.0,
        description="Minimum success probability before a goal is considered at risk",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Identify goals whose success probability falls below the provided threshold."""

    stmt = select(GoalModel).where(
        (GoalModel.success_probability.is_(None)) | (GoalModel.success_probability < threshold)
    )
    result = await db.execute(stmt)
    goals = result.scalars().all()

    at_risk_payload: List[dict] = []
    for goal in goals:
        success_probability = goal.success_probability if goal.success_probability is not None else 0.0
        funding_gap = max(goal.target_amount - goal.current_amount, 0.0)

        recommended_actions = [
            "Increase monthly contribution by $250",
            "Review asset allocation for additional growth opportunities",
            "Consider deferring goal timeline by 6 months",
        ]

        at_risk_payload.append({
            "id": goal.id,
            "title": goal.title,
            "success_probability": round(success_probability, 3),
            "funding_gap": round(funding_gap, 2),
            "recommended_actions": recommended_actions,
        })

    return {
        "threshold": threshold,
        "at_risk_count": len(at_risk_payload),
        "at_risk_goals": at_risk_payload,
    }


@router.get("/{goal_id}", response_model=GoalResponse, response_model_by_alias=True)
async def get_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific goal by ID"""
    query = select(GoalModel).where(GoalModel.id == goal_id)
    if not settings.DEBUG:
        query = query.where(GoalModel.user_id == current_user.id)

    result = await db.execute(query)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return _goal_to_response(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    goal_data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a goal"""
    query = select(GoalModel).where(GoalModel.id == goal_id, GoalModel.user_id == current_user.id)

    result = await db.execute(query)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Update fields
    update_data = goal_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)

    return _goal_to_response(goal)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a goal"""
    query = select(GoalModel).where(GoalModel.id == goal_id, GoalModel.user_id == current_user.id)

    result = await db.execute(query)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await db.delete(goal)
    await db.commit()

    return None


@router.post("/{goal_id}/analyze")
async def analyze_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger AI analysis for a specific goal.

    Returns:
        Analysis results including required savings and success probability
    """
    from app.tools import analyze_goal as analyze_goal_tool
    from app.tools.goal_analyzer import Goal as GoalToolModel

    query = select(GoalModel).where(GoalModel.id == goal_id, GoalModel.user_id == current_user.id)

    result = await db.execute(query)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Convert to tool model
    goal_tool = GoalToolModel(
        name=goal.title,
        category=goal.category,
        target_amount=goal.target_amount,
        target_date=goal.target_date,
        current_funding=goal.current_amount,
        priority=goal.priority
    )

    # Run analysis
    analysis_result = await analyze_goal_tool(goal_tool)

    # Update goal with analysis results
    goal.required_monthly_savings = analysis_result.required_monthly_savings
    goal.success_probability = analysis_result.success_probability
    goal.months_to_goal = analysis_result.months_to_goal

    await db.commit()
    await db.refresh(goal)

    return {
        "goal_id": goal_id,
        "analysis": analysis_result.dict(),
        "updated_goal": _goal_to_response(goal)
    }
