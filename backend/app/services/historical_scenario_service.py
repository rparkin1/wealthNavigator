"""
Historical Scenario Service

Provides access to pre-defined historical market scenarios for stress testing
and what-if analysis. Allows replaying historical periods on user portfolios.
"""

from typing import Dict, Any, List, Optional
import numpy as np
from sqlalchemy import select
from app.models.historical_scenario import HistoricalScenario, DEFAULT_HISTORICAL_SCENARIOS
from app.models.goal import Goal


class HistoricalScenarioService:
    """Service for managing and applying historical market scenarios"""

    def __init__(self, db_session):
        self.db = db_session

    async def get_all_scenarios(
        self,
        featured_only: bool = False,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all available historical scenarios.

        Args:
            featured_only: Only return featured scenarios
            active_only: Only return active scenarios

        Returns:
            List of scenario metadata (without full return data)
        """
        stmt = select(HistoricalScenario)

        if active_only:
            stmt = stmt.where(HistoricalScenario.is_active.is_(True))

        if featured_only:
            stmt = stmt.where(HistoricalScenario.is_featured.is_(True))

        stmt = stmt.order_by(HistoricalScenario.start_date.desc())

        result = await self.db.execute(stmt)
        scenarios = result.scalars().all()

        return [
            {
                "id": s.id,
                "name": s.name,
                "period": s.period,
                "description": s.description,
                "start_date": s.start_date,
                "end_date": s.end_date,
                "duration_months": s.duration_months,
                "max_drawdown_stocks": s.max_drawdown_stocks,
                "volatility_stocks": s.volatility_stocks,
                "recovery_months": s.recovery_months,
                "is_featured": s.is_featured,
                "usage_count": s.usage_count,
            }
            for s in scenarios
        ]

    async def get_scenario_by_id(self, scenario_id: str) -> Optional[HistoricalScenario]:
        """
        Get full scenario data including return sequences.

        Args:
            scenario_id: Scenario identifier

        Returns:
            Full scenario object with return data
        """
        stmt = select(HistoricalScenario).where(HistoricalScenario.id == scenario_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def apply_scenario_to_goal(
        self,
        goal: Goal,
        scenario_id: str,
        initial_portfolio_value: float,
        monthly_contribution: float = 0,
    ) -> Dict[str, Any]:
        """
        Apply a historical scenario to a goal and calculate outcomes.

        Args:
            goal: Goal to stress test
            scenario_id: Historical scenario to apply
            initial_portfolio_value: Starting portfolio value
            monthly_contribution: Monthly contributions during period

        Returns:
            Scenario results including portfolio trajectory
        """
        scenario = await self.get_scenario_by_id(scenario_id)
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        # Extract return data
        returns_data = scenario.returns_data
        frequency = returns_data.get("frequency", "monthly")
        returns = returns_data.get("returns", [])

        # Get goal allocation (simplified - assume 60/40 stocks/bonds)
        stock_allocation = getattr(goal, "stock_allocation", 0.6)
        bond_allocation = 1.0 - stock_allocation

        # Calculate portfolio trajectory
        portfolio_values = [initial_portfolio_value]
        current_value = initial_portfolio_value

        for period_data in returns:
            stock_return = period_data.get("stocks", 0)
            bond_return = period_data.get("bonds", 0)

            # Calculate weighted portfolio return
            portfolio_return = (
                stock_allocation * stock_return + bond_allocation * bond_return
            )

            # Apply return and add contribution
            current_value = current_value * (1 + portfolio_return)

            if frequency == "monthly":
                current_value += monthly_contribution
            elif frequency == "annual" and returns.index(period_data) < len(returns) - 1:
                # Add annual contributions (12 months * monthly)
                current_value += monthly_contribution * 12

            portfolio_values.append(current_value)

        # Calculate metrics
        final_value = portfolio_values[-1]

        # Protect against division by zero
        if initial_portfolio_value > 0:
            total_return = (final_value - initial_portfolio_value) / initial_portfolio_value
        else:
            total_return = 0.0

        max_value = max(portfolio_values)
        min_value = min(portfolio_values)

        # Fixed: Drawdown should be (max - min) / max, not (min - max) / max
        if max_value > 0:
            drawdown = (max_value - min_value) / max_value
        else:
            drawdown = 0.0

        # Increment usage counter
        scenario.usage_count += 1
        await self.db.commit()

        return {
            "scenario_id": scenario_id,
            "scenario_name": scenario.name,
            "initial_value": initial_portfolio_value,
            "final_value": final_value,
            "total_return": total_return,
            "max_drawdown": drawdown,
            "max_value": max_value,
            "min_value": min_value,
            "portfolio_trajectory": [
                {
                    "period": returns[i]["period"] if i < len(returns) else "final",
                    "value": val,
                }
                for i, val in enumerate(portfolio_values)
            ],
            "key_events": scenario.key_events,
            "duration_months": scenario.duration_months,
        }

    async def compare_scenarios(
        self,
        goal: Goal,
        scenario_ids: List[str],
        initial_portfolio_value: float,
        monthly_contribution: float = 0,
    ) -> Dict[str, Any]:
        """
        Compare multiple historical scenarios side-by-side.

        Args:
            goal: Goal to stress test
            scenario_ids: List of scenario IDs to compare
            initial_portfolio_value: Starting portfolio value
            monthly_contribution: Monthly contributions

        Returns:
            Comparison results for all scenarios
        """
        results = []

        for scenario_id in scenario_ids:
            try:
                result = await self.apply_scenario_to_goal(
                    goal=goal,
                    scenario_id=scenario_id,
                    initial_portfolio_value=initial_portfolio_value,
                    monthly_contribution=monthly_contribution,
                )
                results.append(result)
            except Exception as e:
                results.append({
                    "scenario_id": scenario_id,
                    "error": str(e),
                })

        # Calculate comparative metrics
        best_return = max(r.get("total_return", -999) for r in results if "error" not in r)
        worst_return = min(r.get("total_return", 999) for r in results if "error" not in r)
        best_scenario = next(
            (r for r in results if r.get("total_return") == best_return), None
        )
        worst_scenario = next(
            (r for r in results if r.get("total_return") == worst_return), None
        )

        return {
            "scenarios": results,
            "comparison": {
                "best_scenario": best_scenario.get("scenario_name") if best_scenario else None,
                "worst_scenario": worst_scenario.get("scenario_name") if worst_scenario else None,
                "return_range": best_return - worst_return,
                "avg_return": np.mean([r.get("total_return", 0) for r in results if "error" not in r]),
            },
        }

    async def get_scenario_statistics(self, scenario_id: str) -> Dict[str, Any]:
        """
        Calculate detailed statistics for a scenario.

        Args:
            scenario_id: Scenario to analyze

        Returns:
            Statistical analysis of returns
        """
        scenario = await self.get_scenario_by_id(scenario_id)
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        returns_data = scenario.returns_data
        returns = returns_data.get("returns", [])

        # Extract stock and bond returns
        stock_returns = [r.get("stocks", 0) for r in returns]
        bond_returns = [r.get("bonds", 0) for r in returns]

        # Calculate statistics
        return {
            "scenario_id": scenario_id,
            "scenario_name": scenario.name,
            "statistics": {
                "stocks": {
                    "mean": np.mean(stock_returns),
                    "median": np.median(stock_returns),
                    "std_dev": np.std(stock_returns),
                    "min": np.min(stock_returns),
                    "max": np.max(stock_returns),
                    "cumulative_return": np.prod([1 + r for r in stock_returns]) - 1,
                },
                "bonds": {
                    "mean": np.mean(bond_returns),
                    "median": np.median(bond_returns),
                    "std_dev": np.std(bond_returns),
                    "min": np.min(bond_returns),
                    "max": np.max(bond_returns),
                    "cumulative_return": np.prod([1 + r for r in bond_returns]) - 1,
                },
                "correlation": np.corrcoef(stock_returns, bond_returns)[0, 1] if len(stock_returns) > 1 else 0,
            },
            "duration_months": scenario.duration_months,
            "max_drawdown_stocks": scenario.max_drawdown_stocks,
            "recovery_months": scenario.recovery_months,
        }

    async def initialize_default_scenarios(self) -> int:
        """
        Seed database with default historical scenarios.

        Returns:
            Number of scenarios created
        """
        created_count = 0

        for scenario_data in DEFAULT_HISTORICAL_SCENARIOS:
            # Check if scenario already exists
            result = await self.db.execute(
                select(HistoricalScenario).filter(
                    HistoricalScenario.id == scenario_data["id"]
                )
            )
            existing = result.scalar_one_or_none()

            if not existing:
                scenario = HistoricalScenario(**scenario_data)
                self.db.add(scenario)
                created_count += 1

        await self.db.commit()
        return created_count
