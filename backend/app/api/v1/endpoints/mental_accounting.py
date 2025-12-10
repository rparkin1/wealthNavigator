"""
Mental Accounting API Endpoints

Implements REQ-GOAL-009: Mental account buckets for goals.
"""

from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.goal import Goal
from app.services.mental_accounting_service import MentalAccountingService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class DedicatedAccount(BaseModel):
    """Dedicated account allocation to a goal"""
    account_id: str
    balance: float = Field(..., ge=0)
    contribution_rate: float = Field(default=0, ge=0, description="Monthly contribution")
    allocation_percentage: float = Field(default=100, ge=0, le=100)

    class Config:
        json_schema_extra = {
            "example": {
                "account_id": "acc-123",
                "balance": 50000,
                "contribution_rate": 1000,
                "allocation_percentage": 100
            }
        }


class MentalAccountRequest(BaseModel):
    """Request to create mental account bucket"""
    goal_id: str
    dedicated_accounts: List[DedicatedAccount]
    expected_return: float = Field(default=0.07, ge=0, le=0.20)
    return_volatility: float = Field(default=0.15, ge=0, le=0.50)

    class Config:
        json_schema_extra = {
            "example": {
                "goal_id": "goal-123",
                "dedicated_accounts": [
                    {
                        "account_id": "acc-401k",
                        "balance": 100000,
                        "contribution_rate": 1500,
                        "allocation_percentage": 60
                    }
                ],
                "expected_return": 0.07,
                "return_volatility": 0.15
            }
        }


class AccountAllocationRequest(BaseModel):
    """Request to allocate account to goal"""
    goal_id: str
    account_id: str
    allocation_percentage: float = Field(..., ge=0, le=100)
    monthly_contribution: float = Field(..., ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "goal_id": "goal-123",
                "account_id": "acc-401k",
                "allocation_percentage": 60,
                "monthly_contribution": 1500
            }
        }


class RebalancingRequest(BaseModel):
    """Request for rebalancing analysis"""
    user_id: str
    total_portfolio_value: float = Field(..., gt=0)


class ProjectionRequest(BaseModel):
    """Request for growth projection"""
    goal_id: str
    years_forward: int = Field(default=5, ge=1, le=30)
    expected_return: float = Field(default=0.07, ge=0, le=0.20)
    monthly_contribution: Optional[float] = Field(None, ge=0)


# Endpoints

@router.post(
    "/create-bucket",
    summary="Create mental account bucket for goal"
)
async def create_mental_account_bucket(
    request: MentalAccountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a mental account bucket for a specific goal.

    Shows:
    - Dedicated assets and expected value at goal date
    - Required vs. actual funding level
    - Projected success probability
    - Funding gap or surplus

    **REQ-GOAL-009:** Mental account buckets for each goal
    """
    # Get goal
    stmt = select(Goal).where(Goal.id == request.goal_id, Goal.user_id == current_user.id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal {request.goal_id} not found"
        )

    # Convert Pydantic models to dicts
    dedicated_accounts = [acc.model_dump() for acc in request.dedicated_accounts]

    # Create mental account bucket
    bucket = await MentalAccountingService.create_mental_account_bucket(
        goal=goal,
        dedicated_accounts=dedicated_accounts,
        expected_return=request.expected_return,
        return_volatility=request.return_volatility,
        db=db
    )

    return bucket


@router.get(
    "/users/{user_id}/all-buckets",
    summary="Get all mental account buckets for user"
)
async def get_all_mental_accounts(
    user_id: str,
    expected_return: float = 0.07,
    return_volatility: float = 0.15,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get mental account buckets for all user goals.

    Returns:
    - Individual mental account buckets
    - Summary statistics (total funding, success probability)
    - Status breakdown (fully funded, on track, at risk)

    **REQ-GOAL-009:** Complete view of all mental accounts
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's mental accounts"
        )

    result = await MentalAccountingService.get_all_mental_accounts(
        user_id=user_id,
        db=db,
        expected_return=expected_return,
        return_volatility=return_volatility
    )

    return result


@router.get(
    "/{goal_id}/bucket",
    summary="Get mental account bucket for specific goal"
)
async def get_goal_mental_account(
    goal_id: str,
    expected_return: float = 0.07,
    return_volatility: float = 0.15,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get mental account bucket for a specific goal.

    **REQ-GOAL-009:** Individual goal mental account details
    """
    # Get goal
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal {goal_id} not found"
        )

    # Get dedicated accounts from goal (would be stored in database)
    dedicated_accounts = []  # Parse from goal.allocated_accounts

    bucket = await MentalAccountingService.create_mental_account_bucket(
        goal=goal,
        dedicated_accounts=dedicated_accounts,
        expected_return=expected_return,
        return_volatility=return_volatility,
        db=db
    )

    return bucket


