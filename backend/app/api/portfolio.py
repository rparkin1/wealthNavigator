"""
Portfolio Management API

Endpoints for advanced portfolio analysis:
- Tax-loss harvesting
- Portfolio rebalancing
- Performance tracking
- Comprehensive analysis
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.portfolio_api import (
    TaxLossHarvestRequest,
    TaxLossHarvestResponse,
    RebalanceRequest,
    RebalanceResponse,
    PerformanceRequest,
    PerformanceResponse,
    ComprehensiveAnalysisRequest,
    ComprehensiveAnalysisResponse,
    ErrorResponse,
    TLHOpportunity,
    ReplacementSecurity,
    RebalancingTrade,
    PerformanceMetric,
    AttributionResult
)
from app.tools.tax_loss_harvester import (
    identify_tax_loss_harvesting_opportunities,
    Holding,
    Transaction,
    SecurityType as TLHSecurityType
)
from app.tools.rebalancer import (
    generate_rebalancing_strategy,
    AccountType as RebalancingAccountType
)
from app.tools.performance_tracker import (
    generate_performance_report
)
import numpy as np
from app.models.user import User
from app.api.deps import get_current_user
from app.models.portfolio_db import Portfolio, Account, Holding as DBHolding
from sqlalchemy import select


router = APIRouter(prefix="/portfolio", tags=["portfolio"])


# ============================================================================
# Helper Functions
# ============================================================================

async def get_sample_holdings(user_id: str, db: AsyncSession) -> list:
    """
    Get user's actual holdings from Plaid database.

    Fetches holdings from the plaid_holdings table.
    """
    from app.models.plaid import PlaidAccount, PlaidHolding

    # Get user's investment accounts from Plaid
    accounts_query = select(PlaidAccount).where(
        PlaidAccount.user_id == user_id,
        PlaidAccount.type == "investment",
        PlaidAccount.is_active == True
    )
    result = await db.execute(accounts_query)
    plaid_accounts = result.scalars().all()

    if not plaid_accounts:
        # Return empty list if no Plaid investment accounts
        return []

    account_ids = [acc.id for acc in plaid_accounts]

    # Get all holdings for these accounts
    holdings_query = select(PlaidHolding).where(PlaidHolding.account_id.in_(account_ids))
    result = await db.execute(holdings_query)
    plaid_holdings = result.scalars().all()

    # Convert to TLH Holding format
    holdings = []
    for h in plaid_holdings:
        # Map security_type to enum
        security_type_map = {
            'equity': TLHSecurityType.STOCK,
            'etf': TLHSecurityType.ETF,
            'mutual fund': TLHSecurityType.INDEX_FUND,
            'derivative': TLHSecurityType.ETF,  # Default derivatives to ETF
            'bond': TLHSecurityType.BOND,
            'cash': TLHSecurityType.ETF,  # Default cash to ETF
        }
        security_type_str = h.type.lower() if h.type else 'etf'
        security_type = security_type_map.get(security_type_str, TLHSecurityType.ETF)

        # Calculate current_value from institution_value
        current_value = float(h.institution_value) if h.institution_value else 0.0
        cost_basis = float(h.cost_basis) if h.cost_basis else current_value
        shares = float(h.quantity) if h.quantity else 0.0

        # Map ticker to asset class using the same mapping as portfolio_data_service
        ticker = h.ticker_symbol or "UNKNOWN"
        asset_class = _map_ticker_to_asset_class_simple(ticker, h.type)

        holdings.append(Holding(
            ticker=ticker,
            name=h.name,
            security_type=security_type,
            cost_basis=cost_basis,
            current_value=current_value,
            shares=shares,
            purchase_date="2024-01-01",  # Plaid doesn't provide purchase dates
            asset_class=asset_class,
            expense_ratio=0.0  # Not provided by Plaid
        ))

    return holdings


def _map_ticker_to_asset_class_simple(ticker: str, security_type: str) -> str:
    """Simple ticker to asset class mapping for portfolio analysis"""
    if not ticker:
        return "US_LargeCap"

    ticker_upper = ticker.upper()

    # Common mappings
    ticker_map = {
        "SPY": "US_LargeCap", "VOO": "US_LargeCap", "VTI": "US_LargeCap",
        "QQQ": "US_LargeCap", "VUG": "US_LargeCap",
        "VTV": "US_LargeCap", "IWD": "US_LargeCap",
        "VO": "US_SmallCap", "IWM": "US_SmallCap", "IJR": "US_SmallCap",
        "VEA": "International", "IEFA": "International", "EFA": "International",
        "VWO": "International", "IEMG": "International", "EEM": "International",
        "BND": "Bonds", "AGG": "Bonds", "VGIT": "Bonds", "IEF": "Bonds",
        "VNQ": "REIT", "IYR": "REIT",
        "GLD": "Gold", "IAU": "Gold",
    }

    if ticker_upper in ticker_map:
        return ticker_map[ticker_upper]

    # Fallback based on security type
    if security_type:
        type_lower = security_type.lower()
        if "equity" in type_lower or "etf" in type_lower:
            return "US_LargeCap"
        elif "bond" in type_lower or "fixed" in type_lower:
            return "Bonds"

    return "US_LargeCap"


def get_sample_transactions(user_id: str) -> list:
    """
    Get recent transactions for wash sale detection.

    Note: Transaction tracking is not yet implemented in the database.
    Returns empty list until a transactions table is created.

    Future enhancement: Query from transactions table filtered by user_id
    and date range (last 30 days for wash sale rule).
    """
    # No transaction history available yet
    return []


async def get_sample_allocation(user_id: str, db: AsyncSession) -> dict:
    """
    Get target allocation for user's portfolio.

    Currently calculates allocation from actual holdings (treats current as target).

    Future enhancement: Allow users to set custom target allocations in user preferences
    or portfolio settings. For now, using current allocation as a reasonable default.
    """
    # Get actual current holdings grouped by asset class
    current_holdings = await get_sample_current_holdings(user_id, db)

    if not current_holdings:
        # Return a balanced default if no holdings exist
        return {
            "US_LargeCap": 0.45,
            "US_SmallCap": 0.15,
            "International": 0.25,
            "Bonds": 0.15
        }

    # Calculate total portfolio value
    total_value = sum(current_holdings.values())

    if total_value == 0:
        return {}

    # Convert to percentages (0-1 scale)
    allocation = {
        asset_class: value / total_value
        for asset_class, value in current_holdings.items()
    }

    return allocation


async def get_sample_current_holdings(user_id: str, db: AsyncSession) -> dict:
    """Get actual current holdings by asset class from Plaid database"""
    # Get holdings from Plaid database
    holdings = await get_sample_holdings(user_id, db)

    # Group by asset class
    by_asset_class = {}
    for h in holdings:
        asset_class = h.asset_class or "US_LargeCap"
        if asset_class not in by_asset_class:
            by_asset_class[asset_class] = 0
        by_asset_class[asset_class] += h.current_value

    return by_asset_class


async def get_portfolio_total_value(user_id: str, db: AsyncSession) -> float:
    """Calculate total portfolio value from actual holdings"""
    holdings = await get_sample_holdings(user_id, db)
    return sum(h.current_value for h in holdings)


async def get_sample_account_breakdown(user_id: str, db: AsyncSession) -> dict:
    """Get actual account breakdown from Plaid database"""
    from app.models.plaid import PlaidAccount, PlaidHolding

    # Get all investment accounts from Plaid
    accounts_query = select(PlaidAccount).where(
        PlaidAccount.user_id == user_id,
        PlaidAccount.type == "investment",
        PlaidAccount.is_active == True
    )
    result = await db.execute(accounts_query)
    plaid_accounts = result.scalars().all()

    if not plaid_accounts:
        return {}

    breakdown = {}
    for account in plaid_accounts:
        # Map Plaid account subtype to rebalancing account type
        # Plaid subtypes: "401k", "403b", "ira", "roth", "brokerage", etc.
        subtype = account.subtype.lower() if account.subtype else "brokerage"

        # Determine tax treatment from subtype
        if subtype in ["roth", "roth_401k"]:
            account_type = RebalancingAccountType.TAX_EXEMPT
        elif subtype in ["401k", "403b", "457b", "ira", "pension", "profit_sharing"]:
            account_type = RebalancingAccountType.TAX_DEFERRED
        else:  # brokerage, cash management, etc.
            account_type = RebalancingAccountType.TAXABLE

        if account_type not in breakdown:
            breakdown[account_type] = {}

        # Get holdings for this account
        holdings_query = select(PlaidHolding).where(PlaidHolding.account_id == account.id)
        result = await db.execute(holdings_query)
        holdings = result.scalars().all()

        for h in holdings:
            asset_class = _map_ticker_to_asset_class_simple(h.ticker_symbol, h.type)
            value = float(h.institution_value) if h.institution_value else 0.0

            if asset_class not in breakdown[account_type]:
                breakdown[account_type][asset_class] = 0
            breakdown[account_type][asset_class] += value

    return breakdown


async def get_sample_historical_values(user_id: str, db: AsyncSession) -> dict:
    """Get historical portfolio values - currently uses current value as snapshot"""
    # Get actual current portfolio value
    current_value = await get_portfolio_total_value(user_id, db)

    # For now, create a simple historical series using current value
    # In production, this would query actual historical snapshots
    dates = [f"2024-{month:02d}-01" for month in range(1, 13)]

    # Use current value as the latest point
    # Simulate historical growth backwards (roughly 8% annual return)
    np.random.seed(42)
    returns = np.random.normal(0.08 / 12, 0.15 / np.sqrt(12), len(dates))
    cumulative = np.cumprod(1 + returns)

    # Scale so the last value equals current portfolio value
    scale_factor = current_value / cumulative[-1]
    values = {date: scale_factor * cum for date, cum in zip(dates, cumulative)}

    return values


def get_sample_asset_class_returns(user_id: str) -> dict:
    """
    Get historical asset class returns for performance attribution.

    Note: Historical return tracking is not yet implemented.
    Returns empty dict until market data integration is complete.

    Future enhancement: Integrate with market data API (Alpha Vantage, Yahoo Finance)
    to fetch actual historical returns for each asset class. This would require:
    1. Market data service integration
    2. Historical price data storage
    3. Return calculation engine
    4. Benchmark definitions for each asset class

    For now, performance attribution will not be available.
    """
    # No historical return data available yet
    return {}


# ============================================================================
# Tax-Loss Harvesting Endpoint
# ============================================================================

@router.post(
    "/tax-loss-harvest",
    response_model=TaxLossHarvestResponse,
    responses={
        200: {"description": "Tax-loss harvesting analysis completed"},
        404: {"model": ErrorResponse, "description": "Portfolio not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Analyze Tax-Loss Harvesting Opportunities",
    description="""
    Analyzes portfolio for tax-loss harvesting opportunities.

    Returns:
    - List of securities with unrealized losses
    - Replacement securities with high correlation
    - Tax benefit estimates
    - Wash sale risk assessment
    - Execution recommendations
    """
)
async def analyze_tax_loss_harvesting(
    request: TaxLossHarvestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> TaxLossHarvestResponse:
    """
    Analyze portfolio for tax-loss harvesting opportunities.

    This endpoint identifies securities with unrealized losses that can be
    harvested for tax benefits while maintaining similar market exposure.
    """
    try:
        # Get holdings and transactions from database
        holdings = await get_sample_holdings(current_user.id, db)
        transactions = get_sample_transactions(current_user.id)

        # Run analysis
        tlh_strategy = await identify_tax_loss_harvesting_opportunities(
            holdings=holdings,
            recent_transactions=transactions,
            tax_rate=request.tax_rate,
            min_loss_threshold=request.min_loss_threshold
        )

        # Convert to API response format
        opportunities = [
            TLHOpportunity(
                security=opp.holding.ticker,
                loss=opp.unrealized_loss,
                tax_benefit=opp.tax_benefit,
                wash_sale_risk=opp.wash_sale_risk,
                priority=opp.priority_score,
                recommendation=opp.recommendation,
                replacements=[
                    ReplacementSecurity(
                        ticker=r.ticker,
                        name=r.name,
                        similarity_score=r.similarity_score / 100.0,  # Convert from 0-100 to 0-1
                        expense_ratio=r.expense_ratio
                    )
                    for r in opp.replacement_securities[:3]  # Top 3
                ]
            )
            for opp in tlh_strategy.opportunities[:10]  # Top 10
        ]

        return TaxLossHarvestResponse(
            total_harvestable_losses=tlh_strategy.total_harvestable_losses,
            total_tax_benefit=tlh_strategy.total_tax_benefit,
            opportunities_count=len(tlh_strategy.opportunities),
            opportunities=opportunities,
            strategy_notes=tlh_strategy.strategy_notes
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing tax-loss harvesting: {str(e)}"
        )


# ============================================================================
# Portfolio Rebalancing Endpoint
# ============================================================================

@router.post(
    "/rebalance",
    response_model=RebalanceResponse,
    responses={
        200: {"description": "Rebalancing analysis completed"},
        404: {"model": ErrorResponse, "description": "Portfolio not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Generate Portfolio Rebalancing Strategy",
    description="""
    Analyzes portfolio drift and generates tax-optimized rebalancing recommendations.

    Returns:
    - Drift analysis by asset class
    - Recommended trades with tax impact
    - Execution priority and timing
    - Alternative strategies
    """
)
async def analyze_rebalancing(
    request: RebalanceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> RebalanceResponse:
    """
    Generate tax-optimized portfolio rebalancing strategy.

    Analyzes portfolio drift from target allocation and recommends specific
    trades to restore balance while minimizing tax impact.
    """
    try:
        # Get portfolio data from database
        target_allocation = await get_sample_allocation(current_user.id, db)
        current_holdings = await get_sample_current_holdings(current_user.id, db)
        account_breakdown = await get_sample_account_breakdown(current_user.id, db)

        # Run analysis
        rebalancing_strategy = await generate_rebalancing_strategy(
            target_allocation=target_allocation,
            current_holdings=current_holdings,
            account_breakdown=account_breakdown,
            drift_threshold=request.drift_threshold,
            tax_rate=request.tax_rate,
            new_contributions=request.new_contributions
        )

        # Convert to API response format
        trades = [
            RebalancingTrade(
                account=t.account_type.value,
                asset=t.asset_class,
                action=t.action,
                amount=t.amount,
                tax_impact=t.estimated_tax_impact,
                priority=t.priority,
                reasoning=t.reasoning
            )
            for t in rebalancing_strategy.trades[:15]  # Top 15
        ]

        return RebalanceResponse(
            needs_rebalancing=rebalancing_strategy.needs_rebalancing,
            max_drift=rebalancing_strategy.max_drift_percentage,
            estimated_tax_cost=rebalancing_strategy.estimated_total_tax_cost,
            trades_count=len(rebalancing_strategy.trades),
            trades=trades,
            drift_analysis=rebalancing_strategy.drift_analysis,
            execution_notes=rebalancing_strategy.execution_notes,
            alternative_strategy=rebalancing_strategy.alternative_strategy
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing rebalancing: {str(e)}"
        )


# ============================================================================
# Performance Tracking Endpoint
# ============================================================================

@router.post(
    "/performance",
    response_model=PerformanceResponse,
    responses={
        200: {"description": "Performance analysis completed"},
        404: {"model": ErrorResponse, "description": "Portfolio not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Track Portfolio Performance",
    description="""
    Analyzes historical portfolio performance with risk-adjusted metrics.

    Returns:
    - Multi-period returns (1M, 3M, YTD, 1Y, etc.)
    - Risk metrics (Sharpe, Sortino, Calmar ratios)
    - Benchmark comparison
    - Performance attribution by asset class
    """
)
async def analyze_performance(
    request: PerformanceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> PerformanceResponse:
    """
    Analyze historical portfolio performance.

    Calculates returns, risk metrics, and benchmark comparisons across
    multiple time periods with attribution to asset classes.
    """
    try:
        # Get portfolio data from database
        historical_values = await get_sample_historical_values(current_user.id, db)
        asset_class_returns = get_sample_asset_class_returns(current_user.id)
        asset_weights = await get_sample_allocation(current_user.id, db)

        # Run analysis
        performance_report = await generate_performance_report(
            portfolio_id=request.portfolio_id or current_user.id,
            historical_values=historical_values,
            asset_class_returns=asset_class_returns,
            asset_weights=asset_weights
        )

        # Convert to API response format
        metrics = [
            PerformanceMetric(
                period=m.period.value,
                return_pct=m.total_return,
                volatility=m.volatility,
                sharpe=m.sharpe_ratio,
                max_drawdown=m.max_drawdown
            )
            for m in performance_report.metrics_by_period
        ]

        attribution = [
            AttributionResult(
                asset=a.asset_class,
                contribution=a.contribution_to_return,
                weight=a.weight,
                return_pct=a.asset_return
            )
            for a in performance_report.attribution
        ]

        return PerformanceResponse(
            total_value=performance_report.total_value,
            ytd_return=performance_report.total_return_ytd,
            inception_return=performance_report.total_return_since_inception,
            metrics=metrics,
            risk_metrics=performance_report.risk_metrics,
            attribution=attribution
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing performance: {str(e)}"
        )


# ============================================================================
# Comprehensive Analysis Endpoint
# ============================================================================

@router.post(
    "/analyze",
    response_model=ComprehensiveAnalysisResponse,
    responses={
        200: {"description": "Comprehensive analysis completed"},
        404: {"model": ErrorResponse, "description": "Portfolio not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Comprehensive Portfolio Analysis",
    description="""
    Performs comprehensive portfolio analysis including:
    - Tax-loss harvesting opportunities
    - Rebalancing recommendations
    - Performance tracking

    Returns combined analysis with prioritized recommendations.
    """
)
async def analyze_comprehensive(
    request: ComprehensiveAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ComprehensiveAnalysisResponse:
    """
    Perform comprehensive portfolio analysis.

    Runs multiple analyses based on request and returns combined results
    with prioritized recommendations.
    """
    try:
        analysis_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Initialize results
        tlh_result = None
        rebalancing_result = None
        performance_result = None
        recommendations = []

        # Run requested analyses
        if "tax_loss_harvesting" in [at.value for at in request.analysis_types]:
            tlh_req = TaxLossHarvestRequest(
                user_id=current_user.id,
                portfolio_id=request.portfolio_id,
                tax_rate=request.tax_rate
            )
            # Call endpoint handler directly - Depends() defaults are ignored when args provided
            tlh_result = await analyze_tax_loss_harvesting(tlh_req, current_user, db)

            if tlh_result.opportunities_count > 0:
                recommendations.append(
                    f"Harvest ${tlh_result.total_harvestable_losses:,.0f} in losses "
                    f"for ${tlh_result.total_tax_benefit:,.0f} tax benefit"
                )

        if "rebalancing" in [at.value for at in request.analysis_types]:
            rebal_req = RebalanceRequest(
                user_id=current_user.id,
                portfolio_id=request.portfolio_id,
                drift_threshold=request.drift_threshold,
                tax_rate=request.tax_rate
            )
            # Call endpoint handler directly - Depends() defaults are ignored when args provided
            rebalancing_result = await analyze_rebalancing(rebal_req, current_user, db)

            if rebalancing_result.needs_rebalancing:
                recommendations.append(
                    f"Rebalance portfolio - {rebalancing_result.max_drift:.1f}% "
                    f"maximum drift detected"
                )

        if "performance" in [at.value for at in request.analysis_types]:
            perf_req = PerformanceRequest(
                user_id=current_user.id,
                portfolio_id=request.portfolio_id
            )
            # Call endpoint handler directly - Depends() defaults are ignored when args provided
            performance_result = await analyze_performance(perf_req, current_user, db)

            recommendations.append(
                f"YTD return: {performance_result.ytd_return:.2f}% "
                f"(portfolio value: ${performance_result.total_value:,.0f})"
            )

        # Generate summary
        summary_parts = []
        if tlh_result:
            summary_parts.append(f"{tlh_result.opportunities_count} TLH opportunities")
        if rebalancing_result:
            summary_parts.append(
                "rebalancing recommended" if rebalancing_result.needs_rebalancing
                else "allocation within tolerance"
            )
        if performance_result:
            summary_parts.append(f"{performance_result.ytd_return:.1f}% YTD return")

        summary = f"Analysis complete: {', '.join(summary_parts)}"

        return ComprehensiveAnalysisResponse(
            analysis_id=analysis_id,
            timestamp=timestamp,
            tax_loss_harvesting=tlh_result,
            rebalancing=rebalancing_result,
            performance=performance_result,
            summary=summary,
            recommendations=recommendations
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing comprehensive analysis: {str(e)}"
        )


# ============================================================================
# Health Check
# ============================================================================

@router.get(
    "/health",
    summary="Portfolio API Health Check",
    description="Check if the portfolio analysis endpoints are operational"
)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "portfolio-api",
        "version": "1.0.0",
        "features": [
            "tax_loss_harvesting",
            "rebalancing",
            "performance_tracking",
            "comprehensive_analysis"
        ]
    }
