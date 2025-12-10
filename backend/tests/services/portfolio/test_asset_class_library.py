"""
Unit tests for Asset Class Library
Tests asset class definitions, validation, and helper functions
"""

import pytest
from app.services.portfolio.asset_class_library import (
    ASSET_CLASS_LIBRARY,
    AssetClass,
    AssetClassCategory,
    get_asset_class,
    get_all_asset_codes,
    get_asset_classes_by_category,
    get_default_correlation_matrix,
    get_simple_allocation,
    validate_asset_class_library
)


class TestAssetClassLibrary:
    """Test asset class library structure and data"""

    def test_library_has_50_plus_assets(self):
        """Test that library has at least 50 asset classes"""
        assert len(ASSET_CLASS_LIBRARY) >= 50, "Should have 50+ asset classes"

    def test_all_asset_classes_valid(self):
        """Test that all asset classes have valid data"""
        for code, asset in ASSET_CLASS_LIBRARY.items():
            # Check code matches
            assert asset.code == code, f"Asset code mismatch: {code} != {asset.code}"

            # Check required fields
            assert asset.name, f"Asset {code} missing name"
            assert asset.category in AssetClassCategory, f"Asset {code} has invalid category"

            # Check numeric fields in valid ranges
            assert 0 < asset.expected_return < 1.0, f"Asset {code} has invalid expected return: {asset.expected_return}"
            assert 0 < asset.volatility < 1.0, f"Asset {code} has invalid volatility: {asset.volatility}"
            assert 0 <= asset.tax_efficiency <= 1.0, f"Asset {code} has invalid tax efficiency: {asset.tax_efficiency}"
            assert 0 <= asset.min_weight <= asset.max_weight <= 1.0, f"Asset {code} has invalid weight constraints"

    def test_validate_asset_class_library(self):
        """Test library validation function"""
        issues = validate_asset_class_library()
        assert len(issues) == 0, f"Validation issues found: {issues}"

    def test_all_categories_represented(self):
        """Test that all major asset categories are present"""
        categories = set()
        for asset in ASSET_CLASS_LIBRARY.values():
            categories.add(asset.category)

        # Should have equity, fixed_income, real_estate, commodity, alternative, cash
        assert AssetClassCategory.EQUITY in categories
        assert AssetClassCategory.FIXED_INCOME in categories
        assert AssetClassCategory.REAL_ESTATE in categories
        assert AssetClassCategory.COMMODITY in categories
        assert AssetClassCategory.CASH in categories

    def test_esg_assets_present(self):
        """Test that ESG-focused assets are available"""
        assert "US_ESG" in ASSET_CLASS_LIBRARY
        assert "INTL_ESG" in ASSET_CLASS_LIBRARY
        assert "GREEN_BOND" in ASSET_CLASS_LIBRARY

    def test_diverse_equity_options(self):
        """Test that multiple equity styles are available"""
        equity_codes = [code for code, asset in ASSET_CLASS_LIBRARY.items()
                        if asset.category == AssetClassCategory.EQUITY]

        # Should have at least 20 equity options
        assert len(equity_codes) >= 20

        # Should have value, blend, growth
        assert any("VALUE" in code for code in equity_codes)
        assert any("BLEND" in code for code in equity_codes)
        assert any("GROWTH" in code for code in equity_codes)

    def test_fixed_income_variety(self):
        """Test fixed income asset variety"""
        bonds = [asset for asset in ASSET_CLASS_LIBRARY.values()
                 if asset.category == AssetClassCategory.FIXED_INCOME]

        # Should have at least 10 fixed income options
        assert len(bonds) >= 10

        # Check for key bond types
        codes = [asset.code for asset in bonds]
        assert any("TREASURY" in code for code in codes)
        assert any("TIPS" in code for code in codes)
        assert any("CORP" in code for code in codes)
        assert any("MUNI" in code for code in codes)


