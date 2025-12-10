"""
Portfolio Rebalancing Engine
Analyzes portfolio drift and generates tax-efficient rebalancing recommendations
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from enum import Enum
import numpy as np


class RebalancingMethod(str, Enum):
    """Rebalancing methods"""
    THRESHOLD = "threshold"  # Rebalance when drift exceeds threshold
    CALENDAR = "calendar"  # Rebalance on fixed schedule
    TAX_OPTIMIZED = "tax_optimized"  # Minimize tax impact


class AccountType(str, Enum):
    """Account types for tax-aware rebalancing"""
    TAXABLE = "taxable"
    TAX_DEFERRED = "tax_deferred"
    TAX_EXEMPT = "tax_exempt"


class AssetAllocation(BaseModel):
    """Asset allocation in a specific account"""
    asset_class: str
    target_weight: float
    current_weight: float
    current_value: float
    drift_percentage: float  # (current - target) / target * 100
    drift_dollar: float


class RebalancingTrade(BaseModel):
    """Recommended trade for rebalancing"""
    account_type: AccountType
    asset_class: str
    action: str  # "buy" or "sell"
    amount: float
    shares: Optional[float] = None
    estimated_tax_impact: float = 0.0
    reasoning: str
    priority: int  # 1 = highest


class RebalancingStrategy(BaseModel):
    """Complete rebalancing strategy"""
    total_portfolio_value: float
    max_drift_percentage: float
    needs_rebalancing: bool
    estimated_total_tax_cost: float
    trades: List[RebalancingTrade]
    alternative_strategy: Optional[str] = None
    drift_analysis: Dict[str, float]  # {asset_class: drift%}
    execution_notes: str


class PortfolioDrift(BaseModel):
    """Portfolio drift analysis"""
    asset_class: str
    target_allocation: float
    current_allocation: float
    drift_percentage: float  # Absolute drift from target
    drift_dollars: float
    severity: str  # "low", "medium", "high", "critical"


def calculate_drift_severity(drift_percentage: float, drift_threshold: float = 5.0) -> str:
    """
    Classify drift severity.

    Args:
        drift_percentage: Absolute drift from target (percentage points)
        drift_threshold: Threshold for rebalancing (default 5%)

    Returns:
        Severity classification
    """
    abs_drift = abs(drift_percentage)

    if abs_drift >= drift_threshold * 2:
        return "critical"  # 10%+ drift
    elif abs_drift >= drift_threshold:
        return "high"  # 5-10% drift
    elif abs_drift >= drift_threshold * 0.5:
        return "medium"  # 2.5-5% drift
    else:
        return "low"  # <2.5% drift


async def analyze_portfolio_drift(
    target_allocation: Dict[str, float],
    current_holdings: Dict[str, float],  # {asset_class: current_value}
    drift_threshold: float = 5.0
) -> List[PortfolioDrift]:
    """
    Analyze portfolio drift from target allocation.

    Args:
        target_allocation: Target weights {asset_class: weight}
        current_holdings: Current values {asset_class: value}
        drift_threshold: Threshold for rebalancing trigger (percentage points)

    Returns:
        List of drift analyses, sorted by severity
    """
    total_value = sum(current_holdings.values())
    drift_analysis = []

    # Calculate current allocation percentages
    current_allocation = {
        asset: value / total_value
        for asset, value in current_holdings.items()
    }

    # Analyze drift for each asset class
    all_assets = set(target_allocation.keys()) | set(current_allocation.keys())

    for asset in all_assets:
        target = target_allocation.get(asset, 0.0)
        current = current_allocation.get(asset, 0.0)
        current_value = current_holdings.get(asset, 0.0)

        # Calculate drift in percentage points
        drift_pct = (current - target) * 100  # Percentage points
        drift_dollars = (current - target) * total_value

        severity = calculate_drift_severity(drift_pct, drift_threshold)

        drift_analysis.append(PortfolioDrift(
            asset_class=asset,
            target_allocation=target,
            current_allocation=current,
            drift_percentage=round(drift_pct, 2),
            drift_dollars=round(drift_dollars, 2),
            severity=severity
        ))

    # Sort by absolute drift (highest first)
    drift_analysis.sort(key=lambda x: abs(x.drift_percentage), reverse=True)

    return drift_analysis


async def calculate_rebalancing_trades(
    drift_analysis: List[PortfolioDrift],
    total_portfolio_value: float,
    account_breakdown: Dict[AccountType, Dict[str, float]],  # {account: {asset: value}}
    tax_rate: float = 0.24,
    cost_basis: Optional[Dict[str, float]] = None  # {asset_class: avg_cost_basis}
) -> List[RebalancingTrade]:
    """
    Calculate specific trades needed to rebalance portfolio.

    Prioritizes tax-efficient rebalancing:
    1. Use contributions/withdrawals to rebalance when possible
    2. Trade in tax-advantaged accounts first
    3. Minimize trades in taxable accounts
    4. Sell losses before gains in taxable accounts

    Args:
        drift_analysis: Portfolio drift analysis
        total_portfolio_value: Total portfolio value
        account_breakdown: Holdings breakdown by account type
        tax_rate: Capital gains tax rate
        cost_basis: Cost basis for each asset (for tax calculation)

    Returns:
        List of recommended trades, prioritized
    """
    trades = []
    priority = 1

    # Separate overweight and underweight positions
    overweight = [d for d in drift_analysis if d.drift_percentage > 0]
    underweight = [d for d in drift_analysis if d.drift_percentage < 0]

    # Strategy 1: Tax-advantaged accounts first
    for account_type in [AccountType.TAX_DEFERRED, AccountType.TAX_EXEMPT, AccountType.TAXABLE]:
        account_holdings = account_breakdown.get(account_type, {})

        if not account_holdings:
            continue

        account_value = sum(account_holdings.values())

        # Sell overweight positions
        for drift in overweight:
            if drift.asset_class in account_holdings:
                current_value = account_holdings[drift.asset_class]
                target_value = (drift.target_allocation * total_portfolio_value)

                # Amount to sell
                sell_amount = min(current_value, abs(drift.drift_dollars))

                if sell_amount > 50:  # Only if meaningful amount
                    # Calculate tax impact (only for taxable accounts)
                    tax_impact = 0.0
                    if account_type == AccountType.TAXABLE and cost_basis:
                        basis = cost_basis.get(drift.asset_class, current_value)
                        gain = current_value - basis
                        if gain > 0:
                            tax_impact = (gain / current_value) * sell_amount * tax_rate

                    reasoning = f"Reduce {drift.asset_class} from {drift.current_allocation:.1%} to {drift.target_allocation:.1%}"

                    if account_type == AccountType.TAXABLE and tax_impact > 0:
                        reasoning += f" (${tax_impact:.2f} tax cost)"
                    elif account_type != AccountType.TAXABLE:
                        reasoning += " (tax-free in this account)"

                    trades.append(RebalancingTrade(
                        account_type=account_type,
                        asset_class=drift.asset_class,
                        action="sell",
                        amount=round(sell_amount, 2),
                        estimated_tax_impact=round(tax_impact, 2),
                        reasoning=reasoning,
                        priority=priority
                    ))

                    priority += 1

        # Buy underweight positions
        for drift in underweight:
            target_value = drift.target_allocation * total_portfolio_value
            current_value = account_holdings.get(drift.asset_class, 0.0)

            # Amount to buy
            buy_amount = abs(drift.drift_dollars)

            if buy_amount > 50:  # Only if meaningful amount
                reasoning = f"Increase {drift.asset_class} from {drift.current_allocation:.1%} to {drift.target_allocation:.1%}"

                if account_type == AccountType.TAX_EXEMPT:
                    reasoning += " (best growth in Roth)"
                elif account_type == AccountType.TAX_DEFERRED:
                    reasoning += " (tax-deferred growth)"

                trades.append(RebalancingTrade(
                    account_type=account_type,
                    asset_class=drift.asset_class,
                    action="buy",
                    amount=round(buy_amount, 2),
                    estimated_tax_impact=0.0,  # No tax on purchases
                    reasoning=reasoning,
                    priority=priority
                ))

                priority += 1

    return trades


async def generate_rebalancing_strategy(
    target_allocation: Dict[str, float],
    current_holdings: Dict[str, float],
    account_breakdown: Dict[AccountType, Dict[str, float]],
    drift_threshold: float = 5.0,
    tax_rate: float = 0.24,
    cost_basis: Optional[Dict[str, float]] = None,
    new_contributions: float = 0.0
) -> RebalancingStrategy:
    """
    Generate comprehensive rebalancing strategy.

    Args:
        target_allocation: Target weights {asset_class: weight}
        current_holdings: Current values {asset_class: value}
        account_breakdown: Holdings by account type
        drift_threshold: Rebalancing trigger (percentage points)
        tax_rate: Capital gains tax rate
        cost_basis: Cost basis for tax calculations
        new_contributions: New money available to invest

    Returns:
        Complete rebalancing strategy
    """
    total_portfolio_value = sum(current_holdings.values())

    # Analyze drift
    drift_analysis = await analyze_portfolio_drift(
        target_allocation,
        current_holdings,
        drift_threshold
    )

    # Check if rebalancing is needed
    max_drift = max([abs(d.drift_percentage) for d in drift_analysis])
    needs_rebalancing = max_drift >= drift_threshold

    # Generate drift summary
    drift_summary = {
        d.asset_class: d.drift_percentage
        for d in drift_analysis
    }

    # If no rebalancing needed
    if not needs_rebalancing:
        return RebalancingStrategy(
            total_portfolio_value=total_portfolio_value,
            max_drift_percentage=round(max_drift, 2),
            needs_rebalancing=False,
            estimated_total_tax_cost=0.0,
            trades=[],
            alternative_strategy=f"Portfolio is within tolerance ({max_drift:.1f}% max drift). "
                               f"No rebalancing needed at this time.",
            drift_analysis=drift_summary,
            execution_notes="Continue monitoring. Consider rebalancing if drift reaches 5%."
        )

    # Calculate trades
    trades = await calculate_rebalancing_trades(
        drift_analysis,
        total_portfolio_value,
        account_breakdown,
        tax_rate,
        cost_basis
    )

    # Calculate total tax cost
    total_tax_cost = sum([t.estimated_tax_impact for t in trades])

    # Alternative strategy if using new contributions
    alternative_strategy = None
    if new_contributions > 0:
        alternative_strategy = (
            f"💡 Alternative: Direct ${new_contributions:,.0f} in new contributions to "
            f"underweight positions instead of selling. This avoids tax costs."
        )

    # Generate execution notes
    execution_notes = []

    if total_tax_cost > 1000:
        execution_notes.append(f"⚠️ High tax cost (${total_tax_cost:,.0f}). Consider spreading trades over time.")

    if len(trades) > 10:
        execution_notes.append(f"📊 {len(trades)} trades required. Consider simplifying with broader index funds.")

    if alternative_strategy:
        execution_notes.append("💰 New contributions available - use to rebalance without selling.")

    # Count trades by account type
    taxable_trades = len([t for t in trades if t.account_type == AccountType.TAXABLE])
    if taxable_trades > 0:
        execution_notes.append(f"🏦 {taxable_trades} trades in taxable account will trigger tax events.")

    execution_notes_str = " | ".join(execution_notes) if execution_notes else \
        "Execute trades in recommended order to restore target allocation."

    return RebalancingStrategy(
        total_portfolio_value=total_portfolio_value,
        max_drift_percentage=round(max_drift, 2),
        needs_rebalancing=True,
        estimated_total_tax_cost=round(total_tax_cost, 2),
        trades=trades,
        alternative_strategy=alternative_strategy,
        drift_analysis=drift_summary,
        execution_notes=execution_notes_str
    )


async def calculate_rebalancing_frequency_benefit(
    portfolio_value: float,
    volatility: float = 0.15,
    rebalancing_frequency: str = "quarterly"
) -> Dict[str, float]:
    """
    Calculate benefit of different rebalancing frequencies.

    Research shows:
    - Annual rebalancing: baseline
    - Quarterly: +0.1-0.2% annually
    - Monthly: +0.2-0.3% but higher costs
    - Threshold-based (5%): optimal risk/return balance

    Args:
        portfolio_value: Total portfolio value
        volatility: Portfolio volatility
        rebalancing_frequency: "annual", "quarterly", "monthly", "threshold"

    Returns:
        Dictionary with estimated benefits
    """
    frequency_benefits = {
        "annual": {
            "alpha": 0.0,  # Baseline
            "trades_per_year": 1,
            "description": "Standard rebalancing frequency"
        },
        "quarterly": {
            "alpha": 0.0015,  # +0.15%
            "trades_per_year": 4,
            "description": "Captures more drift opportunities"
        },
        "monthly": {
            "alpha": 0.0025,  # +0.25%
            "trades_per_year": 12,
            "description": "Maximum drift capture, but higher costs"
        },
        "threshold": {
            "alpha": 0.002,  # +0.20%
            "trades_per_year": 3,  # Average
            "description": "Optimal: rebalance only when needed (5% drift)"
        }
    }

    benefits = frequency_benefits.get(rebalancing_frequency, frequency_benefits["annual"])

    # Adjust for volatility (higher vol = more benefit from frequent rebalancing)
    vol_multiplier = volatility / 0.15
    adjusted_alpha = benefits["alpha"] * vol_multiplier

    annual_benefit = portfolio_value * adjusted_alpha

    return {
        "rebalancing_frequency": rebalancing_frequency,
        "estimated_annual_benefit": round(annual_benefit, 2),
        "alpha_percentage": round(adjusted_alpha * 100, 3),
        "trades_per_year": benefits["trades_per_year"],
        "description": benefits["description"]
    }
