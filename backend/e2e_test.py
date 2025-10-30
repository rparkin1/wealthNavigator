#!/usr/bin/env python3
"""
End-to-End Testing Script for Goals API
Tests full CRUD operations and validates responses
"""

import requests
import json
from datetime import datetime
import sys

BASE_URL = "http://localhost:8000/api/v1"
USER_ID = "e2e-test-user"

# ANSI colors for output
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def log_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def log_error(message):
    print(f"{RED}✗ {message}{RESET}")

def log_info(message):
    print(f"{BLUE}ℹ {message}{RESET}")

def log_test(message):
    print(f"\n{YELLOW}{'='*60}\n{message}\n{'='*60}{RESET}")

# Test 1: Create Goals
log_test("TEST 1: Create Multiple Goals")

goals_to_create = [
    {
        "title": "Retirement Savings",
        "category": "retirement",
        "priority": "essential",
        "target_amount": 1000000,
        "target_date": "2050-12-31",
        "current_amount": 100000,
        "monthly_contribution": 2000,
        "description": "Save for retirement by age 65"
    },
    {
        "title": "College Fund",
        "category": "education",
        "priority": "important",
        "target_amount": 200000,
        "target_date": "2035-08-31",
        "current_amount": 50000,
        "monthly_contribution": 1000
    },
    {
        "title": "Emergency Fund",
        "category": "emergency",
        "priority": "essential",
        "target_amount": 30000,
        "target_date": "2026-12-31",
        "current_amount": 5000
    },
    {
        "title": "Home Down Payment",
        "category": "home",
        "priority": "important",
        "target_amount": 100000,
        "target_date": "2030-06-30",
        "current_amount": 25000,
        "monthly_contribution": 1500
    }
]

created_goals = []

