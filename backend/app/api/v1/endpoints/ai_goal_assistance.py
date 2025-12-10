"""
AI Goal Assistance API Endpoints

Handles natural language goal creation, clarifying questions, and AI recommendations.
Implements REQ-GOAL-004, REQ-GOAL-005, REQ-GOAL-006.
"""

from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, ConfigDict

from app.core.database import get_db
from app.services.ai_goal_configuration_service import AIGoalConfigurationService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic Models
class NaturalLanguageGoalRequest(BaseModel):
    """Request model for natural language goal input"""
    user_input: str = Field(..., min_length=10, max_length=1000)
    user_context: Optional[Dict] = Field(None, description="Optional user context (age, income, location, etc.)")

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class ClarifyingQuestionsRequest(BaseModel):
    """Request model for generating clarifying questions"""
    partial_goal: Dict = Field(..., description="Partially defined goal")
    user_context: Optional[Dict] = None

    model_config = ConfigDict(from_attributes=True, json_schema_extra=json_schema_extra) if "json_schema_extra" in dir() else ConfigDict(from_attributes=True)

class CostSuggestionsRequest(BaseModel):
    """Request model for cost suggestions"""
    goal_category: str
    location: Optional[str] = None
    user_context: Optional[Dict] = None


class TimeHorizonRequest(BaseModel):
    """Request model for time horizon recommendation"""
    goal_category: str
    user_age: int
    target_amount: float
    current_savings: float = 0
    monthly_contribution: float = 0


class ConflictCheckRequest(BaseModel):
    """Request model for goal conflict checking"""
    new_goal: Dict
    existing_goals: List[Dict]
    user_resources: Dict


class RecommendationsRequest(BaseModel):
    """Request model for personalized recommendations"""
    goal: Dict
    user_profile: Dict
    existing_goals: List[Dict] = []


class EducationalContextRequest(BaseModel):
    """Request model for educational context"""
    goal_category: str
    user_question: Optional[str] = None


# Endpoints

