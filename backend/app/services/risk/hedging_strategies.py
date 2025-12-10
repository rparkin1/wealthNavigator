"""
Hedging Strategies Service
Portfolio hedging recommendations including options strategies and tail risk hedging

REQ-RISK-005: Hedging strategy recommendations
REQ-RISK-006: Options pricing and strategy evaluation
"""

import numpy as np
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum
from scipy.stats import norm


class HedgingStrategyType(str, Enum):
    """Types of hedging strategies"""
    PROTECTIVE_PUT = "protective_put"
    COLLAR = "collar"
    PUT_SPREAD = "put_spread"
    DIVERSIFICATION = "diversification"
    TAIL_RISK_HEDGE = "tail_risk_hedge"
    INVERSE_ETF = "inverse_etf"
    VOLATILITY_HEDGE = "volatility_hedge"
    CORRELATION_HEDGE = "correlation_hedge"


class HedgingStrategy(BaseModel):
    """Detailed hedging strategy recommendation"""
    strategy_type: HedgingStrategyType
    name: str
    description: str
    implementation: str  # How to implement
    cost_estimate: float  # Dollar cost
    cost_pct: float  # % of portfolio
    protection_level: float  # % of portfolio protected
    max_downside: float  # Maximum loss with hedge
    breakeven_point: float  # Price level for breakeven
    time_horizon: str  # Recommended duration
    pros: List[str]
    cons: List[str]
    suitability_score: float  # 0-100


class HedgingRecommendation(BaseModel):
    """Complete hedging recommendation"""
    portfolio_value: float
    current_risk_level: str
    recommended_strategies: List[HedgingStrategy]
    optimal_strategy: HedgingStrategy
    total_cost_range: tuple[float, float]  # Min, Max cost
    expected_protection: float  # Expected portfolio protection


class OptionsParameters(BaseModel):
    """Parameters for options pricing"""
    spot_price: float  # Current price
    strike_price: float  # Strike price
    time_to_expiry: float  # Years
    volatility: float  # Implied volatility
    risk_free_rate: float  # Risk-free rate
    dividend_yield: float = 0.0  # Dividend yield


