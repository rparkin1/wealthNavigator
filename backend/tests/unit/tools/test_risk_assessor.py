import pytest

from app.tools.risk_assessor import assess_risk, calculate_var


@pytest.mark.asyncio
async def test_assess_risk_high_volatility_flags_aggressive_profile():
    allocation = {
        "stocks": 0.6,
        "US_LargeCap": 0.2,
        "US_SmallCap": 0.1,
        "bonds": 0.1,
    }
    result = await assess_risk(
        portfolio_value=500_000,
        allocation=allocation,
        expected_return=0.08,
        volatility=0.40,
        time_horizon=20,
    )

    assert result.risk_level == "aggressive"
    assert any("volatility is high" in rec for rec in result.recommendations)
    assert any(strategy.strategy_type == "protective_put" for strategy in result.hedging_strategies)
    assert result.metrics.value_at_risk_99 > result.metrics.value_at_risk_95


@pytest.mark.asyncio
async def test_assess_risk_conservative_portfolio_limits_hedging():
    allocation = {"stocks": 0.35, "bonds": 0.55, "cash": 0.10}
    result = await assess_risk(
        portfolio_value=80_000,
        allocation=allocation,
        expected_return=0.06,
        volatility=0.08,
        time_horizon=10,
    )

    assert result.risk_level in {"conservative", "moderate"}
    assert len(result.hedging_strategies) == 1
    assert result.hedging_strategies[0].strategy_type == "diversification"


@pytest.mark.asyncio
async def test_calculate_var_monotonic_with_confidence_level():
    ninety_five = await calculate_var(
        portfolio_value=100_000,
        volatility=0.20,
        confidence_level=0.95,
        time_horizon_days=1,
    )
    ninety_nine = await calculate_var(
        portfolio_value=100_000,
        volatility=0.20,
        confidence_level=0.99,
        time_horizon_days=1,
    )

    assert ninety_nine > ninety_five


@pytest.mark.asyncio
async def test_calculate_var_supports_custom_confidence_levels():
    custom = await calculate_var(
        portfolio_value=50_000,
        volatility=0.18,
        confidence_level=0.975,
        time_horizon_days=5,
    )

    assert custom > 0
