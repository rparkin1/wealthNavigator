"""
Portfolio Summary API
Provides aggregated portfolio data for analysis dashboards
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.portfolio_data_service import (
    get_portfolio_value_and_allocation,
    get_holdings_details,
    get_financial_snapshot,
    get_account_type_breakdown,
)

router = APIRouter(prefix="/portfolio-summary", tags=["portfolio-summary"])


# ============================================================================
# Response Models
# ============================================================================

class PortfolioSummaryResponse(BaseModel):
    """Complete portfolio summary for analysis dashboards"""
    total_value: float = Field(description="Total portfolio value in USD")
    allocation: Dict[str, float] = Field(description="Asset allocation by class (0-1 scale)")
    holdings_count: int = Field(description="Total number of holdings")
    accounts_count: int = Field(description="Total number of accounts")

    class Config:
        json_schema_extra = {
            "example": {
                "total_value": 500000.0,
                "allocation": {
                    "US_LargeCap": 0.45,
                    "Bonds": 0.30,
                    "Cash": 0.25
                },
                "holdings_count": 15,
                "accounts_count": 3
            }
        }


class HoldingDetail(BaseModel):
    """Detailed holding information"""
    symbol: str
    name: str
    value: float
    weight: float
    shares: float
    cost_basis: float
    asset_class: str
    security_type: str
    purchase_date: str | None
    expense_ratio: float | None


class DetailedPortfolioResponse(BaseModel):
    """Detailed portfolio data including all holdings"""
    summary: PortfolioSummaryResponse
    holdings: List[HoldingDetail]
    account_breakdown: Dict[str, float] = Field(description="Value by account type")

    class Config:
        json_schema_extra = {
            "example": {
                "summary": {
                    "total_value": 500000.0,
                    "allocation": {"US_LargeCap": 0.45},
                    "holdings_count": 15,
                    "accounts_count": 3
                },
                "holdings": [
                    {
                        "symbol": "VOO",
                        "name": "Vanguard S&P 500 ETF",
                        "value": 225000.0,
                        "weight": 0.45,
                        "shares": 500,
                        "cost_basis": 200000.0,
                        "asset_class": "US_LargeCap",
                        "security_type": "etf",
                        "purchase_date": "2023-01-15",
                        "expense_ratio": 0.0003
                    }
                ],
                "account_breakdown": {
                    "taxable": 200000.0,
                    "tax_deferred": 200000.0,
                    "tax_exempt": 100000.0
                }
            }
        }


class FinancialSnapshotResponse(BaseModel):
    """Financial snapshot for reserve monitoring and risk assessment"""
    monthly_income: float
    monthly_expenses: float
    current_reserves: float
    has_dependents: bool
    risk_tolerance: str
    age: int


# ============================================================================
# Endpoints
# ============================================================================

@router.get(
    "/summary",
    response_model=PortfolioSummaryResponse,
    summary="Get Portfolio Summary",
    description="""
    Returns aggregated portfolio data for analysis dashboards.

    This endpoint provides:
    - Total portfolio value
    - Asset allocation by class
    - Holdings and accounts count

    Uses real holdings data from Plaid integration.
    """
)
async def get_portfolio_summary(
    user_id: str,
    db: AsyncSession = Depends(get_db)
) -> PortfolioSummaryResponse:
    """Get portfolio summary for a user"""
    try:
        # Get portfolio value and allocation from database
        total_value, allocation = await get_portfolio_value_and_allocation(user_id, db)

        # Get holdings details to count them
        holdings = await get_holdings_details(user_id, db)

        # Get account breakdown to count accounts
        account_breakdown = await get_account_type_breakdown(user_id, db)
        accounts_count = len(account_breakdown)

        return PortfolioSummaryResponse(
            total_value=total_value,
            allocation=allocation,
            holdings_count=len(holdings),
            accounts_count=accounts_count
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get portfolio summary: {str(e)}"
        )


@router.get(
    "/detailed",
    response_model=DetailedPortfolioResponse,
    summary="Get Detailed Portfolio Data",
    description="""
    Returns complete portfolio data including all holdings and account breakdown.

    This endpoint provides:
    - Portfolio summary (value, allocation, counts)
    - Detailed list of all holdings
    - Value breakdown by account type (taxable, tax-deferred, tax-exempt)

    Uses real holdings data from Plaid integration.
    """
)
async def get_detailed_portfolio(
    user_id: str,
    db: AsyncSession = Depends(get_db)
) -> DetailedPortfolioResponse:
    """Get detailed portfolio data for a user"""
    try:
        # Get summary data
        total_value, allocation = await get_portfolio_value_and_allocation(user_id, db)

        # Get detailed holdings
        holdings_list = await get_holdings_details(user_id, db)

        # Get account breakdown
        account_breakdown = await get_account_type_breakdown(user_id, db)

        # Convert holdings to response model
        holdings_response = [
            HoldingDetail(
                symbol=h["symbol"],
                name=h["name"],
                value=h["value"],
                weight=h["weight"],
                shares=h["shares"],
                cost_basis=h["cost_basis"],
                asset_class=h["asset_class"],
                security_type=h["security_type"],
                purchase_date=h["purchase_date"].isoformat() if h["purchase_date"] and hasattr(h["purchase_date"], 'isoformat') else (h["purchase_date"] if isinstance(h["purchase_date"], str) else None),
                expense_ratio=h["expense_ratio"]
            )
            for h in holdings_list
        ]

        summary = PortfolioSummaryResponse(
            total_value=total_value,
            allocation=allocation,
            holdings_count=len(holdings_list),
            accounts_count=len(account_breakdown)
        )

        return DetailedPortfolioResponse(
            summary=summary,
            holdings=holdings_response,
            account_breakdown=account_breakdown
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get detailed portfolio: {str(e)}"
        )


@router.get(
    "/financial-snapshot",
    response_model=FinancialSnapshotResponse,
    summary="Get Financial Snapshot",
    description="""
    Returns financial snapshot for reserve monitoring and risk assessment.

    This endpoint provides:
    - Monthly income and expenses
    - Current cash reserves
    - User demographics (dependents, age, risk tolerance)

    Used by Reserve Monitoring and Risk Management dashboards.
    """
)
async def get_financial_snapshot_endpoint(
    user_id: str,
    db: AsyncSession = Depends(get_db)
) -> FinancialSnapshotResponse:
    """Get financial snapshot for a user"""
    try:
        snapshot = await get_financial_snapshot(user_id, db)

        return FinancialSnapshotResponse(
            monthly_income=snapshot["monthly_income"],
            monthly_expenses=snapshot["monthly_expenses"],
            current_reserves=snapshot["current_reserves"],
            has_dependents=snapshot["has_dependents"],
            risk_tolerance=snapshot["risk_tolerance"],
            age=snapshot["age"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get financial snapshot: {str(e)}"
        )
