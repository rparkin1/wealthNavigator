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


router = APIRouter(prefix="/portfolio", tags=["portfolio"])


# ============================================================================
# Helper Functions
# ============================================================================

def get_sample_holdings(user_id: str) -> list:
    """
    Get sample holdings for demonstration.

    In production, this would fetch from database based on user_id.
    """
    return [
        Holding(
            ticker="SPY",
            name="SPDR S&P 500 ETF",
            security_type=TLHSecurityType.ETF,
            cost_basis=45000,
            current_value=42000,
            shares=100,
            purchase_date="2024-01-15",
            asset_class="US_LargeCap",
            expense_ratio=0.0095
        ),
        Holding(
            ticker="VTI",
            name="Vanguard Total Stock Market",
            security_type=TLHSecurityType.ETF,
            cost_basis=30000,
            current_value=32000,
            shares=150,
            purchase_date="2023-06-01",
            asset_class="US_LargeCap",
            expense_ratio=0.0003
        ),
        Holding(
            ticker="QQQ",
            name="Invesco QQQ Trust",
            security_type=TLHSecurityType.ETF,
            cost_basis=25000,
            current_value=23500,
            shares=75,
            purchase_date="2024-03-10",
            asset_class="US_Technology",
            expense_ratio=0.0020
        ),
    ]


def get_sample_transactions(user_id: str) -> list:
    """Get sample recent transactions for wash sale detection"""
    return [
        Transaction(
            ticker="SPY",
            date="2024-09-15",
            transaction_type="buy",
            shares=10,
            price=450.0
        )
    ]


def get_sample_allocation(user_id: str) -> dict:
    """Get sample target allocation"""
    return {
        "US_LargeCap": 0.45,
        "US_SmallCap": 0.15,
        "International": 0.25,
        "Bonds": 0.15
    }


def get_sample_current_holdings(user_id: str) -> dict:
    """Get sample current holdings by asset class"""
    total_value = 150000
    return {
        "US_LargeCap": total_value * 0.52,  # 7% overweight
        "US_SmallCap": total_value * 0.10,  # 5% underweight
        "International": total_value * 0.20,  # 5% underweight
        "Bonds": total_value * 0.18,  # 3% overweight
    }


def get_sample_account_breakdown(user_id: str) -> dict:
    """Get sample account breakdown"""
    return {
        RebalancingAccountType.TAXABLE: {
            "US_LargeCap": 50000,
            "US_SmallCap": 10000,
        },
        RebalancingAccountType.TAX_DEFERRED: {
            "International": 20000,
            "Bonds": 20000,
        },
        RebalancingAccountType.TAX_EXEMPT: {
            "US_LargeCap": 28000,
            "International": 10000,
            "Bonds": 7000,
        }
    }


def get_sample_historical_values(user_id: str) -> dict:
    """Get sample historical portfolio values"""
    dates = [f"2024-{month:02d}-01" for month in range(1, 13)]
    base_value = 100000

    # Simulate portfolio growth
    np.random.seed(42)
    returns = np.random.normal(0.08 / 12, 0.15 / np.sqrt(12), len(dates))
    cumulative = np.cumprod(1 + returns)
    values = {date: base_value * cum for date, cum in zip(dates, cumulative)}

    return values


def get_sample_asset_class_returns(user_id: str) -> dict:
    """Get sample asset class returns"""
    dates = [f"2024-{month:02d}-01" for month in range(1, 13)]
    np.random.seed(42)
    returns = np.random.normal(0.08 / 12, 0.15 / np.sqrt(12), len(dates))

    return {
        "US_LargeCap": {date: ret * 1.1 for date, ret in zip(dates, returns)},
        "Bonds": {date: ret * 0.4 for date, ret in zip(dates, returns)},
    }


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
        # Get holdings and transactions (from database in production)
        holdings = get_sample_holdings(current_user.id)
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
        # Get portfolio data (from database in production)
        target_allocation = get_sample_allocation(current_user.id)
        current_holdings = get_sample_current_holdings(current_user.id)
        account_breakdown = get_sample_account_breakdown(current_user.id)

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
        # Get portfolio data (from database in production)
        historical_values = get_sample_historical_values(current_user.id)
        asset_class_returns = get_sample_asset_class_returns(current_user.id)
        asset_weights = get_sample_allocation(current_user.id)

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
