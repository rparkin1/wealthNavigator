"""
Portfolio API request/response models (Pydantic)
Separate from database models in portfolio_db.py
"""

from pydantic import BaseModel, Field, ConfigDict
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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class ComprehensiveAnalysisResponse(BaseModel):
    """Response from comprehensive portfolio analysis"""
    analysis_id: str
    timestamp: str
    tax_loss_harvesting: Optional[TaxLossHarvestResponse] = None
    rebalancing: Optional[RebalanceResponse] = None
    performance: Optional[PerformanceResponse] = None
    summary: str
    recommendations: List[str]

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

# ============================================================================
# CAPM Request/Response Models
# ============================================================================

class CAPMAnalysisRequest(BaseModel):
    """Request for CAPM analysis"""
    security_returns: List[float] = Field(..., description="Security or portfolio returns")
    market_returns: List[float] = Field(..., description="Market benchmark returns")
    frequency: str = Field("daily", description="Return frequency: daily or monthly")
    security_name: str = Field("Security", description="Name for reporting")

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class CAPMPortfolioRequest(BaseModel):
    """Request for CAPM portfolio analysis"""
    portfolio_returns: List[float] = Field(..., description="Portfolio returns")
    market_returns: List[float] = Field(..., description="Market returns")
    holdings: Optional[List[Dict]] = Field(None, description="Individual holdings with returns")
    frequency: str = Field("daily", description="Return frequency")

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class CAPMPortfolioResponse(BaseModel):
    """CAPM portfolio analysis result"""
    portfolio_metrics: CAPMMetricsResponse
    holdings_analysis: Optional[List[Dict]] = None
    systematic_risk_pct: float
    idiosyncratic_risk_pct: float
    recommendations: List[str]
    risk_warnings: List[str]

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class SecurityMarketLineResponse(BaseModel):
    """Security Market Line data for visualization"""
    points: List[Dict[str, float]]
    portfolio_point: Dict[str, float]
    efficient_portfolios: List[Dict[str, float]]

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

# ============================================================================
# Error Response
# ============================================================================

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)
