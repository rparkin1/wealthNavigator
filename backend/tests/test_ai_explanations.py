"""
Comprehensive tests for AI-Powered Portfolio Explanations Service

Tests REQ-PORT-010: Generative AI portfolio guidance
Tests REQ-PORT-012: Portfolio insights with Q&A capability
"""

import pytest
from app.services.portfolio.ai_explanations import (
    AIExplanationsService,
    PortfolioExplanation,
    ExplanationType
)


class TestAIExplanationsService:
    """Test AI-powered portfolio explanations"""

    def setup_method(self):
        """Set up test fixtures"""
        self.service = AIExplanationsService()

        # Test allocations
        self.aggressive_allocation = {
            "US_LC_BLEND": 0.40,
            "US_MC_BLEND": 0.15,
            "INTL_DEV_BLEND": 0.20,
            "EM_BLEND": 0.10,
            "US_TREASURY_INTER": 0.10,
            "US_CORP_IG": 0.05
        }

        self.balanced_allocation = {
            "US_LC_BLEND": 0.30,
            "INTL_DEV_BLEND": 0.15,
            "US_TREASURY_INTER": 0.30,
            "US_CORP_IG": 0.15,
            "REIT": 0.10
        }

        self.conservative_allocation = {
            "US_LC_BLEND": 0.20,
            "US_TREASURY_SHORT": 0.40,
            "US_TREASURY_INTER": 0.25,
            "US_CORP_IG": 0.15
        }

        # Test user profiles
        self.young_aggressive_profile = {
            "risk_tolerance": 0.85,
            "time_horizon_years": 30,
            "primary_goal": "retirement",
            "age": 30
        }

        self.middle_balanced_profile = {
            "risk_tolerance": 0.55,
            "time_horizon_years": 15,
            "primary_goal": "education funding",
            "age": 45
        }

        self.near_retirement_profile = {
            "risk_tolerance": 0.30,
            "time_horizon_years": 5,
            "primary_goal": "retirement",
            "age": 60
        }

        # Test goals
        self.multiple_goals = [
            {
                "name": "Retirement",
                "years_to_goal": 20,
                "target_amount": 2000000
            },
            {
                "name": "College Fund",
                "years_to_goal": 10,
                "target_amount": 200000
            },
            {
                "name": "House Down Payment",
                "years_to_goal": 5,
                "target_amount": 100000
            }
        ]


class TestExplainAllocation(TestAIExplanationsService):
    """Test REQ-PORT-010: explain_allocation method"""

    def test_aggressive_allocation_explanation(self):
        """Test explanation for aggressive allocation"""
        result = self.service.explain_allocation(
            self.aggressive_allocation,
            self.young_aggressive_profile
        )

        # Verify structure
        assert isinstance(result, PortfolioExplanation)
        assert result.question
        assert result.answer
        assert len(result.educational_notes) > 0
        assert len(result.related_concepts) > 0
        assert result.confidence >= 0.9

        # Verify content quality
        assert "85%" in result.answer or "80%" in result.answer  # High equity percentage
        assert "aggressive" in result.answer.lower() or "growth" in result.answer.lower()
        assert "30 years" in result.answer or "time horizon" in result.answer.lower()
        assert "retirement" in result.answer.lower()

        # Verify educational notes
        assert any("volatility" in note.lower() for note in result.educational_notes)

        # Verify related concepts
        assert "Asset Allocation" in result.related_concepts
        assert "Diversification" in result.related_concepts

    def test_conservative_allocation_explanation(self):
        """Test explanation for conservative allocation"""
        result = self.service.explain_allocation(
            self.conservative_allocation,
            self.near_retirement_profile
        )

        # Verify conservative language
        assert "20%" in result.answer or "conservative" in result.answer.lower()
        assert "stability" in result.answer.lower() or "stable" in result.answer.lower()
        assert "5 years" in result.answer

        # Verify appropriate risk messaging
        assert len(result.answer) > 200  # Substantial explanation
        assert result.confidence >= 0.9

    def test_balanced_allocation_explanation(self):
        """Test explanation for balanced allocation"""
        result = self.service.explain_allocation(
            self.balanced_allocation,
            self.middle_balanced_profile
        )

        # Verify balanced language
        assert "45%" in result.answer or "moderate" in result.answer.lower()
        assert "15 years" in result.answer
        assert "education" in result.answer.lower()

        # Verify educational content
        assert len(result.educational_notes) >= 3


