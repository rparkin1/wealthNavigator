"""
Capital Asset Pricing Model (CAPM) Integration Service
Expected return calculation, security valuation, and performance evaluation

Implements:
- CAPM expected return: E(R) = Rf + β(Rm - Rf)
- Security Market Line (SML) analysis
- Alpha calculation (actual vs. expected return)
- Beta estimation from historical data
- Risk-adjusted performance metrics

REQ-PORT-014: Capital Asset Pricing Model (CAPM) integration
PRD Section 4: Portfolio Optimization Engine
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from scipy import stats
from enum import Enum


class SecurityPosition(str, Enum):
    """Position relative to Security Market Line"""
    OVERVALUED = "overvalued"     # Below SML (expected return < required return)
    UNDERVALUED = "undervalued"   # Above SML (expected return > required return)
    FAIR_VALUE = "fair_value"     # On SML (expected return = required return)


class CAPMMetrics(BaseModel):
    """CAPM metrics for a security or portfolio"""
    # Core CAPM components
    risk_free_rate: float
    market_return: float  # Expected market return
    market_premium: float  # Market return - risk-free rate

    # Security/Portfolio metrics
    beta: float  # Systematic risk
    beta_confidence_interval: Tuple[float, float]  # 95% CI

    # Expected vs. actual
    expected_return: float  # CAPM expected return
    actual_return: float  # Historical actual return
    alpha: float  # Actual - Expected (Jensen's alpha)

    # Statistical measures
    r_squared: float  # How much variance explained by market
    correlation: float  # Correlation with market
    tracking_error: float  # Standard deviation of excess returns
    information_ratio: float  # Alpha / Tracking Error
    treynor_ratio: float  # (Return - Rf) / Beta

    # Security Market Line analysis
    position: SecurityPosition  # Over/under/fair valued
    distance_from_sml: float  # Percentage points from SML

    # Interpretation
    interpretation: str
    investment_recommendation: str


class CAPMPortfolioAnalysis(BaseModel):
    """CAPM analysis for entire portfolio"""
    portfolio_metrics: CAPMMetrics

    # Individual holdings analysis (if provided)
    holdings_analysis: Optional[List[Dict]] = None

    # Portfolio decomposition
    systematic_risk_pct: float  # Percent of risk from market
    idiosyncratic_risk_pct: float  # Percent of risk from specific factors

    # Recommendations
    recommendations: List[str]
    risk_warnings: List[str]


class SecurityMarketLine(BaseModel):
    """Security Market Line for visualization"""
    points: List[Dict[str, float]]  # [{beta: x, expected_return: y}]
    portfolio_point: Dict[str, float]  # Portfolio position
    efficient_portfolios: List[Dict[str, float]]  # Sample efficient portfolios


class CAPMService:
    """Service for CAPM calculations and analysis"""

    def __init__(self, risk_free_rate: float = 0.04, market_return: float = 0.10):
        """
        Initialize CAPM service.

        Args:
            risk_free_rate: Annual risk-free rate (default 4%)
            market_return: Expected annual market return (default 10%)
        """
        self.risk_free_rate = risk_free_rate
        self.market_return = market_return
        self.market_premium = market_return - risk_free_rate

    def calculate_expected_return(self, beta: float) -> float:
        """
        Calculate CAPM expected return: E(R) = Rf + β(Rm - Rf)

        Args:
            beta: Security or portfolio beta

        Returns:
            Expected return according to CAPM
        """
        return self.risk_free_rate + beta * self.market_premium

    def estimate_beta(
        self,
        security_returns: List[float],
        market_returns: List[float],
        frequency: str = "daily"
    ) -> Tuple[float, Tuple[float, float], float, float]:
        """
        Estimate beta from historical returns using OLS regression.

        Args:
            security_returns: Historical returns for security/portfolio
            market_returns: Historical market benchmark returns
            frequency: Return frequency for annualization

        Returns:
            Tuple of (beta, 95% confidence interval, r_squared, correlation)
        """
        sec_ret = np.array(security_returns)
        mkt_ret = np.array(market_returns)

        # Ensure same length
        min_len = min(len(sec_ret), len(mkt_ret))
        sec_ret = sec_ret[:min_len]
        mkt_ret = mkt_ret[:min_len]

        # Calculate excess returns
        rf_period = self._adjust_rate_for_frequency(self.risk_free_rate, frequency)
        sec_excess = sec_ret - rf_period
        mkt_excess = mkt_ret - rf_period

        # OLS regression: sec_excess = alpha + beta * mkt_excess
        slope, intercept, r_value, p_value, std_err = stats.linregress(mkt_excess, sec_excess)

        beta = slope
        r_squared = r_value ** 2
        correlation = r_value

        # 95% confidence interval
        # CI = beta ± t_critical * SE
        n = len(mkt_excess)
        t_critical = stats.t.ppf(0.975, n - 2)  # 95% two-tailed
        ci_lower = beta - t_critical * std_err
        ci_upper = beta + t_critical * std_err

        return beta, (ci_lower, ci_upper), r_squared, correlation

    def analyze_security(
        self,
        security_returns: List[float],
        market_returns: List[float],
        frequency: str = "daily",
        security_name: str = "Security"
    ) -> CAPMMetrics:
        """
        Perform complete CAPM analysis for a security or portfolio.

        Args:
            security_returns: Historical returns
            market_returns: Market benchmark returns
            frequency: Return frequency
            security_name: Name for reporting

        Returns:
            Complete CAPM metrics and analysis
        """
        # Estimate beta
        beta, beta_ci, r_squared, correlation = self.estimate_beta(
            security_returns, market_returns, frequency
        )

        # Calculate expected return
        expected_return = self.calculate_expected_return(beta)

        # Calculate actual return
        actual_return_period = float(np.mean(security_returns))
        actual_return = self._annualize_return(actual_return_period, frequency)

        # Jensen's Alpha
        alpha = actual_return - expected_return

        # Tracking error (annualized)
        rf_period = self._adjust_rate_for_frequency(self.risk_free_rate, frequency)
        sec_excess = np.array(security_returns) - rf_period
        mkt_excess = np.array(market_returns[:len(security_returns)]) - rf_period
        excess_diff = sec_excess - mkt_excess
        tracking_error = float(np.std(excess_diff) * np.sqrt(self._get_periods_per_year(frequency)))

        # Information Ratio
        information_ratio = alpha / tracking_error if tracking_error > 0 else 0

        # Treynor Ratio
        treynor_ratio = (actual_return - self.risk_free_rate) / beta if beta != 0 else 0

        # SML position
        position, distance = self._determine_sml_position(alpha)

        # Systematic vs idiosyncratic risk
        systematic_risk_pct = r_squared
        idiosyncratic_risk_pct = 1 - r_squared

        # Interpretation
        interpretation = self._interpret_capm_metrics(
            beta, alpha, r_squared, information_ratio, security_name
        )

        # Investment recommendation
        recommendation = self._generate_investment_recommendation(
            position, alpha, beta, information_ratio
        )

        return CAPMMetrics(
            risk_free_rate=round(self.risk_free_rate, 4),
            market_return=round(self.market_return, 4),
            market_premium=round(self.market_premium, 4),
            beta=round(beta, 4),
            beta_confidence_interval=(round(beta_ci[0], 4), round(beta_ci[1], 4)),
            expected_return=round(expected_return, 4),
            actual_return=round(actual_return, 4),
            alpha=round(alpha, 4),
            r_squared=round(r_squared, 4),
            correlation=round(correlation, 4),
            tracking_error=round(tracking_error, 4),
            information_ratio=round(information_ratio, 3),
            treynor_ratio=round(treynor_ratio, 3),
            position=position,
            distance_from_sml=round(distance, 4),
            interpretation=interpretation,
            investment_recommendation=recommendation
        )

    def analyze_portfolio(
        self,
        portfolio_returns: List[float],
        market_returns: List[float],
        holdings: Optional[List[Dict]] = None,  # [{name, weight, returns}]
        frequency: str = "daily"
    ) -> CAPMPortfolioAnalysis:
        """
        Perform CAPM analysis for entire portfolio with holdings breakdown.

        Args:
            portfolio_returns: Portfolio returns
            market_returns: Market returns
            holdings: Optional list of individual holdings with returns
            frequency: Return frequency

        Returns:
            Complete portfolio CAPM analysis
        """
        # Analyze portfolio
        portfolio_metrics = self.analyze_security(
            portfolio_returns, market_returns, frequency, "Portfolio"
        )

        # Analyze individual holdings if provided
        holdings_analysis = []
        if holdings:
            for holding in holdings:
                if "returns" in holding and holding["returns"]:
                    metrics = self.analyze_security(
                        holding["returns"],
                        market_returns,
                        frequency,
                        holding.get("name", "Holding")
                    )

                    holdings_analysis.append({
                        "name": holding.get("name", "Unknown"),
                        "weight": holding.get("weight", 0),
                        "beta": metrics.beta,
                        "alpha": metrics.alpha,
                        "expected_return": metrics.expected_return,
                        "actual_return": metrics.actual_return,
                        "position": metrics.position
                    })

        # Calculate risk decomposition
        systematic_risk_pct = portfolio_metrics.r_squared * 100
        idiosyncratic_risk_pct = (1 - portfolio_metrics.r_squared) * 100

        # Generate recommendations
        recommendations = self._generate_portfolio_recommendations(
            portfolio_metrics, holdings_analysis
        )

        # Risk warnings
        risk_warnings = self._generate_risk_warnings(portfolio_metrics)

        return CAPMPortfolioAnalysis(
            portfolio_metrics=portfolio_metrics,
            holdings_analysis=holdings_analysis if holdings_analysis else None,
            systematic_risk_pct=round(systematic_risk_pct, 2),
            idiosyncratic_risk_pct=round(idiosyncratic_risk_pct, 2),
            recommendations=recommendations,
            risk_warnings=risk_warnings
        )

    def generate_security_market_line(
        self,
        beta_range: Tuple[float, float] = (0.0, 2.0),
        num_points: int = 50
    ) -> SecurityMarketLine:
        """
        Generate Security Market Line for visualization.

        Args:
            beta_range: Range of betas to plot
            num_points: Number of points on line

        Returns:
            SML data for charting
        """
        betas = np.linspace(beta_range[0], beta_range[1], num_points)

        points = []
        for beta in betas:
            expected_return = self.calculate_expected_return(beta)
            points.append({
                "beta": round(float(beta), 3),
                "expected_return": round(expected_return, 4)
            })

        # Create sample efficient portfolios (convert to dict format)
        efficient_portfolios = []
        portfolios_data = [
            {"name": "Conservative", "beta": 0.5},
            {"name": "Moderate", "beta": 0.8},
            {"name": "Balanced", "beta": 1.0},
            {"name": "Growth", "beta": 1.2},
            {"name": "Aggressive", "beta": 1.5},
        ]

        for p in portfolios_data:
            efficient_portfolios.append({
                "name": round(p["beta"], 1),  # Use beta as numeric identifier
                "beta": p["beta"],
                "expected_return": self.calculate_expected_return(p["beta"])
            })

        return SecurityMarketLine(
            points=points,
            portfolio_point={
                "beta": 1.0,
                "expected_return": self.market_return
            },
            efficient_portfolios=efficient_portfolios
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

    def _get_periods_per_year(self, frequency: str) -> int:
        """Get number of periods per year"""
        if frequency == "daily":
            return 252
        elif frequency == "monthly":
            return 12
        else:
            return 1

    def _determine_sml_position(
        self, alpha: float, threshold: float = 0.01
    ) -> Tuple[SecurityPosition, float]:
        """Determine if security is over/under/fairly valued based on alpha"""
        if alpha > threshold:
            return SecurityPosition.UNDERVALUED, alpha
        elif alpha < -threshold:
            return SecurityPosition.OVERVALUED, alpha
        else:
            return SecurityPosition.FAIR_VALUE, alpha

    def _interpret_capm_metrics(
        self,
        beta: float,
        alpha: float,
        r_squared: float,
        info_ratio: float,
        name: str
    ) -> str:
        """Generate interpretation of CAPM results"""
        parts = []

        # Beta interpretation
        if beta > 1.2:
            parts.append(f"{name} has high systematic risk (β={beta:.2f}), "
                       f"amplifying market movements by {beta:.1f}x.")
        elif beta > 0.8:
            parts.append(f"{name} moves roughly in line with the market (β={beta:.2f}).")
        else:
            parts.append(f"{name} has low systematic risk (β={beta:.2f}), "
                       f"less volatile than the market.")

        # Alpha interpretation
        if abs(alpha) > 0.02:  # More than 2% alpha
            if alpha > 0:
                parts.append(f" Positive alpha of {alpha:.2%} indicates outperformance "
                           f"relative to CAPM expectations.")
            else:
                parts.append(f" Negative alpha of {alpha:.2%} indicates underperformance "
                           f"relative to CAPM expectations.")
        else:
            parts.append(f" Alpha near zero ({alpha:.2%}) suggests returns match CAPM expectations.")

        # R-squared interpretation
        if r_squared > 0.85:
            parts.append(f" High R² ({r_squared:.1%}) means market explains most variance.")
        elif r_squared < 0.50:
            parts.append(f" Low R² ({r_squared:.1%}) indicates significant idiosyncratic risk.")

        return "".join(parts)

    def _generate_investment_recommendation(
        self,
        position: SecurityPosition,
        alpha: float,
        beta: float,
        info_ratio: float
    ) -> str:
        """Generate investment recommendation based on CAPM analysis"""
        if position == SecurityPosition.UNDERVALUED:
            if info_ratio > 0.5:
                return (f"🟢 STRONG BUY - Security trades above SML with strong information ratio "
                       f"({info_ratio:.2f}). Positive alpha of {alpha:.2%} suggests good value.")
            else:
                return (f"🟢 BUY - Security appears undervalued (positive alpha {alpha:.2%}), "
                       f"but monitor risk-adjusted performance.")

        elif position == SecurityPosition.OVERVALUED:
            if info_ratio < -0.5:
                return (f"🔴 SELL - Security trades below SML with poor information ratio "
                       f"({info_ratio:.2f}). Negative alpha of {alpha:.2%} suggests overvaluation.")
            else:
                return (f"🟡 HOLD/REDUCE - Security shows negative alpha ({alpha:.2%}). "
                       f"Consider alternatives with better risk-adjusted returns.")

        else:  # Fair value
            return (f"🟡 HOLD - Security is fairly valued relative to CAPM expectations. "
                   f"Returns match systematic risk level (β={beta:.2f}).")

    def _generate_portfolio_recommendations(
        self,
        metrics: CAPMMetrics,
        holdings: Optional[List[Dict]]
    ) -> List[str]:
        """Generate portfolio recommendations based on CAPM analysis"""
        recs = []

        # Beta recommendations
        if metrics.beta > 1.3:
            recs.append("⚠️ Portfolio has high market sensitivity (β > 1.3). "
                      "Consider adding defensive assets or bonds to reduce systematic risk.")
        elif metrics.beta < 0.7:
            recs.append("📊 Portfolio is defensive (β < 0.7). "
                      "If higher returns are desired, consider increasing equity allocation.")

        # Alpha recommendations
        if metrics.alpha > 0.03:
            recs.append(f"✅ Strong positive alpha ({metrics.alpha:.2%}). "
                      f"Portfolio is outperforming CAPM expectations. Continue current strategy.")
        elif metrics.alpha < -0.03:
            recs.append(f"🔴 Negative alpha ({metrics.alpha:.2%}). "
                      f"Portfolio underperforming for its risk level. Review holdings and fees.")

        # Information Ratio
        if metrics.information_ratio > 0.75:
            recs.append(f"💪 Excellent information ratio ({metrics.information_ratio:.2f}). "
                      f"Generating consistent alpha with controlled tracking error.")
        elif metrics.information_ratio < -0.5:
            recs.append(f"⚠️ Poor information ratio ({metrics.information_ratio:.2f}). "
                      f"Not being adequately compensated for active risk taken.")

        # R-squared (diversification)
        if metrics.r_squared < 0.60:
            recs.append(f"⚠️ Low R² ({metrics.r_squared:.1%}) indicates high idiosyncratic risk. "
                      f"Consider better diversification or validate active bets.")

        # Holdings-specific recommendations
        if holdings:
            undervalued = [h for h in holdings if h.get("position") == SecurityPosition.UNDERVALUED]
            overvalued = [h for h in holdings if h.get("position") == SecurityPosition.OVERVALUED]

            if len(overvalued) > len(holdings) * 0.3:
                recs.append(f"🔴 {len(overvalued)} holdings appear overvalued. "
                          f"Consider rebalancing to improve risk-adjusted returns.")

            if undervalued and len(undervalued) > 2:
                names = ", ".join([h["name"] for h in undervalued[:3]])
                recs.append(f"🟢 Identified {len(undervalued)} undervalued holdings ({names}...). "
                          f"Consider increasing allocation.")

        if not recs:
            recs.append("✅ Portfolio is well-positioned relative to CAPM expectations. "
                      "Continue monitoring performance quarterly.")

        return recs

    def _generate_risk_warnings(self, metrics: CAPMMetrics) -> List[str]:
        """Generate risk warnings based on CAPM metrics"""
        warnings = []

        if metrics.beta > 1.5:
            warnings.append("🔴 CRITICAL: Very high beta (> 1.5). Portfolio highly sensitive to market crashes.")

        if metrics.alpha < -0.10:  # -10% annual alpha
            warnings.append("🔴 CRITICAL: Severe underperformance. Immediate portfolio review recommended.")

        if metrics.r_squared < 0.40:
            warnings.append("⚠️ WARNING: Very low R². Portfolio returns poorly explained by market. "
                          "High concentration or sector risk possible.")

        if metrics.information_ratio < -1.0:
            warnings.append("⚠️ WARNING: Very poor information ratio. Consider passive index strategy.")

        return warnings