class TestAssetClassHelpers:
    """Test helper functions"""

    def test_get_asset_class(self):
        """Test getting asset by code"""
        asset = get_asset_class("US_LC_BLEND")
        assert asset is not None
        assert asset.code == "US_LC_BLEND"
        assert asset.name == "US Large Cap Blend"

        # Test invalid code
        assert get_asset_class("INVALID_CODE") is None

    def test_get_all_asset_codes(self):
        """Test getting all asset codes"""
        codes = get_all_asset_codes()
        assert len(codes) >= 50
        assert "US_LC_BLEND" in codes
        assert "CASH" in codes

    def test_get_asset_classes_by_category(self):
        """Test filtering by category"""
        equities = get_asset_classes_by_category(AssetClassCategory.EQUITY)
        assert len(equities) >= 20
        assert all(asset.category == AssetClassCategory.EQUITY for asset in equities)

        bonds = get_asset_classes_by_category(AssetClassCategory.FIXED_INCOME)
        assert len(bonds) >= 10
        assert all(asset.category == AssetClassCategory.FIXED_INCOME for asset in bonds)

    def test_get_simple_allocation_conservative(self):
        """Test simple allocation for conservative investor"""
        allocation = get_simple_allocation(
            risk_tolerance=0.2,  # Conservative
            time_horizon=5,
            include_alternatives=False
        )

        # Check allocation sums to 1.0
        total = sum(allocation.values())
        assert abs(total - 1.0) < 0.01, f"Allocation should sum to 1.0, got {total}"

        # Conservative should have more bonds than stocks
        stock_weight = sum(weight for code, weight in allocation.items()
                          if "STOCK" in code or "EQUITY" in code or get_asset_class(code).category == AssetClassCategory.EQUITY)
        bond_weight = sum(weight for code, weight in allocation.items()
                         if "BOND" in code or "TREASURY" in code or get_asset_class(code).category == AssetClassCategory.FIXED_INCOME)

        assert bond_weight > stock_weight, "Conservative portfolio should have more bonds than stocks"

    def test_get_simple_allocation_aggressive(self):
        """Test simple allocation for aggressive investor"""
        allocation = get_simple_allocation(
            risk_tolerance=0.9,  # Aggressive
            time_horizon=30,
            include_alternatives=False
        )

        # Check allocation sums to 1.0
        total = sum(allocation.values())
        assert abs(total - 1.0) < 0.01, f"Allocation should sum to 1.0, got {total}"

        # Aggressive should have more stocks than bonds
        stock_weight = sum(weight for code, weight in allocation.items()
                          if get_asset_class(code) and get_asset_class(code).category == AssetClassCategory.EQUITY)
        bond_weight = sum(weight for code, weight in allocation.items()
                         if get_asset_class(code) and get_asset_class(code).category == AssetClassCategory.FIXED_INCOME)

        assert stock_weight > bond_weight, "Aggressive portfolio should have more stocks than bonds"
        assert stock_weight > 0.6, "Aggressive portfolio should have >60% stocks"

    def test_get_simple_allocation_with_alternatives(self):
        """Test allocation with alternatives"""
        allocation = get_simple_allocation(
            risk_tolerance=0.6,
            time_horizon=15,
            include_alternatives=True
        )

        # Should include REITs, commodities, or gold
        has_alternatives = any(code in ["US_REIT", "GOLD", "COMMODITY_BROAD"] for code in allocation.keys())
        assert has_alternatives, "Should include alternative assets when requested"


class TestCorrelationMatrix:
    """Test correlation matrix generation"""

    def test_correlation_matrix_dimensions(self):
        """Test correlation matrix has correct dimensions"""
        asset_codes = ["US_LC_BLEND", "US_TREASURY_INTER", "GOLD"]
        corr_matrix = get_default_correlation_matrix(asset_codes)

        assert len(corr_matrix) == 3
        assert all(len(row) == 3 for row in corr_matrix)

    def test_correlation_matrix_symmetry(self):
        """Test correlation matrix is symmetric"""
        asset_codes = ["US_LC_BLEND", "US_TREASURY_INTER", "GOLD", "US_REIT"]
        corr_matrix = get_default_correlation_matrix(asset_codes)

        for i in range(len(corr_matrix)):
            for j in range(len(corr_matrix)):
                assert abs(corr_matrix[i][j] - corr_matrix[j][i]) < 0.001, \
                    f"Matrix should be symmetric: [{i}][{j}] != [{j}][{i}]"

    def test_correlation_matrix_diagonal(self):
        """Test correlation matrix diagonal is 1.0"""
        asset_codes = ["US_LC_BLEND", "US_TREASURY_INTER", "GOLD"]
        corr_matrix = get_default_correlation_matrix(asset_codes)

        for i in range(len(corr_matrix)):
            assert abs(corr_matrix[i][i] - 1.0) < 0.001, \
                f"Diagonal should be 1.0, got {corr_matrix[i][i]}"

    def test_correlation_values_in_range(self):
        """Test correlation values are between -1 and 1"""
        asset_codes = list(ASSET_CLASS_LIBRARY.keys())[:10]
        corr_matrix = get_default_correlation_matrix(asset_codes)

        for row in corr_matrix:
            for value in row:
                assert -1.0 <= value <= 1.0, f"Correlation {value} out of range"

    def test_equity_equity_correlation(self):
        """Test equity-equity correlations are reasonable"""
        # Two equity assets should have positive correlation
        asset_codes = ["US_LC_BLEND", "US_MC_BLEND"]
        corr_matrix = get_default_correlation_matrix(asset_codes)

        # Correlation between two US equities should be high (0.6-0.9)
        equity_corr = corr_matrix[0][1]
        assert 0.5 < equity_corr < 0.95, \
            f"Equity-equity correlation {equity_corr} seems unreasonable"

    def test_equity_bond_correlation(self):
        """Test equity-bond correlations are low"""
        asset_codes = ["US_LC_BLEND", "US_TREASURY_INTER"]
        corr_matrix = get_default_correlation_matrix(asset_codes)

        # Correlation between equity and bonds should be low (-0.2 to 0.3)
        equity_bond_corr = corr_matrix[0][1]
        assert -0.3 < equity_bond_corr < 0.4, \
            f"Equity-bond correlation {equity_bond_corr} seems unreasonable"


