"""
Enhanced Performance Reporting API Endpoints
Complete REQ-REPORT-006, REQ-REPORT-007, REQ-REPORT-008
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import numpy as np

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.enhanced_performance import (
    PerformanceAnalysisRequest,
    EnhancedPerformanceResponse,
    TimeWeightedReturnResponse,
    MoneyWeightedReturnResponse,
    AccountPerformanceResponse,
    TaxReportingResponse,
    TaxLotResponse,
    RealizedGainResponse,
    FeesImpactResponse,
    CurrencyEffectResponse,
    EnhancedAttributionResponse,
    PeerGroupComparisonResponse,
    ReturnComparisonResponse,
    QuickPerformanceSummary,
    CashFlowRequest
)
from app.tools.enhanced_performance_tracker import (
    calculate_time_weighted_return,
    calculate_money_weighted_return,
    calculate_account_performance,
    calculate_tax_reporting,
    calculate_fees_impact,
    calculate_currency_effect,
    compare_to_peer_group,
    CashFlow,
    TaxLotPosition,
    RealizedGain
)

router = APIRouter(prefix="/performance/enhanced", tags=["enhanced-performance"])


# ==================== Helper Functions ====================

def generate_mock_peer_returns(peer_group: str, base_return: float) -> List[float]:
    """Generate mock peer group returns for demonstration"""
    np.random.seed(42)

    if peer_group == "Conservative 30/70":
        peer_returns = np.random.normal(4.5, 2.5, 100).tolist()
    elif peer_group == "Balanced 60/40":
        peer_returns = np.random.normal(7.5, 5.0, 100).tolist()
    elif peer_group == "Aggressive 80/20":
        peer_returns = np.random.normal(10.0, 8.0, 100).tolist()
    else:
        peer_returns = np.random.normal(base_return, 3.0, 100).tolist()

    return peer_returns


def generate_mock_tax_lots(portfolio_value: float) -> List[TaxLotPosition]:
    """Generate mock tax lots for demonstration"""
    # In production, fetch actual tax lots from database
    positions = [
        {
            "ticker": "VTI",
            "acquisition_date": "2023-01-15",
            "quantity": 100,
            "cost_basis_per_share": 200.0,
            "current_price": 235.0
        },
        {
            "ticker": "VXUS",
            "acquisition_date": "2023-03-20",
            "quantity": 75,
            "cost_basis_per_share": 58.0,
            "current_price": 62.0
        },
        {
            "ticker": "BND",
            "acquisition_date": "2024-06-10",
            "quantity": 200,
            "cost_basis_per_share": 75.0,
            "current_price": 72.0
        },
        {
            "ticker": "VNQ",
            "acquisition_date": "2023-09-01",
            "quantity": 50,
            "cost_basis_per_share": 90.0,
            "current_price": 95.0
        }
    ]

    tax_lots = []
    for pos in positions:
        total_cost = pos["quantity"] * pos["cost_basis_per_share"]
        current_value = pos["quantity"] * pos["current_price"]
        unrealized_gl = current_value - total_cost

        # Determine holding period
        acq_date = datetime.fromisoformat(pos["acquisition_date"])
        days_held = (datetime.now() - acq_date).days
        holding_period = "long_term" if days_held > 365 else "short_term"

        tax_lots.append(TaxLotPosition(
            ticker=pos["ticker"],
            acquisition_date=pos["acquisition_date"],
            quantity=pos["quantity"],
            cost_basis_per_share=pos["cost_basis_per_share"],
            total_cost_basis=total_cost,
            current_price=pos["current_price"],
            current_value=current_value,
            unrealized_gain_loss=unrealized_gl,
            holding_period=holding_period
        ))

    return tax_lots


def generate_mock_realized_gains() -> List[RealizedGain]:
    """Generate mock realized transactions"""
    transactions = [
        RealizedGain(
            ticker="AAPL",
            sale_date="2024-10-15",
            acquisition_date="2023-05-10",
            quantity=25,
            cost_basis=145.0 * 25,
            sale_proceeds=180.0 * 25,
            gain_loss=(180.0 - 145.0) * 25,
            holding_period="long_term",
            wash_sale=False
        ),
        RealizedGain(
            ticker="MSFT",
            sale_date="2024-11-01",
            acquisition_date="2024-08-15",
            quantity=10,
            cost_basis=420.0 * 10,
            sale_proceeds=400.0 * 10,
            gain_loss=(400.0 - 420.0) * 10,
            holding_period="short_term",
            wash_sale=False
        )
    ]
    return transactions


def generate_mock_portfolio_values(
    start_date: str,
    end_date: str,
    initial_value: float
) -> List[tuple]:
    """Generate mock historical portfolio values"""
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    days = (end - start).days

    # Generate weekly data points
    values = []
    current_value = initial_value
    current_date = start

    np.random.seed(42)
    daily_returns = np.random.normal(0.0003, 0.01, days)  # ~11% annual return

    for i in range(0, days, 7):  # Weekly snapshots
        if i < len(daily_returns):
            current_value *= (1 + daily_returns[i])

        values.append((
            (current_date + timedelta(days=i)).isoformat()[:10],
            current_value
        ))

    return values


def generate_mock_cash_flows(
    start_date: str,
    end_date: str
) -> List[CashFlow]:
    """Generate mock cash flows"""
    cash_flows = [
        CashFlow(date="2024-01-15", amount=5000.0, account_id="acc-1"),
        CashFlow(date="2024-04-01", amount=10000.0, account_id="acc-1"),
        CashFlow(date="2024-07-15", amount=7500.0, account_id="acc-2"),
        CashFlow(date="2024-10-01", amount=-3000.0, account_id="acc-1")  # Withdrawal
    ]

    # Filter to date range
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)

    return [
        cf for cf in cash_flows
        if start <= datetime.fromisoformat(cf.date) <= end
    ]


# ==================== API Endpoints ====================

@router.post("/analyze", response_model=EnhancedPerformanceResponse)
async def analyze_enhanced_performance(
    request: PerformanceAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Complete enhanced performance analysis with:
    - Time-weighted and money-weighted returns
    - Returns by account
    - Enhanced attribution with selection and fees
    - Currency effects
    - Tax reporting
    - Peer group comparison
    """
    # Verify user authorization
    if request.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Generate mock data (replace with real database queries in production)
    initial_value = 450000.0
    portfolio_values = generate_mock_portfolio_values(
        request.start_date, request.end_date, initial_value
    )
    ending_value = portfolio_values[-1][1]

    cash_flows = generate_mock_cash_flows(request.start_date, request.end_date)

    # Calculate TWR
    twr_result = calculate_time_weighted_return(portfolio_values, cash_flows)

    # Calculate MWR
    mwr_result = calculate_money_weighted_return(
        initial_value,
        ending_value,
        cash_flows,
        request.start_date,
        request.end_date
    )

    # Simple return
    simple_return = ((ending_value - initial_value) / initial_value * 100)

    # Return comparison
    return_comparison = ReturnComparisonResponse(
        period=f"{request.start_date} to {request.end_date}",
        simple_return=round(simple_return, 2),
        time_weighted_return=twr_result.twr_percentage,
        money_weighted_return=mwr_result.mwr_percentage,
        difference_twr_vs_mwr=round(twr_result.twr_percentage - mwr_result.mwr_percentage, 2),
        interpretation=(
            "TWR measures manager skill, MWR reflects your actual investment experience. "
            f"{'Large' if abs(twr_result.twr_percentage - mwr_result.mwr_percentage) > 2 else 'Small'} "
            "difference indicates "
            f"{'significant' if abs(twr_result.twr_percentage - mwr_result.mwr_percentage) > 2 else 'minimal'} "
            "impact from contribution timing."
        )
    )

    # Account-level performance
    accounts_performance = [
        calculate_account_performance(
            "acc-1",
            "Taxable Brokerage",
            "taxable",
            [(v[0], v[1] * 0.6) for v in portfolio_values],  # 60% in this account
            [cf for cf in cash_flows if cf.account_id == "acc-1"]
        ),
        calculate_account_performance(
            "acc-2",
            "Traditional IRA",
            "tax_deferred",
            [(v[0], v[1] * 0.4) for v in portfolio_values],  # 40% in this account
            [cf for cf in cash_flows if cf.account_id == "acc-2"]
        )
    ]

    # Enhanced attribution
    enhanced_attribution = [
        EnhancedAttributionResponse(
            asset_class="US Stocks",
            contribution_to_return=4.2,
            weight=0.50,
            asset_return=8.5,
            allocation_effect=0.3,
            selection_effect=0.2,
            currency_effect=0.0,
            fees_impact=-0.15,
            total_effect=4.2
        ),
        EnhancedAttributionResponse(
            asset_class="International Stocks",
            contribution_to_return=1.8,
            weight=0.25,
            asset_return=7.2,
            allocation_effect=0.1,
            selection_effect=0.15,
            currency_effect=-0.5,
            fees_impact=-0.10,
            total_effect=1.8
        ),
        EnhancedAttributionResponse(
            asset_class="Bonds",
            contribution_to_return=0.5,
            weight=0.20,
            asset_return=2.5,
            allocation_effect=-0.1,
            selection_effect=0.05,
            currency_effect=0.0,
            fees_impact=-0.05,
            total_effect=0.5
        ),
        EnhancedAttributionResponse(
            asset_class="Real Estate",
            contribution_to_return=0.3,
            weight=0.05,
            asset_return=5.0,
            allocation_effect=0.05,
            selection_effect=0.0,
            currency_effect=0.0,
            fees_impact=-0.02,
            total_effect=0.3
        )
    ]

    # Fees impact
    fees_impact = calculate_fees_impact(
        initial_value,
        ending_value,
        management_fees=4500.0,  # 1% annual fee
        trading_commissions=150.0,
        expense_ratios=900.0,  # 0.2% weighted average ER
        other_fees=50.0,
        period_days=365
    )

    # Currency effects
    currency_effects = [
        calculate_currency_effect(
            "European Stocks",
            8.0,  # Local return
            "EUR/USD",
            -2.5  # EUR depreciated 2.5%
        ),
        calculate_currency_effect(
            "Emerging Markets",
            12.0,
            "COMPOSITE",
            -1.0
        )
    ]

    # Tax reporting
    tax_reporting = None
    if request.include_tax_reporting:
        tax_lots = generate_mock_tax_lots(ending_value)
        realized_transactions = generate_mock_realized_gains()

        tax_report = calculate_tax_reporting(
            tax_lots,
            realized_transactions,
            request.tax_rate_short_term,
            request.tax_rate_long_term
        )

        # Convert to response model
        tax_reporting = TaxReportingResponse(
            realized_gains_short_term=tax_report.realized_gains_short_term,
            realized_gains_long_term=tax_report.realized_gains_long_term,
            realized_losses_short_term=tax_report.realized_losses_short_term,
            realized_losses_long_term=tax_report.realized_losses_long_term,
            unrealized_gains_short_term=tax_report.unrealized_gains_short_term,
            unrealized_gains_long_term=tax_report.unrealized_gains_long_term,
            unrealized_losses_short_term=tax_report.unrealized_losses_short_term,
            unrealized_losses_long_term=tax_report.unrealized_losses_long_term,
            total_cost_basis=tax_report.total_cost_basis,
            total_current_value=tax_report.total_current_value,
            net_realized_gain_loss=(
                tax_report.realized_gains_short_term +
                tax_report.realized_gains_long_term -
                tax_report.realized_losses_short_term -
                tax_report.realized_losses_long_term
            ),
            net_unrealized_gain_loss=(
                tax_report.unrealized_gains_short_term +
                tax_report.unrealized_gains_long_term -
                tax_report.unrealized_losses_short_term -
                tax_report.unrealized_losses_long_term
            ),
            tlh_opportunities_count=len(tax_report.tlh_opportunities),
            tlh_potential_savings=sum(
                opp["unrealized_loss"] * request.tax_rate_short_term
                for opp in tax_report.tlh_opportunities
            ),
            estimated_tax_liability=tax_report.estimated_tax_liability,
            tax_lots=[TaxLotResponse(**lot.model_dump()) for lot in tax_report.tax_lots],
            realized_transactions=[
                RealizedGainResponse(**txn.model_dump())
                for txn in tax_report.realized_transactions
            ]
        )

    # Peer comparison
    peer_comparison = None
    if request.include_peer_comparison and request.peer_group:
        peer_returns = generate_mock_peer_returns(request.peer_group, twr_result.twr_percentage)

        peer_comp = compare_to_peer_group(
            twr_result.twr_percentage,
            request.peer_group,
            f"{request.start_date} to {request.end_date}",
            peer_returns
        )

        # Add performance rating
        if peer_comp.percentile_rank >= 80:
            rating = "Excellent"
        elif peer_comp.percentile_rank >= 60:
            rating = "Above Average"
        elif peer_comp.percentile_rank >= 40:
            rating = "Average"
        elif peer_comp.percentile_rank >= 20:
            rating = "Below Average"
        else:
            rating = "Poor"

        peer_comparison = PeerGroupComparisonResponse(
            **peer_comp.model_dump(),
            performance_rating=rating
        )

    # Risk metrics (simplified)
    risk_metrics = {
        "volatility": 15.2,
        "sharpe_ratio": 0.58,
        "max_drawdown": -8.5,
        "beta": 0.92
    }

    return EnhancedPerformanceResponse(
        portfolio_id=request.portfolio_id or "portfolio-1",
        as_of_date=request.end_date,
        analysis_period=f"{request.start_date} to {request.end_date}",
        total_value=round(ending_value, 2),
        beginning_value=round(initial_value, 2),
        ending_value=round(ending_value, 2),
        total_gain_loss=round(ending_value - initial_value, 2),
        total_gain_loss_pct=round(simple_return, 2),
        simple_return=round(simple_return, 2),
        time_weighted_return=twr_result,
        money_weighted_return=mwr_result,
        return_comparison=return_comparison,
        accounts_performance=accounts_performance,
        enhanced_attribution=enhanced_attribution,
        fees_impact=fees_impact,
        currency_effects=currency_effects,
        tax_reporting=tax_reporting,
        peer_comparison=peer_comparison,
        risk_metrics=risk_metrics
    )


