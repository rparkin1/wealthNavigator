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
    COVERED_CALL = "covered_call"
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
    when_to_use: str  # When this strategy is appropriate
    implementation_steps: List[str]  # Step-by-step implementation
    impact_on_return: float  # Expected impact on annual return (negative = drag)
    impact_on_volatility: float  # Expected impact on volatility


class HedgingObjectives(BaseModel):
    """User-specified hedging objectives"""
    hedge_percentage: float = 0.50  # % of portfolio to hedge (default 50%)
    max_acceptable_drawdown: float = 0.20  # Maximum acceptable drawdown
    cost_tolerance_pct: float = 0.02  # Maximum cost as % of portfolio
    time_horizon_months: int = 12  # Time horizon for hedge
    specific_scenarios: List[str] = []  # Specific events to hedge against


class HedgingRecommendation(BaseModel):
    """Complete hedging recommendation"""
    portfolio_value: float
    current_risk_level: str
    recommended_strategies: List[HedgingStrategy]
    optimal_strategy: HedgingStrategy
    total_cost_range: tuple[float, float]  # Min, Max cost
    total_cost_estimate: float  # Total estimated cost
    expected_protection: float  # Expected portfolio protection
    implementation_priority: str  # Priority level (Critical, High, Medium, Low)
    market_conditions_note: Optional[str] = None  # Special market conditions note
    objectives_met: Dict[str, bool] = {}  # Which objectives are met


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
        market_conditions: Optional[Dict] = None,
        objectives: Optional[HedgingObjectives] = None
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

        # Use default objectives if not provided
        user_defined_objectives = objectives is not None

        if objectives is None:
            objectives = HedgingObjectives()

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

        # 2. Covered Call Strategy
        if equity_pct > 0.30 and volatility < 0.25:
            covered_call = self._design_covered_call(
                portfolio_value, equity_pct, volatility
            )
            strategies.append(covered_call)

        # 3. Collar Strategy
        if equity_pct > 0.50 and portfolio_value > 100000:
            collar = self._design_collar(portfolio_value, equity_pct, volatility)
            strategies.append(collar)

        # 4. Put Spread Strategy
        if equity_pct > 0.40 and volatility > 0.15:
            put_spread = self._design_put_spread(
                portfolio_value, equity_pct, volatility
            )
            strategies.append(put_spread)

        # 5. Tail Risk Hedge
        if max_drawdown > 0.25 or risk_level in ["aggressive", "very_aggressive"]:
            tail_risk = self._design_tail_risk_hedge(
                portfolio_value, equity_pct, volatility
            )
            strategies.append(tail_risk)

        # 6. Diversification
        if len(allocation) < 5 or self._calculate_concentration(allocation) > 0.4:
            diversification = self._design_diversification_hedge(
                portfolio_value, allocation
            )
            strategies.append(diversification)

        # 7. Volatility Hedge (VIX products)
        if volatility > 0.20 and portfolio_value > 250000:
            vol_hedge = self._design_volatility_hedge(portfolio_value, volatility)
            strategies.append(vol_hedge)

        # 8. Inverse ETF Strategy
        if beta > 1.2 and equity_pct > 0.60:
            inverse_etf = self._design_inverse_etf_hedge(portfolio_value, equity_pct)
            strategies.append(inverse_etf)

        # Filter strategies based on user objectives
        if user_defined_objectives:
            strategies = self._filter_by_objectives(strategies, objectives)

        # Sort by suitability score
        strategies.sort(key=lambda s: s.suitability_score, reverse=True)

        # Find optimal strategy (highest suitability with reasonable cost)
        optimal = strategies[0] if strategies else None

        # Calculate cost range and total estimate
        if strategies:
            costs = [s.cost_estimate for s in strategies]
            cost_range = (min(costs), max(costs))
            total_cost = optimal.cost_estimate if optimal else 0.0
            avg_protection = np.mean([s.protection_level for s in strategies])
        else:
            cost_range = (0.0, 0.0)
            total_cost = 0.0
            avg_protection = 0.0

        # Determine implementation priority
        priority = self._determine_priority(risk_level, max_drawdown, volatility)

        # Market conditions note
        market_note = self._generate_market_note(volatility, market_conditions)

        # Check which objectives are met
        objectives_met = {}
        if objectives and optimal:
            objectives_met = {
                "cost_tolerance": optimal.cost_pct <= objectives.cost_tolerance_pct,
                "protection_level": optimal.protection_level >= (1 - objectives.max_acceptable_drawdown),
                "hedge_percentage": True  # Assumed met
            }

        return HedgingRecommendation(
            portfolio_value=portfolio_value,
            current_risk_level=risk_level,
            recommended_strategies=strategies,
            optimal_strategy=optimal,
            total_cost_range=cost_range,
            total_cost_estimate=total_cost,
            expected_protection=round(avg_protection, 2),
            implementation_priority=priority,
            market_conditions_note=market_note,
            objectives_met=objectives_met
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
            suitability_score=round(suitability, 1),
            when_to_use="Best when you expect potential short-term market decline but want to maintain long-term positions. Ideal for high-value portfolios in volatile markets.",
            implementation_steps=[
                "Identify the equity portion of your portfolio to protect",
                "Select appropriate index ETF or options on individual holdings",
                "Choose strike price (typically 5-10% below current value)",
                "Purchase 3-month put options",
                "Set calendar reminder to roll options quarterly",
                "Monitor and adjust protection level as needed"
            ],
            impact_on_return=round(-cost_pct, 4),
            impact_on_volatility=-0.15  # Reduces volatility by ~15%
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
            suitability_score=round(suitability, 1),
            when_to_use="Ideal for long-term investors who want downside protection without paying premiums. Best in range-bound or moderately bullish markets.",
            implementation_steps=[
                "Calculate equity allocation to collar",
                "Buy ATM or slightly OTM puts for protection",
                "Simultaneously sell OTM calls (10-15% above current price)",
                "Ensure call strike allows acceptable upside",
                "Roll both legs quarterly",
                "Adjust strikes based on market conditions"
            ],
            impact_on_return=round(-net_cost_pct * 4, 4),  # Annualized
            impact_on_volatility=-0.25  # Significantly reduces volatility
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
            suitability_score=round(suitability, 1),
            when_to_use="Best for moderate risk scenarios where you want protection without high premium costs. Suitable when extreme crashes are unlikely.",
            implementation_steps=[
                "Determine acceptable loss level (e.g., 20%)",
                "Buy ATM or 5% OTM put options",
                "Sell deep OTM puts (20% below current) to offset cost",
                "Monitor spread profitability",
                "Roll spread quarterly",
                "Adjust strikes if portfolio value changes significantly"
            ],
            impact_on_return=round(-net_cost_pct * 4, 4),
            impact_on_volatility=-0.10  # Modest volatility reduction
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
        cost_pct = self._estimate_put_cost(volatility, 0.5, 0.30) * 0.3  # Very cheap
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
            suitability_score=round(suitability, 1),
            when_to_use="Best for portfolios in late bull markets or when systemic risks are elevated. Provides catastrophic insurance at low cost.",
            implementation_steps=[
                "Allocate 0.5-1% of portfolio value",
                "Buy deep OTM puts (30%+ below current price)",
                "Use 6-12 month expirations to reduce rolling frequency",
                "Consider VIX call options as alternative",
                "Accept that most will expire worthless",
                "Maintain discipline during bull markets"
            ],
            impact_on_return=round(-cost_pct * 2, 4),  # Annualized (6-month expiry)
            impact_on_volatility=-0.05  # Minimal impact on normal volatility
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
            suitability_score=round(suitability, 1),
            when_to_use="Always appropriate, especially for concentrated portfolios. Best long-term hedge against specific sector or market risks.",
            implementation_steps=[
                "Analyze current portfolio concentration (HHI)",
                "Identify uncorrelated asset classes",
                "Gradually rebalance over 3-6 months",
                "Add international equities (15-25%)",
                "Add bonds and alternatives (based on risk tolerance)",
                "Maintain target allocation through rebalancing"
            ],
            impact_on_return=0.0,  # Neutral to slightly positive long-term
            impact_on_volatility=-0.20  # Can reduce volatility significantly
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
            suitability_score=round(suitability, 1),
            when_to_use="Best for sophisticated investors in low-volatility environments expecting volatility increase. Requires active monitoring.",
            implementation_steps=[
                "Research VIX-linked products (VXX, UVXY, VIX calls)",
                "Allocate 2-3% of portfolio",
                "Use short-term VIX call options (1-3 months)",
                "Monitor VIX levels and term structure",
                "Exit positions when VIX spikes above 30",
                "Avoid long-term holds due to contango decay"
            ],
            impact_on_return=round(-allocation_pct, 4),  # Drag from contango
            impact_on_volatility=-0.08  # Modest reduction
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
            suitability_score=round(suitability, 1),
            when_to_use="Best for short-term tactical hedges (days to weeks). Use when you expect near-term market decline but want to avoid options complexity.",
            implementation_steps=[
                "Calculate equity exposure to hedge",
                "Select appropriate inverse ETF (1x, not leveraged)",
                "Buy 25-50% of equity exposure in inverse ETF",
                "Monitor daily - avoid holding >2 weeks",
                "Exit when market stabilizes or declines",
                "Do not use leveraged inverse ETFs (2x, 3x)"
            ],
            impact_on_return=round(-hedge_pct * 0.5, 4),  # Expense ratio drag
            impact_on_volatility=-0.12  # Reduces equity volatility
        )

    def _design_covered_call(
        self, portfolio_value: float, equity_pct: float, volatility: float
    ) -> HedgingStrategy:
        """Design covered call strategy (sell calls on owned positions)"""
        equity_value = portfolio_value * equity_pct

        # Call at 105-110% of current value
        call_strike = 1.07

        # Estimate call premium received (income generation)
        call_premium_pct = self._estimate_call_premium(volatility, 0.25, 0.07)  # 7% OTM
        premium_income = equity_value * call_premium_pct

        # Max upside is capped at call strike
        max_upside = equity_value * (call_strike - 1.0) + premium_income

        suitability = self._calculate_suitability(
            -call_premium_pct,  # Negative cost (it's income)
            0.70,  # Limited protection (only premium)
            volatility,
            "covered_call"
        )

        return HedgingStrategy(
            strategy_type=HedgingStrategyType.COVERED_CALL,
            name="Covered Call",
            description="Sell call options on owned positions to generate income and provide modest downside protection",
            implementation=f"Sell call options with strike at {call_strike:.0%} of current holdings, expiring in 3 months",
            cost_estimate=round(-premium_income, 2),  # Negative cost (income)
            cost_pct=round(-call_premium_pct, 4),
            protection_level=0.70,  # Premium provides modest protection
            max_downside=equity_value * 0.95,  # Limited downside protection (only premium)
            breakeven_point=round(portfolio_value * (1 - call_premium_pct), 2),
            time_horizon="3 months (roll quarterly)",
            pros=[
                "Generates income from premiums",
                "Enhances returns in flat/modest markets",
                "Lower breakeven on positions",
                "Can be repeated consistently"
            ],
            cons=[
                "Caps upside potential",
                "Stock may be called away",
                "Limited downside protection",
                "Underperforms in strong bull markets"
            ],
            suitability_score=round(suitability, 1),
            when_to_use="Best for long-term holdings in neutral to moderately bullish markets. Generates income when you believe upside is limited in the near term.",
            implementation_steps=[
                "Identify long-term equity positions you own",
                "Select strike price 5-10% above current price",
                "Sell 3-month call options (1 contract per 100 shares)",
                "Collect premium income immediately",
                "If stock price stays below strike, keep shares and premium",
                "If called away, consider rolling up and out or accepting gain"
            ],
            impact_on_return=round(call_premium_pct * 4, 4),  # Positive return from premiums
            impact_on_volatility=-0.05  # Slight volatility reduction
        )

    def _filter_by_objectives(
        self, strategies: list, objectives: HedgingObjectives
    ) -> list:
        """Filter strategies based on user objectives"""
        filtered = []

        for strategy in strategies:
            # Check cost tolerance
            if strategy.cost_pct > objectives.cost_tolerance_pct:
                continue

            # Check if strategy provides adequate protection
            min_protection = 1 - objectives.max_acceptable_drawdown
            if strategy.protection_level < min_protection - 0.10:  # 10% tolerance
                continue

            # Check time horizon compatibility
            if "months" in strategy.time_horizon.lower():
                months_str = strategy.time_horizon.lower().split()[0]
                if months_str.isdigit():
                    months = int(months_str)
                    if months > objectives.time_horizon_months + 3:  # 3 month tolerance
                        continue

            filtered.append(strategy)

        return filtered if filtered else strategies  # Return all if none match

    def _determine_priority(
        self, risk_level: str, max_drawdown: float, volatility: float
    ) -> str:
        """Determine implementation priority for hedging"""
        if risk_level in ["very_aggressive", "aggressive"] and max_drawdown > 0.30:
            return "Critical"
        elif volatility > 0.25 or max_drawdown > 0.25:
            return "High"
        elif risk_level in ["moderate", "conservative"]:
            return "Medium"
        else:
            return "Low"

    def _generate_market_note(
        self, volatility: float, market_conditions: dict = None
    ) -> str:
        """Generate market conditions note"""
        if market_conditions:
            vix = market_conditions.get("vix", 20)
            if vix > 30:
                return "High volatility environment - protective strategies are expensive but may be necessary"
            elif vix < 15:
                return "Low volatility environment - good time to implement cost-effective hedges"

        if volatility > 0.25:
            return "Elevated volatility detected - consider increasing hedge allocation"
        elif volatility < 0.12:
            return "Low volatility provides opportunity for inexpensive protection"

        return None

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
