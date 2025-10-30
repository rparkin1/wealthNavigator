"""
Retirement Planning API Endpoints
Provides Social Security, spending patterns, longevity, and income projections
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional

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
    current_age: int
    retirement_age: int
    social_security: Optional[SocialSecurityParams] = None
    pension_annual: float = 0
    spending_pattern: Optional[SpendingPattern] = None
    portfolio_withdrawal_rate: float = 0.04
    initial_portfolio: float = 1000000
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


@router.post("/income-projection", response_model=List[Dict])
async def project_income(request: RetirementProjectionRequest):
    """
    Project complete retirement income and expenses by year

    Combines Social Security, pension, portfolio withdrawals, and spending patterns
    """
    try:
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
            initial_portfolio=request.initial_portfolio,
            planning_age=request.planning_age
        )

        # Convert Pydantic models to dicts
        return [proj.dict() for proj in projections]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/health")
async def retirement_health():
    """Health check for retirement API"""
    return {"status": "healthy", "module": "retirement_planning"}
