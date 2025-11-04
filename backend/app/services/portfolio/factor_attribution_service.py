"""
Fama-French Factor Attribution Service
Multi-factor models for portfolio performance attribution

Implements:
- Fama-French 3-Factor Model (Market, Size, Value)
- Fama-French 5-Factor Model (+ Profitability, Investment)
- Factor exposure analysis
- Performance attribution by factor

REQ-PORT-013: Factor-based attribution (Fama-French factors)
PRD Section 4: Portfolio Optimization Engine
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from scipy import stats
from enum import Enum


class FactorModel(str, Enum):
    """Factor model types"""
    THREE_FACTOR = "three_factor"  # Market, Size, Value
    FIVE_FACTOR = "five_factor"    # + Profitability, Investment


class FactorExposure(BaseModel):
    """Factor exposure (beta) for a single factor"""
    factor_name: str
    beta: float  # Factor loading/exposure
    t_statistic: float  # Statistical significance
    p_value: float
    is_significant: bool  # p-value < 0.05


class FactorAttribution(BaseModel):
    """Performance attribution to factors"""
    factor_name: str
    beta: float  # Factor exposure
    factor_return: float  # Factor premium
    contribution: float  # beta * factor_return
    contribution_pct: float  # % of total return


class FamaFrenchResult(BaseModel):
    """Complete Fama-French factor analysis result"""
    model_type: FactorModel

    # Regression statistics
    alpha: float  # Intercept (excess return not explained by factors)
    alpha_annual: float  # Annualized alpha
    alpha_t_stat: float
    alpha_p_value: float
    r_squared: float  # Model fit
    adjusted_r_squared: float

    # Factor exposures
    exposures: List[FactorExposure]

    # Performance attribution
    attributions: List[FactorAttribution]
    total_return: float
    explained_return: float  # Sum of factor contributions
    residual_return: float  # Alpha + error

    # Model diagnostics
    residual_std_error: float
    f_statistic: float
    f_p_value: float
    durbin_watson: float  # Autocorrelation test

    # Interpretation
    interpretation: str
    recommendations: List[str]


class FamaFrenchFactorService:
    """Service for Fama-French factor attribution analysis"""

    def __init__(self):
        """Initialize Fama-French factor service"""
        # Historical factor premiums (annualized, typical long-run averages)
        # Source: Kenneth French Data Library
        self.default_factor_premiums = {
            "MKT_RF": 0.08,   # Market excess return (8%)
            "SMB": 0.03,      # Small minus Big (3%)
            "HML": 0.04,      # High minus Low (value premium) (4%)
            "RMW": 0.03,      # Robust minus Weak (profitability) (3%)
            "CMA": 0.03,      # Conservative minus Aggressive (investment) (3%)
        }

        self.risk_free_rate = 0.04  # 4% annual

    def analyze_portfolio(
        self,
        portfolio_returns: List[float],  # Daily or monthly returns
        market_returns: List[float],     # Market returns (same frequency)
        factor_returns: Optional[Dict[str, List[float]]] = None,  # Factor returns if available
        model_type: FactorModel = FactorModel.THREE_FACTOR,
        frequency: str = "daily"  # "daily" or "monthly"
    ) -> FamaFrenchResult:
        """
        Perform Fama-French factor attribution analysis.

        Args:
            portfolio_returns: Portfolio returns (same frequency as factors)
            market_returns: Market benchmark returns
            factor_returns: Optional dict of factor returns {factor_name: returns_list}
                           If None, will use default factor premiums
            model_type: Use 3-factor or 5-factor model
            frequency: Return frequency for annualization

        Returns:
            Complete factor analysis with attribution and diagnostics
        """
        # Convert to numpy arrays
        port_ret = np.array(portfolio_returns)
        mkt_ret = np.array(market_returns)

        # Ensure same length
        min_len = min(len(port_ret), len(mkt_ret))
        port_ret = port_ret[:min_len]
        mkt_ret = mkt_ret[:min_len]

        # Calculate excess returns (portfolio - risk free)
        rf_rate_period = self._adjust_rate_for_frequency(self.risk_free_rate, frequency)
        port_excess = port_ret - rf_rate_period
        mkt_excess = mkt_ret - rf_rate_period

        # Prepare factor matrix
        if factor_returns is None:
            # Use synthetic factor returns based on historical premiums
            factor_returns = self._generate_synthetic_factors(
                len(port_ret), frequency, model_type
            )

        # Build regression matrix
        X, factor_names = self._build_regression_matrix(
            mkt_excess, factor_returns, model_type
        )

        # Run regression: port_excess = alpha + beta1*F1 + beta2*F2 + ... + error
        betas, alpha, r_squared, adj_r_squared, residuals = self._run_regression(
            port_excess, X
        )

        # Calculate statistics
        alpha_annual = self._annualize_return(alpha, frequency)
        alpha_t_stat, alpha_p_value = self._calculate_t_statistic(
            alpha, residuals, X.shape[0], X.shape[1]
        )

        # Factor exposures with significance
        exposures = []
        for i, factor_name in enumerate(factor_names):
            beta = betas[i]
            t_stat, p_value = self._calculate_t_statistic(
                beta, residuals, X.shape[0], X.shape[1]
            )

            exposures.append(FactorExposure(
                factor_name=factor_name,
                beta=round(beta, 4),
                t_statistic=round(t_stat, 3),
                p_value=round(p_value, 4),
                is_significant=p_value < 0.05
            ))

        # Performance attribution
        attributions = []
        for i, factor_name in enumerate(factor_names):
            beta = betas[i]
            # Use actual factor return if available, otherwise use premium
            if factor_returns and factor_name in factor_returns:
                factor_ret = np.mean(factor_returns[factor_name])
                factor_ret_annual = self._annualize_return(factor_ret, frequency)
            else:
                factor_ret_annual = self.default_factor_premiums.get(factor_name, 0.03)

            contribution = beta * factor_ret_annual

            attributions.append(FactorAttribution(
                factor_name=factor_name,
                beta=round(beta, 4),
                factor_return=round(factor_ret_annual, 4),
                contribution=round(contribution, 4),
                contribution_pct=0.0  # Will calculate after we have total
            ))

        # Total and explained returns
        total_return = float(np.mean(port_ret))
        total_return_annual = self._annualize_return(total_return, frequency)
        explained_return = sum(attr.contribution for attr in attributions)
        residual_return = total_return_annual - explained_return

        # Update contribution percentages
        for attr in attributions:
            if total_return_annual != 0:
                attr.contribution_pct = round(
                    (attr.contribution / total_return_annual) * 100, 2
                )

        # Model diagnostics
        residual_std_error = float(np.std(residuals))
        f_stat, f_p_value = self._calculate_f_statistic(
            r_squared, X.shape[0], X.shape[1]
        )
        durbin_watson = self._calculate_durbin_watson(residuals)

        # Interpretation and recommendations
        interpretation = self._interpret_results(
            alpha_annual, alpha_p_value, exposures, r_squared
        )
        recommendations = self._generate_recommendations(
            exposures, alpha_annual, alpha_p_value
        )

        return FamaFrenchResult(
            model_type=model_type,
            alpha=round(alpha, 6),
            alpha_annual=round(alpha_annual, 4),
            alpha_t_stat=round(alpha_t_stat, 3),
            alpha_p_value=round(alpha_p_value, 4),
            r_squared=round(r_squared, 4),
            adjusted_r_squared=round(adj_r_squared, 4),
            exposures=exposures,
            attributions=attributions,
            total_return=round(total_return_annual, 4),
            explained_return=round(explained_return, 4),
            residual_return=round(residual_return, 4),
            residual_std_error=round(residual_std_error, 6),
            f_statistic=round(f_stat, 3),
            f_p_value=round(f_p_value, 4),
            durbin_watson=round(durbin_watson, 3),
            interpretation=interpretation,
            recommendations=recommendations
        )

    def _adjust_rate_for_frequency(self, annual_rate: float, frequency: str) -> float:
        """Convert annual rate to period rate"""
        if frequency == "daily":
            return annual_rate / 252
        elif frequency == "monthly":
            return annual_rate / 12
        else:
            return annual_rate

    def _annualize_return(self, period_return: float, frequency: str) -> float:
        """Annualize a period return"""
        if frequency == "daily":
            return period_return * 252
        elif frequency == "monthly":
            return period_return * 12
        else:
            return period_return

    def _generate_synthetic_factors(
        self, n_periods: int, frequency: str, model_type: FactorModel
    ) -> Dict[str, List[float]]:
        """Generate synthetic factor returns for demonstration"""
        np.random.seed(42)  # Reproducible

        factors = {}

        # Market factor (higher volatility)
        factors["MKT_RF"] = list(np.random.normal(
            self._adjust_rate_for_frequency(0.08, frequency),
            self._adjust_rate_for_frequency(0.15, frequency),
            n_periods
        ))

        # Size factor (SMB)
        factors["SMB"] = list(np.random.normal(
            self._adjust_rate_for_frequency(0.03, frequency),
            self._adjust_rate_for_frequency(0.10, frequency),
            n_periods
        ))

        # Value factor (HML)
        factors["HML"] = list(np.random.normal(
            self._adjust_rate_for_frequency(0.04, frequency),
            self._adjust_rate_for_frequency(0.12, frequency),
            n_periods
        ))

        # 5-factor additions
        if model_type == FactorModel.FIVE_FACTOR:
            # Profitability factor (RMW)
            factors["RMW"] = list(np.random.normal(
                self._adjust_rate_for_frequency(0.03, frequency),
                self._adjust_rate_for_frequency(0.08, frequency),
                n_periods
            ))

            # Investment factor (CMA)
            factors["CMA"] = list(np.random.normal(
                self._adjust_rate_for_frequency(0.03, frequency),
                self._adjust_rate_for_frequency(0.08, frequency),
                n_periods
            ))

        return factors

    def _build_regression_matrix(
        self,
        mkt_excess: np.ndarray,
        factor_returns: Dict[str, List[float]],
        model_type: FactorModel
    ) -> Tuple[np.ndarray, List[str]]:
        """Build regression matrix X"""
        factor_names = []
        factors = []

        # Market factor
        factors.append(mkt_excess)
        factor_names.append("MKT_RF")

        # Add other factors based on model
        if model_type == FactorModel.THREE_FACTOR:
            for factor_name in ["SMB", "HML"]:
                if factor_name in factor_returns:
                    factors.append(np.array(factor_returns[factor_name]))
                    factor_names.append(factor_name)

        elif model_type == FactorModel.FIVE_FACTOR:
            for factor_name in ["SMB", "HML", "RMW", "CMA"]:
                if factor_name in factor_returns:
                    factors.append(np.array(factor_returns[factor_name]))
                    factor_names.append(factor_name)

        # Ensure all factors same length
        min_len = min(len(f) for f in factors)
        factors = [f[:min_len] for f in factors]

        # Stack into matrix
        X = np.column_stack(factors)

        return X, factor_names

    def _run_regression(
        self, y: np.ndarray, X: np.ndarray
    ) -> Tuple[np.ndarray, float, float, float, np.ndarray]:
        """Run OLS regression"""
        # Add intercept
        X_with_intercept = np.column_stack([np.ones(len(X)), X])

        # OLS: beta = (X'X)^-1 X'y
        beta = np.linalg.lstsq(X_with_intercept, y, rcond=None)[0]

        # Separate alpha (intercept) and factor betas
        alpha = beta[0]
        betas = beta[1:]

        # Predictions and residuals
        y_pred = X_with_intercept @ beta
        residuals = y - y_pred

        # R-squared
        ss_res = np.sum(residuals ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        # Adjusted R-squared
        n = len(y)
        k = X.shape[1]
        adj_r_squared = 1 - ((1 - r_squared) * (n - 1) / (n - k - 1)) if n > k + 1 else r_squared

        return betas, alpha, r_squared, adj_r_squared, residuals

    def _calculate_t_statistic(
        self, coef: float, residuals: np.ndarray, n: int, k: int
    ) -> Tuple[float, float]:
        """Calculate t-statistic and p-value for a coefficient"""
        # Standard error
        mse = np.sum(residuals ** 2) / (n - k - 1) if n > k + 1 else 1.0
        se = np.sqrt(mse) if mse > 0 else 0.001

        # t-statistic
        t_stat = coef / se if se > 0 else 0

        # p-value (two-tailed)
        df = n - k - 1 if n > k + 1 else 1
        p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df))

        return t_stat, p_value

    def _calculate_f_statistic(
        self, r_squared: float, n: int, k: int
    ) -> Tuple[float, float]:
        """Calculate F-statistic and p-value for overall model fit"""
        if r_squared >= 1 or n <= k + 1:
            return 0.0, 1.0

        f_stat = (r_squared / k) / ((1 - r_squared) / (n - k - 1))
        p_value = 1 - stats.f.cdf(f_stat, k, n - k - 1)

        return f_stat, p_value

    def _calculate_durbin_watson(self, residuals: np.ndarray) -> float:
        """Calculate Durbin-Watson statistic for autocorrelation"""
        diff = np.diff(residuals)
        dw = np.sum(diff ** 2) / np.sum(residuals ** 2) if np.sum(residuals ** 2) > 0 else 2.0
        return dw

    def _interpret_results(
        self,
        alpha: float,
        alpha_p_value: float,
        exposures: List[FactorExposure],
        r_squared: float
    ) -> str:
        """Generate interpretation of factor analysis results"""
        parts = []

        # Alpha interpretation
        if alpha_p_value < 0.05:
            if alpha > 0:
                parts.append(f"Portfolio generated significant positive alpha of {alpha:.2%} annually, "
                           f"outperforming the factor model expectations.")
            else:
                parts.append(f"Portfolio has significant negative alpha of {alpha:.2%} annually, "
                           f"underperforming factor model expectations.")
        else:
            parts.append(f"Portfolio alpha of {alpha:.2%} is not statistically significant. "
                       f"Returns are well-explained by factor exposures.")

        # Factor exposures
        sig_factors = [e for e in exposures if e.is_significant]
        if sig_factors:
            factor_list = ", ".join([f"{e.factor_name} (β={e.beta:.2f})" for e in sig_factors])
            parts.append(f" Significant factor exposures: {factor_list}.")

        # Model fit
        if r_squared > 0.90:
            parts.append(f" The model explains {r_squared:.1%} of portfolio variance (excellent fit).")
        elif r_squared > 0.75:
            parts.append(f" The model explains {r_squared:.1%} of portfolio variance (good fit).")
        else:
            parts.append(f" The model explains {r_squared:.1%} of portfolio variance. "
                       f"Consider additional factors or review portfolio composition.")

        return "".join(parts)

    def _generate_recommendations(
        self,
        exposures: List[FactorExposure],
        alpha: float,
        alpha_p_value: float
    ) -> List[str]:
        """Generate actionable recommendations based on factor analysis"""
        recs = []

        # Check each factor exposure
        for exp in exposures:
            if not exp.is_significant:
                continue

            if exp.factor_name == "MKT_RF":
                if exp.beta > 1.2:
                    recs.append(f"⚠️ High market beta ({exp.beta:.2f}). Portfolio is more volatile than market. "
                              f"Consider reducing equity allocation or adding defensive assets.")
                elif exp.beta < 0.8:
                    recs.append(f"📊 Low market beta ({exp.beta:.2f}). Portfolio is less volatile than market. "
                              f"Consider increasing equity if higher returns desired.")

            elif exp.factor_name == "SMB":
                if exp.beta > 0.3:
                    recs.append(f"📈 Strong small-cap tilt (SMB β={exp.beta:.2f}). "
                              f"Expect higher volatility but potential size premium.")
                elif exp.beta < -0.3:
                    recs.append(f"📊 Large-cap bias (SMB β={exp.beta:.2f}). "
                              f"More stable but may miss small-cap premium.")

            elif exp.factor_name == "HML":
                if exp.beta > 0.3:
                    recs.append(f"📈 Strong value tilt (HML β={exp.beta:.2f}). "
                              f"Positioned for value premium but consider diversification.")
                elif exp.beta < -0.3:
                    recs.append(f"🚀 Growth tilt (HML β={exp.beta:.2f}). "
                              f"Consider adding value stocks for diversification.")

            elif exp.factor_name == "RMW":
                if exp.beta > 0.3:
                    recs.append(f"💪 Profitability factor exposure (RMW β={exp.beta:.2f}). "
                              f"Portfolio tilted toward profitable companies.")

            elif exp.factor_name == "CMA":
                if exp.beta > 0.3:
                    recs.append(f"🏛️ Conservative investment tilt (CMA β={exp.beta:.2f}). "
                              f"Favors companies with lower asset growth.")

        # Alpha-based recommendations
        if alpha_p_value < 0.05:
            if alpha < -0.02:  # Negative alpha > 2%
                recs.append(f"🔴 Significant negative alpha ({alpha:.2%}). "
                          f"Review fees, trading costs, and manager selection. Consider passive indexing.")
            elif alpha > 0.05:  # Positive alpha > 5%
                recs.append(f"✅ Strong positive alpha ({alpha:.2%}). "
                          f"Strategy is adding value above factor exposures. Continue monitoring consistency.")

        if not recs:
            recs.append("✅ Factor exposures are well-balanced. Continue regular monitoring of performance attribution.")

        return recs
