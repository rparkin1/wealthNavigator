"""
Estate Planning Service

Provides comprehensive estate planning calculations including:
- Estate tax calculations
- Trust structure optimization
- Beneficiary designation analysis
- Legacy goal planning
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal


class EstatePlanningService:
    """Service for estate planning calculations and recommendations"""

    # 2025 Federal Estate Tax Rates
    FEDERAL_ESTATE_TAX_EXEMPTION = 13_610_000  # 2025 exemption amount
    FEDERAL_ESTATE_TAX_RATE = 0.40  # 40% top rate

    # State estate tax thresholds (select states)
    STATE_ESTATE_TAX = {
        "MA": {"exemption": 2_000_000, "rate": 0.16},
        "NY": {"exemption": 6_940_000, "rate": 0.16},
        "OR": {"exemption": 1_000_000, "rate": 0.16},
        "WA": {"exemption": 2_193_000, "rate": 0.20},
        "IL": {"exemption": 4_000_000, "rate": 0.16},
        "CT": {"exemption": 13_610_000, "rate": 0.12},
    }

    # Trust types and characteristics
    TRUST_TYPES = {
        "revocable_living": {
            "name": "Revocable Living Trust",
            "estate_tax_benefit": False,
            "probate_avoidance": True,
            "asset_protection": False,
            "complexity": "low",
            "cost": 1500,
        },
        "irrevocable_life_insurance": {
            "name": "Irrevocable Life Insurance Trust (ILIT)",
            "estate_tax_benefit": True,
            "probate_avoidance": True,
            "asset_protection": True,
            "complexity": "medium",
            "cost": 3000,
        },
        "charitable_remainder": {
            "name": "Charitable Remainder Trust (CRT)",
            "estate_tax_benefit": True,
            "probate_avoidance": True,
            "asset_protection": False,
            "complexity": "high",
            "cost": 5000,
        },
        "dynasty": {
            "name": "Dynasty Trust",
            "estate_tax_benefit": True,
            "probate_avoidance": True,
            "asset_protection": True,
            "complexity": "high",
            "cost": 7500,
        },
        "qualified_personal_residence": {
            "name": "Qualified Personal Residence Trust (QPRT)",
            "estate_tax_benefit": True,
            "probate_avoidance": True,
            "asset_protection": False,
            "complexity": "high",
            "cost": 4000,
        },
        "grantor_retained_annuity": {
            "name": "Grantor Retained Annuity Trust (GRAT)",
            "estate_tax_benefit": True,
            "probate_avoidance": True,
            "asset_protection": False,
            "complexity": "high",
            "cost": 4500,
        },
    }

    def __init__(self):
        """Initialize estate planning service"""
        pass

    async def calculate_estate_tax(
        self,
        estate_value: float,
        state: Optional[str] = None,
        marital_status: str = "single",
        charitable_donations: float = 0.0,
        life_insurance_value: float = 0.0,
        debt_value: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Calculate federal and state estate taxes

        Args:
            estate_value: Total estate value
            state: Two-letter state code (optional)
            marital_status: "single" or "married"
            charitable_donations: Amount to charity
            life_insurance_value: Life insurance death benefit
            debt_value: Outstanding debts

        Returns:
            Dictionary with tax calculations
        """
        # Calculate gross estate
        gross_estate = estate_value + life_insurance_value

        # Deductions
        deductions = debt_value + charitable_donations
        taxable_estate = max(0, gross_estate - deductions)

        # Federal estate tax
        exemption = self.FEDERAL_ESTATE_TAX_EXEMPTION
        if marital_status == "married":
            exemption *= 2  # Portability of unused exemption

        federal_taxable = max(0, taxable_estate - exemption)
        federal_tax = federal_taxable * self.FEDERAL_ESTATE_TAX_RATE

        # State estate tax
        state_tax = 0.0
        state_exemption = 0.0
        if state and state.upper() in self.STATE_ESTATE_TAX:
            state_info = self.STATE_ESTATE_TAX[state.upper()]
            state_exemption = state_info["exemption"]
            state_taxable = max(0, taxable_estate - state_exemption)
            state_tax = state_taxable * state_info["rate"]

        # Total taxes
        total_tax = federal_tax + state_tax
        net_estate = taxable_estate - total_tax

        # Calculate effective rate
        effective_rate = (total_tax / taxable_estate * 100) if taxable_estate > 0 else 0

        return {
            "gross_estate": gross_estate,
            "deductions": deductions,
            "taxable_estate": taxable_estate,
            "federal_exemption": exemption,
            "federal_taxable_amount": federal_taxable,
            "federal_tax": federal_tax,
            "state_exemption": state_exemption,
            "state_taxable_amount": max(0, taxable_estate - state_exemption) if state else 0,
            "state_tax": state_tax,
            "total_tax": total_tax,
            "net_estate": net_estate,
            "effective_rate": effective_rate,
            "has_federal_tax_liability": federal_taxable > 0,
            "has_state_tax_liability": state_tax > 0,
        }

    async def recommend_trust_structures(
        self,
        estate_value: float,
        age: int,
        marital_status: str,
        has_children: bool,
        charitable_intent: bool,
        asset_protection_needs: bool,
        business_owner: bool,
    ) -> List[Dict[str, Any]]:
        """
        Recommend appropriate trust structures based on circumstances

        Returns:
            List of recommended trust structures with details
        """
        recommendations = []

        # Everyone should consider a revocable living trust
        recommendations.append({
            **self.TRUST_TYPES["revocable_living"],
            "priority": "high",
            "reason": "Avoids probate, maintains control, easy to amend",
            "suitability_score": 90,
        })

        # Estate tax planning trusts for larger estates
        if estate_value > self.FEDERAL_ESTATE_TAX_EXEMPTION * 0.7:

            # ILIT for life insurance
            recommendations.append({
                **self.TRUST_TYPES["irrevocable_life_insurance"],
                "priority": "high",
                "reason": "Removes life insurance from estate, reduces estate tax",
                "suitability_score": 85,
            })

            # Dynasty trust for multi-generational wealth
            if has_children and estate_value > self.FEDERAL_ESTATE_TAX_EXEMPTION:
                recommendations.append({
                    **self.TRUST_TYPES["dynasty"],
                    "priority": "medium",
                    "reason": "Multi-generational wealth transfer, asset protection",
                    "suitability_score": 75,
                })

            # QPRT for primary residence
            if age < 65:
                recommendations.append({
                    **self.TRUST_TYPES["qualified_personal_residence"],
                    "priority": "medium",
                    "reason": "Transfer home at reduced gift tax cost",
                    "suitability_score": 70,
                })

            # GRAT for appreciating assets
            if business_owner or estate_value > self.FEDERAL_ESTATE_TAX_EXEMPTION * 1.5:
                recommendations.append({
                    **self.TRUST_TYPES["grantor_retained_annuity"],
                    "priority": "medium",
                    "reason": "Transfer appreciating assets with minimal gift tax",
                    "suitability_score": 70,
                })

        # Charitable trust for philanthropic goals
        if charitable_intent and estate_value > 2_000_000:
            recommendations.append({
                **self.TRUST_TYPES["charitable_remainder"],
                "priority": "medium",
                "reason": "Income for life, remainder to charity, estate/income tax deduction",
                "suitability_score": 80,
            })

        # Sort by suitability score
        recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)

        return recommendations

    async def optimize_beneficiary_designations(
        self,
        accounts: List[Dict[str, Any]],
        beneficiaries: List[Dict[str, Any]],
        estate_plan_goals: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Optimize beneficiary designations for tax efficiency

        Args:
            accounts: List of accounts with types and values
            beneficiaries: List of beneficiaries with relationships
            estate_plan_goals: Goals for estate distribution

        Returns:
            Optimized beneficiary recommendations
        """
        recommendations = []
        tax_savings = 0.0

        # Separate accounts by type
        retirement_accounts = [a for a in accounts if a.get("account_type") in ["ira", "401k", "403b"]]
        taxable_accounts = [a for a in accounts if a.get("account_type") == "taxable"]
        roth_accounts = [a for a in accounts if a.get("account_type") in ["roth_ira", "roth_401k"]]

        # Find spouse and non-spouse beneficiaries
        spouse = next((b for b in beneficiaries if b.get("relationship") == "spouse"), None)
        children = [b for b in beneficiaries if b.get("relationship") == "child"]
        charities = [b for b in beneficiaries if b.get("relationship") == "charity"]

        # Strategy 1: Leave retirement accounts to spouse (if married)
        if spouse and retirement_accounts:
            recommendations.append({
                "strategy": "spousal_rollover",
                "accounts": [a["account_id"] for a in retirement_accounts],
                "beneficiary": spouse["beneficiary_id"],
                "reason": "Spouse can roll over to own IRA, defer taxes",
                "tax_benefit": "High -延迟税负，配偶展期优势",
                "priority": "high",
            })

        # Strategy 2: Leave Roth accounts to younger beneficiaries
        if children and roth_accounts:
            recommendations.append({
                "strategy": "roth_to_children",
                "accounts": [a["account_id"] for a in roth_accounts],
                "beneficiaries": [c["beneficiary_id"] for c in children],
                "reason": "Tax-free growth for decades in inherited Roth",
                "tax_benefit": "Very High - Tax-free withdrawals for beneficiaries",
                "priority": "high",
            })

        # Strategy 3: Leave taxable accounts to charities (if applicable)
        if charities and taxable_accounts:
            charity_amount = sum(a["value"] for a in taxable_accounts[:1])  # One account
            estate_tax_savings = charity_amount * self.FEDERAL_ESTATE_TAX_RATE

            recommendations.append({
                "strategy": "charitable_bequest",
                "accounts": [taxable_accounts[0]["account_id"]],
                "beneficiary": charities[0]["beneficiary_id"],
                "reason": "Estate tax deduction for charitable gifts",
                "tax_benefit": f"${estate_tax_savings:,.0f} estate tax savings",
                "priority": "medium",
            })

            tax_savings += estate_tax_savings

        # Strategy 4: Use trusts for minor children
        minor_children = [c for c in children if c.get("age", 18) < 18]
        if minor_children:
            recommendations.append({
                "strategy": "trust_for_minors",
                "beneficiaries": [c["beneficiary_id"] for c in minor_children],
                "reason": "Protect assets until children reach maturity",
                "tax_benefit": "Medium - Asset protection and distribution control",
                "priority": "high",
            })

        # Strategy 5: Contingent beneficiaries
        recommendations.append({
            "strategy": "contingent_beneficiaries",
            "accounts": "all",
            "reason": "Ensure assets pass to intended heirs if primary beneficiary predeceases",
            "tax_benefit": "Low - Avoids probate, ensures intent",
            "priority": "high",
        })

        return {
            "recommendations": recommendations,
            "estimated_tax_savings": tax_savings,
            "key_actions": [
                "Review and update all beneficiary designations annually",
                "Ensure consistency with overall estate plan",
                "Consider tax implications of each designation",
                "Use per stirpes designation for children to protect grandchildren",
                "Avoid naming estate as beneficiary (triggers probate)",
            ],
        }

    async def calculate_legacy_goal(
        self,
        desired_legacy_amount: float,
        current_estate_value: float,
        years_to_legacy: int,
        expected_return: float,
        state: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculate funding needed for legacy goal

        Args:
            desired_legacy_amount: Amount to leave to heirs/charity
            current_estate_value: Current net worth
            years_to_legacy: Years until estate transfer
            expected_return: Expected annual return on investments
            state: State for estate tax calculations

        Returns:
            Legacy goal analysis
        """
        # Calculate estate tax on desired legacy
        tax_calc = await self.calculate_estate_tax(
            estate_value=desired_legacy_amount,
            state=state,
            marital_status="single",  # Conservative estimate
        )

        # Gross estate needed to net desired legacy
        gross_estate_needed = desired_legacy_amount + tax_calc["total_tax"]

        # Calculate if on track
        future_value = current_estate_value * ((1 + expected_return) ** years_to_legacy)

        is_on_track = future_value >= gross_estate_needed
        shortfall = max(0, gross_estate_needed - future_value)
        surplus = max(0, future_value - gross_estate_needed)

        # Calculate required annual savings if shortfall
        if shortfall > 0:
            # Future value of annuity formula
            if expected_return > 0:
                annual_savings_needed = shortfall * expected_return / (
                    ((1 + expected_return) ** years_to_legacy) - 1
                )
            else:
                annual_savings_needed = shortfall / years_to_legacy
        else:
            annual_savings_needed = 0.0

        # Calculate life insurance as alternative
        life_insurance_needed = max(0, gross_estate_needed - current_estate_value)

        return {
            "desired_legacy": desired_legacy_amount,
            "estimated_estate_tax": tax_calc["total_tax"],
            "gross_estate_needed": gross_estate_needed,
            "current_estate_value": current_estate_value,
            "projected_estate_value": future_value,
            "is_on_track": is_on_track,
            "shortfall": shortfall,
            "surplus": surplus,
            "annual_savings_needed": annual_savings_needed,
            "monthly_savings_needed": annual_savings_needed / 12,
            "life_insurance_alternative": life_insurance_needed,
            "funding_strategies": self._generate_legacy_funding_strategies(
                shortfall, life_insurance_needed
            ),
        }

    def _generate_legacy_funding_strategies(
        self, shortfall: float, life_insurance_needed: float
    ) -> List[Dict[str, Any]]:
        """Generate strategies to fund legacy shortfall"""
        strategies = []

        if shortfall > 0:
            strategies.append({
                "strategy": "increase_savings",
                "description": "Increase annual savings to build estate value",
                "priority": "high",
            })

            if life_insurance_needed > 100_000:
                strategies.append({
                    "strategy": "life_insurance",
                    "description": f"Purchase ${life_insurance_needed:,.0f} life insurance policy",
                    "priority": "high",
                })

            strategies.append({
                "strategy": "charitable_gifting",
                "description": "Use charitable trusts to reduce estate tax burden",
                "priority": "medium",
            })

            strategies.append({
                "strategy": "gifting_strategy",
                "description": "Annual gifts to reduce estate size and provide liquidity to heirs",
                "priority": "medium",
            })

        return strategies

    async def analyze_gifting_strategy(
        self,
        estate_value: float,
        annual_gift_amount: float,
        years: int,
        expected_return: float,
    ) -> Dict[str, Any]:
        """
        Analyze impact of annual gifting on estate taxes

        Returns:
            Analysis of gifting strategy
        """
        # 2025 annual gift exclusion
        annual_exclusion = 18_000  # per recipient

        # Calculate estate with and without gifting
        future_estate_no_gifts = estate_value * ((1 + expected_return) ** years)

        # With gifting, estate grows slower but gifts also grow
        estate_after_gifts = estate_value
        total_gifts_future_value = 0

        for year in range(years):
            estate_after_gifts -= annual_gift_amount
            estate_after_gifts *= (1 + expected_return)

            # Gifts grow in recipients' hands
            gift_years_remaining = years - year
            gift_future_value = annual_gift_amount * ((1 + expected_return) ** gift_years_remaining)
            total_gifts_future_value += gift_future_value

        # Calculate taxes on both scenarios
        tax_no_gifts = await self.calculate_estate_tax(future_estate_no_gifts)
        tax_with_gifts = await self.calculate_estate_tax(estate_after_gifts)

        tax_savings = tax_no_gifts["total_tax"] - tax_with_gifts["total_tax"]

        # Total wealth transferred to heirs
        wealth_no_gifts = future_estate_no_gifts - tax_no_gifts["total_tax"]
        wealth_with_gifts = estate_after_gifts - tax_with_gifts["total_tax"] + total_gifts_future_value

        return {
            "annual_gift_amount": annual_gift_amount,
            "years_of_gifting": years,
            "total_gifts": annual_gift_amount * years,
            "estate_without_gifting": future_estate_no_gifts,
            "estate_with_gifting": estate_after_gifts,
            "gifts_future_value": total_gifts_future_value,
            "tax_without_gifting": tax_no_gifts["total_tax"],
            "tax_with_gifting": tax_with_gifts["total_tax"],
            "tax_savings": tax_savings,
            "wealth_transferred_no_gifts": wealth_no_gifts,
            "wealth_transferred_with_gifts": wealth_with_gifts,
            "additional_wealth": wealth_with_gifts - wealth_no_gifts,
            "is_within_annual_exclusion": annual_gift_amount <= annual_exclusion,
            "gift_tax_applicable": annual_gift_amount > annual_exclusion,
        }
