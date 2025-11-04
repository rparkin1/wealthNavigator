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
# Factor Attribution Request/Response Models (Fama-French)
# ============================================================================

class FactorAnalysisRequest(BaseModel):
    """Request for Fama-French factor attribution analysis"""
    portfolio_returns: List[float] = Field(..., description="Historical portfolio returns")
    market_returns: List[float] = Field(..., description="Market benchmark returns")
    factor_returns: Optional[Dict[str, List[float]]] = Field(None, description="Optional factor returns")
    model_type: str = Field("three_factor", description="Model type: three_factor or five_factor")
    frequency: str = Field("daily", description="Return frequency: daily or monthly")

    class Config:
        json_schema_extra = {
            "example": {
                "portfolio_returns": [0.001, 0.002, -0.001, 0.003],
                "market_returns": [0.0008, 0.0015, -0.0012, 0.0025],
                "factor_returns": None,
                "model_type": "three_factor",
                "frequency": "daily"
            }
        }


class FactorExposureResponse(BaseModel):
    """Factor exposure result"""
    factor_name: str
    beta: float
    t_statistic: float
    p_value: float
    is_significant: bool


class FactorAttributionResult(BaseModel):
    """Performance attribution to a factor"""
    factor_name: str
    beta: float
    factor_return: float
    contribution: float
    contribution_pct: float


class FactorAnalysisResponse(BaseModel):
    """Response from Fama-French factor analysis"""
    model_type: str
    alpha: float
    alpha_annual: float
    alpha_t_stat: float
    alpha_p_value: float
    r_squared: float
    adjusted_r_squared: float
    exposures: List[FactorExposureResponse]
    attributions: List[FactorAttributionResult]
    total_return: float
    explained_return: float
    residual_return: float
    interpretation: str
    recommendations: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "model_type": "three_factor",
                "alpha": 0.0003,
                "alpha_annual": 0.0756,
                "alpha_t_stat": 2.15,
                "alpha_p_value": 0.032,
                "r_squared": 0.89,
                "adjusted_r_squared": 0.88,
                "exposures": [
                    {
                        "factor_name": "MKT_RF",
                        "beta": 0.95,
                        "t_statistic": 15.3,
                        "p_value": 0.001,
                        "is_significant": True
                    }
                ],
                "attributions": [
                    {
                        "factor_name": "MKT_RF",
                        "beta": 0.95,
                        "factor_return": 0.08,
                        "contribution": 0.076,
                        "contribution_pct": 85.3
                    }
                ],
                "total_return": 0.089,
                "explained_return": 0.081,
                "residual_return": 0.008,
                "interpretation": "Portfolio generated significant positive alpha of 7.56% annually...",
                "recommendations": [
                    "✅ Strong positive alpha. Strategy is adding value."
                ]
            }
        }


# ============================================================================
# CAPM Request/Response Models
# ============================================================================

class CAPMAnalysisRequest(BaseModel):
    """Request for CAPM analysis"""
    security_returns: List[float] = Field(..., description="Security or portfolio returns")
    market_returns: List[float] = Field(..., description="Market benchmark returns")
    frequency: str = Field("daily", description="Return frequency: daily or monthly")
    security_name: str = Field("Security", description="Name for reporting")

    class Config:
        json_schema_extra = {
            "example": {
                "security_returns": [0.001, 0.002, -0.001, 0.003],
                "market_returns": [0.0008, 0.0015, -0.0012, 0.0025],
                "frequency": "daily",
                "security_name": "My Portfolio"
            }
        }


class CAPMMetricsResponse(BaseModel):
    """CAPM metrics result"""
    risk_free_rate: float
    market_return: float
    market_premium: float
    beta: float
    beta_confidence_interval: tuple[float, float]
    expected_return: float
    actual_return: float
    alpha: float
    r_squared: float
    correlation: float
    tracking_error: float
    information_ratio: float
    treynor_ratio: float
    position: str  # overvalued, undervalued, fair_value
    distance_from_sml: float
    interpretation: str
    investment_recommendation: str

    class Config:
        json_schema_extra = {
            "example": {
                "risk_free_rate": 0.04,
                "market_return": 0.10,
                "market_premium": 0.06,
                "beta": 1.05,
                "beta_confidence_interval": [0.98, 1.12],
                "expected_return": 0.103,
                "actual_return": 0.115,
                "alpha": 0.012,
                "r_squared": 0.92,
                "correlation": 0.96,
                "tracking_error": 0.035,
                "information_ratio": 0.34,
                "treynor_ratio": 0.071,
                "position": "undervalued",
                "distance_from_sml": 0.012,
                "interpretation": "Portfolio moves roughly in line with the market (β=1.05)...",
                "investment_recommendation": "🟢 BUY - Security appears undervalued..."
            }
        }


class CAPMPortfolioRequest(BaseModel):
    """Request for CAPM portfolio analysis"""
    portfolio_returns: List[float] = Field(..., description="Portfolio returns")
    market_returns: List[float] = Field(..., description="Market returns")
    holdings: Optional[List[Dict]] = Field(None, description="Individual holdings with returns")
    frequency: str = Field("daily", description="Return frequency")

    class Config:
        json_schema_extra = {
            "example": {
                "portfolio_returns": [0.001, 0.002, -0.001, 0.003],
                "market_returns": [0.0008, 0.0015, -0.0012, 0.0025],
                "holdings": [
                    {
                        "name": "SPY",
                        "weight": 0.60,
                        "returns": [0.0008, 0.0015, -0.0012, 0.0025]
                    }
                ],
                "frequency": "daily"
            }
        }


class CAPMPortfolioResponse(BaseModel):
    """CAPM portfolio analysis result"""
    portfolio_metrics: CAPMMetricsResponse
    holdings_analysis: Optional[List[Dict]] = None
    systematic_risk_pct: float
    idiosyncratic_risk_pct: float
    recommendations: List[str]
    risk_warnings: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "portfolio_metrics": {"beta": 1.05, "alpha": 0.012},
                "holdings_analysis": None,
                "systematic_risk_pct": 92.0,
                "idiosyncratic_risk_pct": 8.0,
                "recommendations": [
                    "✅ Portfolio is well-positioned relative to CAPM expectations."
                ],
                "risk_warnings": []
            }
        }


class SecurityMarketLineResponse(BaseModel):
    """Security Market Line data for visualization"""
    points: List[Dict[str, float]]
    portfolio_point: Dict[str, float]
    efficient_portfolios: List[Dict[str, float]]

    class Config:
        json_schema_extra = {
            "example": {
                "points": [
                    {"beta": 0.0, "expected_return": 0.04},
                    {"beta": 1.0, "expected_return": 0.10}
                ],
                "portfolio_point": {"beta": 1.0, "expected_return": 0.10},
                "efficient_portfolios": [
                    {"name": "Conservative", "beta": 0.5, "expected_return": 0.07}
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
