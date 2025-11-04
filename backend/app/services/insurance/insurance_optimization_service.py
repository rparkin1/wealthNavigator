"""
Insurance Optimization Service

Provides comprehensive insurance analysis including:
- Life insurance needs calculation
- Disability coverage analysis
- Long-term care planning
- Insurance gap identification
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal


class InsuranceOptimizationService:
    """Service for insurance optimization calculations and recommendations"""

    # Life insurance multipliers by age
    INCOME_MULTIPLIERS = {
        "under_30": 20,
        "30_40": 15,
        "40_50": 12,
        "50_60": 10,
        "over_60": 5,
    }

    # Disability insurance replacement ratios
    DISABILITY_REPLACEMENT_RATIO = 0.60  # 60% of income

    # Long-term care costs (2025 averages)
    LTC_COSTS = {
        "home_health_aide": 60_000,  # Annual cost
        "assisted_living": 54_000,
        "nursing_home_semi_private": 94_000,
        "nursing_home_private": 108_000,
    }

    # Insurance policy types and characteristics
    POLICY_TYPES = {
        "term_life": {
            "name": "Term Life Insurance",
            "coverage_period": "Fixed term (10, 20, 30 years)",
            "cash_value": False,
            "typical_cost": "Low",
            "best_for": "Young families, mortgage protection",
        },
        "whole_life": {
            "name": "Whole Life Insurance",
            "coverage_period": "Lifetime",
            "cash_value": True,
            "typical_cost": "High",
            "best_for": "Estate planning, tax-advantaged savings",
        },
        "universal_life": {
            "name": "Universal Life Insurance",
            "coverage_period": "Lifetime with flexible premiums",
            "cash_value": True,
            "typical_cost": "Medium-High",
            "best_for": "Flexible coverage needs, investment growth",
        },
        "short_term_disability": {
            "name": "Short-Term Disability Insurance",
            "coverage_period": "3-6 months",
            "replacement_ratio": 0.60,
            "typical_cost": "1-3% of income",
            "best_for": "Income protection during recovery",
        },
        "long_term_disability": {
            "name": "Long-Term Disability Insurance",
            "coverage_period": "Until retirement age",
            "replacement_ratio": 0.60,
            "typical_cost": "1-3% of income",
            "best_for": "Career-ending disability protection",
        },
        "ltc_traditional": {
            "name": "Traditional Long-Term Care",
            "coverage_period": "Until benefits exhausted",
            "typical_daily_benefit": 150,
            "typical_cost": "Varies by age",
            "best_for": "Comprehensive LTC protection",
        },
        "ltc_hybrid": {
            "name": "Hybrid Life/LTC Insurance",
            "coverage_period": "Lifetime",
            "typical_daily_benefit": 100,
            "typical_cost": "Higher than traditional",
            "best_for": "Combined death benefit and LTC",
        },
    }

    def __init__(self):
        """Initialize insurance optimization service"""
        pass

    async def calculate_life_insurance_needs(
        self,
        annual_income: float,
        age: int,
        dependents: int,
        outstanding_debt: float,
        existing_coverage: float = 0.0,
        years_to_support: int = 20,
        college_funding_needed: float = 0.0,
        final_expenses: float = 15_000,
        current_savings: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive life insurance needs

        Methods used:
        - Income replacement (DIME method component)
        - Debt coverage
        - Future obligations (education)
        - Final expenses

        Returns:
            Dictionary with life insurance analysis
        """
        # Determine income multiplier based on age
        if age < 30:
            multiplier_key = "under_30"
        elif age < 40:
            multiplier_key = "30_40"
        elif age < 50:
            multiplier_key = "40_50"
        elif age < 60:
            multiplier_key = "50_60"
        else:
            multiplier_key = "over_60"

        income_multiplier = self.INCOME_MULTIPLIERS[multiplier_key]

        # Calculate needs
        income_replacement = annual_income * years_to_support
        debt_coverage = outstanding_debt
        education_funding = college_funding_needed * dependents
        final_expense_coverage = final_expenses

        # Total needs
        total_needs = (
            income_replacement
            + debt_coverage
            + education_funding
            + final_expense_coverage
        )

        # Subtract existing resources
        existing_resources = existing_coverage + current_savings
        net_need = max(0, total_needs - existing_resources)

        # Calculate premium estimates (rough estimates)
        term_premium_monthly = self._estimate_term_premium(net_need, age, years_to_support)
        whole_premium_monthly = term_premium_monthly * 8  # Whole life ~8x term cost

        # Recommendation
        recommendation = self._recommend_life_insurance_type(
            age, net_need, dependents, income_replacement
        )

        return {
            "total_needs": total_needs,
            "income_replacement_need": income_replacement,
            "debt_coverage_need": debt_coverage,
            "education_funding_need": education_funding,
            "final_expenses_need": final_expense_coverage,
            "existing_coverage": existing_coverage,
            "current_savings": current_savings,
            "net_insurance_need": net_need,
            "income_multiplier_used": income_multiplier,
            "years_of_support": years_to_support,
            "has_adequate_coverage": net_need == 0,
            "coverage_gap": net_need if net_need > 0 else 0,
            "estimated_term_premium_monthly": term_premium_monthly,
            "estimated_whole_premium_monthly": whole_premium_monthly,
            "recommendation": recommendation,
        }

    def _estimate_term_premium(
        self, coverage_amount: float, age: int, term_years: int
    ) -> float:
        """Estimate monthly term life insurance premium"""
        # Very rough estimates per $1,000 of coverage
        if age < 30:
            rate_per_thousand = 0.10
        elif age < 40:
            rate_per_thousand = 0.15
        elif age < 50:
            rate_per_thousand = 0.30
        elif age < 60:
            rate_per_thousand = 0.60
        else:
            rate_per_thousand = 1.20

        # Adjust for term length
        if term_years >= 30:
            rate_per_thousand *= 1.3
        elif term_years >= 20:
            rate_per_thousand *= 1.1

        return (coverage_amount / 1000) * rate_per_thousand

    def _recommend_life_insurance_type(
        self, age: int, coverage_need: float, dependents: int, income_replacement: float
    ) -> Dict[str, Any]:
        """Recommend appropriate life insurance type"""
        recommendations = []

        if coverage_need == 0:
            return {
                "primary": "none",
                "reason": "Adequate existing coverage",
                "alternatives": [],
            }

        # Term life for most situations with dependents
        if dependents > 0 and age < 60:
            recommendations.append({
                "type": "term_life",
                "term_length": min(30, 65 - age),
                "coverage_amount": coverage_need,
                "reason": "Most cost-effective for income replacement and debt protection",
                "priority": "high",
            })

        # Whole life for estate planning
        if coverage_need > 500_000 and age > 40:
            recommendations.append({
                "type": "whole_life",
                "coverage_amount": min(coverage_need, 1_000_000),
                "reason": "Estate liquidity and tax-advantaged wealth transfer",
                "priority": "medium",
            })

        # Universal life for flexibility
        if age < 50 and coverage_need > 250_000:
            recommendations.append({
                "type": "universal_life",
                "coverage_amount": coverage_need,
                "reason": "Flexible premiums with cash value accumulation",
                "priority": "medium",
            })

        if not recommendations:
            recommendations.append({
                "type": "term_life",
                "term_length": 10,
                "coverage_amount": coverage_need,
                "reason": "Basic coverage for final expenses",
                "priority": "medium",
            })

        return {
            "primary": recommendations[0]["type"],
            "recommended_coverage": recommendations[0]["coverage_amount"],
            "reason": recommendations[0]["reason"],
            "alternatives": recommendations[1:] if len(recommendations) > 1 else [],
        }

    async def analyze_disability_coverage(
        self,
        annual_income: float,
        age: int,
        occupation: str,
        existing_std_coverage: float = 0.0,
        existing_ltd_coverage: float = 0.0,
        emergency_fund_months: int = 3,
        has_employer_coverage: bool = False,
    ) -> Dict[str, Any]:
        """
        Analyze disability insurance needs

        Returns:
            Disability coverage analysis
        """
        # Calculate recommended coverage (60% of income)
        monthly_income = annual_income / 12
        recommended_monthly_benefit = monthly_income * self.DISABILITY_REPLACEMENT_RATIO

        # Short-term disability needs
        std_benefit_period_months = 6
        std_total_need = recommended_monthly_benefit * std_benefit_period_months

        emergency_fund_coverage = monthly_income * emergency_fund_months
        std_gap = max(0, std_total_need - existing_std_coverage - emergency_fund_coverage)

        # Long-term disability needs (until age 65)
        years_to_retirement = max(1, 65 - age)
        ltd_months = years_to_retirement * 12
        ltd_total_need = recommended_monthly_benefit * ltd_months

        ltd_gap = max(0, recommended_monthly_benefit - (existing_ltd_coverage / 1))

        # Cost estimates
        std_cost_annual = annual_income * 0.01  # ~1% of income
        ltd_cost_annual = annual_income * 0.02  # ~2% of income

        # Occupation risk classification
        occupation_risk = self._classify_occupation_risk(occupation)

        # Recommendations
        recommendations = []

        if std_gap > 0:
            recommendations.append({
                "coverage_type": "short_term_disability",
                "recommended_monthly_benefit": recommended_monthly_benefit,
                "benefit_period": "90-180 days",
                "elimination_period": "14-30 days",
                "estimated_annual_cost": std_cost_annual,
                "priority": "high" if emergency_fund_months < 6 else "medium",
                "reason": "Bridge income gap during recovery period",
            })

        if ltd_gap > 0:
            recommendations.append({
                "coverage_type": "long_term_disability",
                "recommended_monthly_benefit": recommended_monthly_benefit,
                "benefit_period": "Until age 65",
                "elimination_period": "90-180 days",
                "estimated_annual_cost": ltd_cost_annual,
                "priority": "high",
                "reason": "Protect against career-ending disability",
                "features": [
                    "Own occupation definition",
                    "Cost of living adjustments",
                    "Residual/partial disability benefits",
                    "Guaranteed renewable",
                ],
            })

        return {
            "annual_income": annual_income,
            "recommended_monthly_benefit": recommended_monthly_benefit,
            "replacement_ratio": self.DISABILITY_REPLACEMENT_RATIO,
            "short_term_disability": {
                "existing_coverage": existing_std_coverage,
                "recommended_coverage": std_total_need,
                "gap": std_gap,
                "has_adequate_coverage": std_gap == 0,
            },
            "long_term_disability": {
                "existing_monthly_coverage": existing_ltd_coverage,
                "recommended_monthly_benefit": recommended_monthly_benefit,
                "monthly_gap": ltd_gap,
                "has_adequate_coverage": ltd_gap == 0,
            },
            "occupation_risk": occupation_risk,
            "has_employer_coverage": has_employer_coverage,
            "recommendations": recommendations,
            "key_features_to_consider": [
                "Definition of disability (own occupation vs. any occupation)",
                "Benefit period (2 years, 5 years, or to age 65)",
                "Elimination period (waiting period before benefits start)",
                "Cost of living adjustments (COLA)",
                "Residual/partial disability benefits",
                "Non-cancelable and guaranteed renewable",
            ],
        }

    def _classify_occupation_risk(self, occupation: str) -> str:
        """Classify occupation risk level"""
        occupation_lower = occupation.lower()

        high_risk = ["construction", "police", "firefighter", "manual", "labor"]
        low_risk = ["office", "professional", "engineer", "manager", "executive"]

        if any(keyword in occupation_lower for keyword in high_risk):
            return "high"
        elif any(keyword in occupation_lower for keyword in low_risk):
            return "low"
        else:
            return "medium"

    async def calculate_ltc_needs(
        self,
        age: int,
        current_assets: float,
        annual_income: float,
        family_history_ltc: bool = False,
        preferred_care_level: str = "assisted_living",
        years_of_care: int = 3,
        has_existing_policy: bool = False,
        existing_daily_benefit: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Calculate long-term care insurance needs

        Returns:
            LTC planning analysis
        """
        # Get cost for preferred care level
        annual_care_cost = self.LTC_COSTS.get(
            preferred_care_level, self.LTC_COSTS["assisted_living"]
        )
        daily_care_cost = annual_care_cost / 365

        # Total care costs
        total_care_cost = annual_care_cost * years_of_care

        # Account for inflation (5% annual for healthcare)
        years_until_need = max(1, 75 - age)  # Assume LTC need at age 75
        inflation_factor = (1.05) ** years_until_need
        inflated_annual_cost = annual_care_cost * inflation_factor
        inflated_daily_cost = inflated_annual_cost / 365
        inflated_total_cost = inflated_annual_cost * years_of_care

        # Calculate if assets can cover
        can_self_insure = current_assets > inflated_total_cost * 2

        # Existing coverage value
        existing_coverage_value = existing_daily_benefit * 365 * years_of_care

        # Gap analysis
        coverage_gap = max(0, inflated_total_cost - existing_coverage_value)

        # Premium estimates (very rough)
        if age < 50:
            annual_premium = 1_500
        elif age < 55:
            annual_premium = 2_000
        elif age < 60:
            annual_premium = 3_000
        elif age < 65:
            annual_premium = 4_500
        else:
            annual_premium = 6_500

        # Adjust for coverage amount
        coverage_ratio = (inflated_daily_cost - existing_daily_benefit) / 150
        annual_premium *= max(0.5, coverage_ratio)

        # Risk assessment
        risk_level = "high" if family_history_ltc else "medium"
        if age > 60:
            risk_level = "high"

        # Recommendations
        recommendations = self._recommend_ltc_strategy(
            age, current_assets, inflated_total_cost, can_self_insure
        )

        return {
            "age": age,
            "preferred_care_level": preferred_care_level,
            "current_daily_cost": daily_care_cost,
            "current_annual_cost": annual_care_cost,
            "years_of_care_assumed": years_of_care,
            "years_until_likely_need": years_until_need,
            "inflated_daily_cost": inflated_daily_cost,
            "inflated_annual_cost": inflated_annual_cost,
            "total_inflated_cost": inflated_total_cost,
            "current_assets": current_assets,
            "can_self_insure": can_self_insure,
            "has_existing_policy": has_existing_policy,
            "existing_daily_benefit": existing_daily_benefit,
            "existing_coverage_value": existing_coverage_value,
            "coverage_gap": coverage_gap,
            "recommended_daily_benefit": inflated_daily_cost,
            "estimated_annual_premium": annual_premium,
            "risk_level": risk_level,
            "family_history": family_history_ltc,
            "recommendations": recommendations,
            "care_level_costs": {
                "home_health_aide": self.LTC_COSTS["home_health_aide"],
                "assisted_living": self.LTC_COSTS["assisted_living"],
                "nursing_home_semi_private": self.LTC_COSTS["nursing_home_semi_private"],
                "nursing_home_private": self.LTC_COSTS["nursing_home_private"],
            },
        }

    def _recommend_ltc_strategy(
        self, age: int, assets: float, total_cost: float, can_self_insure: bool
    ) -> List[Dict[str, Any]]:
        """Recommend LTC strategy"""
        recommendations = []

        if can_self_insure and age < 60:
            recommendations.append({
                "strategy": "self_insure",
                "description": "Consider self-insuring with high asset base",
                "priority": "medium",
                "reason": "Sufficient assets to cover LTC costs",
            })

        if age < 65:
            recommendations.append({
                "strategy": "traditional_ltc",
                "description": "Traditional long-term care insurance policy",
                "priority": "high" if not can_self_insure else "medium",
                "reason": "Comprehensive coverage with inflation protection",
                "key_features": [
                    "Daily benefit amount: $150-200",
                    "Benefit period: 3-5 years",
                    "90-day elimination period",
                    "5% compound inflation protection",
                ],
            })

        if age >= 50:
            recommendations.append({
                "strategy": "hybrid_life_ltc",
                "description": "Hybrid life insurance with LTC rider",
                "priority": "high" if can_self_insure else "medium",
                "reason": "Death benefit if LTC not needed, no use-it-or-lose-it",
                "key_features": [
                    "Guaranteed premiums",
                    "Death benefit if unused",
                    "Tax-free LTC benefits",
                    "No medical underwriting on some products",
                ],
            })

        if not can_self_insure and age > 65:
            recommendations.append({
                "strategy": "medicaid_planning",
                "description": "Medicaid planning with elder law attorney",
                "priority": "high",
                "reason": "Traditional LTC insurance may be too expensive",
            })

        return recommendations

    async def analyze_insurance_gaps(
        self,
        life_insurance_analysis: Dict[str, Any],
        disability_analysis: Dict[str, Any],
        ltc_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Comprehensive insurance gap analysis

        Returns:
            Summary of all insurance gaps and priorities
        """
        gaps = []
        total_annual_cost = 0.0
        critical_gaps = 0

        # Life insurance gaps
        if life_insurance_analysis.get("coverage_gap", 0) > 0:
            gap = {
                "category": "life_insurance",
                "description": "Insufficient life insurance coverage",
                "gap_amount": life_insurance_analysis["coverage_gap"],
                "annual_cost": life_insurance_analysis.get("estimated_term_premium_monthly", 0) * 12,
                "priority": "high" if life_insurance_analysis["coverage_gap"] > 500_000 else "medium",
                "recommendations": [life_insurance_analysis.get("recommendation", {})],
            }
            gaps.append(gap)
            total_annual_cost += gap["annual_cost"]
            if gap["priority"] == "high":
                critical_gaps += 1

        # Disability gaps
        std_gap = disability_analysis.get("short_term_disability", {}).get("gap", 0)
        ltd_gap = disability_analysis.get("long_term_disability", {}).get("monthly_gap", 0)

        if std_gap > 0 or ltd_gap > 0:
            gap = {
                "category": "disability_insurance",
                "description": "Insufficient disability coverage",
                "std_gap": std_gap,
                "ltd_monthly_gap": ltd_gap,
                "annual_cost": sum(
                    r.get("estimated_annual_cost", 0)
                    for r in disability_analysis.get("recommendations", [])
                ),
                "priority": "high",
                "recommendations": disability_analysis.get("recommendations", []),
            }
            gaps.append(gap)
            total_annual_cost += gap["annual_cost"]
            critical_gaps += 1

        # LTC gaps
        if ltc_analysis.get("coverage_gap", 0) > 0 and not ltc_analysis.get("can_self_insure"):
            gap = {
                "category": "long_term_care",
                "description": "No long-term care coverage",
                "gap_amount": ltc_analysis["coverage_gap"],
                "annual_cost": ltc_analysis.get("estimated_annual_premium", 0),
                "priority": "high" if ltc_analysis.get("age", 50) > 50 else "medium",
                "recommendations": ltc_analysis.get("recommendations", []),
            }
            gaps.append(gap)
            total_annual_cost += gap["annual_cost"]
            if gap["priority"] == "high":
                critical_gaps += 1

        # Overall risk assessment
        if critical_gaps >= 2:
            risk_level = "high"
        elif critical_gaps == 1:
            risk_level = "medium"
        elif len(gaps) > 0:
            risk_level = "low"
        else:
            risk_level = "none"

        return {
            "total_gaps_identified": len(gaps),
            "critical_gaps": critical_gaps,
            "overall_risk_level": risk_level,
            "total_annual_cost_to_close_gaps": total_annual_cost,
            "gaps": gaps,
            "priority_actions": self._generate_priority_actions(gaps),
            "summary": {
                "has_life_insurance_gap": any(g["category"] == "life_insurance" for g in gaps),
                "has_disability_gap": any(g["category"] == "disability_insurance" for g in gaps),
                "has_ltc_gap": any(g["category"] == "long_term_care" for g in gaps),
            },
        }

    def _generate_priority_actions(self, gaps: List[Dict[str, Any]]) -> List[str]:
        """Generate prioritized action items"""
        actions = []

        # Sort gaps by priority
        high_priority = [g for g in gaps if g["priority"] == "high"]
        medium_priority = [g for g in gaps if g["priority"] == "medium"]

        for gap in high_priority:
            if gap["category"] == "life_insurance":
                actions.append(
                    f"🚨 URGENT: Obtain ${gap['gap_amount']:,.0f} in term life insurance"
                )
            elif gap["category"] == "disability_insurance":
                actions.append(
                    "🚨 URGENT: Purchase long-term disability insurance covering 60% of income"
                )
            elif gap["category"] == "long_term_care":
                actions.append(
                    "🚨 URGENT: Explore long-term care insurance or hybrid policies"
                )

        for gap in medium_priority:
            if gap["category"] == "life_insurance":
                actions.append(
                    f"⚠️  Consider additional ${gap['gap_amount']:,.0f} life insurance coverage"
                )
            elif gap["category"] == "long_term_care":
                actions.append("⚠️  Begin researching long-term care options")

        if not actions:
            actions.append("✅ Insurance coverage appears adequate")

        return actions
