"""
Advanced Tax-Loss Harvesting Engine
Sophisticated TLH with wash sale detection, replacement security matching, and optimization
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from datetime import datetime, timedelta
from enum import Enum
import numpy as np


class SecurityType(str, Enum):
    """Security types for classification"""
    INDEX_FUND = "index_fund"
    ETF = "etf"
    STOCK = "stock"
    BOND = "bond"
    REIT = "reit"


class Holding(BaseModel):
    """Individual security holding"""
    ticker: str
    name: str
    security_type: SecurityType
    cost_basis: float
    current_value: float
    shares: float
    purchase_date: str  # ISO format
    asset_class: str
    expense_ratio: Optional[float] = 0.0


class Transaction(BaseModel):
    """Transaction record for wash sale tracking"""
    ticker: str
    date: str
    transaction_type: str  # "buy" or "sell"
    shares: float
    price: float


class ReplacementSecurity(BaseModel):
    """Suggested replacement security"""
    ticker: str
    name: str
    similarity_score: float  # 0-100, how similar to original
    tracking_difference: float  # Expected annual tracking difference
    expense_ratio: float
    reasoning: str


class TaxLossHarvestingOpportunity(BaseModel):
    """Enhanced TLH opportunity with detailed analysis"""
    holding: Holding
    unrealized_loss: float
    loss_percentage: float
    tax_benefit: float
    replacement_securities: List[ReplacementSecurity]
    wash_sale_risk: bool
    wash_sale_window_end: Optional[str]  # Date when wash sale period ends
    priority_score: float  # 0-100, higher = more attractive
    estimated_tracking_error: float
    recommendation: str


class WashSaleViolation(BaseModel):
    """Detected wash sale violation"""
    original_sale: Transaction
    violating_purchase: Transaction
    days_apart: int
    disallowed_loss: float
    advice: str


class TaxLossHarvestingStrategy(BaseModel):
    """Overall TLH strategy recommendation"""
    total_harvestable_losses: float
    total_tax_benefit: float
    opportunities: List[TaxLossHarvestingOpportunity]
    wash_sale_violations: List[WashSaleViolation]
    optimal_execution_order: List[str]  # Ticker symbols in recommended order
    estimated_tracking_error: float
    strategy_notes: str


# Replacement security mapping (simplified - in production, use API for real-time data)
REPLACEMENT_MATRIX = {
    "SPY": [
        {"ticker": "VTI", "name": "Vanguard Total Stock Market", "similarity": 95, "tracking_diff": 0.002, "expense": 0.0003},
        {"ticker": "IVV", "name": "iShares Core S&P 500", "similarity": 99, "tracking_diff": 0.0001, "expense": 0.0003},
        {"ticker": "SCHX", "name": "Schwab US Large-Cap", "similarity": 93, "tracking_diff": 0.003, "expense": 0.0003},
    ],
    "VTI": [
        {"ticker": "SPY", "name": "SPDR S&P 500", "similarity": 95, "tracking_diff": 0.002, "expense": 0.0095},
        {"ticker": "ITOT", "name": "iShares Core Total US", "similarity": 99, "tracking_diff": 0.0001, "expense": 0.0003},
        {"ticker": "SCHB", "name": "Schwab US Broad Market", "similarity": 98, "tracking_diff": 0.0002, "expense": 0.0003},
    ],
    "QQQ": [
        {"ticker": "ONEQ", "name": "Fidelity Nasdaq Composite", "similarity": 92, "tracking_diff": 0.004, "expense": 0.0021},
        {"ticker": "QQEW", "name": "First Trust Nasdaq-100 Equal Weight", "similarity": 85, "tracking_diff": 0.015, "expense": 0.0058},
        {"ticker": "QQQM", "name": "Invesco Nasdaq 100", "similarity": 99, "tracking_diff": 0.0001, "expense": 0.0015},
    ],
    "AGG": [
        {"ticker": "BND", "name": "Vanguard Total Bond Market", "similarity": 96, "tracking_diff": 0.001, "expense": 0.0003},
        {"ticker": "IUSB", "name": "iShares Core Total US Bond", "similarity": 97, "tracking_diff": 0.001, "expense": 0.0006},
        {"ticker": "SCHZ", "name": "Schwab US Aggregate Bond", "similarity": 98, "tracking_diff": 0.0005, "expense": 0.0003},
    ],
    "VEA": [
        {"ticker": "IEFA", "name": "iShares Core MSCI EAFE", "similarity": 97, "tracking_diff": 0.002, "expense": 0.0007},
        {"ticker": "SCHF", "name": "Schwab International Equity", "similarity": 95, "tracking_diff": 0.003, "expense": 0.0006},
        {"ticker": "EFA", "name": "iShares MSCI EAFE", "similarity": 98, "tracking_diff": 0.001, "expense": 0.0032},
    ],
    "VWO": [
        {"ticker": "IEMG", "name": "iShares Core MSCI Emerging Markets", "similarity": 96, "tracking_diff": 0.003, "expense": 0.0011},
        {"ticker": "SCHE", "name": "Schwab Emerging Markets", "similarity": 94, "tracking_diff": 0.004, "expense": 0.0011},
        {"ticker": "EEM", "name": "iShares MSCI Emerging Markets", "similarity": 97, "tracking_diff": 0.002, "expense": 0.0068},
    ],
}


def check_wash_sale_window(
    sale_date: datetime,
    purchase_date: datetime,
    window_days: int = 30
) -> bool:
    """
    Check if purchase falls within wash sale window.

    Wash sale rule: Can't claim loss if you buy substantially identical
    security within 30 days before or after the sale.

    Args:
        sale_date: Date of loss sale
        purchase_date: Date of purchase
        window_days: Days in wash sale window (default 30)

    Returns:
        True if within wash sale window
    """
    days_diff = abs((sale_date - purchase_date).days)
    return days_diff <= window_days


async def detect_wash_sale_violations(
    transactions: List[Transaction],
    window_days: int = 30
) -> List[WashSaleViolation]:
    """
    Detect wash sale violations in transaction history.

    Args:
        transactions: List of all transactions
        window_days: Wash sale window (default 30 days)

    Returns:
        List of detected violations
    """
    violations = []

    # Group by ticker
    by_ticker: Dict[str, List[Transaction]] = {}
    for txn in transactions:
        if txn.ticker not in by_ticker:
            by_ticker[txn.ticker] = []
        by_ticker[txn.ticker].append(txn)

    # Check each ticker for violations
    for ticker, txns in by_ticker.items():
        # Sort by date
        txns_sorted = sorted(txns, key=lambda x: datetime.fromisoformat(x.date))

        # Find loss sales
        sales = [t for t in txns_sorted if t.transaction_type == "sell"]
        purchases = [t for t in txns_sorted if t.transaction_type == "buy"]

        for sale in sales:
            sale_date = datetime.fromisoformat(sale.date)

            # Check purchases within 30 days before or after
            for purchase in purchases:
                purchase_date = datetime.fromisoformat(purchase.date)

                if check_wash_sale_window(sale_date, purchase_date, window_days):
                    days_apart = abs((sale_date - purchase_date).days)

                    # Calculate disallowed loss (simplified)
                    # In reality, this is more complex based on shares
                    disallowed_loss = min(purchase.shares, sale.shares) * (sale.price - purchase.price)

                    if disallowed_loss > 0:  # Only if it's actually a loss
                        violations.append(WashSaleViolation(
                            original_sale=sale,
                            violating_purchase=purchase,
                            days_apart=days_apart,
                            disallowed_loss=disallowed_loss,
                            advice=f"Loss from {sale.date} disallowed due to purchase on {purchase.date}. "
                                   f"Wait {30 - days_apart} more days before repurchasing {ticker}."
                        ))

    return violations


async def find_replacement_securities(
    ticker: str,
    asset_class: str,
    security_type: SecurityType
) -> List[ReplacementSecurity]:
    """
    Find suitable replacement securities that won't trigger wash sale.

    Args:
        ticker: Original security ticker
        asset_class: Asset class (e.g., "US_LargeCap")
        security_type: Type of security

    Returns:
        List of replacement securities, sorted by suitability
    """
    replacements = []

    # Get replacements from matrix
    candidates = REPLACEMENT_MATRIX.get(ticker, [])

    for candidate in candidates:
        replacements.append(ReplacementSecurity(
            ticker=candidate["ticker"],
            name=candidate["name"],
            similarity_score=candidate["similarity"],
            tracking_difference=candidate["tracking_diff"],
            expense_ratio=candidate["expense"],
            reasoning=f"Highly correlated but not substantially identical. "
                     f"Expected tracking difference: {candidate['tracking_diff']:.2%} annually. "
                     f"Similarity: {candidate['similarity']}/100."
        ))

    # If no specific replacements, provide generic suggestions
    if not replacements:
        if "stock" in asset_class.lower() or security_type == SecurityType.INDEX_FUND:
            replacements.append(ReplacementSecurity(
                ticker="VTI",
                name="Vanguard Total Stock Market",
                similarity_score=85,
                tracking_difference=0.005,
                expense_ratio=0.0003,
                reasoning="Broad US market exposure as alternative to specific holdings."
            ))

    # Sort by similarity (higher is better)
    replacements.sort(key=lambda x: x.similarity_score, reverse=True)

    return replacements[:3]  # Return top 3


def calculate_priority_score(
    unrealized_loss: float,
    loss_percentage: float,
    tax_benefit: float,
    wash_sale_risk: bool,
    tracking_error: float
) -> float:
    """
    Calculate priority score for TLH opportunity.

    Higher score = more attractive opportunity

    Factors:
    - Tax benefit (higher is better)
    - Loss percentage (higher is better)
    - Wash sale risk (lower is better)
    - Tracking error (lower is better)

    Args:
        unrealized_loss: Absolute loss amount
        loss_percentage: Loss as percentage of cost basis
        tax_benefit: Estimated tax savings
        wash_sale_risk: Whether wash sale risk exists
        tracking_error: Expected tracking difference with replacement

    Returns:
        Priority score (0-100)
    """
    # Base score from tax benefit (0-40 points)
    tax_score = min(tax_benefit / 100, 40)  # $100 = 40 points

    # Loss percentage (0-30 points)
    loss_score = min(abs(loss_percentage) * 100, 30)  # 30% loss = 30 points

    # Wash sale penalty (-20 points)
    wash_sale_penalty = -20 if wash_sale_risk else 0

    # Tracking error penalty (0 to -10 points)
    tracking_penalty = -min(tracking_error * 1000, 10)  # 1% error = -10 points

    # Calculate total score
    score = tax_score + loss_score + wash_sale_penalty + tracking_penalty

    # Clamp to 0-100
    return max(0, min(100, score))


async def identify_tax_loss_harvesting_opportunities(
    holdings: List[Holding],
    recent_transactions: List[Transaction],
    tax_rate: float = 0.24,
    min_loss_threshold: float = 100.0
) -> TaxLossHarvestingStrategy:
    """
    Comprehensive tax-loss harvesting analysis.

    Args:
        holdings: Current portfolio holdings
        recent_transactions: Recent transaction history (90 days)
        tax_rate: Capital gains tax rate
        min_loss_threshold: Minimum loss to consider (default $100)

    Returns:
        Complete TLH strategy with opportunities and recommendations
    """
    opportunities = []
    total_harvestable_losses = 0.0
    total_tax_benefit = 0.0

    # Check for wash sale violations in recent history
    wash_sale_violations = await detect_wash_sale_violations(recent_transactions)

    # Get tickers with recent purchases (wash sale risk)
    recent_purchases = {
        txn.ticker: datetime.fromisoformat(txn.date)
        for txn in recent_transactions
        if txn.transaction_type == "buy"
    }

    # Analyze each holding for TLH opportunity
    for holding in holdings:
        unrealized_loss = holding.cost_basis - holding.current_value

        # Only consider losses above threshold
        if unrealized_loss >= min_loss_threshold:
            loss_percentage = (unrealized_loss / holding.cost_basis) * 100
            tax_benefit = unrealized_loss * tax_rate

            # Check wash sale risk
            wash_sale_risk = holding.ticker in recent_purchases
            wash_sale_window_end = None

            if wash_sale_risk:
                purchase_date = recent_purchases[holding.ticker]
                window_end = purchase_date + timedelta(days=30)
                wash_sale_window_end = window_end.isoformat()

            # Find replacement securities
            replacements = await find_replacement_securities(
                holding.ticker,
                holding.asset_class,
                holding.security_type
            )

            # Calculate estimated tracking error with best replacement
            estimated_tracking_error = (
                replacements[0].tracking_difference if replacements else 0.01
            )

            # Calculate priority score
            priority_score = calculate_priority_score(
                unrealized_loss,
                loss_percentage,
                tax_benefit,
                wash_sale_risk,
                estimated_tracking_error
            )

            # Generate recommendation
            if wash_sale_risk:
                recommendation = f"⚠️ WAIT: Wash sale risk until {wash_sale_window_end}. " \
                               f"Then harvest ${unrealized_loss:.2f} loss for ${tax_benefit:.2f} tax benefit."
            elif priority_score >= 70:
                recommendation = f"✅ EXECUTE NOW: High-priority opportunity. Harvest ${unrealized_loss:.2f} loss " \
                               f"(${tax_benefit:.2f} tax benefit). Replace with {replacements[0].ticker}."
            elif priority_score >= 40:
                recommendation = f"📋 CONSIDER: Moderate opportunity. {loss_percentage:.1f}% loss. " \
                               f"Replace with {replacements[0].ticker if replacements else 'similar security'}."
            else:
                recommendation = f"⏸️ HOLD: Low priority. Loss too small or high tracking error."

            opportunities.append(TaxLossHarvestingOpportunity(
                holding=holding,
                unrealized_loss=round(unrealized_loss, 2),
                loss_percentage=round(loss_percentage, 2),
                tax_benefit=round(tax_benefit, 2),
                replacement_securities=replacements,
                wash_sale_risk=wash_sale_risk,
                wash_sale_window_end=wash_sale_window_end,
                priority_score=round(priority_score, 2),
                estimated_tracking_error=estimated_tracking_error,
                recommendation=recommendation
            ))

            # Only count towards totals if no wash sale risk
            if not wash_sale_risk:
                total_harvestable_losses += unrealized_loss
                total_tax_benefit += tax_benefit

    # Sort opportunities by priority score
    opportunities.sort(key=lambda x: x.priority_score, reverse=True)

    # Create optimal execution order (high priority, no wash sale risk first)
    optimal_execution_order = [
        opp.holding.ticker
        for opp in opportunities
        if not opp.wash_sale_risk and opp.priority_score >= 40
    ]

    # Calculate weighted average tracking error
    if opportunities:
        avg_tracking_error = np.mean([opp.estimated_tracking_error for opp in opportunities])
    else:
        avg_tracking_error = 0.0

    # Generate strategy notes
    strategy_notes = []

    if total_tax_benefit > 1000:
        strategy_notes.append(f"💰 Significant opportunity: ${total_tax_benefit:.2f} in tax benefits available.")

    if wash_sale_violations:
        strategy_notes.append(f"⚠️ {len(wash_sale_violations)} wash sale violations detected in recent transactions.")

    if len(optimal_execution_order) > 0:
        strategy_notes.append(f"✅ {len(optimal_execution_order)} opportunities ready for immediate execution.")

    if avg_tracking_error < 0.005:
        strategy_notes.append(f"📊 Low tracking error: {avg_tracking_error:.2%} - excellent replacement securities available.")

    strategy_notes_str = " | ".join(strategy_notes) if strategy_notes else "No significant opportunities at this time."

    return TaxLossHarvestingStrategy(
        total_harvestable_losses=round(total_harvestable_losses, 2),
        total_tax_benefit=round(total_tax_benefit, 2),
        opportunities=opportunities,
        wash_sale_violations=wash_sale_violations,
        optimal_execution_order=optimal_execution_order,
        estimated_tracking_error=round(avg_tracking_error, 4),
        strategy_notes=strategy_notes_str
    )


async def calculate_annual_tlh_benefit(
    portfolio_value: float,
    volatility: float = 0.15,
    rebalancing_frequency: int = 12,
    tax_rate: float = 0.24
) -> float:
    """
    Estimate annual tax benefit from systematic TLH.

    Research suggests TLH can add 0.5-1.5% annually in after-tax returns.

    Args:
        portfolio_value: Total portfolio value
        volatility: Portfolio volatility
        rebalancing_frequency: How often to check for TLH (times per year)
        tax_rate: Tax rate on capital gains

    Returns:
        Estimated annual tax benefit
    """
    # Simplified model: Higher volatility = more TLH opportunities
    # More frequent checking = better capture of opportunities

    # Base TLH alpha (0.5% to 1.5% range)
    base_alpha = 0.005  # 0.5%

    # Volatility multiplier (higher vol = more opportunities)
    vol_multiplier = min(volatility / 0.15, 2.0)  # 15% vol = 1x, 30% = 2x

    # Frequency multiplier (monthly = 1x, weekly = 1.5x)
    freq_multiplier = min(rebalancing_frequency / 12, 1.5)

    # Tax rate multiplier
    tax_multiplier = tax_rate / 0.24  # 24% = 1x

    # Calculate total alpha
    total_alpha = base_alpha * vol_multiplier * freq_multiplier * tax_multiplier

    # Cap at 1.5%
    total_alpha = min(total_alpha, 0.015)

    annual_benefit = portfolio_value * total_alpha

    return round(annual_benefit, 2)