class TestExplainInvestmentConcept(TestAIExplanationsService):
    """Test REQ-PORT-010: explain_investment_concept method"""

    def test_diversification_explanation(self):
        """Test diversification concept explanation"""
        result = self.service.explain_investment_concept("diversification")

        # Verify structure
        assert isinstance(result, PortfolioExplanation)
        assert result.question == "What is diversification?"
        assert result.confidence >= 0.9

        # Verify content quality
        assert len(result.answer) >= 200  # Substantial explanation
        assert "eggs" in result.answer.lower() or "basket" in result.answer.lower()
        assert "risk" in result.answer.lower()
        assert len(result.educational_notes) >= 4
        assert len(result.related_concepts) >= 3

        # Verify educational notes are actionable
        assert any("8" in note or "12" in note for note in result.educational_notes)  # Target diversification

    def test_risk_tolerance_explanation(self):
        """Test risk tolerance concept explanation"""
        result = self.service.explain_investment_concept("risk_tolerance")

        # Verify content
        assert "risk tolerance" in result.answer.lower()
        assert "ability" in result.answer.lower() or "willingness" in result.answer.lower()
        assert "panic" in result.answer.lower() or "sleep" in result.answer.lower()
        assert len(result.answer) >= 200

        # Verify practical guidance
        assert ("80" in result.answer or "90" in result.answer)  # Percentage references
        assert "time horizon" in result.answer.lower()

    def test_rebalancing_explanation(self):
        """Test rebalancing concept explanation"""
        result = self.service.explain_investment_concept("rebalancing")

        # Verify content
        assert "rebalanc" in result.answer.lower()
        assert "sell" in result.answer.lower()
        assert "buy" in result.answer.lower()
        assert "allocation" in result.answer.lower()

        # Verify example
        assert "70" in result.answer or "80" in result.answer  # Example percentages
        assert len(result.educational_notes) >= 4

    def test_expected_return_explanation(self):
        """Test expected return concept explanation"""
        result = self.service.explain_investment_concept("expected_return")

        # Verify content
        assert "return" in result.answer.lower()
        assert "stocks" in result.answer.lower()
        assert "bonds" in result.answer.lower()
        assert any(char.isdigit() for char in result.answer)  # Contains percentages

    def test_volatility_explanation(self):
        """Test volatility concept explanation"""
        result = self.service.explain_investment_concept("volatility")

        # Verify content
        assert "volatility" in result.answer.lower()
        assert "swing" in result.answer.lower() or "bounce" in result.answer.lower()
        assert "standard deviation" in result.answer.lower()
        assert len(result.answer) >= 150

    def test_asset_allocation_explanation(self):
        """Test asset allocation concept explanation"""
        result = self.service.explain_investment_concept("asset_allocation")

        # Verify content
        assert "asset allocation" in result.answer.lower()
        assert "stocks" in result.answer.lower()
        assert "bonds" in result.answer.lower()
        assert "90%" in result.answer  # Research statistic
        assert len(result.answer) >= 200

    def test_time_horizon_explanation(self):
        """Test time horizon concept explanation"""
        result = self.service.explain_investment_concept("time_horizon")

        # Verify content
        assert "time horizon" in result.answer.lower()
        assert "years" in result.answer.lower()
        assert "risk" in result.answer.lower()
        assert ("10" in result.answer or "20" in result.answer)  # Time references

    def test_tax_efficiency_explanation(self):
        """Test tax efficiency concept explanation"""
        result = self.service.explain_investment_concept("tax_efficiency")

        # Verify content
        assert "tax" in result.answer.lower()
        assert "efficiency" in result.answer.lower()
        assert "ira" in result.answer.lower() or "401k" in result.answer.lower()
        assert len(result.educational_notes) >= 4

    def test_unknown_concept_fallback(self):
        """Test fallback for unknown concepts"""
        result = self.service.explain_investment_concept("unknown_concept_xyz")

        # Verify fallback response
        assert isinstance(result, PortfolioExplanation)
        assert result.confidence < 0.9  # Lower confidence for fallback
        assert "advisor" in result.answer.lower() or "educational" in result.answer.lower()

    def test_concept_case_insensitivity(self):
        """Test concept matching is case-insensitive"""
        result1 = self.service.explain_investment_concept("DIVERSIFICATION")
        result2 = self.service.explain_investment_concept("diversification")
        result3 = self.service.explain_investment_concept("Diversification")

        # All should return same content
        assert result1.answer == result2.answer == result3.answer

    def test_concept_with_spaces(self):
        """Test concept matching handles spaces"""
        result = self.service.explain_investment_concept("risk tolerance")

        # Should match "risk_tolerance"
        assert "risk tolerance" in result.answer.lower()
        assert result.confidence >= 0.9


