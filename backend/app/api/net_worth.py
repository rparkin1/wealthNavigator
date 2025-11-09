"""
Net Worth API Endpoints

API routes for net worth history, tracking, and analysis.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import numpy as np

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.budget import BudgetEntry, BudgetType
from app.schemas.net_worth import (
    NetWorthDataPoint,
    NetWorthSummary,
    NetWorthHistoryResponse,
)

router = APIRouter(prefix="/net-worth", tags=["net-worth"])


# ==================== Helper Functions ====================

def calculate_asset_breakdown(user_id: str) -> dict:
    """
    Calculate asset breakdown by class.
    In production, this would query actual holdings from database.
    """
    # Mock data - replace with actual database queries
    return {
        "cash": 50000,
        "stocks": 150000,
        "bonds": 75000,
        "realEstate": 300000,
        "other": 25000,
    }


def calculate_liabilities(user_id: str) -> float:
    """
    Calculate total liabilities.
    In production, this would query actual liabilities from database.
    """
    # Mock data - replace with actual database queries
    return 250000  # Mortgage + other debts


async def generate_historical_data(
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = None,
) -> List[NetWorthDataPoint]:
    """
    Generate historical net worth data points.

    In production, this would:
    1. Query portfolio snapshots from database
    2. Aggregate account balances over time
    3. Include Plaid transaction history
    4. Calculate asset class breakdowns
    """
    # Default to last year if no dates provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=365)

    # Generate mock data (replace with actual database queries)
    data_points = []
    current_date = start_date
    base_net_worth = 350000

    # Simulate daily net worth with some randomness
    np.random.seed(42)
    days = (end_date - current_date).days
    daily_returns = np.random.normal(0.0003, 0.01, days)  # ~11% annual return with volatility

    current_net_worth = base_net_worth

    for i in range(days):
        # Apply daily return
        current_net_worth *= (1 + daily_returns[i])

        # Calculate components
        total_assets = current_net_worth + 250000  # Add back liabilities
        total_liabilities = 250000 * (0.99 ** (i / 365))  # Decreasing debt

        # Asset breakdown (proportional to total assets)
        asset_multiplier = total_assets / 600000
        assets_by_class = {
            "cash": 50000 * asset_multiplier,
            "stocks": 150000 * asset_multiplier * (1 + daily_returns[i] * 2),  # Stocks more volatile
            "bonds": 75000 * asset_multiplier * (1 + daily_returns[i] * 0.3),  # Bonds less volatile
            "realEstate": 300000 * (1.0005 ** (i / 365)),  # Slow steady growth
            "other": 25000 * asset_multiplier,
        }

        # Liquid net worth (excluding real estate)
        liquid_net_worth = (
            assets_by_class["cash"] +
            assets_by_class["stocks"] +
            assets_by_class["bonds"] +
            assets_by_class["other"] -
            total_liabilities
        )

        point = NetWorthDataPoint(
            date=(current_date + timedelta(days=i)).strftime("%Y-%m-%d"),
            totalNetWorth=current_net_worth,
            totalAssets=total_assets,
            totalLiabilities=total_liabilities,
            liquidNetWorth=liquid_net_worth,
            assetsByClass=assets_by_class,
        )

        # Add data points (weekly to reduce data size)
        if i % 7 == 0 or i == days - 1:
            data_points.append(point)

    return data_points


# ==================== API Endpoints ====================

@router.get(
    "/{user_id}/history",
    response_model=List[NetWorthDataPoint],
    summary="Get Net Worth History",
    description="""
    Retrieves historical net worth data for a user.

    Returns:
    - Time series of net worth values
    - Asset and liability breakdowns
    - Asset class allocations
    - Liquid net worth (excluding illiquid assets)
    """
)
async def get_net_worth_history(
    user_id: str,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get historical net worth data."""

    # Verify user authorization
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this data")

    # Parse dates
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    # Generate historical data
    data_points = await generate_historical_data(
        user_id=user_id,
        start_date=start_dt,
        end_date=end_dt,
        db=db,
    )

    return data_points


