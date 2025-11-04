"""
Insurance Optimization API Endpoints

Provides endpoints for insurance analysis and recommendations:
- Life insurance needs calculation
- Disability coverage analysis
- Long-term care planning
- Insurance gap analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from ....services.insurance.insurance_optimization_service import InsuranceOptimizationService

router = APIRouter(prefix="/insurance-optimization", tags=["insurance_optimization"])


# Request/Response Models

class LifeInsuranceNeedsRequest(BaseModel):
    """Request for life insurance needs calculation"""
    annual_income: float = Field(..., description="Annual gross income")
    age: int = Field(..., description="Current age")
    dependents: int = Field(..., description="Number of dependents")
    outstanding_debt: float = Field(..., description="Total outstanding debt (mortgage, loans, etc.)")
    existing_coverage: float = Field(0.0, description="Existing life insurance coverage")
    years_to_support: int = Field(20, description="Years of income replacement needed")
    college_funding_needed: float = Field(0.0, description="College funding per child")
    final_expenses: float = Field(15_000, description="Estimated final expenses")
    current_savings: float = Field(0.0, description="Current savings and investments")


class DisabilityCoverageRequest(BaseModel):
    """Request for disability coverage analysis"""
    annual_income: float
    age: int
    occupation: str
    existing_std_coverage: float = Field(0.0, description="Existing short-term disability coverage")
    existing_ltd_coverage: float = Field(0.0, description="Existing long-term disability monthly benefit")
    emergency_fund_months: int = Field(3, description="Months of emergency fund")
    has_employer_coverage: bool = False


class LongTermCareRequest(BaseModel):
    """Request for long-term care needs calculation"""
    age: int
    current_assets: float
    annual_income: float
    family_history_ltc: bool = False
    preferred_care_level: str = Field("assisted_living", description="assisted_living, nursing_home_semi_private, etc.")
    years_of_care: int = Field(3, description="Expected years of care needed")
    has_existing_policy: bool = False
    existing_daily_benefit: float = Field(0.0, description="Existing daily benefit amount")


class InsuranceGapAnalysisRequest(BaseModel):
    """Request for comprehensive insurance gap analysis"""
    life_insurance_analysis: Dict[str, Any]
    disability_analysis: Dict[str, Any]
    ltc_analysis: Dict[str, Any]


# Dependency injection
def get_insurance_service() -> InsuranceOptimizationService:
    """Get insurance optimization service instance"""
    return InsuranceOptimizationService()


# Endpoints

@router.post("/calculate-life-insurance-needs")
async def calculate_life_insurance_needs(
    request: LifeInsuranceNeedsRequest,
    service: InsuranceOptimizationService = Depends(get_insurance_service),
):
    """
    Calculate comprehensive life insurance needs

    Uses DIME method (Debt, Income, Mortgage, Education) to calculate:
    - Income replacement needs
    - Debt coverage
    - Education funding
    - Final expenses
    - Net insurance need after existing coverage
    - Premium estimates for term and whole life
    - Policy type recommendations
    """
    try:
        result = await service.calculate_life_insurance_needs(
            annual_income=request.annual_income,
            age=request.age,
            dependents=request.dependents,
            outstanding_debt=request.outstanding_debt,
            existing_coverage=request.existing_coverage,
            years_to_support=request.years_to_support,
            college_funding_needed=request.college_funding_needed,
            final_expenses=request.final_expenses,
            current_savings=request.current_savings,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-disability-coverage")
async def analyze_disability_coverage(
    request: DisabilityCoverageRequest,
    service: InsuranceOptimizationService = Depends(get_insurance_service),
):
    """
    Analyze disability insurance needs

    Returns analysis of:
    - Short-term disability needs (3-6 months)
    - Long-term disability needs (until retirement)
    - Recommended benefit amounts (60% income replacement)
    - Coverage gaps
    - Occupation risk classification
    - Policy feature recommendations
    - Cost estimates
    """
    try:
        result = await service.analyze_disability_coverage(
            annual_income=request.annual_income,
            age=request.age,
            occupation=request.occupation,
            existing_std_coverage=request.existing_std_coverage,
            existing_ltd_coverage=request.existing_ltd_coverage,
            emergency_fund_months=request.emergency_fund_months,
            has_employer_coverage=request.has_employer_coverage,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-ltc-needs")
async def calculate_ltc_needs(
    request: LongTermCareRequest,
    service: InsuranceOptimizationService = Depends(get_insurance_service),
):
    """
    Calculate long-term care insurance needs

    Returns analysis including:
    - Current and inflated care costs
    - Total care cost projections
    - Self-insurance feasibility
    - Coverage gaps
    - Policy type recommendations (traditional vs. hybrid)
    - Premium estimates
    - Care level cost comparisons
    """
    try:
        result = await service.calculate_ltc_needs(
            age=request.age,
            current_assets=request.current_assets,
            annual_income=request.annual_income,
            family_history_ltc=request.family_history_ltc,
            preferred_care_level=request.preferred_care_level,
            years_of_care=request.years_of_care,
            has_existing_policy=request.has_existing_policy,
            existing_daily_benefit=request.existing_daily_benefit,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-insurance-gaps")
async def analyze_insurance_gaps(
    request: InsuranceGapAnalysisRequest,
    service: InsuranceOptimizationService = Depends(get_insurance_service),
):
    """
    Comprehensive insurance gap analysis

    Combines life, disability, and LTC analyses to provide:
    - Total number of gaps identified
    - Critical vs. medium priority gaps
    - Overall risk level assessment
    - Total annual cost to close all gaps
    - Prioritized action items
    - Summary by insurance category
    """
    try:
        result = await service.analyze_insurance_gaps(
            life_insurance_analysis=request.life_insurance_analysis,
            disability_analysis=request.disability_analysis,
            ltc_analysis=request.ltc_analysis,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "insurance_optimization",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/policy-types")
async def get_policy_types(
    service: InsuranceOptimizationService = Depends(get_insurance_service),
):
    """
    Get information about available insurance policy types

    Returns details on all supported insurance products:
    - Term life insurance
    - Whole life insurance
    - Universal life insurance
    - Short-term disability
    - Long-term disability
    - Traditional long-term care
    - Hybrid life/LTC
    """
    return {"policy_types": service.POLICY_TYPES}


@router.get("/ltc-costs")
async def get_ltc_costs(
    service: InsuranceOptimizationService = Depends(get_insurance_service),
):
    """
    Get current long-term care cost averages

    Returns 2025 average costs for:
    - Home health aide
    - Assisted living facility
    - Nursing home (semi-private)
    - Nursing home (private)
    """
    return {
        "year": 2025,
        "costs": service.LTC_COSTS,
        "note": "Costs vary significantly by geographic location",
    }
