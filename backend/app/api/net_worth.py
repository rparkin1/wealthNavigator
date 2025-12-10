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
from app.models.portfolio_db import Portfolio, Account, Holding
from app.schemas.net_worth import (
    NetWorthDataPoint,
    NetWorthSummary,
    NetWorthHistoryResponse,
)

router = APIRouter(prefix="/net-worth", tags=["net-worth"])


# ==================== Helper Functions ====================

async def calculate_asset_breakdown(user_id: str, db: AsyncSession) -> dict:
    """
    Calculate asset breakdown by class from Plaid holdings.
    """
    from app.models.plaid import PlaidAccount, PlaidHolding

    # Get user's investment accounts from Plaid
    accounts_query = select(PlaidAccount).where(
        PlaidAccount.user_id == user_id,
        PlaidAccount.is_active == True
    )
    result = await db.execute(accounts_query)
    plaid_accounts = result.scalars().all()

    if not plaid_accounts:
        return {}

    # Separate investment and cash accounts
    investment_account_ids = [acc.id for acc in plaid_accounts if acc.type == "investment"]
    cash_account_ids = [acc.id for acc in plaid_accounts if acc.type == "depository"]

    breakdown = {}

    # Add cash from depository accounts
    for acc in plaid_accounts:
        if acc.type == "depository" and acc.current_balance:
            if "cash" not in breakdown:
                breakdown["cash"] = 0
            breakdown["cash"] += float(acc.current_balance)

    # Get all holdings from investment accounts and group by asset class
    if investment_account_ids:
        holdings_query = select(PlaidHolding).where(PlaidHolding.account_id.in_(investment_account_ids))
        result = await db.execute(holdings_query)
        plaid_holdings = result.scalars().all()

        # Asset class mapping (normalize names for frontend)
        # Map Plaid security types and our ticker mappings to standard categories
        asset_class_map = {
            "us_lc_blend": "stocks",
            "us_lc_growth": "stocks",
            "us_lc_value": "stocks",
            "us_mc_blend": "stocks",
            "us_sc_blend": "stocks",
            "us_largecap": "stocks",
            "us_smallcap": "stocks",
            "intl_dev_blend": "stocks",
            "em_blend": "stocks",
            "international": "stocks",
            "us_treasury_short": "bonds",
            "us_treasury_inter": "bonds",
            "us_treasury_long": "bonds",
            "us_corp_ig": "bonds",
            "us_corp_hy": "bonds",
            "muni_inter": "bonds",
            "tips": "bonds",
            "bonds": "bonds",
            "us_reit": "realEstate",
            "intl_reit": "realEstate",
            "reit": "realEstate",
            "gold": "other",
            "commodity_broad": "other",
            "energy": "other",
        }

        for holding in plaid_holdings:
            # Get value
            value = float(holding.institution_value) if holding.institution_value else 0.0

            if value <= 0:
                continue

            # Determine asset class from ticker or type
            ticker = (holding.ticker_symbol or "").upper()
            security_type = (holding.type or "").lower()

            # Try to map based on ticker first (using simplified mapping)
            asset_class = None
            if ticker in ["SPY", "VOO", "VTI", "QQQ", "VUG", "VTV", "IWD", "VO", "IWM", "IJR"]:
                asset_class = "stocks"
            elif ticker in ["VEA", "IEFA", "EFA", "VWO", "IEMG", "EEM"]:
                asset_class = "stocks"
            elif ticker in ["BND", "AGG", "VGIT", "IEF", "TLT", "LQD", "HYG", "MUB", "TIP"]:
                asset_class = "bonds"
            elif ticker in ["VNQ", "IYR", "VNQI"]:
                asset_class = "realEstate"
            elif ticker in ["GLD", "IAU", "DBC", "USO"]:
                asset_class = "other"
            else:
                # Fallback to security type
                if "equity" in security_type or "stock" in security_type:
                    asset_class = "stocks"
                elif "bond" in security_type or "fixed" in security_type:
                    asset_class = "bonds"
                elif "mutual" in security_type or "etf" in security_type:
                    asset_class = "stocks"  # Most mutual funds and ETFs are equity
                else:
                    asset_class = "other"

            if asset_class not in breakdown:
                breakdown[asset_class] = 0
            breakdown[asset_class] += value

    return breakdown


