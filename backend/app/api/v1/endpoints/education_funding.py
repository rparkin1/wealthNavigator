"""
Education Funding API Endpoints

Handles education cost calculations, 529 planning, and multi-child optimization.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.education_funding_service import EducationFundingService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class EducationCostRequest(BaseModel):
    """Request model for education cost calculation"""
    education_type: str = Field(..., description="Type of education (public_in_state, public_out_state, private, graduate_public, graduate_private)")
    years_until_college: int = Field(..., ge=0, description="Years until child starts college")
    years_of_support: int = Field(default=4, ge=1, le=10, description="Number of years to fund")

    class Config:
        json_schema_extra = {
            "example": {
                "education_type": "public_in_state",
                "years_until_college": 10,
                "years_of_support": 4
            }
        }


class EducationCostResponse(BaseModel):
    """Response model for education cost"""
    tuition: float
    room_and_board: float
    books_and_supplies: float
    other_expenses: float
    total_annual: float
    education_type: str
    years_until_college: int

    class Config:
        json_schema_extra = {
            "example": {
                "tuition": 18500,
                "room_and_board": 21000,
                "books_and_supplies": 2050,
                "other_expenses": 4180,
                "total_annual": 45730,
                "education_type": "public_in_state",
                "years_until_college": 10
            }
        }


class TotalEducationNeedRequest(BaseModel):
    """Request model for total education need calculation"""
    education_type: str
    child_age: int = Field(..., ge=0, le=25)
    college_start_age: int = Field(default=18, ge=16, le=25)
    years_of_support: int = Field(default=4, ge=1, le=10)

    class Config:
        json_schema_extra = {
            "example": {
                "education_type": "private",
                "child_age": 5,
                "college_start_age": 18,
                "years_of_support": 4
            }
        }


class TotalEducationNeedResponse(BaseModel):
    """Response model for total education need"""
    total_need: float
    education_type: str
    child_age: int
    years_until_college: int
    annual_costs: List[float]

    class Config:
        json_schema_extra = {
            "example": {
                "total_need": 543947,
                "education_type": "private",
                "child_age": 5,
                "years_until_college": 13,
                "annual_costs": [124502, 131230, 138337, 145840]
            }
        }


class Plan529Request(BaseModel):
    """Request model for 529 plan strategy"""
    target_amount: float = Field(..., gt=0)
    current_savings: float = Field(default=0, ge=0)
    years_until_college: int = Field(..., gt=0)
    expected_return: float = Field(default=0.06, ge=0, le=0.20)
    state_tax_deduction: float = Field(default=0.0, ge=0, le=0.15)

    class Config:
        json_schema_extra = {
            "example": {
                "target_amount": 200000,
                "current_savings": 10000,
                "years_until_college": 10,
                "expected_return": 0.06,
                "state_tax_deduction": 0.05
            }
        }


class Plan529Response(BaseModel):
    """Response model for 529 plan strategy"""
    monthly_contribution: float
    annual_contribution: float
    total_contributions: float
    projected_balance: float
    shortfall: float
    tax_savings: float
    recommendation: str

    class Config:
        json_schema_extra = {
            "example": {
                "monthly_contribution": 1152.75,
                "annual_contribution": 13833.00,
                "total_contributions": 138330.00,
                "projected_balance": 200000.00,
                "shortfall": 0.0,
                "tax_savings": 6916.50,
                "recommendation": "Contribute $1,152.75/month to reach goal"
            }
        }


class FinancialAidRequest(BaseModel):
    """Request model for financial aid calculation"""
    parent_income: float = Field(..., ge=0)
    parent_assets: float = Field(..., ge=0)
    student_assets: float = Field(default=0, ge=0)
    num_children: int = Field(default=1, ge=1)

    class Config:
        json_schema_extra = {
            "example": {
                "parent_income": 120000,
                "parent_assets": 250000,
                "student_assets": 5000,
                "num_children": 1
            }
        }


class FinancialAidResponse(BaseModel):
    """Response model for financial aid estimation"""
    expected_family_contribution: float
    estimated_need_based_aid: float
    parent_income_contribution: float
    parent_asset_contribution: float
    student_asset_contribution: float
    recommendation: str

    class Config:
        json_schema_extra = {
            "example": {
                "expected_family_contribution": 41110.00,
                "estimated_need_based_aid": 0.0,
                "parent_income_contribution": 27000.00,
                "parent_asset_contribution": 14100.00,
                "student_asset_contribution": 1000.00,
                "recommendation": "Minimal need - plan to cover full cost"
            }
        }


class ChildEducation(BaseModel):
    """Child education information for multi-child planning"""
    name: str
    age: int = Field(..., ge=0, le=25)
    education_type: str
    years_of_support: int = Field(default=4, ge=1, le=10)


class MultiChildRequest(BaseModel):
    """Request model for multi-child funding optimization"""
    children: List[ChildEducation] = Field(..., min_length=1)
    total_monthly_savings: float = Field(..., gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "children": [
                    {"name": "Emma", "age": 10, "education_type": "public_in_state", "years_of_support": 4},
                    {"name": "Liam", "age": 7, "education_type": "private", "years_of_support": 4}
                ],
                "total_monthly_savings": 2000.0
            }
        }


class MultiChildResponse(BaseModel):
    """Response model for multi-child allocation"""
    allocations: dict[str, float]
    total_allocated: float
    children_data: List[dict]

    class Config:
        json_schema_extra = {
            "example": {
                "allocations": {
                    "Emma": 900.0,
                    "Liam": 1100.0
                },
                "total_allocated": 2000.0,
                "children_data": [
                    {"name": "Emma", "urgency": 0.125, "total_need": 180000},
                    {"name": "Liam", "urgency": 0.091, "total_need": 450000}
                ]
            }
        }


class SavingsVehicleRequest(BaseModel):
    """Request model for savings vehicle recommendation"""
    years_until_college: int = Field(..., ge=0)
    state: Optional[str] = Field(None, max_length=2)

    class Config:
        json_schema_extra = {
            "example": {
                "years_until_college": 12,
                "state": "CA"
            }
        }


# Endpoints

@router.post(
    "/calculate-cost",
    response_model=EducationCostResponse,
    summary="Calculate education costs"
)
async def calculate_education_cost(
    request: EducationCostRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate projected education costs with inflation adjustment.

    Uses 5.5% annual education inflation rate.

    Supported education types:
    - public_in_state
    - public_out_state
    - private
    - graduate_public
    - graduate_private
    """
    cost = EducationFundingService.calculate_education_cost(
        education_type=request.education_type,
        years_until_college=request.years_until_college,
        years_of_support=request.years_of_support
    )

    return EducationCostResponse(
        tuition=cost.tuition,
        room_and_board=cost.room_and_board,
        books_and_supplies=cost.books_and_supplies,
        other_expenses=cost.other_expenses,
        total_annual=cost.total_annual,
        education_type=request.education_type,
        years_until_college=request.years_until_college
    )


