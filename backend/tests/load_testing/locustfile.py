"""
Load Testing with Locust
Tests concurrent user performance for WealthNavigator AI

Usage:
    # Run with 100 users, ramping up 10 users per second
    locust -f locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10

    # Run with web UI
    locust -f locustfile.py --host=http://localhost:8000

    # Run headless for 5 minutes
    locust -f locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10 --run-time 5m --headless
"""

from locust import HttpUser, task, between, events
import json
import random
from datetime import datetime, timedelta

# Test data
SAMPLE_USER_IDS = [f"test_user_{i}" for i in range(1, 51)]

SAMPLE_GOALS = {
    "name": "Retirement at 65",
    "goal_type": "retirement",
    "target_amount": 2000000,
    "target_date": (datetime.now() + timedelta(days=365 * 20)).isoformat(),
    "priority": "essential",
}

SAMPLE_PORTFOLIO = {
    "accounts": [
        {
            "id": "401k",
            "name": "401(k) Plan",
            "type": "tax_deferred",
            "balance": 150000,
            "current_holdings": {},
        }
    ],
    "goals": [
        {
            "id": "retirement",
            "name": "Retirement at 65",
            "target_amount": 2000000,
            "current_amount": 150000,
            "years_to_goal": 20,
            "priority": "essential",
            "risk_tolerance": 0.6,
            "success_threshold": 0.85,
        }
    ],
}


class WealthNavigatorUser(HttpUser):
    """Simulates a typical WealthNavigator user"""

    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks

    def on_start(self):
        """Initialize user session"""
        self.user_id = random.choice(SAMPLE_USER_IDS)
        self.goal_id = None
        self.thread_id = None

    @task(10)
    def view_dashboard(self):
        """View main dashboard - most common action"""
        self.client.get("/health")

    @task(8)
    def list_goals(self):
        """List user goals"""
        self.client.get(
            f"/api/v1/goals?user_id={self.user_id}",
            name="/api/v1/goals [LIST]"
        )

    @task(5)
    def create_goal(self):
        """Create a new financial goal"""
        goal_data = {
            **SAMPLE_GOALS,
            "user_id": self.user_id,
            "name": f"Goal {random.randint(1, 1000)}",
        }
        response = self.client.post(
            "/api/v1/goals",
            json=goal_data,
            name="/api/v1/goals [CREATE]"
        )
        if response.status_code == 200:
            self.goal_id = response.json().get("id")

    @task(7)
    def get_goal_funding_analysis(self):
        """Get goal funding calculations"""
        if not self.goal_id:
            return

        self.client.post(
            "/api/v1/goal-planning/funding/calculate-required-savings",
            json={
                "current_amount": 50000,
                "target_amount": 200000,
                "years_remaining": 10,
                "expected_return": 0.07,
                "contribution_frequency": "monthly",
            },
            name="/api/v1/goal-funding [CALCULATE]"
        )

    @task(6)
    def portfolio_optimization(self):
        """Run portfolio optimization"""
        self.client.post(
            "/api/v1/portfolio-optimization/simple-allocation",
            json={
                "risk_tolerance": random.uniform(0.3, 0.8),
                "time_horizon": random.randint(5, 30),
                "include_alternatives": random.choice([True, False]),
            },
            name="/api/v1/portfolio-optimization [SIMPLE]"
        )

    @task(4)
    def multi_goal_optimization(self):
        """Run multi-goal portfolio optimization"""
        self.client.post(
            "/api/v1/portfolio-optimization/multi-level-optimization",
            json=SAMPLE_PORTFOLIO,
            name="/api/v1/portfolio-optimization [MULTI-LEVEL]"
        )

    @task(3)
    def monte_carlo_simulation(self):
        """Run Monte Carlo simulation"""
        if not self.goal_id:
            return

        self.client.post(
            f"/api/v1/simulations/monte-carlo?user_id={self.user_id}",
            json={
                "goal_id": self.goal_id,
                "current_amount": 50000,
                "monthly_contribution": 1000,
                "years": 20,
                "iterations": 1000,  # Reduced for load testing
            },
            name="/api/v1/simulations/monte-carlo [RUN]"
        )

    @task(5)
    def risk_assessment(self):
        """Get risk assessment"""
        self.client.post(
            "/api/v1/risk-management/risk-tolerance",
            json={
                "answers": [3, 4, 3, 3, 4],
                "age": random.randint(25, 65),
                "income": random.randint(50000, 200000),
            },
            name="/api/v1/risk-management [ASSESSMENT]"
        )

    @task(3)
    def diversification_analysis(self):
        """Run diversification analysis"""
        self.client.post(
            "/api/v1/diversification/analyze-portfolio",
            json={
                "holdings": {
                    "US_LC_BLEND": 0.40,
                    "INTL_DEV_BLEND": 0.20,
                    "US_TREASURY_INTER": 0.25,
                    "US_CORP_IG": 0.15,
                }
            },
            name="/api/v1/diversification [ANALYZE]"
        )

    @task(2)
    def retirement_planning(self):
        """Access retirement planning"""
        self.client.post(
            "/api/v1/retirement/income-projection",
            json={
                "current_age": random.randint(25, 55),
                "retirement_age": 65,
                "current_savings": random.randint(50000, 500000),
                "monthly_contribution": random.randint(500, 5000),
            },
            name="/api/v1/retirement [PROJECTION]"
        )

    @task(4)
    def list_threads(self):
        """List conversation threads"""
        self.client.get(
            f"/api/v1/threads?user_id={self.user_id}",
            name="/api/v1/threads [LIST]"
        )

    @task(2)
    def get_asset_classes(self):
        """Get available asset classes"""
        self.client.get(
            "/api/v1/portfolio-optimization/asset-classes",
            name="/api/v1/asset-classes [LIST]"
        )

    @task(1)
    def get_performance_metrics(self):
        """Check performance metrics"""
        self.client.get(
            "/api/v1/performance-metrics/stats",
            name="/api/v1/performance-metrics [STATS]"
        )


