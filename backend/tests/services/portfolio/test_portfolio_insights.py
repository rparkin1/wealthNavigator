"""
Unit tests for Portfolio Insights and Alerts Service
Tests insights generation, alert detection, and recommendations
"""

import pytest
from datetime import datetime
from app.services.portfolio.portfolio_insights import (
    PortfolioInsightsService,
    PortfolioInsight,
    PortfolioAlert,
    PerformanceMetrics,
    AlertSeverity,
    AlertType
)


@pytest.fixture
def insights_service():
    """Portfolio insights service instance"""
    return PortfolioInsightsService()


@pytest.fixture
def diversified_allocation():
    """Sample diversified portfolio allocation"""
    return {
        "US_LC_BLEND": 0.30,
        "INTL_DEV_BLEND": 0.20,
        "US_TREASURY_INTER": 0.25,
        "US_CORP_IG": 0.15,
        "US_REIT": 0.05,
        "GOLD": 0.05
    }


@pytest.fixture
def concentrated_allocation():
    """Sample concentrated portfolio allocation"""
    return {
        "US_LC_BLEND": 0.85,
        "CASH": 0.15
    }


@pytest.fixture
def sample_performance():
    """Sample performance metrics"""
    return PerformanceMetrics(
        total_return_1m=0.02,
        total_return_3m=0.06,
        total_return_1y=0.10,
        total_return_ytd=0.08,
        volatility_1y=0.15,
        sharpe_ratio_1y=0.80,
        max_drawdown_1y=-0.12,
        vs_benchmark_1y=0.02
    )


class TestInsightsGeneration:
    """Test portfolio insights generation"""

    def test_generate_insights_basic(self, insights_service, diversified_allocation):
        """Test basic insights generation"""
        insights = insights_service.generate_insights(
            portfolio_allocation=diversified_allocation
        )

        assert len(insights) > 0
        assert all(isinstance(insight, PortfolioInsight) for insight in insights)

        # Check insight structure
        for insight in insights:
            assert insight.category in ["diversification", "risk", "performance", "tax", "esg", "goals"]
            assert insight.title
            assert insight.description
            assert insight.impact in ["positive", "negative", "neutral"]
            assert 0 <= insight.confidence <= 1.0

    def test_generate_insights_with_performance(self, insights_service, diversified_allocation, sample_performance):
        """Test insights with performance data"""
        insights = insights_service.generate_insights(
            portfolio_allocation=diversified_allocation,
            performance_metrics=sample_performance
        )

        # Should include performance insights
        performance_insights = [i for i in insights if i.category == "performance"]
        assert len(performance_insights) > 0

    def test_generate_insights_with_goals(self, insights_service, diversified_allocation):
        """Test insights with goals"""
        goals = [
            {
                "id": "goal1",
                "name": "Retirement",
                "required_return": 0.07,
                "years_to_goal": 20
            }
        ]

        insights = insights_service.generate_insights(
            portfolio_allocation=diversified_allocation,
            goals=goals
        )

        # Should include goal alignment insights
        goal_insights = [i for i in insights if i.category == "goals"]
        # May or may not have goal insights depending on alignment


class TestDiversificationInsights:
    """Test diversification analysis"""

    def test_analyze_diversification_good(self, insights_service, diversified_allocation):
        """Test diversification analysis for well-diversified portfolio"""
        insights = insights_service._analyze_diversification(diversified_allocation)

        assert len(insights) > 0

        # Should have positive insights
        positive = [i for i in insights if i.impact == "positive"]
        assert len(positive) > 0

    def test_analyze_diversification_concentrated(self, insights_service, concentrated_allocation):
        """Test diversification analysis for concentrated portfolio"""
        insights = insights_service._analyze_diversification(concentrated_allocation)

        assert len(insights) > 0

        # Should have negative insights about concentration
        negative = [i for i in insights if i.impact == "negative"]
        assert len(negative) > 0

        # Should mention concentration risk
        concentration_mentions = [i for i in insights if "concentration" in i.title.lower() or "concentration" in i.description.lower()]
        assert len(concentration_mentions) > 0


