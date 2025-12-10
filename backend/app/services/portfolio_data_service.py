"""
Portfolio Data Service
Fetches real portfolio data from database for use across API endpoints

This service provides common functions to fetch portfolio data, avoiding
the need to pass manual portfolio_value and allocation parameters.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, List, Optional, Tuple
from app.models.portfolio_db import Portfolio, Account, Holding, AccountType
from app.models.plaid import PlaidAccount, PlaidHolding
from app.models.user import User
from app.models.budget import BudgetEntry, BudgetType
import logging

logger = logging.getLogger(__name__)


async def get_portfolio_value_and_allocation(
    user_id: str,
    db: AsyncSession
) -> Tuple[float, Dict[str, float]]:
    """
    Get user's total portfolio value and asset allocation from Plaid data.

    This function now queries Plaid tables (plaid_accounts, plaid_holdings)
    instead of the old CSV upload tables (Portfolio, Account, Holding).

    Returns:
        Tuple of (total_value, allocation_dict)
        allocation_dict maps asset_class -> percentage (0-1 scale)

    Example:
        (500000, {"US_LC_BLEND": 0.45, "US_TREASURY_INTER": 0.30, "GOLD": 0.25})
    """
    # Query Plaid accounts for this user (investment accounts only)
    accounts_query = select(PlaidAccount).where(
        PlaidAccount.user_id == user_id,
        PlaidAccount.type == "investment",
        PlaidAccount.is_active == True
    )
    result = await db.execute(accounts_query)
    plaid_accounts = result.scalars().all()

    if not plaid_accounts:
        logger.warning(f"No Plaid investment accounts found for user {user_id}")
        return 0.0, {}

    account_ids = [acc.id for acc in plaid_accounts]

    # Query Plaid holdings for these accounts
    holdings_query = select(PlaidHolding).where(
        PlaidHolding.account_id.in_(account_ids)
    )
    result = await db.execute(holdings_query)
    plaid_holdings = result.scalars().all()

    if not plaid_holdings:
        logger.warning(f"No Plaid holdings found for user {user_id}")
        return 0.0, {}

    # Calculate total value and allocation
    asset_class_values = {}
    total_value = 0.0

    for holding in plaid_holdings:
        # Use institution_value from Plaid
        value = float(holding.institution_value) if holding.institution_value else 0.0

        if value <= 0:
            continue

        total_value += value

        # Map ticker symbol to asset class
        ticker = holding.ticker_symbol
        asset_class = _map_ticker_to_asset_class(ticker, holding.type)

        asset_class_values[asset_class] = asset_class_values.get(asset_class, 0) + value

        logger.debug(f"Holding: {ticker} -> {asset_class}, value: ${value:,.2f}")

    # Convert to percentages
    allocation = {}
    if total_value > 0:
        for asset_class, value in asset_class_values.items():
            allocation[asset_class] = value / total_value

    logger.info(f"Portfolio value from Plaid: ${total_value:,.2f}, {len(allocation)} asset classes")

    return total_value, allocation


def _map_ticker_to_asset_class(ticker: Optional[str], security_type: Optional[str]) -> str:
    """
    Map ticker symbol to standardized asset class code.

    This maps common ETFs and securities to asset classes used in risk calculations.

    Args:
        ticker: Ticker symbol (e.g., "SPY", "GLD", "QQQ")
        security_type: Security type from Plaid (e.g., "equity", "mutual fund", "etf")

    Returns:
        Asset class code (e.g., "US_LC_BLEND", "GOLD", "US_TECH")
    """
    if not ticker:
        return "Other"

    ticker_upper = ticker.upper()

    # Common ETF mappings
    ticker_map = {
        # US Large Cap
        "SPY": "US_LC_BLEND",
        "VOO": "US_LC_BLEND",
        "IVV": "US_LC_BLEND",
        "VTI": "US_LC_BLEND",

        # US Large Cap Growth
        "QQQ": "US_LC_GROWTH",
        "VUG": "US_LC_GROWTH",
        "IWF": "US_LC_GROWTH",

        # US Large Cap Value
        "VTV": "US_LC_VALUE",
        "IWD": "US_LC_VALUE",

        # US Mid Cap
        "VO": "US_MC_BLEND",
        "IJH": "US_MC_BLEND",
        "MDY": "US_MC_BLEND",

        # US Small Cap
        "VB": "US_SC_BLEND",
        "IWM": "US_SC_BLEND",
        "IJR": "US_SC_BLEND",

        # International Developed
        "VEA": "INTL_DEV_BLEND",
        "IEFA": "INTL_DEV_BLEND",
        "EFA": "INTL_DEV_BLEND",

        # Emerging Markets
        "VWO": "EM_BLEND",
        "IEMG": "EM_BLEND",
        "EEM": "EM_BLEND",

        # Bonds - US Treasury
        "VGSH": "US_TREASURY_SHORT",
        "VGIT": "US_TREASURY_INTER",
        "VGLT": "US_TREASURY_LONG",
        "IEF": "US_TREASURY_INTER",
        "TLT": "US_TREASURY_LONG",

        # Bonds - Corporate
        "LQD": "US_CORP_IG",
        "VCIT": "US_CORP_IG",
        "HYG": "US_CORP_HY",
        "JNK": "US_CORP_HY",

        # Bonds - Municipal
        "MUB": "MUNI_INTER",
        "VTEB": "MUNI_INTER",

        # TIPS
        "TIP": "TIPS",
        "VTIP": "TIPS",

        # REITs
        "VNQ": "US_REIT",
        "IYR": "US_REIT",
        "VNQI": "INTL_REIT",

        # Commodities
        "GLD": "GOLD",
        "IAU": "GOLD",
        "DBC": "COMMODITY_BROAD",
        "DBO": "ENERGY",
        "USO": "ENERGY",

        # Sector ETFs
        "XLK": "US_TECH",
        "VGT": "US_TECH",
        "XLV": "US_HEALTH",
        "VHT": "US_HEALTH",
        "XLF": "US_FINANCE",
        "VFH": "US_FINANCE",
        "XLY": "US_CONSUMER",
        "VCR": "US_CONSUMER",
        "XLU": "US_UTILITIES",
        "VPU": "US_UTILITIES",

        # Dividend
        "VYM": "US_DIVIDEND",
        "DVY": "US_DIVIDEND",
        "SCHD": "US_DIVIDEND",

        # Cash equivalents
        "BIL": "CASH",
        "SHV": "CASH",
    }

    # Check direct mapping
    if ticker_upper in ticker_map:
        return ticker_map[ticker_upper]

    # Fallback based on security type
    if security_type:
        type_lower = security_type.lower()
        if "equity" in type_lower or "stock" in type_lower:
            return "US_LC_BLEND"  # Default to large cap blend
        elif "bond" in type_lower or "fixed" in type_lower:
            return "US_TREASURY_INTER"  # Default to intermediate treasuries
        elif "mutual" in type_lower:
            return "US_LC_BLEND"  # Most mutual funds are equity

    # Default to "Other" for unknown securities
    return "Other"


async def get_holdings_details(
    user_id: str,
    db: AsyncSession
) -> List[Dict]:
    """
    Get detailed holdings information for user's portfolio from Plaid data.

    Returns:
        List of holdings with symbol, name, value, weight, asset_class, etc.
    """
    # Query Plaid accounts for this user (investment accounts only)
    accounts_query = select(PlaidAccount).where(
        PlaidAccount.user_id == user_id,
        PlaidAccount.type == "investment",
        PlaidAccount.is_active == True
    )
    result = await db.execute(accounts_query)
    plaid_accounts = result.scalars().all()

    if not plaid_accounts:
        logger.warning(f"No Plaid investment accounts found for user {user_id}")
        return []

    account_ids = [acc.id for acc in plaid_accounts]

    # Get all Plaid holdings for these accounts
    holdings_query = select(PlaidHolding).where(PlaidHolding.account_id.in_(account_ids))
    result = await db.execute(holdings_query)
    plaid_holdings = result.scalars().all()

    if not plaid_holdings:
        logger.warning(f"No Plaid holdings found for user {user_id}")
        return []

    # Calculate total value for weights
    total_value = sum(float(h.institution_value) if h.institution_value else 0 for h in plaid_holdings)

    # Convert to dict format
    holdings_list = []
    for h in plaid_holdings:
        value = float(h.institution_value) if h.institution_value else 0.0
        cost_basis = float(h.cost_basis) if h.cost_basis else 0.0
        shares = float(h.quantity) if h.quantity else 0.0

        # Map ticker to asset class
        asset_class = _map_ticker_to_asset_class(h.ticker_symbol, h.type)

        holdings_list.append({
            "symbol": h.ticker_symbol or "N/A",
            "name": h.name,
            "value": value,
            "weight": value / total_value if total_value > 0 else 0,
            "shares": shares,
            "cost_basis": cost_basis,
            "asset_class": asset_class,
            "security_type": h.type or "unknown",
            "purchase_date": None,  # Plaid doesn't provide purchase dates for holdings
            "expense_ratio": None,  # Not provided by Plaid for individual holdings
        })

    logger.info(f"Retrieved {len(holdings_list)} holdings from Plaid for user {user_id}")
    return holdings_list


async def get_financial_snapshot(
    user_id: str,
    db: AsyncSession
) -> Dict:
    """
    Get user's financial snapshot including income, expenses, and reserves.

    Returns:
        Dict with monthly_income, monthly_expenses, current_reserves, etc.
    """
    # Get user data
    user_query = select(User).where(User.id == user_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()

    if not user:
        return {
            "monthly_income": 0.0,
            "monthly_expenses": 0.0,
            "current_reserves": 0.0,
            "has_dependents": False,
        }

    # Get budget entries to calculate income and expenses
    budget_query = select(BudgetEntry).where(BudgetEntry.user_id == user_id)
    result = await db.execute(budget_query)
    budget_entries = result.scalars().all()

    monthly_income = 0.0
    monthly_expenses = 0.0

    for entry in budget_entries:
        amount = float(entry.amount)
        if entry.type == BudgetType.INCOME:
            monthly_income += amount
        elif entry.type == BudgetType.EXPENSE:
            monthly_expenses += amount

    # Get current reserves from Plaid depository accounts (checking, savings)
    depository_accounts_query = select(PlaidAccount).where(
        PlaidAccount.user_id == user_id,
        PlaidAccount.type == "depository",
        PlaidAccount.is_active == True
    )
    result = await db.execute(depository_accounts_query)
    depository_accounts = result.scalars().all()

    current_reserves = 0.0
    for acc in depository_accounts:
        # Use current_balance from Plaid
        if acc.current_balance:
            current_reserves += float(acc.current_balance)

    # Check if user has dependents (could be stored in user preferences)
    has_dependents = False
    if user.preferences and isinstance(user.preferences, dict):
        has_dependents = user.preferences.get("has_dependents", False)

    return {
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "current_reserves": current_reserves,
        "has_dependents": has_dependents,
        "risk_tolerance": user.risk_tolerance or "moderate",
        "age": user.age or 35,
    }


def _normalize_asset_class(asset_class: str) -> str:
    """
    Normalize asset class names to standard format.

    Maps various names to consistent values used in risk calculations.
    """
    asset_class_lower = asset_class.lower()

    # Mapping for common variations
    mapping = {
        "cash": "Cash",
        "us stock": "US_LargeCap",
        "large cap equity": "US_LargeCap",
        "small cap equity": "US_SmallCap",
        "international": "International_Developed",
        "emerging markets": "Emerging_Markets",
        "agg bond": "US_Bonds",
        "govt bond": "US_Treasury",
        "tips": "US_TIPS",
        "reit": "REIT",
        "gold": "Gold",
        "target date": "Target_Date",
    }

    # Return mapped value or original if not found
    for key, value in mapping.items():
        if key in asset_class_lower:
            return value

    # Default to original capitalized
    return asset_class.title().replace(" ", "_")


async def get_account_type_breakdown(
    user_id: str,
    db: AsyncSession
) -> Dict[str, float]:
    """
    Get portfolio value breakdown by account type from Plaid data.

    Returns:
        Dict mapping account_type/subtype -> total_value
        e.g., {"401k": 200000, "ira": 150000, "brokerage": 50000}
    """
    # Query all active Plaid accounts for this user
    accounts_query = select(PlaidAccount).where(
        PlaidAccount.user_id == user_id,
        PlaidAccount.is_active == True
    )
    result = await db.execute(accounts_query)
    plaid_accounts = result.scalars().all()

    if not plaid_accounts:
        logger.warning(f"No Plaid accounts found for user {user_id}")
        return {}

    # Build breakdown by account subtype (more specific than just type)
    breakdown = {}
    for account in plaid_accounts:
        # Use subtype if available (more specific: "401k", "ira", "brokerage")
        # Otherwise fall back to type ("investment", "depository", "credit")
        account_key = account.subtype or account.type

        # Get account value (use current_balance for all account types)
        value = float(account.current_balance) if account.current_balance else 0.0

        breakdown[account_key] = breakdown.get(account_key, 0.0) + value

    logger.info(f"Account breakdown from Plaid: {breakdown}")
    return breakdown
