"""
Multi-Goal Optimization API Endpoints

Handles portfolio optimization across multiple goals with tax-aware asset location.
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.multi_goal_optimizer import MultiGoalOptimizer
from app.models.goal import Goal
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class AccountInfo(BaseModel):
    """Account information for optimization"""
    id: str
    type: str = Field(..., description="Account type: taxable, tax_deferred, tax_exempt, depository, credit")
    balance: float = Field(..., ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "account-123",
                "type": "tax_deferred",
                "balance": 150000
            }
        }


class OptimizationRequest(BaseModel):
    """Request model for multi-goal optimization"""
    goal_ids: List[str] = Field(..., min_length=1, description="List of goal IDs to optimize")
    accounts: List[AccountInfo] = Field(..., min_length=1, description="List of accounts with balances")
    total_portfolio_value: Optional[float] = Field(None, ge=0, description="Override total portfolio value")

    class Config:
        json_schema_extra = {
            "example": {
                "goal_ids": ["goal-123", "goal-456", "goal-789"],
                "accounts": [
                    {"id": "account-1", "type": "taxable", "balance": 50000},
                    {"id": "account-2", "type": "tax_deferred", "balance": 150000},
                    {"id": "account-3", "type": "tax_exempt", "balance": 75000}
                ],
                "total_portfolio_value": 275000
            }
        }


class GoalPortfolio(BaseModel):
    """Portfolio allocation for a single goal"""
    goal_id: str
    goal_title: str
    allocated_amount: float
    years_to_goal: float
    risk_tolerance: float
    allocation: Dict[str, float]
    expected_return: float
    expected_risk: float
    sharpe_ratio: float


class AccountAllocation(BaseModel):
    """Asset allocation for a single account"""
    account_id: str
    allocations: Dict[str, float]


class AggregateStats(BaseModel):
    """Aggregate portfolio statistics"""
    total_value: float
    weighted_return: float
    weighted_risk: float
    sharpe_ratio: float
    aggregate_allocation: Dict[str, float]


class OptimizationResponse(BaseModel):
    """Response model for multi-goal optimization"""
    goal_allocations: Dict[str, float]
    goal_portfolios: List[GoalPortfolio]
    account_allocations: List[AccountAllocation]
    aggregate_stats: AggregateStats
    optimization_summary: Dict

    class Config:
        json_schema_extra = {
            "example": {
                "goal_allocations": {
                    "goal-123": 150000,
                    "goal-456": 80000,
                    "goal-789": 45000
                },
                "goal_portfolios": [
                    {
                        "goal_id": "goal-123",
                        "goal_title": "Retirement",
                        "allocated_amount": 150000,
                        "years_to_goal": 25,
                        "risk_tolerance": 0.8,
                        "allocation": {
                            "us_stocks": 0.48,
                            "international_stocks": 0.24,
                            "bonds": 0.14
                        },
                        "expected_return": 0.078,
                        "expected_risk": 0.142,
                        "sharpe_ratio": 0.268
                    }
                ],
                "account_allocations": [
                    {
                        "account_id": "account-1",
                        "allocations": {"us_stocks": 30000, "international_stocks": 20000}
                    }
                ],
                "aggregate_stats": {
                    "total_value": 275000,
                    "weighted_return": 0.071,
                    "weighted_risk": 0.135,
                    "sharpe_ratio": 0.230,
                    "aggregate_allocation": {"us_stocks": 0.45, "bonds": 0.30}
                },
                "optimization_summary": {
                    "total_goals": 3,
                    "fully_funded_goals": 1,
                    "partially_funded_goals": 2,
                    "unfunded_goals": 0
                }
            }
        }


class RebalanceRequest(BaseModel):
    """Request model for portfolio rebalancing"""
    user_id: str
    target_allocations: Dict[str, Dict[str, float]] = Field(..., description="Target allocation per goal")
    minimize_taxes: bool = Field(default=True, description="Minimize tax impact during rebalancing")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user-123",
                "target_allocations": {
                    "goal-123": {"us_stocks": 0.60, "bonds": 0.40},
                    "goal-456": {"us_stocks": 0.80, "bonds": 0.20}
                },
                "minimize_taxes": True
            }
        }


class RebalanceResponse(BaseModel):
    """Response model for rebalancing recommendations"""
    rebalancing_trades: List[Dict]
    estimated_tax_impact: float
    total_trades: int
    trade_summary: Dict


# Endpoints

@router.post(
    "/optimize",
    response_model=OptimizationResponse,
    summary="Optimize multi-goal allocation"
)
async def optimize_multi_goal_allocation(
    request: OptimizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Optimize asset allocation across multiple goals.

    This endpoint performs comprehensive multi-goal optimization:

    **Step 1: Capital Allocation**
    - Allocates portfolio capital to goals based on priority and funding needs
    - Priority order: Essential > Important > Aspirational
    - Within same priority: Earlier target date > Later target date

    **Step 2: Goal-Level Asset Allocation**
    - Determines optimal asset mix for each goal based on:
      - Time horizon (glide path: more stocks for longer horizons)
      - Risk tolerance (adjusted by goal priority)
      - Expected return and risk metrics

    **Step 3: Tax-Aware Account Placement**
    - Optimizes asset location across account types:
      - Tax-deferred (401k, IRA): Tax-inefficient assets (bonds, TIPS)
      - Tax-exempt (Roth): Highest expected return assets (stocks)
      - Taxable: Tax-efficient assets (stocks, muni bonds)

    **Step 4: Aggregate Statistics**
    - Calculates portfolio-wide metrics:
      - Weighted expected return
      - Weighted risk (volatility)
      - Sharpe ratio
      - Overall asset allocation

    Returns comprehensive allocation recommendations.
    """
    # Fetch goals
    result = await db.execute(
        select(Goal).where(Goal.id.in_(request.goal_ids))
    )
    goals = result.scalars().all()

    if len(goals) != len(request.goal_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more goals not found"
        )

    # Calculate total portfolio value
    total_portfolio_value = request.total_portfolio_value or sum(acc.balance for acc in request.accounts)

    # Convert accounts to dict format
    accounts = [acc.dict() for acc in request.accounts]

    # Run optimization
    optimization_result = MultiGoalOptimizer.optimize_multi_goal_allocation(
        goals=goals,
        total_portfolio_value=total_portfolio_value,
        accounts=accounts
    )

    # Convert goal portfolios to response format
    goal_portfolios = []
    for goal_id, portfolio in optimization_result["goal_portfolios"].items():
        goal_portfolios.append(GoalPortfolio(**portfolio))

    # Convert account allocations to response format
    account_allocations = []
    for account_id, allocations in optimization_result["account_allocations"].items():
        account_allocations.append(
            AccountAllocation(account_id=account_id, allocations=allocations)
        )

    # Calculate optimization summary
    goal_allocs = optimization_result["goal_allocations"]
    optimization_summary = {
        "total_goals": len(goals),
        "fully_funded_goals": sum(
            1 for goal_id, alloc in goal_allocs.items()
            if alloc >= next((g.target_amount for g in goals if g.id == goal_id), float('inf'))
        ),
        "partially_funded_goals": sum(
            1 for goal_id, alloc in goal_allocs.items()
            if 0 < alloc < next((g.target_amount for g in goals if g.id == goal_id), float('inf'))
        ),
        "unfunded_goals": sum(1 for alloc in goal_allocs.values() if alloc == 0),
    }

    return OptimizationResponse(
        goal_allocations=optimization_result["goal_allocations"],
        goal_portfolios=goal_portfolios,
        account_allocations=account_allocations,
        aggregate_stats=AggregateStats(**optimization_result["aggregate_stats"]),
        optimization_summary=optimization_summary
    )


