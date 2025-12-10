"""
Tax Optimization Tool
Asset location, tax-loss harvesting, and withdrawal strategies
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from enum import Enum


class AccountType(str, Enum):
    """Account types for tax optimization"""
    TAXABLE = "taxable"
    TAX_DEFERRED = "tax_deferred"  # Traditional IRA, 401(k)
    TAX_EXEMPT = "tax_exempt"  # Roth IRA, Roth 401(k)


class AssetTaxProfile(BaseModel):
    """Tax characteristics of an asset class"""
    asset_class: str
    dividend_yield: float  # Annual dividend yield
    turnover_rate: float  # Portfolio turnover rate
    qualified_dividends_pct: float  # % of dividends that are qualified
    tax_efficiency_score: float  # 0-100, higher = more tax efficient


class AssetLocationRecommendation(BaseModel):
    """Recommendation for asset location"""
    asset_class: str
    recommended_account: AccountType
    reasoning: str
    tax_alpha_estimate: float  # Estimated annual tax savings


class TaxLossHarvestingOpportunity(BaseModel):
    """Tax-loss harvesting opportunity"""
    security: str
    current_loss: float
    tax_benefit: float  # Estimated tax savings
    replacement_security: str
    wash_sale_risk: bool


class WithdrawalStrategy(BaseModel):
    """Tax-efficient withdrawal strategy"""
    account_order: List[str]  # Order to withdraw from accounts
    estimated_tax_rate: float
    estimated_annual_tax: float
    strategy_notes: str


async def optimize_asset_location(
    total_portfolio_value: float,
    target_allocation: Dict[str, float],
    account_balances: Dict[AccountType, float],
    tax_rate: float = 0.24
) -> List[AssetLocationRecommendation]:
    """
    Optimize asset location across account types to minimize taxes.

    Places tax-inefficient assets in tax-advantaged accounts and
    tax-efficient assets in taxable accounts.

    Args:
        total_portfolio_value: Total portfolio value across all accounts
        target_allocation: Desired allocation {asset_class: weight}
        account_balances: Balance in each account type
        tax_rate: Marginal tax rate

    Returns:
        List of asset location recommendations
    """
    # Define tax efficiency of common asset classes
    asset_profiles = {
        "stocks": AssetTaxProfile(
            asset_class="stocks",
            dividend_yield=0.02,
            turnover_rate=0.10,
            qualified_dividends_pct=0.90,
            tax_efficiency_score=75
        ),
        "bonds": AssetTaxProfile(
            asset_class="bonds",
            dividend_yield=0.04,
            turnover_rate=0.05,
            qualified_dividends_pct=0.0,  # Interest not qualified
            tax_efficiency_score=30
        ),
        "REITs": AssetTaxProfile(
            asset_class="REITs",
            dividend_yield=0.05,
            turnover_rate=0.15,
            qualified_dividends_pct=0.20,
            tax_efficiency_score=20
        ),
        "international": AssetTaxProfile(
            asset_class="international",
            dividend_yield=0.03,
            turnover_rate=0.12,
            qualified_dividends_pct=0.70,
            tax_efficiency_score=60
        ),
    }

    recommendations = []

    # Sort assets by tax inefficiency (least efficient first = highest priority for tax-advantaged accounts)
    sorted_assets = sorted(
        target_allocation.items(),
        key=lambda x: asset_profiles.get(x[0], asset_profiles["stocks"]).tax_efficiency_score
    )

    for asset_class, weight in sorted_assets:
        profile = asset_profiles.get(asset_class, asset_profiles["stocks"])

        # Tax-inefficient assets → tax-deferred/exempt accounts
        if profile.tax_efficiency_score < 50:
            if account_balances.get(AccountType.TAX_DEFERRED, 0) > 0:
                recommended_account = AccountType.TAX_DEFERRED
                reasoning = f"Low tax efficiency ({profile.tax_efficiency_score}/100). High dividend yield ({profile.dividend_yield:.1%}) taxed as ordinary income. Place in tax-deferred account."
            elif account_balances.get(AccountType.TAX_EXEMPT, 0) > 0:
                recommended_account = AccountType.TAX_EXEMPT
                reasoning = f"Low tax efficiency. Roth account eliminates all future taxes on dividends and growth."
            else:
                recommended_account = AccountType.TAXABLE
                reasoning = "No tax-advantaged space available."

        # Tax-efficient assets → taxable accounts
        else:
            recommended_account = AccountType.TAXABLE
            reasoning = f"High tax efficiency ({profile.tax_efficiency_score}/100). Low turnover and qualified dividends benefit from lower capital gains rates in taxable accounts."

        # Estimate tax alpha (annual tax savings from optimal location)
        annual_income = total_portfolio_value * weight * profile.dividend_yield
        if recommended_account != AccountType.TAXABLE:
            tax_alpha = annual_income * tax_rate * (1 - profile.qualified_dividends_pct * 0.6)  # Qualified divs taxed at ~60% of ordinary rate
        else:
            tax_alpha = 0.0

        recommendations.append(AssetLocationRecommendation(
            asset_class=asset_class,
            recommended_account=recommended_account,
            reasoning=reasoning,
            tax_alpha_estimate=round(tax_alpha, 2)
        ))

    return recommendations


async def calculate_tax_alpha(
    portfolio_value: float,
    allocation: Dict[str, float],
    optimized: bool = True
) -> float:
    """
    Calculate estimated annual tax alpha from optimization.

    Tax alpha is the additional after-tax return from tax-aware strategies.

    Args:
        portfolio_value: Total portfolio value
        allocation: Asset allocation
        optimized: Whether portfolio is tax-optimized

    Returns:
        Estimated annual tax alpha (additional return)
    """
    if not optimized:
        return 0.0

    # Estimate based on portfolio composition
    # Tax alpha typically ranges from 0.2% to 1.5% annually
    bonds_pct = allocation.get("bonds", 0)
    reits_pct = allocation.get("REITs", 0)

    # More bonds/REITs = higher tax alpha potential
    base_alpha = 0.002  # 0.2% base
    additional_alpha = (bonds_pct + reits_pct * 1.5) * 0.015

    total_alpha = base_alpha + additional_alpha
    annual_alpha = portfolio_value * total_alpha

    return round(annual_alpha, 2)


async def identify_tax_loss_harvesting(
    holdings: List[Dict],
    tax_rate: float = 0.24
) -> List[TaxLossHarvestingOpportunity]:
    """
    Identify tax-loss harvesting opportunities.

    Finds securities with unrealized losses that can be sold to
    offset capital gains, while avoiding wash sale violations.

    Args:
        holdings: List of holdings with cost basis and current value
        tax_rate: Capital gains tax rate

    Returns:
        List of harvesting opportunities
    """
    opportunities = []

    for holding in holdings:
        cost_basis = holding.get("cost_basis", 0)
        current_value = holding.get("current_value", 0)
        security = holding.get("security", "Unknown")

        unrealized_loss = cost_basis - current_value

        if unrealized_loss > 0:  # Has a loss
            tax_benefit = unrealized_loss * tax_rate

            # Suggest similar security for replacement (simplified)
            if "S&P 500" in security or "SPY" in security:
                replacement = "Vanguard Total Stock Market (VTI)"
                wash_sale_risk = False
            elif "Total Market" in security or "VTI" in security:
                replacement = "S&P 500 Index (SPY)"
                wash_sale_risk = False
            else:
                replacement = "Similar security in same asset class"
                wash_sale_risk = True

            opportunities.append(TaxLossHarvestingOpportunity(
                security=security,
                current_loss=round(unrealized_loss, 2),
                tax_benefit=round(tax_benefit, 2),
                replacement_security=replacement,
                wash_sale_risk=wash_sale_risk
            ))

    # Sort by tax benefit (highest first)
    opportunities.sort(key=lambda x: x.tax_benefit, reverse=True)

    return opportunities


async def calculate_withdrawal_strategy(
    account_balances: Dict[AccountType, float],
    annual_withdrawal_needed: float,
    age: int,
    tax_rate: float = 0.24
) -> WithdrawalStrategy:
    """
    Calculate tax-efficient withdrawal strategy.

    Determines optimal order to withdraw from accounts to
    minimize lifetime taxes.

    Args:
        account_balances: Balance in each account type
        annual_withdrawal_needed: Annual withdrawal amount
        age: Retiree's age
        tax_rate: Current marginal tax rate

    Returns:
        Withdrawal strategy with account order and tax estimate
    """
    # General strategy:
    # 1. Taxable accounts first (already taxed principal, lower cap gains rate)
    # 2. Tax-deferred accounts second (manage tax brackets)
    # 3. Tax-exempt accounts last (maximize tax-free growth)

    account_order = []
    strategy_notes = []

    # Check for required minimum distributions (RMDs)
    rmd_age = 73  # As of 2023
    if age >= rmd_age and account_balances.get(AccountType.TAX_DEFERRED, 0) > 0:
        account_order.append("Tax-Deferred (RMD required)")
        strategy_notes.append(f"Age {age}: RMDs required from tax-deferred accounts")

    # Taxable accounts first (if RMD not required)
    if account_balances.get(AccountType.TAXABLE, 0) > 0 and len(account_order) == 0:
        account_order.append("Taxable")
        strategy_notes.append("Withdraw from taxable first: lower capital gains tax rate")

    # Tax-deferred accounts
    if account_balances.get(AccountType.TAX_DEFERRED, 0) > 0:
        if "Tax-Deferred" not in account_order[0] if account_order else True:
            account_order.append("Tax-Deferred")
            strategy_notes.append("Tax-deferred next: manage income tax brackets")

    # Tax-exempt accounts last
    if account_balances.get(AccountType.TAX_EXEMPT, 0) > 0:
        account_order.append("Tax-Exempt (Roth)")
        strategy_notes.append("Roth last: maximize tax-free growth and estate benefits")

    # Estimate taxes
    # Simplified: assume mix of capital gains (taxable) and ordinary income (tax-deferred)
    cap_gains_rate = tax_rate * 0.6  # Rough approximation
    taxable_amount = min(annual_withdrawal_needed, account_balances.get(AccountType.TAXABLE, 0))
    tax_deferred_amount = annual_withdrawal_needed - taxable_amount

    estimated_tax = (taxable_amount * cap_gains_rate) + (tax_deferred_amount * tax_rate)

    return WithdrawalStrategy(
        account_order=account_order,
        estimated_tax_rate=round((estimated_tax / annual_withdrawal_needed) if annual_withdrawal_needed > 0 else 0, 3),
        estimated_annual_tax=round(estimated_tax, 2),
        strategy_notes=" | ".join(strategy_notes)
    )
