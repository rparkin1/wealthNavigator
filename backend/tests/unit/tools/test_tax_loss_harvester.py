from datetime import datetime

import pytest

from app.tools.tax_loss_harvester import (
    Holding,
    SecurityType,
    Transaction,
    calculate_annual_tlh_benefit,
    check_wash_sale_window,
    detect_wash_sale_violations,
    find_replacement_securities,
    identify_tax_loss_harvesting_opportunities,
)


def iso(dt: datetime) -> str:
    """Helper to keep ISO formatting consistent."""
    return dt.replace(microsecond=0).isoformat()


def test_check_wash_sale_window_handles_window_edges():
    sale_date = datetime(2025, 1, 31)
    assert check_wash_sale_window(sale_date, datetime(2025, 2, 15)) is True
    assert check_wash_sale_window(sale_date, datetime(2025, 3, 5)) is False


@pytest.mark.asyncio
async def test_detect_wash_sale_violations_flags_recent_repurchase():
    transactions = [
        Transaction(ticker="SPY", date=iso(datetime(2025, 1, 10)), transaction_type="buy", shares=10, price=90),
        Transaction(ticker="SPY", date=iso(datetime(2025, 1, 18)), transaction_type="sell", shares=10, price=100),
    ]

    violations = await detect_wash_sale_violations(transactions)

    assert len(violations) == 1
    violation = violations[0]
    assert violation.days_apart == 8
    assert "disallowed" in violation.advice


@pytest.mark.asyncio
async def test_find_replacement_securities_prioritizes_similarity():
    replacements = await find_replacement_securities(
        ticker="SPY",
        asset_class="US_LargeCap",
        security_type=SecurityType.ETF,
    )

    assert [rep.ticker for rep in replacements][:2] == ["IVV", "VTI"]
    assert replacements[0].similarity_score >= replacements[-1].similarity_score


@pytest.mark.asyncio
async def test_identify_tax_loss_harvesting_opportunities_prioritizes_ready_trades():
    holdings = [
        Holding(
            ticker="SPY",
            name="SPDR S&P 500",
            security_type=SecurityType.ETF,
            cost_basis=50_000,
            current_value=32_000,
            shares=100,
            purchase_date=iso(datetime(2024, 1, 5)),
            asset_class="US_LargeCap",
        ),
        Holding(
            ticker="QQQ",
            name="Invesco QQQ Trust",
            security_type=SecurityType.ETF,
            cost_basis=30_000,
            current_value=26_000,
            shares=50,
            purchase_date=iso(datetime(2024, 1, 12)),
            asset_class="US_Tech",
        ),
    ]

    recent_transactions = [
        Transaction(
            ticker="QQQ",
            date=iso(datetime(2024, 8, 1)),
            transaction_type="buy",
            shares=50,
            price=350,
        ),
        Transaction(
            ticker="QQQ",
            date=iso(datetime(2024, 8, 15)),
            transaction_type="sell",
            shares=50,
            price=360,
        ),
    ]

    strategy = await identify_tax_loss_harvesting_opportunities(
        holdings=holdings,
        recent_transactions=recent_transactions,
        tax_rate=0.24,
        min_loss_threshold=1_000.0,
    )

    assert strategy.total_harvestable_losses == 18_000.0  # Only SPY counted (no wash sale risk)
    assert strategy.optimal_execution_order == ["SPY"]
    assert any(opp.wash_sale_risk for opp in strategy.opportunities if opp.holding.ticker == "QQQ")
    assert strategy.wash_sale_violations  # should detect the recent buy/sell pair
    assert "Significant opportunity" in strategy.strategy_notes


@pytest.mark.asyncio
async def test_calculate_annual_tlh_benefit_scales_and_caps():
    baseline = await calculate_annual_tlh_benefit(
        portfolio_value=200_000,
        volatility=0.20,
        rebalancing_frequency=12,
        tax_rate=0.24,
    )
    assert pytest.approx(baseline, rel=1e-2) == 1_333.33

    capped = await calculate_annual_tlh_benefit(
        portfolio_value=500_000,
        volatility=0.40,
        rebalancing_frequency=52,
        tax_rate=0.37,
    )
    assert capped == pytest.approx(7_500.0, rel=1e-2)  # 1.5% cap applied
