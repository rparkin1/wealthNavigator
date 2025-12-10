"""
Goal Milestone and Progress Tracking Service

Manages goal milestones, progress tracking, and automatic completion detection.
Implements REQ-GOAL-004: Goal progress tracking with milestones.
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import json

from app.models.goal import Goal, GoalStatus


class GoalMilestoneService:
    """Service for tracking goal progress and milestones."""

    @classmethod
    async def create_milestone(
        cls,
        db: AsyncSession,
        goal_id: str,
        title: str,
        target_amount: Optional[float] = None,
        target_date: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict:
        """
        Create a new milestone for a goal.

        Args:
            db: Database session
            goal_id: Goal ID
            title: Milestone title
            target_amount: Optional target amount for this milestone
            target_date: Optional target date (ISO format)
            description: Optional description

        Returns:
            Created milestone dictionary
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        # Parse existing milestones
        milestones = json.loads(goal.milestones) if goal.milestones else []

        # Create new milestone
        milestone = {
            "id": f"ms-{len(milestones) + 1}",
            "title": title,
            "target_amount": target_amount,
            "target_date": target_date,
            "description": description,
            "completed": False,
            "completed_date": None,
            "created_at": datetime.now().isoformat(),
        }

        milestones.append(milestone)
        goal.milestones = json.dumps(milestones)

        await db.commit()
        return milestone

    @classmethod
    async def update_milestone(
        cls,
        db: AsyncSession,
        goal_id: str,
        milestone_id: str,
        updates: Dict,
    ) -> Dict:
        """
        Update an existing milestone.

        Args:
            db: Database session
            goal_id: Goal ID
            milestone_id: Milestone ID
            updates: Dictionary of fields to update

        Returns:
            Updated milestone dictionary
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        milestones = json.loads(goal.milestones) if goal.milestones else []

        # Find and update milestone
        milestone = None
        for ms in milestones:
            if ms["id"] == milestone_id:
                milestone = ms
                break

        if not milestone:
            raise ValueError(f"Milestone {milestone_id} not found")

        # Apply updates
        for key, value in updates.items():
            if key != "id":  # Don't allow ID changes
                milestone[key] = value

        milestone["updated_at"] = datetime.now().isoformat()

        goal.milestones = json.dumps(milestones)
        await db.commit()

        return milestone

    @classmethod
    async def complete_milestone(
        cls,
        db: AsyncSession,
        goal_id: str,
        milestone_id: str,
    ) -> Dict:
        """
        Mark a milestone as completed.

        Args:
            db: Database session
            goal_id: Goal ID
            milestone_id: Milestone ID

        Returns:
            Updated milestone dictionary
        """
        updates = {
            "completed": True,
            "completed_date": datetime.now().isoformat(),
        }

        milestone = await cls.update_milestone(db, goal_id, milestone_id, updates)

        # Check if goal should be auto-completed
        await cls._check_auto_complete_goal(db, goal_id)

        return milestone

    @classmethod
    async def delete_milestone(
        cls,
        db: AsyncSession,
        goal_id: str,
        milestone_id: str,
    ):
        """
        Delete a milestone.

        Args:
            db: Database session
            goal_id: Goal ID
            milestone_id: Milestone ID
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        milestones = json.loads(goal.milestones) if goal.milestones else []

        # Remove milestone
        milestones = [ms for ms in milestones if ms["id"] != milestone_id]

        goal.milestones = json.dumps(milestones)
        await db.commit()

    @classmethod
    async def get_milestones(
        cls,
        db: AsyncSession,
        goal_id: str,
    ) -> List[Dict]:
        """
        Get all milestones for a goal.

        Args:
            db: Database session
            goal_id: Goal ID

        Returns:
            List of milestone dictionaries
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        return json.loads(goal.milestones) if goal.milestones else []

    @classmethod
    async def auto_generate_milestones(
        cls,
        db: AsyncSession,
        goal_id: str,
    ) -> List[Dict]:
        """
        Automatically generate milestones based on goal parameters.

        Args:
            db: Database session
            goal_id: Goal ID

        Returns:
            List of generated milestones
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        # Calculate milestone intervals
        target_date = datetime.fromisoformat(goal.target_date)
        today = datetime.now()
        years_to_goal = max(0, (target_date - today).days / 365.25)

        milestones = []

        # Generate milestones based on time horizon
        if years_to_goal >= 10:
            # Long-term goal: quarterly milestones for first 2 years, then annual
            intervals = [
                (0.25, "3 Months"),
                (0.5, "6 Months"),
                (1, "1 Year"),
                (2, "2 Years"),
            ]
            # Add annual milestones
            for year in range(3, int(years_to_goal) + 1):
                intervals.append((year, f"{year} Years"))

        elif years_to_goal >= 5:
            # Medium-term goal: quarterly milestones for first year, then semi-annual
            intervals = [
                (0.25, "3 Months"),
                (0.5, "6 Months"),
                (1, "1 Year"),
            ]
            for year in range(2, int(years_to_goal) + 1):
                intervals.append((year - 0.5, f"{year - 0.5:.1f} Years"))
                intervals.append((year, f"{year} Years"))

        else:
            # Short-term goal: quarterly milestones
            quarters = max(1, int(years_to_goal * 4))
            intervals = []
            for q in range(1, quarters + 1):
                years = q * 0.25
                intervals.append((years, f"{q * 3} Months"))

        # Generate milestone objects
        for years_from_now, label in intervals:
            milestone_date = today + timedelta(days=years_from_now * 365.25)

            if milestone_date <= target_date:
                # Calculate proportional target amount
                progress_percentage = years_from_now / years_to_goal if years_to_goal > 0 else 1.0
                milestone_amount = goal.target_amount * progress_percentage

                milestone = {
                    "id": f"ms-auto-{len(milestones) + 1}",
                    "title": f"{label} Milestone",
                    "target_amount": round(milestone_amount, 2),
                    "target_date": milestone_date.strftime("%Y-%m-%d"),
                    "description": f"Reach ${milestone_amount:,.0f} by {label}",
                    "completed": False,
                    "completed_date": None,
                    "created_at": datetime.now().isoformat(),
                    "auto_generated": True,
                }
                milestones.append(milestone)

        # Save milestones
        goal.milestones = json.dumps(milestones)
        await db.commit()

        return milestones

    @classmethod
    async def check_milestone_progress(
        cls,
        db: AsyncSession,
        goal_id: str,
    ) -> Dict:
        """
        Check progress against milestones and auto-complete if targets met.

        Args:
            db: Database session
            goal_id: Goal ID

        Returns:
            Progress summary dictionary
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        milestones = json.loads(goal.milestones) if goal.milestones else []
        current_amount = goal.current_amount or 0

        completed_count = 0
        newly_completed = []

        for milestone in milestones:
            if milestone.get("completed"):
                completed_count += 1
                continue

            # Check if milestone should be auto-completed
            target_amount = milestone.get("target_amount")
            target_date = milestone.get("target_date")

            should_complete = False

            if target_amount and current_amount >= target_amount:
                should_complete = True

            if target_date:
                target_dt = datetime.fromisoformat(target_date)
                if datetime.now() >= target_dt and current_amount >= (target_amount or 0):
                    should_complete = True

            if should_complete:
                milestone["completed"] = True
                milestone["completed_date"] = datetime.now().isoformat()
                completed_count += 1
                newly_completed.append(milestone)

        # Save updates
        if newly_completed:
            goal.milestones = json.dumps(milestones)
            await db.commit()

        # Check if goal should be auto-completed
        await cls._check_auto_complete_goal(db, goal_id)

        return {
            "total_milestones": len(milestones),
            "completed_milestones": completed_count,
            "progress_percentage": (completed_count / len(milestones) * 100) if milestones else 0,
            "newly_completed": newly_completed,
        }

    @classmethod
    async def get_upcoming_milestones(
        cls,
        db: AsyncSession,
        user_id: str,
        days_ahead: int = 30,
    ) -> List[Dict]:
        """
        Get upcoming milestones across all user goals.

        Args:
            db: Database session
            user_id: User ID
            days_ahead: Number of days to look ahead

        Returns:
            List of upcoming milestone dictionaries
        """
        result = await db.execute(
            select(Goal).where(
                and_(
                    Goal.user_id == user_id,
                    Goal.status.in_(["active", "planning"])
                )
            )
        )
        goals = result.scalars().all()

        upcoming = []
        cutoff_date = datetime.now() + timedelta(days=days_ahead)

        for goal in goals:
            milestones = json.loads(goal.milestones) if goal.milestones else []

            for milestone in milestones:
                if milestone.get("completed"):
                    continue

                target_date = milestone.get("target_date")
                if not target_date:
                    continue

                target_dt = datetime.fromisoformat(target_date)

                if datetime.now() <= target_dt <= cutoff_date:
                    upcoming.append({
                        **milestone,
                        "goal_id": goal.id,
                        "goal_title": goal.title,
                        "goal_category": goal.category.value,
                        "days_until": (target_dt - datetime.now()).days,
                    })

        # Sort by date
        upcoming.sort(key=lambda x: x["target_date"])

        return upcoming

    @classmethod
    async def get_overdue_milestones(
        cls,
        db: AsyncSession,
        user_id: str,
    ) -> List[Dict]:
        """
        Get overdue incomplete milestones.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            List of overdue milestone dictionaries
        """
        result = await db.execute(
            select(Goal).where(
                and_(
                    Goal.user_id == user_id,
                    Goal.status.in_(["active", "planning"])
                )
            )
        )
        goals = result.scalars().all()

        overdue = []
        today = datetime.now()

        for goal in goals:
            milestones = json.loads(goal.milestones) if goal.milestones else []

            for milestone in milestones:
                if milestone.get("completed"):
                    continue

                target_date = milestone.get("target_date")
                if not target_date:
                    continue

                target_dt = datetime.fromisoformat(target_date)

                if target_dt < today:
                    overdue.append({
                        **milestone,
                        "goal_id": goal.id,
                        "goal_title": goal.title,
                        "goal_category": goal.category.value,
                        "days_overdue": (today - target_dt).days,
                    })

        # Sort by how overdue
        overdue.sort(key=lambda x: x["days_overdue"], reverse=True)

        return overdue

    @classmethod
    async def _check_auto_complete_goal(
        cls,
        db: AsyncSession,
        goal_id: str,
    ):
        """
        Check if goal should be auto-completed based on progress.

        Args:
            db: Database session
            goal_id: Goal ID
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            return

        # Check if current amount meets or exceeds target
        if goal.current_amount >= goal.target_amount:
            milestones = json.loads(goal.milestones) if goal.milestones else []

            # Check if all milestones are complete
            if milestones:
                all_complete = all(ms.get("completed", False) for ms in milestones)
                if all_complete:
                    goal.status = GoalStatus.ACHIEVED.value
                    await db.commit()
            else:
                # No milestones, just check amount
                goal.status = GoalStatus.ACHIEVED.value
                await db.commit()

    @classmethod
    async def calculate_progress_metrics(
        cls,
        db: AsyncSession,
        goal_id: str,
    ) -> Dict:
        """
        Calculate comprehensive progress metrics for a goal.

        Args:
            db: Database session
            goal_id: Goal ID

        Returns:
            Progress metrics dictionary
        """
        result = await db.execute(
            select(Goal).where(Goal.id == goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        milestones = json.loads(goal.milestones) if goal.milestones else []

        # Basic progress
        progress_percentage = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0

        # Time progress
        target_date = datetime.fromisoformat(goal.target_date)
        today = datetime.now()
        total_days = (target_date - datetime.fromisoformat(str(goal.created_at)[:10])).days
        elapsed_days = (today - datetime.fromisoformat(str(goal.created_at)[:10])).days
        time_progress = (elapsed_days / total_days * 100) if total_days > 0 else 0

        # Milestone progress
        completed_milestones = sum(1 for ms in milestones if ms.get("completed"))
        milestone_progress = (completed_milestones / len(milestones) * 100) if milestones else 0

        # On-track analysis
        expected_progress = time_progress
        actual_progress = progress_percentage
        on_track = actual_progress >= expected_progress * 0.9  # Within 10% of expected

        # Velocity (monthly contribution rate)
        months_elapsed = elapsed_days / 30.44
        velocity = goal.current_amount / months_elapsed if months_elapsed > 0 else 0

        # Required velocity to meet goal
        remaining_amount = goal.target_amount - goal.current_amount
        remaining_days = (target_date - today).days
        remaining_months = remaining_days / 30.44
        required_velocity = remaining_amount / remaining_months if remaining_months > 0 else 0

        return {
            "goal_id": goal_id,
            "progress_percentage": round(progress_percentage, 2),
            "time_progress": round(time_progress, 2),
            "milestone_progress": round(milestone_progress, 2),
            "on_track": on_track,
            "current_velocity": round(velocity, 2),
            "required_velocity": round(required_velocity, 2),
            "velocity_gap": round(required_velocity - velocity, 2),
            "completed_milestones": completed_milestones,
            "total_milestones": len(milestones),
            "status": goal.status,
        }
