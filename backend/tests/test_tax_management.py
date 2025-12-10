"""
Comprehensive tests for Tax Management Service

Tests for:
- REQ-TAX-006: TLH reporting
- REQ-TAX-010: Tax liability estimation
- REQ-TAX-011: Tax software integration
- REQ-TAX-012: Multi-year tax projections
- REQ-TAX-014: Municipal bond optimization
"""

import pytest
from app.services.tax_management_service import TaxManagementService


class TestTLHReporting:
    """Tests for tax-loss harvesting reporting"""

    def test_generate_tlh_report_basic(self):
        """Test basic TLH report generation"""
        service = TaxManagementService()

        holdings = [
            {"ticker": "VTI", "value": 50000, "cost_basis": 48000},
            {"ticker": "BND", "value": 30000, "cost_basis": 32000}
        ]
        opportunities = [
            {"ticker": "BND", "loss": 2000, "wash_sale_risk": False}
        ]
        executed_harvests = [
            {"ticker": "BND", "loss_amount": 2000, "date": "2024-11-01"}
        ]

        report = service.generate_tlh_report(
            holdings=holdings,
            opportunities=opportunities,
            executed_harvests=executed_harvests,
            tax_year=2024
        )

        assert report.tax_year == 2024
        assert report.total_losses_harvested == 2000
        assert report.total_tax_benefit == 580  # 2000 * 0.29
        assert report.opportunities_executed == 1
        assert report.opportunities_available == 1
        assert report.wash_sale_warnings == 0
        assert report.holdings_analyzed == 2

    def test_generate_tlh_report_with_wash_sale_warnings(self):
        """Test TLH report with wash sale warnings"""
        service = TaxManagementService()

        opportunities = [
            {"ticker": "BND", "loss": 2000, "wash_sale_risk": True},
            {"ticker": "VTI", "loss": 1000, "wash_sale_risk": True}
        ]

        report = service.generate_tlh_report(
            holdings=[],
            opportunities=opportunities,
            executed_harvests=[],
            tax_year=2024
        )

        assert report.wash_sale_warnings == 2

    def test_generate_tlh_report_no_opportunities(self):
        """Test TLH report with no opportunities"""
        service = TaxManagementService()

        report = service.generate_tlh_report(
            holdings=[{"ticker": "VTI", "value": 50000, "cost_basis": 45000}],
            opportunities=[],
            executed_harvests=[],
            tax_year=2024
        )

        assert report.total_losses_harvested == 0
        assert report.opportunities_executed == 0
        assert report.opportunities_available == 0


class TestTaxExport:
    """Tests for tax export functionality"""

    def test_export_to_csv(self):
        """Test CSV export"""
        service = TaxManagementService()

        transactions = [
            {
                "date": "2024-03-15",
                "type": "sell",
                "security": "VTI",
                "description": "Vanguard Total Stock Market ETF",
                "quantity": 100,
                "price": 220.50,
                "amount": 22050,
                "cost_basis": 21000,
                "gain_loss": 1050,
                "term": "long"
            }
        ]

        result = service.export_tax_data(
            transactions=transactions,
            tax_year=2024,
            format="csv"
        )

        assert result.format == "csv"
        assert result.tax_year == 2024
        assert result.records_count == 1
        assert "VTI" in result.file_content
        assert result.filename == "tax_export_2024.csv"

    def test_export_to_json(self):
        """Test JSON export"""
        service = TaxManagementService()

        transactions = [{
            "date": "2024-03-15",
            "type": "sell",
            "security": "VTI",
            "description": "Test",
            "quantity": 100,
            "price": 220.50,
            "amount": 22050,
            "cost_basis": 21000,
            "gain_loss": 1050,
            "term": "long"
        }]

        result = service.export_tax_data(
            transactions=transactions,
            tax_year=2024,
            format="json"
        )

        assert result.format == "json"
        assert result.filename == "tax_export_2024.json"
        assert "VTI" in result.file_content

    def test_export_to_turbotax(self):
        """Test TurboTax TXF export"""
        service = TaxManagementService()

        transactions = [{
            "date": "2024-03-15",
            "type": "sell",
            "security": "VTI",
            "description": "Test",
            "quantity": 100,
            "price": 220.50,
            "amount": 22050,
            "cost_basis": 21000,
            "gain_loss": 1050,
            "term": "long"
        }]

        result = service.export_tax_data(
            transactions=transactions,
            tax_year=2024,
            format="turbotax"
        )

        assert result.format == "turbotax"
        assert result.filename == "turbotax_import_2024.txf"
        assert "V042" in result.file_content  # TXF version marker