class TestTranslateGoalToAllocation(TestAIExplanationsService):
    """Test REQ-PORT-010: translate_goal_to_allocation method"""

    def test_long_term_goal_aggressive_allocation(self):
        """Test long-term goal translates to aggressive allocation"""
        result = self.service.translate_goal_to_allocation(
            goal_description="retirement savings",
            goal_amount=2000000,
            years_to_goal=25,
            current_savings=100000
        )

        # Verify structure
        assert isinstance(result, PortfolioExplanation)
        assert result.confidence >= 0.85

        # Verify aggressive recommendation
        assert "70%" in result.answer or "80%" in result.answer or "90%" in result.answer
        assert "25 years" in result.answer
        assert "long" in result.answer.lower()

        # Verify explanation quality
        assert len(result.answer) >= 300  # Substantial explanation
        assert "volatility" in result.answer.lower()
        assert len(result.educational_notes) >= 4

    def test_medium_term_goal_balanced_allocation(self):
        """Test medium-term goal translates to balanced allocation"""
        result = self.service.translate_goal_to_allocation(
            goal_description="college education fund",
            goal_amount=200000,
            years_to_goal=10,
            current_savings=50000
        )

        # Verify balanced recommendation
        assert "60%" in result.answer or "balanced" in result.answer.lower()
        assert "10 years" in result.answer
        assert "medium" in result.answer.lower() or "balanced" in result.answer.lower()

    def test_short_term_goal_conservative_allocation(self):
        """Test short-term goal translates to conservative allocation"""
        result = self.service.translate_goal_to_allocation(
            goal_description="house down payment",
            goal_amount=100000,
            years_to_goal=3,
            current_savings=70000
        )

        # Verify conservative recommendation
        assert "40%" in result.answer or "conservative" in result.answer.lower()
        assert "3 years" in result.answer
        assert "short" in result.answer.lower()
        assert "stability" in result.answer.lower()

    def test_very_short_term_goal_very_conservative(self):
        """Test very short-term goal translates to very conservative allocation"""
        result = self.service.translate_goal_to_allocation(
            goal_description="emergency fund",
            goal_amount=50000,
            years_to_goal=1,
            current_savings=30000
        )

        # Verify very conservative recommendation
        assert "20%" in result.answer or "very conservative" in result.answer.lower()
        assert "1 year" in result.answer

    def test_required_return_calculation(self):
        """Test required return is calculated and communicated"""
        result = self.service.translate_goal_to_allocation(
            goal_description="retirement",
            goal_amount=1000000,
            years_to_goal=20,
            current_savings=200000
        )

        # Verify required return is mentioned
        assert "%" in result.answer
        assert "return" in result.answer.lower()
        assert "$1,000,000" in result.answer
        assert "$200,000" in result.answer

    def test_zero_current_savings(self):
        """Test handling of zero current savings"""
        result = self.service.translate_goal_to_allocation(
            goal_description="retirement",
            goal_amount=1000000,
            years_to_goal=30,
            current_savings=0
        )

        # Should use default return assumption
        assert isinstance(result, PortfolioExplanation)
        assert result.confidence >= 0.85
        assert "30 years" in result.answer

    def test_educational_notes_quality(self):
        """Test educational notes provide actionable guidance"""
        result = self.service.translate_goal_to_allocation(
            goal_description="college fund",
            goal_amount=200000,
            years_to_goal=12,
            current_savings=30000
        )

        # Verify notes quality
        assert len(result.educational_notes) >= 4
        assert any("recover" in note.lower() for note in result.educational_notes)
        assert any("return" in note.lower() for note in result.educational_notes)
        assert any("volatility" in note.lower() for note in result.educational_notes)

    def test_related_concepts_included(self):
        """Test related concepts are relevant"""
        result = self.service.translate_goal_to_allocation(
            goal_description="retirement",
            goal_amount=1500000,
            years_to_goal=20,
            current_savings=300000
        )

        # Verify relevant concepts
        assert "Goal-Based Planning" in result.related_concepts
        assert "Asset Allocation" in result.related_concepts
        assert "Time Horizon" in result.related_concepts


