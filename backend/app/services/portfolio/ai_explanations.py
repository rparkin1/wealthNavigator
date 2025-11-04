"""
AI-Powered Portfolio Explanations Service
Provides plain language explanations, educational content, and conversational guidance

REQ-PORT-010: Generative AI portfolio guidance
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum

from app.services.portfolio.asset_class_library import ASSET_CLASS_LIBRARY, AssetClass


class ExplanationType(str, Enum):
    """Types of explanations"""
    ALLOCATION_RATIONALE = "allocation_rationale"
    INVESTMENT_CONCEPT = "investment_concept"
    GOAL_TRANSLATION = "goal_translation"
    DIVERSIFICATION = "diversification"
    RISK_RETURN = "risk_return"
    TAX_EFFICIENCY = "tax_efficiency"
    REBALANCING = "rebalancing"


class PortfolioExplanation(BaseModel):
    """AI-generated portfolio explanation"""
    question: str
    answer: str
    educational_notes: List[str]
    related_concepts: List[str]
    confidence: float = 0.9


class AIExplanationsService:
    """AI-powered portfolio guidance and explanations"""

    def explain_allocation(
        self,
        allocation: Dict[str, float],
        user_profile: Dict
    ) -> PortfolioExplanation:
        """
        Explain allocation in plain language tailored to user.

        REQ-PORT-010: Translating goals and risk tolerance into allocations

        Args:
            allocation: Portfolio allocation {asset_code: weight}
            user_profile: User profile with goals, risk tolerance, time horizon

        Returns:
            Plain language explanation
        """
        risk_tolerance = user_profile.get("risk_tolerance", 0.5)
        time_horizon = user_profile.get("time_horizon_years", 10)
        primary_goal = user_profile.get("primary_goal", "retirement")

        # Calculate portfolio characteristics
        equity_pct = self._calculate_equity_percentage(allocation)
        bond_pct = self._calculate_bond_percentage(allocation)
        alt_pct = 1.0 - equity_pct - bond_pct

        # Generate plain language explanation
        answer = self._generate_allocation_explanation(
            equity_pct, bond_pct, alt_pct,
            risk_tolerance, time_horizon, primary_goal
        )

        # Educational notes
        educational_notes = self._generate_educational_notes(
            equity_pct, bond_pct, time_horizon
        )

        # Related concepts
        related_concepts = [
            "Asset Allocation",
            "Diversification",
            "Risk and Return Trade-off",
            "Time Horizon",
            "Rebalancing"
        ]

        return PortfolioExplanation(
            question=f"Why is my portfolio allocated {equity_pct:.0%} stocks, {bond_pct:.0%} bonds, and {alt_pct:.0%} alternatives?",
            answer=answer,
            educational_notes=educational_notes,
            related_concepts=related_concepts,
            confidence=0.95
        )

    def explain_investment_concept(self, concept: str) -> PortfolioExplanation:
        """
        Explain investment concepts in plain language.

        REQ-PORT-010: Explaining investment concepts

        Args:
            concept: Concept name (e.g., "diversification", "risk_tolerance")

        Returns:
            Plain language explanation
        """
        concept_lower = concept.lower().replace(" ", "_")

        explanations = {
            "diversification": {
                "answer": "Diversification means not putting all your eggs in one basket. By spreading your "
                         "investments across different types of assets (stocks, bonds, real estate, etc.) and "
                         "different regions (US, international), you reduce the risk that one bad investment "
                         "will significantly harm your entire portfolio.\n\n"
                         "Think of it like this: if you only own tech stocks and the tech sector crashes, you "
                         "lose big. But if you own tech, healthcare, bonds, and real estate, a tech crash only "
                         "affects part of your portfolio. The math works in your favor: diversification can "
                         "maintain similar returns while significantly reducing risk.",
                "notes": [
                    "Target: 8-12 different asset classes for good diversification",
                    "International stocks don't always move with US stocks",
                    "Bonds often rise when stocks fall, providing balance",
                    "Even within stocks, diversify across sectors and company sizes"
                ],
                "concepts": ["Asset Allocation", "Correlation", "Risk Management", "Portfolio Construction"]
            },
            "risk_tolerance": {
                "answer": "Risk tolerance is your ability and willingness to handle portfolio losses without "
                         "panicking and selling. It's both financial (can you afford losses?) and emotional "
                         "(can you sleep at night when markets drop?).\n\n"
                         "Higher risk tolerance means you can handle a portfolio with 80-90% stocks, which will "
                         "swing wildly but typically provides better long-term returns. Lower risk tolerance "
                         "means you need more bonds (50-70% stocks), which are more stable but grow slower.\n\n"
                         "Your risk tolerance depends on: (1) Time horizon - longer means you can take more risk, "
                         "(2) Financial stability - do you have emergency savings?, (3) Age - younger typically "
                         "means more risk capacity, and (4) Goals - is this money critical or optional?",
                "notes": [
                    "Risk tolerance is not fixed - it changes with life circumstances",
                    "Don't overestimate your tolerance during bull markets",
                    "A 50% stock crash means $500K becomes $250K - can you handle that?",
                    "Conservative investors with long time horizons often under-take risk"
                ],
                "concepts": ["Asset Allocation", "Volatility", "Time Horizon", "Portfolio Construction"]
            },
            "rebalancing": {
                "answer": "Rebalancing means periodically selling winners and buying losers to restore your "
                         "target allocation. It sounds counterintuitive, but it's crucial.\n\n"
                         "Example: You start with 70% stocks, 30% bonds. After a great stock year, you're at "
                         "80% stocks, 20% bonds. Rebalancing means selling some stocks (high) and buying bonds "
                         "(lower) to get back to 70/30. This forces you to 'buy low, sell high' systematically.\n\n"
                         "Benefits: (1) Maintains your risk level, (2) Prevents over-concentration in hot assets, "
                         "(3) Provides discipline to sell high, (4) Can reduce long-term volatility. "
                         "Most investors should rebalance annually or when allocations drift >5%.",
                "notes": [
                    "Rebalance annually or when drift exceeds 5%",
                    "Use new contributions to rebalance first (avoids selling)",
                    "In taxable accounts, be mindful of capital gains taxes",
                    "Rebalancing can feel wrong but it's statistically proven to work"
                ],
                "concepts": ["Asset Allocation", "Risk Management", "Tax Efficiency", "Portfolio Maintenance"]
            },
            "expected_return": {
                "answer": "Expected return is what you can reasonably anticipate earning from an investment "
                         "over the long term (10+ years), based on historical data and economic fundamentals.\n\n"
                         "Rough guidelines: Stocks 7-10% annually, Bonds 3-5%, Cash 2-3%. But these are AVERAGES "
                         "over long periods. Any single year can be +30% or -30% for stocks.\n\n"
                         "Higher expected returns always come with higher risk (volatility). A portfolio with "
                         "8% expected return will swing more than one with 5% expected return. You can't have "
                         "high returns without high risk - that's the fundamental trade-off in investing.",
                "notes": [
                    "Past performance doesn't guarantee future results",
                    "Expected return is an average - actual returns vary widely year to year",
                    "Fees directly reduce your expected return (1% fee = 1% less return)",
                    "Inflation-adjusted ('real') returns are what matter for purchasing power"
                ],
                "concepts": ["Risk and Return", "Asset Allocation", "Volatility", "Historical Performance"]
            },
            "volatility": {
                "answer": "Volatility measures how much an investment bounces around. High volatility means "
                         "big swings up and down. Low volatility means steadier, more predictable changes.\n\n"
                         "Technically, it's the standard deviation of returns. A stock with 20% volatility "
                         "typically moves up or down 20% from its average in a given year. About 2/3 of years "
                         "fall within this range, but 1/3 of years go outside it (sometimes way outside).\n\n"
                         "Stocks: ~15-20% volatility. Bonds: ~5-8%. Cash: ~0%. The more stocks you hold, the "
                         "more your portfolio will fluctuate. That's the price of higher long-term returns.",
                "notes": [
                    "Volatility is not the same as risk, but they're related",
                    "Young investors should embrace volatility for higher returns",
                    "Near-term goals require lower volatility (more bonds)",
                    "Diversification reduces volatility without sacrificing returns as much"
                ],
                "concepts": ["Risk and Return", "Standard Deviation", "Asset Allocation", "Time Horizon"]
            },
            "asset_allocation": {
                "answer": "Asset allocation is how you divide your money among stocks, bonds, and other investments. "
                         "It's the single most important decision in investing - more important than picking "
                         "individual stocks or timing the market.\n\n"
                         "Research shows asset allocation explains about 90% of portfolio returns over time. "
                         "Whether you pick Apple or Microsoft matters far less than whether you're 60% stocks vs "
                         "80% stocks.\n\n"
                         "Classic approaches: (1) Age-based: '100 minus your age' in stocks (60 years old = 40% stocks), "
                         "(2) Goal-based: Match allocation to when you need the money, (3) Risk-based: Match to your "
                         "comfort with volatility. Modern approaches often recommend staying more aggressive longer.",
                "notes": [
                    "Asset allocation is more important than security selection",
                    "Rebalancing maintains your allocation as markets move",
                    "Different goals can have different allocations",
                    "Your allocation should evolve as you age and goals approach"
                ],
                "concepts": ["Diversification", "Risk Tolerance", "Time Horizon", "Portfolio Construction"]
            },
            "time_horizon": {
                "answer": "Time horizon is how long until you need the money. It's critical because it determines "
                         "how much risk you can take.\n\n"
                         "Long horizon (10+ years): You can handle high volatility because you have time to recover "
                         "from market crashes. Go aggressive: 80-100% stocks. Short horizon (0-3 years): You can't "
                         "afford a 30% loss right before you need the money. Go conservative: 20-40% stocks.\n\n"
                         "The key insight: Stocks are risky short-term but relatively safe long-term. Over 1 year, "
                         "stocks can drop 40%. Over 20 years, they've never had negative returns historically. "
                         "Time turns volatility from your enemy into your friend.",
                "notes": [
                    "Short-term = 0-3 years, Medium = 4-10 years, Long-term = 10+ years",
                    "Each goal can have a different time horizon",
                    "Time horizon should decrease as you approach the goal (de-risk)",
                    "Retirement isn't one time horizon - it's 30+ years of spending"
                ],
                "concepts": ["Asset Allocation", "Risk Tolerance", "Goal-Based Planning", "Glide Path"]
            },
            "tax_efficiency": {
                "answer": "Tax efficiency means minimizing taxes on your investments, which can significantly boost "
                         "your after-tax returns. It's especially important in taxable (non-retirement) accounts.\n\n"
                         "Strategies: (1) Asset location - put tax-inefficient assets (bonds, REITs) in IRAs, and "
                         "tax-efficient assets (stocks, index funds) in taxable accounts, (2) Tax-loss harvesting - "
                         "sell losers to offset gains, (3) Hold > 1 year for long-term capital gains rates, "
                         "(4) Use municipal bonds if you're in a high tax bracket.\n\n"
                         "The impact is huge: Over 30 years, a 1% annual tax drag can reduce your wealth by 25%. "
                         "Tax efficiency is a free return booster if done right.",
                "notes": [
                    "Tax-deferred accounts (IRA, 401k) let investments grow tax-free until withdrawal",
                    "Roth accounts let investments grow tax-free forever",
                    "Index funds are more tax-efficient than actively managed funds",
                    "Don't let taxes override good investment decisions"
                ],
                "concepts": ["Asset Location", "Tax-Loss Harvesting", "Roth vs Traditional", "Cost Basis"]
            }
        }

        explanation = explanations.get(concept_lower)

        if not explanation:
            # Generic fallback
            return PortfolioExplanation(
                question=f"What is {concept}?",
                answer=f"{concept} is an important investment concept. For a detailed explanation, "
                       f"please consult your financial advisor or educational resources.",
                educational_notes=["This concept requires personalized guidance"],
                related_concepts=["Portfolio Management", "Investment Strategy"],
                confidence=0.5
            )

        return PortfolioExplanation(
            question=f"What is {concept}?",
            answer=explanation["answer"],
            educational_notes=explanation["notes"],
            related_concepts=explanation["concepts"],
            confidence=0.95
        )

    def translate_goal_to_allocation(
        self,
        goal_description: str,
        goal_amount: float,
        years_to_goal: int,
        current_savings: float = 0
    ) -> PortfolioExplanation:
        """
        Translate user goal into recommended allocation with explanation.

        REQ-PORT-010: Translating user goals and risk tolerance into allocations

        Args:
            goal_description: Natural language goal description
            goal_amount: Target amount
            years_to_goal: Years until goal
            current_savings: Current amount saved

        Returns:
            Explanation of recommended allocation
        """
        # Calculate required return
        if current_savings > 0:
            # Calculate required annual return
            required_return = ((goal_amount / current_savings) ** (1 / years_to_goal)) - 1
        else:
            required_return = 0.08  # Default 8%

        # Recommend allocation based on time horizon and required return
        if years_to_goal >= 15:
            # Long-term: Can be aggressive
            equity_pct = min(0.90, 0.70 + (required_return - 0.06) * 5)
            risk_level = "Aggressive" if equity_pct > 0.75 else "Moderate"
        elif years_to_goal >= 7:
            # Medium-term: Balanced
            equity_pct = 0.60
            risk_level = "Balanced"
        elif years_to_goal >= 3:
            # Near-term: Conservative
            equity_pct = 0.40
            risk_level = "Conservative"
        else:
            # Very short-term: Very conservative
            equity_pct = 0.20
            risk_level = "Very Conservative"

        bond_pct = 1.0 - equity_pct

        # Generate explanation
        answer = f"""For your goal of {goal_description}, here's why we recommend a {risk_level} allocation
