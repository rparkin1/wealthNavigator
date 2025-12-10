"""
Tax Treatment Service

Automatically assigns tax treatment to budget entries based on category and context.
Implements REQ-BUD-002: System shall automatically categorize income by tax treatment.
"""

from typing import Optional, Dict, Tuple
from app.models.budget import BudgetCategory, TaxTreatment


class TaxTreatmentService:
    """Service for assigning tax treatment to budget entries."""

    # Mapping of budget categories to default tax treatments
    CATEGORY_TAX_TREATMENT_MAP: Dict[BudgetCategory, TaxTreatment] = {
        # Income categories
        BudgetCategory.SALARY: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.WAGES: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.BONUS: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.COMMISSION: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.SELF_EMPLOYMENT: TaxTreatment.SELF_EMPLOYMENT,
        BudgetCategory.BUSINESS_INCOME: TaxTreatment.SELF_EMPLOYMENT,
        BudgetCategory.FREELANCE: TaxTreatment.SELF_EMPLOYMENT,
        BudgetCategory.RENTAL_INCOME: TaxTreatment.RENTAL_INCOME,
        BudgetCategory.DIVIDENDS: TaxTreatment.QUALIFIED_DIVIDENDS,  # Assume qualified by default
        BudgetCategory.INTEREST: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.CAPITAL_GAINS: TaxTreatment.LONG_TERM_CAPITAL_GAINS,  # Assume long-term by default
        BudgetCategory.SOCIAL_SECURITY: TaxTreatment.SOCIAL_SECURITY,
        BudgetCategory.PENSION: TaxTreatment.PENSION,
        BudgetCategory.ANNUITY: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.INVESTMENT_INCOME: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.GOVERNMENT_BENEFITS: TaxTreatment.NON_TAXABLE,
        BudgetCategory.CHILD_SUPPORT: TaxTreatment.NON_TAXABLE,
        BudgetCategory.ALIMONY: TaxTreatment.ORDINARY_INCOME,
        BudgetCategory.TAX_REFUND: TaxTreatment.NON_TAXABLE,
        BudgetCategory.GIFTS: TaxTreatment.NON_TAXABLE,
        BudgetCategory.OTHER_INCOME: TaxTreatment.OTHER,

        # Savings categories that may have tax implications
        BudgetCategory.RETIREMENT_CONTRIBUTION: TaxTreatment.TAX_DEFERRED,
        BudgetCategory.HSA_FSA: TaxTreatment.TAX_DEFERRED,
    }

    # Categories that are typically pre-tax deductions
    PRE_TAX_CATEGORIES = {
        BudgetCategory.RETIREMENT_CONTRIBUTION,
        BudgetCategory.HSA_FSA,
    }

    # Categories that are typically tax deductible
    DEDUCTIBLE_CATEGORIES = {
        BudgetCategory.HEALTHCARE,  # Medical expenses > 7.5% AGI
        BudgetCategory.EDUCATION,  # Tuition, student loan interest
        BudgetCategory.CHILDCARE,  # Dependent care FSA
        BudgetCategory.GIFTS_DONATIONS,  # Charitable contributions
        BudgetCategory.TAXES,  # State/local taxes (SALT, limited to $10k)
        BudgetCategory.HOUSING,  # Mortgage interest, property tax (if itemizing)
    }

    @classmethod
    def assign_tax_treatment(
        cls,
        category: BudgetCategory,
        amount: float,
        name: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Tuple[Optional[TaxTreatment], bool, bool]:
        """
        Assign tax treatment based on category and context.

        Args:
            category: Budget category
            amount: Amount (for context)
            name: Entry name (for context)
            notes: Entry notes (for context)

        Returns:
            Tuple of (tax_treatment, is_pre_tax, is_deductible)
        """
        # Get default tax treatment from category
        tax_treatment = cls.CATEGORY_TAX_TREATMENT_MAP.get(category)

        # Determine if pre-tax
        is_pre_tax = category in cls.PRE_TAX_CATEGORIES

        # Determine if deductible
        is_deductible = category in cls.DEDUCTIBLE_CATEGORIES

        # Refine based on context (name, notes)
        if name or notes:
            context = f"{name or ''} {notes or ''}".lower()

            # Check for specific keywords
            if tax_treatment == TaxTreatment.QUALIFIED_DIVIDENDS:
                # Check if non-qualified dividends
                if any(keyword in context for keyword in ['non-qualified', 'ordinary dividend', 'reit']):
                    tax_treatment = TaxTreatment.ORDINARY_INCOME

            elif tax_treatment == TaxTreatment.LONG_TERM_CAPITAL_GAINS:
                # Check if short-term capital gains
                if any(keyword in context for keyword in ['short-term', 'short term', 'held less than']):
                    tax_treatment = TaxTreatment.SHORT_TERM_CAPITAL_GAINS

            # Check for 401k/403b/457 keywords (pre-tax)
            if any(keyword in context for keyword in ['401k', '403b', '457', 'traditional ira']):
                is_pre_tax = True
                tax_treatment = TaxTreatment.TAX_DEFERRED

            # Check for Roth keywords (not pre-tax, but tax-exempt growth)
            if any(keyword in context for keyword in ['roth', 'after-tax']):
                is_pre_tax = False
                tax_treatment = TaxTreatment.TAX_EXEMPT

            # Check for HSA/FSA keywords
            if any(keyword in context for keyword in ['hsa', 'health savings', 'fsa', 'flexible spending']):
                is_pre_tax = True
                is_deductible = True
                tax_treatment = TaxTreatment.TAX_DEFERRED

            # Check for mortgage interest
            if 'mortgage' in context and 'interest' in context:
                is_deductible = True

            # Check for charitable donations
            if any(keyword in context for keyword in ['donation', 'charity', 'charitable', 'gift to']):
                is_deductible = True

        return tax_treatment, is_pre_tax, is_deductible

    @classmethod
    def estimate_tax_liability(
        cls,
        income_amount: float,
        tax_treatment: TaxTreatment,
        filing_status: str = "single",
        is_pre_tax: bool = False,
    ) -> float:
        """
        Estimate tax liability for an income entry.

        Args:
            income_amount: Annual income amount
            tax_treatment: Tax treatment type
            filing_status: "single", "married_joint", "married_separate", "head_of_household"
            is_pre_tax: Whether this is pre-tax (reduces taxable income)

        Returns:
            Estimated annual tax liability
        """
        if is_pre_tax:
            # Pre-tax contributions reduce taxable income
            return 0.0

        # 2024 Federal tax rates (simplified)
        if tax_treatment == TaxTreatment.ORDINARY_INCOME:
            # Assume 22% marginal rate (typical middle-class rate)
            return income_amount * 0.22

        elif tax_treatment == TaxTreatment.QUALIFIED_DIVIDENDS:
            # 15% rate for most taxpayers
            return income_amount * 0.15

        elif tax_treatment == TaxTreatment.LONG_TERM_CAPITAL_GAINS:
            # 15% rate for most taxpayers
            return income_amount * 0.15

        elif tax_treatment == TaxTreatment.SHORT_TERM_CAPITAL_GAINS:
            # Taxed as ordinary income
            return income_amount * 0.22

        elif tax_treatment == TaxTreatment.SELF_EMPLOYMENT:
            # SE tax (15.3%) + income tax (22%)
            return income_amount * 0.153 + income_amount * 0.22

        elif tax_treatment == TaxTreatment.SOCIAL_SECURITY:
            # Assume 50-85% taxable at 22%
            return income_amount * 0.70 * 0.22

        elif tax_treatment == TaxTreatment.PENSION:
            # Taxed as ordinary income
            return income_amount * 0.22

        elif tax_treatment in [TaxTreatment.TAX_EXEMPT, TaxTreatment.NON_TAXABLE]:
            return 0.0

        else:
            # Default to 22% for unknown types
            return income_amount * 0.22

    @classmethod
    def calculate_after_tax_income(
        cls,
        gross_income: float,
        tax_treatment: TaxTreatment,
        is_pre_tax: bool = False,
    ) -> float:
        """
        Calculate after-tax income.

        Args:
            gross_income: Gross income amount
            tax_treatment: Tax treatment type
            is_pre_tax: Whether this is pre-tax

        Returns:
            After-tax income amount
        """
        tax_liability = cls.estimate_tax_liability(
            gross_income, tax_treatment, is_pre_tax=is_pre_tax
        )
        return gross_income - tax_liability

    @classmethod
    def get_tax_treatment_description(cls, tax_treatment: TaxTreatment) -> str:
        """Get human-readable description of tax treatment."""
        descriptions = {
            TaxTreatment.ORDINARY_INCOME: "Taxed as ordinary income at marginal tax rate (10%-37%)",
            TaxTreatment.QUALIFIED_DIVIDENDS: "Taxed at preferential rates (0%, 15%, or 20%)",
            TaxTreatment.LONG_TERM_CAPITAL_GAINS: "Assets held >1 year, taxed at 0%, 15%, or 20%",
            TaxTreatment.SHORT_TERM_CAPITAL_GAINS: "Assets held ≤1 year, taxed as ordinary income",
            TaxTreatment.TAX_EXEMPT: "Tax-free (e.g., municipal bonds, Roth withdrawals)",
            TaxTreatment.TAX_DEFERRED: "Taxes deferred until withdrawal (e.g., traditional IRA/401k)",
            TaxTreatment.NON_TAXABLE: "Not subject to income tax (e.g., gifts, return of capital)",
            TaxTreatment.SELF_EMPLOYMENT: "Subject to self-employment tax (15.3%) + income tax",
            TaxTreatment.RENTAL_INCOME: "Passive income with deductions for expenses and depreciation",
            TaxTreatment.SOCIAL_SECURITY: "50-85% taxable depending on combined income",
            TaxTreatment.PENSION: "Taxed as ordinary income (unless Roth portion)",
            TaxTreatment.OTHER: "Tax treatment varies; consult tax advisor",
        }
        return descriptions.get(tax_treatment, "Unknown tax treatment")

    @classmethod
    def get_tax_optimization_tips(cls, tax_treatment: TaxTreatment) -> list[str]:
        """Get tax optimization tips for this tax treatment."""
        tips = {
            TaxTreatment.ORDINARY_INCOME: [
                "Maximize pre-tax retirement contributions (401k, traditional IRA)",
                "Consider HSA contributions to reduce taxable income",
                "Time bonuses to minimize tax impact",
            ],
            TaxTreatment.QUALIFIED_DIVIDENDS: [
                "Hold dividend-paying stocks in taxable accounts for preferential rates",
                "Consider dividend reinvestment plans (DRIPs)",
            ],
            TaxTreatment.LONG_TERM_CAPITAL_GAINS: [
                "Hold assets >1 year for preferential tax rates",
                "Consider tax-loss harvesting to offset gains",
                "Time sales to stay in 0% LTCG bracket if possible",
            ],
            TaxTreatment.SHORT_TERM_CAPITAL_GAINS: [
                "Avoid short-term trading to minimize taxes",
                "Hold assets >1 year for preferential tax treatment",
                "Consider tax-loss harvesting to offset gains",
            ],
            TaxTreatment.SELF_EMPLOYMENT: [
                "Make quarterly estimated tax payments to avoid penalties",
                "Consider SEP-IRA or Solo 401(k) for tax-deductible retirement savings",
                "Track all business expenses for deductions",
                "Consider S-Corp election to reduce SE tax",
            ],
            TaxTreatment.RENTAL_INCOME: [
                "Track all rental expenses (repairs, management, insurance)",
                "Depreciate property over 27.5 years",
                "Consider short-term rental restrictions",
                "Track mileage for property visits",
            ],
        }
        return tips.get(tax_treatment, [])