class TestExplainPortfolioDesign(TestAIExplanationsService):
    """Test REQ-PORT-010: explain_portfolio_design method"""

    def test_design_explanation_structure(self):
        """Test portfolio design explanation structure"""
        result = self.service.explain_portfolio_design(
            self.aggressive_allocation,
            self.multiple_goals
        )

        # Verify structure
        assert isinstance(result, PortfolioExplanation)
        assert result.confidence >= 0.85
        assert len(result.answer) >= 400  # Comprehensive explanation

        # Verify sections present
        assert "growth" in result.answer.lower() or "strategy" in result.answer.lower()
        assert "stability" in result.answer.lower() or "component" in result.answer.lower()
        assert "risk" in result.answer.lower()
        assert "goal" in result.answer.lower()

    def test_multiple_goals_addressed(self):
        """Test explanation addresses multiple goals"""
        result = self.service.explain_portfolio_design(
            self.balanced_allocation,
            self.multiple_goals
        )

        # Verify goals are mentioned
        assert "retirement" in result.answer.lower()
        assert "college" in result.answer.lower() or "education" in result.answer.lower()
        assert "20 years" in result.answer  # Retirement timeline
        assert "10 years" in result.answer  # College timeline

    def test_diversification_highlighted(self):
        """Test diversification is explained"""
        result = self.service.explain_portfolio_design(
            self.aggressive_allocation,
            self.multiple_goals
        )

        # Verify diversification messaging
        assert "diversif" in result.answer.lower()
        assert "asset class" in result.answer.lower()
        assert str(len(self.aggressive_allocation)) in result.answer  # Number of asset classes

    def test_expected_return_calculated(self):
        """Test expected return is calculated and communicated"""
        result = self.service.explain_portfolio_design(
            self.balanced_allocation,
            self.multiple_goals
        )

        # Verify return metrics
        assert "return" in result.answer.lower()
        assert "%" in result.answer
        assert "volatility" in result.answer.lower()

    def test_modern_portfolio_theory_mentioned(self):
        """Test MPT is referenced"""
        result = self.service.explain_portfolio_design(
            self.aggressive_allocation,
            self.multiple_goals
        )

        # Verify MPT reference
        assert "modern portfolio theory" in result.answer.lower()
        assert "institutional" in result.answer.lower() or "historical" in result.answer.lower()

    def test_educational_notes_comprehensive(self):
        """Test educational notes are comprehensive"""
        result = self.service.explain_portfolio_design(
            self.balanced_allocation,
            self.multiple_goals
        )

        # Verify notes quality
        assert len(result.educational_notes) >= 4
        assert any("rebalanc" in note.lower() for note in result.educational_notes)
        assert any("risk" in note.lower() for note in result.educational_notes)

    def test_international_allocation_explained(self):
        """Test international allocation is explained"""
        allocation_with_intl = {
            "US_LC_BLEND": 0.40,
            "INTL_DEV_BLEND": 0.20,
            "EM_BLEND": 0.10,
            "US_TREASURY_INTER": 0.30
        }

        result = self.service.explain_portfolio_design(
            allocation_with_intl,
            self.multiple_goals
        )

        # Verify international mentioned
        assert "international" in result.answer.lower() or "geographic" in result.answer.lower()


