"""
Advanced Portfolio Management Agent
Handles tax-loss harvesting, rebalancing, and performance tracking
"""

from typing import Dict, List, Optional
from langchain_anthropic import ChatAnthropic
from app.agents.state import FinancialPlanningState
from app.tools.tax_loss_harvester import (
    identify_tax_loss_harvesting_opportunities,
    Holding,
    Transaction,
    SecurityType
)
from app.tools.rebalancer import (
    generate_rebalancing_strategy,
    AccountType as RebalancingAccountType
)
from app.tools.performance_tracker import (
    generate_performance_report
)
import json
import numpy as np


# Initialize Claude model
llm = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    temperature=0.7,
    max_tokens=4000
)


async def advanced_portfolio_agent_node(state: FinancialPlanningState) -> Dict:
    """
    Advanced Portfolio Management Agent

    Capabilities:
    1. Tax-loss harvesting analysis and recommendations
    2. Portfolio rebalancing with tax optimization
    3. Historical performance tracking and attribution
    4. Risk analysis and metrics
    5. Cost-benefit analysis of strategies

    Args:
        state: Current workflow state

    Returns:
        Updated state with advanced portfolio recommendations
    """
    print(f"🔬 Advanced Portfolio Agent starting analysis...")

    user_query = state.get("user_query", "")
    user_profile = state.get("user_profile", {})
    portfolio_allocation = state.get("portfolio_allocation")
    current_portfolio = state.get("current_portfolio", {})

    # Extract parameters
    tax_rate = user_profile.get("tax_rate", 0.24)
    risk_tolerance = user_profile.get("risk_tolerance", 0.5)

    # Determine what analysis is needed
    analysis_types = []

    query_lower = user_query.lower()

    if any(word in query_lower for word in ["tax loss", "harvest", "tlh", "tax efficient"]):
        analysis_types.append("tax_loss_harvesting")

    if any(word in query_lower for word in ["rebalance", "drift", "allocation", "adjust"]):
        analysis_types.append("rebalancing")

    if any(word in query_lower for word in ["performance", "return", "track", "benchmark", "how am i doing"]):
        analysis_types.append("performance")

    # Default to all if no specific request
    if not analysis_types:
        analysis_types = ["performance", "rebalancing"]

    # Prepare system prompt
    system_prompt = """You are an Advanced Portfolio Management Specialist with expertise in:
- Tax-loss harvesting and wash sale rules
- Portfolio rebalancing strategies
- Performance attribution analysis
- Risk management

Your role is to:
1. Analyze portfolio holdings and historical performance
2. Identify tax optimization opportunities
3. Recommend rebalancing strategies
4. Explain complex concepts clearly

Always provide:
- Specific, actionable recommendations
- Tax impact estimates
- Risk/benefit analysis
- Timeline for execution
"""

    # Create user prompt
    user_prompt = f"""User Query: {user_query}

Portfolio Context:
- Risk Tolerance: {risk_tolerance}
- Tax Rate: {tax_rate:.1%}
- Current Allocation: {portfolio_allocation if portfolio_allocation else 'Not yet optimized'}

Requested Analysis Types: {', '.join(analysis_types)}

Please analyze and provide recommendations."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    # Results dictionary
    analysis_results = {}

    try:
        # --- TAX-LOSS HARVESTING ANALYSIS ---
        if "tax_loss_harvesting" in analysis_types:
            print("  📊 Analyzing tax-loss harvesting opportunities...")

            # Create sample holdings for demonstration
            # In production, this would come from actual portfolio data
            sample_holdings = [
                Holding(
                    ticker="SPY",
                    name="SPDR S&P 500 ETF",
                    security_type=SecurityType.ETF,
                    cost_basis=45000,
                    current_value=42000,
                    shares=100,
                    purchase_date="2024-01-15",
                    asset_class="US_LargeCap",
                    expense_ratio=0.0095
                ),
                Holding(
                    ticker="VTI",
                    name="Vanguard Total Stock Market",
                    security_type=SecurityType.ETF,
                    cost_basis=30000,
                    current_value=32000,
                    shares=150,
                    purchase_date="2023-06-01",
                    asset_class="US_LargeCap",
                    expense_ratio=0.0003
                ),
                Holding(
                    ticker="QQQ",
                    name="Invesco QQQ Trust",
                    security_type=SecurityType.ETF,
                    cost_basis=25000,
                    current_value=23500,
                    shares=75,
                    purchase_date="2024-03-10",
                    asset_class="US_Technology",
                    expense_ratio=0.0020
                ),
            ]

            # Recent transactions (for wash sale detection)
            recent_transactions = [
                Transaction(
                    ticker="SPY",
                    date="2024-09-15",
                    transaction_type="buy",
                    shares=10,
                    price=450.0
                )
            ]

            tlh_strategy = await identify_tax_loss_harvesting_opportunities(
                holdings=sample_holdings,
                recent_transactions=recent_transactions,
                tax_rate=tax_rate,
                min_loss_threshold=100.0
            )

            analysis_results["tax_loss_harvesting"] = {
                "total_harvestable_losses": tlh_strategy.total_harvestable_losses,
                "total_tax_benefit": tlh_strategy.total_tax_benefit,
                "opportunities_count": len(tlh_strategy.opportunities),
                "opportunities": [
                    {
                        "security": opp.holding.ticker,
                        "loss": opp.unrealized_loss,
                        "tax_benefit": opp.tax_benefit,
                        "wash_sale_risk": opp.wash_sale_risk,
                        "priority": opp.priority_score,
                        "recommendation": opp.recommendation,
                        "replacements": [
                            {"ticker": r.ticker, "name": r.name, "similarity": r.similarity_score}
                            for r in opp.replacement_securities[:2]
                        ]
                    }
                    for opp in tlh_strategy.opportunities[:5]  # Top 5
                ],
                "strategy_notes": tlh_strategy.strategy_notes
            }

        # --- REBALANCING ANALYSIS ---
        if "rebalancing" in analysis_types and portfolio_allocation:
            print("  ⚖️ Analyzing portfolio rebalancing needs...")

            # Get target allocation from portfolio_allocation
            target_allocation = portfolio_allocation.get("allocation", {})

            # Create sample current holdings
            # In production, this would come from actual portfolio
            total_value = 150000
            current_holdings = {
                "US_LargeCap": total_value * 0.52,  # 7% overweight
                "US_SmallCap": total_value * 0.10,  # 5% underweight
                "International": total_value * 0.20,  # 5% underweight
                "Bonds": total_value * 0.18,  # 3% overweight
            }

            # Account breakdown
            account_breakdown = {
                RebalancingAccountType.TAXABLE: {
                    "US_LargeCap": 50000,
                    "US_SmallCap": 10000,
                },
                RebalancingAccountType.TAX_DEFERRED: {
                    "International": 20000,
                    "Bonds": 20000,
                },
                RebalancingAccountType.TAX_EXEMPT: {
                    "US_LargeCap": 28000,
                    "International": 10000,
                    "Bonds": 7000,
                }
            }

            rebalancing_strategy = await generate_rebalancing_strategy(
                target_allocation=target_allocation,
                current_holdings=current_holdings,
                account_breakdown=account_breakdown,
                drift_threshold=5.0,
                tax_rate=tax_rate
            )

            analysis_results["rebalancing"] = {
                "needs_rebalancing": rebalancing_strategy.needs_rebalancing,
                "max_drift": rebalancing_strategy.max_drift_percentage,
                "estimated_tax_cost": rebalancing_strategy.estimated_total_tax_cost,
                "trades_count": len(rebalancing_strategy.trades),
                "trades": [
                    {
                        "account": t.account_type.value,
                        "asset": t.asset_class,
                        "action": t.action,
                        "amount": t.amount,
                        "tax_impact": t.estimated_tax_impact,
                        "priority": t.priority
                    }
                    for t in rebalancing_strategy.trades[:10]  # Top 10
                ],
                "drift_analysis": rebalancing_strategy.drift_analysis,
                "execution_notes": rebalancing_strategy.execution_notes,
                "alternative_strategy": rebalancing_strategy.alternative_strategy
            }

        # --- PERFORMANCE TRACKING ---
        if "performance" in analysis_types:
            print("  📈 Calculating performance metrics...")

            # Generate sample historical data
            # In production, this would come from actual portfolio history
            dates = [f"2024-{month:02d}-01" for month in range(1, 13)]
            base_value = 100000

            # Simulate portfolio growth with some volatility
            np.random.seed(42)
            returns = np.random.normal(0.08 / 12, 0.15 / np.sqrt(12), len(dates))
            cumulative = np.cumprod(1 + returns)
            values = {date: base_value * cum for date, cum in zip(dates, cumulative)}

            # Asset class returns (simplified)
            asset_class_returns = {
                "US_LargeCap": {date: ret * 1.1 for date, ret in zip(dates, returns)},
                "Bonds": {date: ret * 0.4 for date, ret in zip(dates, returns)},
            }

            # Current weights
            asset_weights = target_allocation if portfolio_allocation else {
                "US_LargeCap": 0.6,
                "Bonds": 0.4
            }

            performance_report = await generate_performance_report(
                portfolio_id=state.get("thread_id", "default"),
                historical_values=values,
                asset_class_returns=asset_class_returns,
                asset_weights=asset_weights
            )

            analysis_results["performance"] = {
                "total_value": performance_report.total_value,
                "ytd_return": performance_report.total_return_ytd,
                "inception_return": performance_report.total_return_since_inception,
                "metrics": [
                    {
                        "period": m.period.value,
                        "return": m.total_return,
                        "volatility": m.volatility,
                        "sharpe": m.sharpe_ratio,
                        "max_drawdown": m.max_drawdown
                    }
                    for m in performance_report.metrics_by_period
                ],
                "risk_metrics": performance_report.risk_metrics,
                "attribution": [
                    {
                        "asset": a.asset_class,
                        "contribution": a.contribution_to_return,
                        "weight": a.weight,
                        "return": a.asset_return
                    }
                    for a in performance_report.attribution
                ]
            }

        # --- GENERATE AI RESPONSE ---
        print("  🤖 Generating comprehensive response...")

        # Create detailed prompt with analysis results
        analysis_prompt = f"""Based on the following analysis results, provide clear recommendations:

Analysis Results:
{json.dumps(analysis_results, indent=2)}

User Profile:
- Risk Tolerance: {risk_tolerance}
- Tax Rate: {tax_rate:.1%}

Please provide:
1. Executive summary of findings
2. Top 3 priority actions
3. Expected benefits (quantified)
4. Timeline for implementation
5. Risks and considerations

Format your response clearly with sections and bullet points."""

        response = await llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": analysis_prompt}
        ])

        # Create agent response
        agent_response = {
            "agent_id": "advanced_portfolio",
            "agent_name": "Advanced Portfolio Manager",
            "response": response.content,
            "results": analysis_results,
            "timestamp": state.get("workflow_start_time", "")
        }

        print(f"✅ Advanced Portfolio Agent completed analysis")

        return {
            "agent_responses": [agent_response],
            "completed_agents": ["advanced_portfolio"],
            "analysis_results": {
                "advanced_portfolio": analysis_results
            },
            "next_agent": "visualization"  # Route to visualization
        }

    except Exception as e:
        print(f"❌ Advanced Portfolio Agent error: {str(e)}")
        import traceback
        traceback.print_exc()

        error_response = {
            "agent_id": "advanced_portfolio",
            "agent_name": "Advanced Portfolio Manager",
            "response": f"I encountered an error while analyzing your portfolio: {str(e)}. "
                       f"Please try again or contact support if the issue persists.",
            "error": str(e),
            "timestamp": state.get("workflow_start_time", "")
        }

        return {
            "agent_responses": [error_response],
            "completed_agents": ["advanced_portfolio"],
            "error": f"Advanced Portfolio Agent error: {str(e)}",
            "next_agent": "visualization"
        }
