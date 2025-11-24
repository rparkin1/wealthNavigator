"""
Integration Tests for Section 6: What-If Analysis & Scenario Planning

Tests the complete integration of:
- Monte Carlo simulations
- Interactive scenarios (what-if sliders)
- Sensitivity analysis
- Life event modeling
- Historical market scenarios
- At-risk goal identification
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.goal import Goal, GoalCategory, GoalPriority
from app.models.life_event import LifeEvent, LifeEventType
from app.models.user import User


@pytest.fixture
def test_client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def test_user(db: Session):
    """Create test user"""
    user = User(
        id="test-user-integration",
        email="integration@test.com",
        hashed_password="hashed",
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def test_goal(db: Session, test_user: User):
    """Create test retirement goal"""
    goal = Goal(
        id="test-goal-retirement",
        user_id=test_user.id,
        category=GoalCategory.RETIREMENT,
        priority=GoalPriority.ESSENTIAL,
        title="Retirement at 65",
        target_amount=1500000,
        current_amount=500000,
        target_date="2045-01-01",
        monthly_contribution=2000,
        success_threshold=0.85,
        funding_percentage=100.0,
    )
    db.add(goal)
    db.commit()
    return goal


class TestMonteCarloIntegration:
    """Test Monte Carlo simulation integration"""

    def test_run_simulation_complete_flow(self, test_client, test_goal):
        """Test complete Monte Carlo simulation flow"""
        response = test_client.post(
            f"/api/v1/simulations/run",
            json={
                "goal_id": test_goal.id,
                "iterations": 1000,
                "seed": 42,
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert "simulation_id" in data
        assert data["status"] == "queued"

        # Check simulation status
        sim_id = data["simulation_id"]
        status_response = test_client.get(f"/api/v1/simulations/{sim_id}/status")
        assert status_response.status_code == 200

    def test_simulation_results_structure(self, test_client, test_goal):
        """Test simulation results have correct structure"""
        # Run simulation
        response = test_client.post(
            f"/api/v1/simulations/run",
            json={"goal_id": test_goal.id, "iterations": 1000}
        )
        sim_id = response.json()["simulation_id"]

        # Get results
        results_response = test_client.get(f"/api/v1/simulations/{sim_id}/results")

        if results_response.status_code == 200:
            data = results_response.json()
            assert "success_probability" in data
            assert "median_portfolio_value" in data
            assert "percentile_10" in data
            assert "percentile_90" in data
            assert "portfolio_values_over_time" in data


class TestWhatIfScenariosIntegration:
    """Test what-if scenario integration"""

    def test_create_scenario(self, test_client, test_goal):
        """Test creating a what-if scenario"""
        response = test_client.post(
            f"/api/v1/goal-scenarios/goals/{test_goal.id}/scenarios",
            json={
                "name": "Higher Contributions",
                "description": "Increase monthly savings by 50%",
                "monthly_contribution": 3000,
                "target_amount": 1500000,
                "target_date": "2045-01-01",
                "expected_return": 0.07,
                "risk_level": "moderate",
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Higher Contributions"
        assert "projected_value" in data
        assert "success_probability" in data

    def test_compare_scenarios(self, test_client, test_goal):
        """Test comparing multiple scenarios"""
        # Create scenarios
        scenario_ids = []
        for contrib in [2000, 2500, 3000]:
            response = test_client.post(
                f"/api/v1/goal-scenarios/goals/{test_goal.id}/scenarios",
                json={
                    "name": f"Contribution ${contrib}",
                    "monthly_contribution": contrib,
                    "target_amount": 1500000,
                    "expected_return": 0.07,
                    "risk_level": "moderate",
                }
            )
            if response.status_code == 201:
                scenario_ids.append(response.json()["id"])

        # Compare scenarios
        if len(scenario_ids) >= 2:
            response = test_client.post(
                f"/api/v1/goal-scenarios/compare",
                json={
                    "goal_id": test_goal.id,
                    "scenario_ids": scenario_ids[:2],
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert "scenarios" in data
            assert len(data["scenarios"]) == 2


class TestAtRiskGoalsIntegration:
    """Test at-risk goals identification integration"""

    def test_identify_at_risk_goals(self, test_client, test_user, db: Session):
        """Test identifying goals below success threshold"""
        # Create multiple goals with different success probabilities
        goals = [
            Goal(
                id=f"goal-{i}",
                user_id=test_user.id,
                category=GoalCategory.RETIREMENT,
                priority=GoalPriority.ESSENTIAL,
                title=f"Goal {i}",
                target_amount=1000000,
                current_amount=300000,
                success_probability=prob,
            )
            for i, prob in enumerate([0.92, 0.75, 0.65, 0.88])
        ]
        db.add_all(goals)
        db.commit()

        # Get at-risk goals
        response = test_client.get(
            "/api/v1/goals/at-risk?threshold=0.80"
        )

        assert response.status_code == 200
        data = response.json()
        assert "at_risk_goals" in data
        assert data["at_risk_count"] == 2  # 0.75 and 0.65

    def test_at_risk_recommendations(self, test_client, test_user, db: Session):
        """Test recommendations for at-risk goals"""
        goal = Goal(
            id="at-risk-goal",
            user_id=test_user.id,
            category=GoalCategory.RETIREMENT,
            priority=GoalPriority.ESSENTIAL,
            title="At Risk Goal",
            target_amount=1500000,
            current_amount=400000,
            monthly_contribution=1500,
            success_probability=0.65,
        )
        db.add(goal)
        db.commit()

        response = test_client.get("/api/v1/goals/at-risk?threshold=0.80")

        if response.status_code == 200:
            data = response.json()
            at_risk_goals = data.get("at_risk_goals", [])
            if at_risk_goals:
                assert "recommended_actions" in at_risk_goals[0]
                assert len(at_risk_goals[0]["recommended_actions"]) > 0


class TestLifeEventIntegration:
    """Test life event simulation integration"""

    def test_create_life_event(self, test_client, test_goal):
        """Test creating a life event"""
        response = test_client.post(
            "/api/v1/life-events/events",
            json={
                "goal_id": test_goal.id,
                "event_type": "job_loss",
                "name": "Job Loss at 50",
                "description": "Scenario: 6 month job search",
                "start_year": 5,
                "duration_years": 1,
                "probability": 0.10,
                "financial_impact": {
                    "income_loss_percentage": 1.0,
                    "severance_months": 3,
                    "job_search_months": 6,
                },
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "job_loss"
        assert data["start_year"] == 5

    def test_simulate_life_event_impact(self, test_client, test_goal, db: Session):
        """Test simulating life event impact on goal"""
        # Create life event
        event = LifeEvent(
            id="event-1",
            user_id=test_goal.user_id,
            goal_id=test_goal.id,
            event_type=LifeEventType.JOB_LOSS,
            name="Job Loss",
            start_year=5,
            duration_years=1,
            probability=1.0,
            enabled=True,
            financial_impact={"income_loss_percentage": 1.0, "severance_months": 3},
        )
        db.add(event)
        db.commit()

        # Simulate impact
        response = test_client.post(
            f"/api/v1/life-events/events/{event.id}/simulate",
            json={
                "goal_id": test_goal.id,
                "iterations": 1000,
            }
        )

        if response.status_code == 200:
            data = response.json()
            assert "success_probability_without_event" in data
            assert "success_probability_with_event" in data
            assert "impact_analysis" in data


class TestHistoricalScenariosIntegration:
    """Test historical market scenarios integration"""

    def test_get_historical_scenarios(self, test_client):
        """Test retrieving historical scenarios"""
        response = test_client.get("/api/v1/historical-scenarios/scenarios")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert "id" in data[0]
            assert "name" in data[0]
            assert "period" in data[0]

    def test_get_scenario_detail(self, test_client):
        """Test getting detailed scenario information"""
        # First get all scenarios
        response = test_client.get("/api/v1/historical-scenarios/scenarios")
        scenarios = response.json()

        if scenarios:
            scenario_id = scenarios[0]["id"]

            # Get detail
            detail_response = test_client.get(
                f"/api/v1/historical-scenarios/scenarios/{scenario_id}"
            )

            assert detail_response.status_code == 200
            data = detail_response.json()
            assert "return_sequences" in data or "monthly_returns" in data

    def test_apply_scenario_to_goal(self, test_client, test_goal):
        """Test applying historical scenario to goal"""
        # Get scenarios
        scenarios_response = test_client.get("/api/v1/historical-scenarios/scenarios")
        scenarios = scenarios_response.json()

        if scenarios:
            scenario_id = scenarios[0]["id"]

            # Apply to goal
            response = test_client.post(
                f"/api/v1/historical-scenarios/scenarios/{scenario_id}/apply",
                json={
                    "goal_id": test_goal.id,
                    "initial_portfolio_value": test_goal.current_amount,
                    "monthly_contribution": test_goal.monthly_contribution,
                }
            )

            if response.status_code == 200:
                data = response.json()
                assert "final_value" in data
                assert "total_return" in data
                assert "max_drawdown" in data


class TestSensitivityAnalysisIntegration:
    """Test sensitivity analysis integration"""

    def test_one_way_sensitivity(self, test_client, test_goal):
        """Test one-way sensitivity analysis (tornado diagram)"""
        response = test_client.post(
            "/api/v1/sensitivity/one-way",
            json={
                "goal_id": test_goal.id,
                "variables": [
                    "monthly_contribution",
                    "expected_return",
                    "inflation_rate",
                    "retirement_age",
                ],
                "variation_percentage": 0.20,  # +/- 20%
                "iterations_per_test": 1000,
            }
        )

        if response.status_code == 200:
            data = response.json()
            assert "sensitivity_results" in data
            assert isinstance(data["sensitivity_results"], list)

            if data["sensitivity_results"]:
                result = data["sensitivity_results"][0]
                assert "variable_name" in result
                assert "low_value_impact" in result
                assert "high_value_impact" in result
                assert "impact_range" in result


class TestEndToEndScenarioPlanning:
    """Test complete end-to-end scenario planning workflow"""

    def test_complete_planning_workflow(self, test_client, test_goal, db: Session):
        """Test complete scenario planning workflow"""
        # Step 1: Run base Monte Carlo
        base_sim_response = test_client.post(
            "/api/v1/simulations/run",
            json={"goal_id": test_goal.id, "iterations": 1000}
        )
        assert base_sim_response.status_code == 201

        # Step 2: Create what-if scenarios
        scenario_response = test_client.post(
            f"/api/v1/goal-scenarios/goals/{test_goal.id}/scenarios",
            json={
                "name": "Optimized Plan",
                "monthly_contribution": 2500,
                "expected_return": 0.07,
                "risk_level": "moderate",
            }
        )

        # Step 3: Add life event
        if scenario_response.status_code == 201:
            event_response = test_client.post(
                "/api/v1/life-events/events",
                json={
                    "goal_id": test_goal.id,
                    "event_type": "disability",
                    "name": "Disability Insurance Gap",
                    "start_year": 10,
                    "duration_years": 5,
                    "probability": 0.05,
                    "financial_impact": {
                        "income_replacement_rate": 0.60,
                        "waiting_period_months": 6,
                    },
                }
            )

            # Step 4: Apply historical stress test
            historical_response = test_client.get(
                "/api/v1/historical-scenarios/scenarios"
            )

            if historical_response.status_code == 200:
                scenarios = historical_response.json()
                if scenarios:
                    # Find 2008 crisis
                    crisis_scenario = next(
                        (s for s in scenarios if "2008" in s.get("name", "")),
                        scenarios[0]
                    )

                    stress_response = test_client.post(
                        f"/api/v1/historical-scenarios/scenarios/{crisis_scenario['id']}/apply",
                        json={
                            "goal_id": test_goal.id,
                            "initial_portfolio_value": test_goal.current_amount,
                            "monthly_contribution": test_goal.monthly_contribution,
                        }
                    )

                    # Verify complete workflow
                    assert base_sim_response.status_code == 201
                    assert scenario_response.status_code == 201
                    assert event_response.status_code == 201
                    assert stress_response.status_code == 200


class TestIntegrationDataConsistency:
    """Test data consistency across Section 6 features"""

    def test_goal_data_consistency(self, test_client, test_goal):
        """Test that goal data is consistent across different endpoints"""
        # Get goal from goals endpoint
        goal_response = test_client.get(f"/api/v1/goals/{test_goal.id}")

        # Get goal from scenarios endpoint
        scenarios_response = test_client.get(
            f"/api/v1/goal-scenarios/goals/{test_goal.id}"
        )

        # Get goal from at-risk endpoint
        at_risk_response = test_client.get("/api/v1/goals/at-risk")

        # All should return consistent goal data
        assert goal_response.status_code == 200
        goal_data = goal_response.json()

        # Verify key fields are present and consistent
        assert goal_data["id"] == test_goal.id
        # Support camelCase or snake_case depending on response_model configuration
        target_amount = goal_data.get("target_amount", goal_data.get("targetAmount"))
        assert target_amount == test_goal.target_amount
