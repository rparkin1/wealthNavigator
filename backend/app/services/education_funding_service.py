"""
Education Funding Service

Comprehensive education planning for multiple children.
Implements REQ-GOAL-013 and REQ-GOAL-014: Education funding module.
"""

from typing import List, Dict, Optional
from datetime import datetime
from dataclasses import dataclass


@dataclass
class EducationCost:
    """Education cost projections."""
    tuition: float
    room_and_board: float
    books_and_supplies: float
    other_expenses: float
    total_annual: float


class EducationFundingService:
    """Service for education funding calculations and 529 planning."""

    # 2024-2025 Average Annual Costs (College Board data)
    EDUCATION_COSTS = {
        "public_in_state": {
            "tuition": 11250,
            "room_board": 12770,
            "books": 1250,
            "other": 2540,
        },
        "public_out_state": {
            "tuition": 29150,
            "room_board": 12770,
            "books": 1250,
            "other": 2540,
        },
        "private": {
            "tuition": 41540,
            "room_board": 14350,
            "books": 1250,
            "other": 2540,
        },
        "graduate_public": {
            "tuition": 13860,
            "room_board": 12770,
            "books": 1500,
            "other": 3000,
        },
        "graduate_private": {
            "tuition": 28650,
            "room_board": 14350,
            "books": 1500,
            "other": 3000,
        },
    }

    # Historical education inflation rate (typically 5-6% annually)
    EDUCATION_INFLATION_RATE = 0.055

    @classmethod
    def calculate_education_cost(
        cls,
        education_type: str,
        years_until_college: int,
        years_of_support: int = 4,
    ) -> EducationCost:
        """
        Calculate projected education costs.

        Args:
            education_type: Type of education (public_in_state, public_out_state, private)
            years_until_college: Years until child starts college
            years_of_support: Number of years to fund (4, 5, or 6)

        Returns:
            EducationCost object with projections
        """
        if education_type not in cls.EDUCATION_COSTS:
            education_type = "public_in_state"  # Default

        base_costs = cls.EDUCATION_COSTS[education_type]

        # Project costs to future year with inflation
        inflation_factor = (1 + cls.EDUCATION_INFLATION_RATE) ** years_until_college

        tuition = base_costs["tuition"] * inflation_factor
        room_board = base_costs["room_board"] * inflation_factor
        books = base_costs["books"] * inflation_factor
        other = base_costs["other"] * inflation_factor

        total_annual = tuition + room_board + books + other

        return EducationCost(
            tuition=tuition,
            room_and_board=room_board,
            books_and_supplies=books,
            other_expenses=other,
            total_annual=total_annual,
        )

    @classmethod
    def calculate_total_education_need(
        cls,
        education_type: str,
        child_age: int,
        college_start_age: int = 18,
        years_of_support: int = 4,
    ) -> float:
        """
        Calculate total education funding need.

        Args:
            education_type: Type of education
            child_age: Current age of child
            college_start_age: Age when college starts (default 18)
            years_of_support: Number of years (default 4)

        Returns:
            Total funding needed in today's dollars
        """
        years_until_college = max(0, college_start_age - child_age)

        total_need = 0.0

        # Calculate costs for each year of college
        for year in range(years_of_support):
            years_from_now = years_until_college + year
            cost = cls.calculate_education_cost(
                education_type,
                years_from_now,
                1
            )
            total_need += cost.total_annual

        return total_need

    @classmethod
    def calculate_529_strategy(
        cls,
        target_amount: float,
        current_savings: float,
        years_until_college: int,
        expected_return: float = 0.06,
        state_tax_deduction: float = 0.0,
    ) -> Dict:
        """
        Calculate optimal 529 plan contribution strategy.

        Args:
            target_amount: Total education funding goal
            current_savings: Current 529 balance
            years_until_college: Years until funds needed
            expected_return: Expected annual return (default 6%)
            state_tax_deduction: State tax deduction rate (0.0-1.0)

        Returns:
            529 contribution strategy
        """
        if years_until_college <= 0:
            return {
                "monthly_contribution": 0,
                "total_contributions": 0,
                "projected_balance": current_savings,
                "tax_savings": 0,
                "recommendation": "College starting soon - no additional contributions needed",
            }

        # Calculate required monthly contribution
        months = years_until_college * 12
        monthly_rate = expected_return / 12

        # Future value of current savings
        fv_current = current_savings * ((1 + monthly_rate) ** months)

        # Remaining amount needed
        remaining_need = target_amount - fv_current

        if remaining_need <= 0:
            return {
                "monthly_contribution": 0,
                "total_contributions": 0,
                "projected_balance": fv_current,
                "shortfall": 0,
                "tax_savings": 0,
                "recommendation": "Current savings sufficient - consider reallocating to other goals",
            }

        # Calculate monthly contribution needed (future value of annuity)
        # FV = PMT * [(1 + r)^n - 1] / r
        monthly_contribution = remaining_need * monthly_rate / (
            ((1 + monthly_rate) ** months) - 1
        )

        total_contributions = monthly_contribution * months

        # Calculate tax savings
        annual_contribution = monthly_contribution * 12
        annual_tax_savings = annual_contribution * state_tax_deduction
        total_tax_savings = annual_tax_savings * years_until_college

        return {
            "monthly_contribution": round(monthly_contribution, 2),
            "annual_contribution": round(annual_contribution, 2),
            "total_contributions": round(total_contributions, 2),
            "projected_balance": round(target_amount, 2),
            "shortfall": 0,
            "tax_savings": round(total_tax_savings, 2),
            "recommendation": f"Contribute ${monthly_contribution:.2f}/month to reach goal",
        }

    @classmethod
    def calculate_financial_aid_impact(
        cls,
        parent_income: float,
        parent_assets: float,
        student_assets: float,
        num_children: int = 1,
    ) -> Dict:
        """
        Estimate financial aid impact using simplified EFC calculation.

        Args:
            parent_income: Annual parent income
            parent_assets: Total parent assets (excluding home equity)
            student_assets: Student's assets
            num_children: Number of children in college

        Returns:
            Financial aid estimate
        """
        # Simplified Expected Family Contribution (EFC) calculation
        # Actual FAFSA formula is more complex

        # Parent contribution from income (roughly 22-47% of income above $30k)
        income_above_threshold = max(0, parent_income - 30000)
        parent_income_contribution = income_above_threshold * 0.30

        # Parent contribution from assets (5.64% max)
        parent_asset_contribution = parent_assets * 0.0564

        # Student contribution from assets (20%)
        student_asset_contribution = student_assets * 0.20

        # Total EFC
        efc = (
            parent_income_contribution +
            parent_asset_contribution +
            student_asset_contribution
        ) / num_children

        # Estimate need-based aid eligibility
        average_college_cost = 30000  # Simplified average
        need = max(0, average_college_cost - efc)

        return {
            "expected_family_contribution": round(efc, 2),
            "estimated_need_based_aid": round(need, 2),
            "parent_income_contribution": round(parent_income_contribution, 2),
            "parent_asset_contribution": round(parent_asset_contribution, 2),
            "student_asset_contribution": round(student_asset_contribution, 2),
            "recommendation": cls._get_aid_recommendation(efc, need),
        }

    @classmethod
    def _get_aid_recommendation(cls, efc: float, need: float) -> str:
        """Get financial aid recommendation."""
        if need > 20000:
            return "High need - significant financial aid likely available"
        elif need > 10000:
            return "Moderate need - some financial aid may be available"
        elif need > 5000:
            return "Low need - limited financial aid expected"
        else:
            return "Minimal need - plan to cover full cost"

    @classmethod
    def optimize_multi_child_funding(
        cls,
        children: List[Dict],
        total_monthly_savings: float,
    ) -> Dict[str, float]:
        """
        Optimize education funding across multiple children.

        Args:
            children: List of child dicts with age, education_type, years_support
            total_monthly_savings: Total available monthly savings

        Returns:
            Allocation per child
        """
        # Calculate priority score for each child
        priorities = []

        for child in children:
            years_until = max(0, 18 - child["age"])
            urgency_score = 1.0 / (years_until + 1)  # Higher score = more urgent

            total_need = cls.calculate_total_education_need(
                child["education_type"],
                child["age"],
                18,
                child.get("years_of_support", 4),
            )

            priorities.append({
                "child_name": child["name"],
                "urgency": urgency_score,
                "total_need": total_need,
                "priority_score": urgency_score * total_need,
            })

        # Sort by priority score (descending)
        priorities.sort(key=lambda x: x["priority_score"], reverse=True)

        # Allocate funds proportionally to priority scores
        total_priority = sum(p["priority_score"] for p in priorities)
        allocation = {}

        for p in priorities:
            if total_priority > 0:
                allocation[p["child_name"]] = (
                    (p["priority_score"] / total_priority) * total_monthly_savings
                )
            else:
                allocation[p["child_name"]] = total_monthly_savings / len(children)

        return allocation

    @classmethod
    def calculate_education_timeline(
        cls,
        children: List[Dict],
    ) -> List[Dict]:
        """
        Generate education timeline for multiple children.

        Args:
            children: List of child dicts

        Returns:
            Timeline of education milestones
        """
        timeline = []
        current_year = datetime.now().year

        for child in children:
            child_age = child["age"]
            years_support = child.get("years_of_support", 4)

            # Calculate key dates
            college_start_year = current_year + (18 - child_age)
            college_end_year = college_start_year + years_support

            timeline.append({
                "child_name": child["name"],
                "college_start_year": college_start_year,
                "college_end_year": college_end_year,
                "years_until_college": 18 - child_age,
                "education_type": child["education_type"],
                "estimated_annual_cost": cls.calculate_education_cost(
                    child["education_type"],
                    18 - child_age,
                    1
                ).total_annual,
            })

        # Sort by college start year
        timeline.sort(key=lambda x: x["college_start_year"])

        return timeline

    @classmethod
    def suggest_savings_vehicle(
        cls,
        years_until_college: int,
        state: str = None,
    ) -> Dict:
        """
        Suggest optimal education savings vehicle.

        Args:
            years_until_college: Years until funds needed
            state: State for tax benefits

        Returns:
            Recommendation with pros/cons
        """
        if years_until_college >= 10:
            return {
                "vehicle": "529 Plan",
                "rationale": "Long time horizon allows tax-free growth",
                "pros": [
                    "Tax-free growth and withdrawals for qualified expenses",
                    "High contribution limits ($300k+ lifetime)",
                    "State tax deduction (varies by state)",
                    "Can change beneficiary",
                ],
                "cons": [
                    "10% penalty + taxes on non-qualified withdrawals",
                    "Limited investment options",
                ],
            }
        elif years_until_college >= 5:
            return {
                "vehicle": "529 Plan + Taxable Account",
                "rationale": "Diversify with more flexibility",
                "pros": [
                    "529 for core education expenses",
                    "Taxable account for flexibility",
                    "No penalties on taxable withdrawals",
                ],
                "cons": [
                    "Taxable account subject to capital gains",
                ],
            }
        else:
            return {
                "vehicle": "High-Yield Savings + CDs",
                "rationale": "Preserve capital with college imminent",
                "pros": [
                    "No market risk",
                    "Guaranteed returns",
                    "Fully liquid",
                ],
                "cons": [
                    "Lower returns than investments",
                    "No tax advantages",
                ],
            }

    @classmethod
    def coordinate_grandparent_contributions(
        cls,
        child_name: str,
        parent_monthly_contribution: float,
        grandparent_annual_contribution: float,
        target_amount: float,
        current_savings: float,
        years_until_college: int,
        expected_return: float = 0.06,
    ) -> Dict:
        """
        Coordinate education funding with grandparent contributions.
        Implements REQ-GOAL-013: Grandparent contribution coordination.

        Args:
            child_name: Name of child
            parent_monthly_contribution: Parent's monthly 529 contribution
            grandparent_annual_contribution: Grandparent's annual gift
            target_amount: Total education funding goal
            current_savings: Current 529 balance
            years_until_college: Years until funds needed
            expected_return: Expected annual return

        Returns:
            Coordinated contribution strategy with tax optimization
        """
        if years_until_college <= 0:
            return {
                "strategy": "college_imminent",
                "recommendation": "College starting soon - contributions should be made directly to expenses",
                "parent_monthly": parent_monthly_contribution,
                "grandparent_annual": grandparent_annual_contribution,
                "total_projected": current_savings,
            }

        # Calculate future value of all contributions
        months = years_until_college * 12
        monthly_rate = expected_return / 12

        # Future value of current savings
        fv_current = current_savings * ((1 + monthly_rate) ** months)

        # Future value of parent contributions (monthly annuity)
        if parent_monthly_contribution > 0:
            fv_parent = parent_monthly_contribution * (
                (((1 + monthly_rate) ** months) - 1) / monthly_rate
            )
        else:
            fv_parent = 0

        # Future value of grandparent contributions (annual annuity)
        # Assuming contributions are made at the beginning of each year
        if grandparent_annual_contribution > 0:
            annual_rate = expected_return
            fv_grandparent = grandparent_annual_contribution * (
                (((1 + annual_rate) ** years_until_college) - 1) / annual_rate
            ) * (1 + annual_rate)
        else:
            fv_grandparent = 0

        total_projected = fv_current + fv_parent + fv_grandparent

        # Check if on track
        shortfall = max(0, target_amount - total_projected)
        surplus = max(0, total_projected - target_amount)

        # Tax considerations for grandparent gifts
        # Annual gift tax exclusion is $18,000 per person (2024)
        annual_gift_tax_exclusion = 18000
        grandparent_gift_tax_free = grandparent_annual_contribution <= annual_gift_tax_exclusion

        # 5-year accelerated 529 contribution option
        max_5year_contribution = annual_gift_tax_exclusion * 5
        can_use_5year_election = grandparent_annual_contribution <= max_5year_contribution

        # Generate recommendation
        if shortfall > 0:
            additional_monthly_needed = shortfall * monthly_rate / (
                ((1 + monthly_rate) ** months) - 1
            )
            recommendation = f"Projected shortfall of ${shortfall:,.0f}. Consider increasing parent contribution by ${additional_monthly_needed:,.2f}/month or increasing grandparent contribution."
        elif surplus > target_amount * 0.1:
            recommendation = f"Projected surplus of ${surplus:,.0f}. Consider reallocating excess to other financial goals or younger children."
        else:
            recommendation = f"On track to meet education goal! Projected balance: ${total_projected:,.0f}"

        # Tax optimization tips
        tax_tips = []
        if not grandparent_gift_tax_free:
            tax_tips.append(
                f"Grandparent contribution exceeds annual gift tax exclusion (${annual_gift_tax_exclusion:,}). Consider reducing to avoid gift tax filing requirement."
            )
        if can_use_5year_election and grandparent_annual_contribution > annual_gift_tax_exclusion:
            tax_tips.append(
                f"Consider 5-year election: Contribute up to ${max_5year_contribution:,} in one year and elect to spread over 5 years for gift tax purposes."
            )
        if grandparent_gift_tax_free:
            tax_tips.append(
                "Grandparent contributions are within annual gift tax exclusion - no gift tax filing required."
            )

        # FAFSA impact consideration
        fafsa_tip = "Note: Grandparent-owned 529 distributions may impact financial aid calculations. Consider timing distributions or transferring ownership to parent before FAFSA years."

        return {
            "child_name": child_name,
            "strategy": "coordinated",
            "parent_monthly": round(parent_monthly_contribution, 2),
            "parent_total_contributions": round(parent_monthly_contribution * months, 2),
            "parent_future_value": round(fv_parent, 2),
            "grandparent_annual": round(grandparent_annual_contribution, 2),
            "grandparent_total_contributions": round(
                grandparent_annual_contribution * years_until_college, 2
            ),
            "grandparent_future_value": round(fv_grandparent, 2),
            "current_savings_future_value": round(fv_current, 2),
            "total_projected": round(total_projected, 2),
            "target_amount": round(target_amount, 2),
            "shortfall": round(shortfall, 2),
            "surplus": round(surplus, 2),
            "on_track": shortfall == 0,
            "recommendation": recommendation,
            "tax_tips": tax_tips,
            "fafsa_consideration": fafsa_tip,
            "gift_tax_free": grandparent_gift_tax_free,
            "can_use_5year_election": can_use_5year_election,
        }

    @classmethod
    def optimize_multi_child_with_grandparents(
        cls,
        children: List[Dict],
        parent_monthly_savings: float,
        grandparent_annual_budget: float,
    ) -> Dict:
        """
        Optimize education funding across multiple children with grandparent contributions.
        Enhanced version of multi-child optimization.

        Args:
            children: List of child dicts with age, education_type, years_support
            parent_monthly_savings: Total parent monthly savings available
            grandparent_annual_budget: Total grandparent annual contribution budget

        Returns:
            Optimized allocation strategy with grandparent coordination
        """
        if not children:
            return {"allocations": {}, "grandparent_allocations": {}}

        # Calculate parent allocation (same as before)
        parent_allocations = cls.optimize_multi_child_funding(
            children, parent_monthly_savings
        )

        # Allocate grandparent contributions based on urgency and need
        grandparent_allocations = {}
        priorities = []

        for child in children:
            years_until = max(0, 18 - child["age"])
            # Higher priority for children closer to college
            urgency_score = 1.0 / (years_until + 1)

            total_need = cls.calculate_total_education_need(
                child["education_type"],
                child["age"],
                18,
                child.get("years_of_support", 4),
            )

            priorities.append({
                "child_name": child["name"],
                "urgency": urgency_score,
                "total_need": total_need,
                "priority_score": urgency_score * total_need,
            })

        # Sort by urgency (children closer to college get more)
        priorities.sort(key=lambda x: x["urgency"], reverse=True)

        # Allocate grandparent budget
        total_priority = sum(p["priority_score"] for p in priorities)

        for p in priorities:
            if total_priority > 0:
                grandparent_allocations[p["child_name"]] = (
                    (p["priority_score"] / total_priority) * grandparent_annual_budget
                )
            else:
                grandparent_allocations[p["child_name"]] = (
                    grandparent_annual_budget / len(children)
                )

        # Generate combined analysis
        combined_analysis = []
        for child in children:
            name = child["name"]
            parent_monthly = parent_allocations.get(name, 0)
            grandparent_annual = grandparent_allocations.get(name, 0)

            years_until = max(0, 18 - child["age"])
            total_need = cls.calculate_total_education_need(
                child["education_type"],
                child["age"],
                18,
                child.get("years_of_support", 4),
            )

            # Calculate if on track
            coordination = cls.coordinate_grandparent_contributions(
                child_name=name,
                parent_monthly_contribution=parent_monthly,
                grandparent_annual_contribution=grandparent_annual,
                target_amount=total_need,
                current_savings=child.get("current_savings", 0),
                years_until_college=years_until,
            )

            combined_analysis.append({
                "child": name,
                "parent_monthly": parent_monthly,
                "grandparent_annual": grandparent_annual,
                "total_need": total_need,
                "projected_total": coordination["total_projected"],
                "on_track": coordination["on_track"],
                "shortfall": coordination["shortfall"],
                "recommendation": coordination["recommendation"],
            })

        return {
            "parent_allocations": parent_allocations,
            "grandparent_allocations": grandparent_allocations,
            "combined_analysis": combined_analysis,
            "total_parent_monthly": sum(parent_allocations.values()),
            "total_grandparent_annual": sum(grandparent_allocations.values()),
        }