@router.post(
    "/total-need",
    response_model=TotalEducationNeedResponse,
    summary="Calculate total education funding need"
)
async def calculate_total_need(
    request: TotalEducationNeedRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate total education funding need for all years.

    Accounts for inflation increase each year.
    """
    total_need = EducationFundingService.calculate_total_education_need(
        education_type=request.education_type,
        child_age=request.child_age,
        college_start_age=request.college_start_age,
        years_of_support=request.years_of_support
    )

    years_until = request.college_start_age - request.child_age

    # Calculate annual costs for display
    annual_costs = []
    for year in range(request.years_of_support):
        cost = EducationFundingService.calculate_education_cost(
            request.education_type,
            years_until + year,
            1
        )
        annual_costs.append(cost.total_annual)

    return TotalEducationNeedResponse(
        total_need=total_need,
        education_type=request.education_type,
        child_age=request.child_age,
        years_until_college=years_until,
        annual_costs=annual_costs
    )


@router.post(
    "/529-strategy",
    response_model=Plan529Response,
    summary="Calculate 529 plan contribution strategy"
)
async def calculate_529_strategy(
    request: Plan529Request,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate optimal 529 plan contribution strategy.

    Includes:
    - Monthly contribution needed
    - Tax savings from state deductions
    - Projected balance at college start
    - Personalized recommendations
    """
    strategy = EducationFundingService.calculate_529_strategy(
        target_amount=request.target_amount,
        current_savings=request.current_savings,
        years_until_college=request.years_until_college,
        expected_return=request.expected_return,
        state_tax_deduction=request.state_tax_deduction
    )

    return Plan529Response(**strategy)


@router.post(
    "/financial-aid",
    response_model=FinancialAidResponse,
    summary="Estimate financial aid eligibility"
)
async def calculate_financial_aid(
    request: FinancialAidRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Estimate financial aid using simplified EFC calculation.

    Note: This is a simplified estimate. Actual FAFSA calculation is more complex.

    EFC Formula:
    - Parent income contribution: ~30% of income above $30k
    - Parent asset contribution: 5.64% of assets
    - Student asset contribution: 20% of assets
    """
    aid = EducationFundingService.calculate_financial_aid_impact(
        parent_income=request.parent_income,
        parent_assets=request.parent_assets,
        student_assets=request.student_assets,
        num_children=request.num_children
    )

    return FinancialAidResponse(**aid)


@router.post(
    "/optimize-multi-child",
    response_model=MultiChildResponse,
    summary="Optimize funding across multiple children"
)
async def optimize_multi_child(
    request: MultiChildRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Optimize education funding allocation across multiple children.

    Priority factors:
    - Urgency (years until college)
    - Total education need
    - Education type cost

    Returns recommended monthly allocation per child.
    """
    children_list = [child.dict() for child in request.children]

    allocations = EducationFundingService.optimize_multi_child_funding(
        children=children_list,
        total_monthly_savings=request.total_monthly_savings
    )

    # Calculate additional data for each child
    children_data = []
    for child_dict in children_list:
        years_until = max(0, 18 - child_dict['age'])
        urgency = 1.0 / (years_until + 1)
        total_need = EducationFundingService.calculate_total_education_need(
            child_dict['education_type'],
            child_dict['age'],
            18,
            child_dict.get('years_of_support', 4)
        )

        children_data.append({
            "name": child_dict['name'],
            "age": child_dict['age'],
            "years_until_college": years_until,
            "urgency": round(urgency, 3),
            "total_need": round(total_need, 2),
            "allocated": round(allocations.get(child_dict['name'], 0), 2)
        })

    return MultiChildResponse(
        allocations=allocations,
        total_allocated=sum(allocations.values()),
        children_data=children_data
    )


@router.post(
    "/timeline",
    summary="Generate education timeline"
)
async def calculate_timeline(
    children: List[ChildEducation],
    current_user: User = Depends(get_current_user)
):
    """
    Generate education timeline for multiple children.

    Shows:
    - College start/end years
    - Years until college
    - Estimated annual costs
    - Overlapping college years
    """
    children_list = [child.dict() for child in children]

    timeline = EducationFundingService.calculate_education_timeline(
        children=children_list
    )

    return {"timeline": timeline}


@router.post(
    "/savings-vehicle",
    summary="Get savings vehicle recommendation"
)
async def suggest_savings_vehicle(
    request: SavingsVehicleRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Recommend optimal education savings vehicle.

    Recommendations based on time horizon:
    - 10+ years: 529 Plan
    - 5-10 years: 529 Plan + Taxable Account
    - <5 years: High-Yield Savings + CDs

    Includes pros/cons for each recommendation.
    """
    recommendation = EducationFundingService.suggest_savings_vehicle(
        years_until_college=request.years_until_college,
        state=request.state
    )

    return recommendation
