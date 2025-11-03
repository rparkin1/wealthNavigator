"""
Retirement Planning Service

Implements REQ-GOAL-010, 011, 012: Comprehensive retirement planning with
Social Security optimization, RMD calculations, and sustainable withdrawal rates.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import numpy as np


class RetirementPlanningService:
    """Service for retirement planning calculations."""

    # Social Security Full Retirement Age (FRA) by birth year
    FRA_TABLE = {
        1954: (66, 0),   # 66 years, 0 months
        1955: (66, 2),
        1956: (66, 4),
        1957: (66, 6),
        1958: (66, 8),
        1959: (66, 10),
        1960: (67, 0),   # 67 years for 1960 and later
    }

    # RMD divisors by age (IRS Uniform Lifetime Table 2024)
    RMD_DIVISORS = {
        72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0,
        79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
        86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8,
        93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8,
        100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6,
        106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4,
        112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7,
        118: 2.5, 119: 2.3, 120: 2.0
    }

    @classmethod
    def calculate_social_security_benefit(
        cls,
        birth_year: int,
        primary_insurance_amount: float,
        filing_age: int
    ) -> Dict:
        """
        Calculate Social Security benefit based on filing age.

        Args:
            birth_year: Year of birth
            primary_insurance_amount: PIA (benefit at FRA)
            filing_age: Age when claiming benefits (62-70)

        Returns:
            Benefit details including adjustment factors

        REQ-GOAL-010: Social Security benefit estimation
        """
        # Get Full Retirement Age
        fra_years, fra_months = cls._get_fra(birth_year)
        fra_decimal = fra_years + (fra_months / 12)

        # Validate filing age
        if filing_age < 62 or filing_age > 70:
            raise ValueError("Filing age must be between 62 and 70")

        # Calculate adjustment factor
        if filing_age < fra_decimal:
            # Early filing reduction
            months_early = int((fra_decimal - filing_age) * 12)

            if months_early <= 36:
                # 5/9 of 1% per month for first 36 months
                reduction = months_early * (5/9) / 100
            else:
                # 5/9 of 1% for first 36 months, 5/12 of 1% for additional months
                reduction = (36 * (5/9) / 100) + ((months_early - 36) * (5/12) / 100)

            adjustment_factor = 1 - reduction
            adjustment_type = "early_filing_reduction"

        elif filing_age > fra_decimal:
            # Delayed filing increase (8% per year)
            years_delayed = filing_age - fra_decimal
            adjustment_factor = 1 + (years_delayed * 0.08)
            adjustment_type = "delayed_retirement_credit"

        else:
            # Filing at FRA
            adjustment_factor = 1.0
            adjustment_type = "full_retirement_age"

        # Calculate benefit
        monthly_benefit = primary_insurance_amount * adjustment_factor
        annual_benefit = monthly_benefit * 12

        return {
            "primary_insurance_amount": round(primary_insurance_amount, 2),
            "filing_age": filing_age,
            "full_retirement_age": round(fra_decimal, 2),
            "adjustment_factor": round(adjustment_factor, 4),
            "adjustment_type": adjustment_type,
            "monthly_benefit": round(monthly_benefit, 2),
            "annual_benefit": round(annual_benefit, 2),
            "lifetime_value_estimate": cls._estimate_lifetime_value(
                monthly_benefit, filing_age
            )
        }

    @classmethod
    def optimize_social_security_filing(
        cls,
        birth_year: int,
        primary_insurance_amount: float,
        life_expectancy: int = 85,
        discount_rate: float = 0.03
    ) -> Dict:
        """
        Optimize Social Security filing age.

        Args:
            birth_year: Year of birth
            primary_insurance_amount: PIA
            life_expectancy: Expected age at death
            discount_rate: Discount rate for PV calculations

        Returns:
            Optimal filing age and analysis

        REQ-GOAL-010: Social Security filing age optimization
        """
        filing_options = []

        for filing_age in range(62, 71):
            benefit_info = cls.calculate_social_security_benefit(
                birth_year, primary_insurance_amount, filing_age
            )

            # Calculate present value of lifetime benefits
            years_receiving = life_expectancy - filing_age
            if years_receiving <= 0:
                continue

            monthly_benefit = benefit_info["monthly_benefit"]
            pv = cls._calculate_benefit_pv(
                monthly_benefit, years_receiving, discount_rate
            )

            filing_options.append({
                "filing_age": filing_age,
                "monthly_benefit": round(monthly_benefit, 2),
                "annual_benefit": round(monthly_benefit * 12, 2),
                "years_receiving": years_receiving,
                "total_lifetime_benefits": round(monthly_benefit * 12 * years_receiving, 2),
                "present_value": round(pv, 2),
                "breakeven_age": cls._calculate_breakeven_age(
                    primary_insurance_amount, filing_age, birth_year
                )
            })

        # Find optimal filing age (highest PV)
        optimal = max(filing_options, key=lambda x: x["present_value"])

        return {
            "optimal_filing_age": optimal["filing_age"],
            "optimal_monthly_benefit": optimal["monthly_benefit"],
            "optimal_present_value": optimal["present_value"],
            "all_options": filing_options,
            "assumptions": {
                "life_expectancy": life_expectancy,
                "discount_rate": discount_rate,
                "primary_insurance_amount": primary_insurance_amount
            },
            "recommendation": cls._get_filing_recommendation(
                optimal["filing_age"], life_expectancy
            )
        }

    @classmethod
    def calculate_rmd(
        cls,
        account_balance: float,
        age: int,
        account_type: str = "tax_deferred"
    ) -> Dict:
        """
        Calculate Required Minimum Distribution (RMD).

        Args:
            account_balance: Account balance as of December 31
            age: Age on birthday in distribution year
            account_type: Account type (tax_deferred, inherited_ira, etc.)

        Returns:
            RMD amount and details

        REQ-GOAL-010: RMD calculations
        """
        # RMD starts at age 73 (SECURE 2.0 Act)
        rmd_start_age = 73

        if age < rmd_start_age:
            return {
                "age": age,
                "account_balance": round(account_balance, 2),
                "rmd_required": False,
                "rmd_amount": 0,
                "years_until_rmd": rmd_start_age - age,
                "message": f"RMDs not required until age {rmd_start_age}"
            }

        # Get divisor from table
        divisor = cls.RMD_DIVISORS.get(age, 2.0)  # Default to 2.0 for ages > 120

        # Calculate RMD
        rmd_amount = account_balance / divisor

        # Calculate next year's RMD estimate (assuming 5% growth)
        next_year_balance = (account_balance - rmd_amount) * 1.05
        next_year_divisor = cls.RMD_DIVISORS.get(age + 1, 2.0)
        next_year_rmd = next_year_balance / next_year_divisor

        return {
            "age": age,
            "account_balance": round(account_balance, 2),
            "rmd_required": True,
            "rmd_amount": round(rmd_amount, 2),
            "rmd_percentage": round((rmd_amount / account_balance * 100), 2),
            "divisor": divisor,
            "remaining_balance": round(account_balance - rmd_amount, 2),
            "next_year_rmd_estimate": round(next_year_rmd, 2),
            "penalty_for_missing": round(rmd_amount * 0.25, 2),  # 25% penalty
            "account_type": account_type
        }

    @classmethod
    def project_rmds(
        cls,
        starting_balance: float,
        starting_age: int,
        years_to_project: int = 20,
        annual_return: float = 0.05,
        additional_withdrawals: float = 0
    ) -> Dict:
        """
        Project RMDs over multiple years.

        Args:
            starting_balance: Starting account balance
            starting_age: Current age
            years_to_project: Number of years to project
            annual_return: Expected annual return
            additional_withdrawals: Annual withdrawals beyond RMD

        Returns:
            Year-by-year RMD projections

        REQ-GOAL-010: Multi-year RMD planning
        """
        projections = []
        balance = starting_balance
        cumulative_rmds = 0

        for year in range(years_to_project):
            age = starting_age + year
            rmd_info = cls.calculate_rmd(balance, age)

            rmd_amount = rmd_info["rmd_amount"]
            total_withdrawal = rmd_amount + additional_withdrawals

            # Update balance
            balance = balance - total_withdrawal
            if balance > 0:
                balance = balance * (1 + annual_return)
            else:
                balance = 0

            cumulative_rmds += rmd_amount

            projections.append({
                "year": year + 1,
                "age": age,
                "starting_balance": round(rmd_info["account_balance"], 2),
                "rmd_amount": round(rmd_amount, 2),
                "additional_withdrawals": round(additional_withdrawals, 2),
                "total_withdrawal": round(total_withdrawal, 2),
                "ending_balance": round(balance, 2),
                "cumulative_rmds": round(cumulative_rmds, 2)
            })

            if balance == 0:
                break

        return {
            "starting_balance": round(starting_balance, 2),
            "starting_age": starting_age,
            "years_projected": len(projections),
            "projections": projections,
            "total_rmds": round(cumulative_rmds, 2),
            "final_balance": round(balance, 2),
            "account_depleted": balance == 0,
            "assumptions": {
                "annual_return": annual_return,
                "additional_withdrawals": additional_withdrawals
            }
        }

    @classmethod
    def calculate_sustainable_withdrawal_rate(
        cls,
        portfolio_value: float,
        retirement_age: int,
        life_expectancy: int,
        desired_success_probability: float = 0.90,
        return_assumption: float = 0.07,
        return_volatility: float = 0.12,
        inflation_rate: float = 0.03,
        iterations: int = 5000
    ) -> Dict:
        """
        Calculate sustainable withdrawal rate using Monte Carlo simulation.

        Args:
            portfolio_value: Starting portfolio value
            retirement_age: Age at retirement
            life_expectancy: Expected age at death
            desired_success_probability: Target success rate (e.g., 0.90)
            return_assumption: Expected annual return
            return_volatility: Return standard deviation
            inflation_rate: Expected inflation
            iterations: Monte Carlo iterations

        Returns:
            Sustainable withdrawal rate and analysis

        REQ-GOAL-012: Sustainable withdrawal rate calculation
        """
        years_in_retirement = life_expectancy - retirement_age

        if years_in_retirement <= 0:
            raise ValueError("Life expectancy must be greater than retirement age")

        # Test different withdrawal rates
        withdrawal_rates = np.arange(0.03, 0.06, 0.0025)  # 3.0% to 6.0% in 0.25% increments
        results = []

        for wr in withdrawal_rates:
            initial_withdrawal = portfolio_value * wr
            success_count = 0

            for _ in range(iterations):
                portfolio = portfolio_value
                annual_withdrawal = initial_withdrawal

                for year in range(years_in_retirement):
                    # Random return for this year
                    annual_return = np.random.normal(return_assumption, return_volatility)

                    # Apply return
                    portfolio = portfolio * (1 + annual_return)

                    # Take withdrawal
                    portfolio = portfolio - annual_withdrawal

                    # Check if portfolio depleted
                    if portfolio <= 0:
                        break

                    # Inflate withdrawal for next year
                    annual_withdrawal = annual_withdrawal * (1 + inflation_rate)

                # Check if portfolio lasted
                if portfolio > 0:
                    success_count += 1

            success_rate = success_count / iterations

            results.append({
                "withdrawal_rate": round(wr, 4),
                "initial_annual_withdrawal": round(initial_withdrawal, 2),
                "initial_monthly_withdrawal": round(initial_withdrawal / 12, 2),
                "success_probability": round(success_rate, 4),
                "failure_probability": round(1 - success_rate, 4)
            })

        # Find sustainable rate (closest to desired probability)
        sustainable = min(results, key=lambda x: abs(x["success_probability"] - desired_success_probability))

        # Get conservative and aggressive alternatives
        conservative = next((r for r in results if r["success_probability"] >= 0.95), results[0])
        aggressive = next((r for r in reversed(results) if r["success_probability"] >= 0.80), results[-1])

        return {
            "portfolio_value": round(portfolio_value, 2),
            "retirement_age": retirement_age,
            "life_expectancy": life_expectancy,
            "years_in_retirement": years_in_retirement,

            "sustainable_withdrawal_rate": sustainable["withdrawal_rate"],
            "sustainable_annual_withdrawal": sustainable["initial_annual_withdrawal"],
            "sustainable_monthly_withdrawal": sustainable["initial_monthly_withdrawal"],
            "success_probability": sustainable["success_probability"],

            "alternatives": {
                "conservative": conservative,
                "recommended": sustainable,
                "aggressive": aggressive
            },

            "all_results": results,

            "assumptions": {
                "expected_return": return_assumption,
                "return_volatility": return_volatility,
                "inflation_rate": inflation_rate,
                "monte_carlo_iterations": iterations
            },

            "recommendation": cls._get_withdrawal_recommendation(
                sustainable["withdrawal_rate"], portfolio_value
            )
        }

    @classmethod
    def model_retirement_income_phases(
        cls,
        retirement_age: int,
        life_expectancy: int,
        social_security_benefit: float,
        social_security_filing_age: int,
        pension_income: float = 0,
        portfolio_value: float = 0,
        withdrawal_rate: float = 0.04,
        medicare_age: int = 65
    ) -> Dict:
        """
        Model retirement income through different phases.

        Args:
            retirement_age: Age at retirement
            life_expectancy: Expected lifespan
            social_security_benefit: Annual SS benefit
            social_security_filing_age: Age when claiming SS
            pension_income: Annual pension (if any)
            portfolio_value: Portfolio value at retirement
            withdrawal_rate: Portfolio withdrawal rate
            medicare_age: Medicare eligibility age

        Returns:
            Income projections by phase

        REQ-GOAL-011: Model retirement income phases
        """
        phases = []
        current_age = retirement_age

        # Phase 1: Early Retirement (before Medicare and SS)
        if retirement_age < min(medicare_age, social_security_filing_age):
            early_phase_end = min(medicare_age, social_security_filing_age)
            early_years = early_phase_end - retirement_age

            portfolio_withdrawal = portfolio_value * withdrawal_rate
            total_income = portfolio_withdrawal + pension_income

            phases.append({
                "phase": "early_retirement",
                "description": "Pre-Medicare, Pre-Social Security",
                "start_age": retirement_age,
                "end_age": early_phase_end,
                "years": early_years,
                "income_sources": {
                    "portfolio_withdrawals": round(portfolio_withdrawal, 2),
                    "pension": round(pension_income, 2),
                    "social_security": 0,
                    "total": round(total_income, 2)
                },
                "healthcare": "Private insurance or COBRA",
                "challenges": ["Higher healthcare costs", "No Social Security", "Longer portfolio depletion risk"]
            })

            current_age = early_phase_end

        # Phase 2: Traditional Retirement (Medicare and/or SS active)
        traditional_phase_end = min(85, life_expectancy)
        traditional_years = traditional_phase_end - current_age

        if traditional_years > 0:
            portfolio_withdrawal = portfolio_value * withdrawal_rate * 0.95  # Slightly lower after SS
            ss_income = social_security_benefit if current_age >= social_security_filing_age else 0
            total_income = portfolio_withdrawal + pension_income + ss_income

            phases.append({
                "phase": "traditional_retirement",
                "description": "Medicare and Social Security Active",
                "start_age": current_age,
                "end_age": traditional_phase_end,
                "years": traditional_years,
                "income_sources": {
                    "portfolio_withdrawals": round(portfolio_withdrawal, 2),
                    "pension": round(pension_income, 2),
                    "social_security": round(ss_income, 2),
                    "total": round(total_income, 2)
                },
                "healthcare": "Medicare + supplemental",
                "benefits": ["Medicare coverage", "Social Security income", "Stable expenses"]
            })

            current_age = traditional_phase_end

        # Phase 3: Late Retirement (potentially reduced spending, increased healthcare)
        if current_age < life_expectancy:
            late_years = life_expectancy - current_age

            portfolio_withdrawal = portfolio_value * withdrawal_rate * 0.75  # Reduced spending
            total_income = portfolio_withdrawal + pension_income + social_security_benefit

            phases.append({
                "phase": "late_retirement",
                "description": "Advanced Age",
                "start_age": current_age,
                "end_age": life_expectancy,
                "years": late_years,
                "income_sources": {
                    "portfolio_withdrawals": round(portfolio_withdrawal, 2),
                    "pension": round(pension_income, 2),
                    "social_security": round(social_security_benefit, 2),
                    "total": round(total_income, 2)
                },
                "healthcare": "Medicare + long-term care insurance",
                "considerations": ["Increased healthcare costs", "Potential long-term care", "Reduced discretionary spending"]
            })

        # Calculate total retirement income needed
        total_years = life_expectancy - retirement_age
        weighted_avg_income = sum(
            phase["income_sources"]["total"] * phase["years"]
            for phase in phases
        ) / total_years if total_years > 0 else 0

        return {
            "retirement_age": retirement_age,
            "life_expectancy": life_expectancy,
            "total_retirement_years": total_years,
            "phases": phases,
            "summary": {
                "total_phases": len(phases),
                "weighted_average_annual_income": round(weighted_avg_income, 2),
                "total_lifetime_income": round(weighted_avg_income * total_years, 2)
            }
        }

    # Helper methods

    @classmethod
    def _get_fra(cls, birth_year: int) -> Tuple[int, int]:
        """Get Full Retirement Age for birth year."""
        if birth_year <= 1954:
            return cls.FRA_TABLE[1954]
        elif birth_year >= 1960:
            return cls.FRA_TABLE[1960]
        else:
            return cls.FRA_TABLE[birth_year]

    @classmethod
    def _estimate_lifetime_value(cls, monthly_benefit: float, filing_age: int) -> float:
        """Estimate lifetime value of SS benefits (simple calculation)."""
        # Assume life expectancy of 85
        years_receiving = max(0, 85 - filing_age)
        return round(monthly_benefit * 12 * years_receiving, 2)

    @classmethod
    def _calculate_benefit_pv(cls, monthly_benefit: float, years: int, discount_rate: float) -> float:
        """Calculate present value of benefits."""
        pv = 0
        for year in range(years):
            annual_benefit = monthly_benefit * 12
            pv += annual_benefit / ((1 + discount_rate) ** year)
        return pv

    @classmethod
    def _calculate_breakeven_age(cls, pia: float, filing_age: int, birth_year: int) -> int:
        """Calculate breakeven age between filing at 62 vs. filing age."""
        benefit_62 = cls.calculate_social_security_benefit(birth_year, pia, 62)["monthly_benefit"]
        benefit_filing = cls.calculate_social_security_benefit(birth_year, pia, filing_age)["monthly_benefit"]

        # Find age where cumulative benefits are equal
        cumulative_62 = 0
        cumulative_filing = 0

        for age in range(62, 100):
            if age >= 62:
                cumulative_62 += benefit_62 * 12
            if age >= filing_age:
                cumulative_filing += benefit_filing * 12

            if cumulative_filing >= cumulative_62 and age >= filing_age:
                return age

        return 85  # Default

    @classmethod
    def _get_filing_recommendation(cls, optimal_age: int, life_expectancy: int) -> str:
        """Get filing recommendation text."""
        if optimal_age == 62:
            return "Consider filing at 62 if you need income immediately or have shorter life expectancy"
        elif optimal_age == 70:
            return "Delay filing until 70 for maximum benefits if you're in good health and don't need immediate income"
        else:
            return f"Filing at {optimal_age} balances early access with benefit optimization for your life expectancy"

    @classmethod
    def _get_withdrawal_recommendation(cls, rate: float, portfolio: float) -> str:
        """Get withdrawal rate recommendation."""
        annual_withdrawal = portfolio * rate
        if rate <= 0.035:
            return f"Conservative withdrawal rate of {rate*100:.2f}% (${annual_withdrawal:,.0f}/year) provides high probability of success"
        elif rate <= 0.045:
            return f"Moderate withdrawal rate of {rate*100:.2f}% (${annual_withdrawal:,.0f}/year) balances income needs with portfolio longevity"
        else:
            return f"Aggressive withdrawal rate of {rate*100:.2f}% (${annual_withdrawal:,.0f}/year) - consider reducing expenses or working longer"
