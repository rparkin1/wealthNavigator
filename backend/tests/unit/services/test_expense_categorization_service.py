"""
Expense Categorization Service Tests

Covers keyword matching, history overrides, recurring detection, and budget suggestions.
"""

from datetime import date, timedelta

import pytest

from app.models.budget import BudgetCategory, BudgetType
from app.models.plaid import PlaidTransaction
from app.services.expense_categorization_service import ExpenseCategorizationService


def build_transaction(
    *,
    transaction_id: str,
    amount: float,
    name: str,
    merchant: str | None = None,
    category: list[str] | None = None,
) -> PlaidTransaction:
    """Utility helper to construct PlaidTransaction entities for tests."""
    return PlaidTransaction(
        transaction_id=transaction_id,
        account_id="acct-001",
        user_id="user-123",
        amount=amount,
        date=date(2024, 1, 1),
        name=name,
        merchant_name=merchant,
        category=category or [],
    )


class TestCategorizeTransaction:
    """Unit tests for categorize_transaction heuristics."""

    def test_prefers_plaid_category_mapping(self):
        txn = build_transaction(
            transaction_id="txn-plaid-1",
            amount=-120.55,
            name="Weekly groceries",
            merchant="Trader Joe's",
            category=["Groceries", "Food"],
        )

        category, confidence = ExpenseCategorizationService.categorize_transaction(txn)

        assert category is BudgetCategory.FOOD_GROCERIES
        assert confidence == pytest.approx(0.90)

    def test_user_history_overrides_keywords(self):
        txn = build_transaction(
            transaction_id="txn-history-1",
            amount=-8.75,
            name="Coffee run",
            merchant="Starbucks Coffee LLC",
            category=[],
        )

        user_history = {"starbucks coffee": BudgetCategory.FOOD_DINING}

        category, confidence = ExpenseCategorizationService.categorize_transaction(
            txn,
            user_history=user_history,
        )

        assert category is BudgetCategory.FOOD_DINING
        assert confidence == pytest.approx(0.95)


class TestBudgetTypeDetection:
    """Tests for determining income/expense/savings classifications."""

    def test_negative_amount_savings_category(self):
        txn = build_transaction(
            transaction_id="txn-savings-1",
            amount=-500.0,
            name="Roth IRA contribution",
            merchant="Fidelity",
        )

        budget_type = ExpenseCategorizationService.determine_budget_type(
            txn,
            BudgetCategory.RETIREMENT_CONTRIBUTION,
        )

        assert budget_type is BudgetType.SAVINGS

    def test_positive_amount_treated_as_income(self):
        txn = build_transaction(
            transaction_id="txn-income-1",
            amount=3200.0,
            name="Biweekly paycheck",
            merchant="Employer Inc.",
        )

        budget_type = ExpenseCategorizationService.determine_budget_type(
            txn,
            BudgetCategory.SALARY,
        )

        assert budget_type is BudgetType.INCOME


class TestRecurringDetection:
    """Tests for recurring transaction frequency detection."""

    def test_detects_monthly_pattern(self):
        base = date(2024, 1, 1)
        similar_txns = [
            build_transaction(
                transaction_id=f"txn-month-{idx}",
                amount=-1200.0,
                name="Mortgage Payment",
                merchant="Ally Mortgage",
            )
            for idx in range(3)
        ]

        # Adjust transaction dates to be ~monthly apart
        similar_txns[0].date = base
        similar_txns[1].date = base + timedelta(days=30)
        similar_txns[2].date = base + timedelta(days=60)

        recurring, frequency = ExpenseCategorizationService.is_recurring(
            similar_txns[-1],
            similar_txns,
        )

        assert recurring is True
        assert frequency == "monthly"


class TestBudgetSuggestions:
    """Tests for budget improvement suggestions."""

    def test_flags_over_budget_categories(self):
        transactions = [
            build_transaction(
                transaction_id="txn-housing-1",
                amount=-1850.0,
                name="Monthly Mortgage",
                merchant="Mortgage Servicer",
            ),
            build_transaction(
                transaction_id="txn-food-1",
                amount=-95.0,
                name="Friday dinner",
                merchant="Local Bistro",
            ),
        ]

        budget_entries = [
            {"category": BudgetCategory.HOUSING, "amount": 1500.0},
            {"category": BudgetCategory.FOOD_DINING, "amount": 250.0},
        ]

        suggestions = ExpenseCategorizationService.suggest_budget_improvements(
            transactions,
            budget_entries,
        )

        assert suggestions, "Expected at least one suggestion"
        housing_tip = next(
            s for s in suggestions if s["category"] == BudgetCategory.HOUSING.value
        )
        assert housing_tip["type"] == "over_budget"
        assert housing_tip["actual"] > housing_tip["budgeted"]

    def test_identifies_under_and_missing_budget(self):
        transactions = [
            build_transaction(
                transaction_id="txn-gym-1",
                amount=-45.0,
                name="Gym membership",
                merchant="Planet Fitness",
            ),
            build_transaction(
                transaction_id="txn-stream-1",
                amount=-15.0,
                name="Streaming service",
                merchant="Netflix",
            ),
            build_transaction(
                transaction_id="txn-misc-1",
                amount=-210.0,
                name="Weekend getaway",
                merchant="Resort Travel",
            ),
        ]

        budget_entries = [
            {"category": BudgetCategory.ENTERTAINMENT, "amount": 200.0},
        ]

        suggestions = ExpenseCategorizationService.suggest_budget_improvements(
            transactions,
            budget_entries,
        )

        categories = {s["category"]: s["type"] for s in suggestions}
        assert categories[BudgetCategory.ENTERTAINMENT.value] == "under_budget"
        assert categories[BudgetCategory.TRAVEL.value] == "missing_budget"


class TestHistoryBuilder:
    """Tests for user history utilities."""

    def test_build_user_history_prefers_recent_categorization(self):
        history = ExpenseCategorizationService.build_user_history(
            [
                {"merchant_name": "Starbucks Coffee LLC", "category": BudgetCategory.FOOD_DINING},
                {"merchant_name": "Starbucks Coffee LLC", "category": BudgetCategory.SUBSCRIPTIONS},
                {"merchant_name": "NETFLIX * 12345", "category": BudgetCategory.SUBSCRIPTIONS},
            ]
        )

        assert history["starbucks coffee"] is BudgetCategory.SUBSCRIPTIONS
        assert history["netflix *"] is BudgetCategory.SUBSCRIPTIONS
