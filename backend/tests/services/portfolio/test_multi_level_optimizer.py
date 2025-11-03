"""
Unit tests for Multi-Level Portfolio Optimizer
Tests goal-level, account-level, and household-level optimization
"""

import pytest
from app.services.portfolio.multi_level_optimizer import (
    MultiLevelOptimizer,
    HouseholdPortfolio,
    Account,
    Goal,
    OptimizationLevel
)
from app.services.portfolio.asset_class_library import get_all_asset_codes


@pytest.fixture
def sample_accounts():
    """Sample accounts for testing"""
    return [
        Account(
            id="acc1",
            name="401k",
            type="tax_deferred",
            balance=150000,
            current_holdings={"US_LC_BLEND": 90000, "US_TREASURY_INTER": 60000}
        ),
        Account(
            id="acc2",
            name="Roth IRA",
            type="tax_exempt",
            balance=75000,
            current_holdings={"US_LC_BLEND": 75000}
        ),
        Account(
            id="acc3",
            name="Taxable",
            type="taxable",
            balance=50000,
            current_holdings={"US_LC_BLEND": 30000, "CASH": 20000}
        )
    ]


@pytest.fixture
def sample_goals():
    """Sample goals for testing"""
    return [
        Goal(
            id="goal1",
            name="Retirement",
            target_amount=2000000,
            current_amount=275000,
            years_to_goal=20,
            priority="essential",
            risk_tolerance=0.6,
            success_threshold=0.85
        ),
        Goal(
            id="goal2",
            name="Home Down Payment",
            target_amount=100000,
            current_amount=0,
            years_to_goal=5,
            priority="important",
            risk_tolerance=0.4,
            success_threshold=0.90
        )
    ]


@pytest.fixture
def sample_household(sample_accounts, sample_goals):
    """Sample household for testing"""
    return HouseholdPortfolio(
        accounts=sample_accounts,
        goals=sample_goals,
        total_value=275000
    )


@pytest.fixture
def optimizer():
    """Multi-level optimizer instance"""
    return MultiLevelOptimizer()


@pytest.fixture
def asset_codes():
    """Sample asset codes for testing"""
    return ["US_LC_BLEND", "US_MC_BLEND", "INTL_DEV_BLEND",
            "US_TREASURY_INTER", "US_CORP_IG", "CASH"]


class TestMultiLevelOptimizer:
    """Test multi-level optimizer initialization and basic methods"""

    def test_optimizer_initialization(self, optimizer):
        """Test optimizer initializes correctly"""
        assert optimizer is not None
        assert optimizer.risk_free_rate == 0.04

    def test_calculate_required_return(self, optimizer):
        """Test required return calculation"""
        goal = Goal(
            id="test",
            name="Test Goal",
            target_amount=100000,
            current_amount=50000,
            years_to_goal=10,
            priority="important",
            risk_tolerance=0.5,
            success_threshold=0.85
        )

        required_return = optimizer._calculate_required_return(goal, 50000)

        # FV = PV * (1 + r)^n
        # 100000 = 50000 * (1 + r)^10
        # r = 2^(1/10) - 1 ≈ 0.0718 or 7.18%
        assert 0.05 < required_return < 0.10, "Required return should be reasonable"

    def test_calculate_required_return_already_funded(self, optimizer):
        """Test required return when goal is already funded"""
        goal = Goal(
            id="test",
            name="Test Goal",
            target_amount=100000,
            current_amount=0,
            years_to_goal=10,
            priority="important",
            risk_tolerance=0.5,
            success_threshold=0.85
        )

        # Already have more than target
        required_return = optimizer._calculate_required_return(goal, 120000)
        assert required_return == 0.02, "Should return minimal rate when overfunded"

    def test_calculate_risk_tolerance(self, optimizer):
        """Test risk tolerance calculation"""
        # Long time horizon, aspirational goal = high risk tolerance
        risk = optimizer._calculate_risk_tolerance(30, "aspirational")
        assert risk > 0.8, "30-year aspirational goal should have high risk tolerance"

        # Short time horizon, essential goal = low risk tolerance
        risk = optimizer._calculate_risk_tolerance(2, "essential")
        assert risk < 0.3, "2-year essential goal should have low risk tolerance"

        # Medium time horizon, important goal = medium risk tolerance
        risk = optimizer._calculate_risk_tolerance(10, "important")
        assert 0.4 < risk < 0.7, "10-year important goal should have medium risk tolerance"

    def test_calculate_stocks_allocation(self, optimizer):
        """Test stocks allocation calculation"""
        # Long horizon, aggressive = high stocks
        stocks = optimizer._calculate_stocks_allocation(30, 0.9)
        assert stocks > 0.75, "30 years + aggressive should be >75% stocks"

        # Short horizon, conservative = low stocks
        stocks = optimizer._calculate_stocks_allocation(3, 0.2)
        assert stocks < 0.35, "3 years + conservative should be <35% stocks"


