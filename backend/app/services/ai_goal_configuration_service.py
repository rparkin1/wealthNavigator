"""
AI-Powered Goal Configuration Service

Implements REQ-GOAL-004, REQ-GOAL-005, REQ-GOAL-006:
- Natural language goal definition
- AI clarifying questions and suggestions
- Personalized recommendations and trade-off analysis
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import json
from anthropic import Anthropic
import os

from app.models.goal import GoalCategory, GoalPriority


class AIGoalConfigurationService:
    """Service for AI-powered goal configuration and recommendations."""

    def __init__(self):
        """Initialize Anthropic client for Claude AI."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-5-20250929"

    def parse_natural_language_goal(
        self,
        user_input: str,
        user_context: Optional[Dict] = None
    ) -> Dict:
        """
        Parse natural language goal description into structured format.

        Args:
            user_input: User's goal description in plain English
            user_context: Optional context (age, income, location, existing goals)

        Returns:
            Structured goal with extracted parameters

        REQ-GOAL-004: Natural language interface for goal definition
        """
        context_str = self._build_context_string(user_context) if user_context else ""

        prompt = f"""You are a financial planning assistant helping users define their financial goals.

{context_str}

The user has described a goal: "{user_input}"

Extract the following information from their description:
1. Goal category (retirement, education, home, major_expense, emergency, legacy)
2. Target amount (if mentioned)
3. Target date or time horizon (if mentioned)
4. Priority level (essential, important, aspirational)
5. Any specific requirements or constraints

Return a JSON object with:
{{
    "goal_category": "category",
    "target_amount": numeric value or null,
    "target_date": "YYYY-MM-DD" or null,
    "time_horizon_years": number or null,
    "priority": "essential|important|aspirational",
    "description": "cleaned up description",
    "clarifying_questions": ["question1", "question2"],
    "extracted_requirements": ["requirement1", "requirement2"],
    "confidence": 0.0-1.0
}}

Only include clarifying questions if information is missing or ambiguous.
Provide a confidence score based on how complete the information is."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse Claude's response
        result_text = response.content[0].text

        # Extract JSON from response
        try:
            # Find JSON in response
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = result_text[start_idx:end_idx]
                parsed_goal = json.loads(json_str)
            else:
                # Fallback parsing
                parsed_goal = self._fallback_parsing(user_input)
        except json.JSONDecodeError:
            parsed_goal = self._fallback_parsing(user_input)

        return parsed_goal

    def generate_clarifying_questions(
        self,
        partial_goal: Dict,
        user_context: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Generate clarifying questions for ambiguous or incomplete goals.

        Args:
            partial_goal: Partially defined goal
            user_context: User context information

        Returns:
            List of clarifying questions with suggested answers

        REQ-GOAL-005: AI asking clarifying questions
        """
        context_str = self._build_context_string(user_context) if user_context else ""

        prompt = f"""You are helping a user fully define their financial goal.

{context_str}

Current goal information:
{json.dumps(partial_goal, indent=2)}

Generate 2-4 clarifying questions to complete the goal definition. Focus on:
1. Missing critical information (amount, date, specifics)
2. Ambiguities that affect planning
3. Important assumptions to validate

For each question, provide:
- The question text
- Why it's important for planning
- Suggested answer options (if applicable)
- Default/typical values

Return JSON array:
[
    {{
        "question": "question text",
        "importance": "why this matters",
        "answer_type": "number|date|choice|text",
        "options": ["option1", "option2"] or null,
        "default_value": "suggested default",
        "planning_impact": "how this affects the plan"
    }}
]"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        result_text = response.content[0].text

        try:
            start_idx = result_text.find('[')
            end_idx = result_text.rfind(']') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = result_text[start_idx:end_idx]
                questions = json.loads(json_str)
            else:
                questions = []
        except json.JSONDecodeError:
            questions = []

        return questions

    def suggest_typical_costs(
        self,
        goal_category: str,
        location: Optional[str] = None,
        user_context: Optional[Dict] = None
    ) -> Dict:
        """
        Suggest typical costs for common goals based on location and circumstances.

        Args:
            goal_category: Type of goal
            location: User's location (city, state)
            user_context: Additional context

        Returns:
            Cost suggestions with ranges

        REQ-GOAL-005: Suggesting typical costs for common goals
        """
        location_str = f"Location: {location}" if location else "Location: United States (national average)"
        context_str = self._build_context_string(user_context) if user_context else ""

        prompt = f"""Provide typical cost estimates for a {goal_category} goal.

