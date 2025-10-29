"""
LangGraph Agent Nodes

Each node is a specialized financial planning agent that operates on the state.
"""

from typing import Dict
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from datetime import datetime

from .state import FinancialPlanningState, AgentResponse, Message
from app.core.config import settings


# Initialize Claude model
llm = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    api_key=settings.ANTHROPIC_API_KEY,
    temperature=0.7,
    max_tokens=4096
)


async def orchestrator_node(state: FinancialPlanningState) -> Dict:
    """
    Orchestrator Agent - Routes tasks to appropriate specialist agents.

    Analyzes user query to determine:
    1. What type of financial planning task is needed
    2. Which specialist agents should be activated
    3. The order of agent execution

    Returns:
        Updated state with task_type and next_agent set
    """
    system_prompt = """You are the Financial Planning Orchestrator.

    Your role is to analyze the user's query and determine:
    1. Task type (goal_planning, portfolio_optimization, risk_assessment, tax_strategy, monte_carlo_simulation, comprehensive_plan)
    2. Which specialist agents are needed (goal_planner, portfolio_architect, risk_manager, tax_strategist, monte_carlo_simulator)
    3. The execution order

    Respond in JSON format:
    {
        "task_type": "<task_type>",
        "required_agents": ["agent1", "agent2"],
        "reasoning": "<explanation>",
        "user_intent": "<summary of what user wants>"
    }
    """

    # Build context from state
    context = f"""
User Query: {state['user_query']}

User Profile: {state.get('user_profile', {})}

Existing Goals: {len(state.get('goals', []))} goals defined

Current Portfolio: {'Yes' if state.get('current_portfolio') else 'No'}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=context)
    ]

    response = await llm.ainvoke(messages)

    # Parse response (simplified - would use structured output in production)
    import json
    try:
        orchestration = json.loads(response.content)
    except:
        # Fallback to default routing
        orchestration = {
            "task_type": "comprehensive_plan",
            "required_agents": ["goal_planner", "portfolio_architect", "monte_carlo_simulator"],
            "reasoning": "Comprehensive financial planning requested",
            "user_intent": state['user_query']
        }

    # Create agent response
    agent_response = AgentResponse(
        agent_id="orchestrator",
        agent_name="Financial Planning Orchestrator",
        response=orchestration.get("reasoning", ""),
        tool_calls=None,
        results=orchestration,
        metadata={"timestamp": datetime.utcnow().isoformat()}
    )

    # Determine next agent
    required_agents = orchestration.get("required_agents", [])
    next_agent = required_agents[0] if required_agents else "visualization"

    # Add sample visualizations for testing
    sample_visualizations = [
        {
            "type": "pie_chart",
            "title": "Sample Portfolio Allocation",
            "data": {
                "US Stocks": 40,
                "International Stocks": 20,
                "Bonds": 30,
                "Cash": 10
            },
            "config": {"showLegend": True, "showLabels": True}
        },
        {
            "type": "bar_chart",
            "title": "Goal Progress",
            "data": {
                "Retirement": 65,
                "Emergency Fund": 100,
                "House Down Payment": 45
            },
            "config": {"orientation": "horizontal"}
        }
    ]

    return {
        "task_type": orchestration["task_type"],
        "next_agent": next_agent,
        "active_agents": required_agents,
        "agent_responses": [agent_response],
        "completed_agents": ["orchestrator"],
        "visualizations": sample_visualizations,  # Add test visualizations
        "messages": [Message(
            role="assistant",
            content=f"Orchestrator: {orchestration.get('reasoning', '')}",
            agent_id="orchestrator",
            timestamp=datetime.utcnow().isoformat()
        )]
    }


async def goal_planner_node(state: FinancialPlanningState) -> Dict:
    """
    Goal Planner Agent - Analyzes and structures financial goals.

    Uses the goal_analyzer tool to calculate required savings,
    timeline analysis, and success probability.

    Returns:
        Updated state with goal analysis results
    """
    from app.tools import analyze_goal, calculate_required_savings

    system_prompt = """You are the Goal Planning Specialist.

    Your role is to:
    1. Help users define clear financial goals
    2. Calculate required monthly savings
    3. Assess goal feasibility
    4. Provide timeline recommendations

    Use the available tools to perform calculations and provide data-driven advice.
    """

    user_query = state['user_query']
    goals = state.get('goals', [])

    # For each active goal, perform analysis
    results = {}
    for goal in goals:
        if goal['id'] in state.get('active_goal_ids', []):
            # Use the goal analyzer tool
            from app.tools.goal_analyzer import Goal as GoalModel
            from datetime import date

            goal_obj = GoalModel(
                name=goal['name'],
                category=goal['category'],
                target_amount=goal['target_amount'],
                target_date=date.fromisoformat(goal['target_date']),
                current_funding=goal['current_funding'],
                priority=goal['priority']
            )

            analysis = await analyze_goal(goal_obj)
            results[goal['id']] = analysis.dict()

    # Generate narrative response
    context = f"User Query: {user_query}\n\nGoal Analysis Results: {results}"
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=context)
    ]

    response = await llm.ainvoke(messages)

    agent_response = AgentResponse(
        agent_id="goal_planner",
        agent_name="Goal Planning Specialist",
        response=response.content,
        tool_calls=["analyze_goal"],
        results=results,
        metadata={"timestamp": datetime.utcnow().isoformat()}
    )

    return {
        "agent_responses": [agent_response],
        "completed_agents": ["goal_planner"],
        "analysis_results": {"goal_analysis": results},
        "messages": [Message(
            role="assistant",
            content=f"Goal Planner: {response.content[:200]}...",
            agent_id="goal_planner",
            timestamp=datetime.utcnow().isoformat()
        )]
    }


async def portfolio_architect_node(state: FinancialPlanningState) -> Dict:
    """
    Portfolio Architect Agent - Designs optimal portfolio allocations.

    Uses Modern Portfolio Theory to optimize asset allocation based on
    goals, risk tolerance, and time horizon.

    Returns:
        Updated state with portfolio allocation
    """
    from app.tools import optimize_portfolio
    from app.tools.portfolio_optimizer import AssetClass, OptimizationParams

    system_prompt = """You are the Portfolio Architecture Specialist.

    Your role is to:
    1. Design optimal asset allocations using Modern Portfolio Theory
    2. Balance risk and return based on user profile
    3. Consider time horizon and goal priorities
    4. Recommend specific allocation percentages

    Use the portfolio optimization tools to generate data-driven recommendations.
    """

    # Get user profile
    user_profile = state.get('user_profile', {})
    risk_tolerance = user_profile.get('risk_tolerance', 0.5)

    # Define asset classes (simplified - would be configurable)
    asset_classes = [
        AssetClass(name="US_LargeCap", expected_return=0.10, volatility=0.18),
        AssetClass(name="US_SmallCap", expected_return=0.12, volatility=0.25),
        AssetClass(name="International", expected_return=0.09, volatility=0.20),
        AssetClass(name="Bonds", expected_return=0.04, volatility=0.06),
        AssetClass(name="REITs", expected_return=0.08, volatility=0.22),
    ]

    # Optimize portfolio
    params = OptimizationParams(
        asset_classes=asset_classes,
        risk_tolerance=risk_tolerance,
        time_horizon=15,  # Would come from goals
    )

    optimization_result = await optimize_portfolio(params)

    # Generate narrative
    context = f"""
