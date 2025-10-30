"""
Goal Management API

CRUD operations for financial goals.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.database import get_db
from app.models import Goal as GoalModel, GoalCategory, GoalPriority


router = APIRouter(tags=["goals"])


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


class GoalUpdate(BaseModel):
    """Update goal request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    priority: Optional[GoalPriority] = None
    target_amount: Optional[float] = Field(None, gt=0)
    target_date: Optional[str] = None  # ISO date string
    current_amount: Optional[float] = Field(None, ge=0)
    monthly_contribution: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None


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

    class Config:
        from_attributes = True
        populate_by_name = True


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(
    goal_data: GoalCreate,
    user_id: str,  # In production, get from auth token
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new financial goal.

    The goal will be analyzed by the AI agents to calculate:
    - Required monthly savings
    - Success probability
    - Recommended asset allocation
    """
    goal = GoalModel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=goal_data.title,
        category=goal_data.category,
        priority=goal_data.priority,
        target_amount=goal_data.target_amount,
        target_date=goal_data.target_date,
        current_amount=goal_data.current_amount,
        monthly_contribution=goal_data.monthly_contribution,
        description=goal_data.description
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    # Trigger AI analysis in background (simplified - would use Celery/RQ in production)
    # asyncio.create_task(analyze_goal_background(goal.id))

    return goal


@router.get("", response_model=List[GoalResponse])
async def list_goals(
    user_id: str,  # In production, get from auth token
    category: Optional[GoalCategory] = None,
    priority: Optional[GoalPriority] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all goals for a user.

    Can be filtered by category and/or priority.
    """
    query = select(GoalModel).where(GoalModel.user_id == user_id)

    if category:
        query = query.where(GoalModel.category == category)

    if priority:
        query = query.where(GoalModel.priority == priority)

    query = query.order_by(GoalModel.priority.desc(), GoalModel.target_date)

    result = await db.execute(query)
    goals = result.scalars().all()

    return goals


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: str,
    user_id: str,  # In production, get from auth token
    db: AsyncSession = Depends(get_db)
):
    """Get a specific goal by ID"""
    result = await db.execute(
        select(GoalModel).where(
            GoalModel.id == goal_id,
            GoalModel.user_id == user_id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return goal


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    goal_data: GoalUpdate,
    user_id: str,  # In production, get from auth token
    db: AsyncSession = Depends(get_db)
):
    """Update a goal"""
    result = await db.execute(
        select(GoalModel).where(
            GoalModel.id == goal_id,
            GoalModel.user_id == user_id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Update fields
    update_data = goal_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)

    return goal


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: str,
    user_id: str,  # In production, get from auth token
    db: AsyncSession = Depends(get_db)
):
    """Delete a goal"""
    result = await db.execute(
        select(GoalModel).where(
            GoalModel.id == goal_id,
            GoalModel.user_id == user_id
        )
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await db.delete(goal)
    await db.commit()

    return None


@router.post("/{goal_id}/analyze")
async def analyze_goal(
    goal_id: str,
    user_id: str,  # In production, get from auth token
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger AI analysis for a specific goal.

    Returns:
        Analysis results including required savings and success probability
    """
    from app.tools import analyze_goal as analyze_goal_tool
    from app.tools.goal_analyzer import Goal as GoalToolModel

    result = await db.execute(
        select(GoalModel).where(
            GoalModel.id == goal_id,
            GoalModel.user_id == user_id
        )
    )
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
        "updated_goal": GoalResponse.from_orm(goal)
    }