{location_str}
{context_str}

Based on current data (2024-2025), provide:
1. Typical cost range (low, medium, high)
2. Factors that affect cost
3. Regional adjustments (if location provided)
4. Current market conditions
5. Inflation considerations

Return JSON:
{{
    "goal_category": "{goal_category}",
    "cost_estimates": {{
        "low": number,
        "medium": number,
        "high": number,
        "currency": "USD"
    }},
    "cost_factors": ["factor1", "factor2"],
    "regional_notes": "location-specific information",
    "inflation_rate": typical annual increase,
    "data_sources": ["source1", "source2"],
    "last_updated": "2024-2025",
    "recommendation": "which estimate to use and why"
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        result_text = response.content[0].text

        try:
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = result_text[start_idx:end_idx]
                cost_suggestions = json.loads(json_str)
            else:
                cost_suggestions = self._fallback_cost_estimates(goal_category)
        except json.JSONDecodeError:
            cost_suggestions = self._fallback_cost_estimates(goal_category)

        return cost_suggestions

    def recommend_time_horizon(
        self,
        goal_category: str,
        user_age: int,
        target_amount: float,
        current_savings: float = 0,
        monthly_contribution: float = 0
    ) -> Dict:
        """
        Recommend appropriate time horizon for a goal.

        Args:
            goal_category: Type of goal
            user_age: Current age
            target_amount: Goal target amount
            current_savings: Current amount saved
            monthly_contribution: Monthly savings rate

        Returns:
            Time horizon recommendation with rationale

        REQ-GOAL-005: Recommending appropriate time horizons
        """
        prompt = f"""Recommend an appropriate time horizon for this financial goal.

Goal Details:
- Category: {goal_category}
- User Age: {user_age}
- Target Amount: ${target_amount:,.0f}
- Current Savings: ${current_savings:,.0f}
- Monthly Contribution: ${monthly_contribution:,.0f}

Consider:
1. Typical timelines for this goal type
2. User's age and life stage
3. Funding feasibility given current savings rate
4. Industry best practices

Return JSON:
{{
    "recommended_years": number,
    "target_date": "YYYY-MM-DD",
    "rationale": "why this timeline",
    "alternatives": [
        {{"years": number, "pros": "benefits", "cons": "drawbacks"}}
    ],
    "feasibility_score": 0.0-1.0,
    "required_monthly_alternative": "if timeline shortened/extended",
    "considerations": ["consideration1", "consideration2"]
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        result_text = response.content[0].text

        try:
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = result_text[start_idx:end_idx]
                recommendation = json.loads(json_str)
            else:
                recommendation = self._fallback_time_horizon(goal_category, user_age)
        except json.JSONDecodeError:
            recommendation = self._fallback_time_horizon(goal_category, user_age)

        return recommendation

    def identify_goal_conflicts(
        self,
        new_goal: Dict,
        existing_goals: List[Dict],
        user_resources: Dict
    ) -> List[Dict]:
        """
        Identify potential conflicts between new goal and existing goals.

        Args:
            new_goal: New goal being added
            existing_goals: User's existing goals
            user_resources: Available resources (income, savings, etc.)

        Returns:
            List of potential conflicts

        REQ-GOAL-005: Identifying potential conflicts between goals
        """
        goals_summary = "\n".join([
            f"- {g['title']}: ${g['target_amount']:,.0f} by {g['target_date']}, Priority: {g['priority']}"
            for g in existing_goals
        ])

        prompt = f"""Analyze potential conflicts between a new goal and existing goals.

New Goal:
- Title: {new_goal.get('title', 'Unnamed')}
- Category: {new_goal.get('category', 'unknown')}
- Target Amount: ${new_goal.get('target_amount', 0):,.0f}
- Target Date: {new_goal.get('target_date', 'not set')}
- Priority: {new_goal.get('priority', 'not set')}

Existing Goals:
{goals_summary}

User Resources:
- Annual Income: ${user_resources.get('annual_income', 0):,.0f}
- Monthly Savings Capacity: ${user_resources.get('monthly_savings', 0):,.0f}
- Current Investments: ${user_resources.get('current_investments', 0):,.0f}

Identify conflicts including:
1. Resource constraints (insufficient savings capacity)
2. Timeline overlaps (multiple goals with similar dates)
3. Mutually exclusive goals
4. Priority conflicts
5. Unrealistic expectations

Return JSON array:
[
    {{
        "conflict_type": "resource|timeline|priority|feasibility",
        "severity": "high|medium|low",
        "description": "what the conflict is",
        "affected_goals": ["goal1", "goal2"],
        "resolution_suggestions": ["suggestion1", "suggestion2"],
        "impact": "how this affects the plan"
    }}
]"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        result_text = response.content[0].text

        try:
            start_idx = result_text.find('[')
            end_idx = result_text.rfind(']') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = result_text[start_idx:end_idx]
                conflicts = json.loads(json_str)
            else:
                conflicts = []
        except json.JSONDecodeError:
            conflicts = []

        return conflicts

    def generate_goal_recommendations(
        self,
        goal: Dict,
        user_profile: Dict,
        existing_goals: List[Dict]
    ) -> Dict:
        """
        Generate personalized recommendations for a goal.

        Args:
            goal: Goal to analyze
            user_profile: User's financial profile
            existing_goals: User's other goals

        Returns:
            Comprehensive recommendations

        REQ-GOAL-006: AI-generated personalized recommendations
        """
        prompt = f"""Provide comprehensive recommendations for this financial goal.

Goal:
{json.dumps(goal, indent=2)}

User Profile:
- Age: {user_profile.get('age', 'unknown')}
- Annual Income: ${user_profile.get('annual_income', 0):,.0f}
- Current Savings: ${user_profile.get('current_savings', 0):,.0f}
- Monthly Savings Capacity: ${user_profile.get('monthly_savings', 0):,.0f}
- Risk Tolerance: {user_profile.get('risk_tolerance', 'moderate')}
- Existing Goals: {len(existing_goals)}

Provide:
1. Suggested savings rate to achieve goal
2. Alternative scenarios (adjust timeline, amount, etc.)
3. Risk tolerance guidance
4. Optimization opportunities
5. Trade-offs with other goals

Return JSON:
{{
    "suggested_savings_rate": {{
        "monthly": number,
        "annual": number,
        "percentage_of_income": number
    }},
    "alternative_scenarios": [
        {{
            "name": "scenario name",
            "changes": "what's different",
            "monthly_savings": number,
            "success_probability": number,
            "pros": ["pro1", "pro2"],
            "cons": ["con1", "con2"]
        }}
    ],
    "risk_guidance": {{
        "recommended_risk_level": "conservative|moderate|aggressive",
        "rationale": "why this risk level",
        "asset_allocation_suggestion": {{"stocks": 0.6, "bonds": 0.4}}
    }},
    "optimization_tips": ["tip1", "tip2", "tip3"],
    "trade_offs": [
        {{
            "affected_goal": "goal name",
            "impact": "how it's affected",
            "mitigation": "how to minimize impact"
        }}
    ],
    "overall_recommendation": "summary and next steps"
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=3000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        result_text = response.content[0].text

        try:
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = result_text[start_idx:end_idx]
                recommendations = json.loads(json_str)
            else:
                recommendations = self._fallback_recommendations(goal, user_profile)
        except json.JSONDecodeError:
            recommendations = self._fallback_recommendations(goal, user_profile)

        return recommendations

    def provide_educational_context(
        self,
        goal_category: str,
        user_question: Optional[str] = None
    ) -> Dict:
        """
        Provide educational context about goal requirements.

        Args:
            goal_category: Type of goal
            user_question: Optional specific question

        Returns:
            Educational information

        REQ-GOAL-005: Providing educational context
        """
        question_str = f"\nUser's specific question: {user_question}" if user_question else ""

        prompt = f"""Provide educational context about {goal_category} financial goals.
{question_str}

Explain:
1. Typical requirements and considerations
2. Common mistakes to avoid
3. Industry best practices
4. Key planning factors
5. Important deadlines or milestones
6. Tax implications
7. Resources for additional learning

Make it accessible but comprehensive. Return JSON:
{{
    "overview": "what this goal type entails",
    "key_considerations": ["consideration1", "consideration2"],
    "common_mistakes": ["mistake1", "mistake2"],
    "best_practices": ["practice1", "practice2"],
    "planning_factors": ["factor1", "factor2"],
    "tax_implications": "relevant tax information",
    "timeline_milestones": ["milestone1", "milestone2"],
    "additional_resources": [
        {{"title": "resource", "url": "url", "description": "what it covers"}}
    ],
    "expert_tip": "insider knowledge"
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        result_text = response.content[0].text

        try:
            start_idx = result_text.find('{')
            end_idx = result_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = result_text[start_idx:end_idx]
                context = json.loads(json_str)
            else:
                context = self._fallback_educational_context(goal_category)
        except json.JSONDecodeError:
            context = self._fallback_educational_context(goal_category)

        return context

    # Helper methods

    def _build_context_string(self, user_context: Dict) -> str:
        """Build context string from user context dict."""
        context_parts = []
        if user_context.get('age'):
            context_parts.append(f"User Age: {user_context['age']}")
        if user_context.get('annual_income'):
            context_parts.append(f"Annual Income: ${user_context['annual_income']:,.0f}")
        if user_context.get('location'):
            context_parts.append(f"Location: {user_context['location']}")
        if user_context.get('family_status'):
            context_parts.append(f"Family: {user_context['family_status']}")

        return "User Context:\n" + "\n".join(context_parts) if context_parts else ""

    def _fallback_parsing(self, user_input: str) -> Dict:
        """Fallback parsing if AI fails."""
        return {
            "goal_category": "major_expense",
            "target_amount": None,
            "target_date": None,
            "time_horizon_years": None,
            "priority": "important",
            "description": user_input,
            "clarifying_questions": [
                "What is the target amount for this goal?",
                "When do you need to achieve this goal?"
            ],
            "extracted_requirements": [],
            "confidence": 0.3
        }

    def _fallback_cost_estimates(self, goal_category: str) -> Dict:
        """Fallback cost estimates."""
        estimates = {
            "retirement": {"low": 500000, "medium": 1000000, "high": 2000000},
            "education": {"low": 100000, "medium": 200000, "high": 400000},
            "home": {"low": 50000, "medium": 100000, "high": 200000},
            "emergency": {"low": 10000, "medium": 25000, "high": 50000},
        }

        default = estimates.get(goal_category, {"low": 10000, "medium": 50000, "high": 100000})

        return {
            "goal_category": goal_category,
            "cost_estimates": {**default, "currency": "USD"},
            "cost_factors": ["Location", "Personal circumstances", "Market conditions"],
            "regional_notes": "National averages",
            "inflation_rate": 0.03,
            "data_sources": ["Industry standards"],
            "last_updated": "2024-2025",
            "recommendation": "Use medium estimate as starting point"
        }

    def _fallback_time_horizon(self, goal_category: str, user_age: int) -> Dict:
        """Fallback time horizon recommendation."""
        horizons = {
            "retirement": max(65 - user_age, 5),
            "education": 10,
            "home": 5,
            "emergency": 1,
        }

        years = horizons.get(goal_category, 5)
        target_date = (datetime.now() + timedelta(days=years*365)).strftime("%Y-%m-%d")

        return {
            "recommended_years": years,
            "target_date": target_date,
            "rationale": f"Typical timeline for {goal_category} goals",
            "alternatives": [],
            "feasibility_score": 0.7,
            "required_monthly_alternative": "Varies based on timeline adjustments",
            "considerations": ["Adjust based on personal circumstances"]
        }

    def _fallback_recommendations(self, goal: Dict, user_profile: Dict) -> Dict:
        """Fallback recommendations."""
        return {
            "suggested_savings_rate": {
                "monthly": 500,
                "annual": 6000,
                "percentage_of_income": 10
            },
            "alternative_scenarios": [],
            "risk_guidance": {
                "recommended_risk_level": "moderate",
                "rationale": "Balanced approach for most goals",
                "asset_allocation_suggestion": {"stocks": 0.6, "bonds": 0.4}
            },
            "optimization_tips": [
                "Start saving early",
                "Automate contributions",
                "Review progress regularly"
            ],
            "trade_offs": [],
            "overall_recommendation": "Develop a systematic savings plan"
        }

    def _fallback_educational_context(self, goal_category: str) -> Dict:
        """Fallback educational context."""
        return {
            "overview": f"Learn about {goal_category} planning",
            "key_considerations": ["Start early", "Plan systematically"],
            "common_mistakes": ["Waiting too long", "Underestimating costs"],
            "best_practices": ["Regular reviews", "Professional guidance"],
            "planning_factors": ["Timeline", "Cost estimates", "Risk tolerance"],
            "tax_implications": "Consult a tax professional",
            "timeline_milestones": ["Set goal", "Monitor progress", "Adjust as needed"],
            "additional_resources": [],
            "expert_tip": "Consistency is key to achieving financial goals"
        }
