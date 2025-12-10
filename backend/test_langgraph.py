"""
Quick test script for LangGraph financial planning workflow
"""

import asyncio
from app.agents import create_financial_planning_graph
from app.agents.state import create_initial_state


async def test_workflow():
    """Test the financial planning workflow"""

    # Create initial state
    state = create_initial_state(
        thread_id="test-thread-001",
        user_id="test-user-001",
        user_query="I want to retire at 60 with $80,000 per year income. I'm 35 now with $50,000 saved. Can I achieve this goal?",
        user_profile={
            "age": 35,
            "risk_tolerance": 0.6,
            "tax_rate": 0.24
        }
    )

    # Add a sample goal
    state["goals"] = [{
        "id": "goal-001",
        "name": "Retirement at 60",
        "category": "retirement",
        "target_amount": 2000000,  # $80k/year needs ~$2M at 4% withdrawal
        "target_date": "2050-01-01",
        "priority": "essential",
        "current_funding": 50000
    }]

    state["active_goal_ids"] = ["goal-001"]

    # Create graph
    print("🚀 Creating LangGraph workflow...")
    graph = create_financial_planning_graph(enable_checkpointing=False)

    print("📊 Executing financial planning workflow...")
    print("-" * 60)

    # Execute workflow with streaming
    config = {"configurable": {"thread_id": "test-thread-001"}}

    async for event in graph.astream(state, config=config):
        # Print each node execution
        for node_name, node_state in event.items():
            print(f"\n✅ {node_name.upper()} completed")

            if "agent_responses" in node_state:
                for resp in node_state["agent_responses"]:
                    print(f"   Agent: {resp['agent_name']}")
                    print(f"   Response: {resp['response'][:150]}...")

            if "final_response" in node_state and node_state["final_response"]:
                print(f"\n🎯 FINAL RESPONSE:")
                print(f"   {node_state['final_response'][:300]}...")

    print("\n" + "=" * 60)
    print("✨ Workflow complete!")


if __name__ == "__main__":
    asyncio.run(test_workflow())
