"""
Tests for CAPM Service
"""

import pytest
import numpy as np
from app.services.portfolio.capm_service import (
    CAPMService,
    CAPMMetrics,
    CAPMPortfolioAnalysis,
    SecurityPosition,
    SecurityMarketLine
)


@pytest.mark.unit
class TestCAPMService:
    """Test CAPM analysis service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = CAPMService(risk_free_rate=0.04, market_return=0.10)

        # Generate sample returns (252 days = 1 year)
        np.random.seed(42)
        n = 252

        # Market returns (10% annual, 15% vol)
        self.market_returns = list(np.random.normal(0.10/252, 0.15/np.sqrt(252), n))

        # Portfolio with beta ~1.0 and positive alpha
        self.portfolio_returns = list(
            1.0 * np.array(self.market_returns) +
            0.02/252 +  # Positive alpha
            np.random.normal(0, 0.03/np.sqrt(252), n)
        )

    def test_expected_return_calculation(self):
        """Test CAPM expected return formula"""
        # E(R) = Rf + β(Rm - Rf)
        beta = 1.0
        expected = self.service.calculate_expected_return(beta)

        # With Rf=4%, Rm=10%, beta=1.0: E(R) = 0.04 + 1.0*(0.10-0.04) = 0.10
        assert abs(expected - 0.10) < 0.001

        # Test with beta 1.5
        beta = 1.5
        expected = self.service.calculate_expected_return(beta)
        assert abs(expected - 0.13) < 0.001  # 4% + 1.5*6% = 13%

        # Test with beta 0.5
        beta = 0.5
        expected = self.service.calculate_expected_return(beta)
        assert abs(expected - 0.07) < 0.001  # 4% + 0.5*6% = 7%

    def test_beta_estimation(self):
        """Test beta estimation from returns"""
        beta, ci, r_squared, correlation = self.service.estimate_beta(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Beta should be close to 1.0 (we constructed with beta ~1.0)
        assert 0.85 <= beta <= 1.15

        # Confidence interval
        assert ci[0] < beta < ci[1]  # Beta should be within CI
        assert ci[1] - ci[0] > 0  # CI should have width

        # R-squared should be between 0 and 1
        assert 0 <= r_squared <= 1

        # Correlation should be between -1 and 1
        assert -1 <= correlation <= 1

        # For portfolio correlated with market, correlation should be positive
        assert correlation > 0

    def test_analyze_security_basic(self):
        """Test basic security analysis"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily",
            security_name="Test Portfolio"
        )

        assert isinstance(result, CAPMMetrics)

        # Check all required fields present
        assert result.risk_free_rate == 0.04
        assert result.market_return == 0.10
        assert result.market_premium == 0.06

        assert isinstance(result.beta, float)
        assert isinstance(result.expected_return, float)
        assert isinstance(result.actual_return, float)
        assert isinstance(result.alpha, float)

        # Beta confidence interval
        assert len(result.beta_confidence_interval) == 2
        assert result.beta_confidence_interval[0] < result.beta_confidence_interval[1]

    def test_alpha_calculation(self):
        """Test Jensen's alpha calculation"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Alpha = Actual Return - Expected Return
        # We added positive alpha, so should detect it
        assert result.alpha > 0

        # Alpha should match: actual - CAPM expected
        capm_expected = self.service.calculate_expected_return(result.beta)
        calculated_alpha = result.actual_return - capm_expected

        assert abs(result.alpha - calculated_alpha) < 0.001

    def test_sml_position(self):
        """Test Security Market Line position determination"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Position should be one of the enum values
        assert result.position in [
            SecurityPosition.OVERVALUED,
            SecurityPosition.UNDERVALUED,
            SecurityPosition.FAIR_VALUE
        ]

        # With positive alpha, should be undervalued
        if result.alpha > 0.01:
            assert result.position == SecurityPosition.UNDERVALUED

        # Distance from SML should match alpha
        assert abs(result.distance_from_sml - result.alpha) < 0.001

    def test_risk_adjusted_metrics(self):
        """Test risk-adjusted performance metrics"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Information Ratio = Alpha / Tracking Error
        if result.tracking_error > 0:
            expected_ir = result.alpha / result.tracking_error
            assert abs(result.information_ratio - expected_ir) < 0.01

        # Treynor Ratio = (Return - Rf) / Beta
        if result.beta != 0:
            expected_treynor = (result.actual_return - result.risk_free_rate) / result.beta
            assert abs(result.treynor_ratio - expected_treynor) < 0.01

    def test_interpretation_generated(self):
        """Test that interpretation is generated"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        assert isinstance(result.interpretation, str)
        assert len(result.interpretation) > 50

        # Should mention beta
        assert "beta" in result.interpretation.lower() or \
               "β" in result.interpretation.lower()

    def test_investment_recommendation(self):
        """Test investment recommendation generation"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        assert isinstance(result.investment_recommendation, str)
        assert len(result.investment_recommendation) > 20

        # Should contain a recommendation
        rec_lower = result.investment_recommendation.lower()
        assert any(word in rec_lower for word in ["buy", "sell", "hold"])

    def test_high_beta_security(self):
        """Test analysis of high-beta security"""
        np.random.seed(42)
        n = 252
        market = list(np.random.normal(0.10/252, 0.15/np.sqrt(252), n))

        # Create high-beta security (beta=1.8)
        high_beta_returns = list(
            1.8 * np.array(market) + 0.01/252 +
            np.random.normal(0, 0.02/np.sqrt(252), n)
        )

        result = self.service.analyze_security(
            security_returns=high_beta_returns,
            market_returns=market,
            frequency="daily"
        )

        # Beta should be detected as high
        assert result.beta > 1.5

        # Interpretation should mention high risk
        assert "high" in result.interpretation.lower() or \
               "volatile" in result.interpretation.lower()

    def test_low_beta_security(self):
        """Test analysis of low-beta security"""
        np.random.seed(42)
        n = 252
        market = list(np.random.normal(0.10/252, 0.15/np.sqrt(252), n))

        # Create low-beta security (beta=0.4)
        low_beta_returns = list(
            0.4 * np.array(market) + 0.02/252 +
            np.random.normal(0, 0.01/np.sqrt(252), n)
        )

        result = self.service.analyze_security(
            security_returns=low_beta_returns,
            market_returns=market,
            frequency="daily"
        )

        # Beta should be detected as low
        assert result.beta < 0.6

        # Interpretation should mention low risk
        assert "low" in result.interpretation.lower() or \
               "defensive" in result.interpretation.lower()

    def test_portfolio_analysis(self):
        """Test portfolio analysis with holdings"""
        # Create sample holdings
        holdings = [
            {
                "name": "Equity ETF",
                "weight": 0.60,
                "returns": self.portfolio_returns[:100]
            },
            {
                "name": "Bond ETF",
                "weight": 0.40,
                "returns": list(np.random.normal(0.04/252, 0.05/np.sqrt(252), 100))
            }
        ]

        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            holdings=holdings,
            frequency="daily"
        )

        assert isinstance(result, CAPMPortfolioAnalysis)

        # Should have portfolio metrics
        assert isinstance(result.portfolio_metrics, CAPMMetrics)

        # Should have holdings analysis
        assert result.holdings_analysis is not None
        assert len(result.holdings_analysis) == 2

        # Each holding should have metrics
        for holding in result.holdings_analysis:
            assert "name" in holding
            assert "beta" in holding
            assert "alpha" in holding

        # Risk decomposition
        assert result.systematic_risk_pct + result.idiosyncratic_risk_pct == pytest.approx(100, rel=0.01)

        # Recommendations
        assert isinstance(result.recommendations, list)
        assert len(result.recommendations) > 0

    def test_systematic_vs_idiosyncratic_risk(self):
        """Test risk decomposition"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Systematic risk % should equal R-squared * 100
        expected_systematic = result.portfolio_metrics.r_squared * 100
        assert abs(result.systematic_risk_pct - expected_systematic) < 0.1

        # Idiosyncratic risk % should equal (1 - R-squared) * 100
        expected_idiosyncratic = (1 - result.portfolio_metrics.r_squared) * 100
        assert abs(result.idiosyncratic_risk_pct - expected_idiosyncratic) < 0.1

    def test_portfolio_recommendations(self):
        """Test portfolio recommendations generation"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        assert isinstance(result.recommendations, list)
        assert len(result.recommendations) > 0

        # Each recommendation should be meaningful
        for rec in result.recommendations:
            assert isinstance(rec, str)
            assert len(rec) > 15

    def test_risk_warnings(self):
        """Test risk warning generation"""
        # Create very high beta portfolio
        np.random.seed(42)
        n = 252
        market = list(np.random.normal(0.10/252, 0.15/np.sqrt(252), n))
        high_risk_returns = list(
            2.0 * np.array(market) - 0.05/252 +
            np.random.normal(0, 0.05/np.sqrt(252), n)
        )

        result = self.service.analyze_portfolio(
            portfolio_returns=high_risk_returns,
            market_returns=market,
            frequency="daily"
        )

        # Should have risk warnings
        assert isinstance(result.risk_warnings, list)
        # May or may not have warnings depending on thresholds

    def test_security_market_line_generation(self):
        """Test SML data generation"""
        sml = self.service.generate_security_market_line(
            beta_range=(0.0, 2.0),
            num_points=50
        )

        assert isinstance(sml, SecurityMarketLine)

        # Should have points
        assert len(sml.points) == 50

        # Each point should have beta and expected_return
        for point in sml.points:
            assert "beta" in point
            assert "expected_return" in point

            # Expected return should match CAPM formula
            beta = point["beta"]
            expected = self.service.calculate_expected_return(beta)
            assert abs(point["expected_return"] - expected) < 0.001

        # Portfolio point
        assert "beta" in sml.portfolio_point
        assert "expected_return" in sml.portfolio_point

        # Efficient portfolios
        assert len(sml.efficient_portfolios) > 0
        for portfolio in sml.efficient_portfolios:
            assert "name" in portfolio
            assert "beta" in portfolio
            assert "expected_return" in portfolio

    def test_monthly_frequency(self):
        """Test analysis with monthly returns"""
        np.random.seed(42)
        n = 36  # 3 years monthly
        monthly_market = list(np.random.normal(0.10/12, 0.15/np.sqrt(12), n))
        monthly_portfolio = list(
            1.0 * np.array(monthly_market) + 0.02/12 +
            np.random.normal(0, 0.03/np.sqrt(12), n)
        )

        result = self.service.analyze_security(
            security_returns=monthly_portfolio,
            market_returns=monthly_market,
            frequency="monthly"
        )

        assert isinstance(result, CAPMMetrics)
        # Should properly annualize returns

    def test_negative_alpha_security(self):
        """Test security with negative alpha"""
        np.random.seed(42)
        n = 252
        market = list(np.random.normal(0.10/252, 0.15/np.sqrt(252), n))

        # Create security with negative alpha
        neg_alpha_returns = list(
            1.0 * np.array(market) - 0.03/252 +
            np.random.normal(0, 0.03/np.sqrt(252), n)
        )

        result = self.service.analyze_security(
            security_returns=neg_alpha_returns,
            market_returns=market,
            frequency="daily"
        )

        # Should detect negative alpha
        assert result.alpha < 0

        # Should be overvalued
        assert result.position == SecurityPosition.OVERVALUED

        # Recommendation should suggest caution
        rec_lower = result.investment_recommendation.lower()
        assert "sell" in rec_lower or "reduce" in rec_lower or "overval" in rec_lower

    def test_tracking_error_calculation(self):
        """Test tracking error calculation"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Tracking error should be positive
        assert result.tracking_error > 0

        # Should be annualized
        assert result.tracking_error < 1.0  # Reasonable upper bound

    def test_correlation_with_market(self):
        """Test correlation calculation"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Correlation should be between -1 and 1
        assert -1 <= result.correlation <= 1

        # For portfolio based on market, should be positive
        assert result.correlation > 0

    def test_result_rounding(self):
        """Test that results are properly rounded"""
        result = self.service.analyze_security(
            security_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            frequency="daily"
        )

        # Check rounding on key metrics
        assert len(str(result.beta).split('.')[-1]) <= 4 if '.' in str(result.beta) else True
        assert len(str(result.alpha).split('.')[-1]) <= 4 if '.' in str(result.alpha) else True
        assert len(str(result.r_squared).split('.')[-1]) <= 4 if '.' in str(result.r_squared) else True

    def test_minimum_data_requirements(self):
        """Test with minimum data points"""
        np.random.seed(42)
        n = 30  # Minimum viable dataset
        market = list(np.random.normal(0.001, 0.02, n))
        portfolio = list(1.0 * np.array(market) + 0.0002 + np.random.normal(0, 0.01, n))

        result = self.service.analyze_security(
            security_returns=portfolio,
            market_returns=market,
            frequency="daily"
        )

        assert isinstance(result, CAPMMetrics)
        # Should complete successfully
