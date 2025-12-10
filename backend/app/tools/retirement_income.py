"""
Retirement Income Modeling Tools
Includes Social Security, spending patterns, and longevity assumptions
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import date
from enum import Enum


class FilingStrategy(str, Enum):
    """Social Security filing strategies"""
    AGE_62 = "age_62"
    FULL_RETIREMENT = "full_retirement"
    AGE_70 = "age_70"
    CUSTOM = "custom"


class SpendingPhase(str, Enum):
    """Retirement spending phases"""
    GO_GO = "go_go"  # Active retirement (60-75)
    SLOW_GO = "slow_go"  # Less active (75-85)
    NO_GO = "no_go"  # Limited activity (85+)


class SocialSecurityParams(BaseModel):
    """Parameters for Social Security calculations"""
    primary_insurance_amount: float  # Monthly PIA at full retirement age
    birth_year: int
    filing_age: int  # Age when benefits start
    cola_rate: float = 0.025  # Cost of living adjustment (2.5% default)


class SocialSecurityResult(BaseModel):
    """Social Security calculation results"""
    monthly_benefit: float
    annual_benefit: float
    lifetime_benefits: Dict[int, float]  # Age -> cumulative benefits
    full_retirement_age: int
    reduction_percentage: float  # If filing early
    increase_percentage: float  # If filing late
    breakeven_age: int  # Age where delayed filing pays off
    # Original parameters (needed for income projections)
    primary_insurance_amount: float
    birth_year: int
    filing_age: int
    cola_rate: float


class SpendingPattern(BaseModel):
    """Retirement spending pattern by phase"""
    base_annual_spending: float
    go_go_multiplier: float = 1.0  # Ages 60-75: 100% of base
    slow_go_multiplier: float = 0.85  # Ages 75-85: 85% of base
    no_go_multiplier: float = 0.75  # Ages 85+: 75% of base
    healthcare_annual: float = 10000  # Annual healthcare costs
    healthcare_growth_rate: float = 0.06  # Healthcare inflation
    major_expenses: List[Dict] = []  # One-time expenses: {year, amount, description}


class LongevityAssumptions(BaseModel):
    """Longevity and life expectancy assumptions"""
    current_age: int
    gender: str  # "male" or "female"
    health_status: str = "average"  # "excellent", "good", "average", "poor"
    base_life_expectancy: int = 85  # Default
    planning_age: int = 95  # Plan to this age for safety
    survival_probabilities: Dict[int, float] = {}  # Age -> probability


class RetirementIncomeProjection(BaseModel):
    """Complete retirement income projection"""
    year: int
    age: int
    social_security: float
    pension: float
    portfolio_withdrawal: float
    other_income: float
    total_income: float
    total_expenses: float
    net_cash_flow: float


async def calculate_full_retirement_age(birth_year: int) -> int:
    """
    Calculate full retirement age based on birth year.

    SSA Full Retirement Age schedule:
    - Born 1943-1954: 66
    - Born 1955: 66 and 2 months
    - Born 1956: 66 and 4 months
    - Born 1957: 66 and 6 months
    - Born 1958: 66 and 8 months
    - Born 1959: 66 and 10 months
    - Born 1960 or later: 67
    """
    if birth_year <= 1954:
        return 66
    elif birth_year == 1955:
        return 66  # Simplified to 66 (actually 66 and 2 months)
    elif birth_year == 1956:
        return 66  # Simplified to 66 (actually 66 and 4 months)
    elif birth_year == 1957:
        return 66  # Simplified to 66 (actually 66 and 6 months)
    elif birth_year == 1958:
        return 67  # Simplified to 67 (actually 66 and 8 months)
    elif birth_year == 1959:
        return 67  # Simplified to 67 (actually 66 and 10 months)
    else:
        return 67


async def calculate_social_security(params: SocialSecurityParams) -> SocialSecurityResult:
    """
    Calculate Social Security benefits based on filing age.

    Benefits:
    - Age 62 (earliest): ~70% of PIA (30% reduction)
    - Full Retirement Age: 100% of PIA
    - Age 70 (latest): ~124% of PIA (24% increase)
    """
    full_retirement_age = await calculate_full_retirement_age(params.birth_year)

    # Calculate benefit adjustment based on filing age
    age_diff = params.filing_age - full_retirement_age

    if age_diff < 0:
        # Filing early: ~6.67% reduction per year (simplified)
        reduction_percentage = abs(age_diff) * 6.67
        monthly_benefit = params.primary_insurance_amount * (1 - reduction_percentage / 100)
        increase_percentage = 0
    elif age_diff > 0:
        # Filing late: 8% increase per year
        increase_percentage = min(age_diff * 8, 24)  # Max 24% at age 70
        monthly_benefit = params.primary_insurance_amount * (1 + increase_percentage / 100)
        reduction_percentage = 0
    else:
        # Filing at full retirement age
        monthly_benefit = params.primary_insurance_amount
        reduction_percentage = 0
        increase_percentage = 0

    annual_benefit = monthly_benefit * 12

    # Calculate lifetime benefits with COLA
    lifetime_benefits = {}
    cumulative = 0
    current_annual = annual_benefit

    for age in range(params.filing_age, 101):  # Project to age 100
        cumulative += current_annual
        lifetime_benefits[age] = cumulative
        current_annual *= (1 + params.cola_rate)  # Apply COLA

    # Calculate breakeven age (simplified)
    # Compare early filing vs delayed filing
    breakeven_age = full_retirement_age + 12  # Typical breakeven is ~12 years after FRA

    return SocialSecurityResult(
        monthly_benefit=monthly_benefit,
        annual_benefit=annual_benefit,
        lifetime_benefits=lifetime_benefits,
        full_retirement_age=full_retirement_age,
        reduction_percentage=reduction_percentage,
        increase_percentage=increase_percentage,
        breakeven_age=breakeven_age,
        # Include original parameters for income projections
        primary_insurance_amount=params.primary_insurance_amount,
        birth_year=params.birth_year,
        filing_age=params.filing_age,
        cola_rate=params.cola_rate
    )


async def calculate_spending_by_age(
    pattern: SpendingPattern,
    current_age: int,
    planning_age: int = 95,
    inflation_rate: float = 0.03
) -> Dict[int, float]:
    """
    Calculate annual spending by age incorporating spending phases.

    Spending typically follows a declining pattern:
    - Go-Go years (60-75): Active travel, hobbies (100% of base)
    - Slow-Go years (75-85): Reduced activity (85% of base)
    - No-Go years (85+): Minimal activity (75% of base)

    Healthcare costs increase with age.
    """
    spending_by_age = {}
    base_spending = pattern.base_annual_spending
    healthcare = pattern.healthcare_annual

    for age in range(current_age, planning_age + 1):
        years_from_now = age - current_age

        # Determine spending phase
        if age < 75:
            multiplier = pattern.go_go_multiplier
        elif age < 85:
            multiplier = pattern.slow_go_multiplier
        else:
            multiplier = pattern.no_go_multiplier

        # Inflate base spending
        inflated_base = base_spending * ((1 + inflation_rate) ** years_from_now)

        # Inflate healthcare with higher rate
        inflated_healthcare = healthcare * ((1 + pattern.healthcare_growth_rate) ** years_from_now)

        # Apply phase multiplier to base (not healthcare)
        total_spending = (inflated_base * multiplier) + inflated_healthcare

        # Add major expenses if any for this year
        for expense in pattern.major_expenses:
            if expense.get('year') == age:
                total_spending += expense.get('amount', 0)

        spending_by_age[age] = total_spending

    return spending_by_age


async def calculate_life_expectancy(assumptions: LongevityAssumptions) -> Dict:
    """
    Calculate life expectancy and survival probabilities.

    Based on SSA actuarial tables with adjustments for health status.
    """
    # Base life expectancy by gender (SSA 2023 data)
    base_expectations = {
        "male": 84,
        "female": 87
    }

    base_le = base_expectations.get(assumptions.gender.lower(), 85)

    # Adjust for health status
    health_adjustments = {
        "excellent": 4,
        "good": 2,
        "average": 0,
        "poor": -4
    }

    adjustment = health_adjustments.get(assumptions.health_status.lower(), 0)
    adjusted_le = base_le + adjustment

    # Calculate survival probabilities (simplified exponential decay)
    survival_probs = {}
    years_remaining = adjusted_le - assumptions.current_age

    for age in range(assumptions.current_age, 101):
        years_from_now = age - assumptions.current_age

        # Survival probability decreases exponentially
        # At life expectancy, probability is ~50%
        decay_rate = 0.693 / years_remaining  # ln(2) / years_remaining
        survival_prob = max(0, min(1, pow(0.5, years_from_now * decay_rate / years_remaining)))

        survival_probs[age] = survival_prob

    return {
        "base_life_expectancy": base_le,
        "adjusted_life_expectancy": adjusted_le,
        "planning_age": assumptions.planning_age,
        "survival_probabilities": survival_probs,
        "years_remaining": years_remaining,
        "median_lifespan": adjusted_le
    }


async def project_retirement_income(
    current_age: int,
    retirement_age: int,
    social_security: Optional[SocialSecurityResult] = None,
    pension_annual: float = 0,
    spending_pattern: Optional[SpendingPattern] = None,
    portfolio_withdrawal_rate: float = 0.04,
    initial_portfolio: float = 1000000,
    expected_return: float = 0.07,  # Expected annual return on investments (7% default)
    planning_age: int = 95
) -> List[RetirementIncomeProjection]:
    """
    Project complete retirement income and expenses by year.

    Combines all income sources and spending to show net cash flow.

    **Portfolio Growth Model:**
    - Applies expected annual returns to portfolio balance
    - Withdrawals reduce portfolio value
    - Net cash flow (income - expenses) affects portfolio balance
    - Models realistic portfolio depletion/growth over retirement
    """
    projections = []

    # Get spending by age if pattern provided
    if spending_pattern:
        spending_by_age = await calculate_spending_by_age(
            spending_pattern,
            retirement_age,
            planning_age
        )
    else:
        spending_by_age = {age: 50000 for age in range(retirement_age, planning_age + 1)}

    portfolio_value = initial_portfolio

    for year_num, age in enumerate(range(retirement_age, planning_age + 1)):
        # Apply investment returns at beginning of year (before withdrawals)
        # This models portfolio growth throughout retirement
        if year_num > 0:  # Don't apply returns in first year
            portfolio_value *= (1 + expected_return)

        # Social Security (if started)
        ss_income = 0
        if social_security and age >= social_security.filing_age:
            # Use cumulative benefits to get annual amount with COLA
            ages_list = sorted(social_security.lifetime_benefits.keys())
            if age in ages_list:
                idx = ages_list.index(age)
                if idx > 0:
                    ss_income = (
                        social_security.lifetime_benefits[age] -
                        social_security.lifetime_benefits[ages_list[idx - 1]]
                    )
                else:
                    ss_income = social_security.annual_benefit

        # Portfolio withdrawal
        # Use 4% rule but cap at portfolio value to avoid negative balances
        portfolio_withdrawal = min(
            portfolio_value * portfolio_withdrawal_rate,
            portfolio_value
        )

        # Total income
        total_income = ss_income + pension_annual + portfolio_withdrawal

        # Total expenses
        total_expenses = spending_by_age.get(age, 50000)

        # Net cash flow
        net_cash_flow = total_income - total_expenses

        # Update portfolio value
        # Subtract withdrawal and adjust for any surplus/deficit
        portfolio_value -= portfolio_withdrawal
        portfolio_value += (total_income - total_expenses - portfolio_withdrawal)  # Add surplus or subtract deficit
        portfolio_value = max(0, portfolio_value)  # Can't go negative

        projections.append(RetirementIncomeProjection(
            year=year_num,
            age=age,
            social_security=ss_income,
            pension=pension_annual,
            portfolio_withdrawal=portfolio_withdrawal,
            other_income=0,
            total_income=total_income,
            total_expenses=total_expenses,
            net_cash_flow=net_cash_flow
        ))

    return projections
