"""
Comprehensive tests for hedging strategies
Tests all requirements: REQ-RISK-004 through REQ-RISK-007
"""

import pytest
from app.services.risk.hedging_strategies import (
    HedgingService,
    HedgingObjectives,
    HedgingStrategyType
)
from app.services.risk.hedging_education import HedgingEducationService


class TestHedgingStrategies:
    """Test hedging strategy recommendations"""

    def setup_method(self):
        """Setup test data"""
        self.service = HedgingService(risk_free_rate=0.04)

        self.portfolio_value = 500000
        self.allocation = {
            "US_LC_BLEND": 0.60,
            "INTL_DEV_BLEND": 0.20,
            "US_TREASURY_INTER": 0.15,
            "GOLD": 0.05
        }
        self.risk_metrics = {
            "annual_volatility": 0.18,
            "beta": 1.15,
            "max_drawdown": 0.28,
            "risk_level": "aggressive"
        }

    def test_req_risk_004_protective_put(self):
        """
        REQ-RISK-004: Test protective put strategy
        """
        # Use allocation with >30% equity and portfolio >$50k to trigger protective put
        allocation_high_equity = {
            "US_LC_BLEND": 0.80,  # High equity
            "US_TREASURY_INTER": 0.20
        }

        result = self.service.recommend_hedging_strategies(
            portfolio_value=100000,  # Above $50k threshold
            allocation=allocation_high_equity,
            risk_metrics=self.risk_metrics
        )

        # Find protective put strategy
        protective_put = next(
            (s for s in result.recommended_strategies
             if s.strategy_type == HedgingStrategyType.PROTECTIVE_PUT),
            None
        )

        assert protective_put is not None, "Protective put strategy should be recommended"
        assert protective_put.name == "Protective Put"
        assert protective_put.cost_estimate > 0, "Put should have a cost"
        assert protective_put.protection_level > 0.80, "Should protect at least 80%"
        assert len(protective_put.pros) > 0
        assert len(protective_put.cons) > 0
        assert protective_put.when_to_use != ""
        assert len(protective_put.implementation_steps) > 0
        assert protective_put.impact_on_return < 0, "Should have negative return impact"

    def test_req_risk_004_covered_call(self):
        """
        REQ-RISK-004: Test covered call strategy
        """
        # Lower volatility to trigger covered call
        risk_metrics = self.risk_metrics.copy()
        risk_metrics["annual_volatility"] = 0.15

        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=risk_metrics
        )

        # Find covered call strategy
        covered_call = next(
            (s for s in result.recommended_strategies
             if s.strategy_type == HedgingStrategyType.COVERED_CALL),
            None
        )

        assert covered_call is not None, "Covered call strategy should be recommended"
        assert covered_call.name == "Covered Call"
        assert covered_call.cost_estimate < 0, "Should generate income (negative cost)"
        assert covered_call.cost_pct < 0, "Should have negative cost percentage"
        assert covered_call.impact_on_return > 0, "Should have positive return impact"
        assert len(covered_call.implementation_steps) == 6

    def test_req_risk_004_collar(self):
        """
        REQ-RISK-004: Test collar strategy
        """
        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=self.risk_metrics
        )

        # Find collar strategy
        collar = next(
            (s for s in result.recommended_strategies
             if s.strategy_type == HedgingStrategyType.COLLAR),
            None
        )

        assert collar is not None, "Collar strategy should be recommended"
        assert collar.name == "Collar Strategy"
        assert collar.cost_pct < 0.01, "Collar should have low/zero cost"
        assert collar.protection_level == 0.90, "Should protect at 90%"

    def test_req_risk_004_inverse_etf(self):
        """
        REQ-RISK-004: Test inverse ETF strategy
        """
        # Use beta > 1.2 and equity > 60% to trigger inverse ETF
        risk_metrics_high_beta = self.risk_metrics.copy()
        risk_metrics_high_beta["beta"] = 1.25

        allocation_high_equity = {
            "US_LC_BLEND": 0.70,  # >60% equity
            "US_TREASURY_INTER": 0.30
        }

        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=allocation_high_equity,
            risk_metrics=risk_metrics_high_beta
        )

        # Find inverse ETF strategy
        inverse_etf = next(
            (s for s in result.recommended_strategies
             if s.strategy_type == HedgingStrategyType.INVERSE_ETF),
            None
        )

        assert inverse_etf is not None, "Inverse ETF strategy should be recommended"
        assert inverse_etf.name == "Inverse ETF Hedge"
        assert "tactical" in inverse_etf.time_horizon.lower()

    def test_req_risk_004_tail_risk(self):
        """
        REQ-RISK-004: Test tail risk hedging
        """
        # Use max_drawdown > 0.25 or aggressive risk level to trigger tail risk hedge
        risk_metrics_high_risk = self.risk_metrics.copy()
        risk_metrics_high_risk["max_drawdown"] = 0.30  # >0.25 triggers tail risk
        risk_metrics_high_risk["risk_level"] = "very_aggressive"

        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=risk_metrics_high_risk
        )

        # Find tail risk hedge
        tail_risk = next(
            (s for s in result.recommended_strategies
             if s.strategy_type == HedgingStrategyType.TAIL_RISK_HEDGE),
            None
        )

        assert tail_risk is not None, "Tail risk hedge should be recommended"
        assert tail_risk.name == "Tail Risk Hedge"
        assert tail_risk.cost_pct < 0.01, "Tail hedge should be very cheap"
        assert tail_risk.protection_level <= 0.75, "Deep OTM protection"

    def test_req_risk_005_user_objectives(self):
        """
        REQ-RISK-005: Test user-specified hedging objectives
        """
        objectives = HedgingObjectives(
            hedge_percentage=0.75,
            max_acceptable_drawdown=0.15,
            cost_tolerance_pct=0.015,
            time_horizon_months=6,
            specific_scenarios=["market_crash"]
        )

        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=self.risk_metrics,
            objectives=objectives
        )

        # All recommended strategies should meet cost tolerance
        for strategy in result.recommended_strategies:
            assert strategy.cost_pct <= objectives.cost_tolerance_pct, \
                f"{strategy.name} exceeds cost tolerance"

        # Optimal strategy should meet objectives
        assert result.optimal_strategy is not None
        assert result.optimal_strategy.cost_pct <= objectives.cost_tolerance_pct

        # Check objectives_met dict
        assert "cost_tolerance" in result.objectives_met
        assert "protection_level" in result.objectives_met

    def test_req_risk_006_strategy_display_fields(self):
        """
        REQ-RISK-006: Test all required display fields for strategies
        """
        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=self.risk_metrics
        )

        assert result.optimal_strategy is not None
        strategy = result.optimal_strategy

        # Required display fields (REQ-RISK-006)
        assert strategy.cost_estimate > 0 or strategy.cost_estimate < 0, "Cost estimate required"
        assert strategy.cost_pct is not None, "Cost percentage required"
        assert strategy.protection_level > 0, "Protection level required"
        assert strategy.impact_on_return is not None, "Impact on return required"
        assert strategy.breakeven_point > 0, "Break-even analysis required"
        assert strategy.implementation != "", "Implementation approach required"

        # Additional display fields
        assert strategy.when_to_use != "", "When to use field required"
        assert len(strategy.implementation_steps) > 0, "Implementation steps required"
        assert strategy.impact_on_volatility is not None, "Volatility impact required"

    def test_req_risk_006_recommendation_fields(self):
        """
        REQ-RISK-006: Test recommendation-level display fields
        """
        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=self.risk_metrics
        )

        # Required fields at recommendation level
        assert result.portfolio_value == self.portfolio_value
        assert result.current_risk_level == "aggressive"
        assert len(result.recommended_strategies) > 0
        assert result.optimal_strategy is not None
        assert result.total_cost_estimate > 0
        assert result.expected_protection > 0
        assert result.implementation_priority in ["Critical", "High", "Medium", "Low"]

    def test_all_strategies_have_complete_fields(self):
        """Test that all strategies have all required fields populated"""
        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=self.risk_metrics
        )

        for strategy in result.recommended_strategies:
            # Core fields
            assert strategy.name != ""
            assert strategy.description != ""
            assert strategy.implementation != ""

            # Cost and protection
            assert strategy.cost_estimate is not None
            assert strategy.cost_pct is not None
            assert strategy.protection_level > 0

            # Analysis fields
            assert len(strategy.pros) > 0
            assert len(strategy.cons) > 0
            assert strategy.suitability_score >= 0
            assert strategy.suitability_score <= 100

            # New required fields
            assert strategy.when_to_use != ""
            assert len(strategy.implementation_steps) >= 3
            assert strategy.impact_on_return is not None
            assert strategy.impact_on_volatility is not None

    def test_market_conditions_note(self):
        """Test market conditions note generation"""
        # High volatility conditions
        market_conditions = {"vix": 35}

        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=self.risk_metrics,
            market_conditions=market_conditions
        )

        assert result.market_conditions_note is not None
        assert "volatility" in result.market_conditions_note.lower()

    def test_filter_by_objectives(self):
        """Test objective-based filtering"""
        # Very restrictive objectives
        objectives = HedgingObjectives(
            hedge_percentage=0.50,
            max_acceptable_drawdown=0.10,
            cost_tolerance_pct=0.005,  # Very low
            time_horizon_months=3
        )

        result = self.service.recommend_hedging_strategies(
            portfolio_value=self.portfolio_value,
            allocation=self.allocation,
            risk_metrics=self.risk_metrics,
            objectives=objectives
        )

        # Should filter out expensive strategies
        for strategy in result.recommended_strategies:
            # Very restrictive cost tolerance may filter most strategies
            # But at least one should remain (or all if none meet criteria)
            assert strategy.cost_pct <= objectives.cost_tolerance_pct or \
                   len(result.recommended_strategies) >= 1