of {equity_pct:.0%} stocks and {bond_pct:.0%} bonds:

**Time Horizon**: You have {years_to_goal} years until your goal. This is a {'long' if years_to_goal >= 10 else 'medium' if years_to_goal >= 5 else 'short'}-term
time horizon, which {'allows you to handle stock market volatility' if years_to_goal >= 10 else 'requires some balance between growth and stability' if years_to_goal >= 5 else 'requires prioritizing stability over growth'}.

**Required Return**: To reach ${goal_amount:,.0f} from ${current_savings:,.0f}, you need approximately
{required_return:.1%} annual returns. {'This is achievable with a stock-heavy portfolio.' if required_return < 0.08 else 'This requires solid returns but is realistic with proper allocation.' if required_return < 0.12 else 'This is an ambitious target that will require higher risk.'}

**Risk Level**: {equity_pct:.0%} stocks means {'significant short-term volatility (your portfolio could drop 20-30% in a bad year) but strong long-term growth potential' if equity_pct > 0.70 else 'moderate volatility with decent growth potential' if equity_pct > 0.50 else 'lower volatility and more stability, but also lower expected returns'}.
Given your {years_to_goal}-year timeline, this risk level is appropriate.

**What This Means**: Expect your portfolio to {'fluctuate significantly year-to-year, but grow steadily over your full time horizon' if equity_pct > 0.70 else 'grow at a moderate pace with occasional downturns' if equity_pct > 0.50 else 'grow slowly but steadily with minimal dramatic swings'}.
"""

        educational_notes = [
            f"With {years_to_goal} years, you {'can recover from market downturns' if years_to_goal >= 10 else 'have limited time to recover from losses' if years_to_goal < 5 else 'have some time to recover from downturns'}",
            f"Expected return: {equity_pct * 0.09 + bond_pct * 0.04:.1%} per year (stocks ~9%, bonds ~4%)",
            f"Expected volatility: {equity_pct * 0.18 + bond_pct * 0.05:.1%} (how much portfolio typically swings)",
            f"As you get closer to {years_to_goal - 3} years away, we'll reduce stock allocation (de-risk)"
        ]

        return PortfolioExplanation(
            question=f"What allocation do I need for my {goal_description} goal?",
            answer=answer,
            educational_notes=educational_notes,
            related_concepts=["Goal-Based Planning", "Asset Allocation", "Time Horizon", "Glide Path"],
            confidence=0.90
        )

    def explain_portfolio_design(
        self,
        allocation: Dict[str, float],
        goals: List[Dict]
    ) -> PortfolioExplanation:
        """
        Explain how portfolio is designed to meet specific goals.

        REQ-PORT-010: Describing how portfolios are designed for goals

        Args:
            allocation: Current allocation
            goals: User's financial goals

        Returns:
            Explanation of portfolio design
        """
        # Analyze allocation
        equity_pct = self._calculate_equity_percentage(allocation)
        intl_pct = self._calculate_international_percentage(allocation)
        bond_pct = self._calculate_bond_percentage(allocation)
        alt_pct = 1.0 - equity_pct - bond_pct

        # Expected return calculation
        expected_return = 0.0
        expected_volatility = 0.0
        for asset_code, weight in allocation.items():
            asset = ASSET_CLASS_LIBRARY.get(asset_code)
            if asset:
                expected_return += weight * asset.expected_return
                expected_volatility += weight * asset.volatility

        # Build explanation
        answer = f"""Your portfolio is designed to balance growth and risk for your goals:

