"""
Diversification Analysis API Endpoints

REQ-RISK-008: Diversification metrics
REQ-RISK-009: Concentration risk identification
REQ-RISK-010: Diversification recommendations
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from app.services.risk.diversification_analysis import (
    DiversificationAnalysisService,
    HoldingInfo,
    DiversificationAnalysisResult,
)
from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


# Request/Response Models

class DiversificationAnalysisRequest(BaseModel):
    """Request for diversification analysis"""
    portfolio_value: float
    holdings: List[HoldingInfo]


class SimplifiedHoldingRequest(BaseModel):
    """Simplified holding for quick analysis"""
    symbol: str
    name: str
    value: float
    asset_class: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    geography: Optional[str] = None
    manager: Optional[str] = None


class SimplifiedDiversificationRequest(BaseModel):
    """Request with simplified holdings (auto-calculate weights)"""
    holdings: List[SimplifiedHoldingRequest]


# Endpoints

@router.post("/analyze", response_model=DiversificationAnalysisResult)
async def analyze_diversification(
    request: DiversificationAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DiversificationAnalysisResult:
    """
    Perform comprehensive diversification analysis

    Analyzes portfolio holdings to identify:
    - Diversification metrics (holdings count, HHI, effective securities)
    - Concentration risks (security, sector, geography, asset class, manager)
    - Improvement recommendations with suggested actions

    **REQ-RISK-008:** Diversification metrics
    **REQ-RISK-009:** Concentration risk identification
    **REQ-RISK-010:** Diversification recommendations
    """
    try:
        service = DiversificationAnalysisService()
        result = service.analyze_diversification(
            portfolio_value=request.portfolio_value,
            holdings=request.holdings
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diversification analysis failed: {str(e)}")


@router.post("/analyze-simple", response_model=DiversificationAnalysisResult)
async def analyze_diversification_simple(
    request: SimplifiedDiversificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> DiversificationAnalysisResult:
    """
    Perform diversification analysis with simplified input

    Accepts holdings with values only - automatically calculates weights
    """
    try:
        # Calculate total value
        total_value = sum(h.value for h in request.holdings)

        if total_value <= 0:
            raise HTTPException(status_code=400, detail="Total portfolio value must be positive")

        # Convert to full HoldingInfo with calculated weights
        holdings = [
            HoldingInfo(
                symbol=h.symbol,
                name=h.name,
                value=h.value,
                weight=h.value / total_value,
                asset_class=h.asset_class,
                sector=h.sector,
                industry=h.industry,
                geography=h.geography,
                manager=h.manager
            )
            for h in request.holdings
        ]

        service = DiversificationAnalysisService()
        result = service.analyze_diversification(
            portfolio_value=total_value,
            holdings=holdings
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diversification analysis failed: {str(e)}")


@router.get("/example")
async def get_example_analysis() -> DiversificationAnalysisResult:
    """
    Get example diversification analysis with sample portfolio

    Useful for testing and demonstration
    """
    # Example portfolio with various concentration issues
    example_holdings = [
        HoldingInfo(
            symbol="AAPL",
            name="Apple Inc.",
            value=50000,
            weight=0.25,
            asset_class="US_LargeCap",
            sector="Technology",
            industry="Consumer Electronics",
            geography="US",
            manager="Individual Stock"
        ),
        HoldingInfo(
            symbol="MSFT",
            name="Microsoft Corporation",
            value=40000,
            weight=0.20,
            asset_class="US_LargeCap",
            sector="Technology",
            industry="Software",
            geography="US",
            manager="Individual Stock"
        ),
        HoldingInfo(
            symbol="GOOGL",
            name="Alphabet Inc.",
            value=30000,
            weight=0.15,
            asset_class="US_LargeCap",
            sector="Technology",
            industry="Internet Services",
            geography="US",
            manager="Individual Stock"
        ),
        HoldingInfo(
            symbol="AMZN",
            name="Amazon.com Inc.",
            value=25000,
            weight=0.125,
            asset_class="US_LargeCap",
            sector="Consumer Cyclical",
            industry="E-commerce",
            geography="US",
            manager="Individual Stock"
        ),
        HoldingInfo(
            symbol="TSLA",
            name="Tesla Inc.",
            value=20000,
            weight=0.10,
            asset_class="US_LargeCap",
            sector="Consumer Cyclical",
            industry="Automotive",
            geography="US",
            manager="Individual Stock"
        ),
        HoldingInfo(
            symbol="VTI",
            name="Vanguard Total Stock Market ETF",
            value=15000,
            weight=0.075,
            asset_class="US_Blend",
            sector="Diversified",
            industry="ETF",
            geography="US",
            manager="Vanguard"
        ),
        HoldingInfo(
            symbol="BND",
            name="Vanguard Total Bond Market ETF",
            value=10000,
            weight=0.05,
            asset_class="US_Bonds",
            sector="Fixed Income",
            industry="ETF",
            geography="US",
            manager="Vanguard"
        ),
        HoldingInfo(
            symbol="VEA",
            name="Vanguard FTSE Developed Markets ETF",
            value=5000,
            weight=0.025,
            asset_class="International_Developed",
            sector="Diversified",
            industry="ETF",
            geography="International_Developed",
            manager="Vanguard"
        ),
    ]

    service = DiversificationAnalysisService()
    result = service.analyze_diversification(
        portfolio_value=200000,
        holdings=example_holdings
    )
    return result


@router.get("/thresholds")
async def get_concentration_thresholds():
    """
    Get concentration risk thresholds used for analysis

    Returns the thresholds used to classify concentration risks as
    low, medium, high, or critical
    """
    service = DiversificationAnalysisService()
    return {
        "single_holding": {
            "critical": service.CRITICAL_SINGLE_HOLDING,
            "high": service.HIGH_SINGLE_HOLDING,
            "medium": service.MEDIUM_SINGLE_HOLDING
        },
        "top_5": {
            "critical": service.CRITICAL_TOP5,
            "high": service.HIGH_TOP5
        },
        "sector": {
            "critical": service.CRITICAL_SECTOR,
            "high": service.HIGH_SECTOR
        },
        "geography": {
            "critical": service.CRITICAL_GEOGRAPHY,
            "high": service.HIGH_GEOGRAPHY
        },
        "manager": {
            "high": 0.40
        },
        "asset_class": {
            "high": 0.85
        }
    }


@router.post("/recommendations-only")
async def get_recommendations_only(
    request: DiversificationAnalysisRequest,
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get only diversification recommendations without full analysis

    Faster endpoint for quick recommendation retrieval
    """
    try:
        service = DiversificationAnalysisService()
        result = service.analyze_diversification(
            portfolio_value=request.portfolio_value,
            holdings=request.holdings
        )
        return {
            "recommendations": result.recommendations,
            "concentration_risks": result.concentration_risks,
            "diversification_score": result.metrics.diversification_score,
            "diversification_level": result.metrics.diversification_level
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation generation failed: {str(e)}")