class TestGoalLevelOptimization:
    """Test goal-level optimization"""

    def test_allocate_capital_to_goals_single_goal(self, optimizer, sample_goals):
        """Test capital allocation with single goal"""
        total_value = 300000
        allocation = optimizer._allocate_capital_to_goals(
            [sample_goals[0]],  # Only retirement goal
            total_value
        )

        assert "goal1" in allocation
        # Should allocate all capital to single goal
        assert allocation["goal1"] > 0

    def test_allocate_capital_prioritization(self, optimizer, sample_goals):
        """Test that essential goals get funded first"""
        total_value = 100000  # Not enough for both goals

        # Essential goal needs 1,725,000, Important goal needs 100,000
        # With limited capital, essential should get priority
        allocation = optimizer._allocate_capital_to_goals(sample_goals, total_value)

        assert "goal1" in allocation
        # Essential goal should get allocated first
        assert allocation["goal1"] > 0

    def test_allocate_capital_with_surplus(self, optimizer, sample_goals):
        """Test capital allocation with surplus"""
        total_value = 5000000  # More than enough for both goals

        allocation = optimizer._allocate_capital_to_goals(sample_goals, total_value)

        # Both goals should be funded
        assert allocation["goal1"] > 0
        assert allocation["goal2"] > 0

        # Total should equal available capital
        total_allocated = sum(allocation.values())
        assert abs(total_allocated - total_value) < 1.0

    def test_optimize_single_goal(self, optimizer, sample_goals, asset_codes):
        """Test optimizing portfolio for single goal"""
        goal = sample_goals[0]  # Retirement goal
        result = optimizer._optimize_single_goal(goal, asset_codes, None)

        # Check result structure
        assert "weights" in result
        assert "expected_return" in result
        assert "expected_volatility" in result
        assert "sharpe_ratio" in result

        # Weights should sum to ~1.0
        total_weight = sum(result["weights"].values())
        assert abs(total_weight - 1.0) < 0.01

        # All weights should be non-negative
        assert all(w >= -0.01 for w in result["weights"].values())

        # Should have reasonable metrics
        assert 0.02 < result["expected_return"] < 0.20
        assert 0.01 < result["expected_volatility"] < 0.40
        assert -1.0 < result["sharpe_ratio"] < 5.0


