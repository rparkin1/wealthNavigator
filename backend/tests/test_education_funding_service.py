"""
Unit tests for Education Funding Service

Tests education cost calculations, 529 strategies, and multi-child optimization.
"""

import pytest
from app.services.education_funding_service import EducationFundingService


class TestEducationFundingService:
    """Test suite for EducationFundingService"""

    def test_calculate_education_cost_public_instate(self):
        """Test education cost calculation for public in-state"""
        cost = EducationFundingService.calculate_education_cost(
            education_type="public_in_state",
            years_until_college=0,
            years_of_support=4
        )

        # Should return current costs (no inflation)
        assert cost.tuition == 11250
        assert cost.room_and_board == 12770
        assert cost.books_and_supplies == 1250
        assert cost.other_expenses == 2540
        assert cost.total_annual > 0

    def test_calculate_education_cost_with_inflation(self):
        """Test education cost with inflation adjustment"""
        cost_now = EducationFundingService.calculate_education_cost(
            education_type="private",
            years_until_college=0,
            years_of_support=1
        )

        cost_10_years = EducationFundingService.calculate_education_cost(
            education_type="private",
            years_until_college=10,
            years_of_support=1
        )

        # Cost in 10 years should be higher due to 5.5% inflation
        assert cost_10_years.total_annual > cost_now.total_annual

        # Check inflation factor is approximately correct
        # (1.055^10 ≈ 1.708)
        inflation_factor = cost_10_years.total_annual / cost_now.total_annual
        assert 1.6 < inflation_factor < 1.8

    def test_calculate_total_education_need(self):
        """Test total education need calculation"""
        total = EducationFundingService.calculate_total_education_need(
            education_type="public_in_state",
            child_age=5,
            college_start_age=18,
            years_of_support=4
        )

        # Should be 4 years of costs
        assert total > 0
        # Rough estimate: 4 years * ~30k = ~120k (inflated)
        assert 100000 < total < 250000

    def test_calculate_529_strategy_sufficient_savings(self):
        """Test 529 strategy when current savings are sufficient"""
        strategy = EducationFundingService.calculate_529_strategy(
            target_amount=100000,
            current_savings=100000,
            years_until_college=10,
            expected_return=0.06
        )

        # Should not require additional contributions
        assert strategy["monthly_contribution"] == 0
        assert strategy["total_contributions"] == 0
        assert "sufficient" in strategy["recommendation"].lower()

    def test_calculate_529_strategy_normal_case(self):
        """Test 529 strategy with normal funding need"""
        strategy = EducationFundingService.calculate_529_strategy(
            target_amount=200000,
            current_savings=10000,
            years_until_college=10,
            expected_return=0.06,
            state_tax_deduction=0.05
        )

        # Should calculate monthly contribution
        assert strategy["monthly_contribution"] > 0
        assert strategy["annual_contribution"] > 0
        assert strategy["total_contributions"] > 0
        assert strategy["tax_savings"] > 0
        assert strategy["shortfall"] == 0

    def test_calculate_529_strategy_zero_years(self):
        """Test 529 strategy when college starts immediately"""
        strategy = EducationFundingService.calculate_529_strategy(
            target_amount=100000,
            current_savings=50000,
            years_until_college=0
        )

        # Should not recommend contributions
        assert strategy["monthly_contribution"] == 0
        assert "soon" in strategy["recommendation"].lower()

    def test_calculate_financial_aid_high_income(self):
        """Test financial aid calculation for high income family"""
        aid = EducationFundingService.calculate_financial_aid_impact(
            parent_income=200000,
            parent_assets=500000,
            student_assets=10000,
            num_children=1
        )

        # High income should result in high EFC, low aid
        assert aid["expected_family_contribution"] > 50000
        assert aid["estimated_need_based_aid"] == 0
        assert "minimal need" in aid["recommendation"].lower() or "full cost" in aid["recommendation"].lower()

    def test_calculate_financial_aid_low_income(self):
        """Test financial aid calculation for low income family"""
        aid = EducationFundingService.calculate_financial_aid_impact(
            parent_income=40000,
            parent_assets=20000,
            student_assets=1000,
            num_children=1
        )

        # Low income should result in lower EFC, potentially more aid
        assert aid["expected_family_contribution"] < 20000
        assert aid["parent_income_contribution"] < 10000

    def test_calculate_financial_aid_multiple_children(self):
        """Test financial aid calculation with multiple children"""
        aid_one_child = EducationFundingService.calculate_financial_aid_impact(
            parent_income=100000,
            parent_assets=150000,
            student_assets=5000,
            num_children=1
        )

        aid_two_children = EducationFundingService.calculate_financial_aid_impact(
            parent_income=100000,
            parent_assets=150000,
            student_assets=5000,
            num_children=2
        )

        # EFC should be split between children
        assert aid_two_children["expected_family_contribution"] < aid_one_child["expected_family_contribution"]
        assert aid_two_children["expected_family_contribution"] == pytest.approx(
            aid_one_child["expected_family_contribution"] / 2,
            rel=0.1
        )

    def test_optimize_multi_child_funding(self):
        """Test multi-child funding optimization"""
        children = [
            {"name": "Emma", "age": 15, "education_type": "public_in_state", "years_of_support": 4},
            {"name": "Liam", "age": 8, "education_type": "private", "years_of_support": 4},
            {"name": "Sophia", "age": 3, "education_type": "public_in_state", "years_of_support": 4}
        ]

        allocations = EducationFundingService.optimize_multi_child_funding(
            children=children,
            total_monthly_savings=2000
        )

        # Should allocate to all children
        assert "Emma" in allocations
        assert "Liam" in allocations
        assert "Sophia" in allocations

        # Emma (closest to college) should get highest allocation
        assert allocations["Emma"] > allocations["Liam"]
        assert allocations["Emma"] > allocations["Sophia"]

        # Total allocation should equal available savings
        total_allocated = sum(allocations.values())
        assert abs(total_allocated - 2000) < 0.01

    def test_calculate_education_timeline(self):
        """Test education timeline generation"""
        children = [
            {"name": "Emma", "age": 15, "education_type": "public_in_state", "years_of_support": 4},
            {"name": "Liam", "age": 10, "education_type": "private", "years_of_support": 4}
        ]

        timeline = EducationFundingService.calculate_education_timeline(children=children)

        # Should have entries for both children
        assert len(timeline) == 2

        # Timeline should be sorted by college start year
        assert timeline[0]["college_start_year"] <= timeline[1]["college_start_year"]

        # Emma should start college first
        emma_entry = next(e for e in timeline if e["child_name"] == "Emma")
        liam_entry = next(e for e in timeline if e["child_name"] == "Liam")
        assert emma_entry["years_until_college"] < liam_entry["years_until_college"]

    def test_suggest_savings_vehicle_long_horizon(self):
        """Test savings vehicle recommendation for long time horizon"""
        recommendation = EducationFundingService.suggest_savings_vehicle(
            years_until_college=12
        )

        # Should recommend 529 for long horizon
        assert recommendation["vehicle"] == "529 Plan"
        assert "tax-free" in recommendation["rationale"].lower()
        assert len(recommendation["pros"]) > 0
        assert len(recommendation["cons"]) > 0

    def test_suggest_savings_vehicle_medium_horizon(self):
        """Test savings vehicle recommendation for medium time horizon"""
        recommendation = EducationFundingService.suggest_savings_vehicle(
            years_until_college=7
        )

        # Should recommend mix for medium horizon
        assert "529" in recommendation["vehicle"]
        assert "Taxable" in recommendation["vehicle"]
        assert "flexibility" in recommendation["rationale"].lower()

    def test_suggest_savings_vehicle_short_horizon(self):
        """Test savings vehicle recommendation for short time horizon"""
        recommendation = EducationFundingService.suggest_savings_vehicle(
            years_until_college=2
        )

        # Should recommend conservative for short horizon
        assert "Savings" in recommendation["vehicle"] or "CD" in recommendation["vehicle"]
        assert "preserve" in recommendation["rationale"].lower()

    def test_education_costs_all_types(self):
        """Test that all education types have valid cost data"""
        education_types = [
            "public_in_state",
            "public_out_state",
            "private",
            "graduate_public",
            "graduate_private"
        ]

        for ed_type in education_types:
            cost = EducationFundingService.calculate_education_cost(
                education_type=ed_type,
                years_until_college=0,
                years_of_support=1
            )

            # All cost components should be positive
            assert cost.tuition > 0
            assert cost.room_and_board > 0
            assert cost.books_and_supplies > 0
            assert cost.other_expenses > 0
            assert cost.total_annual > 0

    def test_education_inflation_rate(self):
        """Test that education inflation rate is reasonable"""
        rate = EducationFundingService.EDUCATION_INFLATION_RATE

        # Should be between 5-6%
        assert 0.05 <= rate <= 0.06

    def test_529_strategy_tax_benefits(self):
        """Test tax savings calculation in 529 strategy"""
        # Without state tax deduction
        strategy_no_tax = EducationFundingService.calculate_529_strategy(
            target_amount=200000,
            current_savings=0,
            years_until_college=10,
            expected_return=0.06,
            state_tax_deduction=0.0
        )

        # With state tax deduction
        strategy_with_tax = EducationFundingService.calculate_529_strategy(
            target_amount=200000,
            current_savings=0,
            years_until_college=10,
            expected_return=0.06,
            state_tax_deduction=0.05
        )

        # Tax savings should be positive with deduction
        assert strategy_no_tax["tax_savings"] == 0
        assert strategy_with_tax["tax_savings"] > 0

        # Tax savings should be roughly 5% of total contributions
        expected_savings = strategy_with_tax["total_contributions"] * 0.05
        assert abs(strategy_with_tax["tax_savings"] - expected_savings) < 1000


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