User Query: {state['user_query']}
Risk Tolerance: {risk_tolerance}
Optimization Result: {optimization_result.dict()}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=context)
    ]

    response = await llm.ainvoke(messages)

    agent_response = AgentResponse(
        agent_id="portfolio_architect",
        agent_name="Portfolio Architecture Specialist",
        response=response.content,
        tool_calls=["optimize_portfolio"],
        results=optimization_result.dict(),
        metadata={"timestamp": datetime.utcnow().isoformat()}
    )

    return {
        "portfolio_allocation": {
            "allocation": optimization_result.allocation,
            "expected_return": optimization_result.expected_return,
            "expected_volatility": optimization_result.expected_volatility,
            "sharpe_ratio": optimization_result.sharpe_ratio
        },
        "agent_responses": [agent_response],
        "completed_agents": ["portfolio_architect"],
        "analysis_results": {"portfolio_optimization": optimization_result.dict()},
        "messages": [Message(
            role="assistant",
            content=f"Portfolio Architect: {response.content[:200]}...",
            agent_id="portfolio_architect",
            timestamp=datetime.utcnow().isoformat()
        )]
    }


async def monte_carlo_simulator_node(state: FinancialPlanningState) -> Dict:
    """
    Monte Carlo Simulator Agent - Runs probabilistic simulations.

    Simulates thousands of market scenarios to calculate success
    probability for achieving financial goals.

    Returns:
        Updated state with simulation results
    """
    from app.tools import run_simulation
    from app.tools.monte_carlo_engine import SimulationParams

    system_prompt = """You are the Monte Carlo Simulation Specialist.

    Your role is to:
    1. Run probabilistic simulations (5,000+ iterations)
    2. Calculate success probability for goals
    3. Analyze portfolio value distributions
    4. Identify risks and opportunities

    Use Monte Carlo simulation tools to provide statistical analysis.
    """

    # Get portfolio and goal data
    portfolio_alloc = state.get('portfolio_allocation')
    goals = state.get('goals', [])

    if not portfolio_alloc or not goals:
        # Can't simulate without data
        return {
            "completed_agents": ["monte_carlo_simulator"],
            "error": "Insufficient data for simulation"
        }

    # Run simulation for first active goal (simplified)
    active_goal = next((g for g in goals if g['id'] in state.get('active_goal_ids', [])), None)

    if active_goal:
        params = SimulationParams(
            initial_portfolio_value=active_goal.get('current_funding', 0),
            monthly_contribution=1000,  # Would be calculated from goal analysis
            time_horizon=15,
            expected_return=portfolio_alloc['expected_return'],
            volatility=portfolio_alloc['expected_volatility'],
            goal_amount=active_goal['target_amount'],
            iterations=5000
        )

        simulation_result = await run_simulation(params)

        # Generate narrative
        context = f"""
User Query: {state['user_query']}
Goal: {active_goal['name']}
Simulation Result: Success Probability = {simulation_result.success_probability:.1%}
"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=context)
        ]

        response = await llm.ainvoke(messages)

        agent_response = AgentResponse(
            agent_id="monte_carlo_simulator",
            agent_name="Monte Carlo Simulation Specialist",
            response=response.content,
            tool_calls=["run_simulation"],
            results={"success_probability": simulation_result.success_probability},
            metadata={"timestamp": datetime.utcnow().isoformat()}
        )

        return {
            "simulation_results": {
                "success_probability": simulation_result.success_probability,
                "median_final_value": simulation_result.statistics.median_final_value,
                "percentile_10": simulation_result.statistics.percentile_10,
                "percentile_90": simulation_result.statistics.percentile_90
            },
            "agent_responses": [agent_response],
            "completed_agents": ["monte_carlo_simulator"],
            "analysis_results": {"monte_carlo": simulation_result.dict()},
            "messages": [Message(
                role="assistant",
                content=f"Monte Carlo Simulator: {response.content[:200]}...",
                agent_id="monte_carlo_simulator",
                timestamp=datetime.utcnow().isoformat()
            )]
        }

    return {"completed_agents": ["monte_carlo_simulator"]}


async def visualization_node(state: FinancialPlanningState) -> Dict:
    """
    Visualization Agent - Creates chart specifications for frontend.

    Generates visualization configs based on analysis results.

    Returns:
        Updated state with visualization specifications
    """
    visualizations = []

    # Portfolio allocation pie chart
    if state.get('portfolio_allocation'):
        visualizations.append({
            "type": "pie_chart",
            "title": "Recommended Portfolio Allocation",
            "data": state['portfolio_allocation']['allocation'],
            "config": {"showLegend": True, "showLabels": True}
        })

    # Monte Carlo fan chart
    if state.get('simulation_results'):
        visualizations.append({
            "type": "fan_chart",
            "title": "Portfolio Value Projections",
            "data": {
                "median": state['simulation_results']['median_final_value'],
                "p10": state['simulation_results']['percentile_10'],
                "p90": state['simulation_results']['percentile_90']
            },
            "config": {"timeHorizon": 15}
        })

    # Generate final response
    system_prompt = """You are the Communication Specialist.

    Synthesize all agent analyses into a clear, actionable response for the user.
    Include:
    1. Summary of findings
    2. Key recommendations
    3. Next steps
    """

    all_results = state.get('analysis_results', {})
    context = f"""
User Query: {state['user_query']}
Analysis Results: {all_results}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=context)
    ]

    response = await llm.ainvoke(messages)

    return {
        "visualizations": visualizations,
        "final_response": response.content,
        "recommendations": ["Review portfolio allocation", "Set up automatic contributions"],
        "workflow_status": "complete",
        "completed_agents": ["visualization"],
        "messages": [Message(
            role="assistant",
            content=response.content,
            agent_id="visualization",
            timestamp=datetime.utcnow().isoformat()
        )]
    }