async def calculate_liabilities(user_id: str, db: AsyncSession) -> float:
    """
    Calculate total liabilities from Plaid credit card and loan accounts.

    Sums balances from credit and loan type accounts.
    For Plaid credit accounts, positive balances represent debt owed.
    """
    from app.models.plaid import PlaidAccount

    # Get all credit and loan accounts from Plaid
    credit_accounts_query = select(PlaidAccount).where(
        and_(
            PlaidAccount.user_id == user_id,
            PlaidAccount.type.in_(["credit", "loan"]),
            PlaidAccount.is_active == True
        )
    )
    result = await db.execute(credit_accounts_query)
    credit_accounts = result.scalars().all()

    # Sum up credit balances (positive balances = debt owed)
    # For credit accounts, current_balance is typically positive for debt
    total_liabilities = sum(
        float(account.current_balance) if account.current_balance and account.current_balance > 0 else 0
        for account in credit_accounts
    )

    return total_liabilities


async def generate_historical_data(
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = None,
) -> List[NetWorthDataPoint]:
    """
    Generate historical net worth data points.

    Currently uses current holdings as the latest snapshot and simulates
    historical values with realistic growth patterns.

    In the future, this could:
    1. Query actual portfolio snapshots from database
    2. Aggregate account balances over time
    3. Include Plaid transaction history
    """
    # Default to last year if no dates provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=365)

    # Get current actual values from database
    current_assets_by_class = await calculate_asset_breakdown(user_id, db)
    current_liabilities = await calculate_liabilities(user_id, db)

    if not current_assets_by_class:
        # No data yet - return empty list
        return []

    # Calculate current totals
    current_total_assets = sum(current_assets_by_class.values())
    current_net_worth = current_total_assets - current_liabilities

    # Calculate liquid net worth (excluding real estate)
    current_liquid_net_worth = (
        current_assets_by_class.get("cash", 0) +
        current_assets_by_class.get("stocks", 0) +
        current_assets_by_class.get("bonds", 0) +
        current_assets_by_class.get("other", 0) -
        current_liabilities
    )

    # Generate historical series scaling backwards from current values
    data_points = []
    days = (end_date - start_date).days

    # Use consistent seed for reproducible results
    np.random.seed(42)
    # Simulate ~8% annual return with 15% volatility
    daily_returns = np.random.normal(0.08 / 365, 0.15 / np.sqrt(365), days)

    # Calculate cumulative growth factors
    cumulative_growth = np.cumprod(1 + daily_returns)

    # Scale so the last value equals current net worth
    scale_factor = current_net_worth / cumulative_growth[-1] if cumulative_growth[-1] != 0 else 1

    for i in range(days):
        # Scale net worth based on simulated growth
        historical_net_worth = scale_factor * cumulative_growth[i]
        historical_assets = historical_net_worth + current_liabilities

        # Scale asset classes proportionally
        asset_scale = historical_assets / current_total_assets if current_total_assets > 0 else 0
        assets_by_class = {
            key: value * asset_scale for key, value in current_assets_by_class.items()
        }

        # Liquid net worth
        liquid_net_worth = (
            assets_by_class.get("cash", 0) +
            assets_by_class.get("stocks", 0) +
            assets_by_class.get("bonds", 0) +
            assets_by_class.get("other", 0) -
            current_liabilities
        )

        point = NetWorthDataPoint(
            date=(start_date + timedelta(days=i)).strftime("%Y-%m-%d"),
            totalNetWorth=historical_net_worth,
            totalAssets=historical_assets,
            totalLiabilities=current_liabilities,
            liquidNetWorth=liquid_net_worth,
            assetsByClass=assets_by_class,
        )

        # Add data points weekly to reduce data size
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
