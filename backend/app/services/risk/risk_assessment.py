"""
Risk Assessment Service
Comprehensive risk metrics calculation including VaR, CVaR, Sharpe, Sortino, and more

REQ-RISK-001: Risk metrics calculation
REQ-RISK-002: Historical simulation for VaR/CVaR
"""

import numpy as np
from typing import Dict, List, Optional
from pydantic import BaseModel
from scipy import stats


class RiskMetrics(BaseModel):
    """Comprehensive portfolio risk metrics"""
    # Value at Risk
    var_95_1day: float  # 1-day VaR at 95% confidence
    var_99_1day: float  # 1-day VaR at 99% confidence
    var_95_1month: float  # 1-month VaR at 95% confidence
    var_99_1month: float  # 1-month VaR at 99% confidence

    # Conditional VaR (Expected Shortfall)
    cvar_95: float  # Average loss beyond VaR 95%
    cvar_99: float  # Average loss beyond VaR 99%

    # Risk-adjusted return metrics
    sharpe_ratio: float  # (Return - RiskFree) / Volatility
    sortino_ratio: float  # (Return - RiskFree) / Downside Deviation
    calmar_ratio: float  # Return / Max Drawdown

    # Drawdown metrics
    max_drawdown: float  # Maximum peak-to-trough decline
    average_drawdown: float  # Average of all drawdowns
    drawdown_duration: int  # Days to recover from max drawdown

    # Market risk
    beta: float  # Systematic risk vs market
    alpha: float  # Excess return over expected (CAPM)
    correlation_to_market: float  # Correlation with market
    tracking_error: float  # Standard deviation of excess returns

    # Volatility metrics
    annual_volatility: float  # Annual standard deviation
    downside_volatility: float  # Volatility of negative returns only
    upside_volatility: float  # Volatility of positive returns only

    # Distribution metrics
    skewness: float  # Asymmetry of return distribution
    kurtosis: float  # Tail risk measure

    # Concentration risk
    concentration_score: float  # HHI-based concentration metric

    # Overall risk score
    risk_score: float  # Composite risk score (0-100)
    risk_level: str  # conservative, moderate, aggressive, very_aggressive


class RiskAssessmentResult(BaseModel):
    """Complete risk assessment result"""
    portfolio_value: float
    metrics: RiskMetrics
    risk_breakdown: Dict[str, float]  # Risk contribution by asset
    recommendations: List[str]
    warnings: List[str]

    # Time-series data for visualization
    returns_series: Optional[List[float]] = None
    drawdown_series: Optional[List[float]] = None