class TestAnswerPortfolioQuestion(TestAIExplanationsService):
    """Test REQ-PORT-012: answer_portfolio_question method"""

    def test_underperformance_question(self):
        """Test answering underperformance question"""
        portfolio_context = {
            "allocation": self.balanced_allocation,
            "recent_return": -0.03
        }

        questions = [
            "Why is my portfolio underperforming?",
            "Why did I lose money last quarter?",
            "My portfolio is down, what happened?"
        ]

        for question in questions:
            result = self.service.answer_portfolio_question(
                question,
                portfolio_context
            )

            # Verify response
            assert isinstance(result, PortfolioExplanation)
            assert result.confidence >= 0.80
            assert "market" in result.answer.lower() or "performance" in result.answer.lower()
            assert "diversif" in result.answer.lower()
            assert len(result.educational_notes) >= 4

    def test_rebalancing_question(self):
        """Test answering rebalancing question"""
        portfolio_context = {
            "allocation": self.aggressive_allocation,
            "drift": 0.08
        }

        questions = [
            "Why do I need to rebalance?",
            "Should I adjust my allocation?",
            "Do I need to change my portfolio?"
        ]

        for question in questions:
            result = self.service.answer_portfolio_question(
                question,
                portfolio_context
            )

            # Verify response
            assert "rebalanc" in result.answer.lower()
            assert "risk" in result.answer.lower()
            assert "allocation" in result.answer.lower()

    def test_risk_question(self):
        """Test answering risk question"""
        portfolio_context = {
            "allocation": self.aggressive_allocation,
            "volatility": 0.18
        }

        questions = [
            "What is my portfolio's risk level?",
            "How risky is my portfolio?",
            "Is my portfolio too volatile?"
        ]

        for question in questions:
            result = self.service.answer_portfolio_question(
                question,
                portfolio_context
            )

            # Verify response
            assert "risk" in result.answer.lower()
            assert "volatility" in result.answer.lower() or "swing" in result.answer.lower()
            assert len(result.answer) >= 200

    def test_returns_question(self):
        """Test answering returns question"""
        portfolio_context = {
            "allocation": self.balanced_allocation,
            "historical_return": 0.07
        }

        questions = [
            "What returns can I expect?",
            "How much will my portfolio grow?",
            "What's my expected performance?"
        ]

        for question in questions:
            result = self.service.answer_portfolio_question(
                question,
                portfolio_context
            )

            # Verify response
            assert "return" in result.answer.lower()
            assert "%" in result.answer
            assert "stock" in result.answer.lower()
            assert "bond" in result.answer.lower()

    def test_diversification_question(self):
        """Test answering diversification question"""
        portfolio_context = {
            "allocation": self.aggressive_allocation,
            "num_assets": len(self.aggressive_allocation)
        }

        questions = [
            "How diversified is my portfolio?",
            "Am I spread out enough?",
            "Do I have good asset diversification?"
        ]

        for question in questions:
            result = self.service.answer_portfolio_question(
                question,
                portfolio_context
            )

            # Verify response
            assert "diversif" in result.answer.lower()
            assert "asset" in result.answer.lower()

    def test_generic_question_fallback(self):
        """Test generic response for unclear questions"""
        portfolio_context = {"allocation": self.balanced_allocation}

        result = self.service.answer_portfolio_question(
            "Tell me about investing",
            portfolio_context
        )

        # Verify fallback response
        assert result.confidence < 0.9  # Lower confidence
        assert "specific" in result.answer.lower()
        assert "performance" in result.answer.lower() or "risk" in result.answer.lower()


