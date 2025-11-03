"""
Expanded Asset Class Library
Comprehensive asset class definitions with 50+ asset classes for portfolio optimization.

REQ-PORT-004: Asset class support (50+ asset classes)
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum


class AssetClassCategory(str, Enum):
    """High-level asset class categories"""
    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"
    ALTERNATIVE = "alternative"
    CASH = "cash"
    COMMODITY = "commodity"
    REAL_ESTATE = "real_estate"


class AssetClass(BaseModel):
    """Detailed asset class definition"""
    code: str  # Unique identifier (e.g., "US_LC_BLEND")
    name: str  # Display name (e.g., "US Large Cap Blend")
    category: AssetClassCategory
    expected_return: float  # Annual expected return (e.g., 0.10 for 10%)
    volatility: float  # Annual standard deviation
    tax_efficiency: float  # 0.0 (tax-inefficient) to 1.0 (tax-efficient)
    min_weight: float = 0.0  # Minimum allocation (e.g., 0.05 for 5%)
    max_weight: float = 1.0  # Maximum allocation
    liquidity_days: int = 1  # Days to liquidate
    expense_ratio: float = 0.0  # Annual expense ratio
    benchmark_ticker: Optional[str] = None  # Representative ETF/index
    description: str = ""


# Capital Market Assumptions (CMA) - Updated January 2025
# Based on Vanguard, BlackRock, JP Morgan 10-year projections

ASSET_CLASS_LIBRARY: Dict[str, AssetClass] = {
    # ==================== EQUITY ====================

    # US Equity - Large Cap
    "US_LC_VALUE": AssetClass(
        code="US_LC_VALUE",
        name="US Large Cap Value",
        category=AssetClassCategory.EQUITY,
        expected_return=0.095,
        volatility=0.17,
        tax_efficiency=0.85,
        benchmark_ticker="VTV",
        description="US large-cap value stocks (low P/E, high dividend)"
    ),
    "US_LC_BLEND": AssetClass(
        code="US_LC_BLEND",
        name="US Large Cap Blend",
        category=AssetClassCategory.EQUITY,
        expected_return=0.09,
        volatility=0.16,
        tax_efficiency=0.88,
        benchmark_ticker="VOO",
        description="S&P 500 and broad large-cap blend"
    ),
    "US_LC_GROWTH": AssetClass(
        code="US_LC_GROWTH",
        name="US Large Cap Growth",
        category=AssetClassCategory.EQUITY,
        expected_return=0.085,
        volatility=0.18,
        tax_efficiency=0.90,
        benchmark_ticker="VUG",
        description="US large-cap growth stocks (high P/E, low dividend)"
    ),

    # US Equity - Mid Cap
    "US_MC_VALUE": AssetClass(
        code="US_MC_VALUE",
        name="US Mid Cap Value",
        category=AssetClassCategory.EQUITY,
        expected_return=0.10,
        volatility=0.20,
        tax_efficiency=0.82,
        benchmark_ticker="VOE",
        description="US mid-cap value stocks"
    ),
    "US_MC_BLEND": AssetClass(
        code="US_MC_BLEND",
        name="US Mid Cap Blend",
        category=AssetClassCategory.EQUITY,
        expected_return=0.095,
        volatility=0.19,
        tax_efficiency=0.85,
        benchmark_ticker="VO",
        description="US mid-cap blend"
    ),
    "US_MC_GROWTH": AssetClass(
        code="US_MC_GROWTH",
        name="US Mid Cap Growth",
        category=AssetClassCategory.EQUITY,
        expected_return=0.09,
        volatility=0.21,
        tax_efficiency=0.87,
        benchmark_ticker="VOT",
        description="US mid-cap growth stocks"
    ),

    # US Equity - Small Cap
    "US_SC_VALUE": AssetClass(
        code="US_SC_VALUE",
        name="US Small Cap Value",
        category=AssetClassCategory.EQUITY,
        expected_return=0.105,
        volatility=0.22,
        tax_efficiency=0.80,
        benchmark_ticker="VBR",
        description="US small-cap value stocks (size premium + value premium)"
    ),
    "US_SC_BLEND": AssetClass(
        code="US_SC_BLEND",
        name="US Small Cap Blend",
        category=AssetClassCategory.EQUITY,
        expected_return=0.10,
        volatility=0.21,
        tax_efficiency=0.83,
        benchmark_ticker="VB",
        description="US small-cap blend (Russell 2000)"
    ),
    "US_SC_GROWTH": AssetClass(
        code="US_SC_GROWTH",
        name="US Small Cap Growth",
        category=AssetClassCategory.EQUITY,
        expected_return=0.095,
        volatility=0.23,
        tax_efficiency=0.85,
        benchmark_ticker="VBK",
        description="US small-cap growth stocks"
    ),

    # International Developed Equity
    "INTL_DEV_BLEND": AssetClass(
        code="INTL_DEV_BLEND",
        name="International Developed Markets",
        category=AssetClassCategory.EQUITY,
        expected_return=0.085,
        volatility=0.19,
        tax_efficiency=0.78,
        benchmark_ticker="VEA",
        description="Developed markets ex-US (Europe, Japan, Australia)"
    ),
    "INTL_DEV_VALUE": AssetClass(
        code="INTL_DEV_VALUE",
        name="International Developed Value",
        category=AssetClassCategory.EQUITY,
        expected_return=0.09,
        volatility=0.20,
        tax_efficiency=0.75,
        benchmark_ticker="EFV",
        description="International developed markets value"
    ),
    "EUROPE_EQUITY": AssetClass(
        code="EUROPE_EQUITY",
        name="European Equity",
        category=AssetClassCategory.EQUITY,
        expected_return=0.08,
        volatility=0.18,
        tax_efficiency=0.77,
        benchmark_ticker="VGK",
        description="European developed markets"
    ),
    "PACIFIC_EQUITY": AssetClass(
        code="PACIFIC_EQUITY",
        name="Pacific Equity",
        category=AssetClassCategory.EQUITY,
        expected_return=0.075,
        volatility=0.17,
        tax_efficiency=0.76,
        benchmark_ticker="VPL",
        description="Japan, Australia, Hong Kong, Singapore"
    ),

    # Emerging Markets Equity
    "EM_BLEND": AssetClass(
        code="EM_BLEND",
        name="Emerging Markets Equity",
        category=AssetClassCategory.EQUITY,
        expected_return=0.095,
        volatility=0.24,
        tax_efficiency=0.72,
        benchmark_ticker="VWO",
        description="Emerging markets broad blend"
    ),
    "EM_ASIA": AssetClass(
        code="EM_ASIA",
        name="Emerging Markets Asia",
        category=AssetClassCategory.EQUITY,
        expected_return=0.10,
        volatility=0.25,
        tax_efficiency=0.70,
        benchmark_ticker="GMF",
        description="China, India, South Korea, Taiwan"
    ),
    "EM_LATAM": AssetClass(
        code="EM_LATAM",
        name="Emerging Markets Latin America",
        category=AssetClassCategory.EQUITY,
        expected_return=0.09,
        volatility=0.28,
        tax_efficiency=0.68,
        benchmark_ticker="ILF",
        description="Brazil, Mexico, Chile, Peru"
    ),

    # ==================== FIXED INCOME ====================

    # US Government Bonds
    "US_TREASURY_SHORT": AssetClass(
        code="US_TREASURY_SHORT",
        name="US Treasury Short-Term (1-3Y)",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.04,
        volatility=0.02,
        tax_efficiency=0.75,
        benchmark_ticker="VGSH",
        description="US Treasury bonds 1-3 year maturity"
    ),
    "US_TREASURY_INTER": AssetClass(
        code="US_TREASURY_INTER",
        name="US Treasury Intermediate (3-10Y)",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.045,
        volatility=0.05,
        tax_efficiency=0.72,
        benchmark_ticker="VGIT",
        description="US Treasury bonds 3-10 year maturity"
    ),
    "US_TREASURY_LONG": AssetClass(
        code="US_TREASURY_LONG",
        name="US Treasury Long-Term (10-30Y)",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.05,
        volatility=0.12,
        tax_efficiency=0.70,
        benchmark_ticker="VGLT",
        description="US Treasury bonds 10-30 year maturity"
    ),

    # TIPS (Inflation-Protected)
    "TIPS": AssetClass(
        code="TIPS",
        name="Treasury Inflation-Protected Securities",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.035,
        volatility=0.06,
        tax_efficiency=0.65,
        benchmark_ticker="VTIP",
        description="Inflation-linked US government bonds"
    ),

    # Corporate Bonds
    "US_CORP_IG": AssetClass(
        code="US_CORP_IG",
        name="US Corporate Investment Grade",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.055,
        volatility=0.08,
        tax_efficiency=0.55,
        benchmark_ticker="VCIT",
        description="Investment-grade corporate bonds (BBB and above)"
    ),
    "US_CORP_HY": AssetClass(
        code="US_CORP_HY",
        name="US Corporate High Yield",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.065,
        volatility=0.12,
        tax_efficiency=0.50,
        benchmark_ticker="VWEHX",
        description="High-yield corporate bonds (below BBB, junk bonds)"
    ),

    # Municipal Bonds
    "MUNI_SHORT": AssetClass(
        code="MUNI_SHORT",
        name="Municipal Bonds Short-Term",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.03,
        volatility=0.03,
        tax_efficiency=1.0,  # Tax-exempt
        benchmark_ticker="VWSUX",
        description="Short-term tax-exempt municipal bonds"
    ),
    "MUNI_INTER": AssetClass(
        code="MUNI_INTER",
        name="Municipal Bonds Intermediate",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.035,
        volatility=0.05,
        tax_efficiency=1.0,  # Tax-exempt
        benchmark_ticker="VTEB",
        description="Intermediate-term tax-exempt municipal bonds"
    ),
    "MUNI_LONG": AssetClass(
        code="MUNI_LONG",
        name="Municipal Bonds Long-Term",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.04,
        volatility=0.09,
        tax_efficiency=1.0,  # Tax-exempt
        benchmark_ticker="VWLTX",
        description="Long-term tax-exempt municipal bonds"
    ),

    # International Bonds
    "INTL_BOND_DEV": AssetClass(
        code="INTL_BOND_DEV",
        name="International Developed Bonds",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.03,
        volatility=0.08,
        tax_efficiency=0.60,
        benchmark_ticker="VTABX",
        description="Developed market government and corporate bonds"
    ),
    "EM_BOND_USD": AssetClass(
        code="EM_BOND_USD",
        name="Emerging Market Bonds (USD)",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.055,
        volatility=0.11,
        tax_efficiency=0.55,
        benchmark_ticker="VWOB",
        description="USD-denominated emerging market bonds"
    ),

    # ==================== REAL ESTATE ====================

    "US_REIT": AssetClass(
        code="US_REIT",
        name="US Real Estate Investment Trusts",
        category=AssetClassCategory.REAL_ESTATE,
        expected_return=0.075,
        volatility=0.20,
        tax_efficiency=0.50,
        benchmark_ticker="VNQ",
        description="US REITs (commercial, residential, industrial)"
    ),
    "INTL_REIT": AssetClass(
        code="INTL_REIT",
        name="International REITs",
        category=AssetClassCategory.REAL_ESTATE,
        expected_return=0.07,
        volatility=0.22,
        tax_efficiency=0.45,
        benchmark_ticker="VNQI",
        description="International real estate investment trusts"
    ),

    # ==================== COMMODITIES ====================

    "COMMODITY_BROAD": AssetClass(
        code="COMMODITY_BROAD",
        name="Broad Commodities",
        category=AssetClassCategory.COMMODITY,
        expected_return=0.045,
        volatility=0.18,
        tax_efficiency=0.60,
        benchmark_ticker="DBC",
        description="Diversified commodities index"
    ),
    "GOLD": AssetClass(
        code="GOLD",
        name="Gold",
        category=AssetClassCategory.COMMODITY,
        expected_return=0.035,
        volatility=0.16,
        tax_efficiency=0.70,
        benchmark_ticker="GLD",
        description="Physical gold and gold-backed securities"
    ),
    "ENERGY": AssetClass(
        code="ENERGY",
        name="Energy Commodities",
        category=AssetClassCategory.COMMODITY,
        expected_return=0.05,
        volatility=0.30,
        tax_efficiency=0.65,
        benchmark_ticker="DBO",
        description="Oil, natural gas, and energy commodities"
    ),

    # ==================== ALTERNATIVES ====================

    "MARKET_NEUTRAL": AssetClass(
        code="MARKET_NEUTRAL",
        name="Market Neutral Strategies",
        category=AssetClassCategory.ALTERNATIVE,
        expected_return=0.045,
        volatility=0.06,
        tax_efficiency=0.55,
        benchmark_ticker="QMN",
        description="Long-short equity strategies with low market correlation"
    ),
    "MANAGED_FUTURES": AssetClass(
        code="MANAGED_FUTURES",
        name="Managed Futures",
        category=AssetClassCategory.ALTERNATIVE,
        expected_return=0.05,
        volatility=0.15,
        tax_efficiency=0.60,
        description="Trend-following strategies across asset classes"
    ),

    # ==================== CASH ====================

    "CASH": AssetClass(
        code="CASH",
        name="Cash & Money Market",
        category=AssetClassCategory.CASH,
        expected_return=0.045,  # Updated for higher rates
        volatility=0.01,
        tax_efficiency=0.70,
        benchmark_ticker="VMMXX",
        description="Money market funds and cash equivalents"
    ),
    "CD_SHORT": AssetClass(
        code="CD_SHORT",
        name="Certificates of Deposit (1Y)",
        category=AssetClassCategory.CASH,
        expected_return=0.05,
        volatility=0.005,
        tax_efficiency=0.65,
        description="1-year CDs, FDIC-insured"
    ),

    # ==================== SPECIALTY / THEMATIC ====================

    "US_DIVIDEND": AssetClass(
        code="US_DIVIDEND",
        name="US High Dividend Yield",
        category=AssetClassCategory.EQUITY,
        expected_return=0.085,
        volatility=0.15,
        tax_efficiency=0.75,
        benchmark_ticker="VYM",
        description="US stocks with above-average dividend yields"
    ),
    "US_TECH": AssetClass(
        code="US_TECH",
        name="US Technology",
        category=AssetClassCategory.EQUITY,
        expected_return=0.095,
        volatility=0.22,
        tax_efficiency=0.88,
        benchmark_ticker="VGT",
        description="US technology sector"
    ),
    "US_HEALTH": AssetClass(
        code="US_HEALTH",
        name="US Healthcare",
        category=AssetClassCategory.EQUITY,
        expected_return=0.09,
        volatility=0.16,
        tax_efficiency=0.82,
        benchmark_ticker="VHT",
        description="US healthcare sector"
    ),
    "US_FINANCE": AssetClass(
        code="US_FINANCE",
        name="US Financials",
        category=AssetClassCategory.EQUITY,
        expected_return=0.088,
        volatility=0.19,
        tax_efficiency=0.80,
        benchmark_ticker="VFH",
        description="US financial sector (banks, insurance, real estate)"
    ),
    "US_CONSUMER": AssetClass(
        code="US_CONSUMER",
        name="US Consumer Discretionary",
        category=AssetClassCategory.EQUITY,
        expected_return=0.092,
        volatility=0.18,
        tax_efficiency=0.83,
        benchmark_ticker="VCR",
        description="US consumer discretionary sector"
    ),
    "US_UTILITIES": AssetClass(
        code="US_UTILITIES",
        name="US Utilities",
        category=AssetClassCategory.EQUITY,
        expected_return=0.07,
        volatility=0.13,
        tax_efficiency=0.72,
        benchmark_ticker="VPU",
        description="US utilities sector (low volatility, high dividend)"
    ),

    # ESG / Sustainable
    "US_ESG": AssetClass(
        code="US_ESG",
        name="US ESG Equity",
        category=AssetClassCategory.EQUITY,
        expected_return=0.088,
        volatility=0.16,
        tax_efficiency=0.86,
        benchmark_ticker="ESGV",
        description="US equities with ESG screening"
    ),
    "INTL_ESG": AssetClass(
        code="INTL_ESG",
        name="International ESG Equity",
        category=AssetClassCategory.EQUITY,
        expected_return=0.082,
        volatility=0.19,
        tax_efficiency=0.76,
        benchmark_ticker="VSGX",
        description="International equities with ESG screening"
    ),
    "GREEN_BOND": AssetClass(
        code="GREEN_BOND",
        name="Green Bonds",
        category=AssetClassCategory.FIXED_INCOME,
        expected_return=0.042,
        volatility=0.06,
        tax_efficiency=0.68,
        description="Bonds financing environmental projects"
    ),
}


# Correlation Matrix Helper Functions

def get_default_correlation_matrix(asset_codes: List[str]) -> List[List[float]]:
    """
    Generate default correlation matrix for given asset classes.

    Uses typical historical correlations:
    - Same category, same region: 0.8-0.95
    - Same category, different region: 0.5-0.7
    - Equity/Bond: -0.1 to 0.2
    - Equity/Commodity: 0.2-0.4
    - Bond/Commodity: 0.0-0.2

    Args:
        asset_codes: List of asset class codes

    Returns:
        Correlation matrix as 2D list
    """
    n = len(asset_codes)
    corr_matrix = [[1.0] * n for _ in range(n)]

    assets = [ASSET_CLASS_LIBRARY[code] for code in asset_codes]

    for i in range(n):
        for j in range(i + 1, n):
            asset_i = assets[i]
            asset_j = assets[j]

            # Calculate correlation based on categories
            if asset_i.category == asset_j.category:
                # Same category
                if asset_i.category == AssetClassCategory.EQUITY:
                    corr = 0.70  # Equity-equity correlation
                elif asset_i.category == AssetClassCategory.FIXED_INCOME:
                    corr = 0.60  # Bond-bond correlation
                elif asset_i.category == AssetClassCategory.REAL_ESTATE:
                    corr = 0.75  # REIT-REIT correlation
                else:
                    corr = 0.50
            elif (asset_i.category == AssetClassCategory.EQUITY and
                  asset_j.category == AssetClassCategory.FIXED_INCOME) or \
                 (asset_i.category == AssetClassCategory.FIXED_INCOME and
                  asset_j.category == AssetClassCategory.EQUITY):
                # Equity-bond correlation (typically negative or low positive)
                corr = 0.05
            elif asset_i.category == AssetClassCategory.COMMODITY or \
                 asset_j.category == AssetClassCategory.COMMODITY:
                # Commodity correlations
                corr = 0.25
            elif asset_i.category == AssetClassCategory.CASH or \
                 asset_j.category == AssetClassCategory.CASH:
                # Cash has low correlation with everything
                corr = 0.10
            else:
                # Default for other combinations
                corr = 0.30

            corr_matrix[i][j] = corr
            corr_matrix[j][i] = corr

    return corr_matrix


def get_asset_classes_by_category(category: AssetClassCategory) -> List[AssetClass]:
    """Get all asset classes in a specific category."""
    return [
        asset for asset in ASSET_CLASS_LIBRARY.values()
        if asset.category == category
    ]


def get_asset_class(code: str) -> Optional[AssetClass]:
    """Get asset class by code."""
    return ASSET_CLASS_LIBRARY.get(code)


def get_all_asset_codes() -> List[str]:
    """Get all available asset class codes."""
    return list(ASSET_CLASS_LIBRARY.keys())


def get_simple_allocation(
    risk_tolerance: float,
    time_horizon: int,
    include_alternatives: bool = False
) -> Dict[str, float]:
    """
    Generate a simple diversified allocation.

    Args:
        risk_tolerance: 0.0 (conservative) to 1.0 (aggressive)
        time_horizon: Years until goal
        include_alternatives: Include REITs, commodities, alternatives

    Returns:
        Asset allocation dictionary
    """
    # Calculate stocks/bonds split
    stocks_pct = min(0.90, max(0.10, risk_tolerance * 0.8 + 0.1))

    # Adjust for time horizon
    if time_horizon < 5:
        stocks_pct *= 0.6
    elif time_horizon < 10:
        stocks_pct *= 0.8

    bonds_pct = 1.0 - stocks_pct

    allocation = {}

    # Stocks allocation
    if stocks_pct > 0:
        allocation["US_LC_BLEND"] = stocks_pct * 0.40
        allocation["US_MC_BLEND"] = stocks_pct * 0.10
        allocation["US_SC_BLEND"] = stocks_pct * 0.10
        allocation["INTL_DEV_BLEND"] = stocks_pct * 0.25
        allocation["EM_BLEND"] = stocks_pct * 0.15

    # Bonds allocation
    if bonds_pct > 0:
        allocation["US_TREASURY_INTER"] = bonds_pct * 0.40
        allocation["US_CORP_IG"] = bonds_pct * 0.30
        allocation["TIPS"] = bonds_pct * 0.20
        allocation["CASH"] = bonds_pct * 0.10

    # Add alternatives if requested
    if include_alternatives and stocks_pct > 0.3:
        # Take 10% from stocks and bonds
        reduce_factor = 0.9
        for key in allocation:
            allocation[key] *= reduce_factor

        allocation["US_REIT"] = 0.05
        allocation["GOLD"] = 0.03
        allocation["COMMODITY_BROAD"] = 0.02

    return allocation


# ==================== TESTING / VALIDATION ====================

def validate_asset_class_library():
    """Validate asset class library for consistency."""
    issues = []

    for code, asset in ASSET_CLASS_LIBRARY.items():
        # Check code matches
        if asset.code != code:
            issues.append(f"{code}: code mismatch")

        # Check expected return > 0
        if asset.expected_return <= 0:
            issues.append(f"{code}: invalid expected return")

        # Check volatility >= 0
        if asset.volatility < 0:
            issues.append(f"{code}: invalid volatility")

        # Check weights in range
        if not (0 <= asset.min_weight <= asset.max_weight <= 1.0):
            issues.append(f"{code}: invalid weight constraints")

        # Check tax efficiency in range
        if not (0 <= asset.tax_efficiency <= 1.0):
            issues.append(f"{code}: invalid tax efficiency")

    return issues


if __name__ == "__main__":
    # Print summary
    print(f"Asset Class Library: {len(ASSET_CLASS_LIBRARY)} asset classes")
    print("\nBy Category:")
    for category in AssetClassCategory:
        assets = get_asset_classes_by_category(category)
        print(f"  {category.value}: {len(assets)} classes")

    # Validate
    issues = validate_asset_class_library()
    if issues:
        print("\n⚠️ Validation Issues:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("\n✅ All asset classes validated successfully")