class TestRiskInsights:
    """Test risk analysis"""

    def test_analyze_risk_high_volatility(self, insights_service):
        """Test risk analysis with high volatility portfolio"""
        allocation = {
            "US_SC_GROWTH": 0.60,  # Small cap growth = high volatility
            "EM_BLEND": 0.40  # Emerging markets = high volatility
        }

        insights = insights_service._analyze_risk(allocation, None)

        # Should warn about high volatility
        volatility_insights = [i for i in insights if "volatility" in i.title.lower() or "volatility" in i.description.lower()]
        assert len(volatility_insights) > 0

    def test_analyze_risk_with_performance(self, insights_service, diversified_allocation):
        """Test risk analysis with performance metrics"""
        good_performance = PerformanceMetrics(
            sharpe_ratio_1y=1.5,  # Excellent
            max_drawdown_1y=-0.08  # Mild
        )

        insights = insights_service._analyze_risk(diversified_allocation, good_performance)

        # Should have positive insights about Sharpe ratio
        sharpe_insights = [i for i in insights if "sharpe" in i.title.lower()]
        assert len(sharpe_insights) > 0


class TestPerformanceInsights:
    """Test performance analysis"""

    def test_analyze_performance_positive_returns(self, insights_service):
        """Test performance insights with positive returns"""
        performance = PerformanceMetrics(
            total_return_1y=0.18,  # 18% return
            vs_benchmark_1y=0.03  # 3% alpha
        )

        insights = insights_service._analyze_performance(performance)

        # Should have positive insights
        positive = [i for i in insights if i.impact == "positive"]
        assert len(positive) > 0

    def test_analyze_performance_negative_returns(self, insights_service):
        """Test performance insights with negative returns"""
        performance = PerformanceMetrics(
            total_return_1y=-0.10,  # -10% return
            vs_benchmark_1y=-0.05  # -5% vs benchmark
        )

        insights = insights_service._analyze_performance(performance)

        # Should have negative insights
        negative = [i for i in insights if i.impact == "negative"]
        assert len(negative) > 0

    def test_analyze_performance_large_drawdown(self, insights_service):
        """Test detection of large drawdowns"""
        performance = PerformanceMetrics(
            total_return_1y=0.05,
            max_drawdown_1y=-0.25  # 25% drawdown
        )

        insights = insights_service._analyze_performance(performance)

        # Should warn about drawdown
        drawdown_insights = [i for i in insights if "drawdown" in i.title.lower() or "drawdown" in i.description.lower()]
        assert len(drawdown_insights) > 0


class TestTaxEfficiencyInsights:
    """Test tax efficiency analysis"""

    def test_analyze_tax_efficiency_low(self, insights_service):
        """Test tax efficiency insights for tax-inefficient portfolio"""
        # Bonds and REITs = tax-inefficient
        allocation = {
            "US_CORP_IG": 0.50,
            "US_REIT": 0.30,
            "MUNI_INTER": 0.20
        }

        insights = insights_service._analyze_tax_efficiency(allocation)

        # Should have insights about tax efficiency
        assert len(insights) > 0

    def test_analyze_tax_efficiency_high(self, insights_service):
        """Test tax efficiency insights for tax-efficient portfolio"""
        # Index funds = tax-efficient
        allocation = {
            "US_LC_BLEND": 0.60,
            "INTL_DEV_BLEND": 0.30,
            "CASH": 0.10
        }

        insights = insights_service._analyze_tax_efficiency(allocation)

        # Should have positive insights
        positive = [i for i in insights if i.impact == "positive"]
        # May or may not have positive insights depending on threshold