@router.get(
    "/{user_id}/latest",
    response_model=NetWorthDataPoint,
    summary="Get Latest Net Worth",
    description="Get the most recent net worth snapshot"
)
async def get_latest_net_worth(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get latest net worth snapshot."""

    # Verify user authorization
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this data")

    # Get historical data and return latest point
    data_points = await generate_historical_data(
        user_id=user_id,
        start_date=datetime.utcnow() - timedelta(days=1),
        end_date=datetime.utcnow(),
        db=db,
    )

    if not data_points:
        raise HTTPException(status_code=404, detail="No net worth data found")

    return data_points[-1]


@router.get(
    "/{user_id}/summary",
    response_model=NetWorthSummary,
    summary="Get Net Worth Summary Statistics",
    description="""
    Calculate summary statistics for net worth over a period.

    Returns:
    - Current net worth
    - Period change (absolute and percentage)
    - Annualized return
    - Volatility
    - Sharpe ratio
    - Maximum drawdown
    """
)
async def get_net_worth_summary(
    user_id: str,
    period: str = Query("1Y", description="Time period: 1M, 3M, 6M, 1Y, 3Y, 5Y, ALL"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get net worth summary statistics."""

    # Verify user authorization
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this data")

    # Calculate start date based on period
    end_date = datetime.utcnow()
    if period == "1M":
        start_date = end_date - timedelta(days=30)
    elif period == "3M":
        start_date = end_date - timedelta(days=90)
    elif period == "6M":
        start_date = end_date - timedelta(days=180)
    elif period == "1Y":
        start_date = end_date - timedelta(days=365)
    elif period == "3Y":
        start_date = end_date - timedelta(days=365 * 3)
    elif period == "5Y":
        start_date = end_date - timedelta(days=365 * 5)
    else:  # ALL
        start_date = end_date - timedelta(days=365 * 10)  # 10 years max

    # Get historical data
    data_points = await generate_historical_data(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        db=db,
    )

    if len(data_points) < 2:
        raise HTTPException(status_code=404, detail="Insufficient data for analysis")

    # Calculate metrics
    latest = data_points[-1]
    first = data_points[0]

    current_net_worth = latest.totalNetWorth
    change = current_net_worth - first.totalNetWorth
    change_percent = (change / abs(first.totalNetWorth)) * 100

    # Annualized return
    days_diff = (datetime.fromisoformat(latest.date) - datetime.fromisoformat(first.date)).days
    years_fraction = max(days_diff / 365.25, 0.01)
    annualized_return = (pow(current_net_worth / first.totalNetWorth, 1 / years_fraction) - 1) * 100

    # Volatility (standard deviation of daily returns)
    returns = []
    for i in range(1, len(data_points)):
        prev_value = data_points[i - 1].totalNetWorth
        curr_value = data_points[i].totalNetWorth
        daily_return = (curr_value - prev_value) / prev_value
        returns.append(daily_return)

    volatility = np.std(returns) * np.sqrt(252) * 100  # Annualized

    # Sharpe ratio (assuming 4% risk-free rate)
    risk_free_rate = 4.0
    sharpe_ratio = (annualized_return - risk_free_rate) / volatility if volatility > 0 else 0

    # Max drawdown
    max_drawdown = 0
    peak = data_points[0].totalNetWorth
    for point in data_points:
        if point.totalNetWorth > peak:
            peak = point.totalNetWorth
        drawdown = ((point.totalNetWorth - peak) / peak) * 100
        if drawdown < max_drawdown:
            max_drawdown = drawdown

    return NetWorthSummary(
        currentNetWorth=current_net_worth,
        change=change,
        changePercent=change_percent,
        annualizedReturn=annualized_return,
        volatility=volatility,
        sharpeRatio=sharpe_ratio,
        maxDrawdown=max_drawdown,
    )


@router.get(
    "/health",
    summary="Net Worth API Health Check",
    description="Check if the net worth endpoints are operational"
)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "net-worth-api",
        "version": "1.0.0",
        "features": [
            "net_worth_history",
            "net_worth_summary",
            "asset_breakdown",
        ]
    }
