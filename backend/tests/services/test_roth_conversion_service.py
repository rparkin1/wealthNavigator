"""
Tests for Roth Conversion Service

REQ-TAX-007: Roth conversion opportunity identification
Phase 3 Feature: Backdoor Roth conversion automation
"""

import pytest
from app.services.roth_conversion_service import (
    RothConversionService,
    ConversionStrategy,
    ConversionTiming,
)


class TestEligibilityAnalysis:
    """Test Roth conversion eligibility checking"""

    def test_high_income_backdoor_roth_eligible(self):
        """Test backdoor Roth eligibility for high-income earner"""
        result = RothConversionService.analyze_eligibility(
            age=35,
            income=200000,  # Above Roth limit
            filing_status="single",
            traditional_ira_balance=0,
            traditional_ira_basis=0,
            roth_ira_balance=25000,
            current_year_contributions=0,
        )

        assert result.is_eligible is True
        assert result.strategy == ConversionStrategy.BACKDOOR
        assert result.income_limit_status == "over_limit"
        assert result.max_conversion_amount == 7000  # 2024 limit
        assert "Backdoor Roth available" in " ".join(result.eligibility_notes)

    def test_low_income_traditional_conversion_eligible(self):
        """Test traditional conversion for low-income earner"""
        result = RothConversionService.analyze_eligibility(
            age=35,
            income=100000,  # Below Roth limit
            filing_status="single",
            traditional_ira_balance=50000,
            traditional_ira_basis=0,
            roth_ira_balance=0,
            current_year_contributions=0,
        )

        assert result.is_eligible is True
        assert result.strategy == ConversionStrategy.TRADITIONAL_CONVERSION
        assert result.income_limit_status == "within_limit"
        assert result.max_conversion_amount == 50000

    def test_pro_rata_rule_applies(self):
        """Test pro-rata rule with mixed traditional IRA balance"""
        result = RothConversionService.analyze_eligibility(
            age=35,
            income=200000,
            filing_status="married_joint",
            traditional_ira_balance=100000,
            traditional_ira_basis=7000,  # Non-deductible contribution
            roth_ira_balance=0,
            current_year_contributions=0,
        )

        assert result.pro_rata_rule_applies is True
        # Taxable percentage = (100,000 - 7,000) / 100,000 = 93%
        assert result.pro_rata_taxable_percentage == pytest.approx(93.0, rel=0.1)
        assert len(result.warnings) > 0
        assert "Pro-rata rule applies" in result.warnings[0]

    def test_age_50_plus_catch_up_contribution(self):
        """Test catch-up contribution limit for age 50+"""
        result = RothConversionService.analyze_eligibility(
            age=55,
            income=250000,  # Above married_joint limit to trigger backdoor
            filing_status="married_joint",
            traditional_ira_balance=0,
            traditional_ira_basis=0,
            roth_ira_balance=0,
            current_year_contributions=0,
        )

        # For backdoor Roth, max conversion is the contribution limit
        assert result.max_conversion_amount == 8000  # $7,000 + $1,000 catch-up
        assert result.strategy == ConversionStrategy.BACKDOOR

    def test_phase_out_range(self):
        """Test income in phase-out range"""
        result = RothConversionService.analyze_eligibility(
            age=35,
            income=150000,  # In phase-out range for single
            filing_status="single",
            traditional_ira_balance=0,
            traditional_ira_basis=0,
            roth_ira_balance=0,
            current_year_contributions=0,
        )

        assert result.income_limit_status == "phase_out"
        assert "phase-out range" in " ".join(result.eligibility_notes)


