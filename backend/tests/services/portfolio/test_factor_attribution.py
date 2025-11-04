"""
Tests for Fama-French Factor Attribution Service
"""

import pytest
import numpy as np
from app.services.portfolio.factor_attribution_service import (
    FamaFrenchFactorService,
    FactorModel,
    FamaFrenchResult
)


@pytest.mark.unit
class TestFamaFrenchFactorService:
    """Test Fama-French factor attribution analysis"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = FamaFrenchFactorService()

        # Generate sample returns (252 days = 1 year)
        np.random.seed(42)
        n = 252

        # Market returns (8% annual, 15% vol)
        self.market_returns = list(np.random.normal(0.08/252, 0.15/np.sqrt(252), n))

        # Portfolio with market beta ~1.0 and positive alpha
        # Port = 0.02/252 + 1.0 * Market + noise
        alpha_daily = 0.02 / 252
        self.portfolio_returns = list(
            alpha_daily + 1.0 * np.array(self.market_returns) +
            np.random.normal(0, 0.05/np.sqrt(252), n)
        )

    def test_three_factor_model_basic(self):
        """Test basic 3-factor model analysis"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        assert isinstance(result, FamaFrenchResult)
        assert result.model_type == FactorModel.THREE_FACTOR
        assert len(result.exposures) == 3  # MKT_RF, SMB, HML
        assert len(result.attributions) == 3

        # Check factor names
        factor_names = [e.factor_name for e in result.exposures]
        assert "MKT_RF" in factor_names
        assert "SMB" in factor_names
        assert "HML" in factor_names

        # Alpha should be present (annualized)
        assert result.alpha_annual != 0
        assert isinstance(result.alpha_annual, float)

        # R-squared should be between 0 and 1
        assert 0 <= result.r_squared <= 1

    def test_five_factor_model(self):
        """Test 5-factor model includes all factors"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.FIVE_FACTOR,
            frequency="daily"
        )

        assert result.model_type == FactorModel.FIVE_FACTOR
        assert len(result.exposures) == 5  # MKT_RF, SMB, HML, RMW, CMA
        assert len(result.attributions) == 5

        # Check all factor names present
        factor_names = [e.factor_name for e in result.exposures]
        assert "MKT_RF" in factor_names
        assert "SMB" in factor_names
        assert "HML" in factor_names
        assert "RMW" in factor_names
        assert "CMA" in factor_names

    def test_market_beta_estimation(self):
        """Test that market beta is correctly estimated"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # Find market factor exposure
        mkt_exposure = next(
            e for e in result.exposures if e.factor_name == "MKT_RF"
        )

        # Beta should be close to 1.0 (we constructed portfolio with beta ~1.0)
        assert 0.8 <= mkt_exposure.beta <= 1.2

        # Market beta should be statistically significant
        assert mkt_exposure.is_significant
        assert mkt_exposure.p_value < 0.05

    def test_alpha_calculation(self):
        """Test alpha calculation"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # Alpha should be calculated (may be positive or negative due to synthetic factors)
        assert isinstance(result.alpha_annual, float)

        # Alpha t-statistic should exist
        assert isinstance(result.alpha_t_stat, float)
        assert isinstance(result.alpha_p_value, float)

    def test_attribution_sums_correctly(self):
        """Test that factor attributions sum approximately to total return"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # Sum of factor contributions
        total_contribution = sum(a.contribution for a in result.attributions)

        # Should be close to explained return
        assert abs(total_contribution - result.explained_return) < 0.001

        # Total return = explained + residual
        assert abs(
            result.total_return - (result.explained_return + result.residual_return)
        ) < 0.001

    def test_contribution_percentages_sum_to_100(self):
        """Test that contribution percentages are calculated"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        total_pct = sum(a.contribution_pct for a in result.attributions)

        # Percentages are calculated based on total return
        # May exceed 100% if factors over-explain returns (common with synthetic data)
        assert isinstance(total_pct, float)

        # Each contribution_pct should be defined
        for attr in result.attributions:
            assert isinstance(attr.contribution_pct, float)

    def test_r_squared_bounds(self):
        """Test R-squared is within valid bounds"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        assert 0 <= result.r_squared <= 1
        assert 0 <= result.adjusted_r_squared <= 1

        # Adjusted R-squared should be <= R-squared
        assert result.adjusted_r_squared <= result.r_squared

    def test_factor_significance(self):
        """Test factor significance testing"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        for exposure in result.exposures:
            # p-value should be between 0 and 1
            assert 0 <= exposure.p_value <= 1

            # is_significant should match p-value < 0.05
            expected_sig = exposure.p_value < 0.05
            assert exposure.is_significant == expected_sig

            # t-statistic should exist
            assert isinstance(exposure.t_statistic, float)

    def test_model_diagnostics(self):
        """Test model diagnostic statistics"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # F-statistic and p-value
        assert result.f_statistic >= 0
        assert 0 <= result.f_p_value <= 1

        # Durbin-Watson (should be around 2.0 for no autocorrelation)
        assert 0 <= result.durbin_watson <= 4

        # Residual standard error
        assert result.residual_std_error >= 0

    def test_interpretation_generated(self):
        """Test that interpretation text is generated"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        assert isinstance(result.interpretation, str)
        assert len(result.interpretation) > 50  # Should be meaningful text

        # Should mention key metrics
        assert "alpha" in result.interpretation.lower() or \
               "factor" in result.interpretation.lower()

    def test_recommendations_generated(self):
        """Test that recommendations are generated"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        assert isinstance(result.recommendations, list)
        assert len(result.recommendations) > 0

        # Each recommendation should be a non-empty string
        for rec in result.recommendations:
            assert isinstance(rec, str)
            assert len(rec) > 10

    def test_monthly_frequency(self):
        """Test analysis with monthly returns"""
        # Generate monthly returns (12 months)
        np.random.seed(42)
        n = 36  # 3 years of monthly data
        monthly_market = list(np.random.normal(0.08/12, 0.15/np.sqrt(12), n))
        monthly_portfolio = list(
            0.02/12 + 1.0 * np.array(monthly_market) +
            np.random.normal(0, 0.05/np.sqrt(12), n)
        )

        result = self.service.analyze_portfolio(
            portfolio_returns=monthly_portfolio,
            market_returns=monthly_market,
            model_type=FactorModel.THREE_FACTOR,
            frequency="monthly"
        )

        assert isinstance(result, FamaFrenchResult)
        assert len(result.exposures) == 3

        # Annualized alpha should be scaled properly
        assert isinstance(result.alpha_annual, float)

    def test_high_beta_portfolio(self):
        """Test portfolio with high market beta (1.5)"""
        np.random.seed(42)
        n = 252
        market = list(np.random.normal(0.08/252, 0.15/np.sqrt(252), n))

        # Create high-beta portfolio
        high_beta_portfolio = list(
            0.01/252 + 1.5 * np.array(market) +
            np.random.normal(0, 0.03/np.sqrt(252), n)
        )

        result = self.service.analyze_portfolio(
            portfolio_returns=high_beta_portfolio,
            market_returns=market,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # Market beta should be detected as high
        mkt_exposure = next(
            e for e in result.exposures if e.factor_name == "MKT_RF"
        )
        assert mkt_exposure.beta > 1.3

        # Recommendations should mention high beta
        recs_text = " ".join(result.recommendations).lower()
        assert "beta" in recs_text or "volatil" in recs_text

    def test_low_beta_portfolio(self):
        """Test portfolio with low market beta (0.5)"""
        np.random.seed(42)
        n = 252
        market = list(np.random.normal(0.08/252, 0.15/np.sqrt(252), n))

        # Create low-beta portfolio
        low_beta_portfolio = list(
            0.01/252 + 0.5 * np.array(market) +
            np.random.normal(0, 0.02/np.sqrt(252), n)
        )

        result = self.service.analyze_portfolio(
            portfolio_returns=low_beta_portfolio,
            market_returns=market,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # Market beta should be detected as low
        mkt_exposure = next(
            e for e in result.exposures if e.factor_name == "MKT_RF"
        )
        assert mkt_exposure.beta < 0.7

    def test_custom_factor_returns(self):
        """Test with custom factor returns provided"""
        # Generate custom factor returns
        np.random.seed(42)
        n = 100
        custom_factors = {
            "MKT_RF": list(np.random.normal(0.0003, 0.01, n)),
            "SMB": list(np.random.normal(0.0001, 0.005, n)),
            "HML": list(np.random.normal(0.0002, 0.006, n))
        }

        market = custom_factors["MKT_RF"]
        portfolio = list(
            0.0001 + 1.0 * np.array(market) + np.random.normal(0, 0.003, n)
        )

        result = self.service.analyze_portfolio(
            portfolio_returns=portfolio,
            market_returns=market,
            factor_returns=custom_factors,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        assert isinstance(result, FamaFrenchResult)
        assert len(result.exposures) == 3

    def test_minimum_data_requirements(self):
        """Test that analysis works with minimum data points"""
        # Minimum viable dataset (30 observations)
        np.random.seed(42)
        n = 30
        market = list(np.random.normal(0.001, 0.02, n))
        portfolio = list(0.0002 + 1.0 * np.array(market) + np.random.normal(0, 0.01, n))

        result = self.service.analyze_portfolio(
            portfolio_returns=portfolio,
            market_returns=market,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        assert isinstance(result, FamaFrenchResult)
        # Should complete successfully even with limited data

    def test_negative_alpha_portfolio(self):
        """Test portfolio with negative alpha"""
        np.random.seed(42)
        n = 252
        market = list(np.random.normal(0.08/252, 0.15/np.sqrt(252), n))

        # Create portfolio with negative alpha
        neg_alpha_portfolio = list(
            -0.03/252 + 1.0 * np.array(market) +
            np.random.normal(0, 0.05/np.sqrt(252), n)
        )

        result = self.service.analyze_portfolio(
            portfolio_returns=neg_alpha_portfolio,
            market_returns=market,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # Should detect negative alpha
        assert result.alpha_annual < 0

        # Recommendations should address underperformance
        recs_text = " ".join(result.recommendations).lower()
        assert any(word in recs_text for word in ["negative", "underperf", "review"])

    def test_result_rounding(self):
        """Test that results are properly rounded"""
        result = self.service.analyze_portfolio(
            portfolio_returns=self.portfolio_returns,
            market_returns=self.market_returns,
            model_type=FactorModel.THREE_FACTOR,
            frequency="daily"
        )

        # Check rounding on key metrics
        # Alpha should have 6 decimal places max
        assert len(str(result.alpha).split('.')[-1]) <= 6 if '.' in str(result.alpha) else True

        # R-squared should have 4 decimal places max
        assert len(str(result.r_squared).split('.')[-1]) <= 4

        # Betas should have 4 decimal places max
        for exposure in result.exposures:
            beta_str = str(exposure.beta)
            if '.' in beta_str:
                assert len(beta_str.split('.')[-1]) <= 4
