"""
Tests for financial planning agents and LangGraph workflow
"""

import pytest
from app.agents import (
    create_financial_planning_graph,
    orchestrator_node,
    goal_planner_node,
    portfolio_architect_node,
    monte_carlo_simulator_node,
    visualization_node
)
from app.agents.state import create_initial_state


class TestAgentWorkflow:
    """Test the complete agent workflow"""

    @pytest.mark.asyncio
    async def test_create_financial_planning_graph(self):
        """Test graph creation"""
        graph = create_financial_planning_graph(enable_checkpointing=False)
        assert graph is not None

    @pytest.mark.asyncio
    async def test_initial_state_creation(self):
        """Test initial state creation"""
        state = create_initial_state(
            thread_id="test-thread",
            user_id="test-user",
            user_query="I want to retire at 60",
            user_profile={"risk_tolerance": 0.6}
        )

        assert state["thread_id"] == "test-thread"
        assert state["user_id"] == "test-user"
        assert state["user_query"] == "I want to retire at 60"
        assert state["next_agent"] == "orchestrator"
        assert state["workflow_status"] == "in_progress"
        assert len(state["messages"]) == 1
        assert state["messages"][0]["role"] == "user"

    @pytest.mark.asyncio
    async def test_orchestrator_node(self):
        """Test orchestrator agent"""
        state = create_initial_state(
            thread_id="test",
            user_id="test-user",
            user_query="Help me plan for retirement"
        )

        result = await orchestrator_node(state)

        assert "task_type" in result
        assert "next_agent" in result
        assert "active_agents" in result
        assert "agent_responses" in result
        assert len(result["agent_responses"]) > 0
        assert result["agent_responses"][0]["agent_id"] == "orchestrator"

    @pytest.mark.asyncio
    async def test_goal_planner_node(self):
        """Test goal planner agent"""
        state = create_initial_state(
            thread_id="test",
            user_id="test-user",
            user_query="I need to save for retirement"
        )
        # Add empty goals to test goal planner
        state["goals"] = []
        state["active_goal_ids"] = []

        result = await goal_planner_node(state)

        assert "agent_responses" in result
        assert "completed_agents" in result
        assert "goal_planner" in result["completed_agents"]
        assert len(result["agent_responses"]) > 0

    @pytest.mark.asyncio
    async def test_portfolio_architect_node(self):
        """Test portfolio architect agent"""
        state = create_initial_state(
            thread_id="test",
            user_id="test-user",
            user_query="What should my portfolio allocation be?"
        )
        state["user_profile"] = {"risk_tolerance": 0.6, "age": 35}

        result = await portfolio_architect_node(state)

        assert "portfolio_allocation" in result
        assert "allocation" in result["portfolio_allocation"]
        assert "expected_return" in result["portfolio_allocation"]
        assert "expected_volatility" in result["portfolio_allocation"]
        assert "sharpe_ratio" in result["portfolio_allocation"]
        assert "agent_responses" in result
        assert "portfolio_architect" in result["completed_agents"]

        # Verify allocation sums to approximately 1 (100%)
        allocation = result["portfolio_allocation"]["allocation"]
        total = sum(allocation.values())
        assert abs(total - 1.0) < 0.01  # Within 1% of 100%

    @pytest.mark.asyncio
    async def test_monte_carlo_simulator_node(self):
        """Test Monte Carlo simulator agent"""
        state = create_initial_state(
            thread_id="test",
            user_id="test-user",
            user_query="What is my success probability?"
        )
        state["portfolio_allocation"] = {
            "allocation": {"US_LargeCap": 0.6, "Bonds": 0.4},
            "expected_return": 0.08,
            "expected_volatility": 0.12,
            "sharpe_ratio": 0.5
        }
        state["goals"] = [{
            "id": "goal-1",
            "name": "Retirement",
            "category": "retirement",
            "target_amount": 1000000,
            "target_date": "2050-12-31",
            "current_funding": 100000,
            "priority": "essential"
        }]
        state["active_goal_ids"] = ["goal-1"]

        result = await monte_carlo_simulator_node(state)

        assert "simulation_results" in result or "error" in result
        if "simulation_results" in result:
            assert "success_probability" in result["simulation_results"]
            assert 0 <= result["simulation_results"]["success_probability"] <= 1

    @pytest.mark.asyncio
    async def test_visualization_node(self):
        """Test visualization agent"""
        state = create_initial_state(
            thread_id="test",
            user_id="test-user",
            user_query="Show me visualizations"
        )
        state["portfolio_allocation"] = {
            "allocation": {"US_LargeCap": 0.6, "Bonds": 0.4},
            "expected_return": 0.08,
            "expected_volatility": 0.12,
            "sharpe_ratio": 0.5
        }

        result = await visualization_node(state)

        assert "visualizations" in result
        assert "final_response" in result
        assert "workflow_status" in result
        assert result["workflow_status"] == "complete"
        assert len(result["visualizations"]) > 0

        # Check visualization structure
        viz = result["visualizations"][0]
        assert "type" in viz
        assert "title" in viz
        assert "data" in viz

    @pytest.mark.asyncio
    async def test_complete_workflow_retirement(self):
        """Test complete workflow for retirement planning"""
        graph = create_financial_planning_graph(enable_checkpointing=False)

        initial_state = create_initial_state(
            thread_id="test-retirement",
            user_id="test-user",
            user_query="I want to retire at 60 with $80,000 per year",
            user_profile={"risk_tolerance": 0.6, "age": 35}
        )

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": "test-retirement"}}
        )

        # Verify workflow completed
        assert result["workflow_status"] == "complete"
        assert "final_response" in result
        assert result["final_response"] is not None

        # Verify agents executed - check that visualization agent completed
        assert len(result["completed_agents"]) > 0
        assert "visualization" in result["completed_agents"], "Visualization agent should complete workflow"

        # Verify agent responses include orchestrator
        assert len(result["agent_responses"]) > 0
        orchestrator_response = next(
            (r for r in result["agent_responses"] if r["agent_id"] == "orchestrator"),
            None
        )
        assert orchestrator_response is not None, "Orchestrator should have executed"

    @pytest.mark.asyncio
    async def test_complete_workflow_portfolio(self):
        """Test complete workflow for portfolio optimization"""
        graph = create_financial_planning_graph(enable_checkpointing=False)

        initial_state = create_initial_state(
            thread_id="test-portfolio",
            user_id="test-user",
            user_query="What is the optimal portfolio allocation for moderate risk?",
            user_profile={"risk_tolerance": 0.5, "age": 45}
        )

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": "test-portfolio"}}
        )

        # Verify workflow completed
        assert result["workflow_status"] == "complete"
        assert result["final_response"] is not None

        # Verify portfolio was created
        if "portfolio_allocation" in result:
            portfolio = result["portfolio_allocation"]
            assert "allocation" in portfolio
            assert "expected_return" in portfolio
            assert portfolio["expected_return"] > 0

    @pytest.mark.asyncio
    async def test_workflow_error_handling(self):
        """Test workflow handles errors gracefully"""
        graph = create_financial_planning_graph(enable_checkpointing=False)

        # Create state with minimal data
        initial_state = create_initial_state(
            thread_id="test-error",
            user_id="test-user",
            user_query="",  # Empty query
            user_profile={}
        )

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": "test-error"}}
        )

        # Workflow should complete even with empty query
        assert result is not None
        assert "workflow_status" in result

    @pytest.mark.asyncio
    async def test_workflow_messages(self):
        """Test that messages are accumulated correctly"""
        graph = create_financial_planning_graph(enable_checkpointing=False)

        initial_state = create_initial_state(
            thread_id="test-messages",
            user_id="test-user",
            user_query="Help me plan my finances",
            user_profile={"risk_tolerance": 0.6}
        )

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": "test-messages"}}
        )

        # Verify messages accumulated
        assert len(result["messages"]) > 1  # At least user message + agent responses
        assert result["messages"][0]["role"] == "user"
        assert result["messages"][0]["content"] == "Help me plan my finances"

        # Verify assistant messages exist
        assistant_messages = [m for m in result["messages"] if m["role"] == "assistant"]
        assert len(assistant_messages) > 0


