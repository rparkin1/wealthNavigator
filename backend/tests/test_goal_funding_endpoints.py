"""
Goal Funding API Endpoints Tests

REQ-GOAL-007: Goal funding endpoint integration tests
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestGoalFundingEndpoints:
    """Test suite for Goal Funding API endpoints"""

    @pytest.fixture
    def auth_headers(self):
        """Mock authentication headers"""
        # TODO: Replace with actual authentication
        return {"Authorization": "Bearer test_token"}

    @pytest.fixture
    def funding_requirements_request(self):
        """Sample funding requirements request"""
        return {
            "target_amount": 500000,
            "current_amount": 50000,
            "years_to_goal": 20,
            "expected_return": 0.07,
            "inflation_rate": 0.03,
        }

    @pytest.fixture
    def success_probability_request(self):
        """Sample success probability request"""
        return {
            "target_amount": 500000,
            "current_amount": 50000,
            "monthly_contribution": 1500,
            "years_to_goal": 20,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "iterations": 5000,
        }

    def test_calculate_funding_requirements_success(
        self, auth_headers, funding_requirements_request
    ):
        """Test successful funding requirements calculation"""
        response = client.post(
            "/api/v1/goal-funding/calculate-funding-requirements",
            json=funding_requirements_request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "required_monthly_savings" in data
        assert "required_annual_savings" in data
        assert "lump_sum_needed_today" in data
        assert "inflation_adjusted_target" in data
        assert "funding_progress_percent" in data

        # Verify data types and ranges
        assert isinstance(data["required_monthly_savings"], (int, float))
        assert isinstance(data["funding_progress_percent"], (int, float))
        assert 0 <= data["funding_progress_percent"] <= 100

    def test_calculate_funding_requirements_validation(self, auth_headers):
        """Test input validation for funding requirements"""
        # Test negative target amount
        response = client.post(
            "/api/v1/goal-funding/calculate-funding-requirements",
            json={
                "target_amount": -1000,
                "current_amount": 0,
                "years_to_goal": 10,
            },
            headers=auth_headers,
        )
        assert response.status_code == 422  # Validation error

        # Test zero years to goal
        response = client.post(
            "/api/v1/goal-funding/calculate-funding-requirements",
            json={
                "target_amount": 100000,
                "current_amount": 0,
                "years_to_goal": 0,
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_calculate_success_probability_success(
        self, auth_headers, success_probability_request
    ):
        """Test successful success probability calculation"""
        response = client.post(
            "/api/v1/goal-funding/calculate-success-probability",
            json=success_probability_request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "success_probability" in data
        assert "expected_final_amount" in data
        assert "median_outcome" in data
        assert "percentile_10th" in data
        assert "percentile_90th" in data
        assert "shortfall_risk" in data
        assert "iterations_run" in data

        # Verify probability is valid
        assert 0 <= data["success_probability"] <= 1
        assert 0 <= data["shortfall_risk"] <= 1
        assert data["success_probability"] + data["shortfall_risk"] == pytest.approx(1.0, abs=0.01)
        assert data["iterations_run"] == success_probability_request["iterations"]

    def test_required_savings_for_probability(self, auth_headers):
        """Test required savings for target probability calculation"""
        request = {
            "target_amount": 500000,
            "current_amount": 50000,
            "years_to_goal": 20,
            "target_probability": 0.90,
            "expected_return": 0.07,
            "return_volatility": 0.15,
        }

        response = client.post(
            "/api/v1/goal-funding/required-savings-for-probability",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert "required_monthly_savings" in data
        assert "required_annual_savings" in data
        assert "target_probability" in data
        assert data["target_probability"] == 0.90
        assert data["required_monthly_savings"] > 0

    def test_optimize_contribution_timeline_achievable(self, auth_headers):
        """Test timeline optimization when goal is achievable"""
        request = {
            "target_amount": 300000,
            "current_amount": 50000,
            "years_to_goal": 20,
            "max_monthly_contribution": 1500,
            "expected_return": 0.07,
        }

        response = client.post(
            "/api/v1/goal-funding/optimize-contribution-timeline",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert "is_achievable" in data
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)

        if data["is_achievable"]:
            assert "optimal_monthly_contribution" in data
            assert data["optimal_monthly_contribution"] <= request["max_monthly_contribution"]

    def test_optimize_contribution_timeline_not_achievable(self, auth_headers):
        """Test timeline optimization when goal is not achievable"""
        request = {
            "target_amount": 1000000,
            "current_amount": 10000,
            "years_to_goal": 5,
            "max_monthly_contribution": 500,
            "expected_return": 0.07,
        }

        response = client.post(
            "/api/v1/goal-funding/optimize-contribution-timeline",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert data["is_achievable"] is False
        assert "years_extension_needed" in data or "shortfall_with_original_timeline" in data
        assert len(data["recommendations"]) > 0

    def test_calculate_catch_up_strategy_behind_schedule(self, auth_headers):
        """Test catch-up strategy when behind schedule"""
        request = {
            "target_amount": 500000,
            "current_amount": 100000,
            "years_remaining": 15,
            "years_behind_schedule": 5,
            "expected_return": 0.07,
        }

        response = client.post(
            "/api/v1/goal-funding/calculate-catch-up-strategy",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        assert "is_behind_schedule" in data
        assert "shortfall" in data
        assert "required_monthly_to_catch_up" in data
        assert "is_feasible" in data
        assert "recommendations" in data

        if data["is_behind_schedule"]:
            assert data["shortfall"] > 0

    def test_comprehensive_funding_analysis(self, auth_headers):
        """Test comprehensive funding analysis"""
        params = {
            "target_amount": 500000,
            "current_amount": 50000,
            "monthly_contribution": 1500,
            "years_to_goal": 20,
            "expected_return": 0.07,
            "return_volatility": 0.15,
        }

        response = client.post(
            f"/api/v1/goal-funding/comprehensive-analysis?"
            f"target_amount={params['target_amount']}&"
            f"current_amount={params['current_amount']}&"
            f"monthly_contribution={params['monthly_contribution']}&"
            f"years_to_goal={params['years_to_goal']}&"
            f"expected_return={params['expected_return']}&"
            f"return_volatility={params['return_volatility']}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Verify comprehensive structure
        assert "status" in data
        assert data["status"] in ["on_track", "fair", "at_risk"]
        assert "message" in data
        assert "funding_requirements" in data
        assert "current_success_probability" in data
        assert "required_for_90_percent" in data
        assert "monthly_contribution_gap" in data
        assert "recommendations" in data

        # Verify nested structures
        assert "required_monthly_savings" in data["funding_requirements"]
        assert "success_probability" in data["current_success_probability"]
        assert "current_trajectory" in data["recommendations"]
        assert "alternative_strategies" in data["recommendations"]

    def test_get_calculator_info(self):
        """Test calculator information endpoint"""
        response = client.get("/api/v1/goal-funding/funding-calculator-info")

        assert response.status_code == 200
        data = response.json()

        assert "methodologies" in data
        assert "formulas" in data
        assert "assumptions" in data
        assert "monte_carlo_details" in data
        assert "limitations" in data
        assert "recommendations" in data

        # Verify monte carlo details
        assert data["monte_carlo_details"]["default_iterations"] == 5000
        assert data["monte_carlo_details"]["min_iterations"] == 1000
        assert data["monte_carlo_details"]["max_iterations"] == 10000

    def test_monte_carlo_iterations_range(self, auth_headers):
        """Test Monte Carlo iterations validation"""
        # Test below minimum
        request = {
            "target_amount": 500000,
            "current_amount": 50000,
            "monthly_contribution": 1500,
            "years_to_goal": 20,
            "iterations": 500,  # Below minimum of 1000
        }
        response = client.post(
            "/api/v1/goal-funding/calculate-success-probability",
            json=request,
            headers=auth_headers,
        )
        assert response.status_code == 422

        # Test above maximum
        request["iterations"] = 15000  # Above maximum of 10000
        response = client.post(
            "/api/v1/goal-funding/calculate-success-probability",
            json=request,
            headers=auth_headers,
        )
        assert response.status_code == 422

    def test_edge_case_zero_current_amount(self, auth_headers):
        """Test with zero current amount"""
        request = {
            "target_amount": 100000,
            "current_amount": 0,
            "years_to_goal": 10,
        }

        response = client.post(
            "/api/v1/goal-funding/calculate-funding-requirements",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["funding_progress_percent"] == 0

    def test_edge_case_goal_already_met(self, auth_headers):
        """Test when goal is already met"""
        request = {
            "target_amount": 100000,
            "current_amount": 150000,
            "years_to_goal": 10,
        }

        response = client.post(
            "/api/v1/goal-funding/calculate-funding-requirements",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["required_monthly_savings"] == 0 or data["required_monthly_savings"] < 0

    @pytest.mark.parametrize("return_rate", [0.05, 0.07, 0.10, 0.15])
    def test_different_return_rates(self, auth_headers, return_rate):
        """Test with different expected return rates"""
        request = {
            "target_amount": 500000,
            "current_amount": 50000,
            "years_to_goal": 20,
            "expected_return": return_rate,
        }

        response = client.post(
            "/api/v1/goal-funding/calculate-funding-requirements",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["required_monthly_savings"] > 0

    @pytest.mark.parametrize("timeline", [5, 10, 20, 30])
    def test_different_timelines(self, auth_headers, timeline):
        """Test with different time horizons"""
        request = {
            "target_amount": 500000,
            "current_amount": 50000,
            "years_to_goal": timeline,
        }

        response = client.post(
            "/api/v1/goal-funding/calculate-funding-requirements",
            json=request,
            headers=auth_headers,
        )

        assert response.status_code == 200
        # Longer timelines should generally require less monthly savings (more time for growth)


class TestGoalFundingPerformance:
    """Performance tests for goal funding calculations"""

    def test_monte_carlo_performance(self, auth_headers):
        """Test that Monte Carlo simulation completes within acceptable time"""
        import time

        request = {
            "target_amount": 500000,
            "current_amount": 50000,
            "monthly_contribution": 1500,
            "years_to_goal": 20,
            "iterations": 5000,
        }

        start_time = time.time()
        response = client.post(
            "/api/v1/goal-funding/calculate-success-probability",
            json=request,
            headers=auth_headers,
        )
        end_time = time.time()

        assert response.status_code == 200
        # Should complete in less than 30 seconds (per requirements)
        assert (end_time - start_time) < 30

    def test_comprehensive_analysis_performance(self, auth_headers):
        """Test comprehensive analysis performance"""
        import time

        start_time = time.time()
        response = client.post(
            "/api/v1/goal-funding/comprehensive-analysis?"
            "target_amount=500000&current_amount=50000&"
            "monthly_contribution=1500&years_to_goal=20",
            headers=auth_headers,
        )
        end_time = time.time()

        assert response.status_code == 200
        # Should complete in reasonable time
        assert (end_time - start_time) < 60  # 60 seconds max
