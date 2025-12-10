"""
Test Advanced Portfolio Agent Integration

This script tests the complete integration of the advanced portfolio agent
with the LangGraph workflow.
"""

import asyncio
import sys
from app.agents import run_financial_planning_workflow


async def test_tax_loss_harvesting_query():
    """Test query for tax-loss harvesting"""
    print("\n" + "="*80)
    print("TEST 1: Tax-Loss Harvesting Query")
    print("="*80)

    query = "Analyze my portfolio for tax-loss harvesting opportunities"

    print(f"\nQuery: {query}")
    print("\nExpected routing: Orchestrator → Advanced Portfolio Agent → Visualization")
    print("\nExecuting workflow...\n")

    try:
        events = []
        async for event in run_financial_planning_workflow(
            user_query=query,
            thread_id="test-tlh-001",
            user_id="test-user-001",
            user_profile={
                "tax_rate": 0.24,
                "risk_tolerance": 0.6,
                "investment_horizon": 15
            },
            stream=True
        ):
            events.append(event)
            # Print agent execution
            for node_name, node_state in event.items():
                if node_name != "__end__":
                    print(f"✓ Agent '{node_name}' completed")
                    agent_responses = node_state.get("agent_responses", [])
                    if agent_responses:
                        for resp in agent_responses:
                            print(f"  Agent: {resp['agent_name']}")
                            if 'results' in resp:
                                results = resp['results']
                                if 'tax_loss_harvesting' in results:
                                    tlh = results['tax_loss_harvesting']
                                    print(f"  → Found {tlh['opportunities_count']} TLH opportunities")
                                    print(f"  → Total tax benefit: ${tlh['total_tax_benefit']:,.2f}")

        print("\n✅ Test 1 PASSED - Tax-loss harvesting workflow completed successfully")
        return True

    except Exception as e:
        print(f"\n❌ Test 1 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_rebalancing_query():
    """Test query for portfolio rebalancing"""
    print("\n" + "="*80)
    print("TEST 2: Portfolio Rebalancing Query")
    print("="*80)

    query = "Should I rebalance my portfolio? I think my allocation has drifted"

    print(f"\nQuery: {query}")
    print("\nExpected routing: Orchestrator → Portfolio Architect → Advanced Portfolio → Visualization")
    print("\nExecuting workflow...\n")

    try:
        events = []
        async for event in run_financial_planning_workflow(
            user_query=query,
            thread_id="test-rebal-001",
            user_id="test-user-001",
            user_profile={
                "tax_rate": 0.24,
                "risk_tolerance": 0.6
            },
            stream=True
        ):
            events.append(event)
            for node_name, node_state in event.items():
                if node_name != "__end__":
                    print(f"✓ Agent '{node_name}' completed")
                    agent_responses = node_state.get("agent_responses", [])
                    if agent_responses:
                        for resp in agent_responses:
                            print(f"  Agent: {resp['agent_name']}")
                            if 'results' in resp:
                                results = resp['results']
                                if 'rebalancing' in results:
                                    rebal = results['rebalancing']
                                    print(f"  → Needs rebalancing: {rebal['needs_rebalancing']}")
                                    print(f"  → Max drift: {rebal['max_drift']:.1f}%")
                                    print(f"  → Trades required: {rebal['trades_count']}")

        print("\n✅ Test 2 PASSED - Rebalancing workflow completed successfully")
        return True

    except Exception as e:
        print(f"\n❌ Test 2 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_performance_query():
    """Test query for performance tracking"""
    print("\n" + "="*80)
    print("TEST 3: Performance Tracking Query")
    print("="*80)

    query = "How has my portfolio performed this year compared to benchmarks?"

    print(f"\nQuery: {query}")
    print("\nExpected routing: Orchestrator → Advanced Portfolio → Visualization")
    print("\nExecuting workflow...\n")

    try:
        events = []
        async for event in run_financial_planning_workflow(
            user_query=query,
            thread_id="test-perf-001",
            user_id="test-user-001",
            user_profile={
                "risk_tolerance": 0.6
            },
            stream=True
        ):
            events.append(event)
            for node_name, node_state in event.items():
                if node_name != "__end__":
                    print(f"✓ Agent '{node_name}' completed")
                    agent_responses = node_state.get("agent_responses", [])
                    if agent_responses:
                        for resp in agent_responses:
                            print(f"  Agent: {resp['agent_name']}")
                            if 'results' in resp:
                                results = resp['results']
                                if 'performance' in results:
                                    perf = results['performance']
                                    print(f"  → Portfolio value: ${perf['total_value']:,.2f}")
                                    print(f"  → YTD return: {perf['ytd_return']:.2f}%")
                                    print(f"  → Risk metrics tracked: {len(perf['risk_metrics'])}")

        print("\n✅ Test 3 PASSED - Performance tracking workflow completed successfully")
        return True

    except Exception as e:
        print(f"\n❌ Test 3 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_comprehensive_analysis():
    """Test comprehensive portfolio analysis"""
    print("\n" + "="*80)
    print("TEST 4: Comprehensive Portfolio Analysis")
    print("="*80)

    query = "Give me a complete analysis: performance, rebalancing needs, and tax optimization"

    print(f"\nQuery: {query}")
    print("\nExpected routing: Full multi-agent workflow")
    print("\nExecuting workflow...\n")

    try:
        events = []
        agent_count = 0
        async for event in run_financial_planning_workflow(
            user_query=query,
            thread_id="test-comp-001",
            user_id="test-user-001",
            user_profile={
                "tax_rate": 0.24,
                "risk_tolerance": 0.6
            },
            stream=True
        ):
            events.append(event)
            for node_name, node_state in event.items():
                if node_name != "__end__":
                    agent_count += 1
                    print(f"✓ Agent '{node_name}' completed")

        print(f"\n✅ Test 4 PASSED - Comprehensive analysis completed with {agent_count} agents")
        return True

    except Exception as e:
        print(f"\n❌ Test 4 FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all integration tests"""
    print("\n" + "="*80)
    print("ADVANCED PORTFOLIO AGENT INTEGRATION TESTS")
    print("="*80)
    print("\nTesting the integration of Advanced Portfolio Agent with LangGraph workflow")
    print("This includes: Tax-Loss Harvesting, Rebalancing, Performance Tracking\n")

    results = []

    # Run tests
    results.append(await test_tax_loss_harvesting_query())
    results.append(await test_rebalancing_query())
    results.append(await test_performance_query())
    results.append(await test_comprehensive_analysis())

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    passed = sum(results)
    total = len(results)

    print(f"\nTests Passed: {passed}/{total}")

    if passed == total:
        print("\n🎉 All tests passed! Advanced Portfolio Agent is fully integrated.")
        return 0
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. See details above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