class RiskAssessmentService:
    """Service for calculating comprehensive portfolio risk metrics"""

    def __init__(self, risk_free_rate: float = 0.04):
        """
        Initialize risk assessment service

        Args:
            risk_free_rate: Annual risk-free rate (default 4%)
        """
        self.risk_free_rate = risk_free_rate

    def assess_risk(
        self,
        portfolio_value: float,
        allocation: Dict[str, float],  # {asset: weight}
        expected_return: float,  # Annual
        volatility: float,  # Annual
        returns_history: Optional[List[float]] = None,  # Historical returns
        benchmark_returns: Optional[List[float]] = None,  # For beta/alpha
        asset_returns: Optional[Dict[str, List[float]]] = None  # Per-asset returns
    ) -> RiskAssessmentResult:
        """
        Perform comprehensive risk assessment

        Args:
            portfolio_value: Current portfolio value
            allocation: Asset allocation weights
            expected_return: Expected annual return
            volatility: Annual volatility
            returns_history: Historical daily returns for historical simulation
            benchmark_returns: Benchmark returns for beta/alpha calculation
            asset_returns: Historical returns by asset for risk decomposition

        Returns:
            Complete risk assessment with metrics and recommendations
        """
        # Calculate Value at Risk
        var_95_1day = self._calculate_var(portfolio_value, volatility, 0.95, 1)
        var_99_1day = self._calculate_var(portfolio_value, volatility, 0.99, 1)
        var_95_1month = self._calculate_var(portfolio_value, volatility, 0.95, 21)
        var_99_1month = self._calculate_var(portfolio_value, volatility, 0.99, 21)

        # Calculate Conditional VaR (CVaR) using historical simulation if available
        if returns_history:
            cvar_95 = self._calculate_cvar_historical(portfolio_value, returns_history, 0.95)
            cvar_99 = self._calculate_cvar_historical(portfolio_value, returns_history, 0.99)
        else:
            # Parametric CVaR approximation
            cvar_95 = var_95_1day * 1.15
            cvar_99 = var_99_1day * 1.15

        # Sharpe Ratio
        sharpe_ratio = (expected_return - self.risk_free_rate) / volatility if volatility > 0 else 0

        # Sortino Ratio (requires downside deviation)
        if returns_history:
            downside_deviation = self._calculate_downside_deviation(returns_history, self.risk_free_rate)
            downside_volatility = downside_deviation
        else:
            downside_deviation = volatility * 0.7  # Approximation
            downside_volatility = downside_deviation

        sortino_ratio = (expected_return - self.risk_free_rate) / downside_deviation if downside_deviation > 0 else 0

        # Drawdown metrics
        if returns_history:
            max_drawdown, avg_drawdown, drawdown_duration, drawdown_series = self._calculate_drawdowns(returns_history)
        else:
            max_drawdown = 2.0 * volatility  # Approximation
            avg_drawdown = 1.0 * volatility
            drawdown_duration = 90  # Estimate
            drawdown_series = None

        # Calmar Ratio
        calmar_ratio = expected_return / max_drawdown if max_drawdown > 0 else 0

        # Beta and Alpha (if benchmark provided)
        if returns_history and benchmark_returns:
            beta, alpha, correlation, tracking_error = self._calculate_market_metrics(
                returns_history, benchmark_returns, self.risk_free_rate
            )
        else:
            # Estimate based on equity allocation
            equity_pct = self._estimate_equity_allocation(allocation)
            beta = 0.3 + (equity_pct * 0.9)
            alpha = expected_return - (self.risk_free_rate + beta * (0.10 - self.risk_free_rate))
            correlation = 0.2 + (equity_pct * 0.7)
            tracking_error = volatility * 0.2

        # Distribution metrics
        if returns_history:
            skewness = float(stats.skew(returns_history))
            kurtosis = float(stats.kurtosis(returns_history))
            upside_volatility = self._calculate_upside_volatility(returns_history)
        else:
            skewness = -0.5  # Typical for equity returns
            kurtosis = 3.0  # Typical excess kurtosis
            upside_volatility = volatility * 0.8

        # Concentration risk (HHI)
        concentration_score = self._calculate_concentration(allocation)

        # Overall risk score (0-100)
        risk_score = self._calculate_risk_score(
            volatility, beta, max_drawdown, concentration_score, sharpe_ratio
        )

        # Risk level
        risk_level = self._determine_risk_level(risk_score)

        # Risk breakdown by asset
        risk_breakdown = self._calculate_risk_breakdown(allocation, asset_returns, volatility)

        # Metrics object
        metrics = RiskMetrics(
            var_95_1day=round(var_95_1day, 2),
            var_99_1day=round(var_99_1day, 2),
            var_95_1month=round(var_95_1month, 2),
            var_99_1month=round(var_99_1month, 2),
            cvar_95=round(cvar_95, 2),
            cvar_99=round(cvar_99, 2),
            sharpe_ratio=round(sharpe_ratio, 3),
            sortino_ratio=round(sortino_ratio, 3),
            calmar_ratio=round(calmar_ratio, 3),
            max_drawdown=round(max_drawdown, 4),
            average_drawdown=round(avg_drawdown, 4),
            drawdown_duration=drawdown_duration,
            beta=round(beta, 3),
            alpha=round(alpha, 4),
            correlation_to_market=round(correlation, 3),
            tracking_error=round(tracking_error, 4),
            annual_volatility=round(volatility, 4),
            downside_volatility=round(downside_volatility, 4),
            upside_volatility=round(upside_volatility, 4),
            skewness=round(skewness, 3),
            kurtosis=round(kurtosis, 3),
            concentration_score=round(concentration_score, 3),
            risk_score=round(risk_score, 1),
            risk_level=risk_level
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, allocation)
        warnings = self._generate_warnings(metrics)

        return RiskAssessmentResult(
            portfolio_value=portfolio_value,
            metrics=metrics,
            risk_breakdown=risk_breakdown,
            recommendations=recommendations,
            warnings=warnings,
            returns_series=returns_history,
            drawdown_series=drawdown_series
        )

    def _calculate_var(
        self, portfolio_value: float, volatility: float, confidence: float, days: int
    ) -> float:
        """Calculate parametric VaR"""
        daily_vol = volatility / np.sqrt(252)
        horizon_vol = daily_vol * np.sqrt(days)
        z_score = stats.norm.ppf(confidence)
        return portfolio_value * horizon_vol * z_score

    def _calculate_cvar_historical(
        self, portfolio_value: float, returns: List[float], confidence: float
    ) -> float:
        """Calculate CVaR using historical simulation"""
        returns_array = np.array(returns)
        var_threshold = np.percentile(returns_array, (1 - confidence) * 100)
        tail_losses = returns_array[returns_array <= var_threshold]
        if len(tail_losses) > 0:
            cvar = abs(np.mean(tail_losses) * portfolio_value)
        else:
            cvar = abs(var_threshold * portfolio_value)
        return cvar

    def _calculate_downside_deviation(self, returns: List[float], target: float) -> float:
        """Calculate downside deviation (semi-deviation)"""
        daily_target = target / 252
        returns_array = np.array(returns)
        downside_returns = returns_array[returns_array < daily_target]
        if len(downside_returns) > 0:
            return float(np.std(downside_returns) * np.sqrt(252))
        return 0.0

    def _calculate_upside_volatility(self, returns: List[float]) -> float:
        """Calculate upside volatility"""
        returns_array = np.array(returns)
        upside_returns = returns_array[returns_array > 0]
        if len(upside_returns) > 0:
            return float(np.std(upside_returns) * np.sqrt(252))
        return 0.0

    def _calculate_drawdowns(self, returns: List[float]):
        """Calculate drawdown metrics"""
        returns_array = np.array(returns)
        cumulative = np.cumprod(1 + returns_array)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = (cumulative - running_max) / running_max

        max_dd = abs(float(np.min(drawdown)))
        avg_dd = abs(float(np.mean(drawdown[drawdown < 0]))) if any(drawdown < 0) else 0

        # Duration: days to recover from max drawdown
        max_dd_idx = int(np.argmin(drawdown))
        recovery_idx = max_dd_idx
        for i in range(max_dd_idx, len(drawdown)):
            if drawdown[i] >= 0:
                recovery_idx = i
                break
        duration = recovery_idx - max_dd_idx

        return max_dd, avg_dd, duration, drawdown.tolist()

    def _calculate_market_metrics(
        self, returns: List[float], benchmark: List[float], rf_rate: float
    ):
        """Calculate beta, alpha, correlation, tracking error"""
        returns_array = np.array(returns)
        benchmark_array = np.array(benchmark)

        # Ensure same length
        min_len = min(len(returns_array), len(benchmark_array))
        returns_array = returns_array[:min_len]
        benchmark_array = benchmark_array[:min_len]

        # Beta
        covariance = np.cov(returns_array, benchmark_array)[0, 1]
        benchmark_var = np.var(benchmark_array)
        beta = covariance / benchmark_var if benchmark_var > 0 else 1.0

        # Correlation
        correlation = np.corrcoef(returns_array, benchmark_array)[0, 1]

        # Alpha (annualized)
        portfolio_return = float(np.mean(returns_array) * 252)
        benchmark_return = float(np.mean(benchmark_array) * 252)
        alpha = portfolio_return - (rf_rate + beta * (benchmark_return - rf_rate))

        # Tracking error (annualized)
        excess_returns = returns_array - benchmark_array
        tracking_error = float(np.std(excess_returns) * np.sqrt(252))

        return beta, alpha, correlation, tracking_error

    def _estimate_equity_allocation(self, allocation: Dict[str, float]) -> float:
        """Estimate equity percentage from allocation"""
        equity_keywords = ['EQUITY', 'STOCK', 'BLEND', 'GROWTH', 'VALUE', 'CAP', 'EM_', 'INTL_DEV']
        equity_pct = sum(
            weight for asset, weight in allocation.items()
            if any(keyword in asset.upper() for keyword in equity_keywords)
        )
        return equity_pct

    def _calculate_concentration(self, allocation: Dict[str, float]) -> float:
        """Calculate HHI concentration score"""
        hhi = sum(weight ** 2 for weight in allocation.values())
        # Normalize: 1.0 = fully concentrated, 0.0 = perfectly diversified
        n = len(allocation)
        if n <= 1:
            return 1.0
        normalized_hhi = (hhi - 1/n) / (1 - 1/n)
        return normalized_hhi

    def _calculate_risk_score(
        self, volatility: float, beta: float, max_dd: float, concentration: float, sharpe: float
    ) -> float:
        """Calculate composite risk score (0-100)"""
        vol_score = min(100, volatility * 200)  # 50% vol = 100 points
        beta_score = min(100, beta * 50)  # beta 2.0 = 100 points
        dd_score = min(100, max_dd * 200)  # 50% drawdown = 100 points
        conc_score = concentration * 50  # Full concentration = 50 points
        sharpe_penalty = max(0, (1.0 - sharpe) * 20)  # Low Sharpe adds risk

        risk_score = (vol_score * 0.3 + beta_score * 0.2 + dd_score * 0.3 +
                     conc_score * 0.1 + sharpe_penalty * 0.1)
        return min(100, max(0, risk_score))

    def _determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level from score"""
        if risk_score < 25:
            return "conservative"
        elif risk_score < 50:
            return "moderate"
        elif risk_score < 75:
            return "aggressive"
        else:
            return "very_aggressive"

    def _calculate_risk_breakdown(
        self, allocation: Dict[str, float],
        asset_returns: Optional[Dict[str, List[float]]],
        portfolio_vol: float
    ) -> Dict[str, float]:
        """Calculate risk contribution by asset"""
        risk_breakdown = {}

        if asset_returns:
            # Calculate actual risk contribution
            for asset, weight in allocation.items():
                if asset in asset_returns:
                    asset_vol = float(np.std(asset_returns[asset]) * np.sqrt(252))
                    # Marginal contribution to risk (simplified)
                    risk_contribution = weight * asset_vol
                    risk_breakdown[asset] = round(risk_contribution, 4)
                else:
                    risk_breakdown[asset] = round(weight * portfolio_vol, 4)
        else:
            # Simple proportional allocation
            for asset, weight in allocation.items():
                risk_breakdown[asset] = round(weight * portfolio_vol, 4)

        return risk_breakdown

    def _generate_recommendations(self, metrics: RiskMetrics, allocation: Dict[str, float]) -> List[str]:
        """Generate risk management recommendations"""
        recs = []

        if metrics.sharpe_ratio < 0.5:
            recs.append("⚠️ Low Sharpe ratio. Consider improving risk-adjusted returns through better diversification.")

        if metrics.max_drawdown > 0.30:
            recs.append("📉 High maximum drawdown risk. Consider hedging strategies or reducing volatility.")

        if metrics.beta > 1.3:
            recs.append("📊 High market beta. Portfolio is more volatile than market. Consider defensive positions.")

        if metrics.concentration_score > 0.5:
            recs.append("⚠️ High concentration risk. Diversify across more asset classes.")

        if metrics.sortino_ratio < metrics.sharpe_ratio * 0.7:
            recs.append("📉 Significant downside risk. Consider protective strategies.")

        if metrics.kurtosis > 5:
            recs.append("⚠️ Fat tails detected (high kurtosis). Increased probability of extreme events.")

        if metrics.skewness < -1:
            recs.append("📉 Negative skew detected. Portfolio has higher probability of large losses.")

        if len(recs) == 0:
            recs.append("✅ Portfolio risk profile is well-balanced. Continue monitoring quarterly.")

        return recs

    def _generate_warnings(self, metrics: RiskMetrics) -> List[str]:
        """Generate risk warnings"""
        warnings = []

        if metrics.var_99_1month > 0.25:  # >25% portfolio value at risk
            warnings.append("🔴 CRITICAL: Very high 1-month VaR (99%). Significant capital at risk.")

        if metrics.max_drawdown > 0.50:
            warnings.append("🔴 CRITICAL: Maximum drawdown exceeds 50%. Unacceptable risk level.")

        if metrics.risk_score > 80:
            warnings.append("🔴 CRITICAL: Overall risk score is very high. Immediate action recommended.")

        if metrics.beta > 1.5:
            warnings.append("⚠️ WARNING: Extremely high beta. Portfolio highly sensitive to market movements.")

        if metrics.sharpe_ratio < 0:
            warnings.append("⚠️ WARNING: Negative Sharpe ratio. Not adequately compensated for risk taken.")

        return warnings