**Growth Strategy** ({equity_pct:.0%} stocks):
- Provides long-term growth potential to reach your goals
- Split {(1-intl_pct)*equity_pct:.0%} US / {intl_pct*equity_pct:.0%} international for geographic diversification
- Expected to return ~{expected_return:.1%} per year over the long term

**Stability Component** ({bond_pct:.0%} bonds):
- Reduces volatility and provides steady income
- Acts as a cushion during stock market downturns
- Allows you to stay invested when markets are turbulent

**Risk Management** ({expected_volatility:.1%} expected volatility):
- Your portfolio is designed to fluctuate about {expected_volatility:.0%} per year
- In a typical year, expect gains/losses of ±{expected_volatility:.0%}
- In extreme years (1 in 20), could be ±{expected_volatility*2:.0%}

**Goal Alignment**:"""

        for goal in goals[:3]:  # Top 3 goals
            goal_name = goal.get("name", "Goal")
            years_to_goal = goal.get("years_to_goal", 10)
            answer += f"\n- {goal_name} ({years_to_goal} years): "

            if years_to_goal > 10:
                answer += "Aggressive allocation appropriate for long timeline"
            elif years_to_goal > 5:
                answer += "Balanced allocation for medium-term target"
            else:
                answer += "Will need to de-risk as goal approaches"

        answer += f"""

