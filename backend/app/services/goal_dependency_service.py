"""
Goal Dependency Service

Manages goal dependencies, relationships, and multi-goal optimization.
Implements REQ-GOAL-003: Goal dependencies and relationships (sequential, conditional, shared resources).
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.goal import Goal, GoalCategory, GoalPriority, GoalDependencyType, GoalStatus


class GoalDependencyService:
    """Service for managing goal dependencies and relationships."""

    @classmethod
    async def create_dependency(
        cls,
        db: AsyncSession,
        dependent_goal_id: str,
        depends_on_goal_id: str,
        dependency_type: GoalDependencyType,
    ) -> bool:
        """
        Create a dependency relationship between two goals.

        Args:
            db: Database session
            dependent_goal_id: Goal that depends on another
            depends_on_goal_id: Goal that must be satisfied first
            dependency_type: Type of dependency

        Returns:
            True if successful, False if circular dependency detected
        """
        # Check for circular dependencies
        if await cls._has_circular_dependency(db, dependent_goal_id, depends_on_goal_id):
            raise ValueError("Circular dependency detected")

        # Update dependent goal
        result = await db.execute(
            select(Goal).where(Goal.id == dependent_goal_id)
        )
        dependent_goal = result.scalar_one_or_none()

        if not dependent_goal:
            raise ValueError(f"Goal {dependent_goal_id} not found")

        dependent_goal.depends_on_goal_id = depends_on_goal_id
        dependent_goal.dependency_type = dependency_type.value

        # Update status if necessary
        if dependency_type == GoalDependencyType.SEQUENTIAL:
            # Check if parent goal is achieved
            parent_result = await db.execute(
                select(Goal).where(Goal.id == depends_on_goal_id)
            )
            parent_goal = parent_result.scalar_one_or_none()

            if parent_goal and parent_goal.status != GoalStatus.ACHIEVED.value:
                dependent_goal.status = GoalStatus.BLOCKED.value

        await db.commit()
        return True

    @classmethod
    async def _has_circular_dependency(
        cls,
        db: AsyncSession,
        goal_id: str,
        check_goal_id: str,
        visited: Optional[set] = None,
    ) -> bool:
        """
        Check for circular dependencies in goal graph.

        Args:
            db: Database session
            goal_id: Starting goal
            check_goal_id: Goal to check against
            visited: Set of visited goal IDs

        Returns:
            True if circular dependency exists
        """
        if visited is None:
            visited = set()

        if goal_id in visited:
            return True

        visited.add(goal_id)

        # Get dependencies of check_goal
        result = await db.execute(
            select(Goal).where(Goal.id == check_goal_id)
        )
        goal = result.scalar_one_or_none()

        if not goal or not goal.depends_on_goal_id:
            return False

        if goal.depends_on_goal_id == goal_id:
            return True

        # Recursively check parent's dependencies
        return await cls._has_circular_dependency(
            db, goal_id, goal.depends_on_goal_id, visited
        )

    @classmethod
    async def get_goal_tree(
        cls,
        db: AsyncSession,
        user_id: str,
    ) -> Dict[str, any]:
        """
        Get hierarchical goal tree with dependencies.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Goal tree structure
        """
        # Get all user goals
        result = await db.execute(
            select(Goal).where(Goal.user_id == user_id)
        )
        goals = result.scalars().all()

        # Build tree structure
        goal_map = {goal.id: goal for goal in goals}
        tree = {
            "root_goals": [],
            "dependent_goals": {},
        }

        for goal in goals:
            goal_dict = cls._goal_to_dict(goal)

            if not goal.depends_on_goal_id:
                # Root goal
                tree["root_goals"].append(goal_dict)
            else:
                # Dependent goal
                parent_id = goal.depends_on_goal_id
                if parent_id not in tree["dependent_goals"]:
                    tree["dependent_goals"][parent_id] = []
                tree["dependent_goals"][parent_id].append(goal_dict)

        return tree

    @classmethod
    def _goal_to_dict(cls, goal: Goal) -> Dict:
        """Convert goal to dictionary with dependency info."""
        return {
            "id": goal.id,
            "title": goal.title,
            "category": goal.category.value,
            "priority": goal.priority.value,
            "status": goal.status,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "progress_percentage": goal.progress_percentage,
            "depends_on_goal_id": goal.depends_on_goal_id,
            "dependency_type": goal.dependency_type,
        }

    @classmethod
    async def unblock_dependent_goals(
        cls,
        db: AsyncSession,
        completed_goal_id: str,
    ):
        """
        Unblock goals that were waiting on completed goal.

        Args:
            db: Database session
            completed_goal_id: ID of goal that was just achieved
        """
        # Find goals dependent on completed goal
        result = await db.execute(
            select(Goal).where(
                and_(
                    Goal.depends_on_goal_id == completed_goal_id,
                    Goal.status == GoalStatus.BLOCKED.value
                )
            )
        )
        dependent_goals = result.scalars().all()

        for goal in dependent_goals:
            if goal.dependency_type == GoalDependencyType.SEQUENTIAL.value:
                # Unblock sequential goals
                goal.status = GoalStatus.ACTIVE.value
            elif goal.dependency_type == GoalDependencyType.CONDITIONAL.value:
                # Activate conditional goals
                goal.status = GoalStatus.ACTIVE.value

        await db.commit()

    @classmethod
    async def allocate_shared_resources(
        cls,
        db: AsyncSession,
        user_id: str,
        total_monthly_savings: float,
    ) -> Dict[str, float]:
        """
        Allocate shared resources across goals based on priority.

        Args:
            db: Database session
            user_id: User ID
            total_monthly_savings: Total available monthly savings

        Returns:
            Dictionary mapping goal_id to allocated amount
        """
        # Get all active goals
        result = await db.execute(
            select(Goal).where(
                and_(
                    Goal.user_id == user_id,
                    Goal.status == GoalStatus.ACTIVE.value
                )
            ).order_by(
                Goal.priority.desc(),  # Essential > Important > Aspirational
                Goal.target_date.asc()  # Earlier goals first
            )
        )
        goals = result.scalars().all()

        allocation = {}
        remaining_funds = total_monthly_savings

        # Priority-based allocation
        for goal in goals:
            required_monthly = goal.required_monthly_savings or 0

            # Apply funding percentage (for shared resource goals)
            required_monthly *= (goal.funding_percentage / 100.0)

            if remaining_funds >= required_monthly:
                # Fully fund this goal
                allocation[goal.id] = required_monthly
                remaining_funds -= required_monthly
            else:
                # Partial funding with remaining funds
                allocation[goal.id] = remaining_funds
                remaining_funds = 0
                break

        # Distribute remaining funds proportionally if any left
        if remaining_funds > 0 and goals:
            total_weight = sum(
                cls._get_priority_weight(g.priority) for g in goals
            )

            for goal in goals:
                weight = cls._get_priority_weight(goal.priority)
                additional = (weight / total_weight) * remaining_funds
                allocation[goal.id] = allocation.get(goal.id, 0) + additional

        return allocation

    @classmethod
    def _get_priority_weight(cls, priority: GoalPriority) -> float:
        """Get numerical weight for priority level."""
        weights = {
            GoalPriority.ESSENTIAL: 3.0,
            GoalPriority.IMPORTANT: 2.0,
            GoalPriority.ASPIRATIONAL: 1.0,
        }
        return weights.get(priority, 1.0)

    @classmethod
    async def check_mutually_exclusive_goals(
        cls,
        db: AsyncSession,
        goal_ids: List[str],
    ) -> List[Dict]:
        """
        Check for mutually exclusive goal conflicts.

        Args:
            db: Database session
            goal_ids: List of goal IDs to check

        Returns:
            List of conflicts
        """
        conflicts = []

        # Get all goals
        result = await db.execute(
            select(Goal).where(Goal.id.in_(goal_ids))
        )
        goals = result.scalars().all()

        # Check for mutually exclusive dependencies
        for i, goal1 in enumerate(goals):
            for goal2 in goals[i+1:]:
                # Check if goals reference each other as mutually exclusive
                if (goal1.depends_on_goal_id == goal2.id and
                    goal1.dependency_type == GoalDependencyType.MUTUALLY_EXCLUSIVE.value):
                    conflicts.append({
                        "goal1": goal1.id,
                        "goal2": goal2.id,
                        "conflict": "mutually_exclusive",
                        "message": f"Goals '{goal1.title}' and '{goal2.title}' are mutually exclusive"
                    })

        return conflicts

    @classmethod
    async def suggest_goal_priority(
        cls,
        goal: Goal,
        existing_goals: List[Goal],
    ) -> GoalPriority:
        """
        Suggest priority for a new goal based on category and existing goals.

        Args:
            goal: New goal
            existing_goals: User's existing goals

        Returns:
            Suggested priority
        """
        # Essential priorities
        essential_categories = [GoalCategory.RETIREMENT, GoalCategory.EMERGENCY]
        if goal.category in essential_categories:
            return GoalPriority.ESSENTIAL

        # Check if education goal for young children (high priority)
        if goal.category == GoalCategory.EDUCATION:
            if goal.child_age and goal.child_age < 10:
                return GoalPriority.IMPORTANT
            else:
                return GoalPriority.ASPIRATIONAL

        # Home purchase - important if no retirement goal
        if goal.category == GoalCategory.HOME:
            has_retirement = any(g.category == GoalCategory.RETIREMENT for g in existing_goals)
            if not has_retirement:
                return GoalPriority.IMPORTANT
            else:
                return GoalPriority.ASPIRATIONAL

        # Default to important
        return GoalPriority.IMPORTANT

    @classmethod
    async def calculate_goal_timeline(
        cls,
        db: AsyncSession,
        user_id: str,
    ) -> List[Dict]:
        """
        Calculate sequential timeline for all goals.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Timeline of goals with projected completion dates
        """
        # Get all active goals ordered by dependencies
        result = await db.execute(
            select(Goal).where(
                and_(
                    Goal.user_id == user_id,
                    Goal.status.in_([GoalStatus.ACTIVE.value, GoalStatus.BLOCKED.value])
                )
            )
        )
        goals = result.scalars().all()

        # Build dependency graph
        goal_map = {g.id: g for g in goals}
        timeline = []
        processed = set()

        # Process root goals first
        root_goals = [g for g in goals if not g.depends_on_goal_id]
        for goal in sorted(root_goals, key=lambda x: x.target_date):
            cls._add_to_timeline(goal, goal_map, timeline, processed)

        return timeline

    @classmethod
    def _add_to_timeline(
        cls,
        goal: Goal,
        goal_map: Dict[str, Goal],
        timeline: List[Dict],
        processed: set,
    ):
        """Recursively add goal and dependents to timeline."""
        if goal.id in processed:
            return

        timeline.append({
            "goal_id": goal.id,
            "title": goal.title,
            "target_date": goal.target_date,
            "dependency_type": goal.dependency_type,
            "depends_on": goal.depends_on_goal_id,
        })
        processed.add(goal.id)

        # Add dependent goals
        for candidate in goal_map.values():
            if candidate.depends_on_goal_id == goal.id:
                cls._add_to_timeline(candidate, goal_map, timeline, processed)