class StressTestUser(HttpUser):
    """Aggressive stress testing user"""

    wait_time = between(0.1, 0.5)  # Very short wait times

    def on_start(self):
        self.user_id = random.choice(SAMPLE_USER_IDS)

    @task
    def rapid_fire_requests(self):
        """Rapid fire requests to test under load"""
        endpoints = [
            "/health",
            "/api/v1/goals",
            "/api/v1/portfolio-optimization/asset-classes",
            "/api/v1/threads",
        ]
        endpoint = random.choice(endpoints)
        self.client.get(endpoint)


# Performance thresholds
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    """Track requests that exceed thresholds"""
    if exception:
        return

    # Define thresholds (milliseconds)
    thresholds = {
        "/health": 100,
        "/api/v1/goals": 500,
        "/api/v1/portfolio-optimization": 5000,
        "/api/v1/simulations/monte-carlo": 30000,
        "default": 2000,
    }

    # Find matching threshold
    threshold = thresholds.get("default")
    for pattern, t in thresholds.items():
        if pattern in name:
            threshold = t
            break

    # Log slow requests
    if response_time > threshold:
        print(
            f"⚠️  SLOW REQUEST: {name} took {response_time}ms "
            f"(threshold: {threshold}ms)"
        )


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    print("\n" + "=" * 60)
    print("🚀 Starting WealthNavigator Load Test")
    print("=" * 60)
    print(f"Host: {environment.host}")
    print(f"Users: {environment.runner.target_user_count}")
    print("=" * 60 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    print("\n" + "=" * 60)
    print("✅ Load Test Complete")
    print("=" * 60)
    stats = environment.stats.total
    print(f"Total Requests: {stats.num_requests}")
    print(f"Failed Requests: {stats.num_failures}")
    print(f"Average Response Time: {stats.avg_response_time:.2f}ms")
    print(f"Min Response Time: {stats.min_response_time:.2f}ms")
    print(f"Max Response Time: {stats.max_response_time:.2f}ms")
    print(f"Requests/sec: {stats.total_rps:.2f}")
    print("=" * 60 + "\n")