class HedgingService:
    """Service for generating hedging strategy recommendations"""

    def __init__(self, risk_free_rate: float = 0.04):
        """
        Initialize hedging service

        Args:
            risk_free_rate: Annual risk-free rate
        """
        self.risk_free_rate = risk_free_rate

    def recommend_hedging_strategies(
        self,
        portfolio_value: float,
        allocation: Dict[str, float],
        risk_metrics: Dict,  # From risk assessment
        market_conditions: Optional[Dict] = None
    ) -> HedgingRecommendation:
        """
        Generate comprehensive hedging recommendations

        Args:
            portfolio_value: Current portfolio value
            allocation: Asset allocation
            risk_metrics: Risk metrics from assessment
            market_conditions: Current market conditions (VIX, etc.)

        Returns:
            Complete hedging recommendation
        """
        strategies = []

        # Extract key risk metrics
        volatility = risk_metrics.get("annual_volatility", 0.15)
        beta = risk_metrics.get("beta", 1.0)
        max_drawdown = risk_metrics.get("max_drawdown", 0.20)
        risk_level = risk_metrics.get("risk_level", "moderate")

        # Estimate equity allocation
        equity_pct = self._estimate_equity_allocation(allocation)

        # Generate strategy recommendations based on risk profile

        # 1. Protective Put Strategy
        if equity_pct > 0.30 and portfolio_value > 50000:
            protective_put = self._design_protective_put(
                portfolio_value, equity_pct, volatility
            )
            strategies.append(protective_put)

        # 2. Collar Strategy
        if equity_pct > 0.50 and portfolio_value > 100000:
            collar = self._design_collar(portfolio_value, equity_pct, volatility)
            strategies.append(collar)

        # 3. Put Spread Strategy
        if equity_pct > 0.40 and volatility > 0.15:
            put_spread = self._design_put_spread(
                portfolio_value, equity_pct, volatility
            )
            strategies.append(put_spread)

        # 4. Tail Risk Hedge
        if max_drawdown > 0.25 or risk_level in ["aggressive", "very_aggressive"]:
            tail_risk = self._design_tail_risk_hedge(
                portfolio_value, equity_pct, volatility
            )
            strategies.append(tail_risk)

        # 5. Diversification
        if len(allocation) < 5 or self._calculate_concentration(allocation) > 0.4:
            diversification = self._design_diversification_hedge(
                portfolio_value, allocation
            )
            strategies.append(diversification)

        # 6. Volatility Hedge (VIX products)
        if volatility > 0.20 and portfolio_value > 250000:
            vol_hedge = self._design_volatility_hedge(portfolio_value, volatility)
            strategies.append(vol_hedge)

        # 7. Inverse ETF Strategy
        if beta > 1.2 and equity_pct > 0.60:
            inverse_etf = self._design_inverse_etf_hedge(portfolio_value, equity_pct)
            strategies.append(inverse_etf)

        # Sort by suitability score
        strategies.sort(key=lambda s: s.suitability_score, reverse=True)

        # Find optimal strategy (highest suitability with reasonable cost)
        optimal = strategies[0] if strategies else None

        # Calculate cost range
        if strategies:
            costs = [s.cost_estimate for s in strategies]
            cost_range = (min(costs), max(costs))
            avg_protection = np.mean([s.protection_level for s in strategies])
        else:
            cost_range = (0.0, 0.0)
            avg_protection = 0.0

        return HedgingRecommendation(
            portfolio_value=portfolio_value,
            current_risk_level=risk_level,
            recommended_strategies=strategies,
            optimal_strategy=optimal,
            total_cost_range=cost_range,
            expected_protection=round(avg_protection, 2)
        )

    def _design_protective_put(
        self, portfolio_value: float, equity_pct: float, volatility: float
    ) -> HedgingStrategy:
        """Design protective put strategy"""
        equity_value = portfolio_value * equity_pct

        # Put strike at 90% of current value (10% OTM)
        strike_pct = 0.90
        protection_level = strike_pct

        # Estimate put cost (Black-Scholes approximation)
        # Simplified: put cost ~2-3% for 3-month 90% strike
        time_horizon = 0.25  # 3 months
        cost_pct = self._estimate_put_cost(volatility, time_horizon, 0.10)  # 10% OTM
        cost_estimate = equity_value * cost_pct

        max_downside = equity_value * (1 - strike_pct) + cost_estimate

        # Suitability score
        suitability = self._calculate_suitability(
            cost_pct, protection_level, volatility, "put"
        )

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.PROTECTIVE_PUT,
            name="Protective Put",
            description="Purchase put options on equity holdings to protect against downside",
            implementation=f"Buy put options with strike at {strike_pct:.0%} of current portfolio value, expiring in 3 months",
            cost_estimate=round(cost_estimate, 2),
            cost_pct=round(cost_pct, 4),
            protection_level=protection_level,
            max_downside=round(max_downside, 2),
            breakeven_point=round(portfolio_value * (1 - cost_pct), 2),
            time_horizon="3 months (roll quarterly)",
            pros=[
                "Unlimited upside potential",
                "Defined maximum loss",
                "Simple to implement",
                "Precise protection level"
            ],
            cons=[
                "Direct cost to portfolio",
                "Requires quarterly rolling",
                "Cost increases with volatility",
                "Time decay if market stable"
            ],
            suitability_score=round(suitability, 1)
        )

    def _design_collar(
        self, portfolio_value: float, equity_pct: float, volatility: float
    ) -> HedgingStrategy:
        """Design collar strategy (buy put + sell call)"""
        equity_value = portfolio_value * equity_pct

        # Put at 90%, Call at 110%
        put_strike = 0.90
        call_strike = 1.10

        # Estimate costs (net cost after call premium)
        put_cost_pct = self._estimate_put_cost(volatility, 0.25, 0.10)
        call_premium_pct = self._estimate_call_premium(volatility, 0.25, 0.10)
        net_cost_pct = max(0, put_cost_pct - call_premium_pct)  # Often zero or low cost

        cost_estimate = equity_value * net_cost_pct
        max_downside = equity_value * (1 - put_strike) + cost_estimate

        suitability = self._calculate_suitability(
            net_cost_pct, put_strike, volatility, "collar"
        )

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.COLLAR,
            name="Collar Strategy",
            description="Buy protective puts and sell covered calls to create low-cost hedge",
            implementation=f"Buy {put_strike:.0%} put and sell {call_strike:.0%} call, both 3-month expiry",
            cost_estimate=round(cost_estimate, 2),
            cost_pct=round(net_cost_pct, 4),
            protection_level=put_strike,
            max_downside=round(max_downside, 2),
            breakeven_point=round(portfolio_value * (1 - net_cost_pct), 2),
            time_horizon="3 months (roll quarterly)",
            pros=[
                "Very low or zero net cost",
                "Defined maximum loss",
                "Suitable for long-term holders",
                "Reduces portfolio volatility"
            ],
            cons=[
                "Caps upside potential",
                "Gives up gains above call strike",
                "Requires active management",
                "May miss strong rallies"
            ],
            suitability_score=round(suitability, 1)
        )

    def _design_put_spread(
        self, portfolio_value: float, equity_pct: float, volatility: float
    ) -> HedgingStrategy:
        """Design put spread strategy (buy put + sell lower put)"""
        equity_value = portfolio_value * equity_pct

        # Buy 90% put, sell 80% put
        long_put_strike = 0.90
        short_put_strike = 0.80
        protection_range = long_put_strike - short_put_strike

        # Costs (net debit)
        long_put_cost = self._estimate_put_cost(volatility, 0.25, 0.10)
        short_put_premium = self._estimate_put_cost(volatility, 0.25, 0.20)
        net_cost_pct = long_put_cost - short_put_premium

        cost_estimate = equity_value * net_cost_pct
        max_downside = equity_value * (1 - short_put_strike) + cost_estimate

        suitability = self._calculate_suitability(
            net_cost_pct, long_put_strike, volatility, "spread"
        )

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.PUT_SPREAD,
            name="Put Spread",
            description="Buy near-the-money puts and sell out-of-the-money puts to reduce cost",
            implementation=f"Buy {long_put_strike:.0%} put and sell {short_put_strike:.0%} put, both 3-month expiry",
            cost_estimate=round(cost_estimate, 2),
            cost_pct=round(net_cost_pct, 4),
            protection_level=long_put_strike,
            max_downside=round(max_downside, 2),
            breakeven_point=round(portfolio_value * long_put_strike - cost_estimate, 2),
            time_horizon="3 months",
            pros=[
                "Lower cost than protective put",
                "Defined risk/reward",
                "Good for moderate declines",
                "Less time decay impact"
            ],
            cons=[
                f"Protection limited to {protection_range:.0%} range",
                "No protection below short strike",
                "More complex than simple put",
                "Requires understanding spreads"
            ],
            suitability_score=round(suitability, 1)
        )

    def _design_tail_risk_hedge(
        self, portfolio_value: float, equity_pct: float, volatility: float
    ) -> HedgingStrategy:
        """Design tail risk hedge (deep OTM puts)"""
        equity_value = portfolio_value * equity_pct

        # Deep OTM puts (70% strike)
        strike_pct = 0.70
        protection_level = strike_pct

        # Very low cost for deep OTM
        cost_pct = self._estimate_put_cost(volatility, 0.5, 0.30) * 0.5  # Very cheap
        cost_estimate = equity_value * cost_pct

        max_downside = equity_value * (1 - strike_pct)

        suitability = self._calculate_suitability(
            cost_pct, protection_level, volatility, "tail"
        )

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.TAIL_RISK_HEDGE,
            name="Tail Risk Hedge",
            description="Protect against extreme market crashes with deep out-of-the-money puts",
            implementation=f"Buy far OTM puts (strike at {strike_pct:.0%}), 6-month expiry",
            cost_estimate=round(cost_estimate, 2),
            cost_pct=round(cost_pct, 4),
            protection_level=protection_level,
            max_downside=round(max_downside, 2),
            breakeven_point=0,  # Only pays off in crashes
            time_horizon="6 months",
            pros=[
                "Very low cost",
                "Massive payoff in crashes",
                "Peace of mind for black swans",
                "Doesn't interfere with normal returns"
            ],
            cons=[
                "No protection for moderate declines",
                "Likely to expire worthless",
                "Cost is recurring",
                "Requires conviction to maintain"
            ],
            suitability_score=round(suitability, 1)
        )

    def _design_diversification_hedge(
        self, portfolio_value: float, allocation: Dict[str, float]
    ) -> HedgingStrategy:
        """Design diversification-based hedge"""
        current_concentration = self._calculate_concentration(allocation)
        target_concentration = 0.3  # Target HHI

        # Estimate cost as rebalancing costs (minimal)
        cost_estimate = portfolio_value * 0.001  # 0.1% transaction cost

        protection_level = 0.70 + (1 - current_concentration) * 0.20

        suitability = 85 - (current_concentration * 50)  # Higher score if concentrated

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.DIVERSIFICATION,
            name="Diversification",
            description="Add uncorrelated asset classes to reduce portfolio-wide risk",
            implementation="Rebalance into: international equities, bonds, REITs, commodities, alternatives",
            cost_estimate=round(cost_estimate, 2),
            cost_pct=0.001,
            protection_level=protection_level,
            max_downside=portfolio_value * 0.25,  # Better diversification limits drawdown
            breakeven_point=portfolio_value,
            time_horizon="Permanent structural change",
            pros=[
                "No ongoing premium cost",
                "Improves Sharpe ratio",
                "Reduces correlation risk",
                "Works in all market conditions"
            ],
            cons=[
                "May reduce returns in bull markets",
                "Requires rebalancing discipline",
                "Some assets may have higher fees",
                "Not protection against systemic risk"
            ],
            suitability_score=round(suitability, 1)
        )

    def _design_volatility_hedge(
        self, portfolio_value: float, volatility: float
    ) -> HedgingStrategy:
        """Design volatility hedge using VIX products"""
        # Allocate 1-3% to volatility hedge
        allocation_pct = 0.02 if volatility < 0.25 else 0.03
        cost_estimate = portfolio_value * allocation_pct

        protection_level = 0.85

        suitability = min(90, volatility * 300)  # Higher score in high vol environment

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.VOLATILITY_HEDGE,
            name="Volatility Hedge",
            description="Use VIX calls or volatility ETFs to profit from market stress",
            implementation="Allocate 2-3% to VIX calls or volatility-linked instruments",
            cost_estimate=round(cost_estimate, 2),
            cost_pct=allocation_pct,
            protection_level=protection_level,
            max_downside=cost_estimate,  # Can only lose allocation
            breakeven_point=portfolio_value * 0.98,
            time_horizon="3-6 months",
            pros=[
                "Spikes during market crashes",
                "Negative correlation to equities",
                "Can generate significant returns",
                "Dynamic risk management"
            ],
            cons=[
                "Complex instruments",
                "High contango costs",
                "Loses value in calm markets",
                "Requires active management"
            ],
            suitability_score=round(suitability, 1)
        )

    def _design_inverse_etf_hedge(
        self, portfolio_value: float, equity_pct: float
    ) -> HedgingStrategy:
        """Design inverse ETF hedge"""
        # Hedge 25-50% of equity exposure
        hedge_pct = equity_pct * 0.30  # 30% of equity
        cost_estimate = portfolio_value * hedge_pct

        protection_level = 0.85

        suitability = 65  # Moderate suitability due to costs

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.INVERSE_ETF,
            name="Inverse ETF Hedge",
            description="Use inverse ETFs to hedge equity exposure",
            implementation=f"Allocate {hedge_pct:.1%} to inverse S&P 500 ETF (SH, PSQ, or similar)",
            cost_estimate=round(cost_estimate, 2),
            cost_pct=hedge_pct,
            protection_level=protection_level,
            max_downside=portfolio_value * equity_pct * 0.50,  # Hedges half of equity risk
            breakeven_point=portfolio_value,
            time_horizon="Tactical (1-3 months)",
            pros=[
                "Simple to implement",
                "Liquid and transparent",
                "No option complexity",
                "Can adjust size easily"
            ],
            cons=[
                "Daily rebalancing decay",
                "High expense ratios",
                "Tracking error",
                "Not suitable long-term"
            ],
            suitability_score=round(suitability, 1)
        )

    def _estimate_put_cost(self, volatility: float, time: float, otm_pct: float) -> float:
        """
        Estimate put option cost as % of notional

        Args:
            volatility: Annual volatility
            time: Time to expiry (years)
            otm_pct: How far out-of-the-money (e.g., 0.10 for 10% OTM)

        Returns:
            Estimated cost as decimal
        """
        # Simplified Black-Scholes approximation
        # For ATM: cost ~ 0.4 * vol * sqrt(time)
        # Adjust for OTM
        atm_cost = 0.4 * volatility * np.sqrt(time)
        otm_discount = 1 - (otm_pct * 2)  # Deeper OTM = cheaper
        return atm_cost * otm_discount

    def _estimate_call_premium(self, volatility: float, time: float, otm_pct: float) -> float:
        """Estimate call option premium received"""
        # Calls are worth less than puts (negative skew)
        put_cost = self._estimate_put_cost(volatility, time, otm_pct)
        return put_cost * 0.7  # Calls ~70% of put value

    def _estimate_equity_allocation(self, allocation: Dict[str, float]) -> float:
        """Estimate equity percentage"""
        equity_keywords = ['EQUITY', 'STOCK', 'BLEND', 'GROWTH', 'VALUE', 'CAP', 'EM_', 'INTL_DEV']
        return sum(
            weight for asset, weight in allocation.items()
            if any(kw in asset.upper() for kw in equity_keywords)
        )

    def _calculate_concentration(self, allocation: Dict[str, float]) -> float:
        """Calculate HHI concentration"""
        return sum(w ** 2 for w in allocation.values())

    def _calculate_suitability(
        self, cost_pct: float, protection: float, volatility: float, strategy_type: str
    ) -> float:
        """Calculate suitability score for strategy"""
        # Base score
        score = 70

        # Cost factor (lower cost = better)
        if cost_pct < 0.01:
            score += 15
        elif cost_pct < 0.02:
            score += 10
        elif cost_pct < 0.03:
            score += 5

        # Protection factor (more protection = better)
        score += protection * 20

        # Volatility factor
        if strategy_type in ["tail", "volatility"] and volatility > 0.20:
            score += 10  # Better in high vol

        # Type-specific adjustments
        if strategy_type == "collar":
            score -= 5  # Caps upside
        elif strategy_type == "diversification":
            score += 10  # No cost, always good

        return min(100, max(0, score))
