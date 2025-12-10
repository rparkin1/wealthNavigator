"""
Integration tests for Portfolio Optimization API
Tests all 11 endpoints with realistic scenarios
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAssetClassEndpoints:
    """Test asset class endpoints"""

    def test_get_all_asset_classes(self):
        """Test GET /portfolio-optimization/asset-classes"""
        response = client.get("/api/v1/portfolio-optimization/asset-classes")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 45  # Should have 45+ asset classes

        # Check structure
        if data:
            asset = data[0]
            assert "code" in asset
            assert "name" in asset
            assert "category" in asset
            assert "expected_return" in asset
            assert "volatility" in asset

    def test_get_asset_classes_filtered_by_category(self):
        """Test filtering asset classes by category"""
        response = client.get("/api/v1/portfolio-optimization/asset-classes?category=equity")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # All should be equity
        assert all(asset["category"] == "equity" for asset in data)

    def test_get_asset_class_detail(self):
        """Test GET /portfolio-optimization/asset-classes/{asset_code}"""
        response = client.get("/api/v1/portfolio-optimization/asset-classes/US_LC_BLEND")

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "US_LC_BLEND"
        assert data["name"] == "US Large Cap Blend"
        assert data["category"] == "equity"
        assert data["benchmark_ticker"] == "VOO"

    def test_get_asset_class_not_found(self):
        """Test getting non-existent asset class"""
        response = client.get("/api/v1/portfolio-optimization/asset-classes/INVALID_CODE")

        assert response.status_code == 404


class TestSimpleAllocation:
    """Test simple allocation endpoint"""

    def test_simple_allocation_conservative(self):
        """Test POST /portfolio-optimization/simple-allocation (conservative)"""
        response = client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": 0.2,
                "time_horizon": 5,
                "include_alternatives": False
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "allocation" in data
        assert "expected_return" in data
        assert "expected_volatility" in data
        assert "sharpe_ratio" in data
        assert "risk_level" in data

        # Check allocation sums to ~1.0
        total = sum(data["allocation"].values())
        assert abs(total - 1.0) < 0.01

        # Conservative should have "conservative" risk level
        assert data["risk_level"] == "conservative"

    def test_simple_allocation_aggressive(self):
        """Test aggressive allocation"""
        response = client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": 0.9,
                "time_horizon": 30,
                "include_alternatives": False
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["risk_level"] == "aggressive"

        # Aggressive should have higher expected return and volatility
        assert data["expected_return"] > 0.06
        assert data["expected_volatility"] > 0.10

    def test_simple_allocation_with_alternatives(self):
        """Test allocation with alternatives"""
        response = client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": 0.6,
                "time_horizon": 15,
                "include_alternatives": True
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Should include alternative assets
        allocation = data["allocation"]
        has_alternatives = any(code in ["US_REIT", "GOLD", "COMMODITY_BROAD"]
                             for code in allocation.keys())
        assert has_alternatives, "Should include alternative assets"


class TestMultiLevelOptimization:
    """Test multi-level optimization endpoint"""

    def test_multi_level_optimization_basic(self):
        """Test POST /portfolio-optimization/multi-level-optimization"""
        request_data = {
            "accounts": [
                {
                    "id": "acc1",
                    "name": "401k",
                    "type": "tax_deferred",
                    "balance": 150000,
                    "current_holdings": {}
                },
                {
                    "id": "acc2",
                    "name": "Roth IRA",
                    "type": "tax_exempt",
                    "balance": 75000,
                    "current_holdings": {}
                },
                {
                    "id": "acc3",
                    "name": "Taxable",
                    "type": "taxable",
                    "balance": 50000,
                    "current_holdings": {}
                }
            ],
            "goals": [
                {
                    "id": "goal1",
                    "name": "Retirement",
                    "target_amount": 2000000,
                    "current_amount": 275000,
                    "years_to_goal": 20,
                    "priority": "essential",
                    "risk_tolerance": 0.6,
                    "success_threshold": 0.85
                }
            ],
            "asset_codes": ["US_LC_BLEND", "INTL_DEV_BLEND", "US_TREASURY_INTER", "US_CORP_IG", "CASH"],
            "use_esg_screening": False
        }

        response = client.post(
            "/api/v1/portfolio-optimization/multi-level-optimization",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "optimization_level" in data
        assert "total_value" in data
        assert "expected_return" in data
        assert "expected_volatility" in data
        assert "sharpe_ratio" in data
        assert "goal_allocations" in data
        assert "account_allocations" in data
        assert "household_allocation" in data
        assert "tax_metrics" in data
        assert "recommendations" in data

        # Verify calculations
        assert data["total_value"] == 275000
        assert 0.02 < data["expected_return"] < 0.15
        assert 0.01 < data["expected_volatility"] < 0.30

        # Check tax metrics
        assert "estimated_tax_drag" in data["tax_metrics"]
        assert "asset_location_efficiency" in data["tax_metrics"]

    def test_multi_level_optimization_with_esg(self):
        """Test optimization with ESG screening"""
        request_data = {
            "accounts": [
                {"id": "acc1", "name": "401k", "type": "tax_deferred", "balance": 100000, "current_holdings": {}}
            ],
            "goals": [
                {
                    "id": "goal1",
                    "name": "Retirement",
                    "target_amount": 1000000,
                    "current_amount": 100000,
                    "years_to_goal": 20,
                    "priority": "essential",
                    "risk_tolerance": 0.6,
                    "success_threshold": 0.85
                }
            ],
            "asset_codes": [],  # Use defaults
            "use_esg_screening": True,
            "esg_preset": "moderate"
        }

        response = client.post(
            "/api/v1/portfolio-optimization/multi-level-optimization",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()
        assert "household_allocation" in data


class TestESGScreening:
    """Test ESG screening endpoints"""

    def test_esg_screening_basic(self):
        """Test POST /portfolio-optimization/esg-screening"""
        request_data = {
            "asset_codes": ["US_LC_BLEND", "US_ESG", "ENERGY", "INTL_DEV_BLEND", "GREEN_BOND"],
            "exclusions": ["fossil_fuels", "tobacco"],
            "required_criteria": [],
            "minimum_esg_rating": "average",
            "allow_not_rated": True
        }

        response = client.post(
            "/api/v1/portfolio-optimization/esg-screening",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        assert "eligible_assets" in data
        assert "excluded_assets" in data
        assert "portfolio_esg_score" in data
        assert "recommendations" in data
        assert "summary" in data

        # ENERGY should be excluded (fossil fuels)
        assert "ENERGY" not in data["eligible_assets"]
        assert "ENERGY" in data["excluded_assets"]

    def test_esg_screening_conservative(self):
        """Test screening with conservative preset"""
        request_data = {
            "asset_codes": ["US_ESG", "US_LC_BLEND", "ENERGY", "GREEN_BOND"],
            "exclusions": ["fossil_fuels", "tobacco", "weapons", "gambling"],
            "required_criteria": [],
            "minimum_esg_rating": "leader",
            "minimum_overall_score": 75,
            "allow_not_rated": False
        }

        response = client.post(
            "/api/v1/portfolio-optimization/esg-screening",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        # Strict criteria should exclude many assets
        assert len(data["excluded_assets"]) > 0

    def test_get_esg_presets(self):
        """Test GET /portfolio-optimization/esg-presets"""
        response = client.get("/api/v1/portfolio-optimization/esg-presets")

        assert response.status_code == 200
        data = response.json()

        assert "presets" in data
        presets = data["presets"]
        assert len(presets) == 4  # conservative, moderate, light, none

        # Check preset structure
        preset_names = [p["name"] for p in presets]
        assert "conservative" in preset_names
        assert "moderate" in preset_names
        assert "light" in preset_names
        assert "none" in preset_names


class TestInsightsAndAlerts:
    """Test insights and alerts endpoints"""

    def test_generate_insights(self):
        """Test POST /portfolio-optimization/insights"""
        request_data = {
            "portfolio_allocation": {
                "US_LC_BLEND": 0.50,
                "US_TREASURY_INTER": 0.30,
                "US_CORP_IG": 0.20
            },
            "performance_metrics": {
                "total_return_1y": 0.10,
                "sharpe_ratio_1y": 0.85,
                "vs_benchmark_1y": 0.02
            }
        }

        response = client.post(
            "/api/v1/portfolio-optimization/insights",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        if data:
            insight = data[0]
            assert "category" in insight
            assert "title" in insight
            assert "description" in insight
            assert "impact" in insight
            assert "confidence" in insight

    def test_generate_alerts(self):
        """Test POST /portfolio-optimization/alerts"""
        request_data = {
            "portfolio_allocation": {
                "US_LC_BLEND": 0.45,
                "US_TREASURY_INTER": 0.55
            },
            "target_allocation": {
                "US_LC_BLEND": 0.60,  # 15% drift
                "US_TREASURY_INTER": 0.40
            },
            "performance_metrics": {
                "total_return_1y": 0.08,
                "vs_benchmark_1y": -0.03
            }
        }

        response = client.post(
            "/api/v1/portfolio-optimization/alerts",
            json=request_data
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        if data:
            alert = data[0]
            assert "type" in alert
            assert "severity" in alert
            assert "title" in alert
            assert "message" in alert
            assert "recommendation" in alert


class TestUtilityEndpoints:
    """Test utility endpoints"""

    def test_health_check(self):
        """Test GET /portfolio-optimization/health"""
        response = client.get("/api/v1/portfolio-optimization/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert "service" in data
        assert "asset_classes_available" in data
        assert data["asset_classes_available"] >= 45

    def test_service_summary(self):
        """Test GET /portfolio-optimization/summary"""
        response = client.get("/api/v1/portfolio-optimization/summary")

        assert response.status_code == 200
        data = response.json()

        assert "name" in data
        assert "version" in data
        assert "features" in data
        assert "api_endpoints" in data
        assert data["api_endpoints"] == 11  # Should have 11 endpoints


class TestErrorHandling:
    """Test error handling"""

    def test_invalid_risk_tolerance(self):
        """Test invalid risk tolerance value"""
        response = client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": 1.5,  # Invalid: > 1.0
                "time_horizon": 10
            }
        )

        assert response.status_code == 422  # Validation error

    def test_invalid_time_horizon(self):
        """Test invalid time horizon"""
        response = client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": 0.5,
                "time_horizon": 0  # Invalid: must be > 0
            }
        )

        assert response.status_code == 422  # Validation error

    def test_empty_accounts(self):
        """Test optimization with no accounts"""
        response = client.post(
            "/api/v1/portfolio-optimization/multi-level-optimization",
            json={
                "accounts": [],
                "goals": [
                    {
                        "id": "goal1",
                        "name": "Test",
                        "target_amount": 100000,
                        "current_amount": 0,
                        "years_to_goal": 10,
                        "priority": "important",
                        "risk_tolerance": 0.5,
                        "success_threshold": 0.85
                    }
                ]
            }
        )

        # Should handle gracefully (may be 400 or 200 depending on validation)
        assert response.status_code in [200, 400]


class TestRealWorldScenarios:
    """Test realistic user scenarios"""

    def test_young_aggressive_investor(self):
        """Test scenario: 30-year-old, aggressive, long time horizon"""
        # 1. Get simple allocation
        allocation_response = client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": 0.85,
                "time_horizon": 35,
                "include_alternatives": True
            }
        )

        assert allocation_response.status_code == 200
        allocation = allocation_response.json()

        # Should be mostly stocks
        stocks_weight = sum(weight for code, weight in allocation["allocation"].items()
                          if "STOCK" in code or "EQUITY" in code or "BLEND" in code)
        assert stocks_weight > 0.70, "Young aggressive investor should have >70% stocks"

        # 2. Get insights
        insights_response = client.post(
            "/api/v1/portfolio-optimization/insights",
            json={"portfolio_allocation": allocation["allocation"]}
        )

        assert insights_response.status_code == 200

    def test_near_retirement_conservative(self):
        """Test scenario: 60-year-old, retiring soon, conservative"""
        allocation_response = client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": 0.25,
                "time_horizon": 5,
                "include_alternatives": False
            }
        )

        assert allocation_response.status_code == 200
        allocation = allocation_response.json()

        # Should be mostly bonds
        stocks_weight = sum(weight for code, weight in allocation["allocation"].items()
                          if "STOCK" in code or "EQUITY" in code or "BLEND" in code)
        assert stocks_weight < 0.40, "Near-retirement conservative should have <40% stocks"

    def test_esg_conscious_investor(self):
        """Test scenario: ESG-conscious investor"""
        # 1. Screen assets
        screening_response = client.post(
            "/api/v1/portfolio-optimization/esg-screening",
            json={
                "asset_codes": ["US_LC_BLEND", "US_ESG", "ENERGY", "GREEN_BOND", "INTL_ESG"],
                "exclusions": ["fossil_fuels", "tobacco", "weapons"],
                "minimum_esg_rating": "average",
                "allow_not_rated": False
            }
        )

        assert screening_response.status_code == 200
        screening = screening_response.json()

        eligible_assets = screening["eligible_assets"]
        assert "ENERGY" not in eligible_assets
        assert len(eligible_assets) > 0

        # 2. Optimize with ESG assets only
        optimization_response = client.post(
            "/api/v1/portfolio-optimization/multi-level-optimization",
            json={
                "accounts": [
                    {"id": "acc1", "name": "IRA", "type": "tax_deferred", "balance": 100000, "current_holdings": {}}
                ],
                "goals": [
                    {
                        "id": "goal1",
                        "name": "Retirement",
                        "target_amount": 1000000,
                        "current_amount": 100000,
                        "years_to_goal": 25,
                        "priority": "essential",
                        "risk_tolerance": 0.6,
                        "success_threshold": 0.85
                    }
                ],
                "asset_codes": eligible_assets,
                "use_esg_screening": False
            }
        )

        assert optimization_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