@router.get("/summary/{user_id}", response_model=QuickPerformanceSummary)
async def get_performance_summary(
    user_id: str,
    period: str = Query("1Y", description="1M, 3M, 6M, 1Y, 3Y, 5Y"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Quick performance summary for dashboard widget
    """
    if user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Mock data for quick summary
    return QuickPerformanceSummary(
        period=period,
        twr=8.5,
        mwr=7.8,
        total_fees=5600.0,
        estimated_tax=2850.0,
        peer_percentile=68,
        performance_rating="Above Average"
    )


@router.get("/accounts/{user_id}", response_model=List[AccountPerformanceResponse])
async def get_account_performance(
    user_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get performance broken down by account
    """
    if user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Generate mock data
    portfolio_values = generate_mock_portfolio_values(start_date, end_date, 450000.0)
    cash_flows = generate_mock_cash_flows(start_date, end_date)

    accounts = [
        calculate_account_performance(
            "acc-1",
            "Taxable Brokerage",
            "taxable",
            [(v[0], v[1] * 0.6) for v in portfolio_values],
            [cf for cf in cash_flows if cf.account_id == "acc-1"]
        ),
        calculate_account_performance(
            "acc-2",
            "Traditional IRA",
            "tax_deferred",
            [(v[0], v[1] * 0.3) for v in portfolio_values],
            [cf for cf in cash_flows if cf.account_id == "acc-2"]
        ),
        calculate_account_performance(
            "acc-3",
            "Roth IRA",
            "tax_exempt",
            [(v[0], v[1] * 0.1) for v in portfolio_values],
            []
        )
    ]

    return accounts


@router.get("/tax-report/{user_id}", response_model=TaxReportingResponse)
async def get_tax_report(
    user_id: str,
    year: int = Query(..., description="Tax year"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive tax reporting for a year
    """
    if user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Generate mock tax data
    tax_lots = generate_mock_tax_lots(500000.0)
    realized_transactions = generate_mock_realized_gains()

    tax_report = calculate_tax_reporting(
        tax_lots,
        realized_transactions,
        tax_rate_short_term=0.37,
        tax_rate_long_term=0.20
    )

    return TaxReportingResponse(
        realized_gains_short_term=tax_report.realized_gains_short_term,
        realized_gains_long_term=tax_report.realized_gains_long_term,
        realized_losses_short_term=tax_report.realized_losses_short_term,
        realized_losses_long_term=tax_report.realized_losses_long_term,
        unrealized_gains_short_term=tax_report.unrealized_gains_short_term,
        unrealized_gains_long_term=tax_report.unrealized_gains_long_term,
        unrealized_losses_short_term=tax_report.unrealized_losses_short_term,
        unrealized_losses_long_term=tax_report.unrealized_losses_long_term,
        total_cost_basis=tax_report.total_cost_basis,
        total_current_value=tax_report.total_current_value,
        net_realized_gain_loss=(
            tax_report.realized_gains_short_term +
            tax_report.realized_gains_long_term -
            tax_report.realized_losses_short_term -
            tax_report.realized_losses_long_term
        ),
        net_unrealized_gain_loss=(
            tax_report.unrealized_gains_short_term +
            tax_report.unrealized_gains_long_term -
            tax_report.unrealized_losses_short_term -
            tax_report.unrealized_losses_long_term
        ),
        tlh_opportunities_count=len(tax_report.tlh_opportunities),
        tlh_potential_savings=sum(
            opp["unrealized_loss"] * 0.37
            for opp in tax_report.tlh_opportunities
        ),
        estimated_tax_liability=tax_report.estimated_tax_liability,
        tax_lots=[TaxLotResponse(**lot.model_dump()) for lot in tax_report.tax_lots],
        realized_transactions=[
            RealizedGainResponse(**txn.model_dump())
            for txn in tax_report.realized_transactions
        ]
    )