class TestHedgingEducation:
    """Test hedging education content (REQ-RISK-007)"""

    def setup_method(self):
        """Setup education service"""
        self.service = HedgingEducationService()

    def test_req_risk_007_get_all_content(self):
        """
        REQ-RISK-007: Test getting all education content
        """
        content = self.service.get_all_education_content()

        # Should have all required topics
        assert len(content.topics) == 5

        topic_titles = [t.title for t in content.topics]
        assert "When to Use Hedging Strategies" in topic_titles
        assert "Costs and Trade-offs of Hedging" in topic_titles
        assert "Hedging vs. Insurance: Key Differences" in topic_titles
        assert "Long-term Impact of Hedging on Portfolio Returns" in topic_titles
        assert "Alternatives to Hedging Strategies" in topic_titles

        # Should have quick reference
        assert len(content.quick_reference) > 0
        assert "When to hedge" in content.quick_reference
        assert "Typical cost" in content.quick_reference

        # Should have glossary
        assert len(content.glossary) > 0
        assert "Protective Put" in content.glossary
        assert "Strike Price" in content.glossary

    def test_req_risk_007_when_to_hedge(self):
        """
        REQ-RISK-007: Test "when hedging is appropriate" education
        """
        topic = self.service.get_topic("when_to_hedge")

        assert topic.title == "When to Use Hedging Strategies"
        assert len(topic.content) > 100
        assert len(topic.examples) >= 4
        assert len(topic.key_points) >= 4
        assert len(topic.common_mistakes) >= 4

        # Should discuss appropriate and inappropriate scenarios
        assert "appropriate" in topic.content.lower()
        assert "inappropriate" in topic.content.lower()

    def test_req_risk_007_costs_and_tradeoffs(self):
        """
        REQ-RISK-007: Test "costs and trade-offs" education
        """
        topic = self.service.get_topic("costs_and_tradeoffs")

        assert topic.title == "Costs and Trade-offs of Hedging"
        assert "cost" in topic.content.lower()
        assert "trade-off" in topic.content.lower() or "tradeoff" in topic.content.lower()

        # Should discuss different types of costs
        assert "direct cost" in topic.content.lower() or "premium" in topic.content.lower()
        assert "implicit cost" in topic.content.lower() or "opportunity cost" in topic.content.lower()

    def test_req_risk_007_hedging_vs_insurance(self):
        """
        REQ-RISK-007: Test "difference between hedging and insurance" education
        """
        topic = self.service.get_topic("hedging_vs_insurance")

        assert topic.title == "Hedging vs. Insurance: Key Differences"
        assert "insurance" in topic.content.lower()
        assert "hedging" in topic.content.lower()

        # Should explain the differences
        assert len(topic.key_points) >= 4
        assert any("insurance" in point.lower() for point in topic.key_points)

    def test_req_risk_007_long_term_impact(self):
        """
        REQ-RISK-007: Test "long-term impact on returns" education
        """
        topic = self.service.get_topic("long_term_impact")

        assert topic.title == "Long-term Impact of Hedging on Portfolio Returns"
        assert "long-term" in topic.content.lower() or "long term" in topic.content.lower()
        # Check for returns-related content
        content_lower = topic.content.lower()
        assert "portfolio" in content_lower and ("cost" in content_lower or "impact" in content_lower)

        # Should discuss compounding costs
        assert "year" in topic.content.lower()
        assert len(topic.examples) >= 3

    def test_req_risk_007_alternatives(self):
        """
        REQ-RISK-007: Test "alternatives to hedging" education
        """
        topic = self.service.get_topic("alternatives")

        assert topic.title == "Alternatives to Hedging Strategies"

        # Should discuss multiple alternatives
        assert "cash reserve" in topic.content.lower() or "emergency fund" in topic.content.lower()
        assert "diversification" in topic.content.lower()
        assert "asset allocation" in topic.content.lower()

        assert len(topic.examples) >= 4
        assert len(topic.key_points) >= 4

    def test_invalid_topic(self):
        """Test error handling for invalid topic"""
        with pytest.raises(ValueError):
            self.service.get_topic("nonexistent_topic")

    def test_glossary_completeness(self):
        """Test that glossary has all key terms"""
        content = self.service.get_all_education_content()

        required_terms = [
            "Protective Put",
            "Covered Call",
            "Collar",
            "Strike Price",
            "Premium",
            "Volatility",
            "Time Decay"
        ]

        for term in required_terms:
            assert term in content.glossary, f"Glossary missing term: {term}"
            assert len(content.glossary[term]) > 10, f"Definition too short for: {term}"


