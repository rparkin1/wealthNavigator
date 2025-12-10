"""
Multi-Level Portfolio Optimization Service
Implements Goal-level, Account-level, and Household-level optimization

REQ-PORT-003: Multi-level optimization (Goal, Account, Household)
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy.optimize import minimize
from pydantic import BaseModel

from app.services.portfolio.asset_class_library import (
    AssetClass,
    ASSET_CLASS_LIBRARY,
    get_default_correlation_matrix,
    AssetClassCategory
)


class OptimizationLevel(str):
    """Optimization levels"""
    GOAL = "goal"
    ACCOUNT = "account"
    HOUSEHOLD = "household"


class Account(BaseModel):
    """Account for multi-level optimization"""
    id: str
    name: str
    type: str  # taxable, tax_deferred, tax_exempt
    balance: float
    goal_allocations: Dict[str, float] = {}  # {goal_id: allocated_amount}
    current_holdings: Dict[str, float] = {}  # {asset_code: current_value}
    constraints: Dict[str, float] = {}  # Custom constraints


class Goal(BaseModel):
    """Goal for multi-level optimization"""
    id: str
    name: str
    target_amount: float
    current_amount: float
    years_to_goal: float
    priority: str  # essential, important, aspirational
    risk_tolerance: float  # 0.0-1.0
    success_threshold: float  # 0.0-1.0
    required_return: float = 0.0  # Calculated


class HouseholdPortfolio(BaseModel):
    """Complete household portfolio"""
    accounts: List[Account]
    goals: List[Goal]
    total_value: float
    constraints: Dict[str, Any] = {}


class OptimizationResult(BaseModel):
    """Multi-level optimization result"""
    level: str
    total_value: float
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float

    # Goal-level results
    goal_allocations: Dict[str, Dict[str, float]] = {}  # {goal_id: {asset: weight}}

    # Account-level results
    account_allocations: Dict[str, Dict[str, float]] = {}  # {account_id: {asset: amount}}

    # Household-level aggregate
    household_allocation: Dict[str, float] = {}  # {asset: total_weight}

    # Tax efficiency metrics
    estimated_tax_drag: float = 0.0
    asset_location_efficiency: float = 0.0

    # Analysis
    diversification_score: float = 0.0
    rebalancing_needed: bool = False
    recommendations: List[str] = []


class MultiLevelOptimizer:
    """Multi-level portfolio optimizer"""

    def __init__(self):
        self.risk_free_rate = 0.04

    def optimize_household(
        self,
        household: HouseholdPortfolio,
        asset_codes: List[str],
        correlation_matrix: Optional[List[List[float]]] = None
    ) -> OptimizationResult:
        """
        Perform complete household-level optimization.

        This is the main entry point that orchestrates all three levels:
        1. Goal-level: Allocate capital to goals, determine goal-specific portfolios
        2. Account-level: Tax-aware asset placement across account types
        3. Household-level: Aggregate analysis and optimization

        REQ-PORT-003: Multi-level optimization

        Args:
            household: Complete household portfolio data
            asset_codes: List of asset class codes to use
            correlation_matrix: Optional correlation matrix

        Returns:
            Complete optimization result
        """
        # Step 1: Goal-Level Optimization
        goal_results = self._optimize_goals(
            household.goals,
            household.total_value,
            asset_codes,
            correlation_matrix
        )

        # Step 2: Account-Level Optimization (Tax-Aware Placement)
        account_results = self._optimize_accounts(
            household.accounts,
            goal_results,
            asset_codes
        )

        # Step 3: Household-Level Aggregation
        household_results = self._aggregate_household(
            goal_results,
            account_results,
            household.total_value
        )

        # Step 4: Calculate metrics
        result = OptimizationResult(
            level=OptimizationLevel.HOUSEHOLD,
            total_value=household.total_value,
            expected_return=household_results["expected_return"],
            expected_volatility=household_results["expected_volatility"],
            sharpe_ratio=household_results["sharpe_ratio"],
            goal_allocations=goal_results["allocations"],
            account_allocations=account_results["allocations"],
            household_allocation=household_results["allocation"],
            estimated_tax_drag=account_results["tax_drag"],
            asset_location_efficiency=account_results["location_efficiency"],
            diversification_score=household_results["diversification_score"],
            rebalancing_needed=account_results["rebalancing_needed"],
            recommendations=self._generate_recommendations(
                household,
                goal_results,
                account_results,
                household_results
            )
        )

        return result

    def _optimize_goals(
        self,
        goals: List[Goal],
        total_value: float,
        asset_codes: List[str],
        correlation_matrix: Optional[List[List[float]]] = None
    ) -> Dict:
        """
        Goal-level optimization: Allocate capital to goals and optimize each goal's portfolio.

        Args:
            goals: List of goals
            total_value: Total household portfolio value
            asset_codes: Available asset classes
            correlation_matrix: Asset correlations

        Returns:
            Goal optimization results
        """
        # Calculate capital allocation to each goal
        capital_allocation = self._allocate_capital_to_goals(goals, total_value)

        # Optimize portfolio for each goal
        goal_allocations = {}
        goal_metrics = {}

        for goal in goals:
            allocated_capital = capital_allocation.get(goal.id, 0)

            if allocated_capital > 0:
                # Determine target return based on goal requirements
                goal.required_return = self._calculate_required_return(
                    goal,
                    allocated_capital
                )

                # Optimize portfolio for this goal
                allocation = self._optimize_single_goal(
                    goal,
                    asset_codes,
                    correlation_matrix
                )

                goal_allocations[goal.id] = allocation["weights"]
                goal_metrics[goal.id] = {
                    "expected_return": allocation["expected_return"],
                    "expected_volatility": allocation["expected_volatility"],
                    "sharpe_ratio": allocation["sharpe_ratio"],
                    "allocated_capital": allocated_capital
                }

        return {
            "allocations": goal_allocations,
            "metrics": goal_metrics,
            "capital_allocation": capital_allocation
        }

    def _allocate_capital_to_goals(
        self,
        goals: List[Goal],
        total_value: float
    ) -> Dict[str, float]:
        """
        Allocate total portfolio capital to goals based on priority and funding needs.

        Priority order: Essential > Important > Aspirational

        Args:
            goals: List of goals
            total_value: Total capital available

        Returns:
            Capital allocation by goal_id
        """
        # Sort goals by priority
        priority_order = {"essential": 1, "important": 2, "aspirational": 3}
        sorted_goals = sorted(goals, key=lambda g: (priority_order.get(g.priority, 3), g.years_to_goal))

        allocation = {}
        remaining_capital = total_value

        for goal in sorted_goals:
            # Calculate funding need
            funding_gap = max(0, goal.target_amount - goal.current_amount)

            # Allocate up to funding gap or remaining capital
            allocated = min(funding_gap, remaining_capital)
            allocation[goal.id] = allocated
            remaining_capital -= allocated

            if remaining_capital <= 0:
                break

        # Distribute surplus proportionally if capital remains
        if remaining_capital > 0:
            total_allocated = sum(allocation.values())
            if total_allocated > 0:
                for goal_id in allocation:
                    proportion = allocation[goal_id] / total_allocated
                    allocation[goal_id] += remaining_capital * proportion

        return allocation

    def _calculate_required_return(self, goal: Goal, allocated_capital: float) -> float:
        """Calculate required annual return to reach goal."""
        if goal.years_to_goal <= 0 or allocated_capital <= 0:
            return 0.05  # Default 5%

        # Calculate required return using future value formula
        # FV = PV * (1 + r)^n
        # r = (FV/PV)^(1/n) - 1
        fv = goal.target_amount
        pv = allocated_capital
        n = goal.years_to_goal

        if pv >= fv:
            return 0.02  # Already funded, minimal return needed

        required_return = (fv / pv) ** (1 / n) - 1
        return min(0.15, max(0.02, required_return))  # Cap at 2-15%

    def _optimize_single_goal(
        self,
        goal: Goal,
        asset_codes: List[str],
        correlation_matrix: Optional[List[List[float]]] = None
    ) -> Dict:
        """
        Optimize portfolio for a single goal using MPT.

        Args:
            goal: Goal to optimize for
            asset_codes: Available asset classes
            correlation_matrix: Asset correlations

        Returns:
            Optimal allocation and metrics
        """
        n_assets = len(asset_codes)
        assets = [ASSET_CLASS_LIBRARY[code] for code in asset_codes]

        # Get returns and volatilities
        returns = np.array([asset.expected_return for asset in assets])
        volatilities = np.array([asset.volatility for asset in assets])

        # Correlation matrix
        if correlation_matrix is None:
            correlation_matrix = get_default_correlation_matrix(asset_codes)

        corr_matrix = np.array(correlation_matrix)
        cov_matrix = np.outer(volatilities, volatilities) * corr_matrix

        # Target return based on goal requirements and risk tolerance
        min_return = returns.min()
        max_return = returns.max()
        target_return = min_return + goal.risk_tolerance * (max_return - min_return)

        # Adjust for required return
        target_return = max(target_return, goal.required_return)
        target_return = min(target_return, max_return)

        # Optimization objective: minimize volatility
        def portfolio_volatility(weights):
            return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

        def portfolio_return(weights):
            return np.dot(weights, returns)

        # Constraints
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},  # Weights sum to 1
            {'type': 'ineq', 'fun': lambda w: portfolio_return(w) - target_return}  # Return >= target
        ]

        # Bounds (respect asset class constraints)
        bounds = [(asset.min_weight, asset.max_weight) for asset in assets]

        # Initial guess
        initial_weights = np.array([1.0 / n_assets] * n_assets)

        # Optimize
        result = minimize(
            portfolio_volatility,
            initial_weights,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000, 'ftol': 1e-9}
        )

        if not result.success:
            # Fallback: equal weights
            optimal_weights = initial_weights
        else:
            optimal_weights = result.x

        # Calculate metrics
        opt_return = portfolio_return(optimal_weights)
        opt_volatility = portfolio_volatility(optimal_weights)
        sharpe_ratio = (opt_return - self.risk_free_rate) / opt_volatility if opt_volatility > 0 else 0

        return {
            "weights": {asset_codes[i]: float(optimal_weights[i]) for i in range(n_assets)},
            "expected_return": float(opt_return),
            "expected_volatility": float(opt_volatility),
            "sharpe_ratio": float(sharpe_ratio)
        }

    def _optimize_accounts(
        self,
        accounts: List[Account],
        goal_results: Dict,
        asset_codes: List[str]
    ) -> Dict:
        """
        Account-level optimization: Tax-aware asset placement.

        Optimizes asset location across account types:
        - Tax-inefficient assets → Tax-deferred accounts
        - Tax-efficient assets → Taxable accounts
        - Highest return assets → Tax-exempt (Roth) accounts

        REQ-PORT-003: Account-level optimization
        REQ-TAX-001: Asset location optimization

        Args:
            accounts: List of accounts
            goal_results: Results from goal-level optimization
            asset_codes: Available asset classes

        Returns:
            Account-level allocation results
        """
        # Aggregate all assets needed across all goals
        total_assets_needed = {}
        for goal_id, allocation in goal_results["allocations"].items():
            capital = goal_results["capital_allocation"][goal_id]
            for asset_code, weight in allocation.items():
                amount = capital * weight
                total_assets_needed[asset_code] = total_assets_needed.get(asset_code, 0) + amount

        # Get asset tax efficiencies
        asset_tax_efficiency = {
            code: ASSET_CLASS_LIBRARY[code].tax_efficiency
            for code in asset_codes
        }

        # Sort accounts by type priority
        tax_deferred = [a for a in accounts if a.type == "tax_deferred"]
        tax_exempt = [a for a in accounts if a.type == "tax_exempt"]
        taxable = [a for a in accounts if a.type == "taxable"]

        account_allocations = {}
        remaining_assets = total_assets_needed.copy()

        # Step 1: Place tax-inefficient assets in tax-deferred accounts
        for account in tax_deferred:
            account_allocations[account.id] = {}
            available = account.balance

            # Sort assets by tax inefficiency (lowest tax efficiency first)
            sorted_assets = sorted(
                remaining_assets.items(),
                key=lambda x: asset_tax_efficiency.get(x[0], 0.5)
            )

            for asset_code, amount in sorted_assets:
                if available <= 0:
                    break

                allocate = min(amount, available)
                if allocate > 0:
                    account_allocations[account.id][asset_code] = allocate
                    remaining_assets[asset_code] -= allocate
                    available -= allocate

        # Step 2: Place highest return assets in tax-exempt accounts
        for account in tax_exempt:
            account_allocations[account.id] = {}
            available = account.balance

            # Sort assets by expected return (highest first)
            sorted_assets = sorted(
                remaining_assets.items(),
                key=lambda x: ASSET_CLASS_LIBRARY[x[0]].expected_return,
                reverse=True
            )

            for asset_code, amount in sorted_assets:
                if available <= 0 or amount <= 0:
                    break

                allocate = min(amount, available)
                if allocate > 0:
                    account_allocations[account.id][asset_code] = allocate
                    remaining_assets[asset_code] -= allocate
                    available -= allocate

        # Step 3: Place remaining assets in taxable accounts
        for account in taxable:
            account_allocations[account.id] = {}
            available = account.balance

            for asset_code, amount in remaining_assets.items():
                if available <= 0 or amount <= 0:
                    break

                allocate = min(amount, available)
                if allocate > 0:
                    account_allocations[account.id][asset_code] = allocate
                    remaining_assets[asset_code] -= allocate
                    available -= allocate

        # Calculate tax metrics
        tax_drag = self._calculate_tax_drag(account_allocations, accounts, asset_codes)
        location_efficiency = self._calculate_location_efficiency(
            account_allocations,
            accounts,
            asset_tax_efficiency
        )

        # Check if rebalancing needed
        rebalancing_needed = self._check_rebalancing_needed(accounts, account_allocations)

        return {
            "allocations": account_allocations,
            "tax_drag": tax_drag,
            "location_efficiency": location_efficiency,
            "rebalancing_needed": rebalancing_needed
        }

    def _calculate_tax_drag(
        self,
        account_allocations: Dict[str, Dict[str, float]],
        accounts: List[Account],
        asset_codes: List[str]
    ) -> float:
        """Calculate estimated annual tax drag on returns."""
        total_tax_drag = 0.0
        total_value = 0.0

        account_map = {a.id: a for a in accounts}

        for account_id, allocation in account_allocations.items():
            account = account_map[account_id]

            if account.type == "taxable":
                # Only taxable accounts have tax drag
                for asset_code, amount in allocation.items():
                    asset = ASSET_CLASS_LIBRARY[asset_code]

                    # Tax drag = (1 - tax_efficiency) * expected_return * amount
                    drag = (1 - asset.tax_efficiency) * asset.expected_return * amount
                    total_tax_drag += drag
                    total_value += amount
            else:
                # Tax-advantaged accounts have no current tax drag
                total_value += sum(allocation.values())

        if total_value == 0:
            return 0.0

        return total_tax_drag / total_value

    def _calculate_location_efficiency(
        self,
        account_allocations: Dict[str, Dict[str, float]],
        accounts: List[Account],
        asset_tax_efficiency: Dict[str, float]
    ) -> float:
        """
        Calculate asset location efficiency score (0-1).

        1.0 = Perfect placement (tax-inefficient in tax-deferred, efficient in taxable)
        0.0 = Worst placement (tax-inefficient in taxable, efficient in tax-deferred)
        """
        account_map = {a.id: a for a in accounts}
        efficiency_scores = []

        for account_id, allocation in account_allocations.items():
            account = account_map[account_id]

            for asset_code, amount in allocation.items():
                tax_eff = asset_tax_efficiency.get(asset_code, 0.5)

                if account.type == "tax_deferred":
                    # Tax-deferred accounts should hold tax-inefficient assets
                    # Score = 1.0 - tax_efficiency (lower efficiency = higher score)
                    score = 1.0 - tax_eff
                elif account.type == "tax_exempt":
                    # Tax-exempt accounts are good for any asset (constant score)
                    score = 0.9
                elif account.type == "taxable":
                    # Taxable accounts should hold tax-efficient assets
                    # Score = tax_efficiency (higher efficiency = higher score)
                    score = tax_eff
                else:
                    score = 0.5

                efficiency_scores.append(score * amount)

        total_amount = sum(
            sum(allocation.values())
            for allocation in account_allocations.values()
        )

        if total_amount == 0:
            return 0.0

        return sum(efficiency_scores) / total_amount

    def _check_rebalancing_needed(
        self,
        accounts: List[Account],
        target_allocations: Dict[str, Dict[str, float]],
        threshold: float = 0.05
    ) -> bool:
        """Check if rebalancing is needed (5% drift threshold)."""
        for account in accounts:
            target = target_allocations.get(account.id, {})
            current = account.current_holdings

            # Calculate drift
            for asset_code in set(target.keys()) | set(current.keys()):
                target_amount = target.get(asset_code, 0)
                current_amount = current.get(asset_code, 0)

                if account.balance > 0:
                    target_pct = target_amount / account.balance
                    current_pct = current_amount / account.balance
                    drift = abs(target_pct - current_pct)

                    if drift > threshold:
                        return True

        return False

    def _aggregate_household(
        self,
        goal_results: Dict,
        account_results: Dict,
        total_value: float
    ) -> Dict:
        """
        Household-level aggregation and analysis.

        Args:
            goal_results: Goal-level optimization results
            account_results: Account-level optimization results
            total_value: Total household value

        Returns:
            Household-level metrics
        """
        # Aggregate allocation across all accounts
        household_allocation = {}
        for account_id, allocation in account_results["allocations"].items():
            for asset_code, amount in allocation.items():
                household_allocation[asset_code] = household_allocation.get(asset_code, 0) + amount

        # Convert to weights
        if total_value > 0:
            household_allocation = {
                asset: amount / total_value
                for asset, amount in household_allocation.items()
            }

        # Calculate weighted metrics
        weighted_return = 0.0
        weighted_volatility = 0.0

        for asset_code, weight in household_allocation.items():
            asset = ASSET_CLASS_LIBRARY[asset_code]
            weighted_return += weight * asset.expected_return
            weighted_volatility += weight * asset.volatility  # Simplified

        sharpe_ratio = (weighted_return - self.risk_free_rate) / weighted_volatility if weighted_volatility > 0 else 0

        # Calculate diversification score
        diversification_score = self._calculate_diversification_score(household_allocation)

        return {
            "allocation": household_allocation,
            "expected_return": weighted_return,
            "expected_volatility": weighted_volatility,
            "sharpe_ratio": sharpe_ratio,
            "diversification_score": diversification_score
        }

    def _calculate_diversification_score(self, allocation: Dict[str, float]) -> float:
        """
        Calculate diversification score using Herfindahl-Hirschman Index (HHI).

        HHI = sum of squared weights
        Score = 1 - normalized_HHI (0 = concentrated, 1 = perfectly diversified)
        """
        if not allocation:
            return 0.0

        weights = list(allocation.values())
        hhi = sum(w ** 2 for w in weights)

        # Normalize: max HHI = 1.0 (one asset), min HHI = 1/n (equal weights)
        n = len(weights)
        max_hhi = 1.0
        min_hhi = 1.0 / n if n > 0 else 1.0

        if max_hhi == min_hhi:
            return 1.0

        normalized_hhi = (hhi - min_hhi) / (max_hhi - min_hhi)
        diversification_score = 1.0 - normalized_hhi

        return diversification_score

    def _generate_recommendations(
        self,
        household: HouseholdPortfolio,
        goal_results: Dict,
        account_results: Dict,
        household_results: Dict
    ) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []

        # Check asset location efficiency
        if account_results["location_efficiency"] < 0.7:
            recommendations.append(
                f"⚠️ Asset location efficiency is {account_results['location_efficiency']:.1%}. "
                f"Consider moving tax-inefficient assets (bonds, REITs) to tax-deferred accounts."
            )

        # Check diversification
        if household_results["diversification_score"] < 0.6:
            recommendations.append(
                f"📊 Diversification score is {household_results['diversification_score']:.1%}. "
                f"Consider adding more asset classes to reduce concentration risk."
            )

        # Check rebalancing
        if account_results["rebalancing_needed"]:
            recommendations.append(
                "⚖️ Portfolio has drifted more than 5% from targets. Consider rebalancing."
            )

        # Check tax drag
        if account_results["tax_drag"] > 0.015:  # 1.5% annual tax drag
            recommendations.append(
                f"💰 Estimated tax drag is {account_results['tax_drag']:.2%} annually. "
                f"Consider tax-loss harvesting and municipal bonds."
            )

        # Check Sharpe ratio
        if household_results["sharpe_ratio"] < 0.5:
            recommendations.append(
                f"📉 Sharpe ratio is {household_results['sharpe_ratio']:.2f}. "
                f"Risk-adjusted returns could be improved through better diversification."
            )

        if not recommendations:
            recommendations.append("✅ Portfolio is well-optimized. Continue monitoring quarterly.")

        return recommendations