**Why This Works**: This allocation is backed by Modern Portfolio Theory - the same approach used by
institutional investors. By diversifying across {len(allocation)} asset classes, we're reducing risk
without sacrificing returns. Historical data shows this type of portfolio has provided solid returns
over 10+ year periods."""

        educational_notes = [
            "Diversification across asset classes is more important than picking individual stocks",
            "Your allocation will be adjusted (rebalanced) when it drifts >5% from targets",
            "As goals approach, we'll automatically reduce risk (shift from stocks to bonds)",
            "This design has been tested across multiple market cycles and economic conditions"
        ]

        return PortfolioExplanation(
            question="How is my portfolio designed to help me reach my goals?",
            answer=answer,
            educational_notes=educational_notes,
            related_concepts=["Modern Portfolio Theory", "Goal-Based Planning", "Diversification", "Risk Management"],
            confidence=0.92
        )

    def answer_portfolio_question(
        self,
        question: str,
        portfolio_context: Dict
    ) -> PortfolioExplanation:
        """
        Answer user questions about their portfolio.

        REQ-PORT-012: Answering questions about portfolio

        Args:
            question: User's question
            portfolio_context: Portfolio data for context

        Returns:
            Answer to question
        """
        question_lower = question.lower()

        # Pattern matching for common questions
        # Check most specific patterns first
        if ("rebalance" in question_lower or
            ("adjust" in question_lower and ("allocation" in question_lower or "portfolio" in question_lower)) or
            ("change" in question_lower and ("allocation" in question_lower or "portfolio" in question_lower))):
            return self._explain_rebalancing(portfolio_context)
        elif any(word in question_lower for word in ["return", "gain", "grow", "growth", "performance", "expect"]):
            return self._explain_returns(portfolio_context)
        elif any(word in question_lower for word in ["underperform", "lose", "loss", "drop", "down"]):
            return self._explain_underperformance(portfolio_context)
        elif any(word in question_lower for word in ["risk", "volatile", "safe", "risky"]):
            return self._explain_risk(portfolio_context)
        elif any(word in question_lower for word in ["diversif", "spread"]):
            return self._explain_diversification(portfolio_context)
        else:
            # Generic response
            return PortfolioExplanation(
                question=question,
                answer="I'd be happy to help explain your portfolio. Could you be more specific about what "
                       "you'd like to know? Common topics include: performance, risk level, diversification, "
                       "rebalancing, or how your portfolio is designed for your goals.",
                educational_notes=["Ask specific questions for detailed answers"],
                related_concepts=["Portfolio Management"],
                confidence=0.6
            )

    # Helper methods

    def _calculate_equity_percentage(self, allocation: Dict[str, float]) -> float:
        """Calculate total equity percentage"""
        equity_assets = ["US_LC_BLEND", "US_LC_GROWTH", "US_LC_VALUE", "US_MC_BLEND",
                        "US_SC_BLEND", "INTL_DEV_BLEND", "EM_BLEND", "US_ESG", "INTL_ESG"]
        return sum(allocation.get(asset, 0) for asset in equity_assets)

    def _calculate_bond_percentage(self, allocation: Dict[str, float]) -> float:
        """Calculate total bond percentage"""
        bond_assets = ["US_TREASURY_SHORT", "US_TREASURY_INTER", "US_TREASURY_LONG",
                      "US_CORP_IG", "US_CORP_HY", "US_MUN", "INTL_BOND", "GREEN_BOND"]
        return sum(allocation.get(asset, 0) for asset in bond_assets)

    def _calculate_international_percentage(self, allocation: Dict[str, float]) -> float:
        """Calculate international equity percentage"""
        intl_assets = ["INTL_DEV_BLEND", "EM_BLEND", "INTL_ESG"]
        total_intl = sum(allocation.get(asset, 0) for asset in intl_assets)
        total_equity = self._calculate_equity_percentage(allocation)
        return total_intl / total_equity if total_equity > 0 else 0

    def _generate_allocation_explanation(
        self,
        equity_pct: float,
        bond_pct: float,
        alt_pct: float,
        risk_tolerance: float,
        time_horizon: int,
        primary_goal: str
    ) -> str:
        """Generate plain language allocation explanation"""

        risk_label = "conservative" if risk_tolerance < 0.35 else "moderate" if risk_tolerance < 0.65 else "aggressive"

        explanation = f"""Your portfolio is allocated **{equity_pct:.0%} stocks**, **{bond_pct:.0%} bonds**, and **{alt_pct:.0%} alternatives**. Here's why this makes sense for you:

