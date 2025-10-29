"""
Risk Assessment Tool
Calculate portfolio risk metrics and hedging strategies
"""

import numpy as np
from typing import Dict, List, Optional
from pydantic import BaseModel


class RiskMetrics(BaseModel):
    """Portfolio risk metrics"""
    value_at_risk_95: float  # VaR at 95% confidence
    value_at_risk_99: float  # VaR at 99% confidence
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    beta: float  # Market beta
    correlation_to_market: float


class HedgingStrategy(BaseModel):
    """Hedging recommendation"""
    strategy_type: str  # protective_put, collar, diversification, etc.
    description: str
    cost_estimate: float
    protection_level: float  # % of portfolio protected


class RiskAssessmentResult(BaseModel):
    """Risk assessment result"""
    risk_score: float  # 0-100, higher = riskier
    risk_level: str  # conservative, moderate, aggressive
    metrics: RiskMetrics
    recommendations: List[str]
    hedging_strategies: List[HedgingStrategy]


async def assess_risk(
    portfolio_value: float,
    allocation: Dict[str, float],
    expected_return: float,
    volatility: float,
    time_horizon: int
) -> RiskAssessmentResult:
    """
    Assess portfolio risk and provide recommendations.

    Calculates various risk metrics including VaR, Sharpe ratio,
    and provides hedging recommendations.

    Args:
        portfolio_value: Current portfolio value
        allocation: Asset allocation dictionary
        expected_return: Expected annual return
        volatility: Annual volatility
        time_horizon: Investment horizon in years

    Returns:
        Comprehensive risk assessment
    """
    # Risk-free rate (simplified - should come from market data)
    risk_free_rate = 0.04

    # Calculate Value at Risk (VaR)
    # Using parametric VaR assuming normal distribution
    var_95 = portfolio_value * volatility * 1.645  # 95% confidence
    var_99 = portfolio_value * volatility * 2.326  # 99% confidence

    # Sharpe ratio
    sharpe_ratio = (expected_return - risk_free_rate) / volatility if volatility > 0 else 0

    # Sortino ratio (simplified - using volatility as proxy for downside deviation)
    downside_deviation = volatility * 0.7  # Approximation
    sortino_ratio = (expected_return - risk_free_rate) / downside_deviation if downside_deviation > 0 else 0

    # Estimate max drawdown (2x volatility is common approximation)
    max_drawdown = 2.0 * volatility

    # Estimate beta (simplified - based on equity allocation)
    equity_allocation = allocation.get("stocks", 0) + allocation.get("US_LargeCap", 0) + \
                       allocation.get("US_MidCap", 0) + allocation.get("US_SmallCap", 0) + \
                       allocation.get("International_Developed", 0) + allocation.get("Emerging_Markets", 0)
    beta = 0.3 + (equity_allocation * 0.9)  # Simplified beta calculation

    # Correlation to market (simplified)
    correlation = 0.2 + (equity_allocation * 0.7)

    metrics = RiskMetrics(
        value_at_risk_95=round(var_95, 2),
        value_at_risk_99=round(var_99, 2),
        sharpe_ratio=round(sharpe_ratio, 3),
        sortino_ratio=round(sortino_ratio, 3),
        max_drawdown=round(max_drawdown, 3),
        beta=round(beta, 2),
        correlation_to_market=round(correlation, 2)
    )

    # Calculate overall risk score (0-100)
    risk_score = min(100, (volatility * 100) + (beta * 20))

    # Determine risk level
    if risk_score < 30:
        risk_level = "conservative"
    elif risk_score < 60:
        risk_level = "moderate"
    else:
        risk_level = "aggressive"

    # Generate recommendations
    recommendations = []
    if volatility > 0.20:
        recommendations.append("Portfolio volatility is high. Consider diversifying across more asset classes.")
    if sharpe_ratio < 0.5:
        recommendations.append("Sharpe ratio is below optimal. Review allocation to improve risk-adjusted returns.")
    if beta > 1.2:
        recommendations.append("Portfolio is more volatile than market. Consider defensive positions.")
    if equity_allocation > 0.80:
        recommendations.append("High equity exposure. Consider rebalancing into bonds for stability.")
    if len(allocation) < 3:
        recommendations.append("Limited diversification. Add more asset classes to reduce risk.")

    # Hedging strategies
    hedging_strategies = []

    if volatility > 0.15 and portfolio_value > 100000:
        hedging_strategies.append(HedgingStrategy(
            strategy_type="protective_put",
            description="Purchase put options on major equity holdings to protect against downside",
            cost_estimate=portfolio_value * 0.02,  # ~2% of portfolio
            protection_level=0.90
        ))

    if equity_allocation > 0.70:
        hedging_strategies.append(HedgingStrategy(
            strategy_type="collar",
            description="Implement collar strategy: buy puts and sell calls to limit both downside and upside",
            cost_estimate=portfolio_value * 0.01,  # ~1% of portfolio
            protection_level=0.85
        ))

    hedging_strategies.append(HedgingStrategy(
        strategy_type="diversification",
        description="Add uncorrelated asset classes (REITs, commodities, international bonds)",
        cost_estimate=0.0,  # No direct cost, just rebalancing
        protection_level=0.70
    ))

    return RiskAssessmentResult(
        risk_score=round(risk_score, 1),
        risk_level=risk_level,
        metrics=metrics,
        recommendations=recommendations,
        hedging_strategies=hedging_strategies
    )


async def calculate_var(
    portfolio_value: float,
    volatility: float,
    confidence_level: float = 0.95,
    time_horizon_days: int = 1
) -> float:
    """
    Calculate Value at Risk (VaR) for a portfolio.

    VaR answers: "What is the maximum loss over time period X
    that we would expect with confidence level Y?"

    Args:
        portfolio_value: Current portfolio value
        volatility: Annual volatility
        confidence_level: Confidence level (e.g., 0.95 for 95%)
        time_horizon_days: Time horizon in days

    Returns:
        VaR amount (maximum expected loss)
    """
    # Convert annual volatility to daily
    daily_volatility = volatility / np.sqrt(252)  # 252 trading days

    # Adjust for time horizon
    horizon_volatility = daily_volatility * np.sqrt(time_horizon_days)

    # Z-score for confidence level
    if confidence_level == 0.95:
        z_score = 1.645
    elif confidence_level == 0.99:
        z_score = 2.326
    elif confidence_level == 0.90:
        z_score = 1.282
    else:
        # General formula using inverse normal
        from scipy.stats import norm
        z_score = norm.ppf(confidence_level)

    # Calculate VaR
    var = portfolio_value * horizon_volatility * z_score

    return round(var, 2)