class TestAssetClassSpecifics:
    """Test specific asset class characteristics"""

    def test_us_large_cap_blend(self):
        """Test US Large Cap Blend asset"""
        asset = get_asset_class("US_LC_BLEND")
        assert asset is not None
        assert asset.category == AssetClassCategory.EQUITY
        assert 0.07 < asset.expected_return < 0.12  # 7-12% expected return
        assert 0.12 < asset.volatility < 0.20  # 12-20% volatility
        assert asset.tax_efficiency > 0.80  # Should be tax-efficient
        assert asset.benchmark_ticker == "VOO"

    def test_treasury_bonds(self):
        """Test Treasury bond characteristics"""
        asset = get_asset_class("US_TREASURY_INTER")
        assert asset is not None
        assert asset.category == AssetClassCategory.FIXED_INCOME
        assert asset.expected_return < 0.06  # Low return
        assert asset.volatility < 0.10  # Low volatility
        assert asset.expected_return < asset.volatility * 2  # Conservative risk/return

    def test_gold_characteristics(self):
        """Test gold asset characteristics"""
        asset = get_asset_class("GOLD")
        assert asset is not None
        assert asset.category == AssetClassCategory.COMMODITY
        assert asset.benchmark_ticker == "GLD"
        assert 0.01 < asset.expected_return < 0.06  # Low expected return
        assert 0.12 < asset.volatility < 0.20  # Moderate volatility

    def test_municipal_bonds_tax_exempt(self):
        """Test municipal bonds have high tax efficiency"""
        muni_codes = ["MUNI_SHORT", "MUNI_INTER", "MUNI_LONG"]

        for code in muni_codes:
            asset = get_asset_class(code)
            if asset:
                assert asset.tax_efficiency == 1.0, \
                    f"{code} should be fully tax-exempt (1.0), got {asset.tax_efficiency}"

    def test_reit_characteristics(self):
        """Test REIT characteristics"""
        asset = get_asset_class("US_REIT")
        assert asset is not None
        assert asset.category == AssetClassCategory.REAL_ESTATE
        assert asset.tax_efficiency < 0.60  # REITs are tax-inefficient
        assert asset.expected_return > 0.05  # Should have reasonable return


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_empty_allocation_request(self):
        """Test allocation with extreme parameters"""
        # Zero risk tolerance
        allocation = get_simple_allocation(risk_tolerance=0.0, time_horizon=1)
        total = sum(allocation.values())
        assert abs(total - 1.0) < 0.01

    def test_maximum_risk_tolerance(self):
        """Test allocation with maximum risk"""
        allocation = get_simple_allocation(risk_tolerance=1.0, time_horizon=50)
        total = sum(allocation.values())
        assert abs(total - 1.0) < 0.01

    def test_correlation_matrix_single_asset(self):
        """Test correlation matrix with single asset"""
        corr_matrix = get_default_correlation_matrix(["US_LC_BLEND"])
        assert len(corr_matrix) == 1
        assert corr_matrix[0][0] == 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
