"""
LangGraph Workflow for Financial Planning

Creates a stateful graph with conditional routing between specialist agents.
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import FinancialPlanningState
from .nodes import (
    orchestrator_node,
    goal_planner_node,
    portfolio_architect_node,
    monte_carlo_simulator_node,
    visualization_node,
)
from .advanced_portfolio_agent import advanced_portfolio_agent_node


def route_after_orchestrator(state: FinancialPlanningState) -> str:
    """
    Conditional edge - determines which agent runs after orchestrator.

    Based on the task_type and required_agents identified by the orchestrator.
    """
    next_agent = state.get("next_agent")

    # Map agent names to node names
    agent_routing = {
        "goal_planner": "goal_planner",
        "portfolio_architect": "portfolio_architect",
        "monte_carlo_simulator": "monte_carlo",
        "advanced_portfolio": "advanced_portfolio",
        "visualization": "visualization",
    }

    return agent_routing.get(next_agent, "visualization")


def route_after_goal_planner(state: FinancialPlanningState) -> str:
    """
    Conditional edge after goal planner.

    Typically proceeds to portfolio architect if portfolio optimization is needed.
    """
    active_agents = state.get("active_agents", [])
    completed = state.get("completed_agents", [])

    # Check which agents still need to run
    remaining = [a for a in active_agents if a not in completed]

    if "portfolio_architect" in remaining:
        return "portfolio_architect"
    elif "monte_carlo_simulator" in remaining:
        return "monte_carlo"
    else:
        return "visualization"


def route_after_portfolio(state: FinancialPlanningState) -> str:
    """
    Conditional edge after portfolio architect.

    Usually proceeds to Monte Carlo simulation if requested.
    """
    active_agents = state.get("active_agents", [])
    completed = state.get("completed_agents", [])

    remaining = [a for a in active_agents if a not in completed]

    if "advanced_portfolio" in remaining:
        return "advanced_portfolio"
    elif "monte_carlo_simulator" in remaining:
        return "monte_carlo"
    else:
        return "visualization"


def route_after_monte_carlo(state: FinancialPlanningState) -> str:
    """
    Conditional edge after Monte Carlo simulation.

    Proceeds to visualization for final output.
    """
    return "visualization"


def route_after_visualization(state: FinancialPlanningState) -> str:
    """
    Conditional edge after visualization.

    Workflow is complete.
    """
    return END


def create_financial_planning_graph(
    enable_checkpointing: bool = True
) -> StateGraph:
    """
    Create the LangGraph financial planning workflow.

    The graph structure:

    START → Orchestrator → (conditional routing)
                ↓
           Goal Planner → Portfolio Architect → Monte Carlo → Visualization → END
                          (conditional routing at each step)

    Args:
        enable_checkpointing: If True, enables state persistence for multi-turn conversations

    Returns:
        Compiled LangGraph workflow
    """
    # Create the graph
    workflow = StateGraph(FinancialPlanningState)

    # Add nodes (agents)
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("goal_planner", goal_planner_node)
    workflow.add_node("portfolio_architect", portfolio_architect_node)
    workflow.add_node("advanced_portfolio", advanced_portfolio_agent_node)
    workflow.add_node("monte_carlo", monte_carlo_simulator_node)
    workflow.add_node("visualization", visualization_node)

    # Set entry point
    workflow.set_entry_point("orchestrator")

    # Add conditional edges
    workflow.add_conditional_edges(
        "orchestrator",
        route_after_orchestrator,
        {
            "goal_planner": "goal_planner",
            "portfolio_architect": "portfolio_architect",
            "advanced_portfolio": "advanced_portfolio",
            "monte_carlo": "monte_carlo",
            "visualization": "visualization",
        }
    )

    workflow.add_conditional_edges(
        "goal_planner",
        route_after_goal_planner,
        {
            "portfolio_architect": "portfolio_architect",
            "monte_carlo": "monte_carlo",
            "visualization": "visualization",
        }
    )

    workflow.add_conditional_edges(
        "portfolio_architect",
        route_after_portfolio,
        {
            "advanced_portfolio": "advanced_portfolio",
            "monte_carlo": "monte_carlo",
            "visualization": "visualization",
        }
    )

    # Add routing after advanced portfolio agent
    workflow.add_conditional_edges(
        "advanced_portfolio",
        route_after_monte_carlo,  # Reuse same logic - goes to visualization
        {
            "visualization": "visualization",
        }
    )

    workflow.add_conditional_edges(
        "monte_carlo",
        route_after_monte_carlo,
        {
            "visualization": "visualization",
        }
    )

    workflow.add_conditional_edges(
        "visualization",
        route_after_visualization,
        {
            END: END,
        }
    )

    # Compile with optional checkpointing
    if enable_checkpointing:
        # Use in-memory checkpointer for development
        # In production, use PostgresSaver for persistence
        checkpointer = MemorySaver()
        graph = workflow.compile(checkpointer=checkpointer)
    else:
        graph = workflow.compile()

    return graph


async def run_financial_planning_workflow(
    user_query: str,
    thread_id: str,
    user_id: str,
    user_profile: dict = None,
    stream: bool = True
):
    """
    Execute the financial planning workflow.

    Args:
        user_query: User's question or request
        thread_id: Conversation thread ID
        user_id: User ID
        user_profile: Optional user profile data
        stream: If True, yields events as they occur

    Yields:
        State updates as agents execute (if stream=True)

    Returns:
        Final state after workflow completes
    """
    from .state import create_initial_state

    # Create initial state
    initial_state = create_initial_state(
        thread_id=thread_id,
        user_id=user_id,
        user_query=user_query,
        user_profile=user_profile
    )

    # Create graph
    graph = create_financial_planning_graph()

    # Execute workflow
    config = {"configurable": {"thread_id": thread_id}}

    if stream:
        # Stream events as they occur
        async for event in graph.astream(initial_state, config=config):
            yield event
    else:
        # Execute without streaming
        final_state = await graph.ainvoke(initial_state, config=config)
        yield final_state