**Based on Your Risk Tolerance** ({risk_label.title()}):
You indicated a {risk_label} risk tolerance, which means you {'can handle some portfolio volatility in exchange for growth' if risk_tolerance >= 0.5 else 'prefer stability over maximum growth'}.
This allocation matches your comfort level - it {'will fluctuate but provide strong long-term returns' if equity_pct > 0.60 else 'prioritizes stability with modest growth potential'}.

**Based on Your Time Horizon** ({time_horizon} years):
With {time_horizon} years until you need this money, you {'have plenty of time to ride out market downturns' if time_horizon >= 10 else 'need to balance growth with protecting your savings' if time_horizon >= 5 else 'should prioritize capital preservation'}.
{'Stocks are appropriate for long-term goals because short-term volatility smooths out over time.' if time_horizon >= 10 else 'A balanced approach makes sense for your timeline.' if time_horizon >= 5 else 'With a shorter timeline, we emphasize stability.'}

**For Your {primary_goal.title()} Goal**:
The **{equity_pct:.0%} stock** allocation provides growth potential needed for {primary_goal}, while **{bond_pct:.0%} bonds** provide stability and reduce overall risk.
"""

        if alt_pct > 0:
            explanation += f"The **{alt_pct:.0%} alternatives** (REITs, commodities, etc.) further diversify your portfolio and reduce correlation to traditional stocks/bonds.\n"

        explanation += f"""
