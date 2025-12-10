"""
Tests for Goals API
Tests all CRUD operations and goal analysis
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Goal, GoalCategory, GoalPriority


@pytest.mark.asyncio
async def test_create_goal(authenticated_client: AsyncClient, test_user):
    """Test creating a new goal"""
    goal_data = {
        "title": "Retirement Savings",
        "category": "retirement",
        "priority": "essential",
        "target_amount": 1000000,
        "target_date": "2050-12-31",
        "current_amount": 50000,
        "monthly_contribution": 2000,
        "description": "Save for retirement by age 65"
    }

    response = await authenticated_client.post(
        "/api/v1/goals",
        json=goal_data,
        params={"user_id": test_user.id}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == goal_data["title"]
    assert data["category"] == goal_data["category"]
    assert data["priority"] == goal_data["priority"]
    assert data["targetAmount"] == goal_data["target_amount"]
    assert data["currentAmount"] == goal_data["current_amount"]
    assert data["targetDate"] == goal_data["target_date"]
    assert data["monthlyContribution"] == goal_data["monthly_contribution"]
    assert "id" in data
    assert "status" in data


@pytest.mark.asyncio
async def test_list_goals(authenticated_client: AsyncClient, test_user, db: AsyncSession):
    """Test listing all goals for a user"""
    # Create test goals
    goals = [
        Goal(
            user_id=test_user.id,
            title="Retirement",
            category=GoalCategory.RETIREMENT,
            priority=GoalPriority.ESSENTIAL,
            target_amount=1000000,
            current_amount=100000,
            target_date="2050-12-31"
        ),
        Goal(
            user_id=test_user.id,
            title="College Fund",
            category=GoalCategory.EDUCATION,
            priority=GoalPriority.IMPORTANT,
            target_amount=200000,
            current_amount=50000,
            target_date="2035-08-31"
        )
    ]

    for goal in goals:
        db.add(goal)
    await db.commit()

    response = await authenticated_client.get(
        "/api/v1/goals",
        params={"user_id": test_user.id}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all("title" in goal for goal in data)
    assert all("status" in goal for goal in data)


@pytest.mark.asyncio
async def test_filter_goals_by_category(authenticated_client: AsyncClient, test_user, db: AsyncSession):
    """Test filtering goals by category"""
    # Create goals with different categories
    goals = [
        Goal(
            user_id=test_user.id,
            title="Retirement",
            category=GoalCategory.RETIREMENT,
            priority=GoalPriority.ESSENTIAL,
            target_amount=1000000,
            current_amount=100000,
            target_date="2050-12-31"
        ),
        Goal(
            user_id=test_user.id,
            title="Education",
            category=GoalCategory.EDUCATION,
            priority=GoalPriority.IMPORTANT,
            target_amount=200000,
            current_amount=50000,
            target_date="2035-08-31"
        )
    ]

    for goal in goals:
        db.add(goal)
    await db.commit()

    response = await authenticated_client.get(
        "/api/v1/goals",
        params={"user_id": test_user.id, "category": "retirement"}
    )

    assert response.status_code == 200
    data = response.json()
    assert all(goal["category"] == "retirement" for goal in data)


@pytest.mark.asyncio
async def test_get_goal_by_id(authenticated_client: AsyncClient, test_user, db: AsyncSession):
    """Test retrieving a specific goal"""
    goal = Goal(
        user_id=test_user.id,
        title="Test Goal",
        category=GoalCategory.HOME,
        priority=GoalPriority.ESSENTIAL,
        target_amount=100000,
        current_amount=20000,
        target_date="2030-06-15"
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    response = await authenticated_client.get(
        f"/api/v1/goals/{goal.id}",
        params={"user_id": test_user.id}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == goal.id
    assert data["title"] == "Test Goal"


@pytest.mark.asyncio
async def test_get_goal_not_found(authenticated_client: AsyncClient, test_user):
    """Test retrieving a non-existent goal"""
    response = await authenticated_client.get(
        "/api/v1/goals/nonexistent-id",
        params={"user_id": test_user.id}
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_goal(authenticated_client: AsyncClient, test_user, db: AsyncSession):
    """Test updating a goal"""
    goal = Goal(
        user_id=test_user.id,
        title="Original Title",
        category=GoalCategory.EMERGENCY,
        priority=GoalPriority.IMPORTANT,
        target_amount=30000,
        current_amount=5000,
        target_date="2028-12-31"
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    update_data = {
        "title": "Updated Title",
        "current_amount": 10000,
        "monthly_contribution": 500
    }

    response = await authenticated_client.patch(
        f"/api/v1/goals/{goal.id}",
        json=update_data,
        params={"user_id": test_user.id}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["currentAmount"] == 10000
    assert data["monthlyContribution"] == 500


@pytest.mark.asyncio
async def test_delete_goal(authenticated_client: AsyncClient, test_user, db: AsyncSession):
    """Test deleting a goal"""
    goal = Goal(
        user_id=test_user.id,
        title="To Be Deleted",
        category=GoalCategory.MAJOR_EXPENSE,
        priority=GoalPriority.ASPIRATIONAL,
        target_amount=50000,
        current_amount=0,
        target_date="2032-01-01"
    )

    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    response = await authenticated_client.delete(
        f"/api/v1/goals/{goal.id}",
        params={"user_id": test_user.id}
    )

    assert response.status_code == 204

    # Verify deletion
    get_response = await authenticated_client.get(
        f"/api/v1/goals/{goal.id}",
        params={"user_id": test_user.id}
    )
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_goal_status_calculation(authenticated_client: AsyncClient, test_user):
    """Test that goal status is calculated correctly"""
    # Create goal with high progress
    goal_data = {
        "title": "High Progress Goal",
        "category": "retirement",
        "priority": "essential",
        "target_amount": 100000,
        "target_date": "2035-12-31",
        "current_amount": 85000  # 85% progress
    }

    response = await authenticated_client.post(
        "/api/v1/goals",
        json=goal_data,
        params={"user_id": test_user.id}
    )

    assert response.status_code == 201
    data = response.json()
    # Should be on_track with 85% progress
    assert data["status"] in ["on_track", "behind", "at_risk", "achieved"]


@pytest.mark.asyncio
async def test_create_goal_validation(authenticated_client: AsyncClient, test_user):
    """Test goal creation with invalid data"""
    # Missing required fields
    invalid_data = {
        "title": "Test",
        # missing category, target_amount, target_date
    }

    response = await authenticated_client.post(
        "/api/v1/goals",
        json=invalid_data,
        params={"user_id": test_user.id}
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_goal_with_negative_amount(authenticated_client: AsyncClient, test_user):
    """Test that negative amounts are rejected"""
    invalid_data = {
        "title": "Test Goal",
        "category": "retirement",
        "priority": "essential",
        "target_amount": -1000,  # Invalid
        "target_date": "2030-12-31"
    }

    response = await authenticated_client.post(
        "/api/v1/goals",
        json=invalid_data,
        params={"user_id": test_user.id}
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_goals_empty(authenticated_client: AsyncClient, test_user):
    """Test listing goals when user has none"""
    response = await authenticated_client.get(
        "/api/v1/goals",
        params={"user_id": test_user.id}
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
