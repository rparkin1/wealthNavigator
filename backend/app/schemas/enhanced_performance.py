"""
Enhanced Performance Reporting Schemas
Pydantic models for TWR, MWR, tax reporting, and enhanced attribution
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


class CashFlowRequest(BaseModel):
    """Cash flow for return calculations"""
    date: str
    amount: float
    account_id: Optional[str] = None


class PerformanceAnalysisRequest(BaseModel):
    """Request for enhanced performance analysis"""
    user_id: str
    portfolio_id: Optional[str] = None
    start_date: str
    end_date: str
    include_tax_reporting: bool = True
    include_peer_comparison: bool = True
    peer_group: Optional[str] = "Balanced 60/40"
    tax_rate_short_term: float = 0.37
    tax_rate_long_term: float = 0.20


class TimeWeightedReturnResponse(BaseModel):
    """Time-weighted return response"""
    period: str
    twr_percentage: float
    method: str = "geometric"
    cash_flows_removed: int


class MoneyWeightedReturnResponse(BaseModel):
    """Money-weighted return (IRR) response"""
    period: str
    mwr_percentage: float
    total_contributions: float
    total_withdrawals: float
    net_cash_flow: float


class AccountPerformanceResponse(BaseModel):
    """Performance by account"""
    account_id: str
    account_name: str
    account_type: str
    beginning_value: float
    ending_value: float
    contributions: float
    withdrawals: float
    twr: float
    mwr: float
    gain_loss: float
    gain_loss_pct: float


class TaxLotResponse(BaseModel):
    """Tax lot details"""
    ticker: str
    acquisition_date: str
    quantity: float
    cost_basis_per_share: float
    total_cost_basis: float
    current_price: float
    current_value: float
    unrealized_gain_loss: float
    holding_period: str


class RealizedGainResponse(BaseModel):
    """Realized capital gain/loss"""
    ticker: str
    sale_date: str
    acquisition_date: str
    quantity: float
    cost_basis: float
    sale_proceeds: float
    gain_loss: float
    holding_period: str
    wash_sale: bool


class TaxReportingResponse(BaseModel):
    """Comprehensive tax reporting"""
    realized_gains_short_term: float
    realized_gains_long_term: float
    realized_losses_short_term: float
    realized_losses_long_term: float
    unrealized_gains_short_term: float
    unrealized_gains_long_term: float
    unrealized_losses_short_term: float
    unrealized_losses_long_term: float
    total_cost_basis: float
    total_current_value: float
    net_realized_gain_loss: float
    net_unrealized_gain_loss: float
    tlh_opportunities_count: int
    tlh_potential_savings: float
    estimated_tax_liability: float
    tax_lots: List[TaxLotResponse]
    realized_transactions: List[RealizedGainResponse]


class FeesImpactResponse(BaseModel):
    """Fees and expenses impact"""
    period: str
    management_fees: float
    trading_commissions: float
    expense_ratios: float
    other_fees: float
    total_fees: float
    fee_impact_on_return: float
    fee_percentage_of_assets: float


class CurrencyEffectResponse(BaseModel):
    """Currency impact for international investments"""
    asset_class: str
    local_currency_return: float
    currency_effect: float
    usd_return: float
    currency_pair: str


class EnhancedAttributionResponse(BaseModel):
    """Enhanced attribution with security selection and fees"""
    asset_class: str
    contribution_to_return: float
    weight: float
    asset_return: float
    allocation_effect: float
    selection_effect: float
    currency_effect: Optional[float] = 0.0
    fees_impact: float = 0.0
    total_effect: float


class PeerGroupComparisonResponse(BaseModel):
    """Peer group comparison"""
    peer_group: str
    period: str
    portfolio_return: float
    peer_median: float
    peer_25th_percentile: float
    peer_75th_percentile: float
    percentile_rank: int
    vs_median: float
    performance_rating: str  # "Excellent", "Above Average", "Average", "Below Average", "Poor"


class ReturnComparisonResponse(BaseModel):
    """Comparison of different return methodologies"""
    period: str
    simple_return: float
    time_weighted_return: float
    money_weighted_return: float
    difference_twr_vs_mwr: float
    interpretation: str


class EnhancedPerformanceResponse(BaseModel):
    """Complete enhanced performance report"""
    portfolio_id: str
    as_of_date: str
    analysis_period: str

    # Basic metrics
    total_value: float
    beginning_value: float
    ending_value: float
    total_gain_loss: float
    total_gain_loss_pct: float

    # Return methodologies
    simple_return: float
    time_weighted_return: TimeWeightedReturnResponse
    money_weighted_return: MoneyWeightedReturnResponse
    return_comparison: ReturnComparisonResponse

    # Account-level performance
    accounts_performance: List[AccountPerformanceResponse]

    # Enhanced attribution
    enhanced_attribution: List[EnhancedAttributionResponse]

    # Fees and expenses
    fees_impact: FeesImpactResponse

    # Currency effects (if applicable)
    currency_effects: List[CurrencyEffectResponse]

    # Tax reporting
    tax_reporting: Optional[TaxReportingResponse] = None

    # Peer comparison
    peer_comparison: Optional[PeerGroupComparisonResponse] = None

    # Risk metrics (from existing implementation)
    risk_metrics: Dict[str, float]


class QuickPerformanceSummary(BaseModel):
    """Quick performance summary for dashboard"""
    period: str
    twr: float
    mwr: float
    total_fees: float
    estimated_tax: float
    peer_percentile: Optional[int] = None
    performance_rating: str