class TestHelperMethods(TestAIExplanationsService):
    """Test helper calculation methods"""

    def test_calculate_equity_percentage(self):
        """Test equity percentage calculation"""
        equity_pct = self.service._calculate_equity_percentage(self.aggressive_allocation)

        # Verify calculation (US_LC + US_MC + INTL_DEV + EM = 40+15+20+10 = 85%)
        assert abs(equity_pct - 0.85) < 0.01

    def test_calculate_bond_percentage(self):
        """Test bond percentage calculation"""
        bond_pct = self.service._calculate_bond_percentage(self.aggressive_allocation)

        # Verify calculation (TREASURY_INTER + CORP_IG = 10+5 = 15%)
        assert abs(bond_pct - 0.15) < 0.01

    def test_calculate_international_percentage(self):
        """Test international percentage calculation"""
        intl_pct = self.service._calculate_international_percentage(self.aggressive_allocation)

        # Verify calculation (INTL_DEV + EM) / total equity = (20+10) / 85 = ~35%)
        assert 0.30 < intl_pct < 0.40

    def test_equity_calculation_empty_allocation(self):
        """Test equity calculation with empty allocation"""
        equity_pct = self.service._calculate_equity_percentage({})
        assert equity_pct == 0.0

    def test_international_calculation_no_equity(self):
        """Test international calculation with no equity"""
        bond_only = {"US_TREASURY_INTER": 1.0}
        intl_pct = self.service._calculate_international_percentage(bond_only)
        assert intl_pct == 0.0  # No international when no equity


