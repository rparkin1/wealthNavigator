"""
Life Event Simulator Service

Simulates the financial impact of major life events on retirement plans.
Compares outcomes with and without events to quantify impact.
"""

from typing import Dict, Any, List, Optional
import numpy as np
from app.models.life_event import LifeEvent, LifeEventType
from app.models.goal import Goal


class LifeEventSimulator:
    """Simulate financial impact of life events"""

    def __init__(self, monte_carlo_engine):
        self.mc_engine = monte_carlo_engine

    async def simulate_event_impact(
        self,
        goal: Goal,
        event: LifeEvent,
        iterations: int = 5000,
    ) -> Dict[str, Any]:
        """
        Simulate goal success with and without a life event.

        Args:
            goal: Base goal configuration
            event: Life event to inject into simulation
            iterations: Monte Carlo iterations

        Returns:
            Comparison of outcomes with/without event
        """

        # Run baseline simulation (no event)
        baseline_result = await self.mc_engine.run_simulation(
            goal=goal,
            iterations=iterations,
        )

        # Run simulation with event injected
        event_result = await self._simulate_with_event(
            goal=goal,
            event=event,
            iterations=iterations,
        )

        # Calculate impact metrics
        impact = self._calculate_impact(baseline_result, event_result, event)

        return {
            'event_id': event.id,
            'event_type': event.event_type,
            'baseline': {
                'success_probability': baseline_result.success_probability,
                'median_portfolio_value': baseline_result.median_portfolio_value,
            },
            'with_event': {
                'success_probability': event_result.success_probability,
                'median_portfolio_value': event_result.median_portfolio_value,
            },
            'impact': impact,
            'recovery_analysis': self._analyze_recovery(baseline_result, event_result, event),
        }

    async def _simulate_with_event(
        self,
        goal: Goal,
        event: LifeEvent,
        iterations: int,
    ) -> Any:
        """Run Monte Carlo with event injected"""

        # Create modified goal with event impacts
        modified_goal = self._inject_event_impacts(goal, event)

        # Run simulation
        return await self.mc_engine.run_simulation(
            goal=modified_goal,
            iterations=iterations,
        )

    def _inject_event_impacts(self, goal: Goal, event: LifeEvent) -> Goal:
        """
        Modify goal parameters based on event type and impacts.
        Returns a new Goal object with event adjustments.
        """
        modified_goal = goal.copy()
        params = event.financial_impact

        if event.event_type == LifeEventType.JOB_LOSS:
            # Reduce income during job search period
            severance_months = params.get('severance_months', 0)
            job_search_months = params.get('job_search_months', 6)
            total_impact_months = max(0, job_search_months - severance_months)

            # Calculate contribution pause period
            modified_goal.contribution_pause_years = total_impact_months / 12

            # Reduce future income
            new_income_pct = params.get('new_income_percentage', 0.9)
            if hasattr(modified_goal, 'annual_income'):
                modified_goal.annual_income *= new_income_pct

        elif event.event_type == LifeEventType.DISABILITY:
            replacement_rate = params.get('income_replacement_rate', 0.6)
            duration = params.get('duration', 'short_term')
            medical_expenses = params.get('medical_expenses_annual', 0)

            if duration == 'permanent':
                # Permanent income reduction
                if hasattr(modified_goal, 'annual_income'):
                    modified_goal.annual_income *= replacement_rate
            else:
                # Temporary income reduction
                duration_years = params.get('duration_months', 12) / 12
                modified_goal.contribution_pause_years = duration_years

            # Add medical expenses
            if hasattr(modified_goal, 'annual_expenses'):
                modified_goal.annual_expenses += medical_expenses

        elif event.event_type == LifeEventType.DIVORCE:
            asset_split = params.get('asset_split_percentage', 0.5)
            alimony_monthly = params.get('alimony_monthly', 0)
            alimony_years = params.get('alimony_duration_years', 0)
            legal_costs = params.get('legal_costs', 25000)

            # Reduce current assets
            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount *= (1 - asset_split)

            # Subtract legal costs
            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount -= legal_costs

            # Add alimony expenses
            if alimony_monthly > 0 and hasattr(modified_goal, 'annual_expenses'):
                modified_goal.annual_expenses += alimony_monthly * 12

        elif event.event_type == LifeEventType.INHERITANCE:
            amount = params.get('amount', 0)
            tax_rate = params.get('tax_rate', 0)
            net_amount = amount * (1 - tax_rate)

            # Add to current assets
            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount += net_amount

        elif event.event_type == LifeEventType.MAJOR_MEDICAL:
            out_of_pocket = params.get('out_of_pocket_max', 10000)
            ongoing_expenses = params.get('ongoing_expenses_annual', 5000)
            duration_years = params.get('duration_years', 5)
            income_impact = params.get('income_impact_percentage', 0.2)

            # One-time expense
            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount -= out_of_pocket

            # Ongoing expenses
            if hasattr(modified_goal, 'annual_expenses'):
                modified_goal.annual_expenses += ongoing_expenses

            # Income reduction
            if hasattr(modified_goal, 'annual_income'):
                modified_goal.annual_income *= (1 - income_impact)

        elif event.event_type == LifeEventType.HOME_PURCHASE:
            down_payment = params.get('down_payment', 0)
            closing_costs = params.get('closing_costs', 0)
            property_tax = params.get('property_tax_annual', 0)
            mortgage_payment = self._calculate_mortgage_payment(
                params.get('home_price', 0) - down_payment,
                params.get('mortgage_rate', 0.065),
                params.get('mortgage_years', 30)
            )

            # One-time costs
            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount -= (down_payment + closing_costs)

            # Ongoing costs (assume replaces rent)
            if hasattr(modified_goal, 'annual_expenses'):
                modified_goal.annual_expenses += property_tax

        elif event.event_type == LifeEventType.BUSINESS_START:
            initial_investment = params.get('initial_investment', 0)
            expected_income = params.get('expected_annual_income', 0)
            years_to_profit = params.get('years_to_profitability', 3)

            # Initial investment
            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount -= initial_investment

            # Future income (simplified - assumes success)
            # In reality, would model probabilistic outcomes
            if hasattr(modified_goal, 'annual_income'):
                modified_goal.annual_income = expected_income

        elif event.event_type == LifeEventType.CAREER_CHANGE:
            income_change = params.get('income_change_percentage', 0)
            education_costs = params.get('education_costs', 0)

            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount -= education_costs

            if hasattr(modified_goal, 'annual_income'):
                modified_goal.annual_income *= (1 + income_change)

        elif event.event_type == LifeEventType.WINDFALL:
            amount = params.get('amount', 0)
            tax_rate = params.get('tax_rate', 0.3)
            net_amount = amount * (1 - tax_rate)

            if hasattr(modified_goal, 'current_amount'):
                modified_goal.current_amount += net_amount

        return modified_goal

    def _calculate_mortgage_payment(
        self,
        principal: float,
        annual_rate: float,
        years: int
    ) -> float:
        """Calculate monthly mortgage payment"""
        monthly_rate = annual_rate / 12
        num_payments = years * 12

        if monthly_rate == 0:
            return principal / num_payments

        monthly_payment = principal * (
            monthly_rate * (1 + monthly_rate) ** num_payments
        ) / ((1 + monthly_rate) ** num_payments - 1)

        return monthly_payment * 12  # Annual payment

    def _calculate_impact(
        self,
        baseline: Any,
        with_event: Any,
        event: LifeEvent
    ) -> Dict[str, Any]:
        """Calculate impact metrics"""

        prob_delta = with_event.success_probability - baseline.success_probability
        value_delta = with_event.median_portfolio_value - baseline.median_portfolio_value

        return {
            'success_probability_delta': prob_delta,
            'success_probability_delta_percentage': (prob_delta / baseline.success_probability) * 100,
            'portfolio_value_delta': value_delta,
            'portfolio_value_delta_percentage': (value_delta / baseline.median_portfolio_value) * 100,
            'severity': self._classify_severity(prob_delta),
            'recommended_actions': self._generate_recommendations(event, prob_delta, value_delta),
        }

    def _classify_severity(self, prob_delta: float) -> str:
        """Classify event impact severity"""
        if prob_delta >= -0.05:
            return 'minimal'
        elif prob_delta >= -0.15:
            return 'moderate'
        elif prob_delta >= -0.25:
            return 'significant'
        else:
            return 'severe'

    def _generate_recommendations(
        self,
        event: LifeEvent,
        prob_delta: float,
        value_delta: float
    ) -> List[str]:
        """Generate recommended actions based on event impact"""

        recommendations = []

        if event.event_type == LifeEventType.JOB_LOSS:
            recommendations.extend([
                f"Build emergency fund to cover {event.financial_impact.get('job_search_months', 6)} months of expenses",
                "Consider income protection insurance",
                "Maintain professional network for faster job search",
            ])

        elif event.event_type == LifeEventType.DISABILITY:
            recommendations.extend([
                "Purchase disability insurance with 60-70% income replacement",
                "Build emergency fund covering 12+ months of expenses",
                "Review health insurance coverage and out-of-pocket maximums",
            ])

        elif event.event_type == LifeEventType.DIVORCE:
            recommendations.extend([
                "Increase retirement contributions to rebuild savings",
                "Consider delaying retirement by 2-3 years",
                "Review and update beneficiaries on all accounts",
            ])

        # Universal recommendations based on impact severity
        if prob_delta < -0.15:
            recommendations.append(f"Increase monthly contributions by {abs(value_delta) / 120:.0f} to offset impact")

        if prob_delta < -0.25:
            recommendations.append("Consider delaying goal target date by 2-5 years")

        return recommendations

    def _analyze_recovery(
        self,
        baseline: Any,
        with_event: Any,
        event: LifeEvent
    ) -> Dict[str, Any]:
        """Analyze recovery timeline from event"""

        # Simplified recovery analysis
        # In full implementation, would simulate recovery paths

        value_lost = baseline.median_portfolio_value - with_event.median_portfolio_value

        if value_lost <= 0:
            recovery_years = 0
        else:
            # Estimate recovery based on typical 7% portfolio growth
            annual_growth = baseline.median_portfolio_value * 0.07
            recovery_years = value_lost / annual_growth if annual_growth > 0 else 99

        return {
            'estimated_recovery_years': min(recovery_years, 99),
            'value_to_recover': value_lost,
            'recovery_feasible': recovery_years < 20,
        }