class TestTaxImpactCalculation:
    """Test tax impact calculations"""

    def test_tax_impact_no_bracket_change(self):
        """Test conversion that stays in same bracket"""
        result = RothConversionService.calculate_tax_impact(
            conversion_amount=10000,
            current_income=50000,
            filing_status="single",
            state_tax_rate=0.05,
            pro_rata_taxable_pct=100.0,
        )

        assert result.conversion_amount == 10000
        assert result.total_tax_due > 0
        assert result.marginal_rate_impact is False  # Stays in 22% bracket
        assert result.tax_bracket_before == result.tax_bracket_after

    def test_tax_impact_bracket_change(self):
        """Test conversion that pushes into higher bracket"""
        result = RothConversionService.calculate_tax_impact(
            conversion_amount=100000,
            current_income=180000,  # Near 24% bracket threshold (191,950)
            filing_status="single",
            state_tax_rate=0.05,
            pro_rata_taxable_pct=100.0,
        )

        assert result.marginal_rate_impact is True
        assert result.tax_bracket_before != result.tax_bracket_after
        assert result.recommended_max_conversion > 0

    def test_tax_impact_pro_rata_rule(self):
        """Test tax impact with pro-rata rule"""
        # Only 10% is taxable due to high basis
        result = RothConversionService.calculate_tax_impact(
            conversion_amount=10000,
            current_income=100000,
            filing_status="married_joint",
            state_tax_rate=0.05,
            pro_rata_taxable_pct=10.0,  # Only 10% taxable
        )

        # Tax should be only on 10% of conversion
        # Approximately $1,000 * 22% federal + 5% state = $270
        assert result.total_tax_due < 2000
        assert result.effective_tax_rate < 0.2

    def test_state_tax_calculation(self):
        """Test state tax component"""
        result_with_state = RothConversionService.calculate_tax_impact(
            conversion_amount=10000,
            current_income=100000,
            filing_status="single",
            state_tax_rate=0.10,  # 10% state tax
            pro_rata_taxable_pct=100.0,
        )

        result_no_state = RothConversionService.calculate_tax_impact(
            conversion_amount=10000,
            current_income=100000,
            filing_status="single",
            state_tax_rate=0.0,  # No state tax
            pro_rata_taxable_pct=100.0,
        )

        assert result_with_state.state_tax > result_no_state.state_tax
        assert result_with_state.total_tax_due > result_no_state.total_tax_due

    def test_married_joint_vs_single_brackets(self):
        """Test tax differences between filing statuses"""
        single = RothConversionService.calculate_tax_impact(
            conversion_amount=50000,
            current_income=100000,
            filing_status="single",
            state_tax_rate=0.05,
            pro_rata_taxable_pct=100.0,
        )

        married = RothConversionService.calculate_tax_impact(
            conversion_amount=50000,
            current_income=100000,
            filing_status="married_joint",
            state_tax_rate=0.05,
            pro_rata_taxable_pct=100.0,
        )

        # Married joint should have lower tax due to higher bracket thresholds
        assert married.total_tax_due <= single.total_tax_due


class TestRecommendationGeneration:
    """Test recommendation logic"""

    def test_recommend_when_favorable_tax_arbitrage(self):
        """Test recommendation when current rate < retirement rate"""
        from app.services.roth_conversion_service import (
            RothConversionEligibility,
            ConversionTaxImpact,
        )

        eligibility = RothConversionEligibility(
            is_eligible=True,
            strategy=ConversionStrategy.BACKDOOR,
            max_conversion_amount=7000,
            income_limit_status="over_limit",
            pro_rata_rule_applies=False,
            pro_rata_taxable_percentage=0.0,
            eligibility_notes=[],
            warnings=[],
        )

        tax_impact = ConversionTaxImpact(
            conversion_amount=7000,
            ordinary_income_tax=1500,
            state_tax=350,
            total_tax_due=1850,
            effective_tax_rate=0.264,
            marginal_rate_impact=False,
            next_bracket_threshold=200000,
            recommended_max_conversion=7000,
            tax_bracket_before="24%",
            tax_bracket_after="24%",
        )

        result = RothConversionService.generate_recommendation(
            eligibility=eligibility,
            tax_impact=tax_impact,
            age=35,
            retirement_age=65,
            current_marginal_rate=0.22,  # Low current rate
            expected_retirement_rate=0.32,  # High future rate
            conversion_amount=7000,
        )

        assert result.recommended is True
        assert "Tax arbitrage favorable" in " ".join(result.reasoning)
        assert result.break_even_years > 0
        assert result.lifetime_benefit > 0

    def test_not_recommend_when_unfavorable_tax_arbitrage(self):
        """Test no recommendation when current rate > retirement rate"""
        from app.services.roth_conversion_service import (
            RothConversionEligibility,
            ConversionTaxImpact,
        )

        eligibility = RothConversionEligibility(
            is_eligible=True,
            strategy=ConversionStrategy.TRADITIONAL_CONVERSION,
            max_conversion_amount=50000,
            income_limit_status="within_limit",
            pro_rata_rule_applies=False,
            pro_rata_taxable_percentage=0.0,
            eligibility_notes=[],
            warnings=[],
        )

        tax_impact = ConversionTaxImpact(
            conversion_amount=50000,
            ordinary_income_tax=12000,
            state_tax=2500,
            total_tax_due=14500,
            effective_tax_rate=0.29,
            marginal_rate_impact=False,
            next_bracket_threshold=200000,
            recommended_max_conversion=50000,
            tax_bracket_before="32%",
            tax_bracket_after="32%",
        )

        result = RothConversionService.generate_recommendation(
            eligibility=eligibility,
            tax_impact=tax_impact,
            age=55,
            retirement_age=65,
            current_marginal_rate=0.35,  # High current rate
            expected_retirement_rate=0.22,  # Low future rate
            conversion_amount=50000,
        )

        assert result.recommended is False
        assert "unfavorable" in " ".join(result.reasoning)

    def test_recommend_long_time_horizon(self):
        """Test recommendation with long time to retirement"""
        from app.services.roth_conversion_service import (
            RothConversionEligibility,
            ConversionTaxImpact,
        )

        eligibility = RothConversionEligibility(
            is_eligible=True,
            strategy=ConversionStrategy.BACKDOOR,
            max_conversion_amount=7000,
            income_limit_status="over_limit",
            pro_rata_rule_applies=False,
            pro_rata_taxable_percentage=0.0,
            eligibility_notes=[],
            warnings=[],
        )

        tax_impact = ConversionTaxImpact(
            conversion_amount=7000,
            ordinary_income_tax=1500,
            state_tax=350,
            total_tax_due=1850,
            effective_tax_rate=0.264,
            marginal_rate_impact=False,
            next_bracket_threshold=200000,
            recommended_max_conversion=7000,
            tax_bracket_before="24%",
            tax_bracket_after="24%",
        )

        result = RothConversionService.generate_recommendation(
            eligibility=eligibility,
            tax_impact=tax_impact,
            age=25,  # Young
            retirement_age=65,  # 40 years to retirement
            current_marginal_rate=0.24,
            expected_retirement_rate=0.24,  # Same rate
            conversion_amount=7000,
        )

        assert result.recommended is True
        assert "Long time horizon" in " ".join(result.reasoning)

    def test_backdoor_roth_immediate_timing(self):
        """Test backdoor Roth gets immediate timing recommendation"""
        from app.services.roth_conversion_service import (
            RothConversionEligibility,
            ConversionTaxImpact,
        )

        eligibility = RothConversionEligibility(
            is_eligible=True,
            strategy=ConversionStrategy.BACKDOOR,
            max_conversion_amount=7000,
            income_limit_status="over_limit",
            pro_rata_rule_applies=False,
            pro_rata_taxable_percentage=0.0,
            eligibility_notes=[],
            warnings=[],
        )

        tax_impact = ConversionTaxImpact(
            conversion_amount=7000,
            ordinary_income_tax=1500,
            state_tax=350,
            total_tax_due=1850,
            effective_tax_rate=0.264,
            marginal_rate_impact=False,
            next_bracket_threshold=200000,
            recommended_max_conversion=7000,
            tax_bracket_before="24%",
            tax_bracket_after="24%",
        )

        result = RothConversionService.generate_recommendation(
            eligibility=eligibility,
            tax_impact=tax_impact,
            age=35,
            retirement_age=65,
            current_marginal_rate=0.24,
            expected_retirement_rate=0.24,
            conversion_amount=7000,
        )

        assert result.timing == ConversionTiming.IMMEDIATE
        assert "immediately" in " ".join(result.reasoning).lower()


