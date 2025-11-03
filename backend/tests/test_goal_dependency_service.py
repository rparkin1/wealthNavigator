"""
Unit tests for Goal Dependency Service

Tests goal dependencies, circular detection, and resource allocation.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.goal_dependency_service import GoalDependencyService
from app.models.goal import Goal, GoalCategory, GoalPriority, GoalDependencyType, GoalStatus


@pytest.fixture
def sample_goals():
    """Sample goals for testing"""
    retirement_goal = Goal(
        id="goal-retirement",
        user_id="user-123",
        title="Retirement at 65",
        category=GoalCategory.RETIREMENT,
        priority=GoalPriority.ESSENTIAL,
        target_amount=1000000,
        current_amount=100000,
        target_date=(datetime.now() + timedelta(days=365*25)).strftime("%Y-%m-%d"),
        status="active"
    )

    education_goal = Goal(
        id="goal-education",
        user_id="user-123",
        title="College Education",
        category=GoalCategory.EDUCATION,
        priority=GoalPriority.IMPORTANT,
        target_amount=200000,
        current_amount=20000,
        target_date=(datetime.now() + timedelta(days=365*10)).strftime("%Y-%m-%d"),
        status="active"
    )

    home_goal = Goal(
        id="goal-home",
        user_id="user-123",
        title="Down Payment",
        category=GoalCategory.HOME,
        priority=GoalPriority.IMPORTANT,
        target_amount=100000,
        current_amount=30000,
        target_date=(datetime.now() + timedelta(days=365*3)).strftime("%Y-%m-%d"),
        status="active"
    )

    return [retirement_goal, education_goal, home_goal]


class TestGoalDependencyService:
    """Test suite for GoalDependencyService"""

    @pytest.mark.asyncio
    async def test_create_dependency_success(self, sample_goals):
        """Test successful dependency creation"""
        mock_db = AsyncMock(spec=AsyncSession)

        # Mock database queries
        def execute_side_effect(query):
            result = MagicMock()
            result.scalar_one_or_none.return_value = sample_goals[1]  # education goal
            return result

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        # Create sequential dependency
        success = await GoalDependencyService.create_dependency(
            db=mock_db,
            dependent_goal_id="goal-education",
            depends_on_goal_id="goal-retirement",
            dependency_type=GoalDependencyType.SEQUENTIAL
        )

        assert success is True
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_circular_dependency_detection(self):
        """Test circular dependency prevention"""
        mock_db = AsyncMock(spec=AsyncSession)

        # Create circular relationship: A -> B -> A
        goal_a = Goal(id="goal-a", depends_on_goal_id="goal-b")
        goal_b = Goal(id="goal-b", depends_on_goal_id="goal-a")

        def execute_side_effect(query):
            result = MagicMock()
            # Simulate finding circular dependency
            result.scalar_one_or_none.return_value = goal_b
            return result

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        # Should raise ValueError due to circular dependency
        with pytest.raises(ValueError, match="Circular dependency detected"):
            await GoalDependencyService.create_dependency(
                db=mock_db,
                dependent_goal_id="goal-a",
                depends_on_goal_id="goal-b",
                dependency_type=GoalDependencyType.SEQUENTIAL
            )

    @pytest.mark.asyncio
    async def test_allocate_shared_resources_priority(self, sample_goals):
        """Test resource allocation respects priority"""
        mock_db = AsyncMock(spec=AsyncSession)

        # Mock query to return goals
        def execute_side_effect(query):
            result = MagicMock()
            result.scalars.return_value.all.return_value = sample_goals
            return result

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        # Allocate $3000/month across goals
        allocations = await GoalDependencyService.allocate_shared_resources(
            db=mock_db,
            user_id="user-123",
            total_monthly_savings=3000
        )

        # Essential goal (retirement) should get priority
        assert "goal-retirement" in allocations
        assert allocations["goal-retirement"] > 0

        # Total allocated should not exceed available
        total_allocated = sum(allocations.values())
        assert total_allocated <= 3000

    @pytest.mark.asyncio
    async def test_get_goal_tree_structure(self, sample_goals):
        """Test goal tree generation"""
        mock_db = AsyncMock(spec=AsyncSession)

        # Add dependency
        sample_goals[1].depends_on_goal_id = sample_goals[0].id
        sample_goals[1].dependency_type = GoalDependencyType.SEQUENTIAL.value

        def execute_side_effect(query):
            result = MagicMock()
            result.scalars.return_value.all.return_value = sample_goals
            return result

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        tree = await GoalDependencyService.get_goal_tree(
            db=mock_db,
            user_id="user-123"
        )

        # Should have root goals and dependent goals
        assert "root_goals" in tree
        assert "dependent_goals" in tree
        assert len(tree["root_goals"]) > 0

    @pytest.mark.asyncio
    async def test_unblock_dependent_goals(self, sample_goals):
        """Test automatic unblocking when dependency completes"""
        mock_db = AsyncMock(spec=AsyncSession)

        # Create blocked goal
        blocked_goal = sample_goals[1]
        blocked_goal.depends_on_goal_id = "goal-retirement"
        blocked_goal.dependency_type = GoalDependencyType.SEQUENTIAL.value
        blocked_goal.status = GoalStatus.BLOCKED.value

        def execute_side_effect(query):
            result = MagicMock()
            result.scalars.return_value.all.return_value = [blocked_goal]
            return result

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        await GoalDependencyService.unblock_dependent_goals(
            db=mock_db,
            completed_goal_id="goal-retirement"
        )

        # Goal should be unblocked
        assert blocked_goal.status == GoalStatus.ACTIVE.value
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_suggest_goal_priority(self, sample_goals):
        """Test priority suggestion logic"""
        # Essential categories should get ESSENTIAL priority
        retirement_goal = sample_goals[0]
        priority = await GoalDependencyService.suggest_goal_priority(
            goal=retirement_goal,
            existing_goals=[]
        )
        assert priority == GoalPriority.ESSENTIAL

        # Education with young child should get IMPORTANT
        education_goal = sample_goals[1]
        education_goal.child_age = 5
        priority = await GoalDependencyService.suggest_goal_priority(
            goal=education_goal,
            existing_goals=sample_goals
        )
        assert priority == GoalPriority.IMPORTANT

    @pytest.mark.asyncio
    async def test_check_mutually_exclusive_conflicts(self):
        """Test mutually exclusive goal conflict detection"""
        mock_db = AsyncMock(spec=AsyncSession)

        goal_a = Goal(
            id="goal-a",
            title="Retire at 50",
            depends_on_goal_id="goal-b",
            dependency_type=GoalDependencyType.MUTUALLY_EXCLUSIVE.value
        )
        goal_b = Goal(id="goal-b", title="Retire at 60")

        def execute_side_effect(query):
            result = MagicMock()
            result.scalars.return_value.all.return_value = [goal_a, goal_b]
            return result

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        conflicts = await GoalDependencyService.check_mutually_exclusive_goals(
            db=mock_db,
            goal_ids=["goal-a", "goal-b"]
        )

        # Should detect conflict
        assert len(conflicts) > 0
        assert conflicts[0]["conflict"] == "mutually_exclusive"

    @pytest.mark.asyncio
    async def test_calculate_goal_timeline(self, sample_goals):
        """Test goal timeline calculation"""
        mock_db = AsyncMock(spec=AsyncSession)

        # Set up dependency chain
        sample_goals[2].depends_on_goal_id = sample_goals[1].id

        def execute_side_effect(query):
            result = MagicMock()
            result.scalars.return_value.all.return_value = sample_goals
            return result

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        timeline = await GoalDependencyService.calculate_goal_timeline(
            db=mock_db,
            user_id="user-123"
        )

        # Should return ordered timeline
        assert isinstance(timeline, list)
        assert len(timeline) > 0

    def test_priority_weight_calculation(self):
        """Test priority weight assignment"""
        essential_weight = GoalDependencyService._get_priority_weight(GoalPriority.ESSENTIAL)
        important_weight = GoalDependencyService._get_priority_weight(GoalPriority.IMPORTANT)
        aspirational_weight = GoalDependencyService._get_priority_weight(GoalPriority.ASPIRATIONAL)

        # Essential should have highest weight
        assert essential_weight > important_weight > aspirational_weight
        assert essential_weight == 3.0
        assert important_weight == 2.0
        assert aspirational_weight == 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
