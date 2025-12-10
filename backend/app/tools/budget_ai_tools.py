"""
Budget AI Tools

Enhanced AI tools for budget data extraction, categorization, and analysis.
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from typing import Callable

# Optional LangChain Tool import; provide a fallback to avoid hard dependency
try:
    from langchain.tools import Tool as LC_Tool  # type: ignore
except Exception:  # pragma: no cover - environment may lack specific LC APIs
    LC_Tool = None  # type: ignore
from langchain_anthropic import ChatAnthropic

from app.agents.prompts.budget_extraction import (
    BUDGET_EXTRACTION_SYSTEM_PROMPT,
    BUDGET_CATEGORIZATION_PROMPT,
    get_budget_extraction_prompt,
    get_categorization_prompt,
    get_pattern_analysis_prompt,
    get_smart_suggestions_prompt,
)


class BudgetAITools:
    """AI-powered tools for budget management."""

    def __init__(self, llm: Optional[ChatAnthropic] = None):
        """Initialize budget AI tools.

        Args:
            llm: Language model instance. If None, creates default Sonnet 4.5 instance.
        """
        self.llm = llm or ChatAnthropic(
            model="claude-sonnet-4-20250514",
            temperature=0.3,  # Lower temperature for more consistent extraction
        )

    def extract_budget_from_conversation(
        self,
        conversation_text: str
    ) -> List[Dict[str, Any]]:
        """Extract budget entries from natural language conversation.

        Args:
            conversation_text: The conversation text to analyze

        Returns:
            List of extracted budget entries with metadata
        """
        try:
            prompt = get_budget_extraction_prompt(conversation_text)

            messages = [
                {"role": "system", "content": BUDGET_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]

            response = self.llm.invoke(messages)

            # Parse JSON response
            content = response.content

            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            entries = json.loads(content)

            # Validate and enrich entries
            validated_entries = []
            for entry in entries:
                if self._validate_budget_entry(entry):
                    # Add extraction metadata
                    entry["extracted_at"] = datetime.utcnow().isoformat()
                    entry["extraction_method"] = "ai_conversation"
                    validated_entries.append(entry)

            return validated_entries

        except Exception as e:
            print(f"Error extracting budget from conversation: {e}")
            return []

    def categorize_entry(
        self,
        entry_description: str,
        amount: Optional[float] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Categorize a budget entry using AI.

        Args:
            entry_description: Description of the budget entry
            amount: Optional amount for context
            context: Optional additional context

        Returns:
            Dictionary with category, confidence, and notes
        """
        try:
            prompt = get_categorization_prompt(entry_description)

            if amount:
                prompt += f"\nAmount: ${amount}"
            if context:
                prompt += f"\nContext: {context}"

            messages = [
                {"role": "system", "content": BUDGET_CATEGORIZATION_PROMPT},
                {"role": "user", "content": prompt}
            ]

            response = self.llm.invoke(messages)
            content = response.content

            # Extract JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except Exception as e:
            print(f"Error categorizing entry: {e}")
            return {
                "category": "miscellaneous",
                "confidence": 0.0,
                "note": f"Categorization failed: {str(e)}"
            }

    def analyze_pattern(
        self,
        entry_name: str,
        amount: float,
        frequency: str,
        category: str
    ) -> Dict[str, Any]:
        """Analyze patterns in a budget entry.

        Args:
            entry_name: Name/description of entry
            amount: Amount value
            frequency: Frequency (weekly, monthly, etc.)
            category: Budget category

        Returns:
            Pattern analysis results
        """
        try:
            prompt = get_pattern_analysis_prompt(
                entry_name, amount, frequency, category
            )

            messages = [
                {"role": "user", "content": prompt}
            ]

            response = self.llm.invoke(messages)
            content = response.content

            # Extract JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            analysis = json.loads(content)
            return analysis

        except Exception as e:
            print(f"Error analyzing pattern: {e}")
            return {
                "is_recurring": True,
                "is_fixed": False,
                "variability": "unknown",
                "suggestions": []
            }

    def generate_smart_suggestions(
        self,
        budget_entries: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate intelligent budget suggestions based on entries.

        Args:
            budget_entries: List of budget entries

        Returns:
            Smart suggestions and analysis
        """
        try:
            # Calculate totals
            total_income = sum(
                e["amount"] * self._get_frequency_multiplier(e["frequency"]) / 12
                for e in budget_entries if e["type"] == "income"
            )

            total_expenses = sum(
                e["amount"] * self._get_frequency_multiplier(e["frequency"]) / 12
                for e in budget_entries if e["type"] == "expense"
            )

            total_savings = sum(
                e["amount"] * self._get_frequency_multiplier(e["frequency"]) / 12
                for e in budget_entries if e["type"] == "savings"
            )

            # Calculate top categories
            category_totals = {}
            for entry in budget_entries:
                if entry["type"] == "expense":
                    cat = entry["category"]
                    annual = entry["amount"] * self._get_frequency_multiplier(entry["frequency"])
                    monthly = annual / 12
                    category_totals[cat] = category_totals.get(cat, 0) + monthly

            top_categories = [
                {
                    "name": cat,
                    "amount": amount,
                    "percent": (amount / total_expenses * 100) if total_expenses > 0 else 0
                }
                for cat, amount in sorted(
                    category_totals.items(),
                    key=lambda x: x[1],
                    reverse=True
                )
            ]

            # Get AI suggestions
            prompt = get_smart_suggestions_prompt(
                total_income,
                total_expenses,
                total_savings,
                top_categories
            )

            messages = [{"role": "user", "content": prompt}]
            response = self.llm.invoke(messages)
            content = response.content

            # Extract JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            suggestions = json.loads(content)
            return suggestions

        except Exception as e:
            print(f"Error generating suggestions: {e}")
            return {
                "health_score": 0,
                "health_category": "unknown",
                "concerns": ["Unable to analyze budget"],
                "opportunities": [],
                "recommendations": []
            }

    def parse_amount(self, amount_text: str) -> Optional[float]:
        """Parse amount from text using various formats.

        Args:
            amount_text: Text containing amount (e.g., "$2,200", "1.5k")

        Returns:
            Parsed amount or None if parsing fails
        """
        try:
            # Remove currency symbols and spaces
            text = amount_text.replace("$", "").replace(",", "").replace(" ", "").lower()

            # Handle k (thousands) and m (millions)
            if "k" in text:
                return float(text.replace("k", "")) * 1000
            elif "m" in text:
                return float(text.replace("m", "")) * 1_000_000
            else:
                return float(text)
        except:
            return None

    def detect_frequency(self, text: str) -> str:
        """Detect frequency from text.

        Args:
            text: Text potentially containing frequency information

        Returns:
            Detected frequency (defaults to "monthly")
        """
        text_lower = text.lower()

        if any(word in text_lower for word in ["biweekly", "bi-weekly", "every two weeks", "every other week"]):
            return "biweekly"
        elif any(word in text_lower for word in ["week", "weekly", "per week"]):
            return "weekly"
        elif any(word in text_lower for word in ["month", "monthly", "per month"]):
            return "monthly"
        elif any(word in text_lower for word in ["quarter", "quarterly", "every 3 months"]):
            return "quarterly"
        elif any(word in text_lower for word in ["year", "yearly", "annual", "annually", "per year"]):
            return "annual"
        elif any(word in text_lower for word in ["once", "one time", "one-time", "single"]):
            return "one_time"
        else:
            return "monthly"  # Default

    def _validate_budget_entry(self, entry: Dict[str, Any]) -> bool:
        """Validate a budget entry has required fields."""
        required_fields = ["category", "name", "amount", "frequency", "type"]
        return all(field in entry for field in required_fields)

    def _get_frequency_multiplier(self, frequency: str) -> float:
        """Get annual multiplier for frequency."""
        multipliers = {
            "weekly": 52,
            "biweekly": 26,
            "monthly": 12,
            "quarterly": 4,
            "annual": 1,
            "one_time": 0,
        }
        return multipliers.get(frequency, 12)


class SimpleTool:
    """Lightweight tool wrapper when LangChain Tool is unavailable."""

    def __init__(self, name: str, description: str, func: Callable[..., Any]):
        self.name = name
        self.description = description
        self.func = func

    def __call__(self, *args: Any, **kwargs: Any) -> Any:  # parity with LC tools
        return self.func(*args, **kwargs)


def create_budget_ai_tools(llm: Optional[ChatAnthropic] = None) -> List[object]:
    """Create LangChain tools for budget AI operations.

    Args:
        llm: Language model instance

    Returns:
        List of LangChain Tool instances
    """
    budget_tools = BudgetAITools(llm)

    mk = (lambda name, desc, fn: (LC_Tool(name=name, description=desc, func=fn) if LC_Tool else SimpleTool(name, desc, fn)))

    return [
        mk(
            name="extract_budget_from_conversation",
            description=(
                "Extract budget entries (income, expenses, savings) from natural language conversation. "
                "Use this when the user describes their budget in conversational form. "
                "Input: conversation text. Output: list of extracted budget entries with categories, amounts, and frequencies."
            ),
            fn=lambda text: json.dumps(budget_tools.extract_budget_from_conversation(text), indent=2)
        ),
        mk(
            name="categorize_budget_entry",
            description=(
                "Categorize a budget entry into the appropriate category (housing, food, transportation, etc.). "
                "Use this when you have an entry description but need to determine its category. "
                "Input: entry description. Output: category with confidence score."
            ),
            fn=lambda desc: json.dumps(budget_tools.categorize_entry(desc), indent=2)
        ),
        mk(
            name="analyze_budget_pattern",
            description=(
                "Analyze patterns in a budget entry to determine if it's recurring, fixed/variable, and provide optimization suggestions. "
                "Input: JSON with entry_name, amount, frequency, category. Output: pattern analysis."
            ),
            fn=lambda data: json.dumps(
                budget_tools.analyze_pattern(**json.loads(data)) if isinstance(data, str) else budget_tools.analyze_pattern(**data),
                indent=2
            )
        ),
        mk(
            name="generate_budget_suggestions",
            description=(
                "Generate intelligent budget suggestions based on user's budget entries. "
                "Analyzes spending patterns, identifies savings opportunities, and provides actionable recommendations. "
                "Input: list of budget entries. Output: suggestions with health score and recommendations."
            ),
            fn=lambda entries: json.dumps(
                budget_tools.generate_smart_suggestions(json.loads(entries) if isinstance(entries, str) else entries),
                indent=2
            )
        ),
    ]
