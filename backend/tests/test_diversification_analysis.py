"""
Unit tests for Diversification Analysis Service
Tests REQ-RISK-008, REQ-RISK-009, REQ-RISK-010
"""

import pytest
from app.services.risk.diversification_analysis import (
    DiversificationAnalysisService,
    HoldingInfo,
    DiversificationMetrics,
    ConcentrationRisk,
    DiversificationRecommendation,
)


class TestDiversificationAnalysis:
    """Test suite for diversification analysis"""

    def test_basic_diversification_metrics(self):
        """Test basic diversification metrics calculation (REQ-RISK-008)"""
        service = DiversificationAnalysisService()

        # Portfolio with 5 equal holdings
        holdings = [
            HoldingInfo(
                symbol=f"STOCK{i}",
                name=f"Stock {i}",
                value=10000,
                weight=0.20,
                asset_class="US_LargeCap",
                sector=f"Sector{i}",
                geography="US"
            )
            for i in range(5)
        ]

        result = service.analyze_diversification(
            portfolio_value=50000,
            holdings=holdings
        )

        metrics = result.metrics

        # Check basic metrics
        assert metrics.total_holdings == 5
        assert metrics.effective_holdings == pytest.approx(5.0, rel=0.01)  # 1/HHI with equal weights
        assert metrics.top_1_concentration == 0.20
        assert metrics.top_5_concentration == 1.0
        assert metrics.herfindahl_index == pytest.approx(0.20, rel=0.01)  # 5 * 0.2^2

    def test_concentration_risk_single_security(self):
        """Test single security concentration risk detection (REQ-RISK-009)"""
        service = DiversificationAnalysisService()

        # Portfolio with one large holding
        holdings = [
            HoldingInfo(
                symbol="AAPL",
                name="Apple Inc.",
                value=150000,
                weight=0.75,  # 75% concentration - CRITICAL
                asset_class="US_LargeCap",
                sector="Technology",
                geography="US"
            ),
            HoldingInfo(
                symbol="MSFT",
                name="Microsoft",
                value=50000,
                weight=0.25,
                asset_class="US_LargeCap",
                sector="Technology",
                geography="US"
            ),
        ]

        result = service.analyze_diversification(
            portfolio_value=200000,
            holdings=holdings
        )

        # Should detect critical concentration in AAPL
        security_risks = [r for r in result.concentration_risks if r.risk_type == "security"]
        assert len(security_risks) > 0

        critical_risks = [r for r in security_risks if r.risk_level == "critical"]
        assert len(critical_risks) > 0
        assert "AAPL" in critical_risks[0].affected_holdings

    def test_sector_concentration_risk(self):
        """Test sector concentration risk detection (REQ-RISK-009)"""
        service = DiversificationAnalysisService()

        # Portfolio concentrated in Technology sector
        holdings = [
            HoldingInfo(
                symbol=f"TECH{i}",
                name=f"Tech Stock {i}",
                value=20000,
                weight=0.20,
                asset_class="US_LargeCap",
                sector="Technology",  # All in same sector
                geography="US"
            )
            for i in range(5)
        ]

        result = service.analyze_diversification(
            portfolio_value=100000,
            holdings=holdings
        )

        # Should detect critical sector concentration (100% in Technology)
        sector_risks = [r for r in result.concentration_risks if r.risk_type == "sector"]
        assert len(sector_risks) > 0
        assert sector_risks[0].concentration_pct == 1.0

    def test_geographic_diversification(self):
        """Test geographic diversification analysis (REQ-RISK-008)"""
        service = DiversificationAnalysisService()

        # Portfolio with geographic diversification
        holdings = [
            HoldingInfo(
                symbol="VTI",
                name="US Total Market",
                value=40000,
                weight=0.40,
                asset_class="US_Blend",
                geography="US"
            ),
            HoldingInfo(
                symbol="VEA",
                name="International Developed",
                value=40000,
                weight=0.40,
                asset_class="International_Developed",
                geography="International_Developed"
            ),
            HoldingInfo(
                symbol="VWO",
                name="Emerging Markets",
                value=20000,
                weight=0.20,
                asset_class="Emerging_Markets",
                geography="Emerging_Markets"
            ),
        ]

        result = service.analyze_diversification(
            portfolio_value=100000,
            holdings=holdings
        )

        # Should have 3 geographies
        assert result.metrics.geography_count == 3
        assert result.metrics.effective_geographies > 2.0

    def test_diversification_recommendations(self):
        """Test diversification recommendation generation (REQ-RISK-010)"""
        service = DiversificationAnalysisService()

        # Poorly diversified portfolio
        holdings = [
            HoldingInfo(
                symbol="AAPL",
                name="Apple",
                value=100000,
                weight=1.0,  # 100% in one stock
                asset_class="US_LargeCap",
                sector="Technology",
                geography="US"
            ),
        ]

        result = service.analyze_diversification(
            portfolio_value=100000,
            holdings=holdings
        )

        # Should generate multiple recommendations
        assert len(result.recommendations) > 0

        # Should recommend reduction of concentrated position
        reduction_recs = [r for r in result.recommendations if r.recommendation_type == "reduction"]
        assert len(reduction_recs) > 0

        # Should suggest alternatives
        assert any(len(r.alternative_investments) > 0 for r in result.recommendations)

    def test_well_diversified_portfolio(self):
        """Test analysis of well-diversified portfolio"""
        service = DiversificationAnalysisService()

        # Well-diversified portfolio
        holdings = []
        asset_classes = ["US_LargeCap", "US_SmallCap", "International_Developed",
                        "Emerging_Markets", "US_Bonds"]
        sectors = ["Technology", "Healthcare", "Finance", "Consumer", "Energy"]

        for i in range(20):
            holdings.append(HoldingInfo(
                symbol=f"STOCK{i}",
                name=f"Stock {i}",
                value=5000,
                weight=0.05,  # Equal weight
                asset_class=asset_classes[i % len(asset_classes)],
                sector=sectors[i % len(sectors)],
                geography="US" if i < 15 else "International_Developed"
            ))

        result = service.analyze_diversification(
            portfolio_value=100000,
            holdings=holdings
        )

        # Should have high diversification score
        assert result.metrics.diversification_score > 60

        # Should have good or excellent diversification level
        assert result.metrics.diversification_level in ["good", "excellent"]

        # Should have low or no critical risks
        critical_risks = [r for r in result.concentration_risks if r.risk_level == "critical"]
        assert len(critical_risks) == 0

    def test_effective_number_calculation(self):
        """Test effective number of securities calculation"""
        service = DiversificationAnalysisService()

        # 4 holdings with unequal weights
        holdings = [
            HoldingInfo(
                symbol="A",
                name="Stock A",
                value=50000,
                weight=0.50,
                asset_class="US_LargeCap"
            ),
            HoldingInfo(
                symbol="B",
                name="Stock B",
                value=30000,
                weight=0.30,
                asset_class="US_LargeCap"
            ),
            HoldingInfo(
                symbol="C",
                name="Stock C",
                value=15000,
                weight=0.15,
                asset_class="US_LargeCap"
            ),
            HoldingInfo(
                symbol="D",
                name="Stock D",
                value=5000,
                weight=0.05,
                asset_class="US_LargeCap"
            ),
        ]

        result = service.analyze_diversification(
            portfolio_value=100000,
            holdings=holdings
        )

        # Effective holdings should be less than actual (due to concentration)
        assert result.metrics.effective_holdings < result.metrics.total_holdings
        assert result.metrics.effective_holdings < 4.0

    def test_asset_class_breakdown(self):
        """Test asset class breakdown calculation"""
        service = DiversificationAnalysisService()

        holdings = [
            HoldingInfo(
                symbol="VTI",
                name="US Stocks",
                value=60000,
                weight=0.60,
                asset_class="US_Blend"
            ),
            HoldingInfo(
                symbol="BND",
                name="US Bonds",
                value=30000,
                weight=0.30,
                asset_class="US_Bonds"
            ),
            HoldingInfo(
                symbol="GLD",
                name="Gold",
                value=10000,
                weight=0.10,
                asset_class="Commodities"
            ),
        ]

        result = service.analyze_diversification(
            portfolio_value=100000,
            holdings=holdings
        )

        # Check breakdown
        assert result.asset_class_breakdown["US_Blend"] == 0.60
        assert result.asset_class_breakdown["US_Bonds"] == 0.30
        assert result.asset_class_breakdown["Commodities"] == 0.10

    def test_top_holdings_ordering(self):
        """Test that top 10 holdings are correctly ordered"""
        service = DiversificationAnalysisService()

        # Create 15 holdings with different weights
        holdings = [
            HoldingInfo(
                symbol=f"STOCK{i}",
                name=f"Stock {i}",
                value=(15 - i) * 1000,  # Descending values
                weight=(15 - i) * 0.01,
                asset_class="US_LargeCap"
            )
            for i in range(15)
        ]

        result = service.analyze_diversification(
            portfolio_value=sum(h.value for h in holdings),
            holdings=holdings
        )

        # Should return exactly 10 holdings
        assert len(result.top_10_holdings) == 10

        # Should be ordered by weight descending
        for i in range(9):
            assert result.top_10_holdings[i].weight >= result.top_10_holdings[i + 1].weight

    def test_concentration_thresholds(self):
        """Test that concentration risk thresholds are correctly applied"""
        service = DiversificationAnalysisService()

        # Test different concentration levels
        test_cases = [
            (0.08, 0),  # 8% - no risk
            (0.12, 1),  # 12% - medium risk
            (0.18, 1),  # 18% - high risk
            (0.28, 1),  # 28% - critical risk
        ]

        for concentration, expected_min_risks in test_cases:
            holdings = [
                HoldingInfo(
                    symbol="A",
                    name="Stock A",
                    value=concentration * 100000,
                    weight=concentration,
                    asset_class="US_LargeCap"
                ),
                HoldingInfo(
                    symbol="B",
                    name="Stock B",
                    value=(1 - concentration) * 100000,
                    weight=(1 - concentration),
                    asset_class="US_LargeCap"
                ),
            ]

            result = service.analyze_diversification(
                portfolio_value=100000,
                holdings=holdings
            )

            security_risks = [r for r in result.concentration_risks if r.risk_type == "security"]
            assert len(security_risks) >= expected_min_risks