@router.post(
    "/allocate-account",
    summary="Allocate account to goal"
)
async def allocate_account_to_goal(
    request: AccountAllocationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allocate an account (or portion) to a specific goal.

    **REQ-GOAL-009:** Account-level allocation to goals
    """
    # Verify goal ownership
    stmt = select(Goal).where(Goal.id == request.goal_id, Goal.user_id == current_user.id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal {request.goal_id} not found"
        )

    allocation = await MentalAccountingService.allocate_account_to_goal(
        goal_id=request.goal_id,
        account_id=request.account_id,
        allocation_percentage=request.allocation_percentage,
        monthly_contribution=request.monthly_contribution,
        db=db
    )

    return allocation


@router.post(
    "/analyze-rebalancing",
    summary="Analyze rebalancing needs across goals"
)
async def analyze_rebalancing_needs(
    request: RebalancingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate rebalancing needs across mental accounts.

    Identifies:
    - Goals that are over/under allocated
    - Recommended transfers between accounts
    - Priority-based rebalancing order

    **REQ-GOAL-009:** Identify funding gaps and rebalancing needs
    """
    if request.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's accounts"
        )

    # Get all mental accounts
    all_accounts = await MentalAccountingService.get_all_mental_accounts(
        user_id=request.user_id,
        db=db
    )

    # Calculate rebalancing needs
    rebalancing = MentalAccountingService.calculate_rebalancing_needs(
        mental_accounts=all_accounts["mental_accounts"],
        total_portfolio_value=request.total_portfolio_value
    )

    return rebalancing


@router.post(
    "/project-growth",
    summary="Project mental account growth"
)
async def project_mental_account_growth(
    request: ProjectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Project mental account growth over time.

    Returns year-by-year projections of:
    - Portfolio value
    - Total contributions
    - Investment growth
    - Funding level progress

    **REQ-GOAL-009:** Project expected value at goal date
    """
    # Get goal
    stmt = select(Goal).where(Goal.id == request.goal_id, Goal.user_id == current_user.id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal {request.goal_id} not found"
        )

    # Get current mental account
    dedicated_accounts = []  # Parse from goal.allocated_accounts
    bucket = await MentalAccountingService.create_mental_account_bucket(
        goal=goal,
        dedicated_accounts=dedicated_accounts,
        db=db
    )

    # Project growth
    projection = MentalAccountingService.project_mental_account_growth(
        mental_account=bucket,
        years_forward=request.years_forward,
        expected_return=request.expected_return,
        monthly_contribution=request.monthly_contribution
    )

    return projection


@router.get(
    "/dashboard",
    summary="Get mental accounting dashboard"
)
async def get_mental_accounting_dashboard(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive mental accounting dashboard.

    Combines:
    - All mental account buckets
    - Summary statistics
    - Rebalancing recommendations
    - At-risk goals alert

    **REQ-GOAL-009:** Complete mental accounting overview
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's dashboard"
        )

    # Get all mental accounts
    all_accounts = await MentalAccountingService.get_all_mental_accounts(
        user_id=user_id,
        db=db
    )

    # Calculate total portfolio value
    total_portfolio_value = all_accounts["summary"]["total_current_value"]

    # Get rebalancing recommendations
    rebalancing = MentalAccountingService.calculate_rebalancing_needs(
        mental_accounts=all_accounts["mental_accounts"],
        total_portfolio_value=total_portfolio_value
    )

    # Identify at-risk goals
    at_risk_goals = [
        ma for ma in all_accounts["mental_accounts"]
        if ma["funding_status"] == "at_risk"
    ]

    # Identify goals needing attention
    needs_attention = [
        ma for ma in all_accounts["mental_accounts"]
        if ma["success_probability"] < 0.70 or ma["funding_gap"] > 0
    ]

    return {
        "user_id": user_id,
        "mental_accounts": all_accounts,
        "rebalancing": rebalancing,
        "alerts": {
            "at_risk_goals": len(at_risk_goals),
            "needs_attention": len(needs_attention),
            "needs_rebalancing": rebalancing["needs_rebalancing"]
        },
        "at_risk_goal_details": at_risk_goals,
        "recommendations": {
            "immediate_actions": [
                f"Review {goal['goal_name']}: {goal['funding_gap']:.0f} funding gap"
                for goal in at_risk_goals[:3]
            ],
            "rebalancing_priority": rebalancing["recommendations"][:3] if rebalancing["needs_rebalancing"] else []
        }
    }