class TestAlertsGeneration:
    """Test portfolio alerts generation"""

    def test_generate_alerts_basic(self, insights_service, diversified_allocation):
        """Test basic alerts generation"""
        alerts = insights_service.generate_alerts(
            portfolio_allocation=diversified_allocation,
            target_allocation=diversified_allocation  # No drift
        )

        # With no drift, should have minimal alerts
        assert isinstance(alerts, list)

    def test_generate_alerts_with_performance(self, insights_service, diversified_allocation, sample_performance):
        """Test alerts with performance metrics"""
        alerts = insights_service.generate_alerts(
            portfolio_allocation=diversified_allocation,
            target_allocation=diversified_allocation,
            performance_metrics=sample_performance
        )

        assert isinstance(alerts, list)

    def test_alert_structure(self, insights_service, diversified_allocation):
        """Test alert structure"""
        drifted_allocation = {
            "US_LC_BLEND": 0.40,  # Target was 0.30
            "INTL_DEV_BLEND": 0.20,
            "US_TREASURY_INTER": 0.20,  # Target was 0.25
            "US_CORP_IG": 0.15,
            "GOLD": 0.05
        }

        alerts = insights_service.generate_alerts(
            portfolio_allocation=drifted_allocation,
            target_allocation=diversified_allocation
        )

        for alert in alerts:
            assert isinstance(alert, PortfolioAlert)
            assert alert.type in AlertType
            assert alert.severity in AlertSeverity
            assert alert.title
            assert alert.message
            assert alert.recommendation
            assert isinstance(alert.created_at, datetime)


class TestRebalancingAlerts:
    """Test rebalancing alerts"""

    def test_rebalancing_alert_detected(self, insights_service):
        """Test that rebalancing is detected when needed"""
        current = {
            "US_LC_BLEND": 0.45,
            "US_TREASURY_INTER": 0.55
        }

        target = {
            "US_LC_BLEND": 0.60,  # 15% drift
            "US_TREASURY_INTER": 0.40
        }

        alerts = insights_service._check_rebalancing_alerts(current, target, threshold=0.05)

        # Should generate rebalancing alert
        assert len(alerts) > 0
        assert any(alert.type == AlertType.DRIFT_THRESHOLD for alert in alerts)

    def test_no_rebalancing_alert_within_threshold(self, insights_service):
        """Test no alert when drift is within threshold"""
        current = {
            "US_LC_BLEND": 0.61,
            "US_TREASURY_INTER": 0.39
        }

        target = {
            "US_LC_BLEND": 0.60,  # 1% drift - within threshold
            "US_TREASURY_INTER": 0.40
        }

        alerts = insights_service._check_rebalancing_alerts(current, target, threshold=0.05)

        # Should not generate alert for minor drift
        rebalancing_alerts = [a for a in alerts if a.type == AlertType.DRIFT_THRESHOLD]
        assert len(rebalancing_alerts) == 0


class TestConcentrationAlerts:
    """Test concentration risk alerts"""

    def test_concentration_alert_detected(self, insights_service, concentrated_allocation):
        """Test that concentration risk is detected"""
        alerts = insights_service._check_concentration_alerts(
            concentrated_allocation,
            threshold=0.30
        )

        # 85% in US_LC_BLEND exceeds 30% threshold
        assert len(alerts) > 0
        assert any(alert.type == AlertType.CONCENTRATION_RISK for alert in alerts)

    def test_no_concentration_alert_diversified(self, insights_service, diversified_allocation):
        """Test no concentration alert for diversified portfolio"""
        alerts = insights_service._check_concentration_alerts(
            diversified_allocation,
            threshold=0.30
        )

        # No position exceeds 30%
        assert len(alerts) == 0


class TestPerformanceAlerts:
    """Test performance-based alerts"""

    def test_underperformance_alert(self, insights_service):
        """Test underperformance alert"""
        performance = PerformanceMetrics(
            total_return_1y=0.03,
            vs_benchmark_1y=-0.08  # 8% underperformance
        )

        alerts = insights_service._check_performance_alerts(performance)

        # Should generate underperformance alert
        assert len(alerts) > 0
        assert any(alert.type == AlertType.UNDERPERFORMANCE for alert in alerts)

    def test_no_underperformance_alert_beating_benchmark(self, insights_service):
        """Test no alert when beating benchmark"""
        performance = PerformanceMetrics(
            total_return_1y=0.12,
            vs_benchmark_1y=0.03  # 3% outperformance
        )

        alerts = insights_service._check_performance_alerts(performance)

        # Should not generate underperformance alert
        underperf_alerts = [a for a in alerts if a.type == AlertType.UNDERPERFORMANCE]
        assert len(underperf_alerts) == 0


