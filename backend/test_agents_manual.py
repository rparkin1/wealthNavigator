#!/usr/bin/env python3
"""
Manual test script for financial planning agents.
Tests the complete agent workflow without database dependencies.
"""

import asyncio
from app.agents import create_financial_planning_graph
from app.agents.state import create_initial_state


async def test_retirement_planning():
    """Test retirement planning workflow"""
    print("=" * 60)
    print("TEST 1: Retirement Planning Workflow")
    print("=" * 60)

    graph = create_financial_planning_graph(enable_checkpointing=False)

    initial_state = create_initial_state(
        thread_id='test-thread-retirement',
        user_id='test-user-001',
        user_query='I want to retire at 60 with $80,000 per year in income. I am currently 35 years old.',
        user_profile={
            'risk_tolerance': 0.6,
            'age': 35,
            'tax_rate': 0.24
        }
    )

    print(f"\nUser Query: {initial_state['user_query']}")
    print(f"User Profile: {initial_state['user_profile']}")
    print("\nExecuting agent workflow...")
    print("-" * 60)

    result = await graph.ainvoke(initial_state, config={'configurable': {'thread_id': 'test-thread-retirement'}})

    print("\n✅ Workflow completed successfully!")
    print(f"\nWorkflow Status: {result.get('workflow_status')}")
    print(f"Task Type: {result.get('task_type')}")
    print(f"Agents Activated: {result.get('active_agents')}")
    print(f"Agents Completed: {result.get('completed_agents')}")

    print("\n" + "=" * 60)
    print("AGENT RESPONSES")
    print("=" * 60)

    for i, agent_resp in enumerate(result.get('agent_responses', []), 1):
        print(f"\n{i}. {agent_resp['agent_name']} ({agent_resp['agent_id']})")
        print(f"   Response: {agent_resp['response'][:150]}...")
        if agent_resp.get('results'):
            print(f"   Results: {list(agent_resp['results'].keys())}")

    print("\n" + "=" * 60)
    print("ANALYSIS RESULTS")
    print("=" * 60)

    analysis = result.get('analysis_results', {})
    for analysis_type, data in analysis.items():
        print(f"\n{analysis_type.upper()}:")
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, (int, float)):
                    print(f"  - {key}: {value:.2f}" if isinstance(value, float) else f"  - {key}: {value}")
                elif isinstance(value, dict) and len(value) < 10:
                    print(f"  - {key}:")
                    for k, v in value.items():
                        print(f"      {k}: {v:.2%}" if isinstance(v, float) else f"      {k}: {v}")

    print("\n" + "=" * 60)
    print("VISUALIZATIONS")
    print("=" * 60)

    visualizations = result.get('visualizations', [])
    print(f"\nTotal visualizations: {len(visualizations)}")
    for viz in visualizations:
        print(f"\n  📊 {viz['type'].upper()}: {viz['title']}")
        if viz['type'] == 'pie_chart':
            print(f"     Data points: {len(viz['data'])}")
            for key, value in viz['data'].items():
                if isinstance(value, float):
                    print(f"       - {key}: {value:.1%}")
                else:
                    print(f"       - {key}: {value}")

    print("\n" + "=" * 60)
    print("FINAL RESPONSE")
    print("=" * 60)

    final_response = result.get('final_response', '')
    print(f"\n{final_response[:500]}...")

    print("\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)

    for i, rec in enumerate(result.get('recommendations', []), 1):
        print(f"{i}. {rec}")

    return result


async def test_portfolio_optimization():
    """Test portfolio optimization workflow"""
    print("\n\n" + "=" * 60)
    print("TEST 2: Portfolio Optimization Workflow")
    print("=" * 60)

    graph = create_financial_planning_graph(enable_checkpointing=False)

    initial_state = create_initial_state(
        thread_id='test-thread-portfolio',
        user_id='test-user-002',
        user_query='What is the optimal portfolio allocation for moderate risk tolerance?',
        user_profile={
            'risk_tolerance': 0.5,
            'age': 45,
            'tax_rate': 0.28
        }
    )

    print(f"\nUser Query: {initial_state['user_query']}")
    print("\nExecuting agent workflow...")

    result = await graph.ainvoke(initial_state, config={'configurable': {'thread_id': 'test-thread-portfolio'}})

    print(f"\n✅ Workflow Status: {result.get('workflow_status')}")
    print(f"Agents Completed: {result.get('completed_agents')}")

    # Show portfolio allocation if available
    if result.get('portfolio_allocation'):
        portfolio = result['portfolio_allocation']
        print("\n📊 PORTFOLIO ALLOCATION:")
        for asset, weight in portfolio['allocation'].items():
            print(f"   {asset}: {weight:.1%}")
        print(f"\n   Expected Return: {portfolio['expected_return']:.2%}")
        print(f"   Expected Volatility: {portfolio['expected_volatility']:.2%}")
        print(f"   Sharpe Ratio: {portfolio['sharpe_ratio']:.2f}")

    return result


async def main():
    """Run all tests"""
    print("\n🤖 FINANCIAL PLANNING AGENTS - MANUAL TEST SUITE")
    print("=" * 60)
    print("Testing LangGraph multi-agent system with Claude Sonnet 4.5")
    print("=" * 60)

    try:
        # Test 1: Retirement Planning
        result1 = await test_retirement_planning()

        # Test 2: Portfolio Optimization
        result2 = await test_portfolio_optimization()

        print("\n\n" + "=" * 60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nSummary:")
        print(f"  - Test 1 (Retirement): {len(result1.get('agent_responses', []))} agents activated")
        print(f"  - Test 2 (Portfolio): {len(result2.get('agent_responses', []))} agents activated")
        print(f"  - Total visualizations: {len(result1.get('visualizations', [])) + len(result2.get('visualizations', []))}")

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