@router.get(
    "/users/{user_id}/allocation",
    summary="Get current multi-goal allocation"
)
async def get_current_allocation(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current multi-goal allocation for a user.

    Returns the most recent optimization results if available.
    """
    # This would typically fetch from a saved optimization result
    # For now, return a placeholder
    return {
        "user_id": user_id,
        "last_optimization": None,
        "message": "No optimization found. Run /optimize to generate allocation."
    }


@router.post(
    "/rebalance",
    response_model=RebalanceResponse,
    summary="Generate rebalancing recommendations"
)
async def rebalance_portfolio(
    request: RebalanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate tax-aware rebalancing recommendations.

    **Features:**
    - Identifies current vs. target allocation gaps
    - Prioritizes rebalancing in tax-advantaged accounts
    - Minimizes tax impact by avoiding short-term capital gains
    - Suggests specific buy/sell trades
    - Estimates tax liability from rebalancing

    **Tax Minimization Strategy:**
    1. Rebalance in tax-deferred accounts first (no tax impact)
    2. Rebalance in tax-exempt accounts second (no tax impact)
    3. Only rebalance taxable accounts if necessary
    4. Harvest losses to offset gains when possible
    5. Avoid selling positions held < 1 year (short-term gains)
    """
    # Placeholder implementation
    # In production, this would:
    # 1. Fetch current holdings
    # 2. Calculate drift from target
    # 3. Generate tax-aware trades
    # 4. Estimate tax impact

    return RebalanceResponse(
        rebalancing_trades=[
            {
                "account_id": "account-1",
                "action": "sell",
                "asset": "us_stocks",
                "amount": 5000,
                "reason": "Overweight by 3%"
            },
            {
                "account_id": "account-2",
                "action": "buy",
                "asset": "bonds",
                "amount": 5000,
                "reason": "Underweight by 2%"
            }
        ],
        estimated_tax_impact=250.00,
        total_trades=2,
        trade_summary={
            "tax_deferred_trades": 2,
            "taxable_trades": 0,
            "tax_exempt_trades": 0,
            "estimated_savings": 1500.00  # vs. rebalancing in taxable
        }
    )


@router.post(
    "/analyze-tax-efficiency",
    summary="Analyze tax efficiency of current allocation"
)
async def analyze_tax_efficiency(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze tax efficiency of current asset location.

    Identifies opportunities to improve tax efficiency by:
    - Moving tax-inefficient assets to tax-deferred accounts
    - Moving high-growth assets to Roth accounts
    - Identifying suboptimal placements

    Returns recommendations for improving tax efficiency.
    """
    # Placeholder implementation
    return {
        "user_id": user_id,
        "current_tax_drag": 0.0125,  # 1.25% annual tax drag
        "optimized_tax_drag": 0.0075,  # 0.75% with optimization
        "annual_savings": 1375.00,  # On $275k portfolio
        "recommendations": [
            {
                "priority": "high",
                "action": "Move bonds from taxable to 401k",
                "current_account": "taxable-1",
                "target_account": "401k-1",
                "asset": "bonds",
                "amount": 25000,
                "annual_tax_savings": 875.00
            },
            {
                "priority": "medium",
                "action": "Move growth stocks from 401k to Roth",
                "current_account": "401k-1",
                "target_account": "roth-1",
                "asset": "emerging_markets",
                "amount": 15000,
                "long_term_benefit": "Tax-free growth on high-return asset"
            }
        ],
        "implementation_notes": [
            "Consider doing Roth conversion during low-income year",
            "Bond migration can be done immediately without tax impact",
            "Review again after major life changes (job change, marriage, etc.)"
        ]
    }


@router.get(
    "/glide-path/{goal_id}",
    summary="Get recommended glide path for goal"
)
async def get_glide_path(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recommended asset allocation glide path for a goal.

    A glide path gradually reduces risk as the goal approaches:
    - 30+ years: 90% stocks
    - 20+ years: 80% stocks
    - 15+ years: 70% stocks
    - 10+ years: 60% stocks
    - 5+ years: 40% stocks
    - 3+ years: 30% stocks
    - <3 years: 20% stocks

    Returns projected allocation changes over time.
    """
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    from datetime import datetime
    target_date = datetime.fromisoformat(goal.target_date)
    years_to_goal = max(0, (target_date - datetime.now()).days / 365.25)

    # Generate glide path projections
    glide_path_projections = []
    for year in range(int(years_to_goal) + 1):
        years_remaining = years_to_goal - year
        stocks_allocation = MultiGoalOptimizer._calculate_stocks_allocation(years_remaining, 0.75)

        glide_path_projections.append({
            "year": year,
            "years_remaining": round(years_remaining, 1),
            "stocks_percentage": round(stocks_allocation * 100, 1),
            "bonds_percentage": round((1 - stocks_allocation) * 100, 1),
            "risk_level": "aggressive" if stocks_allocation >= 0.8 else
                         "moderate" if stocks_allocation >= 0.5 else "conservative"
        })

    return {
        "goal_id": goal_id,
        "goal_title": goal.title,
        "years_to_goal": round(years_to_goal, 1),
        "glide_path": glide_path_projections,
        "current_allocation": {
            "stocks": glide_path_projections[0]["stocks_percentage"],
            "bonds": glide_path_projections[0]["bonds_percentage"]
        },
        "target_allocation": {
            "stocks": glide_path_projections[-1]["stocks_percentage"],
            "bonds": glide_path_projections[-1]["bonds_percentage"]
        }
    }