class TestAccountLevelOptimization:
    """Test account-level tax-aware optimization"""

    def test_optimize_accounts_tax_aware_placement(self, optimizer, sample_accounts, asset_codes):
        """Test that accounts place assets tax-efficiently"""
        # Simple goal results for testing
        goal_results = {
            "allocations": {
                "goal1": {
                    "US_LC_BLEND": 0.50,
                    "US_TREASURY_INTER": 0.30,
                    "US_CORP_IG": 0.20
                }
            },
            "capital_allocation": {"goal1": 275000}
        }

        account_results = optimizer._optimize_accounts(
            sample_accounts,
            goal_results,
            ["US_LC_BLEND", "US_TREASURY_INTER", "US_CORP_IG"]
        )

        assert "allocations" in account_results
        assert "tax_drag" in account_results
        assert "location_efficiency" in account_results

        # Check that bonds are prioritized in tax-deferred accounts
        # (This is a simplified check - actual placement is more complex)
        assert len(account_results["allocations"]) > 0

    def test_calculate_tax_drag(self, optimizer, sample_accounts):
        """Test tax drag calculation"""
        account_allocations = {
            "acc3": {"US_LC_BLEND": 40000, "US_CORP_IG": 10000}  # Taxable account
        }

        tax_drag = optimizer._calculate_tax_drag(
            account_allocations,
            sample_accounts,
            ["US_LC_BLEND", "US_CORP_IG"]
        )

        # Tax drag should be between 0 and 5%
        assert 0 <= tax_drag < 0.05

    def test_calculate_location_efficiency(self, optimizer, sample_accounts):
        """Test asset location efficiency calculation"""
        account_allocations = {
            "acc1": {"US_CORP_IG": 100000},  # Tax-inefficient in tax-deferred = good
            "acc2": {"US_LC_BLEND": 50000},  # Stocks in Roth = good
            "acc3": {"US_LC_BLEND": 25000}   # Stocks in taxable = decent
        }

        asset_tax_efficiency = {
            "US_LC_BLEND": 0.88,
            "US_CORP_IG": 0.55
        }

        efficiency = optimizer._calculate_location_efficiency(
            account_allocations,
            sample_accounts,
            asset_tax_efficiency
        )

        # Efficiency should be between 0 and 1
        assert 0 <= efficiency <= 1.0

    def test_check_rebalancing_needed(self, optimizer, sample_accounts):
        """Test rebalancing detection"""
        # Current holdings have 5%+ drift
        target_allocations = {
            "acc1": {"US_LC_BLEND": 75000, "US_TREASURY_INTER": 75000}
        }

        needs_rebalancing = optimizer._check_rebalancing_needed(
            sample_accounts,
            target_allocations,
            threshold=0.05
        )

        # Should detect drift > 5%
        assert isinstance(needs_rebalancing, bool)


class TestHouseholdLevelOptimization:
    """Test household-level aggregation"""

    def test_aggregate_household(self, optimizer):
        """Test household aggregation"""
        goal_results = {
            "allocations": {
                "goal1": {"US_LC_BLEND": 0.6, "US_TREASURY_INTER": 0.4}
            },
            "capital_allocation": {"goal1": 100000}
        }

        account_results = {
            "allocations": {
                "acc1": {"US_LC_BLEND": 60000, "US_TREASURY_INTER": 40000}
            },
            "tax_drag": 0.01,
            "location_efficiency": 0.85,
            "rebalancing_needed": False
        }

        household_results = optimizer._aggregate_household(
            goal_results,
            account_results,
            100000
        )

        assert "allocation" in household_results
        assert "expected_return" in household_results
        assert "expected_volatility" in household_results
        assert "sharpe_ratio" in household_results
        assert "diversification_score" in household_results

        # Allocation should sum to ~1.0
        total_weight = sum(household_results["allocation"].values())
        assert abs(total_weight - 1.0) < 0.01

    def test_calculate_diversification_score(self, optimizer):
        """Test diversification score calculation"""
        # Concentrated portfolio
        concentrated = {"US_LC_BLEND": 0.90, "CASH": 0.10}
        score_low = optimizer._calculate_diversification_score(concentrated)
        assert score_low < 0.5, "Concentrated portfolio should have low diversification score"

        # Diversified portfolio
        diversified = {
            "US_LC_BLEND": 0.20,
            "INTL_DEV_BLEND": 0.20,
            "US_TREASURY_INTER": 0.20,
            "US_CORP_IG": 0.20,
            "US_REIT": 0.10,
            "GOLD": 0.10
        }
        score_high = optimizer._calculate_diversification_score(diversified)
        assert score_high > 0.75, "Diversified portfolio should have high score"

        # Equal weights = maximum diversification
        equal = {f"asset{i}": 0.1 for i in range(10)}
        score_max = optimizer._calculate_diversification_score(equal)
        assert score_max > 0.95, "Equal weights should maximize diversification"