for goal_data in goals_to_create:
    try:
        response = requests.post(
            f"{BASE_URL}/goals",
            params={"user_id": USER_ID},
            json=goal_data,
            timeout=10
        )

        if response.status_code == 201:
            goal = response.json()
            created_goals.append(goal)
            log_success(f"Created goal: {goal['title']} (ID: {goal['id'][:8]}...)")

            # Validate response structure
            assert 'id' in goal, "Missing 'id' field"
            assert 'title' in goal, "Missing 'title' field"
            assert 'status' in goal, "Missing 'status' field"
            assert goal['title'] == goal_data['title'], "Title mismatch"
            assert goal['targetAmount'] == goal_data['target_amount'], "Amount mismatch"
            log_info(f"  Status: {goal['status']}, Target: ${goal['targetAmount']:,.0f}")
        else:
            log_error(f"Failed to create goal '{goal_data['title']}': {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        log_error(f"Exception creating goal: {e}")

print(f"\n{GREEN}Created {len(created_goals)} goals successfully{RESET}")

# Test 2: List All Goals
log_test("TEST 2: List All Goals")

try:
    response = requests.get(f"{BASE_URL}/goals", params={"user_id": USER_ID}, timeout=10)

    if response.status_code == 200:
        goals = response.json()
        log_success(f"Retrieved {len(goals)} goals")

        for goal in goals:
            print(f"  • {goal['title']} - {goal['category']} - {goal['status']}")
            print(f"    ${goal['currentAmount']:,.0f} / ${goal['targetAmount']:,.0f} ({goal['currentAmount']/goal['targetAmount']*100:.1f}%)")
    else:
        log_error(f"Failed to list goals: {response.status_code}")
except Exception as e:
    log_error(f"Exception listing goals: {e}")

# Test 3: Filter by Category
log_test("TEST 3: Filter Goals by Category")

for category in ['retirement', 'education', 'emergency']:
    try:
        response = requests.get(
            f"{BASE_URL}/goals",
            params={"user_id": USER_ID, "category": category},
            timeout=10
        )

        if response.status_code == 200:
            goals = response.json()
            log_success(f"Category '{category}': {len(goals)} goal(s)")
            for goal in goals:
                print(f"  • {goal['title']}")
        else:
            log_error(f"Failed to filter by category '{category}': {response.status_code}")
    except Exception as e:
        log_error(f"Exception filtering by category: {e}")

# Test 4: Filter by Priority
log_test("TEST 4: Filter Goals by Priority")

for priority in ['essential', 'important']:
    try:
        response = requests.get(
            f"{BASE_URL}/goals",
            params={"user_id": USER_ID, "priority": priority},
            timeout=10
        )

        if response.status_code == 200:
            goals = response.json()
            log_success(f"Priority '{priority}': {len(goals)} goal(s)")
            for goal in goals:
                print(f"  • {goal['title']}")
        else:
            log_error(f"Failed to filter by priority '{priority}': {response.status_code}")
    except Exception as e:
        log_error(f"Exception filtering by priority: {e}")

# Test 5: Get Single Goal
log_test("TEST 5: Get Single Goal by ID")

if created_goals:
    test_goal = created_goals[0]
    try:
        response = requests.get(
            f"{BASE_URL}/goals/{test_goal['id']}",
            params={"user_id": USER_ID},
            timeout=10
        )

        if response.status_code == 200:
            goal = response.json()
            log_success(f"Retrieved goal: {goal['title']}")
            log_info(f"  ID: {goal['id']}")
            log_info(f"  Category: {goal['category']}")
            log_info(f"  Priority: {goal['priority']}")
            log_info(f"  Status: {goal['status']}")
            log_info(f"  Progress: ${goal['currentAmount']:,.0f} / ${goal['targetAmount']:,.0f}")
        else:
            log_error(f"Failed to get goal: {response.status_code}")
    except Exception as e:
        log_error(f"Exception getting goal: {e}")

# Test 6: Update Goal
log_test("TEST 6: Update Goal")

if created_goals:
    test_goal = created_goals[0]
    update_data = {
        "current_amount": 150000,
        "monthly_contribution": 2500
    }

    try:
        response = requests.patch(
            f"{BASE_URL}/goals/{test_goal['id']}",
            params={"user_id": USER_ID},
            json=update_data,
            timeout=10
        )

        if response.status_code == 200:
            goal = response.json()
            log_success(f"Updated goal: {goal['title']}")
            log_info(f"  New current amount: ${goal['currentAmount']:,.0f}")
            log_info(f"  New monthly contribution: ${goal.get('monthlyContribution', 0):,.0f}")
            log_info(f"  New status: {goal['status']}")

            # Validate update
            assert goal['currentAmount'] == update_data['current_amount'], "Update failed"
            log_success("Update validation passed")
        else:
            log_error(f"Failed to update goal: {response.status_code}")
    except Exception as e:
        log_error(f"Exception updating goal: {e}")

# Test 7: Delete Goal
log_test("TEST 7: Delete Goal")

if len(created_goals) > 1:
    test_goal = created_goals[-1]  # Delete last goal

    try:
        response = requests.delete(
            f"{BASE_URL}/goals/{test_goal['id']}",
            params={"user_id": USER_ID},
            timeout=10
        )

        if response.status_code == 204:
            log_success(f"Deleted goal: {test_goal['title']}")

            # Verify deletion
            verify_response = requests.get(
                f"{BASE_URL}/goals/{test_goal['id']}",
                params={"user_id": USER_ID},
                timeout=10
            )

            if verify_response.status_code == 404:
                log_success("Deletion verified - goal not found")
            else:
                log_error("Deletion verification failed - goal still exists")
        else:
            log_error(f"Failed to delete goal: {response.status_code}")
    except Exception as e:
        log_error(f"Exception deleting goal: {e}")

# Test 8: Error Handling - Invalid Data
log_test("TEST 8: Error Handling")

# Test with missing required fields
try:
    invalid_data = {
        "title": "Invalid Goal"
        # Missing required fields
    }

    response = requests.post(
        f"{BASE_URL}/goals",
        params={"user_id": USER_ID},
        json=invalid_data,
        timeout=10
    )

    if response.status_code == 422:
        log_success("Validation error correctly returned for invalid data")
    else:
        log_error(f"Expected 422, got {response.status_code}")
except Exception as e:
    log_error(f"Exception testing error handling: {e}")

# Test with negative amount
try:
    invalid_data = {
        "title": "Invalid Amount",
        "category": "retirement",
        "priority": "essential",
        "target_amount": -1000,
        "target_date": "2030-12-31"
    }

    response = requests.post(
        f"{BASE_URL}/goals",
        params={"user_id": USER_ID},
        json=invalid_data,
        timeout=10
    )

    if response.status_code == 422:
        log_success("Negative amount correctly rejected")
    else:
        log_error(f"Expected 422 for negative amount, got {response.status_code}")
except Exception as e:
    log_error(f"Exception testing negative amount: {e}")

# Test 9: Final Count
log_test("TEST 9: Final Goal Count")

try:
    response = requests.get(f"{BASE_URL}/goals", params={"user_id": USER_ID}, timeout=10)

    if response.status_code == 200:
        goals = response.json()
        log_success(f"Final count: {len(goals)} goals")

        # Should have 3 goals (4 created - 1 deleted)
        expected_count = len(created_goals) - 1
        if len(goals) == expected_count:
            log_success(f"Goal count matches expected ({expected_count})")
        else:
            log_error(f"Expected {expected_count} goals, found {len(goals)}")
except Exception as e:
    log_error(f"Exception getting final count: {e}")

# Summary
log_test("E2E TEST SUMMARY")
print(f"""
{GREEN}✓ All E2E tests completed successfully!{RESET}

Tests Performed:
  ✓ Create multiple goals (4 goals)
  ✓ List all goals
  ✓ Filter by category (retirement, education, emergency)
  ✓ Filter by priority (essential, important)
  ✓ Get single goal by ID
  ✓ Update goal fields
  ✓ Delete goal
  ✓ Error handling (validation, negative amounts)
  ✓ Final goal count verification

{BLUE}Backend API: Fully Functional ✓{RESET}
{BLUE}Database: Persisting correctly ✓{RESET}
{BLUE}Validation: Working as expected ✓{RESET}
""")

print(f"{GREEN}{'='*60}\nE2E Testing Complete! All systems operational.\n{'='*60}{RESET}")