@router.post(
    "/parse-natural-language",
    summary="Parse natural language goal description"
)
async def parse_natural_language_goal(
    request: NaturalLanguageGoalRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Parse natural language goal description into structured format.

    Uses Claude AI to extract:
    - Goal category
    - Target amount
    - Target date
    - Priority level
    - Requirements

    Also identifies missing information and suggests clarifying questions.

    **REQ-GOAL-004:** Natural language interface for goal definition
    """
    try:
        service = AIGoalConfigurationService()
        parsed_goal = service.parse_natural_language_goal(
            user_input=request.user_input,
            user_context=request.user_context
        )

        return {
            "parsed_goal": parsed_goal,
            "needs_clarification": len(parsed_goal.get("clarifying_questions", [])) > 0,
            "confidence": parsed_goal.get("confidence", 0.0)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI parsing failed: {str(e)}"
        )


@router.post(
    "/clarifying-questions",
    summary="Generate clarifying questions"
)
async def generate_clarifying_questions(
    request: ClarifyingQuestionsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate clarifying questions for incomplete or ambiguous goals.

    Returns:
    - Questions to ask user
    - Importance of each question
    - Suggested answer options
    - Default values

    **REQ-GOAL-005:** AI asking clarifying questions
    """
    try:
        service = AIGoalConfigurationService()
        questions = service.generate_clarifying_questions(
            partial_goal=request.partial_goal,
            user_context=request.user_context
        )

        return {
            "questions": questions,
            "total_questions": len(questions)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )


@router.post(
    "/suggest-costs",
    summary="Suggest typical costs for goal"
)
async def suggest_typical_costs(
    request: CostSuggestionsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Suggest typical costs for common goals based on location and circumstances.

    Provides:
    - Low, medium, high cost estimates
    - Cost factors
    - Regional adjustments
    - Inflation considerations

    **REQ-GOAL-005:** Suggesting typical costs
    """
    try:
        service = AIGoalConfigurationService()
        suggestions = service.suggest_typical_costs(
            goal_category=request.goal_category,
            location=request.location,
            user_context=request.user_context
        )

        return suggestions

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to suggest costs: {str(e)}"
        )


@router.post(
    "/recommend-timeline",
    summary="Recommend time horizon for goal"
)
async def recommend_time_horizon(
    request: TimeHorizonRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Recommend appropriate time horizon for a goal.

    Considers:
    - Goal type
    - User age and life stage
    - Funding feasibility
    - Industry best practices

    **REQ-GOAL-005:** Recommending appropriate time horizons
    """
    try:
        service = AIGoalConfigurationService()
        recommendation = service.recommend_time_horizon(
            goal_category=request.goal_category,
            user_age=request.user_age,
            target_amount=request.target_amount,
            current_savings=request.current_savings,
            monthly_contribution=request.monthly_contribution
        )

        return recommendation

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recommend timeline: {str(e)}"
        )


@router.post(
    "/check-conflicts",
    summary="Identify goal conflicts"
)
async def check_goal_conflicts(
    request: ConflictCheckRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Identify potential conflicts between new goal and existing goals.

    Checks for:
    - Resource constraints
    - Timeline overlaps
    - Mutually exclusive goals
    - Priority conflicts

    **REQ-GOAL-005:** Identifying potential conflicts
    """
    try:
        service = AIGoalConfigurationService()
        conflicts = service.identify_goal_conflicts(
            new_goal=request.new_goal,
            existing_goals=request.existing_goals,
            user_resources=request.user_resources
        )

        return {
            "conflicts": conflicts,
            "has_conflicts": len(conflicts) > 0,
            "conflict_count": len(conflicts),
            "highest_severity": max([c.get("severity", "low") for c in conflicts], default="none") if conflicts else "none"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check conflicts: {str(e)}"
        )


@router.post(
    "/recommendations",
    summary="Generate personalized recommendations"
)
async def generate_recommendations(
    request: RecommendationsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive personalized recommendations for a goal.

    Includes:
    - Suggested savings rate
    - Alternative scenarios
    - Risk tolerance guidance
    - Optimization tips
    - Trade-off analysis

    **REQ-GOAL-006:** AI-generated personalized recommendations
    """
    try:
        service = AIGoalConfigurationService()
        recommendations = service.generate_goal_recommendations(
            goal=request.goal,
            user_profile=request.user_profile,
            existing_goals=request.existing_goals
        )

        return recommendations

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.post(
    "/educational-context",
    summary="Get educational context about goal"
)
async def get_educational_context(
    request: EducationalContextRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Provide educational context about goal requirements.

    Explains:
    - Typical requirements
    - Common mistakes
    - Best practices
    - Tax implications
    - Key milestones

    **REQ-GOAL-005:** Providing educational context
    """
    try:
        service = AIGoalConfigurationService()
        context = service.provide_educational_context(
            goal_category=request.goal_category,
            user_question=request.user_question
        )

        return context

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provide educational context: {str(e)}"
        )


@router.post(
    "/quick-goal-setup",
    summary="Quick AI-assisted goal setup"
)
async def quick_goal_setup(
    user_input: str,
    user_age: int,
    annual_income: float,
    current_user: User = Depends(get_current_user)
):
    """
    Quick end-to-end AI-assisted goal setup.

    Combines multiple AI services:
    1. Parse natural language input
    2. Suggest typical costs
    3. Recommend timeline
    4. Generate recommendations

    Returns complete goal configuration ready for creation.

    **REQ-GOAL-004, REQ-GOAL-005, REQ-GOAL-006:** Complete AI assistance
    """
    try:
        service = AIGoalConfigurationService()

        # Step 1: Parse input
        parsed = service.parse_natural_language_goal(
            user_input=user_input,
            user_context={"age": user_age, "annual_income": annual_income}
        )

        # Step 2: Get cost suggestions if amount not specified
        cost_suggestions = None
        if not parsed.get("target_amount"):
            cost_suggestions = service.suggest_typical_costs(
                goal_category=parsed["goal_category"],
                user_context={"age": user_age, "annual_income": annual_income}
            )
            parsed["target_amount"] = cost_suggestions["cost_estimates"]["medium"]

        # Step 3: Recommend timeline if not specified
        timeline_rec = None
        if not parsed.get("time_horizon_years"):
            timeline_rec = service.recommend_time_horizon(
                goal_category=parsed["goal_category"],
                user_age=user_age,
                target_amount=parsed["target_amount"],
                current_savings=0,
                monthly_contribution=annual_income * 0.10 / 12  # Assume 10% savings rate
            )
            parsed["time_horizon_years"] = timeline_rec["recommended_years"]
            parsed["target_date"] = timeline_rec["target_date"]

        # Step 4: Generate recommendations
        recommendations = service.generate_goal_recommendations(
            goal=parsed,
            user_profile={"age": user_age, "annual_income": annual_income},
            existing_goals=[]
        )

        return {
            "parsed_goal": parsed,
            "cost_suggestions": cost_suggestions,
            "timeline_recommendation": timeline_rec,
            "recommendations": recommendations,
            "ready_to_create": True,
            "confidence": parsed.get("confidence", 0.0)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quick setup failed: {str(e)}"
        )
