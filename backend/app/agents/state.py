"""
LangGraph State Schema for Financial Planning

Defines the state structure that flows through the agent graph.
"""

from typing import TypedDict, List, Dict, Optional, Annotated
from operator import add
from datetime import datetime


class Message(TypedDict):
    """Message in conversation"""
    role: str  # user, assistant, system
    content: str
    agent_id: Optional[str]
    timestamp: str


class AgentResponse(TypedDict):
    """Response from an agent"""
    agent_id: str
    agent_name: str
    response: str
    tool_calls: Optional[List[Dict]]
    results: Optional[Dict]
    metadata: Optional[Dict]


class Goal(TypedDict):
    """Financial goal structure"""
    id: str
    name: str
    category: str
    target_amount: float
    target_date: str
    priority: str
    current_funding: float


class PortfolioAllocation(TypedDict):
    """Portfolio allocation structure"""
    allocation: Dict[str, float]
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float


class SimulationResult(TypedDict):
    """Monte Carlo simulation result"""
    success_probability: float
    median_final_value: float
    percentile_10: float
    percentile_90: float


class FinancialPlanningState(TypedDict):
    """
    Main state object for LangGraph financial planning workflow.

    This state is passed between all agents and accumulates information
    as the workflow progresses.
    """
    # Conversation context
    thread_id: str
    user_id: str
    user_query: str
    messages: Annotated[List[Message], add]  # Append-only message history

    # User profile
    user_profile: Optional[Dict]  # risk_tolerance, age, tax_rate, etc.

    # Goals
    goals: List[Goal]
    active_goal_ids: List[str]  # Goals being analyzed in this conversation

    # Portfolio data
    current_portfolio: Optional[Dict]
    portfolio_allocation: Optional[PortfolioAllocation]

    # Simulation data
    simulation_results: Optional[SimulationResult]

    # Agent coordination
    agent_responses: Annotated[List[AgentResponse], add]  # Append-only agent responses
    active_agents: List[str]  # Agents currently working
    completed_agents: List[str]  # Agents that have finished

    # Task routing
    task_type: Optional[str]  # goal_planning, portfolio_optimization, simulation, etc.
    next_agent: Optional[str]  # Which agent should run next

    # Analysis results
    analysis_results: Dict  # Consolidated results from all agents
    visualizations: List[Dict]  # Visualization specifications

    # Final output
    final_response: Optional[str]  # Final consolidated response to user
    recommendations: List[str]  # Action items for user

    # Metadata
    workflow_start_time: str
    workflow_status: str  # in_progress, complete, error
    error: Optional[str]


class StreamEvent(TypedDict):
    """Event emitted during streaming"""
    event_type: str  # agent_started, agent_progress, agent_complete, result, error
    agent_id: Optional[str]
    agent_name: Optional[str]
    message: Optional[str]
    data: Optional[Dict]
    timestamp: str


def create_initial_state(
    thread_id: str,
    user_id: str,
    user_query: str,
    user_profile: Optional[Dict] = None
) -> FinancialPlanningState:
    """
    Create initial state for a new financial planning workflow.

    Args:
        thread_id: Conversation thread ID
        user_id: User ID
        user_query: User's question or request
        user_profile: Optional user profile data

    Returns:
        Initial FinancialPlanningState
    """
    return FinancialPlanningState(
        thread_id=thread_id,
        user_id=user_id,
        user_query=user_query,
        messages=[
            Message(
                role="user",
                content=user_query,
                agent_id=None,
                timestamp=datetime.utcnow().isoformat()
            )
        ],
        user_profile=user_profile or {},
        goals=[],
        active_goal_ids=[],
        current_portfolio=None,
        portfolio_allocation=None,
        simulation_results=None,
        agent_responses=[],
        active_agents=[],
        completed_agents=[],
        task_type=None,
        next_agent="orchestrator",  # Always start with orchestrator
        analysis_results={},
        visualizations=[],
        final_response=None,
        recommendations=[],
        workflow_start_time=datetime.utcnow().isoformat(),
        workflow_status="in_progress",
        error=None
    )
