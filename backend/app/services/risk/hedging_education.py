"""
Hedging Education Service
Provides educational content about hedging strategies

REQ-RISK-007: Hedging education content
"""

from typing import Dict, List
from pydantic import BaseModel


class HedgingEducationTopic(BaseModel):
    """Educational topic about hedging"""
    title: str
    content: str
    examples: List[str]
    key_points: List[str]
    common_mistakes: List[str]


class HedgingEducationContent(BaseModel):
    """Complete hedging education content"""
    topics: List[HedgingEducationTopic]
    quick_reference: Dict[str, str]
    glossary: Dict[str, str]


class HedgingEducationService:
    """Service for hedging education content"""

    def get_all_education_content(self) -> HedgingEducationContent:
        """Get comprehensive hedging education content"""
        topics = [
            self._when_to_hedge(),
            self._costs_and_tradeoffs(),
            self._hedging_vs_insurance(),
            self._long_term_impact(),
            self._alternatives_to_hedging()
        ]

        return HedgingEducationContent(
            topics=topics,
            quick_reference=self._get_quick_reference(),
            glossary=self._get_glossary()
        )

    def get_topic(self, topic_name: str) -> HedgingEducationTopic:
        """Get specific education topic"""
        topics = {
            "when_to_hedge": self._when_to_hedge(),
            "costs_and_tradeoffs": self._costs_and_tradeoffs(),
            "hedging_vs_insurance": self._hedging_vs_insurance(),
            "long_term_impact": self._long_term_impact(),
            "alternatives": self._alternatives_to_hedging()
        }

        if topic_name not in topics:
            raise ValueError(f"Unknown topic: {topic_name}")

        return topics[topic_name]

    def _when_to_hedge(self) -> HedgingEducationTopic:
        """When hedging is appropriate vs inappropriate"""
        return HedgingEducationTopic(
            title="When to Use Hedging Strategies",
            content="""
Hedging is appropriate when you want to reduce downside risk while maintaining market exposure.
It's most effective for short-to-medium term protection and works best when:

1. You have a large concentrated position you cannot or don't want to sell
2. You're approaching a major goal and want to lock in gains
3. Market volatility is elevated and you expect near-term turbulence
4. You have a specific time horizon for protection (e.g., retirement in 2 years)
5. You want to stay invested but reduce anxiety about market declines

Hedging is generally INAPPROPRIATE when:

1. You're investing for very long-term goals (20+ years) - time diversification is better
2. You plan to add to positions during market declines (dollar-cost averaging)
3. Your portfolio is already conservative (e.g., 60% bonds)
4. You're trying to time the market or profit from hedges
5. The cost of hedging exceeds the benefit of protection
            """,
            examples=[
                "APPROPRIATE: Tech executive with $2M in company stock nearing retirement wants to protect against 20%+ decline",
                "APPROPRIATE: Retiree with $1M portfolio wants to ensure no more than 15% loss in first 3 years of retirement",
                "INAPPROPRIATE: 25-year-old with $50K portfolio investing for retirement in 40 years",
                "INAPPROPRIATE: Investor trying to hedge during every market dip to 'beat the market'"
            ],
            key_points=[
                "Hedging is insurance, not a profit strategy",
                "Best for specific, time-bound risk reduction",
                "Most effective for large, concentrated positions",
                "Consider your time horizon before hedging",
                "Don't hedge if you're planning to buy more during declines"
            ],
            common_mistakes=[
                "Over-hedging a diversified long-term portfolio",
                "Hedging when you should simply rebalance",
                "Expecting hedges to generate profits",
                "Hedging with too short a time horizon (weekly/monthly)",
                "Forgetting to remove hedges when no longer needed"
            ]
        )

    def _costs_and_tradeoffs(self) -> HedgingEducationTopic:
        """Costs and trade-offs of hedging strategies"""
        return HedgingEducationTopic(
            title="Costs and Trade-offs of Hedging",
            content="""
All hedging strategies have costs, either explicit (premiums) or implicit (capped upside).
Understanding these costs is critical to effective hedging:

DIRECT COSTS:
- Put option premiums: Typically 2-4% of portfolio value per year for meaningful protection
- Bid-ask spreads: 0.05-0.15% per trade
- Rolling costs: Must replace expiring options, incurring new premiums
- Transaction fees: Brokerage commissions on options trades

IMPLICIT COSTS:
- Opportunity cost: Money spent on hedges isn't invested
- Time decay: Options lose value daily even if markets are stable
- Capped upside: Collars and covered calls limit gains
- Complexity: Time and effort to manage hedging strategies

TRADE-OFFS BY STRATEGY:
1. Protective Puts: High cost, unlimited upside, precise protection
2. Collars: Low/zero cost, capped upside, good protection
3. Covered Calls: Negative cost (income), capped upside, limited protection
4. Put Spreads: Medium cost, limited protection range
5. Tail Risk Hedges: Very low cost, only protects against crashes
            """,
            examples=[
                "Protective Put Example: Paying $10K/year (2% of $500K) to protect against losses below 10%",
                "Collar Example: Zero net cost but giving up gains above 15% in exchange for protection below 10%",
                "Covered Call Example: Earning $8K/year (1.6%) but missing out if stocks rally >12%",
                "Put Spread Example: Paying $5K/year but only protected for declines between 10-25%"
            ],
            key_points=[
                "Expect to pay 1-3% annually for meaningful hedging",
                "Zero-cost hedges trade upside for downside protection",
                "Hedges lose value in stable/rising markets (by design)",
                "Cost increases dramatically with volatility",
                "Consider cost vs. benefit for your specific situation"
            ],
            common_mistakes=[
                "Ignoring the annualized cost of quarterly rolling",
                "Not accounting for time decay in stable markets",
                "Choosing cheapest hedge without considering protection gaps",
                "Over-hedging and paying more than potential losses",
                "Forgetting tax implications of hedge gains/losses"
            ]
        )

    def _hedging_vs_insurance(self) -> HedgingEducationTopic:
        """Difference between hedging and insurance"""
        return HedgingEducationTopic(
            title="Hedging vs. Insurance: Key Differences",
            content="""
While hedging and insurance both provide protection, they work differently for portfolios:

HEDGING (Options, Inverse ETFs, etc.):
- Protects INVESTMENT VALUE from market declines
- Temporary protection (days to months)
- Cost varies with market volatility
- You can profit if hedge appreciates
- Primary goal: reduce portfolio volatility
- Examples: Put options, collars, inverse ETFs

INSURANCE (Life, Disability, Property):
- Protects INCOME and ASSETS from specific risks
- Long-term protection (years to lifetime)
- Fixed premiums (usually)
- Pure cost - no profit potential
- Primary goal: protect against catastrophic loss
- Examples: Life insurance, disability insurance

WHEN TO USE EACH:
- Use INSURANCE for: Income replacement, liability protection, property protection
- Use HEDGING for: Portfolio volatility reduction, short-term market protection

OVERLAP:
Some products blur the line:
- Variable annuities (insurance with market exposure)
- Structured notes (hedged investment products)
- Guaranteed minimum withdrawal benefits

THE KEY DIFFERENCE:
Insurance protects you from events that would harm you financially (death, disability, lawsuit).
Hedging protects your investments from market declines but doesn't cover non-market risks.
            """,
            examples=[
                "INSURANCE: $1M term life policy protects family if you die prematurely",
                "HEDGING: Put options protect $500K portfolio if market crashes 30%",
                "INSURANCE: Disability insurance replaces income if you can't work",
                "HEDGING: Collar strategy protects retirement portfolio 2 years before retirement",
                "OVERLAP: Variable annuity with guaranteed minimum income benefit"
            ],
            key_points=[
                "Insurance covers personal risks (death, disability, liability)",
                "Hedging covers market risks (stock declines, volatility)",
                "Insurance is long-term, hedging is typically short-term",
                "You NEED insurance; you MAY want hedging",
                "Insurance provides peace of mind; hedging reduces volatility"
            ],
            common_mistakes=[
                "Using expensive investment hedges instead of cheap term life insurance",
                "Thinking portfolio hedges protect against all financial risks",
                "Buying variable annuities thinking they're pure insurance",
                "Neglecting essential insurance while over-hedging investments",
                "Confusing guaranteed insurance benefits with market hedges"
            ]
        )

    def _long_term_impact(self) -> HedgingEducationTopic:
        """Long-term impact of hedging on returns"""
        return HedgingEducationTopic(
            title="Long-term Impact of Hedging on Portfolio Returns",
            content="""
Hedging has a measurable cost that compounds over time. Understanding the long-term impact
is crucial for deciding when and how much to hedge.

ANNUALIZED COST OF CONTINUOUS HEDGING:
- Protective puts: -2.0% to -3.5% per year
- Collars: -0.5% to -1.5% per year (capped upside cost)
- Covered calls: +1.0% to +2.0% per year (income, but capped upside)
- Put spreads: -1.0% to -2.0% per year
- Tail risk hedges: -0.5% to -1.0% per year

COMPOUNDING EFFECT OVER TIME:
A 2% annual hedging cost on a $500K portfolio:
- Year 1: -$10,000
- Year 5: -$52,000 (compounded)
- Year 10: -$109,000 (compounded)
- Year 20: -$243,000 (compounded)

However, if hedges prevent major losses:
- Avoiding a 40% crash early in retirement can be worth the cost
- Reducing volatility can prevent emotional selling at market bottoms
- Protection during critical periods (near retirement) may justify cost

STRATEGIC HEDGING (NOT CONTINUOUS):
Instead of always hedging, consider:
- Hedging only when approaching major goals
- Hedging during known high-risk periods
- Tactical hedging when valuations are extreme
- This reduces long-term drag while providing targeted protection
            """,
            examples=[
                "CONTINUOUS HEDGING: 30-year-old pays 2% annually for 35 years = 52% of portfolio lost to hedging costs",
                "STRATEGIC HEDGING: 60-year-old hedges for 5 years before retirement, pays 10% total for peace of mind",
                "COST AVOIDANCE: Hedge prevents 40% loss in 2008, saving $200K on $500K portfolio (hedge cost: $20K)",
                "OPPORTUNITY COST: Missed 25% bull market due to collar cap, costing $125K in gains"
            ],
            key_points=[
                "Continuous hedging can cost 1-3% annually",
                "Over 20+ years, hedging costs compound to significant amounts",
                "For long-term investors, time diversification is usually cheaper",
                "Strategic hedging near goals can be worth the cost",
                "Hedging is most valuable when you can't afford losses"
            ],
            common_mistakes=[
                "Continuously hedging a long-term portfolio",
                "Not calculating the cumulative cost over many years",
                "Hedging during bull markets and then removing hedges in bear markets",
                "Ignoring the opportunity cost of capped upside",
                "Comparing single-year costs without compounding effect"
            ]
        )

    def _alternatives_to_hedging(self) -> HedgingEducationTopic:
        """Alternatives to hedging strategies"""
        return HedgingEducationTopic(
            title="Alternatives to Hedging Strategies",
            content="""
Before paying for expensive hedges, consider these often-cheaper alternatives:

1. CASH RESERVES (Emergency Fund):
- Keep 3-6 months expenses in cash
- No cost beyond opportunity cost
- Prevents forced selling in downturns
- BEST ALTERNATIVE for most investors

2. DIVERSIFICATION:
- Spread across asset classes, sectors, geographies
- Free (minimal rebalancing costs)
- Reduces portfolio-specific risk
- Improves risk-adjusted returns

3. ASSET ALLOCATION:
- Reduce equity exposure, increase bonds
- Structural approach to risk reduction
- Lower returns but lower volatility
- More appropriate for shorter time horizons

4. DOLLAR-COST AVERAGING:
- Invest gradually over time
- Reduces timing risk
- Allows buying during declines
- Good for lump-sum investors

5. DYNAMIC WITHDRAWAL STRATEGIES:
- For retirees: reduce spending in down years
- Prevents selling at market bottoms
- Increases portfolio longevity
- More flexible than hedging

6. BUFFER ASSETS:
- 2-5 years expenses in stable assets
- Provides time to wait out downturns
- No ongoing costs
- Perfect for early retirement

WHEN ALTERNATIVES BEAT HEDGING:
- Long time horizons (15+ years): Use diversification + time
- Small portfolios (<$100K): Use cash reserves
- Regular contributions: Use dollar-cost averaging
- Retirement planning: Use buffer assets + dynamic withdrawals
            """,
            examples=[
                "CASH RESERVE: Keep $50K in HYSA earning 4%, provides buffer without hedging costs",
                "DIVERSIFICATION: 60/40 stocks/bonds reduces volatility by 25% vs 100% stocks, no ongoing cost",
                "ASSET ALLOCATION: Shift from 80/20 to 60/40 at age 55, structural risk reduction",
                "BUFFER ASSETS: Retiree keeps 3 years expenses in bonds, never sells stocks in downturn",
                "DYNAMIC WITHDRAWALS: Retiree reduces spending 20% in bad years, protects portfolio"
            ],
            key_points=[
                "Cash reserves are the best first line of defense",
                "Diversification is free and always beneficial",
                "Asset allocation should match your time horizon",
                "Alternatives often cost less than hedging",
                "Combine multiple approaches for layered protection"
            ],
            common_mistakes=[
                "Jumping straight to expensive hedges without building cash reserves",
                "Maintaining aggressive allocation while paying for hedges",
                "Ignoring free alternatives (diversification) for expensive ones (options)",
                "Not adjusting asset allocation as goals approach",
                "Over-complicating protection when simple solutions work"
            ]
        )

    def _get_quick_reference(self) -> Dict[str, str]:
        """Get quick reference guide"""
        return {
            "When to hedge": "Large portfolios, near-term goals, concentrated positions, elevated volatility",
            "When NOT to hedge": "Long time horizons (20+ years), small portfolios, already conservative",
            "Typical cost": "1-3% of portfolio value annually for continuous protection",
            "Best cheap alternative": "Cash reserves (3-6 months) + diversification",
            "Best hedge for retirees": "Collar strategy (low cost, good protection)",
            "Best hedge for long-term": "Tail risk hedge (catastrophic protection only)",
            "Risk-free protection": "Reduce equity allocation, increase bond allocation",
            "Rule of thumb": "If hedge costs >2% annually and time horizon >10 years, use alternatives"
        }

    def _get_glossary(self) -> Dict[str, str]:
        """Get hedging terminology glossary"""
        return {
            "Protective Put": "Insurance policy for stocks - gives you the right to sell at a set price",
            "Covered Call": "Selling someone the right to buy your stocks at higher price, collecting premium",
            "Collar": "Combination of protective put (bought) and covered call (sold) for low-cost protection",
            "Put Spread": "Buy one put, sell another cheaper put to reduce cost (limited protection)",
            "Strike Price": "The price at which option can be exercised",
            "Premium": "The cost you pay to buy an option",
            "Expiration": "When option contract ends and becomes worthless",
            "In-the-Money": "Option has intrinsic value (put strike > stock price)",
            "Out-of-the-Money": "Option has no intrinsic value (put strike < stock price)",
            "Time Decay": "Options lose value as expiration approaches",
            "Volatility": "How much prices fluctuate - higher volatility = higher option prices",
            "Hedge Ratio": "Percentage of portfolio being hedged",
            "Rolling": "Closing expiring option and opening new one to extend protection",
            "Tail Risk": "Extreme, unlikely events (market crashes >30%)",
            "VIX": "Volatility Index - measures market fear/uncertainty",
            "Contango": "When long-term prices are higher than near-term (costs in VIX products)",
            "Delta": "How much option price changes with $1 change in underlying stock",
            "Theta": "How much option loses in value per day from time decay"
        }