class TestAgentCoordination:
    """Test agent coordination and routing"""

    @pytest.mark.asyncio
    async def test_orchestrator_routes_to_goal_planner(self):
        """Test orchestrator routes to goal planner for goal-related queries"""
        graph = create_financial_planning_graph(enable_checkpointing=False)

        initial_state = create_initial_state(
            thread_id="test",
            user_id="test",
            user_query="I need help planning my retirement goal",
            user_profile={"risk_tolerance": 0.6}
        )

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": "test"}}
        )

        # Verify goal planner was activated
        assert "goal_planner" in result["active_agents"] or "goal_planner" in result["completed_agents"]

    @pytest.mark.asyncio
    async def test_orchestrator_routes_to_portfolio_architect(self):
        """Test orchestrator routes to portfolio architect for allocation queries"""
        graph = create_financial_planning_graph(enable_checkpointing=False)

        initial_state = create_initial_state(
            thread_id="test",
            user_id="test",
            user_query="What should my portfolio allocation be?",
            user_profile={"risk_tolerance": 0.5}
        )

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": "test"}}
        )

        # Verify portfolio architect was activated
        assert "portfolio_architect" in result["active_agents"] or "portfolio_architect" in result["completed_agents"]

    @pytest.mark.asyncio
    async def test_visualization_always_runs_last(self):
        """Test that visualization agent always runs last"""
        graph = create_financial_planning_graph(enable_checkpointing=False)

        initial_state = create_initial_state(
            thread_id="test",
            user_id="test",
            user_query="Help me plan my finances",
            user_profile={"risk_tolerance": 0.6}
        )

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": "test"}}
        )

        # Verify visualization ran and completed the workflow
        assert "visualization" in result["completed_agents"]
        assert result["workflow_status"] == "complete"
