"""
Goal Milestones API Endpoints

Handles milestone creation, tracking, auto-generation, and progress metrics.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, ConfigDict

from app.core.database import get_db
from app.services.goal_milestone_service import GoalMilestoneService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class MilestoneCreate(BaseModel):
    """Request model for creating a milestone"""
    title: str = Field(..., min_length=1, max_length=200)
    target_amount: Optional[float] = Field(None, ge=0)
    target_date: Optional[str] = Field(None, description="ISO format date YYYY-MM-DD")
    description: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class MilestoneUpdate(BaseModel):
    """Request model for updating a milestone"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    target_amount: Optional[float] = Field(None, ge=0)
    target_date: Optional[str] = Field(None)
    description: Optional[str] = Field(None, max_length=500)
    completed: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class MilestoneResponse(BaseModel):
    """Response model for milestone"""
    id: str
    title: str
    target_amount: Optional[float]
    target_date: Optional[str]
    description: Optional[str]
    completed: bool
    completed_date: Optional[str]
    created_at: str
    auto_generated: Optional[bool]

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class ProgressCheckResponse(BaseModel):
    """Response model for progress check"""
    total_milestones: int
    completed_milestones: int
    progress_percentage: float
    newly_completed: List[dict]

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class ProgressMetricsResponse(BaseModel):
    """Response model for comprehensive progress metrics"""
    goal_id: str
    progress_percentage: float
    time_progress: float
    milestone_progress: float
    on_track: bool
    current_velocity: float
    required_velocity: float
    velocity_gap: float
    completed_milestones: int
    total_milestones: int
    status: str

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class UpcomingMilestone(BaseModel):
    """Model for upcoming milestone"""
    id: str
    title: str
    target_date: str
    target_amount: Optional[float]
    goal_id: str
    goal_title: str
    goal_category: str
    days_until: int


# Endpoints

@router.post(
    "/{goal_id}/milestones",
    response_model=MilestoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create milestone"
)
async def create_milestone(
    goal_id: str,
    milestone: MilestoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new milestone for a goal.

    Milestones help track progress with specific targets and dates.
    """
    try:
        created = await GoalMilestoneService.create_milestone(
            db=db,
            goal_id=goal_id,
            title=milestone.title,
            target_amount=milestone.target_amount,
            target_date=milestone.target_date,
            description=milestone.description
        )

        return MilestoneResponse(**created)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/{goal_id}/milestones",
    response_model=List[MilestoneResponse],
    summary="Get all milestones"
)
async def get_milestones(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all milestones for a goal.

    Returns milestones sorted by target date.
    """
    try:
        milestones = await GoalMilestoneService.get_milestones(
            db=db,
            goal_id=goal_id
        )

        return [MilestoneResponse(**m) for m in milestones]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{goal_id}/milestones/{milestone_id}",
    response_model=MilestoneResponse,
    summary="Update milestone"
)
async def update_milestone(
    goal_id: str,
    milestone_id: str,
    updates: MilestoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing milestone.

    Only provided fields will be updated.
    """
    try:
        # Filter out None values
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}

        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided"
            )

        updated = await GoalMilestoneService.update_milestone(
            db=db,
            goal_id=goal_id,
            milestone_id=milestone_id,
            updates=update_dict
        )

        return MilestoneResponse(**updated)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete(
    "/{goal_id}/milestones/{milestone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete milestone"
)
async def delete_milestone(
    goal_id: str,
    milestone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a milestone.
    """
    try:
        await GoalMilestoneService.delete_milestone(
            db=db,
            goal_id=goal_id,
            milestone_id=milestone_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post(
    "/{goal_id}/milestones/{milestone_id}/complete",
    response_model=MilestoneResponse,
    summary="Complete milestone"
)
async def complete_milestone(
    goal_id: str,
    milestone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a milestone as completed.

    Automatically checks if goal should be marked as achieved.
    """
    try:
        completed = await GoalMilestoneService.complete_milestone(
            db=db,
            goal_id=goal_id,
            milestone_id=milestone_id
        )

        return MilestoneResponse(**completed)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post(
    "/{goal_id}/milestones/auto-generate",
    response_model=List[MilestoneResponse],
    summary="Auto-generate milestones"
)
async def auto_generate_milestones(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Automatically generate milestones based on goal parameters.

    Generation strategy:
    - Long-term goals (10+ years): Quarterly for 2 years, then annual
    - Medium-term goals (5-10 years): Quarterly for 1 year, then semi-annual
    - Short-term goals (<5 years): Quarterly throughout

    Milestones are evenly distributed with proportional target amounts.
    """
    try:
        milestones = await GoalMilestoneService.auto_generate_milestones(
            db=db,
            goal_id=goal_id
        )

        return [MilestoneResponse(**m) for m in milestones]

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post(
    "/{goal_id}/milestones/check-progress",
    response_model=ProgressCheckResponse,
    summary="Check milestone progress"
)
async def check_progress(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check progress and auto-complete milestones if targets are met.

    Auto-completes milestones when:
    - Current amount >= target amount
    - Target date has passed AND current amount >= target amount
    """
    try:
        progress = await GoalMilestoneService.check_milestone_progress(
            db=db,
            goal_id=goal_id
        )

        return ProgressCheckResponse(**progress)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/{goal_id}/progress-metrics",
    response_model=ProgressMetricsResponse,
    summary="Get comprehensive progress metrics"
)
async def get_progress_metrics(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive progress metrics for a goal.

    Includes:
    - Financial progress (% of target amount reached)
    - Time progress (% of time elapsed)
    - Milestone progress (% of milestones completed)
    - On-track status (actual >= 90% of expected)
    - Current velocity ($/month actually saving)
    - Required velocity ($/month needed to meet goal)
    - Velocity gap (shortfall or surplus)
    """
    try:
        metrics = await GoalMilestoneService.calculate_progress_metrics(
            db=db,
            goal_id=goal_id
        )

        return ProgressMetricsResponse(**metrics)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/users/{user_id}/milestones/upcoming",
    response_model=List[UpcomingMilestone],
    summary="Get upcoming milestones"
)
async def get_upcoming_milestones(
    user_id: str,
    days_ahead: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get upcoming milestones across all goals.

    Default: Next 30 days

    Useful for dashboard notifications and reminders.
    """
    milestones = await GoalMilestoneService.get_upcoming_milestones(
        db=db,
        user_id=user_id,
        days_ahead=days_ahead
    )

    return [UpcomingMilestone(**m) for m in milestones]


@router.get(
    "/users/{user_id}/milestones/overdue",
    summary="Get overdue milestones"
)
async def get_overdue_milestones(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all overdue incomplete milestones.

    Returns milestones past their target date that haven't been completed.

    Sorted by days overdue (most overdue first).
    """
    milestones = await GoalMilestoneService.get_overdue_milestones(
        db=db,
        user_id=user_id
    )

    return {"overdue_milestones": milestones, "count": len(milestones)}
