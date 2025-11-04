"""
Estate Planning API Endpoints

Provides endpoints for estate planning calculations and recommendations:
- Estate tax calculations
- Trust structure recommendations
- Beneficiary optimization
- Legacy goal planning
- Gifting strategies
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from ....services.estate.estate_planning_service import EstatePlanningService

router = APIRouter(prefix="/api/v1/estate-planning", tags=["estate_planning"])


# Request/Response Models

class EstateTaxCalculationRequest(BaseModel):
    """Request for estate tax calculation"""
    estate_value: float = Field(..., description="Total estate value")
    state: Optional[str] = Field(None, description="Two-letter state code")
    marital_status: str = Field("single", description="Marital status")
    charitable_donations: float = Field(0.0, description="Charitable donations")
    life_insurance_value: float = Field(0.0, description="Life insurance death benefit")
    debt_value: float = Field(0.0, description="Outstanding debts")


class TrustRecommendationRequest(BaseModel):
    """Request for trust structure recommendations"""
    estate_value: float
    age: int
    marital_status: str
    has_children: bool
    charitable_intent: bool = False
    asset_protection_needs: bool = False
    business_owner: bool = False


class BeneficiaryAccount(BaseModel):
    """Account for beneficiary optimization"""
    account_id: str
    account_type: str  # ira, 401k, taxable, roth_ira, etc.
    value: float


class Beneficiary(BaseModel):
    """Beneficiary information"""
    beneficiary_id: str
    name: str
    relationship: str  # spouse, child, charity, etc.
    age: Optional[int] = None


class BeneficiaryOptimizationRequest(BaseModel):
    """Request for beneficiary optimization"""
    accounts: List[BeneficiaryAccount]
    beneficiaries: List[Beneficiary]
    estate_plan_goals: Dict[str, Any]


class LegacyGoalRequest(BaseModel):
    """Request for legacy goal calculation"""
    desired_legacy_amount: float
    current_estate_value: float
    years_to_legacy: int
    expected_return: float
    state: Optional[str] = None


class GiftingStrategyRequest(BaseModel):
    """Request for gifting strategy analysis"""
    estate_value: float
    annual_gift_amount: float
    years: int
    expected_return: float


# Dependency injection
def get_estate_service() -> EstatePlanningService:
    """Get estate planning service instance"""
    return EstatePlanningService()


# Endpoints

@router.post("/calculate-estate-tax")
async def calculate_estate_tax(
    request: EstateTaxCalculationRequest,
    service: EstatePlanningService = Depends(get_estate_service),
):
    """
    Calculate federal and state estate taxes

    Returns comprehensive estate tax analysis including:
    - Gross estate value
    - Deductions
    - Federal and state exemptions
    - Taxable amounts
    - Tax liabilities
    - Effective tax rate
    """
    try:
        result = await service.calculate_estate_tax(
            estate_value=request.estate_value,
            state=request.state,
            marital_status=request.marital_status,
            charitable_donations=request.charitable_donations,
            life_insurance_value=request.life_insurance_value,
            debt_value=request.debt_value,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend-trusts")
async def recommend_trust_structures(
    request: TrustRecommendationRequest,
    service: EstatePlanningService = Depends(get_estate_service),
):
    """
    Get personalized trust structure recommendations

    Returns list of recommended trusts with:
    - Trust type and name
    - Purpose and benefits
    - Complexity level
    - Estimated setup cost
    - Suitability score
    - Priority level
    """
    try:
        recommendations = await service.recommend_trust_structures(
            estate_value=request.estate_value,
            age=request.age,
            marital_status=request.marital_status,
            has_children=request.has_children,
            charitable_intent=request.charitable_intent,
            asset_protection_needs=request.asset_protection_needs,
            business_owner=request.business_owner,
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-beneficiaries")
async def optimize_beneficiary_designations(
    request: BeneficiaryOptimizationRequest,
    service: EstatePlanningService = Depends(get_estate_service),
):
    """
    Optimize beneficiary designations for tax efficiency

    Returns strategies for:
    - Spousal rollovers
    - Roth accounts to children
    - Charitable bequests
    - Trusts for minors
    - Contingent beneficiaries
    """
    try:
        result = await service.optimize_beneficiary_designations(
            accounts=[acc.dict() for acc in request.accounts],
            beneficiaries=[ben.dict() for ben in request.beneficiaries],
            estate_plan_goals=request.estate_plan_goals,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-legacy-goal")
async def calculate_legacy_goal(
    request: LegacyGoalRequest,
    service: EstatePlanningService = Depends(get_estate_service),
):
    """
    Calculate funding needed for legacy goal

    Returns analysis including:
    - Gross estate needed (after taxes)
    - Current vs. projected estate value
    - Shortfall or surplus
    - Required savings
    - Life insurance alternatives
    - Funding strategies
    """
    try:
        result = await service.calculate_legacy_goal(
            desired_legacy_amount=request.desired_legacy_amount,
            current_estate_value=request.current_estate_value,
            years_to_legacy=request.years_to_legacy,
            expected_return=request.expected_return,
            state=request.state,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-gifting-strategy")
async def analyze_gifting_strategy(
    request: GiftingStrategyRequest,
    service: EstatePlanningService = Depends(get_estate_service),
):
    """
    Analyze impact of annual gifting strategy

    Compares estate with and without gifting to show:
    - Future estate values
    - Estate tax with/without gifting
    - Tax savings from gifting
    - Total wealth transferred to heirs
    - Annual exclusion compliance
    """
    try:
        result = await service.analyze_gifting_strategy(
            estate_value=request.estate_value,
            annual_gift_amount=request.annual_gift_amount,
            years=request.years,
            expected_return=request.expected_return,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "estate_planning",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/trust-types")
async def get_trust_types(
    service: EstatePlanningService = Depends(get_estate_service),
):
    """
    Get information about available trust types

    Returns details on all supported trust structures
    """
    return {"trust_types": service.TRUST_TYPES}


@router.get("/estate-tax-rates")
async def get_estate_tax_rates(
    service: EstatePlanningService = Depends(get_estate_service),
):
    """
    Get current federal and state estate tax rates

    Returns exemption amounts and tax rates by jurisdiction
    """
    return {
        "federal": {
            "exemption": service.FEDERAL_ESTATE_TAX_EXEMPTION,
            "rate": service.FEDERAL_ESTATE_TAX_RATE,
            "year": 2025,
        },
        "states": service.STATE_ESTATE_TAX,
    }