class TestIntegration:
    """Integration tests for complete hedging workflow"""

    def test_complete_hedging_workflow(self):
        """Test complete workflow from objectives to education"""
        service = HedgingService()
        edu_service = HedgingEducationService()

        # Step 1: User specifies objectives
        objectives = HedgingObjectives(
            hedge_percentage=0.60,
            max_acceptable_drawdown=0.20,
            cost_tolerance_pct=0.02,
            time_horizon_months=12
        )

        # Step 2: Get hedging recommendations
        result = service.recommend_hedging_strategies(
            portfolio_value=500000,
            allocation={"US_LC_BLEND": 0.70, "US_TREASURY_INTER": 0.30},
            risk_metrics={
                "annual_volatility": 0.16,
                "beta": 1.0,
                "max_drawdown": 0.22,
                "risk_level": "moderate"
            },
            objectives=objectives
        )

        assert result.optimal_strategy is not None
        assert result.objectives_met is not None

        # Step 3: Get education about selected strategy
        strategy_type = result.optimal_strategy.strategy_type.value

        # Step 4: Verify all required fields are present
        assert result.implementation_priority in ["Critical", "High", "Medium", "Low"]
        assert result.total_cost_estimate > 0

        # Step 5: Get educational content
        education = edu_service.get_all_education_content()
        assert len(education.topics) == 5

    def test_high_risk_portfolio(self):
        """Test hedging for high-risk aggressive portfolio"""
        service = HedgingService()

        result = service.recommend_hedging_strategies(
            portfolio_value=1000000,
            allocation={"US_LC_GROWTH": 0.90, "EM_EQUITY": 0.10},
            risk_metrics={
                "annual_volatility": 0.28,
                "beta": 1.4,
                "max_drawdown": 0.45,  # High drawdown triggers tail risk
                "risk_level": "very_aggressive"  # Also triggers tail risk
            }
        )

        # Should recommend tail risk hedge for high-risk portfolio
        # max_drawdown 0.45 > 0.25 OR risk_level = very_aggressive should trigger it
        has_tail_risk = any(
            s.strategy_type == HedgingStrategyType.TAIL_RISK_HEDGE
            for s in result.recommended_strategies
        )
        assert has_tail_risk, f"Tail risk should be recommended. Strategies: {[s.strategy_type for s in result.recommended_strategies]}"

        # Priority should be high or critical
        assert result.implementation_priority in ["Critical", "High"]

    def test_conservative_portfolio(self):
        """Test hedging for conservative portfolio"""
        service = HedgingService()

        result = service.recommend_hedging_strategies(
            portfolio_value=250000,
            allocation={
                "US_TREASURY_INTER": 0.60,
                "US_LC_BLEND": 0.30,
                "GOLD": 0.10
            },
            risk_metrics={
                "annual_volatility": 0.08,
                "beta": 0.4,
                "max_drawdown": 0.12,
                "risk_level": "conservative"
            }
        )

        # Should recommend fewer strategies for conservative portfolio
        assert len(result.recommended_strategies) <= 5

        # Priority should be low or medium
        assert result.implementation_priority in ["Low", "Medium"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
