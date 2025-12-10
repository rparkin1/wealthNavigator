"""
Retirement Planning API Endpoints
Provides Social Security, spending patterns, longevity, and income projections
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging

from app.core.database import get_db
from app.services.portfolio_data_service import get_portfolio_value_and_allocation
from app.tools.retirement_income import (
    SocialSecurityParams,
    SocialSecurityResult,
    SpendingPattern,
    LongevityAssumptions,
    calculate_social_security,
    calculate_spending_by_age,
    calculate_life_expectancy,
    project_retirement_income,
)

router = APIRouter()
logger = logging.getLogger(__name__)


# Request/Response Models
class SocialSecurityRequest(BaseModel):
    """Social Security calculation request"""
    primary_insurance_amount: float
    birth_year: int
    filing_age: int
    cola_rate: float = 0.025


class SpendingPatternRequest(BaseModel):
    """Spending pattern calculation request"""
    base_annual_spending: float
    go_go_multiplier: float = 1.0
    slow_go_multiplier: float = 0.85
    no_go_multiplier: float = 0.75
    healthcare_annual: float = 10000
    healthcare_growth_rate: float = 0.06
    major_expenses: List[Dict] = []
    current_age: int
    planning_age: int = 95
    inflation_rate: float = 0.03


class LongevityRequest(BaseModel):
    """Longevity calculation request"""
    current_age: int
    gender: str  # "male" or "female"
    health_status: str = "average"  # "excellent", "good", "average", "poor"
    planning_age: int = 95


class RetirementProjectionRequest(BaseModel):
    """Complete retirement income projection request"""
    user_id: str  # User ID to fetch real portfolio data
    current_age: int
    retirement_age: int
    social_security: Optional[SocialSecurityParams] = None
    pension_annual: float = 0
    spending_pattern: Optional[SpendingPattern] = None
    portfolio_withdrawal_rate: float = 0.04
    initial_portfolio: Optional[float] = None  # Optional - will use actual portfolio if not provided
    expected_return: float = 0.07  # Expected annual portfolio return (7% default)
    planning_age: int = 95


# Endpoints
@router.post("/social-security", response_model=SocialSecurityResult)
async def calculate_ss_benefits(request: SocialSecurityRequest):
    """
    Calculate Social Security benefits based on filing age

    Returns monthly and annual benefits, lifetime projections, and breakeven analysis
    """
    try:
        params = SocialSecurityParams(
            primary_insurance_amount=request.primary_insurance_amount,
            birth_year=request.birth_year,
            filing_age=request.filing_age,
            cola_rate=request.cola_rate
        )
        result = await calculate_social_security(params)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/spending-pattern", response_model=Dict[int, float])
async def calculate_spending(request: SpendingPatternRequest):
    """
    Calculate age-based spending pattern incorporating retirement phases

    Returns spending amount by age (Go-Go, Slow-Go, No-Go phases)
    """
    try:
        pattern = SpendingPattern(
            base_annual_spending=request.base_annual_spending,
            go_go_multiplier=request.go_go_multiplier,
            slow_go_multiplier=request.slow_go_multiplier,
            no_go_multiplier=request.no_go_multiplier,
            healthcare_annual=request.healthcare_annual,
            healthcare_growth_rate=request.healthcare_growth_rate,
            major_expenses=request.major_expenses
        )
        result = await calculate_spending_by_age(
            pattern,
            request.current_age,
            request.planning_age,
            request.inflation_rate
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/longevity", response_model=Dict)
async def calculate_longevity(request: LongevityRequest):
    """
    Calculate life expectancy and survival probabilities

    Returns adjusted life expectancy with health adjustments and survival curves
    """
    try:
        assumptions = LongevityAssumptions(
            current_age=request.current_age,
            gender=request.gender,
            health_status=request.health_status,
            planning_age=request.planning_age
        )
        result = await calculate_life_expectancy(assumptions)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/income-projection")
async def project_income(
    request: RetirementProjectionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Project complete retirement income and expenses by year

    Combines Social Security, pension, portfolio withdrawals, and spending patterns.

    **NEW:** Now automatically fetches your actual portfolio value from Plaid data!
    If initial_portfolio is not provided, uses real portfolio value from your accounts.

    Returns:
        {
            "projections": [...],
            "metadata": {
                "portfolio_source": "plaid" | "override" | "default",
                "portfolio_value": 1234567.89,
                "expected_return": 0.07,
                "accounts_count": 3
            }
        }
    """
    try:
        # Fetch actual portfolio value if not explicitly provided
        initial_portfolio = request.initial_portfolio
        portfolio_source = "default"
        accounts_count = 0

        if initial_portfolio is not None:
            portfolio_source = "override"
            logger.info(f"Using override portfolio value: ${initial_portfolio:,.2f}")
        else:
            logger.info(f"Fetching actual portfolio value for user {request.user_id}")
            portfolio_value, allocation = await get_portfolio_value_and_allocation(
                request.user_id,
                db
            )

            if portfolio_value > 0:
                initial_portfolio = portfolio_value
                portfolio_source = "plaid"
                # Count number of holdings to estimate accounts
                accounts_count = len(allocation) if allocation else 0
                logger.info(f"Using actual portfolio value from Plaid: ${portfolio_value:,.2f}")
            else:
                # Fallback to $1M default if no portfolio data found
                initial_portfolio = 1000000
                portfolio_source = "default"
                logger.warning(f"No portfolio data found for user {request.user_id}, using default $1M")

        # Calculate Social Security if provided
        ss_result = None
        if request.social_security:
            ss_result = await calculate_social_security(request.social_security)

        projections = await project_retirement_income(
            current_age=request.current_age,
            retirement_age=request.retirement_age,
            social_security=ss_result,
            pension_annual=request.pension_annual,
            spending_pattern=request.spending_pattern,
            portfolio_withdrawal_rate=request.portfolio_withdrawal_rate,
            initial_portfolio=initial_portfolio,
            expected_return=request.expected_return,
            planning_age=request.planning_age
        )

        # Return projections with metadata
        return {
            "projections": [proj.dict() for proj in projections],
            "metadata": {
                "portfolio_source": portfolio_source,
                "portfolio_value": initial_portfolio,
                "expected_return": request.expected_return,
                "accounts_count": accounts_count,
                "user_id": request.user_id
            }
        }
    except Exception as e:
        logger.error(f"Error projecting retirement income: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/health")
async def retirement_health():
    """Health check for retirement API"""
    return {"status": "healthy", "module": "retirement_planning"}