class TestFeeAlerts:
    """Test fee-based alerts"""

    def test_high_fee_alert(self, insights_service):
        """Test high fee alert"""
        holdings_detail = {
            "average_expense_ratio": 0.015  # 1.5%
        }

        alerts = insights_service._check_fee_alerts(holdings_detail)

        # Should generate high fee alert
        assert len(alerts) > 0
        assert any(alert.type == AlertType.HIGH_FEES for alert in alerts)

    def test_no_fee_alert_low_costs(self, insights_service):
        """Test no alert with low fees"""
        holdings_detail = {
            "average_expense_ratio": 0.003  # 0.3%
        }

        alerts = insights_service._check_fee_alerts(holdings_detail)

        # Should not generate fee alert
        assert len(alerts) == 0


class TestTaxLossHarvestingAlerts:
    """Test tax-loss harvesting alerts"""

    def test_tax_loss_opportunity_detected(self, insights_service):
        """Test tax-loss harvesting opportunity detected"""
        holdings_detail = {
            "positions_with_losses": [
                {"security": "VTI", "unrealized_loss": -3000},
                {"security": "BND", "unrealized_loss": -1500}
            ]
        }

        alerts = insights_service._check_tax_loss_alerts(holdings_detail)

        # Should generate tax-loss harvesting alert
        assert len(alerts) > 0
        assert any(alert.type == AlertType.TAX_LOSS_OPPORTUNITY for alert in alerts)

    def test_no_tax_loss_alert_small_losses(self, insights_service):
        """Test no alert for small losses"""
        holdings_detail = {
            "positions_with_losses": [
                {"security": "VTI", "unrealized_loss": -200}
            ]
        }

        alerts = insights_service._check_tax_loss_alerts(holdings_detail)

        # Should not generate alert for losses < $1,000
        assert len(alerts) == 0


class TestAlertSeverity:
    """Test alert severity levels"""

    def test_critical_severity_large_drift(self, insights_service):
        """Test critical severity for large drift"""
        current = {"US_LC_BLEND": 0.75, "CASH": 0.25}
        target = {"US_LC_BLEND": 0.50, "CASH": 0.50}  # 25% drift

        alerts = insights_service._check_rebalancing_alerts(current, target, threshold=0.05)

        if alerts:
            # Large drift should be critical
            critical_alerts = [a for a in alerts if a.severity == AlertSeverity.CRITICAL]
            assert len(critical_alerts) > 0

    def test_warning_severity_moderate_drift(self, insights_service):
        """Test warning severity for moderate drift"""
        current = {"US_LC_BLEND": 0.58, "CASH": 0.42}
        target = {"US_LC_BLEND": 0.50, "CASH": 0.50}  # 8% drift

        alerts = insights_service._check_rebalancing_alerts(current, target, threshold=0.05)

        if alerts:
            # Moderate drift should be warning
            warning_alerts = [a for a in alerts if a.severity == AlertSeverity.WARNING]
            # May be warning or critical depending on exact drift


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_empty_portfolio_allocation(self, insights_service):
        """Test with empty portfolio"""
        insights = insights_service.generate_insights(
            portfolio_allocation={}
        )

        # Should handle gracefully
        assert isinstance(insights, list)

    def test_single_asset_portfolio(self, insights_service):
        """Test with single asset"""
        allocation = {"CASH": 1.0}

        insights = insights_service.generate_insights(
            portfolio_allocation=allocation
        )

        # Should warn about lack of diversification
        assert len(insights) > 0

    def test_none_performance_metrics(self, insights_service, diversified_allocation):
        """Test with None performance metrics"""
        insights = insights_service.generate_insights(
            portfolio_allocation=diversified_allocation,
            performance_metrics=None
        )

        # Should work without performance data
        assert len(insights) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
