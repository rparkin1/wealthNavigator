"""
Goal Dependencies API Endpoints

Handles goal dependency relationships, shared resource allocation, and goal trees.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.goal import GoalDependencyType
from app.services.goal_dependency_service import GoalDependencyService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class DependencyCreate(BaseModel):
    """Request model for creating a goal dependency"""
    depends_on_goal_id: str = Field(..., description="Goal that must be satisfied first")
    dependency_type: GoalDependencyType = Field(..., description="Type of dependency")

    class Config:
        json_schema_extra = {
            "example": {
                "depends_on_goal_id": "goal-123",
                "dependency_type": "sequential"
            }
        }


class DependencyResponse(BaseModel):
    """Response model for dependency information"""
    goal_id: str
    depends_on_goal_id: str
    dependency_type: str
    status: str

    class Config:
        json_schema_extra = {
            "example": {
                "goal_id": "goal-456",
                "depends_on_goal_id": "goal-123",
                "dependency_type": "sequential",
                "status": "blocked"
            }
        }


class SharedResourceAllocationRequest(BaseModel):
    """Request model for shared resource allocation"""
    total_monthly_savings: float = Field(..., gt=0, description="Total available monthly savings")

    class Config:
        json_schema_extra = {
            "example": {
                "total_monthly_savings": 5000.0
            }
        }


class SharedResourceAllocationResponse(BaseModel):
    """Response model for shared resource allocation"""
    allocations: dict[str, float]
    total_allocated: float
    unallocated: float

    class Config:
        json_schema_extra = {
            "example": {
                "allocations": {
                    "goal-123": 2000.0,
                    "goal-456": 1500.0,
                    "goal-789": 1000.0
                },
                "total_allocated": 4500.0,
                "unallocated": 500.0
            }
        }


class ConflictCheckResponse(BaseModel):
    """Response model for conflict checking"""
    conflicts: List[dict]
    has_conflicts: bool

    class Config:
        json_schema_extra = {
            "example": {
                "conflicts": [
                    {
                        "goal1": "goal-123",
                        "goal2": "goal-456",
                        "conflict": "mutually_exclusive",
                        "message": "Goals 'Retire at 50' and 'Retire at 60' are mutually exclusive"
                    }
                ],
                "has_conflicts": True
            }
        }


# Endpoints

@router.get(
    "",
    response_model=List[DependencyResponse],
    summary="Get all goal dependencies"
)
async def get_all_dependencies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all goal dependencies for the current user.

    Returns a list of all dependency relationships between the user's goals.
    """
    from sqlalchemy import select
    from app.models.goal import Goal

    # Query all goals with dependencies for the current user
    result = await db.execute(
        select(Goal).where(
            Goal.user_id == current_user.id,
            Goal.depends_on_goal_id.isnot(None)
        )
    )
    goals_with_dependencies = result.scalars().all()

    # Convert to response format
    dependencies = []
    for goal in goals_with_dependencies:
        dependencies.append(
            DependencyResponse(
                goal_id=goal.id,
                depends_on_goal_id=goal.depends_on_goal_id,
                dependency_type=goal.dependency_type.value if goal.dependency_type else "unknown",
                status=goal.status or "active"
            )
        )

    return dependencies


@router.post(
    "/{goal_id}/dependencies",
    response_model=DependencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create goal dependency"
)
async def create_dependency(
    goal_id: str,
    dependency: DependencyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a dependency relationship between two goals.

    - **goal_id**: The dependent goal (requires another goal to complete first)
    - **depends_on_goal_id**: The goal that must be satisfied first
    - **dependency_type**: Type of dependency (sequential, conditional, shared_resource, mutually_exclusive)

    Prevents circular dependencies.
    """
    try:
        success = await GoalDependencyService.create_dependency(
            db=db,
            dependent_goal_id=goal_id,
            depends_on_goal_id=dependency.depends_on_goal_id,
            dependency_type=dependency.dependency_type
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create dependency"
            )

        return DependencyResponse(
            goal_id=goal_id,
            depends_on_goal_id=dependency.depends_on_goal_id,
            dependency_type=dependency.dependency_type.value,
            status="blocked" if dependency.dependency_type == GoalDependencyType.SEQUENTIAL else "active"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete(
    "/{goal_id}/dependencies",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove goal dependency"
)
async def remove_dependency(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove the dependency relationship from a goal.

    The goal will become independent and can be activated immediately.
    """
    from sqlalchemy import select, update
    from app.models.goal import Goal

    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    goal.depends_on_goal_id = None
    goal.dependency_type = None
    goal.status = "active"

    await db.commit()


@router.get(
    "/users/{user_id}/goal-tree",
    summary="Get goal dependency tree"
)
async def get_goal_tree(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get hierarchical goal tree with all dependencies.

    Returns root goals and their dependent goals in a tree structure.
    """
    tree = await GoalDependencyService.get_goal_tree(
        db=db,
        user_id=user_id
    )

    return tree


@router.post(
    "/users/{user_id}/shared-resources/allocate",
    response_model=SharedResourceAllocationResponse,
    summary="Allocate shared resources across goals"
)
async def allocate_shared_resources(
    user_id: str,
    request: SharedResourceAllocationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allocate monthly savings across all active goals based on priority.

    Allocation priority:
    1. Essential goals with nearest target dates
    2. Important goals with nearest target dates
    3. Aspirational goals

    Returns recommended allocation per goal.
    """
    allocations = await GoalDependencyService.allocate_shared_resources(
        db=db,
        user_id=user_id,
        total_monthly_savings=request.total_monthly_savings
    )

    total_allocated = sum(allocations.values())
    unallocated = request.total_monthly_savings - total_allocated

    return SharedResourceAllocationResponse(
        allocations=allocations,
        total_allocated=total_allocated,
        unallocated=unallocated
    )


@router.post(
    "/check-conflicts",
    response_model=ConflictCheckResponse,
    summary="Check for goal conflicts"
)
async def check_conflicts(
    goal_ids: List[str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check for mutually exclusive goal conflicts.

    Returns list of conflicting goal pairs.
    """
    conflicts = await GoalDependencyService.check_mutually_exclusive_goals(
        db=db,
        goal_ids=goal_ids
    )

    return ConflictCheckResponse(
        conflicts=conflicts,
        has_conflicts=len(conflicts) > 0
    )


@router.get(
    "/users/{user_id}/timeline",
    summary="Calculate goal timeline"
)
async def calculate_timeline(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate sequential timeline for all goals considering dependencies.

    Returns goals in dependency-aware chronological order.
    """
    timeline = await GoalDependencyService.calculate_goal_timeline(
        db=db,
        user_id=user_id
    )

    return {"timeline": timeline}


@router.post(
    "/{goal_id}/unblock",
    status_code=status.HTTP_200_OK,
    summary="Manually unblock a goal"
)
async def unblock_goal(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually unblock a goal that is waiting on dependencies.

    Use this to override dependency requirements when needed.
    """
    from sqlalchemy import select
    from app.models.goal import Goal

    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    if goal.status == "blocked":
        goal.status = "active"
        await db.commit()

        return {"message": f"Goal {goal_id} has been unblocked", "status": "active"}

    return {"message": f"Goal {goal_id} is already {goal.status}", "status": goal.status}
