import pytest

from app.services.reserve_monitoring_service import (
    ReserveMonitoringService,
    ReserveStatus,
)


service = ReserveMonitoringService()


def test_monitor_reserves_flags_low_coverage_and_generates_alerts():
    result = service.monitor_reserves(
        current_reserves=1500,
        monthly_expenses=2000,
        monthly_income=5000,
        has_dependents=True,
        income_stability="variable",
        job_security="at_risk",
    )

    assert result.reserve_status == ReserveStatus.CRITICAL
    assert result.target_met is False
    assert result.shortfall > 0
    severities = {alert.severity for alert in result.alerts}
    assert "critical" in severities
    assert "warning" in severities  # variable income/job risk triggers warning


def test_monitor_reserves_positive_reinforcement_when_targets_met():
    result = service.monitor_reserves(
        current_reserves=50_000,
        monthly_expenses=3_000,
        monthly_income=7_500,
        has_dependents=False,
        income_stability="stable",
        job_security="secure",
    )

    assert result.target_met is True
    assert result.reserve_status in (ReserveStatus.STRONG, ReserveStatus.EXCELLENT)
    assert any("Maintain" in rec.action for rec in result.recommendations)


def test_calculate_reserve_adequacy_score_returns_rating():
    score = service.calculate_reserve_adequacy_score(
        months_coverage=3,
        target_months=6,
    )

    assert score["rating"] == "Fair"
    assert score["score"] == 50.0

    excellent = service.calculate_reserve_adequacy_score(
        months_coverage=12,
        target_months=6,
    )
    assert excellent["rating"] == "Excellent"


def test_simulate_reserve_growth_reaches_target():
    simulation = service.simulate_reserve_growth(
        current_reserves=5_000,
        monthly_contribution=1_000,
        target_amount=15_000,
        months_to_simulate=18,
    )

    assert simulation["target_reached_month"] == 10
    assert simulation["projection"][10]["balance"] == 15_000