class TestExplanationQuality(TestAIExplanationsService):
    """Test overall explanation quality and consistency"""

    def test_all_explanations_have_required_fields(self):
        """Test all explanation methods return complete objects"""
        # Test explain_allocation
        result1 = self.service.explain_allocation(
            self.balanced_allocation,
            self.middle_balanced_profile
        )
        self._verify_complete_explanation(result1)

        # Test explain_investment_concept
        result2 = self.service.explain_investment_concept("diversification")
        self._verify_complete_explanation(result2)

        # Test translate_goal_to_allocation
        result3 = self.service.translate_goal_to_allocation(
            "retirement", 1000000, 20, 100000
        )
        self._verify_complete_explanation(result3)

        # Test explain_portfolio_design
        result4 = self.service.explain_portfolio_design(
            self.balanced_allocation,
            self.multiple_goals
        )
        self._verify_complete_explanation(result4)

        # Test answer_portfolio_question
        result5 = self.service.answer_portfolio_question(
            "What is my risk level?",
            {"allocation": self.balanced_allocation}
        )
        self._verify_complete_explanation(result5)

    def _verify_complete_explanation(self, explanation: PortfolioExplanation):
        """Verify explanation has all required fields"""
        assert explanation.question
        assert explanation.answer
        assert len(explanation.answer) >= 50  # Minimum substance
        assert len(explanation.educational_notes) > 0
        assert len(explanation.related_concepts) > 0
        assert 0.0 <= explanation.confidence <= 1.0

    def test_explanation_consistency(self):
        """Test explanations are consistent across calls"""
        # Same input should produce same output
        result1 = self.service.explain_investment_concept("diversification")
        result2 = self.service.explain_investment_concept("diversification")

        assert result1.answer == result2.answer
        assert result1.educational_notes == result2.educational_notes
        assert result1.related_concepts == result2.related_concepts

    def test_explanation_length_appropriate(self):
        """Test explanations have appropriate length"""
        concepts = ["diversification", "risk_tolerance", "rebalancing",
                   "expected_return", "volatility", "asset_allocation",
                   "time_horizon", "tax_efficiency"]

        for concept in concepts:
            result = self.service.explain_investment_concept(concept)

            # Verify substantial content
            assert len(result.answer) >= 150, f"{concept} explanation too short"
            assert len(result.answer) <= 2000, f"{concept} explanation too long"
            assert len(result.educational_notes) >= 3, f"{concept} needs more notes"

    def test_plain_language_quality(self):
        """Test explanations use plain language"""
        result = self.service.explain_allocation(
            self.balanced_allocation,
            self.middle_balanced_profile
        )

        # Verify plain language (avoiding excessive jargon)
        answer_lower = result.answer.lower()

        # Should use simple explanations
        assert "you" in answer_lower or "your" in answer_lower  # Personal tone
        assert len([sent for sent in result.answer.split(".") if sent]) >= 5  # Multiple sentences

        # Common terms should be explained or avoided
        technical_terms = ["sharpe", "sortino", "beta", "alpha", "skewness"]
        for term in technical_terms:
            if term in answer_lower:
                # If technical term used, should be explained
                assert len(result.answer) > 300  # Longer explanation needed


class TestEdgeCases(TestAIExplanationsService):
    """Test edge cases and error handling"""

    def test_empty_allocation(self):
        """Test handling of empty allocation"""
        result = self.service.explain_allocation(
            {},
            self.middle_balanced_profile
        )

        # Should handle gracefully
        assert isinstance(result, PortfolioExplanation)
        assert result.answer

    def test_100_percent_stocks(self):
        """Test handling of 100% stock allocation"""
        all_stocks = {"US_LC_BLEND": 1.0}

        result = self.service.explain_allocation(
            all_stocks,
            self.young_aggressive_profile
        )

        # Should handle and warn appropriately
        assert "100%" in result.answer
        assert "volatile" in result.answer.lower() or "risk" in result.answer.lower()

    def test_100_percent_bonds(self):
        """Test handling of 100% bond allocation"""
        all_bonds = {"US_TREASURY_INTER": 1.0}

        result = self.service.explain_allocation(
            all_bonds,
            self.near_retirement_profile
        )

        # Should handle conservative allocation
        assert result.answer
        assert "bond" in result.answer.lower() or "conservative" in result.answer.lower()

    def test_very_high_required_return(self):
        """Test handling of unrealistic required return"""
        result = self.service.translate_goal_to_allocation(
            goal_description="retirement",
            goal_amount=5000000,
            years_to_goal=5,
            current_savings=100000
        )

        # Should still provide guidance
        assert isinstance(result, PortfolioExplanation)
        assert result.answer
        # Might mention ambitious or challenging
        assert len(result.answer) >= 200

    def test_negative_time_horizon(self):
        """Test handling edge case of short time horizon"""
        result = self.service.translate_goal_to_allocation(
            goal_description="immediate need",
            goal_amount=50000,
            years_to_goal=1,
            current_savings=40000
        )

        # Should recommend very conservative
        assert "conservative" in result.answer.lower() or "20%" in result.answer

    def test_single_goal_design(self):
        """Test portfolio design with single goal"""
        single_goal = [self.multiple_goals[0]]

        result = self.service.explain_portfolio_design(
            self.aggressive_allocation,
            single_goal
        )

        # Should handle single goal
        assert isinstance(result, PortfolioExplanation)
        assert "retirement" in result.answer.lower()
