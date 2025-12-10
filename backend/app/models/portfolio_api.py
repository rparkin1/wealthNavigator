"""
Portfolio API request/response models (Pydantic)
Separate from database models in portfolio_db.py
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class SecurityType(str, Enum):
    """Security types"""
    STOCK = "stock"
    ETF = "etf"
    MUTUAL_FUND = "mutual_fund"
    BOND = "bond"


class AnalysisType(str, Enum):
    """Types of portfolio analysis"""
    TAX_LOSS_HARVESTING = "tax_loss_harvesting"
    REBALANCING = "rebalancing"
    PERFORMANCE = "performance"
    COMPREHENSIVE = "comprehensive"


# ============================================================================
# Tax-Loss Harvesting Request/Response Models
# ============================================================================

class TaxLossHarvestRequest(BaseModel):
    """Request for tax-loss harvesting analysis"""
    user_id: str = Field(..., description="User ID")
    portfolio_id: Optional[str] = Field(None, description="Portfolio ID (optional)")
    tax_rate: float = Field(0.24, ge=0.0, le=1.0, description="Capital gains tax rate")
    min_loss_threshold: float = Field(100.0, ge=0.0, description="Minimum loss to consider (dollars)")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "usr_abc123",
                "portfolio_id": "port_xyz789",
                "tax_rate": 0.24,
                "min_loss_threshold": 100.0
            }
        }


class ReplacementSecurity(BaseModel):
    """Replacement security for tax-loss harvesting"""
    ticker: str
    name: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    expense_ratio: Optional[float] = None


class TLHOpportunity(BaseModel):
    """Tax-loss harvesting opportunity"""
    security: str
    loss: float
    tax_benefit: float
    wash_sale_risk: bool
    priority: float = Field(..., ge=0.0, le=100.0)
    recommendation: str
    replacements: List[ReplacementSecurity]


class TaxLossHarvestResponse(BaseModel):
    """Response from tax-loss harvesting analysis"""
    total_harvestable_losses: float
    total_tax_benefit: float
    opportunities_count: int
    opportunities: List[TLHOpportunity]
    strategy_notes: str

    class Config:
        json_schema_extra = {
            "example": {
                "total_harvestable_losses": 4500.0,
                "total_tax_benefit": 1080.0,
                "opportunities_count": 2,
                "opportunities": [
                    {
                        "security": "SPY",
                        "loss": 3000.0,
                        "tax_benefit": 720.0,
                        "wash_sale_risk": False,
                        "priority": 87.5,
                        "recommendation": "SELL & REPLACE - High priority opportunity",
                        "replacements": [
                            {
                                "ticker": "VTI",
                                "name": "Vanguard Total Stock Market",
                                "similarity_score": 0.98,
                                "expense_ratio": 0.0003
                            }
                        ]
                    }
                ],
                "strategy_notes": "Identified 2 opportunities with total tax benefit of $1,080"
            }
        }


# ============================================================================
# Rebalancing Request/Response Models
# ============================================================================

class RebalanceRequest(BaseModel):
    """Request for portfolio rebalancing analysis"""
    user_id: str = Field(..., description="User ID")
    portfolio_id: Optional[str] = Field(None, description="Portfolio ID (optional)")
    drift_threshold: float = Field(5.0, ge=0.0, le=100.0, description="Drift threshold percentage")
    tax_rate: float = Field(0.24, ge=0.0, le=1.0, description="Capital gains tax rate")
    new_contributions: float = Field(0.0, ge=0.0, description="New cash available to invest")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "usr_abc123",
                "portfolio_id": "port_xyz789",
                "drift_threshold": 5.0,
                "tax_rate": 0.24,
                "new_contributions": 0.0
            }
        }


class RebalancingTrade(BaseModel):
    """Recommended trade for rebalancing"""
    account: str
    asset: str
    action: str  # "buy" or "sell"
    amount: float
    tax_impact: float
    priority: int
    reasoning: str


class RebalanceResponse(BaseModel):
    """Response from rebalancing analysis"""
    needs_rebalancing: bool
    max_drift: float
    estimated_tax_cost: float
    trades_count: int
    trades: List[RebalancingTrade]
    drift_analysis: Dict[str, float]
    execution_notes: str
    alternative_strategy: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "needs_rebalancing": True,
                "max_drift": 7.2,
                "estimated_tax_cost": 450.0,
                "trades_count": 3,
                "trades": [
                    {
                        "account": "taxable",
                        "asset": "US_LargeCap",
                        "action": "sell",
                        "amount": 10500.0,
                        "tax_impact": 450.0,
                        "priority": 1,
                        "reasoning": "Reduce US_LargeCap from 52% to 45%"
                    }
                ],
                "drift_analysis": {
                    "US_LargeCap": 7.0,
                    "US_SmallCap": -5.0,
                    "International": -5.0,
                    "Bonds": 3.0
                },
                "execution_notes": "3 trades in taxable account will trigger tax events",
                "alternative_strategy": "Direct new contributions to underweight positions"
            }
        }


# ============================================================================
# Performance Tracking Request/Response Models
# ============================================================================

class PerformanceRequest(BaseModel):
    """Request for portfolio performance analysis"""
    user_id: str = Field(..., description="User ID")
    portfolio_id: Optional[str] = Field(None, description="Portfolio ID (optional)")
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    benchmark: Optional[str] = Field("SPY", description="Benchmark ticker symbol")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "usr_abc123",
                "portfolio_id": "port_xyz789",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "benchmark": "SPY"
            }
        }


class PerformanceMetric(BaseModel):
    """Performance metrics for a specific period"""
    period: str
    return_pct: float
    volatility: float
    sharpe: float
    max_drawdown: float


class AttributionResult(BaseModel):
    """Performance attribution by asset class"""
    asset: str
    contribution: float
    weight: float
    return_pct: float


class PerformanceResponse(BaseModel):
    """Response from performance tracking analysis"""
    total_value: float
    ytd_return: float
    inception_return: float
    metrics: List[PerformanceMetric]
    risk_metrics: Dict[str, float]
    attribution: List[AttributionResult]

    class Config:
        json_schema_extra = {
            "example": {
                "total_value": 152340.50,
                "ytd_return": 12.34,
                "inception_return": 52.34,
                "metrics": [
                    {
                        "period": "1M",
                        "return_pct": 2.1,
                        "volatility": 12.5,
                        "sharpe": 1.42,
                        "max_drawdown": -3.2
                    }
                ],
                "risk_metrics": {
                    "var_95": -2.3,
                    "var_99": -4.1,
                    "beta": 0.95,
                    "correlation": 0.87
                },
                "attribution": [
                    {
                        "asset": "US_LargeCap",
                        "contribution": 5.2,
                        "weight": 0.45,
                        "return_pct": 11.6
                    }
                ]
            }
        }


# ============================================================================
# Comprehensive Analysis Request/Response
# ============================================================================

class ComprehensiveAnalysisRequest(BaseModel):
    """Request for comprehensive portfolio analysis"""
    user_id: str = Field(..., description="User ID")
    portfolio_id: Optional[str] = Field(None, description="Portfolio ID (optional)")
    analysis_types: List[AnalysisType] = Field(
        default=[AnalysisType.TAX_LOSS_HARVESTING, AnalysisType.REBALANCING, AnalysisType.PERFORMANCE],
        description="Types of analysis to perform"
    )
    tax_rate: float = Field(0.24, ge=0.0, le=1.0)
    drift_threshold: float = Field(5.0, ge=0.0, le=100.0)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "usr_abc123",
                "portfolio_id": "port_xyz789",
                "analysis_types": ["tax_loss_harvesting", "rebalancing", "performance"],
                "tax_rate": 0.24,
                "drift_threshold": 5.0
            }
        }


class ComprehensiveAnalysisResponse(BaseModel):
    """Response from comprehensive portfolio analysis"""
    analysis_id: str
    timestamp: str
    tax_loss_harvesting: Optional[TaxLossHarvestResponse] = None
    rebalancing: Optional[RebalanceResponse] = None
    performance: Optional[PerformanceResponse] = None
    summary: str
    recommendations: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "analysis_id": "ana_abc123",
                "timestamp": "2024-10-29T10:30:00Z",
                "tax_loss_harvesting": {
                    "total_tax_benefit": 1080.0,
                    "opportunities_count": 2
                },
                "rebalancing": {
                    "needs_rebalancing": True,
                    "max_drift": 7.2
                },
                "performance": {
                    "ytd_return": 12.34,
                    "total_value": 152340.50
                },
                "summary": "Portfolio analysis complete. Found 2 TLH opportunities and rebalancing recommended.",
                "recommendations": [
                    "Harvest $3,000 loss in SPY for $720 tax benefit",
                    "Rebalance to reduce 7% drift in US Large Cap",
                    "YTD performance of 12.3% exceeds benchmark by 2.1%"
                ]
            }
        }


# ============================================================================
# Error Response
# ============================================================================

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Portfolio not found",
                "detail": "No portfolio found for user usr_abc123",
                "error_code": "PORTFOLIO_NOT_FOUND"
            }
        }