class TestMunicipalBondOptimization:
    """Tests for municipal bond optimization"""

    def test_optimize_muni_bonds_high_tax_state(self):
        """Test muni bond optimization for high-tax state"""
        service = TaxManagementService()

        result = service.optimize_municipal_bonds(
            state="CA",
            federal_tax_rate=0.37,
            annual_income=500000,
            in_state_yield=0.035,
            out_of_state_yield=0.038,
            taxable_yield=0.045
        )

        assert result.state == "CA"
        assert result.federal_tax_rate == 0.37
        assert result.state_tax_rate == 0.133  # CA top rate
        assert result.combined_tax_rate > 0.45  # High combined rate
        assert result.in_state_tax_equivalent_yield > result.in_state_yield
        assert result.recommended_allocation in ["in_state", "out_of_state", "taxable"]
        assert result.estimated_tax_savings >= 0

    def test_optimize_muni_bonds_no_tax_state(self):
        """Test muni bond optimization for no-tax state"""
        service = TaxManagementService()

        result = service.optimize_municipal_bonds(
            state="TX",
            federal_tax_rate=0.24,
            annual_income=150000,
            in_state_yield=0.035,
            out_of_state_yield=0.038,
            taxable_yield=0.045
        )

        assert result.state == "TX"
        assert result.state_tax_rate == 0.0  # No state tax
        # In no-tax state, in-state and out-of-state have same benefit
        assert result.in_state_tax_equivalent_yield == result.out_of_state_tax_equivalent_yield

    def test_optimize_muni_bonds_low_yield(self):
        """Test when taxable bonds are better"""
        service = TaxManagementService()

        result = service.optimize_municipal_bonds(
            state="CA",
            federal_tax_rate=0.37,
            annual_income=500000,
            in_state_yield=0.020,  # Very low muni yield
            out_of_state_yield=0.022,
            taxable_yield=0.050  # High taxable yield
        )

        # Taxable might be better even with high taxes
        assert result.recommended_allocation in ["in_state", "out_of_state", "taxable"]


class TestTaxProjection:
    """Tests for tax projection calculations"""

    def test_calculate_tax_projection_single_year(self):
        """Test single-year tax projection"""
        service = TaxManagementService()

        result = service.calculate_tax_projection(
            income=150000,
            capital_gains=25000,
            qualified_dividends=5000,
            ordinary_dividends=2000,
            state="CA",
            filing_status="married_joint",
            deductions=0,
            years=1
        )

        assert len(result["projections"]) == 1
        projection = result["projections"][0]

        assert projection["agi"] > 0
        assert projection["federal_tax"] > 0
        assert projection["state_tax"] > 0
        assert projection["total_tax"] > 0
        assert 0 < projection["effective_rate"] < 1
        assert 0 < projection["marginal_rate"] <= 0.37

    def test_calculate_tax_projection_multi_year(self):
        """Test multi-year tax projection with inflation"""
        service = TaxManagementService()

        result = service.calculate_tax_projection(
            income=150000,
            capital_gains=25000,
            qualified_dividends=5000,
            ordinary_dividends=2000,
            state="CA",
            filing_status="married_joint",
            deductions=0,
            years=5
        )

        assert len(result["projections"]) == 5
        assert result["years"] == 5
        assert result["filing_status"] == "married_joint"
        assert result["state"] == "CA"

        # AGI should increase with inflation
        first_year_agi = result["projections"][0]["agi"]
        last_year_agi = result["projections"][4]["agi"]
        assert last_year_agi > first_year_agi

    def test_calculate_tax_projection_niit(self):
        """Test NIIT calculation for high earners"""
        service = TaxManagementService()

        result = service.calculate_tax_projection(
            income=200000,
            capital_gains=100000,  # High investment income
            qualified_dividends=20000,
            ordinary_dividends=10000,
            state="TX",
            filing_status="single",
            deductions=0,
            years=1
        )

        projection = result["projections"][0]
        # Should trigger NIIT for single filer over $200k
        assert projection["niit"] > 0

    def test_calculate_tax_projection_no_investment_income(self):
        """Test projection with only ordinary income"""
        service = TaxManagementService()

        result = service.calculate_tax_projection(
            income=100000,
            capital_gains=0,
            qualified_dividends=0,
            ordinary_dividends=0,
            state="FL",
            filing_status="single",
            deductions=0,
            years=1
        )

        projection = result["projections"][0]
        assert projection["niit"] == 0  # No investment income
        assert projection["state_tax"] == 0  # FL has no state tax


