"""
Mental Accounting Service

Implements REQ-GOAL-009: Creates "mental account buckets" for each goal.
Shows dedicated assets, funding levels, and success probability.
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.goal import Goal, GoalPriority
from app.services.goal_funding_calculator import GoalFundingCalculator


class MentalAccountingService:
    """Service for creating and managing mental account buckets for goals."""

    @classmethod
    async def create_mental_account_bucket(
        cls,
        goal: Goal,
        dedicated_accounts: List[Dict],
        expected_return: float = 0.07,
        return_volatility: float = 0.15,
        db: Optional[AsyncSession] = None
    ) -> Dict:
        """
        Create a mental account bucket for a goal.

        Args:
            goal: Goal object
            dedicated_accounts: List of accounts dedicated to this goal
                [{"account_id": str, "balance": float, "contribution_rate": float}]
            expected_return: Expected annual return
            return_volatility: Return volatility for Monte Carlo
            db: Database session (optional)

        Returns:
            Mental account bucket details

        REQ-GOAL-009: Mental account buckets showing dedicated assets
        """
        # Calculate current dedicated value
        current_value = sum(acc["balance"] for acc in dedicated_accounts)
        total_monthly_contribution = sum(
            acc.get("contribution_rate", 0) for acc in dedicated_accounts
        )

        # Calculate years to goal
        if goal.target_date:
            years_to_goal = (goal.target_date - datetime.utcnow().date()).days / 365.25
        else:
            years_to_goal = goal.time_horizon_years or 10

        # Calculate funding requirements
        funding_req = GoalFundingCalculator.calculate_funding_requirements(
            target_amount=goal.target_amount,
            current_amount=current_value,
            years_to_goal=max(0.1, years_to_goal),
            expected_return=expected_return,
            inflation_rate=0.03
        )

        # Calculate success probability
        if years_to_goal > 0:
            success_prob = GoalFundingCalculator.calculate_success_probability(
                target_amount=goal.target_amount,
                current_amount=current_value,
                monthly_contribution=total_monthly_contribution,
                years_to_goal=years_to_goal,
                expected_return=expected_return,
                return_volatility=return_volatility,
                iterations=5000
            )
        else:
            # Goal is now or past
            success_prob = {
                "success_probability": 1.0 if current_value >= goal.target_amount else 0.0,
                "median_outcome": current_value,
                "expected_value": current_value
            }

        # Calculate expected value at goal date
        expected_value_at_goal = success_prob.get("median_outcome", current_value)

        # Determine funding status
        required_funding = funding_req["inflation_adjusted_target"]
        funding_level = (current_value / required_funding * 100) if required_funding > 0 else 100
        funding_gap = max(0, required_funding - expected_value_at_goal)
        funding_surplus = max(0, expected_value_at_goal - required_funding)

        # Determine status
        if funding_level >= 100:
            status = "fully_funded"
        elif funding_level >= 80:
            status = "on_track"
        elif funding_level >= 50:
            status = "underfunded"
        else:
            status = "at_risk"

        return {
            "goal_id": goal.id,
            "goal_name": goal.name,
            "goal_category": goal.category,
            "target_amount": goal.target_amount,
            "target_date": goal.target_date.isoformat() if goal.target_date else None,
            "years_to_goal": round(years_to_goal, 2),

            # Dedicated assets
            "dedicated_accounts": dedicated_accounts,
            "current_value": round(current_value, 2),
            "monthly_contribution": round(total_monthly_contribution, 2),
            "annual_contribution": round(total_monthly_contribution * 12, 2),

            # Funding status
            "required_funding": round(required_funding, 2),
            "actual_funding_level": round(funding_level, 2),
            "funding_status": status,
            "funding_gap": round(funding_gap, 2),
            "funding_surplus": round(funding_surplus, 2),

            # Projections
            "expected_value_at_goal": round(expected_value_at_goal, 2),
            "success_probability": round(success_prob.get("success_probability", 0.0), 4),
            "percentile_10": round(success_prob.get("percentile_10", current_value), 2),
            "percentile_90": round(success_prob.get("percentile_90", current_value), 2),

            # Requirements
            "required_monthly_savings": round(funding_req["required_monthly_savings"], 2),
            "required_annual_savings": round(funding_req["required_annual_savings"], 2),
            "additional_monthly_needed": round(
                max(0, funding_req["required_monthly_savings"] - total_monthly_contribution), 2
            ),

            # Metadata
            "last_updated": datetime.utcnow().isoformat(),
            "assumptions": {
                "expected_return": expected_return,
                "return_volatility": return_volatility,
                "inflation_rate": 0.03
            }
        }

    @classmethod
    async def get_all_mental_accounts(
        cls,
        user_id: str,
        db: AsyncSession,
        expected_return: float = 0.07,
        return_volatility: float = 0.15
    ) -> Dict:
        """
        Get mental account buckets for all user goals.

        Args:
            user_id: User ID
            db: Database session
            expected_return: Expected return
            return_volatility: Return volatility

        Returns:
            All mental account buckets with summary

        REQ-GOAL-009: Complete view of all mental accounts
        """
        # Get all active goals for user
        stmt = select(Goal).where(
            Goal.user_id == user_id,
            Goal.status.in_(["active", "planning"])
        )
        result = await db.execute(stmt)
        goals = result.scalars().all()

        # Create mental accounts for each goal
        mental_accounts = []
        for goal in goals:
            # Parse allocated accounts (stored as JSON string in goal.allocated_accounts)
            dedicated_accounts = []
            if goal.allocated_accounts:
                # This would parse from stored JSON
                # For now, use placeholder
                dedicated_accounts = []

            bucket = await cls.create_mental_account_bucket(
                goal=goal,
                dedicated_accounts=dedicated_accounts,
                expected_return=expected_return,
                return_volatility=return_volatility,
                db=db
            )
            mental_accounts.append(bucket)

        # Calculate summary statistics
        total_current_value = sum(ma["current_value"] for ma in mental_accounts)
        total_required_funding = sum(ma["required_funding"] for ma in mental_accounts)
        total_monthly_contributions = sum(ma["monthly_contribution"] for ma in mental_accounts)

        fully_funded = len([ma for ma in mental_accounts if ma["funding_status"] == "fully_funded"])
        on_track = len([ma for ma in mental_accounts if ma["funding_status"] == "on_track"])
        underfunded = len([ma for ma in mental_accounts if ma["funding_status"] == "underfunded"])
        at_risk = len([ma for ma in mental_accounts if ma["funding_status"] == "at_risk"])

        # Calculate weighted success probability
        total_target = sum(ma["target_amount"] for ma in mental_accounts)
        weighted_success_prob = sum(
            ma["success_probability"] * (ma["target_amount"] / total_target)
            for ma in mental_accounts
        ) if total_target > 0 else 0.0

        return {
            "user_id": user_id,
            "total_goals": len(mental_accounts),
            "mental_accounts": mental_accounts,

            # Summary statistics
            "summary": {
                "total_current_value": round(total_current_value, 2),
                "total_required_funding": round(total_required_funding, 2),
                "overall_funding_level": round(
                    (total_current_value / total_required_funding * 100) if total_required_funding > 0 else 100,
                    2
                ),
                "total_monthly_contributions": round(total_monthly_contributions, 2),
                "total_annual_contributions": round(total_monthly_contributions * 12, 2),
                "weighted_success_probability": round(weighted_success_prob, 4),

                # Status breakdown
                "status_breakdown": {
                    "fully_funded": fully_funded,
                    "on_track": on_track,
                    "underfunded": underfunded,
                    "at_risk": at_risk
                }
            },

            "last_updated": datetime.utcnow().isoformat()
        }

    @classmethod
    async def allocate_account_to_goal(
        cls,
        goal_id: str,
        account_id: str,
        allocation_percentage: float,
        monthly_contribution: float,
        db: AsyncSession
    ) -> Dict:
        """
        Allocate an account (or portion) to a specific goal.

        Args:
            goal_id: Goal ID
            account_id: Account ID
            allocation_percentage: Percentage of account dedicated (0-100)
            monthly_contribution: Monthly contribution amount
            db: Database session

        Returns:
            Allocation details

        REQ-GOAL-009: Account-level allocation to goals
        """
        # Get goal
        stmt = select(Goal).where(Goal.id == goal_id)
        result = await db.execute(stmt)
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        # Validate allocation percentage
        if not 0 <= allocation_percentage <= 100:
            raise ValueError("Allocation percentage must be between 0 and 100")

        # Create allocation record
        allocation = {
            "goal_id": goal_id,
            "account_id": account_id,
            "allocation_percentage": allocation_percentage,
            "monthly_contribution": monthly_contribution,
            "created_at": datetime.utcnow().isoformat()
        }

        # Update goal's allocated_accounts field (stored as JSON)
        # This would update the database
        # For now, return the allocation

        return {
            "allocation": allocation,
            "message": f"Allocated {allocation_percentage}% of account {account_id} to goal {goal.name}",
            "monthly_contribution": monthly_contribution
        }

    @classmethod
    def calculate_rebalancing_needs(
        cls,
        mental_accounts: List[Dict],
        total_portfolio_value: float
    ) -> Dict:
        """
        Calculate rebalancing needs across mental accounts.

        Args:
            mental_accounts: List of mental account buckets
            total_portfolio_value: Total portfolio value

        Returns:
            Rebalancing recommendations

        REQ-GOAL-009: Identify funding gaps and rebalancing needs
        """
        rebalancing_recommendations = []

        for ma in mental_accounts:
            target_allocation = (ma["required_funding"] / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
            current_allocation = (ma["current_value"] / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
            allocation_gap = target_allocation - current_allocation

            if abs(allocation_gap) > 5:  # More than 5% deviation
                rebalancing_recommendations.append({
                    "goal_id": ma["goal_id"],
                    "goal_name": ma["goal_name"],
                    "current_allocation": round(current_allocation, 2),
                    "target_allocation": round(target_allocation, 2),
                    "allocation_gap": round(allocation_gap, 2),
                    "action": "increase" if allocation_gap > 0 else "decrease",
                    "amount_to_move": round(
                        abs(allocation_gap) * total_portfolio_value / 100, 2
                    ),
                    "priority": ma["goal_category"],
                    "urgency": "high" if abs(allocation_gap) > 15 else "medium"
                })

        # Sort by urgency and priority
        priority_order = {"essential": 0, "important": 1, "aspirational": 2}
        rebalancing_recommendations.sort(
            key=lambda x: (
                0 if x["urgency"] == "high" else 1,
                priority_order.get(x["priority"], 2)
            )
        )

        return {
            "needs_rebalancing": len(rebalancing_recommendations) > 0,
            "rebalancing_count": len(rebalancing_recommendations),
            "recommendations": rebalancing_recommendations,
            "total_portfolio_value": total_portfolio_value,
            "rebalancing_threshold": 5.0,  # 5% deviation triggers rebalancing
            "last_analysis": datetime.utcnow().isoformat()
        }

    @classmethod
    def project_mental_account_growth(
        cls,
        mental_account: Dict,
        years_forward: int = 5,
        expected_return: float = 0.07,
        monthly_contribution: Optional[float] = None
    ) -> Dict:
        """
        Project mental account growth over time.

        Args:
            mental_account: Mental account bucket
            years_forward: Years to project
            expected_return: Expected annual return
            monthly_contribution: Monthly contribution (overrides current)

        Returns:
            Year-by-year projections

        REQ-GOAL-009: Project expected value at goal date
        """
        current_value = mental_account["current_value"]
        monthly_contrib = monthly_contribution or mental_account["monthly_contribution"]
        monthly_rate = expected_return / 12

        projections = []
        portfolio_value = current_value

        for year in range(1, years_forward + 1):
            # Project 12 months forward
            for month in range(12):
                portfolio_value = portfolio_value * (1 + monthly_rate) + monthly_contrib

            projections.append({
                "year": year,
                "projected_value": round(portfolio_value, 2),
                "total_contributions": round(monthly_contrib * 12 * year, 2),
                "growth": round(portfolio_value - current_value - (monthly_contrib * 12 * year), 2),
                "funding_level": round(
                    (portfolio_value / mental_account["required_funding"] * 100) if mental_account["required_funding"] > 0 else 100,
                    2
                )
            })

        return {
            "goal_id": mental_account["goal_id"],
            "goal_name": mental_account["goal_name"],
            "starting_value": round(current_value, 2),
            "monthly_contribution": round(monthly_contrib, 2),
            "expected_return": expected_return,
            "projections": projections,
            "final_projected_value": round(portfolio_value, 2),
            "meets_target": portfolio_value >= mental_account["required_funding"]
        }