class TestBackdoorRothAnalysis:
    """Test complete backdoor Roth analysis"""

    def test_complete_analysis_high_income_backdoor(self):
        """Test complete analysis for high-income backdoor Roth scenario"""
        result = RothConversionService.analyze_backdoor_roth(
            age=35,
            income=250000,  # Above married_joint limit ($240k)
            filing_status="married_joint",
            traditional_ira_balance=0,
            traditional_ira_basis=0,
            roth_ira_balance=25000,
            retirement_age=65,
            current_marginal_rate=0.24,
            expected_retirement_rate=0.22,
            state_tax_rate=0.05,
            current_year_contributions=0,
        )

        # Eligibility
        assert result.eligibility.is_eligible is True
        assert result.eligibility.strategy == ConversionStrategy.BACKDOOR

        # Tax impact
        assert result.tax_impact.conversion_amount > 0
        assert result.tax_impact.total_tax_due >= 0

        # Recommendation
        assert result.recommendation.recommended_amount > 0
        assert len(result.recommendation.action_steps) > 0

        # Contribution limits
        assert result.current_year_contribution_limit in [7000, 8000]
        assert result.remaining_contribution_room >= 0

    def test_complete_analysis_with_pro_rata_rule(self):
        """Test analysis with pro-rata rule complications"""
        result = RothConversionService.analyze_backdoor_roth(
            age=45,
            income=180000,
            filing_status="single",
            traditional_ira_balance=100000,
            traditional_ira_basis=10000,  # 10% basis
            roth_ira_balance=50000,
            retirement_age=65,
            current_marginal_rate=0.24,
            expected_retirement_rate=0.24,
            state_tax_rate=0.06,
            current_year_contributions=0,
            proposed_conversion_amount=7000,
        )

        # Pro-rata rule should apply
        assert result.eligibility.pro_rata_rule_applies is True
        assert result.eligibility.pro_rata_taxable_percentage > 0

        # Tax should reflect pro-rata taxation
        taxable_amount = 7000 * (result.eligibility.pro_rata_taxable_percentage / 100)
        assert result.tax_impact.total_tax_due < 7000 * 0.30  # Not all is taxable

    def test_first_roth_conversion_five_year_rule(self):
        """Test five-year rule date for first Roth conversion"""
        result = RothConversionService.analyze_backdoor_roth(
            age=30,
            income=150000,
            filing_status="single",
            traditional_ira_balance=0,
            traditional_ira_basis=0,
            roth_ira_balance=0,  # First Roth conversion
            retirement_age=65,
            current_marginal_rate=0.22,
            expected_retirement_rate=0.22,
            state_tax_rate=0.05,
        )

        # Five-year rule date should be set
        assert result.five_year_rule_date is not None
        assert "2029" in result.five_year_rule_date or "2030" in result.five_year_rule_date

    def test_existing_roth_no_five_year_rule(self):
        """Test no five-year rule for existing Roth account"""
        result = RothConversionService.analyze_backdoor_roth(
            age=40,
            income=160000,
            filing_status="married_joint",
            traditional_ira_balance=50000,
            traditional_ira_basis=0,
            roth_ira_balance=100000,  # Existing Roth
            retirement_age=65,
            current_marginal_rate=0.24,
            expected_retirement_rate=0.22,
            state_tax_rate=0.05,
        )

        # Five-year rule already satisfied
        assert result.five_year_rule_date is None

    def test_contribution_room_calculation(self):
        """Test remaining contribution room calculation"""
        result = RothConversionService.analyze_backdoor_roth(
            age=35,
            income=180000,
            filing_status="single",
            traditional_ira_balance=0,
            traditional_ira_basis=0,
            roth_ira_balance=0,
            retirement_age=65,
            current_marginal_rate=0.24,
            expected_retirement_rate=0.22,
            state_tax_rate=0.05,
            current_year_contributions=3000,  # Already contributed $3k
        )

        # Remaining room should be $4,000 ($7,000 - $3,000)
        assert result.remaining_contribution_room == 4000

    def test_proposed_amount_overrides_recommendation(self):
        """Test proposed conversion amount overrides service recommendation"""
        proposed_amount = 5000

        result = RothConversionService.analyze_backdoor_roth(
            age=35,
            income=150000,
            filing_status="single",
            traditional_ira_balance=50000,
            traditional_ira_basis=0,
            roth_ira_balance=25000,
            retirement_age=65,
            current_marginal_rate=0.22,
            expected_retirement_rate=0.24,
            state_tax_rate=0.05,
            proposed_conversion_amount=proposed_amount,
        )

        # Tax impact should be based on proposed amount
        assert result.tax_impact.conversion_amount == proposed_amount