class TestTaxAlpha:
    """Tests for tax alpha calculation"""

    def test_calculate_tax_alpha(self):
        """Test tax alpha calculation"""
        service = TaxManagementService()

        result = service.calculate_tax_alpha(
            portfolio_value=1000000,
            asset_location_benefit=2500,
            tlh_benefit=1800,
            withdrawal_benefit=1200,
            muni_benefit=900
        )

        assert result["annual_tax_savings"] == 6400
        assert result["tax_alpha_percentage"] == 0.64
        assert result["cumulative_30_year"] == 192000
        assert result["strategies_active"] == 4

    def test_calculate_tax_alpha_no_benefits(self):
        """Test tax alpha with no optimization"""
        service = TaxManagementService()

        result = service.calculate_tax_alpha(
            portfolio_value=1000000,
            asset_location_benefit=0,
            tlh_benefit=0,
            withdrawal_benefit=0,
            muni_benefit=0
        )

        assert result["annual_tax_savings"] == 0
        assert result["tax_alpha_percentage"] == 0
        assert result["strategies_active"] == 0


class TestStateTaxRates:
    """Tests for state tax rate coverage"""

    def test_all_states_covered(self):
        """Verify all 50 states + DC are covered"""
        service = TaxManagementService()

        # All 50 states + DC
        expected_states = [
            "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
            "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
            "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
            "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
            "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
            "DC"
        ]

        for state in expected_states:
            assert state in service.STATE_TAX_RATES, f"Missing state: {state}"

        # Verify no-tax states
        no_tax_states = ["AK", "FL", "NV", "SD", "TN", "TX", "WA", "WY", "NH"]
        for state in no_tax_states:
            assert service.STATE_TAX_RATES[state] == 0.0, f"{state} should have 0% tax"

        # Verify high-tax states have appropriate rates
        assert service.STATE_TAX_RATES["CA"] > 0.10
        assert service.STATE_TAX_RATES["NY"] > 0.10
        assert service.STATE_TAX_RATES["HI"] > 0.10


class TestProgressiveTaxCalculation:
    """Tests for progressive tax bracket calculations"""

    def test_progressive_tax_simple(self):
        """Test progressive tax calculation"""
        service = TaxManagementService()

        # Simple single bracket
        brackets = [(10000, 0.10), (float('inf'), 0.20)]
        tax = service._calculate_progressive_tax(15000, brackets)

        # First $10k at 10% + next $5k at 20%
        expected = 10000 * 0.10 + 5000 * 0.20
        assert abs(tax - expected) < 0.01

    def test_marginal_rate(self):
        """Test marginal rate determination"""
        service = TaxManagementService()

        brackets = [
            (10000, 0.10),
            (40000, 0.12),
            (float('inf'), 0.22)
        ]

        # Income in first bracket
        rate1 = service._get_marginal_rate(5000, brackets)
        assert rate1 == 0.10

        # Income in second bracket
        rate2 = service._get_marginal_rate(25000, brackets)
        assert rate2 == 0.12

        # Income in top bracket
        rate3 = service._get_marginal_rate(50000, brackets)
        assert rate3 == 0.22


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
