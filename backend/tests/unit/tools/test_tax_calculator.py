import pytest

from app.tools.tax_calculator import (
    AccountType,
    calculate_tax_alpha,
    calculate_withdrawal_strategy,
    identify_tax_loss_harvesting,
    optimize_asset_location,
)


@pytest.mark.asyncio
async def test_optimize_asset_location_prioritizes_tax_inefficient_assets():
    recommendations = await optimize_asset_location(
        total_portfolio_value=100_000,
        target_allocation={"REITs": 0.2, "bonds": 0.4, "stocks": 0.4},
        account_balances={
            AccountType.TAX_DEFERRED: 60_000,
            AccountType.TAX_EXEMPT: 20_000,
            AccountType.TAXABLE: 20_000,
        },
        tax_rate=0.32,
    )

    # Lowest-efficiency assets should be steered into tax-advantaged accounts
    reit_rec = next(rec for rec in recommendations if rec.asset_class == "REITs")
    assert reit_rec.recommended_account == AccountType.TAX_DEFERRED
    assert reit_rec.tax_alpha_estimate > 0

    # Tax-efficient assets should remain in taxable accounts
    stock_rec = next(rec for rec in recommendations if rec.asset_class == "stocks")
    assert stock_rec.recommended_account == AccountType.TAXABLE
    assert stock_rec.tax_alpha_estimate == 0.0


@pytest.mark.asyncio
async def test_optimize_asset_location_handles_taxable_only_portfolio():
    recommendations = await optimize_asset_location(
        total_portfolio_value=50_000,
        target_allocation={"stocks": 1.0},
        account_balances={AccountType.TAXABLE: 50_000},
    )

    assert len(recommendations) == 1
    assert recommendations[0].recommended_account == AccountType.TAXABLE
    assert recommendations[0].tax_alpha_estimate == 0.0


@pytest.mark.asyncio
async def test_calculate_tax_alpha_respects_optimization_flag():
    assert await calculate_tax_alpha(
        portfolio_value=200_000,
        allocation={"bonds": 0.3, "REITs": 0.2},
        optimized=False,
    ) == 0.0

    optimized_alpha = await calculate_tax_alpha(
        portfolio_value=200_000,
        allocation={"bonds": 0.3, "REITs": 0.2},
        optimized=True,
    )

    more_tax_alpha = await calculate_tax_alpha(
        portfolio_value=200_000,
        allocation={"bonds": 0.5, "REITs": 0.3},
        optimized=True,
    )

    assert optimized_alpha > 0
    assert more_tax_alpha > optimized_alpha


@pytest.mark.asyncio
async def test_identify_tax_loss_harvesting_sorts_by_benefit_and_flags_risk():
    holdings = [
        {"security": "S&P 500 Index (SPY)", "cost_basis": 15_000, "current_value": 9_000},
        {"security": "International Equity Fund", "cost_basis": 10_000, "current_value": 9_600},
        {"security": "Total Market Index (VTI)", "cost_basis": 12_000, "current_value": 9_000},
    ]

    opportunities = await identify_tax_loss_harvesting(holdings, tax_rate=0.35)

    assert [opp.security for opp in opportunities][0] == "S&P 500 Index (SPY)"
    assert opportunities[0].replacement_security == "Vanguard Total Stock Market (VTI)"
    # Generic replacements should be marked as potential wash sale risks
    generic_opportunity = next(opp for opp in opportunities if opp.security == "International Equity Fund")
    assert generic_opportunity.wash_sale_risk is True
    assert opportunities == sorted(opportunities, key=lambda opp: opp.tax_benefit, reverse=True)


@pytest.mark.asyncio
async def test_calculate_withdrawal_strategy_prioritizes_taxable_then_deferred():
    strategy = await calculate_withdrawal_strategy(
        account_balances={
            AccountType.TAXABLE: 80_000,
            AccountType.TAX_DEFERRED: 200_000,
            AccountType.TAX_EXEMPT: 50_000,
        },
        annual_withdrawal_needed=60_000,
        age=60,
        tax_rate=0.24,
    )

    assert strategy.account_order == ["Taxable", "Tax-Deferred", "Tax-Exempt (Roth)"]
    assert strategy.estimated_annual_tax > 0
    assert "taxable first" in strategy.strategy_notes.lower()


@pytest.mark.asyncio
async def test_calculate_withdrawal_strategy_honors_rmds():
    strategy = await calculate_withdrawal_strategy(
        account_balances={
            AccountType.TAX_DEFERRED: 120_000,
            AccountType.TAX_EXEMPT: 40_000,
        },
        annual_withdrawal_needed=30_000,
        age=75,
        tax_rate=0.22,
    )

    assert strategy.account_order[0].startswith("Tax-Deferred")
    assert "RMD" in strategy.strategy_notes
