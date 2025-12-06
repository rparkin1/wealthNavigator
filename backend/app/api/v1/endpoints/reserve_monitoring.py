"""
Reserve Monitoring API Endpoints
Emergency fund and safety reserve monitoring

REQ-RISK-012: Reserve monitoring API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.portfolio_data_service import get_financial_snapshot
from app.services.reserve_monitoring_service import (
    ReserveMonitoringService,
    ReserveMonitoringResult
)

router = APIRouter(prefix="/reserve-monitoring", tags=["Reserve Monitoring"])


# ==================== Request/Response Models ====================

class ReserveMonitoringRequest(BaseModel):
    """Reserve monitoring request"""
    current_reserves: float = Field(gt=0, description="Current emergency fund balance")
    monthly_expenses: float = Field(gt=0, description="Average monthly expenses")
    monthly_income: float = Field(gt=0, description="Monthly income")
    has_dependents: bool = Field(False, description="Whether user has dependents")
    income_stability: str = Field("stable", description="Income stability: stable, variable, uncertain")
    job_security: str = Field("secure", description="Job security: secure, moderate, at_risk")


class ReserveAdequacyRequest(BaseModel):
    """Reserve adequacy score request"""
    months_coverage: float = Field(gt=0, description="Months of expense coverage")
    target_months: float = Field(6, ge=3, le=24, description="Target months coverage")


class ReserveGrowthSimulationRequest(BaseModel):
    """Reserve growth simulation request"""
    current_reserves: float = Field(ge=0, description="Current reserve balance")
    monthly_contribution: float = Field(gt=0, description="Monthly savings contribution")
    target_amount: float = Field(gt=0, description="Target reserve amount")
    months_to_simulate: int = Field(36, ge=6, le=120, description="Months to simulate")


# ==================== Endpoints ====================

@router.post(
    "/monitor",
    response_model=ReserveMonitoringResult,
    summary="Monitor emergency fund reserves",
    description="Get comprehensive reserve monitoring with alerts and recommendations"
)
async def monitor_reserves(request: ReserveMonitoringRequest):
    """
    Monitor emergency fund and safety reserves.

    **REQ-RISK-012:** Reserve monitoring and alerts

    ## Features
    - Calculate months of expense coverage
    - Determine reserve status (critical to excellent)
    - Generate alerts based on reserve level
    - Provide recommendations for building reserves
    - Adjust targets for risk factors (dependents, income stability, job security)

    ## Example Request
    ```json
    {
      "current_reserves": 15000,
      "monthly_expenses": 4000,
      "monthly_income": 6000,
      "has_dependents": true,
      "income_stability": "stable",
      "job_security": "secure"
    }
    ```

    ## Example Response
    ```json
    {
      "current_reserves": 15000,
      "monthly_expenses": 4000,
      "months_coverage": 3.75,
      "reserve_status": "adequate",
      "minimum_target": 16000,
      "recommended_target": 32000,
      "optimal_target": 60000,
      "shortfall": 17000,
      "target_met": false,
      "alerts": [
        {
          "severity": "info",
          "title": "💡 Below Recommended Reserve",
          "message": "You have 3.8 months of expenses saved. Recommended target is 6 months.",
          "action_required": "Continue building reserves by $17,000.",
          "priority": 3
        }
      ],
      "recommendations": [
        {
          "action": "Aggressive Reserve Building",
          "monthly_target": 1200,
          "time_to_goal": 14,
          "rationale": "Save 20% of income ($1,200/month) to reach target in 14 months.",
          "impact": "Fastest path to financial security. May require lifestyle adjustments."
        }
      ],
      "trend": "stable"
    }
    ```

    ## Reserve Status Levels
    - **critical**: < 1 month expenses (immediate action required)
    - **low**: 1-3 months expenses (build reserves urgently)
    - **adequate**: 3-6 months expenses (continue building)
    - **strong**: 6-12 months expenses (well protected)
    - **excellent**: > 12 months expenses (consider investing excess)
    """
    try:
        service = ReserveMonitoringService()

        result = service.monitor_reserves(
            current_reserves=request.current_reserves,
            monthly_expenses=request.monthly_expenses,
            monthly_income=request.monthly_income,
            has_dependents=request.has_dependents,
            income_stability=request.income_stability,
            job_security=request.job_security
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/monitor-auto",
    response_model=ReserveMonitoringResult,
    summary="Auto monitor reserves from database",
    description="Automatically fetch financial data from database and monitor reserves"
)
async def monitor_reserves_auto(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Monitor emergency fund reserves using real financial data from database.

    Automatically fetches:
    - Current reserves from DEPOSITORY accounts (checking, savings)
    - Monthly expenses from budget entries
    - Monthly income from budget entries
    - User preferences (dependents, etc.)

    Then performs comprehensive reserve analysis with alerts and recommendations.

    **Advantages:**
    - No manual data entry required
    - Always uses current financial state
    - Consistent with database values
    """
    try:
        # Fetch real financial data from database
        financial_data = await get_financial_snapshot(
            user_id=current_user.id,
            db=db
        )

        if financial_data["monthly_expenses"] == 0:
            raise HTTPException(
                status_code=404,
                detail="No expense data found. Please add budget entries first."
            )

        # Perform reserve monitoring with real data
        service = ReserveMonitoringService()
        result = service.monitor_reserves(
            current_reserves=financial_data["current_reserves"],
            monthly_expenses=financial_data["monthly_expenses"],
            monthly_income=financial_data["monthly_income"],
            has_dependents=financial_data["has_dependents"],
            income_stability="stable",  # Could be stored in user preferences
            job_security="secure"       # Could be stored in user preferences
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reserve monitoring failed: {str(e)}")


@router.post(
    "/adequacy-score",
    summary="Calculate reserve adequacy score",
    description="Get reserve adequacy score (0-100) and rating"
)
async def calculate_adequacy_score(request: ReserveAdequacyRequest):
    """
    Calculate reserve adequacy score.

    ## Example Request
    ```json
    {
      "months_coverage": 4.5,
      "target_months": 6
    }
    ```

    ## Example Response
    ```json
    {
      "score": 75.0,
      "rating": "Good",
      "months_coverage": 4.5,
      "target_months": 6
    }
    ```

    ## Ratings
    - **Excellent**: 100+ (at or above target)
    - **Good**: 75-99 (close to target)
    - **Fair**: 50-74 (halfway to target)
    - **Poor**: 25-49 (significant shortfall)
    - **Critical**: 0-24 (severe shortfall)
    """
    try:
        service = ReserveMonitoringService()

        result = service.calculate_reserve_adequacy_score(
            months_coverage=request.months_coverage,
            target_months=request.target_months
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/simulate-growth",
    summary="Simulate reserve fund growth",
    description="Project reserve fund growth over time with monthly contributions"
)
async def simulate_reserve_growth(request: ReserveGrowthSimulationRequest):
    """
    Simulate reserve fund growth over time.

    ## Example Request
    ```json
    {
      "current_reserves": 5000,
      "monthly_contribution": 500,
      "target_amount": 24000,
      "months_to_simulate": 36
    }
    ```

    ## Example Response
    ```json
    {
      "initial_balance": 5000,
      "final_balance": 23000,
      "monthly_contribution": 500,
      "target_amount": 24000,
      "target_reached_month": 38,
      "months_simulated": 36,
      "projection": [
        {"month": 0, "balance": 5000},
        {"month": 1, "balance": 5500},
        {"month": 2, "balance": 6000},
        ...
      ]
    }
    ```

    ## Use Cases
    - Visualize reserve building progress
    - Compare different savings rates
    - Set realistic timeline expectations
    - Motivate consistent savings
    """
    try:
        service = ReserveMonitoringService()

        result = service.simulate_reserve_growth(
            current_reserves=request.current_reserves,
            monthly_contribution=request.monthly_contribution,
            target_amount=request.target_amount,
            months_to_simulate=request.months_to_simulate
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/health",
    summary="Health check",
    description="Check reserve monitoring service health"
)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Reserve Monitoring API",
        "endpoints": 4
    }


