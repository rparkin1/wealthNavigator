"""
Budget AI Tools Unit Tests

Exercises prompt-driven helpers with mocked Anthropic client responses.
"""

from datetime import datetime
from typing import Any, List

import json
import pytest

from app.tools.budget_ai_tools import BudgetAITools


class FakeResponse:
    """Simple response wrapper replicating ChatAnthropic return value."""

    def __init__(self, content: str):
        self.content = content


class RecordingLLM:
    """Deterministic LLM stub returning queued payloads."""

    def __init__(self, responses: List[str]):
        self._responses = responses
        self.calls: List[List[dict[str, Any]]] = []

    def invoke(self, messages: List[dict[str, Any]]) -> FakeResponse:
        self.calls.append(messages)
        if not self._responses:
            raise RuntimeError("No more stubbed responses available")
        return FakeResponse(self._responses.pop(0))


class FailingLLM(RecordingLLM):
    """LLM stub that raises to exercise fallback paths."""

    def invoke(self, messages: List[dict[str, Any]]) -> FakeResponse:
        raise ValueError("stubbed failure")


class TestExtractBudgetFromConversation:
    """Tests for extracting structured entries via mocked responses."""

    def test_successful_extraction_adds_metadata(self):
        response_payload = json.dumps(
            [
                {
                    "category": "housing",
                    "name": "Rent",
                    "amount": 2200,
                    "frequency": "monthly",
                    "type": "expense",
                }
            ]
        )
        llm = RecordingLLM([response_payload])
        tools = BudgetAITools(llm=llm)

        entries = tools.extract_budget_from_conversation("Paying $2,200 rent each month.")

        assert len(entries) == 1
        entry = entries[0]
        assert entry["category"] == "housing"
        assert entry["extraction_method"] == "ai_conversation"
        # Verify extraction timestamp is ISO formatted
        datetime.fromisoformat(entry["extracted_at"])

    def test_invalid_json_returns_empty_list(self):
        llm = RecordingLLM(["{not valid json"])
        tools = BudgetAITools(llm=llm)

        entries = tools.extract_budget_from_conversation("My rent is $2k")

        assert entries == []

    def test_handles_markdown_code_block_response(self):
        response_payload = """Here you go:
```json
[{"category": "utilities", "name": "Electric", "amount": 95, "frequency": "monthly", "type": "expense"}]
```"""
        llm = RecordingLLM([response_payload])
        tools = BudgetAITools(llm=llm)

        entries = tools.extract_budget_from_conversation("Electric bill is $95 monthly")

        assert len(entries) == 1
        assert entries[0]["category"] == "utilities"


class TestCategorizeEntry:
    """Tests for entry categorization prompt flow."""

    def test_returns_category_payload(self):
        llm = RecordingLLM(['{"category": "housing", "confidence": 0.88}'])
        tools = BudgetAITools(llm=llm)

        result = tools.categorize_entry("Monthly rent payment")

        assert result["category"] == "housing"
        assert result["confidence"] == pytest.approx(0.88)

    def test_handles_llm_failure_with_fallback(self):
        tools = BudgetAITools(llm=FailingLLM([]))

        result = tools.categorize_entry("Something ambiguous")

        assert result["category"] == "miscellaneous"
        assert result["confidence"] == pytest.approx(0.0)
        assert "Categorization failed" in result["note"]


class TestSmartSuggestions:
    """Tests smart suggestion aggregation and prompt composition."""

    def test_generates_suggestions_and_aggregates_totals(self):
        llm = RecordingLLM(['{"health_score": 82, "health_category": "strong"}'])
        tools = BudgetAITools(llm=llm)

        budget_entries = [
            {
                "category": "salary",
                "type": "income",
                "amount": 3000,
                "frequency": "biweekly",
            },
            {
                "category": "housing",
                "type": "expense",
                "amount": 2400,
                "frequency": "monthly",
            },
            {
                "category": "food_dining",
                "type": "expense",
                "amount": 200,
                "frequency": "weekly",
            },
            {
                "category": "general_savings",
                "type": "savings",
                "amount": 500,
                "frequency": "monthly",
            },
        ]

        suggestions = tools.generate_smart_suggestions(budget_entries)

        assert suggestions["health_score"] == 82
        assert suggestions["health_category"] == "strong"

        # Validate prompt contained aggregated monthly totals
        prompt = llm.calls[-1][0]["content"]
        assert "Total Income: $6500.0/month" in prompt
        assert "Total Expenses: $3266.6666666666665/month" in prompt
        assert "Total Savings: $500.0/month" in prompt
        # Housing (2400) should appear before dining (~866)
        assert prompt.index("housing") < prompt.index("food_dining")

    def test_returns_default_on_generation_failure(self):
        llm = RecordingLLM(["not json"])
        tools = BudgetAITools(llm=llm)

        result = tools.generate_smart_suggestions(
            [
                {"category": "salary", "type": "income", "amount": 4000, "frequency": "monthly"},
            ]
        )

        assert result["health_score"] == 0
        assert result["health_category"] == "unknown"


class TestUtilityHelpers:
    """Tests for lightweight helper methods."""

    @pytest.mark.parametrize(
        "text,expected",
        [
            ("$1,250", 1250.0),
            ("1.5k", 1500.0),
            ("2m", 2_000_000.0),
            ("invalid", None),
        ],
    )
    def test_parse_amount(self, text: str, expected: float | None):
        tools = BudgetAITools(llm=RecordingLLM([]))
        assert tools.parse_amount(text) == expected

    @pytest.mark.parametrize(
        "text,expected",
        [
            ("Paid weekly for groceries", "weekly"),
            ("Bi-weekly paycheck", "biweekly"),
            ("Annual insurance payment", "annual"),
            ("One-time bonus", "one_time"),
            ("No keyword present", "monthly"),
        ],
    )
    def test_detect_frequency(self, text: str, expected: str):
        tools = BudgetAITools(llm=RecordingLLM([]))
        assert tools.detect_frequency(text) == expected


class TestPatternAnalysis:
    """Tests for budget pattern analysis tool."""

    def test_analyze_pattern_parses_llm_payload(self):
        llm = RecordingLLM(
            [
                """```json
{"is_recurring": true, "is_fixed": true, "variability": "low", "suggestions": ["keep paying on time"]}
```"""
            ]
        )
        tools = BudgetAITools(llm=llm)

        analysis = tools.analyze_pattern("Gym Membership", 60, "monthly", "fitness")

        assert analysis["is_recurring"] is True
        assert analysis["variability"] == "low"
