"""
Multi-Goal Asset Allocation Optimizer

Optimizes asset allocation across multiple goals with different time horizons and priorities.
Implements REQ-GOAL-008: Asset allocation across goals with account-level optimization.
"""

from typing import List, Dict, Optional, Tuple
import numpy as np
from scipy.optimize import minimize

from app.models.goal import Goal, GoalPriority


# Default capital market assumptions
DEFAULT_CAPITAL_MARKET_ASSUMPTIONS = {
    "us_stocks": {"expected_return": 0.10, "volatility": 0.18, "tax_efficiency": 0.85},
    "international_stocks": {"expected_return": 0.09, "volatility": 0.20, "tax_efficiency": 0.80},
    "bonds": {"expected_return": 0.04, "volatility": 0.06, "tax_efficiency": 0.60},
    "reits": {"expected_return": 0.07, "volatility": 0.15, "tax_efficiency": 0.50},
    "cash": {"expected_return": 0.02, "volatility": 0.01, "tax_efficiency": 0.70},
}


class MultiGoalOptimizer:
    """Optimizer for multi-goal portfolio allocation."""

    @classmethod
    def optimize_multi_goal_allocation(
        cls,
        goals: List[Goal],
        total_portfolio_value: float,
        accounts: List[Dict],
    ) -> Dict[str, any]:
        """
        Optimize asset allocation across multiple goals.

        Args:
            goals: List of active goals
            total_portfolio_value: Total portfolio value
            accounts: List of account dicts with balances and types

        Returns:
            Optimized allocation by goal and account
        """
        # Step 1: Calculate goal-level allocations based on priority and time horizon
        goal_allocations = cls._allocate_capital_to_goals(goals, total_portfolio_value)

        # Step 2: Determine optimal asset mix for each goal
        goal_portfolios = {}
        for goal in goals:
            allocated_amount = goal_allocations.get(goal.id, 0)
            if allocated_amount > 0:
                portfolio = cls._optimize_goal_portfolio(goal, allocated_amount)
                goal_portfolios[goal.id] = portfolio

        # Step 3: Account-level optimization (tax-aware placement)
        account_allocations = cls._optimize_account_placement(
            goal_portfolios,
            accounts,
        )

        # Step 4: Calculate aggregate portfolio stats
        aggregate_stats = cls._calculate_aggregate_stats(goal_portfolios, goal_allocations)

        return {
            "goal_allocations": goal_allocations,
            "goal_portfolios": goal_portfolios,
            "account_allocations": account_allocations,
            "aggregate_stats": aggregate_stats,
        }

    @classmethod
    def _allocate_capital_to_goals(
        cls,
        goals: List[Goal],
        total_portfolio_value: float,
    ) -> Dict[str, float]:
        """
        Allocate portfolio capital to goals based on priority and funding needs.

        Args:
            goals: List of goals
            total_portfolio_value: Total available capital

        Returns:
            Dict mapping goal_id to allocated amount
        """
        # Calculate funding needs
        goal_needs = {}
        total_need = 0

        for goal in goals:
            need = max(0, goal.target_amount - goal.current_amount)
            # Apply funding percentage
            need *= (goal.funding_percentage / 100.0)
            goal_needs[goal.id] = need
            total_need += need

        # If total need exceeds available capital, prioritize
        if total_need > total_portfolio_value:
            return cls._prioritized_allocation(goals, goal_needs, total_portfolio_value)

        # Otherwise, allocate according to needs
        allocations = {}
        for goal_id, need in goal_needs.items():
            allocations[goal_id] = need

        # Distribute surplus proportionally
        surplus = total_portfolio_value - total_need
        if surplus > 0 and total_need > 0:
            for goal_id, need in goal_needs.items():
                proportion = need / total_need
                allocations[goal_id] += surplus * proportion

        return allocations

    @classmethod
    def _prioritized_allocation(
        cls,
        goals: List[Goal],
        goal_needs: Dict[str, float],
        available_capital: float,
    ) -> Dict[str, float]:
        """
        Allocate capital when total need exceeds availability.

        Priority order: Essential > Important > Aspirational
        Within same priority: Earlier target date > Later target date
        """
        # Sort goals by priority and target date
        sorted_goals = sorted(
            goals,
            key=lambda g: (
                cls._priority_rank(g.priority),
                g.target_date,
            )
        )

        allocations = {}
        remaining_capital = available_capital

        for goal in sorted_goals:
            need = goal_needs.get(goal.id, 0)

            if remaining_capital >= need:
                # Fully fund this goal
                allocations[goal.id] = need
                remaining_capital -= need
            elif remaining_capital > 0:
                # Partial funding with remaining capital
                allocations[goal.id] = remaining_capital
                remaining_capital = 0
            else:
                # No capital left
                allocations[goal.id] = 0

        return allocations

    @classmethod
    def _priority_rank(cls, priority: GoalPriority) -> int:
        """Convert priority to numeric rank (lower = higher priority)."""
        ranks = {
            GoalPriority.ESSENTIAL: 1,
            GoalPriority.IMPORTANT: 2,
            GoalPriority.ASPIRATIONAL: 3,
        }
        return ranks.get(priority, 3)

    @classmethod
    def _optimize_goal_portfolio(
        cls,
        goal: Goal,
        allocated_amount: float,
    ) -> Dict:
        """
        Determine optimal asset allocation for a single goal.

        Args:
            goal: Goal object
            allocated_amount: Amount allocated to this goal

        Returns:
            Optimal portfolio allocation
        """
        from datetime import datetime

        # Calculate years to goal
        target_date = datetime.fromisoformat(goal.target_date)
        years_to_goal = max(0, (target_date - datetime.now()).days / 365.25)

        # Determine risk tolerance based on time horizon and priority
        risk_tolerance = cls._calculate_risk_tolerance(years_to_goal, goal.priority)

        # Get capital market assumptions
        cma = get_capital_market_assumptions()

        # Simple allocation based on risk tolerance (glide path)
        stocks_allocation = cls._calculate_stocks_allocation(years_to_goal, risk_tolerance)
        bonds_allocation = 1.0 - stocks_allocation

        # Allocate within stocks and bonds
        allocation = {
            "us_stocks": stocks_allocation * 0.60,  # 60% US stocks
            "international_stocks": stocks_allocation * 0.30,  # 30% international
            "emerging_markets": stocks_allocation * 0.10,  # 10% emerging
            "bonds": bonds_allocation * 0.70,  # 70% investment grade
            "tips": bonds_allocation * 0.20,  # 20% TIPS
            "cash": bonds_allocation * 0.10,  # 10% cash
        }

        # Calculate expected return and risk
        expected_return = cls._calculate_expected_return(allocation, cma)
        expected_risk = cls._calculate_expected_risk(allocation, cma)

        return {
            "goal_id": goal.id,
            "goal_title": goal.title,
            "allocated_amount": allocated_amount,
            "years_to_goal": years_to_goal,
            "risk_tolerance": risk_tolerance,
            "allocation": allocation,
            "expected_return": expected_return,
            "expected_risk": expected_risk,
            "sharpe_ratio": (expected_return - 0.04) / expected_risk if expected_risk > 0 else 0,
        }

    @classmethod
    def _calculate_risk_tolerance(
        cls,
        years_to_goal: float,
        priority: GoalPriority,
    ) -> float:
        """
        Calculate risk tolerance (0.0 - 1.0).

        Args:
            years_to_goal: Years until goal target date
            priority: Goal priority

        Returns:
            Risk tolerance score
        """
        # Time-based component (longer horizon = higher risk tolerance)
        if years_to_goal >= 30:
            time_component = 0.9
        elif years_to_goal >= 20:
            time_component = 0.8
        elif years_to_goal >= 15:
            time_component = 0.7
        elif years_to_goal >= 10:
            time_component = 0.6
        elif years_to_goal >= 5:
            time_component = 0.4
        elif years_to_goal >= 3:
            time_component = 0.3
        else:
            time_component = 0.2

        # Priority adjustment (essential goals = lower risk)
        priority_adjustment = {
            GoalPriority.ESSENTIAL: -0.1,
            GoalPriority.IMPORTANT: 0.0,
            GoalPriority.ASPIRATIONAL: 0.1,
        }.get(priority, 0.0)

        risk_tolerance = max(0.0, min(1.0, time_component + priority_adjustment))
        return risk_tolerance

    @classmethod
    def _calculate_stocks_allocation(cls, years_to_goal: float, risk_tolerance: float) -> float:
        """
        Calculate stocks allocation using age-based glide path.

        Args:
            years_to_goal: Years to goal
            risk_tolerance: Risk tolerance

        Returns:
            Stocks allocation (0.0 - 1.0)
        """
        # Base glide path: 100 - (years until goal * 2)
        base_stocks = max(0.1, min(0.9, 1.0 - (years_to_goal / 50)))

        # Adjust for risk tolerance
        adjusted_stocks = base_stocks * (0.7 + risk_tolerance * 0.6)

        return max(0.1, min(0.9, adjusted_stocks))

    @classmethod
    def _calculate_expected_return(cls, allocation: Dict, cma: Dict) -> float:
        """Calculate weighted expected return."""
        asset_returns = {
            "us_stocks": cma["us_stocks"]["expected_return"],
            "international_stocks": cma["international_stocks"]["expected_return"],
            "emerging_markets": cma["emerging_markets"]["expected_return"],
            "bonds": cma["bonds"]["expected_return"],
            "tips": cma["tips"]["expected_return"],
            "cash": cma["cash"]["expected_return"],
        }

        expected_return = sum(
            allocation.get(asset, 0) * asset_returns.get(asset, 0)
            for asset in allocation.keys()
        )

        return expected_return

    @classmethod
    def _calculate_expected_risk(cls, allocation: Dict, cma: Dict) -> float:
        """Calculate portfolio standard deviation (simplified)."""
        asset_volatilities = {
            "us_stocks": cma["us_stocks"]["volatility"],
            "international_stocks": cma["international_stocks"]["volatility"],
            "emerging_markets": cma["emerging_markets"]["volatility"],
            "bonds": cma["bonds"]["volatility"],
            "tips": cma["tips"]["volatility"],
            "cash": cma["cash"]["volatility"],
        }

        # Simplified: weighted average volatility (ignores correlations)
        # For more accuracy, should use correlation matrix
        expected_risk = sum(
            allocation.get(asset, 0) * asset_volatilities.get(asset, 0)
            for asset in allocation.keys()
        )

        return expected_risk

    @classmethod
    def _optimize_account_placement(
        cls,
        goal_portfolios: Dict[str, Dict],
        accounts: List[Dict],
    ) -> Dict[str, Dict]:
        """
        Optimize tax-aware asset placement across account types.

        Tax-efficient placement rules:
        - Taxable accounts: Tax-efficient assets (stocks with low turnover, muni bonds)
        - Tax-deferred accounts: Tax-inefficient assets (bonds, REITs)
        - Tax-exempt (Roth): Highest expected return assets

        Args:
            goal_portfolios: Portfolios for each goal
            accounts: List of accounts with types and balances

        Returns:
            Account-level allocations
        """
        # Categorize accounts by type
        taxable_accounts = [a for a in accounts if a["type"] == "taxable"]
        tax_deferred_accounts = [a for a in accounts if a["type"] == "tax_deferred"]
        tax_exempt_accounts = [a for a in accounts if a["type"] == "tax_exempt"]

        # Asset tax efficiency rankings (1 = most efficient, 5 = least efficient)
        tax_efficiency = {
            "us_stocks": 2,
            "international_stocks": 3,
            "emerging_markets": 3,
            "bonds": 5,
            "tips": 4,
            "cash": 1,
        }

        # Aggregate all assets needed across goals
        total_assets_needed = {}
        for goal_id, portfolio in goal_portfolios.items():
            allocated = portfolio["allocated_amount"]
            for asset, weight in portfolio["allocation"].items():
                amount = allocated * weight
                total_assets_needed[asset] = total_assets_needed.get(asset, 0) + amount

        # Allocate assets to accounts based on tax efficiency
        account_allocations = {}

        # Step 1: Place tax-inefficient assets in tax-deferred accounts
        remaining_assets = total_assets_needed.copy()
        for account in tax_deferred_accounts:
            account_allocations[account["id"]] = {}
            available = account["balance"]

            # Sort assets by tax inefficiency (highest first)
            sorted_assets = sorted(
                remaining_assets.items(),
                key=lambda x: tax_efficiency.get(x[0], 3),
                reverse=True
            )

            for asset, amount in sorted_assets:
                if available <= 0:
                    break

                allocate = min(amount, available)
                account_allocations[account["id"]][asset] = allocate
                remaining_assets[asset] -= allocate
                available -= allocate

        # Step 2: Place highest-return assets in tax-exempt accounts
        for account in tax_exempt_accounts:
            account_allocations[account["id"]] = {}
            available = account["balance"]

            # Priority: stocks (highest expected return)
            for asset in ["emerging_markets", "international_stocks", "us_stocks"]:
                if asset in remaining_assets and available > 0:
                    allocate = min(remaining_assets[asset], available)
                    account_allocations[account["id"]][asset] = allocate
                    remaining_assets[asset] -= allocate
                    available -= allocate

        # Step 3: Place remaining assets in taxable accounts
        for account in taxable_accounts:
            account_allocations[account["id"]] = {}
            available = account["balance"]

            for asset, amount in remaining_assets.items():
                if amount > 0 and available > 0:
                    allocate = min(amount, available)
                    account_allocations[account["id"]][asset] = allocate
                    remaining_assets[asset] -= allocate
                    available -= allocate

        return account_allocations

    @classmethod
    def _calculate_aggregate_stats(
        cls,
        goal_portfolios: Dict[str, Dict],
        goal_allocations: Dict[str, float],
    ) -> Dict:
        """Calculate aggregate portfolio statistics."""
        total_value = sum(goal_allocations.values())

        if total_value == 0:
            return {
                "total_value": 0,
                "weighted_return": 0,
                "weighted_risk": 0,
                "aggregate_allocation": {},
            }

        # Weighted average return
        weighted_return = sum(
            (goal_allocations[goal_id] / total_value) * portfolio["expected_return"]
            for goal_id, portfolio in goal_portfolios.items()
            if goal_id in goal_allocations
        )

        # Weighted average risk
        weighted_risk = sum(
            (goal_allocations[goal_id] / total_value) * portfolio["expected_risk"]
            for goal_id, portfolio in goal_portfolios.items()
            if goal_id in goal_allocations
        )

        # Aggregate asset allocation
        aggregate_allocation = {}
        for goal_id, portfolio in goal_portfolios.items():
            if goal_id in goal_allocations:
                weight = goal_allocations[goal_id] / total_value
                for asset, alloc in portfolio["allocation"].items():
                    aggregate_allocation[asset] = aggregate_allocation.get(asset, 0) + (alloc * weight)

        return {
            "total_value": total_value,
            "weighted_return": weighted_return,
            "weighted_risk": weighted_risk,
            "sharpe_ratio": (weighted_return - 0.04) / weighted_risk if weighted_risk > 0 else 0,
            "aggregate_allocation": aggregate_allocation,
        }