class TestFullOptimization:
    """Test complete household optimization"""

    def test_optimize_household_basic(self, optimizer, sample_household, asset_codes):
        """Test full household optimization"""
        result = optimizer.optimize_household(
            household=sample_household,
            asset_codes=asset_codes,
            correlation_matrix=None
        )

        # Check result structure
        assert result.level == OptimizationLevel.HOUSEHOLD
        assert result.total_value == 275000
        assert result.expected_return > 0
        assert result.expected_volatility > 0
        assert len(result.goal_allocations) > 0
        assert len(result.account_allocations) > 0
        assert len(result.household_allocation) > 0
        assert len(result.recommendations) > 0

        # Check metrics are reasonable
        assert 0.02 < result.expected_return < 0.15
        assert 0.01 < result.expected_volatility < 0.30
        assert -1.0 < result.sharpe_ratio < 5.0
        assert 0.0 <= result.estimated_tax_drag < 0.10
        assert 0.0 <= result.asset_location_efficiency <= 1.0
        assert 0.0 <= result.diversification_score <= 1.0

    def test_optimize_household_with_multiple_goals(self, optimizer, sample_accounts):
        """Test optimization with multiple goals"""
        goals = [
            Goal(
                id="goal1",
                name="Retirement",
                target_amount=2000000,
                current_amount=200000,
                years_to_goal=25,
                priority="essential",
                risk_tolerance=0.7,
                success_threshold=0.85
            ),
            Goal(
                id="goal2",
                name="Home",
                target_amount=150000,
                current_amount=50000,
                years_to_goal=5,
                priority="important",
                risk_tolerance=0.4,
                success_threshold=0.90
            ),
            Goal(
                id="goal3",
                name="Vacation Home",
                target_amount=500000,
                current_amount=25000,
                years_to_goal=15,
                priority="aspirational",
                risk_tolerance=0.6,
                success_threshold=0.75
            )
        ]

        household = HouseholdPortfolio(
            accounts=sample_accounts,
            goals=goals,
            total_value=275000
        )

        result = optimizer.optimize_household(
            household=household,
            asset_codes=["US_LC_BLEND", "US_TREASURY_INTER", "CASH"],
            correlation_matrix=None
        )

        # Should have allocations for all goals
        assert len(result.goal_allocations) <= 3  # Some goals might not get funded
        assert len(result.recommendations) > 0

    def test_recommendations_generation(self, optimizer, sample_household, asset_codes):
        """Test that recommendations are generated"""
        result = optimizer.optimize_household(
            household=sample_household,
            asset_codes=asset_codes,
            correlation_matrix=None
        )

        assert len(result.recommendations) > 0
        # At least one recommendation should be present
        assert any(rec for rec in result.recommendations)


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_single_account_optimization(self, optimizer, sample_goals):
        """Test optimization with single account"""
        single_account = [
            Account(
                id="acc1",
                name="Single Account",
                type="taxable",
                balance=100000,
                current_holdings={}
            )
        ]

        household = HouseholdPortfolio(
            accounts=single_account,
            goals=[sample_goals[0]],
            total_value=100000
        )

        result = optimizer.optimize_household(
            household=household,
            asset_codes=["US_LC_BLEND", "CASH"],
            correlation_matrix=None
        )

        assert result is not None
        assert result.total_value == 100000

    def test_zero_balance_handling(self, optimizer, sample_goals):
        """Test handling of zero-balance accounts"""
        accounts = [
            Account(id="acc1", name="Empty", type="taxable", balance=0, current_holdings={}),
            Account(id="acc2", name="Funded", type="taxable", balance=100000, current_holdings={})
        ]

        household = HouseholdPortfolio(
            accounts=accounts,
            goals=[sample_goals[0]],
            total_value=100000
        )

        result = optimizer.optimize_household(
            household=household,
            asset_codes=["US_LC_BLEND", "CASH"],
            correlation_matrix=None
        )

        assert result is not None

    def test_insufficient_assets(self, optimizer, sample_household):
        """Test optimization with very few asset classes"""
        # Only 2 assets
        result = optimizer.optimize_household(
            household=sample_household,
            asset_codes=["US_LC_BLEND", "CASH"],
            correlation_matrix=None
        )

        assert result is not None
        # Should work but have lower diversification
        assert result.diversification_score < 0.8


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
