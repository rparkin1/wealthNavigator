"""
Integration tests for Education Funding module.

Tests REQ-GOAL-013 and REQ-GOAL-014 implementation.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.education_funding_service import EducationFundingService


class TestEducationFundingIntegration:
    """Integration tests for education funding features."""

    @pytest.mark.asyncio
    async def test_calculate_education_cost(
        self,
        authenticated_client: AsyncClient
    ):
        """Test education cost calculation endpoint."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/calculate-cost",
            json={
                "education_type": "private",
                "years_until_college": 10,
                "years_of_support": 4
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "tuition" in data
        assert "total_annual" in data
        assert data["total_annual"] > 0
        assert data["education_type"] == "private"

    @pytest.mark.asyncio
    async def test_calculate_total_need(
        self,
        authenticated_client: AsyncClient
    ):
        """Test total education need calculation."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/total-need",
            json={
                "education_type": "public_in_state",
                "child_age": 5,
                "college_start_age": 18,
                "years_of_support": 4
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_need" in data
        assert "annual_costs" in data
        assert len(data["annual_costs"]) == 4
        assert data["total_need"] > 0

    @pytest.mark.asyncio
    async def test_529_strategy_calculation(
        self,
        authenticated_client: AsyncClient
    ):
        """Test 529 plan strategy calculation."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/529-strategy",
            json={
                "target_amount": 200000,
                "current_savings": 10000,
                "years_until_college": 10,
                "expected_return": 0.06,
                "state_tax_deduction": 0.05
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "monthly_contribution" in data
        assert "annual_contribution" in data
        assert "tax_savings" in data
        assert "recommendation" in data
        assert data["monthly_contribution"] > 0
        assert data["tax_savings"] >= 0

    @pytest.mark.asyncio
    async def test_financial_aid_estimation(
        self,
        authenticated_client: AsyncClient
    ):
        """Test financial aid estimation."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/financial-aid",
            json={
                "parent_income": 120000,
                "parent_assets": 250000,
                "student_assets": 5000,
                "num_children": 1
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "expected_family_contribution" in data
        assert "estimated_need_based_aid" in data
        assert "recommendation" in data
        assert data["expected_family_contribution"] > 0

    @pytest.mark.asyncio
    async def test_multi_child_optimization(
        self,
        authenticated_client: AsyncClient
    ):
        """Test multi-child funding optimization."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/optimize-multi-child",
            json={
                "children": [
                    {
                        "name": "Emma",
                        "age": 10,
                        "education_type": "public_in_state",
                        "years_of_support": 4
                    },
                    {
                        "name": "Liam",
                        "age": 7,
                        "education_type": "private",
                        "years_of_support": 4
                    }
                ],
                "total_monthly_savings": 2000.0
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "allocations" in data
        assert "children_data" in data
        assert "Emma" in data["allocations"]
        assert "Liam" in data["allocations"]
        assert len(data["children_data"]) == 2
        # Check allocation sums to total
        total = sum(data["allocations"].values())
        assert abs(total - 2000.0) < 0.01

    @pytest.mark.asyncio
    async def test_education_timeline(
        self,
        authenticated_client: AsyncClient
    ):
        """Test education timeline generation."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/timeline",
            json=[
                {
                    "name": "Emma",
                    "age": 10,
                    "education_type": "public_in_state",
                    "years_of_support": 4
                },
                {
                    "name": "Liam",
                    "age": 7,
                    "education_type": "private",
                    "years_of_support": 4
                }
            ],
        )

        assert response.status_code == 200
        data = response.json()
        assert "timeline" in data
        assert len(data["timeline"]) == 2
        # Check timeline is sorted by college start year
        years = [event["college_start_year"] for event in data["timeline"]]
        assert years == sorted(years)

    @pytest.mark.asyncio
    async def test_savings_vehicle_recommendation(
        self,
        authenticated_client: AsyncClient
    ):
        """Test savings vehicle recommendation."""
        # Test for long time horizon (529 recommended)
        response = await authenticated_client.post(
            "/api/v1/education-funding/savings-vehicle",
            json={"years_until_college": 12, "state": "CA"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "vehicle" in data
        assert "pros" in data
        assert "cons" in data
        assert "529 Plan" in data["vehicle"]

        # Test for short time horizon (savings recommended)
        response = await authenticated_client.post(
            "/api/v1/education-funding/savings-vehicle",
            json={"years_until_college": 2},
        )

        assert response.status_code == 200
        data = response.json()
        assert "Savings" in data["vehicle"] or "CD" in data["vehicle"]

    @pytest.mark.asyncio
    async def test_grandparent_coordination(
        self,
        authenticated_client: AsyncClient
    ):
        """Test grandparent contribution coordination."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/coordinate-grandparents",
            json={
                "child_name": "Emma",
                "parent_monthly_contribution": 500.0,
                "grandparent_annual_contribution": 10000.0,
                "target_amount": 200000.0,
                "current_savings": 15000.0,
                "years_until_college": 10,
                "expected_return": 0.06
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "strategy" in data
        assert "parent_future_value" in data
        assert "grandparent_future_value" in data
        assert "total_projected" in data
        assert "tax_tips" in data
        assert "fafsa_consideration" in data
        assert data["total_projected"] > 0

    @pytest.mark.asyncio
    async def test_multi_child_with_grandparents(
        self,
        authenticated_client: AsyncClient
    ):
        """Test multi-child optimization with grandparent contributions."""
        response = await authenticated_client.post(
            "/api/v1/education-funding/optimize-multi-child-grandparents",
            json={
                "children": [
                    {
                        "name": "Emma",
                        "age": 10,
                        "education_type": "public_in_state",
                        "years_of_support": 4
                    },
                    {
                        "name": "Liam",
                        "age": 7,
                        "education_type": "private",
                        "years_of_support": 4
                    }
                ],
                "parent_monthly_savings": 2000.0,
                "grandparent_annual_budget": 20000.0
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "parent_allocations" in data
        assert "grandparent_allocations" in data
        assert "combined_analysis" in data
        assert len(data["combined_analysis"]) == 2
        assert data["total_parent_monthly"] == 2000.0
        assert data["total_grandparent_annual"] == 20000.0


class TestEducationFundingService:
    """Unit tests for education funding service methods."""

    def test_education_cost_calculation(self):
        """Test education cost calculation logic."""
        cost = EducationFundingService.calculate_education_cost(
            education_type="private",
            years_until_college=10,
            years_of_support=1
        )

        assert cost.tuition > 0
        assert cost.total_annual > 0
        # Check inflation adjustment
        assert cost.tuition > 41540  # Should be higher than base due to inflation

    def test_total_need_calculation(self):
        """Test total education need calculation."""
        total = EducationFundingService.calculate_total_education_need(
            education_type="public_in_state",
            child_age=5,
            college_start_age=18,
            years_of_support=4
        )

        assert total > 0
        # Should account for 4 years with increasing costs
        assert total > 100000  # Reasonable minimum for 4 years

    def test_529_strategy_with_current_savings(self):
        """Test 529 strategy with existing savings."""
        strategy = EducationFundingService.calculate_529_strategy(
            target_amount=200000,
            current_savings=50000,
            years_until_college=10,
            expected_return=0.06,
            state_tax_deduction=0.05
        )

        assert strategy["monthly_contribution"] > 0
        assert strategy["tax_savings"] > 0
        assert strategy["projected_balance"] >= 200000

    def test_529_strategy_sufficient_savings(self):
        """Test 529 strategy when savings already sufficient."""
        strategy = EducationFundingService.calculate_529_strategy(
            target_amount=100000,
            current_savings=150000,
            years_until_college=10,
            expected_return=0.06,
            state_tax_deduction=0.05
        )

        assert strategy["monthly_contribution"] == 0
        assert "sufficient" in strategy["recommendation"].lower()

    def test_financial_aid_calculation(self):
        """Test financial aid impact calculation."""
        aid = EducationFundingService.calculate_financial_aid_impact(
            parent_income=80000,
            parent_assets=100000,
            student_assets=5000,
            num_children=1
        )

        assert aid["expected_family_contribution"] > 0
        assert aid["estimated_need_based_aid"] >= 0
        assert "recommendation" in aid

    def test_multi_child_optimization(self):
        """Test multi-child optimization logic."""
        children = [
            {
                "name": "Emma",
                "age": 15,  # Urgent - 3 years to college
                "education_type": "public_in_state",
                "years_of_support": 4
            },
            {
                "name": "Liam",
                "age": 10,  # Less urgent - 8 years
                "education_type": "public_in_state",
                "years_of_support": 4
            }
        ]

        allocations = EducationFundingService.optimize_multi_child_funding(
            children=children,
            total_monthly_savings=1000
        )

        assert len(allocations) == 2
        # Emma (more urgent) should get more allocation
        assert allocations["Emma"] > allocations["Liam"]
        # Total should equal budget
        assert abs(sum(allocations.values()) - 1000) < 0.01

    def test_grandparent_coordination(self):
        """Test grandparent contribution coordination."""
        strategy = EducationFundingService.coordinate_grandparent_contributions(
            child_name="Emma",
            parent_monthly_contribution=500,
            grandparent_annual_contribution=15000,
            target_amount=200000,
            current_savings=20000,
            years_until_college=10,
            expected_return=0.06
        )

        assert strategy["parent_future_value"] > 0
        assert strategy["grandparent_future_value"] > 0
        assert strategy["total_projected"] > 0
        assert "tax_tips" in strategy
        assert isinstance(strategy["tax_tips"], list)
        assert strategy["fafsa_consideration"] is not None

    def test_grandparent_gift_tax_considerations(self):
        """Test gift tax warnings for grandparent contributions."""
        # Test contribution above annual exclusion
        strategy = EducationFundingService.coordinate_grandparent_contributions(
            child_name="Emma",
            parent_monthly_contribution=500,
            grandparent_annual_contribution=25000,  # Above $18,000 limit
            target_amount=200000,
            current_savings=0,
            years_until_college=10
        )

        assert not strategy["gift_tax_free"]
        assert len(strategy["tax_tips"]) > 0
        assert any("gift tax" in tip.lower() for tip in strategy["tax_tips"])

    def test_multi_child_with_grandparents(self):
        """Test combined parent and grandparent optimization."""
        children = [
            {
                "name": "Emma",
                "age": 12,
                "education_type": "private",
                "years_of_support": 4
            },
            {
                "name": "Liam",
                "age": 8,
                "education_type": "public_in_state",
                "years_of_support": 4
            }
        ]

        strategy = EducationFundingService.optimize_multi_child_with_grandparents(
            children=children,
            parent_monthly_savings=1500,
            grandparent_annual_budget=30000
        )

        assert "parent_allocations" in strategy
        assert "grandparent_allocations" in strategy
        assert "combined_analysis" in strategy
        assert len(strategy["combined_analysis"]) == 2
        assert strategy["total_parent_monthly"] == 1500
        assert strategy["total_grandparent_annual"] == 30000

    def test_education_timeline_ordering(self):
        """Test education timeline is properly ordered."""
        children = [
            {
                "name": "Liam",
                "age": 10,
                "education_type": "public_in_state",
                "years_of_support": 4
            },
            {
                "name": "Emma",
                "age": 15,
                "education_type": "private",
                "years_of_support": 4
            }
        ]

        timeline = EducationFundingService.calculate_education_timeline(children)

        assert len(timeline) == 2
        # Should be ordered by college start year
        assert timeline[0]["child_name"] == "Emma"  # Older child first
        assert timeline[1]["child_name"] == "Liam"
        assert timeline[0]["college_start_year"] < timeline[1]["college_start_year"]