**What This Means Practically**:
- In good years, expect returns of {equity_pct * 0.12 + bond_pct * 0.05:.0%}-{equity_pct * 0.20 + bond_pct * 0.07:.0%}
- In bad years, expect losses of {equity_pct * -0.10 + bond_pct * -0.02:.0%}-{equity_pct * -0.20 + bond_pct * -0.03:.0%}
- Over 10+ years, expect average returns of {equity_pct * 0.09 + bond_pct * 0.04:.1%} annually

This allocation is designed to grow your wealth while managing risk appropriately for your situation."""

        return explanation

    def _generate_educational_notes(
        self,
        equity_pct: float,
        bond_pct: float,
        time_horizon: int
    ) -> List[str]:
        """Generate educational notes"""
        notes = []

        if equity_pct > 0.70:
            notes.append("High stock allocation: More volatility but better long-term growth potential")
        elif equity_pct < 0.40:
            notes.append("Conservative stock allocation: Lower volatility but more limited growth")

        if time_horizon >= 15:
            notes.append("Long time horizon allows aggressive allocation - you can weather market storms")
        elif time_horizon < 5:
            notes.append("Short time horizon requires conservative allocation - can't afford big losses")

        notes.extend([
            "Diversification reduces risk without proportionally reducing returns",
            "Your allocation will be rebalanced periodically to maintain targets",
            "As you approach your goal, the allocation will become more conservative"
        ])

        return notes

    def _explain_underperformance(self, context: Dict) -> PortfolioExplanation:
        """Explain portfolio underperformance"""
        return PortfolioExplanation(
            question="Why is my portfolio underperforming?",
            answer="Portfolio performance can vary for several reasons:\n\n"
                   "1. **Market Conditions**: Different asset classes perform differently in various market "
                   "environments. If your portfolio is heavy in US stocks but international or bonds are "
                   "outperforming, you'll lag.\n\n"
                   "2. **Time Period**: Short-term performance can be noisy. What matters is long-term "
                   "performance over 5-10+ years, not quarterly results.\n\n"
                   "3. **Diversification Trade-off**: Well-diversified portfolios often underperform the "
                   "best-performing asset in any given year, but that's by design - you're protected when "
                   "that asset crashes.\n\n"
                   "4. **Fees**: High expense ratios can drag returns. Aim for <0.50% average expenses.\n\n"
                   "5. **Rebalancing**: Selling winners to buy losers can temporarily hurt returns but "
                   "improves long-term risk-adjusted performance.",
            educational_notes=[
                "Compare to an appropriate benchmark, not just the S&P 500",
                "Focus on risk-adjusted returns (Sharpe ratio), not just total return",
                "Underperformance of 1-2% is normal for diversified portfolios in bull markets",
                "Stay disciplined - chasing performance usually backfires"
            ],
            related_concepts=["Benchmark Comparison", "Diversification", "Fees", "Rebalancing"],
            confidence=0.88
        )

    def _explain_rebalancing(self, context: Dict) -> PortfolioExplanation:
        """Explain rebalancing"""
        return PortfolioExplanation(
            question="Why do I need to rebalance?",
            answer="Rebalancing restores your portfolio to its target allocation after market movements "
                   "cause it to drift. Here's why it matters:\n\n"
                   "**Risk Control**: If stocks have a great run, you might drift from 70% stocks to 80% stocks. "
                   "This increases your risk beyond your comfort level. Rebalancing sells some winners to restore "
                   "your intended risk level.\n\n"
                   "**Systematic Discipline**: Rebalancing forces you to 'buy low, sell high' automatically. "
                   "When stocks are expensive (high allocation), you sell. When they're cheap (low allocation), "
                   "you buy. This removes emotion from the equation.\n\n"
                   "**Long-term Performance**: Studies show rebalanced portfolios have similar returns to "
                   "non-rebalanced portfolios but with significantly lower volatility. You get similar gains "
                   "with less stress and risk.\n\n"
                   "**When to Rebalance**: Most experts recommend rebalancing annually or when any asset class "
                   "drifts more than 5% from its target.",
            educational_notes=[
                "Rebalance in tax-advantaged accounts first to avoid capital gains taxes",
                "Use new contributions to rebalance when possible (no selling needed)",
                "Don't rebalance too frequently - annual is usually sufficient",
                "Rebalancing ensures your portfolio matches your risk tolerance"
            ],
            related_concepts=["Asset Allocation", "Risk Management", "Tax Efficiency", "Portfolio Maintenance"],
            confidence=0.92
        )

    def _explain_risk(self, context: Dict) -> PortfolioExplanation:
        """Explain portfolio risk"""
        return PortfolioExplanation(
            question="What is my portfolio's risk level?",
            answer="Risk in investing refers to uncertainty and volatility - how much your portfolio value "
                   "might swing up or down.\n\n"
                   "**Your Portfolio's Risk**:\n"
                   "- **Volatility**: Your portfolio will typically fluctuate by about X% annually\n"
                   "- **Worst-case scenario**: In a major market crash, you could lose 20-30% (stocks) or "
                   "5-10% (bonds) of your portfolio value\n"
                   "- **Time horizon impact**: Over 1 year, results are unpredictable. Over 10+ years, "
                   "returns become much more predictable\n\n"
                   "**What This Means**: You should expect to see your portfolio value drop in some years. "
                   "That's normal and expected. The key is not to panic and sell during those drops - "
                   "historically, markets have always recovered given enough time.\n\n"
                   "**Risk vs. Return**: Higher risk (more stocks) provides higher long-term returns. Lower "
                   "risk (more bonds) provides more stability. Your allocation balances these trade-offs "
                   "based on your goals and timeline.",
            educational_notes=[
                "Risk is the price you pay for higher expected returns",
                "Diversification reduces risk without proportionally reducing returns",
                "Short-term risk is high, but long-term risk decreases with time",
                "Your risk tolerance should match both your financial and emotional capacity"
            ],
            related_concepts=["Volatility", "Risk Tolerance", "Asset Allocation", "Time Horizon"],
            confidence=0.90
        )

    def _explain_returns(self, context: Dict) -> PortfolioExplanation:
        """Explain portfolio returns"""
        return PortfolioExplanation(
            question="What returns can I expect?",
            answer="Your expected returns depend on your asset allocation and time horizon.\n\n"
                   "**Historical Averages (1926-2024)**:\n"
                   "- Stocks: ~10% annually (but with high volatility)\n"
                   "- Bonds: ~5% annually (with lower volatility)\n"
                   "- Cash: ~3% annually (very stable)\n"
                   "- Inflation: ~3% annually (reduces purchasing power)\n\n"
                   "**Your Portfolio's Expected Return**: Based on your allocation, expect approximately "
                   "X-Y% annually over the long term (10+ years).\n\n"
                   "**Important Caveats**:\n"
                   "1. These are AVERAGES over long periods. Any given year can be wildly different.\n"
                   "2. Past performance doesn't guarantee future results. Current valuations matter.\n"
                   "3. Fees reduce returns directly (1% fee = 1% lower return every year).\n"
                   "4. After-tax returns matter more than pre-tax returns.\n"
                   "5. Inflation-adjusted ('real') returns are what matter for purchasing power.\n\n"
                   "**Reality Check**: Expect some years with 20%+ gains and some years with 20%+ losses. "
                   "The long-term average is what matters for reaching your goals.",
            educational_notes=[
                "Focus on long-term averages, not short-term results",
                "Compound returns are powerful but require patience",
                "Small differences in fees compound to big differences over time",
                "Rebalancing can improve risk-adjusted returns"
            ],
            related_concepts=["Expected Return", "Historical Performance", "Risk and Return", "Compound Interest"],
            confidence=0.88
        )

    def _explain_diversification(self, context: Dict) -> PortfolioExplanation:
        """Explain portfolio diversification"""
        return PortfolioExplanation(
            question="How diversified is my portfolio?",
            answer="Diversification measures how spread out your investments are across different asset types.\n\n"
                   "**Your Portfolio's Diversification**:\n"
                   "- Number of asset classes: X\n"
                   "- Geographic spread: Y% US, Z% International\n"
                   "- Asset type mix: A% stocks, B% bonds, C% alternatives\n\n"
                   "**Why Diversification Matters**:\n"
                   "Different investments don't move in lockstep. When US stocks fall, international stocks "
                   "or bonds might rise (or fall less). This reduces overall portfolio volatility without "
                   "sacrificing too much return potential.\n\n"
                   "**The Magic of Diversification**: It's the closest thing to a 'free lunch' in investing. "
                   "By combining imperfectly correlated assets, you can maintain similar returns while "
                   "significantly reducing risk.\n\n"
                   "**Optimal Diversification**: Research suggests 8-12 asset classes provide most diversification "
                   "benefits. Beyond that, you get diminishing returns. Your portfolio is {'well' if context.get('num_assets', 0) >= 8 else 'adequately' if context.get('num_assets', 0) >= 5 else 'minimally'} diversified.",
            educational_notes=[
                "Correlation matters: Assets that move independently provide better diversification",
                "International diversification is important - US isn't always the best performer",
                "Diversification across asset classes beats diversification within a single class",
                "Don't confuse diversification with over-diversification (too many similar funds)"
            ],
            related_concepts=["Asset Allocation", "Correlation", "Risk Management", "Modern Portfolio Theory"],
            confidence=0.90
        )
