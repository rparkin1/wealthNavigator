"""
Roth Conversion Service

Implements backdoor Roth conversion analysis and automation.
REQ-TAX-007: Roth conversion opportunity identification
Phase 3 Feature: Backdoor Roth conversion automation
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class ConversionStrategy(str, Enum):
    """Roth conversion strategy types"""
    TRADITIONAL_CONVERSION = "traditional_conversion"  # Traditional IRA → Roth IRA
    BACKDOOR = "backdoor"  # Non-deductible IRA → Roth IRA
    MEGA_BACKDOOR = "mega_backdoor"  # After-tax 401(k) → Roth
    PARTIAL_CONVERSION = "partial_conversion"  # Convert portion to manage tax bracket


class ConversionTiming(str, Enum):
    """Optimal conversion timing"""
    IMMEDIATE = "immediate"
    LOW_INCOME_YEAR = "low_income_year"
    RETIREMENT_EARLY = "retirement_early"
    MARKET_DOWNTURN = "market_downturn"
    SPREAD_OVER_YEARS = "spread_over_years"


class RothConversionEligibility(BaseModel):
    """Roth conversion eligibility result"""
    is_eligible: bool
    strategy: ConversionStrategy
    max_conversion_amount: float
    income_limit_status: str  # within_limit, over_limit, phase_out
    pro_rata_rule_applies: bool
    pro_rata_taxable_percentage: float
    eligibility_notes: List[str]
    warnings: List[str]


class ConversionTaxImpact(BaseModel):
    """Tax impact of Roth conversion"""
    conversion_amount: float
    ordinary_income_tax: float
    state_tax: float
    total_tax_due: float
    effective_tax_rate: float
    marginal_rate_impact: bool  # Does it push into higher bracket?
    next_bracket_threshold: float
    recommended_max_conversion: float  # Stay in current bracket
    tax_bracket_before: str
    tax_bracket_after: str


class RothConversionRecommendation(BaseModel):
    """Roth conversion recommendation"""
    recommended: bool
    strategy: ConversionStrategy
    timing: ConversionTiming
    recommended_amount: float
    estimated_tax: float
    break_even_years: float  # Years until conversion pays off
    lifetime_benefit: float  # Estimated lifetime tax savings
    reasoning: List[str]
    action_steps: List[str]
    considerations: List[str]


class BackdoorRothAnalysis(BaseModel):
    """Complete backdoor Roth analysis"""
    eligibility: RothConversionEligibility
    tax_impact: ConversionTaxImpact
    recommendation: RothConversionRecommendation
    current_year_contribution_limit: float
    remaining_contribution_room: float
    five_year_rule_date: Optional[str]  # When converted funds become penalty-free


class RothConversionService:
    """Service for Roth conversion analysis and automation"""

    # 2024-2025 IRS limits
    IRA_CONTRIBUTION_LIMIT = 7000  # $7,000 for 2024
    IRA_CONTRIBUTION_LIMIT_50_PLUS = 8000  # $7,000 + $1,000 catch-up

    # Roth IRA income phase-out ranges (2024)
    ROTH_INCOME_LIMITS = {
        "single": {"phase_out_start": 146000, "phase_out_end": 161000},
        "married_joint": {"phase_out_start": 230000, "phase_out_end": 240000},
        "married_separate": {"phase_out_start": 0, "phase_out_end": 10000},
    }

    # 2024 Federal tax brackets
    TAX_BRACKETS_2024 = {
        "single": [
            (11600, 0.10),
            (47150, 0.12),
            (100525, 0.22),
            (191950, 0.24),
            (243725, 0.32),
            (609350, 0.35),
            (float('inf'), 0.37),
        ],
        "married_joint": [
            (23200, 0.10),
            (94300, 0.12),
            (201050, 0.22),
            (383900, 0.24),
            (487450, 0.32),
            (731200, 0.35),
            (float('inf'), 0.37),
        ],
    }

    @classmethod
    def analyze_eligibility(
        cls,
        age: int,
        income: float,
        filing_status: str,
        traditional_ira_balance: float,
        traditional_ira_basis: float,  # Non-deductible contributions
        roth_ira_balance: float,
        current_year_contributions: float = 0,
    ) -> RothConversionEligibility:
        """
        Analyze Roth conversion eligibility.

        Args:
            age: Taxpayer age
            income: Modified Adjusted Gross Income (MAGI)
            filing_status: "single", "married_joint", "married_separate"
            traditional_ira_balance: Total traditional IRA balance
            traditional_ira_basis: Non-deductible contributions (basis)
            roth_ira_balance: Current Roth IRA balance
            current_year_contributions: IRA contributions made this year

        Returns:
            Eligibility analysis with strategy recommendation
        """
        eligibility_notes = []
        warnings = []

        # Determine contribution limit
        contribution_limit = cls.IRA_CONTRIBUTION_LIMIT_50_PLUS if age >= 50 else cls.IRA_CONTRIBUTION_LIMIT

        # Check income limits for direct Roth contributions
        limits = cls.ROTH_INCOME_LIMITS.get(filing_status, cls.ROTH_INCOME_LIMITS["single"])

        if income < limits["phase_out_start"]:
            income_limit_status = "within_limit"
            eligibility_notes.append(f"Income ${income:,.0f} is below Roth IRA phase-out (${limits['phase_out_start']:,.0f})")
        elif income < limits["phase_out_end"]:
            income_limit_status = "phase_out"
            eligibility_notes.append(f"Income in phase-out range. Reduced Roth contribution allowed.")
            warnings.append("Consider backdoor Roth to avoid phase-out limitations")
        else:
            income_limit_status = "over_limit"
            eligibility_notes.append(f"Income ${income:,.0f} exceeds Roth IRA limit (${limits['phase_out_end']:,.0f})")
            eligibility_notes.append("Direct Roth contributions not allowed. Backdoor Roth strategy recommended.")

        # Determine conversion strategy
        if income > limits["phase_out_end"]:
            # High income → Backdoor Roth
            strategy = ConversionStrategy.BACKDOOR
            is_eligible = True
            max_conversion_amount = contribution_limit - current_year_contributions
            eligibility_notes.append(f"Backdoor Roth available: Contribute ${max_conversion_amount:,.0f} to traditional IRA, then convert")
        else:
            # Can do traditional conversion
            strategy = ConversionStrategy.TRADITIONAL_CONVERSION
            is_eligible = True
            max_conversion_amount = traditional_ira_balance
            eligibility_notes.append(f"Traditional conversion available: Up to ${max_conversion_amount:,.0f}")

        # Pro-rata rule calculation
        pro_rata_rule_applies = False
        pro_rata_taxable_percentage = 0.0

        if traditional_ira_balance > 0:
            # Pro-rata rule: Taxable percentage = (Total IRA - Basis) / Total IRA
            pro_rata_rule_applies = True
            pre_tax_amount = traditional_ira_balance - traditional_ira_basis
            pro_rata_taxable_percentage = (pre_tax_amount / traditional_ira_balance) * 100

            if pro_rata_taxable_percentage > 0:
                warnings.append(
                    f"Pro-rata rule applies: {pro_rata_taxable_percentage:.1f}% of conversion will be taxable"
                )
                warnings.append(
                    f"Existing pre-tax IRA balance: ${pre_tax_amount:,.0f}. "
                    "Consider rolling into 401(k) to avoid pro-rata taxation."
                )

        # Additional eligibility checks
        if age < 59.5 and roth_ira_balance == 0:
            warnings.append(
                f"First Roth contribution. Five-year rule applies: "
                f"Earnings not penalty-free until age 59½ AND 5 years from first contribution."
            )

        return RothConversionEligibility(
            is_eligible=is_eligible,
            strategy=strategy,
            max_conversion_amount=max_conversion_amount,
            income_limit_status=income_limit_status,
            pro_rata_rule_applies=pro_rata_rule_applies,
            pro_rata_taxable_percentage=round(pro_rata_taxable_percentage, 2),
            eligibility_notes=eligibility_notes,
            warnings=warnings,
        )

    @classmethod
    def calculate_tax_impact(
        cls,
        conversion_amount: float,
        current_income: float,
        filing_status: str,
        state_tax_rate: float = 0.05,
        pro_rata_taxable_pct: float = 100.0,
    ) -> ConversionTaxImpact:
        """
        Calculate tax impact of Roth conversion.

        Args:
            conversion_amount: Amount to convert
            current_income: Current taxable income
            filing_status: "single" or "married_joint"
            state_tax_rate: State marginal tax rate
            pro_rata_taxable_pct: Percentage of conversion that's taxable (pro-rata rule)

        Returns:
            Tax impact analysis
        """
        # Apply pro-rata rule
        taxable_amount = conversion_amount * (pro_rata_taxable_pct / 100)

        # Calculate tax before conversion
        tax_before = cls._calculate_federal_tax(current_income, filing_status)
        bracket_before = cls._get_tax_bracket(current_income, filing_status)

        # Calculate tax after conversion
        income_after = current_income + taxable_amount
        tax_after = cls._calculate_federal_tax(income_after, filing_status)
        bracket_after = cls._get_tax_bracket(income_after, filing_status)

        # Conversion tax
        ordinary_income_tax = tax_after - tax_before
        state_tax = taxable_amount * state_tax_rate
        total_tax_due = ordinary_income_tax + state_tax

        # Effective rate on conversion
        effective_tax_rate = (total_tax_due / conversion_amount) if conversion_amount > 0 else 0

        # Check if conversion pushes into higher bracket
        marginal_rate_impact = bracket_after != bracket_before

        # Find next bracket threshold
        brackets = cls.TAX_BRACKETS_2024.get(filing_status, cls.TAX_BRACKETS_2024["single"])
        next_bracket_threshold = 0
        for threshold, _ in brackets:
            if threshold > current_income:
                next_bracket_threshold = threshold
                break

        # Recommended max to stay in bracket
        recommended_max_conversion = max(0, next_bracket_threshold - current_income)

        return ConversionTaxImpact(
            conversion_amount=conversion_amount,
            ordinary_income_tax=round(ordinary_income_tax, 2),
            state_tax=round(state_tax, 2),
            total_tax_due=round(total_tax_due, 2),
            effective_tax_rate=round(effective_tax_rate, 3),
            marginal_rate_impact=marginal_rate_impact,
            next_bracket_threshold=next_bracket_threshold,
            recommended_max_conversion=round(recommended_max_conversion, 2),
            tax_bracket_before=bracket_before,
            tax_bracket_after=bracket_after,
        )

    @classmethod
    def _calculate_federal_tax(cls, income: float, filing_status: str) -> float:
        """Calculate federal income tax"""
        brackets = cls.TAX_BRACKETS_2024.get(filing_status, cls.TAX_BRACKETS_2024["single"])

        tax = 0
        previous_threshold = 0

        for threshold, rate in brackets:
            if income <= threshold:
                tax += (income - previous_threshold) * rate
                break
            else:
                tax += (threshold - previous_threshold) * rate
                previous_threshold = threshold

        return tax

    @classmethod
    def _get_tax_bracket(cls, income: float, filing_status: str) -> str:
        """Get tax bracket for income level"""
        brackets = cls.TAX_BRACKETS_2024.get(filing_status, cls.TAX_BRACKETS_2024["single"])

        for threshold, rate in brackets:
            if income <= threshold:
                return f"{int(rate * 100)}%"

        return "37%"

    @classmethod
    def generate_recommendation(
        cls,
        eligibility: RothConversionEligibility,
        tax_impact: ConversionTaxImpact,
        age: int,
        retirement_age: int,
        current_marginal_rate: float,
        expected_retirement_rate: float,
        conversion_amount: Optional[float] = None,
    ) -> RothConversionRecommendation:
        """
        Generate Roth conversion recommendation.

        Args:
            eligibility: Eligibility analysis
            tax_impact: Tax impact analysis
            age: Current age
            retirement_age: Expected retirement age
            current_marginal_rate: Current marginal tax rate
            expected_retirement_rate: Expected tax rate in retirement
            conversion_amount: Proposed conversion amount (if any)

        Returns:
            Comprehensive recommendation
        """
        reasoning = []
        action_steps = []
        considerations = []

        # Determine if conversion is recommended
        years_to_retirement = max(1, retirement_age - age)

        # Tax arbitrage: Convert if current rate < expected retirement rate
        rate_differential = expected_retirement_rate - current_marginal_rate

        if rate_differential > 0.03:  # 3%+ higher in retirement
            recommended = True
            reasoning.append(
                f"✅ Tax arbitrage favorable: Current rate {current_marginal_rate:.1%} vs. "
                f"expected retirement rate {expected_retirement_rate:.1%}. "
                f"Convert now to lock in lower rate."
            )
        elif rate_differential < -0.05:  # 5%+ lower in retirement
            recommended = False
            reasoning.append(
                f"❌ Tax arbitrage unfavorable: Current rate {current_marginal_rate:.1%} is higher than "
                f"expected retirement rate {expected_retirement_rate:.1%}. "
                f"Consider deferring conversion."
            )
        else:
            # Neutral case: Consider other factors
            if years_to_retirement >= 15:
                recommended = True
                reasoning.append(
                    f"✅ Long time horizon ({years_to_retirement} years) allows tax-free growth to compound. "
                    "Conversion likely beneficial despite similar tax rates."
                )
            else:
                recommended = False
                reasoning.append(
                    f"⚠️ Short time horizon ({years_to_retirement} years) and similar tax rates. "
                    "Break-even may not be achieved."
                )

        # Calculate break-even and lifetime benefit
        if conversion_amount and tax_impact.total_tax_due > 0:
            # Simplified break-even: Years for tax-free growth to offset conversion tax
            # Assumes 7% growth, 24% tax on traditional withdrawals
            conversion_tax_cost = tax_impact.total_tax_due
            annual_benefit = conversion_amount * 0.07 * expected_retirement_rate  # Tax savings on growth
            break_even_years = conversion_tax_cost / annual_benefit if annual_benefit > 0 else 999

            # Lifetime benefit over 30 years
            years_compounding = min(30, years_to_retirement)
            future_value = conversion_amount * ((1.07) ** years_compounding)
            tax_on_traditional = future_value * expected_retirement_rate
            lifetime_benefit = tax_on_traditional - conversion_tax_cost
        else:
            break_even_years = 10.0
            lifetime_benefit = 0.0

        # Determine timing
        if eligibility.strategy == ConversionStrategy.BACKDOOR:
            timing = ConversionTiming.IMMEDIATE
            reasoning.append("🎯 Backdoor Roth: Convert immediately after contribution to minimize taxable growth")
        elif age < retirement_age and (retirement_age - age) < 5:
            timing = ConversionTiming.RETIREMENT_EARLY
            reasoning.append("📅 Optimal timing: Early retirement years before RMDs and Social Security")
        elif years_to_retirement > 10:
            timing = ConversionTiming.SPREAD_OVER_YEARS
            reasoning.append("📊 Consider spreading conversion over multiple years to manage tax brackets")
        else:
            timing = ConversionTiming.LOW_INCOME_YEAR
            reasoning.append("⏰ Convert during low-income years (job transition, sabbatical, market downturn)")

        # Recommended amount
        if tax_impact.marginal_rate_impact and tax_impact.recommended_max_conversion > 0:
            recommended_amount = tax_impact.recommended_max_conversion
            reasoning.append(
                f"💰 Recommended amount: ${recommended_amount:,.0f} to stay in current "
                f"{tax_impact.tax_bracket_before} tax bracket"
            )
        else:
            recommended_amount = eligibility.max_conversion_amount

        # Action steps
        if eligibility.strategy == ConversionStrategy.BACKDOOR:
            action_steps = [
                "1. Contribute $7,000 to traditional IRA (non-deductible)",
                "2. File Form 8606 to report non-deductible contribution",
                "3. Wait 1-2 days for funds to settle",
                "4. Convert traditional IRA to Roth IRA (typically no tax if done immediately)",
                "5. File Form 8606 again with tax return to report conversion",
            ]
        else:
            action_steps = [
                f"1. Decide on conversion amount: ${recommended_amount:,.0f}",
                f"2. Ensure you have ${tax_impact.total_tax_due:,.0f} available to pay conversion tax",
                "3. Contact IRA custodian to initiate Roth conversion",
                "4. Pay estimated taxes or adjust W-4 withholding",
                "5. File Form 8606 with tax return",
            ]

        # Considerations
        considerations = [
            f"⏱️ Break-even period: {break_even_years:.1f} years",
            f"💵 Estimated lifetime benefit: ${lifetime_benefit:,.0f}",
            "🔒 Five-year rule: Converted amounts penalty-free after 5 years + age 59½",
        ]

        if eligibility.pro_rata_rule_applies:
            considerations.append(
                f"⚠️ Pro-rata rule: {eligibility.pro_rata_taxable_percentage:.1f}% of conversion is taxable. "
                "Consider rolling pre-tax IRA into 401(k) first."
            )

        if tax_impact.marginal_rate_impact:
            considerations.append(
                f"📈 Conversion pushes you from {tax_impact.tax_bracket_before} to "
                f"{tax_impact.tax_bracket_after} bracket. Consider smaller amount."
            )

        return RothConversionRecommendation(
            recommended=recommended,
            strategy=eligibility.strategy,
            timing=timing,
            recommended_amount=round(recommended_amount, 2),
            estimated_tax=tax_impact.total_tax_due,
            break_even_years=round(break_even_years, 1),
            lifetime_benefit=round(lifetime_benefit, 2),
            reasoning=reasoning,
            action_steps=action_steps,
            considerations=considerations,
        )

    @classmethod
    def analyze_backdoor_roth(
        cls,
        age: int,
        income: float,
        filing_status: str,
        traditional_ira_balance: float,
        traditional_ira_basis: float,
        roth_ira_balance: float,
        retirement_age: int,
        current_marginal_rate: float,
        expected_retirement_rate: float,
        state_tax_rate: float = 0.05,
        current_year_contributions: float = 0,
        proposed_conversion_amount: Optional[float] = None,
    ) -> BackdoorRothAnalysis:
        """
        Complete backdoor Roth conversion analysis.

        Args:
            age: Current age
            income: MAGI
            filing_status: Tax filing status
            traditional_ira_balance: Traditional IRA balance
            traditional_ira_basis: Non-deductible contributions
            roth_ira_balance: Roth IRA balance
            retirement_age: Expected retirement age
            current_marginal_rate: Current marginal tax rate
            expected_retirement_rate: Expected retirement tax rate
            state_tax_rate: State tax rate
            current_year_contributions: Contributions made this year
            proposed_conversion_amount: Amount to convert (optional)

        Returns:
            Complete backdoor Roth analysis
        """
        # Step 1: Eligibility
        eligibility = cls.analyze_eligibility(
            age=age,
            income=income,
            filing_status=filing_status,
            traditional_ira_balance=traditional_ira_balance,
            traditional_ira_basis=traditional_ira_basis,
            roth_ira_balance=roth_ira_balance,
            current_year_contributions=current_year_contributions,
        )

        # Step 2: Tax Impact
        conversion_amount = proposed_conversion_amount or eligibility.max_conversion_amount
        tax_impact = cls.calculate_tax_impact(
            conversion_amount=conversion_amount,
            current_income=income,
            filing_status=filing_status,
            state_tax_rate=state_tax_rate,
            pro_rata_taxable_pct=eligibility.pro_rata_taxable_percentage,
        )

        # Step 3: Recommendation
        recommendation = cls.generate_recommendation(
            eligibility=eligibility,
            tax_impact=tax_impact,
            age=age,
            retirement_age=retirement_age,
            current_marginal_rate=current_marginal_rate,
            expected_retirement_rate=expected_retirement_rate,
            conversion_amount=conversion_amount,
        )

        # Contribution limits
        contribution_limit = cls.IRA_CONTRIBUTION_LIMIT_50_PLUS if age >= 50 else cls.IRA_CONTRIBUTION_LIMIT
        remaining_contribution_room = max(0, contribution_limit - current_year_contributions)

        # Five-year rule date (if first conversion)
        five_year_rule_date = None
        if roth_ira_balance == 0:
            current_year = datetime.now().year
            five_year_rule_date = f"{current_year + 5}-01-01"

        return BackdoorRothAnalysis(
            eligibility=eligibility,
            tax_impact=tax_impact,
            recommendation=recommendation,
            current_year_contribution_limit=contribution_limit,
            remaining_contribution_room=remaining_contribution_room,
            five_year_rule_date=five_year_rule_date,
        )
