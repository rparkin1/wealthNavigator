"""
Phase 4 Integration Smoke Tests

Exercises tax, risk, and goal funding APIs together to validate async orchestration.
"""

import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

TAX_ALPHA_ENDPOINT = "/api/v1/tax-management/tax-alpha"
RISK_ASSESS_ENDPOINT = "/api/v1/risk-management/risk-management/assess-risk"
GOAL_SUCCESS_ENDPOINT = "/api/v1/goal-planning/funding/calculate-success-probability"


@pytest.mark.asyncio
async def test_multi_service_async_smoke():
    """Run key service endpoints concurrently to ensure orchestration remains healthy."""
    tax_payload = {
        "portfolio_value": 750000,
        "asset_location_benefit": 1800,
        "tlh_benefit": 1200,
        "withdrawal_benefit": 950,
        "muni_benefit": 400,
    }

    risk_payload = {
        "portfolio_value": 750000,
        "allocation": {
            "US_STOCKS": 0.55,
            "INTL_STOCKS": 0.25,
            "BONDS": 0.15,
            "CASH": 0.05,
        },
        "expected_return": 0.075,
        "volatility": 0.16,
        "returns_history": [0.01, -0.02, 0.015, 0.005, 0.012],
        "benchmark_returns": [0.008, -0.018, 0.017, 0.006, 0.011],
    }

    goal_payload = {
        "target_amount": 900000,
        "current_amount": 120000,
        "monthly_contribution": 1400,
        "years_to_goal": 18,
        "expected_return": 0.07,
        "return_volatility": 0.15,
        "iterations": 2000,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tax_resp, risk_resp, goal_resp = await asyncio.gather(
            client.post(TAX_ALPHA_ENDPOINT, json=tax_payload),
            client.post(RISK_ASSESS_ENDPOINT, json=risk_payload),
            client.post(GOAL_SUCCESS_ENDPOINT, json=goal_payload),
        )

    assert tax_resp.status_code == 200
    tax_data = tax_resp.json()
    assert tax_data["annual_tax_savings"] > 0
    assert tax_data["strategies_active"] >= 3

    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert "metrics" in risk_data and "risk_score" in risk_data["metrics"]
    assert 0 <= risk_data["metrics"]["risk_score"] <= 100
    assert risk_data["portfolio_value"] == pytest.approx(risk_payload["portfolio_value"])

    assert goal_resp.status_code == 200
    goal_data = goal_resp.json()
    assert 0 <= goal_data["success_probability"] <= 1
    assert goal_data["iterations"] == goal_payload["iterations"]
    assert goal_data["expected_value"] > goal_payload["current_amount"]


@pytest.mark.asyncio
async def test_tax_alpha_informs_goal_plan():
    """Leverage tax alpha output to adjust goal funding inputs and validate resulting success probability."""
    tax_payload = {
        "portfolio_value": 500000,
        "asset_location_benefit": 1500,
        "tlh_benefit": 900,
        "withdrawal_benefit": 600,
        "muni_benefit": 300,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        tax_resp = await client.post(TAX_ALPHA_ENDPOINT, json=tax_payload)

    assert tax_resp.status_code == 200
    tax_data = tax_resp.json()

    # Redirect tax alpha savings into additional monthly contributions
    annual_alpha = tax_data["annual_tax_savings"]
    boosted_contribution = 1000 + annual_alpha / 12

    goal_payload = {
        "target_amount": 650000,
        "current_amount": 85000,
        "monthly_contribution": boosted_contribution,
        "years_to_goal": 15,
        "expected_return": 0.072,
        "return_volatility": 0.14,
        "iterations": 2500,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        baseline_payload = dict(goal_payload, monthly_contribution=1000)
        baseline_resp, goal_resp = await asyncio.gather(
            client.post(GOAL_SUCCESS_ENDPOINT, json=baseline_payload),
            client.post(GOAL_SUCCESS_ENDPOINT, json=goal_payload),
        )

    assert baseline_resp.status_code == 200
    assert goal_resp.status_code == 200

    baseline = baseline_resp.json()
    result = goal_resp.json()
    assert result["success_probability"] >= baseline["success_probability"]
    assert result["shortfall_risk"] <= baseline["shortfall_risk"]
    assert result["median_outcome"] >= baseline["median_outcome"]
