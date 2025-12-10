import json

import pytest

from app.services.tax_management_service import (
    TaxExportFormat,
    TaxManagementService,
)


service = TaxManagementService()


def test_generate_tlh_report_summarises_losses():
    holdings = [{"symbol": "SPY"}, {"symbol": "BND"}]
    opportunities = [
        {"symbol": "TLT", "wash_sale_risk": True},
        {"symbol": "QQQ", "wash_sale_risk": False},
    ]
    executed = [
        {"symbol": "QQQ", "loss_amount": 3500},
        {"symbol": "EEM", "loss_amount": 1500},
    ]

    report = service.generate_tlh_report(
        holdings=holdings,
        opportunities=opportunities,
        executed_harvests=executed,
        tax_year=2024,
    )

    assert report.total_losses_harvested == 5000.0
    assert report.total_tax_benefit == pytest.approx(1450.0)
    assert report.wash_sale_warnings == 1
    assert report.opportunities_executed == 2
    assert report.holdings_analyzed == 2


@pytest.mark.parametrize(
    "format_,extension",
    [
        (TaxExportFormat.CSV, ".csv"),
        (TaxExportFormat.JSON, ".json"),
        (TaxExportFormat.TURBOTAX, ".txf"),
    ],
)
def test_export_tax_data_supports_multiple_formats(format_, extension):
    transactions = [
        {
            "date": "2024-03-12",
            "type": "sell",
            "security": "SPY",
            "description": "Partial rebalance",
            "quantity": 10,
            "price": 450.0,
            "amount": 4500.0,
            "cost_basis": 3200.0,
            "gain_loss": 1300.0,
            "term": "long",
        },
        {
            "date": "2024-04-01",
            "type": "dividend",
            "security": "BND",
            "description": "Monthly dividend",
            "quantity": 0,
            "price": 0,
            "amount": 120.0,
        },
    ]

    result = service.export_tax_data(transactions, tax_year=2024, format=format_)

    assert result.records_count == 2
    assert result.filename.endswith(extension)
    assert result.format == format_

    if format_ == TaxExportFormat.CSV:
        rows = result.file_content.strip().splitlines()
        assert rows[0].startswith("Date,Type,Security")
        assert any("SPY" in row for row in rows[1:])
    elif format_ == TaxExportFormat.JSON:
        payload = json.loads(result.file_content)
        assert payload[0]["security"] == "SPY"
        assert payload[1]["transaction_type"] == "dividend"
    else:  # TurboTax
        assert "TD" in result.file_content
        assert "SPY" in result.file_content


def test_optimize_municipal_bonds_prefers_in_state_when_rates_high():
    recommendation = service.optimize_municipal_bonds(
        state="CA",
        federal_tax_rate=0.32,
        annual_income=180_000,
        in_state_yield=0.035,
        out_of_state_yield=0.031,
        taxable_yield=0.045,
    )

    assert recommendation.recommended_allocation == "in_state"
    assert recommendation.in_state_tax_equivalent_yield > recommendation.taxable_yield
    assert "CA" in recommendation.reasoning


def test_calculate_tax_alpha_accumulates_benefits():
    summary = service.calculate_tax_alpha(
        portfolio_value=750_000,
        asset_location_benefit=1200,
        tlh_benefit=1600,
        withdrawal_benefit=900,
        muni_benefit=500,
    )

    assert summary["annual_tax_savings"] == 4_200
    assert summary["tax_alpha_percentage"] == pytest.approx(0.56, rel=1e-3)
    assert summary["strategies_active"] == 4
    assert summary["cumulative_30_year"] == 126_000