@router.get(
    "/guidelines",
    summary="Reserve guidelines",
    description="Get general reserve fund guidelines and best practices"
)
async def get_reserve_guidelines():
    """
    Get reserve fund guidelines and best practices.

    ## Returns
    Guidelines for emergency fund sizing based on various factors.
    """
    return {
        "general_guidelines": {
            "minimum": {
                "months": 3,
                "description": "Absolute minimum for basic financial security"
            },
            "recommended": {
                "months": 6,
                "description": "Standard recommendation for most households"
            },
            "optimal": {
                "months": 12,
                "description": "Ideal target for maximum security"
            }
        },
        "adjustment_factors": {
            "dependents": {
                "none": "Standard guidelines apply",
                "children": "Add 1-2 months for each dependent",
                "elderly_care": "Add 2-3 months for caregiving responsibilities"
            },
            "income_stability": {
                "stable_salary": "Standard guidelines apply",
                "commission_based": "Add 2-3 months due to variable income",
                "self_employed": "Add 3-6 months for business uncertainty",
                "contract_work": "Add 2-4 months between contracts"
            },
            "job_security": {
                "secure": "Standard guidelines apply",
                "moderate_risk": "Add 1-2 months",
                "at_risk": "Add 3-6 months",
                "actively_job_hunting": "Maximize reserves immediately"
            },
            "health_considerations": {
                "excellent_insurance": "Standard guidelines apply",
                "high_deductible": "Add 1-2 months for medical costs",
                "chronic_conditions": "Add 2-3 months for healthcare needs"
            },
            "debt_obligations": {
                "low_debt": "Standard guidelines apply",
                "moderate_debt": "Prioritize reserves before extra debt payments",
                "high_debt": "Balance minimum reserves (3 months) with debt reduction"
            }
        },
        "best_practices": [
            "Keep reserves in high-yield savings account (liquid, low-risk)",
            "Separate from regular checking account to avoid temptation",
            "Automate monthly contributions",
            "Review and adjust target annually",
            "Don't invest emergency fund in stocks or risky assets",
            "Replenish immediately after using reserves",
            "Consider reserves as 'financial insurance'"
        ],
        "common_mistakes": [
            "Keeping reserves in checking account (too accessible)",
            "Investing reserves in stocks (too volatile)",
            "Setting unrealistic targets causing burnout",
            "Not adjusting for life changes (marriage, kids, job change)",
            "Using reserves for non-emergencies",
            "Not starting small and building gradually"
        ]
    }