class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_zero_income(self):
        """Test with zero income (e.g., gap year)"""
        result = RothConversionService.analyze_backdoor_roth(
            age=30,
            income=1,  # Minimal income (API requires > 0)
            filing_status="single",
            traditional_ira_balance=50000,
            traditional_ira_basis=0,
            roth_ira_balance=0,
            retirement_age=65,
            current_marginal_rate=0.10,
            expected_retirement_rate=0.22,
            state_tax_rate=0.05,
        )

        # Should recommend conversion in low-income year
        assert result.recommendation.recommended is True

    def test_near_retirement_age(self):
        """Test conversion analysis near retirement"""
        result = RothConversionService.analyze_backdoor_roth(
            age=63,
            income=120000,
            filing_status="married_joint",
            traditional_ira_balance=500000,
            traditional_ira_basis=0,
            roth_ira_balance=100000,
            retirement_age=65,
            current_marginal_rate=0.24,
            expected_retirement_rate=0.22,
            state_tax_rate=0.06,
        )

        # Short time horizon may affect recommendation
        assert result.recommendation.break_even_years > 0

    def test_very_large_conversion(self):
        """Test very large conversion amount"""
        result = RothConversionService.analyze_backdoor_roth(
            age=45,
            income=300000,
            filing_status="married_joint",
            traditional_ira_balance=1000000,
            traditional_ira_basis=0,
            roth_ira_balance=250000,
            retirement_age=65,
            current_marginal_rate=0.32,
            expected_retirement_rate=0.24,
            state_tax_rate=0.10,
            proposed_conversion_amount=500000,
        )

        # Large conversion should have significant tax impact
        assert result.tax_impact.total_tax_due > 100000
        assert result.tax_impact.marginal_rate_impact is True

    def test_married_filing_separately_low_limits(self):
        """Test married filing separately (very low income limits)"""
        result = RothConversionService.analyze_eligibility(
            age=35,
            income=50000,
            filing_status="married_separate",
            traditional_ira_balance=0,
            traditional_ira_basis=0,
            roth_ira_balance=0,
            current_year_contributions=0,
        )

        # Should recommend backdoor due to low MFS limits
        assert result.income_limit_status == "over_limit"
        assert result.strategy == ConversionStrategy.BACKDOOR
